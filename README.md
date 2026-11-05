# SiZisNur V3 — Prototype Platform Pengelolaan Zakat, Infak & Sedekah

**Jenis:** Prototype simulasi interaktif (TO-BE), bukan aplikasi zakat resmi.
**Teknologi:** HTML5, CSS3, JavaScript murni. Runtime tanpa framework, backend, database server, atau CDN. Helper Python opsional hanya untuk membangun file HTML mandiri. Generator QR pihak ketiga dibundel secara lokal (lihat `docs/THIRD_PARTY.md`).
**Rancangan awal:** 28 Oktober 2026. **Revisi branding dan landing page:** 1 November 2026. **Upgrade V3 berbasis workbook tervalidasi 1447H/2026M:** 4 November 2026.

## Cara menjalankan

1. Ekstrak paket ZIP ke folder mana saja.
2. **Cara termudah:** buka `index.html` melalui browser Chrome, Edge atau Firefox. Semua file JS dan CSS disimpan lokal.
3. Jika pembatasan browser mencegah penyimpanan pada halaman `file://`, jalankan server lokal opsional tanpa instalasi library: di folder proyek jalankan `python -m http.server 8000`, lalu buka `http://localhost:8000/`.
4. Di **landing page**, klik **Masuk / Coba Demo**, lalu pilih akun peran demo dari halaman login. **Tidak ada password** karena ini demonstrasi, bukan sistem produksi.
5. Jika ingin seluruh aplikasi dalam satu file, gunakan versi lain yang juga disediakan: `standalone/SiZisNur_Prototype_v3_Standalone.html`.

**Jangan memasukkan data pribadi, NIK, nomor rekening, atau informasi pembayaran asli. Semua data disimpan di browser yang digunakan.**

## Struktur folder

