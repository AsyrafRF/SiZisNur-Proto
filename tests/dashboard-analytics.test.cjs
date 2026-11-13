const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

const appPath = path.join(__dirname, '..', 'js', 'app.js');
const revisionPath = path.join(__dirname, '..', 'js', 'revision-v5.js');
let source = fs.readFileSync(appPath, 'utf8');
source = source.replace(
  'render();\n})();',
  'window.__SiZisNurTest={navigateRef:navigate,loginRef:login,html:()=>elements.app.innerHTML};\nrender();\n})();'
);
source += '\n' + fs.readFileSync(revisionPath, 'utf8');

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.get(key) || null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}
const localStorage = new MemoryStorage();
const sessionStorage = new MemoryStorage();
const elements = { app: { innerHTML: '' }, 'modal-root': { innerHTML: '' } };
const document = {
  body: { classList: { toggle() {} } },
  getElementById(id) { return elements[id] || (elements[id] = { innerHTML: '', textContent: '', dataset: {} }); },
  addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; },
  createElement() { return { style: {}, click() {}, remove() {} }; },
};
const window = {
  localStorage, sessionStorage, crypto: crypto.webcrypto,
  addEventListener() {}, scrollTo() {}, open() { return null; },
};
const navigator = { onLine: true, userAgent: 'prototype-test' };
const context = {
  window, document, elements, localStorage, sessionStorage, navigator,
  console, Date, Math, JSON, Map, Set,
  Blob: function Blob() {}, URL: {}, FormData: function FormData() {},
  setInterval() {}, clearInterval() {}, Intl, Number, String, Object, Array,
  RegExp, Error, Promise, setTimeout() { return 0; }, clearTimeout() {},
};
vm.createContext(context);
vm.runInContext(source, context, { timeout: 5000 });

const app = window.__SiZisNurTest;
const bridge = window.__SiZisNurBridge;
const rowValue = (html, category) => {
  const match = html.match(new RegExp(`data-chart-category="${category}" data-chart-value="([^"]+)"`));
  assert.ok(match, `chart row ${category} should be rendered`);
  return Number(match[1]);
};

app.loginRef('US-PTG');
app.navigateRef('dashboard');
let html = app.html();

assert.ok(html.includes('Total uang diterima tercatat'));
assert.ok(html.includes('Total beras diterima tercatat'));
assert.ok(html.includes('Total Muzakki terdaftar'));
assert.ok(html.includes('Jiwa dibayarkan'));
assert.ok(html.includes('Zakat tersalurkan'));
assert.ok(html.includes('Status Distribusi'), 'distribution status panel should remain visible');
assert.ok(html.includes('Transaksi Terbaru'), 'latest transactions panel should remain visible');
assert.ok(!html.includes('dashboard-category-filter'), 'category dropdown should be removed');
assert.ok(html.includes('dashboard-medium-filter') && html.includes('dashboard-status-filter'));
assert.equal(rowValue(html, 'Zakat Fitrah'), 270000, 'recorded fitrah includes both verified and not-yet-reconciled records');
assert.equal(rowValue(html, 'Infak/Sedekah'), 20000);
assert.ok(html.includes('9 jiwa'), 'jiwa total includes Muzakki and dependants');
assert.ok(html.includes('Dana terverifikasi Bendahara'));
assert.ok(html.includes('200.000'), 'verified deposit totals should be shown in distribution status');

bridge.db.transactions.find((x) => x.id === 'TR-003').status = 'paid';
bridge.state.filters.dashboardStatus = 'terverifikasi';
app.navigateRef('dashboard');
html = app.html();
assert.ok(html.includes('Paid · disahkan Amil'), 'Paid is labelled as Amil authorization');
assert.equal(rowValue(html, 'Zakat Fitrah'), 180000, 'paid transactions without a verified deposit are excluded from the Treasurer-verified graph');
assert.equal(rowValue(html, 'Infak/Sedekah'), 20000);

bridge.db.deposits.find((x) => x.id === 'ST-001').status = 'kas_diterima';
app.navigateRef('dashboard');
html = app.html();
assert.equal(rowValue(html, 'Zakat Fitrah'), 0, 'a transaction no longer appears verified when its deposit minute is not reconciled');
bridge.db.deposits.find((x) => x.id === 'ST-001').status = 'terverifikasi';

bridge.state.filters.dashboardMedium = 'beras';
app.navigateRef('dashboard');
html = app.html();
assert.equal(rowValue(html, 'Zakat Fitrah'), 7.5, 'verified rice is sourced from the same reconciled deposit');

bridge.state.filters.dashboardStatus = 'tersalurkan';
bridge.state.filters.dashboardMedium = 'uang';
bridge.db.periods.find((x) => x.id === 'PR-1447').status = 'draf';
bridge.db.periods.find((x) => x.id === 'PR-1448').status = 'aktif';
app.navigateRef('dashboard');
html = app.html();
assert.equal(rowValue(html, 'Belum dipetakan'), 100000, 'legacy distribution without category detail stays unmapped');
assert.equal(rowValue(html, 'Zakat Fitrah'), 0, 'legacy distribution must not be arbitrarily attributed to fitrah');

const allocationItem = bridge.db.allocations.find((x) => x.id === 'AL-001').items.find((x) => x.mustahikId === 'MS-01');
allocationItem.categoryBreakdown = [{ category: 'Zakat Fitrah', money: 100000, rice: 0 }];
app.navigateRef('dashboard');
html = app.html();
assert.equal(rowValue(html, 'Zakat Fitrah'), 100000, 'explicit, complete category provenance can be mapped');
assert.ok(!html.includes('data-chart-category="Belum dipetakan"'), 'fully mapped distribution has no unmapped remainder');

app.loginRef('US-AML');
app.navigateRef('dashboard');
html = app.html();
assert.ok(html.includes('Alur untuk Amil'));
assert.ok(html.includes('Paid (belum terverifikasi Bendahara)'));
assert.ok(html.includes('Tutup shift'));

app.loginRef('US-BEN');
app.navigateRef('dashboard');
html = app.html();
assert.ok(html.includes('Alur untuk Bendahara'));
assert.ok(html.includes('Cocokkan mutasi rekening dan saldo logistik'));

app.loginRef('US-PGR');
app.navigateRef('dashboard');
html = app.html();
assert.ok(html.includes('Alur untuk Pengurus'));
assert.ok(html.includes('Setujui atau tolak pengajuan alokasi'));

console.log('PASS — ringkasan dashboard, sumber grafik berdasarkan status, filter uang/beras, distribusi belum dipetakan, dan alur per role tervalidasi');
