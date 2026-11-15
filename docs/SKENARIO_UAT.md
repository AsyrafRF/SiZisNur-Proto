# Skenario UAT Manual SiZisNur V5 — Revisi 7 Actor

Semua data pada prototype adalah data demo lokal. Jangan memakai identitas warga, kontak, NIK, uang, atau beras aktual. UAT ini menguji rancangan alur, bukan penerimaan operasional atau kepatuhan produksi.

## Persiapan

1. Jalankan `index.html` melalui server lokal untuk menguji PWA dan kamera. Kamera hanya tersedia pada browser/perangkat yang mendukung izin kamera dan BarcodeDetector.
2. Pilih **Masuk / Coba Demo**, lalu masuk sesuai role.
3. Dataset awal adalah **Dataset Masjid An-Nur** (satu lembaga dengan acuan workbook). Untuk mengulang skenario ini, login sebagai **Admin SiZisNur** lalu buka **Pengaturan Prototype → Kembali ke data default An-Nur**. Untuk uji multi-tenant pilih **Dataset Multi-Lembaga**; untuk uji satu lembaga pilih **Dataset Masjid An-Nur**. Ekspor cadangan terlebih dahulu bila perubahan sebelumnya masih diperlukan.
4. Sebelum skenario transaksi mandiri, login sebagai Admin untuk memeriksa tarif fitrah, fidyah, biaya makan kafarat, nisab maal, harga emas, nisab profesi, dan kadar zakat pada menu Tarif & Konfigurasi Perhitungan. Ubah hanya lembaga uji, lalu kembali login sebagai role yang sedang diuji.
5. Catat hasil, browser, perangkat, tanggal, dan temuan yang memerlukan keputusan stakeholder.

## A. Registrasi dan transaksi mandiri Muzakki

1. Dari halaman masuk, buka pendaftaran akun Muzakki.
2. Isi hanya empat data akun: nama lengkap, nomor HP, email, dan alamat lengkap. Pastikan form tidak meminta pilihan lembaga, Daerah, RW/RT, atau persetujuan tambahan.
3. Setelah akun berhasil dibuat, pastikan akun masuk ke area pribadi dengan status **Belum terhubung** dan belum memiliki person, kartu Muzakki, atau membership lembaga.
4. Dari dalam akun, buka **Pilih lembaga** / **Gabung lembaga lain**, pilih lembaga aktif, lalu lengkapi status domisili, RW/RT bila warga daerah, alamat untuk lembaga tersebut, serta persetujuan penggunaan data pada lembaga yang dipilih.
5. Pastikan membership dan kartu Muzakki baru dibuat setelah lembaga dipilih. Pastikan pencocokan nomor HP/email tidak otomatis mengklaim transaksi walk-in yang belum diverifikasi.
6. Setelah lembaga terhubung, tambahkan anggota keluarga dan simpan.
7. Buka kalkulator zakat dan uji Fitrah, Maal, Profesi, Fidyah, Kafarat, dan Infak/Sedekah. Cocokkan satuan uang `Rp` dan beras `kg`, nisab/haul maal, mode bulanan/tahunan profesi, serta tarif lembaga yang telah ditetapkan Admin.
8. Untuk kafarat sumpah, pastikan biaya makan 10 orang dihitung dengan tarif lembaga. Untuk kafarat bertahap, pastikan 60 orang tidak dihitung sebelum opsi ketidakmampuan tahapan sebelumnya dikonfirmasi.
9. Buat rencana transaksi fitrah dan pastikan jumlah awal menggunakan jumlah anggota keluarga serta tarif lembaga.
10. Ubah pembayaran agar melebihi kewajiban. Tanpa mencentang pemisahan, tekan **Simpan dan terbitkan QR**; dialog konfirmasi harus menyebut nilai kelebihan. Pilih **Tidak** dan pastikan transaksi belum tersimpan. Ulangi, pilih **Ya**, lalu pastikan baris transaksi terpisah menjadi nilai zakat dan Infak/Sedekah sesuai media.
11. Uji pembayaran sama dengan dan di bawah kewajiban; tidak boleh muncul dialog kelebihan. Uji kelebihan Fidyah/Kafarat; tampilkan selisih, tetapi jangan otomatis mengalihkan kategori.
12. Pastikan status transaksi `Pending`, QR tampil, dan masa berlakunya 24 jam.
13. Unduh PNG, cetak atau simpan PDF dari dialog browser, lalu uji layout thermal 80 mm.
14. Coba membuat transaksi kedua pada lembaga dan periode yang sama. Sistem harus menolak selama transaksi pertama masih aktif.
15. Hubungkan akun ke lembaga lain, pindah lembaga, lalu pastikan transaksi/QR lembaga pertama tidak dapat diverifikasi pada lembaga kedua.
16. Buat transaksi pada lembaga kedua dan pastikan akun masih dibatasi satu transaksi aktif untuk lembaga dan periodenya masing-masing.

