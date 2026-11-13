# Paginasi Data SiZisNur

## Aturan tampilan

- Semua tabel data yang memakai helper bersama `table()` / `A.table()` menampilkan maksimal **10 baris per halaman**.
- Tabel dengan 10 baris atau kurang tidak menampilkan kontrol paginasi.
- Tabel dengan lebih dari 10 baris menampilkan informasi rentang data, jumlah total, tombol Sebelumnya/Selanjutnya, dan nomor halaman.
- Kontrol halaman hanya memperbarui tabel yang dipilih. Halaman aplikasi dan data lain tidak perlu dimuat ulang.
- Ketika data hasil pencarian atau filter berubah, daftar dihitung ulang dan rentang halaman mengikuti hasil yang baru.
- Navigasi tabel mendukung klik tombol serta atribut aksesibilitas untuk pembaca layar.
- Kontrol paginasi mengikuti tema Light Mode dan Dark Mode serta menyesuaikan layar ponsel.

## Cakupan

Paginasi berlaku secara terpusat pada tabel di seluruh role dan halaman, termasuk daftar Mustahik, Muzakki, tenant yang terhubung pada akun Muzakki, transaksi, serah terima, mutasi rekening, jurnal, koreksi, batch, penyaluran, laporan, notifikasi, dan audit. Tabel yang ditampilkan di modal juga menggunakan aturan yang sama. Formulir yang berisi input yang dapat diedit langsung (misalnya editor anggota keluarga) tetap dipertahankan sebagai satu form agar data yang belum disimpan tidak hilang saat berpindah halaman.

Riwayat audit tidak lagi dipotong pada 150 baris sebelum ditampilkan. Seluruh record tenant aktif diberikan ke helper paginasi.

## Data dan ekspor

Paginasi hanya mengatur jumlah baris yang ditampilkan pada layar. Data sumber tidak dihapus, diubah, atau dipotong. Fitur CSV dan XLSX tetap membaca keseluruhan dataset sesuai filter laporan. Cetak/PDF laporan membangun dokumen dari seluruh hasil `reportRows()`, bukan hanya halaman tabel yang sedang terlihat.

## Pengujian

Jalankan:

```bash
node tests/pagination.test.cjs
```

Tes mencakup renderer HTML 23 baris menjadi 10 + 10 + 3, navigasi halaman pertama/kedua, batas halaman, tabel pendek dan kosong, keberadaan kontrol responsif, daftar tenant Muzakki, audit tanpa batas 100/150 baris, serta jalur PDF menggunakan seluruh baris laporan.
