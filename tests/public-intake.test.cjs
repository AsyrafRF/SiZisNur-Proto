const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const crypto = require('node:crypto')
const { TextEncoder, TextDecoder } = require('node:util')
const btoa = (value) => Buffer.from(value, 'binary').toString('base64')
const atob = (value) => Buffer.from(value, 'base64').toString('binary')

const root = path.resolve(__dirname, '..')
let source = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8')
source = source.replace('render();\n})();', 'window.__SiZisNurTest={html:()=>elements.app.innerHTML};\nrender();\n})();')
for (const file of ['js/revision-v5.js', 'js/authentication.js', 'js/public-intake.js']) {
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
const listeners = {}
const document = {
  body: { classList: { toggle() {} } },
  getElementById(id) { return elements[id] || (elements[id] = { innerHTML: '', textContent: '', hidden: false, dataset: {} }) },
  addEventListener(type, listener) { (listeners[type] ||= []).push(listener) },
  querySelector() { return null }, querySelectorAll() { return [] },
  createElement(tag) { return { tagName: tag.toUpperCase(), style: {}, dataset: {}, click() {}, remove() {}, select() {}, setAttribute() {}, getContext() { return null } } },
  execCommand() { return true },
}
class MockFormData {
  constructor(form) { this.data = form.data || {} }
  entries() { return Object.entries(this.data) }
}
const location = { href: 'https://demo.sizisnur.invalid/index.html?welcome=1', search: '?welcome=1', protocol: 'https:' }
const window = { localStorage, sessionStorage, crypto: crypto.webcrypto, location, URL, addEventListener() {}, scrollTo() {}, open() { return null }, confirm() { return true } }
const context = {
  window, document, elements, localStorage, sessionStorage, location, navigator: { clipboard: null },
  console: { ...console, error() {} }, Date, Math, JSON, Map, Set, URL, Blob, FormData: MockFormData,
  Intl, Number, String, Object, Array, RegExp, Error, Promise, Uint8Array, Uint32Array, TextEncoder, TextDecoder, btoa, atob,
  setTimeout() { return 0 }, clearTimeout() {}, setInterval() {}, clearInterval() {},
}
vm.createContext(context)
vm.runInContext(source, context, { timeout: 15000 })

const A = window.__SiZisNurBridge
const portal = window.__SIZISNUR_PUBLIC_INTAKE
assert.ok(portal, 'public intake module should register')

function setUser(id) {
  A.session = { userId: id, remember: false, lastActive: Date.now(), scope: 'tenant' }
}
function fireSubmit(form) {
  const event = {
    target: { closest(selector) { return selector.includes('data-public-intake-form') ? form : null } },
    preventDefault() {},
  }
  for (const listener of listeners.submit || []) listener(event)
}
function newForm(formName, data, extra = {}) {
  return { dataset: { publicIntakeForm: formName, ...extra }, data, elements: {}, querySelector() { return null } }
}

// Only the intended tenant roles may manage public form links.
setUser('US-ADM')
assert.equal(A.can('public-intake-manager'), true)
let link = portal.createLink()
assert.ok(link.token.length >= 48, 'public link must use a high-entropy opaque token')
assert.equal(link.tenantId, 'TN-ANNUR')
assert.equal(link.periodId, 'PR-1447')
assert.equal(portal.findLink(link.token).id, link.id)
assert.ok(portal.portalUrl(link.token).includes(`portal=${link.token}`))
A.state.page = 'public-intake-manager'
A.render()
assert.ok(elements.app.innerHTML.includes('Formulir Publik & QR Warga'))
assert.ok(elements.app.innerHTML.includes('TAHAP EVALUASI SIMULASI'))
assert.ok(elements.app.innerHTML.includes('Cetak banner'))
setUser('US-OPR')
assert.equal(A.can('public-intake-manager'), true, 'Operator may manage tenant links')
setUser('US-AML')
assert.equal(A.can('public-intake-manager'), true, 'Amil may manage tenant links')
setUser('US-BEN')
assert.equal(A.can('public-intake-manager'), false, 'Bendahara must not manage public intake links')
assert.throws(() => portal.createLink(), /Hanya Admin, Amil, atau Operator/i)

// A public link can be opened without an authenticated tenant user.
A.session = null
A.state.publicIntakeToken = link.token
A.state.page = 'public-intake'
A.render()
assert.ok(elements.app.innerHTML.includes('Isi data diri Anda'))
assert.ok(elements.app.innerHTML.includes('BELUM MENGGUNAKAN BACKEND STANDAR AMAN PRODUKSI'))
assert.ok(!elements.app.innerHTML.includes('Muzakki Demo 01'), 'private tenant records must not be exposed before OTP')

// Submit identity using the selected RW/RT from the institution's Master Wilayah.
const annurArea = A.db.areas.find((item) => item.tenantId === 'TN-ANNUR' && item.active !== false)
const annurRw = A.db.rws.find((item) => item.tenantId === 'TN-ANNUR' && item.areaId === annurArea?.id && item.active !== false)
const annurRt = A.db.rts.find((item) => item.tenantId === 'TN-ANNUR' && item.rwId === annurRw?.id && item.active !== false)
assert.ok(annurArea && annurRw && annurRt, 'default institution should provide a valid Master Wilayah hierarchy')
const identity = newForm('identity', {
  name: 'Warga Uji Publik', phone: '081299998877', email: 'warga.uji@example.invalid',
  address: 'Alamat simulasi, RT 01', domicileStatus: 'warga_daerah', areaId: annurArea.id, rwId: annurRw.id, rtId: annurRt.id,
  otpChannel: 'whatsapp', consent: 'yes',
})
fireSubmit(identity)
let session = portal.getSession()
assert.equal(session.stage, 'otp')
assert.ok(elements.app.innerHTML.includes('KODE OTP DEMO'))
assert.ok(elements.app.innerHTML.includes('TIDAK DIKIRIM KE WHATSAPP'))
const otp = session.otp
fireSubmit(newForm('otp', { otp }))
session = portal.getSession()
assert.equal(session.stage, 'match')
assert.equal(session.personId, null, 'new verified identity should not be merged to an unrelated person')
assert.ok(elements.app.innerHTML.includes('Rencana pembayaran zakat'))
assert.ok(elements.app.innerHTML.includes('lines[0][category]'), 'public form uses the same indexed multi-line calculator as other channels')
assert.ok(elements.app.innerHTML.includes('Tambah jenis zakat / media'), 'public form supports additional payment lines')

const txForm = newForm('transaction', {
  'lines[0][category]': 'Zakat Fitrah', 'lines[0][type]': 'uang', 'lines[0][jiwa]': '2', 'lines[0][value]': '90.000',
  'lines[1][category]': 'Zakat Fitrah', 'lines[1][type]': 'beras', 'lines[1][jiwa]': '1', 'lines[1][value]': '2,5',
  'lines[2][category]': 'Fidyah', 'lines[2][type]': 'uang', 'lines[2][jiwa]': '2', 'lines[2][value]': '130.000',
  confirm: 'yes', note: 'Uji transaksi publik multi-jenis dan multi-media',
})
fireSubmit(txForm)
const tx = A.db.transactions.find((item) => item.source === 'public-intake' && item.personId === session.personId)
assert.ok(tx, 'public transaction must be created')
assert.equal(tx.tenantId, 'TN-ANNUR')
assert.equal(tx.periodId, 'PR-1447')
assert.equal(tx.status, 'pending')
assert.match(tx.serial, /^PU-\d{6}$/)
assert.ok(tx.expiresAt)
assert.equal(A.db.persons.find((person) => person.id === tx.personId).phone, '081299998877')
assert.equal(A.db.persons.find((person) => person.id === tx.personId).rwId, annurRw.id, 'public form stores RW from the institution master')
assert.equal(A.db.persons.find((person) => person.id === tx.personId).rtId, annurRt.id, 'public form stores RT from the institution master')
assert.equal(tx.lines.length, 3, 'one public transaction can contain multiple zakat types and payment media')
assert.equal(tx.paymentEstimate.paid, 220000)
assert.equal(tx.paymentEstimate.paidRice, 2.5)
assert.deepEqual(JSON.parse(JSON.stringify(tx.lines)), [
  { category: 'Zakat Fitrah', type: 'uang', value: 90000, quantity: 2, unitLabel: 'jiwa', assetsValue: 0 },
  { category: 'Zakat Fitrah', type: 'beras', value: 2.5, quantity: 1, unitLabel: 'jiwa', assetsValue: 0 },
  { category: 'Fidyah', type: 'uang', value: 130000, quantity: 2, unitLabel: 'hari', assetsValue: 0 },
])
assert.equal(A.db.muzakki.some((item) => item.personId === tx.personId && item.tenantId === 'TN-ANNUR'), true)
assert.ok(A.db.audit.some((item) => item.type === 'PUBLIC_INTAKE_TRANSACTION_CREATED'))
assert.ok(elements['modal-root'].innerHTML.includes('STRUK RENCANA ZAKAT'))
assert.ok(elements['modal-root'].innerHTML.includes('bukan bukti pembayaran resmi'))
assert.ok(elements['modal-root'].innerHTML.includes('Zakat Fitrah · Beras'), 'public receipt uses shared receipt layout for mixed media')
assert.ok(elements['modal-root'].innerHTML.includes('Fidyah · Uang'), 'public receipt lists every line item')
assert.ok(elements['modal-root'].innerHTML.includes('2 jiwa'), 'public receipt includes quantity/unit for mixed transaction detail')
assert.ok(elements['modal-root'].innerHTML.includes('2 hari'), 'public receipt includes Fidyah day count')
assert.ok(typeof window.__SIZISNUR_RECEIPT_PRINT_HTML === 'function' && window.__SIZISNUR_RECEIPT_PRINT_HTML(tx).includes('receipt-preview'), 'public receipt printing uses common receipt renderer')

// Public form invokes the same excess-payment confirmation gate as Muzakki and counter forms.
let excessPrompted = false
const originalExcessGate = window.__SIZISNUR_MAY_CONFIRM_TRANSACTION_EXCESS
window.__SIZISNUR_MAY_CONFIRM_TRANSACTION_EXCESS = (form, data) => {
  excessPrompted = true
  assert.equal(data['lines[0][category]'], 'Zakat Fitrah')
  assert.equal(data['lines[0][value]'], '50.000')
  return true
}
const excessForm = newForm('transaction', {
  'lines[0][category]': 'Zakat Fitrah', 'lines[0][type]': 'uang', 'lines[0][jiwa]': '1', 'lines[0][value]': '50.000',
  confirm: 'yes',
})
fireSubmit(excessForm)
assert.equal(excessPrompted, true, 'public form checks for excess-payment confirmation before saving')
window.__SIZISNUR_MAY_CONFIRM_TRANSACTION_EXCESS = originalExcessGate

// An unpaid transaction is rediscovered after contact verification and blocks another submission.
const ctx = portal.currentPublicContext()
assert.equal(portal.activeTransactionsFor(ctx, tx.personId).length, 1)
assert.equal(portal.canCancelPublic(tx, tx.personId, 'TN-ANNUR'), true)
session.stage = 'match'
session.verifiedUntil = Date.now() + 600000
A.render()
assert.ok(elements.app.innerHTML.includes('Transaksi belum lunas ditemukan'))
assert.ok(elements.app.innerHTML.includes(tx.serial))
assert.ok(elements.app.innerHTML.includes('Batalkan rencana'))

// Cancellation requires a reason, retains the record and invalidates the old QR.
portal.cancelPublicTransaction({ dataset: { id: tx.id }, data: { reason: 'Salah memilih nominal', confirmCancel: 'yes' } }, ctx, session)
assert.equal(tx.status, 'batal')
assert.equal(tx.cancelReason, 'Salah memilih nominal')
assert.ok(tx.cancelledAt)
assert.ok(A.db.audit.some((item) => item.type === 'PUBLIC_INTAKE_TRANSACTION_CANCELLED'))
assert.equal(portal.canCancelPublic(tx, session.personId, 'TN-ANNUR'), false)

// Transactions that have been accepted/processed by staff cannot be cancelled. Paid/history does not block a new plan.
const paidTx = { id: 'TR-PAID-PI', tenantId: 'TN-ANNUR', periodId: 'PR-1447', personId: session.personId, source: 'public-intake', status: 'paid', serial: 'PU-PAID', lines: [], createdAt: A.now() }
const processingTx = { id: 'TR-PROC-PI', tenantId: 'TN-ANNUR', periodId: 'PR-1447', personId: session.personId, source: 'public-intake', status: 'pending', operatorId: 'US-OPR', serial: 'PU-PROC', lines: [], createdAt: A.now() }
A.db.transactions.push(paidTx, processingTx)
assert.equal(portal.canCancelPublic(paidTx, session.personId, 'TN-ANNUR'), false)
assert.equal(portal.canCancelPublic(processingTx, session.personId, 'TN-ANNUR'), false)
assert.equal(portal.activeTransactionsFor(ctx, session.personId).length, 1, 'processed Pending transaction cannot be cancelled but still blocks duplicate entry')
processingTx.status = 'paid'
assert.equal(portal.activeTransactionsFor(ctx, session.personId).length, 0, 'Paid transactions no longer block a new plan')
A.render()
assert.ok(elements.app.innerHTML.includes('Rencana pembayaran zakat'), 'a completed Paid transaction does not block the new intake form')
assert.ok(elements.app.innerHTML.includes('Riwayat transaksi yang sudah diproses'))

// Strict tenant isolation: an An-Nur identity does not match another institution's person record.
const alHikmahLookup = portal.identityLookup('TN-ALHIKMAH', { name: 'Warga Uji Publik', phone: '081299998877', email: '', otpChannel: 'whatsapp' })
assert.equal(alHikmahLookup.person, null)
const hiddenCrossTenantTx = { id: 'TR-CROSS', tenantId: 'TN-ALHIKMAH', periodId: 'PR-T2', personId: session.personId, status: 'pending', source: 'public-intake' }
A.db.transactions.push(hiddenCrossTenantTx)
assert.ok(!portal.activeTransactionsFor(ctx, session.personId).some((item) => item.id === hiddenCrossTenantTx.id))

// Revoke a public link and ensure it can no longer open the form.
setUser('US-ADM')
const secondLink = portal.createLink()
portal.revokeLink(secondLink.id)
A.state.publicIntakeToken = secondLink.token
assert.match(portal.currentPublicContext().error, /telah dicabut/i)

Promise.resolve(window.__SIZISNUR_AUTH?.ready).then(() => {
  console.log('PASS — Portal Zakat Publik: tautan per Lembaga, OTP demo, domisili RW/RT, transaksi multi-jenis/media, konfirmasi kelebihan, struk bersama, privasi, pembatalan, dan pencabutan tautan')
}).catch((error) => { console.error(error); process.exitCode = 1 })
