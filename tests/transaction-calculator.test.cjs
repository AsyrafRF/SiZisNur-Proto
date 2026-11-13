const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

const root = path.join(__dirname, '..');
let source = fs.readFileSync(path.join(root, 'js', 'app.js'), 'utf8');
source = source.replace(
  'render();\n})();',
  'window.__SiZisNurTest={html:()=>elements.app.innerHTML};\nrender();\n})();'
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
  { category: 'Zakat Fitrah', type: 'uang', value: 45000 },
  { category: 'Infak/Sedekah', type: 'uang', value: 5000 },
]);
assert.equal(checkedExcess.excessAllocated, 5000);
const noFidyahSplit = makePayment({ category: 'Fidyah', jiwa: '1', value: '70.000', autoExcess: 'yes' }, rules);
assert.equal(noFidyahSplit.lines.length, 1, 'fidyah is not automatically reclassified as infak');
assert.equal(noFidyahSplit.lines[0].value, 70000);
assert.equal(noFidyahSplit.estimate.excess, 5000, 'non-splittable excess is still visible in the calculation result');

// The same field builder is used by Muzakki self-service and Operator/Amil counter forms.
for (const prefix of ['self', 'operator']) {
  const html = formFields(prefix, 2, '90.000');
  assert.match(html, /name="category"/);
  assert.match(html, /name="assetsValue"/);
  assert.match(html, /name="haulComplete"/);
  assert.match(html, /name="kafaratType"/);
  assert.match(html, /name="kafaratFeedingConfirmed"/);
  assert.match(html, /name="professionPeriod"/);
  assert.match(html, /name="autoExcess"/);
  assert.match(html, /Zakat Profesi/);
}

const appSource = fs.readFileSync(path.join(root, 'js', 'revision-v5.js'), 'utf8');
assert.match(appSource, /function maybeConfirmExcess/);
assert.match(appSource, /Total yang kamu bayarkan melebihi jumlah kewajiban/);
assert.match(appSource, /Ya, pisahkan ke infak\/sedekah/);
assert.match(appSource, /data-excess-action="accept"/);
assert.match(appSource, /Kewajiban bila seluruhnya uang/);
assert.match(appSource, /Total semua kategori/);

console.log('transaction-calculator.test.cjs: all assertions passed');
