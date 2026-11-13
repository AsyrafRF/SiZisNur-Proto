# SiZisNur V5 — Prototype Revisi 7 Actor

**Jenis aplikasi:** prototype interaktif untuk alur pengelolaan zakat, infak, dan sedekah (ZIS).  
**Teknologi:** HTML, CSS, JavaScript murni, penyimpanan browser `localStorage`, service worker untuk cache shell, dan generator QR lokal.  
**Status:** bahan evaluasi stakeholder. Bukan aplikasi transaksi zakat produksi dan belum boleh dipakai untuk mengelola uang, beras, atau data warga yang sebenarnya.

## 1. Konteks dan tujuan pembaruan

Project awal merupakan prototype web statis SiZisNur dengan contoh tenant, dashboard, penerimaan zakat, data Muzakki dan Mustahik, setoran Bendahara, penyaluran, laporan, serta acuan angka workbook 1447H/2026M. Revisi 12 November 2026 mengubah pembagian actor menjadi tujuh peran dan menyelaraskan alur dari persiapan data sampai laporan akhir.

Pembaruan ini mempertahankan modul dan angka workbook yang sudah ada, lalu menambahkan alur mandiri Muzakki, transaksi Pending yang diverifikasi Amil, serah terima kas multi-tahap, koreksi terkendali, batch distribusi, panduan tiap role, dukungan, laporan UPZ, dan evaluasi keputusan yang masih memerlukan persetujuan stakeholder.

## 2. Catatan pembaruan landing page

Landing page V5 mempertahankan kembali komposisi visual dari landing page V3, termasuk ilustrasi dashboard di area hero, strip ringkasan, kartu layanan, kartu fitur, diagram langkah, visual tujuh peran, ilustrasi multi-tenant, CTA, dan footer. Pembaruan pada bagian ini berfokus pada copywriting agar menjelaskan fitur dan alur terbaru. Tidak ada perubahan pada stylesheet landing page atau sistem desain visualnya.

## 3. Tema dan keterbacaan alert

Alert kontekstual dan toast menggunakan token warna terpusat untuk tema terang dan gelap. Warna teks tidak lagi bergantung pada warna teks global halaman, sehingga peringatan berwarna kuning dan pesan kesalahan tetap terbaca saat dark mode aktif. Perbaikan berlaku lintas halaman, termasuk dashboard, formulir, modal, panduan, laporan, dan halaman evaluasi. Preferensi tema tetap dapat diubah melalui tombol **Tema**.

## 4. Cara menjalankan

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

## 5. Matriks actor dan tanggung jawab

| Actor | Fokus | Kewenangan prototype |
|---|---|---|
| **Admin** | Sistem dan master data | Mengelola akun dan role, profil tenant, tarif, periode, pengaturan, serta input dan verifikasi kelayakan Mustahik. Tidak mempunyai akses untuk mengedit atau menghapus transaksi yang sudah diverifikasi. |
| **Muzakki** | Self-service | Registrasi akun demo, bergabung ke beberapa tenant, kelola alamat dan anggota keluarga, kalkulator zakat, buat satu transaksi aktif per tenant dan periode, QR, riwayat, dan unduh bukti. |
| **Operator** | Walk-in front-office | Input identitas dan transaksi konter berstatus `Pending`, menerbitkan struk QR, dan mengarahkan Muzakki ke Amil. Tidak dapat menerima atau mengesahkan pembayaran. |
| **Amil** | Kasir, akad, verifikasi shift | Buka/tutup shift, scan QR, periksa rincian transaksi, pandu akad, konfirmasi penerimaan uang/beras, sahkan pembayaran, dan terbitkan BSZ. Amil dapat memakai fungsi input Operator bila tidak tersedia petugas Operator terpisah. |
| **Bendahara** | Kas, rekonsiliasi dan distribusi | Menerima berita acara dari shift yang ditutup, memeriksa uang dan beras fisik, rekonsiliasi rekening, meninjau koreksi, membentuk jurnal, menyiapkan alokasi dan batch Relawan. |
| **Relawan** | Distribusi lapangan | Tampilan mobile-first, pilih batch tugas, scan QR Mustahik atau cari kode, lalu catat penerimaan satu kali untuk penerima yang ditugaskan. |
| **Pengurus** | Oversight | Baca laporan dan data operasional, memantau arus kas, berita acara dan audit, serta menyetujui atau menolak program penyaluran. Persetujuan program adalah satu-satunya tindakan operasional yang diberikan selain akses baca. |

Pengaturan akses pada prototype berlaku di lapisan UI JavaScript. Itu bukan pengganti otorisasi server. Pemisahan tugas harus ditegakkan lagi pada API dan basis data saat pengembangan backend.

## 6. Alur end-to-end yang diimplementasikan

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

## 7. Modul tambahan

