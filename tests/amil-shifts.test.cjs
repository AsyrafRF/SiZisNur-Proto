const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const crypto = require('node:crypto')
const { TextEncoder } = require('node:util')
process.env.TZ = 'Asia/Jakarta'

const root = path.join(__dirname, '..')
let source = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8').replace(/\r\n/g, '\n')
source = source.replace(
  'render();\n})();',
  'window.__SiZisNurTest = { html: () => elements.app.innerHTML, modalHtml: () => elements["modal-root"].innerHTML };\nrender();\n})();'
)
source += '\n' + fs.readFileSync(path.join(root, 'js/revision-v5.js'), 'utf8')

class MemoryStorage {
  constructor() { this.values = new Map() }
  getItem(key) { return this.values.get(key) || null }
  setItem(key, value) { this.values.set(key, String(value)) }
  removeItem(key) { this.values.delete(key) }
}

const localStorage = new MemoryStorage()
const sessionStorage = new MemoryStorage()
const elements = { app: { innerHTML: '' }, 'modal-root': { innerHTML: '' }, 'toast-host': { innerHTML: '' } }
const documentListeners = {}
const windowListeners = {}
const downloads = []
const blobs = []
let objectUrlSequence = 0
const document = {
  body: { classList: { toggle() {} }, appendChild() {} },
  getElementById(id) { return elements[id] || (elements[id] = { innerHTML: '', textContent: '', dataset: {}, value: '' }) },
  addEventListener(type, listener) { (documentListeners[type] ||= []).push(listener) },
  querySelector() { return null },
  querySelectorAll() { return [] },
  createElement(tag) {
    return {
      tagName: tag.toUpperCase(), style: {}, href: '', download: '',
      click() { downloads.push({ name: this.download, href: this.href }) },
      remove() {},
    }
  },
}
const window = {
  localStorage, sessionStorage, crypto: crypto.webcrypto,
  addEventListener(type, listener) { (windowListeners[type] ||= []).push(listener) },
  scrollTo() {}, open() { return null },
}
const URLMock = {
  createObjectURL(blob) { blobs.push(blob); return `blob:test-${++objectUrlSequence}` },
  revokeObjectURL() {},
}
const context = {
  window, document, elements, localStorage, sessionStorage,
  navigator: { onLine: true, userAgent: 'amil-shifts-test' },
  console: { ...console, error() {} }, Date, Math, JSON, Map, Set, Blob, URL: URLMock,
  FormData: function FormData() {}, TextEncoder, Uint8Array, DataView,
  setInterval() { return 1 }, clearInterval() {}, Intl, Number, String, Object, Array,
  RegExp, Error, Promise, setTimeout() { return 0 }, clearTimeout() {},
}
vm.createContext(context)
vm.runInContext(source, context, { timeout: 10000 })

const bridge = window.__SiZisNurBridge
const db = bridge.db
const app = window.__SiZisNurTest

async function clickV5(key, id = '') {
  const button = { dataset: { v5Action: key, id } }
  button.closest = (selector) => selector === '[data-v5-action]' ? button : null
  const event = { target: button, preventDefault() {}, stopPropagation() {} }
  for (const listener of documentListeners.click || []) await listener(event)
}
function addTransaction({ id, tenantId, shiftId, status = 'paid', money = 0, rice = 0, personId = 'PS-01' }) {
  db.transactions.push({
    id, serial: `S-${id}`, tenantId, shiftId, personId, status,
    createdAt: '2026-11-27T09:00:00.000Z', verifiedAt: '2026-11-27T09:05:00.000Z',
    lines: [
      ...(money ? [{ category: 'Zakat Fitrah', type: 'uang', value: money }] : []),
      ...(rice ? [{ category: 'Zakat Fitrah', type: 'beras', value: rice }] : []),
    ],
  })
}
function addShift({ id, tenantId = 'TN-ANNUR', amilId, openedAt = '2026-11-27T08:00:00.000Z', status = 'closed', closedAt = '2026-11-27T10:00:00.000Z' }) {
  const shift = { id, tenantId, amilId, openedAt, openedAtLabel: openedAt, closedAt: status === 'open' ? null : closedAt, status }
  db.shiftSessions.push(shift)
  return shift
}
function html() { return app.html() }

