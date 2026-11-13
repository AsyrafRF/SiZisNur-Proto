# Panduan deploy prototype SiZisNur

Panduan ini khusus untuk versi front-end statis. Deployment publik tidak mengubah prototype menjadi sistem transaksi produksi.

## Netlify

1. Ekstrak arsip project.
2. Buka https://app.netlify.com/drop.
3. Unggah folder project yang berisi `index.html`, `css`, `js`, `assets`, `manifest.webmanifest`, dan `service-worker.js`.
4. Pastikan root publish adalah folder yang memuat `index.html`.
5. Buka URL HTTPS hasil deploy, lalu periksa landing page, login demo, halaman setiap role, QR manual, dan laporan.

## Vercel

1. Unggah folder project ke repository Git atau gunakan alur deploy statis Vercel.
2. Build command tidak diperlukan.
3. Tetapkan output/publish directory ke root project.
4. Deploy melalui HTTPS dan jalankan ulang skenario UAT.

## Menjalankan di komputer lokal

```bash
python -m http.server 8000
```

Buka `http://localhost:8000/`. Untuk akses kamera dan pengujian PWA di perangkat lain, gunakan HTTPS atau localhost sesuai dukungan browser.

## Versi mandiri satu file

File `standalone/SiZisNur_Prototype_V5_Standalone.html` menggabungkan CSS, JavaScript, generator QR dan logo. File ini cocok untuk demo offline satu perangkat. File mandiri tidak membawa cache PWA, sinkronisasi server, autentikasi, atau isolasi data.

Untuk membangunnya ulang setelah mengubah source:

```bash
python tools/build-standalone.py
```

## Konfigurasi sinkronisasi API

Secara default tidak ada server yang dikonfigurasi. Jika backend uji sudah tersedia, sebelum memuat `js/revision-v5.js` tetapkan `window.SIZISNUR_API_BASE` ke base URL API yang benar dan terproteksi HTTPS. Endpoint `/sync` harus dibangun secara khusus untuk menerima envelope event versi skema 5, memvalidasi identitas pengguna dan tenant di server, menerapkan idempotensi, menangani konflik, serta mengembalikan JSON `acknowledgedEventIds` berisi ID event yang benar-benar sudah diterima dan diproses. Jangan mengaktifkan URL contoh atau endpoint yang belum memenuhi kontrak tersebut.

Klien hanya menghapus event dari antrean ketika ID-nya tercantum pada `acknowledgedEventIds`. Event tanpa acknowledgement akan tetap disimpan dan dicoba kembali.

Variabel ini hanya mengaktifkan percobaan pengiriman antrean. Ia bukan konfigurasi backend otomatis dan tidak boleh dianggap sebagai layanan sinkronisasi cloud yang telah tersedia.

## Pemeriksaan sebelum demo

- Gunakan hanya data fiktif. Jangan masukkan NIK, nomor HP nyata, alamat rumah, rekening, data keluarga, atau transaksi sesungguhnya.
- Login demo tidak memakai password atau OTP. Hak akses berjalan di JavaScript browser, bukan otorisasi server.
- Data tersimpan di `localStorage` per browser dan origin. Perangkat atau domain lain tidak otomatis berbagi data.
- Hash audit SHA-256 hanya membantu mendeteksi perubahan lokal. Pengguna yang menguasai browser dapat memodifikasi data dan hash.
- Kamera memerlukan izin browser. Input token manual tetap tersedia sebagai fallback.
- PDF dibuat lewat dialog cetak browser. Dukungan printer thermal perlu diuji pada perangkat dan driver yang akan digunakan.
- Email dan WhatsApp belum terkirim sungguhan. Paket UPZ hanya diekspor sebagai berkas, belum dikirim ke BAZNAS.
- Service worker meng-cache application shell. Sinkronisasi antrean tetap memerlukan API backend dan aturan konflik produksi.

## Batas hukum dan tata kelola

Sebelum penggunaan nyata, minta telaah pengurus, BAZNAS setempat, penasihat hukum, dan pihak yang berwenang atas syariah. Periksa dasar pengelolaan zakat, tata kelola UPZ, dasar pemrosesan data pribadi, retensi, hak subjek data, keamanan, dan perjanjian antar pihak. Lihat `LEGAL_READINESS.md`.
