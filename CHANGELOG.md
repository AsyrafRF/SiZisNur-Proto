## 17 November 2026 — Penyelarasan status transaksi

- Menghapus value **Tercatat** dari filter status grafik dashboard. Filter yang tetap tersedia adalah **Terverifikasi** dan **Tersalurkan**.
- Menyelaraskan alur status transaksi dengan workflow V5: `Pending` → `Paid` (disahkan Amil) → `Disetor` → `Terverifikasi` setelah rekonsiliasi Bendahara. Status terminal seperti `batal`, `expired`, dan `ditolak` tetap dipertahankan.
- Data lama yang masih menyimpan status transaksi `tercatat` dimigrasikan ke `pending`, lalu mengikuti masa berlaku QR 24 jam yang sudah digunakan workflow V5; record tetap disimpan dan QR lama tidak diaktifkan kembali.
- Backup lama juga dinormalisasi ketika diimpor agar value status yang sudah tidak digunakan tidak masuk kembali ke sistem.
- Memperbarui dokumentasi, pengujian migrasi/status grafik, dan build HTML standalone. Cache service worker dinaikkan agar browser mengambil kode terbaru.

## 15 November 2026 — Perbaikan ukuran halaman dan pratinjau thermal 80 mm di Edge

- Memindahkan stylesheet thermal dan aturan `@page` ke dalam `<head>` jendela cetak khusus; sebelumnya aturan ukuran halaman disisipkan dari fragmen body dan berpotensi diabaikan browser.
- Mengganti deklarasi ukuran halaman yang sebelumnya tidak valid (`80mm auto`) menjadi `size: auto` di `@page`; media roll 80 mm dipilih dari driver printer. Nilai tunggal `80mm` tidak digunakan karena CSS mendefinisikannya sebagai halaman persegi.
- Membuat jendela pratinjau thermal selebar 460 px, memusatkan konten roll 74 mm, dan menambahkan tombol Cetak struk yang tidak ikut tercetak.
- Menyesuaikan ukuran huruf metadata/rincian/total agar lebih terbaca serta mengatur QR menjadi 28 mm.
- Cetak thermal tidak lagi melewati stylesheet umum `printWindow` yang menetapkan halaman otomatis/A4; jalur PDF biasa tetap menggunakan renderer dan layout dokumen normal.
- Memperbarui tes struk untuk memeriksa aturan halaman di `<head>`, pratinjau roll, toolbar layar yang tersembunyi saat cetak, QR, rincian multi-jenis, dan kompatibilitas PDF.
- Catatan penggunaan: di Microsoft Edge pilih printer thermal dan paper size 80 mm/80 mm roll, skala 100% atau Actual size, serta matikan header/footer. Dukungan ukuran media tetap bergantung pada driver printer.

## 15 November 2026 — Perapian Struk Thermal 80 mm Bergaya POS

- Mengganti tampilan cetak thermal yang sebelumnya memakai kartu struk digital dengan layout satu kolom bergaya POS: tipografi monospace, header rata tengah, metadata label/nilai sejajar, rincian kategori/media ringkas, dan total uang/beras rata kanan.
- Menambahkan pemisah ASCII, jarak vertikal yang lebih rapat, QR Code 30 mm, token QR yang dapat dibaca manual, serta footer simulasi yang lebih ringkas.
- Mempertahankan seluruh data transaksi dan aturan status yang sama dengan struk digital: nomor/ID, tanggal, Muzakki, sumber, status, batas QR, rincian multi-jenis/multi-media, dasar harta, total uang/beras, dan penonaktifan QR untuk transaksi batal/kedaluwarsa/ditolak.
- Format Cetak / Simpan PDF dan pratinjau digital tidak diubah. Thermal tetap menggunakan dialog cetak browser dengan CSS 80 mm; ini bergaya POS/ESC-POS, bukan pengiriman perintah ESC/POS mentah ke printer.
- Memperbarui `tests/receipt-printing.test.cjs` untuk menguji layout monospace, alignment metadata, separator ASCII, ukuran QR, rincian transaksi campuran, total, token dan disclaimer.

## 15 November 2026 — Penyatuan Modul Input Transaksi (Operator/Amil, Muzakki, dan Formulir Publik)

