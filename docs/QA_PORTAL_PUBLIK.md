# QA Portal Publik

- [x] Portal bisa dibuka tanpa login lembaga.
- [x] Daftar lembaga mencakup seluruh lembaga aktif yang dipublikasikan.
- [x] Lembaga ditangguhkan dan lembaga yang disembunyikan tidak tampil.
- [x] Agregat publik hanya menghitung transaksi yang sudah disahkan Amil (`paid`, `disetor`, `terverifikasi`).
- [x] Agregat penyaluran hanya menghitung catatan `tersalurkan`.
- [x] Nama Muzakki, Mustahik, petugas, kontak, alamat rumah, dan nilai transaksi individual tidak ditampilkan.
- [x] Token QR dicocokkan berdasarkan lembaga, ID transaksi, dan nomor seri.
- [x] QR/token yang salah dan serial ambigu ditolak.
- [x] Pending ditandai belum tervalidasi; batal/kedaluwarsa ditandai tidak valid.
- [x] Scan kamera menggunakan `getUserMedia` + `BarcodeDetector`, disertai input manual sebagai fallback.
- [x] Stream kamera dihentikan saat scan selesai, tombol stop, atau pagehide.

Catatan: test simulasi tidak menggantikan UAT kamera langsung pada Android/iOS dan browser target. BarcodeDetector dan getUserMedia bergantung pada dukungan browser, izin kamera, dan secure context.
