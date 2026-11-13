# Pembaruan Panduan Penggunaan per Role

## Tujuan

Panduan penggunaan SiZisNur diperluas agar dapat diikuti oleh pengguna yang belum terbiasa menggunakan aplikasi digital. Pola penyajiannya mengambil inspirasi dari contoh panduan SILAM yang diberikan sebagai referensi, tetapi isi langkah mengikuti menu, label, hak akses, dan alur yang benar-benar tersedia pada prototype SiZisNur.

## Struktur panduan di dalam aplikasi

Setiap role mendapatkan:

1. Ringkasan tanggung jawab role dan batas kewenangan.
2. Checklist persiapan sebelum mulai bekerja.
3. Diagram alur kerja untuk melihat urutan pekerjaan secara keseluruhan.
4. Panduan terpisah untuk setiap menu yang dapat diakses oleh role tersebut.
5. Tujuan setiap menu, langkah bernomor, contoh tampilan ilustratif, hasil yang diharapkan, serta catatan atau peringatan.
6. FAQ khusus role.
7. Formulir bantuan, dukungan, dan umpan balik yang sudah tersedia sebelumnya.

Contoh tampilan pada panduan merupakan ilustrasi pengenal elemen menu, bukan tangkapan layar akun pengguna. Nama menu dan tombol diselaraskan dengan implementasi saat ini. Nilai contoh tidak boleh dianggap sebagai data transaksi sebenarnya.

## Cakupan role

- **Admin** — ringkasan, profil lembaga dan UPZ, akun dan peran, periode zakat, tarif dan rumus, Mustahik dan kelayakan, notifikasi, audit dan arsip, serta acuan workbook.
- **Muzakki** — Dashboard Zakat Saya yang hanya menampilkan status, jenis, nilai, verifikasi, dan riwayat zakat pribadi; lembaga dan profil, data keluarga tanggungan, kalkulator, rencana transaksi dan QR tetap tersedia di bagian Layanan Mandiri.
- **Operator** — ringkasan, data Muzakki Walk-in, input transaksi konter, struk digital dan cetak, serta pengajuan koreksi.
- **Amil** — ringkasan, shift dan kehadiran, input konter saat tidak ada Operator, pemindaian QR dan verifikasi, bukti setor zakat, ketentuan dan akad, serta notifikasi.
- **Bendahara** — ringkasan, serah terima dan rekonsiliasi, jurnal dan laporan keuangan, koreksi, alokasi, batch penyaluran, laporan, insentif, audit, dan acuan workbook.
- **Relawan** — ringkasan, daftar batch penyaluran, pemindaian QR Mustahik, konfirmasi penerimaan, serta panduan kendala kamera atau jaringan.
- **Pengurus** — ringkasan, peninjauan lembaga, penerimaan, rekonsiliasi, koreksi, persetujuan alokasi, jurnal, laporan, insentif, audit, dan acuan workbook dengan akses baca saja kecuali tindakan persetujuan program yang memang disediakan.

## Batasan prototype

Panduan menjelaskan kemampuan prototype, bukan menjanjikan layanan produksi. Akun dan data masih berjalan pada lingkungan prototype berbasis browser. Pengiriman email dan WhatsApp, autentikasi produksi, isolasi lembaga server-side, sinkronisasi cloud, serta integrasi resmi BAZNAS tetap memerlukan backend dan konfigurasi tahap rilis. Kamera pemindai memerlukan konteks HTTPS dan izin perangkat.

## Pengujian

Jalankan pemeriksaan berikut dari direktori project:

```bash
node --check js/revision-v5.js
node tests/role-guides.test.cjs
node tests/workbook-rules.test.cjs
python tools/build-standalone.py
```

Tes `role-guides.test.cjs` merender panduan untuk ketujuh role dan memeriksa kelengkapan modul, langkah bernomor, ilustrasi UI, FAQ, form feedback, serta tautan navigasi ke masing-masing modul.
