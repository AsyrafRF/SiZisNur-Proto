const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

const root = path.join(__dirname, '..');
let source = fs.readFileSync(path.join(root, 'js', 'app.js'), 'utf8').replace(/\r\n/g, '\n');
source = source.replace(
  'render();\n})();',
  'window.__SiZisNurTest={html:()=>elements.app.innerHTML};\nrender();\nwindow.__SiZisNurBridge.db = window.__SiZisNurBridge.seedMultiTenant();\nwindow.__SiZisNurBridge.persist();\n})();'
);
source += '\n' + fs.readFileSync(path.join(root, 'js', 'revision-v5.js'), 'utf8');

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
  addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; },
  createElement() { return { style: {}, click() {}, remove() {} }; },
};
const window = { localStorage, sessionStorage, crypto: crypto.webcrypto, addEventListener() {}, scrollTo() {}, open() { return null; } };
const context = {
  window, document, elements, localStorage, sessionStorage, console, Date, Math, JSON, Map, Set,
  Blob: function Blob() {}, URL: {}, FormData: function FormData() {}, setInterval() {}, clearInterval() {},
  Intl, Number, String, Object, Array, RegExp, Error, Promise, setTimeout() { return 0; }, clearTimeout() {},
};
vm.createContext(context);
vm.runInContext(source, context, { timeout: 5000 });

const db = window.__SiZisNurBridge.db;
const annurRules = db.rules.find((x) => x.tenantId === 'TN-ANNUR');
const alhikmahRules = db.rules.find((x) => x.tenantId === 'TN-ALHIKMAH');
assert.equal(annurRules.moneyRate, 45000, 'existing lembaga fitrah rate is retained');
assert.equal(alhikmahRules.moneyRate, 50000, 'other lembaga keeps its own fitrah rate');
assert.notEqual(annurRules, alhikmahRules, 'tariff settings are scoped per lembaga');
assert.equal(annurRules.fidyahRate, 65000);
assert.equal(annurRules.professionNisabMonthly, 7640144);

const calculate = window.__SIZISNUR_CALCULATE_ZAKAT;
const makePayment = window.__SIZISNUR_TRANSACTION_PAYMENT;
const formFields = window.__SIZISNUR_TRANSACTION_FORM_FIELDS;
assert.equal(typeof calculate, 'function', 'shared calculation engine should be available');
assert.equal(typeof makePayment, 'function', 'transaction payment splitter should be available');

const transactionPolicy = window.__SIZISNUR_TRANSACTION_POLICY
assert.equal(transactionPolicy.ttlMs, 2 * 60 * 60 * 1000, 'all transaction channels must use a two-hour verification window')
assert.equal(transactionPolicy.expiresAt('2026-11-23T07:00:00.000Z'), '2026-11-23T09:00:00.000Z', 'expiry is measured from the transaction creation timestamp')
const legacyPending = { status: 'pending', createdAt: '2026-11-23T07:00:00.000Z', expiresAt: '2026-11-24T07:00:00.000Z' }
assert.equal(transactionPolicy.normalizePendingExpiry(legacyPending), true, 'legacy pending records should be normalized')
assert.equal(legacyPending.expiresAt, '2026-11-23T09:00:00.000Z', 'legacy 24-hour expiry is replaced with the original creation time plus two hours')
assert.equal(transactionPolicy.isExpired(legacyPending, Date.parse('2026-11-23T09:00:00.000Z')), true, 'the exact deadline is expired and cannot be verified')
const legacyWithoutTimestamp = { status: 'pending' }
transactionPolicy.normalizePendingExpiry(legacyWithoutTimestamp)
assert.equal(legacyWithoutTimestamp.expiresAt, '1970-01-01T00:00:00.000Z', 'missing creation and expiry timestamps remain immediately expired')

const rules = {
  moneyRate: 45000,
  riceRate: 2.5,
  nisabGoldGram: 85,
  goldPricePerGram: 1078608.56,
  professionNisabMonthly: 7640144,
  zakatRate: 2.5,
  fidyahRate: 65000,
  kafaratMealRate: 30000,
};

// Fitrah: lembaga rates are used for both money and rice.
const fitrahMoney = calculate('Zakat Fitrah', 'uang', 4, 0, 'no', 'yamin', rules);
assert.equal(fitrahMoney.due, 180000);
const fitrahRice = calculate('Zakat Fitrah', 'beras', 4, 0, 'no', 'yamin', rules);
assert.equal(fitrahRice.due, 10);
assert.equal(fitrahRice.type, 'beras');