## B. Jalur Operator dan verifikasi Amil

1. Masuk sebagai Operator.
2. Buka transaksi dan pilih input konter.
3. Isi Muzakki walk-in, daerah, RT bila VPA, kategori, media, jumlah jiwa dan nominal.
4. Pastikan pratinjau otomatis muncul pada form transaksi dan nominal fitrah berubah mengikuti tarif ketika media atau jumlah jiwa diubah. Uji pula Maal, Profesi, Fidyah, dan Kafarat.
5. Ulangi pengujian kelebihan pembayaran dan dialog konfirmasi pada jalur Operator; Amil harus menggunakan alur form kalkulator yang sama.
6. Simpan dan pastikan status transaksi `Pending` serta QR/struk tersedia.
7. Pastikan Operator tidak memiliki tombol verifikasi, penerimaan kas atau akses shift.
8. Masuk sebagai Amil. Buka shift.
9. Scan QR Operator atau Muzakki mandiri. Pastikan identitas Muzakki, lembaga, nilai, rincian jenis zakat dan identitas Amil terlihat.
10. Coba sahkan tanpa menandai penerimaan fisik atau akad. Sistem harus menolak.
11. Konfirmasi penerimaan uang/beras dan akad, sahkan transaksi, lalu pastikan bukti setor zakat muncul.
12. Tutup shift dan pastikan ringkasan jumlah transaksi, uang, dan beras tersimpan.
13. Coba scan ulang QR yang telah dibayar. Sistem tidak boleh memproses ulang.

## C. Serah terima dan rekonsiliasi Bendahara

1. Masuk sebagai Bendahara sebelum shift Amil ditutup. Pastikan transaksi dari shift terbuka belum dapat dibuatkan berita acara.
2. Setelah shift ditutup Amil, buat berita acara untuk shift tersebut.
3. Pastikan jumlah uang dan beras sistem dihitung dari transaksi Paid shift tersebut.
4. Masukkan nilai aktual berbeda tanpa catatan. Sistem harus menolak.
5. Masukkan selisih dan alasan. Status harus menunjukkan selisih.
6. Buka ulang pemeriksaan kas dan koreksi nilai agar cocok. Status berubah menjadi kas diterima.
7. Masuk tahap dua. Masukkan mutasi rekening dan saldo logistik yang cocok, beserta nomor referensi.
8. Pastikan transaksi baru menjadi `terverifikasi` setelah tahap dua cocok.
9. Ulangi dengan selisih bank dan pastikan dana belum dihitung sebagai saldo terverifikasi sampai selisih ditangani.
10. Periksa bahwa saldo alokasi fleksibel tidak menghitung transaksi yang baru Paid atau hanya selesai tahap satu.

## D. Koreksi terkendali dan audit

