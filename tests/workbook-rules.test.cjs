const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');

const appPath = require('node:path').join(__dirname, '..', 'js', 'app.js');
let source = fs.readFileSync(appPath, 'utf8');
source = source.replace(
  'render();\n})();',
  'window.__SiZisNurTest={seed,scoreMustahik,classifyMustahik,allocationMoney,allocationRice,assertAllocationBudget,makeAllocItems,WORKBOOK_BASELINE,createWorkbookStage,workbookStageModal,mustahikModal,metrics,flexibleMustahiks,navigateRef:navigate,dbRef:()=>db,loginRef:login,html:()=>elements.app.innerHTML,modalHtml:()=>elements["modal-root"].innerHTML};\nrender();\n})();'
);

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
const db = app.dbRef();

assert.equal(db.version, 4, 'database version must be V3 schema v4');
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

// The workbook baseline UI and all affected operational pages render without template errors.
app.loginRef('US-PTG');
for (const page of ['workbook', 'mustahik', 'allocation', 'incentives', 'reports']) {
  app.navigateRef(page);
  assert.ok(!app.html().includes('Kesalahan tampilan'), `${page} page should render`);
}
assert.ok(app.html().length > 0);
app.navigateRef('workbook');
assert.ok(app.html().includes('175.240.500'));
app.navigateRef('allocation');
assert.ok(app.html().includes('Rencana workbook disetujui'));
app.navigateRef('workbook');
assert.ok(app.html().includes('753,04'));
assert.ok(app.html().includes('row 16'));
assert.deepEqual(JSON.parse(JSON.stringify(app.WORKBOOK_BASELINE.mustahik.formulaRecalc)), { fakir: 21, miskin: 102, cukupLayak: 1, mualaf: 5, mismatchRow: 16 });
for (const uid of ['US-ADM','US-PGR','US-PTG','US-AML','US-OPR','US-BEN']) {
  app.loginRef(uid);
  app.navigateRef('workbook');
  assert.ok(!app.html().includes('Kesalahan tampilan'), `workbook page must be visible for ${uid}`);
}
app.loginRef('US-T2');
app.navigateRef('workbook');
assert.ok(!app.html().includes('Acuan Workbook Resmi'), 'tenant B must not see An-Nur workbook data');
app.loginRef('US-PTG');
app.navigateRef('mustahik');
app.mustahikModal(null);
assert.ok(app.modalHtml().includes('incomeBand'));
app.workbookStageModal(2);
assert.ok(app.modalHtml().includes('workbook-stage-allocation'));
assert.ok(app.modalHtml().includes('37.500'));
assert.ok(app.modalHtml().includes('13,04'));

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
console.log('PASS — halaman Acuan Workbook, Mustahik, Alokasi, Insentif, dan Laporan ter-render');
console.log('PASS — Tahap 1 dan Tahap 2 cocok dengan total Rp148.287.500 dan 1.882,6 kg');
console.log('PASS — saldo tahap 2 tetap terpisah dan batas persetujuan workbook tervalidasi');
