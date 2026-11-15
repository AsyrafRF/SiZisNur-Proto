from pathlib import Path

root = Path('/mnt/data/sizisnur_work')
rev_path = root / 'js/revision-v5.js'
rev = rev_path.read_text()

# Persist the household / line-count total from the shared multi-line calculator.
rev = rev.replace("const jiwa = Math.max(1, Math.floor(Number(d.jiwa || 1)))", "const jiwa = payment.jiwa", 1)
rev = rev.replace("paymentEstimate: { due: payment.estimate.due, paid: payment.value, excessAllocated: payment.excessAllocated, method: 'tenant-calculator' },", "paymentEstimate: { due: payment.estimate.dueMoney, dueRice: payment.estimate.dueRice, paid: payment.paidMoney, paidRice: payment.paidRice, excessAllocated: payment.excessAllocatedMoney, excessAllocatedRice: payment.excessAllocatedRice, method: 'shared-multi-line-calculator', breakdown: payment.breakdown },", 1)

# Operator has a single-line legacy jiwa check; switch to the shared transaction calculation.
old = """    const jiwa = Math.max(1, Math.floor(Number(d.jiwa || 1)))
    if (!Number.isInteger(jiwa) || jiwa < 1) throw new Error('Jumlah jiwa / hari / kasus harus bilangan bulat positif')
    const payment = transactionPaymentFromData(d)"""
new = """    const payment = transactionPaymentFromData(d)
    const jiwa = payment.jiwa"""
if old not in rev: raise SystemExit('operator calc pattern not found')
rev = rev.replace(old, new, 1)
rev = rev.replace("paymentEstimate: { due: payment.estimate.due, paid: payment.value, excessAllocated: payment.excessAllocated, method: 'tenant-calculator' },", "paymentEstimate: { due: payment.estimate.dueMoney, dueRice: payment.estimate.dueRice, paid: payment.paidMoney, paidRice: payment.paidRice, excessAllocated: payment.excessAllocatedMoney, excessAllocatedRice: payment.excessAllocatedRice, method: 'shared-multi-line-calculator', breakdown: payment.breakdown },", 1)
rev = rev.replace("${payment.excessAllocated ? `; kelebihan ${payment.excessAllocated} dialihkan ke infak/sedekah` : ''}", "${payment.excessAllocatedMoney || payment.excessAllocatedRice ? `; kelebihan dialihkan ke infak/sedekah: ${money(payment.excessAllocatedMoney)} dan ${kilos(payment.excessAllocatedRice)}` : ''}", 1)

# Replace legacy transaction event handlers with shared row-aware handlers.
start = rev.index("  document.addEventListener('input', (event) => {", rev.index("function refreshConnectionBadge") if "function refreshConnectionBadge" in rev else 0)
end_marker = "  document.addEventListener('change', (event) => {"
change_start = rev.index(end_marker, start)
# find end of the change listener by matching the following unique code block
end = rev.index("\n  window.__SIZISNUR_CALCULATE_ZAKAT", change_start)
new_handlers = r'''  document.addEventListener('input', (event) => {
    const field = event.target
    if (field?.dataset?.format) formatInputValue(field)
    const shared = field?.closest?.('[data-shared-transaction="yes"]')
    if (shared) {
      if (field.matches('[data-line-field="value"], [data-line-field="assetsValue"]')) field.dataset.autoFill = 'false'
      updateSharedTransactionForm(shared)
      return
    }
    if (field?.form && ['self-transaction', 'operator-transaction'].includes(field.form.dataset.v5Form)) updateSharedTransactionForm(field.form.querySelector('[data-shared-transaction="yes"]'))
  })
  document.addEventListener('change', (event) => {
    const field = event.target
    const shared = field?.closest?.('[data-shared-transaction="yes"]')
    if (shared) {
      const row = field.closest('[data-transaction-line]')
      if (field.matches('[data-line-field="category"]')) {
        const quantity = row?.querySelector('[data-line-field="jiwa"]')
        if (quantity) quantity.value = field.value === 'Zakat Fitrah' ? (shared.dataset.defaultFitrahCount || '1') : '1'
        const kafaratStage = row?.querySelector('[data-line-field="kafaratFeedingConfirmed"]')
        if (kafaratStage) kafaratStage.value = 'no'
      }
      if (field.matches('[data-line-field="kafaratType"]')) {
        const stage = row?.querySelector('[data-line-field="kafaratFeedingConfirmed"]')
        if (stage) stage.value = 'no'
      }
      updateSharedTransactionForm(shared)
      return
    }
    const domicileForm = field?.form
    if (domicileForm && ['domicileStatus', 'rwId'].includes(field.name)) refreshDomicileControls(domicileForm, field.name === 'rwId' ? { rwId: field.value } : {})
    if (field.name === 'tenantId' && domicileForm?.dataset?.v5Form === 'join-tenant') {
      const wrapper = domicileForm.querySelector('[data-domicile-fields]')
      if (wrapper) { wrapper.innerHTML = domicileFieldMarkup(null, field.value); refreshDomicileControls(domicileForm) }
      const tenantPreview = domicileForm.querySelector('#tenant-join-preview')
      const selectedTenant = db.tenants.find((tenant) => tenant.id === field.value && tenant.status === 'aktif')
      if (tenantPreview && selectedTenant) tenantPreview.innerHTML = tenantJoinProfileMarkup(selectedTenant)
    }
  })
'''
rev = rev[:start] + new_handlers + rev[end:]

