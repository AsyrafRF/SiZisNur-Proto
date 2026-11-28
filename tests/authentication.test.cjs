const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const crypto = require('node:crypto')
const { TextEncoder } = require('node:util')

const root = path.join(__dirname, '..')
let source = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8')
source = source.replace('render();\n})();', 'window.__SiZisNurTest = { html: () => elements.app.innerHTML };\nrender();\n})();')
source += '\n;\n' + fs.readFileSync(path.join(root, 'js/revision-v5.js'), 'utf8')
source += '\n;\n' + fs.readFileSync(path.join(root, 'js/authentication.js'), 'utf8')

class MemoryStorage {
  constructor() { this.values = new Map() }
  getItem(key) { return this.values.get(key) || null }
  setItem(key, value) { this.values.set(key, String(value)) }
  removeItem(key) { this.values.delete(key) }
}
const localStorage = new MemoryStorage()
const sessionStorage = new MemoryStorage()
const elements = { app: { innerHTML: '' }, 'modal-root': { innerHTML: '' }, 'toast-host': { innerHTML: '' } }
const listeners = { click: [], submit: [] }
const document = {
  body: { classList: { toggle() {} } },
  getElementById(id) { return elements[id] || (elements[id] = { innerHTML: '', textContent: '', dataset: {} }) },
  addEventListener(type, listener) { (listeners[type] ||= []).push(listener) },
  querySelector() { return null }, querySelectorAll() { return [] },
  createElement() { return { style: {}, click() {}, remove() {} } },
}
class MockFormData {
  constructor(form) { this.data = form.data || {} }
  entries() { return Object.entries(this.data) }
}
const window = { localStorage, sessionStorage, crypto: crypto.webcrypto, addEventListener() {}, scrollTo() {}, open() { return null } }
const context = {
  window, document, elements, localStorage, sessionStorage, navigator: { onLine: true, userAgent: 'prototype-test' },
  console: { ...console, error() {} }, Date, Math, JSON, Map, Set, Blob: function Blob() {}, URL: {}, FormData: MockFormData,
  TextEncoder, btoa, atob, setInterval() {}, clearInterval() {}, Intl, Number, String, Object, Array,
  RegExp, Error, Promise, Uint8Array, setTimeout() { return 0 }, clearTimeout() {},
}
vm.createContext(context)
vm.runInContext(source, context, { timeout: 10000 })

const bridge = window.__SiZisNurBridge
const auth = window.__SIZISNUR_AUTH
assert.ok(auth, 'authentication module is loaded')

function submitAuthForm(authForm, data, extra = {}) {
  const form = {
    dataset: { authForm, ...extra }, data,
    querySelector() { return { disabled: false } },
    elements: {},
  }
  const event = {
    target: { closest(selector) { return selector.includes('data-auth-form') ? form : null } },
    preventDefault() {}, stopImmediatePropagation() {},
  }
  const listener = listeners.submit[listeners.submit.length - 1]
  return listener(event)
}
function assertRejected(promise, pattern) { return assert.rejects(promise, pattern) }

async function completeOtpFlow() {
  const challenges = auth.getOtpChallenges()
  assert.ok(challenges.length, 'an OTP challenge must exist for the active flow')
  const data = Object.fromEntries(challenges.filter((item) => item.status !== 'verified').map((item) => [`otp_${item.channel}`, item.code]))
  await submitAuthForm('verify-otp', data)
}

