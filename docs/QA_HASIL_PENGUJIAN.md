# Validasi teknis SiZisNur V3 — 4 November 2026

> Pengujian ini memeriksa sintaks JavaScript, logika formula workbook, perhitungan alokasi, dan render template halaman melalui Node VM dengan DOM stub. Ini bukan UAT resmi panitia, bukan pengujian browser lintas perangkat, dan bukan audit keamanan.

## Hasil otomatis

Perintah:

```bash
node --check js/app.js
node tests/workbook-rules.test.cjs
```

Hasil:

| Skenario | Hasil |
|---|---|
| Sintaks `js/app.js` | Lulus |
| Database seed V3 | Lulus — versi 4 |
| Dataset mustahik sintetis | Lulus — 129 data, 21 Fakir, 103 Miskin, 5 Mualaf |
| Lima faktor skor mustahik | Lulus — wilayah, hunian, pernikahan, penghasilan, tanggungan |
| Literal `4 ATAU LEBIH` vs angka 4 | Lulus — string mendapat skor 100, angka 4 mengikuti default 0 |
| Ambang skor 240/241/360/361 | Lulus |
| Jalur Mualaf dan final status R | Lulus — termasuk cabang Q=MUALAF + P=FAKIR → CUKUP LAYAK pada formula |
| Render template Acuan Workbook, Mustahik, Alokasi, Insentif, Laporan | Lulus — tanpa pesan kesalahan render |
| Visibilitas Acuan Workbook | Lulus — semua role tenant An-Nur dapat membuka; Admin Tenant B tidak dapat melihat data sumber An-Nur |
| Tahap 1 | Lulus — Rp71.900.000 dan 274 paket / 685 kg |
| Tahap 2 | Lulus — Rp76.387.500 dan 479,04 paket / 1.197,6 kg termasuk saldo agregat |
| Total dua tahap | Lulus — Rp148.287.500 dan 1.882,6 kg |
| Batas persetujuan gabungan workbook | Lulus — sesuai baseline agregat |
| Pemisahan alokasi workbook dan ledger demo | Lulus — tidak mencampur Rp148,2875 juta baseline dengan saldo transaksi sampel |
| Pencegahan penerima ganda pada alokasi fleksibel | Lulus — penerima yang sudah masuk rencana aktif dicadangkan |
| Pencegahan rencana tahap duplikat | Lulus |

## Pemeriksaan tambahan

- File V3 memakai `localStorage` key baru `sizisnur_demo_database_v4`; tidak mengimpor data lokal V2.
- Rencana Tahap 1/2 memakai dataset sintetis. Saldo demo transaksi tidak dipakai untuk menguji baseline workbook; persetujuan rencana workbook membandingkan total terhadap baseline sumber 1447H.
- Saldo agregat Tahap 2 tetap tersimpan terpisah dan tidak menjadi item penyaluran per individu.
- Cache row 16 (R=MISKIN) dibandingkan dengan formula R yang akan menghasilkan CUKUP LAYAK; perbedaan ini ditampilkan, bukan disamakan.
- Nama warga dari workbook tidak disalin. Nama amil diganti kode anonim pada rincian kontribusi.

## Belum diuji / belum disahkan

- UAT browser aktual pada Chrome/Edge/Firefox dan perangkat mobile pengguna.
- UAT manual bersama panitia/pengurus dan tanda tangan persetujuan formula.
- Kebenaran saldo P43/P49, selisih beras 0,6 kg, kode AL/FZ, hubungan metode insentif Q/R, dan anomali formula baris pertama.
- Keamanan backend, autentikasi, multi-tenant server, enkripsi, backup, API, dan transaksi produksi.

Prototype tetap berjalan lokal di browser. Jangan gunakan untuk penerimaan atau penyaluran zakat nyata sebelum backend, kontrol keamanan, rekonsiliasi, kebijakan, dan UAT diselesaikan.
