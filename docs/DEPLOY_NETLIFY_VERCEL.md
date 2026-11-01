# Cara deploy SiZisNur (prototype statis)

## Netlify Drop
1. Ekstrak ZIP.
2. Masuk ke https://app.netlify.com/drop.
3. Drag folder `SiZisNur_Prototype_v2` yang berisi `index.html`, folder `css`, `js`, dan `assets`.
4. Dapatkan alamat subdomain hosting dan periksa landing page, login, portal publik, dan QR.

## Vercel
1. Unggah folder proyek melalui Vercel Drop atau masukkan ke repository Git.
2. Untuk static site, **tanpa build command**, dan output di root proyek (direktori yang berisi `index.html`).
3. Setelah deploy, ulangi pengujian secara manual.

## Alternatif satu file
`SiZisNur_Prototype_Standalone.html` sudah mencakup CSS, JS, generator QR, dan logo sebagai data URI. Bisa dibuka langsung di browser atau diubah namanya menjadi `index.html` untuk deployment.

## Hal yang perlu disadari
- Semua data demo tetap berada pada `localStorage` browser; pengunjung berbeda tidak berbagi transaksi.
- Penggantian domain mengakibatkan asal storage yang berbeda, sehingga data lama tidak bisa dimigrasikan otomatis antar-domain.
- **Jangan gunakan data asli**, karena login, hak akses, audit, persetujuan platform, dan pemisahan tenant hanya simulasi.
- Logo SiZisNur adalah kandidat identitas prototype, bukan klaim status merek yang telah terdaftar.
