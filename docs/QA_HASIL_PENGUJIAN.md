# Hasil Pemeriksaan SiZisNur V5

Tanggal pembaruan: 15 November 2026

## Pemeriksaan statis

| Perintah | Hasil |
|---|---|
| `node --check js/app.js` | Lulus |
| `node --check js/revision-v5.js` | Lulus |
| `node --check js/authentication.js` | Lulus |
| `node --test tests/authentication.test.cjs` | Lulus — pilihan login terpisah, autentikasi per role, PBKDF2, registrasi Muzakki/lembaga, pembuatan Admin awal setelah persetujuan, dan penggantian password pertama |
| `for f in tests/*.test.cjs; do node "$f"; done` | Lulus — 16 suite, 16/16 |
| `node tests/workbook-rules.test.cjs` | Lulus |
| `node tests/dataset-role-reset.test.cjs` | Lulus — default An-Nur, preset multi-lembaga, hapus hanya menyisakan Root, tidak membuat ulang Relawan orphan, alert Muzakki tanpa lembaga, master wilayah tenant baru, dan menu role konsisten |
| `node tests/prototype-settings.test.cjs` | Lulus — reset, preset An-Nur/Multi, export/import, relasi akun Muzakki, Master Wilayah per preset, hapus data, dan kredensial root |
| `node tests/role-guides.test.cjs` | Lulus — 7 role, 62 tutorial menu, 319 langkah, 62 ilustrasi UI |
| `node tests/dark-alerts.test.cjs` | Lulus — semua varian alert/toast memenuhi rasio kontras minimal 4,5:1 pada tema terang dan gelap |
| `node tests/dark-ui-theme.test.cjs` | Lulus — badge status, panel hasil panduan, preview, aksen teks, label form, kontrol berbahaya, dan indikator langkah memenuhi token/kontras tema |
| `node tests/pagination.test.cjs` | Lulus — render 10 baris per halaman, navigasi dan batas halaman, tabel pendek/kosong, lembaga Muzakki, audit penuh, serta PDF laporan lengkap |
| `node tests/tenant-territories.test.cjs` | Lulus — master wilayah dan relasi Daerah/RW/RT terisolasi per lembaga |
| `node tests/muzakki-dashboard.test.cjs` | Lulus — dashboard personal Muzakki, status verifikasi dan histori lintas lembaga/periode |
| `node tests/muzakki-registration.test.cjs` | Lulus — registrasi empat data tanpa lembaga, akun tanpa person/kartu/membership, dan penghubungan dari dalam akun dengan persetujuan |
| `node tests/dashboard-analytics.test.cjs` | Lulus — agregasi grafik, filter status/media dan role tervalidasi |
| `node tests/dashboard-status.test.cjs` | Lulus — status koneksi, antrean lembaga dan role tervalidasi |
| `node tests/muzakki-dashboard.test.cjs` | Lulus — akses bukti periode aktif, pemulihan QR, pembatalan Pending yang memenuhi syarat, jejak audit, dan pembatasan setelah diproses Amil/panitia |
| `node tests/transaction-calculator.test.cjs` | Lulus — lima jenis kewajiban dan Infak/Sedekah, parameter per lembaga, alokasi kelebihan, dan aturan konfirmasi kafarat |
| `python tools/build-standalone.py` | Dijalankan setelah perubahan final dan menghasilkan file HTML mandiri |

## Cakupan yang diperiksa oleh test otomatis