// Maal: must meet 85g-gold nisab and haul before 2.5% is applied.
const annualNisab = 85 * rules.goldPricePerGram;
const maalWithoutHaul = calculate('Zakat Maal', 'uang', 1, annualNisab, 'no', 'yamin', rules);
assert.equal(maalWithoutHaul.due, 0);
const maalEligible = calculate('Zakat Maal', 'uang', 1, annualNisab, 'yes', 'yamin', rules);
assert.equal(maalEligible.due, annualNisab * 0.025);

// Profession: monthly income nisab is annual gold nisab divided by 12.
const monthlyNisab = rules.professionNisabMonthly;
const professionBelow = calculate('Zakat Profesi', 'uang', 1, monthlyNisab - 1, 'no', 'yamin', rules);
assert.equal(professionBelow.due, 0);
const professionEligible = calculate('Zakat Profesi', 'uang', 1, monthlyNisab, 'no', 'yamin', rules);
assert.equal(professionEligible.due, monthlyNisab * 0.025);
const professionAnnual = calculate('Zakat Profesi', 'uang', 1, monthlyNisab * 12, 'no', 'yamin', rules, { professionPeriod: 'annual' });
assert.equal(professionAnnual.due, monthlyNisab * 12 * 0.025);

// Fidyah is counted by missed fasting days and uses the lembaga's daily rate.
const fidyah = calculate('Fidyah', 'uang', 3, 0, 'no', 'yamin', rules);
assert.equal(fidyah.due, 195000);
assert.equal(fidyah.splitExcessEligible, false);

// Kafarat depends on the case; meal rates are configurable per lembaga.
const oathKafarat = calculate('Kafarat', 'uang', 1, 0, 'no', 'yamin', rules);
assert.equal(oathKafarat.meals, 10);
assert.equal(oathKafarat.due, 300000);
const fastingKafaratUnconfirmed = calculate('Kafarat', 'uang', 2, 0, 'no', 'puasa', rules);
assert.equal(fastingKafaratUnconfirmed.meals, 0, '60-person feeding option requires confirmation of inability at prior stages');
assert.equal(fastingKafaratUnconfirmed.due, 0);
assert.match(fastingKafaratUnconfirmed.note, /tidak mampu/);
const fastingKafarat = calculate('Kafarat', 'uang', 2, 0, 'no', 'puasa', rules, { kafaratFeedingConfirmed: 'yes' });
assert.equal(fastingKafarat.meals, 120);
assert.equal(fastingKafarat.due, 3600000);
assert.equal(fastingKafarat.splitExcessEligible, false);
const unconfiguredKafarat = calculate('Kafarat', 'uang', 1, 0, 'no', 'yamin', { ...rules, kafaratMealRate: 0 });
assert.equal(unconfiguredKafarat.due, 0);
assert.match(unconfiguredKafarat.note, /belum diatur/);

// Excess is retained as zakat unless the user opted in; opting in splits it to infak/sedekah.
const uncheckedExcess = makePayment({ category: 'Zakat Fitrah', type: 'uang', jiwa: '1', value: '50.000' }, rules);
assert.equal(uncheckedExcess.lines.length, 1);
assert.equal(uncheckedExcess.lines[0].value, 50000);
assert.equal(uncheckedExcess.excessAllocated, 0);
const checkedExcess = makePayment({ category: 'Zakat Fitrah', type: 'uang', jiwa: '1', value: '50.000', autoExcess: 'yes' }, rules);
assert.equal(checkedExcess.lines.length, 2);
assert.deepEqual(JSON.parse(JSON.stringify(checkedExcess.lines)), [
  { category: 'Zakat Fitrah', type: 'uang', value: 45000, quantity: 1, unitLabel: 'jiwa', assetsValue: 0 },
  { category: 'Infak/Sedekah', type: 'uang', value: 5000, quantity: null, unitLabel: '' },
]);
assert.equal(checkedExcess.excessAllocated, 5000);
const noFidyahSplit = makePayment({ category: 'Fidyah', jiwa: '1', value: '70.000', autoExcess: 'yes' }, rules);
assert.equal(noFidyahSplit.lines.length, 1, 'fidyah is not automatically reclassified as infak');
assert.equal(noFidyahSplit.lines[0].value, 70000);
assert.equal(noFidyahSplit.estimate.excess, 5000, 'non-splittable excess is still visible in the calculation result');


