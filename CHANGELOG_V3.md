# Changelog SiZisNur

## 13 November 2026 — Penyesuaian copywriting landing page

- Mengembalikan komposisi visual landing page yang digunakan pada V3: navigasi, hero dengan ilustrasi dashboard, floating labels, strip ringkasan, tiga kartu manfaat, enam kartu fitur, diagram alur, visual tujuh aktor, ilustrasi multi-tenant, CTA dan footer.
- Memperbarui copywriting agar berfokus pada layanan mandiri Muzakki, QR transaksi dan verifikasi Amil, rekonsiliasi Bendahara, distribusi per batch, laporan, dan pemisahan tugas tujuh aktor.
- Tidak mengubah stylesheet atau sistem desain visual landing page.
- Memperbarui title dan meta description halaman.

## 13 November 2026 — Revisi Actor 7 Peran (lapisan V5)

Pembaruan dilakukan dengan mempertahankan acuan workbook 1447H/2026M dan data mustahik sintetis.

### Actor dan transaksi

- Mengganti matriks role menjadi Admin, Muzakki, Operator, Amil, Bendahara, Relawan dan Pengurus.
- Menambahkan self-service Muzakki dengan keanggotaan multi-tenant, data keluarga, kalkulator, riwayat dan satu transaksi aktif per tenant/periode. Pemeriksaan juga mempertimbangkan identitas orang pada transaksi Walk-in yang belum tertaut akun.
- Menambahkan transaksi Pending untuk jalur mandiri dan Walk-in, QR tenant-bound dan masa berlaku 24 jam atau sampai periode ditutup.
- Memisahkan fungsi Operator dari penerimaan uang dan verifikasi. Amil dapat memakai fungsi input konter, tetapi Operator tidak dapat memakai fungsi Amil.
- Menambahkan shift Amil, pemindaian QR, ringkasan akad, validasi pembayaran dan bukti setor zakat.

### Kas, koreksi dan distribusi

- Menambahkan berita acara serah terima setelah shift ditutup dan rekonsiliasi dua tahap untuk uang/beras fisik serta rekening/logistik.
- Menambahkan koreksi terkendali yang tidak menimpa transaksi asal, keputusan Bendahara dan jurnal penyesuaian uang/beras.
- Menambahkan jurnal IDR/kg, neraca ringkas, perubahan dana, alokasi fleksibel sebagai draf, persetujuan Pengurus dan distribusi per batch.
- Menambahkan tampilan Relawan mobile-first dengan QR/kode, pembatasan batch tugas dan pencegahan distribusi ganda.
- Memperluas akses baca Pengurus ke transaksi, serah terima, jurnal, koreksi dan audit. Pengurus tetap tidak mengubah data operasional.

### Pengalaman, laporan dan kesiapan rilis

- Memperbarui landing page agar berfokus pada fitur, alur fast-track dan tujuh peran.
- Menambahkan label Daerah dan RT bersyarat, notifikasi lokal, panduan role dengan diagram, panduan akad Amil serta support/feedback.
- Menambahkan grafik dan filter dashboard, ekspor CSV/XLSX, cetak PDF, paket laporan UPZ dan pemformatan Rupiah/kg.
- Menambahkan cache shell PWA dan antrean sinkronisasi lokal dengan adapter API opsional. Event hanya dihapus dari antrean setelah server mengirim acknowledgement untuk ID event yang benar-benar diterima. Backend belum disertakan.
- Menambahkan rantai audit SHA-256 untuk pemeriksaan perubahan data lokal.
- Menambahkan halaman evaluasi keputusan stakeholder, matriks keterlacakan revisi dan checklist hukum, privasi serta keamanan.

### Batas yang diketahui

Login, peran, database, notifikasi, audit dan antrean sync masih simulasi browser. Tidak ada backend, OTP/MFA, isolasi tenant server, integrasi email/WhatsApp, bank feed, sinkronisasi cloud aktif atau integrasi resmi BAZNAS. Alokasi fleksibel memakai asumsi pembagian rata dan harus disahkan stakeholder. Lihat `docs/CAKUPAN_FITUR.md` serta `docs/LEGAL_READINESS.md`.

## 4 November 2026 — Workbook 1447H/2026M

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

### Perlindungan data dan validasi workbook

Tidak ada nama, NIK, nomor HP, alamat, atau catatan survei warga dari workbook yang disalin. Dataset 129 mustahik dibuat sintetis untuk menguji komposisi agregat 21 Fakir, 103 Miskin, dan 5 Mualaf. Nama amil diganti kode anonim. Pengujian formula, hak akses, alokasi dan integritas audit dijelaskan pada `docs/QA_HASIL_PENGUJIAN.md`.
