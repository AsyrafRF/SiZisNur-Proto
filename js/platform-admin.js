/* SiZisNur Platform Admin — separate root actor and tenant control plane.
   All capabilities in this file are browser-local prototype behavior, not production authorization. */
(function () {
  'use strict'
  const A = window.__SiZisNurBridge
  if (!A) throw new Error('SiZisNur core bridge is missing')

  let db = A.db
  const state = A.state
  const $ = (id) => document.getElementById(id)
  const esc = A.e
  const money = A.rup
  const date = (value) => value ? new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '—'
  const ROOT_ID = 'PA-SIZISNUR-ROOT'
  const ROOT_ROLE = 'Admin SiZisNur'
  const ROOT_EMAIL = 'root@sizisnur.demo'

  db.platformAdmins ||= []
  db.platformAudit ||= []
  db.platformSettings ||= {
    platformName: 'SiZisNur',
    supportEmail: 'support@sizisnur.demo',
    publicRegistrationOpen: true,
    maintenanceMode: false,
    maintenanceMessage: 'SiZisNur sedang menjalani pemeliharaan terjadwal. Silakan coba kembali nanti.',
    publicNotice: '',
    defaultTenantStatus: 'aktif',
    updatedAt: null,
    updatedBy: null,
  }
  if (!db.platformAdmins.some((item) => item.id === ROOT_ID)) {
    db.platformAdmins.push({
      id: ROOT_ID,
      name: 'Admin SiZisNur',
      role: ROOT_ROLE,
      email: ROOT_EMAIL,
      scope: 'platform',
      active: true,
      createdAt: '2026-11-14T00:00:00.000Z',
      note: 'Akun demonstrasi terpisah dari seluruh pengguna tenant.',
    })
    A.persist()
  }
  db.tenants.forEach((tenant) => { tenant.status ||= 'aktif' })

  const baseRender = A.render
  const rootUser = () => A.user()?.scope === 'platform' && A.user()?.role === ROOT_ROLE ? A.user() : null
  const tenantName = (tenantId) => db.tenants.find((item) => item.id === tenantId)?.name || 'Tenant tidak ditemukan'
  const fmt = (value) => Number(value || 0).toLocaleString('id-ID')
  const badge = (value) => A.tag(value || '—')
  const rootSetting = () => db.platformSettings
  function refreshDatabaseReference() {
    db = A.db
    db.platformAdmins ||= []
    db.platformAudit ||= []
    db.platformSettings ||= { platformName: 'SiZisNur', supportEmail: 'support@sizisnur.demo', publicRegistrationOpen: true, maintenanceMode: false, maintenanceMessage: 'Sistem sedang dalam pemeliharaan.', publicNotice: '', defaultTenantStatus: 'aktif', updatedAt: null, updatedBy: null }
  }

  function writeRootAudit(type, detail) {
    const actor = rootUser()
    db.platformAudit.unshift({
      id: A.id('PAU'),
      at: A.now(),
      actorId: actor?.id || ROOT_ID,
      actorName: actor?.name || 'Admin SiZisNur',
      type,
      detail,
    })
    A.persist()
  }

  function tenantMetrics(tenantId) {
    const users = db.users.filter((user) => user.tenantId === tenantId)
    const transactions = db.transactions.filter((item) => item.tenantId === tenantId)
    return {
      users: users.length,
      admins: users.filter((user) => user.role === 'Admin').length,
      transactions: transactions.length,
      pending: transactions.filter((item) => ['pending', 'tercatat', 'paid', 'disetor'].includes(item.status)).length,
      verified: transactions.filter((item) => item.status === 'terverifikasi').length,
    }
  }

  function platformOverview() {
    const totalTenants = db.tenants.length
    const activeTenants = db.tenants.filter((item) => item.status === 'aktif').length
    const pendingApplications = db.applications.filter((item) => item.status === 'menunggu').length
    const tenantUsers = db.users.length
    const txCount = db.transactions.length
    const recent = db.platformAudit.slice(0, 6)
    return `${A.boxhead('Ringkasan Platform', 'Ruang kendali global SiZisNur. Kelola tenant, akses tenant, pengajuan lembaga, dan konfigurasi platform tanpa masuk ke data operasional masing-masing lembaga.')}
      <div class="alert light"><b>Lingkup root:</b> Admin SiZisNur mengelola metadata dan status tenant serta pengaturan platform. Transaksi, tarif zakat, mustahik, dan kas tetap menjadi tanggung jawab Admin serta petugas tenant masing-masing.</div>
      <div class="cards root-metrics">
        ${A.stat('Tenant terdaftar', fmt(totalTenants), `${fmt(activeTenants)} aktif`, '▦')}
        ${A.stat('Pengajuan menunggu', fmt(pendingApplications), 'Perlu keputusan platform', '◷')}
        ${A.stat('Akun tenant', fmt(tenantUsers), 'Tidak termasuk akun root', '♙')}
        ${A.stat('Transaksi tercatat', fmt(txCount), 'Agregat lintas tenant', '▤')}
      </div>
      <div class="two-col root-overview-grid">
        <section class="card"><div class="card-top"><h3>Tenant terbaru</h3><button class="btn sm" type="button" data-root-tab="tenants">Semua tenant</button></div>
          ${A.table(['Tenant','Status','Pengguna','Transaksi'], db.tenants.slice().reverse().slice(0, 6).map((tenant) => { const m = tenantMetrics(tenant.id); return [`<b>${esc(tenant.name)}</b><div class="tiny mono">${esc(tenant.id)}</div>`, badge(tenant.status), fmt(m.users), fmt(m.transactions)] }))}
        </section>
        <section class="card"><div class="card-top"><h3>Aktivitas root terbaru</h3><button class="btn sm" type="button" data-root-tab="audit">Buka audit</button></div>
          ${recent.length ? `<div class="mini-list">${recent.map((item) => `<div class="mini-item root-audit-item"><span><b>${esc(item.type)}</b><small>${esc(item.detail)}</small></span><small>${date(item.at)}</small></div>`).join('')}</div>` : '<div class="empty">Belum ada aktivitas platform.</div>'}
        </section>
      </div>
      <section class="card"><div class="card-top"><h3>Kontrol cepat</h3><span class="caption">Pengelolaan tingkat platform</span></div><div class="root-quick-actions">
        <button class="btn primary" type="button" data-root-action="tenant-create">＋ Daftarkan tenant</button>
        <button class="btn" type="button" data-root-tab="applications">Tinjau pengajuan tenant</button>
        <button class="btn" type="button" data-root-tab="settings">Pengaturan sistem</button>
      </div></section>`
  }

  function platformTenants() {
    const rows = db.tenants.map((tenant) => {
      const metrics = tenantMetrics(tenant.id)
      return [
        `<b>${esc(tenant.name)}</b><div class="tiny mono">${esc(tenant.id)}</div><small>${esc(tenant.email || 'Email belum diatur')}</small>`,
        badge(tenant.status),
        badge(tenant.publicPortalEnabled !== false ? 'Tampil publik' : 'Privat'),
        `${fmt(metrics.admins)} Admin / ${fmt(metrics.users)} akun`,
        `${fmt(metrics.transactions)} transaksi`,
        `<div class="actions"><button class="btn sm" type="button" data-root-action="tenant-detail" data-id="${esc(tenant.id)}">Detail</button><button class="btn sm" type="button" data-root-action="tenant-toggle" data-id="${esc(tenant.id)}">${tenant.status === 'aktif' ? 'Tangguhkan' : 'Aktifkan'}</button></div>`,
      ]
    })
    return `${A.boxhead('Tenant Terdaftar', 'Lihat seluruh lembaga yang menggunakan SiZisNur dan kendalikan status aksesnya.', '<button class="btn primary" type="button" data-root-action="tenant-create">＋ Tambah tenant</button>')}
      <div class="alert warn">Menangguhkan tenant akan memblokir sesi pengguna tenant pada prototype ini. Data operasionalnya tidak dihapus.</div>
      <section class="card">${A.table(['Nama tenant','Status','Portal publik','Pengguna','Transaksi','Aksi'], rows, 'Belum ada tenant.')}</section>`
  }

  function tenantDetail(tenantId) {
    const tenant = db.tenants.find((item) => item.id === tenantId)
    if (!tenant) return `${A.boxhead('Detail Tenant', 'Tenant tidak ditemukan.')}`
    const metrics = tenantMetrics(tenantId)
    const admins = db.users.filter((user) => user.tenantId === tenantId && user.role === 'Admin')
    const members = db.users.filter((user) => user.tenantId === tenantId)
    return `${A.boxhead('Detail Tenant', `${esc(tenant.name)} · ${esc(tenant.id)}`, '<button class="btn sm" type="button" data-root-tab="tenants">← Kembali ke daftar</button>')}
      <div class="cards root-metrics">${A.stat('Akun pengguna', fmt(metrics.users), `${fmt(metrics.admins)} Admin tenant`, '♙')}${A.stat('Transaksi', fmt(metrics.transactions), `${fmt(metrics.pending)} belum final`, '▤')}${A.stat('Terverifikasi', fmt(metrics.verified), 'Agregat transaksi', '✓')}${A.stat('Status tenant', tenant.status, 'Kontrol akses tenant', '◉')}</div>
      <div class="two-col">
        <section class="card"><h3>Profil tenant</h3><form data-root-form="tenant-save" data-id="${esc(tenant.id)}"><div class="grid-form">
          ${A.fld('Nama lembaga','name',tenant.name,'text','required')}${A.fld('Email lembaga','email',tenant.email || '','email')}
          ${A.fld('Nomor telepon','phone',tenant.phone || '','tel')}${A.fld('Wilayah / daerah','daerah',tenant.daerah || '','text')}
          ${A.fld('Jenis UPZ','upzType',tenant.upzType || '','text')}${A.fld('Wilayah BAZNAS tujuan','baznasArea',tenant.baznasArea || '','text')}
          ${A.textarea('Alamat','address',tenant.address || '')}
          <label class="check full"><input type="checkbox" name="publicPortalEnabled" value="yes" ${tenant.publicPortalEnabled !== false ? 'checked' : ''}> Tampilkan tenant pada Portal Publik dan izinkan ringkasan transparansi agregat</label>
        </div><div class="form-actions"><button class="btn primary" type="submit">Simpan profil tenant</button></div></form>
          <div class="mini-list"><div class="mini-item"><span>Status</span>${badge(tenant.status)}</div><div class="mini-item"><span>Jumlah pengguna</span><b>${fmt(metrics.users)}</b></div><div class="mini-item"><span>Admin tenant</span><b>${fmt(metrics.admins)}</b></div></div>
        </section>
        <section class="card"><h3>Akun Admin tenant</h3>${admins.length ? A.table(['Nama','Email','Status'], admins.map((user) => [esc(user.name),esc(user.email),badge(user.active?'aktif':'nonaktif')])) : '<div class="empty">Belum ada Admin tenant.</div>'}<div class="alert light">Admin tenant mengelola tarif, periode, akun panitia, dan operasional lembaganya. Admin SiZisNur tidak mengubah keputusan zakat maupun data transaksi.</div></section>
      </div>
      <section class="card"><h3>Ringkasan pengguna tenant</h3>${A.table(['Nama','Peran','Email','Status'], members.map((user) => [esc(user.name),badge(user.role),esc(user.email),badge(user.active?'aktif':'nonaktif')]))}</section>`
  }

  function platformApplications() {
    const applications = db.applications.slice().sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
    return `${A.boxhead('Pengajuan Tenant', 'Periksa pengajuan lembaga dan putuskan apakah tenant dapat diaktifkan.', '<button class="btn primary" type="button" data-root-action="tenant-create">＋ Tambah tenant langsung</button>')}
      <section class="card">${A.table(['Lembaga','Pemohon','Kontak','Tanggal','Status','Aksi'], applications.map((item) => [
        `<b>${esc(item.name)}</b><div class="tiny mono">${esc(item.id)}</div>`, esc(item.contact || '—'), esc(item.email || '—'), esc(item.createdAt || '—'), badge(item.status),
        item.status === 'menunggu' ? `<button class="btn sm primary" type="button" data-root-action="application-review" data-id="${esc(item.id)}">Tinjau</button>` : esc(item.note || '—'),
      ]), 'Belum ada pengajuan.')}</section>
      <div class="alert light">Persetujuan hanya membuat tenant dan akun Admin awal demo. Validasi legal lembaga, verifikasi rekening, perjanjian layanan, serta aktivasi produksi tetap memerlukan proses di luar prototype.</div>`
  }

  function platformUsers() {
    const rows = db.users.map((user) => [
      `<b>${esc(user.name)}</b><div class="tiny mono">${esc(user.id)}</div>`, esc(tenantName(user.tenantId)), badge(user.role), esc(user.email || '—'), badge(user.active ? 'aktif' : 'nonaktif'),
      `<button class="btn sm" type="button" data-root-action="user-toggle" data-id="${esc(user.id)}">${user.active ? 'Nonaktifkan' : 'Aktifkan'}</button>`,
    ])
    return `${A.boxhead('Akun Pengguna Tenant', 'Pantau akun di seluruh tenant. Akun root dipisahkan dan tidak tercampur dalam daftar pengguna lembaga.')}
      <div class="alert warn">Aksi nonaktifkan akun hanya mengubah status login demo. Tidak menghapus histori aktivitas atau data transaksi.</div>
      <section class="card">${A.table(['Pengguna','Tenant','Peran','Email','Status','Aksi'], rows, 'Belum ada akun tenant.')}</section>
      <section class="card"><h3>Akun root terpisah</h3>${A.table(['Nama','Email','Lingkup','Status'], db.platformAdmins.map((user) => [esc(user.name),esc(user.email),badge('platform / root'),badge(user.active?'aktif':'nonaktif')]))}</section>`
  }

  function platformSettings() {
    const settings = rootSetting()
    return `${A.boxhead('Pengaturan Sistem Root', 'Konfigurasi global berlaku lintas tenant. Tarif zakat dan pengaturan keagamaan tetap diatur oleh Admin masing-masing tenant.')}
      <div class="alert light">Mode pemeliharaan memblokir pengguna tenant dari workspace selama aktif. Admin SiZisNur tetap dapat masuk untuk mengelola sistem.</div>
      <section class="card"><form data-root-form="settings-save"><div class="grid-form">
        ${A.fld('Nama platform','platformName',settings.platformName,'text','required')}
        ${A.fld('Email dukungan','supportEmail',settings.supportEmail,'email')}
        ${A.sel('Status pendaftaran tenant','publicRegistrationOpen',[['true','Terbuka'],['false','Ditutup']],String(settings.publicRegistrationOpen))}
        ${A.sel('Mode pemeliharaan','maintenanceMode',[['false','Normal'],['true','Pemeliharaan aktif']],String(settings.maintenanceMode))}
        ${A.sel('Status tenant baru setelah disetujui','defaultTenantStatus',[['aktif','Aktif'],['ditangguhkan','Ditangguhkan']],settings.defaultTenantStatus)}
        ${A.textarea('Pesan pemeliharaan','maintenanceMessage',settings.maintenanceMessage)}
        ${A.textarea('Pengumuman global (opsional)','publicNotice',settings.publicNotice || '')}
      </div><div class="form-actions"><button type="submit" class="btn primary">Simpan pengaturan root</button></div></form></section>
      <section class="card"><h3>Konfigurasi yang sedang berlaku</h3><div class="mini-list">
        <div class="mini-item"><span>Pendaftaran tenant</span>${badge(settings.publicRegistrationOpen ? 'terbuka' : 'ditutup')}</div>
        <div class="mini-item"><span>Mode sistem</span>${badge(settings.maintenanceMode ? 'pemeliharaan' : 'normal')}</div>
        <div class="mini-item"><span>Diubah terakhir</span><b>${date(settings.updatedAt)}</b></div>
        <div class="mini-item"><span>Diubah oleh</span><b>${esc(settings.updatedBy || 'Belum pernah diubah')}</b></div>
      </div></section>`
  }

  function rootAccount() {
    const account = rootUser()
    return `${A.boxhead('Akun Admin SiZisNur', 'Akun platform berdiri sendiri dan tidak memiliki tenantId. Akun ini tidak dapat dikelola dari menu Akun & Peran milik tenant.')}
      <div class="two-col"><section class="card"><h3>Profil akun root</h3><form data-root-form="root-profile"><div class="grid-form">${A.fld('Nama tampilan','name',account.name,'text','required')}${A.fld('Email akun','email',account.email,'email','required')}</div><div class="form-actions"><button class="btn primary" type="submit">Simpan profil</button></div></form></section>
      <section class="card"><h3>Pemisahan kewenangan</h3><div class="mini-list"><div class="mini-item"><span>ID akun</span><b class="mono">${esc(account.id)}</b></div><div class="mini-item"><span>Role</span>${badge(ROOT_ROLE)}</div><div class="mini-item"><span>Lingkup</span>${badge('Global / platform')}</div><div class="mini-item"><span>Tenant terkait</span><b>Tidak ada</b></div></div><div class="alert warn">Akun root demo tidak dilindungi password atau MFA. Jangan gunakan kredensial/penyimpanan prototype ini untuk produksi.</div></section></div>`
  }

  function platformAudit() {
    return `${A.boxhead('Audit Aktivitas Platform', 'Mencatat perubahan yang dilakukan melalui konsol Admin SiZisNur. Audit root dipisahkan dari audit operasional tenant.')}
      <section class="card">${A.table(['Waktu','Aktor','Aktivitas','Rincian'], db.platformAudit.map((item) => [date(item.at),esc(item.actorName),badge(item.type),esc(item.detail)]), 'Belum ada aktivitas root.')}</section>`
  }

  function rootContent() {
    const tab = state.platformTab || 'overview'
    if (tab === 'tenants') return state.selectedPlatformTenant ? tenantDetail(state.selectedPlatformTenant) : platformTenants()
    if (tab === 'applications') return platformApplications()
    if (tab === 'users') return platformUsers()
    if (tab === 'settings') return platformSettings()
    if (tab === 'account') return rootAccount()
    if (tab === 'audit') return platformAudit()
    return platformOverview()
  }

  function renderRoot() {
    refreshDatabaseReference()
    const root = $('app')
    if (!root) return
    document.body.classList.toggle('dark', window.localStorage.getItem('sizisnur_theme') === 'dark')
    const tabs = [
      ['overview','Ringkasan','◫'], ['tenants','Tenant terdaftar','▦'], ['applications','Pengajuan tenant','◷'],
      ['users','Akun pengguna tenant','♙'], ['settings','Pengaturan sistem','⚙'], ['audit','Audit platform','⊙'], ['account','Akun root','◎'],
    ]
    const counts = db.applications.filter((item) => item.status === 'menunggu').length
    root.innerHTML = `<div class="root-shell"><aside class="root-side"><div class="root-brand"><img src="assets/sizisnur-logo-mark.png" alt="Logo SiZisNur"><div><b>SiZisNur</b><small>Platform Control Plane</small></div></div><div class="root-side-label">ADMINISTRASI GLOBAL</div><nav class="root-nav">${tabs.map(([key,label,icon]) => `<button type="button" class="root-nav-btn ${state.platformTab === key ? 'active' : ''}" data-root-tab="${key}"><span>${icon}</span>${label}${key === 'applications' && counts ? `<i>${counts}</i>` : ''}</button>`).join('')}</nav><div class="root-side-foot"><span class="status-dot"></span> Root scope · browser demo<br>Terpisah dari tenant<br><small>© SiZisNur</small></div></aside><section class="root-workspace"><header class="root-topbar"><div><span class="root-eyebrow">KONSOL PLATFORM / ROOT</span><h1>${esc(tabs.find(([key]) => key === (state.platformTab || 'overview'))?.[1] || 'Ringkasan')}</h1></div><div class="root-top-actions"><span class="root-user-pill"><b>${esc(rootUser()?.name || 'Admin SiZisNur')}</b><small>${ROOT_ROLE}</small></span><button type="button" class="btn sm" data-root-action="theme">◐ Tema</button><button type="button" class="btn sm danger" data-root-action="logout">Keluar</button></div></header><main class="root-content">${rootContent()}</main><footer class="root-footer">SIMULASI LOKAL — data platform tersimpan pada browser ini. Belum ada autentikasi backend atau kontrol akses server.</footer></section></div><div id="modal-root"></div>`
    if (state.modal) {
      const modalRoot = $('modal-root')
      if (modalRoot) modalRoot.innerHTML = `<div class="modal-backdrop" data-action="close-modal-bg"><section role="dialog" aria-modal="true" class="modal ${state.modal.large ? 'large' : ''}"><div class="modal-head"><h3>${esc(state.modal.title)}</h3><button type="button" class="close" data-action="close-modal">×</button></div>${state.modal.body}</section></div>`
    }
  }

  function renderTenantBlocked(tenant, message) {
    const root = $('app')
    if (!root) return
    root.innerHTML = `<div class="tenant-access-block"><section class="card"><img src="assets/sizisnur-logo-mark.png" alt="Logo SiZisNur"><span class="tag warn">AKSES TENANT DIBATASI</span><h1>${esc(tenant?.name || 'Tenant')}</h1><p>${esc(message)}</p><p>Status tenant: <b>${esc(tenant?.status || 'tidak tersedia')}</b></p><button type="button" class="btn primary" data-action="logout">Keluar dari akun</button></section></div><div id="modal-root"></div>`
  }

  A.set('render', () => {
    refreshDatabaseReference()
    // Block the legacy public approval screen even if someone sets the old route manually.
    if (!rootUser() && state.page === 'platform') { state.page = 'public'; state.modal = null }
    if (rootUser()) {
      state.page = 'platform-admin'
      state.platformTab ||= 'overview'
      return renderRoot()
    }
    const user = A.user()
    if (user && user.tenantId) {
      const tenant = db.tenants.find((item) => item.id === (A.session?.tenantId || user.tenantId))
      if (rootSetting().maintenanceMode) {
        return renderTenantBlocked(tenant, rootSetting().maintenanceMessage || 'Sistem sedang dalam pemeliharaan.')
      }
      if (tenant && tenant.status !== 'aktif') {
        return renderTenantBlocked(tenant, 'Akses tenant sedang ditangguhkan oleh pengelola platform. Hubungi Admin SiZisNur melalui kanal dukungan resmi.')
      }
    }
    baseRender()
    if (user && rootSetting().publicNotice) {
      const main = $('main-content')
      if (main && !main.querySelector('#platform-global-notice')) {
        const banner = document.createElement('div')
        banner.id = 'platform-global-notice'
        banner.className = 'alert light'
        banner.textContent = rootSetting().publicNotice
        main.prepend(banner)
      }
    }
  })

  function openTenantCreate() {
    A.modal('Daftarkan Tenant Baru', `<form data-root-form="tenant-create"><div class="grid-form">
      ${A.fld('Nama lembaga','name','','text','required')}${A.fld('Nama Admin tenant pertama','adminName','','text','required')}
      ${A.fld('Email Admin tenant','adminEmail','','email','required')}${A.fld('Email lembaga','email','','email')}
      ${A.fld('Nomor telepon','phone','','tel')}${A.fld('Wilayah / daerah','daerah','','text')}
      ${A.textarea('Alamat lembaga','address','')}
    </div><div class="alert light">Sistem akan membuat akun Admin tenant terpisah, aturan zakat awal yang dapat disesuaikan, dan satu periode berstatus draf.</div><div class="form-actions"><button type="submit" class="btn primary">Buat tenant</button></div></form>`, true)
  }

  function makeTenant({ name, email, phone, address, daerah, adminName, adminEmail, status = 'aktif', upzType = '', baznasArea = '' }) {
    const cleanName = String(name || '').trim()
    const cleanAdminEmail = String(adminEmail || '').trim().toLowerCase()
    if (!cleanName || !String(adminName || '').trim() || !cleanAdminEmail) throw new Error('Nama tenant, nama Admin, dan email Admin wajib diisi.')
    if (db.users.some((user) => String(user.email || '').toLowerCase() === cleanAdminEmail) || db.platformAdmins.some((user) => String(user.email || '').toLowerCase() === cleanAdminEmail)) throw new Error('Email Admin sudah dipakai akun lain.')
    const id = A.id('TN')
    const tenant = { id, name: cleanName, address: String(address || '').trim(), phone: String(phone || '').trim(), email: String(email || '').trim(), daerah: String(daerah || '').trim(), upzType: String(upzType || 'UPZ Masjid / Lembaga'), baznasArea: String(baznasArea || ''), status, publicPortalEnabled: status === 'aktif', createdAt: A.now() }
    db.tenants.push(tenant)
    db.users.push({ id: A.id('US'), tenantId: id, name: String(adminName).trim(), role: 'Admin', email: cleanAdminEmail, active: true, createdAt: A.now() })
    const template = db.rules.find((rule) => rule.tenantId === 'TN-ANNUR') || db.rules[0]
    if (template) db.rules.push({ ...template, tenantId: id, source: 'Salinan parameter awal tenant; Admin tenant wajib meninjau dan mengesahkan.', weights: { ...(template.weights || {}) } })
    db.periods.push({ id: A.id('PR'), tenantId: id, name: 'Periode zakat pertama (Draf)', status: 'draf', openedAt: null, closedAt: null })
    writeRootAudit('TENANT_CREATED', `Tenant ${tenant.name} dibuat dengan Admin awal ${adminName}. Status: ${status}.`)
    return tenant
  }

  function reviewApplication(applicationId) {
    const item = db.applications.find((application) => application.id === applicationId && application.status === 'menunggu')
    if (!item) throw new Error('Pengajuan tidak ditemukan atau sudah ditinjau.')
    A.modal(`Tinjau pengajuan · ${item.name}`, `<div class="mini-list"><div class="mini-item"><span>Nama lembaga</span><b>${esc(item.name)}</b></div><div class="mini-item"><span>Pemohon</span><b>${esc(item.contact || '—')}</b></div><div class="mini-item"><span>Email</span><b>${esc(item.email || '—')}</b></div><div class="mini-item"><span>Alamat</span><b>${esc(item.address || '—')}</b></div></div><form data-root-form="application-review" data-id="${esc(item.id)}"><div class="grid-form">${A.sel('Keputusan','decision',[['disetujui','Setujui dan buat tenant'],['ditolak','Tolak pengajuan']])}${A.fld('Nama Admin tenant awal','adminName',item.contact || '','text','required')}${A.fld('Email Admin tenant awal','adminEmail',item.email || '','email','required')}</div>${A.textarea('Catatan pemeriksaan','note','Pemeriksaan awal melalui simulasi platform.')}
      <div class="alert warn">Pastikan lembaga telah diverifikasi secara administratif di luar prototype. Persetujuan di sini hanya simulasi.</div><div class="form-actions"><button type="submit" class="btn primary">Simpan keputusan</button></div></form>`, true)
  }

  function onRootClick(event) {
    const tab = event.target.closest('[data-root-tab]')
    if (tab) {
      if (!rootUser()) { A.toast('Hanya Admin SiZisNur yang dapat membuka menu platform.', 'error'); return }
      state.platformTab = tab.dataset.rootTab
      state.selectedPlatformTenant = null
      state.modal = null
      renderRoot()
      return
    }
    const button = event.target.closest('[data-root-action]')
    if (!button) return
    const key = button.dataset.rootAction
    const id = button.dataset.id
    try {
      if (!rootUser()) throw new Error('Hanya Admin SiZisNur yang dapat menggunakan konsol ini.')
      switch (key) {
        case 'tenant-create': openTenantCreate(); break
        case 'tenant-detail': state.platformTab = 'tenants'; state.selectedPlatformTenant = id; renderRoot(); break
        case 'tenant-toggle': {
          const tenant = db.tenants.find((item) => item.id === id)
          if (!tenant) throw new Error('Tenant tidak ditemukan.')
          tenant.status = tenant.status === 'aktif' ? 'ditangguhkan' : 'aktif'
          writeRootAudit('TENANT_STATUS', `Status tenant ${tenant.name} diubah menjadi ${tenant.status}.`)
          A.toast(`Status tenant ${tenant.name}: ${tenant.status}`)
          renderRoot(); break
        }
        case 'application-review': reviewApplication(id); break
        case 'user-toggle': {
          const user = db.users.find((item) => item.id === id)
          if (!user) throw new Error('Akun tenant tidak ditemukan.')
          user.active = !user.active
          writeRootAudit('TENANT_USER_STATUS', `Akun ${user.email} pada ${tenantName(user.tenantId)} ${user.active ? 'diaktifkan' : 'dinonaktifkan'}.`)
          A.toast(`Status akun ${user.email} diperbarui.`)
          renderRoot(); break
        }
        case 'theme': window.localStorage.setItem('sizisnur_theme', window.localStorage.getItem('sizisnur_theme') === 'dark' ? 'light' : 'dark'); renderRoot(); break
        case 'logout': A.logout(); break
        default: break
      }
    } catch (error) { A.toast(error.message || String(error), 'error') }
  }

  function onRootSubmit(event) {
    const form = event.target.closest('form[data-root-form]')
    if (!form) return
    event.preventDefault()
    const data = Object.fromEntries(new FormData(form).entries())
    const id = form.dataset.id
    try {
      if (!rootUser()) throw new Error('Hanya Admin SiZisNur yang dapat mengubah pengaturan platform.')
      switch (form.dataset.rootForm) {
        case 'tenant-create': {
          const tenant = makeTenant({ ...data, status: rootSetting().defaultTenantStatus || 'aktif' })
          state.modal = null; state.platformTab = 'tenants'; state.selectedPlatformTenant = tenant.id
          A.toast(`Tenant ${tenant.name} berhasil dibuat sebagai data demo.`); break
        }
        case 'tenant-save': {
          const tenant = db.tenants.find((item) => item.id === id)
          if (!tenant) throw new Error('Tenant tidak ditemukan.')
          if (!String(data.name || '').trim()) throw new Error('Nama tenant wajib diisi.')
          Object.assign(tenant, { name: data.name.trim(), email: data.email.trim(), phone: data.phone.trim(), daerah: data.daerah.trim(), upzType: data.upzType.trim(), baznasArea: data.baznasArea.trim(), address: data.address.trim(), publicPortalEnabled: data.publicPortalEnabled === 'yes' })
          writeRootAudit('TENANT_PROFILE', `Metadata tenant ${tenant.id} diperbarui. Portal publik: ${tenant.publicPortalEnabled ? 'tampil' : 'disembunyikan'}.`)
          state.modal = null; A.toast('Profil tenant diperbarui.'); break
        }
        case 'application-review': {
          const application = db.applications.find((item) => item.id === id && item.status === 'menunggu')
          if (!application) throw new Error('Pengajuan tidak tersedia.')
          if (!String(data.note || '').trim()) throw new Error('Catatan pemeriksaan wajib diisi.')
          if (data.decision === 'disetujui') {
            const tenant = makeTenant({ name: application.name, email: application.email, address: application.address, adminName: data.adminName, adminEmail: data.adminEmail, status: rootSetting().defaultTenantStatus })
            application.tenantId = tenant.id
          }
          application.status = data.decision
          application.note = data.note.trim()
          application.reviewedAt = A.now()
          writeRootAudit('APPLICATION_REVIEW', `Pengajuan ${application.name}: ${application.status}.`)
          state.modal = null; A.toast(`Pengajuan ${application.name}: ${application.status}.`); break
        }
        case 'settings-save': {
          const settings = rootSetting()
          if (!String(data.platformName || '').trim()) throw new Error('Nama platform wajib diisi.')
          Object.assign(settings, {
            platformName: data.platformName.trim(), supportEmail: data.supportEmail.trim(),
            publicRegistrationOpen: data.publicRegistrationOpen === 'true', maintenanceMode: data.maintenanceMode === 'true',
            defaultTenantStatus: data.defaultTenantStatus === 'ditangguhkan' ? 'ditangguhkan' : 'aktif',
            maintenanceMessage: data.maintenanceMessage.trim(), publicNotice: data.publicNotice.trim(),
            updatedAt: A.now(), updatedBy: rootUser().name,
          })
          writeRootAudit('PLATFORM_SETTINGS', 'Pengaturan global platform diperbarui.')
          A.toast('Pengaturan sistem root tersimpan.'); break
        }
        case 'root-profile': {
          const account = rootUser()
          if (!String(data.name || '').trim() || !String(data.email || '').trim()) throw new Error('Nama dan email akun wajib diisi.')
          const email = data.email.trim().toLowerCase()
          if (db.users.some((user) => String(user.email || '').toLowerCase() === email) || db.platformAdmins.some((user) => user.id !== account.id && String(user.email || '').toLowerCase() === email)) throw new Error('Email sudah digunakan akun lain.')
          account.name = data.name.trim(); account.email = email
          writeRootAudit('ROOT_PROFILE', 'Profil akun Admin SiZisNur diperbarui.')
          A.toast('Profil akun root diperbarui.'); break
        }
        default: throw new Error('Form platform tidak dikenal.')
      }
      A.persist()
      renderRoot()
    } catch (error) { A.toast(error.message || String(error), 'error') }
  }

  // A closed registration switch is enforced when a public tenant application is submitted.
  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-action="tenant-apply"]')
    if (trigger && rootSetting().publicRegistrationOpen === false) {
      event.preventDefault()
      event.stopImmediatePropagation()
      A.toast('Pendaftaran tenant sedang ditutup oleh Admin SiZisNur.', 'error')
    }
  }, true)
  document.addEventListener('submit', (event) => {
    const form = event.target.closest('form[data-form="tenant-application"]')
    if (form && rootSetting().publicRegistrationOpen === false) {
      event.preventDefault()
      event.stopImmediatePropagation()
      A.toast('Pendaftaran tenant sedang ditutup oleh Admin SiZisNur.', 'error')
    }
  }, true)
  document.addEventListener('click', onRootClick)
  document.addEventListener('submit', onRootSubmit)

  window.__SIZISNUR_PLATFORM_ADMIN = {
    ROOT_ID,
    ROOT_ROLE,
    rootUser,
    tenantMetrics,
    writeRootAudit,
    makeTenant,
    renderRoot,
  }
  A.persist()
  A.render()
})()