// One unified transaction may contain multiple categories and both fitrah payment media.
const mixedPayment = makePayment({
  'lines[0][category]': 'Zakat Fitrah', 'lines[0][type]': 'uang', 'lines[0][jiwa]': '2', 'lines[0][value]': '90.000',
  'lines[1][category]': 'Zakat Fitrah', 'lines[1][type]': 'beras', 'lines[1][jiwa]': '1', 'lines[1][value]': '2,5',
  'lines[2][category]': 'Fidyah', 'lines[2][type]': 'uang', 'lines[2][jiwa]': '2', 'lines[2][value]': '130.000',
  'lines[3][category]': 'Zakat Maal', 'lines[3][type]': 'uang', 'lines[3][jiwa]': '1', 'lines[3][assetsValue]': '100.000.000', 'lines[3][haulComplete]': 'yes', 'lines[3][value]': '2.500.000',
}, rules);
assert.equal(mixedPayment.lines.length, 4);
assert.equal(mixedPayment.paidMoney, 2720000, 'dot-grouped IDR strings parse into numeric totals');
assert.equal(mixedPayment.paidRice, 2.5, 'decimal comma is accepted for rice kilograms');
assert.equal(mixedPayment.estimate.dueMoney, 2720000, 'Fitrah and Maal liabilities are combined without merging their detail rows');
assert.equal(mixedPayment.estimate.dueRice, 2.5);
assert.equal(mixedPayment.jiwa, 3, 'fitrah headcount aggregates across money and rice line items');
assert.deepEqual(JSON.parse(JSON.stringify(mixedPayment.lines.map((row) => [row.category, row.type, row.value, row.quantity, row.unitLabel]))), [
  ['Zakat Fitrah', 'uang', 90000, 2, 'jiwa'],
  ['Zakat Fitrah', 'beras', 2.5, 1, 'jiwa'],
  ['Fidyah', 'uang', 130000, 2, 'hari'],
  ['Zakat Maal', 'uang', 2500000, 1, 'perhitungan harta'],
]);
assert.deepEqual(JSON.parse(JSON.stringify(mixedPayment.breakdown.map((row) => [row.category, row.type, row.quantity]))), [
  ['Zakat Fitrah', 'uang', 2], ['Zakat Fitrah', 'beras', 1], ['Fidyah', 'uang', 2], ['Zakat Maal', 'uang', 1],
]);

// Dot-grouped asset values are parsed consistently for maal/annual income calculations.
const mixedMaal = makePayment({
  'lines[0][category]': 'Zakat Maal', 'lines[0][type]': 'uang', 'lines[0][jiwa]': '1',
  'lines[0][assetsValue]': '10.000.000', 'lines[0][haulComplete]': 'yes', 'lines[0][value]': '250.000',
}, { ...rules, goldPricePerGram: 100000 });
assert.equal(mixedMaal.estimate.dueMoney, 250000);

// The same field builder is used by Muzakki self-service and Operator/Amil counter forms.
for (const prefix of ['self', 'operator']) {
  const html = formFields(prefix, 2, '90.000');
  assert.match(html, /name="lines\[0\]\[category\]"/);
  assert.match(html, /name="lines\[0\]\[assetsValue\]"/);
  assert.match(html, /name="lines\[0\]\[haulComplete\]"/);
  assert.match(html, /name="lines\[0\]\[kafaratType\]"/);
  assert.match(html, /name="lines\[0\]\[kafaratFeedingConfirmed\]"/);
  assert.match(html, /name="lines\[0\]\[professionPeriod\]"/);
  assert.match(html, /name="lines\[0\]\[autoExcess\]"/);
  assert.match(html, /data-format="idr"/);
  assert.match(html, /type="text" inputmode="numeric" data-format="idr"/, 'currency input must use a text field so grouped dots remain visible');
  assert.match(html, /Tambah jenis zakat \/ media/);
  assert.match(html, /Zakat Profesi/);
}

