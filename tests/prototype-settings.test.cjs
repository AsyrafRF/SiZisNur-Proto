const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const crypto = require('node:crypto')

const root = path.resolve(__dirname, '..')
let source = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8')
source = source.replace(
  'render();\n})();',
  'window.__SiZisNurTest={html:()=>elements.app.innerHTML};\nrender();\n})();'
)
for (const file of ['js/revision-v5.js', 'js/platform-admin.js', 'js/public-portal.js', 'js/prototype-settings.js']) {
  source += `\n;\n${fs.readFileSync(path.join(root, file), 'utf8')}`
}

class MemoryStorage {
  constructor() { this.values = new Map() }
  getItem(key) { return this.values.get(key) || null }
  setItem(key, value) { this.values.set(key, String(value)) }
  removeItem(key) { this.values.delete(key) }
}
const localStorage = new MemoryStorage()
const sessionStorage = new MemoryStorage()
const elements = { app: { innerHTML: '' }, 'modal-root': { innerHTML: '' }, 'toast-host': { innerHTML: '' } }
const eventListeners = {}
const document = {
  body: { classList: { toggle() {} } },
  getElementById(id) { return elements[id] || (elements[id] = { innerHTML: '' }) },
  addEventListener(type, callback) { (eventListeners[type] ||= []).push(callback) }, querySelector() { return null }, querySelectorAll() { return [] },
  createElement() { return { style: {}, click() {}, remove() {}, set textContent(value) { this._text = value } } },
}
const window = {
  localStorage, sessionStorage, crypto: crypto.webcrypto,
  addEventListener() {}, scrollTo() {}, open() { return null },
}
const context = {
  window, document, elements, localStorage, sessionStorage,
  console, Date, Math, JSON, Map, Set, Blob: function Blob() {}, URL: {},
  FormData: function FormData() { this.get = () => '' }, setInterval() {}, clearInterval() {},
  Intl, Number, String, Object, Array, RegExp, Error, Promise, TextEncoder,
  setTimeout() { return 0 }, clearTimeout() {},
}
vm.createContext(context)
vm.runInContext(source, context, { timeout: 15000 })

const A = window.__SiZisNurBridge
const settings = window.__SIZISNUR_PROTOTYPE_SETTINGS
const rootAccountId = 'PA-SIZISNUR-ROOT'
assert.ok(settings, 'prototype settings module should be loaded')
assert.ok(A.db.platformAdmins.some((item) => item.id === rootAccountId))
assert.equal(A.db.mustahiks.length, 129)
const seedMustahiks = A.seed().mustahiks
const seedHash = crypto.createHash('sha256').update(JSON.stringify(seedMustahiks)).digest('hex')
assert.equal(seedHash, 'c2c2ea3fad8e7dc91cd0ed666deabcf743108b8447703af10034996759a9a2f5', 'Mustahik seed baseline must remain byte-for-byte stable')

// Current landing copy lists the seven tenant roles, with platform root kept separate.
A.state.page = 'landing'
A.render()
const landing = window.__SiZisNurTest.html()
assert.ok(landing.includes('Tujuh aktor lembaga, plus satu pengelola platform.'))
for (const role of ['Admin', 'Muzakki', 'Operator', 'Amil', 'Bendahara', 'Relawan', 'Pengurus']) assert.ok(landing.includes(`<span>${role}</span>`))
assert.ok(!landing.includes('Jelajahi enam role'))

// Only the platform root can open or execute the global prototype controls.
A.login('US-ADM', false)
assert.throws(() => settings.resetToDefault({ reload: false }), /hanya tersedia untuk Admin SiZisNur/i, 'tenant Admin must not execute global resets')
A.state.page = 'help'; A.render()
assert.ok(!window.__SiZisNurTest.html().includes('data-action="reset-demo"'), 'tenant admin help must not expose global reset')
A.state.page = 'audit'; A.render()
assert.ok(!window.__SiZisNurTest.html().includes('data-action="reset-demo"'), 'tenant admin audit must not expose global reset')
A.login(rootAccountId, false)
assert.equal(A.state.page, 'platform-admin')
assert.ok(window.__SiZisNurTest.html().includes('data-root-tab="prototype-settings"'), 'root navigation should include prototype settings')
A.state.platformTab = 'prototype-settings'
A.render()
let page = window.__SiZisNurTest.html()
for (const text of ['Pengaturan Prototype', 'Ekspor cadangan lengkap', 'Impor cadangan', 'Reset ke data bawaan', 'Hapus semua data simulasi', 'Pemeriksaan integritas sederhana']) {
  assert.ok(page.includes(text), `settings page should show ${text}`)
}
assert.ok(page.includes('Reset ke dataset default'))
assert.ok(page.includes('Hapus semua data'))
const clickProtoAction = (action) => {
  const button = { dataset: { protoAction: action } }
  const event = { target: { closest(selector) { return selector === '[data-proto-action]' ? button : null } } }
  for (const listener of eventListeners.click || []) listener(event)
}
clickProtoAction('ask-reset')
assert.ok(window.__SiZisNurTest.html().includes('Ketik <b>RESET DEFAULT</b>'))
clickProtoAction('cancel-confirm')
clickProtoAction('ask-clear')
assert.ok(window.__SiZisNurTest.html().includes('Ketik <b>HAPUS SEMUA</b>'))
clickProtoAction('cancel-confirm')

