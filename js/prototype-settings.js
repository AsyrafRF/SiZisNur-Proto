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

  function preservedRootAccount() {
    const root = (activeDb().platformAdmins || []).find((item) => item.id === ROOT_ACCOUNT.id)
    return { ...clone(root || ROOT_ACCOUNT), ...clone(ROOT_ACCOUNT), ...(root ? clone(root) : {}), id: ROOT_ACCOUNT.id, role: ROOT_ACCOUNT.role, scope: 'platform', active: true }
  }
  function preparePreset(profile) {
    if (profile === 'multi-tenant') return A.seedMultiTenant()
    if (profile === 'annur-default') return A.seed()
    throw new Error('Dataset tidak dikenal. Pilih Dataset Multi-Lembaga atau Dataset Masjid An-Nur.')
  }
  function finalizePreset(fresh, profile) {
    DB_ARRAYS.forEach((key) => { if (!Array.isArray(fresh[key])) fresh[key] = [] })
    fresh.transactions.forEach((transaction) => {
      if (String(transaction.status || '').trim().toLowerCase() === 'tercatat') transaction.status = 'pending'
      if (transaction.status === 'pending') window.__SIZISNUR_TRANSACTION_POLICY?.normalizePendingExpiry?.(transaction)
    })
    fresh.platformAdmins = [preservedRootAccount()]
    fresh.users = (fresh.users || []).filter((item) => item.id !== ROOT_ACCOUNT.id)
    fresh.platformAudit = []
    fresh.platformSettings = clone(DEFAULT_PLATFORM_SETTINGS)
    fresh.datasetProfile = profile
    fresh.datasetLabel = profile === 'multi-tenant' ? 'Dataset Multi-Lembaga' : 'Dataset Masjid An-Nur'
    fresh.seedRevision = Math.max(Number(fresh.seedRevision || 0), 3)
    return fresh
  }

  function clone(value) { return JSON.parse(JSON.stringify(value)) }
  function activeDb() { return A.db }
  function bytes(value) { return typeof TextEncoder !== 'undefined' ? new TextEncoder().encode(value).length : unescape(encodeURIComponent(value)).length }
  function countOf(name) { return Array.isArray(activeDb()[name]) ? activeDb()[name].length : 0 }
  function storedDatabaseBytes() {
    // Read the already-persisted JSON length instead of serializing the full
    // database every time the settings view renders. This keeps large imports
    // from causing avoidable main-thread work when the page is opened.
    try {
      const stored = window.localStorage.getItem(A.DBKEY)
      if (typeof stored === 'string') return bytes(stored)
    } catch (_) { /* Fall back to measuring the in-memory database. */ }
    return bytes(JSON.stringify(activeDb()))
  }
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
    next.transactions.forEach((transaction) => {
      if (String(transaction.status || '').trim().toLowerCase() === 'tercatat') transaction.status = 'pending'
      if (transaction.status !== 'pending') return
      const policy = window.__SIZISNUR_TRANSACTION_POLICY
      if (policy?.normalizePendingExpiry) {
        policy.normalizePendingExpiry(transaction)
        return
      }
      const createdAtMs = Date.parse(transaction.createdAt || '')
      const oldExpiryMs = Date.parse(transaction.expiresAt || '')
      const hasCreatedAt = Number.isFinite(createdAtMs)
      if (!hasCreatedAt && transaction.expiryPolicy === 'amil-2h-v1') return
      const hasLegacyExpiry = Number.isFinite(oldExpiryMs) && oldExpiryMs > 0
      const originalCreatedAtMs = hasCreatedAt ? createdAtMs : hasLegacyExpiry ? oldExpiryMs - 24 * 60 * 60 * 1000 : 0
      transaction.expiresAt = hasCreatedAt || hasLegacyExpiry
        ? new Date(originalCreatedAtMs + 2 * 60 * 60 * 1000).toISOString()
        : new Date(0).toISOString()
      transaction.expiryPolicy = 'amil-2h-v1'
    })
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
  function loadDatasetPreset(profile, options = {}) {
    if (!rootUser()) throw new Error('Penggantian dataset hanya tersedia untuk Admin SiZisNur.')
    const fresh = finalizePreset(preparePreset(profile), profile)
    replaceDatabase(fresh)
    // Rebuild data derived by the V5 layer on first boot because switching a
    // preset replaces the database in-place without reloading the script bundle.
    window.__SIZISNUR_REBUILD_DEMO_MUZAKKI?.()
    window.__SIZISNUR_REBUILD_TENANT_TERRITORIES?.()
    window.__SIZISNUR_MIGRATE_MUSTAHIK_REGIONS?.()
    window.__SIZISNUR_REBUILD_AUDIT_HASHES?.()
    A.persist()
    confirmMode = ''; pendingImport = null; pendingImportSummary = null
    if (options.reload !== false && window.location?.reload) window.location.reload()
    else A.render()
    return { profile, label: fresh.datasetLabel, tenants: fresh.tenants.length, applications: fresh.applications.length, users: fresh.users.length, mustahiks: fresh.mustahiks.length }
  }
  function resetToDefault(options = {}) {
    // The default reset is intentionally Masjid An-Nur only.
    return loadDatasetPreset('annur-default', options)
  }
  function emptyDatabaseFromSeed() {
    const empty = A.seed()
    DB_ARRAYS.forEach((key) => { empty[key] = [] })
    empty.platformAdmins = [preservedRootAccount()]
    empty.users = []
    empty.platformAudit = []
    empty.platformSettings = clone(DEFAULT_PLATFORM_SETTINGS)
    empty.datasetProfile = 'empty'
    empty.datasetLabel = 'Data simulasi telah dikosongkan'
    empty.seedRevision = Math.max(Number(empty.seedRevision || 0), 3)
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
      // A Muzakki account may exist independently before the user joins any institution.
      usersWithoutTenant: (db.users || []).filter((item) => item.role !== 'Muzakki' && !tenantIds.has(item.tenantId)).length,
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
    if (confirmMode === 'dataset-multi' || confirmMode === 'dataset-annur') {
      const profile = confirmMode === 'dataset-multi' ? 'multi-tenant' : 'annur-default'
      const preview = preparePreset(profile)
      const label = profile === 'multi-tenant' ? 'Dataset Multi-Lembaga' : 'Dataset Masjid An-Nur'
      const detail = profile === 'multi-tenant'
        ? 'Mengganti seluruh data lokal dengan dua lembaga contoh (Masjid An-Nur dan Masjid Al-Hikmah) serta satu pengajuan lembaga Masjid Al-Falah berstatus menunggu. Catatan dan data acuan workbook tidak ditambahkan sebagai skenario simulasi baru di dataset multi-lembaga.'
        : 'Mengganti seluruh data lokal dengan satu lembaga, yaitu Masjid An-Nur, beserta data operasional dan dataset Mustahik acuan 1447H yang dipertahankan dalam prototype.'
      return `<section class="card proto-confirm-card"><div class="proto-confirm-head"><span class="tag warn">KONFIRMASI GANTI DATASET</span><h3>Aktifkan ${label}?</h3><p>${detail}</p></div><div class="proto-confirm-stats"><span>${preview.tenants.length}<small>Lembaga</small></span><span>${preview.applications.length}<small>Pengajuan</small></span><span>${preview.users.length}<small>Akun lembaga</small></span><span>${preview.mustahiks.length}<small>Mustahik</small></span></div><form data-proto-form="dataset-confirm" data-profile="${profile}"><div class="field"><label>Ketik <b>GANTI DATASET</b> untuk melanjutkan</label><input name="confirmText" autocomplete="off" required></div><div class="form-actions"><button type="submit" class="btn primary">Aktifkan ${label}</button><button type="button" class="btn" data-proto-action="cancel-confirm">Batal</button></div></form></section>`
    }
    const isClear = confirmMode === 'clear'
    const title = isClear ? 'Hapus semua data simulasi?' : 'Kembalikan ke dataset bawaan?'
    const detail = isClear
      ? 'Seluruh lembaga, akun Panitia dan Muzakki, transaksi, Mustahik, tarif, wilayah, dan data operasional akan dihapus. Hanya satu akun Admin SiZisNur (Root) yang dipertahankan, termasuk kredensial root saat ini. Fitur aplikasi tetap tersedia; setelah lembaga ditambahkan kembali, Master Wilayah akan dibuat otomatis untuk lembaga tersebut.'
      : 'Seluruh perubahan simulasi akan diganti dengan Dataset Masjid An-Nur sebagai dataset default. Hanya akun Root yang dipertahankan dari sesi saat ini; akun dan data contoh akan dibuat ulang. Dataset Mustahik kembali ke seed acuan yang sama.'
    const phrase = isClear ? 'HAPUS SEMUA' : 'RESET DEFAULT'
    const action = isClear ? 'clear-confirm' : 'reset-confirm'
    return `<section class="card proto-confirm-card ${isClear ? 'danger' : ''}"><div class="proto-confirm-head"><span class="tag ${isClear ? 'bad' : 'warn'}">TINDAKAN DESTRUKTIF</span><h3>${title}</h3><p>${detail}</p></div><form data-proto-form="${action}"><div class="field"><label>Ketik <b>${phrase}</b> untuk melanjutkan</label><input name="confirmText" autocomplete="off" required></div><div class="form-actions"><button type="submit" class="btn ${isClear ? 'danger' : 'primary'}">Konfirmasi ${isClear ? 'hapus semua data' : 'reset ke default'}</button><button type="button" class="btn" data-proto-action="cancel-confirm">Batal</button></div></form></section>`
  }
  function renderSettings() {
    const db = activeDb()
    const report = integrityReport()
    const storageSize = niceBytes(storedDatabaseBytes())
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
      <div class="alert light"><b>Dataset aktif:</b> ${esc(db.datasetLabel || (db.datasetProfile === 'empty' ? 'Data kosong' : 'Dataset kustom / impor'))}. Dataset dapat diganti kapan saja melalui pilihan di bawah. Semua pergantian mengganti data lokal; ekspor cadangan terlebih dahulu bila ingin menyimpan perubahan.</div>
      <section class="proto-settings-grid">
        <article class="card proto-setting-card"><div class="proto-setting-icon">⬇</div><h3>Ekspor cadangan lengkap</h3><p>Unduh satu file JSON berisi semua Lembaga, akun, konfigurasi, transaksi, dataset Mustahik, QR terkait, dan audit. Dapat dipakai untuk memulihkan simulasi ini.</p><button type="button" class="btn primary" data-proto-action="export">Ekspor seluruh data (.json)</button><small>Cadangan mencakup data pribadi simulasi dan seluruh dataset Mustahik. Simpan di lokasi tepercaya; jangan unggah atau bagikan sembarangan.</small></article>
        <article class="card proto-setting-card"><div class="proto-setting-icon">⬆</div><h3>Impor cadangan</h3><p>Pulihkan database dari file cadangan SiZisNur V5. Impor akan menggantikan seluruh data browser yang sedang aktif setelah konfirmasi.</p><label class="proto-file-label" for="prototype-import-file">Pilih file cadangan JSON</label><input class="proto-file-input" id="prototype-import-file" data-proto-import-file type="file" accept=".json,application/json"><small>Menerima cadangan lengkap schema V5 atau file database V5 mentah. Maksimum 30 MB. Impor akan mengganti seluruh database lokal.</small></article>
        <article class="card proto-setting-card"><div class="proto-setting-icon">↺</div><h3>Reset ke dataset default</h3><p>Memulihkan dataset bawaan utama: satu lembaga Masjid An-Nur beserta data operasional dan acuan 1447H.</p><div class="alert light">Dataset Mustahik (${mustahikCount} record pada data aktif) memakai 129 record sintetis non-identifying; angka agregat dan catatan acuan workbook tetap ditampilkan pada modul An-Nur.</div><button type="button" class="btn" data-proto-action="ask-reset">Kembali ke data default An-Nur</button></article>
        <article class="card proto-setting-card"><div class="proto-setting-icon">⌫</div><h3>Hapus semua data simulasi</h3><p>Hapus seluruh data lembaga, akun pengguna, akun Muzakki, transaksi, wilayah dan data operasional. Hanya akun Admin SiZisNur (Root) yang tetap ada.</p><button type="button" class="btn danger" data-proto-action="ask-clear">Hapus semua data</button></article>
        <article class="card proto-setting-card"><div class="proto-setting-icon">▦</div><h3>Dataset Multi-Lembaga</h3><p>Memuat dua lembaga contoh: Masjid An-Nur dan Masjid Al-Hikmah, beserta satu pengajuan Masjid Al-Falah yang menunggu persetujuan. Cocok untuk menguji pemisahan data antar lembaga.</p><div class="mini-list"><div class="mini-item"><span>Jumlah lembaga</span><b>2 masjid</b></div><div class="mini-item"><span>Pengajuan tambahan</span><b>Masjid Al-Falah</b></div></div><button type="button" class="btn" data-proto-action="ask-dataset-multi">Gunakan Dataset Multi-Lembaga</button></article>
        <article class="card proto-setting-card"><div class="proto-setting-icon">⌂</div><h3>Dataset Masjid An-Nur</h3><p>Memuat hanya Masjid An-Nur dengan data operasional, modul acuan workbook 1447H, dan 129 record Mustahik sintetis sesuai agregat referensi. Ini adalah dataset default prototype.</p><div class="mini-list"><div class="mini-item"><span>Jumlah lembaga</span><b>1 masjid</b></div><div class="mini-item"><span>Dataset acuan</span><b>1447H / 2026M</b></div></div><button type="button" class="btn primary" data-proto-action="ask-dataset-annur">Gunakan Dataset Masjid An-Nur</button></article>
      </section>
      ${renderConfirmPanel()}
      <div class="two-col proto-settings-bottom"><section class="card"><h3>Ringkasan isi database</h3>${A.table(['Koleksi', 'Jumlah'], collections.map(([label, key]) => [esc(label), (db[key] || []).length]))}</section><section class="card"><div class="card-top"><h3>Pemeriksaan integritas sederhana</h3><button type="button" class="btn sm" data-proto-action="integrity">Periksa ulang</button></div><div class="mini-list"><div class="mini-item"><span>Pengguna tanpa Lembaga</span><b>${report.counts.usersWithoutTenant}</b></div><div class="mini-item"><span>Periode tanpa Lembaga</span><b>${report.counts.periodsWithoutTenant}</b></div><div class="mini-item"><span>Transaksi tanpa Muzakki terkait</span><b>${report.counts.transactionsWithoutPerson}</b></div><div class="mini-item"><span>Mustahik tanpa identitas orang</span><b>${report.counts.mustahiksWithoutPerson}</b></div></div><div class="alert ${report.issues ? 'warn' : 'light'}">${report.issues ? `${report.issues} relasi perlu diperiksa.` : 'Tidak ditemukan relasi orphan pada pemeriksaan dasar.'} Pemeriksaan ini bukan validasi akuntansi atau audit keamanan.</div></section></div>
      <section class="card proto-session-card"><div><h3>Preferensi & sesi demo</h3><p>Atur tampilan browser kembali ke tema terang atau akhiri sesi root saat selesai menggunakan konsol.</p></div><div class="actions"><button type="button" class="btn" data-proto-action="reset-theme">Kembalikan tema terang</button><button type="button" class="btn danger" data-proto-action="logout">Keluar dari sesi root</button></div></section>
      <div class="alert warn"><b>Catatan tentang dataset Mustahik.</b> Reset default memulihkan 129 record Mustahik dari seed bawaan tanpa normalisasi, penggantian nama, penghitungan ulang, atau pengacakan. Dokumentasi project menjelaskan bahwa record individu ini sintetis non-identifying untuk mereproduksi agregat workbook terverifikasi; file workbook Excel sumber tidak disertakan. Sebaliknya, tindakan Hapus Semua dan impor file akan mengosongkan/mengganti data tersebut sesuai pilihan Anda.</div>`
  }
  // The platform console renders this page as a native root tab. Avoid DOM
  // decoration or subtree observers here: replacing the root DOM from a
  // MutationObserver can recursively retrigger itself and freeze the browser.

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
    const button = event.target.closest?.('[data-proto-action]')
    if (!button) return
    if (!rootUser()) { A.toast('Hanya Admin SiZisNur yang dapat mengelola data prototype global.', 'error'); return }
    const action = button.dataset.protoAction
    try {
      switch (action) {
        case 'export': exportFullBackup(); break
        case 'ask-reset': ask('reset'); break
        case 'ask-clear': ask('clear'); break
        case 'ask-dataset-multi': ask('dataset-multi'); break
        case 'ask-dataset-annur': ask('dataset-annur'); break
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
      if (action.startsWith('ask-') || action === 'cancel-confirm') return
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
      } else if (form.dataset.protoForm === 'dataset-confirm') {
        if (value.trim() !== 'GANTI DATASET') throw new Error('Ketik GANTI DATASET persis untuk mengonfirmasi penggantian dataset.')
        loadDatasetPreset(form.dataset.profile)
      }
      A.clearModalDraft?.(form)
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
    exportFullBackup, resetToDefault, clearAllData, loadDatasetPreset, prepareImport, applyImport,
    integrityReport, renderSettings,
  }
  A.render()
})()
