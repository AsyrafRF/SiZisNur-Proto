/* SiZisNur V5 revision layer
   Prototype-only workflows. Local persistence is not a production security boundary. */
(function () {
  'use strict'
  const A = window.__SiZisNurBridge
  if (!A) throw new Error('SiZisNur core bridge is missing')
  let db = A.db
  const state = A.state
  const nav = typeof navigator !== 'undefined' ? navigator : { onLine: true, userAgent: 'prototype-test' }
  const $ = (id) => document.getElementById(id)
  const esc = A.e
  const money = A.rup
  const kilos = A.kg
  const timestamp = A.now
  const dateToday = A.today
  const newId = A.id
  const formData = (form) => Object.fromEntries(new FormData(form).entries())
  const sum = (arr, fn) => arr.reduce((total, item) => total + Number(typeof fn === 'function' ? fn(item) : item[fn] || 0), 0)
  const normalize = (s) => String(s || '').trim().toLowerCase()
  const activeUser = () => A.user()
  const currentTenantId = () => A.tenantId()
  const currentPeriod = () => A.activePeriod()
  const allCurrent = (name) => A.scoped(name)
  const add = (tag, body, extra = '') => `<section class="card ${extra}"><h3>${tag}</h3>${body}</section>`
  const action = (label, key, extra = '') => `<button type="button" class="btn ${extra}" data-v5-action="${key}">${label}</button>`
  const actionFor = (label, key, id, extra = '') => `<button type="button" class="btn ${extra}" data-v5-action="${key}" data-id="${esc(id)}">${label}</button>`
  const formButton = (label) => `<div class="form-actions"><button type="submit" class="btn primary">${label}</button></div>`
  const alert = (text, kind = 'light') => `<div class="alert ${kind}">${text}</div>`
  const cardTitle = (title, note = '') => `<div class="card-top"><h3>${title}</h3><span class="caption">${note}</span></div>`
  const transactionToken = (tx) => `SIZISNUR|${tx.tenantId}|${tx.id}|${tx.serial}`
  const mustahikToken = (m) => `SIZISNUR|MUSTAHIK|${m.tenantId}|${m.id}`
  const statusActive = (s) => !['batal', 'expired', 'kedaluwarsa', 'ditolak'].includes(s)

  db.version = 5
  db.accounts ||= []
  db.households ||= []
  db.muzakkiMemberships ||= []
  db.batches ||= []
  db.shiftSessions ||= []
  db.corrections ||= []
  db.supportTickets ||= []
  db.journalEntries ||= []
  db.syncQueue ||= []
  db.periodReports ||= []
  db.transactions ||= []
  db.audit ||= []
  db.tenants ||= []
  db.rules ||= []
  const demoMuzakki = db.users.find((u) => u.id === 'US-MZK')
  if (demoMuzakki) {
    demoMuzakki.name = 'Muzakki Demo'
    demoMuzakki.role = 'Muzakki'
    demoMuzakki.accountId = 'ACC-MZK-01'
    demoMuzakki.personId = 'PS-01'
  }
  if (!db.users.some((u) => u.id === 'US-REL')) db.users.push({ id: 'US-REL', tenantId: 'TN-ANNUR', name: 'Relawan Demo', role: 'Relawan', email: 'relawan@demo.invalid', active: true })
  const oldAdmin = db.users.find((u) => u.id === 'US-PTG')
  if (oldAdmin) { oldAdmin.name = 'Admin Data Mustahik Demo'; oldAdmin.email = 'admin.data@demo.invalid'; oldAdmin.role = 'Admin' }
  if (!db.accounts.some((x) => x.id === 'ACC-MZK-01')) db.accounts.push({
    id: 'ACC-MZK-01', userId: 'US-MZK', displayName: 'Muzakki Demo', phone: '080000000101', email: 'muzakki@demo.invalid', consentAt: null,
  })
  if (!db.households.some((x) => x.accountId === 'ACC-MZK-01')) db.households.push(
    { id: 'HH-001', accountId: 'ACC-MZK-01', name: 'Ahmad Santoso', relation: 'Kepala keluarga' },
    { id: 'HH-002', accountId: 'ACC-MZK-01', name: 'Aisyah Santoso', relation: 'Pasangan' },
    { id: 'HH-003', accountId: 'ACC-MZK-01', name: 'Hasan Santoso', relation: 'Anak' },
    { id: 'HH-004', accountId: 'ACC-MZK-01', name: 'Maryam Santoso', relation: 'Anak' },
  )
  if (demoMuzakki && !db.muzakkiMemberships.some((x) => x.userId === 'US-MZK' && x.tenantId === 'TN-ANNUR')) db.muzakkiMemberships.push({
    id: 'MBR-ANNUR', userId: 'US-MZK', tenantId: 'TN-ANNUR', personId: 'PS-01', regionType: 'VPA', regionName: 'Villa Pesona Asri & Marbella 2 / VPA', rt: 'RT 01', joinedAt: timestamp(),
  })
  if (demoMuzakki && !db.muzakkiMemberships.some((x) => x.userId === 'US-MZK' && x.tenantId === 'TN-ALHIKMAH')) db.muzakkiMemberships.push({
    id: 'MBR-ALHIKMAH', userId: 'US-MZK', tenantId: 'TN-ALHIKMAH', personId: 'PS-T2', regionType: 'Non VPA', regionName: 'Non VPA', rt: '', joinedAt: timestamp(),
  })
  const annur = db.tenants.find((x) => x.id === 'TN-ANNUR')
  if (annur) { annur.daerah ||= 'Villa Pesona Asri & Marbella 2 / VPA'; annur.upzType ||= 'UPZ Masjid / Perumahan'; annur.baznasArea ||= 'BAZNAS Kota / Kabupaten (perlu ditetapkan)' }
  db.rules.forEach((r) => {
    r.nisabGoldGram ??= 85
    r.goldPricePerGram ??= 1500000
    r.fidyahRate ??= 30000
    r.kafaratRate ??= 0
  })
  db.audit.slice().reverse().forEach((entry) => {
    if (!entry.hash) {
      const prev = db.audit.slice().reverse().find((x) => x.at < entry.at && x.hash)?.hash || 'GENESIS'
      entry.prevHash = prev
      entry.hash = hashAudit(`${prev}|${entry.id}|${entry.at}|${entry.by}|${entry.type}|${entry.detail}`)
    }
  })

  const roles = ['Admin', 'Muzakki', 'Operator', 'Amil', 'Bendahara', 'Relawan', 'Pengurus']
  A.ROLES.splice(0, A.ROLES.length, ...roles)
  Object.assign(A.PAGES, {
    dashboard: ['Ringkasan', '◫', 'Semua'],
    tenant: ['Profil Lembaga & UPZ', '⌂', ['Admin', 'Pengurus']],
    users: ['Akun & Peran', '♙', ['Admin']],
    periods: ['Periode Zakat', '▦', ['Admin']],
    settings: ['Tarif & Rumus', '⚙', ['Admin']],
    schedule: ['Shift & Kehadiran', '◷', ['Amil']],
    muzakki: ['Data Muzakki', '♧', ['Operator', 'Amil']],
    transactions: ['Penerimaan & Verifikasi', '▤', ['Operator', 'Amil', 'Pengurus']],
    deposits: ['Serah Terima & Rekonsiliasi', '▣', ['Bendahara', 'Pengurus']],
    ledger: ['Jurnal & Laporan Keuangan', '▧', ['Bendahara', 'Pengurus']],
    corrections: ['Koreksi Terkendali', '⊙', ['Bendahara', 'Amil', 'Operator', 'Pengurus']],
    mustahik: ['Mustahik & Kelayakan', '♧', ['Admin']],
    allocation: ['Alokasi & Persetujuan', '▥', ['Bendahara', 'Pengurus']],
    distribution: ['Batch & Penyaluran Lapangan', '⇥', ['Bendahara', 'Relawan']],
    incentives: ['Insentif Amil', '♢', ['Bendahara', 'Pengurus']],
    reports: ['Laporan & Statistik', '▧', ['Bendahara', 'Pengurus']],
    workbook: ['Acuan Workbook 1447H', '▤', ['Admin', 'Bendahara', 'Pengurus']],
    notifications: ['Notifikasi', '✉', ['Admin', 'Amil']],
    audit: ['Audit & Arsip', '⊙', ['Admin', 'Bendahara', 'Pengurus']],
    help: ['Panduan & Bantuan', '?', 'Semua'],
    'my-zis': ['Akun Muzakki', '♙', ['Muzakki']],
    'amil-guide': ['Dalil, Ketentuan & Akad', '۞', ['Amil']],
    prototype: ['Evaluasi Prototype', '◇', 'Semua'],
  })
  const pageAccess = {
    dashboard: roles,
    tenant: ['Admin', 'Pengurus'], users: ['Admin'], periods: ['Admin'], settings: ['Admin'],
    schedule: ['Amil'], muzakki: ['Operator', 'Amil'], transactions: ['Operator', 'Amil', 'Pengurus'],
    deposits: ['Bendahara', 'Pengurus'], ledger: ['Bendahara', 'Pengurus'], corrections: ['Bendahara', 'Amil', 'Operator', 'Pengurus'],
    mustahik: ['Admin'], allocation: ['Bendahara', 'Pengurus'], distribution: ['Bendahara', 'Relawan'],
    incentives: ['Bendahara', 'Pengurus'], reports: ['Bendahara', 'Pengurus'], workbook: ['Admin', 'Bendahara', 'Pengurus'],
    notifications: ['Admin', 'Amil'], audit: ['Admin', 'Bendahara', 'Pengurus'], help: roles,
    'my-zis': ['Muzakki'], 'amil-guide': ['Amil'], prototype: roles,
  }
  function canV5(page) {
    const u = activeUser()
    if (!u || !pageAccess[page]) return false
    if (page === 'workbook' && currentTenantId() !== 'TN-ANNUR') return false
    return pageAccess[page].includes(u.role)
  }
  A.set('can', canV5)
  A.set('assertRole', (allowed) => {
    const u = activeUser()
    if (!u || !allowed.includes(u.role)) throw new Error(`Aksi tidak diizinkan untuk role ${u?.role || 'publik'}`)
  })
  A.set('tenantId', () => A.session?.tenantId || activeUser()?.tenantId || 'TN-ANNUR')

  function saveSession() {
    if (!A.session) return
    const key = 'sizisnur_demo_session_v5'
    try {
      ;(A.session.remember ? window.localStorage : window.sessionStorage).setItem(key, JSON.stringify(A.session))
    } catch (_) { /* Storage may be unavailable in a private browser context */ }
  }
  const rawLogin = A.login
  A.set('login', (uid, remember = false) => {
    rawLogin(uid, remember)
    const u = activeUser()
    if (!u) return
    const membership = db.muzakkiMemberships.find((x) => x.userId === uid)
    if (u.role === 'Muzakki' && membership) A.session.tenantId = membership.tenantId
    else A.session.tenantId = u.tenantId
    state.page = u.role === 'Muzakki' ? 'my-zis' : 'dashboard'
    saveSession()
    A.render()
  })
  if (A.session && activeUser()?.role === 'Muzakki') {
    const membership = db.muzakkiMemberships.find((x) => x.userId === A.session.userId && x.tenantId === A.session.tenantId)
    if (!membership) A.session.tenantId = db.muzakkiMemberships.find((x) => x.userId === A.session.userId)?.tenantId || activeUser().tenantId
  }

  // SHA-256 implementation keeps the prototype checksum deterministic without external libraries.
  function hashAudit(value) {
    const text = unescape(encodeURIComponent(String(value)))
    const bytes = Array.from(text, (char) => char.charCodeAt(0))
    const bitLength = bytes.length * 8
    bytes.push(0x80)
    while ((bytes.length % 64) !== 56) bytes.push(0)
    const high = Math.floor(bitLength / 0x100000000), low = bitLength >>> 0
    for (let i = 3; i >= 0; i -= 1) bytes.push((high >>> (i * 8)) & 255)
    for (let i = 3; i >= 0; i -= 1) bytes.push((low >>> (i * 8)) & 255)
    const k = [
      0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
      0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
      0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
      0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
      0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
      0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
      0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
      0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
    ]
    const h = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]
    const rotr = (x, n) => (x >>> n) | (x << (32 - n))
    for (let offset = 0; offset < bytes.length; offset += 64) {
      const w = new Uint32Array(64)
      for (let i = 0; i < 16; i += 1) { const j = offset + i * 4; w[i] = ((bytes[j] << 24) | (bytes[j + 1] << 16) | (bytes[j + 2] << 8) | bytes[j + 3]) >>> 0 }
      for (let i = 16; i < 64; i += 1) {
        const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3)
        const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10)
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0
      }
      let [a,b,c,d,e,f,g,hh] = h
      for (let i = 0; i < 64; i += 1) {
        const s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)
        const ch = (e & f) ^ (~e & g)
        const t1 = (hh + s1 + ch + k[i] + w[i]) >>> 0
        const s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)
        const maj = (a & b) ^ (a & c) ^ (b & c)
        const t2 = (s0 + maj) >>> 0
        hh=g; g=f; f=e; e=(d+t1)>>>0; d=c; c=b; b=a; a=(t1+t2)>>>0
      }
      const values = [a,b,c,d,e,f,g,hh]
      for (let i = 0; i < 8; i += 1) h[i] = (h[i] + values[i]) >>> 0
    }
    return h.map((x) => x.toString(16).padStart(8, '0')).join('')
  }
  function verifyAuditChain() {
    const entries = A.scoped('audit').slice().reverse()
    let prev = 'GENESIS'
    const errors = []
    entries.forEach((item, index) => {
      const payload = `${prev}|${item.id}|${item.at}|${item.by}|${item.type}|${item.detail}`
      const expected = hashAudit(payload)
      if (item.prevHash !== prev || item.hash !== expected) errors.push(index + 1)
      prev = item.hash || expected
    })
    return { valid: errors.length === 0, errors, count: entries.length, head: prev }
  }
  A.set('auditHash', hashAudit)
  A.set('auditVerify', verifyAuditChain)
  const rawAud = A.aud
  A.aud = (type, detail) => {
    const previous = A.scoped('audit')[0]?.hash || 'GENESIS'
    const entry = { id: newId('AU'), tenantId: currentTenantId(), at: timestamp(), by: activeUser()?.name || 'Sistem Demo', type, detail, prevHash: previous }
    entry.hash = hashAudit(`${previous}|${entry.id}|${entry.at}|${entry.by}|${entry.type}|${entry.detail}`)
    db.audit.unshift(entry)
    A.persist()
    return entry
  }
  // One-time migration from the earlier demo checksum to SHA-256 per tenant.
  if (db.auditAlgorithm !== 'SHA-256-v1') {
    const tenants = [...new Set(db.audit.map((x) => x.tenantId || 'TN-ANNUR'))]
    tenants.forEach((tenantId) => {
      const entries = db.audit.filter((x) => (x.tenantId || 'TN-ANNUR') === tenantId).slice().reverse().sort((a, b) => String(a.at).localeCompare(String(b.at)))
      let previous = 'GENESIS'
      entries.forEach((item) => {
        item.tenantId ||= tenantId
        item.prevHash = previous
        item.hash = hashAudit(`${previous}|${item.id}|${item.at}|${item.by}|${item.type}|${item.detail}`)
        previous = item.hash
      })
    })
    db.auditAlgorithm = 'SHA-256-v1'
  }
  function backfillAudit() {
    const entries = A.scoped('audit').slice().reverse()
    let previous = entries.length > 1 ? entries[entries.length - 2].hash || 'GENESIS' : 'GENESIS'
    const latest = entries[entries.length - 1]
    if (latest && !latest.hash) {
      latest.prevHash = previous
      latest.hash = hashAudit(`${previous}|${latest.id}|${latest.at}|${latest.by}|${latest.type}|${latest.detail}`)
    }
  }

  function enqueueSync(type, payload = {}) {
    const eventTenantId = payload.tenantId || currentTenantId()
    const relation = {
      transactionId: 'transactions', distributionId: 'distributions', ticketId: 'supportTickets',
      depositId: 'deposits', shiftId: 'shiftSessions', correctionId: 'corrections',
      allocationId: 'allocations', batchId: 'batches', mustahikId: 'mustahiks', userId: 'users',
      membershipId: 'muzakkiMemberships', personId: 'persons', accountId: 'accounts', tenantId: 'tenants',
    }
    const records = {}
    Object.entries(relation).forEach(([key, collection]) => {
      const id = payload[key]
      if (!id) return
      const item = db[collection]?.find((x) => x.id === id && (
        x.tenantId === eventTenantId ||
        collection === 'accounts' && x.userId === (payload.userId || activeUser()?.id) ||
        collection === 'users' && x.id === (payload.userId || activeUser()?.id) && x.tenantId === eventTenantId ||
        collection === 'tenants' && x.id === eventTenantId
      ))
      if (item) records[collection] = item
    })
    const tx = records.transactions
    const relatedTransactionId = records.corrections?.transactionId
    if (relatedTransactionId && !records.transactions) {
      const relatedTx = db.transactions.find((x) => x.id === relatedTransactionId && x.tenantId === eventTenantId)
      if (relatedTx) records.transactions = relatedTx
    }
    if (Array.isArray(records.deposits?.transactionIds)) {
      records.transactionItems = db.transactions.filter((x) => records.deposits.transactionIds.includes(x.id) && x.tenantId === eventTenantId)
    }
    const relatedBatchId = records.distributions?.batchId
    if (relatedBatchId && !records.batches) {
      const relatedBatch = db.batches.find((x) => x.id === relatedBatchId && x.tenantId === eventTenantId)
      if (relatedBatch) records.batches = relatedBatch
    }
    const relatedAllocationId = records.distributions?.allocationId || records.batches?.allocationId
    if (relatedAllocationId && !records.allocations) {
      const relatedAllocation = db.allocations.find((x) => x.id === relatedAllocationId && x.tenantId === eventTenantId)
      if (relatedAllocation) records.allocations = relatedAllocation
    }
    const relatedMustahikId = records.distributions?.mustahikId || payload.mustahikId
    if (relatedMustahikId && !records.mustahiks) {
      const relatedMustahik = db.mustahiks.find((x) => x.id === relatedMustahikId && x.tenantId === eventTenantId)
      if (relatedMustahik) records.mustahiks = relatedMustahik
    }
    const personId = tx?.personId || payload.personId || records.muzakkiMemberships?.personId || records.mustahiks?.personId
    if (personId) {
      const person = db.persons.find((x) => x.id === personId && x.tenantId === eventTenantId)
      if (person) records.persons = person
    }
    if (Array.isArray(payload.householdItems)) records.households = payload.householdItems.filter((x) => x.accountId === payload.accountId)
    const accountId = tx?.accountId || records.users?.accountId || payload.accountId
    if (accountId && !records.accounts) {
      const account = db.accounts.find((x) => x.id === accountId && x.userId === (payload.userId || activeUser()?.id))
      if (account) records.accounts = account
    }
    const userId = payload.userId || records.muzakkiMemberships?.userId || records.supportTickets?.userId || records.shiftSessions?.amilId || tx?.accountUserId
    if (userId && !records.users) {
      const user = db.users.find((x) => x.id === userId && x.tenantId === eventTenantId)
      if (user) records.users = user
    }
    db.syncQueue.push({ id: newId('SQ'), tenantId: eventTenantId, type, schemaVersion: 5, createdAt: timestamp(), payload, records })
    A.persist()
    trySync()
  }
  async function trySync() {
    const base = window.SIZISNUR_API_BASE
    const tenantQueue = db.syncQueue.filter((event) => event.tenantId === currentTenantId())
    if (!base || !nav.onLine || !tenantQueue.length || typeof fetch !== 'function') return
    try {
      const response = await fetch(`${String(base).replace(/\/$/, '')}/sync`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: currentTenantId(), schemaVersion: 5, events: tenantQueue }),
      })
      if (response.ok) {
        const acknowledgement = await response.json().catch(() => null)
        const accepted = new Set(Array.isArray(acknowledgement?.acknowledgedEventIds) ? acknowledgement.acknowledgedEventIds : [])
        if (accepted.size) {
          db.syncQueue = db.syncQueue.filter((event) => !accepted.has(event.id))
          db.lastCloudSyncAt = timestamp()
          A.persist()
        }
        updateConnectionBadge()
      }
    } catch (_) { updateConnectionBadge() }
  }
  function updateConnectionBadge() {
    const badge = $('offline-state')
    if (badge) badge.textContent = nav.onLine ? (window.SIZISNUR_API_BASE ? 'Online · sinkronisasi terkonfigurasi' : `Online · lokal saja · antrean ${db.syncQueue.length}`) : `Offline · tersimpan lokal · antrean ${db.syncQueue.length}`
  }
  window.addEventListener('online', () => { updateConnectionBadge(); trySync() })
  window.addEventListener('offline', updateConnectionBadge)

  function memberForUser(userId = activeUser()?.id, tenantId = currentTenantId()) {
    return db.muzakkiMemberships.find((x) => x.userId === userId && x.tenantId === tenantId) || null
  }
  function accountForUser(userId = activeUser()?.id) {
    return db.accounts.find((x) => x.userId === userId) || null
  }
  function householdForUser(userId = activeUser()?.id) {
    const account = accountForUser(userId)
    return account ? db.households.filter((x) => x.accountId === account.id) : []
  }
  function expirePending() {
    const nowMs = Date.now()
    let changed = false
    db.transactions.forEach((tx) => {
      if (tx.tenantId !== currentTenantId() || tx.status !== 'pending') return
      const period = db.periods.find((x) => x.id === tx.periodId && x.tenantId === tx.tenantId)
      const expiredByTime = tx.expiresAt && new Date(tx.expiresAt).getTime() <= nowMs
      const expiredByPeriod = period && ['ditutup', 'closed', 'selesai'].includes(String(period.status || '').toLowerCase())
      if (expiredByTime || expiredByPeriod) {
        tx.status = 'expired'
        tx.expiredAt = timestamp()
        changed = true
        A.aud('TRANSAKSI_KEDALUWARSA', `${tx.serial} kedaluwarsa otomatis`)
      }
    })
    if (changed) { backfillAudit(); A.persist() }
  }
  function oneTxPerTenantPeriod(accountId, tenantId, periodId, personId = null) {
    return db.transactions.some((tx) => tx.tenantId === tenantId && tx.periodId === periodId && statusActive(tx.status) && (
      (accountId && tx.accountId === accountId) || (personId && tx.personId === personId)
    ))
  }
  function tenantLabel(tenantId) { return db.tenants.find((x) => x.id === tenantId)?.name || tenantId }
  function amilShift(amilId = activeUser()?.id) {
    return db.shiftSessions.find((x) => x.tenantId === currentTenantId() && x.amilId === amilId && x.status === 'open') || null
  }
  const rawTransactionTotals = A.transactionTotals
  function effectiveTotals(tx) {
    const base = rawTransactionTotals(tx)
    const approved = db.corrections.filter((x) => x.transactionId === tx.id && x.tenantId === tx.tenantId && x.status === 'disetujui')
    return {
      money: base.money + sum(approved, 'deltaMoney'),
      rice: base.rice + sum(approved, 'deltaRice'),
    }
  }
  A.set('transactionTotals', effectiveTotals)
  function revisedMetrics() {
    const period = currentPeriod() || A.scoped('periods')[0]
    const transactions = A.scoped('transactions').filter((x) => x.periodId === period?.id && !['batal', 'expired', 'kedaluwarsa'].includes(x.status))
    const verified = transactions.filter((x) => ['paid', 'disetor', 'kas_diterima', 'terverifikasi'].includes(x.status))
    const reconciled = transactions.filter((x) => x.status === 'terverifikasi')
    const allocations = A.scoped('allocations').filter((x) => x.periodId === period?.id && x.status === 'disetujui')
    const ledgerAllocations = allocations.filter((x) => x.source !== 'workbook-1447')
    const workbookAllocations = allocations.filter((x) => x.source === 'workbook-1447')
    const distributions = A.scoped('distributions').filter((x) => x.periodId === period?.id && x.status === 'tersalurkan')
    return {
      p: period, t: transactions, v: verified, a: allocations, aLedger: ledgerAllocations, aWorkbook: workbookAllocations, d: distributions,
      received: sum(transactions, (x) => effectiveTotals(x).money), rice: sum(transactions, (x) => effectiveTotals(x).rice),
      verified: sum(verified, (x) => effectiveTotals(x).money), verifiedRice: sum(verified, (x) => effectiveTotals(x).rice),
      reconciled: sum(reconciled, (x) => effectiveTotals(x).money), reconciledRice: sum(reconciled, (x) => effectiveTotals(x).rice),
      allocated: sum(allocations, (x) => sum(x.items || [], 'money') + Number(x.balanceMoney || 0)),
      allocatedRice: sum(allocations, (x) => sum(x.items || [], 'rice') + Number(x.balanceRiceKg || 0)),
      allocatedLedger: sum(ledgerAllocations, (x) => sum(x.items || [], 'money') + Number(x.balanceMoney || 0)),
      allocatedRiceLedger: sum(ledgerAllocations, (x) => sum(x.items || [], 'rice') + Number(x.balanceRiceKg || 0)),
      allocatedWorkbook: sum(workbookAllocations, (x) => sum(x.items || [], 'money') + Number(x.balanceMoney || 0)),
      allocatedRiceWorkbook: sum(workbookAllocations, (x) => sum(x.items || [], 'rice') + Number(x.balanceRiceKg || 0)),
      sent: sum(distributions, 'money'), sentRice: sum(distributions, 'rice'),
      jiwa: sum(transactions, 'jiwa'), people: new Set(transactions.map((x) => x.personId)).size,
    }
  }
  A.set('metrics', revisedMetrics)

  function statusPill(status) {
    const labels = { pending: 'Menunggu Amil', paid: 'Terverifikasi Amil', disetor: 'Diserahkan Bendahara', kas_diterima: 'Kas diterima', terverifikasi: 'Rekonsiliasi selesai', expired: 'Kedaluwarsa', selisih_bank: 'Selisih rekening', batal: 'Dibatalkan' }
    return `<span class="tag ${['paid', 'kas_diterima', 'terverifikasi', 'tersalurkan', 'disetujui'].includes(status) ? 'ok' : ['pending', 'disetor', 'draf', 'diajukan'].includes(status) ? 'warn' : ['expired', 'batal', 'selisih', 'selisih_bank', 'ditolak'].includes(status) ? 'bad' : 'info'}">${esc(labels[status] || String(status || '—').replaceAll('_', ' '))}</span>`
  }
  function transactionTableRows(txs) {
    return txs.map((tx) => {
      const person = A.person(tx.personId)
      const total = effectiveTotals(tx)
      const receipt = activeUser()?.role === 'Pengurus' ? '<span class="caption">Baca laporan</span>' : actionFor('Struk / QR', 'receipt-open', tx.id, 'sm')
      const correction = ['paid', 'disetor', 'kas_diterima', 'terverifikasi'].includes(tx.status) && ['Amil', 'Operator'].includes(activeUser()?.role) ? actionFor('Ajukan koreksi', 'correction-new', tx.id, 'sm') : ''
      const verify = activeUser()?.role === 'Amil' && tx.status === 'pending' ? `<span class="caption">Scan QR untuk verifikasi</span>` : ''
      return [`<b class="mono">${esc(tx.serial)}</b><div class="tiny mono">${esc(tx.id)}</div>`, `<b>${esc(person?.name || 'Muzakki')}</b><div class="tiny">${tx.jiwa || 1} jiwa</div>`, esc(A.who(tx.handledBy)), esc(tx.source === 'self-service' ? 'Mandiri' : 'Konter'), money(total.money), kilos(total.rice), statusPill(tx.status), `${receipt} ${correction} ${verify}`]
    })
  }
  function transactionsPageV5() {
    expirePending()
    const period = currentPeriod()
    const txs = A.scoped('transactions').filter((x) => x.periodId === period?.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const amil = activeUser()?.role === 'Amil'
    const operator = activeUser()?.role === 'Operator'
    const canWalkIn = ['Operator', 'Amil'].includes(activeUser()?.role)
    let shift = amilShift()
    const shiftBar = amil ? `<section class="card shift-status"><div><b>Shift Amil</b><p class="caption">Verifikasi transaksi hanya aktif saat Amil membuka shift.</p><div>${shift ? `<span class="tag ok">Shift dibuka ${esc(shift.openedAtLabel || '')}</span>` : '<span class="tag warn">Shift belum dibuka</span>'}</div></div><div>${shift ? action('Tutup shift', 'shift-close', 'danger') : action('Absensi buka shift', 'shift-open', 'primary')}</div></section>` : ''
    const scanner = amil ? `<section class="card scanner-card"><div class="card-top"><div><h3>Scan QR transaksi</h3><p class="caption">Pindai struk digital Muzakki atau Operator. Detail transaksi dan identitas Amil muncul sebelum akad dan pembayaran divalidasi.</p></div><span class="tag info">Khusus Amil</span></div><div class="scan-inline"><input id="amil-scan-token" type="text" placeholder="Tempel token QR atau nomor seri" autocomplete="off"><button class="btn primary" data-v5-action="amil-scan">Periksa QR</button><button class="btn" data-v5-action="camera-start" data-camera="amil">Buka kamera</button></div><video id="amil-camera" class="camera-preview" playsinline muted hidden></video><div id="amil-scan-result" class="section-gap"></div></section>` : ''
    return `${A.boxhead('Penerimaan dan Verifikasi Amil', 'Satu alur untuk transaksi mandiri Muzakki dan input konter Operator. Semua transaksi dimulai sebagai Pending dan hanya Amil yang mengesahkan pembayaran.', canWalkIn ? action('Input transaksi konter', 'operator-new', 'primary') : '')}${shiftBar}${scanner}<div class="cards">${A.stat('Transaksi periode', txs.length, 'Semua sumber')}${A.stat('Menunggu Amil', txs.filter((x) => x.status === 'pending').length, 'Belum dibayar / diverifikasi')}${A.stat('Terverifikasi Amil', txs.filter((x) => ['paid', 'disetor', 'kas_diterima', 'terverifikasi'].includes(x.status)).length, 'Masuk perhitungan setoran')}${A.stat('Kedaluwarsa', txs.filter((x) => x.status === 'expired').length, 'Pending lebih dari batas waktu')}</div><div class="card">${cardTitle('Daftar transaksi', 'Filter mengikuti periode aktif tenant')}<div class="table-wrap">${A.table(['Nomor / ID', 'Muzakki', 'Amil', 'Sumber', 'Uang', 'Beras', 'Status', 'Aksi'], transactionTableRows(txs))}</div></div><div class="alert light">Kode QR terikat pada tenant asal. Tenant lain tidak dapat memverifikasi transaksi ini. QR Pending berlaku 24 jam atau sampai periode ditutup. Pemindaian kamera memerlukan HTTPS dan izin perangkat, sedangkan input token tetap tersedia.</div>`
  }
  A.set('transactionsPage', transactionsPageV5)

  function showReceiptV5(tx) {
    const person = db.persons.find((x) => x.id === tx.personId && x.tenantId === tx.tenantId)
    const tenant = db.tenants.find((x) => x.id === tx.tenantId)
    const totals = effectiveTotals(tx)
    const token = transactionToken(tx)
    const receiptTitle = ['paid', 'disetor', 'kas_diterima', 'terverifikasi'].includes(tx.status) ? 'BUKTI SETOR ZAKAT · SIMULASI' : 'STRUK RENCANA ZAKAT · SIMULASI'
    const msg = `${person?.name || 'Muzakki'}, terima kasih telah menunaikan zakat melalui ${tenant?.name || 'tenant'}. Tercatat ${tx.jiwa || 1} jiwa dengan ${tx.lines.map((x) => x.category).join(', ')}. Total ${money(totals.money)} dan ${kilos(totals.rice)}. Tunjukkan QR ini kepada Amil ${tenant?.name || ''}. Ttd, Amil ${tenant?.name || ''}.`
    A.modal(`Struk digital ${tx.serial}`, `<div class="receipt-preview"><div class="receipt-brand"><b>${esc(tenant?.name || 'SiZisNur')}</b><small>${receiptTitle}</small></div><div class="receipt-data"><div><span>Nomor transaksi</span><b>${esc(tx.serial)}</b></div><div><span>Muzakki</span><b>${esc(person?.name || 'Muzakki')}</b></div><div><span>Jumlah tanggungan</span><b>${tx.jiwa || 1} orang</b></div><div><span>Jenis zakat</span><b>${esc(tx.lines.map((x) => x.category).join(', '))}</b></div><div><span>Total uang</span><b>${money(totals.money)}</b></div><div><span>Total beras</span><b>${kilos(totals.rice)}</b></div><div><span>Status</span>${statusPill(tx.status)}</div><div><span>Batas waktu</span><b>${tx.expiresAt ? esc(new Date(tx.expiresAt).toLocaleString('id-ID')) : '—'}</b></div></div><div class="receipt-qr">${A.qr(token)}</div><div class="mono receipt-token">${esc(token)}</div><p class="receipt-thanks">${esc(msg)}</p><small>Struk simulasi prototype. Belum menjadi bukti setor resmi.</small></div><div class="form-actions">${actionFor('Unduh gambar PNG', 'receipt-png', tx.id, 'sm primary')}${actionFor('Cetak / Simpan PDF', 'receipt-pdf', tx.id, 'sm')}${actionFor('Cetak thermal 80 mm', 'receipt-thermal', tx.id, 'sm')}</div>`, true)
  }
  function makeReceiptPrint(tx, thermal = false) {
    const html = A.receiptHtml(tx)
    const style = thermal ? '<style>@page{size:80mm auto;margin:3mm}body{width:74mm;margin:0 auto;font-family:monospace}.receipt{width:100%;max-width:100%;box-sizing:border-box;border:0;padding:2mm}.receipt svg{width:36mm;height:36mm}</style>' : ''
    A.printWindow(`SiZisNur ${tx.serial}`, style + html, false)
  }
  async function downloadReceiptPng(tx) {
    const canvas = document.createElement('canvas')
    canvas.width = 900
    canvas.height = 1320
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#115b43'; ctx.font = 'bold 36px Arial'; ctx.textAlign = 'center'
    ctx.fillText(db.tenants.find((x) => x.id === tx.tenantId)?.name || 'SiZisNur', 450, 70)
    ctx.fillStyle = '#333333'; ctx.font = '24px Arial'; ctx.fillText(['paid', 'disetor', 'kas_diterima', 'terverifikasi'].includes(tx.status) ? 'BUKTI SETOR ZAKAT · SIMULASI' : 'STRUK RENCANA ZAKAT · SIMULASI', 450, 112)
    const person = db.persons.find((x) => x.id === tx.personId && x.tenantId === tx.tenantId)
    const total = effectiveTotals(tx)
    const rows = [
      ['Nomor', tx.serial], ['Nama', person?.name || 'Muzakki'], ['Jumlah tanggungan', `${tx.jiwa || 1} orang`],
      ['Kategori', tx.lines.map((x) => x.category).join(', ')], ['Uang', money(total.money)], ['Beras', kilos(total.rice)], ['Status', tx.status],
    ]
    ctx.textAlign = 'left'; ctx.fillStyle = '#222'; ctx.font = '26px Arial'
    let y = 190
    rows.forEach(([label, value]) => { ctx.fillText(label, 80, y); ctx.textAlign = 'right'; ctx.fillText(String(value), 820, y); ctx.textAlign = 'left'; y += 66 })
    const svg = A.qr(transactionToken(tx))
    const qrSvg = svg.match(/<svg[\s\S]*?<\/svg>/i)?.[0]
    if (qrSvg) {
      const blob = new Blob([qrSvg], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      try {
        const img = new Image()
        await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = url })
        ctx.drawImage(img, 320, y + 20, 260, 260)
      } finally { URL.revokeObjectURL(url) }
    }
    ctx.textAlign = 'center'; ctx.font = '18px Arial'; ctx.fillText(transactionToken(tx), 450, 1210, 800)
    ctx.fillText('Tunjukkan QR ini kepada petugas Amil tenant', 450, 1260)
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!blob) throw new Error('Browser tidak dapat membuat gambar struk')
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `SiZisNur-${tx.serial}.png`; link.click(); URL.revokeObjectURL(link.href)
  }

  function currentAccountPerson() {
    const membership = memberForUser()
    return membership ? db.persons.find((x) => x.id === membership.personId && x.tenantId === currentTenantId()) : null
  }
  function myZisPage() {
    expirePending()
    const u = activeUser()
    const account = accountForUser()
    const membership = memberForUser()
    const person = currentAccountPerson()
    const tenants = db.muzakkiMemberships.filter((x) => x.userId === u.id)
    const household = householdForUser()
    const period = currentPeriod()
    const transactions = db.transactions.filter((x) => x.accountId === account?.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const pending = transactions.filter((x) => x.tenantId === currentTenantId() && x.periodId === period?.id && x.status === 'pending')
    const nextTxBlocked = period && oneTxPerTenantPeriod(account?.id, currentTenantId(), period.id, person?.id)
    return `${A.boxhead('Layanan Mandiri Muzakki', 'Kelola keluarga, hitung kewajiban, buat rencana transaksi, dan bawa QR ke meja Amil.', action('Gabung tenant lain', 'tenant-join', 'primary'))}<div class="cards">${A.stat('Tenant terdaftar', tenants.length, 'Satu akun dapat terhubung ke beberapa tenant')}${A.stat('Anggota keluarga', household.length, 'Dapat digunakan kembali pada periode selanjutnya')}${A.stat('Transaksi aktif periode ini', nextTxBlocked ? 1 : 0, period?.name || 'Periode belum aktif')}${A.stat('Riwayat transaksi', transactions.length, 'Status dan bukti transaksi')}</div><div class="two-col"><section class="card"><h3>Tenant yang terhubung</h3><div class="form-inline"><label for="muzakki-tenant-switch">Pilih tenant aktif</label><select id="muzakki-tenant-switch">${tenants.map((m) => `<option value="${m.tenantId}" ${m.tenantId === currentTenantId() ? 'selected' : ''}>${esc(tenantLabel(m.tenantId))}</option>`).join('')}</select></div><div class="mini-list">${tenants.map((m) => `<div class="mini-item"><span>${esc(tenantLabel(m.tenantId))}<small class="caption">${esc(m.regionName || m.regionType)} ${esc(m.rt || '')}</small></span>${m.tenantId === currentTenantId() ? '<span class="tag ok">Aktif</span>' : actionFor('Pilih', 'tenant-switch-button', m.tenantId, 'sm')}</div>`).join('')}</div></section><section class="card"><h3>Profil dan wilayah alamat</h3><form data-v5-form="self-profile"><div class="grid-form">${A.fld('Nama lengkap', 'name', person?.name || account?.displayName || '', 'text', 'required')}${A.fld('Nomor HP', 'phone', person?.phone || account?.phone || '', 'tel')}${A.fld('Email', 'email', person?.email || account?.email || '', 'email')}${A.sel('Daerah', 'regionType', [['VPA', 'Villa Pesona Asri & Marbella 2 / VPA'], ['Non VPA', 'Non VPA']], membership?.regionType || 'VPA')}${A.sel('RT', 'rt', Array.from({ length: 12 }, (_, i) => [`RT ${String(i + 1).padStart(2, '0')}`, `RT ${String(i + 1).padStart(2, '0')}`]), membership?.rt || 'RT 01').replace('<div class=\"field\">', `<div class=\"field\" id=\"muzakki-rt-field\"${membership?.regionType === 'VPA' ? '' : ' hidden'}>`)}${A.textarea('Alamat lengkap', 'address', person?.address || '')}</div><label class="check"><input type="checkbox" name="consent" value="yes" required> Saya menyetujui penggunaan data ini untuk layanan tenant pada prototype</label>${formButton('Simpan profil')}</form></section></div><div class="two-col"><section class="card"><div class="card-top"><h3>Data keluarga tanggungan</h3>${action('Tambah anggota', 'household-add', 'sm')}</div><p class="caption">Satu baris untuk satu anggota keluarga. Data ini dapat dipakai kembali saat periode baru dibuka.</p><form data-v5-form="family-save"><div id="household-rows">${household.map((x) => `<div class="household-row"><input name="memberName" value="${esc(x.name)}" placeholder="Nama anggota" required><input name="relation" value="${esc(x.relation)}" placeholder="Hubungan"><button type="button" class="btn sm danger" data-v5-action="household-remove">Hapus</button></div>`).join('')}</div>${formButton('Simpan data keluarga')}</form></section><section class="card"><h3>Kalkulator zakat</h3><p class="caption">Hitung estimasi sebelum membuat transaksi. Nilai tarif merupakan parameter tenant yang harus disahkan pengelola.</p><form data-v5-form="zakat-calc"><div class="grid-form">${A.sel('Jenis perhitungan', 'calcType', [['fitrah', 'Zakat fitrah'], ['maal', 'Zakat maal'], ['fidyah', 'Fidyah'], ['kafarat', 'Kafarat'], ['sedekah', 'Infak / sedekah']], 'fitrah')}${A.sel('Media', 'calcMedia', [['uang', 'Uang (Rp)'], ['beras', 'Beras (kg)']], 'uang')}${A.fld('Nilai harta (khusus maal, Rp)', 'assetsValue', '', 'text', 'inputmode="numeric" data-format="idr"')}${A.fld('Jumlah jiwa / hari', 'calcCount', household.length || 1, 'number', 'min="1"')}${A.fld('Harga emas per gram (Rp)', 'goldPrice', A.rule()?.goldPricePerGram || 1500000, 'text', 'inputmode="numeric" data-format="idr"')}</div><div id="zakat-calc-result" class="alert light">Pilih jenis perhitungan lalu tekan Hitung estimasi.</div><div class="form-actions"><button class="btn primary" type="submit">Hitung estimasi</button></div></form></section></div><section class="card"><div class="card-top"><h3>Transaksi periode aktif</h3>${nextTxBlocked ? '<span class="tag warn">Satu transaksi sudah dibuat untuk periode ini</span>' : action('Buat rencana zakat', 'self-tx-new', 'primary')}</div>${pending.length ? alert(`Ada ${pending.length} transaksi Pending. Tunjukkan QR kepada Amil sebelum ${esc(new Date(pending[0].expiresAt).toLocaleString('id-ID'))}.`, 'warn') : ''}<div class="table-wrap">${A.table(['Tanggal', 'Tenant', 'Nomor', 'Jenis', 'Total uang', 'Beras', 'Status', 'Bukti'], transactions.map((tx) => { const total = effectiveTotals(tx); return [esc(new Date(tx.createdAt).toLocaleString('id-ID')), esc(tenantLabel(tx.tenantId)), `<b class="mono">${esc(tx.serial)}</b>`, esc(tx.lines.map((x) => x.category).join(', ')), money(total.money), kilos(total.rice), statusPill(tx.status), actionFor('Lihat struk', 'receipt-open', tx.id, 'sm')] }))}</div></section><div class="alert light">Email dan WhatsApp hanya ditampilkan sebagai kanal notifikasi yang direncanakan. Pengiriman eksternal memerlukan API, persetujuan kontak, dan pengendalian privasi pada backend produksi.</div>`
  }

  function openSelfTransaction() {
    const account = accountForUser()
    const period = currentPeriod()
    if (!account || !memberForUser()) throw new Error('Akun belum terhubung dengan tenant aktif')
    if (!period) throw new Error('Tenant belum membuka periode zakat')
    if (oneTxPerTenantPeriod(account.id, currentTenantId(), period.id)) throw new Error('Satu akun hanya dapat membuat satu transaksi per tenant dalam satu periode')
    const householdCount = householdForUser().length || 1
    const rules = A.rule()
    A.modal('Buat rencana transaksi zakat', `<form data-v5-form="self-transaction"><div class="grid-form">${A.sel('Jenis zakat', 'category', [['Zakat Fitrah', 'Zakat fitrah'], ['Zakat Maal', 'Zakat maal'], ['Zakat Profesi', 'Zakat profesi'], ['Fidyah', 'Fidyah'], ['Kafarat', 'Kafarat'], ['Infak/Sedekah', 'Infak / sedekah']], 'Zakat Fitrah')}${A.sel('Media pembayaran', 'type', [['uang', 'Uang (Rp)'], ['beras', 'Beras (kg)']], 'uang')}${A.fld('Jumlah jiwa / unit', 'jiwa', householdCount, 'number', 'min="1" required')}${A.fld('Nominal (Rp) atau jumlah beras (kg)', 'value', householdCount * (rules?.moneyRate || 45000), 'text', 'inputmode="decimal" data-format="idr" required')}${A.sel('Kirim notifikasi', 'channel', [['app', 'Notifikasi aplikasi'], ['email', 'Email (simulasi)'], ['whatsapp', 'WhatsApp (simulasi)']], 'app')}</div><div class="alert light">Untuk fitrah, jumlah awal dihitung dari jumlah anggota keluarga dan tarif tenant. Periksa kembali nominal sebelum disimpan.</div>${A.textarea('Catatan untuk Amil (opsional)', 'note', '')}<label class="check"><input type="checkbox" name="confirm" value="yes" required> Saya memahami bahwa transaksi masih Pending dan pembayaran baru sah tercatat setelah diperiksa Amil</label>${formButton('Simpan dan tampilkan QR')}</form>`, true)
    const form = document.querySelector('[data-v5-form="self-transaction"]')
    if (form) {
      form.addEventListener('change', (event) => setSelfTransactionAmount(form, event.target.name === 'type'))
      setSelfTransactionAmount(form)
    }
  }
  function joinTenantModal() {
    const available = db.tenants.filter((t) => !memberForUser(activeUser().id, t.id))
    if (!available.length) return A.toast('Semua tenant demo sudah terhubung', 'info')
    A.modal('Hubungkan akun ke tenant', `<form data-v5-form="join-tenant"><div class="grid-form">${A.sel('Pilih tenant', 'tenantId', available.map((x) => [x.id, x.name]))}${A.sel('Daerah', 'regionType', [['VPA', 'Villa Pesona Asri & Marbella 2 / VPA'], ['Non VPA', 'Non VPA']], 'VPA')}${A.sel('RT', 'rt', Array.from({ length: 12 }, (_, i) => [`RT ${String(i + 1).padStart(2, '0')}`, `RT ${String(i + 1).padStart(2, '0')}`]), 'RT 01')}${A.textarea('Alamat lengkap', 'address', '')}</div><div class="alert light">Satu akun Muzakki dapat terhubung ke banyak tenant. Setiap tenant tetap mempunyai data dan QR transaksi sendiri.</div>${formButton('Hubungkan tenant')}</form>`)
  }
  function selfProfileSave(d) {
    const member = memberForUser()
    const account = accountForUser()
    if (!member || !account) throw new Error('Membership atau akun tidak ditemukan')
    let person = db.persons.find((x) => x.id === member.personId && x.tenantId === currentTenantId())
    if (!person) { person = { id: newId('PS'), tenantId: currentTenantId() }; db.persons.push(person); member.personId = person.id }
    if (!d.name.trim() || !d.address.trim()) throw new Error('Nama dan alamat wajib diisi')
    Object.assign(person, { name: d.name.trim(), phone: d.phone.trim(), email: d.email.trim(), address: d.address.trim(), regionType: d.regionType, rt: d.regionType === 'VPA' ? d.rt : '' })
    Object.assign(member, { regionType: d.regionType, regionName: d.regionType === 'VPA' ? 'Villa Pesona Asri & Marbella 2 / VPA' : 'Non VPA', rt: d.regionType === 'VPA' ? d.rt : '' })
    Object.assign(account, { displayName: d.name.trim(), phone: d.phone.trim(), email: d.email.trim(), consentAt: timestamp() })
    A.aud('MUZAKKI_PROFILE', `Profil akun ${person.name} diperbarui`)
    enqueueSync('muzakki.profile_updated', { tenantId: currentTenantId(), userId: activeUser().id, accountId: account.id, membershipId: member.id, personId: person.id })
  }
  function familySave(form) {
    const account = accountForUser()
    if (!account) throw new Error('Akun Muzakki tidak ditemukan')
    const names = [...form.querySelectorAll('input[name="memberName"]')].map((x) => x.value.trim()).filter(Boolean)
    const relations = [...form.querySelectorAll('input[name="relation"]')].map((x) => x.value.trim())
    if (!names.length) throw new Error('Daftar keluarga minimal memuat satu orang')
    db.households = db.households.filter((x) => x.accountId !== account.id)
    names.forEach((name, index) => db.households.push({ id: newId('HH'), accountId: account.id, name, relation: relations[index] || '' }))
    A.aud('MUZAKKI_FAMILY', `Data keluarga diperbarui ${names.length} anggota`)
    enqueueSync('muzakki.household_updated', { tenantId: currentTenantId(), userId: activeUser().id, accountId: account.id, householdItems: db.households.filter((x) => x.accountId === account.id) })
  }
  function submitSelfTransaction(d) {
    const account = accountForUser()
    const member = memberForUser()
    const period = currentPeriod()
    if (!account || !member || !period) throw new Error('Akun, tenant, atau periode belum siap')
    if (d.confirm !== 'yes') throw new Error('Konfirmasi transaksi wajib dicentang')
    if (oneTxPerTenantPeriod(account.id, currentTenantId(), period.id, member.personId)) throw new Error('Satu transaksi aktif per tenant dan periode telah dibuat')
    const jiwa = Math.max(1, Math.floor(Number(d.jiwa || 1)))
    const type = d.category === 'Fidyah' ? 'uang' : d.type
    let value = type === 'uang' ? toNumber(d.value || 0) : toKg(d.value || 0)
    if (d.category === 'Zakat Fitrah') value = jiwa * (type === 'beras' ? Number(A.rule()?.riceRate || 2.5) : Number(A.rule()?.moneyRate || 45000))
    if (d.category === 'Fidyah') value = jiwa * Number(A.rule()?.fidyahRate || 30000)
    if (!Number.isFinite(value) || value <= 0) throw new Error('Nominal wajib lebih besar dari nol')
    const person = db.persons.find((x) => x.id === member.personId && x.tenantId === currentTenantId())
    if (!person) throw new Error('Lengkapi profil Muzakki pada tenant ini terlebih dahulu')
    const seq = db.transactions.filter((x) => x.tenantId === currentTenantId()).length + 1
    const tx = {
      id: newId('TR'), tenantId: currentTenantId(), periodId: period.id, serial: `MS-${String(seq).padStart(6, '0')}`,
      personId: person.id, accountId: account.id, accountUserId: activeUser().id, recordedBy: activeUser().id,
      handledBy: null, operatorId: null, assignedAmilId: null, source: 'self-service', jiwa,
      lines: [{ category: d.category, type, value }], createdAt: timestamp(), expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending', note: d.note || '',
    }
    db.transactions.push(tx)
    db.notifications.push({ id: newId('NT'), tenantId: currentTenantId(), personId: person.id, accountId: account.id, channel: d.channel || 'app', status: 'lokal', date: dateToday(), subject: `Terima kasih ${person.name}`, message: `Terima kasih telah menunaikan zakat melalui ${A.tenant().name}. Terdaftar ${householdForUser().length} anggota keluarga. Total ${money(effectiveTotals(tx).money)} dan ${kilos(effectiveTotals(tx).rice)}. Tunjukkan QR kepada petugas Amil ${A.tenant().name}.` })
    A.aud('TRANSAKSI_PENDING', `Muzakki membuat ${tx.serial} dari layanan mandiri`)
    enqueueSync('transaction.pending', { transactionId: tx.id, tenantId: tx.tenantId })
    state.modal = null
    A.persist()
    A.render()
    showReceiptV5(tx)
  }

  function verifyTransactionModal(tx) {
    if (activeUser()?.role !== 'Amil') throw new Error('Hanya Amil yang dapat memverifikasi pembayaran')
    if (!amilShift()) throw new Error('Buka shift Amil terlebih dahulu sebelum verifikasi')
    if (!tx || tx.tenantId !== currentTenantId()) throw new Error('Transaksi tidak berasal dari tenant aktif')
    if (tx.status !== 'pending') throw new Error('Transaksi bukan berstatus Pending')
    if (tx.expiresAt && new Date(tx.expiresAt).getTime() <= Date.now()) throw new Error('QR transaksi sudah kedaluwarsa')
    const person = db.persons.find((x) => x.id === tx.personId && x.tenantId === currentTenantId())
    const total = effectiveTotals(tx)
    A.modal(`Verifikasi dan akad ${tx.serial}`, `<div class="verification-summary"><div class="cards">${A.stat('Muzakki', esc(person?.name || '—'), `${tx.jiwa} jiwa`)}${A.stat('Total uang', money(total.money), 'Diterima langsung oleh Amil')}${A.stat('Total beras', kilos(total.rice), 'Timbang dan cocokkan fisik')}</div><div class="mini-list"><div class="mini-item"><span>Nomor transaksi</span><b class="mono">${esc(tx.serial)}</b></div><div class="mini-item"><span>Sumber</span><b>${tx.source === 'self-service' ? 'Muzakki mandiri' : 'Operator konter'}</b></div><div class="mini-item"><span>Identitas Amil</span><b>${esc(activeUser().name)}</b></div><div class="mini-item"><span>Tenant</span><b>${esc(A.tenant().name)}</b></div></div>${A.table(['Jenis', 'Media', 'Nominal'], tx.lines.map((line) => [esc(line.category), line.type === 'uang' ? 'Rupiah' : 'Kilogram', line.type === 'uang' ? money(line.value) : kilos(line.value)]))}<div class="akad-panel"><h4>Akad dan doa</h4><p class="arabic">نَوَيْتُ أَنْ أُخْرِجَ زَكَاةَ الْفِطْرِ عَنْ نَفْسِي وَعَنْ مَنْ تَلْزَمُنِي نَفَقَتُهُ لِلّٰهِ تَعَالَى</p><p>Amil memandu niat sesuai jenis zakat, mengonfirmasi ijab kabul dan jumlah yang diserahkan bersama Muzakki.</p><p class="caption">Lafaz ini contoh antarmuka, bukan fatwa. Pengurus perlu memvalidasi teks, dalil, dan praktik akad bersama pembimbing agama setempat.</p></div></div><form data-v5-form="amil-verify" data-id="${esc(tx.id)}"><label class="check"><input type="checkbox" name="paymentReceived" value="yes" required> Uang atau beras fisik telah diterima dan dicocokkan</label><label class="check"><input type="checkbox" name="akadDone" value="yes" required> Akad telah dipandu dan dikonfirmasi</label>${A.textarea('Catatan Amil (opsional)', 'note', '')}${formButton('Sahkan pembayaran dan terbitkan BSZ')}</form>`, true)
  }
  function parseTransactionToken(raw) {
    const value = String(raw || '').trim()
    if (!value) return null
    const parts = value.split('|')
    if (parts[0] === 'SIZISNUR' && parts[1] && parts[2]) {
      if (parts[1] !== currentTenantId()) throw new Error('QR berasal dari tenant lain. Verifikasi lintas tenant ditolak.')
      return db.transactions.find((x) => x.id === parts[2] && x.tenantId === parts[1]) || null
    }
    return A.scoped('transactions').find((x) => x.id === value || x.serial === value) || null
  }

  function shiftControl(open) {
    const u = activeUser()
    if (u?.role !== 'Amil') throw new Error('Hanya Amil yang dapat membuka atau menutup shift')
    if (open) {
      if (amilShift()) throw new Error('Shift saat ini sudah terbuka')
      const shift = { id: newId('SH'), tenantId: currentTenantId(), amilId: u.id, openedAt: timestamp(), openedAtLabel: new Date().toLocaleTimeString('id-ID'), closedAt: null, status: 'open', openingDevice: nav.userAgent.slice(0, 80) }
      db.shiftSessions.push(shift)
      A.aud('SHIFT_OPEN', `Amil ${u.name} membuka shift ${shift.id}`)
      enqueueSync('shift.opened', { shiftId: shift.id })
    } else {
      const shift = amilShift()
      if (!shift) throw new Error('Tidak ada shift terbuka')
      const txs = A.scoped('transactions').filter((x) => x.shiftId === shift.id && x.status === 'paid')
      shift.closedAt = timestamp(); shift.status = 'closed'; shift.transactionCount = txs.length
      shift.moneyTotal = sum(txs, (x) => effectiveTotals(x).money); shift.riceTotal = sum(txs, (x) => effectiveTotals(x).rice)
      A.aud('SHIFT_CLOSE', `Amil ${u.name} menutup ${shift.id} dengan ${txs.length} transaksi`)
      enqueueSync('shift.closed', { shiftId: shift.id })
    }
    A.persist(); A.render()
  }

  function depositsPageV5() {
    const period = currentPeriod()
    const txs = A.scoped('transactions').filter((x) => x.periodId === period?.id)
    const deposits = A.scoped('deposits').filter((x) => x.periodId === period?.id)
    const unhanded = txs.filter((x) => x.status === 'paid' && db.shiftSessions.some((shift) => shift.id === x.shiftId && shift.tenantId === currentTenantId() && shift.status === 'closed'))
    const accepted = deposits.filter((x) => x.status === 'kas_diterima')
    const waitingBank = deposits.filter((x) => x.status === 'kas_diterima' || x.status === 'selisih_bank')
    const isTreasurer = activeUser()?.role === 'Bendahara'
    return `${A.boxhead('Serah Terima dan Rekonsiliasi Kas', 'Rekonsiliasi berjalan dua tahap. Bendahara menerima kas fisik per shift, lalu mencocokkan nilai rekening dan mencatat koreksi secara terkendali. Pengurus memiliki akses baca penuh.', isTreasurer && unhanded.length ? action('Buat berita acara serah terima', 'deposit-create', 'primary') : '')}<div class="cards">${A.stat('Menunggu serah terima', unhanded.length, 'Shift sudah ditutup Amil')}${A.stat('Kas diterima', accepted.length, 'Tahap 1 selesai')}${A.stat('Menunggu rekening', waitingBank.length, 'Tahap 2')}${A.stat('Rekonsiliasi selesai', deposits.filter((x) => x.status === 'terverifikasi').length, 'Audit trail tersimpan')}</div><section class="card"><h3>Berita acara serah terima per shift</h3>${A.table(['Kode setoran', 'Amil / shift', 'Jumlah transaksi', 'Catatan sistem', 'Aktual fisik', 'Status', 'Aksi'], deposits.map((s) => {
      const tx = db.transactions.filter((x) => s.transactionIds.includes(x.id) && x.tenantId === currentTenantId())
      const expectedMoney = sum(tx, (x) => effectiveTotals(x).money), expectedRice = sum(tx, (x) => effectiveTotals(x).rice)
      const actions = !isTreasurer ? '<span class="caption">Read-only</span>' : s.status === 'menunggu' || s.status === 'selisih' ? actionFor('Periksa kas fisik', 'deposit-stage1-open', s.id, 'sm primary') : s.status !== 'terverifikasi' ? actionFor('Rekonsiliasi rekening', 'deposit-stage2-open', s.id, 'sm primary') : '<span class="caption">Selesai</span>'
      return [`<b class="mono">${esc(s.id)}</b><div class="tiny">${esc(s.shiftId || 'Shift lama')}</div>`, esc(A.who(s.amilId)), tx.length, `${money(expectedMoney)}<br>${kilos(expectedRice)}`, `${money(s.actualMoney ?? expectedMoney)}<br>${kilos(s.actualRice ?? expectedRice)}`, statusPill(s.status), actions]
    }))}</section><section class="card"><h3>Mutasi rekening</h3>${A.table(['Tanggal', 'Setoran', 'Bank uang', 'Bank beras', 'Pemeriksa', 'Status'], deposits.filter((x) => x.bankCheckedAt).map((x) => [esc(new Date(x.bankCheckedAt).toLocaleString('id-ID')), esc(x.id), money(x.bankMoney), kilos(x.bankRice), esc(A.who(x.bankCheckedBy)), statusPill(x.status)]))}</section><div class="alert warn">Transaksi yang sudah diverifikasi Amil tidak dapat diubah atau dihapus. Jika ditemukan kesalahan, ajukan koreksi terpisah dan Bendahara meninjau dampaknya. Perubahan nilai aktual tidak pernah menimpa rincian transaksi asal.</div>`
  }
  A.set('depositsPage', depositsPageV5)

  function depositStage1Modal(id) {
    const deposit = A.scoped('deposits').find((x) => x.id === id)
    if (!deposit) throw new Error('Setoran tidak ditemukan')
    const txs = db.transactions.filter((x) => deposit.transactionIds.includes(x.id) && x.tenantId === currentTenantId())
    const expectedMoney = sum(txs, (x) => effectiveTotals(x).money), expectedRice = sum(txs, (x) => effectiveTotals(x).rice)
    A.modal(`Tahap 1 · Terima kas ${id}`, `<div class="cards">${A.stat('Sistem', money(expectedMoney), kilos(expectedRice))}${A.stat('Transaksi', txs.length, 'Beras dan uang dipisahkan')}</div><form data-v5-form="deposit-stage1" data-id="${esc(id)}"><div class="grid-form">${A.fld('Uang fisik diterima (Rp)', 'actualMoney', deposit.actualMoney ?? expectedMoney, 'text', 'inputmode="numeric" data-format="idr" required')}${A.fld('Beras fisik diterima (kg)', 'actualRice', deposit.actualRice ?? expectedRice, 'text', 'inputmode="decimal" data-format="kg" required')}</div>${A.textarea('Catatan serah terima / selisih', 'note', deposit.handoverNote || '')}${formButton('Simpan penerimaan fisik')}</form>`)
  }
  function depositStage2Modal(id) {
    const deposit = A.scoped('deposits').find((x) => x.id === id)
    if (!deposit) throw new Error('Setoran tidak ditemukan')
    A.modal(`Tahap 2 · Rekonsiliasi rekening ${id}`, `<div class="alert light">Tahap ini mencocokkan mutasi rekening dengan kas yang telah diterima dan dicatat pada tahap pertama.</div><div class="cards">${A.stat('Kas diterima', money(deposit.actualMoney), kilos(deposit.actualRice))}</div><form data-v5-form="deposit-stage2" data-id="${esc(id)}"><div class="grid-form">${A.fld('Mutasi rekening masuk (Rp)', 'bankMoney', deposit.bankMoney ?? deposit.actualMoney, 'text', 'inputmode="numeric" data-format="idr" required')}${A.fld('Beras / saldo logistik tercatat (kg)', 'bankRice', deposit.bankRice ?? deposit.actualRice, 'text', 'inputmode="decimal" data-format="kg" required')}</div>${A.fld('Nomor referensi rekening (opsional)', 'bankReference', deposit.bankReference || '', 'text')}${A.textarea('Catatan rekonsiliasi', 'note', deposit.bankNote || '')}${formButton('Selesaikan rekonsiliasi tahap 2')}</form>`)
  }

  function addJournal({ date = timestamp(), code, description, debit, credit, accountDebit, accountCredit, reference, unit = 'IDR', by = activeUser()?.id }) {
    db.journalEntries.push({ id: newId('JU'), tenantId: currentTenantId(), date, code, description, debit: Number(debit || 0), credit: Number(credit || 0), unit, accountDebit, accountCredit, reference, by })
  }
  function ledgerPage() {
    const entries = A.scoped('journalEntries').sort((a, b) => b.date.localeCompare(a.date))
    const moneyEntries = entries.filter((x) => (x.unit || 'IDR') === 'IDR')
    const riceEntries = entries.filter((x) => x.unit === 'kg')
    const cashIn = sum(moneyEntries, (x) => x.accountDebit === 'Kas/Bank' ? x.debit : 0)
    const cashOut = sum(moneyEntries, (x) => x.accountCredit === 'Kas/Bank' ? x.credit : 0)
    const fundIn = sum(moneyEntries, (x) => x.accountCredit === 'Dana Zakat' ? x.credit : 0)
    const fundOut = sum(moneyEntries, (x) => ['Dana Zakat', 'Penyaluran Dana Zakat'].includes(x.accountDebit) ? x.debit : 0)
    const riceIn = sum(riceEntries, (x) => x.accountDebit === 'Persediaan Beras' ? x.debit : 0)
    const riceOut = sum(riceEntries, (x) => x.accountCredit === 'Persediaan Beras' ? x.credit : 0)
    const riceFundIn = sum(riceEntries, (x) => x.accountCredit === 'Dana Zakat - Beras' ? x.credit : 0)
    const riceFundOut = sum(riceEntries, (x) => x.accountDebit === 'Dana Zakat - Beras' ? x.debit : 0)
    const balance = cashIn - cashOut
    const riceBalance = riceIn - riceOut
    const fmt = (value, unit) => unit === 'kg' ? kilos(value) : money(value)
    return `${A.boxhead('Jurnal dan Laporan Keuangan Bendahara', 'Jurnal uang dan persediaan beras dipisahkan agar satuan tidak tercampur. Setiap koreksi mempunyai referensi dan persetujuan Bendahara.', action('Unduh jurnal XLSX', 'export-ledger-xlsx', 'primary'))}<div class="cards">${A.stat('Saldo kas / bank', money(balance), 'Jurnal satuan IDR')}${A.stat('Penerimaan dana zakat', money(fundIn), 'Kredit dana zakat')}${A.stat('Penyaluran dana zakat', money(fundOut), 'Debit dana zakat')}${A.stat('Persediaan beras', kilos(riceBalance), 'Masuk dikurangi distribusi')}</div><div class="two-col"><section class="card"><h3>Neraca uang</h3>${A.table(['Akun', 'Debit', 'Kredit', 'Saldo'], [['Kas / Bank', money(cashIn), money(cashOut), money(balance)], ['Dana Zakat', money(fundOut), money(fundIn), money(fundIn - fundOut)]])}</section><section class="card"><h3>Neraca persediaan beras</h3>${A.table(['Akun', 'Masuk', 'Keluar', 'Saldo'], [['Persediaan Beras', kilos(riceIn), kilos(riceOut), kilos(riceBalance)], ['Dana Zakat - Beras', kilos(riceFundIn), kilos(riceFundOut), kilos(riceFundIn - riceFundOut)]])}</section></div><div class="two-col"><section class="card"><h3>Laporan perubahan dana uang</h3>${A.table(['Komponen', 'Nilai'], [['Penerimaan dana', money(fundIn)], ['Distribusi dana', money(fundOut)], ['Perubahan bersih', money(fundIn - fundOut)]])}</section><section class="card"><h3>Laporan perubahan dana beras</h3>${A.table(['Komponen', 'Nilai'], [['Penerimaan beras', kilos(riceFundIn)], ['Distribusi beras', kilos(riceFundOut)], ['Perubahan bersih', kilos(riceFundIn - riceFundOut)]])}</section></div><section class="card"><h3>Jurnal umum</h3>${A.table(['Tanggal', 'Referensi', 'Keterangan', 'Debit', 'Kredit', 'Pencatat'], entries.map((x) => [esc(new Date(x.date).toLocaleDateString('id-ID')), esc(x.reference), esc(x.description), `${esc(x.accountDebit)} · ${fmt(x.debit, x.unit)}`, `${esc(x.accountCredit)} · ${fmt(x.credit, x.unit)}`, esc(A.who(x.by))]))}</section><div class="alert warn">Jurnal ini prototipe otomatis, belum merupakan laporan keuangan sesuai standar akuntansi yang telah diaudit. Akun per jenis ZIS, persediaan, dana terikat, dan kebijakan pengakuan harus ditetapkan bersama BAZNAS dan auditor.</div>`
  }

  function allocationRecipients() {
    const reserved = new Set(A.scoped('allocations').filter((x) => !['ditolak', 'batal'].includes(x.status)).flatMap((x) => (x.items || []).map((i) => i.mustahikId)))
    return A.scoped('mustahiks').filter((x) => x.status === 'terverifikasi' && ['FAKIR', 'MISKIN', 'MUALAF'].includes(String(x.finalStatus || x.asnaf || '').toUpperCase()) && !reserved.has(x.id))
  }
  function flexibleBalance() {
    const m = A.metrics()
    const committed = A.scoped('allocations').filter((x) => x.periodId === m.p?.id && !['ditolak', 'batal'].includes(x.status))
    const usedMoney = sum(committed, (x) => sum(x.items || [], 'money') + Number(x.balanceMoney || 0))
    const usedRice = sum(committed, (x) => sum(x.items || [], 'rice') + Number(x.balanceRiceKg || 0))
    return { money: Math.max(0, m.reconciled - usedMoney), rice: Math.max(0, m.reconciledRice - usedRice), reconciled: m.reconciled, reconciledRice: m.reconciledRice, committedMoney: usedMoney, committedRice: usedRice }
  }
  function flexibleAllocationModal() {
    if (activeUser()?.role !== 'Bendahara') throw new Error('Hanya Bendahara yang dapat menyiapkan alokasi')
    const m = A.metrics()
    const pool = flexibleBalance()
    const remainMoney = pool.money
    const remainRice = pool.rice
    const recipients = allocationRecipients()
    if (!recipients.length) throw new Error('Tidak ada Mustahik layak yang belum masuk rencana alokasi aktif')
    if (remainMoney <= 0 && remainRice <= 0) throw new Error('Belum ada saldo terverifikasi yang tersedia untuk alokasi fleksibel')
    A.modal('Buat alokasi fleksibel', `<div class="cards">${A.stat('Saldo uang tersedia', money(remainMoney), 'Kas tahap 2 selesai, setelah seluruh draf/alokasi aktif')}${A.stat('Saldo beras tersedia', kilos(remainRice), 'Kas tahap 2 selesai, setelah seluruh draf/alokasi aktif')}${A.stat('Mustahik belum dialokasikan', recipients.length, 'Status layak pada tenant aktif')}</div><div class="alert warn">Draf ini menggunakan pembagian rata kepada penerima yang belum masuk rencana aktif. Formula pembagian wajib dikonfirmasi stakeholder dan tidak otomatis dianggap sebagai ketentuan syariah atau kebijakan BAZNAS.</div><form data-v5-form="allocation-flexible-create"><div class="grid-form">${A.fld('Nama rencana', 'name', `Alokasi Fleksibel ${A.scoped('allocations').length + 1}`, 'text', 'required')}${A.fld('Dana uang yang dialokasikan (Rp)', 'moneyBudget', remainMoney, 'text', 'inputmode="numeric" data-format="idr" required')}${A.fld('Beras yang dialokasikan (kg)', 'riceBudget', remainRice, 'text', 'inputmode="decimal" data-format="kg" required')}</div>${A.textarea('Catatan dasar pembagian', 'note', 'Pembagian rata sementara untuk evaluasi stakeholder')}${formButton('Simpan sebagai draf')}</form>`)
  }
  function createFlexibleAllocation(d) {
    if (activeUser()?.role !== 'Bendahara') throw new Error('Hanya Bendahara yang dapat membuat alokasi')
    const m = A.metrics()
    const pool = flexibleBalance()
    const moneyBudget = toNumber(d.moneyBudget || 0)
    const riceBudget = toKg(d.riceBudget || 0)
    const remainMoney = pool.money
    const remainRice = pool.rice
    if (moneyBudget < 0 || riceBudget < 0 || (moneyBudget <= 0 && riceBudget <= 0)) throw new Error('Masukkan saldo uang atau beras yang akan dialokasikan')
    if (moneyBudget > remainMoney + 0.001 || riceBudget > remainRice + 0.001) throw new Error('Nilai alokasi melebihi saldo terverifikasi yang tersedia')
    const recipients = allocationRecipients()
    if (!recipients.length) throw new Error('Tidak ada Mustahik layak yang belum dialokasikan')
    const items = recipients.map((mustahik, index) => {
      const fraction = 1 / recipients.length
      const itemMoney = index === recipients.length - 1 ? Math.max(0, moneyBudget - Math.floor((moneyBudget * fraction) / 1000) * 1000 * (recipients.length - 1)) : Math.floor((moneyBudget * fraction) / 1000) * 1000
      const itemRice = index === recipients.length - 1 ? Math.max(0, Math.round((riceBudget - Math.floor(riceBudget * fraction * 100) / 100 * (recipients.length - 1)) * 100) / 100) : Math.floor(riceBudget * fraction * 100) / 100
      return { mustahikId: mustahik.id, money: itemMoney, rice: itemRice }
    }).filter((x) => x.money > 0 || x.rice > 0)
    if (!items.length) throw new Error('Nilai alokasi terlalu kecil untuk dibagikan')
    const allocation = { id: newId('AL'), tenantId: currentTenantId(), periodId: m.p?.id, name: d.name.trim(), source: 'flexible-v5', items, balanceMoney: 0, balanceRiceKg: 0, status: 'draf', method: 'rata-simulasi', note: d.note.trim(), createdAt: timestamp(), createdBy: activeUser().id }
    db.allocations.push(allocation)
    A.aud('ALOKASI_FLEKSIBEL_DRAF', `Draf ${allocation.name} dibuat untuk ${items.length} Mustahik`)
    enqueueSync('allocation.draft_created', { allocationId: allocation.id })
    A.toast('Draf alokasi tersimpan. Ajukan kepada Pengurus setelah diperiksa.')
  }
  function allocationPageV5() {
    const m = A.metrics()
    const allocations = A.scoped('allocations').filter((x) => x.periodId === m.p?.id)
    const createButtons = activeUser()?.role === 'Bendahara' ? `<div class="actions">${action('Buat Tahap 1 · Workbook', 'workbook-stage-1', 'sm')}${action('Buat Tahap 2 · Workbook', 'workbook-stage-2', 'sm')}${action('Alokasi fleksibel', 'allocation-flexible', 'primary')}</div>` : ''
    return `${A.boxhead('Alokasi, Batch dan Persetujuan', 'Bendahara menyiapkan alokasi dan batch distribusi. Pengurus memeriksa serta menyetujui sebelum Relawan menerima tugas.', createButtons)}<div class="cards">${A.stat('Dana direkonsiliasi', money(m.reconciled), 'Tahap kas dan rekening selesai')}${A.stat('Alokasi disetujui', money(m.allocated), 'Termasuk alokasi workbook')}${A.stat('Sudah disalurkan', money(m.sent), 'Dari laporan Relawan')}${A.stat('Paket batch aktif', A.scoped('batches').filter((x) => x.status !== 'selesai').length, 'Siap atau sedang berjalan')}</div><section class="card"><h3>Rencana alokasi</h3>${A.table(['Rencana', 'Jumlah uang / beras', 'Penerima', 'Status', 'Tindakan'], allocations.map((x) => [`<b>${esc(x.name)}</b><div class="tiny">${esc(x.id)}</div>`, `${money(sum(x.items || [], 'money') + Number(x.balanceMoney || 0))}<br>${kilos(sum(x.items || [], 'rice') + Number(x.balanceRiceKg || 0))}`, (x.items || []).length, statusPill(x.status), `${actionFor('Rincian', 'allocation-view', x.id, 'sm')} ${activeUser()?.role === 'Bendahara' && x.status === 'draf' ? actionFor('Ajukan', 'allocation-submit-v5', x.id, 'sm primary') : ''} ${activeUser()?.role === 'Pengurus' && x.status === 'diajukan' ? actionFor('Tinjau', 'allocation-review-v5', x.id, 'sm primary') : ''}`]))}</section><section class="card"><h3>Daftar batch distribusi</h3>${A.table(['Batch', 'Tahap', 'Relawan', 'Penerima', 'Progres', 'Status'], A.scoped('batches').map((x) => [`<b>${esc(x.name)}</b><div class="tiny">${esc(x.id)}</div>`, esc(x.allocationName), esc(A.who(x.volunteerId)), `${x.completed || 0} / ${x.itemIds.length}`, statusPill(x.status), x.status === 'selesai' ? '—' : activeUser()?.role === 'Bendahara' ? actionFor('Detail', 'batch-view', x.id, 'sm') : '—']))}</section>`
  }
  A.set('allocationPage', allocationPageV5)

  function distributionPageV5() {
    if (activeUser()?.role === 'Bendahara') {
      const allocations = A.scoped('allocations').filter((x) => x.periodId === currentPeriod()?.id && x.status === 'disetujui')
      const batches = A.scoped('batches')
      return `${A.boxhead('Penyerahan Alokasi kepada Relawan', 'Bendahara membagi daftar penerima ke batch 1, batch 2 dan seterusnya, lalu menetapkan Relawan pelaksana.', action('Buat batch distribusi', 'batch-new', 'primary'))}<div class="cards">${A.stat('Alokasi siap dibagikan', allocations.length, 'Disetujui Pengurus')}${A.stat('Batch dibuat', batches.length, 'Per tenant dan periode')}${A.stat('Penerima dalam batch', sum(batches, (x) => x.itemIds.length), 'Daftar tugas lapangan')}${A.stat('Selesai', sum(batches, 'completed'), 'Penerima terkonfirmasi')}</div><section class="card"><h3>Batch distribusi</h3>${A.table(['Nama batch', 'Alokasi sumber', 'Relawan', 'Daftar penerima', 'Progres', 'Status'], batches.map((x) => [`<b>${esc(x.name)}</b>`, esc(x.allocationName), esc(A.who(x.volunteerId)), x.itemIds.length, `${x.completed || 0} selesai`, statusPill(x.status)]))}</section><div class="alert light">Setiap batch mempunyai daftar penerima tersendiri. Penerima yang sudah disalurkan tidak dapat dicatat dua kali pada alokasi yang sama.</div>`
    }
    return volunteerPage()
  }
  A.set('distributionPage', distributionPageV5)
  function volunteerPage() {
    const batches = A.scoped('batches').filter((x) => x.volunteerId === activeUser()?.id && x.status !== 'selesai')
    const allBatches = A.scoped('batches').filter((x) => x.volunteerId === activeUser()?.id)
    return `<main class="volunteer-screen"><header class="volunteer-head"><div><span class="eyebrow">SiZisNur · Relawan lapangan</span><h2>Penyaluran bantuan</h2><p>Scan QR penerima atau cari nama untuk mempercepat serah terima.</p></div><span class="tag ok">${batches.length} batch aktif</span></header><section class="card volunteer-scan"><label for="volunteer-batch">Batch tugas</label><select id="volunteer-batch">${allBatches.map((x) => `<option value="${x.id}">${esc(x.name)} · ${x.completed || 0}/${x.itemIds.length}</option>`).join('')}</select><label for="volunteer-scan-token">QR Mustahik atau kode penerima</label><div class="scan-inline"><input id="volunteer-scan-token" type="text" placeholder="Scan atau masukkan kode penerima"><button class="btn primary" data-v5-action="volunteer-lookup">Cari</button><button class="btn" data-v5-action="camera-start" data-camera="volunteer">Kamera</button></div><video id="volunteer-camera" class="camera-preview" playsinline muted hidden></video><div id="volunteer-result" class="section-gap"></div><p class="caption">Tampilan mobile-first. Jika kamera tidak tersedia, gunakan input kode secara manual.</p></section><section class="card"><h3>Daftar tugas saya</h3>${allBatches.map((batch) => `<article class="batch-card"><div class="card-top"><b>${esc(batch.name)}</b>${statusPill(batch.status)}</div><p class="caption">${esc(batch.allocationName)} · ${batch.completed || 0} dari ${batch.itemIds.length} penerima</p>${batch.itemIds.map((mid) => { const m = db.mustahiks.find((x) => x.id === mid && x.tenantId === currentTenantId()); const p = m && db.persons.find((x) => x.id === m.personId && x.tenantId === currentTenantId()); const done = A.scoped('distributions').some((x) => x.batchId === batch.id && x.mustahikId === mid); return `<div class="volunteer-recipient"><div><b>${esc(p?.name || mid)}</b><small>${esc(m?.region || m?.rt || '')} · ${esc(m?.finalStatus || m?.asnaf || '')}</small></div>${done ? '<span class="tag ok">Sudah diterima</span>' : actionFor('Pilih', 'volunteer-select', `${batch.id}|${mid}`, 'sm primary')}</div>` }).join('')}</article>`).join('') || alert('Belum ada batch yang ditugaskan kepada akun Relawan ini.', 'warn')}</section><div class="volunteer-footer">SiZisNur · Penerima dan jumlah bantuan ditampilkan sesuai batch yang ditugaskan</div></main>`
  }

  function ledgerRecordForDeposit(deposit) {
    const txs = db.transactions.filter((x) => deposit.transactionIds.includes(x.id) && x.tenantId === currentTenantId())
    const total = sum(txs, (x) => effectiveTotals(x).money)
    const rice = sum(txs, (x) => effectiveTotals(x).rice)
    if (total > 0) addJournal({ code: 'ZIS-IN', description: 'Penerimaan ZIS uang dari setoran Amil', debit: total, credit: total, accountDebit: 'Kas/Bank', accountCredit: 'Dana Zakat', reference: deposit.id, unit: 'IDR', by: activeUser()?.id })
    if (rice > 0) addJournal({ code: 'ZIS-RICE-IN', description: 'Penerimaan beras dari setoran Amil', debit: rice, credit: rice, accountDebit: 'Persediaan Beras', accountCredit: 'Dana Zakat - Beras', reference: deposit.id, unit: 'kg', by: activeUser()?.id })
  }
  function addDistributionRecord(batch, mustahikId) {
    const alloc = db.allocations.find((x) => x.id === batch.allocationId && x.tenantId === currentTenantId())
    const item = alloc?.items.find((x) => x.mustahikId === mustahikId)
    if (!item) throw new Error('Penerima tidak termasuk alokasi batch')
    if (A.scoped('distributions').some((x) => x.allocationId === alloc.id && x.mustahikId === mustahikId)) throw new Error('Penerima ini sudah menerima bantuan')
    const dist = { id: newId('DS'), tenantId: currentTenantId(), periodId: alloc.periodId, allocationId: alloc.id, batchId: batch.id, mustahikId, money: item.money, rice: item.rice, status: 'tersalurkan', deliveredAt: timestamp(), deliveredBy: activeUser().id, note: 'Konfirmasi QR Relawan' }
    db.distributions.push(dist)
    batch.completed = (batch.completed || 0) + 1
    if (batch.completed >= batch.itemIds.length) { batch.status = 'selesai'; batch.completedAt = timestamp() }
    if (item.money > 0) addJournal({ code: 'ZIS-OUT', description: 'Penyaluran dana zakat ke mustahik', debit: item.money, credit: item.money, accountDebit: 'Penyaluran Dana Zakat', accountCredit: 'Kas/Bank', reference: `${batch.id}:${mustahikId}`, unit: 'IDR', by: activeUser().id })
    if (item.rice > 0) addJournal({ code: 'ZIS-RICE-OUT', description: 'Penyaluran beras zakat ke mustahik', debit: item.rice, credit: item.rice, accountDebit: 'Dana Zakat - Beras', accountCredit: 'Persediaan Beras', reference: `${batch.id}:${mustahikId}`, unit: 'kg', by: activeUser().id })
    A.aud('DISTRIBUSI_QR', `Relawan ${activeUser().name} mencatat penerimaan ${mustahikId} pada ${batch.name}`)
    enqueueSync('distribution.confirmed', { distributionId: dist.id })
  }

  function correctionPage() {
    const records = A.scoped('corrections').sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return `${A.boxhead('Koreksi Transaksi Terkendali', 'Tidak ada edit atau hapus langsung pada transaksi terverifikasi. Setiap perubahan harus diajukan dengan alasan, ditinjau Bendahara, dan dicatat sebagai penyesuaian terpisah.')}<div class="cards">${A.stat('Menunggu keputusan', records.filter((x) => x.status === 'menunggu').length, 'Perlu ditinjau Bendahara')}${A.stat('Disetujui', records.filter((x) => x.status === 'disetujui').length, 'Penyesuaian ledger')}${A.stat('Ditolak', records.filter((x) => x.status === 'ditolak').length, 'Tetap dalam histori')}</div><section class="card"><h3>Permintaan koreksi dan jejak keputusan</h3>${A.table(['Tanggal', 'Transaksi', 'Pemohon', 'Nilai lama → usulan', 'Alasan', 'Status', 'Keputusan'], records.map((x) => { const t = db.transactions.find((tx) => tx.id === x.transactionId); return [esc(new Date(x.createdAt).toLocaleString('id-ID')), esc(t?.serial || x.transactionId), esc(A.who(x.requestedBy)), `${money(x.oldMoney)} → ${money(x.newMoney)}<br>${kilos(x.oldRice)} → ${kilos(x.newRice)}`, esc(x.reason), statusPill(x.status), activeUser()?.role === 'Bendahara' && x.status === 'menunggu' ? actionFor('Tinjau', 'correction-review-open', x.id, 'sm primary') : '—'] }))}</section>`
  }
  function supportPage() {
    const role = activeUser()?.role || 'Admin'
    const guides = {
      Admin: {
        intro: 'Anda bertugas menyiapkan tenant, akun petugas, periode, parameter perhitungan, dan kelayakan Mustahik. Transaksi yang sudah disahkan Amil tidak boleh diedit atau dihapus langsung.',
        ready: ['Pastikan tenant yang tampil di bagian atas sudah benar', 'Siapkan keputusan pengurus tentang tarif dan periode yang akan dipakai', 'Gunakan data sintetis pada prototype dan jangan memasukkan NIK asli warga'],
        flow: ['Periksa profil tenant', 'Buat akun dan tetapkan role', 'Siapkan periode dan parameter', 'Input serta verifikasi Mustahik', 'Pantau laporan dan audit'],
        modules: [
          { menu: 'Ringkasan', goal: 'Melihat kondisi umum tenant sebelum memulai pekerjaan.', steps: ['Setelah masuk, halaman Ringkasan tampil sebagai halaman awal. Perhatikan nama tenant dan periode yang tertulis di bagian atas agar tidak bekerja pada tenant yang keliru.', 'Baca empat kartu angka. Uang dan beras ditampilkan terpisah. Angka penerimaan belum tentu sama dengan kas yang sudah selesai direkonsiliasi.', 'Pada bagian grafik, gunakan pilihan kategori untuk menyaring penerimaan. Pilih Semua kategori bila ingin melihat seluruh kategori zakat.', 'Gunakan bagian alur operasional untuk memahami posisi proses. Untuk pekerjaan Admin, lanjutkan ke menu yang sesuai di sidebar.'], preview: [['Tenant', 'Masjid An-Nur VPA'], ['Periode', 'Periode aktif atau belum dibuka'], ['Kartu ringkasan', 'Uang · Beras · Verifikasi · Distribusi'], ['Filter grafik', 'Semua kategori'], ['Tombol berikutnya', 'Buka menu Mustahik']], result: 'Anda mengetahui periode yang aktif, jumlah penerimaan yang tercatat, dan bagian pekerjaan yang masih menunggu role lain.', caution: 'Jangan menyamakan angka transaksi tercatat dengan uang yang sudah diterima Bendahara. Status setiap proses perlu diperiksa pada menu masing-masing.' },
          { menu: 'Profil Lembaga & UPZ', goal: 'Memastikan identitas masjid atau lembaga dan wilayah UPZ benar sebelum data warga dimasukkan.', steps: ['Buka Profil Lembaga & UPZ pada kelompok menu Manajemen & Sistem.', 'Pada bagian Identitas tenant, isi Nama tenant dan Daerah. Contoh Daerah dapat berupa Villa Pesona Asri & Marbella 2 / VPA.', 'Lengkapi nomor telepon, email, jenis UPZ, wilayah BAZNAS tujuan, dan alamat sesuai data lembaga yang sudah disepakati.', 'Periksa ulang ejaan nama dan Daerah karena informasi ini menjadi identitas yang tampil saat Muzakki mendaftar.', 'Tekan Simpan profil tenant. Setelah pesan berhasil muncul, periksa kembali nilai yang tersimpan pada bagian profil.'], preview: [['Nama tenant', 'Masjid An-Nur'], ['Daerah', 'Villa Pesona Asri & Marbella 2 / VPA'], ['Jenis UPZ', 'UPZ Masjid / Perumahan'], ['Wilayah BAZNAS tujuan', 'Isi sesuai keputusan kerja sama'], ['Tombol', 'Simpan profil tenant']], result: 'Nama dan Daerah tenant tampil konsisten pada aplikasi dan menjadi acuan pendataan wilayah Muzakki.', caution: 'Jangan mengisi wilayah BAZNAS tujuan berdasarkan perkiraan. Pastikan hubungan UPZ dan wilayah pelaporan sudah dikonfirmasi oleh pengurus atau BAZNAS.' },
          { menu: 'Akun & Peran', goal: 'Membuat akun panitia dan memberikan akses sesuai pekerjaan masing-masing.', steps: ['Buka Akun & Peran, lalu tekan Tambah pengguna.', 'Isi Nama lengkap dan Alamat email. Gunakan alamat yang benar agar akun mudah dikenali.', 'Pilih satu role yang sesuai. Admin mengelola sistem, Operator menginput transaksi, Amil memverifikasi pembayaran, Bendahara mengelola kas, Relawan menjalankan distribusi, dan Pengurus melakukan pengawasan serta persetujuan.', 'Tekan Simpan. Periksa nama, email, role, dan status akun pada daftar pengguna.', 'Untuk menonaktifkan akses akun yang tidak lagi bertugas, gunakan tombol Nonaktifkan pada baris pengguna tersebut. Jangan menonaktifkan akun sendiri.'], preview: [['Nama lengkap', 'Nama petugas'], ['Alamat email', 'petugas@contoh.id'], ['Peran', 'Pilih satu dari tujuh role'], ['Status', 'Aktif / Nonaktif'], ['Tombol', 'Tambah pengguna · Edit · Nonaktifkan']], result: 'Setiap panitia memiliki role yang sesuai dan menu yang tampil akan mengikuti role tersebut.', caution: 'Akun pada prototype belum memiliki autentikasi dan kata sandi sesungguhnya. Pembuatan akun ini hanya untuk simulasi di browser. Jangan gunakan email atau password penting.' },
          { menu: 'Periode Zakat', goal: 'Membuka periode kerja baru dan mengarsipkan periode yang sudah selesai.', steps: ['Buka Periode Zakat pada sidebar.', 'Tekan Buat periode baru dan tulis nama periode secara jelas, misalnya Ramadan 1448 H / 2027 M.', 'Simpan periode. Periode baru akan berstatus Draf dan belum dipakai untuk transaksi.', 'Pada baris periode yang benar, tekan Aktifkan. Pastikan hanya periode yang dimaksud yang berstatus Aktif.', 'Setelah seluruh penerimaan, rekonsiliasi, dan penyaluran selesai, gunakan Tutup & arsipkan untuk menutup periode. Baca pesan sistem sebelum melanjutkan.'], preview: [['Nama periode', 'Ramadan 1448 H / 2027 M'], ['Status awal', 'Draf'], ['Aksi pada draf', 'Aktifkan'], ['Aksi periode aktif', 'Tutup & arsipkan'], ['Aturan', 'Satu periode aktif per tenant']], result: 'Periode yang benar tampil sebagai Aktif dan transaksi baru mengikuti periode tersebut.', caution: 'Jangan menutup periode ketika masih ada serah terima kas yang belum diverifikasi atau rencana alokasi yang menunggu keputusan. Sistem akan menolak penutupan tersebut.' },
          { menu: 'Tarif & Rumus', goal: 'Mengatur parameter nominal yang dipakai sebagai acuan kalkulator dan perencanaan.', steps: ['Buka Tarif & Rumus dan baca catatan aturan bisnis terlebih dahulu.', 'Isi Tarif zakat fitrah per jiwa dalam rupiah dan Beras zakat fitrah per jiwa dalam kilogram.', 'Pilih kelipatan pembulatan alokasi yang telah disepakati. Isi bobot Fakir, Miskin, dan Mualaf sesuai keputusan yang berlaku.', 'Periksa total bobot dan catatan sumber atau keputusan aturan. Jangan mengubah parameter hanya untuk membuat hasil terlihat sesuai harapan.', 'Tekan Simpan parameter demo. Catat bahwa perubahan aturan tidak otomatis menghitung ulang alokasi yang sudah disetujui.'], preview: [['Tarif fitrah', 'Rp 45.000 / jiwa · contoh'], ['Beras fitrah', '2,5 kg / jiwa · contoh'], ['Pembulatan', 'Rp 1.000 / Rp 10.000 / pilihan lain'], ['Bobot asnaf', 'Fakir · Miskin · Mualaf'], ['Tombol', 'Simpan parameter demo']], result: 'Parameter baru digunakan pada perhitungan berikutnya dan tetap dapat diperiksa kembali pada halaman yang sama.', caution: 'Tarif, nisab, harga emas, bobot, serta formula yang belum tersedia di form ini harus ditetapkan melalui keputusan terpisah. Halaman prototype belum menjadi penetapan hukum atau ketentuan syariah.' },
          { menu: 'Mustahik & Kelayakan', goal: 'Mencatat calon penerima, mengisi hasil survei, meninjau skor, lalu memverifikasi data yang layak.', steps: ['Buka Mustahik & Kelayakan dan tekan Tambah survei mustahik.', 'Isi identitas calon penerima seperti nama, alamat, wilayah, RT, dan informasi kontak yang diperlukan. Gunakan data sintetis saat demonstrasi.', 'Lengkapi faktor survei yang tersedia, antara lain pekerjaan, kisaran penghasilan, jumlah tanggungan, tempat tinggal, status pernikahan, dan jalur Mualaf bila sesuai.', 'Baca kotak Skor sementara. Periksa Jalur F/M, Jalur Mualaf, dan status akhir yang dihitung sistem.', 'Simpan hasil survei. Kembali ke daftar, cocokkan identitas dan hasilnya, lalu tekan Verifikasi hanya setelah data dan kelayakan diperiksa.', 'Bila ada kekeliruan sebelum verifikasi, gunakan Edit survei untuk memperbaiki data. Setelah status terverifikasi, lakukan perubahan sesuai prosedur koreksi data yang disetujui tenant.'], preview: [['Identitas', 'Nama · Alamat · RT'], ['Faktor survei', 'Wilayah · Penghasilan · Tanggungan'], ['Klasifikasi', 'Fakir · Miskin · Mualaf'], ['Skor sementara', 'Ditampilkan sebelum simpan'], ['Tombol', 'Simpan hasil survei · Verifikasi']], result: 'Data calon penerima tampil dalam daftar dan statusnya berubah menjadi terverifikasi setelah pemeriksaan.', caution: 'Hasil skor prototype mengikuti formula acuan workbook yang masih memiliki catatan pengecualian. Periksa menu Acuan Workbook 1447H dan minta validasi stakeholder sebelum memakai klasifikasi untuk penyaluran nyata.' },
          { menu: 'Notifikasi', goal: 'Melihat dan mengelola contoh antrean pesan yang berkaitan dengan layanan.', steps: ['Buka Notifikasi untuk melihat daftar notifikasi demo.', 'Periksa siapa penerima, saluran, subjek, dan status notifikasi.', 'Saat membuat antrean, pastikan persetujuan komunikasi penerima sudah ada dan pilih saluran yang sesuai.', 'Simpan antrean dan periksa statusnya. Status Simulasi berarti pesan belum benar-benar dikirim ke email atau WhatsApp.'], preview: [['Penerima', 'Muzakki terdaftar'], ['Saluran', 'Email / WhatsApp simulasi'], ['Persetujuan', 'Harus disetujui'], ['Status', 'Simulasi'], ['Catatan', 'Belum ada pengiriman eksternal']], result: 'Riwayat antrean pesan terlihat untuk kebutuhan evaluasi.', caution: 'Jangan menjanjikan pesan sudah diterima oleh Muzakki. Pengiriman email dan WhatsApp memerlukan API dan konfigurasi produksi yang belum tersedia.' },
          { menu: 'Audit & Arsip', goal: 'Memeriksa aktivitas pengguna dan konsistensi rantai audit pada data lokal.', steps: ['Buka Audit & Arsip setelah melakukan aktivitas yang ingin diperiksa.', 'Baca waktu, pengguna, jenis aktivitas, detail, dan nilai hash pada tabel log.', 'Periksa kartu Status pemeriksaan. Status Konsisten menunjukkan hash chain demo cocok dengan data log yang sedang dibaca.', 'Jika status menunjukkan Perlu audit, catat jumlah entri bermasalah dan jangan menghapus atau mengedit data secara manual.', 'Gunakan hasil pemeriksaan sebagai bahan evaluasi. Simpan arsip data melalui prosedur backup project bila diperlukan.'], preview: [['Status pemeriksaan', 'Konsisten / Perlu audit'], ['Log aktivitas', 'Waktu · Pengguna · Jenis · Detail'], ['Hash', 'SHA-256 berantai'], ['Antrean sinkronisasi', 'Jumlah event lokal'], ['Aksi', 'Periksa log dan eskalasi anomali']], result: 'Admin dapat menelusuri aktivitas yang dicatat dan mengenali perubahan data lokal yang tidak konsisten.', caution: 'Hash chain di browser bukan audit immutable dan tidak membuktikan identitas penanda tangan. Jangan menganggapnya sebagai pengganti audit server.' },
          { menu: 'Evaluasi Prototype', goal: 'Membaca keputusan yang masih menunggu validasi sebelum sistem dipakai secara resmi.', steps: ['Buka Evaluasi Prototype.', 'Baca setiap topik, status keputusan, dan alasan mengapa topik tersebut belum final.', 'Catat hal yang perlu dibawa ke rapat stakeholder, pembimbing agama, Bendahara, atau BAZNAS.', 'Jangan mengubah alur operasional berdasarkan asumsi pribadi sebelum keputusan dicatat.'], preview: [['Topik', 'Aturan bisnis yang belum final'], ['Status', 'Perlu keputusan stakeholder'], ['Tindak lanjut', 'Diskusi dan validasi'], ['Hasil', 'Keputusan terdokumentasi']], result: 'Tim memahami fitur yang sudah dapat diuji dan keputusan yang masih harus disepakati.' }
        ],
        faqs: [['Mengapa menu tertentu tidak terlihat?', 'Menu mengikuti role akun. Periksa role pada bagian kanan atas dan minta Admin memperbaiki penetapan role bila memang keliru.'], ['Mengapa periode tidak bisa ditutup?', 'Masih mungkin ada serah terima kas yang belum selesai atau alokasi yang belum diputuskan. Selesaikan proses tertunda terlebih dahulu.'], ['Bolehkah Admin mengubah transaksi yang sudah diverifikasi?', 'Tidak. Admin tidak memiliki hak edit atau hapus transaksi terverifikasi. Kesalahan harus melalui permintaan koreksi dan diketahui Bendahara.']]
      },
      Muzakki: {
        intro: 'Anda dapat menyiapkan data keluarga dan rencana zakat sendiri dari rumah. Setelah QR dibuat, bawa atau tunjukkan QR tersebut kepada Amil. Pembayaran belum dianggap sah hanya karena QR sudah muncul.',
        ready: ['Siapkan nama dan kontak yang dapat dihubungi', 'Siapkan alamat lengkap serta informasi Daerah dan RT', 'Pastikan jumlah anggota keluarga sudah benar sebelum menghitung zakat fitrah'],
        flow: ['Pilih atau gabung tenant', 'Lengkapi profil dan alamat', 'Simpan anggota keluarga', 'Hitung dan buat transaksi', 'Tunjukkan QR kepada Amil'],
        modules: [
          { menu: 'Ringkasan', goal: 'Melihat status akun dan pintasan menuju layanan mandiri.', steps: ['Buka Ringkasan dari sidebar bila ingin melihat informasi umum tenant.', 'Periksa nama tenant aktif dan periode yang sedang berjalan.', 'Pilih Layanan Mandiri dari menu Akun Muzakki untuk mengelola keluarga, menghitung zakat, dan membuat transaksi.'], preview: [['Akun', 'Muzakki'], ['Tenant aktif', 'Nama masjid atau lembaga'], ['Periode', 'Periode yang dibuka tenant'], ['Pintasan utama', 'Akun Muzakki']], result: 'Anda mengetahui tenant dan periode tempat transaksi akan dibuat.' },
          { menu: 'Akun Muzakki · Tenant', goal: 'Menghubungkan satu akun ke beberapa tenant tanpa mencampur transaksi antar lembaga.', steps: ['Masuk ke menu Akun Muzakki. Di bagian Tenant yang terhubung, lihat daftar lembaga yang sudah terhubung dengan akun Anda.', 'Gunakan pilihan Pilih tenant atau dropdown tenant aktif untuk berpindah ke lembaga yang ingin dilayani.', 'Untuk mendaftar di lembaga lain, tekan Gabung tenant lain.', 'Pilih nama tenant, tentukan Daerah, pilih RT bila wilayahnya VPA, lalu isi alamat lengkap.', 'Tekan Hubungkan tenant. Setelah berhasil, pilih tenant tersebut sebagai tenant aktif sebelum membuat rencana zakat.'], preview: [['Tenant yang terhubung', 'Masjid An-Nur · Tenant lainnya'], ['Daerah', 'VPA atau Non VPA'], ['RT', 'Muncul untuk VPA'], ['Alamat lengkap', 'Alamat sesuai tenant'], ['Tombol', 'Hubungkan tenant']], result: 'Tenant baru tampil dalam daftar dan dapat dipilih sebagai tenant aktif.', caution: 'Setiap tenant mempunyai keanggotaan, periode, dan QR transaksi sendiri. Amil suatu tenant hanya dapat memverifikasi transaksi milik tenant tersebut.' },
          { menu: 'Profil dan Wilayah Alamat', goal: 'Memastikan identitas, kontak, Daerah, RT, dan alamat tidak salah.', steps: ['Pada bagian Profil dan wilayah alamat, isi atau periksa Nama lengkap.', 'Periksa Nomor HP dan Email. Minimal satu kontak perlu tersedia agar lembaga dapat mengenali akun Anda.', 'Pilih Daerah. Bila memilih VPA, pilih RT yang sesuai. Bila memilih Non VPA, kolom RT tidak perlu diisi.', 'Isi Alamat lengkap dengan jelas, misalnya nama jalan, nomor rumah, blok, atau patokan yang membantu petugas.', 'Centang persetujuan penggunaan data, lalu tekan Simpan profil.'], preview: [['Nama lengkap', 'Nama sesuai identitas'], ['Nomor HP / Email', 'Minimal satu kontak'], ['Daerah', 'VPA / Non VPA'], ['RT', 'RT 01 sampai RT 12 untuk VPA'], ['Tombol', 'Simpan profil']], result: 'Profil tenant aktif tersimpan dan informasi wilayah bisa digunakan untuk rekap Muzakki.' },
          { menu: 'Data Keluarga Tanggungan', goal: 'Menyimpan nama orang yang menjadi tanggungan agar jumlah jiwa mudah digunakan kembali.', steps: ['Cari bagian Data keluarga tanggungan.', 'Masukkan nama setiap anggota keluarga pada satu baris. Isi hubungan seperti Kepala keluarga, Pasangan, atau Anak.', 'Tekan Tambah anggota bila perlu menambahkan baris baru.', 'Bila ada baris yang salah, tekan Hapus pada baris tersebut.', 'Setelah daftar lengkap, tekan Simpan data keluarga. Periksa kembali jumlah anggota yang tampil pada ringkasan.'], preview: [['Baris anggota', 'Nama anggota keluarga'], ['Hubungan', 'Kepala keluarga / Pasangan / Anak'], ['Tombol tambah', 'Tambah anggota'], ['Tombol simpan', 'Simpan data keluarga']], result: 'Jumlah anggota keluarga tersimpan dan menjadi nilai awal jumlah jiwa pada perhitungan fitrah.', caution: 'Periksa data keluarga sebelum membuat transaksi. Satu transaksi yang sudah dibuat pada tenant dan periode aktif akan membatasi pembuatan transaksi berikutnya.' },
          { menu: 'Kalkulator Zakat', goal: 'Menghitung perkiraan kewajiban sebelum menyimpan rencana transaksi.', steps: ['Pada bagian Kalkulator zakat, pilih jenis perhitungan seperti Zakat fitrah, Zakat maal, Fidyah, Kafarat, atau Infak / sedekah.', 'Pilih media perhitungan Uang atau Beras sesuai ketentuan tenant.', 'Isi Jumlah jiwa atau hari. Untuk zakat maal, isi Nilai harta. Harga emas dipakai sebagai parameter perhitungan yang ditampilkan.', 'Tekan Hitung estimasi dan baca hasil yang muncul di kotak hasil.', 'Bila ragu dengan tarif atau hasil, tanyakan kepada Amil atau pengelola tenant sebelum membuat transaksi.'], preview: [['Jenis perhitungan', 'Zakat fitrah / maal / lainnya'], ['Media', 'Uang (Rp) atau Beras (kg)'], ['Jumlah', 'Jiwa / hari'], ['Hasil', 'Estimasi kalkulator'], ['Tombol', 'Hitung estimasi']], result: 'Estimasi nominal atau kilogram tampil untuk membantu Anda menyiapkan pembayaran.', caution: 'Kalkulator adalah alat bantu berdasarkan parameter tenant. Hasilnya bukan fatwa dan tidak menggantikan konsultasi apabila jenis kewajiban atau dasar perhitungannya belum jelas.' },
          { menu: 'Buat Rencana Transaksi dan QR', goal: 'Menyimpan rencana pembayaran mandiri agar Amil dapat memeriksanya melalui QR.', steps: ['Pastikan tenant yang dipilih benar dan periode zakat sedang aktif.', 'Pada bagian Transaksi periode aktif, tekan Buat rencana zakat.', 'Pilih jenis zakat, media pembayaran, dan jumlah jiwa atau unit. Periksa nominal uang dalam rupiah atau berat dalam kilogram.', 'Pilih saluran notifikasi yang diinginkan. Pilihan email dan WhatsApp pada prototype masih berupa simulasi.', 'Baca catatan transaksi. Centang pernyataan bahwa status transaksi masih Pending sampai diperiksa Amil.', 'Tekan Simpan dan tampilkan QR. Simpan struk digital pada perangkat Anda.'], preview: [['Jenis zakat', 'Zakat Fitrah'], ['Media pembayaran', 'Uang (Rp) / Beras (kg)'], ['Jumlah jiwa / unit', 'Isi sesuai kewajiban'], ['Nominal', 'Contoh Rp 180.000'], ['Status setelah simpan', 'Pending'], ['Tombol', 'Simpan dan tampilkan QR']], result: 'Nomor transaksi dan QR tampil pada struk. Bawa QR tersebut ke meja Amil untuk pemeriksaan dan pembayaran.', caution: 'Satu akun hanya dapat membuat satu transaksi dalam satu tenant pada satu periode. QR Pending berlaku 24 jam atau sampai periode ditutup. QR bukan bukti pembayaran lunas.' },
          { menu: 'Riwayat dan Bukti Transaksi', goal: 'Melihat status transaksi dan membuka kembali bukti atau QR yang tersimpan.', steps: ['Kembali ke bagian Transaksi periode aktif pada Akun Muzakki.', 'Cari transaksi berdasarkan tanggal, tenant, nomor transaksi, jenis zakat, dan status.', 'Tekan Lihat struk untuk membuka rincian dan QR transaksi.', 'Gunakan Unduh gambar PNG untuk menyimpan gambar, Cetak / Simpan PDF untuk PDF, atau Cetak thermal bila diminta petugas.', 'Setelah pembayaran diperiksa Amil, buka kembali riwayat dan pastikan status sudah berubah. Bila status belum berubah padahal uang sudah diserahkan, hubungi Amil. Jangan membuat pembayaran kedua tanpa pemeriksaan.'], preview: [['Riwayat', 'Tanggal · Tenant · Nomor'], ['Status', 'Pending / Terverifikasi / Kedaluwarsa'], ['Aksi struk', 'Lihat struk'], ['Pilihan unduh', 'PNG · PDF · Thermal']], result: 'Anda memiliki salinan struk dan dapat memeriksa status transaksi dari akun yang sama.' },
        ],
        faqs: [['Apakah QR berarti saya sudah membayar?', 'Belum. QR hanya identitas rencana transaksi. Pembayaran dicatat setelah Amil memeriksa rincian, menerima pembayaran, dan mengesahkannya.'], ['Mengapa tombol Buat rencana zakat tidak muncul?', 'Periksa apakah tenant sudah dipilih, periode sudah aktif, dan Anda belum membuat transaksi untuk tenant dan periode yang sama.'], ['Apakah akun dapat bergabung ke banyak tenant?', 'Ya. Namun transaksi, QR, dan verifikasi tetap terpisah untuk setiap tenant.'], ['Apakah email atau WhatsApp sudah pasti terkirim?', 'Belum. Pada prototype, kanal tersebut hanya pilihan simulasi dan belum terhubung ke layanan pengiriman.']]
      },
      Operator: {
        intro: 'Anda melayani Muzakki yang datang langsung ke konter. Tugas utama adalah memastikan data dan nominal tercatat benar, lalu menyerahkan QR atau struk sementara kepada Muzakki untuk dibawa ke meja Amil.',
        ready: ['Pastikan tenant dan periode yang aktif sudah benar', 'Siapkan data kontak dan alamat Muzakki', 'Pastikan nominal uang atau kilogram sesuai keterangan Muzakki'],
        flow: ['Cari atau daftarkan Muzakki', 'Isi rincian transaksi konter', 'Periksa total dan simpan', 'Cetak atau berikan QR', 'Arahkan ke meja Amil'],
        modules: [
          { menu: 'Ringkasan', goal: 'Melihat periode aktif dan mengetahui pintasan ke menu transaksi.', steps: ['Periksa nama tenant dan periode pada bagian atas halaman.', 'Lihat jumlah transaksi menunggu verifikasi agar Anda mengetahui antrean yang perlu dilayani.', 'Tekan menu Penerimaan & Verifikasi untuk membuat transaksi konter.'], preview: [['Role', 'Operator'], ['Tenant / periode', 'Pastikan benar'], ['Pintasan', 'Penerimaan & Verifikasi']], result: 'Anda siap melayani transaksi pada tenant dan periode yang benar.' },
          { menu: 'Data Muzakki', goal: 'Mencari data warga yang sudah terdaftar atau mendaftarkan warga yang baru datang.', steps: ['Buka Data Muzakki.', 'Gunakan kotak pencarian untuk mencari nama, nomor HP, atau kode kartu. Periksa hasilnya sebelum membuat data baru.', 'Bila warga belum terdaftar, tekan Tambah Muzakki.', 'Isi Nama lengkap dan minimal satu kontak, yaitu Nomor HP atau Email. Pilih Daerah, pilih RT bila VPA, lalu isi Alamat lengkap.', 'Tekan Simpan data Muzakki. Pastikan data baru tampil dalam daftar.', 'Bila warga sudah terdaftar, jangan membuat duplikasi. Gunakan data yang ditemukan saat mengisi transaksi.'], preview: [['Pencarian', 'Nama · HP · Kode kartu'], ['Identitas', 'Nama lengkap dan kontak'], ['Wilayah', 'VPA / Non VPA · RT'], ['Alamat', 'Alamat lengkap'], ['Tombol', 'Tambah Muzakki · Simpan data']], result: 'Data warga tersimpan pada tenant aktif dan dapat dipilih saat transaksi konter dibuat.', caution: 'Data yang dimasukkan Operator tidak otomatis membuat akun mandiri Muzakki. Pengaitan histori lama ke akun baru memerlukan verifikasi kontak yang belum tersedia pada prototype.' },
          { menu: 'Penerimaan & Verifikasi · Input Konter', goal: 'Mencatat rencana pembayaran dari warga walk-in dengan status awal Pending.', steps: ['Buka Penerimaan & Verifikasi, lalu tekan Input transaksi konter.', 'Pada pilihan Muzakki terdaftar, pilih orang yang sudah ada. Bila belum ada, pilih Input data baru lalu lengkapi identitasnya.', 'Pilih Daerah dan RT, lalu periksa alamat. Data wilayah harus konsisten dengan profil warga.', 'Pilih Jenis zakat dan Media pembayaran. Masukkan jumlah jiwa atau unit serta nominal rupiah atau kilogram.', 'Periksa kembali angka yang tampil. Uang harus berupa rupiah dengan pemisah ribuan dan beras harus berupa kilogram.', 'Isi catatan bila diperlukan, lalu tekan Simpan dan terbitkan QR.', 'Setelah struk muncul, berikan QR kepada Muzakki dan arahkan ke meja Amil. Jangan menerima uang atau menekan verifikasi pembayaran.'], preview: [['Muzakki', 'Pilih data terdaftar / Input data baru'], ['Jenis zakat', 'Zakat Fitrah / Maal / lainnya'], ['Media', 'Uang (Rp) / Beras (kg)'], ['Jumlah', 'Jiwa / unit'], ['Nominal', 'Rp 180.000 atau 2,5 kg'], ['Status awal', 'Pending'], ['Tombol', 'Simpan dan terbitkan QR']], result: 'Transaksi muncul pada daftar dengan status Pending dan memiliki nomor serta QR yang dapat diperiksa Amil.', caution: 'Operator tidak memegang uang, tidak memandu pengesahan akhir, dan tidak dapat mengubah status menjadi Paid. Semua transaksi harus disahkan oleh Amil.' },
          { menu: 'Struk Digital dan Cetak', goal: 'Menyerahkan bukti rencana transaksi yang mudah dibuka oleh Amil.', steps: ['Pada daftar transaksi, cari nomor transaksi yang baru dibuat.', 'Tekan Struk / QR atau buka rincian transaksi bila tombol tersedia.', 'Pastikan nama Muzakki, jumlah jiwa, jenis zakat, total uang atau beras, dan QR benar.', 'Gunakan Unduh gambar PNG untuk mengirim gambar melalui perangkat, Cetak / Simpan PDF untuk arsip, atau Cetak thermal 80 mm bila printer konter tersedia.', 'Pastikan QR terlihat jelas dan tidak terpotong sebelum diserahkan.'], preview: [['Nama Muzakki', 'Sesuai orang yang dilayani'], ['Nomor transaksi', 'Kode unik'], ['Total', 'Rupiah dan kilogram'], ['QR', 'Harus terlihat jelas'], ['Pilihan', 'PNG · PDF · Thermal']], result: 'Muzakki membawa atau menampilkan QR yang terbaca di meja Amil.', caution: 'Struk berstatus Pending adalah struk rencana, bukan Bukti Setor Zakat resmi. Bukti setor yang sah diterbitkan setelah proses verifikasi Amil.' },
          { menu: 'Koreksi Terkendali', goal: 'Melaporkan kesalahan data transaksi tanpa menghapus atau menimpa transaksi sumber.', steps: ['Buka Koreksi Terkendali atau gunakan tombol Ajukan koreksi pada transaksi yang memenuhi syarat.', 'Pilih transaksi yang salah dan bandingkan angka uang serta beras pada transaksi asli.', 'Isi nilai yang seharusnya dalam rupiah dan kilogram.', 'Tuliskan alasan koreksi dengan jelas, misalnya salah input nominal atau salah satuan.', 'Tekan Kirim permintaan koreksi. Catat bahwa statusnya menunggu keputusan Bendahara.', 'Periksa kembali halaman koreksi untuk melihat keputusan. Jangan membuat transaksi pengganti sebelum mengikuti arahan Amil dan Bendahara.'], preview: [['Nilai lama', 'Tertera dari transaksi asli'], ['Nilai usulan', 'Uang baru · Beras baru'], ['Alasan', 'Wajib dijelaskan'], ['Status', 'Menunggu keputusan'], ['Tombol', 'Kirim permintaan koreksi']], result: 'Permintaan koreksi tersimpan sebagai catatan terpisah dan transaksi sumber tetap ada.', caution: 'Operator tidak dapat menyetujui koreksi sendiri. Bendahara meninjau dan mencatat keputusan.' }
        ],
        faqs: [['Apa yang harus dilakukan bila salah mengetik nominal?', 'Jangan membuat pembayaran atau transaksi duplikat. Ajukan koreksi dengan alasan bila transaksi sudah masuk tahap yang memperbolehkan koreksi, lalu koordinasikan dengan Amil dan Bendahara.'], ['Bolehkah Operator menerima uang?', 'Tidak. Operator hanya melakukan entri data. Penerimaan fisik dan verifikasi dilakukan Amil.'], ['Muzakki tidak punya smartphone, bagaimana?', 'Bantu cetak struk agar QR dapat dibawa ke meja Amil. Amil tetap melakukan pemeriksaan melalui nomor atau token bila kamera tidak tersedia.']]
      },
      Amil: {
        intro: 'Anda adalah petugas penerima pembayaran dan penanggung jawab shift. Setiap transaksi mandiri maupun transaksi konter harus diperiksa oleh Amil sebelum statusnya disahkan.',
        ready: ['Pastikan akun Anda terdaftar sebagai Amil', 'Periksa jadwal dan tenant tempat bertugas', 'Siapkan perangkat pemindai atau kolom token manual'],
        flow: ['Buka shift', 'Scan QR transaksi', 'Cocokkan identitas dan nominal', 'Pandu akad dan terima pembayaran', 'Sahkan, terbitkan BSZ, lalu tutup shift'],
        modules: [
          { menu: 'Ringkasan', goal: 'Melihat kondisi antrean dan akses cepat ke proses verifikasi.', steps: ['Periksa tenant dan periode aktif.', 'Lihat kartu Menunggu Amil untuk mengetahui antrean transaksi Pending.', 'Gunakan pintasan Scan QR atau buka Penerimaan & Verifikasi.', 'Selesaikan verifikasi secara berurutan dan jangan mengesahkan transaksi yang belum diterima pembayarannya.'], preview: [['Transaksi periode', 'Semua transaksi tenant'], ['Menunggu Amil', 'QR yang belum disahkan'], ['Terverifikasi Amil', 'Pembayaran yang sudah diterima'], ['Pintasan', 'Penerimaan & Verifikasi']], result: 'Anda mengetahui antrean dan dapat mulai melayani transaksi.' },
          { menu: 'Shift & Kehadiran', goal: 'Memeriksa jadwal tugas dan memahami bahwa verifikasi hanya aktif dalam shift yang dibuka.', steps: ['Buka Shift & Kehadiran untuk melihat jadwal tanggal, jam tugas, nama Amil, dan status kehadiran.', 'Pastikan jadwal yang tampil sesuai penugasan Anda. Bila nama atau jadwal tidak sesuai, hubungi koordinator.', 'Untuk membuka shift operasional, buka Penerimaan & Verifikasi lalu tekan Absensi buka shift.', 'Saat pekerjaan selesai, kembali ke halaman yang sama dan tekan Tutup shift.', 'Pastikan total transaksi shift tercatat sebelum menyerahkan kas fisik kepada Bendahara.'], preview: [['Menu jadwal', 'Tanggal · Jam shift · Petugas'], ['Status jadwal', 'Hadir / Belum / Digantikan'], ['Aksi operasional', 'Absensi buka shift'], ['Aksi selesai', 'Tutup shift']], result: 'Shift aktif tercatat dan verifikasi transaksi dapat dilakukan sesuai sesi petugas.', caution: 'Menu jadwal menunjukkan jadwal dan kehadiran. Tombol buka atau tutup sesi operasional berada pada halaman Penerimaan & Verifikasi.' },
          { menu: 'Data Muzakki · Bantuan Input Konter', goal: 'Membantu warga yang belum memiliki transaksi mandiri saat Operator tidak tersedia.', steps: ['Buka Data Muzakki dan cari warga berdasarkan nama atau kontak.', 'Bila warga belum ada, tekan Tambah Muzakki dan lengkapi identitas, Daerah, RT bila VPA, serta alamat.', 'Simpan data warga dan pastikan namanya tampil pada daftar.', 'Bila perlu langsung mencatat transaksi, buka Penerimaan & Verifikasi lalu gunakan Input transaksi konter. Amil memiliki kewenangan input yang sama seperti Operator.', 'Setelah menyimpan transaksi, lanjutkan pemeriksaan melalui scan QR seperti alur biasa.'], preview: [['Pencarian', 'Nama · HP · Kode kartu'], ['Data baru', 'Nama · Kontak · Wilayah · Alamat'], ['Aksi', 'Tambah Muzakki'], ['Input transaksi', 'Input transaksi konter']], result: 'Warga yang belum siap menggunakan layanan mandiri tetap dapat dilayani tanpa mengubah tahapan verifikasi.', caution: 'Hak input konter diberikan kepada Amil agar layanan tetap berjalan ketika Operator tidak tersedia. Operator tidak memperoleh hak verifikasi Amil.' },
          { menu: 'Penerimaan & Verifikasi · Scan QR', goal: 'Memeriksa sumber transaksi, identitas, rincian zakat, dan mengesahkan pembayaran.', steps: ['Pastikan shift sudah dibuka. Jika belum, tekan Absensi buka shift terlebih dahulu.', 'Pada kartu Scan QR transaksi, pilih Buka kamera dan izinkan akses kamera bila diminta. Arahkan kamera ke QR pada struk Muzakki atau Operator.', 'Jika kamera tidak dapat digunakan, tempel token QR atau ketik nomor seri pada kolom input, lalu tekan Periksa QR.', 'Baca detail transaksi yang muncul. Cocokkan nama Muzakki, tenant asal, jumlah jiwa, jenis zakat, nominal uang, dan berat beras.', 'Pastikan tenant pada transaksi sama dengan tenant tempat Anda bertugas. Jangan memverifikasi QR tenant lain.', 'Pandu Muzakki melakukan niat dan akad sesuai ketentuan tenant. Pastikan uang atau beras benar-benar diterima dan jumlah fisiknya cocok.', 'Setelah seluruh pemeriksaan benar, gunakan tindakan verifikasi pada rincian transaksi. Periksa konfirmasi sebelum menyelesaikan.', 'Pastikan status berubah dari Pending menjadi Terverifikasi Amil atau Paid. Setelah itu bukti setor dapat diterbitkan.'], preview: [['Pemindai', 'Kamera atau token manual'], ['Identitas', 'Nama · Tenant · Jumlah jiwa'], ['Rincian', 'Kategori · Uang · Beras'], ['Petugas', 'Identitas Amil yang sedang login'], ['Aksi akhir', 'Verifikasi setelah akad dan pembayaran']], result: 'Transaksi berubah menjadi terverifikasi dan masuk perhitungan setoran shift.', caution: 'QR yang valid tidak membuktikan bahwa uang sudah diterima. Jangan menekan verifikasi sebelum akad dan penerimaan fisik selesai. Kamera memerlukan HTTPS dan izin perangkat.' },
          { menu: 'Struk dan Bukti Setor Zakat', goal: 'Memberikan bukti kepada Muzakki setelah status pembayaran berhasil disahkan.', steps: ['Setelah verifikasi, buka transaksi yang baru selesai dari daftar transaksi.', 'Tekan Struk / QR untuk melihat identitas, nilai, status, dan kode QR transaksi.', 'Pastikan judul bukti menunjukkan Bukti Setor Zakat · Simulasi dan status sudah terverifikasi.', 'Gunakan Unduh gambar PNG, Cetak / Simpan PDF, atau Cetak thermal 80 mm sesuai perangkat yang tersedia.', 'Berikan salinan kepada Muzakki dan simpan arsip sesuai prosedur tenant.'], preview: [['Judul bukti', 'Bukti Setor Zakat · Simulasi'], ['Nomor transaksi', 'Kode unik'], ['Status', 'Terverifikasi Amil'], ['Aksi', 'PNG · PDF · Thermal 80 mm']], result: 'Muzakki menerima bukti transaksi yang telah diverifikasi dalam bentuk digital atau cetak.', caution: 'Semua bukti pada prototype masih berlabel simulasi. Jangan menyebutnya dokumen resmi untuk keperluan hukum atau perpajakan.' },
          { menu: 'Ketentuan, Dalil, Doa dan Akad', goal: 'Menggunakan halaman referensi saat memandu proses akad dan layanan zakat.', steps: ['Buka menu Dalil, Ketentuan & Akad.', 'Baca urutan layanan dan rujukan yang ditampilkan sebelum bertugas.', 'Saat melayani, sampaikan niat dan doa dengan bahasa yang dipahami Muzakki serta ikuti arahan pembimbing agama tenant.', 'Pastikan Muzakki memahami jenis zakat dan nilai yang akan diserahkan.', 'Lanjutkan ke verifikasi pembayaran hanya setelah proses akad dan penerimaan selesai.'], preview: [['Rujukan', 'QS. At-Taubah ayat 103 · QS. Al-Baqarah ayat 43'], ['Materi', 'Doa dan niat ilustratif'], ['Penggunaan', 'Panduan saat akad'], ['Validasi', 'Perlu pemeriksaan pembimbing agama']], result: 'Amil memiliki referensi ringkas untuk menjalankan layanan dengan tertib.', caution: 'Lafaz pada halaman ini merupakan materi ilustratif dan perlu disahkan pembimbing agama tenant. Tombol verifikasi tidak dengan sendirinya menjadikan akad sah.' },
          { menu: 'Koreksi Terkendali', goal: 'Mengajukan perbaikan jika ditemukan kesalahan pada transaksi yang telah diproses.', steps: ['Cari transaksi terkait pada halaman Penerimaan & Verifikasi atau Koreksi Terkendali.', 'Tekan Ajukan koreksi pada transaksi yang tersedia.', 'Isi nominal uang dan jumlah beras yang benar.', 'Tuliskan alasan yang dapat diperiksa, misalnya perbedaan hasil hitung atau salah satuan.', 'Kirim permintaan dan tunggu tinjauan Bendahara. Jangan mengubah catatan transaksi sumber secara manual.'], preview: [['Transaksi asal', 'Nomor dan nilai yang tercatat'], ['Nilai seharusnya', 'Uang · Beras'], ['Alasan', 'Wajib diisi'], ['Status', 'Menunggu keputusan Bendahara']], result: 'Permintaan perbaikan tercatat tanpa menghapus bukti transaksi awal.' }
        ],
        faqs: [['Mengapa tombol verifikasi tidak tersedia?', 'Pastikan Anda login dengan role Amil dan shift sudah dibuka. Operator tidak dapat melakukan verifikasi.'], ['QR tidak terbaca kamera?', 'Pastikan kamera mendapat izin dan aplikasi dibuka melalui HTTPS. Anda juga dapat memasukkan token QR atau nomor seri secara manual.'], ['Jumlah fisik berbeda dari yang tampil?', 'Jangan sahkan sebelum selisih dijelaskan. Ikuti prosedur tenant dan catat koreksi melalui mekanisme yang tersedia.']]
      },
      Bendahara: {
        intro: 'Anda bertanggung jawab atas penerimaan kas aktual, pencocokan rekening, jurnal, dan penyiapan alokasi serta batch. Pisahkan uang dan beras dan jangan mengubah transaksi sumber yang sudah diverifikasi.',
        ready: ['Pastikan Amil sudah menutup shift', 'Siapkan uang dan beras fisik untuk dihitung bersama', 'Siapkan bukti mutasi rekening atau catatan saldo logistik'],
        flow: ['Terima berita acara shift', 'Cocokkan kas fisik', 'Cocokkan mutasi rekening', 'Tinjau jurnal dan koreksi', 'Buat alokasi lalu batch distribusi'],
        modules: [
          { menu: 'Ringkasan', goal: 'Memantau arus masuk, rekonsiliasi, dan jumlah yang sudah disalurkan.', steps: ['Periksa tenant dan periode aktif.', 'Bandingkan kartu Uang tercatat, Beras tercatat, Uang diverifikasi Amil, dan Uang disalurkan.', 'Gunakan grafik kategori untuk melihat komposisi penerimaan.', 'Buka Serah Terima & Rekonsiliasi untuk pekerjaan kas yang masih tertunda.'], preview: [['Penerimaan uang', 'Semua transaksi periode'], ['Beras', 'Kilogram terpisah'], ['Diverifikasi Amil', 'Pembayaran sudah disahkan'], ['Disalurkan', 'Realisasi dari batch']], result: 'Anda dapat melihat bagian proses keuangan yang masih perlu diselesaikan.' },
          { menu: 'Serah Terima & Rekonsiliasi', goal: 'Mencocokkan laporan shift Amil, kas atau beras fisik, dan mutasi rekening melalui dua tahap.', steps: ['Pastikan Amil telah menekan Tutup shift. Shift yang masih terbuka tidak tersedia untuk berita acara.', 'Tekan Buat berita acara serah terima. Pilih shift Amil yang akan diserahterimakan lalu periksa estimasi transaksi, uang, dan beras.', 'Setelah uang dan beras dihitung bersama, buka Periksa kas fisik. Masukkan jumlah aktual yang benar-benar diterima.', 'Bila jumlah aktual berbeda dari catatan sistem, isi catatan selisih secara jelas. Simpan penerimaan fisik dan lakukan pemeriksaan ulang.', 'Setelah tahap kas diterima, buka Rekonsiliasi rekening. Masukkan mutasi rekening masuk dan jumlah beras atau saldo logistik yang tercatat.', 'Isi nomor referensi rekening bila tersedia dan tambahkan catatan pencocokan. Tekan Selesaikan rekonsiliasi tahap 2.', 'Periksa status akhir. Status Terverifikasi menandakan tahap rekonsiliasi selesai. Selisih tetap harus ditelusuri, bukan ditutup dengan angka perkiraan.'], preview: [['Tahap 1', 'Kas aktual dan beras fisik'], ['Nilai sistem', 'Estimasi dari transaksi Paid dalam shift'], ['Tahap 2', 'Mutasi rekening / saldo logistik'], ['Referensi', 'Nomor referensi rekening'], ['Status akhir', 'Terverifikasi / Selisih rekening']], result: 'Setoran memiliki catatan uang dan beras aktual, data rekening, pemeriksa, dan status rekonsiliasi.', caution: 'Jangan memasukkan angka perkiraan hanya agar status menjadi Terverifikasi. Selisih harus dicatat dan ditindaklanjuti sesuai prosedur.' },
          { menu: 'Jurnal dan Laporan Keuangan', goal: 'Memeriksa jurnal otomatis, neraca ringkas, dan perubahan dana.', steps: ['Buka Jurnal & Laporan Keuangan.', 'Periksa kartu saldo kas atau bank, penerimaan dana zakat, penyaluran dana, dan persediaan beras.', 'Baca Neraca uang dan Neraca persediaan beras secara terpisah. Jangan menjumlahkan rupiah dengan kilogram.', 'Periksa laporan perubahan dana untuk melihat penerimaan dikurangi penyaluran.', 'Pada tabel Jurnal umum, periksa tanggal, referensi, keterangan, akun debit, akun kredit, dan pencatat.', 'Tekan Unduh jurnal XLSX untuk menyimpan rincian jurnal dan gunakan sebagai bahan pemeriksaan.'], preview: [['Neraca uang', 'Kas / Bank · Dana Zakat'], ['Neraca beras', 'Persediaan Beras · Dana Zakat Beras'], ['Perubahan dana', 'Penerimaan · Distribusi · Bersih'], ['Jurnal', 'Tanggal · Referensi · Debit · Kredit'], ['Tombol', 'Unduh jurnal XLSX']], result: 'Anda memperoleh gambaran arus dana dan persediaan yang tercatat otomatis pada prototype.', caution: 'Jurnal ini belum merupakan laporan keuangan final yang diaudit. Bagan akun, dana terikat, kebijakan pengakuan, dan format sesuai standar perlu disepakati bersama pihak akuntansi dan BAZNAS.' },
          { menu: 'Koreksi Terkendali', goal: 'Meninjau dan memutuskan permintaan koreksi dari Amil atau Operator.', steps: ['Buka Koreksi Terkendali dan cari permintaan berstatus Menunggu.', 'Tekan Tinjau pada baris permintaan.', 'Bandingkan nilai lama dan nilai usulan. Baca alasan dari pemohon serta catatan transaksi terkait.', 'Pilih Setujui koreksi bila bukti mendukung atau Tolak koreksi bila tidak dapat dibenarkan.', 'Isi catatan keputusan. Simpan keputusan dan pastikan status berubah.', 'Periksa jurnal atau laporan setelah koreksi disetujui. Transaksi asli tetap tersimpan sebagai sumber audit.'], preview: [['Nilai lama', 'Uang dan beras pada transaksi awal'], ['Nilai usulan', 'Angka yang diminta pemohon'], ['Alasan', 'Penjelasan kesalahan'], ['Keputusan', 'Setujui / Tolak'], ['Tombol', 'Simpan keputusan']], result: 'Keputusan koreksi tercatat sebagai jejak terpisah dan dapat ditinjau Pengurus.', caution: 'Jangan mengubah atau menghapus transaksi asal. Setiap persetujuan harus memiliki dasar dan catatan yang bisa ditelusuri.' },
          { menu: 'Alokasi & Persetujuan', goal: 'Menyiapkan rencana pembagian dari saldo yang sudah direkonsiliasi dan mengirimkannya kepada Pengurus.', steps: ['Buka Alokasi & Persetujuan. Periksa kartu Dana direkonsiliasi dan daftar rencana yang sudah ada.', 'Pilih Alokasi fleksibel bila akan membuat rencana berdasarkan saldo tersedia. Untuk uji acuan workbook, pilih Tahap 1 atau Tahap 2 sesuai kebutuhan evaluasi.', 'Pada alokasi fleksibel, isi nama rencana, anggaran uang, dan anggaran beras. Pastikan angkanya tidak melebihi saldo tersedia.', 'Baca peringatan bahwa pembagian rata pada prototype merupakan asumsi demonstrasi. Isi catatan dasar pembagian dan simpan sebagai draf.', 'Buka Rincian untuk memeriksa jumlah penerima dan nilai masing-masing.', 'Bila sudah diperiksa, tekan Ajukan. Status berubah menjadi Diajukan dan Pengurus dapat melakukan peninjauan.', 'Pantau keputusan. Bila ditolak, baca catatan dan diskusikan perbaikannya sebelum membuat pengajuan baru.'], preview: [['Saldo uang dan beras', 'Saldo hasil rekonsiliasi'], ['Anggaran', 'Isi sesuai keputusan'], ['Metode', 'Pembagian rata sementara untuk evaluasi'], ['Status awal', 'Draf'], ['Aksi', 'Ajukan kepada Pengurus']], result: 'Rencana tersimpan, diajukan, dan menunggu persetujuan Pengurus sebelum dapat menjadi dasar distribusi.', caution: 'Jangan menganggap pembagian rata sebagai ketentuan resmi. Rumus, prioritas mustahik, dan alokasi saldo harus disetujui stakeholder terlebih dahulu.' },
          { menu: 'Batch & Penyaluran Lapangan', goal: 'Membagi penerima dari alokasi yang disetujui menjadi Batch 1, Batch 2, dan seterusnya.', steps: ['Buka Batch & Penyaluran Lapangan setelah Pengurus menyetujui rencana alokasi.', 'Tekan Buat batch distribusi.', 'Isi nama batch, misalnya Batch 1 Sebelum Idulfitri. Pilih alokasi sumber yang sudah disetujui.', 'Pilih Relawan pelaksana dan tanggal rencana.', 'Kolom ID Mustahik dapat dikosongkan bila seluruh penerima yang belum ditugaskan dari alokasi itu akan dimasukkan. Bila hanya sebagian, masukkan ID sesuai petunjuk dan pisahkan dengan koma atau baris baru.', 'Tekan Simpan batch. Periksa nama Relawan, jumlah penerima, dan progres batch.', 'Ulangi untuk membuat batch berikutnya sesuai jadwal dan kapasitas lapangan.'], preview: [['Nama batch', 'Batch 1 Sebelum Idulfitri'], ['Alokasi sumber', 'Pilih rencana Disetujui'], ['Relawan pelaksana', 'Pilih akun Relawan'], ['Tanggal rencana', 'Tanggal pelaksanaan'], ['Tombol', 'Simpan batch']], result: 'Daftar tugas batch muncul di akun Relawan yang ditunjuk.', caution: 'Jangan memasukkan ID penerima yang tidak termasuk alokasi. Penerima yang sudah dicatat menerima bantuan tidak boleh dicatat dua kali.' },
          { menu: 'Laporan & Statistik', goal: 'Menyusun rekap penerimaan, rekonsiliasi, distribusi, mustahik, serta bahan pelaporan UPZ.', steps: ['Buka Laporan & Statistik.', 'Pilih Periode yang ingin diperiksa.', 'Pilih Jenis laporan, misalnya Semua ZIS, Penerimaan, Rekonsiliasi kas, Distribusi, atau Mustahik dan wilayah.', 'Periksa kartu ringkasan dan rincian yang tampil. Uang dan beras tetap menggunakan satuan masing-masing.', 'Gunakan Unduh CSV untuk olah data sederhana, Unduh XLSX untuk lembar kerja, atau Cetak / PDF untuk dokumen yang siap ditinjau.', 'Gunakan paket laporan UPZ XLSX atau CSV sebagai bahan penyesuaian dengan format yang nantinya disepakati BAZNAS.'], preview: [['Periode', 'Pilih periode pelaporan'], ['Jenis laporan', 'Semua · Penerimaan · Kas · Distribusi · Mustahik'], ['Ekspor', 'CSV · XLSX · PDF'], ['Paket UPZ', 'XLSX / CSV']], result: 'File rekap terunduh dan dapat diteruskan kepada pihak yang berwenang untuk diperiksa.', caution: 'Ekspor prototype bukan pengiriman otomatis ke BAZNAS. Periksa filter, periode, dan kelengkapan data sebelum membagikan file.' },
          { menu: 'Audit & Arsip', goal: 'Menelusuri jejak aktivitas dan memastikan tidak ada perubahan log lokal yang tidak konsisten.', steps: ['Buka Audit & Arsip.', 'Periksa status hash chain, jumlah aktivitas, hash terakhir, dan antrean sinkronisasi.', 'Gunakan tabel log untuk mencari waktu, pengguna, jenis aktivitas, dan detail peristiwa.', 'Bila menemukan anomali atau selisih, catat referensi transaksi atau setoran dan laporkan kepada Pengurus.', 'Jangan memperbaiki log dengan mengubah localStorage secara manual.'], preview: [['Pemeriksaan', 'Konsisten / Perlu audit'], ['Aktivitas', 'Urut terbaru'], ['Hash', 'SHA-256 berantai'], ['Antrean', 'Event lokal menunggu sinkronisasi']], result: 'Informasi jejak aktivitas siap digunakan sebagai bahan audit internal.', caution: 'Penyimpanan lokal bukan audit server immutable. Antrean sinkronisasi belum berarti data sudah terkirim ke cloud.' }
        ],
        faqs: [['Mengapa berita acara belum bisa dibuat?', 'Pastikan Amil sudah menutup shift dan ada transaksi Paid dalam shift tersebut.'], ['Apa yang harus dilakukan bila uang fisik berbeda?', 'Masukkan nilai aktual yang benar dan tulis catatan selisih. Telusuri penyebabnya sebelum menyelesaikan tahap berikutnya.'], ['Bolehkah batch dibuat sebelum persetujuan?', 'Tidak. Batch harus bersumber dari alokasi yang sudah disetujui Pengurus.']]
      },
      Relawan: {
        intro: 'Anda bertugas di lapangan untuk memastikan bantuan diterima oleh Mustahik yang tepat. Pilih batch tugas Anda, cocokkan identitas penerima, lalu catat serah terima satu kali.',
        ready: ['Pastikan Anda login dengan akun Relawan yang ditugaskan', 'Pastikan daftar batch sudah diberikan Bendahara', 'Siapkan kamera atau kode QR Mustahik dan jaga perangkat tetap aktif'],
        flow: ['Buka Batch Tugas', 'Pilih batch yang benar', 'Scan QR atau cari kode', 'Cocokkan identitas dan paket', 'Konfirmasi serah terima'],
        modules: [
          { menu: 'Ringkasan', goal: 'Mengetahui apakah sudah ada tugas distribusi yang diberikan kepada Anda.', steps: ['Periksa nama akun dan role Relawan pada halaman.', 'Buka Batch & Penyaluran Lapangan untuk melihat daftar tugas.', 'Bila jumlah batch aktif masih nol, hubungi Bendahara agar akun Anda ditetapkan sebagai pelaksana batch.'], preview: [['Role', 'Relawan'], ['Batch aktif', 'Jumlah tugas yang belum selesai'], ['Pintasan', 'Batch & Penyaluran Lapangan']], result: 'Anda mengetahui apakah sudah menerima penugasan distribusi.' },
          { menu: 'Batch & Penyaluran Lapangan', goal: 'Memverifikasi Mustahik dan mencatat bahwa bantuan pada batch telah diterima.', steps: ['Buka Batch & Penyaluran Lapangan. Pastikan batch tersebut memang ditugaskan kepada akun Anda.', 'Pada pilihan Batch tugas, pilih nama batch yang sedang dikerjakan. Periksa angka progres penerima.', 'Minta QR Mustahik dan tekan Kamera. Izinkan akses kamera bila diminta. Jika kamera tidak tersedia, ketik kode penerima pada kolom QR Mustahik atau kode penerima.', 'Tekan Cari. Periksa nama, wilayah, status kelayakan, dan jumlah bantuan yang ditampilkan.', 'Pastikan nama orang yang hadir sesuai dengan data. Jangan menyerahkan paket hanya berdasarkan kode yang tidak cocok.', 'Setelah bantuan benar-benar diserahkan, tekan Konfirmasi penerimaan pada rincian penerima.', 'Periksa bahwa status penerima berubah menjadi Sudah diterima dan progres batch bertambah.', 'Lanjutkan ke penerima berikutnya. Bila orang yang sama sudah tercatat, sistem akan menolak pencatatan ganda.'], preview: [['Batch tugas', 'Batch 1 · 4 dari 20'], ['QR / kode', 'Scan kamera atau ketik kode'], ['Identitas', 'Nama · Wilayah · Status'], ['Bantuan', 'Nominal uang dan/atau kg beras'], ['Aksi', 'Konfirmasi penerimaan']], result: 'Penerimaan bantuan tersimpan pada batch dan progres penyaluran bertambah.', caution: 'Konfirmasi hanya dilakukan setelah bantuan benar-benar diserahkan. Jangan memindai QR milik orang lain untuk menggantikan penerima yang tidak hadir.' },
          { menu: 'Bila Kamera atau Jaringan Bermasalah', goal: 'Tetap melakukan pemeriksaan dengan cara yang aman saat fitur perangkat tidak tersedia.', steps: ['Jika kamera tidak muncul, periksa izin kamera pada browser dan pastikan aplikasi dibuka melalui HTTPS.', 'Gunakan kolom kode penerima untuk memasukkan token secara manual bila QR dapat dibaca dari perangkat lain.', 'Cocokkan nama dan rincian bantuan sebelum menekan konfirmasi.', 'Jika jaringan terputus, jangan menganggap data sudah tersinkron ke server. Pastikan status lokal terlihat dan laporkan kendala kepada Bendahara sebelum melakukan input ulang.'], preview: [['Kamera', 'Butuh izin perangkat dan HTTPS'], ['Alternatif', 'Input kode secara manual'], ['Koneksi', 'Status offline pada prototype'], ['Penting', 'Cloud sync belum aktif']], result: 'Pemeriksaan masih dapat dilakukan melalui kode manual bila token tersedia.', caution: 'Mode offline prototype menyimpan data di browser dan menambahkan antrean lokal. Sinkronisasi cloud belum terhubung. Jangan menggunakan beberapa perangkat untuk mencatat penerima yang sama.' }
        ],
        faqs: [['Saya tidak melihat batch tugas?', 'Batch belum diberikan kepada akun Anda atau akun yang dipilih bukan Relawan yang benar. Hubungi Bendahara.'], ['QR tidak bisa dipindai?', 'Gunakan input kode manual. Pastikan token yang dimasukkan berasal dari QR Mustahik, bukan QR transaksi Muzakki.'], ['Penerima sudah bertanda Sudah diterima?', 'Jangan ulangi penyaluran. Informasikan kepada Bendahara bila penerima mengaku belum menerima bantuan.']]
      },
      Pengurus: {
        intro: 'Anda mengawasi pelaksanaan ZIS melalui akses baca penuh dan memberi persetujuan terhadap program penyaluran. Data transaksi, kas, dan jurnal tidak dapat Anda ubah secara langsung.',
        ready: ['Pastikan tenant dan periode yang ditinjau benar', 'Siapkan kriteria persetujuan program yang sudah disepakati', 'Gunakan laporan dan audit sebagai dasar pemeriksaan, bukan hanya angka ringkasan'],
        flow: ['Pantau dashboard', 'Periksa transaksi dan rekonsiliasi', 'Tinjau rencana alokasi', 'Setujui atau tolak dengan catatan', 'Pantau laporan dan audit'],
        modules: [
          { menu: 'Ringkasan', goal: 'Memantau status penghimpunan, rekonsiliasi, dan distribusi secara umum.', steps: ['Periksa tenant dan periode aktif.', 'Baca kartu penerimaan uang, beras, uang diverifikasi Amil, dan uang yang sudah disalurkan.', 'Gunakan grafik kategori untuk melihat komposisi penerimaan.', 'Catat bagian yang memerlukan pemeriksaan lanjutan lalu buka laporan, rekonsiliasi, atau audit.'], preview: [['Penerimaan', 'Uang dan beras tercatat'], ['Verifikasi', 'Pembayaran yang disahkan Amil'], ['Distribusi', 'Realisasi bantuan'], ['Akses', 'Baca saja kecuali persetujuan program']], result: 'Anda memperoleh gambaran proses tanpa mengubah catatan operasional.' },
          { menu: 'Profil Tenant', goal: 'Memeriksa identitas lembaga dan informasi UPZ tanpa mengubah master tenant.', steps: ['Buka Profil Lembaga & UPZ.', 'Periksa nama tenant, Daerah, jenis UPZ, wilayah BAZNAS tujuan, alamat, dan kontak.', 'Bila ada informasi yang salah, catat koreksinya dan sampaikan kepada Admin.'], preview: [['Nama tenant', 'Identitas lembaga'], ['Daerah', 'Wilayah layanan'], ['Jenis UPZ', 'UPZ Masjid / Perumahan'], ['Wilayah BAZNAS', 'Tujuan pelaporan'], ['Akses', 'Read-only']], result: 'Anda dapat memastikan identitas lembaga yang digunakan pada laporan.' },
          { menu: 'Penerimaan dan Verifikasi', goal: 'Membaca histori transaksi dan statusnya sebagai bahan pengawasan.', steps: ['Buka Penerimaan & Verifikasi.', 'Periksa nomor transaksi, Muzakki, petugas, sumber mandiri atau konter, jumlah uang, jumlah beras, dan status.', 'Gunakan rincian struk atau laporan terkait untuk menelusuri transaksi tertentu.', 'Bila menemukan kejanggalan, catat nomor transaksi dan koordinasikan dengan Amil atau Bendahara. Anda tidak dapat mengesahkan atau mengubah transaksi.'], preview: [['Nomor', 'Kode transaksi'], ['Sumber', 'Mandiri / Konter'], ['Jumlah', 'Rupiah dan kilogram'], ['Status', 'Pending / Terverifikasi / Setoran'], ['Akses', 'Baca saja']], result: 'Anda dapat menelusuri transaksi tanpa mengubahnya.' },
          { menu: 'Serah Terima dan Rekonsiliasi', goal: 'Memeriksa berita acara per shift, kas aktual, dan pencocokan rekening.', steps: ['Buka Serah Terima & Rekonsiliasi.', 'Periksa kode setoran, nama Amil, jumlah transaksi, catatan sistem, nilai aktual fisik, dan status.', 'Buka bagian Mutasi rekening untuk melihat nilai yang dicatat Bendahara, pemeriksa, dan status setoran.', 'Bila terdapat selisih, catat kode setoran dan minta penjelasan atau bukti pendukung dari Bendahara.'], preview: [['Berita acara', 'Kode · Amil · Jumlah transaksi'], ['Kas fisik', 'Uang dan beras aktual'], ['Mutasi rekening', 'Nilai dan pemeriksa'], ['Status', 'Menunggu · Selisih · Terverifikasi'], ['Akses', 'Baca saja']], result: 'Anda dapat memantau tahap serah terima dan mengidentifikasi setoran yang belum selesai.' },
          { menu: 'Alokasi dan Persetujuan Program', goal: 'Meninjau rencana pembagian bantuan dan mengambil keputusan resmi pada prototype.', steps: ['Buka Alokasi & Persetujuan.', 'Cari rencana dengan status Diajukan. Rencana berstatus Draf belum meminta persetujuan Anda.', 'Tekan Tinjau pada baris rencana tersebut.', 'Periksa daftar Mustahik, nilai uang, jumlah beras, total penerima, sumber dana, dan catatan dasar pembagian.', 'Pilih Setujui bila rencana sesuai keputusan dan bukti yang tersedia. Pilih Tolak bila belum layak.', 'Isi catatan keputusan. Jika menolak, alasan wajib ditulis agar Bendahara mengetahui hal yang perlu diperbaiki.', 'Tekan Simpan keputusan dan periksa status rencana pada daftar.'], preview: [['Rencana', 'Nama dan sumber alokasi'], ['Penerima', 'Daftar Mustahik'], ['Nominal', 'Uang dan beras'], ['Keputusan', 'Setujui / Tolak'], ['Tombol', 'Simpan keputusan']], result: 'Status rencana menjadi Disetujui atau Ditolak dan keputusan tersimpan pada catatan audit.', caution: 'Persetujuan ini tidak berarti bantuan sudah dibagikan. Bendahara tetap harus membuat batch dan Relawan mencatat serah terima.' },
          { menu: 'Jurnal dan Laporan Keuangan', goal: 'Memeriksa saldo kas, dana zakat, persediaan beras, dan jurnal yang dibuat otomatis.', steps: ['Buka Jurnal & Laporan Keuangan.', 'Periksa neraca uang dan neraca beras secara terpisah.', 'Baca laporan perubahan dana untuk membandingkan penerimaan dengan penyaluran.', 'Periksa jurnal umum berdasarkan tanggal, referensi, keterangan, akun debit, dan akun kredit.', 'Bila ada nilai tidak wajar, catat referensinya dan minta klarifikasi Bendahara.'], preview: [['Neraca', 'Kas / Bank dan Dana Zakat'], ['Persediaan', 'Beras dalam kg'], ['Perubahan dana', 'Penerimaan dan distribusi'], ['Jurnal', 'Debit · Kredit · Referensi'], ['Akses', 'Baca saja']], result: 'Anda dapat melakukan pengawasan atas pencatatan keuangan tanpa mengubah jurnal.' },
          { menu: 'Laporan & Statistik', goal: 'Menyiapkan bahan laporan periodik dan memeriksa rekap dari seluruh tahapan.', steps: ['Buka Laporan & Statistik.', 'Pilih Periode yang ingin diawasi.', 'Pilih jenis laporan yang ingin ditinjau. Gunakan Semua ZIS untuk ringkasan menyeluruh.', 'Periksa rekap menurut kategori, wilayah Muzakki, transaksi, serah terima, distribusi, dan Mustahik.', 'Unduh CSV atau XLSX untuk analisis. Gunakan Cetak / PDF untuk salinan yang mudah dibaca.', 'Periksa kembali filter periode dan jenis laporan sebelum menyampaikan hasil kepada pihak lain.'], preview: [['Filter periode', 'Pilih periode'], ['Jenis laporan', 'Semua · Penerimaan · Kas · Distribusi · Mustahik'], ['Ringkasan UPZ', 'Rekap tenant dan periode'], ['Ekspor', 'CSV · XLSX · PDF']], result: 'Laporan tersimpan sebagai file untuk pemeriksaan atau pembahasan dengan stakeholder.' },
          { menu: 'Audit dan Arsip', goal: 'Meninjau aktivitas sistem dan membantu menemukan penyebab anomali.', steps: ['Buka Audit dan Arsip.', 'Periksa status hash chain, jumlah aktivitas, hash terakhir, dan antrean sinkronisasi.', 'Gunakan tabel log untuk menelusuri waktu, pengguna, jenis kegiatan, dan detail perubahan.', 'Cocokkan aktivitas penting dengan nomor transaksi, setoran, koreksi, atau alokasi yang terkait.', 'Bila ada log tidak konsisten, minta Admin dan Bendahara melakukan pemeriksaan lanjutan.'], preview: [['Status integritas', 'Konsisten / Perlu audit'], ['Riwayat', 'Waktu · Pengguna · Aktivitas'], ['Hash', 'SHA-256 berantai'], ['Akses', 'Read-only']], result: 'Anda memperoleh jejak aktivitas sebagai bahan pengawasan dan audit internal.', caution: 'Hash chain lokal hanya membantu mendeteksi perubahan pada data demo. Ini belum menjadi audit immutable tingkat server.' }
        ],
        faqs: [['Apakah Pengurus bisa mengubah transaksi atau jurnal?', 'Tidak. Pengurus menggunakan akses baca saja untuk transaksi, kas, jurnal, koreksi, laporan, dan audit.'], ['Apakah rencana yang disetujui langsung tersalurkan?', 'Belum. Setelah disetujui, Bendahara harus membentuk batch dan Relawan mencatat serah terima bantuan.'], ['Apa yang perlu dilakukan bila menemukan selisih?', 'Catat nomor transaksi atau kode setoran dan minta penjelasan dari role yang bertanggung jawab. Jangan mengubah data sumber.']]
      }
    }

    const current = guides[role] || guides.Admin
    const extraModules = {
      Admin: [
        { menu: 'Acuan Workbook 1447H', goal: 'Membaca angka dan formula workbook yang dipakai sebagai bahan evaluasi, bukan sebagai transaksi aktif.', steps: ['Buka menu Acuan Workbook 1447H bila menu tersedia pada tenant yang sedang dipilih.', 'Pilih bagian yang ingin diperiksa, seperti data Mustahik, pembagian tahap 1, pembagian tahap 2, atau insentif.', 'Bandingkan ringkasan, jumlah penerima, nominal uang, dan paket beras dengan dokumen sumber yang sudah disetujui.', 'Perhatikan setiap catatan anomali atau saldo yang belum memiliki metode pembagian individual.', 'Catat pertanyaan atau perbedaan dan bawa ke stakeholder. Jangan mengubah hasil workbook berdasarkan asumsi sendiri.'], preview: [['Sumber', 'Workbook 1447H / 2026M'], ['Bagian', 'Mustahik · Distribusi · Insentif'], ['Nilai', 'Acuan perhitungan'], ['Catatan', 'Anomali perlu keputusan'], ['Fungsi', 'Referensi evaluasi']], result: 'Admin memahami angka referensi yang mendasari pengaturan Mustahik dan rencana distribusi.', caution: 'Menu ini hanya tersedia pada tenant contoh yang mendukung acuan workbook. Data workbook bukan transaksi kas yang benar-benar diterima.' }
      ],
      Amil: [
        { menu: 'Notifikasi', goal: 'Memeriksa pesan sistem dan status notifikasi yang berhubungan dengan layanan.', steps: ['Buka Notifikasi pada sidebar.', 'Periksa penerima, subjek, saluran, tanggal, dan status pesan.', 'Bila ada notifikasi terkait transaksi, cocokkan nomor transaksi sebelum menyampaikan informasi kepada Muzakki.', 'Status Simulasi berarti aplikasi hanya mencatat contoh antrean. Sampaikan informasi langsung kepada Muzakki bila konfirmasi penting diperlukan.'], preview: [['Penerima', 'Muzakki terkait'], ['Subjek', 'Konfirmasi transaksi'], ['Saluran', 'Email / WhatsApp simulasi'], ['Status', 'Simulasi'], ['Catatan', 'Belum ada pengiriman otomatis']], result: 'Anda mengetahui notifikasi apa yang tercatat dan tidak salah menyebut pesan sebagai sudah terkirim.', caution: 'Pengiriman eksternal belum terhubung pada prototype.' }
      ],
      Bendahara: [
        { menu: 'Insentif Amil', goal: 'Meninjau simulasi perhitungan insentif Amil berdasarkan acuan workbook.', steps: ['Buka Insentif Amil.', 'Periksa bagian Metode Q yang menampilkan proporsi jumlah blanko.', 'Periksa bagian Metode R yang menampilkan proporsi hari kehadiran.', 'Bandingkan nilai tiap metode dan total pool yang ditampilkan. Identitas pada prototype dapat disamarkan.', 'Catat perbedaan atau hal yang perlu keputusan. Jangan memperlakukan angka sebagai pembayaran yang sudah disetujui.'], preview: [['Metode Q', 'Proporsi blanko'], ['Metode R', 'Proporsi kehadiran'], ['Pool contoh', 'Ditampilkan terpisah'], ['Status', 'Menunggu keputusan metode']], result: 'Anda dapat melihat perbedaan dua metode tanpa mencampur total keduanya.', caution: 'Belum ada keputusan apakah metode Q dan R merupakan alternatif atau digabung. Nilai ini masih acuan evaluasi, bukan instruksi transfer.' },
        { menu: 'Acuan Workbook 1447H', goal: 'Membaca dasar angka penerima dan pembagian bertahap dari workbook.', steps: ['Buka Acuan Workbook 1447H bila tersedia pada tenant aktif.', 'Pilih lembar atau bagian yang relevan dengan pekerjaan, misalnya daftar Mustahik, tahap 1, tahap 2, atau insentif.', 'Cocokkan jumlah penerima, asnaf, nilai uang, dan jumlah paket beras.', 'Perhatikan saldo agregat tahap 2 yang masih terpisah dari nilai individual.', 'Gunakan tombol rencana tahap workbook pada Alokasi & Persetujuan hanya untuk evaluasi sesuai kewenangan dan setelah data diperiksa.'], preview: [['Acuan', 'Workbook 1447H / 2026M'], ['Distribusi', 'Tahap 1 dan Tahap 2'], ['Satuan', 'Rupiah dan paket / kg beras'], ['Saldo agregat', 'Perlu keputusan pembagian'], ['Fungsi', 'Referensi evaluasi']], result: 'Anda dapat membandingkan angka alokasi yang dibuat dengan referensi workbook.', caution: 'Nilai workbook dipisahkan dari saldo penerimaan transaksi demo. Saldo yang belum memiliki metode pembagian tidak boleh dibagi otomatis.' }
      ],
      Pengurus: [
        { menu: 'Koreksi Terkendali', goal: 'Mengawasi permintaan koreksi tanpa mengambil alih keputusan operasional Bendahara.', steps: ['Buka Koreksi Terkendali.', 'Baca transaksi sumber, pemohon, nilai lama, nilai usulan, alasan, dan keputusan Bendahara.', 'Gunakan informasi tersebut untuk memastikan koreksi mempunyai alasan yang dapat ditelusuri.', 'Bila ada hal yang tidak wajar, minta penjelasan Amil, Operator, atau Bendahara melalui prosedur tenant.', 'Tidak ada tombol untuk mengubah atau menyetujui koreksi pada role Pengurus. Catatan sumber harus tetap terjaga.'], preview: [['Transaksi', 'Nomor sumber'], ['Pemohon', 'Amil / Operator'], ['Nilai', 'Lama → usulan'], ['Status', 'Menunggu / Disetujui / Ditolak'], ['Akses', 'Baca saja']], result: 'Pengurus dapat mengawasi seluruh permintaan koreksi dan keputusan yang dibuat Bendahara.', caution: 'Hak keputusan koreksi berada pada Bendahara dalam prototype. Pengurus tidak mengedit transaksi sumber.' },
        { menu: 'Insentif Amil', goal: 'Meninjau dua alternatif metode insentif dan memastikan kebijakan belum dianggap final.', steps: ['Buka Insentif Amil.', 'Baca perhitungan metode Q berdasarkan proporsi blanko.', 'Baca perhitungan metode R berdasarkan hari kehadiran.', 'Bandingkan total masing-masing pool. Periksa juga angka manual yang ditampilkan terpisah.', 'Putuskan kebijakan hanya melalui rapat dan dokumen persetujuan yang sah. Menu ini merupakan bahan pembahasan, bukan tombol pembayaran.'], preview: [['Metode Q', 'Proporsi blanko'], ['Metode R', 'Proporsi kehadiran'], ['Pool', 'Masing-masing ditampilkan'], ['Keputusan', 'Belum disahkan']], result: 'Pengurus memperoleh dasar untuk membahas kebijakan insentif secara transparan.', caution: 'Prototype tidak menjumlahkan dua pool karena workbook belum menjelaskan apakah keduanya alternatif atau digabung.' },
        { menu: 'Acuan Workbook 1447H', goal: 'Membandingkan keputusan distribusi dan Mustahik terhadap referensi workbook yang digunakan dalam prototype.', steps: ['Buka Acuan Workbook 1447H bila tersedia pada tenant aktif.', 'Periksa bagian data Mustahik, pembagian tahap 1, tahap 2, dan insentif.', 'Cocokkan jumlah penerima dan total nominal yang ditampilkan.', 'Perhatikan catatan formula, saldo agregat, dan anomali yang masih memerlukan keputusan.', 'Gunakan bagian ini sebagai bahan rapat validasi, bukan sebagai bukti pembayaran atau saldo bank.'], preview: [['Referensi', 'Workbook 1447H / 2026M'], ['Bagian', 'Mustahik · Penyaluran · Insentif'], ['Catatan', 'Anomali dan saldo agregat'], ['Tindak lanjut', 'Validasi stakeholder']], result: 'Pengurus dapat memeriksa dasar perhitungan sebelum menyetujui program penyaluran.', caution: 'Angka workbook merupakan referensi perencanaan. Rekonsiliasi uang aktual tetap mengacu pada berita acara dan rekening.' }
      ]
    }
    const sharedModules = [{ menu: 'Evaluasi Prototype', goal: 'Memahami bagian aplikasi yang masih berupa simulasi dan keputusan yang perlu divalidasi sebelum rilis.', steps: ['Buka Evaluasi Prototype dari sidebar.', 'Baca daftar topik satu per satu beserta status dan alasan validasinya.', 'Perhatikan bagian autentikasi, sinkronisasi cloud, notifikasi eksternal, integrasi BAZNAS, formula distribusi, dan ketentuan akad.', 'Catat bagian yang berkaitan dengan tugas Anda dan sampaikan masukan kepada koordinator atau stakeholder.', 'Gunakan halaman ini sebagai daftar evaluasi. Jangan menganggap fitur yang berstatus simulasi atau perlu validasi sudah siap untuk operasional resmi.'], preview: [['Daftar keputusan', 'Topik dan status validasi'], ['Status', 'Perlu keputusan / belum terhubung'], ['Pihak terkait', 'Stakeholder · Keuangan · Syariah · IT'], ['Tujuan', 'Persiapan UAT dan rilis']], result: 'Anda mengetahui batas kemampuan prototype dan hal yang perlu disepakati sebelum penggunaan resmi.', caution: 'Prototype menggunakan penyimpanan lokal. Role, audit hash, dan antrean sinkronisasi belum menggantikan kontrol keamanan dan backend produksi.' }]
    const manualModules = [...current.modules, ...(extraModules[role] || []), ...sharedModules]
    const slug = String(role).toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const makePreview = (module) => {
      if (!module.preview?.length) return ''
      return `<div class="manual-preview-wrap"><div class="manual-preview-heading"><b>Contoh tampilan yang perlu dicari</b><span>Ilustrasi panduan</span></div><div class="manual-preview"><div class="manual-preview-top"><span class="manual-preview-logo">SiZisNur</span><span>${esc(module.menu)}</span><span class="manual-preview-dot">●</span></div><div class="manual-preview-content">${module.preview.map(([label, value]) => `<div class="manual-preview-row"><span>${esc(label)}</span><b>${esc(value)}</b></div>`).join('')}</div></div><p class="manual-preview-note">Contoh di atas hanya ilustrasi untuk membantu mengenali bagian menu. Gunakan data dan nilai yang tampil pada akun Anda.</p></div>`
    }
    const modules = manualModules.map((module, index) => {
      const id = `manual-${slug}-${index + 1}`
      return `<details class="manual-module" id="${id}" ${index === 0 ? 'open' : ''}><summary><span class="manual-module-no">${String(index + 1).padStart(2, '0')}</span><span class="manual-module-title"><b>${esc(module.menu)}</b><small>${esc(module.goal)}</small></span><span class="manual-module-meta">${module.steps.length} langkah <i>⌄</i></span></summary><div class="manual-module-body"><div class="manual-purpose"><b>Tujuan menu ini</b><p>${esc(module.goal)}</p></div><ol class="manual-steps">${module.steps.map((step, stepIndex) => `<li><span class="manual-step-no">${String(stepIndex + 1).padStart(2, '0')}</span><div><b>Langkah ${stepIndex + 1}</b><p>${esc(step)}</p></div></li>`).join('')}</ol>${makePreview(module)}<div class="manual-outcome"><b>Hasil yang seharusnya terlihat</b><p>${esc(module.result || 'Perubahan tersimpan dan dapat diperiksa pada daftar terkait.')}</p></div>${module.caution ? `<div class="alert warn manual-caution"><b>Perhatian</b><br>${esc(module.caution)}</div>` : ''}${module.trouble?.length ? `<div class="manual-trouble"><b>Bila mengalami kendala</b>${module.trouble.map(([q, a]) => `<div><strong>${esc(q)}</strong><p>${esc(a)}</p></div>`).join('')}</div>` : ''}</div></details>`
    }).join('')
    const jumps = manualModules.map((module, index) => `<button type="button" class="manual-jump" data-guide-target="manual-${slug}-${index + 1}">${esc(module.menu)}</button>`).join('')
    const faqs = current.faqs.map(([q, a]) => `<details class="manual-faq"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')
    const workflow = current.flow.map((step, index) => `<div class="guide-step"><span>${String(index + 1).padStart(2, '0')}</span><b>${esc(step)}</b></div>`).join('<div class="guide-arrow">↓</div>')
    return `${A.boxhead(`Panduan Penggunaan · ${esc(role)}`, current.intro)}<section class="manual-welcome"><div><span class="manual-eyebrow">PANDUAN KHUSUS ROLE</span><h2>Ikuti petunjuk satu per satu</h2><p>Panduan ini menjelaskan letak menu, tombol yang perlu ditekan, data yang perlu diisi, hasil yang akan muncul, dan tindakan bila terjadi kendala. Nama menu ditulis sama seperti yang terlihat pada sidebar.</p></div><span class="manual-role-mark">${esc(role)}</span></section><section class="card manual-flow-card"><div class="card-top"><div><h3>Alur kerja ${esc(role)}</h3><p class="caption">Gambaran besar pekerjaan Anda dalam satu periode.</p></div><span class="tag info">${current.flow.length} tahap</span></div><div class="guide-flow">${workflow}</div></section><section class="card manual-ready-card"><h3>Sebelum mulai menggunakan aplikasi</h3><div class="manual-ready-grid">${current.ready.map((item, i) => `<div><span>${String(i + 1).padStart(2, '0')}</span><p>${esc(item)}</p></div>`).join('')}</div></section><section class="manual-menu-section"><div class="manual-section-head"><div><span class="manual-eyebrow">PETUNJUK OPERASIONAL</span><h3>Panduan penggunaan setiap menu</h3><p>Pilih menu yang ingin dipelajari. Buka judul menu untuk melihat urutan langkah, contoh tampilan, hasil yang diharapkan, dan catatan penting.</p></div><span class="manual-count">${manualModules.length} menu</span></div><div class="manual-jump-list">${jumps}</div><div class="manual-modules">${modules}</div></section><section class="card manual-faq-card"><div class="manual-section-head"><div><span class="manual-eyebrow">BANTUAN CEPAT</span><h3>Pertanyaan yang sering muncul</h3><p>Jawaban singkat untuk kendala yang paling mungkin ditemui saat menggunakan role ${esc(role)}.</p></div></div>${faqs}</section><section class="card"><h3>Bantuan, dukungan dan umpan balik</h3><p class="caption">Bila petunjuk di atas belum menyelesaikan masalah, kirim pertanyaan, kendala penggunaan, atau laporan bug. Pada prototype, tiket disimpan di database browser lokal dan belum diteruskan ke server pemantauan.</p><form data-v5-form="support"><div class="grid-form">${A.sel('Jenis laporan', 'kind', [['help', 'Butuh bantuan'], ['bug', 'Laporkan bug'], ['feedback', 'Saran perbaikan'], ['security', 'Dugaan masalah keamanan']], 'help')}${A.fld('Judul singkat', 'subject', '', 'text', 'required')}${A.sel('Prioritas', 'priority', [['normal', 'Normal'], ['high', 'Tinggi'], ['urgent', 'Mendesak']], 'normal')}</div>${A.textarea('Uraian lengkap', 'description', '')}${A.fld('Kontak balasan (opsional)', 'contact', '', 'text')}${formButton('Kirim dukungan')}</form></section><div class="alert light">Untuk keamanan, jangan masukkan kata sandi, NIK lengkap, data rekening pribadi, atau informasi sensitif ke dalam tiket bantuan. Saat rilis, pengiriman tiket ke platform monitoring memerlukan API dan kebijakan akses tersendiri.</div>`
  }

  function prototypePage() {
    const items = [
      ['Konfirmasi satu transaksi per periode untuk Muzakki', 'Perlu keputusan stakeholder', 'Tentukan apakah satu transaksi aktif dapat memuat beberapa jenis zakat atau perlu transaksi terpisah per jenis.'],
      ['Klaim riwayat Walk-in oleh akun baru', 'Menunggu verifikasi kontak', 'Riwayat lama tidak ditautkan otomatis. Perlu OTP atau proses verifikasi kontak dan persetujuan sebelum histori lintas tenant diklaim.'],
      ['Masa berlaku QR Pending', 'Usulan 24 jam', 'Konfirmasi apakah batas akhir mengikuti 24 jam atau penutupan periode lebih dahulu.'],
      ['Koreksi setelah setoran dan pelaporan rekening', 'Perlu SOP', 'Tetapkan batas waktu koreksi, pejabat penyetuju kedua, dan perlakuan akuntansi.'],
      ['Metode distribusi batch dan prioritas hari raya', 'Perlu keputusan', 'Tetapkan urutan mustahik, batas paket per batch, dan bukti serah terima.'],
      ['Formula skor kelayakan mustahik', 'Perlu validasi', 'Ikuti temuan workbook 1447H. Anomali formula dan cache tidak diperbaiki otomatis.'],
      ['Saldo agregat Tahap 2 dan paket beras', 'Perlu validasi', 'Saldo Rp37.500 dan 13,04 paket belum mempunyai metode pembagian individual.'],
      ['Integrasi BAZNAS / UPZ', 'Rencana tahap rilis', 'Perlu pemetaan bagan akun, format laporan bulanan dan API resmi yang disepakati.'],
      ['Pengiriman Email dan WhatsApp', 'Belum terhubung', 'Perlu penyedia layanan, persetujuan penerima, template resmi dan mekanisme berhenti berlangganan.'],
      ['Sinkronisasi cloud offline-first', 'Backend belum tersedia', 'Prototype menyimpan data lokal. Endpoint sinkronisasi dan resolusi konflik belum dikonfigurasi.'],
      ['Lafaz akad dan doa', 'Validasi pembimbing agama', 'Teks contoh harus ditinjau pihak berwenang sebelum dipakai pada layanan resmi.'],
    ]
    return `${A.boxhead('Ruang Evaluasi Prototype', 'Halaman ini menginventarisasi keputusan yang perlu disahkan stakeholder sebelum implementasi produksi. Setiap status masih dapat berubah setelah UAT.')}<div class="cards">${A.stat('Keputusan tercatat', items.length, 'Daftar validasi')}${A.stat('Sudah siap produksi', 0, 'Belum ada keputusan resmi yang disahkan')}${A.stat('Perlu validasi', items.length, 'Stakeholder, syariah, keuangan dan keamanan')}</div><div class="decision-grid">${items.map(([title, status, detail], i) => `<article class="decision-card"><span class="decision-no">${String(i + 1).padStart(2, '0')}</span><div><h3>${esc(title)}</h3><span class="tag warn">${esc(status)}</span><p>${esc(detail)}</p></div></article>`).join('')}</div><section class="card"><h3>Standar yang direncanakan untuk tahap rilis</h3><div class="standards-grid"><article><b>Keamanan aplikasi</b><p>Threat modeling, secure SDLC, OWASP ASVS, kontrol akses server-side, MFA untuk role kritis, enkripsi TLS dan enkripsi data saat tersimpan.</p></article><article><b>Privasi dan data</b><p>Minimisasi data, dasar pemrosesan yang sah, persetujuan yang dapat dibuktikan, retensi dan pemusnahan, hak subjek data, serta penilaian dampak pelindungan data.</p></article><article><b>Audit dan keuangan</b><p>Audit append-only dengan hash kriptografis, pemisahan tugas, dual control untuk koreksi, rekonsiliasi multi-tahap, backup dan uji pemulihan.</p></article><article><b>Operasional UPZ</b><p>Validasi kerja sama BAZNAS, tata kelola dana per jenis ZIS, format laporan berkala dan persetujuan kebijakan penyaluran.</p></article></div><div class="alert warn">Status prototype saat ini belum memenuhi kontrol produksi tersebut. localStorage, role UI dan checksum audit demo bukan pengamanan server, bukan enkripsi dan bukan audit immutable.</div></section>`
  }
  function amilGuidePage() {
    return `${A.boxhead('Ketentuan, Dalil dan Doa untuk Amil', 'Referensi pengingat proses layanan. Materi ini perlu diperiksa oleh pembimbing agama tenant dan bukan pengganti fatwa.')}<section class="card"><h3>Urutan layanan Amil</h3><div class="guide-flow"><div class="guide-step"><span>01</span><b>Buka shift dan siapkan konter</b></div><div class="guide-arrow">↓</div><div class="guide-step"><span>02</span><b>Scan QR serta cocokkan identitas dan rincian</b></div><div class="guide-arrow">↓</div><div class="guide-step"><span>03</span><b>Pandu niat dan akad bersama Muzakki</b></div><div class="guide-arrow">↓</div><div class="guide-step"><span>04</span><b>Terima uang atau beras dan sahkan pembayaran</b></div><div class="guide-arrow">↓</div><div class="guide-step"><span>05</span><b>Terbitkan BSZ dan serahkan kas kepada Bendahara</b></div></div></section><div class="two-col"><section class="card"><h3>Dalil pengingat</h3><p><b>QS. At-Taubah ayat 103</b></p><p>Perintah mengambil zakat dari sebagian harta untuk membersihkan dan menyucikan. Rujukan ini menjadi pengingat amanah penghimpunan dan penyaluran.</p><p><b>QS. Al-Baqarah ayat 43</b></p><p>Perintah menunaikan zakat. Konteks penerapan dan ketentuan fikih perlu dirujuk pada pembimbing agama.</p></section><section class="card"><h3>Doa dan niat</h3><p class="arabic">اللَّهُمَّ صَلِّ عَلَيْهِمْ</p><p>Doa yang dikenal dalam konteks mendoakan orang yang menunaikan zakat. Penggunaan dan lafaz lengkap perlu dikonfirmasi pembimbing agama.</p><p class="arabic">نَوَيْتُ أَنْ أُخْرِجَ زَكَاةَ الْفِطْرِ لِلّٰهِ تَعَالَى</p><p>Niat ilustratif untuk zakat fitrah. Niat berada pada Muzakki dan lafaz bukan syarat bahwa transaksi digital dengan sendirinya mengesahkan ibadah.</p></section></div><div class="alert warn">Jangan menyatakan akad sah hanya karena tombol verifikasi ditekan. Amil harus memastikan penerimaan fisik, kesepakatan, dan prosedur tenant.</div>`
  }

  function tenantPageV5() {
    const t = A.tenant()
    if (activeUser()?.role === 'Pengurus') return `${A.boxhead('Profil Tenant dan Identitas UPZ', 'Tampilan baca saja untuk Pengurus. Perubahan master tenant hanya menjadi kewenangan Admin.')}<section class="card"><div class="mini-list"><div class="mini-item"><span>Nama tenant</span><b>${esc(t.name)}</b></div><div class="mini-item"><span>Daerah</span><b>${esc(t.daerah || 'Belum ditetapkan')}</b></div><div class="mini-item"><span>Jenis UPZ</span><b>${esc(t.upzType || 'Belum ditetapkan')}</b></div><div class="mini-item"><span>Wilayah BAZNAS</span><b>${esc(t.baznasArea || 'Belum ditetapkan')}</b></div><div class="mini-item"><span>Alamat</span><b>${esc(t.address || '—')}</b></div></div></section>`
    return `${A.boxhead('Profil Tenant dan Identitas UPZ', 'Admin mengelola profil lembaga. Data daerah dipakai untuk rekap jumlah Muzakki per wilayah dan RT.')}<div class="two-col"><section class="card"><h3>Identitas tenant</h3><form data-v5-form="tenant-profile"><div class="grid-form">${A.fld('Nama tenant', 'name', t.name, 'text', 'required')}${A.fld('Daerah', 'daerah', t.daerah || '', 'text', 'required')}${A.fld('Telepon', 'phone', t.phone || '', 'tel')}${A.fld('Email', 'email', t.email || '', 'email')}${A.fld('Jenis UPZ', 'upzType', t.upzType || 'UPZ Masjid / Perumahan', 'text')}${A.fld('Wilayah BAZNAS tujuan', 'baznasArea', t.baznasArea || '', 'text')}${A.textarea('Alamat', 'address', t.address || '')}</div>${formButton('Simpan profil tenant')}</form></section><section class="card"><h3>Keanggotaan dan data wilayah</h3><div class="mini-list"><div class="mini-item"><span>ID tenant</span><b class="mono">${esc(t.id)}</b></div><div class="mini-item"><span>Jumlah Muzakki terdaftar</span><b>${A.scoped('muzakki').length + db.muzakkiMemberships.filter((x) => x.tenantId === t.id).length}</b></div><div class="mini-item"><span>Daerah</span><b>${esc(t.daerah || 'Belum ditetapkan')}</b></div><div class="mini-item"><span>Status</span><span class="tag info">Prototype</span></div></div><div class="alert light">Isolasi tenant pada prototype hanya filter JavaScript. Saat rilis, batas akses tenant wajib diterapkan pada API dan basis data.</div></section></div>`
  }
  function muzakkiPageV5() {
    const list = A.scoped('muzakki').map((m) => ({ ...m, p: A.person(m.personId) })).filter((x) => x.p)
    const vpa = list.filter((x) => x.p.regionType === 'VPA' || /VPA/i.test(x.p.address || ''))
    const counts = new Map()
    list.forEach((x) => { const key = x.p.rt || 'Belum diisi'; counts.set(key, (counts.get(key) || 0) + 1) })
    return `${A.boxhead('Data Muzakki Walk-in', 'Operator mendaftarkan warga yang datang langsung. Amil dapat membantu input bila konter tidak memiliki Operator terpisah.', action('Tambah Muzakki', 'operator-person-new', 'primary'))}<div class="cards">${A.stat('Muzakki tenant', list.length, 'Data tenant aktif')}${A.stat('Wilayah VPA', vpa.length, 'Daerah khusus VPA')}${A.stat('Non VPA', list.length - vpa.length, 'Wilayah lainnya')}${A.stat('RT terdata', counts.size, 'Untuk rekap wilayah')}</div><section class="card"><h3>Rekap Muzakki menurut RT</h3>${A.table(['RT / wilayah', 'Jumlah'], [...counts.entries()].map(([rt, count]) => [esc(rt), count]))}</section><section class="card"><div class="card-top"><h3>Daftar Muzakki</h3><input class="search" id="search-muzakki" placeholder="Cari nama, HP atau kartu"></div><div id="muzakki-table">${A.table(['Nama / kontak', 'Daerah dan RT', 'Alamat', 'Kode', 'Riwayat'], list.map((x) => [`<b>${esc(x.p.name)}</b><div class="tiny">${esc(x.p.phone || x.p.email || '')}</div>`, `${esc(x.p.regionType || '—')} · ${esc(x.p.rt || '—')}`, esc(x.p.address || ''), `<span class="mono">${esc(x.cardCode)}</span>`, `<button type="button" class="btn sm" data-v5-action="muzakki-history" data-id="${esc(x.p.id)}">Riwayat</button>`]))}</div></section>`
  }
  function muzakkiRegisterModal() {
    A.modal('Daftar akun Muzakki', `<form data-v5-form="muzakki-register"><div class="grid-form">${A.fld('Nama lengkap', 'name', '', 'text', 'required')}${A.fld('Nomor HP', 'phone', '', 'tel')}${A.fld('Email', 'email', '', 'email')}${A.sel('Tenant pertama', 'tenantId', db.tenants.filter((x) => x.status === 'aktif').map((x) => [x.id, x.name]))}${A.sel('Daerah', 'regionType', [['VPA', 'Villa Pesona Asri & Marbella 2 / VPA'], ['Non VPA', 'Non VPA']], 'VPA')}${A.sel('RT', 'rt', Array.from({ length: 12 }, (_, i) => [`RT ${String(i + 1).padStart(2, '0')}`, `RT ${String(i + 1).padStart(2, '0')}`]), 'RT 01')}${A.textarea('Alamat lengkap', 'address', '')}</div><div class="alert light">Akun prototype dibuat tanpa kata sandi dan hanya tersimpan pada browser ini. Mekanisme OTP atau autentikasi kuat belum tersedia.</div><label class="check"><input type="checkbox" name="consent" value="yes" required> Saya menyetujui penggunaan data untuk layanan tenant yang dipilih</label>${formButton('Buat akun Muzakki')}</form>`)
  }
  function submitMuzakkiRegistration(d) {
    const phone = d.phone.trim(), email = d.email.trim().toLowerCase()
    if (!d.name.trim() || !d.address.trim() || (!phone && !email)) throw new Error('Nama, alamat, dan minimal satu kontak wajib diisi')
    if (d.consent !== 'yes') throw new Error('Persetujuan penggunaan data wajib dicentang')
    const duplicate = db.accounts.find((x) => (phone && x.phone === phone) || (email && String(x.email || '').toLowerCase() === email))
    if (duplicate) throw new Error('Kontak sudah terhubung dengan akun. Silakan masuk atau hubungi tenant untuk bantuan.')
    const tenant = db.tenants.find((x) => x.id === d.tenantId)
    if (!tenant) throw new Error('Tenant tidak ditemukan')
    const matched = db.persons.find((x) => x.tenantId === tenant.id && ((phone && x.phone === phone) || (email && String(x.email || '').toLowerCase() === email)))
    const person = matched || { id: newId('PS'), tenantId: tenant.id }
    if (!matched) db.persons.push(person)
    Object.assign(person, { name: d.name.trim(), phone, email, address: d.address.trim(), regionType: d.regionType, regionName: d.regionType === 'VPA' ? (tenant.daerah || 'Villa Pesona Asri & Marbella 2 / VPA') : 'Non VPA', rt: d.regionType === 'VPA' ? d.rt : '' })
    if (!db.muzakki.some((x) => x.tenantId === tenant.id && x.personId === person.id)) db.muzakki.push({ id: newId('MZ'), tenantId: tenant.id, personId: person.id, cardCode: `KZM-${tenant.id.split('-').pop()}-${String(db.muzakki.filter((x) => x.tenantId === tenant.id).length + 1).padStart(4, '0')}`, active: true })
    const userId = newId('US'), accountId = newId('ACC')
    db.users.push({ id: userId, tenantId: tenant.id, name: d.name.trim(), role: 'Muzakki', email: email || '', active: true, personId: person.id, accountId })
    db.accounts.push({ id: accountId, userId, displayName: d.name.trim(), phone, email, consentAt: timestamp() })
    db.muzakkiMemberships.push({ id: newId('MBR'), userId, tenantId: tenant.id, personId: person.id, regionType: d.regionType, regionName: person.regionName, rt: person.rt, joinedAt: timestamp() })
    // Do not auto-claim historical walk-in transactions until phone/email verification exists.
    // The matching-and-claim workflow remains a stakeholder decision for the production backend.
    A.aud('MUZAKKI_REGISTER', `Akun Muzakki ${userId} dibuat dan ditautkan ke tenant ${tenant.id}`)
    enqueueSync('muzakki.registered', { tenantId: tenant.id, userId, accountId, membershipId: db.muzakkiMemberships[db.muzakkiMemberships.length - 1].id, personId: person.id })
    A.persist()
    A.login(userId, false)
    A.toast('Akun Muzakki berhasil dibuat. Lengkapi data keluarga sebelum membuat transaksi.', 'success')
  }
  function setOperatorAmount(form, resetForType = false) {
    if (!form || form.dataset.v5Form !== 'operator-transaction') return
    const amount = form.elements.value
    const type = form.elements.type?.value || 'uang'
    const category = form.elements.category?.value || 'Zakat Fitrah'
    const jiwa = Math.max(1, Math.floor(Number(form.elements.jiwa?.value || 1)))
    if (!amount) return
    amount.dataset.format = type === 'uang' ? 'idr' : 'kg'
    if (category === 'Zakat Fitrah') {
      const rule = A.rule()
      const rate = type === 'uang' ? Number(rule?.moneyRate || 45000) : Number(rule?.riceRate || 2.5)
      amount.value = String(jiwa * rate)
    } else if (resetForType) {
      amount.value = type === 'uang' ? '45000' : '2.5'
    }
    formatInputValue(amount)
  }

  function setSelfTransactionAmount(form, resetForType = false) {
    if (!form || form.dataset.v5Form !== 'self-transaction') return
    const amount = form.elements.value
    const type = form.elements.type?.value || 'uang'
    const category = form.elements.category?.value || 'Zakat Fitrah'
    const count = Math.max(1, Math.floor(Number(form.elements.jiwa?.value || 1)))
    if (!amount) return
    amount.dataset.format = type === 'uang' ? 'idr' : 'kg'
    const rule = A.rule()
    if (category === 'Zakat Fitrah') {
      const rate = type === 'uang' ? Number(rule?.moneyRate || 45000) : Number(rule?.riceRate || 2.5)
      amount.value = String(count * rate)
    } else if (category === 'Fidyah') {
      if (form.elements.type) form.elements.type.value = 'uang'
      amount.dataset.format = 'idr'
      amount.value = String(count * Number(rule?.fidyahRate || 30000))
    } else if (resetForType) {
      amount.value = ''
    }
    formatInputValue(amount)
  }

  function openOperatorTransactionModal() {
    const period = currentPeriod()
    if (!period) throw new Error('Tenant belum membuka periode zakat')
    const people = A.scoped('persons').map((x) => [x.id, `${x.name} · ${x.phone || x.email || 'tanpa kontak'}`])
    A.modal('Input transaksi konter', `<form data-v5-form="operator-transaction"><div class="grid-form">${A.sel('Muzakki terdaftar (opsional)', 'personId', [['', 'Input data baru'], ...people], '')}${A.fld('Nama lengkap', 'name', '', 'text', 'required')}${A.fld('Nomor HP', 'phone', '', 'tel')}${A.fld('Email', 'email', '', 'email')}${A.sel('Daerah', 'regionType', [['VPA', 'Villa Pesona Asri & Marbella 2 / VPA'], ['Non VPA', 'Non VPA']], 'VPA')}${A.sel('RT', 'rt', Array.from({ length: 12 }, (_, i) => [`RT ${String(i + 1).padStart(2, '0')}`, `RT ${String(i + 1).padStart(2, '0')}`]), 'RT 01')}${A.textarea('Alamat lengkap', 'address', '')}${A.sel('Jenis zakat', 'category', [['Zakat Fitrah', 'Zakat fitrah'], ['Zakat Maal', 'Zakat maal'], ['Zakat Profesi', 'Zakat profesi'], ['Fidyah', 'Fidyah'], ['Kafarat', 'Kafarat'], ['Infak/Sedekah', 'Infak / sedekah']], 'Zakat Fitrah')}${A.sel('Media pembayaran', 'type', [['uang', 'Uang (Rp)'], ['beras', 'Beras (kg)']], 'uang')}${A.fld('Jumlah jiwa / unit', 'jiwa', 1, 'number', 'min="1" required')}${A.fld('Nominal uang (Rp) / berat (kg)', 'value', '45.000', 'text', 'inputmode="decimal" data-format="idr" required')}</div><div class="alert light">Transaksi konter disimpan sebagai Pending. Operator tidak menerima uang dan tidak mengesahkan pembayaran. Muzakki diarahkan ke meja Amil untuk scan QR.</div>${A.textarea('Catatan (opsional)', 'note', '')}${formButton('Simpan dan terbitkan QR')}</form>`, true)
  }
  function submitOperatorTransaction(d) {
    if (!['Operator', 'Amil'].includes(activeUser()?.role)) throw new Error('Hanya Operator atau Amil yang dapat membuat transaksi konter')
    const period = currentPeriod()
    if (!period || ['ditutup', 'closed', 'selesai'].includes(String(period.status || '').toLowerCase())) throw new Error('Periode tidak menerima transaksi baru')
    const jiwa = Math.max(1, Math.floor(Number(d.jiwa || 1)))
    const value = d.type === 'uang' ? toNumber(d.value) : toKg(d.value)
    if (!Number.isInteger(jiwa) || jiwa < 1 || value <= 0) throw new Error('Jumlah jiwa dan nominal harus lebih besar dari nol')
    let person = d.personId ? db.persons.find((x) => x.id === d.personId && x.tenantId === currentTenantId()) : null
    if (d.personId && !person) throw new Error('Muzakki tidak ditemukan pada tenant aktif')
    if (!person) {
      if (!d.name.trim() || !d.address.trim()) throw new Error('Nama dan alamat lengkap wajib diisi')
      if (!d.phone.trim() && !d.email.trim()) throw new Error('Nomor HP atau email diperlukan untuk identifikasi')
      person = { id: newId('PS'), tenantId: currentTenantId() }
      db.persons.push(person)
      db.muzakki.push({ id: newId('MZ'), tenantId: currentTenantId(), personId: person.id, cardCode: `KZM-${currentTenantId().split('-').pop()}-${String(A.scoped('muzakki').length + 1).padStart(4, '0')}`, active: true })
    }
    Object.assign(person, { name: d.name.trim() || person.name, phone: d.phone.trim() || person.phone || '', email: d.email.trim() || person.email || '', address: d.address.trim() || person.address || '', regionType: d.regionType || person.regionType || 'Non VPA', rt: d.regionType === 'VPA' ? d.rt : '' })
    if (oneTxPerTenantPeriod(null, currentTenantId(), period.id, person.id)) throw new Error('Muzakki ini sudah memiliki transaksi aktif pada tenant dan periode ini')
    const owner = activeUser(), seq = db.transactions.filter((x) => x.tenantId === currentTenantId()).length + 1
    const serial = `${owner.role === 'Amil' ? 'AM' : 'OP'}-${String(seq).padStart(6, '0')}`
    const tx = { id: newId('TR'), tenantId: currentTenantId(), periodId: period.id, serial, personId: person.id, recordedBy: owner.id, handledBy: null, operatorId: owner.id, assignedAmilId: null, jiwa, lines: [{ category: d.category, type: d.type, value }], source: 'counter', createdAt: timestamp(), expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), status: 'pending', note: d.note || '' }
    db.transactions.push(tx)
    db.notifications.push({ id: newId('NT'), tenantId: currentTenantId(), personId: person.id, channel: 'app', status: 'lokal', date: dateToday(), subject: `Konfirmasi rencana zakat ${serial}`, message: `${person.name}, terima kasih telah mendaftar di ${A.tenant().name}. Tunjukkan QR ini kepada Amil.` })
    A.aud('TRANSAKSI_PENDING', `${owner.role} membuat transaksi konter ${serial} sebagai Pending`)
    enqueueSync('transaction.pending', { transactionId: tx.id, tenantId: tx.tenantId })
    state.modal = null
    A.persist()
    A.render()
    showReceiptV5(tx)
  }
  function operatorPersonModal() {
    A.modal('Registrasi Muzakki konter', `<form data-v5-form="operator-person"><div class="grid-form">${A.fld('Nama lengkap', 'name', '', 'text', 'required')}${A.fld('Nomor HP', 'phone', '', 'tel')}${A.fld('Email', 'email', '', 'email')}${A.sel('Daerah', 'regionType', [['VPA', 'Villa Pesona Asri & Marbella 2 / VPA'], ['Non VPA', 'Non VPA']], 'VPA')}${A.sel('RT', 'rt', Array.from({ length: 12 }, (_, i) => [`RT ${String(i + 1).padStart(2, '0')}`, `RT ${String(i + 1).padStart(2, '0')}`]), 'RT 01')}${A.textarea('Alamat lengkap', 'address', '')}</div><div class="alert light">Jika tidak ada Operator, Amil boleh memakai formulir ini dan melanjutkan ke verifikasi QR.</div>${formButton('Simpan data Muzakki')}</form>`)
  }

  function reportContext() {
    const periodId = state.filters.reportPeriod || currentPeriod()?.id
    const period = A.scoped('periods').find((x) => x.id === periodId) || currentPeriod()
    const allTransactions = A.scoped('transactions').filter((x) => x.periodId === period?.id)
    const txs = allTransactions.filter((x) => !['batal', 'expired', 'kedaluwarsa'].includes(x.status))
    const verifiedTx = txs.filter((x) => ['paid', 'disetor', 'kas_diterima', 'terverifikasi'].includes(x.status))
    const deposits = A.scoped('deposits').filter((x) => x.periodId === period?.id)
    const distributions = A.scoped('distributions').filter((x) => x.periodId === period?.id)
    const mustahiks = A.scoped('mustahiks').filter((x) => x.status === 'terverifikasi')
    return {
      period, txs, allTransactions, verifiedTx, deposits, distributions, mustahiks,
      received: sum(txs, (x) => effectiveTotals(x).money), rice: sum(txs, (x) => effectiveTotals(x).rice),
      verified: sum(verifiedTx, (x) => effectiveTotals(x).money), verifiedRice: sum(verifiedTx, (x) => effectiveTotals(x).rice),
      sent: sum(distributions, 'money'), sentRice: sum(distributions, 'rice'),
    }
  }
  function reportsPageV5() {
    const m = reportContext()
    const categories = ['Zakat Fitrah', 'Zakat Maal', 'Zakat Profesi', 'Fidyah', 'Kafarat', 'Infak/Sedekah']
    const rows = categories.map((c) => [c, sum(m.txs, (x) => sum(x.lines.filter((l) => l.category === c && l.type === 'uang'), 'value')), sum(m.txs, (x) => sum(x.lines.filter((l) => l.category === c && l.type === 'beras'), 'value'))])
    const muzakki = A.scoped('muzakki').map((x) => ({ x, p: A.person(x.personId) })).filter((x) => x.p)
    const rtMap = new Map()
    muzakki.forEach(({ p }) => { const key = p.rt || 'Belum diisi'; rtMap.set(key, (rtMap.get(key) || 0) + 1) })
    const baznas = [ ['Tenant / UPZ', A.tenant().name], ['Periode pelaporan', m.period?.name || '—'], ['Jumlah transaksi', m.txs.length], ['Jumlah Muzakki', new Set(m.txs.map((x) => x.personId)).size], ['Penerimaan uang', money(m.received)], ['Penerimaan beras', kilos(m.rice)], ['Pembayaran terverifikasi Amil', money(m.verified)], ['Realisasi distribusi', money(m.sent)], ['Mustahik menerima', new Set(m.distributions.map((x) => x.mustahikId)).size], ['Rekonsiliasi selesai', m.deposits.filter((x) => x.status === 'terverifikasi').length] ]
    const type = state.filters.reportType || 'all'
    const receiptTable = `<section class="card"><h3>Rincian penghimpunan</h3>${A.table(['Nomor', 'Tanggal', 'Muzakki', 'Sumber', 'Status', 'Uang', 'Beras'], m.txs.map((tx) => [esc(tx.serial), esc(new Date(tx.createdAt).toLocaleDateString('id-ID')), esc(A.person(tx.personId)?.name || 'Muzakki'), esc(tx.source === 'self-service' ? 'Mandiri' : 'Konter'), statusPill(tx.status), money(effectiveTotals(tx).money), kilos(effectiveTotals(tx).rice)]))}</section>`
    const cashTable = `<section class="card"><h3>Rincian serah terima dan rekening</h3>${A.table(['Kode setoran', 'Amil', 'Jumlah transaksi', 'Kas aktual', 'Rekening', 'Status'], m.deposits.map((x) => [esc(x.id), esc(A.who(x.amilId)), x.transactionIds.length, `${money(x.actualMoney ?? x.declaredMoney)} · ${kilos(x.actualRice ?? x.declaredRice)}`, `${money(x.bankMoney || 0)} · ${kilos(x.bankRice || 0)}`, statusPill(x.status)]))}</section>`
    const distributionTable = `<section class="card"><h3>Rincian distribusi</h3>${A.table(['Tanggal', 'Batch', 'Mustahik ID', 'Uang', 'Beras', 'Pelaksana'], m.distributions.map((x) => [esc(new Date(x.deliveredAt).toLocaleDateString('id-ID')), esc(db.batches.find((b) => b.id === x.batchId)?.name || '—'), esc(x.mustahikId), money(x.money), kilos(x.rice), esc(A.who(x.deliveredBy))]))}</section>`
    const mustahikTable = `<section class="card"><h3>Daftar mustahik terverifikasi</h3>${A.table(['Nomor', 'Nama', 'Daerah / RT', 'Asnaf', 'Status'], m.mustahiks.map((x) => { const p = A.person(x.personId); return [esc(x.registrationNo || x.id), esc(p?.name || '—'), `${esc(x.region || '—')} · ${esc(x.rt || p?.rt || '—')}`, esc(x.finalStatus || x.asnaf || '—'), statusPill(x.status)] }))}</section>`
    const detail = type === 'receipt' ? receiptTable : type === 'cash' ? cashTable : type === 'distribution' ? distributionTable : type === 'mustahik' ? mustahikTable : `<div class="two-col"><section class="card"><h3>Rekap per jenis ZIS</h3>${A.table(['Jenis', 'Uang', 'Beras'], rows.map(([x, u, r]) => [esc(x), money(u), kilos(r)]))}</section><section class="card"><h3>Rekap wilayah Muzakki</h3>${A.table(['RT', 'Jumlah Muzakki'], [...rtMap.entries()].map(([rt, count]) => [esc(rt), count]))}</section></div>${receiptTable}${cashTable}${distributionTable}${mustahikTable}`
    return `${A.boxhead('Pelaporan Periode dan UPZ', 'Rekap penghimpunan, rekonsiliasi, batch distribusi, penyaluran dan jejak audit untuk pemeriksaan dan laporan berkala.', `<div class="actions">${action('Unduh CSV', 'export-report-csv', 'sm')}${action('Unduh XLSX', 'export-report-xlsx', 'sm primary')}${action('Cetak / PDF', 'export-report-pdf', 'sm')}</div>`)}<div class="cards">${A.stat('Penerimaan uang', money(m.received), 'Nilai transaksi non-batal')}${A.stat('Penerimaan beras', kilos(m.rice), 'Dicatat sebagai kilogram')}${A.stat('Terverifikasi Amil', money(m.verified), 'Tahap penghimpunan')}${A.stat('Sudah disalurkan', money(m.sent), 'Realisasi batch Relawan')}</div><section class="card"><h3>Filter laporan</h3><div class="grid-form">${A.sel('Periode', 'report-period', A.scoped('periods').map((p) => [p.id, p.name]), m.period?.id || '')}${A.sel('Jenis laporan', 'report-type', [['all', 'Semua ZIS'], ['receipt', 'Penerimaan'], ['cash', 'Rekonsiliasi kas'], ['distribution', 'Distribusi'], ['mustahik', 'Mustahik dan wilayah']], type)}</div><p class="caption">Filter periode dan jenis laporan diterapkan pada tampilan serta berkas ekspor.</p></section><section class="card"><h3>Ringkasan BAZNAS / UPZ</h3><p class="caption">Format ringkas ini menjadi bahan penyelarasan dengan BAZNAS. Pengiriman pusat belum aktif karena endpoint dan format integrasi resmi belum disediakan.</p>${A.table(['Indikator', 'Nilai'], baznas.map(([k, v]) => [esc(k), esc(v)]))}<div class="form-actions">${action('Unduh paket laporan UPZ XLSX', 'export-baznas-xlsx', 'sm primary')}${action('Unduh paket laporan UPZ CSV', 'export-baznas-csv', 'sm')}</div></section>${detail}`
  }

  function auditPageV5() {
    const integrity = verifyAuditChain()
    const records = A.scoped('audit')
    return `${A.boxhead('Audit dan Arsip', 'Log aktivitas ditautkan dengan checksum berantai untuk memperlihatkan perubahan yang tidak konsisten pada prototype.')}<div class="cards">${A.stat('Status pemeriksaan', integrity.valid ? 'Konsisten' : 'Perlu audit', integrity.valid ? 'Hash chain demo cocok' : `${integrity.errors.length} entri bermasalah`)}${A.stat('Jumlah aktivitas', records.length, 'Urut terbaru')}${A.stat('Hash terakhir', integrity.head.slice(0, 16), 'SHA-256 · rantai tenant aktif')}${A.stat('Antrean sinkronisasi', db.syncQueue.length, nav.onLine ? 'Jaringan tersedia' : 'Mode offline')}</div><section class="card"><h3>Log aktivitas</h3>${A.table(['Waktu', 'Pengguna', 'Jenis', 'Detail', 'Hash'], records.slice(0, 150).map((x) => [esc(new Date(x.at).toLocaleString('id-ID')), esc(x.by), esc(x.type), esc(x.detail), `<span class="mono">${esc(x.hash || 'Belum ditautkan')}</span>`]))}</section><div class="alert warn">Rantai SHA-256 membantu mendeteksi perubahan yang tidak konsisten pada data lokal. Karena browser dan localStorage tetap berada di perangkat pengguna, ini belum immutable dan belum membuktikan identitas penanda tangan. Produksi wajib memindahkan rantai audit ke server dengan append-only storage, kunci tanda tangan yang dikelola server, kontrol akses, backup terpisah dan pemantauan.</div>`
  }

  function dashboardV5() {
    const m = A.metrics()
    const txs = m.t
    const chartType = state.filters.dashboardCategory || 'all'
    const cats = ['Zakat Fitrah', 'Zakat Maal', 'Zakat Profesi', 'Fidyah', 'Kafarat', 'Infak/Sedekah']
    const filtered = chartType === 'all' ? txs : txs.filter((x) => x.lines.some((l) => l.category === chartType))
    const totals = cats.map((cat) => ({ name: cat, value: sum(filtered, (x) => sum(x.lines.filter((line) => line.category === cat && line.type === 'uang'), 'value')) }))
    const max = Math.max(1, ...totals.map((x) => x.value))
    const role = activeUser()?.role
    let roleHint = {
      Admin: 'Kelola periode, parameter, akun, dan verifikasi mustahik. Data transaksi yang telah disahkan tidak dapat diubah.',
      Muzakki: 'Kelola keluarga dan tenant, hitung zakat, lalu buat QR untuk jalur cepat ke meja Amil.',
      Operator: 'Catat transaksi walk-in sebagai Pending dan arahkan Muzakki membawa QR ke Amil.',
      Amil: 'Buka shift, scan QR, pandu akad, validasi pembayaran dan terbitkan bukti setor.',
      Bendahara: 'Rekonsiliasi serah terima dan rekening, susun jurnal dan distribusikan batch kepada Relawan.',
      Relawan: 'Pilih batch dan konfirmasi penerimaan bantuan dengan QR Mustahik.',
      Pengurus: 'Pantau laporan dan audit, lalu setujui rencana distribusi tanpa mengubah data operasional.',
    }[role]
    const quick = { Admin: ['mustahik', 'Data Mustahik'], Muzakki: ['my-zis', 'Layanan Mandiri'], Operator: ['transactions', 'Input Transaksi'], Amil: ['transactions', 'Scan QR'], Bendahara: ['deposits', 'Rekonsiliasi'], Relawan: ['distribution', 'Batch Tugas'], Pengurus: ['reports', 'Laporan'] }[role]
    return `${A.boxhead('Dashboard SiZisNur', `Tenant ${esc(A.tenant().name)} · ${esc(m.p?.name || 'Belum ada periode')} · Role ${esc(role)}`, action('Panduan role', 'open-help', 'primary'))}<section class="hero"><div><h2>Assalamu’alaikum, ${esc(activeUser().name.split(' ')[0])}</h2><p>${esc(roleHint)}</p><div class="actions">${actionFor(quick[1], 'quick-page', quick[0], 'primary')}${action('Evaluasi prototype', 'open-prototype', 'sm')}</div></div><div class="hero-aside"><span class="tag info">${esc(role)}</span><b id="offline-state">${nav.onLine ? 'Online · lokal saja' : 'Offline · tersimpan lokal'}</b><small>Antrean lokal: ${db.syncQueue.length}</small></div></section><div class="cards">${A.stat('Uang tercatat', money(m.received), 'Semua transaksi periode')}${A.stat('Beras tercatat', kilos(m.rice), 'Satuan kilogram')}${A.stat('Uang diverifikasi Amil', money(m.verified), 'Sesudah scan dan akad')}${A.stat('Uang disalurkan', money(m.sent), 'Berdasarkan batch Relawan')}</div><div class="two-col"><section class="card"><div class="card-top"><h3>Grafik penerimaan per kategori</h3><select id="dashboard-category-filter"><option value="all">Semua kategori</option>${cats.map((x) => `<option value="${esc(x)}" ${chartType === x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></div>${totals.map((x) => `<div class="bar-row"><label>${esc(x.name)}</label><div class="bar"><i style="width:${(x.value / max) * 100}%"></i></div><b>${money(x.value)}</b></div>`).join('')}<p class="caption">Grafik diperbarui saat filter kategori diubah. Satuan uang dan beras tidak dicampur.</p></section><section class="card"><h3>Alur operasional terpantau</h3><div class="workflow-mini"><span>Persiapan Admin</span><i>→</i><span>Pending Muzakki / Operator</span><i>→</i><span>Scan & verifikasi Amil</span><i>→</i><span>Kas dan rekening Bendahara</span><i>→</i><span>Batch Relawan</span><i>→</i><span>Audit Pengurus</span></div><p class="caption">Pengurus mempunyai akses baca penuh dan persetujuan program. Perubahan data dilakukan lewat koreksi terkendali.</p></section></div><section class="card"><div class="card-top"><h3>Transaksi terbaru</h3>${canV5('transactions') ? actionFor('Buka transaksi', 'quick-page', 'transactions', 'sm') : ''}</div>${A.table(['Nomor', 'Muzakki', 'Jumlah', 'Status'], txs.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6).map((tx) => [esc(tx.serial), esc(A.person(tx.personId)?.name || 'Muzakki'), `${money(effectiveTotals(tx).money)} · ${kilos(effectiveTotals(tx).rice)}`, statusPill(tx.status)]))}</section>`
  }
  A.set('dashboard', dashboardV5)

  function helpPageV5() { return supportPage() }
  A.set('helpPage', helpPageV5)
  function renderPageV5() {
    expirePending()
    backfillAudit()
    switch (state.page) {
      case 'dashboard': return dashboardV5()
      case 'my-zis': return myZisPage()
      case 'transactions': return transactionsPageV5()
      case 'deposits': return depositsPageV5()
      case 'ledger': return ledgerPage()
      case 'corrections': return correctionPage()
      case 'distribution': return distributionPageV5()
      case 'allocation': return allocationPageV5()
      case 'help': return helpPageV5()
      case 'amil-guide': return amilGuidePage()
      case 'prototype': return prototypePage()
      case 'tenant': return tenantPageV5()
      case 'muzakki': return muzakkiPageV5()
      case 'reports': return reportsPageV5()
      case 'audit': return auditPageV5()
      default: return baseRenderPage()
    }
  }
  const baseRenderPage = A.renderPage
  A.set('renderPage', renderPageV5)
  A.set('tenantPage', tenantPageV5)
  A.set('muzakkiPage', muzakkiPageV5)
  A.set('auditPage', auditPageV5)
  A.set('reportsPage', reportsPageV5)

  function landingV5() {
    return `<div class="landing-page">
  <header class="lp-nav" id="beranda"><div class="lp-container lp-nav-inner">
    <a class="lp-brand" href="#beranda" aria-label="SiZisNur — kembali ke beranda"><img src="assets/sizisnur-logo-mark.png" alt="Logo SiZisNur"><span>SiZis<span class="lp-brand-accent">Nur</span><small>Platform Zakat, Infak & Sedekah</small></span></a>
    <nav class="lp-menu" aria-label="Navigasi halaman depan"><a href="#fitur">Fitur</a><a href="#alur">Cara kerja</a><a href="#pengguna">Aktor layanan</a><a href="#platform">Tentang platform</a></nav>
    <div class="lp-nav-actions"><button class="lp-link-button" data-action="public">Portal publik</button><button class="lp-btn lp-btn-small" data-action="go-login">Masuk / Coba Demo <span aria-hidden="true">↗</span></button></div>
  </div></header>
  <main>
   <section class="lp-hero"><div class="lp-container lp-hero-grid">
     <div class="lp-hero-copy"><span class="lp-eyebrow"><span class="lp-live-dot"></span> Layanan ZIS terintegrasi untuk masjid dan komunitas</span>
       <h1>Amanah zakat, <span>lebih tertata.</span> Dari keluarga hingga penerima.</h1>
       <p>SiZisNur menyatukan layanan mandiri Muzakki, pencatatan konter, verifikasi pembayaran oleh Amil, pengelolaan kas, hingga penyaluran bantuan. Semua berlangsung dalam alur yang saling terhubung sesuai tanggung jawab setiap peran.</p>
       <div class="lp-hero-buttons"><button class="lp-btn lp-btn-large" data-action="go-login">Jelajahi Layanan SiZisNur <span>↗</span></button><a class="lp-btn lp-btn-outline" href="#alur">Lihat cara kerja <span>↓</span></a></div>
       <div class="lp-demo-note"><span>✦</span><p><strong>Mode demonstrasi.</strong> Prototype ini menggunakan akun dan data sintetis untuk evaluasi alur. Pembayaran nyata, autentikasi produksi, notifikasi eksternal, dan sinkronisasi cloud belum diaktifkan.</p></div>
     </div>
     <div class="lp-product-visual" aria-label="Ilustrasi dashboard SiZisNur dengan alur transaksi dan distribusi">
       <div class="lp-visual-glow"></div><div class="lp-screen"><div class="lp-screen-head"><div class="lp-screen-brand"><img src="assets/sizisnur-logo-mark.png" alt=""><strong>SiZisNur</strong></div><span class="lp-screen-indicator">● Ilustrasi data demo</span></div>
       <div class="lp-screen-toolbar"><span><small>Ringkasan layanan ZIS</small><strong>Masjid An-Nur VPA</strong></span><span class="lp-screen-period">Periode layanan · Contoh</span></div>
       <div class="lp-screen-stats"><div><small>Contoh penerimaan uang</small><strong>Rp 200.000</strong><span>Data ilustrasi</span></div><div><small>Contoh penerimaan beras</small><strong>7,5 kg</strong><span>Dicatat terpisah</span></div></div>
       <div class="lp-screen-flow"><p>Alur layanan terhubung</p><div class="lp-screen-step"><span class="lp-screen-num">01</span><b>Transaksi Muzakki</b><em>QR · Pending</em></div><div class="lp-screen-step"><span class="lp-screen-num">02</span><b>Verifikasi oleh Amil</b><em>✓ Disahkan</em></div><div class="lp-screen-step"><span class="lp-screen-num">03</span><b>Rekonsiliasi Bendahara</b><em>✓ Tercatat</em></div><div class="lp-screen-step"><span class="lp-screen-num">04</span><b>Distribusi per batch</b><em>↗ Terpantau</em></div></div></div>
       <span class="lp-float lp-float-one">✓ QR transaksi terverifikasi</span><span class="lp-float lp-float-two">⌁ Laporan lebih terarah</span>
     </div>
   </div></section>
   <section class="lp-value-strip" aria-label="Cakupan layanan SiZisNur"><div class="lp-container lp-value-grid"><div><b>7</b><span>Aktor dalam satu ekosistem</span></div><div><b>Uang & beras</b><span>Dua satuan penerimaan ZIS</span></div><div><b>End-to-end</b><span>Dari persiapan hingga penyaluran</span></div><div><b>Multi-tenant</b><span>Untuk banyak masjid dan lembaga</span></div></div></section>
   <section class="lp-section lp-problem" id="layanan"><div class="lp-container"><div class="lp-section-intro"><span class="lp-section-kicker">Layanan dalam satu ekosistem</span><h2>Dari rumah ke meja Amil,<br><span>hingga bantuan diterima.</span></h2><p>Muzakki dapat menyiapkan data dan rencana zakat lebih awal. Tim masjid melanjutkan verifikasi, pengelolaan dana, dan penyaluran melalui proses yang tercatat.</p></div><div class="lp-problem-grid">
      <article class="lp-problem-card"><span class="lp-feature-icon">⌂</span><h3>Rencanakan zakat dari rumah</h3><p>Muzakki mengelola data keluarga, memilih jenis zakat, menghitung kewajiban dalam bentuk uang atau beras, lalu menyiapkan transaksi melalui akun pribadi.</p><strong>→ Lebih siap sebelum datang ke konter</strong></article>
      <article class="lp-problem-card"><span class="lp-feature-icon">▣</span><h3>Verifikasi praktis dengan QR</h3><p>Transaksi mandiri maupun yang dibantu Operator memiliki QR yang sama-sama dipindai Amil untuk memeriksa rincian, memandu akad, dan mengesahkan pembayaran.</p><strong>→ Satu proses verifikasi oleh Amil</strong></article>
      <article class="lp-problem-card"><span class="lp-feature-icon">⇥</span><h3>Salurkan bantuan bertahap</h3><p>Bendahara menyiapkan alokasi, Pengurus memberikan persetujuan, dan Relawan mencatat penerimaan bantuan Mustahik melalui QR pada setiap batch.</p><strong>→ Penyaluran dapat dimulai per batch</strong></article>
   </div></div></section>
   <section class="lp-section lp-features" id="fitur"><div class="lp-container"><div class="lp-section-intro lp-center"><span class="lp-section-kicker">Fitur utama SiZisNur</span><h2>Semua kebutuhan pengelolaan ZIS dalam satu platform.</h2><p>Setiap fitur dirancang untuk membantu pekerjaan Muzakki dan panitia, dengan akses yang disesuaikan pada tanggung jawab masing-masing.</p></div><div class="lp-features-grid">
     <article class="lp-feature-card"><span class="lp-feature-icon">♙</span><h3>Layanan mandiri Muzakki</h3><p>Kelola anggota keluarga dan tenant, gunakan kalkulator zakat, lihat riwayat pribadi, serta unduh QR transaksi dan bukti setor zakat.</p><small>Muzakki</small></article>
     <article class="lp-feature-card"><span class="lp-feature-icon">▤</span><h3>Penerimaan konter dan QR</h3><p>Operator mencatat transaksi Walk-in. Amil membuka shift, memindai QR, memandu akad, mengesahkan pembayaran, dan menerbitkan struk.</p><small>Operator · Amil</small></article>
     <article class="lp-feature-card"><span class="lp-feature-icon">♧</span><h3>Data Mustahik dan wilayah</h3><p>Admin mengelola kelayakan penerima, data daerah dan RT, serta menyiapkan identitas QR untuk proses penyaluran.</p><small>Admin</small></article>
     <article class="lp-feature-card"><span class="lp-feature-icon">▥</span><h3>Rekonsiliasi dan keuangan</h3><p>Catat serah terima per shift, cocokkan kas aktual dan rekening, serta susun jurnal, neraca, dan laporan perubahan dana.</p><small>Bendahara</small></article>
     <article class="lp-feature-card"><span class="lp-feature-icon">⇄</span><h3>Distribusi secara bertahap</h3><p>Siapkan batch penyaluran, ajukan persetujuan program, lalu verifikasi penerimaan bantuan Mustahik di lapangan dengan QR.</p><small>Bendahara · Relawan · Pengurus</small></article>
     <article class="lp-feature-card"><span class="lp-feature-icon">⌘</span><h3>Dashboard dan pelaporan</h3><p>Pantau grafik dengan filter, telusuri proses dan audit, serta siapkan rekap periode yang dapat diunduh dalam PDF, XLSX, dan CSV.</p><small>Seluruh peran</small></article>
   </div></div></section>
   <section class="lp-section lp-steps" id="alur"><div class="lp-container"><div class="lp-section-intro"><span class="lp-section-kicker">Bagaimana cara kerjanya?</span><h2>Satu alur yang jelas, dari persiapan hingga penyaluran.</h2><p>Jalur mandiri dan layanan konter bertemu pada verifikasi Amil. Pengelolaan kas, persetujuan program, serta distribusi berjalan sesuai pemisahan tugas.</p></div><div class="lp-steps-grid">
     <div class="lp-step"><span>01</span><h3>Admin menyiapkan data</h3><p>Atur periode dan master ZIS, lalu data serta verifikasi kelayakan Mustahik.</p></div>
     <div class="lp-step"><span>02</span><h3>Muzakki membuat transaksi</h3><p>Muzakki mengisi mandiri atau Operator membantu di konter. Keduanya menghasilkan transaksi Pending dan QR.</p></div>
     <div class="lp-step"><span>03</span><h3>Amil memverifikasi</h3><p>Amil scan QR, memeriksa rincian, memandu akad, menerima pembayaran, dan menerbitkan bukti setor.</p></div>
     <div class="lp-step"><span>04</span><h3>Bendahara merekonsiliasi</h3><p>Setoran per shift dicocokkan dengan kas aktual dan rekening sebelum dana disiapkan untuk penyaluran.</p></div>
     <div class="lp-step"><span>05</span><h3>Pengurus dan Relawan menyalurkan</h3><p>Pengurus menyetujui program. Relawan memindai QR Mustahik dan mencatat realisasi pada setiap batch.</p></div>
   </div><div class="lp-step-cta"><span>Kenali alur dan hak akses setiap peran melalui prototype interaktif.</span><button class="lp-btn lp-btn-small" data-action="go-login">Jelajahi prototype ↗</button></div></div></section>
   <section class="lp-section lp-audience" id="pengguna"><div class="lp-container lp-audience-wrap"><div><span class="lp-section-kicker">Pemisahan tugas dan tanggung jawab</span><h2>Tujuh aktor, satu amanah yang saling terhubung.</h2><p>Setiap akun memiliki ruang kerja sesuai tugasnya. Mulai dari layanan mandiri Muzakki, operasional dan keuangan panitia, hingga pengawasan serta persetujuan oleh Pengurus.</p><button class="lp-btn lp-btn-outline-dark" data-action="go-login">Jelajahi tujuh peran ↗</button></div><div class="lp-roles-grid"><span>Admin</span><span>Muzakki</span><span>Operator</span><span>Amil</span><span>Bendahara</span><span>Relawan</span><span>Pengurus</span></div></div></section>
   <section class="lp-section lp-platform" id="platform"><div class="lp-container lp-platform-wrap"><div class="lp-platform-art"><span class="lp-platform-chip">Masjid A</span><span class="lp-platform-core"><img src="assets/sizisnur-logo-mark.png" alt="Logo SiZisNur"><strong>SiZisNur</strong><small>Platform bersama</small></span><span class="lp-platform-chip">Masjid B</span><span class="lp-platform-chip lp-platform-chip-bottom">Lembaga zakat</span></div><div><span class="lp-section-kicker">Satu platform untuk banyak lembaga</span><h2>Setiap masjid mengelola layanan dan datanya sendiri.</h2><p>SiZisNur dirancang dengan pendekatan multi-tenant agar beberapa masjid, UPZ, atau lembaga dapat menggunakan platform yang sama dengan ruang data dan pengaturan masing-masing.</p><p>Satu akun Muzakki dapat terhubung ke beberapa tenant. Transaksi dan verifikasi tetap berada dalam tenant tempat transaksi tersebut dibuat.</p><button class="lp-btn lp-btn-small" data-action="tenant-apply">Ajukan lembaga (simulasi) ↗</button></div></div></section>
   <section class="lp-section lp-cta-section"><div class="lp-container"><div class="lp-cta-card"><div><span class="lp-section-kicker">Mulai jelajahi SiZisNur</span><h2>Lihat bagaimana amanah ZIS dikelola dalam satu alur.</h2><p>Coba layanan Muzakki dan ruang kerja Admin, Operator, Amil, Bendahara, Relawan, serta Pengurus menggunakan data demonstrasi.</p></div><div class="lp-cta-actions"><button class="lp-btn lp-btn-gold" data-action="go-login">Buka Prototype ↗</button><button class="lp-btn lp-btn-white-outline" data-action="public">Lihat Portal Publik</button></div></div></div></section>
  </main>
  <footer class="lp-footer"><div class="lp-container lp-footer-layout"><div class="lp-footer-brand"><div class="lp-brand lp-brand-footer"><img src="assets/sizisnur-logo-mark.png" alt="Logo SiZisNur"><span>SiZis<span class="lp-brand-accent">Nur</span><small>Sistem Informasi Zakat, Infak & Sedekah</small></span></div><p>SiZisNur merupakan platform pengelolaan zakat, infak, dan sedekah yang dirancang untuk mendukung masjid, UPZ, dan komunitas dalam menjalankan amanah secara tertata.</p></div><div class="lp-footer-links"><strong>Jelajahi</strong><a href="#fitur">Fitur</a><a href="#alur">Alur pengelolaan</a><a href="#pengguna">Aktor layanan</a></div><div class="lp-footer-links"><strong>Prototype</strong><button data-action="go-login">Masuk demo</button><button data-action="public">Portal transparansi</button><button data-action="tenant-apply">Pengajuan lembaga</button></div></div><div class="lp-container lp-footer-bottom"><span>© SiZisNur · Prototype untuk evaluasi dan UAT</span><span>Belum menerima zakat, infak, sedekah, atau transaksi nyata.</span></div></footer>
  <div id="modal-root"></div></div>`
  }
  A.set('landingView', landingV5)

  function toNumber(value) {
    const normalized = String(value || '').replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')
    const parsed = Number(normalized)
    if (!Number.isFinite(parsed)) throw new Error('Format nominal tidak valid')
    return parsed
  }
  function toKg(value) {
    const normalized = String(value || '').trim().replace(/[^\d,.-]/g, '').replace(',', '.')
    const parsed = Number(normalized)
    if (!Number.isFinite(parsed)) throw new Error('Format kilogram tidak valid')
    return parsed
  }
  function formatInputValue(input) {
    if (input.dataset.format === 'idr') {
      const digits = String(input.value || '').replace(/\D/g, '')
      input.value = digits ? new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Number(digits)) : ''
    } else if (input.dataset.format === 'kg') {
      const normalized = String(input.value || '').replace(/[^\d,.]/g, '').replace(/,/g, '.')
      const parts = normalized.split('.')
      input.value = parts.length > 1 ? `${parts[0] || '0'},${parts.slice(1).join('').slice(0, 3)}` : parts[0]
    }
  }
  function reportRows() {
    const m = reportContext()
    const type = state.filters.reportType || 'all'
    const heading = [['Tenant', A.tenant().name], ['Periode', m.period?.name || '—'], ['Jenis laporan', type]]
    if (type === 'cash') return [...heading, ['Kode setoran', 'Amil', 'Tanggal', 'Kas uang IDR', 'Kas beras kg', 'Bank uang IDR', 'Bank beras kg', 'Status'], ...m.deposits.map((x) => [x.id, A.who(x.amilId), x.createdAt, x.actualMoney ?? x.declaredMoney, x.actualRice ?? x.declaredRice, x.bankMoney ?? '', x.bankRice ?? '', x.status])]
    if (type === 'distribution') return [...heading, ['Tanggal', 'Batch', 'Mustahik', 'Uang IDR', 'Beras kg', 'Relawan'], ...m.distributions.map((x) => [x.deliveredAt, db.batches.find((b) => b.id === x.batchId)?.name || '', x.mustahikId, x.money, x.rice, A.who(x.deliveredBy)])]
    if (type === 'mustahik') return [...heading, ['Nomor', 'Nama', 'Daerah', 'RT', 'Asnaf'], ...m.mustahiks.map((x) => { const p = A.person(x.personId); return [x.registrationNo || x.id, p?.name || '', x.region || '', x.rt || p?.rt || '', x.finalStatus || x.asnaf || ''] })]
    if (type === 'receipt') return [...heading, ['Nomor', 'Waktu', 'Muzakki', 'Jenis', 'Status', 'Uang IDR', 'Beras kg'], ...m.txs.map((tx) => [tx.serial, tx.createdAt, A.person(tx.personId)?.name || 'Muzakki', tx.lines.map((x) => x.category).join(', '), tx.status, effectiveTotals(tx).money, effectiveTotals(tx).rice])]
    return [...heading, ['Indikator', 'Nilai'], ['Jumlah transaksi', m.txs.length], ['Jumlah jiwa', sum(m.txs, 'jiwa')], ['Penerimaan uang IDR', m.received], ['Penerimaan beras kg', m.rice], ['Terverifikasi uang IDR', m.verified], ['Terverifikasi beras kg', m.verifiedRice], ['Distribusi uang IDR', m.sent], ['Distribusi beras kg', m.sentRice], ['Rekonsiliasi selesai', m.deposits.filter((x) => x.status === 'terverifikasi').length]]
  }
  function reportCsv() {
    const rows = reportRows()
    A.downloadFile(`SiZisNur-Laporan-${dateToday()}.csv`, 'text/csv;charset=utf-8', '\ufeff' + A.csv(rows))
  }

  function crc32(bytes) {
    let crc = -1
    for (const byte of bytes) {
      crc ^= byte
      for (let i = 0; i < 8; i += 1) crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1))
    }
    return (crc ^ -1) >>> 0
  }
  function u16(n) { return [n & 255, (n >>> 8) & 255] }
  function u32(n) { return [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255] }
  function zipStored(files) {
    const encoder = new TextEncoder()
    const local = [], central = []
    let offset = 0
    files.forEach(([name, content]) => {
      const filename = encoder.encode(name)
      const bytes = encoder.encode(content)
      const crc = crc32(bytes)
      const header = [...u32(0x04034b50), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(crc), ...u32(bytes.length), ...u32(bytes.length), ...u16(filename.length), ...u16(0), ...filename]
      local.push(...header, ...bytes)
      const c = [...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(crc), ...u32(bytes.length), ...u32(bytes.length), ...u16(filename.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset), ...filename]
      central.push(...c)
      offset += header.length + bytes.length
    })
    const end = [...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(central.length), ...u32(offset), ...u16(0)]
    return new Uint8Array([...local, ...central, ...end])
  }
  function makeXlsx(rows, sheetName = 'Rekap SiZisNur') {
    const xml = (s) => String(s ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;')
    const sheetRows = rows.map((row, r) => `<row r="${r + 1}">${row.map((value, c) => {
      const ref = `${String.fromCharCode(65 + c)}${r + 1}`
      if (typeof value === 'number' && Number.isFinite(value)) return `<c r="${ref}"><v>${value}</v></c>`
      return `<c r="${ref}" t="inlineStr"><is><t>${xml(value)}</t></is></c>`
    }).join('')}</row>`).join('')
    const safeSheet = xml(sheetName.slice(0, 31))
    const files = [
      ['[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>'],
      ['_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
      ['xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${safeSheet}" sheetId="1" r:id="rId1"/></sheets></workbook>`],
      ['xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>'],
      ['xl/worksheets/sheet1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData></worksheet>`],
    ]
    return zipStored(files)
  }
  function exportXlsx(filename, rows, sheet) {
    const blob = new Blob([makeXlsx(rows, sheet)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url)
  }

  // Camera scanner uses BarcodeDetector where the browser supports it. Manual input is always available.
  let cameraStream = null
  let cameraLoop = null
  async function startCamera(kind) {
    const video = $(`${kind}-camera`)
    if (!video) throw new Error('Elemen kamera tidak tersedia')
    if (!nav.mediaDevices?.getUserMedia) throw new Error('Browser tidak mendukung kamera. Masukkan kode secara manual.')
    if (!('BarcodeDetector' in window)) throw new Error('Pemindai QR native belum didukung browser ini. Masukkan kode secara manual.')
    cameraStream = await nav.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
    video.srcObject = cameraStream; video.hidden = false; await video.play()
    const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
    const target = kind === 'amil' ? 'amil-scan-token' : 'volunteer-scan-token'
    const output = kind === 'amil' ? 'amil-scan-result' : 'volunteer-result'
    cameraLoop = window.setInterval(async () => {
      try {
        const codes = await detector.detect(video)
        if (codes.length) {
          $(target).value = codes[0].rawValue
          stopCamera()
          if (kind === 'amil') scanAmil(); else scanVolunteer()
        }
      } catch (_) { /* Camera frame not ready */ }
    }, 450)
  }
  function stopCamera() {
    if (cameraLoop) window.clearInterval(cameraLoop)
    cameraLoop = null
    if (cameraStream) cameraStream.getTracks().forEach((track) => track.stop())
    cameraStream = null
    ;['amil-camera', 'volunteer-camera'].forEach((id) => { const video = $(id); if (video) { video.pause(); video.srcObject = null; video.hidden = true } })
  }
  function scanAmil() {
    const result = $('amil-scan-result')
    try {
      const tx = parseTransactionToken($('amil-scan-token')?.value)
      if (!tx) throw new Error('QR atau nomor transaksi tidak ditemukan pada tenant aktif')
      if (tx.status !== 'pending') throw new Error(`Transaksi berstatus ${tx.status}, bukan Pending`)
      result.innerHTML = `<div class="alert ok">Transaksi ditemukan. Tenant cocok.</div><div class="card scan-result-card"><b>${esc(A.person(tx.personId)?.name || 'Muzakki')}</b><p>${esc(tx.serial)} · ${tx.jiwa} jiwa · ${money(effectiveTotals(tx).money)} · ${kilos(effectiveTotals(tx).rice)}</p>${actionFor('Lanjutkan verifikasi dan akad', 'amil-verify-open', tx.id, 'primary')}</div>`
    } catch (error) { if (result) result.innerHTML = `<div class="alert danger">${esc(error.message)}</div>` }
  }
  function scanVolunteer() {
    const result = $('volunteer-result')
    try {
      const raw = String($('volunteer-scan-token')?.value || '').trim()
      const parts = raw.split('|')
      if (parts[0] === 'SIZISNUR' && parts[1] === 'MUSTAHIK') {
        if (parts[2] !== currentTenantId()) throw new Error('QR Mustahik bukan dari tenant yang sedang aktif')
      }
      const mustahikId = parts[0] === 'SIZISNUR' ? parts[3] : raw
      const batchId = $('volunteer-batch')?.value
      const batch = A.scoped('batches').find((x) => x.id === batchId && x.volunteerId === activeUser()?.id)
      if (!batch) throw new Error('Pilih batch tugas yang diberikan kepada akun ini')
      if (!batch.itemIds.includes(mustahikId)) throw new Error('Mustahik tidak terdaftar dalam batch ini')
      const mustahik = db.mustahiks.find((x) => x.id === mustahikId && x.tenantId === currentTenantId())
      const person = mustahik && db.persons.find((x) => x.id === mustahik.personId && x.tenantId === currentTenantId())
      if (!mustahik || !person) throw new Error('Data penerima tidak ditemukan')
      if (A.scoped('distributions').some((x) => x.batchId === batch.id && x.mustahikId === mustahikId)) throw new Error('Bantuan untuk penerima ini sudah tercatat')
      const alloc = db.allocations.find((x) => x.id === batch.allocationId)
      const item = alloc.items.find((x) => x.mustahikId === mustahikId)
      result.innerHTML = `<div class="alert ok">Penerima cocok dengan batch.</div><div class="card scan-result-card"><b>${esc(person.name)}</b><p>${esc(mustahik.finalStatus || mustahik.asnaf)} · ${money(item.money)} · ${kilos(item.rice)}</p>${actionFor('Konfirmasi bantuan diterima', 'volunteer-confirm', `${batch.id}|${mustahikId}`, 'primary')}</div>`
    } catch (error) { if (result) result.innerHTML = `<div class="alert danger">${esc(error.message)}</div>` }
  }

  function openBatchModal() {
    const allocations = A.scoped('allocations').filter((x) => x.periodId === currentPeriod()?.id && x.status === 'disetujui')
    const volunteers = A.scoped('users').filter((x) => x.role === 'Relawan' && x.active)
    if (!allocations.length) throw new Error('Belum ada alokasi yang disetujui Pengurus')
    if (!volunteers.length) throw new Error('Belum ada akun Relawan aktif pada tenant')
    A.modal('Buat batch distribusi', `<form data-v5-form="batch-create"><div class="grid-form">${A.fld('Nama batch', 'name', `Batch ${A.scoped('batches').length + 1}`, 'text', 'required')}${A.sel('Alokasi sumber', 'allocationId', allocations.map((x) => [x.id, `${x.name} · ${x.items.length} penerima`]))}${A.sel('Relawan pelaksana', 'volunteerId', volunteers.map((x) => [x.id, x.name]))}${A.fld('Tanggal rencana', 'plannedDate', dateToday(), 'date')}${A.textarea('ID Mustahik yang masuk batch (opsional)', 'mustahikIds', '')}</div><p class="caption">Kosongkan daftar ID untuk memasukkan seluruh penerima yang belum ditugaskan dari alokasi tersebut. Pisahkan ID dengan koma atau baris baru.</p>${formButton('Simpan batch')}</form>`)
  }
  function batchView(batchId) {
    const batch = A.scoped('batches').find((x) => x.id === batchId)
    if (!batch) throw new Error('Batch tidak ditemukan')
    const alloc = db.allocations.find((x) => x.id === batch.allocationId)
    const rows = batch.itemIds.map((id) => {
      const mustahik = db.mustahiks.find((x) => x.id === id)
      const person = db.persons.find((x) => x.id === mustahik?.personId)
      const done = A.scoped('distributions').some((x) => x.batchId === batch.id && x.mustahikId === id)
      return [esc(person?.name || id), esc(mustahik?.finalStatus || mustahik?.asnaf), done ? 'Diterima' : 'Menunggu', `<span class="mono">${esc(mustahikToken(mustahik))}</span>`]
    })
    A.modal(batch.name, `<div class="mini-list"><div class="mini-item"><span>Relawan</span><b>${esc(A.who(batch.volunteerId))}</b></div><div class="mini-item"><span>Alokasi</span><b>${esc(alloc?.name)}</b></div><div class="mini-item"><span>Progres</span><b>${batch.completed || 0} / ${batch.itemIds.length}</b></div></div>${A.table(['Mustahik', 'Asnaf', 'Status', 'QR token'], rows)}`)
  }

  document.addEventListener('click', (event) => {
    const jump = event.target.closest('[data-guide-target]')
    if (!jump) return
    const target = document.getElementById(jump.dataset.guideTarget)
    if (!target) return
    target.open = true
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })

  // Custom click actions live under a separate data attribute so legacy controls keep their existing handlers.
  document.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-v5-action]')
    if (!button) return
    const key = button.dataset.v5Action
    const id = button.dataset.id
    try {
      switch (key) {
        case 'open-help': state.page = 'help'; A.render(); break
        case 'open-prototype': state.page = 'prototype'; A.render(); break
        case 'quick-page': if (!canV5(id)) throw new Error('Role tidak memiliki akses'); state.page = id; A.render(); break
        case 'tenant-join': joinTenantModal(); break
        case 'muzakki-register': muzakkiRegisterModal(); break
        case 'tenant-switch-button': switchTenant(id); break
        case 'household-add': $('household-rows')?.insertAdjacentHTML('beforeend', '<div class="household-row"><input name="memberName" placeholder="Nama anggota" required><input name="relation" placeholder="Hubungan"><button type="button" class="btn sm danger" data-v5-action="household-remove">Hapus</button></div>'); break
        case 'household-remove': button.closest('.household-row')?.remove(); break
        case 'self-tx-new': openSelfTransaction(); break
        case 'operator-new': if (!['Operator', 'Amil'].includes(activeUser()?.role)) throw new Error('Hanya Operator atau Amil yang dapat mencatat transaksi'); openOperatorTransactionModal(); break
        case 'amil-scan': scanAmil(); break
        case 'camera-start': await startCamera(button.dataset.camera); break
        case 'amil-verify-open': verifyTransactionModal(A.scoped('transactions').find((x) => x.id === id)); break
        case 'shift-open': shiftControl(true); break
        case 'shift-close': shiftControl(false); break
        case 'receipt-open': { const tx = db.transactions.find((x) => x.id === id && (x.tenantId === currentTenantId() || (activeUser()?.role === 'Muzakki' && x.accountId === accountForUser()?.id))); if (!tx) throw new Error('Struk tidak ditemukan atau bukan milik akun ini'); showReceiptV5(tx); break }
        case 'receipt-png': { const tx = db.transactions.find((x) => x.id === id && (x.tenantId === currentTenantId() || (activeUser()?.role === 'Muzakki' && x.accountId === accountForUser()?.id))); if (!tx) throw new Error('Transaksi tidak ditemukan'); await downloadReceiptPng(tx); break }
        case 'receipt-pdf': { const tx = db.transactions.find((x) => x.id === id && (x.tenantId === currentTenantId() || (activeUser()?.role === 'Muzakki' && x.accountId === accountForUser()?.id))); if (!tx) throw new Error('Transaksi tidak ditemukan'); A.printWindow(`Bukti setor ${tx.serial}`, A.receiptHtml(tx), false); break }
        case 'receipt-thermal': { const tx = db.transactions.find((x) => x.id === id && (x.tenantId === currentTenantId() || (activeUser()?.role === 'Muzakki' && x.accountId === accountForUser()?.id))); if (!tx) throw new Error('Transaksi tidak ditemukan'); makeReceiptPrint(tx, true); break }
        case 'muzakki-history': { const txs = A.scoped('transactions').filter((x) => x.personId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); A.modal('Riwayat transaksi Muzakki', A.table(['Tanggal', 'Nomor', 'Jenis', 'Uang', 'Beras', 'Status'], txs.map((x) => [esc(new Date(x.createdAt).toLocaleString('id-ID')), esc(x.serial), esc(x.lines.map((l) => l.category).join(', ')), money(effectiveTotals(x).money), kilos(effectiveTotals(x).rice), statusPill(x.status)]))); break }
        case 'operator-person-new': if (!['Admin', 'Operator', 'Amil'].includes(activeUser()?.role)) throw new Error('Akses ditolak'); operatorPersonModal(); break
        case 'deposit-create': if (activeUser()?.role !== 'Bendahara') throw new Error('Hanya Bendahara yang dapat membuat berita acara'); openDepositBatchModal(); break
        case 'deposit-stage1-open': if (activeUser()?.role !== 'Bendahara') throw new Error('Akses baca saja'); depositStage1Modal(id); break
        case 'deposit-stage2-open': if (activeUser()?.role !== 'Bendahara') throw new Error('Akses baca saja'); depositStage2Modal(id); break
        case 'allocation-view': { const x = A.scoped('allocations').find((a) => a.id === id); if (!x) throw new Error('Alokasi tidak ditemukan'); A.modal(x.name, A.table(['Mustahik', 'Uang', 'Beras'], x.items.map((i) => [esc(db.persons.find((p) => p.id === db.mustahiks.find((m) => m.id === i.mustahikId)?.personId)?.name || i.mustahikId), money(i.money), kilos(i.rice)]))); break }
        case 'allocation-flexible': flexibleAllocationModal(); break
        case 'workbook-stage-1': window.dispatchEvent(new CustomEvent('sizisnur-v5-workbook', { detail: { stage: 1 } })); break
        case 'workbook-stage-2': window.dispatchEvent(new CustomEvent('sizisnur-v5-workbook', { detail: { stage: 2 } })); break
        case 'allocation-submit-v5': { if (activeUser()?.role !== 'Bendahara') throw new Error('Hanya Bendahara yang mengajukan alokasi'); const x = A.scoped('allocations').find((a) => a.id === id); if (!x || x.status !== 'draf') throw new Error('Rencana bukan draf'); x.status = 'diajukan'; x.submittedAt = timestamp(); A.aud('ALOKASI_AJUKAN', `Bendahara mengajukan ${x.id}`); A.persist(); A.render(); break }
        case 'allocation-review-v5': { if (activeUser()?.role !== 'Pengurus') throw new Error('Hanya Pengurus yang meninjau alokasi'); const x = A.scoped('allocations').find((a) => a.id === id); if (!x || x.status !== 'diajukan') throw new Error('Rencana tidak menunggu keputusan'); A.modal('Persetujuan Pengurus', `<div class="alert light">Periksa daftar penerima, jumlah bantuan dan alasan pengajuan Bendahara.</div><form data-v5-form="allocation-review" data-id="${esc(id)}">${A.sel('Keputusan', 'decision', [['disetujui', 'Setujui'], ['ditolak', 'Tolak']])}${A.textarea('Catatan keputusan', 'note', '')}${formButton('Simpan keputusan')}</form>`); break }
        case 'batch-new': openBatchModal(); break
        case 'batch-view': batchView(id); break
        case 'volunteer-lookup': scanVolunteer(); break
        case 'volunteer-select': { const [batchId, mid] = id.split('|'); const input = $('volunteer-scan-token'); if (input) input.value = mustahikToken(db.mustahiks.find((x) => x.id === mid)); const select = $('volunteer-batch'); if (select) select.value = batchId; scanVolunteer(); break }
        case 'volunteer-confirm': { if (activeUser()?.role !== 'Relawan') throw new Error('Hanya Relawan yang dapat mengonfirmasi penyaluran'); const [batchId, mid] = id.split('|'); const batch = A.scoped('batches').find((x) => x.id === batchId && x.volunteerId === activeUser().id); if (!batch || !batch.itemIds.includes(mid)) throw new Error('Penerima tidak terdaftar dalam batch Relawan'); addDistributionRecord(batch, mid); A.persist(); A.render(); A.toast('Penerimaan bantuan tercatat'); break }
        case 'correction-new': openCorrectionRequest(id); break
        case 'correction-review-open': openCorrectionReview(id); break
        case 'export-report-csv': reportCsv(); break
        case 'export-report-xlsx': exportXlsx(`SiZisNur-Rekap-${dateToday()}.xlsx`, reportRows(), 'Rekap ZIS'); break
        case 'export-baznas-xlsx': exportXlsx(`SiZisNur-UPZ-${dateToday()}.xlsx`, reportRows(), 'Laporan UPZ'); break
        case 'export-baznas-csv': A.downloadFile(`SiZisNur-UPZ-${dateToday()}.csv`, 'text/csv;charset=utf-8', '\ufeff' + A.csv(reportRows())); break
        case 'export-report-pdf': A.printWindow('Laporan SiZisNur', $('main-content')?.innerHTML || '', false); break
        case 'export-ledger-xlsx': exportXlsx(`SiZisNur-Jurnal-${dateToday()}.xlsx`, [['Tanggal', 'Kode', 'Keterangan', 'Akun Debit', 'Debit', 'Akun Kredit', 'Kredit', 'Satuan', 'Referensi'], ...A.scoped('journalEntries').map((x) => [x.date, x.code, x.description, x.accountDebit, x.debit, x.accountCredit, x.credit, x.unit || 'IDR', x.reference])], 'Jurnal Umum'); break
        case 'amil-help': state.page = 'amil-guide'; A.render(); break
        default: break
      }
    } catch (error) { console.error(error); A.toast(error.message || String(error), 'error') }
  })

  function switchTenant(tenantId) {
    const u = activeUser()
    if (u?.role !== 'Muzakki' || !memberForUser(u.id, tenantId)) throw new Error('Akun ini belum terdaftar di tenant tersebut')
    A.session.tenantId = tenantId
    saveSession()
    state.page = 'my-zis'
    A.persist(); A.render(); trySync()
  }
  document.addEventListener('input', (event) => {
    const field = event.target
    if (field?.dataset?.format) formatInputValue(field)
  })
  document.addEventListener('change', (event) => {
    if (['type', 'category', 'jiwa'].includes(event.target.name) && event.target.form?.dataset?.v5Form === 'operator-transaction') {
      setOperatorAmount(event.target.form, event.target.name === 'type')
    }
    if (['type', 'category', 'jiwa'].includes(event.target.name) && event.target.form?.dataset?.v5Form === 'self-transaction') {
      setSelfTransactionAmount(event.target.form, event.target.name === 'type')
    }
    if (event.target.name === 'regionType') {
      const rtField = event.target.form?.querySelector('[name="rt"]')?.closest('.field')
      if (rtField) rtField.hidden = event.target.value !== 'VPA'
    }
    if (event.target.name === 'personId' && event.target.form?.dataset?.v5Form === 'operator-transaction' && event.target.value) {
      const person = db.persons.find((x) => x.id === event.target.value && x.tenantId === currentTenantId())
      if (person) { for (const key of ['name', 'phone', 'email', 'address']) { const input = event.target.form.elements[key]; if (input) input.value = person[key] || '' } }
    }
    if (event.target.id === 'muzakki-tenant-switch') {
      try { switchTenant(event.target.value) } catch (error) { A.toast(error.message, 'error') }
    }
    if (event.target.id === 'dashboard-category-filter') {
      state.filters.dashboardCategory = event.target.value
      A.render()
    }
    if (event.target.id === 'report-period') { state.filters.reportPeriod = event.target.value; A.render() }
    if (event.target.id === 'report-type') { state.filters.reportType = event.target.value; A.render() }
  })

  function openDepositBatchModal() {
    const transactions = A.scoped('transactions').filter((x) => x.periodId === currentPeriod()?.id && x.status === 'paid' && x.shiftId && db.shiftSessions.some((shift) => shift.id === x.shiftId && shift.tenantId === currentTenantId() && shift.status === 'closed'))
    if (!transactions.length) throw new Error('Belum ada transaksi paid dari shift Amil yang dapat diserahterimakan')
    const shifts = [...new Set(transactions.map((x) => x.shiftId))].map((id) => db.shiftSessions.find((x) => x.id === id)).filter(Boolean)
    A.modal('Buat berita acara serah terima', `<form data-v5-form="deposit-create"><div class="grid-form">${A.sel('Shift Amil', 'shiftId', shifts.map((x) => [x.id, `${A.who(x.amilId)} · ${x.openedAtLabel || x.openedAt}`]))}</div><div id="handover-estimate" class="alert light"></div>${formButton('Buat berita acara')}</form>`)
    const update = () => {
      const shiftId = document.querySelector('[data-v5-form="deposit-create"] select[name="shiftId"]')?.value
      const list = transactions.filter((x) => x.shiftId === shiftId)
      const box = $('handover-estimate')
      if (box) box.textContent = `${list.length} transaksi · ${money(sum(list, (x) => effectiveTotals(x).money))} · ${kilos(sum(list, (x) => effectiveTotals(x).rice))}`
    }
    document.querySelector('[data-v5-form="deposit-create"] select[name="shiftId"]')?.addEventListener('change', update)
    update()
  }
  function openCorrectionRequest(txId) {
    const tx = A.scoped('transactions').find((x) => x.id === txId)
    if (!tx || !['Amil', 'Operator'].includes(activeUser()?.role)) throw new Error('Permintaan koreksi hanya dapat diajukan Amil atau Operator')
    const total = effectiveTotals(tx)
    A.modal(`Ajukan koreksi ${tx.serial}`, `<div class="alert warn">Data transaksi asli tidak akan ditimpa. Permintaan ini menunggu persetujuan Bendahara.</div><form data-v5-form="correction-request" data-id="${esc(txId)}"><div class="grid-form">${A.fld('Uang yang seharusnya (Rp)', 'newMoney', total.money, 'text', 'inputmode="numeric" data-format="idr" required')}${A.fld('Beras yang seharusnya (kg)', 'newRice', total.rice, 'text', 'inputmode="decimal" data-format="kg" required')}</div>${A.textarea('Alasan koreksi (wajib)', 'reason', '')}${formButton('Kirim permintaan koreksi')}</form>`)
  }
  function openCorrectionReview(correctionId) {
    const correction = A.scoped('corrections').find((x) => x.id === correctionId)
    if (!correction || activeUser()?.role !== 'Bendahara' || correction.status !== 'menunggu') throw new Error('Koreksi tidak tersedia untuk ditinjau')
    const tx = db.transactions.find((x) => x.id === correction.transactionId)
    A.modal(`Tinjau koreksi ${tx?.serial || ''}`, `<div class="mini-list"><div class="mini-item"><span>Nilai lama</span><b>${money(correction.oldMoney)} · ${kilos(correction.oldRice)}</b></div><div class="mini-item"><span>Nilai yang diajukan</span><b>${money(correction.newMoney)} · ${kilos(correction.newRice)}</b></div><div class="mini-item"><span>Alasan</span><b>${esc(correction.reason)}</b></div></div><form data-v5-form="correction-review" data-id="${esc(correctionId)}">${A.sel('Keputusan', 'decision', [['disetujui', 'Setujui koreksi'], ['ditolak', 'Tolak koreksi']])}${A.textarea('Catatan Bendahara', 'note', '')}${formButton('Simpan keputusan')}</form>`)
  }

  document.addEventListener('submit', (event) => {
    const form = event.target.closest('form[data-v5-form]')
    if (!form) return
    event.preventDefault()
    const d = formData(form)
    const id = form.dataset.id
    try {
      switch (form.dataset.v5Form) {
        case 'muzakki-register': submitMuzakkiRegistration(d); return
        case 'self-profile': selfProfileSave(d); break
        case 'family-save': familySave(form); break
        case 'join-tenant': {
          const user = activeUser()
          if (memberForUser(user.id, d.tenantId)) throw new Error('Tenant sudah terhubung')
          const account = accountForUser()
          if (!d.address.trim()) throw new Error('Alamat tenant tujuan wajib diisi')
          let person = db.persons.find((x) => x.tenantId === d.tenantId && ((account.phone && x.phone === account.phone) || (account.email && String(x.email || '').toLowerCase() === String(account.email || '').toLowerCase())))
          if (!person) { person = { id: newId('PS'), tenantId: d.tenantId, name: account.displayName, phone: account.phone, email: account.email, address: d.address.trim() }; db.persons.push(person) }
          Object.assign(person, { address: d.address.trim(), regionType: d.regionType, regionName: d.regionType === 'VPA' ? 'Villa Pesona Asri & Marbella 2 / VPA' : 'Non VPA', rt: d.regionType === 'VPA' ? d.rt : '' })
          db.muzakkiMemberships.push({ id: newId('MBR'), userId: user.id, tenantId: d.tenantId, personId: person.id, regionType: d.regionType, regionName: d.regionType === 'VPA' ? 'Villa Pesona Asri & Marbella 2 / VPA' : 'Non VPA', rt: d.regionType === 'VPA' ? d.rt : '', joinedAt: timestamp() })
          A.aud('MUZAKKI_TENANT_JOIN', `Akun ${user.id} bergabung ke ${d.tenantId}`)
          enqueueSync('muzakki.tenant_joined', { tenantId: d.tenantId, userId: user.id, accountId: account.id, membershipId: db.muzakkiMemberships[db.muzakkiMemberships.length - 1].id, personId: person.id })
          switchTenant(d.tenantId)
          break
        }
        case 'self-transaction': submitSelfTransaction(d); return
        case 'allocation-flexible-create': createFlexibleAllocation(d); break
        case 'operator-transaction': submitOperatorTransaction(d); return
        case 'amil-verify': {
          if (activeUser()?.role !== 'Amil') throw new Error('Hanya Amil yang dapat mengesahkan transaksi')
          if (d.paymentReceived !== 'yes' || d.akadDone !== 'yes') throw new Error('Penerimaan fisik dan akad harus dikonfirmasi')
          const tx = A.scoped('transactions').find((x) => x.id === id)
          if (!tx || tx.status !== 'pending') throw new Error('Transaksi tidak lagi Pending')
          if (tx.expiresAt && new Date(tx.expiresAt).getTime() <= Date.now()) throw new Error('QR transaksi telah kedaluwarsa')
          const shift = amilShift()
          if (!shift) throw new Error('Shift Amil belum dibuka')
          tx.status = 'paid'; tx.handledBy = activeUser().id; tx.verifiedAt = timestamp(); tx.verifiedBy = activeUser().id; tx.shiftId = shift.id; tx.amilNote = d.note || ''; tx.akadConfirmed = true; tx.paymentReceived = true
          A.aud('AMIL_VERIFY', `Amil ${activeUser().name} memverifikasi ${tx.serial} dengan scan QR`)
          const person = A.person(tx.personId)
          db.notifications.push({ id: newId('NT'), tenantId: currentTenantId(), personId: tx.personId, accountId: tx.accountId || null, channel: 'app', status: 'lokal', date: dateToday(), subject: 'Pembayaran terverifikasi', message: `Terima kasih ${person?.name || ''}. Pembayaran ${tx.serial} telah diverifikasi oleh ${activeUser().name}. Bukti setor zakat dapat diunduh.` })
          enqueueSync('transaction.amil_verified', { transactionId: tx.id })
          break
        }
        case 'deposit-create': {
          if (activeUser()?.role !== 'Bendahara') throw new Error('Hanya Bendahara yang membuat berita acara')
          const txs = A.scoped('transactions').filter((x) => x.periodId === currentPeriod()?.id && x.status === 'paid' && x.shiftId === d.shiftId)
          if (!txs.length) throw new Error('Tidak ada transaksi Paid pada shift ini')
          if (A.scoped('deposits').some((x) => x.shiftId === d.shiftId)) throw new Error('Shift ini sudah memiliki berita acara setoran')
          const shift = db.shiftSessions.find((x) => x.id === d.shiftId && x.tenantId === currentTenantId() && x.status === 'closed')
          if (!shift) throw new Error('Serah terima hanya dapat dibuat setelah shift Amil ditutup')
          const deposit = { id: newId('ST'), tenantId: currentTenantId(), periodId: currentPeriod().id, amilId: shift.amilId, shiftId: shift.id, transactionIds: txs.map((x) => x.id), declaredMoney: sum(txs, (x) => effectiveTotals(x).money), declaredRice: sum(txs, (x) => effectiveTotals(x).rice), actualMoney: null, actualRice: null, status: 'menunggu', createdAt: timestamp(), stage: 1, note: '' }
          db.deposits.push(deposit)
          txs.forEach((x) => { x.status = 'disetor'; x.depositId = deposit.id })
          A.aud('SERAH_TERIMA', `Bendahara membuat berita acara ${deposit.id} dari shift ${shift.id}`)
          enqueueSync('deposit.created', { depositId: deposit.id, shiftId: shift.id })
          break
        }
        case 'deposit-stage1': {
          if (activeUser()?.role !== 'Bendahara') throw new Error('Hanya Bendahara yang menerima kas')
          const s = A.scoped('deposits').find((x) => x.id === id)
          if (!s || !['menunggu', 'selisih'].includes(s.status)) throw new Error('Tahap penerimaan fisik tidak tersedia')
          const actualMoney = toNumber(d.actualMoney), actualRice = toKg(d.actualRice)
          if (actualMoney < 0 || actualRice < 0) throw new Error('Nilai aktual tidak boleh negatif')
          const diff = Math.abs(actualMoney - s.declaredMoney) > 0.001 || Math.abs(actualRice - s.declaredRice) > 0.001
          if (diff && !d.note.trim()) throw new Error('Catatan selisih wajib diisi')
          Object.assign(s, { actualMoney, actualRice, handoverNote: d.note, stage1By: activeUser().id, stage1At: timestamp(), status: diff ? 'selisih' : 'kas_diterima', stage: 2 })
          A.aud('REKONSILIASI_STAGE1', `${s.id} penerimaan kas ${s.status}`)
          enqueueSync('deposit.cash_reconciled', { depositId: s.id })
          break
        }
        case 'deposit-stage2': {
          if (activeUser()?.role !== 'Bendahara') throw new Error('Hanya Bendahara yang merekonsiliasi rekening')
          const s = A.scoped('deposits').find((x) => x.id === id)
          if (!s || !['kas_diterima', 'selisih_bank'].includes(s.status)) throw new Error('Selesaikan penerimaan fisik sebelum tahap rekening')
          const bankMoney = toNumber(d.bankMoney), bankRice = toKg(d.bankRice)
          const diff = Math.abs(bankMoney - s.actualMoney) > 0.001 || Math.abs(bankRice - s.actualRice) > 0.001
          if (diff && !d.note.trim()) throw new Error('Catatan selisih rekening wajib diisi')
          Object.assign(s, { bankMoney, bankRice, bankReference: d.bankReference, bankNote: d.note, bankCheckedBy: activeUser().id, bankCheckedAt: timestamp(), status: diff ? 'selisih_bank' : 'terverifikasi', stage: 3 })
          if (!diff) {
            s.transactionIds.forEach((txId) => { const tx = db.transactions.find((x) => x.id === txId && x.tenantId === currentTenantId()); if (tx) tx.status = 'terverifikasi' })
            ledgerRecordForDeposit(s)
          }
          A.aud('REKONSILIASI_STAGE2', `${s.id} rekening ${s.status} referensi ${d.bankReference || '—'}`)
          enqueueSync('deposit.bank_reconciled', { depositId: s.id })
          break
        }
        case 'batch-create': {
          if (activeUser()?.role !== 'Bendahara') throw new Error('Hanya Bendahara yang membentuk batch')
          const alloc = A.scoped('allocations').find((x) => x.id === d.allocationId && x.status === 'disetujui')
          if (!alloc) throw new Error('Alokasi harus disetujui Pengurus')
          const already = new Set(A.scoped('batches').filter((x) => x.allocationId === alloc.id).flatMap((x) => x.itemIds))
          const selected = d.mustahikIds.trim() ? d.mustahikIds.split(/[\s,]+/).filter(Boolean) : alloc.items.map((x) => x.mustahikId)
          const ids = [...new Set(selected)].filter((x) => alloc.items.some((i) => i.mustahikId === x) && !already.has(x) && !A.scoped('distributions').some((dist) => dist.allocationId === alloc.id && dist.mustahikId === x))
          if (!ids.length) throw new Error('Batch tidak memiliki penerima baru dari alokasi ini')
          const batch = { id: newId('BT'), tenantId: currentTenantId(), periodId: alloc.periodId, allocationId: alloc.id, allocationName: alloc.name, name: d.name.trim(), volunteerId: d.volunteerId, plannedDate: d.plannedDate, itemIds: ids, completed: 0, status: 'siap', createdAt: timestamp(), createdBy: activeUser().id }
          db.batches.push(batch)
          A.aud('BATCH_CREATE', `Bendahara membuat ${batch.name} untuk ${A.who(batch.volunteerId)} dengan ${ids.length} penerima`)
          enqueueSync('batch.created', { batchId: batch.id })
          break
        }
        case 'correction-request': {
          if (!['Amil', 'Operator'].includes(activeUser()?.role)) throw new Error('Hanya Amil atau Operator yang dapat mengajukan koreksi')
          const tx = A.scoped('transactions').find((x) => x.id === id)
          if (!tx || !['paid', 'disetor', 'kas_diterima', 'terverifikasi'].includes(tx.status)) throw new Error('Transaksi belum berada pada status yang dapat dikoreksi')
          if (!d.reason.trim()) throw new Error('Alasan koreksi wajib diisi')
          const total = effectiveTotals(tx), newMoney = toNumber(d.newMoney), newRice = toKg(d.newRice)
          if (newMoney < 0 || newRice < 0) throw new Error('Nominal koreksi tidak boleh negatif')
          db.corrections.push({ id: newId('CR'), tenantId: currentTenantId(), transactionId: tx.id, requestedBy: activeUser().id, createdAt: timestamp(), oldMoney: total.money, oldRice: total.rice, newMoney, newRice, deltaMoney: newMoney - total.money, deltaRice: newRice - total.rice, reason: d.reason.trim(), status: 'menunggu' })
          A.aud('KOREKSI_REQUEST', `Permintaan koreksi ${tx.serial} diajukan oleh ${activeUser().name}`)
          enqueueSync('correction.requested', { correctionId: db.corrections[db.corrections.length - 1].id })
          break
        }
        case 'correction-review': {
          if (activeUser()?.role !== 'Bendahara') throw new Error('Hanya Bendahara yang dapat memutus koreksi')
          const correction = A.scoped('corrections').find((x) => x.id === id && x.status === 'menunggu')
          if (!correction) throw new Error('Permintaan koreksi tidak tersedia')
          if (d.decision === 'disetujui') {
            const tx = db.transactions.find((x) => x.id === correction.transactionId && x.tenantId === currentTenantId())
            if (!tx) throw new Error('Transaksi asal tidak ditemukan')
            const prior = effectiveTotals(tx)
            correction.deltaMoney = correction.newMoney - prior.money; correction.deltaRice = correction.newRice - prior.rice
            if (prior.money + correction.deltaMoney < 0 || prior.rice + correction.deltaRice < 0) throw new Error('Koreksi menghasilkan nilai negatif')
            correction.status = 'disetujui'
            if (correction.deltaMoney > 0) addJournal({ code: 'ADJ+', description: 'Penambahan terkendali penerimaan transaksi', debit: correction.deltaMoney, credit: correction.deltaMoney, accountDebit: 'Kas/Bank', accountCredit: 'Dana Zakat', reference: correction.id, by: activeUser().id })
            if (correction.deltaMoney < 0) addJournal({ code: 'ADJ-', description: 'Pengurangan terkendali penerimaan transaksi', debit: Math.abs(correction.deltaMoney), credit: Math.abs(correction.deltaMoney), accountDebit: 'Dana Zakat', accountCredit: 'Kas/Bank', reference: correction.id, unit: 'IDR', by: activeUser().id })
            if (correction.deltaRice > 0) addJournal({ code: 'ADJ-RICE+', description: 'Penambahan terkendali penerimaan beras', debit: correction.deltaRice, credit: correction.deltaRice, accountDebit: 'Persediaan Beras', accountCredit: 'Dana Zakat - Beras', reference: correction.id, unit: 'kg', by: activeUser().id })
            if (correction.deltaRice < 0) addJournal({ code: 'ADJ-RICE-', description: 'Pengurangan terkendali penerimaan beras', debit: Math.abs(correction.deltaRice), credit: Math.abs(correction.deltaRice), accountDebit: 'Dana Zakat - Beras', accountCredit: 'Persediaan Beras', reference: correction.id, unit: 'kg', by: activeUser().id })
          } else {
            correction.status = 'ditolak'
          }
          correction.reviewedBy = activeUser().id; correction.reviewedAt = timestamp(); correction.reviewNote = d.note || ''
          A.aud('KOREKSI_REVIEW', `Bendahara ${correction.status} ${correction.id}`)
          enqueueSync('correction.reviewed', { correctionId: correction.id })
          break
        }
        case 'allocation-review': {
          if (activeUser()?.role !== 'Pengurus') throw new Error('Hanya Pengurus yang menyetujui program penyaluran')
          const alloc = A.scoped('allocations').find((x) => x.id === id && x.status === 'diajukan')
          if (!alloc) throw new Error('Rencana tidak menunggu keputusan')
          if (d.decision === 'ditolak' && !d.note.trim()) throw new Error('Alasan penolakan wajib diisi')
          alloc.status = d.decision; alloc.reviewedBy = activeUser().id; alloc.reviewedAt = timestamp(); alloc.reviewNote = d.note
          A.aud('APPROVAL', `Pengurus ${d.decision} alokasi ${alloc.id}`)
          enqueueSync('allocation.reviewed', { allocationId: alloc.id })
          break
        }
        case 'support': {
          if (!d.subject.trim() || !d.description.trim()) throw new Error('Judul dan uraian wajib diisi')
          const ticket = { id: newId('SP'), tenantId: currentTenantId(), userId: activeUser().id, role: activeUser().role, kind: d.kind, priority: d.priority, subject: d.subject.trim(), description: d.description.trim(), contact: d.contact.trim(), status: 'baru', createdAt: timestamp() }
          db.supportTickets.push(ticket)
          enqueueSync('support.created', { ticketId: ticket.id, kind: ticket.kind, priority: ticket.priority })
          A.aud('SUPPORT', `Tiket dukungan ${ticket.id} dibuat`)
          A.toast('Laporan bantuan tersimpan di browser ini')
          break
        }
        case 'tenant-profile': {
          if (activeUser()?.role !== 'Admin') throw new Error('Hanya Admin yang mengubah identitas tenant')
          const tenant = A.tenant()
          Object.assign(tenant, { name: d.name.trim(), daerah: d.daerah.trim(), phone: d.phone.trim(), email: d.email.trim(), upzType: d.upzType.trim(), baznasArea: d.baznasArea.trim(), address: d.address.trim() })
          A.aud('TENANT_PROFILE', 'Profil dan identitas UPZ diperbarui')
          enqueueSync('tenant.profile_updated', { tenantId: tenant.id })
          break
        }
        case 'operator-person': {
          if (!['Admin', 'Operator', 'Amil'].includes(activeUser()?.role)) throw new Error('Akses input Muzakki ditolak')
          if (!d.name.trim() || !d.address.trim() || (!d.phone.trim() && !d.email.trim())) throw new Error('Nama, alamat dan minimal satu kontak wajib diisi')
          const p = { id: newId('PS'), tenantId: currentTenantId(), name: d.name.trim(), phone: d.phone.trim(), email: d.email.trim(), address: d.address.trim(), regionType: d.regionType, rt: d.regionType === 'VPA' ? d.rt : '' }
          db.persons.push(p)
          db.muzakki.push({ id: newId('MZ'), tenantId: currentTenantId(), personId: p.id, cardCode: `KZM-${currentTenantId().split('-').pop()}-${String(A.scoped('muzakki').length + 1).padStart(4, '0')}`, active: true })
          A.aud('MUZAKKI', `Muzakki walk-in ${p.name} didaftarkan`)
          break
        }
        case 'zakat-calc': {
          const rules = A.rule()
          const count = Math.max(1, Number(d.calcCount || 1))
          let value = 0, detail = ''
          if (d.calcType === 'fitrah') { value = count * (d.calcMedia === 'beras' ? rules.riceRate : rules.moneyRate); detail = `${count} jiwa × tarif fitrah tenant` }
          else if (d.calcType === 'maal') { const nisab = Number(rules.nisabGoldGram || 85) * toNumber(d.goldPrice || rules.goldPricePerGram || 1500000); value = toNumber(d.assetsValue || 0) >= nisab ? toNumber(d.assetsValue) * 0.025 : 0; detail = `Nisab ilustratif ${money(nisab)}. Tarif simulasi 2,5 persen` }
          else if (d.calcType === 'fidyah') { value = count * Number(rules.fidyahRate || 30000); detail = `${count} hari × tarif fidyah tenant` }
          else if (d.calcType === 'kafarat') { value = count * Number(rules.kafaratRate || 0); detail = 'Tarif perlu ditetapkan pembimbing dan pengurus' }
          else { value = toNumber(d.assetsValue || 0); detail = 'Infak atau sedekah sesuai kemampuan' }
          const target = $('zakat-calc-result')
          if (target) target.innerHTML = `<b>Estimasi: ${d.calcMedia === 'beras' && d.calcType === 'fitrah' ? kilos(value) : money(value)}</b><p>${esc(detail)}</p><small>Perhitungan edukatif. Nisab dan tarif perlu verifikasi kebijakan tenant.</small>`
          return
        }
        default: return
      }
      A.persist()
      if (state.modal) state.modal = null
      A.render()
      if (form.dataset.v5Form === 'amil-verify') { const verified = db.transactions.find((x) => x.id === id && x.tenantId === currentTenantId()); if (verified) showReceiptV5(verified) }
      updateConnectionBadge()
    } catch (error) { console.error(error); A.toast(error.message || String(error), 'error') }
  })

  function openDepositBatchModalIfNeeded() {}

  // Existing workbook-stage functions are retained and remain available to authorized treasury users.
  window.addEventListener('sizisnur-v5-workbook', (event) => {
    if (activeUser()?.role !== 'Bendahara') return A.toast('Hanya Bendahara yang dapat menyiapkan rencana alokasi', 'error')
    const stage = event.detail.stage
    const actionButton = document.querySelector(`[data-action="workbook-stage-new"][data-stage="${stage}"]`)
    if (actionButton) actionButton.click()
    else A.toast('Buka menu Acuan Workbook untuk menyiapkan tahap', 'info')
  })

  // Keep the old legacy action for receipt printing compatible while upgrading its output.
  const legacyShowReceipt = A.showReceipt
  A.showReceipt = showReceiptV5

  // Local-first storage status and opt-in network synchronization.
  updateConnectionBadge()
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && typeof location !== 'undefined' && location.protocol.startsWith('http')) navigator.serviceWorker.register('./service-worker.js').catch(() => {})
  trySync()
  state.page = activeUser()?.role === 'Muzakki' ? 'my-zis' : state.page
  A.persist()
  A.render()
})()