const liveDb = A.db
const oldTransactionCount = liveDb.transactions.length
const baselineMustahikJson = JSON.stringify(liveDb.mustahiks)
assert.equal(settings.integrityReport().issues, 0, 'default seed should have no orphaned transaction/tenant relationships')

// Reset restores current seed, including Mustahik rows, without replacing the DB object.
const resetSummary = settings.resetToDefault({ reload: false })
assert.equal(A.db, liveDb, 'database object reference must remain stable for other modules')
assert.equal(resetSummary.tenants, 2)
assert.equal(resetSummary.mustahiks, 129)
assert.equal(JSON.stringify(A.db.mustahiks), baselineMustahikJson, 'reset must restore the unchanged Mustahik seed')
assert.equal(A.db.users.some((item) => item.id === 'US-REL'), true, 'Relawan is part of the default dataset')
assert.equal(A.user().id, rootAccountId, 'root session remains active after reset')

// Export and import round-trip restores the complete V5 database.
A.db.transactions.push({ id: 'TR-TEST-ONLY', tenantId: 'TN-ANNUR', periodId: 'PR-1447', serial: 'TEST-001', personId: 'PS-01', lines: [], status: 'tercatat' })
A.persist()
const exported = settings.backupPayload()
assert.equal(exported.format, 'SIZISNUR-PROTOTYPE-BACKUP')
const disabledRootBackup = JSON.parse(JSON.stringify(exported))
disabledRootBackup.data.platformAdmins[0].active = false
disabledRootBackup.data.platformAdmins[0].scope = 'tenant'
disabledRootBackup.data.platformAdmins[0].role = 'Admin'
disabledRootBackup.data.users.push({ id: rootAccountId, tenantId: 'TN-ANNUR', role: 'Admin' })
const safeImported = settings.parseBackup(disabledRootBackup)
assert.equal(safeImported.platformAdmins[0].active, true, 'import normalization must preserve root access')
assert.equal(safeImported.platformAdmins[0].scope, 'platform')
assert.ok(!safeImported.users.some((item) => item.id === rootAccountId), 'root account must not be imported into tenant users')
assert.equal(exported.data.transactions.length, oldTransactionCount + 1)
const expectedImported = JSON.stringify(exported.data)
settings.prepareImport(JSON.stringify(exported))
assert.ok(window.__SiZisNurTest.html().includes('KONFIRMASI IMPOR'))
settings.clearAllData({ reload: false })
assert.equal(A.db.tenants.length, 0)
assert.equal(A.db.mustahiks.length, 0)
for (const key of ['accounts','households','muzakkiMemberships','supportTickets','journalEntries','syncQueue','periodReports','areas','rws','rts']) assert.deepEqual(Array.from(A.db[key] || []), [], `${key} should be an empty initialized collection after clear-all`)
assert.equal(A.db.platformAdmins.length, 1)
assert.equal(A.db.platformAdmins[0].id, rootAccountId)
assert.equal(A.user().id, rootAccountId)
settings.prepareImport(exported)
settings.applyImport({ reload: false })
assert.equal(JSON.stringify(A.db), JSON.stringify(settings.normalizeImportedDatabase(exported.data)), 'import should restore exact database contents after schema normalization')
assert.equal(A.db.transactions.length, oldTransactionCount + 1)
assert.equal(A.db.mustahiks.length, 129)

// Invalid imports must fail before any live data is changed.
const beforeInvalidImport = JSON.stringify(A.db)
assert.throws(() => settings.prepareImport('{not json'), /JSON yang valid/)
assert.throws(() => settings.prepareImport({ version: 4, tenants: [], users: [], persons: [], mustahiks: [], transactions: [] }), /Versi database tidak didukung/)
assert.equal(JSON.stringify(A.db), beforeInvalidImport)

// Clear-all removes all simulated operational collections but preserves the root access account.
const cleared = settings.clearAllData({ reload: false })
assert.deepEqual(JSON.parse(JSON.stringify(cleared)), { tenants: 0, users: 0, transactions: 0, mustahiks: 0, rootAccounts: 1 })
assert.equal(A.db.tenants.length, 0)
assert.equal(A.db.users.length, 0)
assert.equal(A.db.transactions.length, 0)
assert.equal(A.db.mustahiks.length, 0)
for (const key of ['accounts','households','muzakkiMemberships','supportTickets','journalEntries','syncQueue','periodReports','areas','rws','rts']) assert.deepEqual(Array.from(A.db[key] || []), [], `${key} should be an empty initialized collection after clear-all`)
assert.equal(A.db.platformAdmins.length, 1)
assert.equal(A.user().id, rootAccountId)
assert.ok(window.__SiZisNurTest.html().includes('Pengaturan Prototype'), 'root remains in prototype settings after clearing all demo data')

console.log('PASS — halaman pengaturan prototype, ekspor/impor JSON, reset seed, hapus semua data, integritas referensi, sesi root, dan perlindungan dataset Mustahik tervalidasi')
