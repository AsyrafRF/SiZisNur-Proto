const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const crypto = require('node:crypto')

const root = path.resolve(__dirname, '..')
const appSource = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8')
  .replace('render();\n})();', 'window.__SiZisNurTest={html:()=>elements.app.innerHTML};\nrender();\n})();')
const extensionFiles = ['js/revision-v5.js', 'js/platform-admin.js', 'js/public-portal.js', 'js/prototype-settings.js']
const extensionSource = extensionFiles.map((file) => fs.readFileSync(path.join(root, file), 'utf8')).join('\n;\n')

class MemoryStorage {
  constructor(values = new Map()) { this.values = values }
  getItem(key) { return this.values.get(key) || null }
  setItem(key, value) { this.values.set(key, String(value)) }
  removeItem(key) { this.values.delete(key) }
}
function createRuntime(localValues = new Map()) {
  const localStorage = new MemoryStorage(localValues)
  const sessionStorage = new MemoryStorage()
  const elements = { app: { innerHTML: '' }, 'modal-root': { innerHTML: '' }, 'toast-host': { innerHTML: '' } }
  const listeners = {}
  const document = {
    body: { classList: { toggle() {} } },
    getElementById(id) { return elements[id] || (elements[id] = { innerHTML: '', textContent: '' }) },
    addEventListener(type, fn) { (listeners[type] ||= []).push(fn) },
    querySelector() { return null }, querySelectorAll() { return [] },
    createElement() { return { style: {}, click() {}, remove() {} } },
  }
  const window = { localStorage, sessionStorage, crypto: crypto.webcrypto, addEventListener() {}, scrollTo() {}, open() { return null } }
  const context = {
    window, document, elements, localStorage, sessionStorage, console, Date, Math, JSON, Map, Set,
    Blob: function Blob() {}, URL: {}, FormData: function FormData() { this.get = () => '' },
    setInterval() {}, clearInterval() {}, Intl, Number, String, Object, Array, RegExp, Error, Promise,
    TextEncoder, setTimeout() { return 0 }, clearTimeout() {}, navigator: { onLine: true, userAgent: 'prototype-test' },
  }
  vm.createContext(context)
  vm.runInContext(appSource + '\n;\n' + extensionSource, context, { timeout: 12000 })
  return { window, context, localStorage, sessionStorage, elements, listeners, A: window.__SiZisNurBridge, settings: window.__SIZISNUR_PROTOTYPE_SETTINGS, platform: window.__SIZISNUR_PLATFORM_ADMIN }
}

const runtime = createRuntime()
const { A, settings, platform, elements } = runtime
const ROOT_ID = 'PA-SIZISNUR-ROOT'
assert.equal(A.db.datasetProfile, 'annur-default')
assert.equal(A.db.datasetLabel, 'Dataset Masjid An-Nur')
assert.deepEqual([...A.db.tenants].map((tenant) => tenant.id), ['TN-ANNUR'])
assert.equal(A.db.applications.length, 0)
assert.equal(A.db.mustahiks.length, 129)

function visiblePages(userId) {
  A.login(userId, false)
  A.state.page = 'dashboard'
  A.render()
  return [...elements.app.innerHTML.matchAll(/data-page="([^"]+)"/g)].map((match) => match[1])
}
function verifyRole(userId, mustHave, mustNotHave, label) {
  const visible = visiblePages(userId)
  for (const page of mustHave) assert.ok(visible.includes(page), `${label} must see ${page}; got ${visible.join(',')}`)
  for (const page of mustNotHave) assert.ok(!visible.includes(page), `${label} must not see ${page}; got ${visible.join(',')}`)
  for (const page of mustHave) assert.equal(A.can(page), true, `${label}: permission check for ${page}`)
  for (const page of mustNotHave) assert.equal(A.can(page), false, `${label}: permission check denies ${page}`)
}

const adminForbidden = ['allocation', 'distribution', 'reports', 'deposits', 'ledger', 'incentives', 'transactions']
verifyRole('US-ADM', ['dashboard', 'tenant', 'users', 'periods', 'settings', 'schedule', 'mustahik'], adminForbidden, 'Admin')
verifyRole('US-AML', ['dashboard', 'schedule', 'muzakki', 'transactions', 'amil-guide'], ['allocation', 'distribution', 'reports', 'deposits', 'ledger', 'users'], 'Amil')
verifyRole('US-OPR', ['dashboard', 'muzakki', 'transactions'], ['schedule', 'allocation', 'distribution', 'reports', 'deposits', 'users'], 'Operator')
verifyRole('US-BEN', ['dashboard', 'deposits', 'ledger', 'allocation', 'distribution', 'reports', 'incentives'], ['schedule', 'users', 'periods', 'settings'], 'Bendahara')
verifyRole('US-REL', ['dashboard', 'distribution'], ['schedule', 'allocation', 'reports', 'deposits', 'ledger', 'users'], 'Relawan')
verifyRole('US-PGR', ['dashboard', 'tenant', 'transactions', 'deposits', 'ledger', 'allocation', 'reports'], ['schedule', 'distribution', 'users', 'settings'], 'Pengurus')
verifyRole('US-MZK', ['my-zis', 'muzakki-services', 'pay-plan'], ['dashboard', 'tenant', 'users', 'schedule', 'allocation', 'distribution', 'reports'], 'Muzakki')

