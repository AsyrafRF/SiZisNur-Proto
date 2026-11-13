# Portal Publik Multi-Lembaga dan Verifikasi QR

## Ruang lingkup

Portal Publik menampilkan semua lembaga dengan status `aktif` dan `publicPortalEnabled !== false`. Lembaga ditangguhkan atau disembunyikan oleh Admin SiZisNur tidak muncul dalam direktori publik dan token transaksinya tidak dapat diverifikasi melalui portal.

Lembaga yang sudah ada pada database demo dimigrasikan ke `publicPortalEnabled: true` bila field tersebut belum tersedia. Lembaga aktif yang dibuat atau disetujui Admin SiZisNur juga dipublikasikan secara default. Admin SiZisNur dapat mengubah visibilitas pada detail lembaga.

## Data yang ditampilkan

Portal hanya menampilkan agregat lembaga:

- Jumlah transaksi yang sudah disahkan Amil: status `paid`, `disetor`, atau `terverifikasi`.
- Total uang dan beras dari transaksi yang disahkan.
- Jumlah catatan penyaluran berstatus `tersalurkan` beserta agregat uang/beras.
- Ringkasan kategori zakat per lembaga.

Portal tidak menampilkan nama Muzakki, nomor telepon, email, alamat rumah, nama Mustahik, identitas Amil/Operator, ID akun, atau nilai pembayaran individual. Profil lembaga publik dibatasi pada nama lembaga dan label daerah/wilayah publik.

## Verifikasi struk

QR struk menggunakan format `SIZISNUR|tenantId|transactionId|serial`. Portal mencocokkan keempat bagian agar lembaga, transaksi, dan nomor seri harus konsisten. Input manual berupa ID atau nomor seri masih didukung; jika nomor seri sama pada lebih dari satu lembaga, verifikasi ditolak dan pengguna diminta memindai QR lengkap.

Status publik:

- `paid`: valid, pembayaran disahkan Amil.
- `disetor`: valid, transaksi telah masuk proses serah terima Bendahara.
- `terverifikasi`: valid, status rekonsiliasi Bendahara selesai.
- `pending` / `tercatat`: belum tervalidasi, bukan bukti pembayaran final.
- `batal`, `ditolak`, `expired`, atau `kedaluwarsa`: tidak valid.

Hasil tidak pernah mengungkap identitas pembayar atau nilai transaksi individual. Pembacaan QR hanya memastikan kecocokan kode dan status yang tersimpan pada basis data prototype; hal ini bukan pembuktian pembayaran fisik atau dokumen resmi.

## Kamera

Pemindaian kamera menggunakan `getUserMedia` dan `BarcodeDetector` bawaan browser. Kamera memerlukan izin pengguna serta HTTPS atau localhost. Dukungan `BarcodeDetector` belum merata pada semua browser/perangkat; bila tidak tersedia, tombol kamera menampilkan penjelasan dan input token manual tetap dapat digunakan. Stream dihentikan setelah QR terbaca, tombol stop ditekan, atau halaman ditinggalkan.

## Batas produksi

Semua data tetap tersimpan di `localStorage` browser. Portal multi-lembaga ini hanya menggabungkan data dari database demo yang ada pada perangkat yang sama; ia bukan API publik, bukan layanan cloud, dan tidak memiliki pengamanan server-side. Sebelum publikasi produksi, sediakan endpoint baca-saja dengan autentikasi layanan internal, lembaga scoping di database, agregasi server-side, rate limiting, audit, TLS, QR bertanda tangan atau token acak yang tidak dapat ditebak, serta validasi status transaksi secara otoritatif. Hindari mengirim database penuh ke browser publik.