- Schema demo V5 dan matriks akses tujuh role, diverifikasi pada dataset An-Nur dan Multi-Lembaga.
- Pilihan awal Login sebagai Muzakki atau Login sebagai Panitia; form email/password, pembatasan akun antar-role, dan halaman Akses Demo Langsung terpisah.
- Hash kredensial PBKDF2 browser-side, registrasi Muzakki tanpa lembaga, pengajuan lembaga tanpa membuat akun Panitia, pembuatan Admin awal setelah disetujui root, serta penggantian password sementara pada login pertama.
- Registrasi mandiri Muzakki hanya menyimpan nama lengkap, nomor HP, email, dan alamat; akun awal tidak diberi lembaga, person, kartu Muzakki, atau membership sampai pemilihan lembaga dari dalam akun.
- Halaman operasional yang dapat dirender per role dan halaman yang ditolak; Admin tidak melihat menu khusus Amil, Bendahara, Relawan, atau Pengurus.
- Panduan penggunaan untuk tujuh role, termasuk diagram alur, checklist awal, tutorial per menu, langkah bernomor, ilustrasi UI, FAQ, navigasi cepat, dan formulir feedback.
- Palet global alert dan toast pada light/dark mode, termasuk default, warning, danger, success, info, dan neutral, dengan rasio kontras minimum WCAG AA 4,5:1.
- Token tema UI global untuk badge status, label serta input form, aksi berbahaya, progres, panel pemindaian QR, preview panduan, panel hasil panduan, dan aksen teks pada dark mode.
- Hapus seluruh data yang hanya menyisakan Root, tidak membangkitkan ulang akun Relawan yatim setelah reload, alert pada halaman Muzakki ketika belum ada lembaga, dan pembuatan induk Master Wilayah untuk lembaga baru.
- Paginasi bersama pada seluruh tabel data, termasuk lembaga yang terhubung pada akun Muzakki: sepuluh baris per halaman, kontrol navigasi, batas halaman, tabel kosong, dan kompatibilitas daftar audit serta laporan.
- Dashboard Muzakki hanya menampilkan catatan milik akun sendiri, memisahkan status pengesahan Amil dari rekonsiliasi Bendahara, serta menampilkan riwayat sesuai membership lintas periode/lembaga. Akses dashboard agregat panitia ditolak.
- Tabel zakat periode berjalan menampilkan tombol pembukaan bukti/QR untuk setiap transaksi aktif. Pembatalan hanya tersedia bagi transaksi self-service Pending yang tidak mempunyai penanda Amil, Operator, shift, atau berita acara. Pembatalan menyimpan alasan, aktor, waktu, audit, dan status batal; QR record batal tidak lagi ditampilkan sebagai kode yang dapat dipindai.
- Hash SHA-256 yang sesuai vektor uji `abc` serta deteksi perubahan detail audit.
- Dataset Mustahik sintetis 129 data dan komposisi 21 Fakir, 103 Miskin, 5 Mualaf; preset An-Nur hanya satu lembaga dan preset multi-tenant menambahkan Al-Hikmah serta pengajuan Al-Falah.
- Formula skor, ambang klasifikasi, dan perbedaan cache/formula workbook row 16.
- Angka penerimaan workbook serta total alokasi Tahap 1 dan Tahap 2 sebesar Rp148.287.500 dan 1.882,6 kg.
- Batas persetujuan dan reservasi Mustahik pada alokasi.

## Batas hasil QA

Tes Node menggunakan mock browser dan tidak membuktikan kelayakan produksi. Pengujian manual end-to-end di browser nyata, kamera pada HTTPS, printer thermal, perangkat offline, integrasi API, aksesibilitas, pengujian beban, penetration test, backup/restore, serta UAT dengan stakeholder belum dilakukan.

Tidak ada backend atau endpoint sinkronisasi yang disertakan. Notifikasi email/WhatsApp dan koneksi BAZNAS masih simulasi/ekspor berkas. Hash audit pada localStorage bukan audit immutable. Jangan memasukkan data pribadi atau transaksi nyata.

Lihat `SKENARIO_UAT.md` untuk prosedur uji manual dan `CAKUPAN_FITUR.md` untuk pemetaan fitur serta batasannya.


## Pemeriksaan alert dan toast pada light/dark mode — 13 November 2026

- Alert global memiliki warna teks eksplisit dan pasangan warna latar/teks untuk varian default, warn, danger, ok/success, info, serta light/neutral.
- Toast memiliki palet terpisah untuk default, success, info, warning, dan error.
- Tes otomatis `node tests/dark-alerts.test.cjs` memeriksa keberadaan token warna kedua tema dan rasio kontras teks terhadap latar minimal 4,5:1 (WCAG AA) untuk semua varian yang diuji.
- Cakupan stylesheet global berlaku pada dashboard, form, modal, panduan role, laporan, halaman prototype, dan halaman lain yang menggunakan komponen `.alert` atau `.notice`.
- Nama cache service worker dinaikkan agar stylesheet baru diambil sesudah deployment.


## Pemeriksaan UI global pada light/dark mode — 13 November 2026

