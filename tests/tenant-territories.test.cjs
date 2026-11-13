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
  'window.__SiZisNurTest={mustahikModal,muzakkiModal,navigateRef:navigate,loginRef:login,html:()=>elements.app.innerHTML,modalHtml:()=>elements["modal-root"].innerHTML};\nrender();\n})();'
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
const app = window.__SiZisNurTest;
const bridge = window.__SiZisNurBridge;
const db = bridge.db;

// Master data examples and tenant-specific foreign-key boundaries.
const annurArea = db.areas.find((x) => x.tenantId === 'TN-ANNUR');
const alhikmahArea = db.areas.find((x) => x.tenantId === 'TN-ALHIKMAH');
assert.equal(annurArea.name, 'Perumahan Villa Pesona Asri');
assert.equal(alhikmahArea.name, 'Kompleks Buana Citra');
const annurRws = db.rws.filter((x) => x.tenantId === 'TN-ANNUR');
const alhikmahRws = db.rws.filter((x) => x.tenantId === 'TN-ALHIKMAH');
assert.equal(annurRws.length, 1);
assert.equal(annurRws[0].name, 'RW 11');
assert.equal(db.rts.filter((x) => x.tenantId === 'TN-ANNUR' && x.rwId === annurRws[0].id).length, 6);
assert.equal(alhikmahRws.length, 2);
assert.equal(JSON.stringify(alhikmahRws.map((rw) => db.rts.filter((x) => x.tenantId === 'TN-ALHIKMAH' && x.rwId === rw.id).length).sort((a, b) => a - b)), '[5,10]');
assert.ok(db.rws.every((rw) => db.areas.some((area) => area.id === rw.areaId && area.tenantId === rw.tenantId)));
assert.ok(db.rts.every((rt) => db.rws.some((rw) => rw.id === rt.rwId && rw.tenantId === rt.tenantId)));

// The existing identities migrate to references, while the master IDs remain tenant scoped.
const annurPerson = db.persons.find((x) => x.id === 'PS-01');
const alhikmahPerson = db.persons.find((x) => x.id === 'PS-T2');
assert.ok(annurPerson, 'Annur demo person should exist');
assert.ok(alhikmahPerson, 'Al-Hikmah demo person should exist');
assert.equal(annurPerson.domicileStatus, 'warga_daerah');
assert.equal(annurPerson.areaId, annurArea.id);
assert.equal(db.rws.find((x) => x.id === annurPerson.rwId).name, 'RW 11');
assert.equal(alhikmahPerson.domicileStatus, 'non_daerah');
assert.equal(alhikmahPerson.areaId, null);

// Form fields are dropdowns backed by tenant master data; free-typed RT is absent.
const annurForm = window.__SIZISNUR_DOMICILE_FIELDS(null, 'TN-ANNUR');
assert.ok(annurForm.includes('Warga Perumahan Villa Pesona Asri'));
assert.ok(annurForm.includes('Non-Perumahan Villa Pesona Asri'));
assert.ok(annurForm.includes('name="rwId"'));
assert.ok(annurForm.includes('name="rtId"'));
assert.ok(!annurForm.includes('name="rt"'));
const annurRt = db.rts.find((x) => x.tenantId === 'TN-ANNUR');
const annurPersonTest = { id: 'PS-TERRITORY-TEST', tenantId: 'TN-ANNUR' };
window.__SIZISNUR_SAVE_DOMICILE(annurPersonTest, { domicileStatus: 'warga_daerah', rwId: annurRws[0].id, rtId: annurRt.id }, 'TN-ANNUR');
assert.deepEqual(
  { status: annurPersonTest.domicileStatus, areaId: annurPersonTest.areaId, rwId: annurPersonTest.rwId, rtId: annurPersonTest.rtId },
  { status: 'warga_daerah', areaId: annurArea.id, rwId: annurRws[0].id, rtId: annurRt.id }
);
window.__SIZISNUR_SAVE_DOMICILE(annurPersonTest, { domicileStatus: 'non_daerah' }, 'TN-ANNUR');
assert.equal(annurPersonTest.domicileStatus, 'non_daerah');
assert.equal(annurPersonTest.areaId, null);
assert.equal(annurPersonTest.rwId, null);
assert.equal(annurPersonTest.rtId, null);
assert.throws(
  () => window.__SIZISNUR_SAVE_DOMICILE(annurPersonTest, {
    domicileStatus: 'warga_daerah', rwId: alhikmahRws[0].id,
    rtId: db.rts.find((x) => x.tenantId === 'TN-ALHIKMAH').id,
  }, 'TN-ANNUR'),
  /Pilih RW dan RT yang valid/
);

