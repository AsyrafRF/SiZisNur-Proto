# SiZisNur V5 — Prototype Revisi 7 Actor

**Jenis aplikasi:** prototype interaktif untuk alur pengelolaan zakat, infak, dan sedekah (ZIS).  
**Teknologi:** HTML, CSS, JavaScript murni, penyimpanan browser `localStorage`, service worker untuk cache shell, dan generator QR lokal.  
**Status:** bahan evaluasi stakeholder. Bukan aplikasi transaksi zakat produksi dan belum boleh dipakai untuk mengelola uang, beras, atau data warga yang sebenarnya.

## 1. Konteks dan tujuan pembaruan

Project awal merupakan prototype web statis SiZisNur dengan contoh tenant, dashboard, penerimaan zakat, data Muzakki dan Mustahik, setoran Bendahara, penyaluran, laporan, serta acuan angka workbook 1447H/2026M. Revisi 12–13 November 2026 mengubah pembagian actor menjadi tujuh peran dan menyelaraskan alur dari persiapan data sampai laporan akhir.

Pembaruan ini mempertahankan modul dan angka workbook yang sudah ada, lalu menambahkan alur mandiri Muzakki, transaksi Pending yang diverifikasi Amil, serah terima kas multi-tahap, koreksi terkendali, batch distribusi, panduan tiap role, dukungan, laporan UPZ, dan evaluasi keputusan yang masih memerlukan persetujuan stakeholder. Revisi 13 November mengembalikan kalkulasi otomatis ke form transaksi Muzakki, Operator, dan Amil serta menambahkan pemisahan kelebihan pembayaran dan konfirmasi sebelum simpan. Revisi 14 November menambahkan aktor **Admin SiZisNur** sebagai pengelola root platform yang terpisah dari tujuh role tenant, lalu memperluas Portal Publik untuk seluruh tenant aktif dan menambahkan verifikasi QR publik dengan kamera.

## 2. Catatan pembaruan landing page

Landing page V5 mempertahankan kembali komposisi visual dari landing page V3, termasuk ilustrasi dashboard di area hero, strip ringkasan, kartu layanan, kartu fitur, diagram langkah, visual tujuh peran, ilustrasi multi-tenant, CTA, dan footer. Pembaruan pada bagian ini berfokus pada copywriting agar menjelaskan fitur dan alur terbaru. Tidak ada perubahan pada stylesheet landing page atau sistem desain visualnya.

## 3. Tema dan keterbacaan alert

Alert kontekstual dan toast menggunakan token warna terpusat untuk tema terang dan gelap. Warna teks tidak lagi bergantung pada warna teks global halaman, sehingga peringatan berwarna kuning dan pesan kesalahan tetap terbaca saat dark mode aktif. Perbaikan berlaku lintas halaman, termasuk dashboard, formulir, modal, panduan, laporan, dan halaman evaluasi. Preferensi tema tetap dapat diubah melalui tombol **Tema**.

## 4. Paginasi daftar data

Seluruh tabel data yang menggunakan komponen tabel bersama menampilkan maksimal 10 baris per halaman. Aturan ini berlaku pada daftar Mustahik, Muzakki, tenant yang terhubung pada akun Muzakki, transaksi, rekonsiliasi, jurnal, koreksi, batch, distribusi, notifikasi, audit, laporan, dan tabel di dalam modal. Tabel berisi 10 baris atau kurang tetap ditampilkan tanpa kontrol halaman. Pencarian dan filter bekerja pada keseluruhan hasil, sedangkan CSV/XLSX dan cetak/PDF laporan tidak dibatasi oleh halaman yang sedang terlihat.

## 5. Cara menjalankan

1. Ekstrak ZIP project.
2. Buka `index.html` di browser modern. Untuk cache offline dan izin kamera, jalankan melalui HTTPS atau server lokal.
3. Alternatif server lokal tanpa dependency tambahan:

   ```bash
   python -m http.server 8000
   ```

   Buka `http://localhost:8000/`.
4. Pilih **Masuk / Coba Demo** dan pilih akun role yang tersedia. Login prototype tidak menggunakan password atau OTP.
5. Gunakan **Reset Data Demo** untuk mengembalikan data awal bila menu tersebut tersedia pada akun demo.

Catatan: klaim histori transaksi Walk-in ke akun baru belum diaktifkan. Penautan harus menunggu verifikasi nomor HP/email agar data tidak dapat diambil hanya dengan memasukkan kontak milik orang lain.

