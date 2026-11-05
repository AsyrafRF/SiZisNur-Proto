# Changelog SiZisNur V3

Tanggal: 4 November 2026

## Perubahan utama

- Menghubungkan prototype dengan workbook resmi tervalidasi Ramadan 1447H/2026M.
- Menambahkan menu **Acuan Workbook 1447H** berisi angka agregat, rekonsiliasi, alokasi, insentif, shift, divisi panitia, dan temuan audit.
- Mengganti penilaian mustahik menjadi formula lima faktor workbook, jalur F/M, jalur Mualaf, dan final status R; menandai konflik cache/formula pada row 16.
- Menambahkan pilihan input yang mengikuti nilai sumber, termasuk `NON RW 10`, pilihan RT, kategori penghasilan, serta teks `4 ATAU LEBIH`.
- Menambahkan preview skor langsung pada form survei mustahik.
- Menambahkan alokasi Tahap 1 dan Tahap 2 dengan nominal uang dan paket beras per asnaf sesuai workbook.
- Menyimpan saldo tahap 2 Rp37.500 dan 13,04 paket sebagai saldo agregat; belum dibagikan per penerima. Ledger rencana workbook dipisahkan dari saldo transaksi demo, dan penerima yang sudah direncanakan dicadangkan dari alokasi fleksibel.
- Mengganti halaman insentif menjadi dua perhitungan workbook Q/R dengan label amil anonim; hubungan kedua metode belum diputuskan.
- Mengatur periode aktif demo menjadi 1447H/2026M; periode 1448H tetap draf contoh.
- Mengisolasi database V3 pada `sizisnur_demo_database_v4`; data V2 tidak dimigrasikan.
- Memperbarui README, skenario UAT, pemetaan cakupan, catatan implementasi workbook, dan QA.

## Perlindungan data

Tidak ada nama, NIK, nomor HP, alamat, atau catatan survei warga dari workbook yang disalin. Dataset 129 mustahik dibuat sintetis untuk menguji komposisi agregat 21 Fakir, 103 Miskin, dan 5 Mualaf. Nama amil diganti kode anonim.

## Validasi

- `node --check js/app.js` — lulus.
- `node tests/workbook-rules.test.cjs` — lulus.
- Uji browser penuh dan UAT resmi bersama pengurus — belum dilakukan.
