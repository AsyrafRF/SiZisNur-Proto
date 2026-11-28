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

Password minimal 8 karakter. Email dan nomor HP disimpan pada identitas login serta profil akun; keduanya dapat dipakai sebagai pengenal saat login. Registrasi ini tidak meminta pilihan lembaga dan tidak membuat person, kartu Muzakki, atau membership lembaga. Setelah masuk, Muzakki memilih lembaga melalui menu Layanan Mandiri sesuai alur yang sudah ada.

## 3. Login Panitia dan pendaftaran lembaga

Login Panitia hanya menerima akun dengan role lembaga (Admin, Pengurus, Operator, Amil, Bendahara, atau Relawan). Akun Muzakki dan Admin SiZisNur root tidak diterima pada jalur ini.

Panitia tidak mendaftarkan akun sendiri. Admin lembaga membuat akun petugas melalui menu **Akun & Peran**, mengisi nama lengkap, nomor HP, email, role, password awal, serta konfirmasi password. Nomor HP dan email wajib diisi. Saat mengedit akun, Admin dapat memperbarui kontak dan mengganti password.

Pencegahan duplikasi berlaku pada Lembaga dan role yang sama: email dibandingkan tanpa membedakan huruf besar/kecil, sedangkan nomor HP dinormalisasi (spasi/tanda baca dibuang dan awalan 08/8 disetarakan dengan 628). Jika email **atau** nomor HP sudah dipakai pada role yang sama, penyimpanan ditolak. Kontak yang sama tetap boleh dipakai oleh orang yang sama pada role berbeda, misalnya Operator sekaligus Amil. Login Panitia meminta pilihan role agar akun dengan kontak yang sama tidak tertukar.

Nama tidak digunakan sebagai kunci unik. Jika nama lengkap sama tetapi kontak menunjukkan orang berbeda, form meminta **Nama panggilan / penanda** yang unik untuk membedakan tampilan dan penyebutan petugas. Nama panggilan ini ditampilkan pada daftar akun, akses demo, dan nama petugas di modul penugasan. Nilai nomor HP yang disediakan untuk akun demo adalah data sintetis untuk pengujian, bukan kontak orang sungguhan.

Tautan pendaftaran pada layar login Panitia membuka **Pendaftaran Lembaga**, bukan form akun Panitia. Pemohon mengisi nama lembaga, nama penanggung jawab, email, nomor HP, dan alamat. Pengajuan disimpan dengan status menunggu. Tombol pengajuan pada landing page diarahkan kembali ke jalur Login Panitia, sehingga tidak ada modal register lembaga yang memintas proses login dan link pendaftaran tersebut.

Setelah Admin SiZisNur menyetujui pengajuan, sistem membuat lembaga beserta satu akun **Admin awal**. Nomor HP penanggung jawab wajib diisi dan disalin ke data kontak Admin awal (dapat diubah pada form peninjauan). Prototype menghasilkan password sementara secara acak dan menampilkannya pada konfirmasi persetujuan. Admin awal wajib mengganti password pada login pertama. Akun petugas lainnya tetap dibuat oleh Admin lembaga dari menu Akun & Peran.

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

## 7. Verifikasi OTP email dan nomor HP

Prototype menyediakan **simulasi OTP** pada alur yang membutuhkan pembuktian kepemilikan kontak. Kode tidak dikirim ke provider eksternal; kode demo ditampilkan pada browser agar alur dapat diuji. Mekanisme berlaku pada:

- Registrasi mandiri Muzakki: email dan nomor HP harus diverifikasi sebelum akun dibuat.
- Pengajuan lembaga: email dan nomor HP pemohon harus diverifikasi sebelum pengajuan disimpan. Setelah disetujui root, status kontak yang sudah diverifikasi diteruskan ke akun Admin awal.
- Login Muzakki/Panitia: setelah password benar, kanal kontak yang belum terverifikasi wajib melewati OTP sebelum sesi login dibuat. Akun Panitia yang dibuat Admin lembaga karena itu diverifikasi pada login normal pertama.
- Verifikasi/perubahan kontak pada **Akun & Keamanan**: setiap kontak baru atau yang belum diverifikasi harus melewati OTP sebelum perubahan disimpan. Untuk Muzakki, email/HP pada identitas login, akun, dan membership person diperbarui secara konsisten.
- Perubahan password dari pengaturan akun: password saat ini harus benar dan OTP dikirimkan secara simulasi ke semua kanal kontak yang tersedia.
- Lupa password melalui form login maupun **Akun & Keamanan**: Muzakki dapat mencari akun dengan email/nomor HP; Panitia harus memilih role (Admin, Pengurus, Operator, Amil, Bendahara, atau Relawan). Seluruh kanal kontak terdaftar yang tersedia harus diverifikasi sebelum password baru diterima. Akun root memiliki pengaturan akun pada konsol platform, bukan jalur Login Panitia.
- Portal Zakat Publik: tetap memakai flow OTP publik yang terpisah untuk mengakses identitas/transaksi pada lingkup tautan lembaga dan periode.

