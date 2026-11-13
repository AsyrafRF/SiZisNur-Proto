const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')

const projectRoot = path.resolve(__dirname, '..')
const source = fs.readFileSync(path.join(projectRoot, 'js/revision-v5.js'), 'utf8')
const start = source.indexOf('  function supportPage() {')
const end = source.indexOf('  function prototypePage() {', start)
assert.ok(start >= 0 && end > start, 'supportPage() block must exist')
const functionSource = source.slice(start, end)

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;')

const helpers = {
  boxhead: (title, description) => `<header><h1>${title}</h1><p>${description}</p></header>`,
  sel: (label, name) => `<label>${label}<select name="${name}"></select></label>`,
  fld: (label, name) => `<label>${label}<input name="${name}"></label>`,
  textarea: (label, name) => `<label>${label}<textarea name="${name}"></textarea></label>`
}

const createPage = new Function(
  'A',
  'activeUser',
  'esc',
  'formButton',
  `${functionSource}\nreturn supportPage;`
)

const expectedMenus = {
  Admin: [
    'Profil Lembaga & UPZ', 'Akun & Peran', 'Periode Zakat', 'Tarif & Rumus',
    'Mustahik & Kelayakan', 'Acuan Workbook 1447H', 'Evaluasi Prototype'
  ],
  Muzakki: [
    'Data Keluarga Tanggungan', 'Kalkulator Zakat',
    'Buat Rencana Transaksi dan QR', 'Riwayat dan Bukti Transaksi', 'Evaluasi Prototype'
  ],
  Operator: [
    'Data Muzakki', 'Penerimaan & Verifikasi · Input Konter',
    'Struk Digital dan Cetak', 'Koreksi Terkendali', 'Evaluasi Prototype'
  ],
  Amil: [
    'Shift & Kehadiran', 'Penerimaan & Verifikasi · Scan QR',
    'Ketentuan, Dalil, Doa dan Akad', 'Notifikasi', 'Evaluasi Prototype'
  ],
  Bendahara: [
    'Serah Terima & Rekonsiliasi', 'Jurnal dan Laporan Keuangan',
    'Koreksi Terkendali', 'Alokasi & Persetujuan', 'Batch & Penyaluran Lapangan',
    'Laporan & Statistik', 'Insentif Amil', 'Acuan Workbook 1447H', 'Evaluasi Prototype'
  ],
  Relawan: [
    'Batch & Penyaluran Lapangan', 'Bila Kamera atau Jaringan Bermasalah',
    'Evaluasi Prototype'
  ],
  Pengurus: [
    'Penerimaan dan Verifikasi', 'Alokasi dan Persetujuan Program',
    'Jurnal dan Laporan Keuangan', 'Laporan & Statistik',
    'Koreksi Terkendali', 'Insentif Amil', 'Acuan Workbook 1447H', 'Evaluasi Prototype'
  ]
}

let totalModules = 0
let totalSteps = 0
let totalIllustrations = 0

for (const [role, menus] of Object.entries(expectedMenus)) {
  const page = createPage(helpers, () => ({ role }), escapeHtml, (label) => `<button>${label}</button>`)
  const html = page()
  const visible = html
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")

  assert.ok(visible.includes(`Panduan Penggunaan · ${role}`), `${role}: heading is missing`)
  assert.ok(visible.includes('Alur kerja'), `${role}: workflow diagram is missing`)
  assert.ok(visible.includes('Sebelum mulai menggunakan aplikasi'), `${role}: preparation checklist is missing`)
  assert.ok(visible.includes('Bantuan, dukungan dan umpan balik'), `${role}: feedback form is missing`)

  const detailCount = (html.match(/<details class="manual-module"/g) || []).length
  const stepCount = (html.match(/class="manual-step-no"/g) || []).length
  const previewCount = (html.match(/class="manual-preview"/g) || []).length
  assert.ok(detailCount >= menus.length, `${role}: not all expected menu tutorials rendered`)
  assert.ok(stepCount >= menus.length * 3, `${role}: tutorials need more step-by-step instructions`)
  assert.equal(previewCount, detailCount, `${role}: every menu module should have a UI illustration`)

  for (const menu of menus) {
    assert.ok(visible.includes(menu), `${role}: menu guide missing: ${menu}`)
  }

  const targets = [...html.matchAll(/id="(manual-[^"]+)"/g)].map((match) => match[1])
  const jumps = [...html.matchAll(/data-guide-target="(manual-[^"]+)"/g)].map((match) => match[1])
  assert.equal(new Set(targets).size, targets.length, `${role}: duplicate detail IDs`)
  assert.deepEqual(jumps, targets, `${role}: menu shortcuts must point to matching guide sections`)
  assert.ok(!visible.includes('undefined'), `${role}: undefined text found`)

  totalModules += detailCount
  totalSteps += stepCount
  totalIllustrations += previewCount
  console.log(`PASS — ${role}: ${detailCount} tutorial menu, ${stepCount} langkah, ${previewCount} ilustrasi UI`)
}

console.log(`PASS — total ${totalModules} tutorial menu, ${totalSteps} langkah, ${totalIllustrations} ilustrasi UI untuk 7 role`)
