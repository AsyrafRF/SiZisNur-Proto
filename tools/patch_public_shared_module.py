from pathlib import Path
root = Path('/mnt/data/sizisnur_work')
p = root / 'js/public-intake.js'
s = p.read_text()

# Identity form: use the exact same administrative domicile fields as staff / account forms.
start = s.index('  function identityForm(ctx, session) {')
end = s.index('  function maskContact(', start)
identity = r'''  function identityForm(ctx, session) {
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
      <div class="grid-form"><div class="field"><label for="pi-name">Nama lengkap *</label><input id="pi-name" name="name" required autocomplete="name" value="${esc(session.identity?.name || '')}"></div><div class="field"><label for="pi-phone">Nomor WhatsApp / HP *</label><input id="pi-phone" name="phone" type="tel" required autocomplete="tel" placeholder="08xxxxxxxxxx" value="${esc(session.identity?.phone || '')}"></div><div class="field"><label for="pi-email">Email (opsional)</label><input id="pi-email" name="email" type="email" autocomplete="email" placeholder="nama@email.com" value="${esc(session.identity?.email || '')}"></div><div class="field full" data-domicile-fields>${domicileFields}</div><div class="field full"><label for="pi-address">Alamat lengkap *</label><textarea id="pi-address" name="address" rows="3" required>${esc(session.identity?.address || '')}</textarea></div><div class="field"><label for="pi-otp-channel">Kirim OTP simulasi ke *</label><select id="pi-otp-channel" name="otpChannel"><option value="whatsapp" ${session.identity?.otpChannel !== 'email' ? 'selected' : ''}>Nomor WhatsApp</option><option value="email" ${session.identity?.otpChannel === 'email' ? 'selected' : ''}>Email (isi email terlebih dahulu)</option></select></div></div>
      <div class="alert light">Jika memilih warga daerah, pilih RW dan RT sesuai Master Wilayah yang diatur Admin lembaga. Warga dari luar daerah tidak perlu memilih RW/RT lembaga. Sistem akan memeriksa transaksi pada lembaga dan periode ini setelah kode diverifikasi.</div>
      <label class="check pi-consent"><input type="checkbox" name="consent" value="yes" required> Saya memahami bahwa ini formulir evaluasi simulasi, data disimpan lokal pada browser, dan saya tidak boleh memasukkan data pribadi atau pembayaran nyata.</label>
      <div class="form-actions"><button type="submit" class="btn primary">Lanjutkan · Buat OTP demo</button></div></form></section>`
  }
'''
s = s[:start] + identity + s[end:]

# Public transaction form now uses the same multi-line calculator and fields as staff / Muzakki.
start = s.index('  function paymentForm(ctx, session) {')
end = s.index('  function renderExistingTransactions(ctx, session) {', start)
payment = r'''  function paymentForm(ctx, session) {
    const rules = db().rules.find((item) => item.tenantId === ctx.link.tenantId) || { moneyRate: 45000, riceRate: 2.5 }
    const defaultDue = Number(rules.moneyRate || 45000)
    const sharedFields = window.__SIZISNUR_TRANSACTION_FORM_FIELDS
      ? window.__SIZISNUR_TRANSACTION_FORM_FIELDS('public', 1, String(defaultDue))
      : '<div class="alert danger">Modul kalkulator transaksi bersama belum dimuat. Muat ulang prototype.</div>'
    return `<section class="card pi-form-card"><div class="pi-step-label">LANGKAH 3 DARI 3 · RENCANA ZAKAT</div><h2>Rencana pembayaran zakat</h2><p>Identitas sudah diverifikasi melalui OTP simulasi. Rincian pembayaran menggunakan modul transaksi yang sama dengan input petugas dan Layanan Mandiri.</p><div class="pi-identity-summary"><b>${esc(session.identity.name)}</b><span>${esc(session.identity.phone)} · ${esc(session.identity.domicileStatus === 'non_daerah' ? 'Dari luar daerah' : 'Warga daerah lembaga')}</span><small>${esc(session.identity.address)}</small></div><form data-public-intake-form="transaction">
      ${sharedFields}
      <div class="field"><label for="pi-note">Catatan untuk Amil (opsional)</label><textarea id="pi-note" name="note" rows="2"></textarea></div>
      <label class="check"><input type="checkbox" name="confirm" value="yes" required> Saya memahami ini rencana pembayaran berstatus Pending. Pembayaran baru sah setelah diterima, diperiksa, dan disahkan Amil.</label>
      <div class="form-actions"><button type="submit" class="btn primary">Konfirmasi Zakat</button></div>
    </form></section>`
  }
'''
s = s[:start] + payment + s[end:]

# Replace public receipt with shared screen renderer.
start = s.index('  function renderReceipt(tx) {')
end = s.index('  async function downloadReceiptPng(tx) {', start)
render_receipt = r'''  function renderReceipt(tx) {
    const inactive = terminal(tx) || (tx.expiresAt && new Date(tx.expiresAt).getTime() <= Date.now())
    const sharedMarkup = window.__SIZISNUR_RECEIPT_MARKUP?.(tx)
    const fallback = `<div class="alert warn">Struk standar belum tersedia. Muat ulang prototype untuk memuat modul transaksi bersama.</div>`
    const actions = `${!inactive ? `<div class="form-actions"><button type="button" class="btn primary" data-public-intake-action="print-receipt" data-id="${esc(tx.id)}">Cetak / Simpan PDF</button><button type="button" class="btn" data-public-intake-action="download-receipt-png" data-id="${esc(tx.id)}">Unduh gambar PNG</button></div>` : ''}<div class="form-actions"><button type="button" class="btn" data-modal-close>Tutup</button></div>`
    A.modal(`Bukti transaksi ${tx.serial}`, `${sharedMarkup || fallback}${actions}`, true)
  }
'''
s = s[:start] + render_receipt + s[end:]