;(async () => {
// Starting a shift uses the existing Amil transaction-page button and creates a system record.
bridge.login('US-AML')
bridge.navigate('transactions')
assert.ok(html().includes('Mulai Shift'), 'existing transaction page exposes Mulai Shift')
assert.ok(!html().includes('Insentif Amil'))
await clickV5('shift-open')
const activeShift = db.shiftSessions.find((shift) => shift.amilId === 'US-AML' && shift.status === 'open')
assert.ok(activeShift, 'Mulai Shift creates a new active shift automatically')
assert.ok(activeShift.openedAt, 'shift stores an exact start timestamp')

// Transaction accounting follows the existing shiftId assignment contract.
addTransaction({ id: 'TX-SHIFT-PAID', tenantId: 'TN-ANNUR', shiftId: activeShift.id, money: 120000, rice: 2.5 })
addTransaction({ id: 'TX-SHIFT-PENDING', tenantId: 'TN-ANNUR', shiftId: activeShift.id, status: 'pending', money: 990000, rice: 9 })
db.corrections.push({ id: 'COR-SHIFT-1', tenantId: 'TN-ANNUR', transactionId: 'TX-SHIFT-PAID', status: 'disetujui', deltaMoney: 5000, deltaRice: 0.5 })
const amil2Shift = addShift({ id: 'SH-AMIL-2', amilId: 'US-AML2' })
addTransaction({ id: 'TX-AMIL-2', tenantId: 'TN-ANNUR', shiftId: amil2Shift.id, money: 250000, rice: 1 })
const midnightJakartaShift = addShift({ id: 'SH-MIDNIGHT-JAKARTA', amilId: 'US-AML', openedAt: '2026-11-26T17:30:00.000Z' })
db.users.push({ id: 'US-T2-AML', tenantId: 'TN-ALHIKMAH', name: 'Amil Tenant Lain', role: 'Amil', active: true })
const otherTenantShift = addShift({ id: 'SH-OTHER-TENANT', tenantId: 'TN-ALHIKMAH', amilId: 'US-T2-AML' })
addTransaction({ id: 'TX-OTHER-TENANT', tenantId: 'TN-ALHIKMAH', shiftId: otherTenantShift.id, money: 880000, rice: 8 })

// Amil scope must remain personal even if a different amilId filter is tampered into local state.
bridge.state.filters.shiftTracking = { amilId: 'US-AML2', from: '', to: '', status: 'all', sort: 'opened-desc' }
bridge.navigate('schedule')
let page = html()
assert.ok(page.includes('Pelacakan Shift Amil'))
assert.ok(page.includes('Anda hanya dapat melihat shift dan transaksi pelayanan milik akun Amil'))
assert.ok(page.includes(activeShift.id))
assert.ok(!page.includes(amil2Shift.id), 'Amil never sees another amil shift, even if filter state contains another user id')
assert.ok(!page.includes('SH-OTHER-TENANT'), 'tenant scoping hides another institution')
assert.ok(!page.includes('shift-filter-amil'), 'Amil cannot choose another amil filter')
assert.ok(page.includes('Unduh CSV') && page.includes('Unduh XLSX'))
assert.ok(page.includes('Total uang') && page.includes('Total beras'))
assert.ok(page.includes('Mulai Shift') && !page.includes('Buat jadwal'))
assert.ok(page.includes('125.000'), 'approved correction is included in the shift money total')
assert.ok(page.includes('3 kg'), 'approved correction is included in the shift rice total')
bridge.state.filters.shiftTracking = { amilId: '', from: '2026-11-27', to: '2026-11-27', status: 'all', sort: 'opened-desc' }
bridge.navigate('schedule')
page = html()
assert.ok(page.includes(midnightJakartaShift.id), 'date filters use local calendar dates, not the UTC date stored in ISO timestamps')
assert.ok(!page.includes(amil2Shift.id), 'local-date filtering still applies to records in scope')
bridge.state.filters.shiftTracking = { amilId: '', from: '', to: '', status: 'all', sort: 'opened-desc' }
bridge.navigate('schedule')

// Shift detail displays only counted transactions, not Pending records.
await clickV5('shift-detail', activeShift.id)
assert.ok(app.modalHtml().includes('TX-SHIFT-PAID'))
assert.ok(!app.modalHtml().includes('TX-SHIFT-PENDING'))

// CSV export follows the same personal scope and contains a filtered total row.
await clickV5('export-shifts-csv')
assert.ok(downloads.some((item) => item.name.endsWith('.csv')))
const csvBlob = blobs[blobs.length - 1]
const csvText = await csvBlob.text()
assert.ok(csvText.includes(activeShift.id))
assert.ok(!csvText.includes(amil2Shift.id))
assert.ok(csvText.includes('TOTAL HASIL FILTER'))

// XLSX is generated as an Office Open XML workbook.
await clickV5('export-shifts-xlsx')
assert.ok(downloads.some((item) => item.name.endsWith('.xlsx')))
assert.equal(blobs[blobs.length - 1].type, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
const xlsxBytes = Buffer.from(await blobs[blobs.length - 1].arrayBuffer())
assert.equal(xlsxBytes.readUInt32LE(0), 0x04034b50, 'XLSX begins with a valid ZIP local-file header')
const xlsxEntries = new Map()
let zipOffset = 0
while (xlsxBytes.readUInt32LE(zipOffset) === 0x04034b50) {
  const fileSize = xlsxBytes.readUInt32LE(zipOffset + 18)
  const nameLength = xlsxBytes.readUInt16LE(zipOffset + 26)
  const extraLength = xlsxBytes.readUInt16LE(zipOffset + 28)
  const nameStart = zipOffset + 30
  const dataStart = nameStart + nameLength + extraLength
  const name = xlsxBytes.subarray(nameStart, nameStart + nameLength).toString('utf8')
  xlsxEntries.set(name, xlsxBytes.subarray(dataStart, dataStart + fileSize).toString('utf8'))
  zipOffset = dataStart + fileSize
}
assert.ok(xlsxEntries.has('[Content_Types].xml') && xlsxEntries.has('xl/workbook.xml') && xlsxEntries.has('xl/worksheets/sheet1.xml'))
assert.ok(xlsxEntries.get('xl/worksheets/sheet1.xml').includes('TOTAL HASIL FILTER'))
assert.ok(xlsxEntries.get('xl/worksheets/sheet1.xml').includes(activeShift.id), 'XLSX contains the same scoped shift report')

// Switching accounts closes every active shift before the new account becomes active.
const duplicateOpenShift = addShift({ id: 'SH-AMIL-LEGACY-OPEN', amilId: 'US-AML', status: 'open' })
bridge.login('US-ADM')
assert.equal(activeShift.status, 'closed')
assert.equal(activeShift.closeReason, 'account-switch')
assert.equal(activeShift.transactionCount, 1)
assert.equal(activeShift.moneyTotal, 125000)
assert.equal(activeShift.riceTotal, 3)
assert.equal(duplicateOpenShift.status, 'closed', 'legacy duplicate open shifts are all closed on account switch')
assert.equal(duplicateOpenShift.closeReason, 'account-switch')

// Admin can see every shift within the active tenant, but never another tenant.
bridge.state.filters.shiftTracking = { amilId: '', from: '', to: '', status: 'all', sort: 'transactions-desc' }
bridge.navigate('schedule')
page = html()
assert.ok(page.includes(activeShift.id) && page.includes(amil2Shift.id))
assert.ok(!page.includes(otherTenantShift.id))
assert.ok(page.includes('shift-filter-amil'))
assert.ok(page.includes('Transaksi terbanyak'))
bridge.state.filters.shiftTracking.amilId = 'US-AML2'
bridge.navigate('schedule')
page = html()
assert.ok(page.includes(amil2Shift.id))
assert.ok(!page.includes(activeShift.id), 'Admin Amil filter narrows the displayed data')

// Pengurus has the same read-only review scope; no shift-management form is provided.
bridge.login('US-PGR')
bridge.state.filters.shiftTracking = { amilId: '', from: '', to: '', status: 'all', sort: 'opened-desc' }
bridge.navigate('schedule')
page = html()
assert.ok(page.includes(activeShift.id) && page.includes(amil2Shift.id))
assert.ok(page.includes('read-only') || page.includes('Baca saja') || page.includes('seluruh shift'))
assert.ok(!page.includes('data-v5-action=\"shift-open\"'))

// Explicit logout closes the active shift and stores the final totals before session removal.
bridge.login('US-AML')
bridge.navigate('transactions')
await clickV5('shift-open')
const logoutShift = db.shiftSessions.find((shift) => shift.amilId === 'US-AML' && shift.status === 'open')
addTransaction({ id: 'TX-LOGOUT', tenantId: 'TN-ANNUR', shiftId: logoutShift.id, money: 45000, rice: 1.5 })
bridge.logout()
assert.equal(logoutShift.status, 'closed')
assert.equal(logoutShift.closeReason, 'logout')
assert.equal(logoutShift.transactionCount, 1)
assert.equal(logoutShift.moneyTotal, 45000)
assert.equal(logoutShift.riceTotal, 1.5)
assert.equal(bridge.session, null)

// Leaving the page triggers the browser's pagehide fallback while the Amil session is still active.
bridge.login('US-AML')
bridge.navigate('transactions')
await clickV5('shift-open')
const pagehideShift = db.shiftSessions.find((shift) => shift.amilId === 'US-AML' && shift.status === 'open')
for (const listener of windowListeners.pagehide || []) listener()
assert.equal(pagehideShift.status, 'closed')
assert.equal(pagehideShift.closeReason, 'pagehide')

// The retired incentive route is not available to any actor.
assert.equal(bridge.PAGES.incentives, undefined)
for (const roleId of ['US-ADM', 'US-AML', 'US-BEN', 'US-PGR']) {
  bridge.login(roleId)
  assert.equal(bridge.can('incentives'), false)
}

console.log('PASS — shift otomatis, relasi transaksi, koreksi total, batas akses Amil/Admin/Pengurus, filter, ekspor CSV/XLSX, logout, pergantian akun, dan pagehide')
})().catch((error) => { console.error(error); process.exitCode = 1 })