1. Masuk sebagai Amil atau Operator. Ajukan koreksi pada transaksi yang sudah dibayar.
2. Isi nilai usulan uang dan beras serta alasan. Pastikan transaksi asal tidak berubah.
3. Masuk sebagai Bendahara, tinjau permintaan, lalu setujui atau tolak.
4. Bila disetujui, pastikan delta uang dan beras tampil pada ringkasan efektif serta jurnal uang dan persediaan beras tercatat sebagai entri terpisah.
5. Masuk sebagai Pengurus dan pastikan dapat membaca permintaan serta keputusan tanpa tombol untuk mengubah data.
6. Buka Audit dan periksa status rantai SHA-256.
7. Untuk uji teknis di lingkungan terisolasi, ubah satu detail entri audit melalui DevTools lalu periksa bahwa validasi rantai mendeteksi perubahan. Pulihkan data demo sesudah uji.

## E. Persetujuan alokasi dan distribusi batch

1. Pastikan terdapat saldo yang sudah direkonsiliasi dan Mustahik terverifikasi.
2. Masuk Bendahara dan buat alokasi fleksibel sebagai draf. Periksa bahwa jumlah uang dan kg tidak melampaui saldo sesudah seluruh draf dan alokasi aktif dikurangkan.
3. Ajukan rencana tersebut.
4. Masuk Pengurus. Baca rincian, lalu setujui atau tolak dengan catatan.
5. Pastikan Pengurus tidak dapat mengubah transaksi, setoran, jurnal, data Mustahik atau master lembaga.
6. Masuk Bendahara, buat Batch 1 dengan sebagian penerima dan tetapkan Relawan.
7. Buat Batch 2 dari penerima yang tersisa. Penerima tidak boleh dimasukkan ke batch lain bila sudah dialokasikan atau telah disalurkan.
8. Masuk Relawan pada perangkat mobile. Uji kamera dan input kode manual.
9. Pastikan Relawan hanya melihat batch yang ditugaskan kepadanya.
10. Konfirmasi satu penerima. Pastikan progres batch berubah dan penerima tidak dapat dicatat dua kali.

## F. Role dan pembatasan akses

| Role | Yang perlu diuji | Batas akses yang diharapkan |
|---|---|---|
| Admin | Akun, role, lembaga, tarif, periode, Mustahik | Tidak mengubah transaksi terverifikasi, setoran, atau jurnal |
| Muzakki | Self-service, keluarga, kalkulator, lembaga dan transaksi pribadi | Tidak melihat transaksi orang lain atau data kas |
| Operator | Input walk-in dan QR | Tidak membuka shift atau mengesahkan pembayaran |
| Amil | Shift, scan, akad, transaksi | Tidak menerima setoran Bendahara atau membuat alokasi |
| Bendahara | Serah terima, jurnal, koreksi, alokasi dan batch | Tidak mengubah master kelayakan Mustahik atau keputusan Pengurus |
| Relawan | Batch dan QR penerima | Tidak melihat kas, daftar transaksi Muzakki atau alokasi yang tidak ditugaskan |
| Pengurus | Laporan, audit, koreksi dan approval | Read-only untuk data operasional. Hanya aksi persetujuan program tersedia |

## G. Laporan, dukungan dan kesiapan offline

1. Ubah filter periode dan jenis laporan. Pastikan ringkasan serta ekspor mengikuti filter.
2. Unduh CSV dan XLSX. Periksa bahwa data uang dan beras mempunyai kolom/satuan masing-masing.
3. Gunakan fungsi cetak browser dan pilih Simpan sebagai PDF.
4. Unduh paket UPZ dan pastikan statusnya dijelaskan sebagai bahan ekspor, bukan upload langsung ke BAZNAS.
5. Dari setiap role, kirim ticket bantuan, bug, saran, atau laporan keamanan. Pastikan ticket tersimpan lokal.
6. Putuskan koneksi jaringan. Pastikan shell yang sudah di-cache tetap dapat dibuka dan perubahan simulasi masuk antrean lokal.
7. Pulihkan koneksi. Tanpa endpoint API tidak ada sync cloud. Dengan endpoint uji khusus, validasi autentikasi, idempotensi, konflik, dan penerimaan event di server.
8. Periksa dashboard, panduan role, diagram alur dan halaman Evaluasi Prototype.

## H. Acuan Workbook 1447H/2026M

