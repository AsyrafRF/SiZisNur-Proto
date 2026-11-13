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
const window = { localStorage, sessionStorage, crypto: crypto.webcrypto, addEventListener() {}, scrollTo() {}, open() { return null; } };
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
app.loginRef('US-MZK');
let html = app.html();

assert.equal(bridge.state.page, 'my-zis', 'Muzakki login must land on the personal dashboard');
assert.ok(bridge.can('my-zis'));
assert.ok(!bridge.can('dashboard'), 'the aggregate committee dashboard is not accessible to Muzakki');
assert.ok(html.includes('Dashboard Zakat Saya'));
assert.ok(html.includes('Status zakat periode ini'));
assert.ok(html.includes('Sudah terverifikasi'), 'verification state is derived from a verified Treasurer handover');
assert.ok(html.includes('Terverifikasi Bendahara'));
assert.ok(html.includes('Zakat Fitrah'));
assert.ok(html.includes('Infak/Sedekah'));
assert.ok(html.includes('180.000'), 'the personal amount includes only the signed-in Muzakki transaction');
assert.ok(!html.includes('90.000'), 'other Muzakki payment amounts are not exposed');
assert.ok(!html.includes('TR-002') && !html.includes('TR-003'), 'other Muzakki transactions must not appear');
assert.ok(!html.includes('Status Distribusi'), 'Muzakki must not see the aggregate distribution panel');
assert.ok(!html.includes('Transaksi Terbaru'), 'Muzakki must not see the committee-wide recent transactions panel');
assert.ok(!html.includes('Total Muzakki terdaftar'), 'Muzakki must not see aggregate committee metrics');

// Even a stale/direct navigation attempt must not render the committee dashboard.
app.navigateRef('dashboard');
assert.equal(bridge.can('dashboard'), false);
assert.ok(!app.html().includes('Status Distribusi'));

// A previous-period transaction linked by tenant + person remains visible as personal history.
bridge.db.periods.push({ id: 'PR-1446', tenantId: 'TN-ANNUR', name: 'Ramadan 1446 H', status: 'selesai' });
bridge.db.transactions.push({
  id: 'TR-MZK-OLD', tenantId: 'TN-ANNUR', periodId: 'PR-1446', serial: 'OLD-0001',
  personId: 'PS-01', jiwa: 3, lines: [{ category: 'Zakat Maal', type: 'uang', value: 250000 }],
  status: 'paid', createdAt: '2025-03-10T09:00:00Z', note: 'Riwayat pribadi',
});
app.navigateRef('my-zis');
html = app.html();
assert.ok(html.includes('Riwayat zakat sebelumnya'));
assert.ok(html.includes('Ramadan 1446 H'));
assert.ok(html.includes('Zakat Maal'));
assert.ok(html.includes('OLD-0001'));
assert.ok(html.includes('Disahkan Amil · menunggu Bendahara'), 'Paid is clearly distinguished from Treasurer verification');

// Treasurer verification is only shown when a verified deposit lists this transaction.
bridge.db.deposits.find((x) => x.id === 'ST-001').status = 'kas_diterima';
app.navigateRef('my-zis');
html = app.html();
assert.ok(html.includes('Belum terverifikasi'));
assert.ok(html.includes('Kas diterima · menunggu rekening'));
bridge.db.deposits.find((x) => x.id === 'ST-001').status = 'terverifikasi';

const pageAccess = fs.readFileSync(revisionPath, 'utf8');
assert.ok(pageAccess.includes("dashboard: roles.filter((role) => role !== 'Muzakki')"));
const shell = fs.readFileSync(appPath, 'utf8');
assert.ok(shell.includes("(u.role==='Muzakki'&&can('my-zis'))?'my-zis':'dashboard'"), 'stale session fallback should route Muzakki to the personal dashboard');

console.log('PASS — dashboard Muzakki personal-only, status verifikasi berbasis berita acara Bendahara, riwayat lintas periode, dan pembatasan data pribadi tervalidasi');
