<p align="center">
  <a href="https://sizisnur.sroft.my.id" target="_blank">
    <img src="https://github.com/AsyrafRF/SiZisNur-Proto/blob/6416aaa8d71a077878c70d6b83ed64da6200b2ba/assets/sizisnur-logo-mark.png" width="90" alt="MoneyMate Logo">
  </a>
</p>

<p align="center">
  <em>Platform ZIS untuk masjid dan komunitas perumahan.</em>
</p>

<p align="center">
  <a href="https://github.com/AsyrafRF/SiZisNur-Proto">
    <img src="https://img.shields.io/badge/Project-Prototype-blue" alt="Project Status">
  </a>
  <img src="https://img.shields.io/badge/Development-In%20Progress-orange" alt="Development Status">
  <img src="https://img.shields.io/badge/Platform-Web-green" alt="Platform">
  <img src="https://img.shields.io/badge/Domain-ZIS-purple" alt="ZIS Platform">
  <img src="https://img.shields.io/badge/License-GPL--3.0-blue?logo=gnu&logoColor=white" alt="GNU GPL v3.0">
</p>

# SiZisNur — Prototype Platform Pengelolaan Zakat, Infak & Sedekah

# SiZisNur V5 — Prototype Revisi 7 Actor

**Jenis aplikasi:** prototype interaktif untuk alur pengelolaan zakat, infak, dan sedekah (ZIS).  
**Teknologi:** HTML, CSS, JavaScript murni, penyimpanan browser `localStorage`, service worker untuk cache shell, dan generator QR lokal.  
**Status:** bahan evaluasi stakeholder. Bukan aplikasi transaksi zakat produksi dan belum boleh dipakai untuk mengelola uang, beras, atau data warga yang sebenarnya.

**Istilah antarmuka:** kata **Lembaga** digunakan untuk organisasi pengelola ZIS yang terdaftar, misalnya masjid, UPZ, atau komunitas. Nama teknis internal seperti `tenantId` dan `db.tenants` tetap dipakai demi kompatibilitas data. Lihat `docs/GLOSARIUM_TERMINOLOGI.md`.

## 1. Konteks dan tujuan pembaruan

Project awal merupakan prototype web statis SiZisNur dengan contoh lembaga, dashboard, penerimaan zakat, data Muzakki dan Mustahik, setoran Bendahara, penyaluran, laporan, serta acuan angka workbook 1447H/2026M. Revisi 12–13 November 2026 mengubah pembagian actor menjadi tujuh peran dan menyelaraskan alur dari persiapan data sampai laporan akhir.

Pembaruan ini mempertahankan modul dan angka workbook yang sudah ada, lalu menambahkan alur mandiri Muzakki, transaksi Pending yang diverifikasi Amil, serah terima kas multi-tahap, koreksi terkendali, batch distribusi, panduan tiap role, dukungan, laporan UPZ, dan evaluasi keputusan yang masih memerlukan persetujuan stakeholder. Revisi 13 November mengembalikan kalkulasi otomatis ke form transaksi Muzakki, Operator, dan Amil serta menambahkan pemisahan kelebihan pembayaran dan konfirmasi sebelum simpan. Revisi 14 November menambahkan aktor **Admin SiZisNur** sebagai pengelola root platform yang terpisah dari tujuh role lembaga, memperluas Portal Publik untuk seluruh lembaga aktif, menambahkan verifikasi QR publik dengan kamera, serta menyediakan **Pengaturan Prototype** untuk ekspor/impor, reset, penghapusan data simulasi, dan pemeriksaan integritas.

## 2. Catatan pembaruan landing page

Landing page V5 mempertahankan kembali komposisi visual dari landing page V3, termasuk ilustrasi dashboard di area hero, strip ringkasan, kartu layanan, kartu fitur, diagram langkah, visual tujuh peran, ilustrasi multi-lembaga, CTA, dan footer. Pembaruan pada bagian ini berfokus pada copywriting agar menjelaskan fitur dan alur terbaru. Tidak ada perubahan pada stylesheet landing page atau sistem desain visualnya.

## 3. Tema dan keterbacaan alert

Alert kontekstual dan toast menggunakan token warna terpusat untuk tema terang dan gelap. Warna teks tidak lagi bergantung pada warna teks global halaman, sehingga peringatan berwarna kuning dan pesan kesalahan tetap terbaca saat dark mode aktif. Perbaikan berlaku lintas halaman, termasuk dashboard, formulir, modal, panduan, laporan, dan halaman evaluasi. Preferensi tema tetap dapat diubah melalui tombol **Tema**.

## 4. Paginasi daftar data