- Menyatukan pembangun form, parser rincian, kalkulasi, validasi, dialog konfirmasi kelebihan, model `lines`, dan renderer struk untuk ketiga kanal input: konter Operator/Amil, Layanan Mandiri Muzakki, dan Formulir Publik.
- Mendukung maksimal 12 rincian dalam satu transaksi/nomor/QR. Setiap baris memilih kategori dan media sendiri; Fitrah mendukung uang atau beras, sedangkan Maal, Profesi, Fidyah, Kafarat, dan Infak/Sedekah menggunakan uang pada aturan prototype saat ini. Kombinasi Fitrah uang + Fitrah beras + kategori lain dapat dibuat dalam satu transaksi.
- Menyamakan pemilihan domisili pada input Operator/Amil dan Formulir Publik: Warga daerah harus memilih RW lalu RT dari Master Wilayah Lembaga; Non-daerah tidak menyimpan RW/RT Lembaga.
- Menyamakan konfirmasi kelebihan pembayaran pada semua kanal. Jika pemisahan kelebihan belum dicentang dan baris Fitrah/Maal/Profesi melebihi estimasi, dialog yang sama meminta keputusan sebelum transaksi disimpan.
- Memformat input Rupiah dengan titik ribuan (contoh `1.250.000`) dan beras memakai koma desimal (contoh `2,5 kg`). Nilai harta Maal/Profesi juga menggunakan formatter Rupiah.
- Menyamakan pratinjau dan struk cetak/PDF, PNG, serta thermal agar mencantumkan semua rincian jenis/media, kuantitas/satuan, dasar harta bila relevan, dan total uang/beras.
- Memperbarui panduan `docs/INPUT_TRANSAKSI_TERPADU.md`, README, dokumentasi Portal Publik, dan versi cache service worker.
- Memperluas pengujian untuk transaksi campuran Fitrah uang/beras, Maal dan Fidyah dalam satu nomor, pemisah ribuan Rupiah, domisili Master Wilayah, konfirmasi kelebihan, serta penggunaan renderer struk bersama.
- Batas: fitur tetap simulasi browser/localStorage; backend, validasi server, idempotensi atomik, OTP provider, serta sinkronisasi lintas perangkat diperlukan sebelum produksi.

## 15 November 2026 — Modul Input Transaksi Terpadu Multi-Jenis dan Multi-Media

- Menyatukan form input konter Operator/Amil, rencana transaksi akun Muzakki, dan formulir publik melalui satu kalkulator transaksi bersama.
- Satu transaksi kini dapat memuat beberapa baris jenis zakat/donasi dan media pembayaran secara bersamaan, termasuk Fitrah uang + Fitrah beras + Fidyah/Maal/Profesi/Infak dalam satu nomor transaksi, satu QR, dan satu struk; dibatasi maksimal 12 baris.
- Menghitung kewajiban dan pembayaran uang/beras secara terpisah, menjumlahkan jiwa Fitrah lintas media, menampilkan kuantitas/satuan pada rincian, serta menyegarkan nominal otomatis saat kategori atau media berubah.
- Menyamakan konfirmasi kelebihan pembayaran pada tiga kanal. Pengguna dapat mempertahankan kategori, memisahkan kelebihan menjadi Infak/Sedekah bila memenuhi aturan split, atau kembali mengedit.
- Menyamakan struk digital/cetak/PNG untuk semua kanal; satu QR mengacu pada seluruh rincian transaksi.
- Menegakkan domisili Warga daerah dengan pilihan RW dan RT dari Master Wilayah Lembaga; pilihan RT difilter oleh RW aktif. Non-daerah tidak diwajibkan mengisi RW/RT.
- Menampilkan nominal uang dengan titik pemisah ribuan sejak nilai awal maupun saat diketik; input kilogram tetap menggunakan koma desimal. Istilah teknis internal `tenant` tetap dipertahankan pada struktur data, tetapi label antarmuka menggunakan **Lembaga**.
- Menambahkan pengujian multi-baris, media campuran, modal Operator bersama, format Rupiah, filter RW/RT, Non-daerah, konfirmasi kelebihan, dan struk publik bersama.
- Batas: data tetap lokal pada prototype; backend, sinkronisasi lintas perangkat, dan otorisasi produksi belum tersedia.
- Dokumentasi: `docs/TRANSAKSI_TERPADU_MULTI_JENIS.md`.

## 15 November 2026 — Bukti transaksi periode aktif dan pembatalan rencana oleh Muzakki

