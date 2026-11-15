# Profil Lembaga, ID Publik, Peta Simulasi, dan Galeri Foto

Pembaruan ini menambahkan informasi pembeda lembaga sebelum Muzakki mengirim pendaftaran ke sebuah lembaga. Alur pendaftaran akun Muzakki mandiri tetap terpisah: akun dibuat lebih dahulu, kemudian Muzakki memilih lembaga dari menu Layanan Mandiri.

## Informasi yang tampil pada pemilihan lembaga

Saat Muzakki membuka **Pilih lembaga**, kartu pratinjau lembaga menampilkan:

- Nama lembaga dan **ID unik lembaga** (contoh: `MAN-06426` dan `AH-6482`).
- Daerah/kawasan, kelurahan/desa, kecamatan, kota/kabupaten, dan provinsi jika sudah diisi.
- Alamat lengkap lembaga, nomor telepon, dan email jika tersedia.
- Peta visual bertanda **PETA SIMULASI**.
- Carousel foto dan caption yang telah dimasukkan Admin lembaga.

Ketika Muzakki mengubah pilihan pada dropdown, pratinjau profil, peta, serta galeri ikut diperbarui sebelum pendaftaran disetujui.

## Pengelolaan profil

Masuk menggunakan akun **Admin lembaga**, lalu buka menu **Kelola Lembaga & UPZ**. Form profil menyediakan:

1. Nama lembaga dan informasi kontak.
2. Daerah/kawasan, kelurahan/desa, kecamatan, kota/kabupaten, provinsi, dan kode pos.
3. Alamat jalan, nomor, dan patokan lengkap.
4. Latitude dan longitude (opsional).
5. Daftar URL foto lembaga, satu foto per baris.

Format foto yang didukung:

```text
https://domain-contoh.id/foto-depan.jpg | Tampak depan masjid
https://domain-contoh.id/ruang-utama.jpg | Ruang utama
https://domain-contoh.id/kegiatan.jpg | Kegiatan warga
```

Keterangan setelah karakter `|` bersifat opsional. URL harus menggunakan skema `https://` atau `http://`. Gunakan URL gambar yang dapat diakses oleh browser dan pastikan lembaga memiliki hak untuk menayangkan foto tersebut. Urutan baris menjadi urutan foto dalam carousel. Kosongkan semua baris foto untuk menghapus galeri.

## ID unik lembaga

ID publik dibuat otomatis ketika lembaga baru dibuat melalui konsol Admin SiZisNur. Sistem mengambil inisial dari tiap kata nama lembaga (maksimal lima huruf) lalu menambahkan nomor acak lima digit yang diperiksa agar tidak sama dengan ID lembaga lain. Contoh:

- `Masjid An-Nur` → awalan `MAN-` lalu nomor unik, misalnya `MAN-06426`.
- `Al-Hikmah` → awalan `AH-` lalu nomor unik, misalnya `AH-06482`.

Nomor akhir bersifat otomatis sehingga tidak dijanjikan selalu sama dengan contoh. ID disimpan permanen pada data lembaga dan tidak berubah ketika nama lembaga diedit. ID ini berbeda dari ID internal database seperti `TN-ANNUR`; ID publik dipakai agar Muzakki mudah membedakan lembaga dengan nama serupa.

## Peta: batasan prototype

Peta di dalam aplikasi merupakan ilustrasi lokal, bukan peta geografis akurat dan bukan hasil geocoding. Penanda visual hanya dekoratif agar pengguna memahami letak informasi lokasi. Jika Admin mengisi latitude dan longitude yang benar, tombol **Buka peta luar** mengarah ke OpenStreetMap pada koordinat tersebut. Jika koordinat tidak diisi, tautan luar hanya melakukan pencarian teks menggunakan alamat lembaga.

Alamat awal lembaga contoh pada seed sengaja ditandai sebagai alamat contoh. Admin perlu menggantinya dengan alamat sebenarnya, mengisi rincian daerah, dan memeriksa koordinat sebelum demo diberikan kepada stakeholder. Jangan menganggap posisi penanda di peta simulasi sebagai lokasi nyata.

## Penyimpanan dan kesiapan produksi

Prototype menyimpan pengaturan profil dan daftar URL foto pada `localStorage` browser. Foto tidak diunggah ke server oleh fitur ini. Untuk implementasi produksi, diperlukan backend dengan validasi dan otorisasi server-side, penyimpanan media (upload), kontrol ukuran/format file, moderasi konten, pencatatan perubahan, serta layanan peta/geocoding yang dipilih organisasi. Data lokal prototype tidak boleh dianggap sebagai penyimpanan operasional bersama lintas perangkat.