- Memisahkan aksen teks dari warna utama tombol/latar agar teks tautan, tab aktif, aksen panduan, dan indikator tidak menggunakan hijau gelap yang kehilangan kontras di Dark Mode.
- Memperbarui pasangan warna badge status, label dan kontrol form, placeholder, tombol berbahaya, indikator progres, panel scan Amil/Relawan, serta komponen panduan.
- Mengubah preview ilustrasi menu pada panduan menjadi bidang gelap yang mengikuti tema aktif, dengan teks utama dan sekunder yang terbaca.
- Panel hasil yang diharapkan memakai palet sukses semantik yang sama dengan Light/Dark Mode.
- Preview struk tetap putih sebagai representasi dokumen cetak. Landing page yang telah disetujui tetap terisolasi dari tema dashboard.
- Tes otomatis `node tests/dark-ui-theme.test.cjs` memvalidasi keberadaan selector dan rasio kontras token utama minimal 4,5:1.
- Build standalone dibuat ulang dan cache service worker dinaikkan ke `sizisnur-shell-v5-20261113-dark-ui2`.


## Pemeriksaan paginasi data — 13 November 2026

- Semua tabel bersama `table()` / `A.table()` menggunakan ukuran halaman 10. Tabel dengan 10 baris atau kurang tidak menampilkan kontrol.
- Tes helper mencakup 23 record yang terbagi menjadi 10 + 10 + 3, batas halaman, daftar kosong, dan batas tepat 10 baris.
- Pencarian dan filter menghasilkan dataset baru yang dipaginasi dari hasil filter. Kontrol halaman memperbarui satu tabel tanpa memuat ulang halaman.
- Daftar audit penuh diberikan ke tabel, tanpa pemotongan 150 record.
- CSV/XLSX tetap mengekspor sumber data lengkap; PDF laporan dibuat dari seluruh `reportRows()` pada filter aktif.
- `node tests/pagination.test.cjs` lulus, termasuk render HTML untuk halaman pertama/kedua, jumlah baris, daftar kosong, dan daftar pendek.
- Uji browser interaktif/headless belum dapat diselesaikan pada lingkungan ini karena kebijakan lingkungan eksekusi memblokir navigasi browser ke file lokal dan server localhost. Uji klik paginasi, responsivitas pada perangkat nyata, dan UAT tetap perlu dilakukan di browser pengguna.


## Perapian status Dashboard — 13 November 2026

- Role aktif, status Online/Offline, mode penyimpanan lokal/server, serta antrean lokal kini ditampilkan dalam kelompok yang terpisah pada kartu hero Dashboard.
- Status koneksi berubah mengikuti event browser `online` dan `offline`; jumlah antrean dihitung khusus lembaga aktif.
- Panel status memiliki penyesuaian breakpoint desktop, tablet, dan ponsel serta label status yang diumumkan melalui `aria-live`.
- Tes `node tests/dashboard-status.test.cjs` memeriksa markup, pembaruan status, mode penyimpanan, dan isolasi hitungan antrean per lembaga.
- Seluruh tujuh suite tes proyek lulus setelah perubahan dan HTML standalone dibuat ulang.


## Pembaruan dashboard analitik — 13 November 2026

- Ringkasan dashboard mengembalikan penerimaan uang/beras tercatat, Muzakki terdaftar, jiwa dibayarkan (Muzakki dan tanggungan), serta penyaluran uang/beras.
- Grafik enam kategori memiliki filter media Uang/Beras dan status Tercatat/Terverifikasi/Tersalurkan; tidak ada lagi filter kategori dropdown.
- Grafik Terverifikasi menggunakan transaksi yang tertaut pada berita acara setoran dengan status `terverifikasi`. `Paid` tetap berarti pembayaran disahkan Amil dan belum otomatis terverifikasi Bendahara.
- Grafik Tersalurkan menggunakan record distribusi yang berstatus `tersalurkan`. Kategori hanya dipakai jika rincian kategori eksplisit dan jumlah rinciannya cocok dengan total uang serta beras; data tanpa rincian atau rincian tidak lengkap ditampilkan pada `Belum dipetakan`.
- Panel Status Distribusi dan Transaksi Terbaru tersedia kembali. Alur dashboard berubah sesuai role aktif.
- Tes baru mencakup skenario bahwa transaksi `paid` tanpa berita acara terverifikasi tidak masuk grafik Terverifikasi, dan distribusi lama tidak dipaksakan ke kategori tertentu.
- Batasan tetap: data lokal prototype bukan sumber real-time lintas perangkat; status produksi harus divalidasi ulang di backend.



