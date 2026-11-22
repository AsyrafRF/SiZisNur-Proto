const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

const root = path.join(__dirname, '..');
const source = [
  fs.readFileSync(path.join(root, 'js', 'app.js'), 'utf8'),
  fs.readFileSync(path.join(root, 'js', 'revision-v5.js'), 'utf8'),
].join('\n');

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
  body: { classList: { toggle() {} }, appendChild() {} },
  getElementById(id) { return elements[id] || (elements[id] = { innerHTML: '', textContent: '', dataset: {} }); },
  addEventListener() {},
  querySelector() { return null; },
  querySelectorAll() { return []; },
  createElement() { return { style: {}, click() {}, remove() {} }; },
};
const window = {
  localStorage, sessionStorage, crypto: crypto.webcrypto,
  addEventListener() {}, scrollTo() {}, open() { return null; },
};
const context = {
  window, document, elements, localStorage, sessionStorage,
  navigator: { onLine: true, userAgent: 'adaptivity-test' },
  console, Date, Math, JSON, Map, Set,
  Blob: function Blob() {}, URL: {}, FormData: function FormData() {},
  setInterval() {}, clearInterval() {}, Intl, Number, String, Object, Array,
  RegExp, Error, Promise, setTimeout() { return 0; }, clearTimeout() {},
};
vm.createContext(context);
vm.runInContext(source, context, { timeout: 10000 });

const updateForm = window.__SIZISNUR_UPDATE_TRANSACTION_FORM;
assert.equal(typeof updateForm, 'function', 'the shared transaction form updater is exposed');

function makeControl(value = '') {
  return { value, disabled: false, required: false, checked: false, dataset: { autoFill: 'true' }, selectionStart: null };
}

function makeRow(category, overrides = {}) {
  const fieldValues = {
    category,
    type: overrides.type || 'uang',
    jiwa: overrides.jiwa || '2',
    assetsValue: overrides.assetsValue || '100.000.000',
    professionPeriod: overrides.professionPeriod || 'monthly',
    haulComplete: overrides.haulComplete || 'yes',
    kafaratType: overrides.kafaratType || 'yamin',
    kafaratFeedingConfirmed: overrides.kafaratFeedingConfirmed || 'no',
    value: overrides.value || '',
    autoExcess: '',
  };
  const fields = Object.fromEntries(Object.entries(fieldValues).map(([key, value]) => [key, makeControl(value)]));
  fields.value.required = true; // The payment amount is always required in the shared markup.
  const wrapNames = ['media', 'quantity', 'assets', 'profession-period', 'haul', 'kafarat', 'kafarat-stage', 'excess'];
  const wraps = Object.fromEntries(wrapNames.map((name) => [name, { hidden: false }]));
  const labels = {
    quantity: { textContent: '' },
    assets: { textContent: '' },
    value: { textContent: '' },
  };
  const preview = { innerHTML: '' };
  const removeButton = { hidden: false };
  const title = { textContent: '' };
  return {
    fields, wraps, labels, preview, removeButton, title,
    querySelector(selector) {
      let match = selector.match(/^\[data-line-field="([^"]+)"\]$/);
      if (match) return fields[match[1]] || null;
      match = selector.match(/^\[data-line-wrap="([^"]+)"\]$/);
      if (match) return wraps[match[1]] || null;
      match = selector.match(/^\[data-line-label="([^"]+)"\]$/);
      if (match) return labels[match[1]] || null;
      if (selector === '[data-line-preview]') return preview;
      if (selector === '[data-shared-transaction-action="remove-line"]') return removeButton;
      if (selector === '.transaction-line-head b') return title;
      return null;
    },
  };
}

function updateCategory(category, overrides = {}) {
  const row = makeRow(category, overrides);
  const summary = { innerHTML: '' };
  const parentForm = { dataset: { tenantId: 'TN-ANNUR' } };
  const form = {
    dataset: {},
    matches(selector) { return selector === '[data-shared-transaction="yes"]'; },
    closest(selector) { return selector === 'form' ? parentForm : null; },
    querySelectorAll(selector) { return selector === '[data-transaction-line]' ? [row] : []; },
    querySelector(selector) { return selector === '[data-transaction-summary]' ? summary : null; },
  };
  updateForm(form);
  return { row, summary };
}

const fitrah = updateCategory('Zakat Fitrah', { type: 'beras' }).row;
assert.equal(fitrah.wraps.media.hidden, false);
assert.equal(fitrah.fields.type.disabled, false);
assert.equal(fitrah.wraps.quantity.hidden, false);
assert.equal(fitrah.fields.jiwa.required, true);
assert.equal(fitrah.wraps.assets.hidden, true);
assert.equal(fitrah.fields.assetsValue.disabled, true);
assert.equal(fitrah.wraps['profession-period'].hidden, true);
assert.equal(fitrah.wraps.haul.hidden, true);
assert.equal(fitrah.wraps.kafarat.hidden, true);
assert.equal(fitrah.fields.value.dataset.format, 'kg');
assert.equal(fitrah.labels.value.textContent, 'Beras dibayarkan (kg)');