File mandiri yang memuat HTML, CSS, JavaScript, QR, dan logo tersedia pada `standalone/SiZisNur_Prototype_V5_Standalone.html`.

## 6. Kalkulasi otomatis transaksi zakat

Form transaksi **Muzakki (self-service)** dan form konter **Operator/Amil** memakai komponen kalkulator yang sama. Pratinjau memperlihatkan estimasi kewajiban, jumlah pembayaran, kekurangan, dan kelebihan. Perubahan jenis, jumlah jiwa/hari/kasus, nilai harta atau penghasilan, haul, serta jenis kafarat memperbarui estimasi.

| Jenis | Logika estimasi di prototype | Parameter tenant yang dapat diatur Admin |
|---|---|---|
| Zakat fitrah | Jumlah jiwa × tarif uang per jiwa atau kilogram beras per jiwa | Tarif uang dan beras per jiwa |
| Zakat maal | 2,5% dari agregat harta bersih jika telah mencapai nisab emas dan haul satu tahun untuk harta yang mensyaratkannya | Nisab gram emas, harga emas per gram, kadar zakat |
| Zakat profesi | 2,5% dari penghasilan bulanan bila mencapai nisab bulanan; tersedia opsi akumulasi penghasilan satu tahun bila penghasilan tidak mencapai nisab bulanan | Nisab profesi bulanan (Rupiah) dan kadar zakat |
| Fidyah | Jumlah hari puasa yang ditinggalkan × tarif per hari | Tarif fidyah per hari |
| Kafarat | Jumlah kasus × jumlah porsi berdasarkan jenis kasus (10 untuk sumpah; 60 untuk kasus tertentu setelah tahapan sebelumnya tidak mampu) × biaya makan per orang | Biaya makan per orang; nilai awal 0 agar Admin wajib mengesahkan tarif tenant |
| Infak/sedekah | Sukarela; tidak diberi nilai kewajiban otomatis | Tidak ada kewajiban minimum |

Nilai tarif fitrah tenant yang telah tersimpan tetap dipertahankan (misalnya Rp45.000 pada tenant contoh An-Nur dan Rp50.000 pada tenant Al-Hikmah); migrasi tidak menimpa keputusan lokal. Nilai awal fidyah mengikuti referensi BAZNAS RI 1447 H/2026 M sebesar Rp65.000/hari, tetapi Admin dapat mengubahnya untuk tenant. Parameter maal awal menggunakan nisab 85 gram emas dan kadar 2,5%; harga Rp1.078.608,56/gram adalah nilai awal simulasi yang diturunkan dari ambang penghasilan 2026, bukan klaim harga pasar emas terkini. Admin wajib mengganti harga acuan tersebut sesuai sumber harga emas dan keputusan tenant sebelum hasil maal dipakai untuk transaksi nyata. Nisab profesi bulanan memakai angka BAZNAS 2026 Rp7.640.144 secara terpisah (akumulasi tahunan Rp91.681.728) agar acuan 14 karat untuk pendapatan tidak tercampur dengan harga emas yang dipakai untuk kalkulasi maal. Admin dapat memperbarui kedua parameter tersebut.

**Kelebihan pembayaran:** checkbox “Jika pembayaran zakat melebihi kewajiban, pisahkan kelebihannya sebagai infak/sedekah” tersedia untuk fitrah, maal, dan profesi. Jika checkbox dicentang, baris pembayaran dipecah menjadi nilai zakat sesuai kewajiban dan sisanya menjadi infak/sedekah dalam media yang sama. Jika belum dicentang dan pembayaran lebih besar dari estimasi, tombol **Simpan dan terbitkan QR** memunculkan konfirmasi. Pilihan “Ya” mencentang pemisahan lalu melanjutkan penyimpanan; pilihan “Tidak” mengembalikan pengguna ke formulir. Fidyah dan kafarat tidak otomatis dialihkan karena perlakuan kelebihan atas kewajiban tersebut perlu ketentuan tersendiri.

