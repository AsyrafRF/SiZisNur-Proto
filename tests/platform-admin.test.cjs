const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const crypto = require('node:crypto')

const root = path.resolve(__dirname, '..')
let source = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8')
source = source.replace('render();\n})();', 'window.__SiZisNurTest={html:()=>elements.app.innerHTML,modalHtml:()=>elements["modal-root"].innerHTML};\nrender();\n})();')
source += ';\n' + fs.readFileSync(path.join(root, 'js/revision-v5.js'), 'utf8')
source += ';\n' + fs.readFileSync(path.join(root, 'js/platform-admin.js'), 'utf8')

class MemoryStorage {
  constructor() { this.values = new Map() }
  getItem(key) { return this.values.get(key) || null }
  setItem(key, value) { this.values.set(key, String(value)) }
  removeItem(key) { this.values.delete(key) }
}
const localStorage = new MemoryStorage()
const sessionStorage = new MemoryStorage()
const elements = { app: { innerHTML: '' }, 'modal-root': { innerHTML: '' } }
const document = {
  body: { classList: { toggle() {} } },
  getElementById(id) { return elements[id] || (elements[id] = { innerHTML: '' }) },
  addEventListener() {}, querySelector() { return null }, querySelectorAll() { return [] },
  createElement() { return { style: {}, click() {}, remove() {}, set textContent(value) { this._text = value } } },
}
const window = { localStorage, sessionStorage, crypto: crypto.webcrypto, addEventListener() {}, scrollTo() {}, open() { return null } }
const context = {
  window, document, elements, localStorage, sessionStorage, console, Date, Math, JSON, Map, Set,
  Blob: function Blob() {}, URL: {}, FormData: function FormData() {}, setInterval() {}, clearInterval() {},
  Intl, Number, String, Object, Array, RegExp, Error, Promise, setTimeout() { return 0 }, clearTimeout() {},
}
vm.createContext(context)
vm.runInContext(source, context, { timeout: 10000 })

const bridge = window.__SiZisNurBridge
const app = window.__SiZisNurTest
const db = bridge.db
bridge.state.page = 'login'
bridge.render()
const rootAccount = db.platformAdmins.find((item) => item.id === 'PA-SIZISNUR-ROOT')
assert.ok(rootAccount, 'Root account should be seeded')
assert.equal(rootAccount.role, 'Admin SiZisNur')
assert.equal(rootAccount.scope, 'platform')
assert.equal(rootAccount.tenantId, undefined, 'Root account must not be bound to a lembaga')
assert.ok(!db.users.some((item) => item.id === rootAccount.id), 'Root account must not be in lembaga users collection')
assert.ok(app.html().includes('Admin SiZisNur'), 'Root account should appear on the demo login screen')
assert.ok(app.html().includes('Konsol tingkat root'))

// The retired public platform-approval route must no longer expose application decisions.
bridge.state.page = 'platform'
bridge.render()
assert.equal(bridge.state.page, 'public')
assert.ok(!app.html().includes('Verifikasi Pengajuan Lembaga — Demo'))
assert.ok(!app.html().includes('data-action="platform-review"'))

bridge.login(rootAccount.id, false)
assert.equal(bridge.user().role, 'Admin SiZisNur')
assert.equal(bridge.state.page, 'platform-admin')
assert.ok(app.html().includes('Ringkasan Platform'))
assert.ok(app.html().includes('Lembaga terdaftar'))
assert.ok(app.html().includes('Pengaturan sistem'))
assert.ok(app.html().includes('Audit platform'))
bridge.state.platformTab = 'tenants'
bridge.state.selectedPlatformTenant = 'TN-ANNUR'
bridge.render()
assert.ok(app.html().includes('Tampilkan lembaga pada Portal Publik'))
assert.ok(app.html().includes('publicPortalEnabled'))

const initialTenantCount = db.tenants.length
const created = window.__SIZISNUR_PLATFORM_ADMIN.makeTenant({
  name: 'Lembaga Uji Root', adminName: 'Admin Lembaga Uji', adminEmail: 'admin.lembaga-uji@example.invalid',
  email: 'lembaga-uji@example.invalid', address: 'Alamat simulasi', daerah: 'Daerah Uji', status: 'aktif',
})
assert.equal(db.tenants.length, initialTenantCount + 1)
assert.equal(db.users.filter((item) => item.tenantId === created.id && item.role === 'Admin').length, 1)
assert.equal(created.publicPortalEnabled, true, 'active lembaga are publicly listed by default')
assert.ok(db.platformAudit.some((item) => item.type === 'TENANT_CREATED' && item.detail.includes('Lembaga Uji Root')))
assert.equal(JSON.stringify(window.__SIZISNUR_PLATFORM_ADMIN.tenantMetrics(created.id)), JSON.stringify({ users: 1, admins: 1, transactions: 0, pending: 0, verified: 0 }))

bridge.state.platformTab = 'overview'
bridge.state.selectedPlatformTenant = null
bridge.render()
assert.ok(app.html().includes('Lembaga Uji Root'), 'New lembaga should be visible in platform overview')

// Lembaga suspension blocks its users without deleting its data.
const originalStatus = db.tenants.find((item) => item.id === 'TN-ANNUR').status
db.tenants.find((item) => item.id === 'TN-ANNUR').status = 'ditangguhkan'
bridge.login('US-ADM', false)
assert.ok(app.html().includes('AKSES LEMBAGA DIBATASI'))
assert.ok(app.html().includes('ditangguhkan'))
db.tenants.find((item) => item.id === 'TN-ANNUR').status = originalStatus

// The root actor remains separate after switching back to the platform workspace.
bridge.login(rootAccount.id, false)
assert.ok(app.html().includes('KONSOL PLATFORM / ROOT'))
assert.equal(db.platformAdmins.length, 1)

console.log('PASS — akun root terpisah, konsol lembaga, pengelolaan lembaga, audit platform, dan blokir akses lembaga yang ditangguhkan')