1. Buka menu Acuan Workbook 1447H menggunakan Admin, Bendahara atau Pengurus.
2. Cocokkan penerimaan Rp175.240.500, 3.114 jiwa, 980 blanko, beras zakat 1.882,6 kg, beras infak 71,5 kg, serta komposisi cached Mustahik 21/103/5.
3. Periksa hasil hitung ulang formula 21 Fakir, 102 Miskin, 1 Cukup Layak, dan 5 Mualaf. Perbedaan pada row 16 harus tetap ditandai.
4. Buat Tahap 1 dan Tahap 2 workbook melalui Bendahara. Tahap 1 Rp71.900.000 dan 685 kg. Tahap 2 Rp76.387.500 dan 1.197,6 kg termasuk saldo agregat.
5. Ajukan dan setujui dengan Pengurus.
6. Pastikan gabungan alokasi dasar menjadi Rp148.287.500 dan 1.882,6 kg. Saldo Rp37.500 dan 13,04 paket tidak dialokasikan otomatis kepada penerima.
7. Periksa pool insentif Q dan R yang masing-masing Rp8.000.000. Hubungan metode belum diputuskan.
8. Catat seluruh anomali pada `docs/IMPLEMENTASI_WORKBOOK_1447H.md` sebagai item validasi.

## Catatan

UAT ini perlu dijalankan bersama perwakilan Admin, Operator, Amil, Bendahara, Relawan, Pengurus, dan Muzakki. Hasil akhir memerlukan persetujuan tertulis stakeholder, pemeriksaan syariah dan hukum, serta uji keamanan sistem produksi.


## I. Reset data, preset dataset, dan pemulihan fitur

1. Login sebagai Admin SiZisNur (Root) dan buka Pengaturan Prototype. Pastikan tersedia ekspor cadangan, impor cadangan, reset ke dataset default, hapus semua data, Dataset Multi-Lembaga, dan Dataset Masjid An-Nur.
2. Pilih **Dataset Masjid An-Nur**. Pastikan hanya satu lembaga (Masjid An-Nur) tersedia, dengan 129 record Mustahik sintetis dan menu Acuan Workbook 1447H beserta catatan anomali, angka agregat, tahap alokasi, dan temuan sumber.
3. Pilih **Dataset Multi-Lembaga**. Pastikan dua lembaga contoh (Masjid An-Nur dan Masjid Al-Hikmah) tersedia, serta satu pengajuan Masjid Al-Falah berstatus menunggu. Pastikan data workbook dan 129 Mustahik tetap berada pada An-Nur.
4. Pilih **Hapus semua data**, ketik frasa konfirmasi `HAPUS SEMUA`, lalu muat ulang halaman. Pastikan tidak ada akun tenant yang tersisa atau dibuat ulang; hanya Admin SiZisNur (Root) yang dapat login. Khususnya, akun Relawan tidak boleh muncul sebagai pengguna tanpa lembaga.
5. Buat akun Muzakki baru melalui registrasi mandiri saat tidak ada lembaga. Pastikan akun dapat dibuat tanpa memilih lembaga. Setelah login, Dashboard/Layanan Mandiri/Rencana Bayar menjelaskan **Belum ada Lembaga yang terdaftar**; jangan tampilkan tombol transaksi yang belum dapat digunakan.
6. Dari Root, buat lembaga baru atau setujui pengajuan lembaga. Pastikan satu Daerah induk terbentuk otomatis. Login sebagai Admin lembaga baru, buka Master Wilayah Administratif, tambahkan RW dan RT, lalu uji pemilihannya pada form Muzakki/Mustahik.
7. Periksa menu masing-masing role pada lembaga baru dan pada kedua preset. Admin harus dapat melihat dan mengatur Jadwal & Kehadiran, tetapi tidak boleh melihat Alokasi & Persetujuan, Penyaluran, atau Laporan & Statistik. Pastikan Amil, Operator, Bendahara, Relawan, dan Pengurus hanya melihat menu sesuai tanggung jawab serta panduan role.
8. Jalankan `node tests/dataset-role-reset.test.cjs` dan `node tests/prototype-settings.test.cjs`; keduanya harus lulus.



