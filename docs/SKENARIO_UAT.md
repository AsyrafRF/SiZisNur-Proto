# Skenario Pengujian Prototype (UAT Manual)

Seluruh angka dan nama di bawah adalah contoh. Setelah unzip, buka `index.html` dan gunakan menu demo per role. Klik **Reset Data Demo** untuk mengulang dari awal.

## Skenario A — Penerimaan sampai verifikasi bendahara

1. Masuk **Amilin Demo**.
2. Pilih **Penerimaan Zakat → Transaksi baru**.
3. Pilih **Ahmad Santoso (Demo)**; isi 2 jiwa dan rincian zakat fitrah uang Rp100.000.
4. Amati kewajiban fitrah Rp90.000 dan checkbox kelebihan; simpan. Hasil yang diharapkan: transaksi baru tercatat dengan baris Fitrah Rp90.000 + Infak Rp10.000.
5. Periksa modal layar akad dan struk QR. Klik tombol layar kedua/pop-out, lalu cetak dua rangkap bila printer tersedia. QR akan memuat token teks `AZIS|...`.
6. Keluar, masuk **Bendahara Demo**. Buka **Bendahara & Setoran**.
7. Klik **Buat setoran**, pilih Amilin Demo. Semua transaksi `tercatat` milik amilin tersebut dibuat sebagai satu setoran; transaksi berubah menjadi `disetor`.
8. Klik **Periksa**, ubah nilai kas aktual menjadi berbeda dari nilai sistem, beri alasan. Simpan → status **selisih**, transaksi belum terverifikasi.
9. Klik **Periksa** lagi, samakan uang/beras aktual dengan nilai sistem dan isi alasan koreksi. Simpan → **terverifikasi**; status transaksi ikut berubah.
10. Masuk **Pengurus Demo** untuk melihat rekap.

## Skenario B — Survei, alokasi, approval, distribusi

1. Masuk **Petugas Demo**, buka **Mustahik & Survei**, tambah mustahik fiktif dan hitung skor indikatif. Pilih asnaf manual serta status diverifikasi.
2. Buka **Alokasi & Persetujuan**; lihat saldo terverifikasi yang belum dialokasikan.
3. Setelah skenario A menghasilkan dana baru, buat rencana Rp90.000 tanpa pembulatan (kelipatan Rp1) dan simpan sebagai draf; klik Ajukan.
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

## Catatan pengujian otomatis

Pengujian headless Chromium telah berhasil dijalankan untuk semua menu setiap role tanpa exception JavaScript, pembuatan transaksi, rekonsiliasi selisih, persetujuan alokasi, penyaluran, laporan, dan verifikasi portal publik. Screenshot demo tersedia dalam folder `assets`.

UAT resmi dan penandatanganan stakeholder belum dilakukan. Prototype ini belum membuktikan seluruh persyaratan keamanan, ketersediaan, skalabilitas atau kebenaran rumus resmi.
