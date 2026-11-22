const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

const appPath = path.join(__dirname, '..', 'js', 'app.js');
const revisionPath = path.join(__dirname, '..', 'js', 'revision-v5.js');
let source = fs.readFileSync(appPath, 'utf8').replace(/\r\n/g, '\n');
source = source.replace(
  'render();\n})();',
  'window.__SiZisNurTest={navigateRef:navigate,loginRef:login,html:()=>elements.app.innerHTML};\nrender();\nwindow.__SiZisNurBridge.db = window.__SiZisNurBridge.seedMultiTenant();\nwindow.__SiZisNurBridge.persist();\n})();'
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
assert.equal(registered.phone, '081298765432', 'phone is stored on the login identity as well as the profile account');
assert.equal(registered.emailVerifiedAt, null, 'email starts pending actual verification');
assert.equal(registered.phoneVerifiedAt, null, 'phone starts pending actual verification');
assert.equal(registered.tenantId, null, 'registration must not assign a first tenant');
assert.equal(bridge.db.users.length, before.users + 1);
assert.equal(bridge.db.accounts.length, before.accounts + 1);
assert.equal(bridge.db.persons.length, before.persons, 'registration must not create a tenant person');
assert.equal(bridge.db.muzakki.length, before.muzakki, 'registration must not create a tenant Muzakki card');
assert.equal(bridge.db.muzakkiMemberships.length, before.memberships, 'registration must not create a tenant membership');

const account = bridge.db.accounts.find((item) => item.userId === registered.id);
assert.equal(account.address, 'Jl. Contoh Nomor 10, Takokak');
assert.equal(account.consentAt, null, 'tenant-specific data consent is requested only when joining a lembaga');
const beforeDuplicate = bridge.db.users.length;
submitForm('muzakki-register', { name: 'Muzakki Duplikat', phone: '+62 812 9876 5432', email: 'different@example.invalid', address: 'Alamat lain' });
assert.equal(bridge.db.users.length, beforeDuplicate, 'normalized duplicate phone is rejected even when formatting differs');
assert.equal(bridge.session.userId, registered.id);
assert.equal(bridge.session.tenantId, null);
assert.equal(bridge.tenantId(), null);
assert.equal(bridge.state.page, 'my-zis');
assert.ok(app.html().includes('Belum terhubung'));
assert.ok(app.html().includes('Jl. Contoh Nomor 10, Takokak'));
assert.ok(app.html().includes('Pilih lembaga'));

// Newly registered accounts can open the two dedicated pages before joining a tenant.
app.navigateRef('muzakki-services');
assert.ok(app.html().includes('Layanan Mandiri'));
assert.ok(app.html().includes('Profil akun Anda'));
assert.ok(app.html().includes('Pilih lembaga'));
app.navigateRef('pay-plan');
assert.ok(app.html().includes('Rencana Bayar Zakat'));
assert.ok(app.html().includes('Hubungkan akun ke lembaga terlebih dahulu'));
assert.ok(!app.html().includes('data-v5-action="self-tx-new"'));
app.navigateRef('my-zis');

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
assert.ok(joinMarkup.includes('ID UNIK LEMBAGA'));
assert.ok(joinMarkup.includes('MAN-06426'));
assert.ok(joinMarkup.includes('AH-6482'), 'the institution selector distinguishes the second similar-name institution by its public code');
assert.ok(joinMarkup.includes('Alamat lengkap lembaga'));
assert.ok(joinMarkup.includes('Perumahan Villa Pesona Asri'));
assert.ok(joinMarkup.includes('PETA SIMULASI'));
assert.ok(joinMarkup.includes('Belum ada foto lembaga'));
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

// Institution Admin manages the public profile, full address, map coordinates and photo carousel.
const annur = bridge.db.tenants.find((item) => item.id === 'TN-ANNUR');
const originalPublicCode = annur.publicCode;
bridge.login('US-ADM', false);
app.navigateRef('tenant');
const tenantProfileMarkup = app.html();
assert.ok(tenantProfileMarkup.includes('Kelola Lembaga dan Master Wilayah'));
assert.ok(tenantProfileMarkup.includes('ID Lembaga'));
assert.ok(tenantProfileMarkup.includes(originalPublicCode));
assert.ok(tenantProfileMarkup.includes('galleryUrls'));
assert.ok(tenantProfileMarkup.includes('Latitude (opsional)'));
assert.ok(tenantProfileMarkup.includes('Longitude (opsional)'));
assert.ok(tenantProfileMarkup.includes('Foto lembaga'));

submitForm('tenant-profile', {
  name: 'Masjid An-Nur Utama', daerah: 'Perumahan Contoh', kelurahan: 'Kelurahan Contoh',
  kecamatan: 'Kecamatan Contoh', city: 'Kota Contoh', province: 'Provinsi Contoh', postalCode: '12345',
  phone: '081234567890', email: 'annur@example.invalid', upzType: 'UPZ Masjid', baznasArea: 'BAZNAS Kota Contoh',
  address: 'Jalan Utama Nomor 10, dekat taman warga', latitude: '-1.12345', longitude: '104.12345',
  galleryUrls: 'https://images.example.invalid/annur-depan.jpg | Tampak depan\nhttps://images.example.invalid/annur-dalam.jpg | Ruang utama',
});
assert.equal(annur.name, 'Masjid An-Nur Utama');
assert.equal(annur.publicCode, originalPublicCode, 'public institution ID remains stable after a name change');
assert.equal(annur.city, 'Kota Contoh');
assert.equal(annur.latitude, '-1.12345');
assert.deepEqual(JSON.parse(JSON.stringify(annur.gallery)), [
  { url: 'https://images.example.invalid/annur-depan.jpg', caption: 'Tampak depan' },
  { url: 'https://images.example.invalid/annur-dalam.jpg', caption: 'Ruang utama' },
]);

const savedGallery = JSON.stringify(annur.gallery);
submitForm('tenant-profile', {
  name: annur.name, daerah: annur.daerah, city: annur.city, province: annur.province, address: annur.address,
  latitude: '', longitude: '', galleryUrls: 'javascript:alert(1)',
});
assert.equal(JSON.stringify(annur.gallery), savedGallery, 'unsafe gallery URLs are rejected without replacing saved photos');

console.log('PASS — pilihan lembaga menampilkan ID unik, alamat, daerah, peta simulasi dan galeri; Admin dapat mengelola lokasi serta carousel secara aman');
