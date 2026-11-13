/* SiZisNur Prototype Settings — browser-local demo data tools.
   These controls are for prototype maintenance only; not production administration. */
(function () {
  'use strict'
  const A = window.__SiZisNurBridge
  const platform = window.__SIZISNUR_PLATFORM_ADMIN
  if (!A || !platform) throw new Error('SiZisNur core / platform bridge is missing')

  const state = A.state
  const rootUser = () => A.user()?.scope === 'platform' && A.user()?.role === platform.ROOT_ROLE
  const esc = A.e
  const DB_ARRAYS = [
    'tenants', 'applications', 'users', 'platformAdmins', 'platformAudit', 'periods', 'rules',
    'persons', 'muzakki', 'transactions', 'deposits', 'mustahiks', 'allocations', 'distributions',
    'schedule', 'notifications', 'audit', 'accounts', 'households', 'muzakkiMemberships', 'batches',
    'shiftSessions', 'corrections', 'supportTickets', 'journalEntries', 'syncQueue', 'periodReports',
    'areas', 'rws', 'rts',
  ]
  const ROOT_ACCOUNT = {
    id: 'PA-SIZISNUR-ROOT', name: 'Admin SiZisNur', role: 'Admin SiZisNur',
    email: 'root@sizisnur.demo', scope: 'platform', active: true,
    createdAt: '2026-11-14T00:00:00.000Z', note: 'Akun demo platform; dipertahankan agar konsol root tetap dapat diakses.',
  }
  const DEFAULT_PLATFORM_SETTINGS = {
    platformName: 'SiZisNur', supportEmail: 'support@sizisnur.demo', publicRegistrationOpen: true,
    maintenanceMode: false,
    maintenanceMessage: 'SiZisNur sedang menjalani pemeliharaan terjadwal. Silakan coba kembali nanti.',
    publicNotice: '', defaultTenantStatus: 'aktif', updatedAt: null, updatedBy: null,
  }
  let confirmMode = ''
  let pendingImport = null
  let pendingImportSummary = null

  function clone(value) { return JSON.parse(JSON.stringify(value)) }
  function activeDb() { return A.db }
  function bytes(value) { return typeof TextEncoder !== 'undefined' ? new TextEncoder().encode(value).length : unescape(encodeURIComponent(value)).length }
  function countOf(name) { return Array.isArray(activeDb()[name]) ? activeDb()[name].length : 0 }
  function niceBytes(size) {
    if (size < 1024) return `${size} byte`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1).replace('.', ',')} KB`
    return `${(size / (1024 * 1024)).toFixed(2).replace('.', ',')} MB`
  }
  function safeFilename(date = new Date()) {
    const stamp = date.toISOString().replace(/[:.]/g, '-').slice(0, 19)
    return `SiZisNur-Backup-Prototype-${stamp}.json`
  }
  function backupPayload(database = activeDb()) {
    return {
      format: 'SIZISNUR-PROTOTYPE-BACKUP', backupVersion: 1,
      exportedAt: new Date().toISOString(), appSchemaVersion: Number(database.version || 5),
      appName: 'SiZisNur', note: 'Cadangan penuh untuk simulasi lokal. Berkas mencakup data pribadi demo dan dataset Mustahik.',
      data: clone(database),
    }
  }
  function validateDatabase(database) {
    if (!database || typeof database !== 'object' || Array.isArray(database)) throw new Error('Struktur berkas bukan objek database SiZisNur.')
    if (Number(database.version) !== 5) throw new Error('Versi database tidak didukung. Impor hanya menerima schema SiZisNur V5.')
    for (const key of ['tenants', 'users', 'persons', 'mustahiks', 'transactions']) {
      if (!Array.isArray(database[key])) throw new Error(`Data ${key} tidak ditemukan atau formatnya tidak benar.`)
    }
    const ids = new Set()
    for (const tenant of database.tenants) {
      if (!tenant || typeof tenant.id !== 'string' || !tenant.id.trim() || !tenant.name) throw new Error('Ada data Lembaga yang tidak memiliki ID atau nama.')
      if (ids.has(tenant.id)) throw new Error(`ID Lembaga duplikat: ${tenant.id}`)
      ids.add(tenant.id)
    }
    for (const key of DB_ARRAYS) if (database[key] !== undefined && !Array.isArray(database[key])) throw new Error(`Format koleksi ${key} tidak valid.`)
    return true
  }
  function normalizeImportedDatabase(database) {
    validateDatabase(database)
    const next = clone(database)
    DB_ARRAYS.forEach((key) => { if (!Array.isArray(next[key])) next[key] = [] })
    next.version = 5
    next.seedRevision ||= 2
    next.platformAdmins ||= []
    next.users = next.users.filter((item) => item.id !== ROOT_ACCOUNT.id)
    let root = next.platformAdmins.find((item) => item.id === ROOT_ACCOUNT.id)
    if (!root) { root = clone(ROOT_ACCOUNT); next.platformAdmins.unshift(root) }
    root.role = ROOT_ACCOUNT.role
    root.scope = 'platform'
    root.active = true
    next.platformSettings = { ...clone(DEFAULT_PLATFORM_SETTINGS), ...(next.platformSettings || {}) }
    next.platformAudit ||= []
    return next
  }
  function parseBackup(input) {
    let parsed
    try { parsed = typeof input === 'string' ? JSON.parse(input) : input } catch (_) { throw new Error('File bukan JSON yang valid.') }
    if (parsed?.format === 'SIZISNUR-PROTOTYPE-BACKUP' && Number(parsed.backupVersion) === 1) return normalizeImportedDatabase(parsed.data)
    // Also accept a full raw V5 database exported by development tooling.
    return normalizeImportedDatabase(parsed?.data?.version === 5 ? parsed.data : parsed)
  }
  function replaceDatabase(nextDatabase) {
    const target = activeDb()
    const previous = clone(target)
    const replacement = clone(nextDatabase)
    function assignSafe(value) {
      Object.keys(target).forEach((key) => { delete target[key] })
      Object.entries(value).forEach(([key, item]) => {
        Object.defineProperty(target, key, { value: item, writable: true, enumerable: true, configurable: true })
      })
    }
    assignSafe(replacement)
    try { A.persist() } catch (error) {
      assignSafe(previous)
      throw new Error(`Penyimpanan browser menolak perubahan (kemungkinan kuota penuh). Data sebelumnya dipulihkan. ${error?.message || ''}`.trim())
    }
  }
  function exportFullBackup() {
    if (!rootUser()) throw new Error('Hanya Admin SiZisNur yang dapat mengekspor cadangan seluruh platform.')
    const payload = backupPayload()
    A.downloadFile(safeFilename(), 'application/json;charset=utf-8', JSON.stringify(payload, null, 2))
    A.toast('Cadangan penuh berhasil disiapkan. Simpan berkas di lokasi yang aman.', 'success')
    return payload
  }
  function resetToDefault(options = {}) {
    if (!rootUser()) throw new Error('Reset global hanya tersedia untuk Admin SiZisNur.')
    const fresh = A.seed()
    DB_ARRAYS.forEach((key) => { if (!Array.isArray(fresh[key])) fresh[key] = [] })
    replaceDatabase(fresh)
    confirmMode = ''; pendingImport = null; pendingImportSummary = null
    if (options.reload !== false && window.location?.reload) window.location.reload()
    else A.render()
    return { tenants: fresh.tenants.length, users: fresh.users.length, mustahiks: fresh.mustahiks.length }
  }
  function emptyDatabaseFromSeed() {
    const empty = A.seed()
    DB_ARRAYS.forEach((key) => { empty[key] = [] })
    empty.platformAdmins = [clone(ROOT_ACCOUNT)]
    empty.platformAudit = []
    empty.platformSettings = clone(DEFAULT_PLATFORM_SETTINGS)
    empty.seedRevision = Number(empty.seedRevision || 2)
    empty.clearedAt = new Date().toISOString()
    return empty
  }
  function clearAllData(options = {}) {
    if (!rootUser()) throw new Error('Penghapusan global hanya tersedia untuk Admin SiZisNur.')
    const empty = emptyDatabaseFromSeed()
    replaceDatabase(empty)
    confirmMode = ''; pendingImport = null; pendingImportSummary = null
    if (options.reload !== false && window.location?.reload) window.location.reload()
    else A.render()
    return { tenants: 0, users: 0, transactions: 0, mustahiks: 0, rootAccounts: 1 }
  }
  function applyImport(options = {}) {
    if (!rootUser()) throw new Error('Impor global hanya tersedia untuk Admin SiZisNur.')
    if (!pendingImport) throw new Error('Belum ada file cadangan yang siap diimpor.')
    const normalized = normalizeImportedDatabase(pendingImport)
    replaceDatabase(normalized)
    confirmMode = ''; pendingImport = null; pendingImportSummary = null
    if (options.reload !== false && window.location?.reload) window.location.reload()
    else A.render()
    return true
  }
  function prepareImport(raw) {
    if (!rootUser()) throw new Error('Impor global hanya tersedia untuk Admin SiZisNur.')
    const normalized = parseBackup(raw)
    pendingImport = normalized
    pendingImportSummary = {
      tenants: normalized.tenants.length, users: normalized.users.length,
      transactions: normalized.transactions.length, mustahiks: normalized.mustahiks.length,
      persons: normalized.persons.length,
    }
    confirmMode = 'import'
    A.render()
    return clone(pendingImportSummary)
  }
  function integrityReport() {
    const db = activeDb()
    const tenantIds = new Set((db.tenants || []).map((item) => item.id))
    const personKeys = new Set((db.persons || []).map((item) => `${item.tenantId}|${item.id}`))
    const transactionKeys = new Set((db.transactions || []).map((item) => `${item.tenantId}|${item.id}`))
    const counts = {
      usersWithoutTenant: (db.users || []).filter((item) => !tenantIds.has(item.tenantId)).length,
      periodsWithoutTenant: (db.periods || []).filter((item) => !tenantIds.has(item.tenantId)).length,
      transactionsWithoutTenant: (db.transactions || []).filter((item) => !tenantIds.has(item.tenantId)).length,
      transactionsWithoutPerson: (db.transactions || []).filter((item) => item.personId && !personKeys.has(`${item.tenantId}|${item.personId}`)).length,
      mustahiksWithoutPerson: (db.mustahiks || []).filter((item) => item.personId && !personKeys.has(`${item.tenantId}|${item.personId}`)).length,
      distributionsWithoutTransaction: (db.distributions || []).filter((item) => item.transactionId && !transactionKeys.has(`${item.tenantId}|${item.transactionId}`)).length,
    }
    return { counts, issues: Object.values(counts).reduce((sum, value) => sum + value, 0) }
  }
  function ask(mode) {
    if (!rootUser()) return A.toast('Hanya Admin SiZisNur yang dapat mengelola data prototype global.', 'error')
    confirmMode = mode
    pendingImport = mode === 'import' ? pendingImport : null
    pendingImportSummary = mode === 'import' ? pendingImportSummary : null
    A.render()
  }
  function renderConfirmPanel() {
    if (!confirmMode) return ''
    if (confirmMode === 'import') {
      const info = pendingImportSummary || {}
      return `<section class="card proto-confirm-card"><div class="proto-confirm-head"><span class="tag warn">KONFIRMASI IMPOR</span><h3>Ganti database dengan file cadangan?</h3><p>Semua data lokal saat ini akan diganti dengan isi cadangan. Data Mustahik dalam berkas juga akan menggantikan dataset yang sekarang.</p></div><div class="proto-confirm-stats"><span>${info.tenants || 0}<small>Lembaga</small></span><span>${info.users || 0}<small>Akun lembaga</small></span><span>${info.transactions || 0}<small>Transaksi</small></span><span>${info.mustahiks || 0}<small>Mustahik</small></span></div><div class="form-actions"><button type="button" class="btn primary" data-proto-action="import-confirm">Ya, ganti data sekarang</button><button type="button" class="btn" data-proto-action="cancel-confirm">Batalkan</button></div></section>`
    }
    const isClear = confirmMode === 'clear'
    const title = isClear ? 'Hapus semua data simulasi?' : 'Kembalikan ke dataset bawaan?'
    const detail = isClear
      ? 'Seluruh Lembaga, akun pengguna lembaga, transaksi, Muzakki, Mustahik, pengaturan tarif, setoran, alokasi, penyaluran, notifikasi dan audit akan dikosongkan. Satu akun Admin SiZisNur dan pengaturan platform default tetap disimpan agar prototype masih dapat diakses. Ekspor cadangan terlebih dahulu bila data simulasi masih diperlukan.'
      : 'Seluruh perubahan simulasi akan diganti dengan dataset bawaan versi terbaru. Dataset Mustahik dikembalikan ke salinan bawaan yang dipertahankan tanpa perubahan; perubahan uji pada Mustahik akan hilang. Ekspor cadangan terlebih dahulu bila perubahan simulasi masih diperlukan.'
    const phrase = isClear ? 'HAPUS SEMUA' : 'RESET DEFAULT'
    const action = isClear ? 'clear-confirm' : 'reset-confirm'
    return `<section class="card proto-confirm-card ${isClear ? 'danger' : ''}"><div class="proto-confirm-head"><span class="tag ${isClear ? 'bad' : 'warn'}">TINDAKAN DESTRUKTIF</span><h3>${title}</h3><p>${detail}</p></div><form data-proto-form="${action}"><div class="field"><label>Ketik <b>${phrase}</b> untuk melanjutkan</label><input name="confirmText" autocomplete="off" required></div><div class="form-actions"><button type="submit" class="btn ${isClear ? 'danger' : 'primary'}">Konfirmasi ${isClear ? 'hapus semua data' : 'reset ke default'}</button><button type="button" class="btn" data-proto-action="cancel-confirm">Batal</button></div></form></section>`
  }
  function renderSettings() {
    const db = activeDb()
    const report = integrityReport()
    const serialized = JSON.stringify(db)
    const storageSize = niceBytes(bytes(serialized))
    const mustahikCount = (db.mustahiks || []).length
    const collections = [
      ['Lembaga', 'tenants'], ['Akun lembaga', 'users'], ['Akun root', 'platformAdmins'],
      ['Muzakki', 'muzakki'], ['Transaksi', 'transactions'], ['Setoran', 'deposits'],
      ['Mustahik', 'mustahiks'], ['Rencana alokasi', 'allocations'], ['Penyaluran', 'distributions'],
      ['Catatan audit lembaga', 'audit'], ['Audit platform', 'platformAudit'], ['Jurnal keuangan', 'journalEntries'],
    ]
    return `${A.boxhead('Pengaturan Prototype', 'Pusat kendali data untuk menjalankan demo, mengembalikan dataset awal, membuat cadangan, dan memindahkan skenario antar perangkat.')}
      <div class="alert light"><b>Mode simulasi lokal.</b> Semua data tersimpan pada browser ini. Fitur ini hanya untuk menyiapkan demonstrasi dan UAT, bukan administrasi database produksi.</div>
      <div class="cards proto-settings-stats">${A.stat('Lembaga', (db.tenants || []).length, 'Terdaftar pada browser ini')}${A.stat('Transaksi', (db.transactions || []).length, 'Semua Lembaga')}${A.stat('Mustahik', mustahikCount, 'Record seed dipertahankan saat reset')}${A.stat('Ukuran data', storageSize, 'Perkiraan JSON lokal')}</div>
      <section class="proto-settings-grid">
        <article class="card proto-setting-card"><div class="proto-setting-icon">⬇</div><h3>Ekspor cadangan lengkap</h3><p>Unduh satu file JSON berisi semua Lembaga, akun, konfigurasi, transaksi, dataset Mustahik, QR terkait, dan audit. Dapat dipakai untuk memulihkan simulasi ini.</p><button type="button" class="btn primary" data-proto-action="export">Ekspor seluruh data (.json)</button><small>Cadangan mencakup data pribadi simulasi dan seluruh dataset Mustahik. Simpan di lokasi tepercaya; jangan unggah atau bagikan sembarangan.</small></article>
        <article class="card proto-setting-card"><div class="proto-setting-icon">⬆</div><h3>Impor cadangan</h3><p>Pulihkan database dari file cadangan SiZisNur V5. Impor akan menggantikan seluruh data browser yang sedang aktif setelah konfirmasi.</p><label class="proto-file-label" for="prototype-import-file">Pilih file cadangan JSON</label><input class="proto-file-input" id="prototype-import-file" data-proto-import-file type="file" accept=".json,application/json"><small>Menerima cadangan lengkap schema V5 atau file database V5 mentah. Maksimum 30 MB. Impor akan mengganti seluruh database lokal.</small></article>
        <article class="card proto-setting-card"><div class="proto-setting-icon">↺</div><h3>Reset ke data bawaan</h3><p>Kembalikan seluruh simulasi ke kondisi awal versi ini. Data operasional, akun contoh, konfigurasi tarif, transaksi, dan pengaturan lembaga akan dibuat ulang.</p><div class="alert light">Dataset Mustahik bawaan (${mustahikCount} record saat ini) dipertahankan tanpa perubahan. Catatan proyek menjelaskan bahwa record individu ini sintetis non-identifying untuk mereproduksi agregat workbook terverifikasi.</div><button type="button" class="btn" data-proto-action="ask-reset">Reset ke dataset default</button></article>
        <article class="card proto-setting-card danger"><div class="proto-setting-icon">⌫</div><h3>Hapus semua data simulasi</h3><p>Kosongkan seluruh data Lembaga dan data operasional, termasuk seluruh Mustahik dan pengaturan tarif. Akun Admin SiZisNur tetap disimpan supaya Anda dapat membuat Lembaga baru.</p><button type="button" class="btn danger" data-proto-action="ask-clear">Hapus semua data</button></article>
      </section>
      ${renderConfirmPanel()}
      <div class="two-col proto-settings-bottom"><section class="card"><h3>Ringkasan isi database</h3>${A.table(['Koleksi', 'Jumlah'], collections.map(([label, key]) => [esc(label), (db[key] || []).length]))}</section><section class="card"><div class="card-top"><h3>Pemeriksaan integritas sederhana</h3><button type="button" class="btn sm" data-proto-action="integrity">Periksa ulang</button></div><div class="mini-list"><div class="mini-item"><span>Pengguna tanpa Lembaga</span><b>${report.counts.usersWithoutTenant}</b></div><div class="mini-item"><span>Periode tanpa Lembaga</span><b>${report.counts.periodsWithoutTenant}</b></div><div class="mini-item"><span>Transaksi tanpa Muzakki terkait</span><b>${report.counts.transactionsWithoutPerson}</b></div><div class="mini-item"><span>Mustahik tanpa identitas orang</span><b>${report.counts.mustahiksWithoutPerson}</b></div></div><div class="alert ${report.issues ? 'warn' : 'light'}">${report.issues ? `${report.issues} relasi perlu diperiksa.` : 'Tidak ditemukan relasi orphan pada pemeriksaan dasar.'} Pemeriksaan ini bukan validasi akuntansi atau audit keamanan.</div></section></div>
      <section class="card proto-session-card"><div><h3>Preferensi & sesi demo</h3><p>Atur tampilan browser kembali ke tema terang atau akhiri sesi root saat selesai menggunakan konsol.</p></div><div class="actions"><button type="button" class="btn" data-proto-action="reset-theme">Kembalikan tema terang</button><button type="button" class="btn danger" data-proto-action="logout">Keluar dari sesi root</button></div></section>
      <div class="alert warn"><b>Catatan tentang dataset Mustahik.</b> Reset default memulihkan 129 record Mustahik dari seed bawaan tanpa normalisasi, penggantian nama, penghitungan ulang, atau pengacakan. Dokumentasi project menjelaskan bahwa record individu ini sintetis non-identifying untuk mereproduksi agregat workbook terverifikasi; file workbook Excel sumber tidak disertakan. Sebaliknya, tindakan Hapus Semua dan impor file akan mengosongkan/mengganti data tersebut sesuai pilihan Anda.</div>`
  }
  function decorateRoot() {
    if (!rootUser() || state.page !== 'platform-admin') return
    const root = document.getElementById('app')
    if (!root) return
    const before = root.innerHTML
    let html = before
    const tabMarkup = `<button type="button" class="root-nav-btn ${state.platformTab === 'prototype-settings' ? 'active' : ''}" data-root-tab="prototype-settings"><span>◇</span>Pengaturan Prototype</button>`
    if (!html.includes('data-root-tab="prototype-settings"')) html = html.replace('</nav>', `${tabMarkup}</nav>`)
    else html = html.replace(/<button type="button" class="root-nav-btn [^"]*" data-root-tab="prototype-settings"/, `<button type="button" class="root-nav-btn ${state.platformTab === 'prototype-settings' ? 'active' : ''}" data-root-tab="prototype-settings"`)
    if (state.platformTab === 'prototype-settings') {
      html = html.replace(/<main class="root-content">[\s\S]*?<\/main>/, `<main class="root-content">${renderSettings()}</main>`)
      html = html.replace(/(<header class="root-topbar">[\s\S]*?<h1>)[\s\S]*?(<\/h1>)/, '$1Pengaturan Prototype$2')
    }
    if (html !== before) root.innerHTML = html
  }
  function renderRootWithSettings() {
    const render = A.__baseRender || A.render
    render()
    decorateRoot()
  }
  const originalRender = A.render
  A.set('render', () => { originalRender(); decorateRoot() })
  // The root console has its own renderer; observe its DOM updates so the custom
  // prototype tab stays available after tenant, user, and platform-setting actions.
  const appRoot = document.getElementById('app')
  if (appRoot && typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(() => {
      if (rootUser() && state.page === 'platform-admin') Promise.resolve().then(decorateRoot)
    })
    observer.observe(appRoot, { childList: true, subtree: true })
  }

  function handleImportFile(file) {
    if (!rootUser()) throw new Error('Hanya Admin SiZisNur yang dapat mengimpor data.')
    if (!file) return
    if (file.size > 30 * 1024 * 1024) throw new Error('Ukuran file melebihi batas 30 MB.')
    const process = (text) => {
      const summary = prepareImport(text)
      A.toast(`File valid: ${summary.tenants} Lembaga, ${summary.transactions} transaksi, ${summary.mustahiks} Mustahik. Periksa konfirmasi sebelum mengganti data.`, 'success')
    }
    if (typeof file.text === 'function') file.text().then(process).catch((error) => A.toast(error.message || 'Gagal membaca file.', 'error'))
    else if (typeof FileReader !== 'undefined') {
      const reader = new FileReader()
      reader.onload = () => { try { process(reader.result) } catch (error) { A.toast(error.message || String(error), 'error') } }
      reader.onerror = () => A.toast('Tidak dapat membaca file cadangan.', 'error')
      reader.readAsText(file)
    } else throw new Error('Browser tidak mendukung pembacaan file. Coba browser modern.')
  }

  document.addEventListener('click', (event) => {
    const tab = event.target.closest?.('[data-root-tab]')
    if (tab && rootUser()) {
      // The platform module handles the tab first; decorate again after its render.
      Promise.resolve().then(decorateRoot)
      return
    }
    const button = event.target.closest?.('[data-proto-action]')
    if (!button) {
      if (rootUser() && event.target.closest?.('[data-root-action]')) Promise.resolve().then(decorateRoot)
      return
    }
    if (!rootUser()) { A.toast('Hanya Admin SiZisNur yang dapat mengelola data prototype global.', 'error'); return }
    const action = button.dataset.protoAction
    try {
      switch (action) {
        case 'export': exportFullBackup(); break
        case 'ask-reset': ask('reset'); break
        case 'ask-clear': ask('clear'); break
        case 'cancel-confirm': confirmMode = ''; pendingImport = null; pendingImportSummary = null; A.render(); break
        case 'import-confirm': applyImport(); break
        case 'integrity': {
          const report = integrityReport()
          A.toast(report.issues ? `${report.issues} relasi perlu diperiksa.` : 'Pemeriksaan integritas dasar lulus.', report.issues ? 'warn' : 'success')
          break
        }
        case 'reset-theme': window.localStorage.removeItem(A.THEMEKEY); A.render(); A.toast('Preferensi tema dikembalikan ke terang.'); break
        case 'logout': A.logout(); break
        default: break
      }
      if (action === 'ask-reset' || action === 'ask-clear' || action === 'cancel-confirm') return
      if (action !== 'export' && action !== 'logout') A.render()
    } catch (error) { A.toast(error.message || String(error), 'error') }
  })

  document.addEventListener('submit', (event) => {
    const form = event.target.closest?.('form[data-proto-form]')
    if (!form) return
    event.preventDefault()
    if (!rootUser()) return A.toast('Sesi root tidak aktif.', 'error')
    const value = new FormData(form).get('confirmText') || ''
    try {
      if (form.dataset.protoForm === 'reset-confirm') {
        if (value.trim() !== 'RESET DEFAULT') throw new Error('Ketik RESET DEFAULT persis untuk mengonfirmasi reset.')
        resetToDefault()
      } else if (form.dataset.protoForm === 'clear-confirm') {
        if (value.trim() !== 'HAPUS SEMUA') throw new Error('Ketik HAPUS SEMUA persis untuk mengonfirmasi penghapusan.')
        clearAllData()
      }
    } catch (error) { A.toast(error.message || String(error), 'error') }
  })
  document.addEventListener('change', (event) => {
    const input = event.target.closest?.('[data-proto-import-file]')
    if (!input) return
    try { handleImportFile(input.files?.[0]) } catch (error) { A.toast(error.message || String(error), 'error') }
    input.value = ''
  })

  window.__SIZISNUR_PROTOTYPE_SETTINGS = {
    backupPayload, validateDatabase, normalizeImportedDatabase, parseBackup,
    exportFullBackup, resetToDefault, clearAllData, prepareImport, applyImport,
    integrityReport, renderSettings,
  }
  A.render()
})()
