const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');

const appPath = require('node:path').join(__dirname, '..', 'js', 'app.js');
const revisionPath = require('node:path').join(__dirname, '..', 'js', 'revision-v5.js');
let source = fs.readFileSync(appPath, 'utf8');
source = source.replace(
  'render();\n})();',
  'window.__SiZisNurTest={seed,scoreMustahik,classifyMustahik,allocationMoney,allocationRice,assertAllocationBudget,makeAllocItems,WORKBOOK_BASELINE,createWorkbookStage,workbookStageModal,mustahikModal,metrics,flexibleMustahiks,navigateRef:navigate,dbRef:()=>db,loginRef:login,html:()=>elements.app.innerHTML,modalHtml:()=>elements["modal-root"].innerHTML};\nrender();\n})();'
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
  getElementById(id) { return elements[id] || (elements[id] = { innerHTML: '' }); },
  addEventListener() {},
  querySelector() { return null; },
  querySelectorAll() { return []; },
  createElement() { return { style: {}, click() {}, remove() {} }; }
};
const window = {
  localStorage, sessionStorage, crypto: crypto.webcrypto,
  addEventListener() {}, scrollTo() {}, open() { return null; }
};
const context = {
  window, document, elements, localStorage, sessionStorage,
  console, Date, Math, JSON, Map, Set, Blob: function Blob() {}, URL: {},
  FormData: function FormData() {}, setInterval() {}, clearInterval() {},
  Intl, Number, String, Object, Array, RegExp, Error, Promise, setTimeout() { return 0; }, clearTimeout() {}
};
vm.createContext(context);
vm.runInContext(source, context, { timeout: 5000 });
const app = window.__SiZisNurTest;
app.bridge = window.__SiZisNurBridge;
const db = app.dbRef();

