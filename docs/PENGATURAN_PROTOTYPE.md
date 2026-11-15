# Pengaturan Prototype SiZisNur

Halaman ini tersedia pada konsol **Admin SiZisNur** melalui tab **Pengaturan Prototype**. Halaman ditujukan untuk menyiapkan demonstrasi, UAT, dan pertukaran skenario antar-browser. Ini bukan panel administrasi basis data produksi.

## Cara membuka

1. Jalankan `index.html` melalui browser modern atau server lokal (`python -m http.server 8000`).
2. Dari halaman pilihan akses, buka **Akses Demo Langsung** lalu pilih **Admin SiZisNur** (`root@sizisnur.demo`).
3. Buka tab **Pengaturan Prototype** pada konsol root.

Halaman login simulasi terpisah dari akses demo langsung. Akun seed menggunakan password demo yang didokumentasikan pada `docs/LOGIN_REGISTER_DAN_AKSES_DEMO.md`. Password di-hash PBKDF2 di browser, tetapi localStorage dan sesi tetap dapat dimodifikasi pengguna perangkat; ini bukan autentikasi produksi.

## Tindakan yang tersedia

| Tindakan | Dampak |
|---|---|
| **Ekspor cadangan lengkap** | Mengunduh seluruh database browser dalam satu file JSON, termasuk Lembaga, pengguna, tarif, transaksi, setoran, Mustahik, relasi keluarga, distribusi, pengaturan platform, dan audit. |
| **Impor cadangan** | Memvalidasi format JSON, schema V5, koleksi wajib, dan ID Lembaga sebelum menampilkan konfirmasi. Setelah disetujui, database lokal diganti dengan isi file. |
| **Reset ke dataset default / Kembali ke data default** | Mengembalikan **Dataset Masjid An-Nur**: satu lembaga Masjid An-Nur, data operasional contoh, tarif, periode, jadwal, struktur wilayah RW/RT, dan acuan workbook 1447H. Akun root dan kredensial root yang sedang dipakai tetap dipertahankan; akun demo lainnya dibuat kembali dari dataset. |
| **Hapus semua data simulasi** | Mengosongkan seluruh data simulasi: Lembaga, akun Panitia dan Muzakki, person, membership, transaksi, Mustahik, tarif, setoran, alokasi, penyaluran, notifikasi, master wilayah, serta audit. **Hanya satu akun Admin SiZisNur (Root) yang tersisa**, termasuk password/hash root yang sedang dipakai. Pengaturan teknis platform dan struktur aplikasi tetap ada agar fitur tidak ikut terhapus. |
| **Dataset Multi-Lembaga** | Mengganti data lokal dengan dua masjid contoh, **Masjid An-Nur** dan **Masjid Al-Hikmah**, beserta satu pengajuan **Masjid Al-Falah** dengan status menunggu. Data acuan workbook dan 129 Mustahik tetap terikat ke An-Nur; dataset ini dipakai untuk uji isolasi multi-tenant. |
| **Dataset Masjid An-Nur** | Mengganti data lokal dengan satu lembaga, **Masjid An-Nur**, berisi data operasional demo, 129 record Mustahik sintetis, dan modul/keterangan acuan workbook 1447H/2026M. Ini adalah dataset default saat instalasi maupun ketika reset default dipilih. |
| **Pemeriksaan integritas** | Menghitung sejumlah relasi orphan dasar untuk pengguna, periode, transaksi, Mustahik, orang, dan penyaluran. Ini bukan audit akuntansi atau pemeriksaan keamanan. |
| **Kembalikan tema terang / Keluar** | Menghapus preferensi tema lokal atau mengakhiri sesi root yang sedang aktif. |

Reset dan hapus data memerlukan frasa konfirmasi `RESET DEFAULT` atau `HAPUS SEMUA`. Pergantian ke preset Multi-Lembaga atau Masjid An-Nur memerlukan frasa `GANTI DATASET`. Selalu ekspor cadangan sebelum tindakan yang mengganti atau menghapus data yang masih diperlukan.


## Perilaku setelah hapus data dan pembuatan lembaga baru

- Setelah **Hapus semua data simulasi**, koleksi pengguna lembaga kosong. Tidak ada akun Relawan, Muzakki, Admin lembaga, atau akun demo lain yang dibuat ulang otomatis saat browser dimuat ulang. Satu-satunya akun yang dipertahankan adalah Admin SiZisNur (Root).
- Penghapusan tidak menghapus kode aplikasi, matriks hak akses, komponen Master Wilayah, konfigurasi form, ataupun fungsi halaman. Jika belum ada lembaga, halaman Muzakki menampilkan pesan **“Belum ada Lembaga yang terdaftar”** dan menjelaskan bahwa akun tetap aktif tetapi perlu menunggu lembaga dibuat/disetujui. Fitur memilih lembaga, profil keanggotaan, keluarga, kalkulator, dan rencana bayar baru aktif sesuai prasyarat setelah lembaga tersedia.
- Ketika Root membuat lembaga baru atau menyetujui pengajuan lembaga, sistem otomatis membuat satu record induk **Daerah** untuk tenant baru. RW dan RT sengaja belum diisi; Admin lembaga mengaturnya melalui **Profil Lembaga → Master wilayah administratif**. Dengan demikian reset tidak menghilangkan fitur, tetapi hanya menghapus record data wilayah lama.
- Master wilayah seed An-Nur berisi Perumahan Villa Pesona Asri, RW 11, RT 01–06. Pada preset Multi-Lembaga, Al-Hikmah juga memiliki Kompleks Buana Citra, RW 1 (RT 01–10) dan RW 2 (RT 01–05). Tenant lain memulai dari Daerah induk dan mengatur RW/RT sendiri.

