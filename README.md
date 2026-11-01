# AZIS — Prototype Administrasi Zakat Masjid An-Nur VPA Batam

**Jenis:** Prototype simulasi interaktif (TO-BE), bukan aplikasi zakat resmi.
**Teknologi:** HTML5, CSS3, JavaScript murni. Tanpa framework, backend, build tools, database server, atau CDN. Generator QR pihak ketiga dibundel secara lokal (lihat `docs/THIRD_PARTY.md`).
**Tanggal perancangan:** 28 Oktober 2026.

## Cara menjalankan

1. Ekstrak paket ZIP ke folder mana saja.
2. **Cara termudah:** buka `index.html` melalui browser Chrome, Edge atau Firefox. Semua file JS dan CSS disimpan lokal.
3. Jika pembatasan browser mencegah penyimpanan pada halaman `file://`, jalankan server lokal opsional tanpa instalasi library: di folder proyek jalankan `python -m http.server 8000`, lalu buka `http://localhost:8000/`.
4. Pilih akun peran demo dari halaman login. **Tidak ada password** karena ini demonstrasi, bukan sistem produksi.
5. Jika ingin seluruh aplikasi dalam satu file, gunakan versi lain yang juga disediakan: `Prototype_Zakat_Annur_Standalone.html`.

**Jangan memasukkan data pribadi, NIK, nomor rekening, atau informasi pembayaran asli. Semua data disimpan di browser yang digunakan.**

## Struktur folder

```
Prototype_Zakat_Annur_Vanilla/
├── index.html            # Entry point
├── css/style.css         # Styling responsif + light/dark
├── js/app.js             # Data simulasi, router, UI, aturan demo, event handlers
├── js/qrcode.js          # Mesin QR offline, lisensi sumber dicatat
├── assets/               # Screenshot hasil uji
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

Data demo persisten pada `localStorage` dengan key `azis_demo_database_v3`; session pada browser storage. Log aktivitas dapat dilihat pada menu Audit & Arsip. Menu **Reset data demo** mengembalikan contoh awal. Menghapus data browser juga dapat menghapus semua transaksi demo.

## Uji coba

File `docs/SKENARIO_UAT.md` menjelaskan urutan simulasi. Pengujian otomatis headless meliputi render setiap role, pembuatan transaksi, verifikasi setoran berselisih, approval alokasi, penyaluran, portal publik; QR telah didekode dengan pustaka OpenCV pada screenshot untuk memeriksa bahwa QR membawa token teks yang benar.

## Dasar kebutuhan

Diturunkan dari naskah analisis proses berjalan, tiga rangkaian wawancara panitia (22 Feb, 18 Apr, 23 Apr 2026), observasi workbook zakat, daftar user requirements, serta pembagian modul FR/NFR yang sebelumnya disusun. Ketika sumber bertentangan, penggunaan rumus belum disahkan diberi label *simulasi* dan tidak diimplementasikan sebagai keputusan syariah otomatis.