- Mengaktifkan tombol **Lihat bukti / QR** pada kolom Bukti di tabel transaksi periode berjalan pada Dashboard Zakat Saya. Tombol membuka kembali struk transaksi yang sama dengan layar setelah pembuatan rencana, termasuk QR serta opsi unduh PNG, cetak/simpan PDF, dan cetak thermal.
- Akses bukti tetap dibatasi pada transaksi pribadi yang terkait akun atau membership Muzakki.
- Menambahkan opsi **Batalkan** untuk transaksi mandiri berstatus `pending` selama belum diverifikasi/dikonfirmasi Amil, belum berstatus `paid`, belum ditugaskan ke petugas, belum memiliki shift, dan belum tertaut berita acara setoran.
- Pembatalan meminta alasan dan konfirmasi eksplisit. Sistem mengubah status menjadi `batal` tanpa menghapus record, menyimpan waktu/pelaku/alasan, mencatat audit, serta menambahkan event sinkronisasi lokal.
- Transaksi batal/kedaluwarsa tetap terlihat pada bagian **Transaksi tidak aktif periode ini**, tidak dihitung sebagai penerimaan, dan QR ditandai tidak aktif. Struk transaksi batal/kedaluwarsa menampilkan catatan status tanpa memperlihatkan token QR yang sudah tidak berlaku.
- Transaksi `paid`, `disetor`, `kas_diterima`, `terverifikasi`, transaksi konter, dan transaksi yang sudah masuk shift/berita acara tidak dapat dibatalkan oleh Muzakki.
- Memperluas `tests/muzakki-dashboard.test.cjs` untuk memeriksa akses bukti saat ini, pemulihan QR, pembatalan dengan alasan dan jejak audit, penyimpanan record batal, serta penolakan pembatalan bagi transaksi yang sudah diproses.
- Seluruh suite tes otomatis dan pemeriksaan sintaks JavaScript lulus; HTML standalone dibangun ulang.

## 15 November 2026 — Pemisahan Registrasi Akun dan Keanggotaan Lembaga Muzakki

- Form pendaftaran mandiri Muzakki kini hanya meminta nama lengkap, nomor HP, email, dan alamat lengkap; tidak ada pilihan lembaga atau isian domisili RW/RT pada tahap ini.
- Registrasi membuat akun pribadi tanpa `tenantId`, data person, kartu Muzakki, atau membership lembaga.
- Setelah login, Muzakki memilih lembaga aktif melalui menu Layanan Mandiri. Status domisili, RW/RT, alamat untuk lembaga, dan persetujuan penggunaan data diminta pada tahap penghubungan.
- Data person, kartu Muzakki, dan `muzakkiMemberships` baru dibuat setelah lembaga dipilih. Pencocokan nomor HP/email tidak otomatis mengklaim data walk-in yang belum diverifikasi.
- Menambahkan `tests/muzakki-registration.test.cjs` untuk menguji pemisahan tahap registrasi dan penghubungan lembaga.

## 14 November 2026 — Penyelarasan Istilah Antarmuka

- Mengganti istilah antarmuka dan dokumentasi dari “tenant” menjadi “Lembaga” agar lebih akrab bagi pengurus masjid, UPZ, dan komunitas.
- Menyelaraskan label pada konsol Admin SiZisNur, workspace lembaga, pendaftaran, Portal Publik, verifikasi QR, petunjuk penggunaan, dan pesan validasi.
- Mempertahankan nama teknis internal seperti `tenantId`, `db.tenants`, dan identitas QR agar kompatibel dengan struktur data dan integrasi prototype yang sudah ada.

## 14 November 2026 — Portal Publik Multi-Lembaga dan Scan QR Publik

- Mengganti portal khusus Masjid An-Nur menjadi direktori seluruh lembaga aktif yang diizinkan tampil pada portal publik.
- Menambahkan ringkasan transparansi agregat global dan per lembaga: penghimpunan uang/beras, transaksi yang disahkan, rincian kategori agregat, serta realisasi penyaluran.
- Membatasi portal agar tidak menampilkan nama Muzakki, Mustahik, kontak, alamat rumah, akun, petugas, atau nominal transaksi perorangan.
- Menambahkan kontrol `publicPortalEnabled` pada detail lembaga di konsol Admin SiZisNur; lembaga aktif baru tampil secara default, sedangkan lembaga ditangguhkan atau disembunyikan tidak ditampilkan.
- Menambahkan verifikasi QR lintas lembaga berdasarkan kecocokan `tenantId + transactionId + serial`, dukungan input manual, dan penanganan serial ambigu.
- Menambahkan status publik: valid setelah disahkan Amil, belum tervalidasi bila masih Pending/tercatat, dan tidak valid bila dibatalkan/ditolak/kedaluwarsa.
- Menambahkan scan QR kamera menggunakan `getUserMedia` dan `BarcodeDetector`; input manual tetap tersedia sebagai fallback untuk browser/perangkat yang belum mendukung API pemindai.
- Menambahkan dokumentasi `PORTAL_PUBLIK_TRANSPARANSI_DAN_QR.md`, checklist QA, dan `tests/public-portal.test.cjs`.
- Seluruh suite test otomatis lulus; pemeriksaan visual Chromium headless tidak dapat diselesaikan di lingkungan build ini.
- Batas: data tetap lokal browser; portal belum menjadi API publik cloud dan pemindaian kamera memerlukan HTTPS/localhost serta dukungan browser.