# Make one receipt renderer the shared source for modal and print/PDF across every channel.
show_start = rev.index("  function showReceiptV5(tx) {")
show_end = rev.index("  async function downloadReceiptPng(tx) {", show_start)
new_receipts = r'''  function receiptMarkupV5(tx) {
    const person = db.persons.find((x) => x.id === tx.personId && x.tenantId === tx.tenantId)
    const institution = db.tenants.find((x) => x.id === tx.tenantId)
    const totals = effectiveTotals(tx)
    const inactive = ['batal', 'expired', 'kedaluwarsa', 'ditolak'].includes(String(tx.status || '').toLowerCase())
    const paid = ['paid', 'disetor', 'kas_diterima', 'terverifikasi'].includes(String(tx.status || '').toLowerCase())
    const heading = tx.status === 'batal' ? 'CATATAN RENCANA DIBATALKAN' : ['expired', 'kedaluwarsa'].includes(tx.status) ? 'CATATAN RENCANA KEDALUWARSA' : paid ? 'BUKTI SETOR ZAKAT · SIMULASI' : 'STRUK RENCANA ZAKAT · SIMULASI'
    const source = tx.source === 'public-intake' ? 'Formulir publik' : tx.source === 'self-service' ? 'Layanan mandiri' : 'Input petugas / konter'
    const itemRows = (tx.lines || []).map((line) => `<div class="mini-item"><span>${esc(line.category)} · ${line.type === 'beras' ? 'Beras' : 'Uang'}</span><b>${line.type === 'beras' ? kilos(line.value) : money(line.value)}</b></div>`).join('')
    const token = transactionToken(tx)
    const qr = inactive ? '<div class="alert danger">QR transaksi ini tidak aktif dan tidak dapat digunakan untuk verifikasi.</div>' : `<div class="receipt-qr">${A.qr(token)}</div><div class="mono receipt-token">${esc(token)}</div>`
    return `<div class="receipt-preview"><div class="receipt-brand"><b>${esc(institution?.name || 'SiZisNur')}</b><small>${heading}</small></div><div class="receipt-data"><div><span>Nomor transaksi</span><b>${esc(tx.serial || tx.id)}</b></div><div><span>ID transaksi</span><b class="mono">${esc(tx.id)}</b></div><div><span>Tanggal</span><b>${esc(tx.createdAt ? new Date(tx.createdAt).toLocaleString('id-ID') : '—')}</b></div><div><span>Nama Muzakki</span><b>${esc(person?.name || 'Muzakki')}</b></div><div><span>Jumlah jiwa / unit</span><b>${Number(tx.jiwa || 1).toLocaleString('id-ID')}</b></div><div><span>Sumber input</span><b>${source}</b></div><div><span>Status</span>${statusPill(tx.status, 'transaction')}</div><div><span>Batas waktu QR</span><b>${tx.expiresAt ? esc(new Date(tx.expiresAt).toLocaleString('id-ID')) : '—'}</b></div></div><div class="receipt-lines"><b>Rincian pembayaran</b><div class="mini-list">${itemRows || '<div class="mini-item"><span>Rincian tidak tersedia</span><b>—</b></div>'}</div></div><div class="receipt-totals"><div class="mini-item"><b>Total uang</b><b>${money(totals.money)}</b></div><div class="mini-item"><b>Total beras</b><b>${kilos(totals.rice)}</b></div></div>${qr}<p class="receipt-thanks">${inactive ? `Catatan arsip transaksi berstatus ${esc(tx.status)}. QR tidak berlaku.` : `Rencana pembayaran tercatat pada ${esc(institution?.name || 'lembaga')}. Tunjukkan QR ini kepada Amil untuk pemeriksaan, akad, dan pengesahan pembayaran.`}</p><small>Dokumen simulasi prototype. Struk rencana berstatus Pending bukan bukti pembayaran resmi.</small></div>`
  }
  function receiptPrintHtmlV5(tx) {
    return `<style>.receipt{font-family:Arial,sans-serif;max-width:680px;margin:0 auto;padding:24px;color:#182b25}.receipt-preview{border:1px solid #ccd9d3;border-radius:12px;padding:22px}.receipt-brand{text-align:center;border-bottom:1px solid #ccd9d3;padding-bottom:14px;margin-bottom:14px}.receipt-brand b{display:block;font-size:22px}.receipt-brand small{display:block;margin-top:6px;font-weight:700}.receipt-data>div,.receipt .mini-item{display:flex;justify-content:space-between;gap:20px;padding:7px 0;border-bottom:1px solid #e6ece9}.receipt-data span,.receipt .mini-item span{color:#52635c}.receipt-lines{margin-top:16px}.receipt-lines>.mini-list{margin-top:6px}.receipt-totals{border-top:2px solid #52635c;margin-top:14px;padding-top:8px}.receipt-qr{text-align:center;margin:18px auto 8px}.receipt-qr svg{width:180px;height:180px}.receipt-token{font-size:10px;overflow-wrap:anywhere;text-align:center}.receipt-thanks{text-align:center;margin-top:18px}.receipt-preview>small{display:block;text-align:center;color:#64746e;margin-top:12px}</style><div class="receipt">${receiptMarkupV5(tx)}</div>`
  }
  function showReceiptV5(tx) {
    const inactive = ['batal', 'expired', 'kedaluwarsa', 'ditolak'].includes(String(tx.status || '').toLowerCase())
    const exportActions = inactive ? '' : `<div class="form-actions">${actionFor('Unduh gambar PNG', 'receipt-png', tx.id, 'sm primary')}${actionFor('Cetak / Simpan PDF', 'receipt-pdf', tx.id, 'sm')}${actionFor('Cetak thermal 80 mm', 'receipt-thermal', tx.id, 'sm')}</div>`
    A.modal(`Struk digital ${tx.serial}`, `${receiptMarkupV5(tx)}${exportActions}`, true)
  }
'''
rev = rev[:show_start] + new_receipts + rev[show_end:]