```
SiZisNur_Prototype_v3/
├── index.html            # Entry point
├── css/style.css         # Styling responsif + light/dark
├── js/app.js             # Data simulasi, router, UI, aturan demo, event handlers
├── js/qrcode.js          # Mesin QR offline, lisensi sumber dicatat
├── assets/sizisnur-logo-mark.png   # Simbol logo dari desain yang telah disetujui
├── assets/favicon.png              # Favicon SiZisNur
├── assets/sizisnur-branding-reference.png # Papan referensi identitas logo
├── assets/               # Logo, favicon, dan aset branding
├── docs/THIRD_PARTY.md   # Atribusi QR
├── docs/CAKUPAN_FITUR.md # Modul vs implementasi/batasan
├── docs/IMPLEMENTASI_WORKBOOK_1447H.md # Pemetaan workbook resmi ke V3
├── CHANGELOG_V3.md      # Ringkasan perubahan V3
├── tests/workbook-rules.test.cjs # Uji formula dan agregat tanpa dependensi
├── tools/build-standalone.py # Pembuat file HTML satu berkas
├── standalone/SiZisNur_Prototype_v3_Standalone.html # Build HTML mandiri
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
- Survei mustahik mengikuti kolom H–R master: lima faktor skor, jalur F/M, jalur Mualaf, final status, No. HP, dan Awal Mualaf (form survey).
- Alokasi generik berbobot tetap tersedia sebagai simulasi; alokasi Tahap 1 dan Tahap 2 menggunakan nominal uang dan paket beras per asnaf dari sheet PEMBAGIAN TOTAL 1447H.
- Realisasi penyaluran dari alokasi yang disetujui; penolakan penyaluran ganda.
- Acuan Workbook 1447H: ringkasan penerimaan 4 operator, 129 mustahik sintetis (21/103/5), pembagian 2 tahap, rekonsiliasi, anomali, dan daftar konfirmasi.
- Statistik keuangan, ekspor CSV/JSON, cetak laporan, audit aktivitas lokal, reset data. Template tanda terima dan formulir anak yatim dari workbook belum menjadi formulir cetak interaktif terpisah.
- Portal publik agregat tanpa identitas pribadi; verifikasi token QR; tampilan JSON API hipotetis.
- Dark mode dan layout responsif.

## Batasan yang WAJIB dipahami

1. Tidak ada backend, basis data PostgreSQL, autentikasi sesungguhnya, enkripsi, audit immutable, backup terjadwal, API sungguhan, atau isolasi multi-tenant di server. `localStorage` bisa diedit pengguna.
2. Tidak ada pengiriman email, WA, SMS, pembayaran bank atau integrasi KTP. Berkas PDF dibuat dengan fungsi **Cetak → Simpan sebagai PDF** browser; tidak ada penulisan PDF di JS.
3. QR kode memang dapat dipindai, tetapi membawa token teks untuk dicocokkan secara manual di portal publik *lokal*, bukan tautan validasi server.
4. Akad Arab hanya ilustrasi; pengguna perlu mengonfirmasi lafaz kepada pembimbing agama. Sistem tidak mengesahkan ibadah.
5. Formula skor mustahik dan nominal alokasi per asnaf mengikuti pola workbook 1447H yang ditemukan. Ada anomali rumus baris pertama, perbedaan cache/formula final pada row 16 (rekap cached 21/103/5, hitung ulang 21/102/1/5), kategori penghasilan 4–5 juta yang mendapat default 0, nilai tanggungan teks `4 ATAU LEBIH` (angka 4 mendapat default 0), saldo agregat tahap 2 yang belum memiliki metode pembagian individual, dan beberapa rekonsiliasi yang perlu keputusan pengurus. Tarif transaksi dan alokasi fleksibel tetap merupakan parameter demo. Formula insentif Q/R ditampilkan terpisah; hubungan alternatif atau gabungan belum diputuskan.
6. Sistem ini tidak melaksanakan semua 188 FR/62 NFR secara produksi; cakupan prototype dipetakan dalam `docs/CAKUPAN_FITUR.md`.
7. Tidak ada jaminan ketersediaan 99,5%, keamanan data, audit eksternal, atau kemampuan multi-petugas secara real-time. Semua data hanya berlaku di browser/perangkat lokal.

## Penyimpanan dan reset

Data demo V3 persisten pada `localStorage` dengan key `sizisnur_demo_database_v4`; session pada browser storage. V3 memakai namespace database baru dan membuat dataset awal tersendiri, tidak mengimpor database lokal V2. Log aktivitas dapat dilihat pada menu Audit & Arsip. Menu **Reset data demo** mengembalikan contoh awal. Menghapus data browser juga dapat menghapus semua transaksi demo.

## Uji coba

File `docs/SKENARIO_UAT.md` menjelaskan urutan simulasi. Jalankan `node tests/workbook-rules.test.cjs` untuk menguji formula skor, ambang klasifikasi, rekap mustahik sintetis, render template halaman utama, dan total alokasi dua tahap. Pemeriksaan ini bukan pengujian browser penuh atau UAT resmi.

## Dasar kebutuhan

Diturunkan dari naskah analisis proses berjalan, tiga rangkaian wawancara panitia (22 Feb, 18 Apr, 23 Apr 2026), observasi workbook zakat, daftar user requirements, serta pembagian modul FR/NFR yang sebelumnya disusun. Ketika sumber bertentangan, penggunaan rumus belum disahkan diberi label *simulasi* dan tidak diimplementasikan sebagai keputusan syariah otomatis.

## Rebranding SiZisNur & landing page (revisi 1 November 2026)

- Logo baru di landing page, layar login, sidebar, favicon, dan identitas antarmuka. Nama SiZisNur digunakan di seluruh label yang ditampilkan, termasuk token QR baru (`SIZISNUR|...`).
- Landing page adalah **halaman awal** sebelum login. Berisi proposisi nilai, masalah yang diselesaikan, fitur, alur, enam role, rancangan multi-tenant, tombol masuk demo, portal publik, dan pengajuan tenant simulasi. Halaman pemasaran tidak menambahkan kewenangan atau kebutuhan bisnis baru.
- Pada revisi branding 1 November 2026, penyimpanan browser menggunakan awalan `sizisnur_` dan kompatibilitas token QR lama dipertahankan. Pada upgrade V3, database dan sesi demo memakai namespace baru sehingga data V2 tidak diimpor; QR lama masih dapat diverifikasi melalui portal publik demo.
- **Bukan layanan produksi**: tidak ada pembayaran nyata, pemasaran berbayar, kontrak SaaS, server bersama, pengamanan backend, atau integrasi email. Statistik pada halaman depan berlabel contoh.
- Untuk deploy di Netlify/Vercel, unggah isi folder ini (pastikan `index.html` berada di root). Lakukan UAT ulang setelah mengganti identitas karena nama dan alur masuk berubah.

### Akses cepat
- `index.html`: halaman depan + semua modul interaktif, siap diunggah ke hosting statis.
- [Panduan deploy](docs/DEPLOY_NETLIFY_VERCEL.md).
- [Hasil pemeriksaan perubahan](docs/QA_HASIL_PENGUJIAN.md).
- [Rincian penyesuaian branding](docs/REBRANDING_DAN_LANDING_PAGE.md).


## Upgrade V3 — implementasi workbook 1447H/2026M

- Menu **Acuan Workbook 1447H** menampilkan rekap uang Rp175.240.500, 3.114 jiwa, 980 blanko, beras zakat 1.882,6 kg, beras infaq 71,5 kg, dan rekap mustahik 21 Fakir / 103 Miskin / 5 Mualaf.
- Data warga dari workbook tidak disalin. Dataset demo berisi 129 mustahik sintetis dengan komposisi rekap cached yang sama; hasil hitung ulang formula row 16 ditampilkan terpisah. Operator dan amil ditampilkan sebagai kode anonim bila data kontribusi diperlukan.
- Skor mustahik mengikuti lima faktor pada kolom H–M, formula jalur F/M (P), jalur Mualaf (Q), dan final status (R). Pola skor pernikahan baris 8+ dipakai; anomali baris pertama ditandai. Kategori 4–5 JUTA mengikuti default formula 0; nilai tanggungan 100 harus berupa teks `4 ATAU LEBIH`, bukan angka 4.
- Tahap 1: 21 Fakir × Rp900.000, 103 Miskin × Rp500.000, 5 Mualaf × Rp300.000; beras 3/2/1 paket per asnaf. Tahap 2: Rp1.100.000/Rp500.000/Rp350.000; beras 7/3/2 paket. Satu paket beras = 2,5 kg.
- Saldo tahap 2 Rp37.500 dan 13,04 paket disimpan sebagai saldo agregat pada total Miskin sesuai formula rekap, tetapi tidak dibagikan per individu sampai metode disetujui.
- Insentif Q (proporsi blanko) dan R (kehadiran) masing-masing ditampilkan sebagai pool Rp8 juta; workbook belum menjelaskan apakah alternatif atau digabung.
- Selisih beras 0,6 kg, kode AL/FZ, label satuan paket, angka manual P43/P49, formula #REF!, tanggal campuran, dan tautan workbook lama ditampilkan sebagai temuan audit.
- Uji otomatis: `node tests/workbook-rules.test.cjs`.
