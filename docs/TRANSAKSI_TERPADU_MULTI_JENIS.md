# Modul Input Transaksi Terpadu — Multi-Jenis dan Multi-Media

**Status:** implementasi prototype untuk evaluasi dan UAT; belum menggunakan backend produksi.

## Tujuan

Semua jalur pencatatan menggunakan satu modul perhitungan dan struktur rincian transaksi yang sama:

1. Input konter oleh Operator atau Amil.
2. Rencana pembayaran dari akun Muzakki.
3. Formulir publik tanpa login melalui tautan/QR lembaga.

Perbedaan kanal hanya pada cara memperoleh identitas Muzakki dan konteks pencatatan. Komponen kategori, pilihan media, kuantitas, perhitungan, validasi kelebihan, penyimpanan rincian, QR, dan struk menggunakan mesin bersama.

## Bentuk transaksi multi-baris

Satu baris mewakili satu kombinasi **jenis zakat/donasi + media pembayaran**. Satu transaksi dapat memuat sampai 12 baris agar rincian tetap terbaca pada struk.

Contoh satu transaksi gabungan:

| Baris | Jenis | Media | Kuantitas | Contoh nilai |
|---|---|---|---:|---:|
| 1 | Zakat Fitrah | Uang | 2 jiwa | Rp90.000 |
| 2 | Zakat Fitrah | Beras | 1 jiwa | 2,5 kg |
| 3 | Fidyah | Uang | 2 hari | Rp130.000 |

Ketiga rincian tersebut tersimpan di bawah satu nomor transaksi, satu status, satu QR, dan satu struk. Sistem menjumlahkan kewajiban dan pembayaran uang serta beras secara terpisah. Jumlah jiwa Fitrah dijumlahkan dari semua baris Fitrah, baik uang maupun beras.

Kategori yang didukung: Zakat Fitrah, Zakat Maal, Zakat Profesi, Fidyah, Kafarat, dan Infak/Sedekah. **Batas aturan prototype saat ini:** pilihan beras hanya tersedia untuk Zakat Fitrah; kategori lain menggunakan uang. Jika ada aturan lembaga yang kelak mengizinkan bentuk natura untuk kategori lain, perubahan itu harus dimodelkan dan disetujui tersendiri, bukan diasumsikan oleh kalkulator.

## Kalkulasi adaptif

Setiap baris menampilkan bidang yang sesuai kategorinya:

- Fitrah: jumlah jiwa dan pilihan Uang atau Beras; tarif mengikuti pengaturan Lembaga.
- Maal: nilai harta bersih, status haul, dan parameter nisab/harga emas Lembaga.
- Profesi: penghasilan dan pilihan periode bulanan atau akumulasi tahunan.
- Fidyah: jumlah hari puasa yang ditinggalkan dan tarif per hari.
- Kafarat: jenis kasus, tahap yang relevan, serta biaya makan yang dikonfigurasi Lembaga.
- Infak/Sedekah: nominal sukarela.

**Bidang input ditampilkan sesuai kategori yang dipilih pada setiap baris:**

| Kategori | Bidang yang ditampilkan |
|---|---|
| Zakat Fitrah | Media (uang/beras), jumlah jiwa, dan pembayaran |
| Zakat Maal | Harta bersih, status haul, dan pembayaran |
| Zakat Profesi | Penghasilan pada periode terpilih (bulanan/tahunan) dan pembayaran |
| Fidyah | Jumlah hari puasa yang ditinggalkan dan pembayaran |
| Kafarat | Jumlah kasus, jenis kafarat, konfirmasi tahapan bila relevan, dan pembayaran |
| Infak/Sedekah | Nominal sukarela saja |

Media selain Fitrah ditetapkan sebagai uang oleh aturan prototype, sehingga pilihan media tidak ditampilkan sebagai input yang tidak dapat diubah. Kontrol yang sedang tidak relevan juga dinonaktifkan agar tidak ikut terkirim atau terkena validasi browser.