## Dataset dan hak akses role

- **Dataset Masjid An-Nur** adalah default. Dataset ini hanya memiliki satu tenant dan satu set operasional An-Nur. Angka, rumus, saldo, catatan anomali, dan penjelasan workbook 1447H/2026M tetap dijelaskan pada `docs/IMPLEMENTASI_WORKBOOK_1447H.md` dan modul Acuan Workbook.
- **Dataset Multi-Lembaga** menambahkan Al-Hikmah dan pengajuan Al-Falah untuk uji multi-tenant. Data workbook dan 129 record Mustahik sintetis tetap berada di tenant An-Nur, bukan disalin ke Al-Hikmah.
- Menu Admin lembaga mencakup profil lembaga, akun & peran, periode, penjadwalan Amil, tarif, data Mustahik/kelayakan, notifikasi dan audit. Admin dapat membuat/mengubah jadwal, sedangkan Amil melihat jadwal dan menjalankan shift/verifikasi. Menu Operator (input konter), Bendahara (setoran/jurnal/alokasi/rekonsiliasi), Relawan (batch penyaluran), serta Pengurus (persetujuan/laporan baca) mengikuti kewenangan masing-masing dan tidak digabung ke akun Admin. Matriks izin V5 adalah sumber acuan tunggal.
- Pengujian `tests/dataset-role-reset.test.cjs` memeriksa reset, reload tanpa akun yatim, alert Muzakki saat tanpa lembaga, master wilayah tenant baru, preset, dan menu role pada kedua dataset.

## Format cadangan

Ekspor menghasilkan JSON dengan wrapper:

- `format`: `SIZISNUR-PROTOTYPE-BACKUP`
- `backupVersion`: `1`
- `appSchemaVersion`: `5`
- `exportedAt`: waktu ekspor ISO 8601
- `data`: objek database SiZisNur V5 secara lengkap

Impor juga menerima objek database V5 mentah untuk kebutuhan tooling lokal. File lebih besar dari 30 MB ditolak. Impor mengisi koleksi opsional yang belum ada, menormalkan pengaturan platform, dan memastikan akun root tetap berada di koleksi `platformAdmins` dengan `scope: platform`. Akun root tidak ditempatkan ke `users` milik Lembaga.

Berkas cadangan dapat memuat data pribadi simulasi dan seluruh dataset Mustahik. Lindungi file seperti data internal; jangan mengunggahnya ke penyimpanan publik atau membagikannya melalui kanal terbuka.

## Perlindungan dataset Mustahik

Pembaruan dataset akun contoh, Muzakki demo, pemohon, dan metadata Lembaga tidak mengubah array `mustahiks`. Reset memuat ulang array Mustahik dari seed project yang dipertahankan; ia tidak menghitung ulang skor, mengubah klasifikasi, menghapus kolom `rt`, atau mengganti record dengan data acak. Data identitas Mustahik terkait yang sudah ada di `persons` juga tidak diedit oleh pembaruan label akun contoh.

**Pembedaan sumber data:** dokumentasi workbook pada project ini menjelaskan bahwa 129 baris record Mustahik individual yang ada pada seed adalah data sintetis non-identifying untuk mereproduksi agregat workbook terverifikasi (21 Fakir, 103 Miskin, 5 Mualaf), bukan salinan identitas warga. Acuan workbook dan temuan formula tetap tersedia pada `docs/IMPLEMENTASI_WORKBOOK_1447H.md`. Tidak ada file workbook Excel yang disertakan di dalam ZIP project ini.

Penghapusan semua data akan mengosongkan koleksi Mustahik. Impor cadangan menggantinya sesuai isi file yang diimpor. Karena dua tindakan ini memang bersifat destruktif terhadap data Mustahik, tinjau konfirmasi dan pastikan cadangan tersedia sebelum melanjutkan.

## Penyimpanan dan batasan

- Data aktif disimpan pada `localStorage` browser dengan key `sizisnur_demo_database_v5`; sesi root pada session storage/local storage sesuai pilihan login.
- Ekspor/impor berguna untuk memindahkan simulasi antar-browser, tetapi tidak membuat sinkronisasi cloud.
- Kuota penyimpanan browser berbeda-beda. Jika penyimpanan menolak perubahan, modul mencoba memulihkan objek database sebelumnya dan menampilkan pesan kegagalan.
- Reset dan hapus data melakukan reload halaman agar lapisan migrasi V5 membentuk kembali koleksi tambahan yang diperlukan.
- Pengaturan ini hanya untuk prototype. Implementasi produksi memerlukan backup server, migrasi database terversi, audit yang tidak dapat diubah, otorisasi backend, dan pemulihan bencana yang teruji.


## Perbaikan respons halaman (14 November 2026)

Build sebelumnya memakai `MutationObserver` pada seluruh subtree `#app`, lalu mengganti kembali `innerHTML` dari callback observer untuk menyisipkan halaman Pengaturan Prototype. Pada browser yang terus mendeteksi perubahan DOM tersebut, callback dapat memicu perubahan baru berulang-ulang dan membuat tab Pengaturan Prototype tidak responsif. Versi perbaikan menghapus mekanisme observer/dekorasi DOM tersebut dan mendaftarkan Pengaturan Prototype sebagai tab native pada renderer konsol Admin SiZisNur. Pengukuran ukuran data juga membaca panjang JSON yang sudah tersimpan agar tidak melakukan serialisasi database penuh setiap kali halaman dirender.

Service worker diberi nama cache baru agar deployment berikutnya meminta shell aplikasi terbaru. Setelah memperbarui hosting, tutup tab aplikasi lama lalu buka ulang URL SiZisNur; pada instalasi PWA, pastikan service worker baru sudah aktif.
