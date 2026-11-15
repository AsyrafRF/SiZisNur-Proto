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
const document = {
  body: { classList: { toggle() {} } },
  getElementById(id) { return elements[id] || (elements[id] = { innerHTML: '', textContent: '', dataset: {} }); },
  addEventListener(type, listener) { (listeners[type] ||= []).push(listener); },
  querySelector() { return null; },
  querySelectorAll() { return []; },
  createElement() { return { style: {}, click() {}, remove() {} }; },
};
class MockFormData {
  constructor(form) { this.data = form.data || {}; }
  entries() { return Object.entries(this.data); }
}
const window = { localStorage, sessionStorage, crypto: crypto.webcrypto, addEventListener() {}, scrollTo() {}, open() { return null; } };
const navigator = { onLine: true, userAgent: 'prototype-test' };
const context = {
  window, document, elements, localStorage, sessionStorage, navigator,
  console: { ...console, error() {} }, Date, Math, JSON, Map, Set,
  Blob: function Blob() {}, URL: {}, FormData: MockFormData,
  setInterval() {}, clearInterval() {}, Intl, Number, String, Object, Array,
  RegExp, Error, Promise, setTimeout() { return 0; }, clearTimeout() {},
};
vm.createContext(context);
vm.runInContext(source, context, { timeout: 5000 });

const bridge = window.__SiZisNurBridge;
const app = window.__SiZisNurTest;

function fireClick(action) {
  const button = { dataset: { v5Action: action } };
  const event = { target: { closest(selector) { return selector === '[data-v5-action]' ? button : null; } } };
  for (const listener of listeners.click || []) listener(event);
}
function submitForm(formType, data) {
  const form = { dataset: { v5Form: formType }, data };
  const event = {
    target: { closest(selector) { return selector === 'form[data-v5-form]' ? form : null; } },
    preventDefault() {},
  };
  for (const listener of listeners.submit || []) listener(event);
}

bridge.state.page = 'login';
bridge.render();
fireClick('muzakki-register');

const registrationMarkup = bridge.state.modal.body;
assert.ok(registrationMarkup.includes('Nama lengkap'));
assert.ok(registrationMarkup.includes('Nomor HP'));
assert.ok(registrationMarkup.includes('Email'));
assert.ok(registrationMarkup.includes('Alamat lengkap'));
assert.ok(registrationMarkup.includes('required'));
assert.ok(!registrationMarkup.includes('Lembaga pertama'));
assert.ok(!registrationMarkup.includes('tenantId'));
assert.ok(!registrationMarkup.includes('data-domicile-fields'));
assert.ok(!registrationMarkup.includes('name="consent"'));

const before = {
  users: bridge.db.users.length,
  accounts: bridge.db.accounts.length,
  persons: bridge.db.persons.length,
  muzakki: bridge.db.muzakki.length,
  memberships: bridge.db.muzakkiMemberships.length,
};

submitForm('muzakki-register', {
  name: 'Muzakki Pendaftar Mandiri',
  phone: '081298765432',
  email: 'muzakki.mandiri@example.invalid',
  address: 'Jl. Contoh Nomor 10, Takokak',
});

const registered = bridge.db.users.find((user) => user.email === 'muzakki.mandiri@example.invalid');
assert.ok(registered, 'new user account is created');
assert.equal(registered.role, 'Muzakki');
assert.equal(registered.tenantId, null, 'registration must not assign a first tenant');
assert.equal(bridge.db.users.length, before.users + 1);
assert.equal(bridge.db.accounts.length, before.accounts + 1);
assert.equal(bridge.db.persons.length, before.persons, 'registration must not create a tenant person');
assert.equal(bridge.db.muzakki.length, before.muzakki, 'registration must not create a tenant Muzakki card');
assert.equal(bridge.db.muzakkiMemberships.length, before.memberships, 'registration must not create a tenant membership');

const account = bridge.db.accounts.find((item) => item.userId === registered.id);
assert.equal(account.address, 'Jl. Contoh Nomor 10, Takokak');
assert.equal(account.consentAt, null, 'tenant-specific data consent is requested only when joining a lembaga');
assert.equal(bridge.session.userId, registered.id);
assert.equal(bridge.session.tenantId, null);
assert.equal(bridge.tenantId(), null);
assert.equal(bridge.state.page, 'my-zis');
assert.ok(app.html().includes('Belum terhubung'));
assert.ok(app.html().includes('Jl. Contoh Nomor 10, Takokak'));
assert.ok(app.html().includes('Pilih lembaga'));

// A walk-in record with the same contact details must not be silently claimed.
const walkIn = {
  id: 'PS-WALKIN-UNVERIFIED', tenantId: 'TN-ALHIKMAH',
  name: 'Data Walk-in Lama', phone: '081298765432',
  email: 'muzakki.mandiri@example.invalid', address: 'Alamat Walk-in',
  domicileStatus: 'non_daerah',
};
bridge.db.persons.push(walkIn);

fireClick('tenant-join');
const joinMarkup = bridge.state.modal.body;
assert.ok(joinMarkup.includes('Pilih lembaga yang ingin diikuti'));
assert.ok(joinMarkup.includes('Jl. Contoh Nomor 10, Takokak'));
assert.ok(joinMarkup.includes('Daftar dan hubungkan lembaga'));
assert.ok(joinMarkup.includes('name="consent"'));
assert.ok(joinMarkup.includes('required'));

submitForm('join-tenant', {
  tenantId: 'TN-ALHIKMAH',
  domicileStatus: 'non_daerah',
  address: 'Jl. Contoh Nomor 10, Takokak',
});
assert.equal(bridge.db.muzakkiMemberships.length, before.memberships, 'membership must not be created without institution-specific consent');

submitForm('join-tenant', {
  tenantId: 'TN-ALHIKMAH',
  domicileStatus: 'non_daerah',
  address: 'Jl. Contoh Nomor 10, Takokak',
  consent: 'yes',
});

const membership = bridge.db.muzakkiMemberships.find((item) => item.userId === registered.id);
assert.ok(membership, 'membership is created after the user selects a lembaga');
assert.equal(membership.tenantId, 'TN-ALHIKMAH');
assert.notEqual(membership.personId, walkIn.id, 'unverified walk-in data is not auto-claimed');
assert.ok(bridge.db.muzakki.some((item) => item.tenantId === 'TN-ALHIKMAH' && item.personId === membership.personId), 'tenant Muzakki card is created on join');
assert.ok(account.consentAt, 'consent timestamp is recorded after joining the institution');
assert.equal(bridge.tenantId(), 'TN-ALHIKMAH');
assert.equal(bridge.session.tenantId, 'TN-ALHIKMAH');
assert.equal(bridge.state.page, 'my-zis');

console.log('PASS — registrasi Muzakki hanya membuat akun global; lembaga, person, kartu, dan membership baru dibuat setelah dipilih dari dalam akun');
