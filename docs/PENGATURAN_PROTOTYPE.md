# Pengaturan Prototype SiZisNur

Halaman ini tersedia pada konsol **Admin SiZisNur** melalui tab **Pengaturan Prototype**. Halaman ditujukan untuk menyiapkan demonstrasi, UAT, dan pertukaran skenario antar-browser. Ini bukan panel administrasi basis data produksi.

## Cara membuka

1. Jalankan `index.html` melalui browser modern atau server lokal (`python -m http.server 8000`).
2. Masuk menggunakan aktor **Admin SiZisNur** (`root@sizisnur.demo`) pada layar login simulasi.
3. Buka tab **Pengaturan Prototype** pada konsol root.

Login prototype tidak memakai password. Identitas aktor dan pembatasan menu hanya simulasi browser, bukan pengamanan akun produksi.

## Tindakan yang tersedia

| Tindakan | Dampak |
|---|---|
| **Ekspor cadangan lengkap** | Mengunduh seluruh database browser dalam satu file JSON, termasuk Lembaga, pengguna, tarif, transaksi, setoran, Mustahik, relasi keluarga, distribusi, pengaturan platform, dan audit. |
| **Impor cadangan** | Memvalidasi format JSON, schema V5, koleksi wajib, dan ID Lembaga sebelum menampilkan konfirmasi. Setelah disetujui, database lokal diganti dengan isi file. |
| **Reset ke data bawaan** | Mengembalikan data ke seed SiZisNur saat ini. Akun contoh, Lembaga contoh, tarif, transaksi, dan konfigurasi dikembalikan. Mustahik kembali ke salinan seed yang disertakan pada project. |
| **Hapus semua data simulasi** | Mengosongkan seluruh koleksi operasional, termasuk Lembaga, pengguna lembaga, transaksi, Mustahik, tarif, setoran, alokasi, penyaluran, notifikasi, dan audit. Satu akun Admin SiZisNur dan pengaturan platform default tetap ada agar konsol masih dapat diakses. |
| **Pemeriksaan integritas** | Menghitung sejumlah relasi orphan dasar untuk pengguna, periode, transaksi, Mustahik, orang, dan penyaluran. Ini bukan audit akuntansi atau pemeriksaan keamanan. |
| **Kembalikan tema terang / Keluar** | Menghapus preferensi tema lokal atau mengakhiri sesi root yang sedang aktif. |

Reset dan hapus data memerlukan frasa konfirmasi `RESET DEFAULT` atau `HAPUS SEMUA`. Selalu ekspor cadangan sebelum tindakan yang mengganti atau menghapus data yang masih diperlukan.

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
