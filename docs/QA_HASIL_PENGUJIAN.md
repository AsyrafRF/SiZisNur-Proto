# Validasi teknis SiZisNur — 1 November 2026

> Hasil ini adalah pengujian prototype menggunakan DOM browser otomatis, bukan UAT resmi panitia, audit keamanan, ataupun uji produksi.

| Skenario | Hasil |
|---|---|
| Pemeriksaan sintaks JavaScript | Lulus (`node --check`) |
| Halaman awal tanpa sesi | Landing page SiZisNur tampil |
| Logo landing | Aset termuat dengan ukuran gambar yang valid |
| Landing → login enam role → dashboard | Lulus |
| Amilin membuka modul penerimaan | Lulus |
| Struk lama/new, token QR baru | Token `SIZISNUR\|...` dibuat |
| Verifikasi QR baru pada portal publik | Lulus |
| Kompatibilitas verifikasi token QR versi lama | Lulus |
| Dashboard ↔ beranda produk | Lulus |
| Logout kembali ke landing | Lulus |
| Pengajuan lembaga demonstrasi | Form dan transisi ke simulasi pemeriksaan platform berfungsi |
| Mobile 390 px | Tidak ada overflow horizontal halaman depan |
| Browser JavaScript console/page errors | Tidak ada page error pada smoke test |

**Batasan pengujian:** Browser headless dibuka dengan konten HTML/CSS/JS yang disisipkan ke dokumen pengujian karena navigasi localhost/file dibatasi pada lingkungan uji. Source eksternal tetap dicek sintaksnya. Semua berkas bersifat statis dan dapat digunakan sebagai Netlify/Vercel Drop. Validasi deployment pada akun hosting pengguna belum dilakukan.

**Tidak mengubah alur bisnis:** Uji regresi sebelumnya terhadap transaksi, bendahara, mustahik, alokasi, persetujuan, distribusi, dan laporan tetap menjadi acuan; perubahan revisi ini terbatas pada branding, halaman depan, dan perpindahan antarhalaman publik.