# Make the shared functions available to the public-intake module.
needle = "  window.__SIZISNUR_TRANSACTION_FORM_FIELDS = (prefix, units, defaultValue) => transactionCalculatorFields(prefix, units, defaultValue)\n"
add = needle + "  window.__SIZISNUR_UPDATE_TRANSACTION_FORM = (form) => updateSharedTransactionForm(form)\n  window.__SIZISNUR_MAY_CONFIRM_TRANSACTION_EXCESS = (form, data) => maybeConfirmExcess(form, data)\n  window.__SIZISNUR_RECEIPT_MARKUP = (tx) => receiptMarkupV5(tx)\n  window.__SIZISNUR_RECEIPT_PRINT_HTML = (tx) => receiptPrintHtmlV5(tx)\n  window.__SIZISNUR_DOWNLOAD_RECEIPT_PNG = (tx) => downloadReceiptPng(tx)\n  A.set('receiptHtml', receiptPrintHtmlV5)\n"
if needle not in rev: raise SystemExit('export needle missing')
rev = rev.replace(needle, add, 1)
rev_path.write_text(rev)

# Patch core extension bridge to accept receiptHtml override.
app_path = root / 'js/app.js'
app = app_path.read_text()
needle = "else if(name==='publicView')publicView=fn;else if(name==='verifiedResult')verifiedResult=fn;"
replace = "else if(name==='publicView')publicView=fn;else if(name==='receiptHtml')receiptHtml=fn;else if(name==='verifiedResult')verifiedResult=fn;"
if needle not in app: raise SystemExit('app bridge setter pattern not found')
app_path.write_text(app.replace(needle, replace, 1))

print('Patched shared transaction submit, listeners, receipt renderer, and bridge.')