// Administrative domicile updates never replace the workbook scoring area or score.
const sampleMustahik = db.mustahiks[0];
const samplePerson = db.persons.find((x) => x.id === sampleMustahik.personId);
const previousRegion = sampleMustahik.region;
const previousScore = sampleMustahik.score;
window.__SIZISNUR_SAVE_DOMICILE(samplePerson, { domicileStatus: 'warga_daerah', rwId: annurRws[0].id, rtId: annurRt.id }, 'TN-ANNUR');
assert.equal(sampleMustahik.region, previousRegion);
assert.equal(sampleMustahik.score, previousScore);

// Both identity forms place domicile choices before the complete address field.
app.loginRef('US-PTG');
app.muzakkiModal(null);
let modal = app.modalHtml();
assert.ok(modal.includes('Status domisili'));
assert.ok(modal.indexOf('name="domicileStatus"') < modal.indexOf('name="address"'));
app.mustahikModal(null);
modal = app.modalHtml();
assert.ok(modal.includes('Wilayah penilaian (kolom H)'));
assert.ok(modal.indexOf('name="domicileStatus"') < modal.indexOf('name="address"'));

// Tenant admin pages and recaps render the hierarchy for the selected tenant.
app.navigateRef('tenant');
assert.ok(app.html().includes('Master wilayah administratif'));
assert.ok(app.html().includes('Perumahan Villa Pesona Asri'));
assert.ok(app.html().includes('RW 11'));
assert.ok(app.html().includes('RT 06'));
assert.ok(app.html().includes('Rekap identitas Daerah / RW / RT'));
assert.ok(app.html().includes('Mustahik'));
app.navigateRef('mustahik');
assert.ok(app.html().includes('Rekap Mustahik per Daerah / RW / RT'));
assert.ok(app.html().includes('Wilayah penilaian (kolom H)'));
app.navigateRef('muzakki');
assert.ok(app.html().includes('Rekap Muzakki per Daerah / RW / RT'));
app.loginRef('US-OPR');
app.navigateRef('muzakki');
assert.ok(app.html().includes('Rekap Muzakki per Daerah / RW / RT'));
assert.ok(app.html().includes('Tingkat'));
app.loginRef('US-PGR');
app.navigateRef('reports');
assert.ok(app.html().includes('Rekap identitas per Daerah / RW / RT'));
assert.ok(app.html().includes('Tingkat'));

app.loginRef('US-PTG');
bridge.set('tenantId', () => 'TN-ALHIKMAH');
app.navigateRef('tenant');
assert.ok(app.html().includes('Kompleks Buana Citra'));
assert.ok(app.html().includes('RW 1'));
assert.ok(app.html().includes('RW 2'));
assert.ok(app.html().includes('RT 10'));
const alForm = window.__SIZISNUR_DOMICILE_FIELDS(null, 'TN-ALHIKMAH');
assert.ok(alForm.includes('Warga Kompleks Buana Citra'));
db.tenants.push({ id: 'TN-NEW', name: 'Tenant Uji', status: 'aktif' });
const newTenantForm = window.__SIZISNUR_DOMICILE_FIELDS(null, 'TN-NEW');
assert.ok(newTenantForm.includes('Warga Tenant Uji'));
assert.ok(db.areas.some((x) => x.tenantId === 'TN-NEW' && x.name === 'Tenant Uji'));
assert.ok(db.rws.filter((x) => x.tenantId === 'TN-ALHIKMAH').every((x) => x.areaId === alhikmahArea.id));

console.log('PASS — master Daerah/RW/RT per tenant, validasi relasi, formulir Muzakki/Mustahik, rekap hierarkis, dan pemisahan kolom penilaian workbook');
