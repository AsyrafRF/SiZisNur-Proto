# Navigasi Akun Muzakki

Menu akun Muzakki dibagi menjadi tiga halaman agar fungsi tidak menumpuk pada satu halaman.

## 1. Dashboard Zakat Saya

Halaman ini mempertahankan ringkasan pribadi yang sudah tersedia: status zakat periode aktif, total uang dan beras yang tercatat, rincian jenis zakat, status verifikasi Bendahara, serta riwayat zakat periode sebelumnya. Panel profil/keluarga/kalkulator tidak lagi ditampilkan sebagai dropdown di halaman ini.

## 2. Layanan Mandiri

Halaman ini berisi daftar lembaga yang terhubung, tombol untuk bergabung dengan lembaga lain, pengaturan profil dan wilayah alamat pada lembaga aktif, pengelolaan keluarga tanggungan, serta kalkulator zakat. Jika akun belum terhubung dengan lembaga, halaman menampilkan data akun global dan tombol **Pilih lembaga**. Setelah bergabung, formulir layanan mandiri tersedia.

## 3. Rencana Bayar Zakat

Halaman ini menampilkan lembaga aktif, periode zakat, jumlah keluarga, dan status rencana. Tombol **Mulai rencana bayar zakat** membuka formulir transaksi mandiri yang sudah ada. Perhitungan jenis zakat, nominal atau jumlah beras, konfirmasi, status Pending, dan penerbitan QR tetap mengikuti proses transaksi lama. Muzakki kemudian menunjukkan QR kepada Amil untuk pemeriksaan penerimaan fisik dan akad.

Satu rencana aktif per lembaga dan periode tetap diberlakukan oleh validasi transaksi. Tombol pembuatan rencana tidak tersedia ketika periode belum dibuka atau rencana periode tersebut sudah dibuat. Akun yang belum memilih lembaga diarahkan untuk menghubungkan akun ke lembaga terlebih dahulu.

## Catatan prototype

Semua data dan transaksi masih berupa simulasi lokal di browser. Status Pending bukan bukti pembayaran diterima; pembayaran baru disahkan setelah proses pemeriksaan Amil dan rekonsiliasi Bendahara yang berlaku pada alur SiZisNur.