Kafarat tidak dipatok dengan satu nominal universal: kalkulasi bergantung pada jenis kasus dan tahapan yang relevan. Untuk kafarat sumpah, opsi memberi makan 10 orang dapat dihitung. Untuk kasus yang bertahap (misalnya hubungan suami-istri pada siang Ramadan atau zihar), sistem tidak menghitung opsi makan 60 orang kecuali pengguna secara eksplisit mengonfirmasi bahwa tahapan sebelumnya tidak mampu ditunaikan. Jika Admin belum mengatur biaya makan per orang, UI menampilkan peringatan dan tidak menghitung nominal otomatis. Semua hasil adalah estimasi bantu; penetapan kewajiban, haul, komponen harta, kasus kafarat dan tarif lokal tetap perlu disahkan oleh otoritas syariah/BAZNAS yang berwenang. Kalkulasi maal saat ini menggunakan satu nilai harta bersih agregat, bukan kalkulator lengkap untuk seluruh objek zakat (misalnya pertanian, peternakan, atau ragam usaha).

Rujukan resmi yang digunakan untuk nilai awal: [BAZNAS RI — zakat fitrah dan fidyah 1447 H/2026 M](https://baznas.go.id/news-show/Ramadan_2026,_BAZNAS_RI_Tetapkan_Zakat_Fitrah_Rp50_Ribu/3708), [nisab dan kadar zakat penghasilan 2026](https://www.baznas.go.id/zakatpenghasilan), [kalkulator zakat BAZNAS](https://baznas.go.id/kalkulatorzakat), dan [penjelasan kafarat BAZNAS](https://baznas.go.id/artikel-show/Mengenal-Arti-Kafarat/232). Tarif tetap dapat disesuaikan Admin tenant sesuai ketetapan wilayah.

## 7. Matriks actor dan tanggung jawab

| Actor | Fokus | Kewenangan prototype |
|---|---|---|
| **Admin** | Sistem dan master data | Mengelola akun dan role, profil tenant, tarif, periode, pengaturan, serta input dan verifikasi kelayakan Mustahik. Tidak mempunyai akses untuk mengedit atau menghapus transaksi yang sudah diverifikasi. |
| **Muzakki** | Self-service | Registrasi akun demo, bergabung ke beberapa tenant, kelola alamat dan anggota keluarga, kalkulator zakat, buat satu transaksi aktif per tenant dan periode, QR, riwayat, dan unduh bukti. |
| **Operator** | Walk-in front-office | Input identitas dan transaksi konter berstatus `Pending`, menerbitkan struk QR, dan mengarahkan Muzakki ke Amil. Tidak dapat menerima atau mengesahkan pembayaran. |
| **Amil** | Kasir, akad, verifikasi shift | Buka/tutup shift, scan QR, periksa rincian transaksi, pandu akad, konfirmasi penerimaan uang/beras, sahkan pembayaran, dan terbitkan BSZ. Amil dapat memakai fungsi input Operator bila tidak tersedia petugas Operator terpisah. |
| **Bendahara** | Kas, rekonsiliasi dan distribusi | Menerima berita acara dari shift yang ditutup, memeriksa uang dan beras fisik, rekonsiliasi rekening, meninjau koreksi, membentuk jurnal, menyiapkan alokasi dan batch Relawan. |
| **Relawan** | Distribusi lapangan | Tampilan mobile-first, pilih batch tugas, scan QR Mustahik atau cari kode, lalu catat penerimaan satu kali untuk penerima yang ditugaskan. |
| **Pengurus** | Oversight | Baca laporan dan data operasional, memantau arus kas, berita acara dan audit, serta menyetujui atau menolak program penyaluran. Persetujuan program adalah satu-satunya tindakan operasional yang diberikan selain akses baca. |

**Admin SiZisNur (root/platform) bukan role kedelapan tenant dan tidak tergabung dalam `db.users`.** Akunnya disimpan dalam koleksi terpisah `db.platformAdmins`, memiliki `scope: platform`, dan tidak mempunyai `tenantId`. Konsol root mengelola registrasi dan status tenant, tinjauan pengajuan lembaga, metadata tenant, status akun pengguna lintas tenant, pengaturan global, pengumuman, mode pemeliharaan, serta audit platform. Admin tenant tetap bertanggung jawab atas tarif zakat, periode, data Muzakki/Mustahik, transaksi, dan kas lembaganya.

Pengaturan akses pada prototype berlaku di lapisan UI JavaScript. Itu bukan pengganti otorisasi server. Pemisahan tugas harus ditegakkan lagi pada API dan basis data saat pengembangan backend.

### Akun demo root platform

- **Nama/role:** Admin SiZisNur
- **Email demo:** `root@sizisnur.demo`
- **ID internal:** `PA-SIZISNUR-ROOT`
- **Cara masuk:** pilih tile **Admin SiZisNur** pada halaman Masuk Demo atau pilih akun tersebut pada dropdown akun demonstrasi. Prototype ini belum meminta password/OTP.
- **Konsol:** Ringkasan, Tenant Terdaftar, Pengajuan Tenant, Akun Pengguna Tenant, Pengaturan Sistem Root, Audit Platform, dan Profil Akun Root.

Admin SiZisNur dapat membuat tenant beserta akun Admin awal dan aturan/periode draf, mengaktifkan/menangguhkan tenant, meninjau pengajuan publik, mengubah metadata tenant, serta mengaktifkan/nonaktifkan akun tenant. Tenant yang ditangguhkan atau ketika mode pemeliharaan aktif tidak dapat membuka workspace operasional. Pengajuan publik yang masuk tetap berstatus **menunggu** sampai ditinjau dari konsol root.

## 8. Alur end-to-end yang diimplementasikan

### A. Persiapan

Admin menyiapkan periode, tarif, parameter, identitas tenant, dan data Mustahik. Form Mustahik mempertahankan rumus penilaian pada workbook dan tidak mengubah otomatis anomali sumber.

### B. Penghimpunan

Muzakki mandiri atau Operator konter membuat transaksi dengan status `Pending`. Keduanya mendapat QR dan struk rencana. Akun Muzakki dapat terhubung ke banyak tenant, tetapi hanya satu transaksi aktif per tenant pada satu periode. Setiap token mengandung tenant asal dan hanya dapat diperiksa pada tenant tersebut.

Amil wajib membuka shift. Setelah scan QR, layar verifikasi menampilkan identitas Muzakki, rincian uang/beras, identitas Amil, dan pengingat akad. Amil baru dapat mengesahkan setelah mengonfirmasi penerimaan fisik dan akad. Struk dapat diunduh sebagai PNG, dicetak atau disimpan sebagai PDF melalui browser, dan dicetak dengan layout thermal 80 mm.

QR `Pending` berakhir setelah 24 jam atau saat periode ditutup, mana yang lebih dahulu. Email dan WhatsApp dicatat sebagai kanal simulasi, bukan pengiriman eksternal aktif.

### C. Rekonsiliasi Bendahara

Bendahara hanya dapat membuat berita acara dari transaksi pada shift Amil yang sudah ditutup. Tahap pertama mencocokkan uang dan beras fisik. Tahap kedua mencocokkan mutasi rekening atau catatan saldo logistik. Selisih harus disertai catatan dan diselesaikan sebelum dana dihitung sebagai saldo rekonsiliasi untuk alokasi fleksibel.

Koreksi tidak menimpa transaksi asal. Amil atau Operator mengajukan alasan dan nilai usulan. Bendahara memutuskan, dan keputusan menjadi catatan audit serta penyesuaian jurnal. Nilai koreksi uang (IDR) dan beras (kg) dibukukan terpisah.

### D. Persetujuan dan distribusi

Bendahara menyiapkan alokasi dari saldo yang sudah direkonsiliasi, atau dari perhitungan Tahap 1 dan Tahap 2 workbook. Draf diajukan kepada Pengurus untuk disetujui atau ditolak. Alokasi yang disetujui dapat dibagi menjadi batch pertama, kedua, dan seterusnya. Bendahara menetapkan Relawan dan daftar penerima. Relawan hanya dapat mengonfirmasi penerima dalam batch yang ditugaskan.

### E. Pelaporan dan audit

Dashboard menyediakan filter kategori dan ringkasan uang/beras. Laporan dapat difilter menurut periode dan jenis laporan serta diekspor ke CSV, XLSX, atau PDF melalui fungsi cetak browser. Paket CSV/XLSX UPZ disediakan sebagai bahan pelaporan bulanan, tetapi belum dikirim langsung ke BAZNAS. Log audit demo memakai rantai hash SHA-256 untuk membantu mendeteksi perubahan yang tidak konsisten.

## 9. Modul tambahan

- **Master wilayah per tenant:** setiap tenant memiliki satu Daerah induk dan hierarki RW → RT yang dikelola Admin pada menu Profil Tenant. Contoh data demo: Masjid An-Nur / Perumahan Villa Pesona Asri memiliki RW 11 dengan RT 01–06; Masjid Al-Hikmah / Kompleks Buana Citra memiliki RW 1 (RT 01–10) dan RW 2 (RT 01–05). Formulir identitas Muzakki dan Mustahik menggunakan pilihan Warga daerah atau Non-daerah; warga memilih RW dan RT dari master, bukan mengetik bebas. Status domisili dan ID Daerah/RW/RT disimpan pada identitas per tenant dan dapat direkap pada menu Muzakki serta Laporan.
- **Kalkulator zakat:** tersedia pada halaman Muzakki dan menjadi pratinjau wajib saat transaksi pada halaman Muzakki, Operator, serta Amil. Mendukung fitrah, maal, profesi, fidyah, kafarat, dan sedekah; tarif dan nisab mengikuti parameter tenant.
- **Panduan role:** halaman Panduan & Bantuan menampilkan langkah dan diagram alur sesuai peran. Amil juga memiliki halaman ketentuan, dalil, niat, doa, dan pengingat akad.
- **Support & feedback:** laporan bantuan, saran, bug, dan dugaan masalah keamanan tersimpan di database browser lokal. Pengiriman ke sistem monitoring eksternal memerlukan endpoint.
- **Offline-first prototype:** service worker menyimpan shell aplikasi. Perubahan data masuk antrean sinkronisasi lokal. Pengiriman baru dicoba jika `window.SIZISNUR_API_BASE` disediakan. Tanpa backend yang sesuai, tidak ada sinkronisasi cloud.
- **Ruang evaluasi prototype:** menginventarisasi aturan bisnis, kebijakan keuangan, syariah, integrasi dan keamanan yang belum disepakati.

## 10. Batasan dan keamanan yang wajib dipahami

1. Tidak ada backend produksi, PostgreSQL, autentikasi sesungguhnya, MFA, otorisasi server-side, enkripsi data-at-rest, backup terjadwal, atau isolasi tenant tingkat server. Akun demo tenant maupun root tidak memakai password. Akun root hanya dipisahkan secara struktur data dan UI pada browser; ini belum menjadi batas keamanan yang dapat dipercaya. Jangan mempublikasikan build demo dengan data nyata. Sebelum produksi, autentikasi root harus memakai kredensial terpisah, MFA wajib, otorisasi backend khusus platform, pembatasan jaringan/perangkat sesuai risiko, rate limit, pencatatan audit server append-only, serta proses pemulihan akun yang diawasi. Jangan masukkan NIK, nomor rekening, alamat rumah nyata, data keluarga nyata, atau transaksi aktual.
2. `localStorage` dapat dibaca dan diubah oleh pengguna perangkat. Hash audit SHA-256 pada browser bukan bukti immutable, bukan tanda tangan digital, dan bukan pengganti audit server append-only.
3. Master wilayah administratif menggunakan relasi `areas` → `rws` → `rts`; identitas menyimpan `domicileStatus`, `areaId`, `rwId`, dan `rtId`, sedangkan snapshot keanggotaan tenant menyimpan atribut domisili tenant yang sama. Validasi relasi dijalankan di sisi aplikasi prototype, tetapi API produksi tetap wajib memverifikasi kepemilikan tenant dan parent-child di server. Antrean sinkronisasi hanya menyiapkan event dan record untuk endpoint yang belum disediakan. API produksi harus mengautentikasi pengguna, memeriksa tenant di server, menggunakan HTTPS, menerapkan idempotensi, validasi skema, penanganan konflik, dan mengembalikan `acknowledgedEventIds` sebelum event terkait dihapus dari antrean.
4. Cache service worker hanya mencakup application shell. Offline belum menjamin semua proses kamera, data lintas perangkat, autentikasi, atau penyelesaian konflik. Operasi keuangan offline untuk rilis memerlukan desain transaksi lokal, enkripsi, idempotency key, kontrol perangkat, dan uji pemulihan.
5. Kamera QR memerlukan HTTPS dan izin perangkat yang kompatibel. Input token manual tetap tersedia sebagai fallback. Cetak PDF memakai dialog print browser dan bukan berkas PDF yang dihasilkan oleh server.
6. Notifikasi email/WhatsApp tidak benar-benar terkirim. BAZNAS/UPZ belum terkoneksi karena endpoint dan skema pelaporan resmi belum disediakan.
7. Jurnal, neraca dan laporan perubahan dana merupakan model simulasi. Bagan akun, pemisahan dana zakat/infak/sedekah/fidyah/kafarat, pengakuan persediaan beras, pajak/biaya, dan standar pelaporan harus ditetapkan bersama Bendahara, Pengurus, BAZNAS, serta auditor.
8. Tarif zakat, nisab, lafaz akad, doa, formula distribusi, dan kebijakan mustahik perlu disahkan oleh pihak berwenang dan pembimbing agama. Teks akad hanya pengingat UI dan tidak mengesahkan ibadah. Atribut Daerah/RW/RT administratif pada identitas Mustahik tetap terpisah dari `mustahik.region` (kolom H wilayah penilaian survei); kolom H dan formula skor workbook 1447H tidak diubah oleh fitur master wilayah.
9. Revisi ini bukan audit hukum. Sebelum rilis, lakukan kajian atas UU 23/2011 tentang Pengelolaan Zakat, PP 14/2014, UU 27/2022 tentang Pelindungan Data Pribadi, peraturan turunannya, kebijakan BAZNAS terkait UPZ, dan ketentuan daerah yang relevan. Konsultasikan dengan penasihat hukum dan BAZNAS.

## 11. Rujukan kebutuhan dan keputusan yang belum selesai

Lihat `docs/CAKUPAN_FITUR.md` untuk pemetaan fitur, `docs/SKENARIO_UAT.md` untuk langkah verifikasi, `docs/QA_HASIL_PENGUJIAN.md` untuk hasil tes, `docs/IMPLEMENTASI_WORKBOOK_1447H.md` untuk rumus dan angka workbook, dan menu **Evaluasi Prototype** untuk daftar pertanyaan yang perlu diputuskan stakeholder.

Asumsi yang sengaja belum ditetapkan antara lain batas waktu transaksi Pending, apakah satu transaksi mencakup beberapa jenis zakat, dasar prioritas Mustahik, formula alokasi fleksibel, saldo agregat workbook Tahap 2, struktur laporan UPZ, dan format integrasi email/WhatsApp.

## 12. Build dan pengujian

```bash
node --check js/app.js
node --check js/revision-v5.js
node --check js/platform-admin.js
node tests/workbook-rules.test.cjs
node tests/role-guides.test.cjs
node tests/dark-alerts.test.cjs
node tests/dark-ui-theme.test.cjs
node tests/pagination.test.cjs
node tests/tenant-territories.test.cjs
node tests/transaction-calculator.test.cjs
node tests/platform-admin.test.cjs
python tools/build-standalone.py
```

Pengujian otomatis memeriksa aturan workbook 1447H, komposisi dataset Mustahik sintetis, role dan halaman, hash audit, alokasi, master Daerah/RW/RT per tenant, validasi relasi lintas tenant, pemisahan domisili administratif dari kolom H penilaian, serta kontras warna alert/toast dan komponen UI global pada light dan dark mode. Tes tersebut bukan pengganti pengujian browser multi-perangkat, penetration test, uji aksesibilitas, uji beban, maupun UAT resmi bersama stakeholder.

## 13. Struktur folder

```text
index.html
css/style.css
js/app.js
js/revision-v5.js
js/platform-admin.js
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
tests/transaction-calculator.test.cjs
tests/tenant-territories.test.cjs
tools/build-standalone.py
CHANGELOG_V3.md
README.md
```


## Portal Publik multi-tenant dan verifikasi QR

- Buka **Portal Publik** dari landing page atau layar masuk; login tenant tidak diperlukan.
- Direktori menampilkan tenant dengan status `aktif` dan opsi tampil publik diaktifkan. Admin SiZisNur dapat mengatur visibilitas melalui **Tenant Terdaftar → Detail → Tampilkan tenant pada Portal Publik**.
- Setiap tenant menampilkan angka agregat penghimpunan dan penyaluran. Nama Muzakki/Mustahik, kontak, alamat rumah, identitas petugas, dan nominal transaksi individual tidak ditampilkan.
- Untuk memeriksa struk fisik, tekan **Scan QR dengan kamera** dan izinkan akses kamera. Hasil valid berarti pembayaran telah disahkan Amil; hasil Pending masih belum tervalidasi. Token/nomor seri juga dapat dimasukkan secara manual.
- Kamera memerlukan HTTPS atau localhost dan dukungan `BarcodeDetector`. Browser yang belum mendukung API pemindai harus memakai input manual.
- Untuk penjelasan aturan status, privasi, dan batasan produksi, baca `docs/PORTAL_PUBLIK_TRANSPARANSI_DAN_QR.md`.