const appSource = fs.readFileSync(path.join(root, 'js', 'revision-v5.js'), 'utf8');
assert.match(appSource, /function maybeConfirmExcess/);
assert.match(appSource, /function openSelfTransaction\(\)[\s\S]*?transactionCalculatorFields\('self'/);
assert.match(appSource, /function openOperatorTransactionModal\(\)[\s\S]*?transactionCalculatorFields\('operator'/);
assert.match(appSource, /__SIZISNUR_OPEN_OPERATOR_TRANSACTION/);
assert.match(appSource, /function receiptMarkupV5\(tx\)/);
assert.match(appSource, /line\.unitLabel/);
assert.match(appSource, /function formatInputValue\(input\)/);
assert.equal((appSource.match(/delete parentForm\.dataset\.excessDecision/g) || []).length, 2, 'editing any shared transaction field must invalidate a previous excess-confirmation choice and require re-confirmation');
const coreSource = fs.readFileSync(path.join(root, 'js', 'app.js'), 'utf8');
assert.match(coreSource, /data-format=\\?"idr\\?"/);
assert.match(coreSource, /replace\(/);
assert.match(coreSource, /__SIZISNUR_OPEN_OPERATOR_TRANSACTION/);
const publicSource = fs.readFileSync(path.join(root, 'js', 'public-intake.js'), 'utf8');
assert.match(publicSource, /__SIZISNUR_TRANSACTION_FORM_FIELDS\('public'/);
assert.match(publicSource, /__SIZISNUR_MAY_CONFIRM_TRANSACTION_EXCESS/);
assert.match(appSource, /Satu atau beberapa rincian melebihi estimasi kewajiban/);
assert.match(appSource, /Ya, pisahkan kelebihannya menjadi infak\/sedekah/);
assert.match(appSource, /data-excess-action="accept"/);
assert.match(appSource, /Total kewajiban dalam uang/);
assert.match(appSource, /Total pembayaran beras/);
assert.match(appSource, /__SIZISNUR_MAY_CONFIRM_TRANSACTION_EXCESS/);
assert.match(appSource, /Satu transaksi, beberapa jenis pembayaran/);
assert.match(appSource, /data-format=\"idr\"/);
assert.match(publicSource, /Lembaga/);

// Counter entry opens the exact same multi-line calculator used by Muzakki and public intake.
const bridge = window.__SiZisNurBridge;
assert.match(bridge.fld('Nominal uji', 'sampleMoney', 1234567890, 'text', 'inputmode="numeric" data-format="idr"'), /value="1\.234\.567\.890"/);
bridge.login('US-OPR');
window.__SIZISNUR_OPEN_OPERATOR_TRANSACTION();
const operatorModal = elements['modal-root'].innerHTML;
assert.match(operatorModal, /data-shared-transaction=\"yes\"/);
assert.match(operatorModal, /name="lines\[0\]\[category\]"/);
assert.match(operatorModal, /name=\"domicileStatus\"/);
assert.match(operatorModal, /name=\"rwId\"/);
assert.match(operatorModal, /name=\"rtId\"/);
assert.match(operatorModal, /Satu transaksi, beberapa jenis pembayaran/);
assert.match(operatorModal, /<option value=\"warga_daerah\" selected/, 'new counter identities default to local area when Master Wilayah is configured');
assert.match(operatorModal, /name=\"rwId\"/);
assert.match(operatorModal, /name=\"rtId\"/);
const nonArea = window.__SIZISNUR_SAVE_DOMICILE({}, { domicileStatus: 'non_daerah' }, 'TN-ANNUR');
assert.equal(nonArea.rwId, null, 'Non-daerah identities do not store an institution RW');
assert.equal(nonArea.rtId, null, 'Non-daerah identities do not store an institution RT');
const localFields = window.__SIZISNUR_DOMICILE_FIELDS(null, 'TN-ANNUR');
assert.match(localFields, /<option value=\"warga_daerah\" selected/);
assert.match(localFields, /name=\"rwId\"/);
assert.match(localFields, /name=\"rtId\"/);
assert.match(appSource, /new Intl\.NumberFormat\('id-ID', \{ maximumFractionDigits: 0 \}\)\.format/, 'IDR formatter must group thousands with Indonesian separators');
const formatted = { dataset: { format: 'idr' }, value: '1234567890' };
window.__SIZISNUR_FORMAT_INPUT_VALUE(formatted);
assert.equal(formatted.value, '1.234.567.890', 'nominal uang uses a dot for every three digits');
const formattedAssets = { dataset: { format: 'idr' }, value: '100000000' };
window.__SIZISNUR_FORMAT_INPUT_VALUE(formattedAssets);
assert.equal(formattedAssets.value, '100.000.000', 'harta Maal/Profesi uses the same Rupiah grouping');
const formattedRice = { dataset: { format: 'kg' }, value: '2.5' };
window.__SIZISNUR_FORMAT_INPUT_VALUE(formattedRice);
assert.equal(formattedRice.value, '2,5', 'beras uses an Indonesian decimal comma rather than a Rupiah thousands separator');
assert.match(appSource, /Satu atau beberapa rincian melebihi estimasi kewajiban/, 'same excess confirmation is used by all transaction channels');

console.log('transaction-calculator.test.cjs: all assertions passed');