## J. Portal Zakat Publik & Pendataan Mandiri (evaluasi simulasi)

> Jalankan hanya menggunakan data sintetis dan satu browser/profil yang sama. OTP yang ditampilkan di layar bukan OTP sungguhan; data tidak tersinkron ke perangkat lain. Fitur ini bukan kanal pembayaran nyata.

1. Pilih Dataset Masjid An-Nur dan pastikan periode zakat aktif. Login bergantian sebagai Admin, Amil, dan Operator; pastikan menu **Formulir Publik & QR Warga** tersedia. Login sebagai Bendahara/Relawan/Pengurus/Muzakki dan pastikan menu pengelola tautan tidak tersedia.
2. Sebagai Admin/Amil/Operator, buka Formulir Publik & QR Warga. Terbitkan tautan/QR. Pastikan tautan menunjukkan satu lembaga dan satu periode.
3. Coba salin tautan, buka pratinjau, buat pesan WhatsApp, dan cetak banner. Pastikan banner memuat peringatan `EVALUASI SIMULASI` dan keterangan bahwa perangkat berbeda tidak berbagi database lokal.
4. Salin URL tautan ke tab lain pada browser/profil yang sama. Pastikan halaman publik terbuka tanpa login dan menampilkan penanda evaluasi simulasi. Jangan menguji QR dari HP lain sebagai seolah-olah sinkronisasi produksi.
5. Isi nama, nomor HP sintetis, alamat sintetis, domisili, serta kanal OTP. Centang persetujuan simulasi. Pastikan form tidak mengizinkan lanjut tanpa konfirmasi tersebut.
6. Kirim form. Pastikan halaman menampilkan OTP 6 digit dengan label `TIDAK DIKIRIM KE WHATSAPP / EMAIL`. Uji kode salah, batas lima percobaan, kode kedaluwarsa, dan kode benar.
7. Setelah OTP benar, pastikan pencarian identitas dibatasi pada lembaga/periode dari tautan. Sebelum OTP tidak boleh ada detail identitas atau transaksi lama yang ditampilkan.
8. Untuk identitas baru, isi rencana Zakat Fitrah dengan tarif tenant dan simpan. Pastikan `source=public-intake`, `status=pending`, tenant/periode benar, nomor PU terbit, dan struk diberi label bukan bukti pembayaran resmi.
9. Verifikasi ulang kontak sintetis yang sama. Pastikan transaksi Pending ditemukan, bukti/QR dapat dibuka, dan form transaksi baru tidak ditampilkan. Batalkan dengan alasan dan konfirmasi; pastikan record tidak dihapus, status menjadi `batal`, QR lama tidak aktif, dan audit tersimpan.
10. Ulangi identitas dan buat Pending baru, lalu tandai transaksi sebagai diproses petugas/shift atau ubah ke Paid pada data uji. Pastikan tombol pembatalan tidak tersedia. Paid yang sudah selesai ditampilkan pada riwayat dan tidak dianggap sebagai unpaid yang menghalangi rencana baru.
11. Buat dua identitas demo dengan satu nomor HP bersama atau nomor/email yang mengarah ke person berbeda. Pastikan sistem menghentikan pencarian otomatis dan meminta pemeriksaan petugas; jangan auto-merge data.
12. Cabut tautan dari menu petugas. Pastikan pratinjau/URL lama tidak dapat membuka formulir. Pastikan periode tertutup atau lembaga dinonaktifkan juga menolak tautan.
13. Jalankan `node tests/public-intake.test.cjs` dan seluruh tes `for f in tests/*.test.cjs; do node "$f"; done`.
14. Baca `docs/PORTAL_ZAKAT_PUBLIK_EVALUASI.md`, khususnya bagian batasan prototype dan checklist produksi. Jangan publikasikan banner kepada warga untuk penggunaan riil sebelum backend, OTP provider, isolasi tenant, audit, dan seluruh gate keamanan dipenuhi.