Kolom email/nomor HP yang hanya berfungsi sebagai **informasi operasional**—misalnya kontak profil lembaga, data Muzakki/Mustahik yang dicatat petugas pada layanan walk-in/konter, atau kontak opsional pada tiket bantuan—tidak otomatis menjadi identitas login dan tidak memicu OTP. Ini disengaja agar pencatatan transaksi konter dan data operasional yang sudah ada tidak terganggu. Data tersebut tidak boleh dipakai untuk mengklaim atau menggabungkan akun; pembuktian kepemilikan kontak hanya dilakukan melalui alur akun/registrasi/portal yang dijelaskan di atas.

Aturan simulasi OTP autentikasi akun: kode enam digit acak melalui Web Crypto, berlaku **5 menit**, maksimal **5 percobaan** per challenge, maksimal **3 kali kirim ulang**, dan jeda kirim ulang **30 detik**. Challenge memiliki tujuan, kanal, status, waktu kedaluwarsa, hitungan percobaan, serta jejak waktu. Kode dihapus setelah verifikasi berhasil atau challenge dikunci/kedaluwarsa. Kanal yang sudah diverifikasi tidak diminta ulang dalam flow yang sama. Batas Portal Zakat Publik mengikuti implementasi flow publiknya sendiri.

Halaman **Akun & Keamanan** tersedia bagi akun Muzakki dan role lembaga serta di bagian Profil Akun Root. Halaman ini memuat profil/kontak, status verifikasi email/HP, aksi verifikasi kontak, ubah password, dan pintasan lupa password. Data kontak yang diubah melalui profil umum Muzakki tidak lagi boleh melewati verifikasi; pengguna diarahkan ke **Akun & Keamanan**.

Status `emailVerifiedAt` dan `phoneVerifiedAt` hanya diisi setelah flow OTP simulasi selesai. Status tersebut berguna untuk menguji state transition antarmuka dan business logic, tetapi karena kode ditampilkan di browser serta challenge berada pada `localStorage`, hal itu **bukan bukti kepemilikan kontak yang dapat dipercaya**.

## 8. Batasan keamanan dan kebutuhan produksi

Project ini masih berupa prototype browser tanpa server autentikasi maupun provider email, WhatsApp, atau SMS. OTP login/registrasi/pemulihan akun dibuat dan diperiksa di sisi klien; challenge, kode demo, akun, hash password, dan sesi berada pada storage browser. Pengguna yang menguasai perangkat dapat membaca atau mengubah data tersebut. Tidak ada rate limit server, anti-bot, proteksi account enumeration, session revocation terpusat, otorisasi API, atau verifikasi provider sesungguhnya. Karena itu OTP dan pemulihan password hanya mensimulasikan alur yang akan dibangun, bukan keamanan produksi.

Untuk produksi, pindahkan seluruh operasi kredensial dan OTP ke backend: buat kode acak kriptografis di server, simpan hanya hash/representasi aman challenge, kirim melalui provider terverifikasi, validasi challenge secara atomik, terapkan rate limit per akun/IP/perangkat dan cooldown server-side, cegah enumerasi akun dengan respons yang seragam, batasi percobaan, cegah replay, catat audit server, cabut sesi lama setelah reset password, dan sediakan proses pemulihan bila kanal kontak tidak dapat diakses. Ikat challenge pada tujuan, akun, aksi, dan masa berlaku; jangan mempercayai nilai `verifiedAt` yang dikirim klien.

Hash password prototype menggunakan PBKDF2-SHA256 melalui Web Crypto di browser dan bukan pengganti penyimpanan kredensial server. Produksi memerlukan password hashing terkelola (misalnya Argon2id atau bcrypt dengan parameter yang sesuai), session cookie `HttpOnly` + `Secure` + `SameSite`, CSRF protection, MFA untuk role kritis, otorisasi server-side, pemantauan, backup, serta pengujian keamanan. Jangan memakai kredensial seed atau data pribadi/transaksi nyata di lingkungan demo.
