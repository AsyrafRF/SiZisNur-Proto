# Hasil Pengujian Teknis Prototype — 28 Oktober 2026

> Pengujian ini terbatas pada simulasi; tidak ada UAT panitia resmi atau penilaian keamanan backend.

| Kasus | Hasil |
|---|---|
| Sintaks `app.js` / `qrcode.js` menggunakan `node --check` | Lulus |
| Render navigasi seluruh halaman pada keenam role + akun tenant kedua | Lulus; tidak ada error JavaScript |
| Amilin membuat transaksi fiktif lalu muncul akad, struk, dan token QR | Lulus |
| Pembayaran fitrah uang Rp100.000 untuk 2 jiwa dipisah menjadi Rp90.000 fitrah dan Rp10.000 infak ketika opsi kelebihan aktif | Lulus |
| Verifikasi transaksi QR menggunakan OpenCV QRCodeDetector pada screenshot | Lulus; teks `AZIS|TN-ANNUR|...` berhasil dibaca |
| Bendahara membentuk setoran dari transaksi belum disetor | Lulus |
| Bendahara memasukkan kas fisik tidak cocok, mencatat alasan selisih lalu mengoreksi dan verifikasi | Lulus |
| Petugas menambah mustahik dengan skor indikatif | Lulus |
| Petugas mengajukan alokasi, Pengurus menyetujui | Lulus |
| Petugas mencatat penyaluran, rekap laporan berubah | Lulus |
| Portal publik verifikasi `TR-001` tanpa nama/nomor telepon | Lulus |
| Pengajuan tenant ditinjau pada konsol simulasi platform; akun Admin tenant baru tersedia | Lulus |
| Mobile viewport 390 px, navigasi hamburger, periksa overflow horizontal | Lulus |
| ZIP verifikasi integritas | Lulus |

Pengujian otomatis menggunakan Playwright (hanya di lingkungan pembuat). Aplikasi pengguna tidak memerlukan Playwright atau Python untuk dijalankan. Hasil ini tidak membuktikan keamanan, kebenaran aturan syariah, reliabilitas, isolasi data antarpengguna, atau integrasi perangkat yang belum dibuat.
