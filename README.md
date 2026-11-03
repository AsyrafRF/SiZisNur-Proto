<p align="center">
  <a href="https://sizisnur.sroft.my.id" target="_blank">
    <img src="https://github.com/AsyrafRF/SiZisNur-Proto/blob/6416aaa8d71a077878c70d6b83ed64da6200b2ba/assets/sizisnur-logo-mark.png" width="300" alt="MoneyMate Logo">
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

**Jenis:** Prototype simulasi interaktif (TO-BE), bukan aplikasi zakat resmi.
**Teknologi:** HTML5, CSS3, JavaScript murni. Tanpa framework, backend, build tools, database server, atau CDN. Generator QR pihak ketiga dibundel secara lokal (lihat `docs/THIRD_PARTY.md`).
**Rancangan awal:** 28 Oktober 2026. **Revisi branding dan landing page:** 1 November 2026.

## Cara menjalankan

1. Ekstrak paket ZIP ke folder mana saja.
2. **Cara termudah:** buka `index.html` melalui browser Chrome, Edge atau Firefox. Semua file JS dan CSS disimpan lokal.
3. Jika pembatasan browser mencegah penyimpanan pada halaman `file://`, jalankan server lokal opsional tanpa instalasi library: di folder proyek jalankan `python -m http.server 8000`, lalu buka `http://localhost:8000/`.
4. Di **landing page**, klik **Masuk / Coba Demo**, lalu pilih akun peran demo dari halaman login. **Tidak ada password** karena ini demonstrasi, bukan sistem produksi.
5. Jika ingin seluruh aplikasi dalam satu file, gunakan versi lain yang juga disediakan: `SiZisNur_Prototype_Standalone.html`.

**Jangan memasukkan data pribadi, NIK, nomor rekening, atau informasi pembayaran asli. Semua data disimpan di browser yang digunakan.**

## Struktur folder

```
Prototype_Zakat_Annur_Vanilla/
├── index.html            # Entry point
├── css/style.css         # Styling responsif + light/dark
├── js/app.js             # Data simulasi, router, UI, aturan demo, event handlers
├── js/qrcode.js          # Mesin QR offline, lisensi sumber dicatat
├── assets/sizisnur-logo-mark.png   # Simbol logo dari desain yang telah disetujui
├── assets/sizisnur-branding-reference.png # Papan referensi identitas logo
├── assets/               # Aset dan screenshot hasil uji
├── docs/THIRD_PARTY.md   # Atribusi QR
├── docs/CAKUPAN_FITUR.md # Modul vs implementasi/batasan
├── docs/SKENARIO_UAT.md  # Tutorial verifikasi alur lintas role
└── README.md
```

## Role yang disediakan

- **Admin:** profil tenant, pengguna dan role, parameter, laporan, audit, notifikasi contoh.
- **Pengurus:** dashboard, profil tenant, persetujuan alokasi, monitoring insentif, laporan, audit.
- **Petugas:** periode, tarif, jadwal, muzakki, survei mustahik, rencana alokasi, penyaluran, laporan, insentif.
- **Amilin:** pembayaran dan histori transaksi, kartu muzakki, jadwal sendiri, struk QR.
- **Operator Zakat:** membantu input penerimaan dan identitas muzakki.
- **Bendahara:** setoran, penghitungan uang/beras aktual, status selisih, verifikasi, laporan.

Akun **Admin Tenant B** memperlihatkan bagaimana data tenant berbeda ditampilkan terpisah dalam simulasi. Ini bukan isolasi keamanan sesungguhnya.

## Fitur interaktif penting

- Pengajuan tenant, keputusan otoritas platform (simulasi), aktivasi tenant dan akun admin demo.
- Dashboard per role; navigasi modul menyesuaikan peran.
- Login demo, mode ingat saya dan auto logout 30 menit tanpa aktivitas (simulasi sesi).
- Periode zakat aktif, draf, arsip dengan pengecekan sederhana sebelum penutupan.
- Konfigurasi tarif fitrah uang / beras dan bobot simulasi alokasi.
- Jadwal amilin, pengganti, absensi, dan perkiraan insentif.
- CRUD muzakki, pencarian, kartu unik dengan QR yang valid, histori transaksi.
- Transaksi dengan beberapa kategori (fitrah, mal, profesi, fidyah, kafarat, infak/sedekah); uang dan beras terpisah.
- Simulasi kewajiban per jiwa dan pemisahan kelebihan fitrah menjadi infak jika satu media pembayaran.
- Layar akad; pop-out untuk layar kedua; struk QR yang dapat dipindai; cetak 2 rangkap lewat browser.
- Setoran dikelompokkan menurut amilin, perbandingan nominal tercatat dan aktual, selisih dan verifikasi.
- Survei mustahik, skor indikatif, asnaf yang ditetapkan manual, verifikasi petugas.
- Simulasi alokasi berbobot kategori, pembulatan, status draf/ajuan/persetujuan/penolakan.
- Realisasi penyaluran dari alokasi yang disetujui; penolakan penyaluran ganda.
- Statistik keuangan, ekspor CSV/JSON, cetak laporan, audit aktivitas lokal, reset data.
- Portal publik agregat tanpa identitas pribadi; verifikasi token QR; tampilan JSON API hipotetis.
- Dark mode dan layout responsif.

