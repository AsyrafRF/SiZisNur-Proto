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
const listeners = {};
class MockFormData {
  constructor(form) { this.values = Object.entries(form.data || {}); }
  entries() { return this.values; }
}
const document = {
  body: { classList: { toggle() {} } },
  getElementById(id) { return elements[id] || (elements[id] = { innerHTML: '', textContent: '', dataset: {} }); },
  addEventListener(type, listener) { (listeners[type] ||= []).push(listener); }, querySelector() { return null; }, querySelectorAll() { return []; },
  createElement() { return { style: {}, click() {}, remove() {} }; },
};
const window = { localStorage, sessionStorage, crypto: crypto.webcrypto, addEventListener() {}, scrollTo() {}, open() { return null; } };
const navigator = { onLine: true, userAgent: 'prototype-test' };
const context = {
  window, document, elements, localStorage, sessionStorage, navigator,
  console, Date, Math, JSON, Map, Set,
  Blob: function Blob() {}, URL: {}, FormData: MockFormData,
  setInterval() {}, clearInterval() {}, Intl, Number, String, Object, Array,
  RegExp, Error, Promise, setTimeout() { return 0; }, clearTimeout() {},
};
vm.createContext(context);
vm.runInContext(source, context, { timeout: 5000 });

const app = window.__SiZisNurTest;
const bridge = window.__SiZisNurBridge;

function fireV5Action(action, id = '') {
  const button = { dataset: { v5Action: action, id } };
  const event = { target: { closest(selector) { return selector === '[data-v5-action]' ? button : null; } } };
  (listeners.click || []).forEach((listener) => listener(event));
}
function submitV5Form(type, id, data) {
  const form = { dataset: { v5Form: type, id }, data };
  const event = {
    target: { closest(selector) { return selector === 'form[data-v5-form]' ? form : null; } },
    preventDefault() {},
  };
  (listeners.submit || []).forEach((listener) => listener(event));
}

app.loginRef('US-MZK');
let html = app.html();

assert.equal(bridge.state.page, 'my-zis', 'Muzakki login must land on the personal dashboard');
assert.ok(bridge.can('my-zis'));
assert.ok(!bridge.can('dashboard'), 'the aggregate committee dashboard is not accessible to Muzakki');
assert.ok(html.includes('Dashboard Zakat Saya'));
assert.ok(html.includes('Menu Akun Muzakki'));
assert.ok(html.includes('data-page="my-zis"'));
assert.ok(html.includes('data-page="muzakki-services"'));
assert.ok(html.includes('data-page="pay-plan"'));
assert.ok(!html.includes('Layanan mandiri: profil, keluarga, dan kalkulator zakat'), 'dashboard must no longer contain the expandable account tools panel');
assert.ok(!html.includes('<details'), 'dashboard must not stack the account tools as a dropdown');
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

// Current-period proof access must work independently of whether the transaction
// was downloaded on its first creation. Cancellation is limited to unprocessed
// self-service Pending transactions and preserves a traceable cancelled record.
const muzAccount = bridge.db.accounts.find((item) => item.userId === 'US-MZK');
const muzMembership = bridge.db.muzakkiMemberships.find((item) => item.userId === 'US-MZK' && item.tenantId === 'TN-ANNUR');
assert.ok(muzAccount && muzMembership, 'demo Muzakki has an account and membership');
const pendingSelfTx = {
  id: 'TR-MZK-PENDING-CANCEL', tenantId: 'TN-ANNUR', periodId: 'PR-1447', serial: 'MS-TEST-0001',
  personId: muzMembership.personId, accountId: muzAccount.id, accountUserId: 'US-MZK',
  source: 'self-service', jiwa: 2,
  lines: [{ category: 'Zakat Fitrah', type: 'uang', value: 90000 }],
  status: 'pending', createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  handledBy: null, operatorId: null, assignedAmilId: null,
};
bridge.db.transactions.push(pendingSelfTx);
app.navigateRef('my-zis');
html = app.html();
assert.ok(html.includes('Lihat bukti / QR'), 'current-period table exposes receipt actions');
assert.ok(html.includes('data-v5-action="receipt-open" data-id="TR-MZK-PENDING-CANCEL"'), 'receipt action points to the exact current-period transaction');
assert.ok(html.includes('data-v5-action="self-tx-cancel-open" data-id="TR-MZK-PENDING-CANCEL"'), 'unprocessed Pending transaction shows a cancel action');

