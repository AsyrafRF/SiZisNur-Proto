/* SiZisNur Public Transparency Portal
   Public output is intentionally limited to tenant profile labels and aggregate ZIS figures.
   QR lookup never returns payer identity, phone, email, address, or individual payment amount. */
(function () {
  'use strict'
  const A = window.__SiZisNurBridge
  if (!A) throw new Error('SiZisNur core bridge is missing')

  const $ = (id) => document.getElementById(id)
  const esc = A.e
  const db = A.db
  const state = A.state
  const money = A.rup
  const kilos = A.kg
  const VERIFIED_STATUSES = new Set(['paid', 'disetor', 'terverifikasi'])
  const INVALID_STATUSES = new Set(['batal', 'ditolak', 'expired', 'kedaluwarsa'])

  // Existing tenants are public by default in this prototype; Admin SiZisNur can hide them.
  let migrated = false
  db.tenants.forEach((tenant) => {
    if (typeof tenant.publicPortalEnabled !== 'boolean') {
      tenant.publicPortalEnabled = true
      migrated = true
    }
  })
  if (migrated) A.persist()

  const publicTenants = () => db.tenants.filter((tenant) => tenant.status === 'aktif' && tenant.publicPortalEnabled !== false)
  const visibleTenant = (tenantId) => publicTenants().find((tenant) => tenant.id === tenantId) || null
  const verifiedTransactions = (tenantId) => db.transactions.filter((tx) => tx.tenantId === tenantId && VERIFIED_STATUSES.has(tx.status))
  const completedDistributions = (tenantId) => (db.distributions || []).filter((item) => item.tenantId === tenantId && item.status === 'tersalurkan')
  const totals = (items) => items.reduce((acc, item) => {
    const result = A.transactionTotals(item)
    acc.money += Number(result.money || 0)
    acc.rice += Number(result.rice || 0)
    return acc
  }, { money: 0, rice: 0 })
  const distributionTotals = (items) => items.reduce((acc, item) => {
    acc.money += Number(item.money || 0)
    acc.rice += Number(item.rice || 0)
    return acc
  }, { money: 0, rice: 0 })
  const aggregate = (tenantId) => {
    const tx = verifiedTransactions(tenantId)
    const dist = completedDistributions(tenantId)
    return { transactions: tx.length, received: totals(tx), distributionCount: dist.length, distributed: distributionTotals(dist) }
  }
  const globalAggregate = (tenants) => {
    return tenants.reduce((all, tenant) => {
      const result = aggregate(tenant.id)
      all.transactions += result.transactions
      all.received.money += result.received.money
      all.received.rice += result.received.rice
      all.distributionCount += result.distributionCount
      all.distributed.money += result.distributed.money
      all.distributed.rice += result.distributed.rice
      return all
    }, { transactions: 0, received: { money: 0, rice: 0 }, distributionCount: 0, distributed: { money: 0, rice: 0 } })
  }
  const prettyDate = (value) => {
    if (!value) return '—'
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
  }
  const stat = (label, value, detail, icon) => A.stat(esc(label), value, esc(detail), icon || '◈')
  const button = (label, action, extra = '') => `<button type="button" class="btn ${extra}" data-public-action="${action}">${label}</button>`
  const tenantButton = (tenant) => `<button type="button" class="btn sm primary" data-public-action="tenant-open" data-id="${esc(tenant.id)}">Lihat transparansi</button>`

  function categorySummary(tenantId) {
    const rows = new Map()
    verifiedTransactions(tenantId).forEach((tx) => {
      ;(tx.lines || []).forEach((line) => {
        const key = String(line.category || 'Kategori lainnya')
        const current = rows.get(key) || { money: 0, rice: 0 }
        const value = Number(line.value || 0)
        if (line.type === 'beras') current.rice += value
        else current.money += value
        rows.set(key, current)
      })
    })
    return Array.from(rows.entries()).sort((a, b) => a[0].localeCompare(b[0], 'id'))
  }

  function tenantCard(tenant) {
    const metric = aggregate(tenant.id)
    const region = tenant.daerah || tenant.baznasArea || 'Wilayah belum dipublikasikan'
    return `<article class="card public-tenant-card">
      <div class="public-tenant-card-head"><div><span class="tag ok">Tenant aktif</span><h3>${esc(tenant.name)}</h3><p class="caption">${esc(region)}</p></div><span class="public-tenant-mark" aria-hidden="true">⌂</span></div>
      <div class="public-tenant-stats">
        <div><small>Transaksi disahkan</small><b>${metric.transactions.toLocaleString('id-ID')}</b></div>
        <div><small>Penerimaan uang</small><b>${money(metric.received.money)}</b></div>
        <div><small>Penerimaan beras</small><b>${kilos(metric.received.rice)}</b></div>
        <div><small>Penyaluran tercatat</small><b>${metric.distributionCount.toLocaleString('id-ID')}</b></div>
        <div><small>Uang tersalurkan</small><b>${money(metric.distributed.money)}</b></div>
        <div><small>Beras tersalurkan</small><b>${kilos(metric.distributed.rice)}</b></div>
      </div>
      <div class="public-tenant-card-foot">${tenantButton(tenant)}</div>
    </article>`
  }

  function renderDirectory(tenants) {
    const total = globalAggregate(tenants)
    const notice = String(db.platformSettings?.publicNotice || '').trim()
    return `<div class="public-hero"><div><span class="lp-section-kicker">SIZISNUR · TRANSPARANSI MULTI-TENANT</span><h1>Portal Publik SiZisNur</h1><p>Jelajahi ringkasan penghimpunan dan penyaluran dari seluruh lembaga aktif yang membuka data transparansi. Informasi Muzakki, Mustahik, kontak, dan transaksi individual tidak ditampilkan.</p></div><div class="public-hero-seal"><img src="assets/sizisnur-logo-mark.png" alt="Logo SiZisNur"><b>SiZisNur</b><small>Transparansi ZIS</small></div></div>
      ${notice ? `<div class="alert light">${esc(notice)}</div>` : ''}
      <div class="cards public-global-stats">
        ${stat('Tenant tampil publik', tenants.length.toLocaleString('id-ID'), 'Tenant aktif dan dipublikasikan', '▦')}
        ${stat('Transaksi disahkan', total.transactions.toLocaleString('id-ID'), 'Akumulasi seluruh tenant tampil', '✓')}
        ${stat('Penerimaan uang', money(total.received.money), 'Pembayaran yang disahkan Amil', 'Rp')}
        ${stat('Penerimaan beras', kilos(total.received.rice), 'Pembayaran yang disahkan Amil', 'kg')}
        ${stat('Uang tersalurkan', money(total.distributed.money), 'Realisasi catatan penyaluran selesai', '⇥')}
        ${stat('Beras tersalurkan', kilos(total.distributed.rice), 'Realisasi catatan penyaluran selesai', '⇥')}
      </div>
      <section class="card public-directory-section"><div class="public-section-head"><div><h2>Tenant terdaftar</h2><p class="caption">Pilih lembaga untuk melihat ringkasan transparansi lebih lanjut.</p></div><div class="public-search"><input id="public-tenant-search" type="search" placeholder="Cari nama masjid / lembaga…" aria-label="Cari tenant publik"></div></div>
        <div id="public-tenant-list" class="public-tenant-grid">${tenants.length ? tenants.map(tenantCard).join('') : '<div class="empty">Belum ada tenant aktif yang membuka Portal Publik.</div>'}</div>
        <p id="public-tenant-empty" class="empty" hidden>Tidak ada tenant yang sesuai dengan pencarian.</p>
      </section>
      <section class="card public-verification-card"><div class="public-section-head"><div><h2>Verifikasi struk publik</h2><p class="caption">Pindai QR pada struk fisik atau masukkan nomor seri / token secara manual.</p></div><span class="tag info">Baca saja</span></div>
        ${verificationPanel()}
      </section>
      <div class="alert light public-privacy-note"><b>Privasi publik:</b> portal hanya menyajikan agregat per tenant dan status keabsahan struk. Nama pembayar, nomor kontak, identitas penerima, petugas, serta nilai transaksi individual tidak ditampilkan.</div>
      <div class="app-footer">SiZisNur · Portal transparansi publik · Data prototype tersimpan lokal pada perangkat ini</div>`
  }

  function verificationPanel() {
    return `<div class="public-verify-layout"><div class="public-camera-panel">
        <div class="public-camera-actions"><button type="button" class="btn primary" data-public-action="camera-start"> <span aria-hidden="true">▣</span> Scan QR dengan kamera</button><button type="button" class="btn" data-public-action="camera-stop" hidden>Hentikan kamera</button></div>
        <video id="public-camera" class="camera-preview public-camera-preview" playsinline muted hidden aria-label="Pratinjau kamera pemindai QR"></video>
        <p id="public-camera-status" class="caption" aria-live="polite">Kamera memerlukan izin perangkat dan koneksi HTTPS atau localhost. Jika browser tidak mendukung pemindai QR, masukkan token secara manual.</p>
      </div><div class="public-manual-panel"><form data-form="verify-public" class="public-verify-form"><div class="field"><label for="public-scan-token">Nomor seri / ID transaksi / token QR</label><input id="public-scan-token" name="token" type="text" placeholder="Contoh: SIZISNUR|tenant|id|seri" autocomplete="off" required value="${esc(state.filters.verify || '')}"></div><button class="btn primary" type="submit">Verifikasi struk</button></form></div></div>
      <div id="verify-result" class="public-verify-result" aria-live="polite"></div>`
  }

  function renderTenantDetail(tenant) {
    const metric = aggregate(tenant.id)
    const categories = categorySummary(tenant.id)
    const dist = metric.distributed
    return `<div class="public-detail-toolbar">${button('← Semua tenant', 'tenant-list', 'sm')}<span class="tag ok">Tenant aktif</span></div>
      <div class="public-detail-heading"><span class="lp-section-kicker">RINGKASAN TRANSPARANSI TENANT</span><h1>${esc(tenant.name)}</h1><p>${esc(tenant.daerah || tenant.baznasArea || 'Wilayah belum dipublikasikan')}</p></div>
      <div class="cards public-global-stats">
        ${stat('Transaksi disahkan', metric.transactions.toLocaleString('id-ID'), 'Pembayaran disahkan Amil', '✓')}
        ${stat('Penghimpunan uang', money(metric.received.money), 'Transaksi berstatus Paid / disetor / terverifikasi', 'Rp')}
        ${stat('Penghimpunan beras', kilos(metric.received.rice), 'Transaksi berstatus Paid / disetor / terverifikasi', 'kg')}
        ${stat('Penyaluran tercatat', metric.distributionCount.toLocaleString('id-ID'), 'Catatan penyaluran selesai', '⇥')}
      </div>
      <div class="two-col public-detail-grid"><section class="card"><h2>Penghimpunan per kategori</h2>${categories.length ? `<div class="public-category-list">${categories.map(([name, value]) => `<div class="public-category-row"><b>${esc(name)}</b><span>${money(value.money)}</span><span>${kilos(value.rice)}</span></div>`).join('')}</div><p class="caption">Seluruh nilai merupakan agregat; tidak ada rincian individual.</p>` : '<div class="empty">Belum ada transaksi yang disahkan untuk ditampilkan.</div>'}</section>
        <section class="card"><h2>Realisasi penyaluran</h2><div class="public-distribution-total"><small>Total uang tersalurkan</small><b>${money(dist.money)}</b></div><div class="public-distribution-total"><small>Total beras tersalurkan</small><b>${kilos(dist.rice)}</b></div><p class="caption">${metric.distributionCount.toLocaleString('id-ID')} catatan penyaluran berstatus selesai. Nama dan identitas penerima tidak dipublikasikan.</p></section></div>
      <section class="card public-verification-card"><h2>Verifikasi struk tenant ini</h2><p class="caption">Pemindaian tetap memeriksa identitas QR dan status transaksi pada basis data prototype.</p>${verificationPanel()}</section>
      <div class="alert light public-privacy-note"><b>Privasi:</b> hanya agregat keuangan dan status umum yang dipublikasikan. Tidak ada nama Muzakki, nomor HP/email, nama Mustahik, alamat rumah, atau nama petugas.</div>`
  }

  function publicView(withBack = false) {
    const tenants = publicTenants().slice().sort((a, b) => String(a.name).localeCompare(String(b.name), 'id'))
    const selected = visibleTenant(state.publicTenantId)
    const back = withBack
      ? `<button type="button" class="btn sm" data-action="back-dashboard">Kembali ke dashboard</button>`
      : `<button type="button" class="btn sm" data-action="landing">Beranda</button><button type="button" class="btn sm primary" data-action="back-login">Masuk / Demo</button>`
    return `<div class="public-top"><div class="public-brand"><img src="assets/sizisnur-logo-mark.png" alt="Logo SiZisNur"><b>SiZisNur <span class="muted" style="font-size:12px">/ Portal Transparansi</span></b></div><div class="actions">${back}</div></div>
      <main class="public-body public-multitenant-body">${selected ? renderTenantDetail(selected) : renderDirectory(tenants)}</main><div id="modal-root"></div>`
  }

  function publicTokenTransaction(raw) {
    const value = String(raw || '').trim()
    if (!value) return { error: 'Masukkan nomor seri, ID transaksi, atau pindai QR pada struk.' }
    const visibleIds = new Set(publicTenants().map((tenant) => tenant.id))
    if (value.startsWith('SIZISNUR|')) {
      const parts = value.split('|')
      if (parts.length !== 4 || !parts[1] || !parts[2] || !parts[3]) return { error: 'Format QR tidak dikenali.' }
      if (!visibleIds.has(parts[1])) return { error: 'Tenant asal tidak tersedia pada Portal Publik.' }
      const tx = db.transactions.find((item) => item.tenantId === parts[1] && item.id === parts[2] && item.serial === parts[3])
      return tx ? { tx } : { error: 'QR tidak cocok dengan data transaksi. Periksa kemungkinan QR palsu atau salah cetak.' }
    }
    // Legacy QR is accepted only when all four fields match exactly.
    if (value.startsWith('AZIS|')) {
      const parts = value.split('|')
      if (parts.length < 4 || !visibleIds.has(parts[1])) return { error: 'Tenant asal tidak tersedia pada Portal Publik.' }
      const tx = db.transactions.find((item) => item.tenantId === parts[1] && item.id === parts[2] && item.serial === parts[3])
      return tx ? { tx } : { error: 'QR lama tidak cocok dengan data transaksi.' }
    }
    const matches = db.transactions.filter((item) => visibleIds.has(item.tenantId) && (item.id === value || item.serial === value))
    if (matches.length > 1) return { error: 'Nomor seri ditemukan pada lebih dari satu tenant. Gunakan QR lengkap agar asal transaksi dapat dipastikan.' }
    if (matches.length === 1) return { tx: matches[0] }
    return { error: 'Struk tidak ditemukan pada tenant aktif yang dipublikasikan.' }
  }

  function verifyPublicToken(raw) {
    const result = publicTokenTransaction(raw)
    if (result.error) return `<div class="alert danger"><b>Struk tidak dapat divalidasi</b><br>${esc(result.error)}<br><small>Tidak ada identitas atau data pribadi yang dibuka.</small></div>`
    const tx = result.tx
    const tenant = visibleTenant(tx.tenantId)
    if (!tenant) return '<div class="alert danger">Tenant asal tidak tersedia pada Portal Publik.</div>'

    let validity = 'unconfirmed'
    let label = 'Belum disahkan Amil'
    let detail = 'Transaksi tercatat, tetapi pembayaran belum disahkan oleh Amil. Struk ini belum dapat dinyatakan valid sebagai bukti pembayaran.'
    if (VERIFIED_STATUSES.has(tx.status)) {
      validity = 'valid'
      if (tx.status === 'paid') { label = 'Disahkan Amil'; detail = 'Pembayaran telah disahkan Amil. Status rekonsiliasi Bendahara belum dinyatakan selesai.' }
      else if (tx.status === 'disetor') { label = 'Diserahterimakan ke Bendahara'; detail = 'Pembayaran telah disahkan Amil dan masuk proses serah terima Bendahara.' }
      else { label = 'Terverifikasi Bendahara'; detail = 'Pembayaran telah disahkan dan lulus status rekonsiliasi Bendahara pada data prototype.' }
    } else if (INVALID_STATUSES.has(tx.status)) {
      validity = 'invalid'
      label = tx.status === 'batal' ? 'Dibatalkan' : 'Kedaluwarsa / ditolak'
      detail = 'Transaksi ini tidak berlaku sebagai bukti pembayaran.'
    } else if (tx.status === 'pending' && tx.expiresAt && new Date(tx.expiresAt).getTime() <= Date.now()) {
      validity = 'invalid'
      label = 'QR Kedaluwarsa'
      detail = 'Masa berlaku QR telah berakhir dan pembayaran belum disahkan Amil.'
    }
    const icon = validity === 'valid' ? '✓' : validity === 'invalid' ? '×' : '…'
    const alertClass = validity === 'valid' ? 'ok' : validity === 'invalid' ? 'danger' : 'warn'
    return `<div class="alert ${alertClass} public-receipt-status"><div class="public-receipt-status-title"><span aria-hidden="true">${icon}</span><b>${validity === 'valid' ? 'STRUK VALID' : validity === 'invalid' ? 'STRUK TIDAK VALID' : 'BELUM TERVAKLIDASI'}</b></div>
      <p>${esc(detail)}</p><div class="public-receipt-facts"><div><small>Tenant</small><b>${esc(tenant.name)}</b></div><div><small>Nomor seri</small><b class="mono">${esc(tx.serial)}</b></div><div><small>Tanggal tercatat</small><b>${esc(prettyDate(tx.createdAt))}</b></div><div><small>Status transaksi</small><b>${esc(label)}</b></div><div><small>Kategori</small><b>${esc(Array.from(new Set((tx.lines || []).map((line) => line.category)).values()).join(', ') || '—')}</b></div></div>
      <small class="public-verification-privacy">Verifikasi publik tidak menampilkan nama pembayar, kontak, petugas, alamat, atau nilai pembayaran individual.</small></div>`
  }

  function stopCamera() {
    cameraActive = false
    if (cameraTimer) window.clearTimeout(cameraTimer)
    cameraTimer = null
    if (cameraStream) cameraStream.getTracks().forEach((track) => track.stop())
    cameraStream = null
    const video = $('public-camera')
    if (video) { video.pause(); video.srcObject = null; video.hidden = true }
    const stop = document.querySelector('[data-public-action="camera-stop"]')
    if (stop) stop.hidden = true
  }

  let cameraStream = null
  let cameraTimer = null
  let cameraActive = false
  async function startCamera() {
    stopCamera()
    const video = $('public-camera')
    const status = $('public-camera-status')
    const input = $('public-scan-token')
    const output = $('verify-result')
    if (!video || !input || !output) throw new Error('Area pemindai QR belum siap. Muat ulang Portal Publik.')
    if (window.isSecureContext !== true && !['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)) throw new Error('Akses kamera memerlukan HTTPS atau localhost.')
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Browser tidak menyediakan akses kamera. Gunakan input token manual.')
    if (!('BarcodeDetector' in window)) throw new Error('Browser ini belum mendukung pemindaian QR kamera bawaan. Gunakan input token manual atau buka di browser yang mendukung BarcodeDetector.')
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
    video.srcObject = cameraStream
    video.hidden = false
    await video.play()
    const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
    cameraActive = true
    const stopButton = document.querySelector('[data-public-action="camera-stop"]')
    if (stopButton) stopButton.hidden = false
    if (status) status.textContent = 'Kamera aktif. Arahkan QR struk ke dalam bingkai dan tahan perangkat tetap stabil.'
    const scanFrame = async () => {
      if (!cameraActive) return
      try {
        const codes = await detector.detect(video)
        if (codes.length && codes[0].rawValue) {
          const value = String(codes[0].rawValue)
          input.value = value
          stopCamera()
          if (status) status.textContent = 'QR terbaca. Hasil verifikasi ditampilkan di bawah.'
          output.innerHTML = verifyPublicToken(value)
          state.filters.verify = value
          return
        }
      } catch (_) { /* Abaikan frame kamera yang belum siap. */ }
      if (cameraActive) cameraTimer = window.setTimeout(scanFrame, 350)
    }
    scanFrame()
  }

  function onPublicClick(event) {
    const button = event.target.closest('[data-public-action]')
    if (!button) return
    const action = button.dataset.publicAction
    try {
      if (action === 'tenant-open') {
        const tenant = visibleTenant(button.dataset.id)
        if (!tenant) throw new Error('Tenant tidak tersedia untuk publik.')
        stopCamera()
        state.publicTenantId = tenant.id
        A.render()
      } else if (action === 'tenant-list') {
        stopCamera()
        state.publicTenantId = null
        A.render()
      } else if (action === 'camera-start') {
        startCamera().catch((error) => {
          const status = $('public-camera-status')
          if (status) status.textContent = error.message || 'Kamera tidak dapat dibuka.'
          A.toast(error.message || 'Kamera tidak dapat dibuka.', 'error')
        })
      } else if (action === 'camera-stop') {
        stopCamera()
        const status = $('public-camera-status')
        if (status) status.textContent = 'Kamera dihentikan. Anda tetap dapat memasukkan token secara manual.'
      }
    } catch (error) { A.toast(error.message || String(error), 'error') }
  }

  function onPublicInput(event) {
    const input = event.target
    if (input?.id !== 'public-tenant-search') return
    const query = String(input.value || '').trim().toLocaleLowerCase('id')
    const cards = Array.from(document.querySelectorAll('.public-tenant-card'))
    let visible = 0
    cards.forEach((card) => {
      const match = card.textContent.toLocaleLowerCase('id').includes(query)
      card.hidden = !match
      if (match) visible += 1
    })
    const empty = $('public-tenant-empty')
    if (empty) empty.hidden = visible > 0
  }

  A.set('publicView', publicView)
  A.set('verifiedResult', verifyPublicToken)
  document.addEventListener('click', onPublicClick)
  document.addEventListener('input', onPublicInput)
  window.addEventListener('pagehide', stopCamera)
  window.__SIZISNUR_PUBLIC_PORTAL = {
    publicTenants,
    aggregate,
    verifyPublicToken,
    publicTokenTransaction,
    stopCamera,
  }
  A.render()
})()