Seluruh tabel data yang menggunakan komponen tabel bersama menampilkan maksimal 10 baris per halaman. Aturan ini berlaku pada daftar Mustahik, Muzakki, lembaga yang terhubung pada akun Muzakki, transaksi, rekonsiliasi, jurnal, koreksi, batch, distribusi, notifikasi, audit, laporan, dan tabel di dalam modal. Tabel berisi 10 baris atau kurang tetap ditampilkan tanpa kontrol halaman. Pencarian dan filter bekerja pada keseluruhan hasil, sedangkan CSV/XLSX dan cetak/PDF laporan tidak dibatasi oleh halaman yang sedang terlihat.

## 5. Cara menjalankan

1. Ekstrak ZIP project.
2. Buka `index.html` di browser modern. Untuk cache offline dan izin kamera, jalankan melalui HTTPS atau server lokal.
3. Alternatif server lokal tanpa dependency tambahan:

   ```bash
   python -m http.server 8000
   ```

   Buka `http://localhost:8000/`.
4. Pilih **Masuk / Coba Demo**. Layar awal memisahkan **Login sebagai Muzakki** dan **Login sebagai Panitia**. Pendaftaran Muzakki tersedia dari link di halaman login Muzakki; pendaftaran pada jalur Panitia adalah pengajuan lembaga, bukan pembuatan akun petugas.
5. Untuk melewati simulasi login, buka **Akses Demo Langsung** yang berada pada halaman terpisah. Pilih akun/role yang ingin diuji.
6. Untuk menyiapkan ulang simulasi, masuk sebagai **Admin SiZisNur** (`root@sizisnur.demo`) lalu buka tab **Pengaturan Prototype**. Di sana tersedia ekspor/impor cadangan JSON, reset default ke Dataset Masjid An-Nur, hapus semua data, pilihan Dataset Multi-Lembaga, dan pemeriksaan integritas. Hapus data menyisakan hanya akun Root; reset serta pergantian dataset memerlukan frasa konfirmasi.

Catatan: klaim histori transaksi Walk-in ke akun baru belum diaktifkan. Penautan harus menunggu verifikasi nomor HP/email agar data tidak dapat diambil hanya dengan memasukkan kontak milik orang lain.

Profil lembaga untuk pemilihan Muzakki menampilkan ID publik unik, alamat dan wilayah, peta simulasi, serta carousel foto yang dikelola Admin melalui **Kelola Lembaga & UPZ**. Petunjuk pengaturan, format URL foto, pola ID, dan batasan peta ada di `docs/PROFIL_LEMBAGA_PETA_GALERI_ID.md`.

Navigasi akun Muzakki dipisahkan menjadi tiga halaman: **Dashboard Zakat Saya** untuk ringkasan dan riwayat pribadi, **Layanan Mandiri** untuk profil/keluarga/kalkulator zakat, serta **Rencana Bayar Zakat** untuk memulai perencanaan pembayaran dan memperoleh QR transaksi Pending. Dashboard tidak lagi menampung panel layanan mandiri berbentuk dropdown.

File mandiri yang memuat HTML, CSS, JavaScript, autentikasi simulasi, QR, logo, dan Pengaturan Prototype tersedia pada `standalone/SiZisNur_Prototype_V5_Standalone.html`. Petunjuk lebih lengkap: `docs/PENGATURAN_PROTOTYPE.md` dan `docs/LOGIN_REGISTER_DAN_AKSES_DEMO.md`. Petunjuk detail penyatuan form dan format transaksi ada pada `docs/INPUT_TRANSAKSI_TERPADU.md`.

## 6. Pengaturan Prototype

Aktor Admin SiZisNur memiliki tab **Pengaturan Prototype** untuk mengekspor dan mengimpor cadangan JSON database V5, reset ke seed terbaru, menghapus semua data simulasi, memeriksa relasi dasar, mengembalikan tema, dan keluar dari sesi root. Reset dan hapus data menggunakan frasa konfirmasi. Hapus semua data akan mengosongkan Mustahik; akun Admin SiZisNur tetap dipertahankan agar konsol root dapat diakses kembali. Lihat `docs/PENGATURAN_PROTOTYPE.md` untuk format cadangan, batas impor, perlindungan data, dan cara menjalankan.

**Catatan Mustahik:** array Mustahik tidak diubah dalam pembaruan akun contoh dan reset mengambil kembali seed yang dipertahankan. Catatan implementasi workbook pada project menyebut record individual yang ada sebagai data sintetis non-identifying untuk mereproduksi agregat workbook terverifikasi; workbook Excel sumber tidak disertakan di dalam arsip ini.

## 7. Kalkulasi otomatis transaksi zakat

