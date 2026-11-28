const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const crypto = require('node:crypto')

const projectRoot = path.resolve(__dirname, '..')
let source = fs.readFileSync(path.join(projectRoot, 'js/app.js'), 'utf8').replace(/\r\n/g, '\n')
source = source.replace(
  'render();\n})();',
  'window.__SiZisNurTest={html:()=>elements.app.innerHTML,modalHtml:()=>elements["modal-root"].innerHTML};\nrender();\n})();'
)
for (const file of ['js/revision-v5.js', 'js/platform-admin.js']) {
  source += `\n;\n${fs.readFileSync(path.join(projectRoot, file), 'utf8')}`
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
const listeners = {}
const document = {
  body: { classList: { toggle() {} } },
  getElementById(id) { return elements[id] || (elements[id] = { innerHTML: '' }) },
  addEventListener(type, callback) { (listeners[type] ||= []).push(callback) },
  querySelector() { return null },
  querySelectorAll() { return [] },
  createElement() { return { style: {}, click() {}, remove() {}, set textContent(value) { this._text = value } } },
}
const window = {
  localStorage, sessionStorage, crypto: crypto.webcrypto,
  addEventListener() {}, scrollTo() {}, open() { return null },
}
class TestFormData {
  constructor(form) { this.values = form.values || {} }
  entries() { return Object.entries(this.values)[Symbol.iterator]() }
}
const context = {
  window, document, elements, localStorage, sessionStorage, navigator: { onLine: true, userAgent: 'support-ticket-test' },
  console, Date, Math, JSON, Map, Set, Blob: function Blob() {}, URL: {},
  FormData: TestFormData, setInterval() {}, clearInterval() {},
  Intl, Number, String, Object, Array, RegExp, Error, Promise, TextEncoder,
  setTimeout() { return 0 }, clearTimeout() {},
}
vm.createContext(context)
vm.runInContext(source, context, { timeout: 20000 })

const A = window.__SiZisNurBridge
const db = A.db
const rootId = 'PA-SIZISNUR-ROOT'

function makeForm(kind, values, id) {
  const form = {
    dataset: { [kind === 'root' ? 'rootForm' : 'v5Form']: kind === 'root' ? 'ticket-reply' : values.formType },
    values: { ...values },
    closest(selector) {
      if (selector === 'form[data-v5-form]' && kind === 'v5') return this
      if (selector === 'form[data-root-form]' && kind === 'root') return this
      return null
    },
    querySelectorAll() { return [] },
    closestParent() { return null },
  }
  if (id) form.dataset.id = id
  return form
}

function fireSubmit(form) {
  let prevented = false
  const event = { target: form, preventDefault() { prevented = true } }
  for (const listener of listeners.submit || []) listener(event)
  assert.equal(prevented, true, 'ticket form submission should be handled by the application')
}

function clickRootAction(action, id) {
  const button = {
    dataset: { rootAction: action, id },
    closest(selector) {
      if (selector === '[data-root-ticket-filter]' || selector === '[data-root-tab]') return null
      if (selector === '[data-root-action]') return this
      return null
    },
  }
  for (const listener of listeners.click || []) listener({ target: button })
}

assert.ok(db.platformAdmins.some((user) => user.id === rootId && user.scope === 'platform'))
assert.equal(db.platformAdmins.find((user) => user.id === rootId).tenantId, undefined)
assert.ok(!db.users.some((user) => user.id === rootId), 'root remains separate from tenant users')

// Create one ticket from the tenant Admin account.
A.login('US-ADM', false)
A.state.page = 'help'
A.render()
fireSubmit(makeForm('v5', {
  formType: 'support', kind: 'help', priority: 'normal',
  subject: 'Tidak bisa membuka laporan', description: 'Menu laporan berhenti saat dibuka.',
  contact: 'admin@annur.example.invalid',
}))
const firstTicket = db.supportTickets.find((ticket) => ticket.subject === 'Tidak bisa membuka laporan')
assert.ok(firstTicket, 'tenant support form should create a ticket')
assert.equal(firstTicket.tenantId, 'TN-ANNUR')
assert.equal(firstTicket.userId, 'US-ADM')
assert.equal(firstTicket.status, 'baru')
assert.equal(firstTicket.messages.length, 1)
assert.equal(firstTicket.messages[0].senderScope, 'tenant')
assert.ok(db.syncQueue.some((event) => event.type === 'support.created' && event.tenantId === 'TN-ANNUR'))

// Add another user's ticket and another tenant's ticket to verify scope boundaries.
db.users.push({ id: 'US-OPR-TICKET', tenantId: 'TN-ANNUR', name: 'Operator Uji', role: 'Operator', active: true })
db.supportTickets.push({
  id: 'SP-OTHER-USER', tenantId: 'TN-ANNUR', userId: 'US-OPR-TICKET', createdByName: 'Operator Uji',
  role: 'Operator', kind: 'feedback', priority: 'normal', subject: 'Masukan Operator',
  description: 'Saran dari Operator.', status: 'baru', createdAt: new Date().toISOString(),
})
db.tenants.push({ id: 'TN-OTHER', name: 'Lembaga Uji Kedua', status: 'aktif' })
db.supportTickets.push({
  id: 'SP-OTHER-TENANT', tenantId: 'TN-OTHER', userId: 'US-EXT', createdByName: 'Pengguna Lembaga Kedua',
  role: 'Admin', kind: 'bug', priority: 'high', subject: 'Gangguan lembaga kedua',
  description: 'Tampilan tidak terbuka.', status: 'baru', createdAt: new Date().toISOString(),
})

// Tenant users only see their own tickets; tenant Admin can oversee its tenant's tickets.
A.login('US-OPR-TICKET', false)
A.state.page = 'help'
A.render()
let html = window.__SiZisNurTest.html()
assert.ok(!html.includes('Tidak bisa membuka laporan'), 'non-admin tenant users must not see another user’s ticket')
assert.ok(!html.includes('SP-OTHER-TENANT'), 'tenant users must not see tickets from another tenant')

A.login('US-ADM', false)
A.state.page = 'help'
A.render()
html = window.__SiZisNurTest.html()
assert.ok(html.includes('Tidak bisa membuka laporan'))
assert.ok(html.includes('Masukan Operator'), 'tenant Admin should see tickets created by other users in the same tenant')

// Root sees the cross-tenant inbox and the ticket origin.
A.login(rootId, false)
A.state.platformTab = 'support'
A.render()
html = window.__SiZisNurTest.html()
assert.ok(html.includes('Tiket Bantuan & Feedback'))
assert.ok(html.includes('Tidak bisa membuka laporan'))
assert.ok(html.includes('Masjid An-Nur'))
assert.ok(html.includes('Gangguan lembaga kedua'))
assert.ok(html.includes('Lembaga Uji Kedua'))
assert.ok(html.includes('data-root-action="ticket-detail"'))

// Root opens the tenant ticket and replies, updating its status and platform audit.
clickRootAction('ticket-detail', firstTicket.id)
assert.ok(window.__SiZisNurTest.modalHtml().includes('data-root-form="ticket-reply"'))
fireSubmit(makeForm('root', {
  status: 'menunggu_tenant', priority: 'high',
  message: 'Mohon kirim tangkapan layar dan waktu kejadian agar kami dapat menelusuri masalahnya.',
}, firstTicket.id))
assert.equal(firstTicket.status, 'menunggu_tenant')
assert.equal(firstTicket.priority, 'high')
assert.equal(firstTicket.messages.length, 2)
assert.equal(firstTicket.messages[1].senderScope, 'platform')
assert.equal(firstTicket.messages[1].senderRole, 'Admin SiZisNur')
assert.ok(db.platformAudit.some((item) => item.type === 'SUPPORT_REPLY' && item.detail.includes(firstTicket.id)))

// Legacy tickets without a messages array remain readable and gain a thread when root replies.
const legacyTicket = {
  id: 'SP-LEGACY', tenantId: 'TN-ANNUR', userId: 'US-ADM', createdByName: 'Admin Demo',
  role: 'Admin', kind: 'help', priority: 'normal', subject: 'Tiket bantuan lama',
  description: 'Deskripsi tiket lama harus tetap menjadi pesan pembuka.',
  status: 'baru', createdAt: new Date().toISOString(),
}
db.supportTickets.push(legacyTicket)
A.state.platformTab = 'support'
A.render()
clickRootAction('ticket-detail', legacyTicket.id)
assert.ok(window.__SiZisNurTest.modalHtml().includes('Deskripsi tiket lama harus tetap menjadi pesan pembuka.'))
fireSubmit(makeForm('root', {
  status: 'diproses', priority: 'normal', message: 'Tiket lama sudah masuk antrean pemeriksaan.',
}, legacyTicket.id))
assert.equal(legacyTicket.messages.length, 2)
assert.equal(legacyTicket.messages[0].body, legacyTicket.description)
assert.equal(legacyTicket.messages[1].senderScope, 'platform')

// The tenant can read the response and reply in the same ticket.
A.login('US-ADM', false)
A.state.page = 'help'
A.render()
html = window.__SiZisNurTest.html()
assert.ok(html.includes('Mohon kirim tangkapan layar'))
assert.ok(html.includes('Menunggu jawaban Lembaga'))
fireSubmit(makeForm('v5', {
  formType: 'support-reply',
  message: 'Tangkapan layar sudah siap. Kendala terjadi sekitar pukul 09.00 WIB.',
}, firstTicket.id))
assert.equal(firstTicket.status, 'menunggu_admin', 'tenant reply should return the ticket to the root inbox')
assert.equal(firstTicket.messages.length, 3)
assert.equal(firstTicket.messages[2].senderScope, 'tenant')
assert.ok(db.syncQueue.some((event) => event.type === 'support.replied' && event.payload.ticketId === firstTicket.id))
assert.ok(db.audit.some((item) => item.type === 'SUPPORT_REPLY' && item.detail.includes(firstTicket.id)))

// Root can resolve a ticket; a later tenant response reopens it for root follow-up.
A.login(rootId, false)
A.state.platformTab = 'support'
A.state.platformTicketFilter = 'awaiting_root'
A.render()
html = window.__SiZisNurTest.html()
assert.ok(html.includes(firstTicket.id))
assert.ok(html.includes('Menunggu Admin SiZisNur'))
clickRootAction('ticket-detail', firstTicket.id)
fireSubmit(makeForm('root', {
  status: 'selesai', priority: 'high',
  message: 'Laporan sudah diperiksa dan kendala telah diperbaiki pada prototype.',
}, firstTicket.id))
assert.equal(firstTicket.status, 'selesai')
assert.ok(firstTicket.resolvedAt)

// A tenant can reopen a closed ticket with a new reply.
A.login('US-ADM', false)
A.state.page = 'help'
A.render()
html = window.__SiZisNurTest.html()
assert.ok(html.includes('Selesai'))
assert.ok(html.includes('Balas dan buka kembali tiket'))
fireSubmit(makeForm('v5', {
  formType: 'support-reply',
  message: 'Terima kasih, kami sudah menguji ulang dan masih ada satu pertanyaan lanjutan.',
}, firstTicket.id))
assert.equal(firstTicket.status, 'menunggu_admin')
assert.ok(firstTicket.reopenedAt)
assert.equal(firstTicket.resolvedAt, undefined)

// Root inbox should show the reopened ticket as requiring a platform response again.
A.login(rootId, false)
A.state.platformTab = 'support'
A.state.platformTicketFilter = 'awaiting_root'
A.render()
html = window.__SiZisNurTest.html()
assert.ok(html.includes(firstTicket.id))
assert.ok(html.includes('Menunggu Admin SiZisNur'))
assert.ok(db.platformAudit.filter((item) => item.type === 'SUPPORT_REPLY').length >= 2)

console.log('PASS — tenant-scoped support tickets, cross-tenant root inbox, threaded root replies, tenant follow-up, resolve/reopen lifecycle, and audit')
