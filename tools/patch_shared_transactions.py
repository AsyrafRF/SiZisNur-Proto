from pathlib import Path
import re
p=Path('/mnt/data/sizisnur_work/js/revision-v5.js')
s=p.read_text()
start=s.index('  function transactionCalculatorFields(')
end=s.index('  function setTransactionAmount(form)', start)
new=r'''  function transactionLineMarkup(prefix, index, units = 1, defaultValue = '') {
    const catOptions = TRANSACTION_CATEGORIES.map(([value, label]) => `<option value="${esc(value)}" ${value === 'Zakat Fitrah' ? 'selected' : ''}>${esc(label)}</option>`).join('')
    return `<section class="transaction-line card" data-transaction-line data-line-index="${index}">
      <div class="transaction-line-head"><div><b>Rincian pembayaran ${index + 1}</b><small>Satu baris untuk satu jenis zakat dan satu media</small></div><button type="button" class="btn sm danger" data-shared-transaction-action="remove-line" ${index === 0 ? 'hidden' : ''}>Hapus baris</button></div>
      <div class="grid-form transaction-line-fields">
        <div class="field"><label>Jenis zakat / donasi</label><select name="lines[${index}][category]" data-line-field="category" required>${catOptions}</select></div>
        <div class="field" data-line-wrap="media"><label>Media pembayaran</label><select name="lines[${index}][type]" data-line-field="type"><option value="uang" selected>Uang (Rp)</option><option value="beras">Beras (kg)</option></select></div>
        <div class="field" data-line-wrap="quantity"><label data-line-label="quantity">Jumlah jiwa</label><input name="lines[${index}][jiwa]" data-line-field="jiwa" type="number" min="1" step="1" value="${Math.max(1, Number(units) || 1)}" required></div>
        <div class="field" data-line-wrap="assets" hidden><label data-line-label="assets">Harta bersih yang menjadi objek zakat (Rp)</label><input name="lines[${index}][assetsValue]" data-line-field="assetsValue" type="text" inputmode="numeric" data-format="idr" value=""></div>
        <div class="field" data-line-wrap="profession-period" hidden><label>Periode penghasilan profesi</label><select name="lines[${index}][professionPeriod]" data-line-field="professionPeriod"><option value="monthly">Penghasilan bulanan</option><option value="annual">Akumulasi penghasilan satu tahun</option></select></div>
        <div class="field" data-line-wrap="haul" hidden><label>Status haul</label><select name="lines[${index}][haulComplete]" data-line-field="haulComplete"><option value="no">Belum / tidak mencapai haul</option><option value="yes">Ya, sudah mencapai haul satu tahun</option></select></div>
        <div class="field" data-line-wrap="kafarat" hidden><label>Jenis kafarat</label><select name="lines[${index}][kafaratType]" data-line-field="kafaratType"><option value="yamin">Melanggar sumpah — opsi memberi makan 10 orang</option><option value="puasa">Hubungan suami-istri pada siang Ramadan</option><option value="zihar">Zihar</option></select></div>
        <div class="field" data-line-wrap="kafarat-stage" hidden><label>Tidak mampu menunaikan tahapan sebelumnya?</label><select name="lines[${index}][kafaratFeedingConfirmed]" data-line-field="kafaratFeedingConfirmed"><option value="no">Belum dipastikan / masih mampu tahapan sebelumnya</option><option value="yes">Ya, tidak mampu; hitung opsi memberi makan 60 orang</option></select></div>
        <div class="field transaction-line-amount"><label data-line-label="value">Nominal dibayarkan (Rp)</label><input name="lines[${index}][value]" data-line-field="value" type="text" inputmode="numeric" data-format="idr" data-auto-fill="true" value="${esc(defaultValue)}" required></div>
      </div>
      <div class="alert light transaction-line-preview" data-line-preview aria-live="polite">Kewajiban akan dihitung otomatis mengikuti tarif lembaga.</div>
      <label class="check transaction-line-excess" data-line-wrap="excess" hidden><input type="checkbox" name="lines[${index}][autoExcess]" data-line-field="autoExcess" value="yes"> Pisahkan kelebihan pembayaran baris ini sebagai infak/sedekah.</label>
    </section>`
  }

  function transactionCalculatorFields(prefix, units = 1, defaultValue = '45.000') {
    return `<div class="shared-transaction-form" data-shared-transaction="yes" data-transaction-prefix="${esc(prefix)}" data-default-fitrah-count="${Math.max(1, Number(units) || 1)}" data-next-line-index="1">
      <div class="alert light shared-transaction-intro"><b>Satu transaksi, beberapa jenis pembayaran.</b><br>Tambahkan beberapa baris untuk menggabungkan zakat fitrah, maal, profesi, fidyah, kafarat, atau infak/sedekah. Setiap baris dapat memiliki media uang atau beras. Media beras tersedia untuk zakat fitrah.</div>
      <div class="shared-transaction-lines" data-transaction-lines>${transactionLineMarkup(prefix, 0, units, defaultValue)}</div>
      <div class="form-actions"><button type="button" class="btn" data-shared-transaction-action="add-line">＋ Tambah jenis zakat / media</button></div>
      <div class="alert light transaction-calculation-preview" data-transaction-summary aria-live="polite">Total kewajiban dan pembayaran akan dihitung otomatis.</div>
    </div>`
  }

  function parseTransactionLineData(data = {}) {
    const indexed = new Map()
    Object.entries(data || {}).forEach(([key, value]) => {
      const match = key.match(/^lines\[(\d+)\]\[([A-Za-z]+)\]$/)
      if (!match) return
      const index = Number(match[1])
      if (!indexed.has(index)) indexed.set(index, {})
      indexed.get(index)[match[2]] = value
    })
    if (indexed.size) return [...indexed.entries()].sort((a, b) => a[0] - b[0]).map(([index, line]) => ({ ...line, _index: index }))
    // Compatibility for old saved drafts/tests that still use the original single-line field names.
    if (data && (data.category || data.value !== undefined)) return [{ ...data, _index: 0 }]
    return []
  }

  function lineEstimate(line, rules = A.rule()) {
    return transactionFormEstimate({
      category: line.category || 'Zakat Fitrah', type: line.type || 'uang', jiwa: line.jiwa || 1,
      assetsValue: line.assetsValue || 0, value: line.value || 0, haulComplete: line.haulComplete || 'no',
      kafaratType: line.kafaratType || 'yamin', professionPeriod: line.professionPeriod || 'monthly',
      kafaratFeedingConfirmed: line.kafaratFeedingConfirmed || 'no',
    }, rules)
  }

  function transactionPaymentFromData(data, rules = A.rule()) {
    const rows = parseTransactionLineData(data)
    if (!rows.length) throw new Error('Tambahkan minimal satu jenis pembayaran.')
    const lines = []
    const breakdown = []
    let paidMoney = 0, paidRice = 0, dueMoney = 0, dueRice = 0
    let excessMoney = 0, excessRice = 0, excessAllocatedMoney = 0, excessAllocatedRice = 0
    let fitrahUnits = 0, otherUnits = 0
    rows.forEach((row, index) => {
      const category = String(row.category || '').trim()
      if (!TRANSACTION_CATEGORIES.some(([value]) => value === category)) throw new Error(`Pilih jenis zakat yang valid pada baris ${index + 1}.`)
      const result = lineEstimate(row, rules)
      if (!Number.isFinite(result.paid) || result.paid <= 0) throw new Error(`Nominal pembayaran pada baris ${index + 1} harus lebih besar dari nol.`)
      const quantity = Math.max(1, Math.floor(Number(row.jiwa || 1)))
      if (!Number.isInteger(quantity) || quantity < 1) throw new Error(`Jumlah jiwa / unit pada baris ${index + 1} harus bilangan bulat positif.`)
      if (result.type === 'beras') { paidRice += result.paid; dueRice += result.due; excessRice += result.excess }
      else { paidMoney += result.paid; dueMoney += result.due; excessMoney += result.excess }
      if (category === 'Zakat Fitrah') fitrahUnits += quantity
      else otherUnits += quantity
      const splitExcess = result.splitExcessEligible && row.autoExcess === 'yes' && result.excess > 0.001
      const zakatValue = splitExcess ? result.due : result.paid
      lines.push({ category, type: result.type, value: zakatValue })
      if (splitExcess) {
        lines.push({ category: 'Infak/Sedekah', type: result.type, value: result.excess })
        if (result.type === 'beras') excessAllocatedRice += result.excess
        else excessAllocatedMoney += result.excess
      }
      breakdown.push({
        category, type: result.type, quantity, assetsValue: toNumber(row.assetsValue || 0), due: result.due,
        paid: result.paid, excess: result.excess, excessAllocated: splitExcess ? result.excess : 0,
        detail: result.detail, eligible: result.eligible, note: result.note || '',
        haulComplete: row.haulComplete || 'no', professionPeriod: row.professionPeriod || 'monthly',
        kafaratType: row.kafaratType || 'yamin', kafaratFeedingConfirmed: row.kafaratFeedingConfirmed || 'no',
      })
    })
    const jiwa = fitrahUnits || otherUnits || 1
    const estimate = {
      due: dueMoney, dueMoney, dueRice, paid: paidMoney, paidMoney, paidRice,
      excess: excessMoney, excessMoney, excessRice, excessAllocated: excessAllocatedMoney,
      excessAllocatedMoney, excessAllocatedRice, category: breakdown.map((item) => item.category).join(', '),
      type: paidRice > 0 && paidMoney === 0 ? 'beras' : 'uang', breakdown,
    }
    return {
      lines, breakdown, jiwa, value: paidMoney, valueRice: paidRice, paidMoney, paidRice,
      excessAllocated: excessAllocatedMoney, excessAllocatedMoney, excessAllocatedRice,
      estimate,
    }
  }

  function updateSharedTransactionForm(form) {
    if (!form?.matches?.('[data-shared-transaction="yes"]')) return
    const rows = [...form.querySelectorAll('[data-transaction-line]')]
    let totalMoney = 0, totalRice = 0, dueMoney = 0, dueRice = 0
    const previews = []
    rows.forEach((row, idx) => {
      const field = (name) => row.querySelector(`[data-line-field="${name}"]`)
      const wrap = (name) => row.querySelector(`[data-line-wrap="${name}"]`)
      const categoryInput = field('category')
      const category = categoryInput?.value || 'Zakat Fitrah'
      const fitrah = category === 'Zakat Fitrah'
      const assetsBased = ['Zakat Maal', 'Zakat Profesi'].includes(category)
      const typeInput = field('type')
      if (typeInput) { if (!fitrah) typeInput.value = 'uang'; typeInput.disabled = !fitrah }
      const type = fitrah && typeInput?.value === 'beras' ? 'beras' : 'uang'
      if (wrap('quantity')) wrap('quantity').hidden = assetsBased || category === 'Infak/Sedekah'
      if (wrap('assets')) wrap('assets').hidden = !assetsBased
      if (wrap('profession-period')) wrap('profession-period').hidden = category !== 'Zakat Profesi'
      if (wrap('haul')) wrap('haul').hidden = category !== 'Zakat Maal'
      if (wrap('kafarat')) wrap('kafarat').hidden = category !== 'Kafarat'
      if (wrap('kafarat-stage')) wrap('kafarat-stage').hidden = category !== 'Kafarat' || field('kafaratType')?.value === 'yamin'
      const quantityLabel = row.querySelector('[data-line-label="quantity"]')
      if (quantityLabel) quantityLabel.textContent = fitrah ? 'Jumlah jiwa' : category === 'Fidyah' ? 'Jumlah hari puasa yang ditinggalkan' : category === 'Kafarat' ? 'Jumlah kasus kafarat' : 'Jumlah unit'
      const amount = field('value')
      if (amount) {
        amount.dataset.format = type === 'beras' ? 'kg' : 'idr'
        const amountLabel = row.querySelector('[data-line-label="value"]')
        if (amountLabel) amountLabel.textContent = type === 'beras' ? 'Beras dibayarkan (kg)' : 'Nominal dibayarkan (Rp)'
      }
      const data = {
        category, type, jiwa: field('jiwa')?.value || 1, assetsValue: field('assetsValue')?.value || 0,
        value: amount?.value || 0, haulComplete: field('haulComplete')?.value || 'no',
        professionPeriod: field('professionPeriod')?.value || 'monthly', kafaratType: field('kafaratType')?.value || 'yamin',
        kafaratFeedingConfirmed: field('kafaratFeedingConfirmed')?.value || 'no',
      }
      let estimate
      try { estimate = lineEstimate(data) } catch (_) { estimate = null }
      if (amount && amount.dataset.autoFill !== 'false' && estimate?.due > 0) {
        amount.value = type === 'beras' ? String(estimate.due).replace('.', ',') : new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Math.round(estimate.due))
      }
      if (amount && type === 'uang') formatInputValue(amount)
      const paid = estimate?.paid || 0
      if (type === 'beras') { totalRice += paid; dueRice += estimate?.due || 0 }
      else { totalMoney += paid; dueMoney += estimate?.due || 0 }
      if (wrap('excess')) wrap('excess').hidden = !estimate?.splitExcessEligible || !(estimate?.excess > 0.001)
      const preview = row.querySelector('[data-line-preview]')
      if (preview && estimate) {
        const dueText = type === 'beras' ? kilos(estimate.due) : money(estimate.due)
        const paidText = type === 'beras' ? kilos(estimate.paid) : money(estimate.paid)
        const diff = estimate.excess > 0.001 ? `<div class="mini-item"><span>Kelebihan dari kewajiban</span><b>${type === 'beras' ? kilos(estimate.excess) : money(estimate.excess)}</b></div>` : estimate.shortfall > 0.001 ? `<div class="mini-item"><span>Masih kurang dari kewajiban</span><b>${type === 'beras' ? kilos(estimate.shortfall) : money(estimate.shortfall)}</b></div>` : ''
        preview.innerHTML = `<b>${esc(category)} · ${type === 'beras' ? 'Beras' : 'Uang'}</b><p>${esc(estimate.detail)}</p><div class="mini-list"><div class="mini-item"><span>Kewajiban / estimasi</span><b>${dueText}</b></div><div class="mini-item"><span>Nilai dibayarkan</span><b>${paidText}</b></div>${diff}</div>${estimate.note ? `<small>${esc(estimate.note)}</small>` : ''}`
      }
      const remove = row.querySelector('[data-shared-transaction-action="remove-line"]')
      if (remove) remove.hidden = rows.length <= 1
      const title = row.querySelector('.transaction-line-head b')
      if (title) title.textContent = `Rincian pembayaran ${idx + 1}`
    })
    const summary = form.querySelector('[data-transaction-summary]')
    if (summary) summary.innerHTML = `<b>Ringkasan seluruh transaksi</b><div class="mini-list"><div class="mini-item"><span>Total kewajiban dalam uang</span><b>${money(dueMoney)}</b></div><div class="mini-item"><span>Total kewajiban dalam beras</span><b>${kilos(dueRice)}</b></div><div class="mini-item"><span>Total pembayaran uang</span><b>${money(totalMoney)}</b></div><div class="mini-item"><span>Total pembayaran beras</span><b>${kilos(totalRice)}</b></div></div><small>Setiap baris disimpan sebagai satu rincian dalam satu nomor transaksi dan satu QR.</small>`
  }

  function addSharedTransactionLine(form) {
    const container = form?.querySelector('[data-transaction-lines]')
    if (!container) return
    const rows = container.querySelectorAll('[data-transaction-line]')
    if (rows.length >= 12) throw new Error('Satu transaksi dibatasi maksimal 12 rincian untuk menjaga keterbacaan struk.')
    const index = Number(form.dataset.nextLineIndex || rows.length)
    form.dataset.nextLineIndex = String(index + 1)
    container.insertAdjacentHTML('beforeend', transactionLineMarkup(form.dataset.transactionPrefix || 'tx', index, 1, ''))
    updateSharedTransactionForm(form)
  }

  function removeSharedTransactionLine(button) {
    const form = button.closest('[data-shared-transaction="yes"]')
    const row = button.closest('[data-transaction-line]')
    const rows = form?.querySelectorAll('[data-transaction-line]')
    if (!row || !rows || rows.length <= 1) return
    row.remove()
    updateSharedTransactionForm(form)
  }

  function transactionExcessRows(data, rules = A.rule()) {
    return parseTransactionLineData(data).map((line, index) => {
      const result = lineEstimate(line, rules)
      return { index: line._index ?? index, category: line.category, type: result.type, excess: result.excess, eligible: result.splitExcessEligible, checked: line.autoExcess === 'yes' }
    }).filter((line) => line.eligible && line.excess > 0.001 && !line.checked)
  }

  function maybeConfirmExcess(form, data) {
    if (form.dataset.excessDecision) return false
    const excessRows = transactionExcessRows(data)
    if (!excessRows.length) return false
    const descriptions = excessRows.map((line) => `<div class="mini-item"><span>${esc(line.category)} · ${line.type === 'beras' ? 'Beras' : 'Uang'}</span><b>${line.type === 'beras' ? kilos(line.excess) : money(line.excess)}</b></div>`).join('')
    const overlay = document.createElement('div')
    overlay.className = 'excess-confirm-backdrop'
    overlay.innerHTML = `<section class="excess-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="excess-confirm-title"><h3 id="excess-confirm-title">Konfirmasi kelebihan pembayaran</h3><p>Satu atau beberapa rincian melebihi estimasi kewajiban. Periksa kembali sebelum menyimpan satu transaksi gabungan ini.</p><div class="mini-list">${descriptions}</div><div class="actions"><button type="button" class="btn" data-excess-action="keep">Tidak, tetap catat sesuai kategori di atas</button><button type="button" class="btn primary" data-excess-action="accept">Ya, pisahkan kelebihannya menjadi infak/sedekah</button><button type="button" class="btn ghost" data-excess-action="back">Kembali periksa formulir</button></div></section>`
    overlay.__transactionForm = form
    overlay.__excessRows = excessRows
    document.body.appendChild(overlay)
    overlay.querySelector('[data-excess-action="accept"]')?.focus()
    return true
  }

  document.addEventListener('click', (event) => {
    const actionButton = event.target.closest('[data-shared-transaction-action]')
    if (actionButton) {
      const form = actionButton.closest('[data-shared-transaction="yes"]')
      try {
        if (actionButton.dataset.sharedTransactionAction === 'add-line') addSharedTransactionLine(form)
        else if (actionButton.dataset.sharedTransactionAction === 'remove-line') removeSharedTransactionLine(actionButton)
      } catch (error) { A.toast(error.message || String(error), 'error') }
      return
    }
    const button = event.target.closest('[data-excess-action]')
    if (!button) return
    const overlay = button.closest('.excess-confirm-backdrop')
    const form = overlay?.__transactionForm
    if (!overlay || !form) return
    const action = button.dataset.excessAction
    overlay.remove()
    if (action === 'back') return
    if (action === 'accept') {
      for (const line of overlay.__excessRows || []) {
        const checkbox = form.querySelector(`[name="lines[${line.index}][autoExcess]"]`)
        if (checkbox) checkbox.checked = true
      }
      form.dataset.excessDecision = 'split'
    } else form.dataset.excessDecision = 'keep'
    form.requestSubmit()
  })

'''
s=s[:start]+new+s[end:]
# Replace old setTransactionAmount body until function transactionPaymentFromData
start=s.index('  function setTransactionAmount(form)')
end=s.index('  function openSelfTransaction()', start)
new=r'''  function setTransactionAmount(form) { updateSharedTransactionForm(form) }
  function setOperatorAmount(form) { updateSharedTransactionForm(form) }
  function setSelfTransactionAmount(form) { updateSharedTransactionForm(form) }

'''
s=s[:start]+new+s[end:]
# Update openSelf/Operator defaults
s=s.replace("if (form) { form.dataset.defaultFitrahCount = String(householdCount); setTransactionAmount(form) }", "if (form) { form.dataset.defaultFitrahCount = String(householdCount); updateSharedTransactionForm(form) }")
s=s.replace("if (form) { form.dataset.defaultFitrahCount = '1'; setTransactionAmount(form) }", "if (form) { form.dataset.defaultFitrahCount = '1'; updateSharedTransactionForm(form) }")
# replace maybeConfirm legacy submit hook and input/change handlers in a later pass
p.write_text(s)
print('patched shared builder')