Form transaksi **Muzakki (Layanan Mandiri)**, input konter **Operator/Amil**, dan **Formulir Publik** memakai satu pembangun formulir, mesin kalkulasi, validasi, konfirmasi kelebihan, model rincian transaksi, dan renderer struk yang sama. Setiap baris adalah satu kombinasi jenis zakat/donasi dan media; satu formulir dapat memuat hingga 12 baris dalam satu nomor transaksi dan satu QR. Contohnya, Zakat Fitrah uang dan Zakat Fitrah beras dapat digabung dengan Zakat Maal, Profesi, Fidyah, Kafarat, atau Infak/Sedekah. Pada aturan prototype saat ini, media beras tersedia untuk Zakat Fitrah; kategori lain menggunakan uang. Bila kelebihan pembayaran Fitrah beras dipisahkan, rincian Infak/Sedekah mengikuti media beras tersebut. Pratinjau menghitung kewajiban, nilai dibayar, kekurangan, kelebihan, serta total uang dan beras secara terpisah. Perubahan jenis, media, jumlah jiwa/hari/kasus, nilai harta atau penghasilan, haul, serta jenis kafarat memperbarui estimasi.

| Jenis | Logika estimasi di prototype | Parameter lembaga yang dapat diatur Admin |
|---|---|---|
| Zakat fitrah | Jumlah jiwa × tarif uang per jiwa atau kilogram beras per jiwa | Tarif uang dan beras per jiwa |
| Zakat maal | 2,5% dari agregat harta bersih jika telah mencapai nisab emas dan haul satu tahun untuk harta yang mensyaratkannya | Nisab gram emas, harga emas per gram, kadar zakat |
| Zakat profesi | 2,5% dari penghasilan bulanan bila mencapai nisab bulanan; tersedia opsi akumulasi penghasilan satu tahun bila penghasilan tidak mencapai nisab bulanan | Nisab profesi bulanan (Rupiah) dan kadar zakat |
| Fidyah | Jumlah hari puasa yang ditinggalkan × tarif per hari | Tarif fidyah per hari |
| Kafarat | Jumlah kasus × jumlah porsi berdasarkan jenis kasus (10 untuk sumpah; 60 untuk kasus tertentu setelah tahapan sebelumnya tidak mampu) × biaya makan per orang | Biaya makan per orang; nilai awal 0 agar Admin wajib mengesahkan tarif lembaga |
| Infak/sedekah | Sukarela; tidak diberi nilai kewajiban otomatis | Tidak ada kewajiban minimum |

Nilai tarif fitrah lembaga yang telah tersimpan tetap dipertahankan (misalnya Rp45.000 pada lembaga contoh An-Nur dan Rp50.000 pada lembaga Al-Hikmah); migrasi tidak menimpa keputusan lokal. Nilai awal fidyah mengikuti referensi BAZNAS RI 1447 H/2026 M sebesar Rp65.000/hari, tetapi Admin dapat mengubahnya untuk lembaga. Parameter maal awal menggunakan nisab 85 gram emas dan kadar 2,5%; harga Rp1.078.608,56/gram adalah nilai awal simulasi yang diturunkan dari ambang penghasilan 2026, bukan klaim harga pasar emas terkini. Admin wajib mengganti harga acuan tersebut sesuai sumber harga emas dan keputusan lembaga sebelum hasil maal dipakai untuk transaksi nyata. Nisab profesi bulanan memakai angka BAZNAS 2026 Rp7.640.144 secara terpisah (akumulasi tahunan Rp91.681.728) agar acuan 14 karat untuk pendapatan tidak tercampur dengan harga emas yang dipakai untuk kalkulasi maal. Admin dapat memperbarui kedua parameter tersebut.

**Kelebihan pembayaran:** checkbox “Jika pembayaran zakat melebihi kewajiban, pisahkan kelebihannya sebagai infak/sedekah” tersedia untuk fitrah, maal, dan profesi. Jika checkbox dicentang, baris pembayaran dipecah menjadi nilai zakat sesuai kewajiban dan sisanya menjadi infak/sedekah dalam media yang sama. Jika belum dicentang dan pembayaran lebih besar dari estimasi, tombol **Simpan dan terbitkan QR** memunculkan konfirmasi. Pilihan “Ya” mencentang pemisahan lalu melanjutkan penyimpanan; pilihan “Tidak” mengembalikan pengguna ke formulir. Fidyah dan kafarat tidak otomatis dialihkan karena perlakuan kelebihan atas kewajiban tersebut perlu ketentuan tersendiri.

**Wilayah, format nominal, dan bukti:** Pada input identitas Operator/Amil dan Formulir Publik, pilihan **Warga daerah** menampilkan RW dan RT yang bersumber dari Master Wilayah lembaga; pilihan **Non-daerah** menyembunyikan dan tidak menyimpan RW/RT lembaga. Input nominal Rupiah memakai pemisah ribuan titik (contoh `1.250.000`), sedangkan beras memakai koma desimal (contoh `2,5 kg`). Konfirmasi kelebihan memakai dialog bersama di semua jalur. Struk digital, cetak/PDF, gambar PNG, dan thermal 80 mm mengambil renderer transaksi yang sama, menampilkan setiap baris jenis/media, jumlah jiwa/hari/kasus bila relevan, dasar harta untuk Maal/Profesi, serta total uang dan beras. Layout thermal memakai aturan halaman otomatis di bagian head dokumen cetak yang mengikuti ukuran media driver, area konten 74 mm, dan pratinjau roll yang dipusatkan pada jendela khusus; tombol thermal memakai renderer transaksi bersama.

