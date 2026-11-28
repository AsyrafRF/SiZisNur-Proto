/* SiZisNur — Portal Zakat Publik & Pendataan Mandiri.
 * EVALUASI SIMULASI ONLY: data is localStorage-only, OTP is displayed in-browser,
 * and this module MUST NOT be presented as production-grade public intake.
 */
(function () {
  'use strict'
  const A = window.__SiZisNurBridge
  if (!A) throw new Error('SiZisNur core bridge is missing')
  const state = A.state
  const $ = (id) => document.getElementById(id)
  const esc = A.e
  const TERMINAL = new Set(['batal', 'expired', 'kedaluwarsa', 'ditolak'])
  // Hanya status yang belum disahkan sebagai pembayaran yang memblokir rencana baru.
  // Status Paid/disetor/terverifikasi tetap dapat dilihat pada riwayat, tetapi bukan unpaid.
  const UNPAID_STATUSES = new Set(['pending'])
  const CANCELABLE_SOURCES = new Set(['public-intake', 'self-service'])
  const transactionPolicy = window.__SIZISNUR_TRANSACTION_POLICY
  const TRANSACTION_TTL_MS = transactionPolicy?.ttlMs || 2 * 60 * 60 * 1000
  function transactionExpiresAt(createdAt) {
    if (transactionPolicy?.expiresAt) return transactionPolicy.expiresAt(createdAt)
    const createdAtMs = Date.parse(createdAt || '')
    return new Date((Number.isFinite(createdAtMs) ? createdAtMs : 0) + TRANSACTION_TTL_MS).toISOString()
  }
  function transactionExpiryReached(tx) {
    if (transactionPolicy?.isExpired) return transactionPolicy.isExpired(tx)
    const expiryMs = Date.parse(tx?.expiresAt || '')
    return !Number.isFinite(expiryMs) || expiryMs <= Date.now()
  }
  const DEMO_NOTICE = 'TAHAP EVALUASI SIMULASI — Portal ini belum menggunakan backend standar aman untuk produksi. OTP hanya dibuat dan ditampilkan di browser; tidak ada WhatsApp, SMS, atau email sungguhan. Data tersimpan lokal pada browser ini. Jangan gunakan data pribadi atau transaksi nyata.'
  let intakeSession = null
  let selectedManagerLinkId = null

  const db = () => A.db
  function ensureCollections() {
    const data = db()
    data.publicIntakeLinks ||= []
    data.audit ||= []
    data.persons ||= []
    data.muzakki ||= []
    data.transactions ||= []
    data.deposits ||= []
    data.notifications ||= []
    return data
  }
  function tenantById(id) { return db().tenants?.find((item) => item.id === id) || null }
  function activePeriod(tenantId) {
    return db().periods?.find((item) => item.tenantId === tenantId && item.status === 'aktif') || null
  }
  function linksForTenant(tenantId) {
    return (db().publicIntakeLinks || []).filter((item) => item.tenantId === tenantId).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
  }
  function findLink(token) {
    if (!token) return null
    return (db().publicIntakeLinks || []).find((item) => item.token === token) || null
  }
  function createToken() {
    const cryptoApi = window.crypto
    if (!cryptoApi?.getRandomValues) throw new Error('Browser tidak menyediakan pembangkit token acak yang aman. Gunakan browser modern untuk membuat QR simulasi.')
    const bytes = new Uint8Array(24)
    cryptoApi.getRandomValues(bytes)
    return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('')
  }
  function portalUrl(token) {
    const locationObject = window.location || (typeof location !== 'undefined' ? location : null)
    if (!locationObject?.href) return `?portal=${encodeURIComponent(token)}`
    const url = new URL(locationObject.href)
    url.searchParams.set('portal', token)
    url.hash = ''
    return url.toString()
  }
  function createLink() {
    const user = A.user()
    if (!user || !['Admin', 'Amil', 'Operator'].includes(user.role) || !user.tenantId) throw new Error('Hanya Admin, Amil, atau Operator lembaga yang dapat menerbitkan tautan publik.')
    const tenantId = A.session?.tenantId || user.tenantId
    const tenant = tenantById(tenantId)
    if (!tenant || tenant.status !== 'aktif') throw new Error('Lembaga tidak aktif atau tidak ditemukan.')
    if (tenant.publicPortalEnabled === false) throw new Error('Portal publik lembaga sedang dinonaktifkan oleh Admin SiZisNur.')
    const period = activePeriod(tenantId)
    if (!period) throw new Error('Belum ada periode zakat aktif. Admin perlu membuka periode sebelum QR formulir diterbitkan.')
    const record = {
      id: A.id('PLI'), tenantId, periodId: period.id, token: createToken(), active: true,
      createdBy: user.id, createdAt: A.now(), revokedAt: null,
      label: `Formulir publik · ${period.name || 'Periode aktif'}`,
      simulationOnly: true,
    }
    ensureCollections().publicIntakeLinks.unshift(record)
    selectedManagerLinkId = record.id
    audit(tenantId, 'PUBLIC_INTAKE_LINK_CREATED', `Tautan formulir publik ${record.id} diterbitkan untuk ${period.name || period.id}`)
    A.persist()
    return record
  }
  function audit(tenantId, type, detail) {
    const data = ensureCollections()
    data.audit.unshift({ id: A.id('AU'), tenantId, at: A.now(), by: 'Portal Zakat Publik (simulasi)', type, detail })
  }
  function revokeLink(linkId) {
    const user = A.user()
    if (!user || !['Admin', 'Amil', 'Operator'].includes(user.role)) throw new Error('Akses pencabutan tautan ditolak.')
    const tenantId = A.session?.tenantId || user.tenantId
    const link = (db().publicIntakeLinks || []).find((item) => item.id === linkId && item.tenantId === tenantId)
    if (!link) throw new Error('Tautan tidak ditemukan pada lembaga ini.')
    if (!link.active) throw new Error('Tautan sudah dicabut.')
    link.active = false
    link.revokedAt = A.now()
    link.revokedBy = user.id
    audit(tenantId, 'PUBLIC_INTAKE_LINK_REVOKED', `Tautan formulir publik ${link.id} dicabut`)
    A.persist()
  }
  function copyText(value) {
    if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value).then(() => A.toast('Tautan disalin.', 'success'))
    const input = document.createElement('textarea')
    input.value = value
    input.style.position = 'fixed'
    input.style.opacity = '0'
    document.body.appendChild(input)
    input.select()
    const copied = document.execCommand?.('copy')
    input.remove()
    if (!copied) throw new Error('Browser tidak mengizinkan penyalinan otomatis. Salin tautan dari kolom yang tersedia.')
    A.toast('Tautan disalin.', 'success')
  }
  function managerView() {
    const user = A.user()
    if (!user || !['Admin', 'Amil', 'Operator'].includes(user.role)) return `<div class="alert danger">Menu ini hanya tersedia bagi Admin, Amil, dan Operator lembaga.</div>`
    const tenantId = A.session?.tenantId || user.tenantId
    const tenant = tenantById(tenantId)
    if (!tenant) return `<div class="alert warn">Akun ini belum terhubung dengan lembaga aktif.</div>`
    const period = activePeriod(tenantId)
    const links = linksForTenant(tenantId)
    const selected = links.find((item) => item.id === selectedManagerLinkId) || links.find((item) => item.active) || links[0] || null
    selectedManagerLinkId = selected?.id || null
    const selectedUrl = selected ? portalUrl(selected.token) : ''
    const qr = selected ? A.qr(selectedUrl) : ''
    const qrCard = selected ? `<section class="card pi-qr-card"><div class="pi-card-heading"><div><h3>QR dan tautan formulir</h3><p>Bagikan kepada warga melalui WhatsApp atau cetak untuk banner/meja pelayanan.</p></div>${selected.active ? '<span class="tag ok">Aktif</span>' : '<span class="tag bad">Dicabut</span>'}</div><div class="pi-qr-layout"><div class="pi-qr-code">${qr}<small>QR FORMULIR PUBLIK · SIMULASI</small></div><div class="pi-qr-details"><b>${esc(tenant.name)}</b><span>${esc(period?.name || 'Periode tidak aktif')}</span><label for="pi-selected-url">Alamat tautan demo</label><input id="pi-selected-url" readonly value="${esc(selectedUrl)}"><div class="actions"><button type="button" class="btn sm" data-public-intake-action="copy-link" data-id="${esc(selected.id)}">Salin tautan</button><button type="button" class="btn sm" data-public-intake-action="share-wa" data-id="${esc(selected.id)}">WhatsApp</button><button type="button" class="btn sm" data-public-intake-action="print-banner" data-id="${esc(selected.id)}">Cetak banner</button></div>${selected.active ? `<button type="button" class="btn sm primary" data-public-intake-action="preview" data-id="${esc(selected.id)}">Pratinjau formulir</button>` : ''}<p class="caption">Link dan QR menyimpan token pada database demo lokal. Perangkat berbeda tidak berbagi database pada prototype ini.</p></div></div></section>` : `<section class="card pi-qr-card"><div class="empty">Belum ada tautan publik. Terbitkan satu untuk melihat QR dan pratinjau formulir.</div></section>`
    const rows = links.map((item) => {
      const linkPeriod = db().periods?.find((periodItem) => periodItem.id === item.periodId && periodItem.tenantId === tenantId)
      const isSelected = selected?.id === item.id
      const isActive = item.active && linkPeriod?.status === 'aktif' && tenant.status === 'aktif'
      return `<tr><td><b>${esc(item.label || 'Formulir publik')}</b><div class="tiny mono">${esc(item.id)}</div></td><td>${esc(linkPeriod?.name || 'Periode arsip')}</td><td>${esc(new Date(item.createdAt).toLocaleString('id-ID'))}</td><td>${isActive ? '<span class="tag ok">Aktif</span>' : '<span class="tag bad">Tidak aktif</span>'}</td><td><div class="actions"><button type="button" class="btn sm" data-public-intake-action="select-link" data-id="${esc(item.id)}">${isSelected ? 'Dipilih' : 'QR'}</button>${item.active ? `<button type="button" class="btn sm danger" data-public-intake-action="revoke" data-id="${esc(item.id)}">Cabut</button>` : ''}</div></td></tr>`
    }).join('')
    return `${A.boxhead('Formulir Publik & QR Warga', 'Terbitkan tautan khusus lembaga agar warga dapat mengisi identitas dan rencana zakat tanpa akun SiZisNur.', period ? `<button class="btn primary" type="button" data-public-intake-action="create-link">Terbitkan tautan / QR</button>` : '')}
      <div class="alert warn pi-simulation-notice"><b>TAHAP EVALUASI SIMULASI — BELUM SIAP PRODUKSI.</b><br>${esc(DEMO_NOTICE)}</div>
      <section class="card pi-tenant-summary"><div><small>LEMBAGA</small><b>${esc(tenant.name)}</b><span>${esc(tenant.publicCode || tenant.id)} · ${esc(tenant.daerah || 'Daerah belum diatur')}</span></div><div><small>PERIODE</small><b>${esc(period?.name || 'Belum ada periode aktif')}</b><span>${period ? 'Formulir dapat menerima rencana zakat' : 'Aktifkan periode dari menu Periode Zakat terlebih dahulu'}</span></div></section>
      ${!period ? '<div class="alert warn">Belum ada periode zakat aktif. QR formulir belum dapat diterbitkan sampai Admin membuka periode.</div>' : ''}
      <section class="card"><div class="pi-card-heading"><div><h3>Daftar tautan publik</h3><p>Setiap tautan terikat pada satu lembaga dan satu periode ketika diterbitkan.</p></div><span class="tag info">${links.length} tautan</span></div>${links.length ? A.table(['Nama / ID tautan','Periode','Diterbitkan','Status','Aksi'], links.map((item) => { const p = db().periods?.find((x) => x.id === item.periodId && x.tenantId === tenantId); return [ `<b>${esc(item.label || 'Formulir publik')}</b><div class="tiny mono">${esc(item.id)}</div>`, esc(p?.name || 'Periode arsip'), esc(new Date(item.createdAt).toLocaleDateString('id-ID')), item.active && p?.status === 'aktif' ? '<span class="tag ok">Aktif</span>' : '<span class="tag bad">Tidak aktif</span>', `<div class="actions"><button type="button" class="btn sm" data-public-intake-action="select-link" data-id="${esc(item.id)}">Lihat QR</button>${item.active ? `<button type="button" class="btn sm danger" data-public-intake-action="revoke" data-id="${esc(item.id)}">Cabut</button>` : ''}</div>` ] })) : '<div class="empty">Belum ada tautan publik diterbitkan.</div>'}</section>
      ${qrCard}
      <div class="alert light"><b>Petunjuk lapangan:</b> cetak QR pada banner, letakkan di area pelayanan, atau bagikan tautan melalui WhatsApp. Warga mengisi sendiri, lalu menunjukkan QR transaksi kepada Amil untuk pemeriksaan identitas, akad, dan penerimaan fisik. QR formulir berbeda dari QR transaksi.</div>`
  }

  function resetIntake(token) {
    intakeSession = { token, stage: 'identity', identity: null, otp: null, otpExpiresAt: 0, otpAttempts: 0, otpResends: 0, otpLastSentAt: 0, otpChallenges: [], verifiedUntil: 0, personId: null, transactionIds: [], cancelTxId: null, error: '' }
    return intakeSession
  }
  function sessionFor(token) {
    if (!intakeSession || intakeSession.token !== token) resetIntake(token)
    return intakeSession
  }
  function currentPublicContext() {
    const token = state.publicIntakeToken || queryToken()
    const link = findLink(token)
    if (!link) return { error: 'Tautan formulir tidak ditemukan. Periksa QR atau minta tautan terbaru kepada petugas.', token }
    if (!link.active) return { error: 'Tautan formulir ini telah dicabut oleh pengelola lembaga.', token, link }
    if (link.expiresAt && new Date(link.expiresAt).getTime() <= Date.now()) return { error: 'Tautan formulir telah kedaluwarsa. Minta QR terbaru kepada petugas.', token, link }
    const tenant = tenantById(link.tenantId)
    if (!tenant || tenant.status !== 'aktif' || tenant.publicPortalEnabled === false) return { error: 'Lembaga tidak tersedia atau Portal Publik sedang dinonaktifkan.', token, link }
    const period = activePeriod(link.tenantId)
    if (!period || period.id !== link.periodId) return { error: 'Periode pada tautan ini sudah tidak aktif. Minta tautan baru kepada petugas lembaga.', token, link, tenant }
    return { token, link, tenant, period }
  }
  function queryToken() {
    try {
      const search = (window.location || location).search || ''
      return new URLSearchParams(search).get('portal') || ''
    } catch (_) { return '' }
  }
  function simulationBanner() { return `<div class="alert warn pi-simulation-notice"><b>TAHAP EVALUASI SIMULASI — BELUM MENGGUNAKAN BACKEND STANDAR AMAN PRODUKSI.</b><br>${esc(DEMO_NOTICE)}</div>` }
  function publicHeader(tenant, period) {
    const locationLabel = [tenant.daerah, tenant.kelurahan, tenant.kecamatan, tenant.city, tenant.province].filter(Boolean).join(' · ')
    return `<header class="pi-public-head"><div class="pi-public-brand"><img src="assets/sizisnur-logo-mark.png" alt="SiZisNur"><div><b>${esc(tenant.name)}</b><small>${esc(tenant.publicCode || tenant.id)} · ${esc(locationLabel || 'Wilayah lembaga')}</small></div></div><span class="tag info">${esc(period.name || 'Periode aktif')}</span></header>`
  }
  function identityForm(ctx, session) {
    const tenantId = ctx.link.tenantId
    let domicilePerson = session.identity ? {
      domicileStatus: session.identity.domicileStatus, areaId: session.identity.areaId,
      rwId: session.identity.rwId, rtId: session.identity.rtId,
    } : null
    if (!domicilePerson) {
      const area = db().areas?.find((item) => item.tenantId === tenantId && item.active !== false)
      const rw = area && db().rws?.find((item) => item.tenantId === tenantId && item.areaId === area.id && item.active !== false)
      const rt = rw && db().rts?.find((item) => item.tenantId === tenantId && item.rwId === rw.id && item.active !== false)
      domicilePerson = area && rw && rt ? { domicileStatus: 'warga_daerah', areaId: area.id, rwId: rw.id, rtId: rt.id } : { domicileStatus: 'non_daerah' }
    }
    const domicileFields = window.__SIZISNUR_DOMICILE_FIELDS
      ? window.__SIZISNUR_DOMICILE_FIELDS(domicilePerson, tenantId)
      : '<div class="alert warn">Master wilayah lembaga belum tersedia. Hubungi Admin lembaga.</div>'
    return `<section class="card pi-form-card"><div class="pi-step-label">LANGKAH 1 DARI 3 · IDENTITAS</div><h2>Isi data diri Anda</h2><p>Anda tidak perlu mendaftar akun atau login SiZisNur. Gunakan kontak aktif untuk menerima kode verifikasi simulasi.</p><form data-public-intake-form="identity" data-tenant-id="${esc(tenantId)}">
      <div class="grid-form"><div class="field"><label for="pi-name">Nama lengkap *</label><input id="pi-name" name="name" required autocomplete="name" value="${esc(session.identity?.name || '')}"></div><div class="field"><label for="pi-phone">Nomor WhatsApp / HP *</label><input id="pi-phone" name="phone" type="tel" required autocomplete="tel" placeholder="08xxxxxxxxxx" value="${esc(session.identity?.phone || '')}"></div><div class="field"><label for="pi-email">Email (opsional)</label><input id="pi-email" name="email" type="email" autocomplete="email" placeholder="nama@email.com" value="${esc(session.identity?.email || '')}"></div><div class="full" data-domicile-fields>${domicileFields}</div><div class="field full"><label for="pi-address">Alamat lengkap *</label><textarea id="pi-address" name="address" rows="3" required>${esc(session.identity?.address || '')}</textarea></div><div class="field"><label for="pi-otp-channel">Kirim OTP simulasi ke *</label><select id="pi-otp-channel" name="otpChannel"><option value="whatsapp" ${session.identity?.otpChannel !== 'email' ? 'selected' : ''}>Nomor WhatsApp</option><option value="email" ${session.identity?.otpChannel === 'email' ? 'selected' : ''}>Email (isi email terlebih dahulu)</option></select></div></div>
      <div class="alert light">Jika memilih warga daerah, pilih RW dan RT sesuai Master Wilayah yang diatur Admin lembaga. Warga dari luar daerah tidak perlu memilih RW/RT lembaga. Sistem akan memeriksa transaksi pada lembaga dan periode ini setelah kode diverifikasi.</div>
      <label class="check pi-consent"><input type="checkbox" name="consent" value="yes" required> Saya memahami bahwa ini formulir evaluasi simulasi, data disimpan lokal pada browser, dan saya tidak boleh memasukkan data pribadi atau pembayaran nyata.</label>
      <div class="form-actions"><button type="submit" class="btn primary">Lanjutkan · Buat OTP demo</button></div></form></section>`
  }
  function maskContact(value, channel) {
    const text = String(value || '')
    if (channel === 'email') { const [name, domain] = text.split('@'); return `${(name || '').slice(0, 2)}•••@${domain || '•••'}` }
    return text.length > 5 ? `${text.slice(0, 3)}••••${text.slice(-3)}` : '••••••'
  }
  function createOtp() {
    if (!window.crypto?.getRandomValues) throw new Error('Browser tidak menyediakan pembangkit OTP simulasi yang memadai. Gunakan browser modern.')
    const bytes = new Uint32Array(1)
    window.crypto.getRandomValues(bytes)
    return String(bytes[0] % 1000000).padStart(6, '0')
  }
  function otpForm(ctx, session) {
    const channel = session.identity.otpChannel
    const contact = channel === 'email' ? session.identity.email : session.identity.phone
    const challenges = session.otpChallenges?.length ? session.otpChallenges : [{ channel: channel === 'email' ? 'email' : 'whatsapp', code: session.otp }]
    const codeCards = challenges.map((item) => `<div class="pi-demo-otp"><small>KODE OTP DEMO · ${item.channel === 'email' ? 'EMAIL' : 'WHATSAPP'} · TIDAK DIKIRIM KE WHATSAPP / EMAIL</small><strong>${esc(item.code)}</strong><span>${item.channel === 'email' ? esc(maskContact(session.identity.email, 'email')) : esc(maskContact(session.identity.phone, 'phone'))}</span></div>`).join('')
    const fields = challenges.map((item) => {
      const contactValue = item.channel === 'email' ? session.identity.email : session.identity.phone
      if (item.status === 'verified') return `<div class="alert light">✓ ${item.channel === 'email' ? 'Email' : 'Nomor HP'} ${esc(maskContact(contactValue, item.channel))} sudah diverifikasi.</div>`
      const inputName = item.channel === channel ? 'otp' : `otp_${item.channel === 'email' ? 'email' : 'phone'}`
      return `<div class="field"><label for="pi-otp-${item.channel}">Kode OTP ${item.channel === 'email' ? 'Email' : 'Nomor HP'} · ${esc(maskContact(contactValue, item.channel))}</label><input id="pi-otp-${item.channel}" name="${inputName}" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" required></div>`
    }).join('')
    return `<section class="card pi-form-card"><div class="pi-step-label">LANGKAH 2 DARI 3 · VERIFIKASI KONTAK</div><h2>Verifikasi identitas kontak</h2><p>Nomor HP wajib diverifikasi. Email juga diverifikasi bila diisi. Setiap kode berlaku 5 menit, maksimal 5 percobaan, dan maksimal 3 kali kirim ulang dengan jeda 30 detik.</p>${codeCards}<form data-public-intake-form="otp">${fields}<div class="form-actions"><button type="submit" class="btn primary">Verifikasi kode</button><button type="button" class="btn" data-public-intake-action="resend-otp">Buat ulang OTP demo</button><button type="button" class="btn ghost" data-public-intake-action="back-identity">Ubah data</button></div></form>${session.otpAttempts ? `<p class="caption">Percobaan gagal: ${session.otpAttempts}/5.</p>` : ''}</section>`
  }
  function normalizePhone(value) {
    let digits = String(value || '').replace(/\D/g, '')
    if (digits.startsWith('62')) digits = `0${digits.slice(2)}`
    else if (digits.startsWith('8')) digits = `0${digits}`
    return digits
  }
  function normalizeEmail(value) { return String(value || '').trim().toLowerCase() }
  function normalizeName(value) { return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ') }
  function identityLookup(tenantId, identity) {
    const persons = db().persons.filter((person) => person.tenantId === tenantId)
    const phone = normalizePhone(identity.phone)
    const email = normalizeEmail(identity.email)
    const primary = identity.otpChannel === 'email'
      ? persons.filter((person) => email && normalizeEmail(person.email) === email)
      : persons.filter((person) => phone && normalizePhone(person.phone) === phone)
    const secondary = identity.otpChannel === 'email'
      ? persons.filter((person) => phone && normalizePhone(person.phone) === phone)
      : persons.filter((person) => email && normalizeEmail(person.email) === email)
    const primaryIds = new Set(primary.map((item) => item.id))
    const secondaryIds = new Set(secondary.map((item) => item.id))
    if (primary.length > 1) return { ambiguous: true, reason: 'Kontak terverifikasi terhubung ke lebih dari satu data warga. Petugas perlu memeriksa identitas secara langsung.' }
    if (primary.length === 1) {
      const found = primary[0]
      if (secondary.length && !secondaryIds.has(found.id)) return { ambiguous: true, reason: 'Nomor HP dan email mengarah ke data yang berbeda. Hubungi petugas agar data tidak tertukar.' }
      if (normalizeName(found.name) !== normalizeName(identity.name)) return { ambiguous: true, reason: 'Kontak ditemukan, tetapi nama tidak cocok dengan data sebelumnya. Petugas perlu memeriksa identitas sebelum transaksi dilanjutkan.' }
      return { person: found }
    }
    if (secondary.length) return { ambiguous: true, reason: 'Kontak tambahan cocok dengan data lain, tetapi kontak yang diverifikasi belum cocok. Gunakan kontak pemilik data yang benar atau hubungi petugas.' }
    return { person: null }
  }
  function terminal(tx) { return TERMINAL.has(String(tx.status || '').toLowerCase()) }
  function unpaid(tx) { return UNPAID_STATUSES.has(String(tx.status || '').toLowerCase()) }
  function expireIfNeeded(tx) {
    if (!tx || tx.status !== 'pending') return false
    const period = db().periods.find((item) => item.id === tx.periodId && item.tenantId === tx.tenantId)
    const expiredByTime = transactionExpiryReached(tx)
    const expiredByPeriod = period && ['ditutup', 'closed', 'selesai'].includes(String(period.status || '').toLowerCase())
    if (!expiredByTime && !expiredByPeriod) return false
    tx.status = 'expired'
    tx.expiredAt = A.now()
    tx.expiryReason = expiredByTime
      ? 'Batas waktu verifikasi Amil selama 2 jam telah berakhir.'
      : 'Periode zakat telah ditutup.'
    audit(tx.tenantId, 'PUBLIC_INTAKE_TRANSACTION_EXPIRED', `Transaksi ${tx.serial} kedaluwarsa otomatis: ${tx.expiryReason}`)
    A.persist()
    return true
  }
  function activeTransactionsFor(ctx, personId) {
    if (!personId || !ctx?.link) return []
    const records = db().transactions.filter((tx) => tx.tenantId === ctx.link.tenantId && tx.periodId === ctx.link.periodId && tx.personId === personId)
    records.forEach(expireIfNeeded)
    return records.filter(unpaid).sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
  }
  function hasCommitteeProgress(tx) {
    return Boolean(tx.verifiedAt || tx.verifiedBy || tx.handledBy || tx.operatorId || tx.assignedAmilId || tx.shiftId || tx.depositId
      || db().deposits.some((deposit) => deposit.tenantId === tx.tenantId && Array.isArray(deposit.transactionIds) && deposit.transactionIds.includes(tx.id)))
  }
  function canCancelPublic(tx, personId, tenantId) {
    return Boolean(tx && tx.tenantId === tenantId && tx.personId === personId && CANCELABLE_SOURCES.has(tx.source)
      && tx.status === 'pending' && !hasCommitteeProgress(tx) && !transactionExpiryReached(tx))
  }
  function money(value) { return `Rp ${Math.round(Number(value || 0)).toLocaleString('id-ID')}` }
  function kilos(value) { return `${Number(value || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })} kg` }
  function transactionSummary(tx) {
    const tenant = tenantById(tx.tenantId)
    const person = db().persons.find((item) => item.id === tx.personId && item.tenantId === tx.tenantId)
    const totalMoney = (tx.lines || []).filter((line) => line.type === 'uang').reduce((sum, line) => sum + Number(line.value || 0), 0)
    const totalRice = (tx.lines || []).filter((line) => line.type === 'beras').reduce((sum, line) => sum + Number(line.value || 0), 0)
    const canCancel = canCancelPublic(tx, person?.id, tx.tenantId)
    const stateLabel = ({ pending: 'Menunggu verifikasi Amil', paid: 'Disahkan Amil · menunggu proses Bendahara', disetor: 'Diserahkan ke Bendahara', terverifikasi: 'Terverifikasi Bendahara', expired: 'Kedaluwarsa', batal: 'Dibatalkan' })[tx.status] || String(tx.status || '—')
    return `<article class="card pi-transaction-card"><div class="pi-card-heading"><div><small>TRANSAKSI ${esc(tenant?.publicCode || tenant?.id || '')}</small><h3 class="mono">${esc(tx.serial || tx.id)}</h3></div><span class="tag ${tx.status === 'pending' ? 'warn' : ['paid', 'disetor', 'terverifikasi'].includes(tx.status) ? 'ok' : 'bad'}">${esc(stateLabel)}</span></div><div class="pi-tx-facts"><div><small>Nama</small><b>${esc(person?.name || 'Muzakki')}</b></div><div><small>Tanggal</small><b>${esc(new Date(tx.createdAt).toLocaleString('id-ID'))}</b></div><div><small>Jenis</small><b>${esc((tx.lines || []).map((line) => line.category).join(', '))}</b></div><div><small>Jumlah</small><b>${tx.jiwa || 1} orang / unit</b></div><div><small>Total uang</small><b>${money(totalMoney)}</b></div><div><small>Total beras</small><b>${kilos(totalRice)}</b></div><div><small>Batas verifikasi Amil (2 jam)</small><b>${tx.expiresAt ? esc(new Date(tx.expiresAt).toLocaleString('id-ID')) : '—'}</b></div></div>${tx.status === 'pending' ? '<p class="caption">Segera tunjukkan QR ke meja Amil. Verifikasi harus selesai maksimal 2 jam sejak transaksi dibuat; setelah itu transaksi kedaluwarsa dan QR tidak berlaku.</p>' : ''}<div class="actions"><button type="button" class="btn sm primary" data-public-intake-action="view-receipt" data-id="${esc(tx.id)}">Lihat / unduh bukti dan QR</button>${canCancel ? `<button type="button" class="btn sm danger" data-public-intake-action="start-cancel" data-id="${esc(tx.id)}">Batalkan rencana</button>` : ''}</div>${canCancel ? '<p class="caption">Rencana ini masih Pending dan belum diproses petugas. Pembatalan tersedia setelah konfirmasi dan alasan.</p>' : '<p class="caption">Pembatalan tidak tersedia untuk transaksi yang sudah diproses Amil/panitia, berstatus Paid, atau bukan transaksi mandiri.</p>'}</article>`
  }
  function paymentForm(ctx, session) {
    const rules = db().rules.find((item) => item.tenantId === ctx.link.tenantId) || { moneyRate: 45000, riceRate: 2.5 }
    const defaultDue = Number(rules.moneyRate || 45000)
    const sharedFields = window.__SIZISNUR_TRANSACTION_FORM_FIELDS
      ? window.__SIZISNUR_TRANSACTION_FORM_FIELDS('public', 1, String(defaultDue))
      : '<div class="alert danger">Modul kalkulator transaksi bersama belum dimuat. Muat ulang prototype.</div>'
    return `<section class="card pi-form-card"><div class="pi-step-label">LANGKAH 3 DARI 3 · RENCANA ZAKAT</div><h2>Rencana pembayaran zakat</h2><p>Identitas sudah diverifikasi melalui OTP simulasi. Rincian pembayaran menggunakan modul transaksi yang sama dengan input petugas dan Layanan Mandiri.</p><div class="pi-identity-summary"><b>${esc(session.identity.name)}</b><span>${esc(session.identity.phone)} · ${esc(session.identity.domicileStatus === 'non_daerah' ? 'Dari luar daerah' : 'Warga daerah lembaga')}</span><small>${esc(session.identity.address)}</small></div><form data-public-intake-form="transaction" data-tenant-id="${esc(ctx.link.tenantId)}" data-shared-tenant-id="${esc(ctx.link.tenantId)}">
      ${sharedFields}
      <div class="field"><label for="pi-note">Catatan untuk Amil (opsional)</label><textarea id="pi-note" name="note" rows="2"></textarea></div>
      <label class="check"><input type="checkbox" name="confirm" value="yes" required> Saya memahami ini rencana pembayaran berstatus Pending. Pembayaran baru sah setelah diterima, diperiksa, dan disahkan Amil.</label>
      ${window.__SIZISNUR_TRANSACTION_FORM_ACTION ? window.__SIZISNUR_TRANSACTION_FORM_ACTION() : '<div class="form-actions transaction-submit-actions"><button type="submit" class="btn primary">Konfirmasi Zakat</button><p class="caption transaction-submit-note">Tekan tombol ini untuk memproses transaksi dan menerbitkan QR. Tunjukkan QR kepada Amil untuk verifikasi pembayaran; transaksi belum lunas sampai disahkan Amil.</p></div>'}
    </form></section>`
  }
  function renderExistingTransactions(ctx, session) {
    const allForPeriod = session.personId ? db().transactions.filter((tx) => tx.tenantId === ctx.link.tenantId && tx.periodId === ctx.link.periodId && tx.personId === session.personId).sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))) : []
    allForPeriod.forEach(expireIfNeeded)
    const records = activeTransactionsFor(ctx, session.personId)
    const previous = allForPeriod.filter((tx) => !unpaid(tx))
    const cancelled = previous.filter(terminal)
    const settled = previous.filter((tx) => !terminal(tx))
    if (session.cancelTxId) {
      const tx = records.find((item) => item.id === session.cancelTxId)
      if (!tx || !canCancelPublic(tx, session.personId, ctx.link.tenantId)) {
        session.cancelTxId = null
      } else return `<section class="card pi-form-card"><div class="pi-step-label">KONFIRMASI PEMBATALAN</div><h2>Batalkan rencana ${esc(tx.serial)}</h2><div class="alert warn">QR lama akan langsung tidak berlaku. Catatan pembatalan tetap tersimpan untuk audit dan tidak menghapus transaksi secara permanen.</div><form data-public-intake-form="cancel" data-id="${esc(tx.id)}"><div class="field"><label for="pi-cancel-reason">Alasan pembatalan *</label><textarea id="pi-cancel-reason" name="reason" rows="3" required minlength="5"></textarea></div><label class="check"><input type="checkbox" name="confirmCancel" value="yes" required> Saya memahami QR transaksi ini akan dinonaktifkan.</label><div class="form-actions"><button type="submit" class="btn danger">Konfirmasi pembatalan</button><button type="button" class="btn" data-public-intake-action="cancel-back">Kembali</button></div></form></section>`
    }
    if (records.length) {
      return `<section class="card pi-form-card"><div class="pi-step-label">TRANSAKSI BELUM DISELESAIKAN</div><h2>Transaksi belum lunas ditemukan</h2><p>Kontak dan nama Anda cocok dengan data lembaga serta periode aktif ini. Selesaikan atau periksa transaksi yang masih menunggu agar tidak terjadi pembayaran ganda.</p>${records.map(transactionSummary).join('')}${previous.length ? `<details class="pi-history"><summary>Riwayat transaksi lainnya (${previous.length})</summary>${previous.map(transactionSummary).join('')}</details>` : ''}</section>`
    }
    const previousNotice = settled.length ? `<details class="pi-history"><summary>Riwayat transaksi yang sudah diproses (${settled.length})</summary>${settled.map(transactionSummary).join('')}</details>` : ''
    const cancelledNotice = cancelled.length ? `<div class="alert light">Ada ${cancelled.length} catatan transaksi batal/kedaluwarsa. Catatan tersebut tetap tersimpan dan tidak menghalangi rencana baru.</div>` : ''
    return `${cancelledNotice}${paymentForm(ctx, session)}${previousNotice}`
  }
  function renderIntake() {
    const ctx = currentPublicContext()
    if (ctx.error) return `<div class="pi-public-shell"><div class="pi-public-card"><div class="pi-logo"><img src="assets/sizisnur-logo-mark.png" alt="SiZisNur"><b>SiZisNur</b></div>${simulationBanner()}<div class="alert danger"><b>Formulir tidak dapat dibuka</b><br>${esc(ctx.error)}</div><button type="button" class="btn" data-public-intake-action="back-home">Kembali ke beranda</button></div></div>`
    const session = sessionFor(ctx.token)
    return `<div class="pi-public-shell"><main class="pi-public-card">${simulationBanner()}${publicHeader(ctx.tenant, ctx.period)}<section class="pi-welcome"><span class="eyebrow">LAYANAN PENDATAAN MANDIRI</span><h1>Assalamu'alaikum!</h1><p>Silakan isi data dan rencana zakat untuk <b>${esc(ctx.tenant.name)}</b>. Anda tidak perlu mempunyai akun atau login SiZisNur.</p><div class="pi-mini-facts"><span>${esc(ctx.tenant.daerah || 'Wilayah lembaga')}</span><span>${esc(ctx.period.name || 'Periode aktif')}</span></div></section>${session.stage === 'identity' ? identityForm(ctx, session) : session.stage === 'otp' ? otpForm(ctx, session) : session.stage === 'match' ? `<section class="pi-verified-banner"><span>✓</span><div><b>Kontak terverifikasi (simulasi)</b><small>Hasil pencarian dibatasi pada lembaga dan periode ini.</small></div></section>${Date.now() > session.verifiedUntil ? `<div class="alert warn">Sesi verifikasi telah berakhir. Ulangi verifikasi kontak sebelum melihat atau mengubah transaksi.</div><button type="button" class="btn primary" data-public-intake-action="back-identity">Verifikasi ulang</button>` : session.lookupError ? `<div class="alert warn"><b>Perlu pemeriksaan petugas</b><br>${esc(session.lookupError)}<p>Untuk mencegah data warga tertukar, formulir transaksi baru dan akses transaksi lama dinonaktifkan sampai identitas diperiksa.</p></div><button type="button" class="btn" data-public-intake-action="back-identity">Periksa kembali data</button>` : renderExistingTransactions(ctx, session)}` : `<section class="card pi-form-card"><h2>Rencana zakat berhasil dicatat</h2><div class="alert ok">Rencana transaksi disimpan dengan status Pending. Ini belum menjadi bukti pembayaran resmi.</div>${session.createdTransactionId ? `<button type="button" class="btn primary" data-public-intake-action="view-receipt" data-id="${esc(session.createdTransactionId)}">Lihat / unduh bukti dan QR</button>` : ''}<button type="button" class="btn" data-public-intake-action="restart">Kembali ke awal formulir</button></section>`}<footer class="pi-public-footer">SiZisNur · Formulir publik lembaga · Evaluasi simulasi, bukan layanan transaksi nyata.</footer><button type="button" class="btn ghost" data-public-intake-action="back-home">Keluar dari formulir</button></main><div id="modal-root"></div></div>`
  }
  function renderReceipt(tx) {
    if (expireIfNeeded(tx)) A.persist()
    const period = db().periods.find((item) => item.id === tx.periodId && item.tenantId === tx.tenantId)
    const inactive = terminal(tx) || transactionExpiryReached(tx) || (period && ['ditutup', 'closed', 'selesai'].includes(String(period.status || '').toLowerCase()))
    const sharedMarkup = window.__SIZISNUR_RECEIPT_MARKUP?.(tx)
    const fallback = `<div class="alert warn">Struk standar belum tersedia. Muat ulang prototype untuk memuat modul transaksi bersama.</div>`
    const actions = `${!inactive ? `<div class="form-actions"><button type="button" class="btn primary" data-public-intake-action="print-receipt" data-id="${esc(tx.id)}">Cetak / Simpan PDF</button><button type="button" class="btn" data-public-intake-action="download-receipt-png" data-id="${esc(tx.id)}">Unduh gambar PNG</button></div>` : ''}<div class="form-actions"><button type="button" class="btn" data-modal-close>Tutup</button></div>`
    A.modal(`Bukti transaksi ${tx.serial}`, `${sharedMarkup || fallback}${actions}`, true)
  }
  async function downloadReceiptPng(tx) {
    if (window.__SIZISNUR_DOWNLOAD_RECEIPT_PNG) return window.__SIZISNUR_DOWNLOAD_RECEIPT_PNG(tx)
    if (!window.document?.createElement || !window.URL?.createObjectURL) throw new Error('Fitur unduh gambar tidak didukung browser ini. Gunakan Cetak / Simpan PDF.')
    const canvas = document.createElement('canvas')
    canvas.width = 900; canvas.height = 1260
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas tidak tersedia. Gunakan Cetak / Simpan PDF.')
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#145b43'; ctx.textAlign = 'center'; ctx.font = 'bold 34px Arial'
    ctx.fillText(tenantById(tx.tenantId)?.name || 'SiZisNur', 450, 70)
    ctx.fillStyle = '#222'; ctx.font = '22px Arial'; ctx.fillText(tx.status === 'pending' ? 'STRUK RENCANA ZAKAT · SIMULASI' : `STATUS: ${tx.status}`, 450, 116)
    const person = db().persons.find((item) => item.id === tx.personId && item.tenantId === tx.tenantId)
    const totals = (tx.lines || []).reduce((result, line) => { if (line.type === 'beras') result.rice += Number(line.value || 0); else result.money += Number(line.value || 0); return result }, { money: 0, rice: 0 })
    const rows = [['Nomor transaksi', tx.serial], ['Muzakki', person?.name || 'Muzakki'], ['Kategori', (tx.lines || []).map((line) => line.category).join(', ')], ['Uang', money(totals.money)], ['Beras', kilos(totals.rice)], ['Status', tx.status]]
    ctx.textAlign = 'left'; ctx.fillStyle = '#222'; ctx.font = '24px Arial'
    let y = 190
    rows.forEach(([label, value]) => { ctx.fillText(label, 70, y); ctx.textAlign = 'right'; ctx.fillText(String(value), 830, y); ctx.textAlign = 'left'; y += 62 })
    if (!terminal(tx) && !transactionExpiryReached(tx)) {
      const token = `SIZISNUR|${tx.tenantId}|${tx.id}|${tx.serial}`
      const svg = A.qr(token).match(/<svg[\s\S]*?<\/svg>/i)?.[0]
      if (svg) {
        const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }))
        try { const image = new Image(); await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = url }); ctx.drawImage(image, 320, y + 30, 260, 260) } finally { URL.revokeObjectURL(url) }
      }
    }
    ctx.textAlign = 'center'; ctx.font = '18px Arial'; ctx.fillText('SIMULASI — bukan bukti pembayaran resmi', 450, 1195)
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!blob) throw new Error('Gambar bukti gagal dibuat.')
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `SiZisNur-${tx.serial}.png`; document.body.appendChild(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  function findPublicTransaction(txId, session) {
    const ctx = currentPublicContext()
    if (!ctx.link || !session?.personId) return null
    return db().transactions.find((tx) => tx.id === txId && tx.tenantId === ctx.link.tenantId && tx.personId === session.personId) || null
  }
  function beginIdentity(form, session, ctx) {
    const data = Object.fromEntries(new FormData(form).entries())
    const name = String(data.name || '').trim()
    const phone = String(data.phone || '').trim()
    const email = String(data.email || '').trim()
    const address = String(data.address || '').trim()
    const otpChannel = data.otpChannel || 'whatsapp'
    if (!name || !phone || !address) throw new Error('Nama lengkap, nomor HP, dan alamat wajib diisi.')
    if (data.consent !== 'yes') throw new Error('Konfirmasi bahwa Anda memahami batas simulasi wajib dicentang.')
    if (otpChannel === 'email' && !email) throw new Error('Email wajib diisi untuk jalur verifikasi email simulasi.')
    if (normalizePhone(phone).length < 9) throw new Error('Nomor HP belum valid. Periksa kembali nomor yang dimasukkan.')
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Format email belum valid.')
    if (!window.__SIZISNUR_SAVE_DOMICILE) throw new Error('Modul Master Wilayah belum tersedia. Muat ulang prototype.')
    const domicile = window.__SIZISNUR_SAVE_DOMICILE({}, data, ctx.link.tenantId)
    session.identity = { name, phone, email, address, ...domicile, otpChannel }
    const nowMs = Date.now()
    session.otpChallenges = [{ channel: 'whatsapp', code: createOtp(), expiresAt: nowMs + 5 * 60 * 1000, attempts: 0, resends: 0, status: 'active' }]
    if (email) session.otpChallenges.push({ channel: 'email', code: createOtp(), expiresAt: nowMs + 5 * 60 * 1000, attempts: 0, resends: 0, status: 'active' })
    session.otp = session.otpChallenges.find((item) => item.channel === (otpChannel === 'email' ? 'email' : 'whatsapp'))?.code || session.otpChallenges[0].code
    session.otpExpiresAt = nowMs + 5 * 60 * 1000
    session.otpAttempts = 0
    session.otpResends = 0
    session.otpLastSentAt = nowMs
    session.stage = 'otp'
    session.verifiedUntil = 0
    A.render()
  }
  function verifyIdentityOtp(form, session, ctx) {
    const data = Object.fromEntries(new FormData(form).entries())
    const challenges = session.otpChallenges?.length ? session.otpChallenges : [{ channel: session.identity.otpChannel === 'email' ? 'email' : 'whatsapp', code: session.otp, expiresAt: session.otpExpiresAt, attempts: session.otpAttempts, status: 'active' }]
    if (challenges.some((item) => !item.code || Date.now() > item.expiresAt)) throw new Error('OTP demo sudah kedaluwarsa. Buat ulang OTP untuk melanjutkan.')
    if (session.otpAttempts >= 5 || challenges.some((item) => item.attempts >= 5)) throw new Error('Batas percobaan OTP tercapai. Silakan mulai ulang formulir.')
    for (const challenge of challenges) {
      const inputName = challenge.channel === (session.identity.otpChannel === 'email' ? 'email' : 'whatsapp') ? 'otp' : `otp_${challenge.channel === 'email' ? 'email' : 'phone'}`
      if (challenge.status === 'verified') continue
      if (String(data[inputName] || '').trim() !== challenge.code) {
        challenge.attempts += 1
        session.otpAttempts += 1
        if (challenge.attempts >= 5 || session.otpAttempts >= 5) challenge.status = 'locked'
        A.render()
        throw new Error(`Kode OTP ${challenge.channel === 'email' ? 'email' : 'nomor HP'} tidak sesuai. Periksa kembali kode demo yang ditampilkan.`)
      }
      challenge.status = 'verified'
      challenge.verifiedAt = A.now()
    }
    if (challenges.some((item) => item.status !== 'verified')) { A.render(); return }
    const lookup = identityLookup(ctx.link.tenantId, session.identity)
    if (lookup.ambiguous) { session.stage = 'match'; session.lookupError = lookup.reason; session.personId = null; session.verifiedUntil = Date.now() + 10 * 60 * 1000; A.render(); return }
    session.personId = lookup.person?.id || null
    session.lookupError = ''
    session.verifiedUntil = Date.now() + 10 * 60 * 1000
    session.stage = 'match'
    A.render()
  }
  function transactionData(form) { return Object.fromEntries(new FormData(form).entries()) }
  function createPublicTransaction(form, ctx, session) {
    if (!session.personId && !session.identity) throw new Error('Identitas belum diverifikasi. Ulangi proses OTP.')
    if (Date.now() > session.verifiedUntil) throw new Error('Sesi verifikasi sudah berakhir. Silakan verifikasi kontak kembali.')
    const data = transactionData(form)
    if (data.confirm !== 'yes') throw new Error('Konfirmasi bahwa transaksi masih Pending wajib dicentang.')
    const period = activePeriod(ctx.link.tenantId)
    if (!period || period.id !== ctx.link.periodId) throw new Error('Periode sudah tidak aktif. Minta tautan terbaru kepada petugas.')
    let person = session.personId ? db().persons.find((item) => item.id === session.personId && item.tenantId === ctx.link.tenantId) : null
    if (session.personId && !person) throw new Error('Data identitas tidak ditemukan. Hubungi petugas lembaga.')
    if (person) db().transactions.filter((tx) => tx.tenantId === ctx.link.tenantId && tx.periodId === period.id && tx.personId === person.id).forEach(expireIfNeeded)
    const duplicate = person ? db().transactions.find((tx) => tx.tenantId === ctx.link.tenantId && tx.periodId === period.id && tx.personId === person.id && unpaid(tx)) : null
    if (duplicate) throw new Error(`Transaksi aktif ${duplicate.serial} sudah ditemukan. Buka bukti transaksi sebelumnya.`)
    const rules = db().rules.find((item) => item.tenantId === ctx.link.tenantId)
    if (!rules) throw new Error('Tarif lembaga belum tersedia. Hubungi Admin lembaga.')
    const payment = window.__SIZISNUR_TRANSACTION_PAYMENT?.(data, rules)
    if (!payment?.lines?.length) throw new Error('Kalkulator transaksi belum tersedia. Muat ulang prototype.')
    const units = payment.jiwa
    const dataStore = ensureCollections()
    if (!person) {
      person = { id: A.id('PS'), tenantId: ctx.link.tenantId, name: session.identity.name, phone: session.identity.phone, email: session.identity.email, address: session.identity.address, domicileStatus: session.identity.domicileStatus, areaId: session.identity.areaId || null, rwId: session.identity.rwId || null, rtId: session.identity.rtId || null, intakeSource: 'public-intake' }
      dataStore.persons.push(person)
    }
    if (!dataStore.muzakki.some((item) => item.tenantId === ctx.link.tenantId && item.personId === person.id)) {
      const count = dataStore.muzakki.filter((item) => item.tenantId === ctx.link.tenantId).length + 1
      dataStore.muzakki.push({ id: A.id('MZ'), tenantId: ctx.link.tenantId, personId: person.id, cardCode: `KZM-${ctx.link.tenantId.split('-').pop()}-${String(count).padStart(4, '0')}`, active: true, registrationSource: 'public-intake' })
    }
    const sequence = dataStore.transactions.filter((item) => item.tenantId === ctx.link.tenantId).length + 1
    const serial = `PU-${String(sequence).padStart(6, '0')}`
    const createdAt = A.now()
    const tx = {
      id: A.id('TR'), tenantId: ctx.link.tenantId, periodId: period.id, serial, personId: person.id,
      recordedBy: null, handledBy: null, operatorId: null, assignedAmilId: null, jiwa: units,
      lines: payment.lines, paymentEstimate: { due: payment.estimate.dueMoney, dueRice: payment.estimate.dueRice, paid: payment.paidMoney, paidRice: payment.paidRice, excessAllocated: payment.excessAllocatedMoney, excessAllocatedRice: payment.excessAllocatedRice, method: 'shared-multi-line-calculator', breakdown: payment.breakdown },
      source: 'public-intake', publicIntakeLinkId: ctx.link.id, contactVerifiedChannel: session.identity.otpChannel,
      contactVerifiedAt: createdAt, createdAt, expiresAt: transactionExpiresAt(createdAt),
      status: 'pending', note: String(data.note || '').trim(),
    }
    dataStore.transactions.push(tx)
    dataStore.notifications.push?.({ id: A.id('NT'), tenantId: ctx.link.tenantId, personId: person.id, channel: 'prototype-local', status: 'lokal', date: A.today(), subject: `Rencana zakat ${serial}`, message: `Rencana zakat tersimpan melalui formulir publik ${tenantById(ctx.link.tenantId)?.name || ''}. Segera tunjukkan QR ke meja Amil; verifikasi harus selesai maksimal 2 jam sejak dibuat, yaitu ${new Date(tx.expiresAt).toLocaleString('id-ID')}.`  })
    audit(ctx.link.tenantId, 'PUBLIC_INTAKE_TRANSACTION_CREATED', `Rencana transaksi publik ${serial} dibuat; status Pending`)
    A.persist()
    session.personId = person.id
    session.createdTransactionId = tx.id
    session.stage = 'created'
    return tx
  }
  function cancelPublicTransaction(form, ctx, session) {
    if (Date.now() > session.verifiedUntil) throw new Error('Sesi verifikasi kontak sudah berakhir. Lakukan verifikasi ulang.')
    const txId = form.dataset.id
    const tx = findPublicTransaction(txId, session)
    if (!tx || !canCancelPublic(tx, session.personId, ctx.link.tenantId)) throw new Error('Transaksi tidak memenuhi syarat pembatalan. Hanya rencana mandiri yang masih Pending dan belum diproses petugas yang dapat dibatalkan.')
    const data = Object.fromEntries(new FormData(form).entries())
    const reason = String(data.reason || '').trim()
    if (reason.length < 5 || data.confirmCancel !== 'yes') throw new Error('Alasan minimal 5 karakter dan konfirmasi pembatalan wajib diisi.')
    tx.status = 'batal'
    tx.cancelReason = reason
    tx.cancelledAt = A.now()
    tx.cancelledBy = 'Pemilik kontak terverifikasi · Portal Publik Simulasi'
    tx.cancelledVia = 'public-intake'
    audit(ctx.link.tenantId, 'PUBLIC_INTAKE_TRANSACTION_CANCELLED', `Transaksi ${tx.serial} dibatalkan oleh kontak terverifikasi; alasan: ${reason}`)
    A.persist()
    session.cancelTxId = null
    A.toast('Rencana transaksi dibatalkan. QR lama tidak berlaku.', 'success')
    A.render()
  }
  function printBanner(link) {
    const tenant = tenantById(link.tenantId)
    const period = db().periods.find((item) => item.id === link.periodId && item.tenantId === link.tenantId)
    const url = portalUrl(link.token)
    const qr = A.qr(url)
    const html = `<main style="max-width:760px;margin:25px auto;padding:28px;text-align:center;font-family:Arial,sans-serif;border:4px solid #0b7a4b;border-radius:22px"><small style="letter-spacing:2px;color:#0b7a4b">LAYANAN DIGITAL ZAKAT · SIZISNUR</small><h1 style="font-size:36px;margin:14px 0">Formulir Zakat Mandiri</h1><h2>${esc(tenant?.name || 'Lembaga')}</h2><p>${esc(period?.name || 'Periode zakat')}</p><div style="width:300px;margin:25px auto">${qr}</div><h2>PINDAI QR UNTUK MENGISI DATA</h2><p>Isi identitas dan rencana zakat dari HP Anda. Tidak perlu membuat akun SiZisNur.</p><p style="word-break:break-all">${esc(url)}</p><p style="font-size:13px;color:#a45a00"><b>SIMULASI EVALUASI — tidak menerima pembayaran nyata. QR ini hanya berfungsi pada browser/perangkat yang memiliki data demo lokal yang sama.</b></p></main>`
    A.printWindow(`Banner Formulir Zakat ${tenant?.name || ''}`, html, false)
  }
  function managerAction(event, button) {
    const action = button.dataset.publicIntakeAction
    const user = A.user()
    const tenantId = user ? (A.session?.tenantId || user.tenantId) : null
    const link = (db().publicIntakeLinks || []).find((item) => item.id === button.dataset.id && item.tenantId === tenantId)
    if (action === 'create-link') {
      const created = createLink(); A.render(); A.toast('Tautan publik dan QR formulir berhasil diterbitkan (simulasi).', 'success'); return
    }
    if (['select-link', 'copy-link', 'share-wa', 'print-banner', 'revoke', 'preview'].includes(action) && !link) throw new Error('Tautan tidak ditemukan pada lembaga aktif.')
    if (action === 'select-link') { selectedManagerLinkId = link.id; A.render(); return }
    if (action === 'copy-link') { copyText(portalUrl(link.token)); return }
    if (action === 'share-wa') { const text = `Assalamu'alaikum. Silakan isi data dan rencana zakat melalui formulir publik ${tenantById(link.tenantId)?.name || 'lembaga'}: ${portalUrl(link.token)}\n\nCatatan: tautan ini merupakan simulasi prototype SiZisNur.`; window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer'); return }
    if (action === 'print-banner') { printBanner(link); return }
    if (action === 'revoke') { if (!window.confirm('Cabut tautan publik ini? QR lama akan langsung tidak dapat digunakan pada simulasi.')) return; revokeLink(link.id); A.render(); A.toast('Tautan berhasil dicabut.', 'success'); return }
    if (action === 'preview') { state.publicIntakeToken = link.token; state.page = 'public-intake'; intakeSession = null; A.render(); return }
  }
  function publicAction(button) {
    const action = button.dataset.publicIntakeAction
    const ctx = currentPublicContext()
    const session = ctx.link ? sessionFor(ctx.token) : null
    if (action === 'back-home') { state.page = A.user() ? (A.user().scope === 'platform' ? 'platform-admin' : 'dashboard') : 'landing'; state.publicIntakeToken = null; state.modal = null; A.render(); return }
    if (action === 'back-identity') { if (session) { session.stage = 'identity'; session.otp = null; session.otpChallenges = []; session.verifiedUntil = 0 }; A.render(); return }
    if (action === 'resend-otp') {
      if (!session?.identity) throw new Error('Isi identitas terlebih dahulu.')
      const nowMs = Date.now()
      if (Number(session.otpResends || 0) >= 3) throw new Error('Batas kirim ulang OTP tercapai. Mulai ulang formulir untuk meminta kode baru.')
      if (nowMs - Number(session.otpLastSentAt || 0) < 30 * 1000) throw new Error('Tunggu 30 detik sebelum meminta OTP baru.')
      ;(session.otpChallenges || []).filter((item) => item.status !== 'verified').forEach((item) => { item.code = createOtp(); item.expiresAt = nowMs + 5 * 60 * 1000; item.attempts = 0; item.status = 'active'; item.resends = Number(item.resends || 0) + 1 })
      const primary = session.identity.otpChannel === 'email' ? 'email' : 'whatsapp'
      session.otp = session.otpChallenges.find((item) => item.channel === primary)?.code || session.otpChallenges[0]?.code
      session.otpExpiresAt = nowMs + 5 * 60 * 1000
      session.otpAttempts = 0; session.otpResends = Number(session.otpResends || 0) + 1; session.otpLastSentAt = nowMs
      A.render(); return
    }
    if (action === 'restart') { if (ctx.link) resetIntake(ctx.token); A.render(); return }
    if (action === 'cancel-back') { if (session) session.cancelTxId = null; A.render(); return }
    if (action === 'start-cancel') { if (!session || !session.personId || !Number.isFinite(session.verifiedUntil) || Date.now() > session.verifiedUntil) throw new Error('Sesi verifikasi telah berakhir. Ulangi verifikasi kontak.'); const tx = findPublicTransaction(button.dataset.id, session); if (!tx || !canCancelPublic(tx, session.personId, ctx.link.tenantId)) throw new Error('Transaksi ini tidak dapat dibatalkan oleh Portal Publik.'); session.cancelTxId = tx.id; A.render(); return }
    if (action === 'view-receipt' || action === 'print-receipt' || action === 'download-receipt-png') {
      if (!session || Date.now() > session.verifiedUntil) throw new Error('Sesi verifikasi telah berakhir. Verifikasi kontak terlebih dahulu.')
      const tx = findPublicTransaction(button.dataset.id, session)
      if (!tx) throw new Error('Bukti transaksi tidak ditemukan atau bukan milik kontak terverifikasi.')
      if (action === 'view-receipt') { renderReceipt(tx); return }
      if (action === 'print-receipt') { A.printWindow(`Bukti ${tx.serial}`, `<div class="receipt">${renderReceiptPrint(tx)}</div>`, false); return }
      downloadReceiptPng(tx).catch((error) => A.toast(error.message || 'Gagal mengunduh bukti.', 'error'))
    }
  }
  function renderReceiptPrint(tx) {
    if (window.__SIZISNUR_RECEIPT_PRINT_HTML) return window.__SIZISNUR_RECEIPT_PRINT_HTML(tx)
    return `<div class="alert warn">Modul cetak struk bersama belum dimuat. Muat ulang prototype.</div>`
  }


  function onClick(event) {
    const button = event.target.closest?.('[data-public-intake-action]')
    if (!button) return
    event.preventDefault()
    try {
      if (state.page === 'public-intake-manager') managerAction(event, button)
      else publicAction(button)
    } catch (error) { A.toast(error.message || String(error), 'error') }
  }
  function onSubmit(event) {
    const form = event.target.closest?.('[data-public-intake-form]')
    if (!form) return
    event.preventDefault()
    const ctx = currentPublicContext()
    if (!ctx.link) return A.toast(ctx.error || 'Tautan tidak tersedia.', 'error')
    const session = sessionFor(ctx.token)
    try {
      if (form.dataset.publicIntakeForm === 'identity') beginIdentity(form, session, ctx)
      else if (form.dataset.publicIntakeForm === 'otp') verifyIdentityOtp(form, session, ctx)
      else if (form.dataset.publicIntakeForm === 'transaction') {
        const payload = transactionData(form)
        if (window.__SIZISNUR_MAY_CONFIRM_TRANSACTION_EXCESS?.(form, payload)) return
        const tx = createPublicTransaction(form, ctx, session)
        form.dataset.excessDecision = ''
        A.toast(`Rencana ${tx.serial} tersimpan sebagai Pending.`, 'success')
        A.render()
        renderReceipt(tx)
      } else if (form.dataset.publicIntakeForm === 'cancel') cancelPublicTransaction(form, ctx, session)
    } catch (error) { A.toast(error.message || String(error), 'error') }
  }

  // Manager UI route is included in the tenant role navigation.
  window.__SIZISNUR_PUBLIC_INTAKE_MANAGER_VIEW = managerView
  window.__SIZISNUR_PUBLIC_INTAKE = {
    createLink, revokeLink, findLink, portalUrl, currentPublicContext, identityLookup,
    activeTransactionsFor, canCancelPublic, createOtp, getSession: () => intakeSession,
    createPublicTransaction, cancelPublicTransaction,
    get DEMO_NOTICE() { return DEMO_NOTICE },
  }
  document.addEventListener('click', onClick)
  document.addEventListener('submit', onSubmit)

  const previousRender = A.render
  A.set('render', function renderWithPublicIntake() {
    if (state.page === 'public-intake') {
      const root = $('app')
      if (root) {
        root.innerHTML = renderIntake()
        const sharedForm = root.querySelector?.('[data-shared-transaction="yes"]')
        if (sharedForm) window.__SIZISNUR_UPDATE_TRANSACTION_FORM?.(sharedForm)
      }
      const modalRoot = $('modal-root')
      if (modalRoot) modalRoot.innerHTML = ''
      return
    }
    return previousRender()
  })

  const tokenFromUrl = queryToken()
  if (tokenFromUrl) {
    state.publicIntakeToken = tokenFromUrl
    state.page = 'public-intake'
    state.modal = null
    A.render()
  } else if (state.page === 'public-intake-manager') {
    A.render()
  }
})()
