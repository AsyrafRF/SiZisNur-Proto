const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const crypto = require('node:crypto')

const root = path.resolve(__dirname, '..')
const source = [
  fs.readFileSync(path.join(root, 'js/app.js'), 'utf8'),
  fs.readFileSync(path.join(root, 'js/revision-v5.js'), 'utf8'),
].join('\n;\n')

class MemoryStorage {
  constructor() { this.values = new Map() }
  getItem(key) { return this.values.get(key) || null }
  setItem(key, value) { this.values.set(key, String(value)) }
  removeItem(key) { this.values.delete(key) }
}

const localStorage = new MemoryStorage()
const sessionStorage = new MemoryStorage()
const elements = { app: { innerHTML: '' }, 'modal-root': { innerHTML: '' }, 'toast-host': { innerHTML: '' } }
const listeners = {}
const document = {
  body: { classList: { toggle() {} } },
  getElementById(id) { return elements[id] || (elements[id] = { innerHTML: '', textContent: '' }) },
  addEventListener(type, listener) { (listeners[type] ||= []).push(listener) },
  querySelector() { return null },
  querySelectorAll() { return [] },
  createElement() { return { style: {}, click() {}, remove() {} } },
}
const window = { localStorage, sessionStorage, crypto: crypto.webcrypto, addEventListener() {}, scrollTo() {}, open() { return null } }
const context = {
  window, document, elements, localStorage, sessionStorage, console: { ...console, error() {} }, Date, Math, JSON, Map, Set,
  Blob: function Blob() {}, URL: {}, FormData: function FormData() { return { entries() { return [] } } },
  setInterval() {}, clearInterval() {}, Intl, Number, String, Object, Array, RegExp, Error, Promise,
  setTimeout() { return 0 }, clearTimeout() {}, navigator: { onLine: true, userAgent: 'period-delete-test' },
}
vm.createContext(context)
vm.runInContext(source, context, { timeout: 12000 })

const A = window.__SiZisNurBridge
assert.ok(A, 'the application bridge should be available')
A.login('US-ADM', false)
A.state.page = 'periods'

function click(action, id) {
  const button = { dataset: { action, id } }
  const event = {
    target: {
      closest(selector) { return selector === '[data-action]' ? button : null },
    },
    preventDefault() {},
  }
  for (const listener of listeners.click || []) listener(event)
}

const emptyDraft = {
  id: 'PR-EMPTY-DRAFT', tenantId: 'TN-ANNUR', name: 'Draf Kosong untuk Uji',
  status: 'draf', openedAt: null, closedAt: null,
}
A.db.periods.push(emptyDraft)
A.render()
let html = elements.app.innerHTML
assert.ok(html.includes('Hapus draf'), 'an empty draft should expose the delete action')
assert.ok(html.includes('Draf Kosong untuk Uji'))
assert.ok(!html.includes('data-action="period-delete" data-id="PR-1447"'), 'an active period must not expose delete')
assert.ok(!html.includes('data-action="period-delete" data-id="PR-1448"'), 'a draft with linked operational records must not expose delete')

click('period-delete', emptyDraft.id)
assert.equal(A.state.modal?.title, 'Hapus periode draf', 'delete must require an explicit confirmation modal')
assert.ok(elements['modal-root'].innerHTML.includes('Ya, hapus draf'))
assert.ok(A.db.periods.some((period) => period.id === emptyDraft.id), 'opening confirmation must not delete data')

click('confirm-period-delete', emptyDraft.id)
assert.ok(!A.db.periods.some((period) => period.id === emptyDraft.id), 'confirmed empty draft should be deleted')
assert.ok(A.db.audit.some((item) => item.type === 'PERIODE' && item.detail.includes('Hapus draf') && item.detail.includes(emptyDraft.id)), 'period deletion must be recorded in tenant audit')

// Seed PR-1448 is a draft but has allocations/distributions; its history must remain intact.
const linkedDraft = A.db.periods.find((period) => period.id === 'PR-1448')
assert.ok(linkedDraft && linkedDraft.status === 'draf')
const originalAllocationCount = A.db.allocations.filter((item) => item.periodId === linkedDraft.id).length
click('period-delete', linkedDraft.id)
assert.ok(A.db.periods.some((period) => period.id === linkedDraft.id), 'a linked draft cannot be deleted')
assert.equal(A.db.allocations.filter((item) => item.periodId === linkedDraft.id).length, originalAllocationCount, 'linked allocations must remain untouched')
assert.equal(A.state.modal, null, 'a linked draft should be blocked before a confirmation modal opens')

// Directly invoking the confirmation action cannot delete active or archived periods.
const archived = { id: 'PR-ARCHIVE-TEST', tenantId: 'TN-ANNUR', name: 'Arsip Uji', status: 'arsip', openedAt: '2026-01-01', closedAt: '2026-01-02' }
A.db.periods.push(archived)
click('confirm-period-delete', 'PR-1447')
click('confirm-period-delete', archived.id)
assert.ok(A.db.periods.some((period) => period.id === 'PR-1447' && period.status === 'aktif'), 'active period must remain')
assert.ok(A.db.periods.some((period) => period.id === archived.id && period.status === 'arsip'), 'archived period must remain')

// Records belonging to another tenant are not listed or operable from the active tenant.
const otherTenantDraft = { id: 'PR-OTHER-TENANT', tenantId: 'TN-ALHIKMAH', name: 'Draf Lembaga Lain', status: 'draf' }
A.db.periods.push(otherTenantDraft)
A.render()
assert.ok(!elements.app.innerHTML.includes('Draf Lembaga Lain'), 'tenant period list must remain scoped')
click('period-delete', otherTenantDraft.id)
assert.ok(A.db.periods.some((period) => period.id === otherTenantDraft.id), 'another tenant period must not be deleted')

console.log('PASS — hapus draf memerlukan konfirmasi, dibatasi pada draf kosong, menjaga data terkait, dan menolak periode aktif/arsip/lintas tenant')