Kafarat tidak dipatok dengan satu nominal universal: kalkulasi bergantung pada jenis kasus dan tahapan yang relevan. Untuk kafarat sumpah, opsi memberi makan 10 orang dapat dihitung. Untuk kasus yang bertahap (misalnya hubungan suami-istri pada siang Ramadan atau zihar), sistem tidak menghitung opsi makan 60 orang kecuali pengguna secara eksplisit mengonfirmasi bahwa tahapan sebelumnya tidak mampu ditunaikan. Jika Admin belum mengatur biaya makan per orang, UI menampilkan peringatan dan tidak menghitung nominal otomatis. Semua hasil adalah estimasi bantu; penetapan kewajiban, haul, komponen harta, kasus kafarat dan tarif lokal tetap perlu disahkan oleh otoritas syariah/BAZNAS yang berwenang. Kalkulasi maal saat ini menggunakan satu nilai harta bersih agregat, bukan kalkulator lengkap untuk seluruh objek zakat (misalnya pertanian, peternakan, atau ragam usaha).

Rujukan resmi yang digunakan untuk nilai awal: [BAZNAS RI — zakat fitrah dan fidyah 1447 H/2026 M](https://baznas.go.id/news-show/Ramadan_2026,_BAZNAS_RI_Tetapkan_Zakat_Fitrah_Rp50_Ribu/3708), [nisab dan kadar zakat penghasilan 2026](https://www.baznas.go.id/zakatpenghasilan), [kalkulator zakat BAZNAS](https://baznas.go.id/kalkulatorzakat), dan [penjelasan kafarat BAZNAS](https://baznas.go.id/artikel-show/Mengenal-Arti-Kafarat/232). Tarif tetap dapat disesuaikan Admin lembaga sesuai ketetapan wilayah.

## 8. Matriks actor dan tanggung jawab

| Actor | Fokus | Kewenangan prototype |
|---|---|---|
| **Admin** | Sistem dan master data | Mengelola akun dan role, profil lembaga, tarif, periode, pengaturan, serta input dan verifikasi kelayakan Mustahik. Tidak mempunyai akses untuk mengedit atau menghapus transaksi yang sudah diverifikasi. |
| **Muzakki** | Self-service | Registrasi akun demo secara mandiri dengan nama lengkap, nomor HP, email, dan alamat. Setelah login, pilih dan hubungkan satu atau beberapa lembaga melalui menu akun, lalu kelola domisili/RT, anggota keluarga, kalkulator zakat, transaksi, QR, riwayat, dan bukti. |
| **Operator** | Walk-in front-office | Input identitas dan transaksi konter berstatus `Pending`, menerbitkan struk QR, dan mengarahkan Muzakki ke Amil. Tidak dapat menerima atau mengesahkan pembayaran. |
| **Amil** | Kasir, akad, verifikasi shift | Buka/tutup shift, scan QR, periksa rincian transaksi, pandu akad, konfirmasi penerimaan uang/beras, sahkan pembayaran, dan terbitkan BSZ. Amil dapat memakai fungsi input Operator bila tidak tersedia petugas Operator terpisah. |
| **Bendahara** | Kas, rekonsiliasi dan distribusi | Menerima berita acara dari shift yang ditutup, memeriksa uang dan beras fisik, rekonsiliasi rekening, meninjau koreksi, membentuk jurnal, menyiapkan alokasi dan batch Relawan. |
| **Relawan** | Distribusi lapangan | Tampilan mobile-first, pilih batch tugas, scan QR Mustahik atau cari kode, lalu catat penerimaan satu kali untuk penerima yang ditugaskan. |
| **Pengurus** | Oversight | Baca laporan dan data operasional, memantau arus kas, berita acara dan audit, serta menyetujui atau menolak program penyaluran. Persetujuan program adalah satu-satunya tindakan operasional yang diberikan selain akses baca. |

**Admin SiZisNur (root/platform) bukan role kedelapan lembaga dan tidak tergabung dalam `db.users`.** Akunnya disimpan dalam koleksi terpisah `db.platformAdmins`, memiliki `scope: platform`, dan tidak mempunyai `tenantId`. Konsol root mengelola registrasi dan status lembaga, tinjauan pengajuan lembaga, metadata lembaga, status akun pengguna lintas lembaga, pengaturan global, pengumuman, mode pemeliharaan, serta audit platform. Admin lembaga tetap bertanggung jawab atas tarif zakat, periode, data Muzakki/Mustahik, transaksi, dan kas lembaganya.

Pengaturan akses pada prototype berlaku di lapisan UI JavaScript. Itu bukan pengganti otorisasi server. Pemisahan tugas harus ditegakkan lagi pada API dan basis data saat pengembangan backend.

### Akun demo root platform

- **Nama/role:** Admin SiZisNur
- **Email demo:** `root@sizisnur.demo`
- **ID internal:** `PA-SIZISNUR-ROOT`
- **Cara masuk:** pilih tile **Admin SiZisNur** pada halaman **Akses Demo Langsung**. Akun root tidak diterima pada jalur Login Panitia.
- **Konsol:** Ringkasan, Lembaga Terdaftar, Pengajuan Lembaga, Akun Pengguna Lembaga, Pengaturan Sistem Root, Audit Platform, dan Profil Akun Root.

Admin SiZisNur dapat membuat lembaga beserta akun Admin awal dan aturan/periode draf, mengaktifkan/menangguhkan lembaga, meninjau pengajuan publik, mengubah metadata lembaga, serta mengaktifkan/nonaktifkan akun lembaga. Lembaga yang ditangguhkan atau ketika mode pemeliharaan aktif tidak dapat membuka workspace operasional. Pengajuan publik yang masuk tetap berstatus **menunggu** sampai ditinjau dari konsol root.

## 9. Alur end-to-end yang diimplementasikan

### A. Persiapan

Admin menyiapkan periode, tarif, parameter, identitas lembaga, dan data Mustahik. Form Mustahik mempertahankan rumus penilaian pada workbook dan tidak mengubah otomatis anomali sumber.

### B. Penghimpunan

Pada jalur mandiri, Muzakki membuat akun lebih dahulu dengan nama lengkap, nomor HP, email, dan alamat tanpa memilih lembaga. Setelah login, ia memilih lembaga dari menu Layanan Mandiri; sistem baru membuat data Muzakki dan membership lembaga setelah tahap tersebut selesai. Selanjutnya Muzakki mandiri atau Operator konter dapat membuat transaksi dengan status `Pending`. Keduanya mendapat QR dan struk rencana. Akun Muzakki dapat terhubung ke banyak lembaga, tetapi hanya satu transaksi aktif per lembaga pada satu periode. Setiap token mengandung lembaga asal dan hanya dapat diperiksa pada lembaga tersebut.

Amil wajib membuka shift. Setelah scan QR, layar verifikasi menampilkan identitas Muzakki, rincian uang/beras, identitas Amil, dan pengingat akad. Amil baru dapat mengesahkan setelah mengonfirmasi penerimaan fisik dan akad. Struk dapat diunduh sebagai PNG, dicetak atau disimpan sebagai PDF melalui browser, dan dicetak dengan layout thermal 80 mm.

QR `Pending` berakhir setelah 24 jam atau saat periode ditutup, mana yang lebih dahulu. Email dan WhatsApp dicatat sebagai kanal simulasi, bukan pengiriman eksternal aktif.

### C. Rekonsiliasi Bendahara

Bendahara hanya dapat membuat berita acara dari transaksi pada shift Amil yang sudah ditutup. Tahap pertama mencocokkan uang dan beras fisik. Tahap kedua mencocokkan mutasi rekening atau catatan saldo logistik. Selisih harus disertai catatan dan diselesaikan sebelum dana dihitung sebagai saldo rekonsiliasi untuk alokasi fleksibel.

Koreksi tidak menimpa transaksi asal. Amil atau Operator mengajukan alasan dan nilai usulan. Bendahara memutuskan, dan keputusan menjadi catatan audit serta penyesuaian jurnal. Nilai koreksi uang (IDR) dan beras (kg) dibukukan terpisah.

### D. Persetujuan dan distribusi

Bendahara menyiapkan alokasi dari saldo yang sudah direkonsiliasi, atau dari perhitungan Tahap 1 dan Tahap 2 workbook. Draf diajukan kepada Pengurus untuk disetujui atau ditolak. Alokasi yang disetujui dapat dibagi menjadi batch pertama, kedua, dan seterusnya. Bendahara menetapkan Relawan dan daftar penerima. Relawan hanya dapat mengonfirmasi penerima dalam batch yang ditugaskan.

### E. Pelaporan dan audit

Dashboard menyediakan filter kategori dan ringkasan uang/beras. Laporan dapat difilter menurut periode dan jenis laporan serta diekspor ke CSV, XLSX, atau PDF melalui fungsi cetak browser. Paket CSV/XLSX UPZ disediakan sebagai bahan pelaporan bulanan, tetapi belum dikirim langsung ke BAZNAS. Log audit demo memakai rantai hash SHA-256 untuk membantu mendeteksi perubahan yang tidak konsisten.

## 10. Modul tambahan

- **Master wilayah per lembaga:** setiap lembaga memiliki satu Daerah induk dan hierarki RW → RT yang dikelola Admin pada menu Profil Lembaga. Dataset default hanya memuat Masjid An-Nur / Perumahan Villa Pesona Asri, RW 11 dengan RT 01–06. Preset Multi-Lembaga juga memuat Masjid Al-Hikmah / Kompleks Buana Citra, RW 1 (RT 01–10) dan RW 2 (RT 01–05). Tenant baru mendapat Daerah induk otomatis; Admin-nya mengatur RW/RT sendiri. Formulir identitas Muzakki dan Mustahik menggunakan pilihan Warga daerah atau Non-daerah; warga memilih RW dan RT dari master, bukan mengetik bebas. Status domisili dan ID Daerah/RW/RT disimpan pada identitas per lembaga dan dapat direkap pada menu Muzakki serta Laporan.
- **Preset dataset prototype:** Dataset Masjid An-Nur adalah default dan memuat satu lembaga beserta operasional dan acuan workbook 1447H. Dataset Multi-Lembaga dapat dipilih terpisah di Pengaturan Prototype dan memuat An-Nur, Al-Hikmah, serta pengajuan Al-Falah menunggu. Hapus semua data menyisakan hanya akun Admin SiZisNur (Root), tanpa membuat ulang akun tenant yatim pada reload. Jika belum ada lembaga, halaman Muzakki menjelaskan kondisi tersebut; aplikasi dan Master Wilayah tetap tersedia untuk lembaga baru. Hak akses menu mengikuti matriks role V5.
- **Modul Input Transaksi Terpadu:** satu komponen input, kalkulasi, konfirmasi kelebihan, validasi, dan struk digunakan oleh Operator/Amil, Muzakki, serta Formulir Publik. Mendukung beberapa rincian jenis/media dalam satu transaksi (maksimal 12 baris), total uang dan beras terpisah, RW/RT sesuai Master Wilayah untuk warga daerah, format Rupiah bertitik, dan struk yang seragam. Lihat `docs/INPUT_TRANSAKSI_TERPADU.md`.
- **Portal Zakat Publik & Pendataan Mandiri (evaluasi simulasi):** Admin, Amil, dan Operator dapat menerbitkan tautan/QR per lembaga dan periode, membagikan tautan melalui WhatsApp, serta mencetak banner. Warga dapat mengisi identitas dan rencana zakat tanpa akun; OTP hanya ditampilkan pada browser, pencarian transaksi dibatasi tenant/periode, transaksi Pending dapat dibuka buktinya dan dibatalkan bila belum diproses. Fitur ini berjalan pada localStorage satu browser, tidak mengirim OTP dan tidak menyinkronkan perangkat. Jangan gunakan data nyata; lihat `docs/PORTAL_ZAKAT_PUBLIK_EVALUASI.md` untuk alur, batas simulasi, dan checklist keamanan produksi.
- **Panduan role:** halaman Panduan & Bantuan menampilkan langkah dan diagram alur sesuai peran. Amil juga memiliki halaman ketentuan, dalil, niat, doa, dan pengingat akad.
- **Support & feedback:** laporan bantuan, saran, bug, dan dugaan masalah keamanan tersimpan di database browser lokal. Pengiriman ke sistem monitoring eksternal memerlukan endpoint.
- **Offline-first prototype:** service worker menyimpan shell aplikasi. Perubahan data masuk antrean sinkronisasi lokal. Pengiriman baru dicoba jika `window.SIZISNUR_API_BASE` disediakan. Tanpa backend yang sesuai, tidak ada sinkronisasi cloud.
- **Produksi Portal Publik:** sebelum layanan digunakan warga sungguhan, backend harus menyediakan token tautan ter-hash, tenant isolation, OTP provider nyata, rate-limit/anti-bot, pencocokan identitas yang aman, transaksi atomik/idempotent, otorisasi state machine pembatalan, QR bertanda tangan, enkripsi, audit server, retensi privasi, monitoring, backup, dan penetration test. Checklist lengkap ada pada `docs/PORTAL_ZAKAT_PUBLIK_EVALUASI.md`; jangan menganggap prototype sudah memenuhi kontrol tersebut.
- **Ruang evaluasi prototype:** menginventarisasi aturan bisnis, kebijakan keuangan, syariah, integrasi dan keamanan yang belum disepakati.

## 11. Batasan dan keamanan yang wajib dipahami

1. Belum ada backend produksi, PostgreSQL, MFA, otorisasi server-side, enkripsi data-at-rest, backup terjadwal, atau isolasi lembaga tingkat server. Prototype kini memiliki form login email/password dan hash PBKDF2 pada browser, tetapi kredensial serta sesi tetap berada di localStorage/sessionStorage dan dapat dimodifikasi pemilik perangkat. Ini bukan autentikasi produksi atau batas keamanan yang dapat dipercaya. Jangan mempublikasikan build demo dengan data nyata. Sebelum produksi, autentikasi root harus memakai kredensial terpisah, MFA wajib, otorisasi backend khusus platform, pembatasan jaringan/perangkat sesuai risiko, rate limit, pencatatan audit server append-only, serta proses pemulihan akun yang diawasi. Jangan masukkan NIK, nomor rekening, alamat rumah nyata, data keluarga nyata, atau transaksi aktual.
2. `localStorage` dapat dibaca dan diubah oleh pengguna perangkat. Hash audit SHA-256 pada browser bukan bukti immutable, bukan tanda tangan digital, dan bukan pengganti audit server append-only.
3. Master wilayah administratif menggunakan relasi `areas` → `rws` → `rts`; identitas menyimpan `domicileStatus`, `areaId`, `rwId`, dan `rtId`, sedangkan snapshot keanggotaan lembaga menyimpan atribut domisili lembaga yang sama. Validasi relasi dijalankan di sisi aplikasi prototype, tetapi API produksi tetap wajib memverifikasi kepemilikan lembaga dan parent-child di server. Antrean sinkronisasi hanya menyiapkan event dan record untuk endpoint yang belum disediakan. API produksi harus mengautentikasi pengguna, memeriksa lembaga di server, menggunakan HTTPS, menerapkan idempotensi, validasi skema, penanganan konflik, dan mengembalikan `acknowledgedEventIds` sebelum event terkait dihapus dari antrean.
4. Cache service worker hanya mencakup application shell. Offline belum menjamin semua proses kamera, data lintas perangkat, autentikasi, atau penyelesaian konflik. Operasi keuangan offline untuk rilis memerlukan desain transaksi lokal, enkripsi, idempotency key, kontrol perangkat, dan uji pemulihan.
5. Kamera QR memerlukan HTTPS dan izin perangkat yang kompatibel. Input token manual tetap tersedia sebagai fallback. Cetak PDF memakai dialog print browser dan bukan berkas PDF yang dihasilkan oleh server.
6. Notifikasi email/WhatsApp tidak benar-benar terkirim. BAZNAS/UPZ belum terkoneksi karena endpoint dan skema pelaporan resmi belum disediakan.
7. Jurnal, neraca dan laporan perubahan dana merupakan model simulasi. Bagan akun, pemisahan dana zakat/infak/sedekah/fidyah/kafarat, pengakuan persediaan beras, pajak/biaya, dan standar pelaporan harus ditetapkan bersama Bendahara, Pengurus, BAZNAS, serta auditor.
8. Tarif zakat, nisab, lafaz akad, doa, formula distribusi, dan kebijakan mustahik perlu disahkan oleh pihak berwenang dan pembimbing agama. Teks akad hanya pengingat UI dan tidak mengesahkan ibadah. Atribut Daerah/RW/RT administratif pada identitas Mustahik tetap terpisah dari `mustahik.region` (kolom H wilayah penilaian survei); kolom H dan formula skor workbook 1447H tidak diubah oleh fitur master wilayah.
9. Revisi ini bukan audit hukum. Sebelum rilis, lakukan kajian atas UU 23/2011 tentang Pengelolaan Zakat, PP 14/2014, UU 27/2022 tentang Pelindungan Data Pribadi, peraturan turunannya, kebijakan BAZNAS terkait UPZ, dan ketentuan daerah yang relevan. Konsultasikan dengan penasihat hukum dan BAZNAS.

## 12. Rujukan kebutuhan dan keputusan yang belum selesai

Lihat `docs/CAKUPAN_FITUR.md` untuk pemetaan fitur, `docs/SKENARIO_UAT.md` untuk langkah verifikasi, `docs/QA_HASIL_PENGUJIAN.md` untuk hasil tes, `docs/PORTAL_ZAKAT_PUBLIK_EVALUASI.md` untuk Portal Zakat Publik dan standar keamanan produksi, `docs/IMPLEMENTASI_WORKBOOK_1447H.md` untuk rumus dan angka workbook, dan menu **Evaluasi Prototype** untuk daftar pertanyaan yang perlu diputuskan stakeholder.

Asumsi yang sengaja belum ditetapkan antara lain batas waktu transaksi Pending, apakah satu transaksi mencakup beberapa jenis zakat, dasar prioritas Mustahik, formula alokasi fleksibel, saldo agregat workbook Tahap 2, struktur laporan UPZ, dan format integrasi email/WhatsApp.

## 13. Build dan pengujian

```bash
node --check js/app.js
node --check js/revision-v5.js
node --check js/platform-admin.js
node --check js/public-intake.js
node tests/workbook-rules.test.cjs
node tests/dataset-role-reset.test.cjs
node tests/prototype-settings.test.cjs
node tests/authentication.test.cjs
node tests/role-guides.test.cjs
node tests/dark-alerts.test.cjs
node tests/dark-ui-theme.test.cjs
node tests/pagination.test.cjs
node tests/tenant-territories.test.cjs
node tests/transaction-calculator.test.cjs
node tests/platform-admin.test.cjs
node tests/muzakki-dashboard.test.cjs
node tests/muzakki-registration.test.cjs
node tests/dashboard-analytics.test.cjs
node tests/dashboard-status.test.cjs
node tests/public-portal.test.cjs
node tests/public-intake.test.cjs
python tools/build-standalone.py
```

Pengujian otomatis memeriksa aturan workbook 1447H, komposisi dataset Mustahik sintetis, preset Dataset Masjid An-Nur dan Multi-Lembaga, hapus semua data yang hanya menyisakan Root, larangan pembuatan ulang akun tenant yatim, alert Muzakki saat belum ada lembaga, master Daerah/RW/RT untuk tenant baru, matriks menu seluruh role, autentikasi simulasi, hash audit, alokasi, validasi relasi lintas lembaga, pemisahan domisili administratif dari kolom H penilaian, serta kontras warna alert/toast dan komponen UI global pada light dan dark mode. Tes tersebut bukan pengganti pengujian browser multi-perangkat, penetration test, uji aksesibilitas, uji beban, maupun UAT resmi bersama stakeholder.

## 14. Struktur folder

```text
index.html
css/style.css
js/app.js
js/revision-v5.js
js/platform-admin.js
js/public-portal.js
js/public-intake.js
js/qrcode.js
assets/
docs/
  ADMIN_SIZISNUR_ROOT.md
  CAKUPAN_FITUR.md
  DEPLOY_NETLIFY_VERCEL.md
  IMPLEMENTASI_WORKBOOK_1447H.md
  QA_HASIL_PENGUJIAN.md
  REBRANDING_DAN_LANDING_PAGE.md
  SKENARIO_UAT.md
  THIRD_PARTY.md
manifest.webmanifest
service-worker.js
standalone/SiZisNur_Prototype_V5_Standalone.html
tests/workbook-rules.test.cjs
tests/public-intake.test.cjs
tests/dataset-role-reset.test.cjs
tests/prototype-settings.test.cjs
tests/authentication.test.cjs
tests/transaction-calculator.test.cjs
tests/tenant-territories.test.cjs
tools/build-standalone.py
CHANGELOG_V3.md
README.md
```


## Portal Publik multi-lembaga dan verifikasi QR

- Buka **Portal Publik** dari landing page atau layar masuk; login lembaga tidak diperlukan.
- Direktori menampilkan lembaga dengan status `aktif` dan opsi tampil publik diaktifkan. Admin SiZisNur dapat mengatur visibilitas melalui **Lembaga Terdaftar → Detail → Tampilkan lembaga pada Portal Publik**.
- Setiap lembaga menampilkan angka agregat penghimpunan dan penyaluran. Nama Muzakki/Mustahik, kontak, alamat rumah, identitas petugas, dan nominal transaksi individual tidak ditampilkan.
- Untuk memeriksa struk fisik, tekan **Scan QR dengan kamera** dan izinkan akses kamera. Hasil valid berarti pembayaran telah disahkan Amil; hasil Pending masih belum tervalidasi. Token/nomor seri juga dapat dimasukkan secara manual.
- Kamera memerlukan HTTPS atau localhost dan dukungan `BarcodeDetector`. Browser yang belum mendukung API pemindai harus memakai input manual.
- Untuk penjelasan aturan status, privasi, dan batasan produksi, baca `docs/PORTAL_PUBLIK_TRANSPARANSI_DAN_QR.md`.

## 15. Struk thermal 80 mm

- Cetak Thermal 80 mm menggunakan pratinjau roll terpusat dan layout satu kolom bergaya POS dengan font monospace, header tengah, metadata label/nilai sejajar, separator ASCII, rincian pembayaran ringkas, total uang/beras rata kanan, serta QR 28 mm.
- Data yang tercetak tetap sama dengan struk digital/PDF, termasuk seluruh baris multi-jenis/multi-media, status, token QR, dan disclaimer simulasi.
- PDF biasa tidak diubah. Thermal memakai dialog cetak browser dan CSS; ini bukan pengiriman perintah ESC/POS mentah. Pada Edge pilih printer thermal, paper size 80 mm roll, skala 100%/Actual size, dan matikan header/footer. Ukuran media, densitas dan cutter tetap mengikuti driver printer.
- Detail: `docs/INPUT_TRANSAKSI_TERPADU.md`, bagian **Struk yang seragam**.
