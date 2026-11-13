# Sistem Tema SiZisNur — Light Mode dan Dark Mode

Tanggal pembaruan: 13 November 2026

## Prinsip

Tema aplikasi menggunakan token warna semantik yang terpusat pada `css/style.css`. Komponen tidak boleh mengandalkan warna teks gelap tetap di atas permukaan Dark Mode atau warna latar terang tanpa pasangan warna teks yang sesuai.

## Area yang disesuaikan

- Navigasi, header, kartu, tombol sekunder, tautan, dan aksen teks.
- Field form, label, input, textarea, pencarian, pilihan/dropdown, placeholder, dan kontrol native browser.
- Badge status umum, sukses, menunggu, selisih, dan informasi.
- Indikator progres dan elemen alur kerja.
- Panel pemindaian QR untuk Amil dan Relawan.
- Panduan role, termasuk ilustrasi tampilan menu, nomor langkah, panel tujuan, dan panel hasil yang diharapkan.
- Alert dan toast menggunakan token semantik yang sudah tersedia pada pembaruan sebelumnya.

## Perlakuan khusus

- Landing page mempertahankan desain visual yang telah disetujui dan tidak berubah mengikuti tema dashboard.
- Preview struk/BSZ tetap menggunakan bidang putih dan teks gelap karena merepresentasikan dokumen yang akan dicetak atau disimpan sebagai PDF.
- Kamera preview tetap menggunakan bidang gelap agar area video memiliki kontras yang stabil.
- Warna hijau untuk tombol dan indikator tidak diubah menjadi warna teks. Aksen teks menggunakan token tersendiri agar tetap terbaca di atas panel gelap.

## Standar kontras dan pengujian

Tes `node tests/dark-ui-theme.test.cjs` memeriksa pasangan latar/teks untuk badge status, panel hasil panduan, preview panduan, teks aksen, label formulir, tindakan berbahaya, dan indikator langkah. Tes `node tests/dark-alerts.test.cjs` memeriksa alert dan toast. Pasangan teks/latar utama diuji terhadap rasio minimum 4,5:1 sesuai WCAG AA.

Tes tersebut memverifikasi token yang didefinisikan pada stylesheet, bukan audit aksesibilitas menyeluruh untuk setiap kemungkinan konten dinamis. Pengujian visual manual tetap diperlukan pada ukuran layar, browser, zoom, dan variasi konten yang berbeda.