assert.equal(db.version, 5, 'database schema must be V5');
assert.deepEqual(Array.from(app.bridge.ROLES), ['Admin', 'Muzakki', 'Operator', 'Amil', 'Bendahara', 'Relawan', 'Pengurus'], 'the revised actor matrix must contain exactly seven roles');
assert.equal(window.__SiZisNurAuditHash('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad', 'audit checksum must use SHA-256');
app.loginRef('US-PTG');
app.bridge.aud('TEST_AUDIT', 'uji integritas rantai');
assert.equal(window.__SiZisNurAuditVerify().valid, true, 'audit chain must verify after append');
const auditLatest = db.audit.find(x => x.tenantId === 'TN-ANNUR');
const auditDetail = auditLatest.detail; auditLatest.detail += ' diubah';
assert.equal(window.__SiZisNurAuditVerify().valid, false, 'audit chain must detect edited details');
auditLatest.detail = auditDetail;
assert.equal(window.__SiZisNurAuditVerify().valid, true, 'audit chain must verify after restoring original record');
assert.equal(db.mustahiks.filter(x => x.tenantId === 'TN-ANNUR').length, 129);
assert.equal(app.WORKBOOK_BASELINE.operators.reduce((n,x)=>n+x.jiwa,0), 3114);
assert.equal(app.WORKBOOK_BASELINE.operators.reduce((n,x)=>n+x.money,0), 175_240_500);
assert.equal(app.WORKBOOK_BASELINE.operators.reduce((n,x)=>n+x.blankos,0), 980);
assert.equal(app.WORKBOOK_BASELINE.receipts.riceZakat + app.WORKBOOK_BASELINE.receipts.riceInfaq, 1954.1);
assert.equal(app.WORKBOOK_BASELINE.incentives.anonymized.reduce((n,x)=>n+x.blankos,0), 980);
assert.equal(app.WORKBOOK_BASELINE.incentives.anonymized.reduce((n,x)=>n+x.days,0), 146);
const asnafCounts = Object.fromEntries(['FAKIR','MISKIN','MUALAF','CUKUP LAYAK'].map(k => [k, db.mustahiks.filter(x => (x.finalStatus || x.asnaf) === k).length]));
assert.deepEqual(asnafCounts, { FAKIR: 21, MISKIN: 103, MUALAF: 5, 'CUKUP LAYAK': 0 });

// Workbook scoring: factor weights and the 4–5 juta default branch.
assert.equal(app.scoreMustahik({ region: '', housing: 'Milik sendiri', marital: 'Menikah', incomeBand: 'NOL', dependents: 1 }), 175);
assert.equal(app.scoreMustahik({ region: 'NON RW 10', housing: 'Menumpang', marital: 'Tidak menikah', incomeBand: '<1 JUTA', dependents: 2 }), 280);
assert.equal(app.scoreMustahik({ region: 'VPA / RW 10', housing: 'Kontrakan', marital: 'Menikah', incomeBand: '4-5 JUTA', dependents: 3 }), 275);
assert.equal(app.scoreMustahik({ region: 'VPA / RW 10', housing: 'Kost', marital: 'Cerai mati', incomeBand: '>5 JUTA', dependents: '4 ATAU LEBIH' }), 400);
assert.equal(app.scoreMustahik({ region: 'VPA / RW 10', housing: 'Kost', marital: 'Cerai mati', incomeBand: '>5 JUTA', dependents: 4 }), 300, 'numeric 4 follows formula default 0; only literal 4 ATAU LEBIH receives 100');

// Formula thresholds and the Q=MUALAF final-status branch.
assert.equal(app.classifyMustahik(0, false).finalStatus, '');
assert.equal(app.classifyMustahik(240, false).finalStatus, 'CUKUP LAYAK');
assert.equal(app.classifyMustahik(241, false).finalStatus, 'MISKIN');
assert.equal(app.classifyMustahik(360, false).finalStatus, 'MISKIN');
assert.equal(app.classifyMustahik(361, false).finalStatus, 'FAKIR');
assert.equal(app.classifyMustahik(195, true).finalStatus, 'MUALAF');
assert.equal(app.classifyMustahik(300, true).finalStatus, 'MISKIN');
assert.equal(app.classifyMustahik(400, true).finalStatus, 'CUKUP LAYAK');
assert.equal(app.classifyMustahik(380, true).finalStatus, 'CUKUP LAYAK', 'row 16 formula/cache discrepancy must remain visible');

// The revised role matrix is enforced by page access and all role pages render.
app.loginRef('US-PTG');
for (const page of ['workbook', 'mustahik', 'tenant', 'users', 'periods', 'settings']) {
  app.navigateRef(page);
  assert.ok(!app.html().includes('Kesalahan tampilan'), `${page} page should render for Admin`);
}
assert.ok(app.html().length > 0);
assert.ok(app.bridge.can('mustahik'));
assert.ok(!app.bridge.can('allocation'), 'Admin does not own allocation approval or treasury actions');
app.navigateRef('workbook');
assert.ok(app.html().includes('175.240.500'));
assert.ok(app.html().includes('753,04'));
assert.ok(app.html().includes('row 16'));
assert.deepEqual(JSON.parse(JSON.stringify(app.WORKBOOK_BASELINE.mustahik.formulaRecalc)), { fakir: 21, miskin: 102, cukupLayak: 1, mualaf: 5, mismatchRow: 16 });

app.loginRef('US-BEN');
for (const page of ['workbook', 'allocation', 'incentives', 'reports', 'deposits', 'ledger', 'distribution', 'corrections', 'audit']) {
  app.navigateRef(page);
  assert.ok(!app.html().includes('Kesalahan tampilan'), `${page} page should render for Bendahara`);
}
app.navigateRef('allocation');
assert.ok(app.html().includes('Rencana alokasi'));
assert.ok(app.bridge.can('ledger'));
assert.ok(!app.bridge.can('users'));
app.workbookStageModal(2);
assert.ok(app.modalHtml().includes('workbook-stage-allocation'));
assert.ok(app.modalHtml().includes('37.500'));
assert.ok(app.modalHtml().includes('13,04'));

for (const [uid, allowed, denied] of [
  ['US-PGR', ['dashboard','workbook','allocation','reports','audit','transactions','deposits','ledger','corrections'], ['users','mustahik','settings','muzakki']],
  ['US-AML', ['dashboard','transactions','schedule','muzakki','corrections','amil-guide','help'], ['allocation','deposits','users']],
  ['US-OPR', ['dashboard','transactions','muzakki','corrections','help'], ['allocation','deposits','users','amil-guide']],
  ['US-REL', ['dashboard','distribution','help'], ['transactions','allocation','deposits']],
  ['US-MZK', ['my-zis','help'], ['dashboard','transactions','deposits','allocation']],
]) {
  app.loginRef(uid);
  for (const page of allowed) {
    app.navigateRef(page);
    assert.ok(!app.html().includes('Kesalahan tampilan'), `${uid} ${page} should render`);
    assert.ok(app.bridge.can(page), `${uid} should be permitted to ${page}`);
    if (uid === 'US-PGR' && page === 'transactions') {
      assert.ok(app.html().includes('Baca laporan'), 'Pengurus can read transaction records');
      assert.ok(!app.html().includes('data-v5-action=\"receipt-open\"'), 'Pengurus cannot open or act on a transaction receipt');
      assert.ok(!app.html().includes('data-v5-action=\"correction-new\"'), 'Pengurus cannot request transaction corrections');
    }
    if (uid === 'US-PGR' && page === 'deposits') {
      assert.ok(app.html().includes('Read-only'), 'Pengurus sees cash handovers as read-only');
      assert.ok(!app.html().includes('data-v5-action=\"deposit-create\"'), 'Pengurus cannot create a handover');
      assert.ok(!app.html().includes('data-v5-action=\"deposit-stage1-open\"'), 'Pengurus cannot reconcile physical cash');
    }
    if (uid === 'US-PGR' && page === 'corrections') {
      assert.ok(!app.html().includes('data-v5-action=\"correction-review-open\"'), 'Pengurus cannot decide a correction');
    }
  }
  for (const page of denied) assert.ok(!app.bridge.can(page), `${uid} must not be permitted to ${page}`);
}
app.loginRef('US-T2');
assert.ok(!app.bridge.can('workbook'), 'Lembaga B must not access An-Nur workbook');
app.loginRef('US-PTG');
app.mustahikModal(null);
assert.ok(app.modalHtml().includes('incomeBand'));

// Approved corrections are overlays and never mutate the original transaction totals.
app.loginRef('US-BEN');
const correctionTarget = db.transactions.find((x) => x.tenantId === 'TN-ANNUR');
if (correctionTarget) {
  const beforeCorrection = app.bridge.transactionTotals(correctionTarget);
  const savedLineItems = correctionTarget.lines.map((x) => ({ ...x }));
  db.corrections.push({ id: 'CR-TEST-OVERLAY', tenantId: correctionTarget.tenantId, transactionId: correctionTarget.id, status: 'disetujui', deltaMoney: 1234, deltaRice: 0.25 });
  const afterCorrection = app.bridge.transactionTotals(correctionTarget);
  assert.equal(afterCorrection.money, beforeCorrection.money + 1234, 'approved money correction is reflected as an overlay');
  assert.equal(afterCorrection.rice, beforeCorrection.rice + 0.25, 'approved rice correction is reflected as an overlay');
  assert.deepEqual(correctionTarget.lines.map((x) => ({ ...x })), savedLineItems, 'source transaction lines remain unchanged');
  db.corrections.pop();
}

// Flexible allocation still sees the upper-case final asnaf values.
assert.equal(app.flexibleMustahiks().length, 129, 'the legacy sample allocation belongs to the draft 1448 period');
const flexible = app.makeAllocItems(10_000_000, 1_000, 1);
assert.equal(flexible.length, 129);
assert.ok(flexible.some(x => x.money > 0));

// Exact two-stage workbook allocation and approval limits.
app.createWorkbookStage(1, 'Tahap 1 Test', 'uji');
app.createWorkbookStage(2, 'Tahap 2 Test', 'uji');
const plans = db.allocations.filter(x => x.source === 'workbook-1447');
const stage1 = plans.find(x => x.stage === 1);
const stage2 = plans.find(x => x.stage === 2);
assert.equal(app.allocationMoney(stage1), 71_900_000);
assert.equal(app.allocationRice(stage1), 685);
assert.equal(app.allocationMoney(stage2), 76_387_500);
assert.equal(app.allocationRice(stage2), 1_197.6);
assert.equal(stage2.balanceMoney, 37_500);
assert.equal(stage2.balanceRicePackages, 13.04);
app.assertAllocationBudget(stage1);
stage1.status = 'disetujui';
app.assertAllocationBudget(stage2);
stage2.status = 'disetujui';
assert.equal(app.allocationMoney(stage1) + app.allocationMoney(stage2), 148_287_500);
assert.equal(app.allocationRice(stage1) + app.allocationRice(stage2), 1_882.6);
assert.equal(app.metrics().allocatedWorkbook, 148_287_500);
assert.equal(app.metrics().allocatedLedger, 0);
assert.equal(app.flexibleMustahiks().length, 0, 'workbook recipients are reserved from flexible allocation after approval');
assert.throws(() => app.createWorkbookStage(1, 'Duplikat', 'uji'), /sudah ada/);

console.log('PASS — seed 129 mustahik sintetis (21/103/5)');
console.log('PASS — skor, ambang klasifikasi, dan jalur Mualaf mengikuti formula workbook');
console.log('PASS — matriks tujuh role, pembatasan Pengurus read-only dan halaman operasional ter-render');
console.log('PASS — koreksi terkendali menjadi overlay tanpa menimpa transaksi sumber');
console.log('PASS — Tahap 1 dan Tahap 2 cocok dengan total Rp148.287.500 dan 1.882,6 kg');
console.log('PASS — saldo tahap 2 tetap terpisah dan batas persetujuan workbook tervalidasi');
