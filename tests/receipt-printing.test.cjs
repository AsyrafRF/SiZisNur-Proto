const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const crypto = require('node:crypto')

const root = path.join(__dirname, '..')
let source = fs.readFileSync(path.join(root, 'js', 'app.js'), 'utf8').replace(/\r\n/g, '\n')
source = source.replace('render();\n})();', 'window.__SiZisNurTest={loginRef:login};\nrender();\n})();')
source += `\n;\n${fs.readFileSync(path.join(root, 'js', 'revision-v5.js'), 'utf8')}`

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
const printDocuments = []
const popupCalls = []
const document = {
  body: { classList: { toggle() {} } },
  getElementById(id) { return elements[id] || (elements[id] = { innerHTML: '', textContent: '', dataset: {} }) },
  addEventListener(type, listener) { (listeners[type] ||= []).push(listener) },
  querySelector() { return null }, querySelectorAll() { return [] },
  createElement() { return { style: {}, dataset: {}, click() {}, remove() {}, getContext() { return null } } },
  execCommand() { return true },
}
const window = {
  localStorage, sessionStorage, crypto: crypto.webcrypto,
  addEventListener() {}, scrollTo() {},
  open(...args) {
    popupCalls.push(args)
    const doc = {
      html: '',
      write(html) { this.html = html; printDocuments.push(html) },
      close() {},
    }
    return { document: doc, focus() {} }
  },
}
const navigator = { onLine: true, userAgent: 'receipt-print-test' }
const context = {
  window, document, elements, localStorage, sessionStorage, navigator,
  console, Date, Math, JSON, Map, Set, URL, Blob: function Blob() {},
  FormData: function FormData() {}, Intl, Number, String, Object, Array,
  RegExp, Error, Promise, Uint8Array, Uint32Array, TextEncoder, TextDecoder,
  btoa, atob, setInterval() {}, clearInterval() {},
  setTimeout() { return 0 }, clearTimeout() {},
}
vm.createContext(context)
vm.runInContext(source, context, { timeout: 10000 })

const bridge = window.__SiZisNurBridge
window.__SiZisNurTest.loginRef('US-OPR')
const person = bridge.db.persons.find((item) => item.tenantId === 'TN-ANNUR')
assert.ok(person, 'the demo dataset should provide a person for receipt rendering')
const tx = {
  id: 'TR-THERMAL-80-TEST', tenantId: 'TN-ANNUR', periodId: 'PR-1447',
  serial: 'MS-THERMAL-800001', personId: person.id, jiwa: 2,
  source: 'operator', status: 'pending', createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  lines: [
    { category: 'Zakat Fitrah', type: 'uang', value: 90000, quantity: 2, unitLabel: 'jiwa' },
    { category: 'Zakat Fitrah', type: 'beras', value: 2.5, quantity: 1, unitLabel: 'jiwa' },
    { category: 'Fidyah', type: 'uang', value: 65000, quantity: 1, unitLabel: 'hari' },
  ],
}
bridge.db.transactions.push(tx)

async function clickAction(action, id) {
  const button = { dataset: { v5Action: action, id } }
  const event = { target: { closest(selector) { return selector === '[data-v5-action]' ? button : null } } }
  for (const listener of listeners.click || []) await listener(event)
}

;(async () => {
  await clickAction('receipt-thermal', tx.id)
  assert.equal(printDocuments.length, 1, 'thermal action should open a print document')
  const thermalHtml = printDocuments[0]
  assert.match(popupCalls[0]?.[2] || '', /width=460,height=900/, 'thermal preview window should be sized for a roll receipt rather than a full A4-like window')
  if (process.env.SAVE_RECEIPT_PREVIEW) fs.writeFileSync(process.env.SAVE_RECEIPT_PREVIEW, thermalHtml, 'utf8')
  assert.match(thermalHtml, /<head>[\s\S]*@page\s*\{\s*size:\s*auto;\s*margin:\s*3mm;/, 'thermal output must declare the driver-selected roll media in the document head')
  assert.match(thermalHtml, /width:\s*74mm/, 'thermal content must fit the printable width')
  assert.match(thermalHtml, /thermal-screen-actions/, 'thermal preview should show a dedicated toolbar')
  assert.match(thermalHtml, /Pratinjau 80 mm · Pilih roll 80 mm di dialog cetak/, 'thermal popup should clearly identify its roll-paper preview')
  assert.match(thermalHtml, /@media print[\s\S]*thermal-screen-actions \{ display: none/, 'screen toolbar must be hidden from print output')
  assert.match(thermalHtml, /thermal-receipt/, 'thermal output must use the compact POS-style receipt renderer')
  assert.match(thermalHtml, /DejaVu Sans Mono/, 'thermal output must use a monospace receipt font')
  assert.match(thermalHtml, /thermal-kv/, 'thermal output must align transaction metadata in compact rows')
  assert.match(thermalHtml, /BATAS VERIFIKASI AMIL \(2 JAM\)/, 'thermal output must print the explicit two-hour Amil verification deadline')
  assert.match(thermalHtml, /TUNJUKKAN QR INI KE MEJA AMIL\. VERIFIKASI MAKSIMAL 2 JAM SEJAK DIBUAT/, 'thermal output must instruct Muzakki to present the QR at the Amil desk within two hours')
  assert.match(thermalHtml, /==========================================/, 'thermal output must use an ASCII section separator')
  assert.match(thermalHtml, /width:\s*28mm !important/, 'thermal QR should use a compact print size')
  assert.match(thermalHtml, /Zakat Fitrah \/ UANG/, 'thermal output must include the money line item')
  assert.match(thermalHtml, /Zakat Fitrah \/ BERAS/, 'thermal output must include the rice line item')
  assert.match(thermalHtml, /Fidyah \/ UANG/, 'thermal output must include other zakat categories')
  assert.match(thermalHtml, /SIZISNUR\|TN-ANNUR\|TR-THERMAL-80-TEST\|MS-THERMAL-800001/, 'thermal output must retain the transaction QR token')
  assert.match(thermalHtml, /TOTAL UANG/, 'thermal output must show money total')
  assert.match(thermalHtml, /TOTAL BERAS/, 'thermal output must show rice total separately')
  assert.match(thermalHtml, /BUKAN BUKTI PEMBAYARAN RESMI/, 'thermal output must preserve prototype disclaimer')
  assert.doesNotMatch(thermalHtml, /makeReceiptPrint is not defined/)

  await clickAction('receipt-pdf', tx.id)
  assert.equal(printDocuments.length, 2, 'PDF action should still open a second print document')
  const pdfHtml = printDocuments[1]
  assert.match(pdfHtml, /receipt-preview/, 'PDF output must use the same receipt renderer')
  assert.match(pdfHtml, /Zakat Fitrah · Beras/, 'PDF output must preserve mixed payment details')
  assert.doesNotMatch(pdfHtml, /thermal-screen-actions|Pratinjau 80 mm/, 'PDF action should retain the normal page layout')

  console.log('PASS — thermal 80 mm no longer calls an undefined function; thermal and PDF both print the shared multi-line receipt')
})().catch((error) => { console.error(error); process.exitCode = 1 })