- **Data wilayah:** tenant menyimpan label Daerah. Profil Muzakki dan input Walk-in membedakan VPA dan Non VPA. RT hanya ditampilkan untuk VPA dan rekap jumlah Muzakki dapat dikelompokkan per RT.
- **Kalkulator zakat:** tersedia pada halaman Muzakki untuk fitrah, maal, fidyah, kafarat, dan sedekah. Nilai tarif dan nisab adalah parameter demo yang perlu disahkan.
- **Panduan role:** halaman Panduan & Bantuan menampilkan langkah dan diagram alur sesuai peran. Amil juga memiliki halaman ketentuan, dalil, niat, doa, dan pengingat akad.
- **Support & feedback:** laporan bantuan, saran, bug, dan dugaan masalah keamanan tersimpan di database browser lokal. Pengiriman ke sistem monitoring eksternal memerlukan endpoint.
- **Offline-first prototype:** service worker menyimpan shell aplikasi. Perubahan data masuk antrean sinkronisasi lokal. Pengiriman baru dicoba jika `window.SIZISNUR_API_BASE` disediakan. Tanpa backend yang sesuai, tidak ada sinkronisasi cloud.
- **Ruang evaluasi prototype:** menginventarisasi aturan bisnis, kebijakan keuangan, syariah, integrasi dan keamanan yang belum disepakati.

## 8. Batasan dan keamanan yang wajib dipahami

1. Tidak ada backend produksi, PostgreSQL, autentikasi sesungguhnya, MFA, otorisasi server-side, enkripsi data-at-rest, backup terjadwal, atau isolasi tenant tingkat server. Akun demo tidak memakai password. Jangan masukkan NIK, nomor rekening, alamat rumah nyata, data keluarga nyata, atau transaksi aktual.
2. `localStorage` dapat dibaca dan diubah oleh pengguna perangkat. Hash audit SHA-256 pada browser bukan bukti immutable, bukan tanda tangan digital, dan bukan pengganti audit server append-only.
3. Antrean sinkronisasi hanya menyiapkan event dan record untuk endpoint yang belum disediakan. API produksi harus mengautentikasi pengguna, memeriksa tenant di server, menggunakan HTTPS, menerapkan idempotensi, validasi skema, penanganan konflik, dan mengembalikan `acknowledgedEventIds` sebelum event terkait dihapus dari antrean.
4. Cache service worker hanya mencakup application shell. Offline belum menjamin semua proses kamera, data lintas perangkat, autentikasi, atau penyelesaian konflik. Operasi keuangan offline untuk rilis memerlukan desain transaksi lokal, enkripsi, idempotency key, kontrol perangkat, dan uji pemulihan.
5. Kamera QR memerlukan HTTPS dan izin perangkat yang kompatibel. Input token manual tetap tersedia sebagai fallback. Cetak PDF memakai dialog print browser dan bukan berkas PDF yang dihasilkan oleh server.
6. Notifikasi email/WhatsApp tidak benar-benar terkirim. BAZNAS/UPZ belum terkoneksi karena endpoint dan skema pelaporan resmi belum disediakan.
7. Jurnal, neraca dan laporan perubahan dana merupakan model simulasi. Bagan akun, pemisahan dana zakat/infak/sedekah/fidyah/kafarat, pengakuan persediaan beras, pajak/biaya, dan standar pelaporan harus ditetapkan bersama Bendahara, Pengurus, BAZNAS, serta auditor.
8. Tarif zakat, nisab, lafaz akad, doa, formula distribusi, dan kebijakan mustahik perlu disahkan oleh pihak berwenang dan pembimbing agama. Teks akad hanya pengingat UI dan tidak mengesahkan ibadah.
9. Revisi ini bukan audit hukum. Sebelum rilis, lakukan kajian atas UU 23/2011 tentang Pengelolaan Zakat, PP 14/2014, UU 27/2022 tentang Pelindungan Data Pribadi, peraturan turunannya, kebijakan BAZNAS terkait UPZ, dan ketentuan daerah yang relevan. Konsultasikan dengan penasihat hukum dan BAZNAS.

## 9. Rujukan kebutuhan dan keputusan yang belum selesai

Lihat `docs/CAKUPAN_FITUR.md` untuk pemetaan fitur, `docs/SKENARIO_UAT.md` untuk langkah verifikasi, `docs/QA_HASIL_PENGUJIAN.md` untuk hasil tes, `docs/IMPLEMENTASI_WORKBOOK_1447H.md` untuk rumus dan angka workbook, dan menu **Evaluasi Prototype** untuk daftar pertanyaan yang perlu diputuskan stakeholder.

Asumsi yang sengaja belum ditetapkan antara lain batas waktu transaksi Pending, apakah satu transaksi mencakup beberapa jenis zakat, dasar prioritas Mustahik, formula alokasi fleksibel, saldo agregat workbook Tahap 2, struktur laporan UPZ, dan format integrasi email/WhatsApp.

## 10. Build dan pengujian

```bash
node --check js/app.js
node --check js/revision-v5.js
node tests/workbook-rules.test.cjs
node tests/role-guides.test.cjs
node tests/dark-alerts.test.cjs
node tests/dark-ui-theme.test.cjs
python tools/build-standalone.py
```

Pengujian otomatis memeriksa aturan workbook 1447H, komposisi dataset Mustahik sintetis, role dan halaman, hash audit, alokasi, serta kontras warna alert/toast dan komponen UI global pada light dan dark mode. Tes tersebut bukan pengganti pengujian browser multi-perangkat, penetration test, uji aksesibilitas, uji beban, maupun UAT resmi bersama stakeholder.

## 11. Struktur folder

```text
index.html
css/style.css
js/app.js
js/revision-v5.js
js/qrcode.js
assets/
docs/
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
tools/build-standalone.py
CHANGELOG_V3.md
README.md
```
