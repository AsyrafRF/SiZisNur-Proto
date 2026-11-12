# Skenario Pengujian Prototype (UAT Manual)

Nama dan identitas pada demo bersifat sintetis. Angka pada menu Acuan Workbook 1447H merupakan agregat sumber workbook resmi. Setelah unzip, buka `index.html` dan gunakan menu demo per role. Klik **Reset Data Demo** untuk mengulang dari awal.

## Skenario A — Penerimaan sampai verifikasi bendahara

1. Masuk **Amilin Demo**.
2. Pilih **Penerimaan Zakat → Transaksi baru**.
3. Pilih **Ahmad Santoso (Demo)**; isi 2 jiwa dan rincian zakat fitrah uang Rp100.000.
4. Amati kewajiban fitrah Rp90.000 dan checkbox kelebihan; simpan. Hasil yang diharapkan: transaksi baru tercatat dengan baris Fitrah Rp90.000 + Infak Rp10.000.
5. Periksa modal layar akad dan struk QR. Klik tombol layar kedua/pop-out, lalu cetak dua rangkap bila printer tersedia. QR akan memuat token teks `SiZisNur|...`.
6. Keluar, masuk **Bendahara Demo**. Buka **Bendahara & Setoran**.
7. Klik **Buat setoran**, pilih Amilin Demo. Semua transaksi `tercatat` milik amilin tersebut dibuat sebagai satu setoran; transaksi berubah menjadi `disetor`.
8. Klik **Periksa**, ubah nilai kas aktual menjadi berbeda dari nilai sistem, beri alasan. Simpan → status **selisih**, transaksi belum terverifikasi.
9. Klik **Periksa** lagi, samakan uang/beras aktual dengan nilai sistem dan isi alasan koreksi. Simpan → **terverifikasi**; status transaksi ikut berubah.
10. Masuk **Pengurus Demo** untuk melihat rekap.

## Skenario B — Survei, alokasi, approval, distribusi

1. Masuk **Petugas Demo**, buka **Mustahik & Survei**, tambah mustahik sintetis. Pilih lima faktor dan jalur Mualaf; sistem menghitung jalur F/M dan final status sesuai formula workbook. Verifikasi survei setelah diperiksa.
2. Buka **Alokasi & Persetujuan**; lihat saldo terverifikasi yang belum dialokasikan.
3. Untuk menguji alokasi generik, setelah skenario A menghasilkan dana baru, buat rencana maksimal saldo terverifikasi dan simpan sebagai draf; klik Ajukan. Untuk alokasi sumber workbook, gunakan skenario E.
4. Keluar lalu masuk **Pengurus Demo**, buka Alokasi dan pilih **Putuskan → Setujui**.
5. Keluar lalu masuk **Petugas Demo**, buka **Penyaluran**, pilih salah satu item alokasi, catat realisasinya.
6. Coba mencatat penerima yang sama lagi untuk alokasi yang sama: pilihan penerima tidak boleh muncul lagi.
7. Buka **Laporan**, pastikan realisasi uang bertambah dan saldo tersisa berubah.

## Skenario C — Kartu, publik, dan tenant

1. Masuk **Amilin** atau **Petugas**, buka **Data Muzakki**, klik Kartu, periksa ID unik dan QR.
2. Klik portal Publik dari topbar, isi nomor transaksi `TR-001` dan klik Verifikasi. Hanya nomor, tanggal, kategori, status yang tampil; tidak ada nama/telepon/alamat.
3. Login sebagai **Admin Tenant B** melalui dropdown akun. Verifikasi tidak tampil daftar muzakki Masjid An-Nur; tenant B adalah contoh data berbeda.
4. Di portal publik klik **Ajukan lembaga**, isi data fiktif dan kirim. Pengajuan tercatat dalam data lokal, tetapi tidak otomatis mendapatkan akses tenant baru.
5. Coba ekspor data JSON, lalu Reset Data Demo. Semua perubahan kembali ke dataset awal.

## Skenario D — Uji batasan kualitas

- Ubah tema terang/gelap dan periksa layout pada resolusi ponsel.
- Refresh halaman: data tetap ada bila penyimpanan browser tersedia.
- Coba akses fitur dengan role yang tidak sesuai: navigasi tidak tersedia dan akses ditolak pada aksi terkait.
- Masukkan detail pembayaran bernilai nol: penyimpanan harus ditolak.
- Coba alokasi melebihi dana terverifikasi: harus ditolak.
- Coba menutup periode yang masih memiliki setoran atau alokasi belum selesai: harus ditolak.
- Ekspor laporan CSV atau JSON dan buka dengan aplikasi lain.

## Skenario E — V3 berbasis workbook 1447H/2026M

1. Masuk **Petugas Demo** dan buka **Acuan Workbook 1447H**. Cocokkan penerimaan Rp175.240.500, 3.114 jiwa, 980 blanko, beras zakat 1.882,6 kg, dan komposisi mustahik 21/103/5.
2. Buka **Mustahik & Survei**. Daftar awal memuat 129 identitas sintetis; klik **Lihat aturan skor** untuk memeriksa lima faktor, ambang >360/>240, dan jalur Mualaf.
3. Tambah survei dummy. Pilih wilayah, tempat tinggal, status pernikahan, kategori penghasilan, tanggungan, dan jalur Mualaf; simpan. Final status harus dihitung dari formula workbook, bukan dipilih manual.
4. Buka **Alokasi & Persetujuan**. Klik **Buat Tahap 1 · Workbook**. Hasil dasar harus Rp71.900.000 dan 274 paket (685 kg). Simpan draf, ajukan.
5. Login **Pengurus Demo**, buka Alokasi, periksa rincian, lalu setujui.
6. Kembali sebagai **Petugas Demo** dan buat Tahap 2. Dasar per asnaf Rp76.350.000 dan 466 paket; saldo agregat Rp37.500 + 13,04 paket ditampilkan terpisah. Total tahap 2 sesuai rekap menjadi Rp76.387.500 dan 479,04 paket (1.197,6 kg).
7. Setujui tahap 2 melalui Pengurus. Rencana gabungan harus sama dengan Summary1: Rp148.287.500 dan 753,04 paket = 1.882,6 kg. Saldo agregat tidak muncul sebagai item individu untuk penyaluran.
8. Buka **Insentif Amil**. Pastikan metode blanko dan kehadiran masing-masing menunjukkan pool Rp8.000.000 dan total manual K38 Rp17.208.500 ditampilkan terpisah.
9. Buka Acuan Workbook dan baca daftar temuan; selisih beras 0,6 kg, satuan paket, formula baris pertama, perbedaan cache/formula R16, 4–5 juta, tanggungan 4 ATAU LEBIH, dan P43/P49 tidak boleh diubah otomatis.

## Catatan pengujian otomatis

Jalankan `node tests/workbook-rules.test.cjs` untuk pengujian formula, batas klasifikasi, jumlah mustahik sintetis, render template halaman, dan total Tahap 1/2. Uji browser penuh pada perangkat pengguna serta UAT resmi belum dilakukan.

UAT resmi dan penandatanganan stakeholder belum dilakukan. Prototype ini belum membuktikan seluruh persyaratan keamanan, ketersediaan, skalabilitas atau kebenaran rumus resmi.
