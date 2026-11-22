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
  const registered = bridge.db.users.find((user) => user.email === 'muzakki.auth@example.invalid')
  assert.ok(registered)
  assert.equal(registered.role, 'Muzakki')
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

  console.log('PASS — login Muzakki/Panitia terpisah, hash password, pendaftaran Muzakki/lembaga, pembatasan role, akun Panitia oleh Admin, Admin awal setelah persetujuan, penggantian password awal, dan Akses Demo terpisah tervalidasi')
})().catch((error) => { console.error(error); process.exitCode = 1 })