## Pemisahan registrasi mandiri Muzakki dan pendaftaran lembaga — 15 November 2026

- Form registrasi mandiri berisi empat input wajib: nama lengkap, nomor HP, email, dan alamat lengkap. Tidak ada pilihan lembaga, Daerah, RW/RT, atau persetujuan lembaga pada tahap registrasi.
- Akun baru disimpan tanpa `tenantId`, person, kartu Muzakki, dan `muzakkiMemberships`. Dashboard pribadi menampilkan status Belum terhubung.
- Menu Layanan Mandiri menampilkan aksi Pilih lembaga. Saat pengguna memilih lembaga aktif, sistem meminta domisili, alamat untuk lembaga, serta persetujuan penggunaan data.
- Person, kartu digital, dan membership dibuat pada tahap penghubungan. Kontak yang cocok tidak dipakai untuk mengklaim data walk-in yang belum diverifikasi.
- `node tests/muzakki-registration.test.cjs` dan seluruh suite `node --test tests/*.test.cjs` lulus.
- Build standalone diperbarui melalui `python tools/build-standalone.py`.


## Dashboard pribadi Muzakki — 13 November 2026

- `node tests/muzakki-dashboard.test.cjs` lulus untuk sesi default Muzakki, larangan akses dashboard agregat, transaksi milik sendiri, status berita acara Bendahara, dan riwayat lintas periode.
- Tes memastikan transaksi Muzakki lain pada lembaga yang sama tidak tampil di dashboard pribadi.
- Tes mengganti status berita acara dari `terverifikasi` menjadi `kas_diterima` dan memastikan label menjadi Belum terverifikasi.
- Status personal menggunakan relasi berita acara setoran sebagai bukti rekonsiliasi. Status transaksi `terverifikasi` tanpa berita acara terverifikasi tidak otomatis dianggap lulus rekonsiliasi.
- Pembukaan dan unduhan struk untuk role Muzakki juga dibatasi pada transaksi yang terkait akun atau membership pribadi.


## Pemulihan kalkulator dan pemisahan kelebihan pembayaran — 13 November 2026

- Kalkulator bersama digunakan oleh form transaksi self-service Muzakki serta form konter Operator/Amil.
- Admin mengelola tarif fitrah uang/beras, fidyah, biaya makan kafarat, nisab emas, harga emas, nisab profesi bulanan, dan kadar zakat pada setiap lembaga.
- Kalkulasi otomatis mencakup fitrah, maal (harta bersih agregat dengan nisab/haul umum), profesi (mode bulanan/tahunan), fidyah, dan kafarat. Kasus kafarat bertahap memerlukan konfirmasi ketidakmampuan tahapan sebelumnya sebelum opsi 60 orang dihitung.
- Kelebihan fitrah, maal, dan profesi dapat disimpan sebagai baris Infak/Sedekah dengan media yang sama. Bila belum dicentang, dialog konfirmasi muncul sebelum simpan. Kelebihan fidyah/kafarat ditampilkan tetapi tidak otomatis direklasifikasi.
- Tes `node tests/transaction-calculator.test.cjs` mencakup nilai contoh Rp45.000 kewajiban dan Rp50.000 pembayaran yang menghasilkan Rp45.000 zakat dan Rp5.000 Infak/Sedekah bila pengguna menyetujui.
- Semua test `tests/*.test.cjs` dan `node --check` lulus pada revisi ini. Build standalone dibuat ulang. Uji browser headless belum dinyatakan lulus; UAT interaktif di browser pengguna masih diperlukan.


## Penyelarasan istilah antarmuka — 14 November 2026

- Menggunakan **Lembaga** pada menu, judul halaman, label formulir, Portal Publik, konsol Admin SiZisNur, panduan, dan pesan validasi.
- Menambahkan `docs/GLOSARIUM_TERMINOLOGI.md` untuk menyamakan istilah Admin Lembaga, Admin SiZisNur, dan Portal Publik.
- Nama teknis internal seperti `tenantId`, `db.tenants`, rute/event internal, dan format identitas QR tetap dipertahankan untuk kompatibilitas.
- Seluruh 12 suite pengujian yang tersedia lulus setelah ekspektasi teks antarmuka diperbarui. Build HTML standalone berhasil dibuat ulang.