Penambahan/penghapusan baris, perubahan jenis, kuantitas, harta/penghasilan, haul, tahap kafarat, atau media akan memperbarui pratinjau secara langsung. Ketika kategori/media diubah, nilai otomatis dihitung ulang untuk menghindari nominal lama tertinggal pada pilihan baru. Nilai yang dimasukkan sendiri oleh pengguna tidak ditimpa oleh kalkulasi otomatis.

Semua nominal uang memakai format Rupiah Indonesia dengan titik setiap tiga digit, misalnya `1.250.000`. Pemisah tersebut dibersihkan saat data dibaca untuk perhitungan numerik. Input kilogram memakai koma desimal, misalnya `2,5 kg`.

## Domisili Daerah, RW, dan RT

Pada form Operator/Amil dan formulir publik, identitas dilengkapi pilihan status domisili. Bila memilih warga daerah, pengguna harus memilih RW dan RT dari Master Wilayah yang dikelola Admin untuk Lembaga aktif. Daftar RT berubah mengikuti RW yang dipilih; RT dari RW lain tidak dapat disimpan. Bila memilih Non-daerah, panel RW/RT disembunyikan dan bidang tersebut tidak diwajibkan. Identitas yang dipilih dari daftar Muzakki terdaftar mengisi kembali domisili tersimpan agar dapat diperiksa atau diperbarui.

## Konfirmasi kelebihan pembayaran

Ketiga kanal menggunakan dialog konfirmasi yang sama. Bila satu atau beberapa baris melebihi estimasi kewajibannya dan opsi pemisahan kelebihan belum dipilih, sistem meminta keputusan sebelum menyimpan:

- Tetap catat sesuai kategori yang dipilih.
- Pisahkan kelebihan menjadi Infak/Sedekah pada media yang sama (untuk kategori yang memenuhi aturan split di prototype).
- Kembali memeriksa formulir.

Jika pengguna mengubah salah satu isian setelah memilih keputusan, keputusan sebelumnya dibatalkan dan sistem meminta konfirmasi ulang apabila masih terdapat kelebihan.

Fidyah dan Kafarat tidak otomatis direklasifikasi menjadi Infak/Sedekah karena perlakuan kelebihan memerlukan ketentuan tersendiri. Kalkulasi merupakan alat bantu prototype dan bukan penetapan kewajiban syariah.

## QR dan struk seragam

Ketiga jalur menyimpan array `lines` dan menggunakan perender struk yang sama. Struk menampilkan seluruh rincian, jenis, media, kuantitas/satuan (misalnya jiwa, hari atau kasus), dasar nilai harta jika relevan, total uang dan total beras, nomor transaksi, serta satu QR. Status Pending diberi label sebagai rencana pembayaran dan bukan bukti pembayaran resmi. QR mengacu pada keseluruhan transaksi gabungan, bukan QR terpisah per baris.

## Istilah antarmuka

Istilah yang ditampilkan kepada pengguna adalah **Lembaga**. `tenantId`, `db.tenants`, dan nama internal lain tetap digunakan sebagai detail implementasi agar kompatibilitas data prototype tidak terputus; istilah teknis tersebut tidak digunakan sebagai label UI.

## Pengujian

- `tests/transaction-calculator.test.cjs`: kalkulasi per jenis, multi-baris, kombinasi Fitrah uang/beras, total uang/beras, kelebihan, pemisahan, modul Operator bersama, format Rupiah, dan perender struk.
- `tests/public-intake.test.cjs`: formulir publik menggunakan data identitas/wilayah dan modul transaksi yang sama, OTP demo, transaksi campuran, konfirmasi kelebihan, struk, privasi, serta pembatalan.
- `tests/tenant-territories.test.cjs`: validasi relasi Daerah/RW/RT, filter RT saat RW berubah, dan Non-daerah tanpa RW/RT.

## Batas prototype

Data disimpan dalam browser lokal. Transaksi dari perangkat warga belum otomatis masuk ke perangkat petugas. Sinkronisasi, verifikasi identitas yang sebenarnya, transaksi atomik, dan otorisasi harus diterapkan pada backend bersama sebelum penggunaan produksi. Gunakan hanya data sintetis pada tahap evaluasi.