## Batasan yang WAJIB dipahami

1. Tidak ada backend, basis data PostgreSQL, autentikasi sesungguhnya, enkripsi, audit immutable, backup terjadwal, API sungguhan, atau isolasi multi-tenant di server. `localStorage` bisa diedit pengguna.
2. Tidak ada pengiriman email, WA, SMS, pembayaran bank atau integrasi KTP. Berkas PDF dibuat dengan fungsi **Cetak → Simpan sebagai PDF** browser; tidak ada penulisan PDF di JS.
3. QR kode memang dapat dipindai, tetapi membawa token teks untuk dicocokkan secara manual di portal publik *lokal*, bukan tautan validasi server.
4. Akad Arab hanya ilustrasi; pengguna perlu mengonfirmasi lafaz kepada pembimbing agama. Sistem tidak mengesahkan ibadah.
5. Bobot alokasi, tarif, skor, dan insentif adalah nilai contoh. Ambang skor mustahik, formula insentif, sumber dana yang layak disalurkan, aturan pembulatan, metode koreksi dan alokasi harus divalidasi stakeholder.
6. Sistem ini tidak melaksanakan semua 188 FR/62 NFR secara produksi; cakupan prototype dipetakan dalam `docs/CAKUPAN_FITUR.md`.
7. Tidak ada jaminan ketersediaan 99,5%, keamanan data, audit eksternal, atau kemampuan multi-petugas secara real-time. Semua data hanya berlaku di browser/perangkat lokal.

## Penyimpanan dan reset

Data demo persisten pada `localStorage` dengan key `sizisnur_demo_database_v3`; session pada browser storage. Log aktivitas dapat dilihat pada menu Audit & Arsip. Menu **Reset data demo** mengembalikan contoh awal. Menghapus data browser juga dapat menghapus semua transaksi demo.

## Uji coba

File `docs/SKENARIO_UAT.md` menjelaskan urutan simulasi. Pengujian otomatis headless meliputi render setiap role, pembuatan transaksi, verifikasi setoran berselisih, approval alokasi, penyaluran, portal publik; QR telah didekode dengan pustaka OpenCV pada screenshot untuk memeriksa bahwa QR membawa token teks yang benar.

## Dasar kebutuhan

Diturunkan dari naskah analisis proses berjalan, tiga rangkaian wawancara panitia (22 Feb, 18 Apr, 23 Apr 2026), observasi workbook zakat, daftar user requirements, serta pembagian modul FR/NFR yang sebelumnya disusun. Ketika sumber bertentangan, penggunaan rumus belum disahkan diberi label *simulasi* dan tidak diimplementasikan sebagai keputusan syariah otomatis.

## Rebranding SiZisNur & landing page (revisi 1 November 2026)

- Logo baru di landing page, layar login, sidebar, favicon, dan identitas antarmuka. Nama SiZisNur digunakan di seluruh label yang ditampilkan, termasuk token QR baru (`SIZISNUR|...`).
- Landing page adalah **halaman awal** sebelum login. Berisi proposisi nilai, masalah yang diselesaikan, fitur, alur, enam role, rancangan multi-tenant, tombol masuk demo, portal publik, dan pengajuan tenant simulasi. Halaman pemasaran tidak menambahkan kewenangan atau kebutuhan bisnis baru.
- Penyimpanan browser kini memakai awalan `sizisnur_`. Saat dibuka dari asal web/browser yang sama, data dan sesi demo dari versi sebelumnya akan dicoba dimigrasikan otomatis. QR lama masih dapat diverifikasi melalui portal publik demo. Data di browser lain tidak ikut terbawa.
- **Bukan layanan produksi**: tidak ada pembayaran nyata, pemasaran berbayar, kontrak SaaS, server bersama, pengamanan backend, atau integrasi email. Statistik pada halaman depan berlabel contoh.
- Untuk deploy di Netlify/Vercel, unggah isi folder ini (pastikan `index.html` berada di root). Lakukan UAT ulang setelah mengganti identitas karena nama dan alur masuk berubah.

### Akses cepat
- `index.html`: halaman depan + semua modul interaktif, siap diunggah ke hosting statis.
- [Panduan deploy](docs/DEPLOY_NETLIFY_VERCEL.md).
- [Hasil pemeriksaan perubahan](docs/QA_HASIL_PENGUJIAN.md).
- [Rincian penyesuaian branding](docs/REBRANDING_DAN_LANDING_PAGE.md).