## 14 November 2026 — Admin SiZisNur (root/platform)

- Menambahkan aktor **Admin SiZisNur** dengan akun demo `root@sizisnur.demo`, terpisah dari koleksi akun pengguna lembaga.
- Menambahkan konsol root untuk ringkasan platform, lembaga terdaftar, pengajuan lembaga, akun lembaga, pengaturan sistem, audit platform, dan profil root.
- Menambahkan tindakan buat lembaga + Admin awal, ubah metadata, aktifkan/tangguhkan lembaga, tinjau pengajuan, dan aktifkan/nonaktifkan akun lembaga.
- Menambahkan pengaturan nama platform, email dukungan, buka/tutup pendaftaran lembaga, status default lembaga, pengumuman, dan mode pemeliharaan.
- Menutup jalur verifikasi lembaga publik lama; pengajuan baru masuk ke daftar tinjauan root.
- Memblokir workspace lembaga yang ditangguhkan atau saat mode pemeliharaan aktif.
- Menambahkan test integrasi untuk pemisahan akun root, pembuatan lembaga, audit, dan pembatasan akses.
- Batas: autentikasi root, RBAC, audit immutable, dan isolasi lembaga masih perlu ditegakkan pada backend sebelum produksi.

## 13 November 2026 — Dashboard pribadi Muzakki dan pemisahan dashboard panitia


- Menghapus akses role Muzakki ke dashboard agregat panitia. Dashboard ringkasan penerimaan, grafik kategori, Status Distribusi, transaksi terbaru, dan angka agregat hanya tersedia bagi anggota panitia zakat.
- Mengganti halaman awal Muzakki menjadi **Dashboard Zakat Saya** yang menampilkan status zakat periode aktif, total uang dan beras pribadi yang tercatat, jiwa/unit pada transaksi, rincian jenis zakat, dan status verifikasi Bendahara.
- Menambahkan riwayat transaksi pribadi lintas periode dan lembaga yang memang terhubung dengan membership akun tersebut. Transaksi dicocokkan lewat `accountId` atau pasangan `tenantId + personId`, bukan dengan seluruh transaksi lembaga.
- Menegaskan status personal: `Paid` berarti disahkan Amil; status Terverifikasi hanya ditampilkan bila transaksi tercantum pada berita acara setoran yang sudah berstatus `terverifikasi` setelah rekonsiliasi Bendahara.
- Memindahkan pengelolaan lembaga, profil, keluarga tanggungan, dan kalkulator ke bagian Layanan Mandiri yang dapat dibuka saat diperlukan agar fokus utama halaman adalah status zakat pribadi.
- Memperketat pembukaan/unduhan struk untuk role Muzakki agar hanya transaksi yang terhubung dengan akun atau membership pribadinya yang dapat diakses, termasuk riwayat lembaga lain yang terhubung.
- Mengarahkan sesi Muzakki yang masih menunjuk ke halaman dashboard lama ke Dashboard Zakat Saya.
- Menambahkan `tests/muzakki-dashboard.test.cjs` untuk pemeriksaan isolasi data, status berdasarkan berita acara, riwayat lintas periode, dan pemisahan akses role.

## 13 November 2026 — Dashboard penghimpunan, rekonsiliasi, dan penyaluran