const maal = updateCategory('Zakat Maal', { assetsValue: '100.000.000', haulComplete: 'yes' }).row;
assert.equal(maal.wraps.media.hidden, true, 'Maal uses the fixed Uang medium, not a selectable media field');
assert.equal(maal.fields.type.disabled, true);
assert.equal(maal.wraps.quantity.hidden, true);
assert.equal(maal.fields.jiwa.disabled, true);
assert.equal(maal.wraps.assets.hidden, false);
assert.equal(maal.fields.assetsValue.required, true);
assert.equal(maal.fields.assetsValue.disabled, false);
assert.equal(maal.labels.assets.textContent, 'Harta bersih yang menjadi objek zakat (Rp)');
assert.equal(maal.wraps.haul.hidden, false);
assert.equal(maal.fields.haulComplete.required, true);
assert.equal(maal.wraps['profession-period'].hidden, true);
assert.equal(maal.wraps.kafarat.hidden, true);

const profession = updateCategory('Zakat Profesi', { assetsValue: '10.000.000', professionPeriod: 'annual' }).row;
assert.equal(profession.wraps.assets.hidden, false);
assert.equal(profession.labels.assets.textContent, 'Penghasilan profesi pada periode terpilih (Rp)');
assert.equal(profession.fields.assetsValue.required, true);
assert.equal(profession.wraps['profession-period'].hidden, false);
assert.equal(profession.fields.professionPeriod.required, true);
assert.equal(profession.wraps.haul.hidden, true);
assert.equal(profession.wraps.quantity.hidden, true);

const fidyah = updateCategory('Fidyah').row;
assert.equal(fidyah.wraps.quantity.hidden, false);
assert.equal(fidyah.labels.quantity.textContent, 'Jumlah hari puasa yang ditinggalkan');
assert.equal(fidyah.fields.jiwa.required, true);
assert.equal(fidyah.wraps.assets.hidden, true);
assert.equal(fidyah.wraps['profession-period'].hidden, true);
assert.equal(fidyah.wraps.haul.hidden, true);
assert.equal(fidyah.wraps.kafarat.hidden, true);

const kafaratYamin = updateCategory('Kafarat', { kafaratType: 'yamin' }).row;
assert.equal(kafaratYamin.wraps.quantity.hidden, false);
assert.equal(kafaratYamin.labels.quantity.textContent, 'Jumlah kasus kafarat');
assert.equal(kafaratYamin.wraps.kafarat.hidden, false);
assert.equal(kafaratYamin.fields.kafaratType.required, true);
assert.equal(kafaratYamin.wraps['kafarat-stage'].hidden, true);
assert.equal(kafaratYamin.fields.kafaratFeedingConfirmed.disabled, true);
const kafaratPuasa = updateCategory('Kafarat', { kafaratType: 'puasa' }).row;
assert.equal(kafaratPuasa.wraps['kafarat-stage'].hidden, false);
assert.equal(kafaratPuasa.fields.kafaratFeedingConfirmed.required, true);

const infaq = updateCategory('Infak/Sedekah').row;
assert.equal(infaq.wraps.media.hidden, true);
assert.equal(infaq.wraps.quantity.hidden, true);
assert.equal(infaq.wraps.assets.hidden, true);
assert.equal(infaq.wraps['profession-period'].hidden, true);
assert.equal(infaq.wraps.haul.hidden, true);
assert.equal(infaq.wraps.kafarat.hidden, true);
assert.equal(infaq.labels.value.textContent, 'Nominal infak/sedekah (Rp)');
assert.equal(infaq.fields.value.required, true);

const payment = window.__SIZISNUR_TRANSACTION_PAYMENT;
const fitrahWithIrrelevantValues = payment({
  'lines[0][category]': 'Zakat Fitrah',
  'lines[0][type]': 'uang',
  'lines[0][jiwa]': '1',
  'lines[0][assetsValue]': '100.000.000',
  'lines[0][haulComplete]': 'yes',
  'lines[0][professionPeriod]': 'annual',
  'lines[0][kafaratType]': 'puasa',
  'lines[0][kafaratFeedingConfirmed]': 'yes',
  'lines[0][value]': '45.000',
});
assert.equal(fitrahWithIrrelevantValues.lines[0].assetsValue, 0, 'irrelevant asset input is not retained on Fitrah');
assert.equal(fitrahWithIrrelevantValues.breakdown[0].haulComplete, 'no');
assert.equal(fitrahWithIrrelevantValues.breakdown[0].professionPeriod, 'monthly');
assert.equal(fitrahWithIrrelevantValues.breakdown[0].kafaratType, 'yamin');

const maalPayment = payment({
  'lines[0][category]': 'Zakat Maal',
  'lines[0][assetsValue]': '100.000.000',
  'lines[0][haulComplete]': 'yes',
  'lines[0][value]': '2.500.000',
});
assert.equal(maalPayment.lines[0].assetsValue, 100000000, 'Maal retains its relevant harta base');
assert.equal(maalPayment.breakdown[0].haulComplete, 'yes');

const revisionSource = fs.readFileSync(path.join(root, 'js', 'revision-v5.js'), 'utf8');
const publicSource = fs.readFileSync(path.join(root, 'js', 'public-intake.js'), 'utf8');
const cssSource = fs.readFileSync(path.join(root, 'css', 'style.css'), 'utf8');
assert.match(cssSource, /\[data-line-wrap\]\[hidden\]\s*\{\s*display:none!important\s*\}/, 'category-specific hidden fields must not be forced visible by .field display:flex');
assert.match(revisionSource, /transactionCalculatorFields\('self'/);
assert.match(revisionSource, /transactionCalculatorFields\('operator'/);
assert.match(publicSource, /__SIZISNUR_TRANSACTION_FORM_FIELDS\('public'/);
assert.match(publicSource, /__SIZISNUR_UPDATE_TRANSACTION_FORM/);

console.log('transaction-line-adaptivity.test.cjs: all assertions passed');