fireV5Action('receipt-open', pendingSelfTx.id);
assert.ok(bridge.state.modal?.body.includes('SIZISNUR|TN-ANNUR|TR-MZK-PENDING-CANCEL|MS-TEST-0001'), 'receipt can restore the QR/token after the initial creation screen is gone');
bridge.state.modal = null;
fireV5Action('self-tx-cancel-open', pendingSelfTx.id);
assert.ok(bridge.state.modal?.body.includes('Alasan pembatalan (wajib)'));
assert.ok(bridge.state.modal?.body.includes('QR lama langsung tidak berlaku'));
submitV5Form('self-transaction-cancel', pendingSelfTx.id, { reason: 'Salah memilih nominal', confirmCancel: 'yes' });
assert.equal(pendingSelfTx.status, 'batal', 'cancellation changes status instead of deleting the transaction');
assert.equal(pendingSelfTx.cancelReason, 'Salah memilih nominal');
assert.ok(pendingSelfTx.cancelledAt && pendingSelfTx.cancelledBy === 'US-MZK');
assert.ok(bridge.db.audit.some((item) => item.type === 'MUZAKKI_TRANSACTION_CANCELLED' && item.detail.includes(pendingSelfTx.serial)), 'cancellation is recorded in audit history');
html = app.html();
assert.ok(html.includes('Transaksi tidak aktif periode ini'), 'cancelled transactions remain visible in an inactive-period list');
assert.ok(html.includes('QR tidak aktif'), 'cancelled transaction is marked as non-scannable');
assert.ok(!html.includes('data-v5-action="self-tx-cancel-open" data-id="TR-MZK-PENDING-CANCEL"'), 'cancelled transaction cannot be cancelled twice');
fireV5Action('receipt-open', pendingSelfTx.id);
assert.ok(bridge.state.modal?.body.includes('QR tidak aktif dan tidak dapat dipindai'), 'a cancelled transaction record never presents a usable-looking QR');
assert.ok(!bridge.state.modal?.body.includes('SIZISNUR|TN-ANNUR|TR-MZK-PENDING-CANCEL|MS-TEST-0001'), 'cancelled receipt hides the expired QR token');
bridge.state.modal = null;

const committeePendingTx = {
  ...pendingSelfTx, id: 'TR-MZK-COMMITTEE-PENDING', serial: 'MS-TEST-0002', status: 'pending',
  cancelledAt: null, cancelledBy: null, cancelReason: null, handledBy: 'US-AML', shiftId: 'SH-TEST',
};
const paidSelfTx = {
  ...pendingSelfTx, id: 'TR-MZK-PAID', serial: 'MS-TEST-0003', status: 'paid',
  cancelledAt: null, cancelledBy: null, cancelReason: null, handledBy: 'US-AML', verifiedBy: 'US-AML',
};
bridge.db.transactions.push(committeePendingTx, paidSelfTx);
app.navigateRef('my-zis');
html = app.html();
assert.ok(html.includes('data-v5-action="receipt-open" data-id="TR-MZK-COMMITTEE-PENDING"'), 'proof remains accessible when cancellation is not');
assert.ok(!html.includes('data-v5-action="self-tx-cancel-open" data-id="TR-MZK-COMMITTEE-PENDING"'), 'transaction already touched by Amil/committee cannot be cancelled by Muzakki');
assert.ok(!html.includes('data-v5-action="self-tx-cancel-open" data-id="TR-MZK-PAID"'), 'Paid transaction cannot be cancelled by Muzakki');
bridge.db.transactions = bridge.db.transactions.filter((item) => !['TR-MZK-COMMITTEE-PENDING', 'TR-MZK-PAID'].includes(item.id));

// Profile, family and calculator tools live on their own page.
app.navigateRef('muzakki-services');
html = app.html();
assert.equal(bridge.state.page, 'muzakki-services');
assert.ok(html.includes('Layanan Mandiri'));
assert.ok(html.includes('Profil dan wilayah alamat'));
assert.ok(html.includes('Data keluarga tanggungan'));
assert.ok(html.includes('Kalkulator zakat'));
assert.ok(html.includes('data-v5-form="self-profile"'));
assert.ok(html.includes('data-v5-form="family-save"'));
assert.ok(html.includes('data-v5-form="zakat-calc"'));
assert.ok(!html.includes('<details'), 'the dedicated services page must render its content expanded, not as a dropdown');

// Payment planning is a separate destination while it reuses the established QR transaction flow.
const savedTransactions = bridge.db.transactions;
bridge.db.transactions = savedTransactions.filter((tx) => !(tx.tenantId === 'TN-ANNUR' && tx.periodId === 'PR-1447' && tx.personId === 'PS-01'));
app.navigateRef('pay-plan');
html = app.html();
assert.equal(bridge.state.page, 'pay-plan');
assert.ok(html.includes('Rencana Bayar Zakat'));
assert.ok(html.includes('Langkah pembayaran'));
assert.ok(html.includes('data-v5-action="self-tx-new"'), 'the dedicated page launches the existing payment-plan modal when no transaction exists yet');
assert.ok(html.includes('Pending'));
assert.ok(bridge.can('pay-plan') && bridge.can('muzakki-services'));
bridge.db.transactions = savedTransactions;
app.navigateRef('pay-plan');
html = app.html();
assert.ok(html.includes('Rencana periode ini sudah dibuat'), 'the page prevents duplicate planning for an existing period transaction');

// Non-Muzakki roles must not gain access to either new page.
bridge.login('US-ADM', false);
assert.ok(!bridge.can('pay-plan'));
assert.ok(!bridge.can('muzakki-services'));
bridge.login('US-MZK', false);
html = app.html();

// Even a stale/direct navigation attempt must not render the committee dashboard.
app.navigateRef('dashboard');
assert.equal(bridge.can('dashboard'), false);
assert.ok(!app.html().includes('Status Distribusi'));

// A previous-period transaction linked by lembaga + person remains visible as personal history.
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