- Mengembalikan ringkasan dashboard: total uang dan beras tercatat, total Muzakki aktif terdaftar, serta total jiwa dari Muzakki beserta tanggungan dalam transaksi.
- Mengganti metrik verifikasi Amil pada kartu dashboard dengan zakat tersalurkan yang menampilkan uang dan beras secara terpisah.
- Memulihkan panel Status Distribusi dan mempertahankan Transaksi Terbaru.
- Mengubah grafik kategori agar enam kategori ZIS selalu ditampilkan, dengan filter media Uang/Beras dan filter status Terverifikasi/Tersalurkan.
- Menegaskan perbedaan status: Paid adalah pembayaran yang disahkan Amil; Terverifikasi hanya berasal dari berita acara setoran yang statusnya Terverifikasi setelah pencocokan kas fisik dan rekening/logistik oleh Bendahara.
- Grafik Tersalurkan hanya memetakan kategori bila rincian kategori lengkap dan cocok dengan total uang/beras distribusi. Distribusi lama atau rincian tidak lengkap masuk ke label Belum dipetakan; tidak ada pembagian berdasarkan asumsi.
- Mengganti alur dashboard generik menjadi langkah kerja sesuai role aktif: Admin, Muzakki, Operator, Amil, Bendahara, Relawan, atau Pengurus.
- Menambahkan `tests/dashboard-analytics.test.cjs` untuk memeriksa sumber grafik, ringkasan, distribusi belum dipetakan, dan alur per role.

## 13 November 2026 — Perapian status Dashboard

- Mengelompokkan status role, koneksi, mode penyimpanan/sinkronisasi, dan jumlah antrean lokal pada panel khusus di sisi kanan kartu hero Dashboard.
- Memisahkan label Online/Offline dari keterangan mode lokal/server agar informasi tidak saling menempel atau bertumpuk.
- Menampilkan indikator koneksi visual dengan pembaruan status real-time saat browser menerima event online/offline.
- Menghitung antrean untuk lembaga yang sedang aktif dan memperbarui angka setelah event sinkronisasi ditambahkan atau diakui server.
- Menambahkan tata letak responsif untuk desktop, tablet, dan ponsel serta status aksesibel melalui `aria-live`.
- Menambahkan `tests/dashboard-status.test.cjs`; seluruh suite pengujian lulus dan HTML standalone dibangun ulang.

## 13 November 2026 — Paginasi data 10 baris per halaman

- Menambahkan paginasi terpusat pada seluruh tabel yang memakai helper `table()` / `A.table()`.
- Daftar dengan lebih dari 10 data ditampilkan 10 baris per halaman, lengkap dengan rentang data, jumlah total, nomor halaman, serta tombol Sebelumnya dan Selanjutnya.
- Tabel dengan 10 data atau kurang tetap ditampilkan utuh tanpa kontrol paginasi.
- Kontrol halaman memperbarui tabel yang dipilih saja dan mengikuti Light/Dark Mode serta tampilan mobile.
- Paginasi berlaku juga untuk tabel dalam modal, hasil pencarian dan filter, termasuk daftar lembaga yang terhubung pada akun Muzakki. Data sumber dan ekspor CSV/XLSX tetap menggunakan seluruh record.
- Riwayat audit tidak lagi dibatasi 100 atau 150 record sebelum ditampilkan.
- Cetak/PDF laporan dibangun dari seluruh hasil filter aktif, bukan hanya baris yang sedang terlihat di halaman tabel.
- Menambahkan `docs/PAGINASI_DATA.md` dan `tests/pagination.test.cjs`, serta memperbarui cache service worker.

## 13 November 2026 — Penyelarasan UI global Light/Dark Mode

- Memperluas perbaikan dari alert ke komponen UI lain yang sebelumnya masih memakai warna tetap Light Mode.
- Menyesuaikan badge status, label dan kontrol formulir, placeholder, tombol berbahaya, indikator progres, serta panel pemindaian QR Amil dan Relawan.
- Memisahkan token warna aksen untuk teks dari warna tombol/latar sehingga tautan, tab aktif, dan aksen panduan tetap terbaca pada latar gelap.
- Memperbaiki ilustrasi contoh menu dan panel hasil yang diharapkan pada seluruh panduan role.
- Mempertahankan preview struk sebagai dokumen putih untuk cetak dan mempertahankan landing page sesuai desain yang telah disetujui.
- Menambahkan `docs/TEMA_DARK_MODE.md` dan `tests/dark-ui-theme.test.cjs`.
- Memperbarui cache service worker agar stylesheet baru dimuat sesudah deployment.

# Changelog SiZisNur

## 14 November 2026 — Pengaturan Prototype dan perapian dataset bawaan

