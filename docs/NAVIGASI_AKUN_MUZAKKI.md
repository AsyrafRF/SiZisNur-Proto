# Navigasi Akun Muzakki

Menu akun Muzakki dibagi menjadi tiga halaman agar fungsi tidak menumpuk pada satu halaman.

## 1. Dashboard Zakat Saya

Halaman ini mempertahankan ringkasan pribadi yang sudah tersedia: status zakat periode aktif, total uang dan beras yang tercatat, rincian jenis zakat, status verifikasi Bendahara, serta riwayat zakat periode sebelumnya. Panel profil/keluarga/kalkulator tidak lagi ditampilkan sebagai dropdown di halaman ini.

Pada tabel **Jenis zakat yang tercatat periode ini**, tombol **Lihat bukti / QR** membuka kembali struk transaksi yang sama dengan layar setelah pembuatan rencana, termasuk QR dan opsi unduh PNG atau cetak/simpan PDF. Muzakki tidak perlu mengunduh bukti pada saat pertama kali membuat rencana; bukti dapat dibuka kembali selama transaksi tersimpan dan terkait dengan akun atau membership miliknya.

Tombol **Batalkan** hanya muncul untuk transaksi mandiri berstatus `pending` yang belum memiliki penanda verifikasi Amil, penugasan petugas, shift, maupun berita acara setoran. Muzakki wajib mengisi alasan dan konfirmasi. Sistem mengubah status menjadi `batal` tanpa menghapus transaksi, mencatat waktu/pelaku/alasan ke audit, dan menampilkan transaksi pada bagian **Transaksi tidak aktif periode ini**. QR transaksi yang dibatalkan tidak berlaku lagi. Transaksi `paid`, `disetor`, `kas_diterima`, `terverifikasi`, transaksi konter, atau transaksi yang sudah tertaut berita acara tidak dapat dibatalkan dari akun Muzakki.

## 2. Layanan Mandiri

Halaman ini berisi daftar lembaga yang terhubung, tombol untuk bergabung dengan lembaga lain, pengaturan profil dan wilayah alamat pada lembaga aktif, pengelolaan keluarga tanggungan, serta kalkulator zakat. Jika akun belum terhubung dengan lembaga, halaman menampilkan data akun global dan tombol **Pilih lembaga**. Setelah bergabung, formulir layanan mandiri tersedia.

## 3. Rencana Bayar Zakat

Halaman ini menampilkan lembaga aktif, periode zakat, jumlah keluarga, dan status rencana. Tombol **Mulai rencana bayar zakat** membuka formulir transaksi mandiri yang sudah ada. Perhitungan jenis zakat, nominal atau jumlah beras, konfirmasi, status Pending, dan penerbitan QR tetap mengikuti proses transaksi lama. Muzakki kemudian menunjukkan QR kepada Amil untuk pemeriksaan penerimaan fisik dan akad.

Satu rencana aktif per lembaga dan periode tetap diberlakukan oleh validasi transaksi. Tombol pembuatan rencana tidak tersedia ketika periode belum dibuka atau rencana periode tersebut sudah dibuat. Akun yang belum memilih lembaga diarahkan untuk menghubungkan akun ke lembaga terlebih dahulu.

## Catatan prototype

Semua data dan transaksi masih berupa simulasi lokal di browser. Status Pending bukan bukti pembayaran diterima; pembayaran baru disahkan setelah proses pemeriksaan Amil dan rekonsiliasi Bendahara yang berlaku pada alur SiZisNur.
