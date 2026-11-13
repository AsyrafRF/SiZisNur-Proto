# Skenario UAT Manual SiZisNur V5 — Revisi 7 Actor

Semua data pada prototype adalah data demo lokal. Jangan memakai identitas warga, kontak, NIK, uang, atau beras aktual. UAT ini menguji rancangan alur, bukan penerimaan operasional atau kepatuhan produksi.

## Persiapan

1. Jalankan `index.html` melalui server lokal untuk menguji PWA dan kamera. Kamera hanya tersedia pada browser/perangkat yang mendukung izin kamera dan BarcodeDetector.
2. Pilih **Masuk / Coba Demo**, lalu masuk sesuai role.
3. Pastikan data demo belum diubah. Untuk mengulang dari kondisi awal, login sebagai **Admin SiZisNur** lalu buka **Pengaturan Prototype → Reset ke data bawaan**. Ekspor cadangan terlebih dahulu bila perubahan sebelumnya masih diperlukan.
4. Sebelum skenario transaksi mandiri, login sebagai Admin untuk memeriksa tarif fitrah, fidyah, biaya makan kafarat, nisab maal, harga emas, nisab profesi, dan kadar zakat pada menu Tarif & Konfigurasi Perhitungan. Ubah hanya lembaga uji, lalu kembali login sebagai role yang sedang diuji.
5. Catat hasil, browser, perangkat, tanggal, dan temuan yang memerlukan keputusan stakeholder.

## A. Registrasi dan transaksi mandiri Muzakki

1. Dari landing page, buka pendaftaran akun Muzakki.
2. Isi nama, salah satu kontak, lembaga awal, Daerah, RT jika VPA, alamat dan persetujuan.
3. Setelah akun masuk, tambahkan anggota keluarga dan simpan.
4. Buka kalkulator zakat dan uji Fitrah, Maal, Profesi, Fidyah, Kafarat, dan Infak/Sedekah. Cocokkan satuan uang `Rp` dan beras `kg`, nisab/haul maal, mode bulanan/tahunan profesi, serta tarif lembaga yang telah ditetapkan Admin.
5. Untuk kafarat sumpah, pastikan biaya makan 10 orang dihitung dengan tarif lembaga. Untuk kafarat bertahap, pastikan 60 orang tidak dihitung sebelum opsi ketidakmampuan tahapan sebelumnya dikonfirmasi.
6. Buat rencana transaksi fitrah dan pastikan jumlah awal menggunakan jumlah anggota keluarga serta tarif lembaga.
7. Ubah pembayaran agar melebihi kewajiban. Tanpa mencentang pemisahan, tekan **Simpan dan terbitkan QR**; dialog konfirmasi harus menyebut nilai kelebihan. Pilih **Tidak** dan pastikan transaksi belum tersimpan. Ulangi, pilih **Ya**, lalu pastikan baris transaksi terpisah menjadi nilai zakat dan Infak/Sedekah sesuai media.
8. Uji pembayaran sama dengan dan di bawah kewajiban; tidak boleh muncul dialog kelebihan. Uji kelebihan Fidyah/Kafarat; tampilkan selisih, tetapi jangan otomatis mengalihkan kategori.
9. Pastikan status transaksi `Pending`, QR tampil, dan masa berlakunya 24 jam.
10. Unduh PNG, cetak atau simpan PDF dari dialog browser, lalu uji layout thermal 80 mm.
11. Coba membuat transaksi kedua pada lembaga dan periode yang sama. Sistem harus menolak selama transaksi pertama masih aktif.
12. Hubungkan akun ke lembaga lain, pindah lembaga, lalu pastikan transaksi/QR lembaga pertama tidak dapat diverifikasi pada lembaga kedua.
13. Buat transaksi pada lembaga kedua dan pastikan akun masih dibatasi satu transaksi aktif untuk lembaga dan periodenya masing-masing.

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