- Menambahkan tab **Pengaturan Prototype** khusus Admin SiZisNur pada konsol root.
- Menyediakan ekspor cadangan JSON lengkap, impor dengan validasi schema V5 dan konfirmasi, reset ke seed terbaru, hapus semua data simulasi, pemeriksaan integritas relasi dasar, pengaturan tema, dan keluar dari sesi root.
- Reset/hapus data memerlukan frasa konfirmasi; penghapusan total mempertahankan satu akun Admin SiZisNur dan pengaturan platform default agar konsol dapat digunakan kembali.
- Import menormalkan koleksi opsional, memastikan akun root aktif dan tetap berada pada `platformAdmins`, serta tidak mengizinkan root masuk ke koleksi `users` lembaga.
- Kegagalan penyimpanan lokal memicu rollback objek database sebelumnya, bukan membiarkannya dalam kondisi setengah terganti.
- Merapikan label akun pendataan dan dataset akun contoh non-Mustahik. Array `mustahiks` tidak diubah; mutasi startup yang menghapus kolom RT Mustahik juga sudah dihilangkan.
- Reset mengembalikan seed Mustahik yang ada pada project; hapus semua data mengosongkan Mustahik dan impor mengikuti file cadangan.
- Menambahkan `docs/PENGATURAN_PROTOTYPE.md` serta `tests/prototype-settings.test.cjs` untuk menguji ekspor/impor, reset, hapus data, akses root, dan baseline dataset Mustahik.
- Menambahkan styling responsif halaman pengaturan dan memperbarui cache service worker.


## 13 November 2026 — Penyesuaian alert untuk dark mode seluruh halaman

- Menyatukan palet alert semantik untuk pesan umum, peringatan, kesalahan, keberhasilan, informasi, dan catatan netral melalui token warna global.
- Menetapkan warna teks eksplisit pada setiap alert agar tidak mewarisi teks putih dari `body.dark` saat latarnya tetap berwarna terang.
- Menyediakan pasangan latar, teks, dan border yang sesuai untuk light mode maupun dark mode. Perubahan berlaku pada halaman dashboard, form, modal, panduan role, laporan, halaman prototype, dan komponen alert lain yang memakai class `.alert`.
- Menyamakan toast/notifikasi sementara agar varian success, info, warning, dan error tetap memiliki kontras yang jelas pada kedua tema.
- Memperbarui nama cache service worker supaya browser mengambil stylesheet terbaru setelah deployment.
- Menambahkan pemeriksaan otomatis kontras warna minimum WCAG AA untuk pasangan warna teks/latar alert dan toast.


## 13 November 2026 — Panduan penggunaan rinci untuk tujuh role

- Memperluas panduan Admin, Muzakki, Operator, Amil, Bendahara, Relawan, dan Pengurus mengikuti pola tutorial langkah demi langkah dari referensi SILAM.
- Mempertahankan diagram alur dan formulir bantuan/feedback yang sudah ada.
- Menambahkan checklist persiapan, 61 tutorial menu, 311 langkah bernomor, 61 ilustrasi pengenal tampilan, hasil yang diharapkan, peringatan, FAQ, serta navigasi cepat ke setiap menu.
- Menyelaraskan panduan dengan menu dan kewenangan yang benar-benar tersedia pada prototype, termasuk penjelasan batas role dan fitur simulasi.
- Menambahkan `docs/PANDUAN_PENGGUNAAN_DETAIL_ROLE.md` dan tes otomatis `tests/role-guides.test.cjs`.
- Tidak mengubah visual landing page yang sudah disetujui.

## 13 November 2026 — Penyesuaian copywriting landing page

- Mengembalikan komposisi visual landing page yang digunakan pada V3: navigasi, hero dengan ilustrasi dashboard, floating labels, strip ringkasan, tiga kartu manfaat, enam kartu fitur, diagram alur, visual tujuh aktor, ilustrasi multi-lembaga, CTA dan footer.
- Memperbarui copywriting agar berfokus pada layanan mandiri Muzakki, QR transaksi dan verifikasi Amil, rekonsiliasi Bendahara, distribusi per batch, laporan, dan pemisahan tugas tujuh aktor.
- Tidak mengubah stylesheet atau sistem desain visual landing page.
- Memperbarui title dan meta description halaman.

## 13 November 2026 — Revisi Actor 7 Peran (lapisan V5)

Pembaruan dilakukan dengan mempertahankan acuan workbook 1447H/2026M dan data mustahik sintetis.

### Actor dan transaksi

