# Login, Registrasi, dan Akses Demo SiZisNur

## 1. Pilihan akses awal

Halaman awal autentikasi memiliki dua jalur utama:

- **Login sebagai Muzakki** — untuk akun pribadi yang mendaftar secara mandiri.
- **Login sebagai Panitia** — untuk akun anggota tim yang dibuat oleh Admin lembaga.

Di bagian terpisah tersedia **Akses Demo Langsung per akun/role**. Halaman ini sengaja dipisahkan dari form login dan hanya untuk melewati autentikasi ketika demonstrasi atau UAT.

## 2. Login Muzakki dan pendaftaran mandiri

Login Muzakki menggunakan username/email dan password. Jika belum memiliki akun, tautan **Tidak punya akun? Daftar di sini** membuka halaman registrasi mandiri.

Data profil yang diminta:

1. Nama lengkap
2. Nomor HP
3. Email
4. Alamat lengkap
5. Password dan konfirmasi password sebagai kredensial login

Password minimal 8 karakter. Registrasi ini tidak meminta pilihan lembaga dan tidak membuat person, kartu Muzakki, atau membership lembaga. Setelah masuk, Muzakki memilih lembaga melalui menu Layanan Mandiri sesuai alur yang sudah ada.

## 3. Login Panitia dan pendaftaran lembaga

Login Panitia hanya menerima akun dengan role lembaga (Admin, Pengurus, Operator, Amil, Bendahara, atau Relawan). Akun Muzakki dan Admin SiZisNur root tidak diterima pada jalur ini.

Panitia tidak mendaftarkan akun sendiri. Admin lembaga membuat akun petugas melalui menu **Akun & Peran**, mengisi nama, email, role, password awal, serta konfirmasi password. Setiap petugas memakai kredensial masing-masing. Admin dapat mengganti password ketika mengedit akun.

Tautan pendaftaran pada layar login Panitia membuka **Pendaftaran Lembaga**, bukan form akun Panitia. Pemohon mengisi nama lembaga, nama penanggung jawab, email, nomor HP, dan alamat. Pengajuan disimpan dengan status menunggu. Tombol pengajuan pada landing page diarahkan kembali ke jalur Login Panitia, sehingga tidak ada modal register lembaga yang memintas proses login dan link pendaftaran tersebut.

Setelah Admin SiZisNur menyetujui pengajuan, sistem membuat lembaga beserta satu akun **Admin awal**. Prototype menghasilkan password sementara secara acak dan menampilkannya pada konfirmasi persetujuan. Admin awal wajib mengganti password pada login pertama. Akun petugas lainnya tetap dibuat oleh Admin lembaga dari menu Akun & Peran.

## 4. Akses Demo Langsung

Pilih **Akses Demo Langsung** pada halaman pilihan awal untuk melihat seluruh akun demo aktif. Menekan salah satu tile langsung membuka workspace sesuai role, tanpa melalui form email/password. Ini bukan jalur login normal dan tidak ditampilkan bercampur di halaman login.

## 5. Kredensial seed

Akun berikut tersedia untuk menguji form login simulasi. Kredensial ini hanya untuk data sintetis prototype:

| Jalur | Username / Email | Password |
|---|---|---|
| Muzakki | `muzakki01@demo.invalid` | `Muzakki#2026` |
| Admin Masjid An-Nur | `admin.annur@demo.invalid` | `Admin#2026` |
| Operator | `operator@demo.invalid` | `Demo#2026` |
| Amil | `amil01@demo.invalid` | `Demo#2026` |
| Bendahara | `bendahara@demo.invalid` | `Demo#2026` |
| Relawan | `relawan@demo.invalid` | `Demo#2026` |
| Pengurus | `pengurus@demo.invalid` | `Demo#2026` |
| Admin Al-Hikmah | `admin.alhikmah@demo.invalid` | `Admin#2026` |
| Admin SiZisNur | `root@sizisnur.demo` | `Root#2026` (Akses Demo Langsung) |

Akun Operator, Amil, Bendahara, Relawan, Pengurus, dan Admin dapat diuji melalui jalur **Login sebagai Panitia**. Akun root sengaja tidak masuk jalur Panitia.

## 6. Login sosial

Tombol Google, Facebook, dan Apple tersedia sebagai rancangan antarmuka. Jika ditekan, prototype memberi tahu bahwa OAuth belum dikonfigurasi dan tidak membuat sesi login palsu. Integrasi sebenarnya membutuhkan aplikasi OAuth masing-masing provider, redirect URI, server callback, validasi token di backend, serta pemetaan akun.

## 7. Batasan keamanan

Hash password memakai PBKDF2-SHA256 melalui Web Crypto pada browser untuk menghindari penyimpanan password dalam bentuk teks biasa. Namun seluruh akun, hash, sesi, dan data masih berada di storage browser. Pengguna perangkat dapat memeriksa atau mengubahnya. Tidak ada backend, MFA, verifikasi OTP, rate limit server, pemulihan akun, atau otorisasi API. Karena itu fitur ini mendekati alur antarmuka produksi tetapi belum dapat dipakai untuk melindungi data atau transaksi sebenarnya.

Untuk produksi, pindahkan autentikasi dan verifikasi password ke backend menggunakan password hashing terkelola (misalnya Argon2id atau bcrypt dengan parameter yang sesuai), session cookie `HttpOnly` + `Secure` + `SameSite`, CSRF protection, rate limiting, MFA untuk role kritis, verifikasi email/HP, serta audit dan kontrol akses server-side. Jangan memakai kredensial seed di lingkungan produksi.
