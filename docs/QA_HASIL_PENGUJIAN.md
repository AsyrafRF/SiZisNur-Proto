# Hasil Pemeriksaan SiZisNur V5

Tanggal pembaruan: 13 November 2026

## Pemeriksaan statis

| Perintah | Hasil |
|---|---|
| `node --check js/app.js` | Lulus |
| `node --check js/revision-v5.js` | Lulus |
| `node tests/workbook-rules.test.cjs` | Lulus |
| `node tests/role-guides.test.cjs` | Lulus — 7 role, 61 tutorial menu, 311 langkah, 61 ilustrasi UI |
| `node tests/dark-alerts.test.cjs` | Lulus — semua varian alert/toast memenuhi rasio kontras minimal 4,5:1 pada tema terang dan gelap |
| `python tools/build-standalone.py` | Dijalankan setelah perubahan final dan menghasilkan file HTML mandiri |

## Cakupan yang diperiksa oleh test otomatis

- Schema demo V5 dan matriks akses tujuh role.
- Halaman operasional yang dapat dirender per role dan halaman yang ditolak.
- Panduan penggunaan untuk tujuh role, termasuk diagram alur, checklist awal, tutorial per menu, langkah bernomor, ilustrasi UI, FAQ, navigasi cepat, dan formulir feedback.
- Palet global alert dan toast pada light/dark mode, termasuk default, warning, danger, success, info, dan neutral, dengan rasio kontras minimum WCAG AA 4,5:1.
- Hash SHA-256 yang sesuai vektor uji `abc` serta deteksi perubahan detail audit.
- Dataset Mustahik sintetis 129 data dan komposisi 21 Fakir, 103 Miskin, 5 Mualaf.
- Formula skor, ambang klasifikasi, dan perbedaan cache/formula workbook row 16.
- Angka penerimaan workbook serta total alokasi Tahap 1 dan Tahap 2 sebesar Rp148.287.500 dan 1.882,6 kg.
- Batas persetujuan dan reservasi Mustahik pada alokasi.

## Batas hasil QA

Tes Node menggunakan mock browser dan tidak membuktikan kelayakan produksi. Pengujian manual end-to-end di browser nyata, kamera pada HTTPS, printer thermal, perangkat offline, integrasi API, aksesibilitas, pengujian beban, penetration test, backup/restore, serta UAT dengan stakeholder belum dilakukan.

Tidak ada backend atau endpoint sinkronisasi yang disertakan. Notifikasi email/WhatsApp dan koneksi BAZNAS masih simulasi/ekspor berkas. Hash audit pada localStorage bukan audit immutable. Jangan memasukkan data pribadi atau transaksi nyata.

Lihat `SKENARIO_UAT.md` untuk prosedur uji manual dan `CAKUPAN_FITUR.md` untuk pemetaan fitur serta batasannya.


## Pemeriksaan alert dan toast pada light/dark mode — 13 November 2026

- Alert global memiliki warna teks eksplisit dan pasangan warna latar/teks untuk varian default, warn, danger, ok/success, info, serta light/neutral.
- Toast memiliki palet terpisah untuk default, success, info, warning, dan error.
- Tes otomatis `node tests/dark-alerts.test.cjs` memeriksa keberadaan token warna kedua tema dan rasio kontras teks terhadap latar minimal 4,5:1 (WCAG AA) untuk semua varian yang diuji.
- Cakupan stylesheet global berlaku pada dashboard, form, modal, panduan role, laporan, halaman prototype, dan halaman lain yang menggunakan komponen `.alert` atau `.notice`.
- Nama cache service worker dinaikkan agar stylesheet baru diambil sesudah deployment.