// Multi-tenant preset retains precisely two mosque examples and one Al-Falah application.
A.login(ROOT_ID, false)
const multi = settings.loadDatasetPreset('multi-tenant', { reload: false })
assert.equal(multi.tenants, 2)
assert.equal(multi.applications, 1)
assert.deepEqual([...A.db.tenants].map((tenant) => tenant.id).sort(), ['TN-ALHIKMAH', 'TN-ANNUR'])
assert.equal(A.db.applications[0].name, 'Masjid Al-Falah')
assert.equal(A.db.applications[0].status, 'menunggu')
assert.equal(A.db.mustahiks.length, 129, 'workbook-reference recipients stay scoped to An-Nur only')
verifyRole('US-T2', ['dashboard', 'tenant', 'users', 'periods', 'settings', 'schedule'], adminForbidden, 'Admin Al-Hikmah')
verifyRole('US-AML', ['schedule', 'muzakki', 'transactions'], ['allocation', 'distribution', 'reports'], 'Amil multi-lembaga')

// Clear-all must keep only the existing root identity and its current credential hash.
A.login(ROOT_ID, false)
A.db.platformAdmins[0].passwordAuth = { algorithm: 'PBKDF2-SHA256', salt: 'kept-salt', hash: 'kept-hash', iterations: 210000 }
const rootCredential = JSON.stringify(A.db.platformAdmins[0].passwordAuth)
const cleared = settings.clearAllData({ reload: false })
assert.deepEqual(JSON.parse(JSON.stringify(cleared)), { tenants: 0, users: 0, transactions: 0, mustahiks: 0, rootAccounts: 1 })
assert.equal(A.db.tenants.length, 0)
assert.equal(A.db.users.length, 0)
assert.equal(A.db.platformAdmins.length, 1)
assert.equal(A.db.platformAdmins[0].id, ROOT_ID)
assert.equal(JSON.stringify(A.db.platformAdmins[0].passwordAuth), rootCredential)
assert.equal(A.db.datasetProfile, 'empty')
assert.equal(settings.integrityReport().issues, 0)

// Reload against the persisted cleared DB: V5 bootstrap must not recreate US-REL or any tenant account.
const reloaded = createRuntime(runtime.localStorage.values)
assert.equal(reloaded.A.db.tenants.length, 0)
assert.equal(reloaded.A.db.users.length, 0)
assert.equal(reloaded.A.db.platformAdmins.length, 1)
assert.equal(reloaded.A.db.platformAdmins[0].id, ROOT_ID)
assert.ok(!reloaded.A.db.users.some((user) => user.id === 'US-REL'), 'the deleted Relawan must not be recreated on reload')

// A standalone Muzakki account remains usable after clearing all institutions and gets a clear explanation.
const emptyDb = reloaded.A.db
emptyDb.users.push({ id: 'US-MZK-EMPTY', tenantId: null, name: 'Muzakki Tanpa Lembaga', role: 'Muzakki', email: 'kosong@demo.invalid', active: true })
emptyDb.accounts.push({ id: 'ACC-MZK-EMPTY', userId: 'US-MZK-EMPTY', displayName: 'Muzakki Tanpa Lembaga', email: 'kosong@demo.invalid', phone: '080000000000', address: 'Alamat demo' })
reloaded.A.persist()
for (const page of ['my-zis', 'muzakki-services', 'pay-plan']) {
  reloaded.A.login('US-MZK-EMPTY', false)
  reloaded.A.state.page = page
  reloaded.A.render()
  assert.ok(reloaded.elements.app.innerHTML.includes('Belum ada Lembaga yang terdaftar'), `${page} must show the no-institution alert`)
}

// Creating a new institution after clear creates its own master territory area immediately.
reloaded.A.login(ROOT_ID, false)
const tenant = reloaded.platform.makeTenant({
  name: 'Masjid Baru Uji', email: 'masjid.baru@demo.invalid', phone: '080000000001',
  address: 'Jalan Uji No. 1', daerah: 'Kawasan Uji', adminName: 'Admin Baru',
  adminEmail: 'admin.baru@demo.invalid', adminPhone: '081211111001', status: 'aktif', city: 'Kota Uji', province: 'Jawa Barat',
})
const newArea = reloaded.A.db.areas.find((area) => area.tenantId === tenant.id)
assert.ok(newArea, 'a new tenant must receive a master area root after data clear')
assert.equal(newArea.name, 'Kawasan Uji')
assert.equal(tenant.areaId, newArea.id)
assert.deepEqual([...reloaded.A.db.rws].filter((rw) => rw.tenantId === tenant.id), [], 'RW and RT remain configurable by the new institution Admin')
const newAdmin = reloaded.A.db.users.find((user) => user.tenantId === tenant.id && user.role === 'Admin')
reloaded.A.login(newAdmin.id, false)
reloaded.A.navigate('tenant')
assert.ok(reloaded.elements.app.innerHTML.includes('Master wilayah administratif'))
assert.ok(reloaded.elements.app.innerHTML.includes('Kawasan Uji'))
assert.ok(reloaded.elements.app.innerHTML.includes('Tambahkan RW pertama'))

console.log('PASS — dataset An-Nur default, preset multi-lembaga, reset bersih hanya menyisakan Root, tidak ada Relawan yatim setelah reload, halaman Muzakki tanpa lembaga, master wilayah tenant baru, dan menu role konsisten')