- Mengganti matriks role menjadi Admin, Muzakki, Operator, Amil, Bendahara, Relawan dan Pengurus.
- Menambahkan self-service Muzakki dengan keanggotaan multi-lembaga, data keluarga, kalkulator, riwayat dan satu transaksi aktif per lembaga/periode. Pemeriksaan juga mempertimbangkan identitas orang pada transaksi Walk-in yang belum tertaut akun.
- Menambahkan transaksi Pending untuk jalur mandiri dan Walk-in, QR lembaga-bound dan masa berlaku 24 jam atau sampai periode ditutup.
- Memisahkan fungsi Operator dari penerimaan uang dan verifikasi. Amil dapat memakai fungsi input konter, tetapi Operator tidak dapat memakai fungsi Amil.
- Menambahkan shift Amil, pemindaian QR, ringkasan akad, validasi pembayaran dan bukti setor zakat.

### Kas, koreksi dan distribusi

- Menambahkan berita acara serah terima setelah shift ditutup dan rekonsiliasi dua tahap untuk uang/beras fisik serta rekening/logistik.
- Menambahkan koreksi terkendali yang tidak menimpa transaksi asal, keputusan Bendahara dan jurnal penyesuaian uang/beras.
- Menambahkan jurnal IDR/kg, neraca ringkas, perubahan dana, alokasi fleksibel sebagai draf, persetujuan Pengurus dan distribusi per batch.
- Menambahkan tampilan Relawan mobile-first dengan QR/kode, pembatasan batch tugas dan pencegahan distribusi ganda.
- Memperluas akses baca Pengurus ke transaksi, serah terima, jurnal, koreksi dan audit. Pengurus tetap tidak mengubah data operasional.

### Pengalaman, laporan dan kesiapan rilis

- Memperbarui landing page agar berfokus pada fitur, alur fast-track dan tujuh peran.
- Menambahkan label Daerah dan RT bersyarat, notifikasi lokal, panduan role dengan diagram, panduan akad Amil serta support/feedback.
- Menambahkan grafik dan filter dashboard, ekspor CSV/XLSX, cetak PDF, paket laporan UPZ dan pemformatan Rupiah/kg.
- Menambahkan cache shell PWA dan antrean sinkronisasi lokal dengan adapter API opsional. Event hanya dihapus dari antrean setelah server mengirim acknowledgement untuk ID event yang benar-benar diterima. Backend belum disertakan.
- Menambahkan rantai audit SHA-256 untuk pemeriksaan perubahan data lokal.
- Menambahkan halaman evaluasi keputusan stakeholder, matriks keterlacakan revisi dan checklist hukum, privasi serta keamanan.

### Batas yang diketahui

Login, peran, database, notifikasi, audit dan antrean sync masih simulasi browser. Tidak ada backend, OTP/MFA, isolasi lembaga server, integrasi email/WhatsApp, bank feed, sinkronisasi cloud aktif atau integrasi resmi BAZNAS. Alokasi fleksibel memakai asumsi pembagian rata dan harus disahkan stakeholder. Lihat `docs/CAKUPAN_FITUR.md` serta `docs/LEGAL_READINESS.md`.

## 4 November 2026 — Workbook 1447H/2026M

- Menghubungkan prototype dengan workbook resmi tervalidasi Ramadan 1447H/2026M.
- Menambahkan menu **Acuan Workbook 1447H** berisi angka agregat, rekonsiliasi, alokasi, insentif, shift, divisi panitia, dan temuan audit.
- Mengganti penilaian mustahik menjadi formula lima faktor workbook, jalur F/M, jalur Mualaf, dan final status R; menandai konflik cache/formula pada row 16.
- Menambahkan pilihan input yang mengikuti nilai sumber, termasuk `NON RW 10`, pilihan RT, kategori penghasilan, serta teks `4 ATAU LEBIH`.
- Menambahkan preview skor langsung pada form survei mustahik.
- Menambahkan alokasi Tahap 1 dan Tahap 2 dengan nominal uang dan paket beras per asnaf sesuai workbook.
- Menyimpan saldo tahap 2 Rp37.500 dan 13,04 paket sebagai saldo agregat; belum dibagikan per penerima. Ledger rencana workbook dipisahkan dari saldo transaksi demo, dan penerima yang sudah direncanakan dicadangkan dari alokasi fleksibel.
- Mengganti halaman insentif menjadi dua perhitungan workbook Q/R dengan label amil anonim; hubungan kedua metode belum diputuskan.
- Mengatur periode aktif demo menjadi 1447H/2026M; periode 1448H tetap draf contoh.
- Mengisolasi database V3 pada `sizisnur_demo_database_v4`; data V2 tidak dimigrasikan.

### Perlindungan data dan validasi workbook

