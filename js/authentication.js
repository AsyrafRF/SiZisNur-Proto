;
/* SiZisNur authentication-flow prototype.
   Passwords are PBKDF2-hashed in browser storage for realistic UX testing.
   This is not production authentication: there is no trusted server/session boundary. */
(function () {
  'use strict'
  const A = window.__SiZisNurBridge
  if (!A) throw new Error('SiZisNur core bridge is missing')

  const state = A.state
  const db = A.db
  const encoder = new TextEncoder()
  const ITERATIONS = 100000
  const AUTH_ALGORITHM = 'PBKDF2-SHA256'
  const $ = (id) => document.getElementById(id)
  const esc = A.e
  const fmtEmail = (value) => String(value || '').trim().toLowerCase()
  const fmtPhone = (value) => {
    const digits = String(value || '').replace(/\D/g, '')
    if (!digits) return ''
    if (digits.startsWith('0')) return `62${digits.slice(1)}`
    if (digits.startsWith('8')) return `62${digits}`
    return digits
  }
  const fmtName = (value) => String(value || '').trim().toLocaleLowerCase('id-ID').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ')
  const passwordRules = 'minimal 8 karakter'

  function base64(bytes) {
    let binary = ''
    for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i])
    return btoa(binary)
  }
  function fromBase64(value) {
    return Uint8Array.from(atob(value), (char) => char.charCodeAt(0))
  }
  function cryptoApi() {
    const api = window.crypto
    if (!api?.subtle || !api?.getRandomValues) throw new Error('Browser belum menyediakan Web Crypto. Gunakan browser modern melalui HTTPS, localhost, atau akses Demo Langsung.')
    return api
  }
  async function hashPassword(password) {
    const raw = String(password || '')
    if (raw.length < 8) throw new Error(`Password harus minimal 8 karakter (${passwordRules}).`)
    const api = cryptoApi()
    const salt = new Uint8Array(16)
    api.getRandomValues(salt)
    const key = await api.subtle.importKey('raw', encoder.encode(raw), 'PBKDF2', false, ['deriveBits'])
    const derived = await api.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' }, key, 256)
    return { algorithm: AUTH_ALGORITHM, iterations: ITERATIONS, salt: base64(salt), hash: base64(new Uint8Array(derived)) }
  }
  async function verifyPassword(password, credential) {
    if (!credential || credential.algorithm !== AUTH_ALGORITHM || !credential.salt || !credential.hash) return false
    const api = cryptoApi()
    const salt = fromBase64(credential.salt)
    const key = await api.subtle.importKey('raw', encoder.encode(String(password || '')), 'PBKDF2', false, ['deriveBits'])
    const derived = new Uint8Array(await api.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: Number(credential.iterations) || ITERATIONS, hash: 'SHA-256' }, key, 256))
    const expected = fromBase64(credential.hash)
    if (derived.length !== expected.length) return false
    let difference = 0
    for (let i = 0; i < derived.length; i += 1) difference |= derived[i] ^ expected[i]
    return difference === 0
  }
  function defaultPassword(user) {
    if (user.scope === 'platform' || user.role === 'Admin SiZisNur') return 'Root#2026'
    if (user.role === 'Muzakki') return 'Muzakki#2026'
    if (user.role === 'Admin') return 'Admin#2026'
    return 'Demo#2026'
  }
  async function initializeCredentials() {
    db.accounts ||= []
    db.applications ||= []
    const accounts = [...(db.users || []), ...(db.platformAdmins || [])]
    let changed = false
    for (const user of accounts) {
      if (!user.passwordAuth) {
        user.passwordAuth = await hashPassword(defaultPassword(user))
        user.mustChangePassword = false
        user.passwordProvision = 'prototype-default'
        changed = true
      }
    }
    if (changed) A.persist()
    return true
  }
  const authReady = initializeCredentials()
  window.__SIZISNUR_AUTH_READY = authReady

  function temporaryPassword() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%'
    const bytes = new Uint8Array(16)
    cryptoApi().getRandomValues(bytes)
    return Array.from(bytes, (value) => alphabet[value % alphabet.length]).join('')
  }

  // OTP is intentionally browser-local and visible only to exercise the UX in this prototype.
  // A production implementation must generate, deliver, and validate challenges server-side.
  const OTP_TTL_MS = 5 * 60 * 1000
  const OTP_MAX_ATTEMPTS = 5
  const OTP_RESEND_COOLDOWN_MS = 30 * 1000
  const OTP_MAX_RESENDS = 3
  function createOtpCode() {
    const bytes = new Uint32Array(1)
    cryptoApi().getRandomValues(bytes)
    return String(bytes[0] % 1000000).padStart(6, '0')
  }
  function maskContact(value, channel) {
    const text = String(value || '')
    if (channel === 'email') {
      const [name, domain] = text.split('@')
      return `${(name || '').slice(0, 2)}•••@${domain || '•••'}`
    }
    return text.length > 5 ? `${text.slice(0, 3)}••••${text.slice(-3)}` : '••••••'
  }
  function contactChannels(user, onlyUnverified = false, overrides = {}) {
    const email = fmtEmail(overrides.email ?? user?.email)
    const phone = String(overrides.phone ?? user?.phone ?? '').trim()
    const channels = []
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (!onlyUnverified || !user?.emailVerifiedAt || email !== fmtEmail(user?.email))) {
      channels.push({ channel: 'email', destination: email })
    }
    if (phone && /^\d{9,15}$/.test(fmtPhone(phone)) && (!onlyUnverified || !user?.phoneVerifiedAt || fmtPhone(phone) !== fmtPhone(user?.phone))) {
      channels.push({ channel: 'phone', destination: phone })
    }
    return channels
  }
  function otpStore() {
    db.authOtpChallenges ||= []
    const cutoff = Date.now() - 24 * 60 * 60 * 1000
    db.authOtpChallenges = db.authOtpChallenges.filter((item) => Date.parse(item.createdAt || '') >= cutoff)
    return db.authOtpChallenges
  }
  function issueOtpChallenge(flow, channelInfo) {
    const nowMs = Date.now()
    const challenge = {
      id: A.id('OTP'), flowId: flow.id, userId: flow.userId || null, purpose: flow.purpose,
      channel: channelInfo.channel, destination: channelInfo.destination,
      code: createOtpCode(), createdAt: new Date(nowMs).toISOString(),
      expiresAt: new Date(nowMs + OTP_TTL_MS).toISOString(), attempts: 0,
      maxAttempts: OTP_MAX_ATTEMPTS, resends: 0, lastSentAt: new Date(nowMs).toISOString(), status: 'active', verifiedAt: null,
    }
    otpStore().push(challenge)
    return challenge
  }
  function startOtpFlow({ purpose, user = null, channels, data = {}, role = '', origin = 'login' }) {
    const normalizedChannels = (channels || []).filter((item) => item?.destination && ['email', 'phone'].includes(item.channel))
    if (!normalizedChannels.length) throw new Error('Akun tidak memiliki email atau nomor HP valid untuk menerima OTP. Hubungi Admin lembaga.')
    const flow = { id: A.id('FLOW'), purpose, userId: user?.id || null, role, origin, data, challengeIds: [], startedAt: A.now() }
    flow.challengeIds = normalizedChannels.map((item) => issueOtpChallenge(flow, item).id)
    state.authFlow = flow
    state.authView = 'otp'
    A.persist()
    A.render()
    return flow
  }
  function findFlowChallenges(flow = state.authFlow) {
    if (!flow) return []
    const store = otpStore()
    return (flow.challengeIds || []).map((id) => store.find((item) => item.id === id)).filter(Boolean)
  }
  function resendOtpFlow() {
    const flow = state.authFlow
    if (!flow) throw new Error('Sesi verifikasi tidak ditemukan. Mulai kembali prosesnya.')
    const nowMs = Date.now()
    const pending = findFlowChallenges(flow).filter((item) => item.status !== 'verified')
    if (!pending.length) throw new Error('Semua kanal sudah diverifikasi.')
    for (const challenge of pending) {
      if (challenge.resends >= OTP_MAX_RESENDS) throw new Error('Batas kirim ulang OTP tercapai. Mulai ulang proses atau coba kembali nanti.')
      if (nowMs - Date.parse(challenge.lastSentAt || challenge.createdAt) < OTP_RESEND_COOLDOWN_MS) throw new Error('Tunggu 30 detik sebelum meminta OTP baru.')
    }
    for (const challenge of pending) {
      challenge.code = createOtpCode()
      challenge.createdAt = new Date(nowMs).toISOString()
      challenge.expiresAt = new Date(nowMs + OTP_TTL_MS).toISOString()
      challenge.lastSentAt = challenge.createdAt
      challenge.attempts = 0
      challenge.resends += 1
      challenge.status = 'active'
    }
    A.persist()
    A.render()
    A.toast('OTP demo baru dibuat untuk kanal yang belum diverifikasi.', 'success')
  }
  function auditSecurity(type, detail, user = A.user()) {
    if (user?.scope === 'platform') {
      db.platformAudit ||= []
      db.platformAudit.unshift({ id: A.id('PAU'), at: A.now(), actorId: user.id, actorName: user.name, type, detail })
    } else if (user) {
      A.aud('AUTH_SECURITY', `${type}: ${detail}`)
    }
  }
  async function applyVerifiedProfile(user, data, challenges) {
    const name = String(data.name || '').trim()
    const email = fmtEmail(data.email)
    const phone = String(data.phone || '').trim()
    if (!name || !email) throw new Error('Nama dan email wajib diisi.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Format email belum valid.')
    if (user.scope !== 'platform' && !/^\d{9,15}$/.test(fmtPhone(phone))) throw new Error('Nomor HP belum valid.')
    const emailOwner = allAccounts().find((item) => item.id !== user.id && fmtEmail(item.email) === email && (user.scope === 'platform' || item.scope === 'platform' || (user.role === 'Muzakki' ? item.role === 'Muzakki' : item.tenantId === user.tenantId && item.role === user.role)))
    if (emailOwner) throw new Error('Email sudah digunakan oleh akun lain pada cakupan yang sama.')
    if (phone) {
      const phoneOwner = allAccounts().find((item) => item.id !== user.id && fmtPhone(item.phone) === fmtPhone(phone) && (user.scope === 'platform' || item.scope === 'platform' || (user.role === 'Muzakki' ? item.role === 'Muzakki' : item.tenantId === user.tenantId && item.role === user.role)))
      if (phoneOwner) throw new Error('Nomor HP sudah digunakan oleh akun lain pada cakupan yang sama.')
    }
    const marks = Object.fromEntries(challenges.map((item) => [item.channel, item.verifiedAt || A.now()]))
    const oldEmail = fmtEmail(user.email)
    const oldPhone = fmtPhone(user.phone)
    user.name = name
    user.email = email
    user.phone = phone
    user.emailVerifiedAt = marks.email || (oldEmail === email ? user.emailVerifiedAt || null : null)
    user.phoneVerifiedAt = marks.phone || (oldPhone === fmtPhone(phone) ? user.phoneVerifiedAt || null : null)
    if (user.role === 'Muzakki') {
      const account = db.accounts.find((item) => item.userId === user.id)
      if (account) Object.assign(account, { displayName: name, email, phone: phone || account.phone })
      const memberIds = new Set(db.muzakkiMemberships.filter((item) => item.userId === user.id).map((item) => item.personId))
      db.persons.filter((item) => memberIds.has(item.id)).forEach((person) => Object.assign(person, { name, email, phone: phone || person.phone }))
    }
    auditSecurity('ACCOUNT_PROFILE_UPDATED', `Profil dan kontak akun ${user.id} diperbarui; kanal kontak yang berubah telah diverifikasi.`, user)
    A.persist()
  }
  function otpFlowMarkup() {
    const flow = state.authFlow
    const challenges = findFlowChallenges(flow)
    const title = flow?.purpose === 'login' ? 'Verifikasi kontak sebelum masuk' :
      flow?.purpose === 'password-reset' ? 'Verifikasi pemulihan password' :
      flow?.purpose === 'password-change' ? 'Konfirmasi perubahan password' :
      flow?.purpose === 'profile-update' ? 'Verifikasi perubahan kontak' :
      flow?.purpose === 'account-verify' ? 'Verifikasi kontak akun' : 'Verifikasi kontak'
    const pending = challenges.filter((item) => item.status !== 'verified')
    const fields = pending.map((item) => `<div class="field"><label for="auth-otp-${esc(item.channel)}">Kode OTP ${item.channel === 'email' ? 'Email' : 'Nomor HP'} · ${esc(maskContact(item.destination, item.channel))}</label><input id="auth-otp-${esc(item.channel)}" name="otp_${esc(item.channel)}" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" required></div>`).join('')
    const statuses = challenges.filter((item) => item.status === 'verified').map((item) => `<div class="alert light">✓ ${item.channel === 'email' ? 'Email' : 'Nomor HP'} ${esc(maskContact(item.destination, item.channel))} sudah diverifikasi.</div>`).join('')
    const codes = pending.map((item) => `<div class="mini-item"><span>OTP demo ${item.channel === 'email' ? 'Email' : 'Nomor HP'}</span><b class="mono">${esc(item.code)}</b></div>`).join('')
    const body = `<div class="alert warn">Kode hanya ditampilkan untuk simulasi lokal dan tidak dikirim melalui email, WhatsApp, atau SMS. Dalam produksi, kode harus dikirim melalui provider dan diverifikasi di server.</div>
      <p>Setiap kode berlaku 5 menit, maksimal 5 percobaan, dan dapat dikirim ulang maksimal 3 kali dengan jeda 30 detik.</p>
      ${statuses}<section class="card"><h3>Kode OTP demo</h3><div class="mini-list">${codes || '<div class="mini-item"><span>Status</span><b>Menunggu penyelesaian</b></div>'}</div></section>
      <form class="auth-form" data-auth-form="verify-otp">${fields || '<p class="caption">Seluruh kanal telah diverifikasi.</p>'}<div class="form-actions"><button class="btn primary" type="submit">Verifikasi dan lanjutkan</button><button class="btn" type="button" data-auth-action="otp-resend" ${pending.length ? '' : 'disabled'}>Kirim ulang OTP demo</button></div></form>
      <p class="caption"><button type="button" class="auth-link" data-auth-action="otp-cancel">Batalkan proses</button></p>`
    if (state.page === 'login' && !A.user()) return authShell(title, 'Verifikasi diperlukan untuk memastikan email dan nomor HP yang digunakan benar-benar dikuasai pemilik akun.', body)
    return `<section class="card auth-security-flow"><h2>${title}</h2><p>Verifikasi diperlukan untuk melanjutkan perubahan akun.</p>${body}</section>`
  }
  function resetPasswordMarkup() {
    const body = `<form class="auth-form" data-auth-form="reset-password"><div class="field"><label>Password baru</label><input name="password" type="password" minlength="8" autocomplete="new-password" required></div><div class="field"><label>Ulangi password baru</label><input name="passwordConfirm" type="password" minlength="8" autocomplete="new-password" required></div><div class="form-actions"><button type="submit" class="btn primary">Simpan password baru</button></div></form>`
    if (state.page === 'login' && !A.user()) return authShell('Buat password baru', 'Kode OTP sudah diverifikasi. Buat password baru untuk akun Anda.', body)
    return `<section class="card"><h2>Buat password baru</h2><p>Kode OTP sudah diverifikasi. Buat password baru untuk akun Anda.</p>${body}</section>`
  }
  function accountSettingsMarkup() {
    const user = A.user()
    if (!user) return '<div class="alert warn">Akun tidak ditemukan.</div>'
    if (state.authFlow && state.authFlow.origin === 'account') return otpFlowMarkup()
    if (state.authView === 'reset-password' && state.authResetOrigin === 'account') return resetPasswordMarkup()
    const account = db.accounts.find((item) => item.userId === user.id)
    const emailVerified = Boolean(user.emailVerifiedAt)
    const phoneVerified = Boolean(user.phoneVerifiedAt)
    return `<section class="card"><div class="card-top"><div><h2>Profil dan kontak akun</h2><p class="caption">Perubahan email atau nomor HP baru berlaku setelah OTP pada kontak yang berubah berhasil diverifikasi.</p></div><span class="tag info">${esc(user.role || 'Admin SiZisNur')}</span></div>
      <form data-auth-form="account-profile"><div class="grid-form">${A.fld('Nama lengkap / nama tampilan *','name',user.name || account?.displayName || '','text','required autocomplete="name"')}${A.fld('Email akun *','email',user.email || account?.email || '','email','required autocomplete="email"')}${A.fld('Nomor HP'+(user.scope === 'platform' ? ' (opsional)' : ' *'),'phone',user.phone || account?.phone || '','tel',user.scope === 'platform' ? 'autocomplete="tel"' : 'required autocomplete="tel"')}</div><div class="form-actions"><button class="btn primary" type="submit">Simpan profil dan verifikasi kontak</button></div></form>
      <h3>Status verifikasi kontak</h3><div class="mini-list"><div class="mini-item"><span>Email · ${esc(maskContact(user.email, 'email'))}</span><b>${emailVerified ? '<span class="tag ok">Terverifikasi</span>' : '<span class="tag warn">Belum diverifikasi</span>'}</b></div><div class="mini-item"><span>Nomor HP · ${esc(maskContact(user.phone, 'phone'))}</span><b>${user.phone ? (phoneVerified ? '<span class="tag ok">Terverifikasi</span>' : '<span class="tag warn">Belum diverifikasi</span>') : '<span class="tag muted">Belum diisi</span>'}</b></div></div>
      ${(!emailVerified || (user.phone && !phoneVerified)) ? '<div class="form-actions"><button type="button" class="btn" data-auth-action="verify-account-contacts">Verifikasi kontak sekarang</button></div>' : ''}</section>
      <section class="card"><h2>Keamanan password</h2><p class="caption">Perubahan password memerlukan password saat ini dan verifikasi OTP pada semua kontak akun yang tersedia.</p><form data-auth-form="change-password"><div class="grid-form">${A.fld('Password saat ini *','currentPassword','','password','required autocomplete="current-password"')}${A.fld('Password baru *','password','','password','required minlength="8" autocomplete="new-password"')}${A.fld('Ulangi password baru *','passwordConfirm','','password','required minlength="8" autocomplete="new-password"')}</div><div class="form-actions"><button class="btn primary" type="submit">Ubah password</button><button class="btn ghost" type="button" data-auth-action="forgot-from-account">Lupa password?</button></div></form></section>
      <div class="alert light">SiZisNur masih berupa prototype browser. OTP demo terlihat pada layar dan data tersimpan di perangkat ini; jangan gunakan data atau password pribadi yang sebenarnya.</div>`
  }
  function authShell(title, description, body) {
    return `<div class="auth auth-v2">
      <section class="auth-art">
        <div class="login-brand"><img src="assets/sizisnur-logo-mark.png" alt="Logo SiZisNur"><strong>SiZis<span>Nur</span></strong></div>
        <div class="eyebrow">LAYANAN DIGITAL ZAKAT · PROTOTYPE V5</div>
        <h1>Amanah zakat,<br><em>lebih tertata.</em></h1>
        <p>Ruang layanan mandiri Muzakki dan ruang kerja Panitia dipisahkan agar setiap pengguna masuk melalui jalur yang sesuai dengan perannya.</p>
        <div class="pill">Simulasi autentikasi · Browser lokal</div>
        <div class="login-hero-list">
          <div>✓ Muzakki membuat akun pribadi secara mandiri.</div>
          <div>✓ Akun Panitia dibuat oleh Admin lembaga.</div>
          <div>✓ Lembaga baru harus melalui proses pengajuan dan persetujuan.</div>
        </div>
      </section>
      <section class="auth-main"><div class="auth-box">
        <button type="button" class="login-back" data-action="back-home">← Kembali ke beranda</button>
        <span class="tag info">AKSES SiZisNur</span><h2>${title}</h2><p>${description}</p>
        ${body}
        <div class="auth-footnote">Prototype ini menyimpan akun dan hash password di browser perangkat ini. Belum terhubung ke server autentikasi, OAuth, email, atau penyimpanan lintas perangkat. Jangan gunakan password penting.</div>
      </div></section>
    </div><div id="modal-root"></div>`
  }
  function socialButtons() {
    return `<div class="auth-divider"><span>atau masuk dengan</span></div>
      <div class="auth-social-grid">
        <button type="button" class="auth-social" data-auth-social="Google"><b class="social-google">G</b>Google</button>
        <button type="button" class="auth-social" data-auth-social="Facebook"><b class="social-facebook">f</b>Facebook</button>
        <button type="button" class="auth-social" data-auth-social="Apple"><b class="social-apple">●</b>Apple</button>
      </div><p class="caption">Login sosial ditampilkan sebagai rancangan antarmuka. Integrasi OAuth memerlukan konfigurasi provider dan backend.</p>`
  }
  function loginMarkup(role) {
    const isMuzakki = role === 'muzakki'
    const label = isMuzakki ? 'Muzakki' : 'Panitia'
    return authShell(`Login sebagai ${label}`, isMuzakki
      ? 'Masuk ke akun pribadi untuk melihat dashboard zakat, layanan mandiri, dan rencana pembayaran.'
      : 'Masuk ke ruang kerja lembaga menggunakan akun yang dibuat oleh Admin lembaga.',
    `<button type="button" class="btn sm ghost" data-auth-view="choose">← Ganti jenis login</button>
      <form class="auth-form" data-auth-form="login" data-role="${role}">
        ${!isMuzakki ? `<div class="field"><label for="auth-account-role">Peran Panitia</label><select id="auth-account-role" name="accountRole" required><option value="">Pilih role akun</option>${A.ROLES.filter((item) => item !== 'Muzakki').map((item) => `<option value="${esc(item)}">${esc(item)}</option>`).join('')}</select></div>` : ''}
        <div class="field"><label for="auth-identifier">Email atau Nomor HP</label><input id="auth-identifier" name="identifier" type="text" placeholder="${isMuzakki ? 'nama@email.com atau nomor HP' : 'email atau nomor HP panitia'}" autocomplete="username" required></div>
        <div class="field"><label for="auth-password">Password</label><input id="auth-password" name="password" type="password" placeholder="Masukkan password" autocomplete="current-password" required></div>
        <label class="check auth-remember"><input type="checkbox" name="remember"> Ingat saya di perangkat ini</label>
        <div class="form-actions"><button class="btn primary auth-submit" type="submit">Login sebagai ${label}</button></div>
      </form><p class="auth-register-link"><button type="button" data-auth-view="forgot-password" data-auth-role="${role}">Lupa password?</button></p>${socialButtons()}
      ${isMuzakki
        ? `<p class="auth-register-link">Tidak punya akun? <button type="button" data-auth-view="register-muzakki">Daftar di sini</button></p>`
        : `<div class="alert light">Akun Panitia tidak dapat dibuat sendiri. Admin lembaga membuat akun petugas melalui menu <b>Akun & Peran</b>. Belum memiliki lembaga? Ajukan lembaga terlebih dahulu.</div><p class="auth-register-link">Ingin mendaftarkan lembaga? <button type="button" data-auth-view="register-institution">Daftarkan lembaga di sini</button></p>`}
      <p class="caption"><button type="button" class="auth-link" data-auth-view="demo">Akses Demo Langsung per akun / role</button></p>`)
  }
  function forgotPasswordMarkup() {
    const role = state.authRecoveryRole || 'muzakki'
    const isPanitia = role === 'panitia'
    return authShell('Lupa password', 'Masukkan email atau nomor HP yang terdaftar. Akun Panitia harus memilih role agar akun yang tepat dapat ditemukan.',
      `<button type="button" class="btn sm ghost" data-auth-view="${isPanitia ? 'login-panitia' : 'login-muzakki'}">← Kembali ke login</button>
      <form class="auth-form" data-auth-form="forgot-password" data-role="${role}">
        ${isPanitia ? `<div class="field"><label for="recovery-account-role">Peran Panitia</label><select id="recovery-account-role" name="accountRole" required><option value="">Pilih role akun</option>${A.ROLES.filter((item) => item !== 'Muzakki').map((item) => `<option value="${esc(item)}">${esc(item)}</option>`).join('')}</select></div>` : ''}
        <div class="field"><label>Email atau Nomor HP</label><input name="identifier" type="text" autocomplete="username" required placeholder="nama@email.com atau nomor HP"></div>
        <div class="form-actions"><button class="btn primary" type="submit">Lanjutkan verifikasi OTP</button></div>
      </form><div class="alert light">Untuk keamanan, pemulihan password harus membuktikan penguasaan kontak akun melalui OTP. Pada simulasi, kode tampil di browser dan tidak benar-benar dikirim.</div>`)
  }

  function demoMarkup() {
    const tenantName = (id) => db.tenants.find((tenant) => tenant.id === id)?.name || 'Belum terhubung lembaga'
    const userTiles = (db.users || []).filter((user) => user.active).map((user) => `<button type="button" class="auth-demo-tile" data-auth-demo="${esc(user.id)}"><b>${esc(user.name)}${user.callName ? ` · ${esc(user.callName)}` : ''}</b><span>${esc(user.role)} · ${esc(tenantName(user.tenantId))}</span><small>${esc(user.email || user.id)}${user.phone ? ` · ${esc(user.phone)}` : ''}</small></button>`).join('')
    const rootTiles = (db.platformAdmins || []).filter((user) => user.active).map((user) => `<button type="button" class="auth-demo-tile auth-demo-root" data-auth-demo="${esc(user.id)}"><b>${esc(user.name)}</b><span>Admin SiZisNur · Konsol platform</span><small>${esc(user.email || user.id)}</small></button>`).join('')
    return authShell('Akses Demo Langsung', 'Pilih akun contoh untuk langsung membuka dashboard sesuai role. Halaman ini terpisah dari simulasi login email dan password.',
      `<button type="button" class="btn sm ghost" data-auth-view="choose">← Kembali ke pilihan akses</button>
      <div class="alert warn">Akses ini melewati form login hanya untuk demonstrasi dan pengujian antarmuka. Jangan gunakan sebagai mekanisme akses produksi.</div>
      <h3 class="auth-section-heading">Akun pengguna lembaga</h3><div class="auth-demo-grid">${userTiles || '<p class="empty">Belum ada akun demo.</p>'}</div>
      <h3 class="auth-section-heading">Pengelola platform</h3><div class="auth-demo-grid">${rootTiles || '<p class="empty">Belum ada akun platform.</p>'}</div>`)
  }
  function registerMuzakkiMarkup() {
    return authShell('Daftar akun Muzakki', 'Buat akun pribadi terlebih dahulu. Pemilihan dan pendaftaran lembaga dilakukan setelah berhasil login.',
      `<button type="button" class="btn sm ghost" data-auth-view="login-muzakki">← Kembali ke login Muzakki</button>
      <form class="auth-form" data-auth-form="register-muzakki">
        <div class="grid-form">
          ${A.fld('Nama lengkap *','name','','text','required autocomplete="name"')}
          ${A.fld('Nomor HP *','phone','','tel','required autocomplete="tel"')}
          ${A.fld('Email *','email','','email','required autocomplete="email"')}
          ${A.textarea('Alamat lengkap *','address','').replace('<textarea ', '<textarea required ')}
          ${A.fld('Buat password *','password','','password','required minlength="8" autocomplete="new-password"')}
          ${A.fld('Ulangi password *','passwordConfirm','','password','required minlength="8" autocomplete="new-password"')}
        </div>
        <div class="alert light">Data profil yang diminta tetap nama, nomor HP, email, dan alamat lengkap. Password ditambahkan sebagai kredensial agar akun dapat digunakan untuk login berikutnya.</div>
        <div class="form-actions"><button class="btn primary auth-submit" type="submit">Buat akun Muzakki</button></div>
      </form>`)
  }
  function registerInstitutionMarkup() {
    return authShell('Pendaftaran Lembaga', 'Formulir ini mengajukan lembaga baru, bukan membuat akun Panitia. Akun Admin awal baru disiapkan setelah pengajuan ditinjau dan disetujui Admin SiZisNur.',
      `<button type="button" class="btn sm ghost" data-auth-view="login-panitia">← Kembali ke login Panitia</button>
      <form class="auth-form" data-auth-form="register-institution">
        <div class="grid-form">
          ${A.fld('Nama masjid / lembaga *','name','','text','required')}
          ${A.fld('Nama penanggung jawab *','contact','','text','required')}
          ${A.fld('Email penanggung jawab *','email','','email','required')}
          ${A.fld('Nomor HP penanggung jawab *','phone','','tel','required autocomplete="tel"')}
          ${A.textarea('Alamat lengkap lembaga *','address','').replace('<textarea ', '<textarea required ')}
        </div>
        <label class="check auth-terms"><input type="checkbox" name="terms" required> Saya memahami bahwa ini adalah pengajuan lembaga dan harus melalui proses peninjauan.</label>
        <div class="alert light">Setelah disetujui, sistem membuat satu akun Admin awal untuk lembaga tersebut. Akun Amil, Operator, Bendahara, Relawan, dan Pengurus dibuat oleh Admin lembaga melalui menu Akun & Peran.</div>
        <div class="form-actions"><button class="btn primary auth-submit" type="submit">Kirim pengajuan lembaga</button></div>
      </form>`)
  }
  function firstPasswordMarkup() {
    return authShell('Buat password baru', 'Akun Admin lembaga ini baru saja diaktifkan. Ganti password sementara sebelum masuk ke ruang kerja lembaga.',
      `<form class="auth-form" data-auth-form="first-password">
        <div class="field"><label>Password baru</label><input name="password" type="password" minlength="8" autocomplete="new-password" required></div>
        <div class="field"><label>Ulangi password baru</label><input name="passwordConfirm" type="password" minlength="8" autocomplete="new-password" required></div>
        <div class="form-actions"><button class="btn primary auth-submit" type="submit">Simpan password dan lanjutkan</button></div>
      </form>`)
  }
  function institutionSubmittedMarkup() {
    return authShell('Pengajuan lembaga terkirim', 'Pengajuan telah disimpan dalam prototype dan menunggu peninjauan Admin SiZisNur.',
      `<div class="alert light"><b>Pengajuan berhasil dicatat.</b><br>ID pengajuan: <span class="mono">${esc(state.lastInstitutionApplicationId || '—')}</span><br>Belum ada akun Panitia yang dibuat. Akun Admin awal akan disiapkan jika pengajuan disetujui.</div>
      <div class="form-actions"><button class="btn primary" type="button" data-auth-view="login-panitia">Kembali ke login Panitia</button></div>`)
  }
  function chooseMarkup() {
    return authShell('Selamat datang di SiZisNur', 'Pilih jalur masuk sesuai kebutuhan Anda. Form login dan pendaftaran untuk Muzakki serta Panitia memiliki proses berbeda.',
      `<div class="auth-choice-grid">
        <button type="button" class="auth-choice" data-auth-view="login-muzakki"><span class="auth-choice-icon">♙</span><b>Login sebagai Muzakki</b><small>Akun pribadi, layanan mandiri, dan pembayaran zakat.</small><strong>Masuk sebagai Muzakki →</strong></button>
        <button type="button" class="auth-choice" data-auth-view="login-panitia"><span class="auth-choice-icon">▦</span><b>Login sebagai Panitia</b><small>Ruang kerja Admin, Amil, Operator, Bendahara, Relawan, dan Pengurus.</small><strong>Masuk sebagai Panitia →</strong></button>
      </div>
      <div class="auth-demo-separate"><div><b>Perlu menguji role tanpa simulasi login?</b><p>Akses demo langsung disediakan di halaman terpisah dan tidak digabung dengan form login.</p></div><button type="button" class="btn" data-auth-view="demo">Akses Demo Langsung</button></div>
      <div class="auth-public-links"><button type="button" class="btn sm ghost" data-action="public">Portal publik</button></div>`)
  }
  function authMarkup() {
    const view = state.authView || 'choose'
    if (view === 'login-muzakki') return loginMarkup('muzakki')
    if (view === 'login-panitia') return loginMarkup('panitia')
    if (view === 'register-muzakki') return registerMuzakkiMarkup()
    if (view === 'register-institution') return registerInstitutionMarkup()
    if (view === 'forgot-password') return forgotPasswordMarkup()
    if (view === 'otp') return otpFlowMarkup()
    if (view === 'reset-password') return resetPasswordMarkup()
    if (view === 'demo') return demoMarkup()
    if (view === 'first-password') return firstPasswordMarkup()
    if (view === 'institution-submitted') return institutionSubmittedMarkup()
    return chooseMarkup()
  }

  const previousRender = A.render
  A.set('render', function renderWithAuthFlow() {
    if (state.page === 'login' && !A.user()) {
      document.body.classList.toggle('dark', window.localStorage?.getItem('sizisnur_theme') === 'dark')
      const root = $('app')
      if (root) root.innerHTML = authMarkup()
      const modalRoot = $('modal-root')
      if (modalRoot) modalRoot.innerHTML = ''
      return
    }
    return previousRender()
  })

  function switchView(view) {
    state.page = 'login'
    state.authView = view
    state.modal = null
    A.render()
    window.scrollTo?.(0, 0)
  }
  function allAccounts() { return [...(db.users || []), ...(db.platformAdmins || [])] }
  function findAccounts(identifier) {
    const key = fmtEmail(identifier)
    const phoneKey = /[a-z]/i.test(String(identifier || '')) || String(identifier || '').includes('@') ? '' : fmtPhone(identifier)
    return allAccounts().filter((user) => {
      const accountPhone = user.phone || db.accounts?.find((account) => account.userId === user.id)?.phone
      return fmtEmail(user.email) === key ||
        fmtEmail(user.username) === key ||
        String(user.id || '').toLowerCase() === key ||
        (!!phoneKey && !!fmtPhone(accountPhone) && fmtPhone(accountPhone) === phoneKey)
    })
  }
  function finishLogin(account, remember = false, role = account.role === 'Muzakki' ? 'muzakki' : 'panitia') {
    state.authFlow = null
    state.pendingAuthUserId = null
    if (account.mustChangePassword) {
      state.pendingAuthUserId = account.id
      switchView('first-password')
      A.toast('Password sementara benar. Silakan buat password baru.', 'success')
      return
    }
    state.authView = 'choose'
    A.login(account.id, remember)
    A.toast(`Login ${role === 'muzakki' ? 'Muzakki' : 'Panitia'} berhasil.`, 'success')
  }
  function finalizeMuzakkiRegistration(data, challenges) {
    const verified = Object.fromEntries(challenges.map((item) => [item.channel, item.verifiedAt || A.now()]))
    const name = String(data.name || '').trim()
    const phone = String(data.phone || '').trim()
    const email = fmtEmail(data.email)
    const address = String(data.address || '').trim()
    const credentialPromise = hashPassword(data.password)
    return credentialPromise.then((credential) => {
      const userId = A.id('US')
      const accountId = A.id('ACC')
      const user = { id: userId, tenantId: null, name, role: 'Muzakki', email, phone, emailVerifiedAt: verified.email || null, phoneVerifiedAt: verified.phone || null, active: true, personId: null, accountId, passwordAuth: credential, mustChangePassword: false, createdAt: A.now() }
      db.users.push(user)
      db.accounts.push({ id: accountId, userId, displayName: name, phone, email, address, consentAt: null, createdAt: A.now() })
      A.aud('MUZAKKI_REGISTER', `Akun Muzakki mandiri ${userId} dibuat setelah verifikasi email dan nomor HP`)
      A.persist()
      state.authFlow = null
      state.authView = 'choose'
      A.login(userId, false)
      A.toast('Akun Muzakki berhasil dibuat setelah email dan nomor HP diverifikasi. Silakan pilih lembaga pada menu Layanan Mandiri.', 'success')
    })
  }
  function finalizeInstitutionApplication(data, challenges) {
    const verified = Object.fromEntries(challenges.map((item) => [item.channel, item.verifiedAt || A.now()]))
    const applicationId = A.id('APP')
    db.applications.push({
      id: applicationId, name: data.name, contact: data.contact, email: fmtEmail(data.email), phone: data.phone,
      address: data.address, status: 'menunggu', createdAt: A.today(),
      emailVerifiedAt: verified.email || null, phoneVerifiedAt: verified.phone || null,
      note: 'Menunggu peninjauan Admin SiZisNur; kontak pemohon telah diverifikasi melalui OTP simulasi.',
    })
    state.lastInstitutionApplicationId = applicationId
    state.authFlow = null
    state.authView = 'institution-submitted'
    A.persist()
    A.render()
    A.toast('Pengajuan lembaga berhasil dikirim setelah email dan nomor HP diverifikasi.', 'success')
  }
  async function completeOtpFlow(formData = {}) {
    const flow = state.authFlow
    if (!flow) throw new Error('Sesi verifikasi tidak ditemukan. Mulai kembali prosesnya.')
    const challenges = findFlowChallenges(flow)
    if (!challenges.length) throw new Error('Kode OTP tidak ditemukan. Buat ulang proses verifikasi.')
    for (const challenge of challenges) {
      if (challenge.status === 'verified') continue
      if (challenge.status !== 'active') {
        A.render()
        throw new Error('Kode OTP tidak lagi aktif. Mulai ulang proses verifikasi.')
      }
      if (Date.now() > Date.parse(challenge.expiresAt || '')) {
        challenge.status = 'expired'
        challenge.code = null
        A.persist()
        A.render()
        throw new Error('OTP demo sudah kedaluwarsa. Minta kode baru untuk melanjutkan.')
      }
      const supplied = String(formData[`otp_${challenge.channel}`] || '').trim()
      if (supplied !== challenge.code) {
        challenge.attempts += 1
        if (challenge.attempts >= challenge.maxAttempts) { challenge.status = 'locked'; challenge.code = null }
        A.persist()
        A.render()
        throw new Error(challenge.status === 'locked' ? 'Batas 5 percobaan OTP tercapai. Mulai ulang proses verifikasi.' : `Kode OTP ${challenge.channel === 'email' ? 'email' : 'nomor HP'} tidak sesuai. Periksa kode demo yang ditampilkan.`)
      }
      challenge.status = 'verified'
      challenge.verifiedAt = A.now()
      challenge.code = null
      A.persist()
    }
    if (challenges.some((item) => item.status !== 'verified')) {
      A.render()
      return
    }
    const verifiedAt = Object.fromEntries(challenges.map((item) => [item.channel, item.verifiedAt || A.now()]))
    const user = flow.userId ? allAccounts().find((item) => item.id === flow.userId) : null
    if (flow.purpose === 'register-muzakki') {
      await finalizeMuzakkiRegistration(flow.data, challenges)
      return
    }
    if (flow.purpose === 'institution-application') {
      finalizeInstitutionApplication(flow.data, challenges)
      return
    }
    if (flow.purpose === 'login') {
      if (!user || user.active === false) throw new Error('Akun tidak lagi aktif. Silakan hubungi Admin.')
      if (verifiedAt.email) user.emailVerifiedAt = verifiedAt.email
      if (verifiedAt.phone) user.phoneVerifiedAt = verifiedAt.phone
      auditSecurity('LOGIN_CONTACT_VERIFIED', `Kontak akun ${user.id} diverifikasi sebelum login.`, user)
      A.persist()
      const remember = Boolean(flow.data.remember)
      const role = flow.role
      finishLogin(user, remember, role)
      return
    }
    if (flow.purpose === 'password-reset') {
      if (!user || user.active === false) throw new Error('Akun tidak lagi aktif.')
      if (verifiedAt.email) user.emailVerifiedAt = verifiedAt.email
      if (verifiedAt.phone) user.phoneVerifiedAt = verifiedAt.phone
      auditSecurity('PASSWORD_RECOVERY_CONTACT_VERIFIED', `Kontak akun ${user.id} diverifikasi untuk pemulihan password.`, user)
      A.persist()
      state.authResetUserId = user.id
      state.authResetOrigin = flow.origin
      state.authResetRole = flow.role
      state.authFlow = null
      state.authView = 'reset-password'
      A.render()
      return
    }
    if (flow.purpose === 'password-change') {
      if (!user || user.active === false) throw new Error('Akun tidak lagi aktif.')
      if (verifiedAt.email) user.emailVerifiedAt = verifiedAt.email
      if (verifiedAt.phone) user.phoneVerifiedAt = verifiedAt.phone
      user.passwordAuth = await hashPassword(flow.data.password)
      user.mustChangePassword = false
      user.passwordProvision = 'changed-after-otp-verification'
      auditSecurity('PASSWORD_CHANGED', `Password akun ${user.id} diubah setelah verifikasi OTP.`, user)
      state.authFlow = null
      state.authView = 'choose'
      A.persist()
      A.render()
      A.toast('Password berhasil diperbarui setelah OTP diverifikasi.', 'success')
      return
    }
    if (flow.purpose === 'profile-update') {
      if (!user || A.user()?.id !== user.id) throw new Error('Sesi akun berubah. Ulangi pembaruan profil.')
      await applyVerifiedProfile(user, flow.data, challenges)
      state.authFlow = null
      state.authView = 'choose'
      A.render()
      A.toast('Profil tersimpan dan kontak berhasil diverifikasi.', 'success')
      return
    }
    if (flow.purpose === 'account-verify') {
      if (!user) throw new Error('Akun tidak lagi tersedia.')
      if (verifiedAt.email) user.emailVerifiedAt = verifiedAt.email
      if (verifiedAt.phone) user.phoneVerifiedAt = verifiedAt.phone
      auditSecurity('ACCOUNT_CONTACT_VERIFIED', `Kontak akun ${user.id} diverifikasi dari pengaturan akun.`, user)
      state.authFlow = null
      A.persist()
      A.render()
      A.toast('Verifikasi kontak akun berhasil.', 'success')
    }
  }
  async function authenticate(identifier, password, role, accountRole = '') {
    await initializeCredentials()
    let candidates = findAccounts(identifier).filter((account) => account.active !== false)
    if (role === 'muzakki') {
      candidates = candidates.filter((account) => account.role === 'Muzakki')
    } else if (role === 'panitia') {
      candidates = candidates.filter((account) => !!account.tenantId && account.scope !== 'platform' && account.role !== 'Muzakki')
      if (accountRole) candidates = candidates.filter((account) => account.role === accountRole)
    }
    candidates = candidates.filter((account) => account.scope !== 'platform' && account.role !== 'Admin SiZisNur')
    const authenticated = []
    for (const account of candidates) {
      if (await verifyPassword(password, account.passwordAuth)) authenticated.push(account)
    }
    if (!authenticated.length) throw new Error('Email/nomor HP atau password tidak sesuai, atau akun tidak aktif.')
    if (authenticated.length > 1) {
      throw new Error('Kontak ini cocok dengan lebih dari satu akun. Pilih role yang tepat atau minta Admin memastikan data akun.')
    }
    const account = authenticated[0]
    const missingChannels = contactChannels(account, true)
    if (missingChannels.length) {
      startOtpFlow({
        purpose: 'login', user: account, channels: missingChannels, role,
        data: { remember: !!document.querySelector('[data-auth-form="login"] [name="remember"]')?.checked }, origin: 'login',
      })
      A.toast('Password benar. Verifikasi OTP pada kontak yang belum diverifikasi untuk melanjutkan login.', 'success')
      return
    }
    finishLogin(account, !!document.querySelector('[data-auth-form="login"] [name="remember"]')?.checked, role)
  }
  async function registerMuzakki(data) {
    const name = String(data.name || '').trim()
    const phone = String(data.phone || '').trim()
    const email = fmtEmail(data.email)
    const address = String(data.address || '').trim()
    const password = String(data.password || '')
    if (!name || !phone || !email || !address) throw new Error('Nama lengkap, nomor HP, email, dan alamat lengkap wajib diisi.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Format email belum valid.')
    if (!/^\d{9,15}$/.test(fmtPhone(phone))) throw new Error('Nomor HP belum valid.')
    if (password.length < 8) throw new Error('Password harus minimal 8 karakter.')
    if (password !== String(data.passwordConfirm || '')) throw new Error('Konfirmasi password tidak sama.')
    const phoneKey = fmtPhone(phone)
    if (db.accounts.some((account) => fmtEmail(account.email) === email || (phoneKey && fmtPhone(account.phone) === phoneKey)) || db.users.some((user) => user.role === 'Muzakki' && (fmtEmail(user.email) === email || (phoneKey && fmtPhone(user.phone || db.accounts.find((account) => account.userId === user.id)?.phone) === phoneKey)))) {
      throw new Error('Nomor HP atau email sudah digunakan oleh akun Muzakki. Silakan login dengan akun yang sudah ada.')
    }
    startOtpFlow({ purpose: 'register-muzakki', channels: [{ channel: 'email', destination: email }, { channel: 'phone', destination: phone }], data, role: 'muzakki', origin: 'login' })
    A.toast('OTP simulasi dibuat untuk email dan nomor HP. Selesaikan kedua verifikasi sebelum akun dibuat.', 'success')
  }
  async function submitInstitutionApplication(data) {
    const name = String(data.name || '').trim()
    const contact = String(data.contact || '').trim()
    const email = fmtEmail(data.email)
    const phone = String(data.phone || '').trim()
    const address = String(data.address || '').trim()
    if (!db.platformSettings?.publicRegistrationOpen) throw new Error('Pendaftaran lembaga sedang ditutup oleh Admin SiZisNur.')
    if (!name || !contact || !email || !phone || !address) throw new Error('Nama lembaga, penanggung jawab, email, nomor HP, dan alamat wajib diisi.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Format email belum valid.')
    if (!/^\d{9,15}$/.test(fmtPhone(phone))) throw new Error('Nomor HP penanggung jawab belum valid.')
    if (data.terms !== 'on' && data.terms !== 'yes') throw new Error('Persetujuan pengajuan lembaga wajib dicentang.')
    if (db.platformAdmins.some((user) => fmtEmail(user.email) === email)) throw new Error('Email tersebut digunakan oleh akun Admin SiZisNur.')
    if (db.applications.some((item) => item.status === 'menunggu' && fmtEmail(item.email) === email)) throw new Error('Masih ada pengajuan lembaga yang menunggu dengan email ini.')
    startOtpFlow({ purpose: 'institution-application', channels: [{ channel: 'email', destination: email }, { channel: 'phone', destination: phone }], data: { name, contact, email, phone, address }, role: 'panitia', origin: 'login' })
    A.toast('OTP simulasi dibuat untuk email dan nomor HP. Pengajuan dikirim setelah kedua kontak diverifikasi.', 'success')
  }
  async function beginPasswordRecovery(identifier, role, accountRole = '', origin = 'login') {
    let candidates = findAccounts(identifier).filter((account) => account.active !== false)
    if (role === 'muzakki') candidates = candidates.filter((account) => account.role === 'Muzakki')
    else if (role === 'panitia') {
      candidates = candidates.filter((account) => !!account.tenantId && account.scope !== 'platform' && account.role !== 'Muzakki')
      if (accountRole) candidates = candidates.filter((account) => account.role === accountRole)
    }
    if (candidates.length !== 1) throw new Error('Akun tidak ditemukan atau kontak cocok dengan lebih dari satu akun. Periksa identifier dan role yang dipilih.')
    const user = candidates[0]
    const channels = contactChannels(user, false)
    startOtpFlow({ purpose: 'password-reset', user, channels, role, origin, data: {} })
    A.toast('OTP pemulihan dibuat pada kontak akun yang terdaftar.', 'success')
  }
  async function updateAccountProfile(data) {
    const user = A.user()
    if (!user) throw new Error('Sesi akun tidak ditemukan.')
    const name = String(data.name || '').trim()
    const email = fmtEmail(data.email)
    const phone = String(data.phone || '').trim()
    if (!name || !email) throw new Error('Nama dan email akun wajib diisi.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Format email belum valid.')
    if (user.scope !== 'platform' && !/^\d{9,15}$/.test(fmtPhone(phone))) throw new Error('Nomor HP belum valid.')
    const channels = contactChannels(user, true, { email, phone })
    if (fmtEmail(user.email) !== email) channels.push({ channel: 'email', destination: email })
    if (fmtPhone(user.phone) !== fmtPhone(phone) && phone) channels.push({ channel: 'phone', destination: phone })
    const unique = [...new Map(channels.map((item) => [item.channel, item])).values()]
    if (!unique.length) {
      await applyVerifiedProfile(user, { name, email, phone }, [])
      A.render()
      A.toast('Profil akun berhasil diperbarui.', 'success')
      return
    }
    startOtpFlow({ purpose: 'profile-update', user, channels: unique, data: { name, email, phone }, origin: 'account' })
    A.toast('Verifikasi OTP diperlukan pada setiap kontak yang belum terverifikasi atau baru diubah.', 'success')
  }
  async function changeAccountPassword(data) {
    const user = A.user()
    if (!user) throw new Error('Sesi akun tidak ditemukan.')
    if (!await verifyPassword(data.currentPassword, user.passwordAuth)) throw new Error('Password saat ini tidak sesuai.')
    const password = String(data.password || '')
    if (password.length < 8) throw new Error('Password baru harus minimal 8 karakter.')
    if (password !== String(data.passwordConfirm || '')) throw new Error('Konfirmasi password baru tidak sama.')
    startOtpFlow({ purpose: 'password-change', user, channels: contactChannels(user, false), data: { password }, origin: 'account' })
    A.toast('Verifikasi OTP diperlukan sebelum password dapat diubah.', 'success')
  }
  async function changeFirstPassword(data) {
    const user = db.users.find((item) => item.id === state.pendingAuthUserId && item.active)
    if (!user || !user.mustChangePassword) throw new Error('Sesi penggantian password tidak tersedia. Silakan login kembali.')
    const password = String(data.password || '')
    if (password.length < 8) throw new Error('Password baru harus minimal 8 karakter.')
    if (password !== String(data.passwordConfirm || '')) throw new Error('Konfirmasi password tidak sama.')
    user.passwordAuth = await hashPassword(password)
    user.mustChangePassword = false
    user.passwordProvision = 'changed-by-user'
    A.persist()
    const id = user.id
    state.pendingAuthUserId = null
    A.login(id, false)
    A.toast('Password berhasil diperbarui dan Anda sudah masuk.', 'success')
  }
  async function savePanitiaAccount(form, data) {
    const current = A.user()
    if (current?.role !== 'Admin' || current.scope === 'platform') throw new Error('Hanya Admin lembaga yang dapat membuat dan mengelola akun Panitia.')
    const tenantId = A.tenantId()
    const id = form.dataset.id || ''
    let user = id ? db.users.find((item) => item.id === id && item.tenantId === tenantId) : null
    if (id && (!user || user.role === 'Muzakki')) throw new Error('Akun Panitia tidak ditemukan.')
    const name = String(data.name || '').trim()
    const callName = String(data.callName || '').trim()
    const email = fmtEmail(data.email)
    const phone = String(data.phone || '').trim()
    const phoneKey = fmtPhone(phone)
    const role = String(data.role || '')
    const allowedRoles = A.ROLES.filter((item) => item !== 'Muzakki')
    if (!name || !email || !phone || !allowedRoles.includes(role)) throw new Error('Nama lengkap, email, nomor HP, dan role Panitia wajib diisi.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Format email belum valid.')
    if (!/^\d{9,15}$/.test(phoneKey)) throw new Error('Nomor HP belum valid. Gunakan nomor yang dapat dihubungi.')
    if (db.platformAdmins.some((item) => fmtEmail(item.email) === email || (phoneKey && fmtPhone(item.phone) === phoneKey))) throw new Error('Kontak tersebut digunakan oleh akun Admin SiZisNur.')
    const duplicate = db.users.find((item) => item.id !== id && item.tenantId === tenantId && item.role === role && (fmtEmail(item.email) === email || (phoneKey && fmtPhone(item.phone) === phoneKey)))
    if (duplicate) {
      const matched = fmtEmail(duplicate.email) === email ? 'email' : 'nomor HP'
      throw new Error(`Akun ${role} dengan ${matched} tersebut sudah terdaftar pada Lembaga ini. Satu kontak tidak boleh digandakan dalam role yang sama.`)
    }
    const sameName = db.users.filter((item) => item.id !== id && item.tenantId === tenantId && item.role !== 'Muzakki' && fmtName(item.name) === fmtName(name))
    const sameNameDifferentPerson = sameName.some((item) => fmtEmail(item.email) !== email || fmtPhone(item.phone) !== phoneKey)
    if (sameNameDifferentPerson && (!callName || fmtName(callName) === fmtName(name))) throw new Error('Nama lengkap ini sudah dipakai pengguna lain. Isi Nama panggilan / penanda yang berbeda dari nama lengkap agar keduanya dapat dibedakan.')
    if (sameNameDifferentPerson && sameName.some((item) => fmtName(item.callName) && fmtName(item.callName) === fmtName(callName))) {
      throw new Error('Nama panggilan / penanda sudah digunakan oleh pengguna dengan nama lengkap yang sama.')
    }
    const password = String(data.password || '')
    const confirm = String(data.passwordConfirm || '')
    if (!user && password.length < 8) throw new Error('Password awal wajib diisi minimal 8 karakter.')
    if (password && password.length < 8) throw new Error('Password harus minimal 8 karakter.')
    if (password && password !== confirm) throw new Error('Konfirmasi password tidak sama.')
    const credential = password ? await hashPassword(password) : null
    const isNew = !user
    if (!user) user = { id: A.id('US'), tenantId, active: true, createdAt: A.now() }
    const contactChanged = fmtEmail(user.email) !== email || fmtPhone(user.phone) !== phoneKey
    Object.assign(user, { name, callName, email, phone, role, active: true })
    if (contactChanged) {
      user.emailVerifiedAt = null
      user.phoneVerifiedAt = null
    }
    if (credential) {
      user.passwordAuth = credential
      user.mustChangePassword = false
      user.passwordProvision = 'created-by-tenant-admin'
    }
    if (isNew) db.users.push(user)
    A.aud('USER', `${id ? 'Perbarui' : 'Buat'} akun ${role}: ${name}`)
    A.persist()
    state.modal = null
    A.render()
    A.toast(id ? 'Akun Panitia berhasil diperbarui.' : 'Akun Panitia berhasil dibuat. Bagikan kredensial secara aman.', 'success')
  }
  function showInitialAdminCredentials(applicationName, adminEmail, password) {
    A.modal('Pengajuan disetujui · Akun Admin awal dibuat', `<div class="alert light">Lembaga <b>${esc(applicationName)}</b> berhasil dibuat dalam prototype. Satu akun Admin awal telah disiapkan.</div>
      <div class="mini-list"><div class="mini-item"><span>Username / Email</span><b>${esc(adminEmail)}</b></div><div class="mini-item"><span>Password sementara</span><b class="mono">${esc(password)}</b></div></div>
      <div class="alert warn">Salin dan sampaikan kredensial ini kepada penanggung jawab melalui jalur yang aman. Password hanya ditampilkan pada konfirmasi ini. Saat login pertama, Admin diwajibkan mengganti password.</div>
      <div class="form-actions"><button type="button" class="btn primary" data-auth-close-modal>Mengerti</button></div>`)
  }
  async function reviewInstitutionApplication(form, data) {
    const platform = window.__SIZISNUR_PLATFORM_ADMIN
    if (!platform?.rootUser?.()) throw new Error('Hanya Admin SiZisNur yang dapat meninjau pengajuan lembaga.')
    const application = db.applications.find((item) => item.id === form.dataset.id && item.status === 'menunggu')
    if (!application) throw new Error('Pengajuan tidak ditemukan atau sudah ditinjau.')
    if (!String(data.note || '').trim()) throw new Error('Catatan peninjauan wajib diisi.')
    if (data.decision === 'ditolak') {
      application.status = 'ditolak'
      application.note = String(data.note).trim()
      application.reviewedAt = A.now()
      platform.writeRootAudit('APPLICATION_REVIEW', `Pengajuan ${application.name}: ditolak.`)
      A.persist(); state.modal = null; A.render(); A.toast(`Pengajuan ${application.name} ditolak.`)
      return
    }
    const adminName = String(data.adminName || application.contact || '').trim()
    const adminEmail = fmtEmail(data.adminEmail || application.email)
    const adminPhone = String(data.adminPhone || application.phone || '').trim()
    if (!adminName || !adminEmail || !adminPhone) throw new Error('Nama, email, dan nomor HP Admin awal wajib diisi.')
    if (db.platformAdmins.some((item) => fmtEmail(item.email) === adminEmail)) throw new Error('Email Admin awal digunakan akun Admin SiZisNur.')
    const password = temporaryPassword()
    const credential = await hashPassword(password)
    const tenant = platform.makeTenant({
      name: application.name, email: application.email, phone: application.phone || '', address: application.address,
      daerah: application.daerah || '', kelurahan: application.kelurahan || '', kecamatan: application.kecamatan || '', city: application.city || '', province: application.province || '',
      adminName, adminEmail, adminPhone, status: db.platformSettings?.defaultTenantStatus || 'aktif',
    })
    const admin = db.users.find((item) => item.tenantId === tenant.id && item.role === 'Admin' && fmtEmail(item.email) === adminEmail)
    if (!admin) throw new Error('Akun Admin awal gagal dibuat.')
    admin.passwordAuth = credential
    admin.mustChangePassword = true
    admin.passwordProvision = 'temporary-after-application-approval'
    admin.emailVerifiedAt = application.emailVerifiedAt || null
    admin.phoneVerifiedAt = application.phoneVerifiedAt || null
    application.tenantId = tenant.id
    application.adminEmail = adminEmail
    application.status = 'disetujui'
    application.note = String(data.note).trim()
    application.reviewedAt = A.now()
    platform.writeRootAudit('APPLICATION_REVIEW', `Pengajuan ${application.name}: disetujui dan Admin awal ${adminEmail} dibuat.`)
    A.persist()
    state.modal = null
    A.render()
    showInitialAdminCredentials(application.name, adminEmail, password)
  }
  async function createTenantFromRootForm(form, data) {
    const platform = window.__SIZISNUR_PLATFORM_ADMIN
    if (!platform?.rootUser?.()) throw new Error('Hanya Admin SiZisNur yang dapat membuat lembaga.')
    const password = String(data.adminPassword || '')
    if (password.length < 8 || password !== String(data.adminPasswordConfirm || '')) throw new Error('Password Admin awal minimal 8 karakter dan konfirmasinya harus sama.')
    const credential = await hashPassword(password)
    const tenant = platform.makeTenant({ ...data, status: db.platformSettings?.defaultTenantStatus || 'aktif' })
    const adminEmail = fmtEmail(data.adminEmail)
    const admin = db.users.find((item) => item.tenantId === tenant.id && fmtEmail(item.email) === adminEmail)
    if (!admin) throw new Error('Akun Admin awal tidak ditemukan setelah lembaga dibuat.')
    admin.passwordAuth = credential
    admin.mustChangePassword = false
    admin.passwordProvision = 'created-by-platform-admin'
    A.persist()
    state.modal = null
    state.platformTab = 'tenants'
    state.selectedPlatformTenant = tenant.id
    A.render()
    A.toast(`Lembaga ${tenant.name} dan akun Admin awal berhasil dibuat.`)
  }
  async function legacyTenantReview(form, data) {
    const application = db.applications.find((item) => item.id === form.dataset.id && item.status === 'menunggu')
    if (!application) throw new Error('Pengajuan tidak ditemukan atau sudah ditinjau.')
    if (data.decision === 'ditolak') {
      if (!String(data.note || '').trim()) throw new Error('Penolakan membutuhkan alasan.')
      application.status = 'ditolak'; application.note = data.note.trim(); application.reviewedAt = A.now()
      A.persist(); state.modal = null; A.render(); A.toast('Pengajuan lembaga ditolak.')
      return
    }
    const platform = window.__SIZISNUR_PLATFORM_ADMIN
    if (!platform?.rootUser?.()) throw new Error('Hanya Admin SiZisNur yang dapat mengaktifkan pengajuan lembaga.')
    const adminName = application.contact || 'Admin Lembaga'
    const adminEmail = fmtEmail(application.email)
    const password = temporaryPassword()
    const credential = await hashPassword(password)
    const tenant = platform.makeTenant({ name: application.name, email: application.email, phone: application.phone || '', address: application.address, adminName, adminEmail, adminPhone: application.phone || '', status: db.platformSettings?.defaultTenantStatus || 'aktif' })
    const admin = db.users.find((item) => item.tenantId === tenant.id && fmtEmail(item.email) === adminEmail)
    admin.passwordAuth = credential
    admin.mustChangePassword = true
    application.tenantId = tenant.id; application.status = 'disetujui'; application.reviewedAt = A.now(); application.note = String(data.note || 'Disetujui melalui simulasi platform.')
    A.persist(); state.modal = null; A.render(); showInitialAdminCredentials(application.name, adminEmail, password)
  }

  document.addEventListener('click', (event) => {
    const go = event.target.closest('[data-action="go-login"], [data-action="back-login"]')
    if (go && !A.user()) state.authView = 'choose'
    const institution = event.target.closest('[data-action="tenant-apply"]')
    if (institution && !A.user()) {
      event.preventDefault()
      event.stopImmediatePropagation()
      switchView('login-panitia')
    }
  }, true)
  document.addEventListener('click', (event) => {
    const view = event.target.closest('[data-auth-view]')
    if (view) {
      event.preventDefault()
      if (view.dataset.authView === 'forgot-password') state.authRecoveryRole = view.dataset.authRole || 'muzakki'
      switchView(view.dataset.authView)
      return
    }
    const action = event.target.closest('[data-auth-action]')
    if (action) {
      event.preventDefault()
      const key = action.dataset.authAction
      try {
        if (key === 'otp-resend') resendOtpFlow()
        else if (key === 'otp-cancel') {
          const origin = state.authFlow?.origin || 'login'
          const role = state.authFlow?.role || 'muzakki'
          state.authFlow = null
          state.authView = 'choose'
          if (origin === 'login') state.page = 'login'
          else state.authView = 'choose'
          A.render()
          if (origin === 'login') switchView(role === 'panitia' ? 'login-panitia' : 'login-muzakki')
        } else if (key === 'verify-account-contacts') {
          const user = A.user()
          const channels = contactChannels(user, true)
          if (!channels.length) throw new Error('Semua kontak akun yang tersedia sudah diverifikasi.')
          startOtpFlow({ purpose: 'account-verify', user, channels, origin: 'account' })
        } else if (key === 'forgot-from-account') {
          const user = A.user()
          startOtpFlow({ purpose: 'password-reset', user, channels: contactChannels(user, false), role: user?.role === 'Muzakki' ? 'muzakki' : 'panitia', origin: 'account' })
          A.toast('OTP pemulihan dibuat pada kontak akun yang terdaftar.', 'success')
        }
      } catch (error) { A.toast(error.message || String(error), 'error') }
      return
    }
    const demo = event.target.closest('[data-auth-demo]')
    if (demo) { event.preventDefault(); state.authFlow = null; A.login(demo.dataset.authDemo, false); return }
    const social = event.target.closest('[data-auth-social]')
    if (social) { event.preventDefault(); A.toast(`Login ${social.dataset.authSocial} belum dihubungkan. Gunakan email dan password pada prototype ini.`, 'error'); return }
    const close = event.target.closest('[data-auth-close-modal]')
    if (close) { A.saveModalDrafts?.(); state.modal = null; A.render(); return }
  })
  document.addEventListener('submit', async (event) => {
    const form = event.target.closest('form[data-auth-form], form[data-form="user"], form[data-root-form="application-review"], form[data-root-form="tenant-create"], form[data-form="tenant-application"], form[data-form="tenant-review"]')
    if (!form) return
    event.preventDefault()
    event.stopImmediatePropagation()
    const data = Object.fromEntries(new FormData(form).entries())
    const submit = form.querySelector('button[type="submit"]')
    if (submit) submit.disabled = true
    try {
      if (form.dataset.authForm === 'login') await authenticate(data.identifier, data.password, form.dataset.role, data.accountRole || '')
      else if (form.dataset.authForm === 'register-muzakki') await registerMuzakki(data)
      else if (form.dataset.authForm === 'register-institution') await submitInstitutionApplication(data)
      else if (form.dataset.authForm === 'first-password') await changeFirstPassword(data)
      else if (form.dataset.authForm === 'verify-otp') await completeOtpFlow(data)
      else if (form.dataset.authForm === 'forgot-password') await beginPasswordRecovery(data.identifier, form.dataset.role, data.accountRole || '', 'login')
      else if (form.dataset.authForm === 'reset-password') {
        const user = allAccounts().find((item) => item.id === state.authResetUserId && item.active !== false)
        if (!user) throw new Error('Sesi pemulihan tidak ditemukan. Mulai ulang dari halaman login atau pengaturan akun.')
        const password = String(data.password || '')
        if (password.length < 8) throw new Error('Password baru minimal 8 karakter.')
        if (password !== String(data.passwordConfirm || '')) throw new Error('Konfirmasi password tidak sama.')
        user.passwordAuth = await hashPassword(password)
        user.mustChangePassword = false
        user.passwordProvision = 'password-recovered-after-otp'
        auditSecurity('PASSWORD_RECOVERED', `Password akun ${user.id} dipulihkan setelah verifikasi OTP.`, user)
        const origin = state.authResetOrigin || 'login'
        const role = state.authResetRole || (user.role === 'Muzakki' ? 'muzakki' : 'panitia')
        state.authResetUserId = null; state.authResetOrigin = null; state.authResetRole = null
        state.authView = origin === 'account' ? 'choose' : (role === 'panitia' ? 'login-panitia' : 'login-muzakki')
        if (origin !== 'account') state.page = 'login'
        A.persist(); A.render(); A.toast('Password berhasil diatur ulang. Silakan login menggunakan password baru.', 'success')
      }
      else if (form.dataset.authForm === 'account-profile') await updateAccountProfile(data)
      else if (form.dataset.authForm === 'change-password') await changeAccountPassword(data)
      else if (form.dataset.form === 'user') await savePanitiaAccount(form, data)
      else if (form.dataset.rootForm === 'application-review') await reviewInstitutionApplication(form, data)
      else if (form.dataset.rootForm === 'tenant-create') await createTenantFromRootForm(form, data)
      else if (form.dataset.form === 'tenant-application') await submitInstitutionApplication({ ...data, terms: form.elements.terms?.checked ? 'yes' : '' })
      else if (form.dataset.form === 'tenant-review') await legacyTenantReview(form, data)
      A.clearModalDraft?.(form)
    } catch (error) {
      A.toast(error.message || String(error), 'error')
      if (submit) submit.disabled = false
    }
  }, true)

  window.__SIZISNUR_AUTH = {
    hashPassword, verifyPassword, authenticate, authMarkup, initializeCredentials,
    accountSettingsMarkup, contactChannels, startOtpFlow, completeOtpFlow, resendOtpFlow, getOtpChallenges: () => findFlowChallenges(),
    get ready() { return authReady }, defaultPassword,
  }
  A.persist()
})()
