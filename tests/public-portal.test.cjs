const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const crypto = require('node:crypto')

const root = path.resolve(__dirname, '..')
let source = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8')
source = source.replace('render();\n})();', 'window.__SiZisNurTest={html:()=>elements.app.innerHTML};\nrender();\n})();')
source += '\n' + fs.readFileSync(path.join(root, 'js/revision-v5.js'), 'utf8')
source += ';\n' + fs.readFileSync(path.join(root, 'js/platform-admin.js'), 'utf8')
source += ';\n' + fs.readFileSync(path.join(root, 'js/public-portal.js'), 'utf8')

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
  getElementById(id) { return elements[id] || (elements[id] = { innerHTML: '', hidden: false }) },
  addEventListener() {}, querySelector() { return null }, querySelectorAll() { return [] },
  createElement() { return { style: {}, click() {}, remove() {} } },
}
const window = { localStorage, sessionStorage, crypto: crypto.webcrypto, addEventListener() {}, scrollTo() {}, open() { return null }, clearTimeout() {}, setTimeout() { return 0 } }
const context = {
  window, document, elements, localStorage, sessionStorage, console, Date, Math, JSON, Map, Set,
  Blob: function Blob() {}, URL: {}, FormData: function FormData() {}, setInterval() {}, clearInterval() {},
  Intl, Number, String, Object, Array, RegExp, Error, Promise, setTimeout() { return 0 }, clearTimeout() {},
  navigator: {}, location: { protocol: 'file:' },
}
vm.createContext(context)
vm.runInContext(source, context, { timeout: 10000 })

const A = window.__SiZisNurBridge
const db = A.db
const publicPortal = window.__SIZISNUR_PUBLIC_PORTAL
assert.ok(publicPortal, 'public portal module should register')

// The unauthenticated public route is accessible without a tenant login.
A.state.page = 'public'
A.render()
assert.ok(elements.app.innerHTML.includes('Portal Publik SiZisNur'))
assert.ok(elements.app.innerHTML.includes('Masjid An-Nur Villa Pesona Asri'))
assert.ok(elements.app.innerHTML.includes('Masjid Al-Hikmah'))
assert.ok(elements.app.innerHTML.includes('Verifikasi struk publik'))
assert.ok(elements.app.innerHTML.includes('public-camera'), 'public camera scanner should be available')
assert.ok(elements.app.innerHTML.includes('public-scan-token'), 'manual token entry should remain available')
assert.ok(!elements.app.innerHTML.includes('demo@annur.invalid'), 'tenant email must not be public')
assert.ok(!elements.app.innerHTML.includes('0778-000000'), 'tenant phone must not be public')

// Aggregate public transparency contains confirmed transactions only.
const baselineAnnur = publicPortal.aggregate('TN-ANNUR')
db.transactions.push({
  id: 'TR-PUBLIC-001', tenantId: 'TN-ANNUR', serial: 'AM-001-PUBLIC', personId: 'PRIVATE-PERSON-001',
  status: 'paid', createdAt: '2026-11-14T08:00:00.000Z',
  lines: [{ category: 'Zakat Fitrah', type: 'uang', value: 100000 }, { category: 'Infak/Sedekah', type: 'uang', value: 5000 }],
})
db.transactions.push({
  id: 'TR-PUBLIC-002', tenantId: 'TN-ANNUR', serial: 'AM-002-PENDING', personId: 'PRIVATE-PERSON-002',
  status: 'pending', createdAt: '2026-11-14T08:10:00.000Z',
  lines: [{ category: 'Zakat Maal', type: 'uang', value: 900000 }],
})
db.distributions.push({ id: 'DS-PUBLIC-001', tenantId: 'TN-ANNUR', status: 'tersalurkan', money: 25000, rice: 2.5, mustahikId: 'PRIVATE-MUSTAHIK-001' })
let annurAggregate = publicPortal.aggregate('TN-ANNUR')
assert.equal(annurAggregate.transactions, baselineAnnur.transactions + 1, 'only the added Amil-confirmed transaction belongs in public totals; pending is excluded')
assert.equal(annurAggregate.received.money, baselineAnnur.received.money + 105000)
assert.equal(annurAggregate.distributionCount, baselineAnnur.distributionCount + 1)
assert.equal(annurAggregate.distributed.money, baselineAnnur.distributed.money + 25000)

// Exact QR binds tenant, transaction ID, and serial; individual identity and amounts stay hidden.
const token = 'SIZISNUR|TN-ANNUR|TR-PUBLIC-001|AM-001-PUBLIC'
const verified = publicPortal.verifyPublicToken(token)
assert.match(verified, /STRUK VALID/)
assert.match(verified, /Masjid An-Nur Villa Pesona Asri/)
assert.match(verified, /AM-001-PUBLIC/)
assert.doesNotMatch(verified, /PRIVATE-PERSON-001/)
assert.doesNotMatch(verified, /100\.000/)

const pending = publicPortal.verifyPublicToken('SIZISNUR|TN-ANNUR|TR-PUBLIC-002|AM-002-PENDING')
assert.match(pending, /BELUM TERVAKLIDASI/)
assert.doesNotMatch(pending, /STRUK VALID/)

// Suspended and unpublished tenants do not appear or pass public QR verification.
const hidden = A.db.tenants.find((item) => item.id === 'TN-ALHIKMAH')
hidden.publicPortalEnabled = false
assert.ok(!publicPortal.publicTenants().some((item) => item.id === 'TN-ALHIKMAH'))
assert.match(publicPortal.verifyPublicToken('SIZISNUR|TN-ALHIKMAH|TR-NOPE|X'), /Tenant asal tidak tersedia/)
hidden.publicPortalEnabled = true
hidden.status = 'ditangguhkan'
assert.ok(!publicPortal.publicTenants().some((item) => item.id === 'TN-ALHIKMAH'))
hidden.status = 'aktif'

// Serial collisions are rejected unless the complete QR token is scanned.
db.transactions.push({ id: 'TR-PUBLIC-003', tenantId: 'TN-ALHIKMAH', serial: 'AM-001-PUBLIC', status: 'paid', lines: [], createdAt: '2026-11-14T09:00:00.000Z' })
assert.match(publicPortal.verifyPublicToken('AM-001-PUBLIC'), /lebih dari satu tenant/)
assert.match(publicPortal.verifyPublicToken('SIZISNUR|TN-ANNUR|TR-PUBLIC-001|WRONG-SERIAL'), /QR tidak cocok/)

// Platform Admin can control visibility per tenant; new active tenants are listed by default.
const created = window.__SIZISNUR_PLATFORM_ADMIN.makeTenant({
  name: 'UPZ Uji Transparansi', adminName: 'Admin Uji', adminEmail: 'admin.transparansi@example.invalid',
  email: 'kontak@example.invalid', status: 'aktif', daerah: 'Kota Uji',
})
assert.equal(created.publicPortalEnabled, true)
assert.ok(publicPortal.publicTenants().some((item) => item.id === created.id))
created.publicPortalEnabled = false
assert.ok(!publicPortal.publicTenants().some((item) => item.id === created.id))

console.log('PASS — portal publik multi-tenant, agregat tanpa identitas, verifikasi QR lintas tenant, status validasi, serta kontrol visibilitas root')