Tidak ada nama, NIK, nomor HP, alamat, atau catatan survei warga dari workbook yang disalin. Dataset 129 mustahik dibuat sintetis untuk menguji komposisi agregat 21 Fakir, 103 Miskin, dan 5 Mualaf. Nama amil diganti kode anonim. Pengujian formula, hak akses, alokasi dan integritas audit dijelaskan pada `docs/QA_HASIL_PENGUJIAN.md`.


## 14 November 2026 — Perbaikan freeze pada Pengaturan Prototype

- Menghapus `MutationObserver` yang mengawasi seluruh subtree `#app` dan mengganti `innerHTML` dari callback-nya; pola ini dapat memicu siklus mutasi/render berulang pada browser.
- Mendaftarkan **Pengaturan Prototype** sebagai tab native pada konsol Admin SiZisNur dan merender konten langsung melalui `rootContent()`.
- Menghilangkan dekorasi DOM dan observer tambahan dari modul pengaturan agar navigasi masuk/keluar tab tidak menginisiasi render ulang tak berujung.
- Mengoptimalkan informasi ukuran data dengan membaca panjang JSON yang sudah tersimpan, bukan menserialisasi ulang seluruh database pada setiap render halaman.
- Memperbarui nama cache service worker agar deployment menggunakan berkas aplikasi terbaru.
- Menambahkan pengujian navigasi tab root langsung serta pemeriksaan statis agar observer rekursif tidak kembali.
- Seluruh 13 suite pengujian otomatis lulus. Chromium headless dicoba, tetapi proses browser pada lingkungan build tidak menyelesaikan `--dump-dom`; karena itu pengujian visual browser tidak diklaim berhasil.


## Navigasi akun Muzakki: pemisahan halaman mandiri dan rencana bayar (15 November 2026)

- Menu **Dashboard Zakat Saya** dipertahankan sebagai halaman ringkasan pribadi, termasuk status zakat periode aktif, rincian zakat, transaksi periode berjalan, dan riwayat sebelumnya. Panel dropdown layanan mandiri dihapus dari halaman dashboard.
- Konten **Profil, Keluarga, dan Kalkulator Zakat** dipindahkan ke halaman/menu **Layanan Mandiri** tersendiri. Pada halaman ini Muzakki mengelola daftar lembaga yang terhubung, profil dan wilayah alamat pada lembaga aktif, data keluarga tanggungan, serta kalkulator zakat.
- Ditambahkan halaman/menu **Rencana Bayar Zakat**. Halaman ini menunjukkan lembaga dan periode aktif, status rencana/transaksi, langkah pembayaran, serta tombol untuk membuka formulir perencanaan transaksi yang sudah ada. Pembuatan QR, status Pending, validasi akun/keanggotaan/periode, dan pemeriksaan Amil tetap memakai alur transaksi lama.
- Untuk akun yang belum terhubung ke lembaga, halaman Layanan Mandiri mengarahkan Muzakki memilih lembaga; halaman Rencana Bayar menjelaskan bahwa keanggotaan dan periode aktif diperlukan sebelum membuat rencana.
- Navigasi sidebar untuk role Muzakki menggunakan kelompok **Menu Akun Muzakki** dan hanya menampilkan halaman yang sesuai; kedua halaman baru dibatasi pada role Muzakki.
- Uji regresi khusus memastikan menu baru muncul untuk Muzakki, dropdown tidak lagi ada di Dashboard, formulir layanan tersedia di halaman terpisah, rencana bayar membuka alur QR yang sama, dan role selain Muzakki tidak memperoleh akses.


## Perbaikan cetak thermal 80 mm (15 November 2026)

- Memulihkan helper `makeReceiptPrint` yang tertinggal setelah penyatuan renderer bukti transaksi. Tombol Cetak thermal 80 mm sebelumnya masih memanggil nama fungsi lama yang sudah tidak didefinisikan sehingga memunculkan `makeReceiptPrint is not defined`.
- Cetak thermal sekarang menggunakan HTML struk bersama yang juga dipakai oleh Cetak / Simpan PDF, dengan layout kertas 80 mm, area konten 74 mm, QR, seluruh rincian multi-jenis/multi-media, total uang dan beras, serta label simulasi.
- Layout PDF biasa tidak berubah dan tetap menggunakan ukuran halaman normal browser.
- Menambahkan pengujian regresi untuk aksi thermal dan PDF menggunakan transaksi gabungan Fitrah uang, Fitrah beras, dan Fidyah.
- Menaikkan versi cache service worker agar browser mengambil modul revisi terbaru setelah pembaruan.