# Delegate public PNG export to the shared receipt exporter.
needle = "  async function downloadReceiptPng(tx) {\n"
replace = needle + "    if (window.__SIZISNUR_DOWNLOAD_RECEIPT_PNG) return window.__SIZISNUR_DOWNLOAD_RECEIPT_PNG(tx)\n"
if needle not in s: raise SystemExit('downloadReceiptPng not found')
s = s.replace(needle, replace, 1)

# Update identity submit to validate and persist the same domicile IDs as staff forms.
start = s.index('  function beginIdentity(form, session) {')
end = s.index('  function verifyIdentityOtp(', start)
begin = r'''  function beginIdentity(form, session, ctx) {
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
    session.otp = createOtp()
    session.otpExpiresAt = Date.now() + 5 * 60 * 1000
    session.otpAttempts = 0
    session.stage = 'otp'
    session.verifiedUntil = 0
    A.render()
  }
'''
s = s[:start] + begin + s[end:]

# Create transactions with multi-line quantities and complete estimate breakdown.
s = s.replace("    const units = Math.max(1, Math.floor(Number(data.jiwa || 1)))\n    if (!Number.isInteger(units) || units < 1) throw new Error('Jumlah jiwa / unit harus bilangan bulat positif.')", "    const units = payment.jiwa", 1)
s = s.replace("person = { id: A.id('PS'), tenantId: ctx.link.tenantId, name: session.identity.name, phone: session.identity.phone, email: session.identity.email, address: session.identity.address, domicileStatus: session.identity.domicile, intakeSource: 'public-intake' }", "person = { id: A.id('PS'), tenantId: ctx.link.tenantId, name: session.identity.name, phone: session.identity.phone, email: session.identity.email, address: session.identity.address, domicileStatus: session.identity.domicileStatus, areaId: session.identity.areaId || null, rwId: session.identity.rwId || null, rtId: session.identity.rtId || null, intakeSource: 'public-intake' }", 1)
s = s.replace("lines: payment.lines, paymentEstimate: { due: payment.estimate.due, paid: payment.value, excessAllocated: payment.excessAllocated, method: 'tenant-calculator' },", "lines: payment.lines, paymentEstimate: { due: payment.estimate.dueMoney, dueRice: payment.estimate.dueRice, paid: payment.paidMoney, paidRice: payment.paidRice, excessAllocated: payment.excessAllocatedMoney, excessAllocatedRice: payment.excessAllocatedRice, method: 'shared-multi-line-calculator', breakdown: payment.breakdown },", 1)
s = s.replace("if (form.dataset.publicIntakeForm === 'identity') beginIdentity(form, session)", "if (form.dataset.publicIntakeForm === 'identity') beginIdentity(form, session, ctx)", 1)
# Check for excess before createPublicTransaction; the shared module opens the same confirmation dialog as other channels.
s = s.replace("      else if (form.dataset.publicIntakeForm === 'transaction') {\n        const tx = createPublicTransaction(form, ctx, session)", "      else if (form.dataset.publicIntakeForm === 'transaction') {\n        const payload = transactionData(form)\n        if (window.__SIZISNUR_MAY_CONFIRM_TRANSACTION_EXCESS?.(form, payload)) return\n        const tx = createPublicTransaction(form, ctx, session)", 1)

# Remove the old public-only single-category calculator listeners.
start = s.index('  function onInput(event) {')
end = s.index('\n\n  // Manager UI route', start)
listeners = r'''  function onInput(event) {
    const shared = event.target.closest?.('[data-shared-transaction="yes"]')
    if (!shared) return
    if (event.target.matches('[data-line-field="value"], [data-line-field="assetsValue"]')) event.target.dataset.autoFill = 'false'
    window.__SIZISNUR_UPDATE_TRANSACTION_FORM?.(shared)
  }
  function onChange(event) {
    const shared = event.target.closest?.('[data-shared-transaction="yes"]')
    if (shared) window.__SIZISNUR_UPDATE_TRANSACTION_FORM?.(shared)
  }
'''
s = s[:start] + listeners + s[end:]

# Use the same print renderer from staff/self-service for public receipts.
start = s.index('  function renderReceiptPrint(tx) {')
end = s.index('\n\n  // Manager UI route', start)
print_fn = r'''  function renderReceiptPrint(tx) {
    if (window.__SIZISNUR_RECEIPT_PRINT_HTML) return window.__SIZISNUR_RECEIPT_PRINT_HTML(tx)
    return `<div class="alert warn">Modul cetak struk bersama belum dimuat. Muat ulang prototype.</div>`
  }
'''
s = s[:start] + print_fn + s[end:]

# Visible text: use "lembaga" consistently, never expose internal tenant terminology.
s = s.replace('Terbitkan tautan khusus tenant agar warga dapat mengisi identitas dan rencana zakat tanpa akun SiZisNur.', 'Terbitkan tautan khusus lembaga agar warga dapat mengisi identitas dan rencana zakat tanpa akun SiZisNur.')
s = s.replace('Formulir publik tenant · Evaluasi simulasi', 'Formulir publik lembaga · Evaluasi simulasi')
s = s.replace('tenant-calculator', 'shared-multi-line-calculator')

p.write_text(s)
print('Patched public intake to use shared domicile, multi-line transaction, excess confirmation, and receipt.')
