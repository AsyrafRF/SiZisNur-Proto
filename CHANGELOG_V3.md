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
- Mengubah grafik kategori agar enam kategori ZIS selalu ditampilkan, dengan filter media Uang/Beras dan filter status Tercatat/Terverifikasi/Tersalurkan.
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