;(async () => {
  await auth.ready
  assert.ok(bridge.db.users.every((user) => user.passwordAuth?.algorithm === 'PBKDF2-SHA256'))
  const seedMuzakki = bridge.db.users.find((user) => user.email === 'muzakki01@demo.invalid')
  const seedAdmin = bridge.db.users.find((user) => user.email === 'admin.annur@demo.invalid')
  assert.equal(await auth.verifyPassword('Muzakki#2026', seedMuzakki.passwordAuth), true)
  assert.ok(seedMuzakki.phone, 'seed accounts expose the required phone contact')
  assert.equal(await auth.verifyPassword('wrong-password', seedMuzakki.passwordAuth), false)
  assert.equal(await auth.verifyPassword('Admin#2026', seedAdmin.passwordAuth), true)

  bridge.state.page = 'login'
  bridge.state.authView = 'choose'
  bridge.render()
  let html = elements.app.innerHTML
  assert.ok(html.includes('Login sebagai Muzakki'))
  assert.ok(html.includes('Login sebagai Panitia'))
  assert.ok(html.includes('Akses Demo Langsung'))
  assert.ok(!html.includes('data-auth-demo='), 'quick demo account tiles must not appear in the normal login choice screen')
  bridge.state.page = 'landing'
  bridge.render()
  assert.ok(!elements.app.innerHTML.includes('data-action=\"tenant-apply\"'), 'landing page does not expose a direct institution registration form')
  assert.ok(elements.app.innerHTML.includes('Login / ajukan lembaga melalui jalur Panitia'))
  bridge.state.page = 'login'
  bridge.state.authView = 'choose'
  bridge.render()
  const anonymousTenantApply = {
    target: { closest(selector) { return selector.includes('tenant-apply') ? { dataset: { action: 'tenant-apply' } } : null } },
    preventDefault() {}, stopImmediatePropagation() {},
  }
  listeners.click[listeners.click.length - 2](anonymousTenantApply)
  assert.equal(bridge.state.authView, 'login-panitia', 'public institution application entry routes through Panitia login before register')

  bridge.state.authView = 'login-muzakki'
  bridge.render()
  html = elements.app.innerHTML
  assert.ok(html.includes('Email atau Nomor HP'))
  assert.ok(html.includes('autocomplete="current-password"'))
  assert.ok(html.includes('Tidak punya akun?'))
  assert.ok(html.includes('data-auth-social="Google"'))
  assert.ok(html.includes('data-auth-social="Facebook"'))
  assert.ok(html.includes('data-auth-social="Apple"'))
  await assertRejected(auth.authenticate('admin.annur@demo.invalid', 'Admin#2026', 'muzakki'), /tidak sesuai/)
  await assertRejected(auth.authenticate('muzakki01@demo.invalid', 'Muzakki#2026', 'panitia'), /tidak sesuai/)

  bridge.state.authView = 'register-muzakki'
  bridge.render()
  html = elements.app.innerHTML
  assert.ok(html.includes('Nama lengkap'))
  assert.ok(html.includes('Nomor HP'))
  assert.ok(html.includes('Alamat lengkap'))
  assert.ok(html.includes('Buat password'))

  const beforeUsers = bridge.db.users.length
  const beforeAccounts = bridge.db.accounts.length
  await submitAuthForm('register-muzakki', {
    name: 'Muzakki Uji Login', phone: '081299991111', email: 'muzakki.auth@example.invalid',
    address: 'Alamat Uji Login, Batam', password: 'MuzakkiTest#1', passwordConfirm: 'MuzakkiTest#1',
  })
  assert.equal(bridge.state.authFlow.purpose, 'register-muzakki')
  assert.equal(auth.getOtpChallenges().map((item) => item.channel).sort().join(','), 'email,phone')
  await completeOtpFlow()
  const registered = bridge.db.users.find((user) => user.email === 'muzakki.auth@example.invalid')
  assert.ok(registered)
  assert.equal(registered.role, 'Muzakki')
  assert.ok(registered.emailVerifiedAt, 'email is marked verified only after OTP')
  assert.ok(registered.phoneVerifiedAt, 'phone is marked verified only after OTP')
  assert.equal(registered.tenantId, null)
  assert.equal(bridge.db.users.length, beforeUsers + 1)
  assert.equal(bridge.db.accounts.length, beforeAccounts + 1)
  assert.equal(bridge.db.persons.some((person) => person.email === registered.email), false)
  assert.equal(bridge.db.muzakkiMemberships.some((membership) => membership.userId === registered.id), false)
  assert.equal(await auth.verifyPassword('MuzakkiTest#1', registered.passwordAuth), true)
  assert.equal(bridge.session.userId, registered.id)

  bridge.logout()
  bridge.state.page = 'login'
  bridge.state.authView = 'login-muzakki'
  bridge.render()
  await auth.authenticate('muzakki.auth@example.invalid', 'MuzakkiTest#1', 'muzakki')
  assert.equal(bridge.session.userId, registered.id)
  bridge.logout()
  await auth.authenticate('081299991111', 'MuzakkiTest#1', 'muzakki')
  assert.equal(bridge.session.userId, registered.id, 'Muzakki can sign in using the phone saved on the account identity')

  bridge.logout()
  bridge.state.page = 'login'
  bridge.state.authView = 'login-panitia'
  bridge.render()
  assert.ok(elements.app.innerHTML.includes('Akun Panitia tidak dapat dibuat sendiri'))
  assert.ok(elements.app.innerHTML.includes('name="accountRole"'), 'Panitia login asks which role to enter')
  assert.ok(elements.app.innerHTML.includes('Daftarkan lembaga di sini'))

  bridge.login('US-ADM', false)
  bridge.state.page = 'users'
  bridge.render()
  html = elements.app.innerHTML
  assert.ok(html.includes('Nomor HP'), 'account management table includes phone')
  assert.ok(html.includes('Kontak belum') || html.includes('nomor HP'), 'contact requirement is disclosed')
  bridge.state.page = 'prototype'
  bridge.render()
  html = elements.app.innerHTML
  assert.equal((html.match(/class="decision-card"/g) || []).length, 11, 'Evaluation Prototype has 11 distinct decision cards')
  bridge.state.page = 'dashboard'
  bridge.render()
  const userForm = {
    dataset: { id: '', form: 'user' },
    data: { name: 'Petugas Login Test', email: 'petugas.auth@example.invalid', phone: '081299998001', callName: '', role: 'Operator', password: 'PetugasTest#1', passwordConfirm: 'PetugasTest#1' },
    querySelector() { return { disabled: false } },
  }
  const userEvent = {
    target: { closest(selector) { return selector.includes('data-form="user"') ? userForm : null } },
    preventDefault() {}, stopImmediatePropagation() {},
  }
  const authSubmit = listeners.submit[listeners.submit.length - 1]
  await authSubmit(userEvent)
  const staff = bridge.db.users.find((user) => user.email === 'petugas.auth@example.invalid')
  assert.ok(staff)
  assert.equal(staff.tenantId, 'TN-ANNUR')
  assert.equal(staff.role, 'Operator')
  assert.equal(staff.phone, '081299998001')
  assert.equal(await auth.verifyPassword('PetugasTest#1', staff.passwordAuth), true)
  await auth.authenticate('petugas.auth@example.invalid', 'PetugasTest#1', 'panitia', 'Operator')
  assert.equal(bridge.state.authFlow.purpose, 'login', 'new staff contact verification is required on first login')
  await completeOtpFlow()
  assert.ok(staff.emailVerifiedAt && staff.phoneVerifiedAt)
  assert.equal(bridge.session.userId, staff.id)
  await auth.authenticate('081299998001', 'PetugasTest#1', 'panitia', 'Operator')
  assert.equal(bridge.session.userId, staff.id, 'Panitia can sign in using the normalized mobile number')

  // The same person may hold another role with the same email and phone.
  bridge.login('US-ADM', false)
  const amilForm = {
    dataset: { id: '', form: 'user' },
    data: { name: 'Petugas Login Test', email: 'petugas.auth@example.invalid', phone: '081299998001', callName: '', role: 'Amil', password: 'PetugasTest#2', passwordConfirm: 'PetugasTest#2' },
    querySelector() { return { disabled: false } },
  }
  const makeSubmitEvent = (form) => ({
    target: { closest(selector) { return selector.includes('data-form="user"') ? form : null } },
    preventDefault() {}, stopImmediatePropagation() {},
  })
  await authSubmit(makeSubmitEvent(amilForm))
  const sameContactAmil = bridge.db.users.find((user) => user.email === 'petugas.auth@example.invalid' && user.role === 'Amil')
  assert.ok(sameContactAmil, 'same contacts are allowed in a different role')
  assert.equal(sameContactAmil.phone, staff.phone)
  await auth.authenticate('petugas.auth@example.invalid', 'PetugasTest#2', 'panitia', 'Amil')
  assert.equal(bridge.state.authFlow.purpose, 'login')
  await completeOtpFlow()
  assert.equal(bridge.session.userId, sameContactAmil.id, 'role selection resolves the account with shared contacts')

  // Email and mobile are each unique within one role and one institution.
  bridge.login('US-ADM', false)
  const beforeDuplicate = bridge.db.users.length
  const duplicateEmailForm = {
    dataset: { id: '', form: 'user' },
    data: { name: 'Petugas Duplikat Email', email: 'petugas.auth@example.invalid', phone: '081299998099', callName: '', role: 'Operator', password: 'Duplicate#1', passwordConfirm: 'Duplicate#1' },
    querySelector() { return { disabled: false } },
  }
  await authSubmit(makeSubmitEvent(duplicateEmailForm))
  assert.equal(bridge.db.users.length, beforeDuplicate, 'duplicate email in the same role is rejected')
  assert.ok(elements['toast-host'].innerHTML.includes('email tersebut sudah terdaftar'))

  const duplicatePhoneForm = {
    dataset: { id: '', form: 'user' },
    data: { name: 'Petugas Duplikat HP', email: 'petugas.hp@example.invalid', phone: '+62 812-9999-8001', callName: '', role: 'Operator', password: 'Duplicate#2', passwordConfirm: 'Duplicate#2' },
    querySelector() { return { disabled: false } },
  }
  await authSubmit(makeSubmitEvent(duplicatePhoneForm))
  assert.equal(bridge.db.users.length, beforeDuplicate, 'duplicate normalized phone in the same role is rejected')
  assert.ok(elements['toast-host'].innerHTML.includes('nomor HP tersebut sudah terdaftar'))

  // A matching full name is not used as a uniqueness key, but a call-name is required for different people.
  const sameNameNoCallName = {
    dataset: { id: '', form: 'user' },
    data: { name: 'Petugas Login Test', email: 'petugas.lain@example.invalid', phone: '081299998002', callName: '', role: 'Operator', password: 'Another#1', passwordConfirm: 'Another#1' },
    querySelector() { return { disabled: false } },
  }
  await authSubmit(makeSubmitEvent(sameNameNoCallName))
  assert.equal(bridge.db.users.length, beforeDuplicate, 'same name alone is not enough to create an indistinguishable contact record')
  assert.ok(elements['toast-host'].innerHTML.includes('Nama panggilan / penanda'))

  sameNameNoCallName.data.callName = 'Asyraf Kedua'
  await authSubmit(makeSubmitEvent(sameNameNoCallName))
  const sameNameDifferentPerson = bridge.db.users.find((user) => user.email === 'petugas.lain@example.invalid')
  assert.ok(sameNameDifferentPerson, 'different people with the same full name can be saved with a call-name')
  assert.equal(sameNameDifferentPerson.callName, 'Asyraf Kedua')

  bridge.logout()
  bridge.db.platformSettings.publicRegistrationOpen = true
  bridge.state.page = 'login'
  bridge.state.authView = 'register-institution'
  const applicationEmail = 'pengurus.lembaga@example.invalid'
  const usersBeforeApplication = bridge.db.users.length
  await submitAuthForm('register-institution', {
    name: 'Lembaga Uji Auth', contact: 'Penanggung Jawab Uji', email: applicationEmail,
    phone: '081200000099', address: 'Alamat Uji Auth', terms: 'on',
  })
  assert.equal(bridge.state.authFlow.purpose, 'institution-application')
  await completeOtpFlow()
  const application = bridge.db.applications.find((item) => item.email === applicationEmail)
  assert.ok(application)
  assert.equal(application.status, 'menunggu')
  assert.equal(bridge.db.users.length, usersBeforeApplication, 'pengajuan lembaga tidak membuat akun Panitia sebelum disetujui')

  window.__SIZISNUR_PLATFORM_ADMIN = {
    rootUser: () => true,
    makeTenant(data) {
      const tenant = { id: 'TN-AUTH-APPROVED', name: data.name, status: data.status || 'aktif' }
      bridge.db.tenants.push(tenant)
      bridge.db.users.push({ id: 'US-AUTH-APPROVED-ADMIN', tenantId: tenant.id, name: data.adminName, email: data.adminEmail, phone: data.adminPhone, role: 'Admin', active: true })
      return tenant
    },
    writeRootAudit() {},
  }
  await submitAuthForm(null, {
    decision: 'disetujui', note: 'Data simulasi telah diperiksa.',
    adminName: 'Admin Lembaga Uji', adminEmail: applicationEmail, adminPhone: '081200000099',
  }, { rootForm: 'application-review', id: application.id })
  const initialAdmin = bridge.db.users.find((user) => user.email === applicationEmail)
  assert.ok(initialAdmin)
  assert.equal(initialAdmin.role, 'Admin')
  assert.equal(initialAdmin.phone, '081200000099')
  assert.equal(initialAdmin.mustChangePassword, true)
  assert.equal(application.status, 'disetujui')
  const initialAdminPassword = elements['modal-root'].innerHTML.match(/Password sementara<\/span><b class=\"mono\">([^<]+)<\/b>/)?.[1]
  assert.ok(initialAdminPassword, 'password sementara Admin awal ditampilkan sekali setelah persetujuan')
  await auth.authenticate(applicationEmail, initialAdminPassword, 'panitia')
  assert.equal(bridge.state.authView, 'first-password')
  await submitAuthForm('first-password', { password: 'AdminUjiBaru#1', passwordConfirm: 'AdminUjiBaru#1' })
  assert.equal(initialAdmin.mustChangePassword, false)
  bridge.logout()
  bridge.state.page = 'login'
  bridge.state.authView = 'login-panitia'
  await auth.authenticate(applicationEmail, 'AdminUjiBaru#1', 'panitia')
  assert.equal(bridge.session.userId, initialAdmin.id)

  // Login-screen password recovery verifies every available contact before replacing the hash.
  bridge.logout()
  bridge.state.page = 'login'
  bridge.state.authView = 'login-muzakki'
  await submitAuthForm('forgot-password', { identifier: registered.email }, { role: 'muzakki' })
  assert.equal(bridge.state.authFlow.purpose, 'password-reset')
  await completeOtpFlow()
  assert.equal(bridge.state.authView, 'reset-password')
  await submitAuthForm('reset-password', { password: 'MuzakkiRecovered#2', passwordConfirm: 'MuzakkiRecovered#2' })
  assert.equal(await auth.verifyPassword('MuzakkiRecovered#2', registered.passwordAuth), true)
  assert.equal(bridge.state.authView, 'login-muzakki')

  // Account & Security exists for all tenant roles and contact edits are committed only after OTP.
  await auth.authenticate(registered.email, 'MuzakkiRecovered#2', 'muzakki')
  bridge.state.page = 'account'
  bridge.render()
  assert.ok(elements.app.innerHTML.includes('Profil dan kontak akun'))
  assert.ok(elements.app.innerHTML.includes('Keamanan password'))
  await submitAuthForm('account-profile', {
    name: 'Muzakki Uji Diperbarui', email: 'muzakki.updated@example.invalid', phone: '081299991112',
  })
  assert.equal(bridge.state.authFlow.purpose, 'profile-update')
  await completeOtpFlow()
  assert.equal(registered.email, 'muzakki.updated@example.invalid')
  assert.equal(registered.phone, '081299991112')
  assert.ok(registered.emailVerifiedAt && registered.phoneVerifiedAt)
  const registeredAccount = bridge.db.accounts.find((item) => item.userId === registered.id)
  assert.equal(registeredAccount.email, registered.email)
  assert.equal(registeredAccount.phone, registered.phone)

  await submitAuthForm('change-password', {
    currentPassword: 'MuzakkiRecovered#2', password: 'MuzakkiChanged#3', passwordConfirm: 'MuzakkiChanged#3',
  })
  assert.equal(bridge.state.authFlow.purpose, 'password-change')
  await completeOtpFlow()
  assert.equal(await auth.verifyPassword('MuzakkiChanged#3', registered.passwordAuth), true)

  // Forgot-password is reachable from Account & Security without leaving the signed-in account area.
  const dispatchAuthAction = (name) => {
    const action = { dataset: { authAction: name } }
    const event = { target: { closest(selector) { return selector.includes('data-auth-action') ? action : null } }, preventDefault() {} }
    listeners.click[listeners.click.length - 1](event)
  }
  dispatchAuthAction('forgot-from-account')
  assert.equal(bridge.state.authFlow.purpose, 'password-reset')
  assert.equal(bridge.state.authFlow.origin, 'account')
  await completeOtpFlow()
  await submitAuthForm('reset-password', { password: 'MuzakkiAccountReset#4', passwordConfirm: 'MuzakkiAccountReset#4' })
  assert.equal(await auth.verifyPassword('MuzakkiAccountReset#4', registered.passwordAuth), true)
  assert.equal(bridge.state.page, 'account', 'account-origin recovery stays in Account & Security')

  // Panitia recovery requires a role selection and resets the selected tenant-role account only.
  bridge.logout()
  bridge.state.page = 'login'
  bridge.state.authView = 'forgot-password'
  bridge.state.authRecoveryRole = 'panitia'
  bridge.render()
  assert.ok(elements.app.innerHTML.includes('recovery-account-role'))
  await submitAuthForm('forgot-password', { identifier: seedAdmin.email, accountRole: 'Admin' }, { role: 'panitia' })
  assert.equal(bridge.state.authFlow.userId, seedAdmin.id)
  await completeOtpFlow()
  await submitAuthForm('reset-password', { password: 'AdminRecovered#7', passwordConfirm: 'AdminRecovered#7' })
  assert.equal(await auth.verifyPassword('AdminRecovered#7', seedAdmin.passwordAuth), true)
  assert.ok(seedAdmin.emailVerifiedAt && seedAdmin.phoneVerifiedAt, 'successful account recovery also verifies the contacts used for OTP')

  assert.ok(bridge.db.authOtpChallenges.length >= 8, 'OTP challenge metadata is retained for local audit/debugging')

  // OTP hardening: five failures lock a challenge; expired codes are rejected; resend has cooldown and a hard cap.
  auth.startOtpFlow({ purpose: 'account-verify', user: registered, channels: [{ channel: 'email', destination: registered.email }], origin: 'account' })
  let securityChallenge = auth.getOtpChallenges()[0]
  const wrongCode = securityChallenge.code === '000000' ? '000001' : '000000'
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await assertRejected(auth.completeOtpFlow({ otp_email: wrongCode }), attempt === 4 ? /Batas 5 percobaan/ : /tidak sesuai/)
  }
  assert.equal(securityChallenge.status, 'locked')
  assert.equal(securityChallenge.code, null)

  auth.startOtpFlow({ purpose: 'account-verify', user: registered, channels: [{ channel: 'email', destination: registered.email }], origin: 'account' })
  securityChallenge = auth.getOtpChallenges()[0]
  securityChallenge.expiresAt = new Date(Date.now() - 1000).toISOString()
  await assertRejected(auth.completeOtpFlow({ otp_email: securityChallenge.code }), /kedaluwarsa/)
  assert.equal(securityChallenge.status, 'expired')
  assert.equal(securityChallenge.code, null)

  auth.startOtpFlow({ purpose: 'account-verify', user: registered, channels: [{ channel: 'email', destination: registered.email }], origin: 'account' })
  securityChallenge = auth.getOtpChallenges()[0]
  const firstDemoCode = securityChallenge.code
  assert.throws(() => auth.resendOtpFlow(), /Tunggu 30 detik/, 'resend inside the 30-second cooldown is rejected')
  assert.equal(securityChallenge.resends, 0)
  assert.equal(securityChallenge.code, firstDemoCode)
  for (let resend = 1; resend <= 3; resend += 1) {
    securityChallenge.lastSentAt = new Date(Date.now() - 31_000).toISOString()
    auth.resendOtpFlow()
    assert.equal(securityChallenge.resends, resend)
  }
  securityChallenge.lastSentAt = new Date(Date.now() - 31_000).toISOString()
  assert.throws(() => auth.resendOtpFlow(), /Batas kirim ulang/, 'a fourth resend is rejected')
  assert.equal(securityChallenge.resends, 3)

  // Account & Security is available to every tenant role, and root uses the same component in its own console.
  bridge.state.authFlow = null
  bridge.state.authView = 'choose'
  for (const account of bridge.db.users.filter((item) => item.active)) {
    bridge.login(account.id, false)
    bridge.state.page = 'account'
    assert.equal(bridge.can('account'), true, `Akun & Keamanan is accessible to ${account.role}`)
    bridge.render()
    assert.ok(elements.app.innerHTML.includes('Keamanan password'), `password controls render for ${account.role}`)
    assert.ok(elements.app.innerHTML.includes('Lupa password?'), `recovery shortcut renders for ${account.role}`)
  }
  const root = bridge.db.platformAdmins.find((item) => item.active)
  bridge.login(root.id, false)
  assert.ok(auth.accountSettingsMarkup().includes('Keamanan password'), 'root account uses the shared security settings component')
  assert.ok(auth.accountSettingsMarkup().includes('Lupa password?'), 'root account has password recovery in its settings')

  console.log('PASS — login Muzakki/Panitia terpisah, hash password, OTP email+HP untuk registrasi/login, lupa password, halaman Akun & Keamanan seluruh role dan root, profil dan ubah password akun, pengajuan lembaga, OTP lockout/kedaluwarsa/cooldown/batas kirim ulang, akun Panitia oleh Admin, Admin awal setelah persetujuan, penggantian password awal, dan Akses Demo terpisah tervalidasi')
})().catch((error) => { console.error(error); process.exitCode = 1 })
