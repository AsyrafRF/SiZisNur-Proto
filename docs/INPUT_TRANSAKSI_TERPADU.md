# Modul Input Transaksi Terpadu SiZisNur

**Status: tahap evaluasi prototype.** Dokumen ini menjelaskan perilaku form yang dipakai oleh Operator/Amil, Muzakki yang login, dan warga melalui Formulir Publik. Seluruh data masih disimpan di browser; jangan gunakan untuk pembayaran atau identitas warga yang sebenarnya.

## 1. Prinsip satu modul

Ketiga kanal input memakai satu komponen pembangun form, parser rincian, mesin kalkulasi, pemeriksaan kelebihan pembayaran, pembentukan model transaksi, dan renderer struk yang sama:

| Kanal | Pemakai | Cara membuka form | Status awal |
|---|---|---|---|
| Input petugas | Operator atau Amil | Menu transaksi/input konter | `pending` |
| Layanan Mandiri | Muzakki terhubung ke Lembaga | Menu Rencana Bayar Zakat | `pending` |
| Formulir Publik | Warga tanpa akun/login | Tautan atau QR Formulir Publik Lembaga setelah OTP demo | `pending` |

Formulir ketiga kanal tidak mempunyai rumus dan template struk terpisah. Perbedaan antar kanal dibatasi pada cara mengidentifikasi orang, izin akses, sumber transaksi, dan metadata kanal. Nomor transaksi, rincian kategori/media, perhitungan, QR, dan struk mengikuti model transaksi yang sama.

## 2. Satu transaksi berisi beberapa rincian

Satu formulir dapat berisi sampai 12 baris rincian. Satu baris mewakili satu kombinasi jenis zakat/donasi dan media. Semua baris disimpan pada satu transaksi, satu nomor transaksi, dan satu QR.

Contoh kombinasi yang didukung:

1. Zakat Fitrah — uang.
2. Zakat Fitrah — beras.
3. Zakat Maal — uang.
4. Zakat Profesi — uang.
5. Fidyah — uang.
6. Kafarat — uang.
7. Infak/Sedekah — uang.

Warga dapat menggabungkan beberapa baris tersebut pada transaksi yang sama, misalnya Fitrah uang untuk sebagian jiwa, Fitrah beras untuk jiwa lainnya, serta Maal dan Fidyah dalam satu nomor transaksi. Media beras secara eksplisit tersedia untuk Zakat Fitrah pada kalkulasi prototype saat ini. Kategori lain memakai media uang. Jika kelebihan Fitrah beras dipisahkan menjadi Infak/Sedekah, rincian infak ikut dicatat dalam media beras.

Batas 12 baris bertujuan menjaga ukuran formulir dan keterbacaan struk. Batas dan kebijakan penggabungan kategori tetap harus disahkan stakeholder sebelum produksi.

## 3. Kalkulasi adaptif per baris

Parameter tarif diambil dari konfigurasi Lembaga tempat form dibuka. Tarif satu Lembaga tidak dipakai untuk menghitung transaksi Lembaga lain.

| Jenis | Input utama | Perhitungan prototype | Media |
|---|---|---|---|
| Zakat Fitrah | Jumlah jiwa | Jiwa × tarif uang atau kilogram per jiwa | Uang atau beras |
| Zakat Maal | Nilai harta bersih dan status haul | Kadar zakat bila nisab dan syarat haul terpenuhi | Uang |
| Zakat Profesi | Nilai penghasilan, bulanan/tahunan | Kadar zakat bila mencapai nisab yang ditetapkan | Uang |
| Fidyah | Jumlah hari | Hari × tarif fidyah per hari | Uang |
| Kafarat | Jenis kasus, jumlah kasus, konfirmasi tahapan | Porsi sesuai jenis kasus × biaya makan per orang | Uang |
| Infak/Sedekah | Nominal sukarela | Tidak ada kewajiban minimum otomatis | Uang |

Setiap baris memperlihatkan estimasi kewajiban, nilai dibayarkan, dan selisih kurang/lebih bila ada. Ringkasan formulir menjumlahkan total kewajiban dan pembayaran dalam dua ukuran terpisah: Rupiah dan kilogram beras. Sistem tidak menjumlahkan Rupiah dan kilogram menjadi satu nominal.

Nilai perhitungan tetap merupakan estimasi prototype dan harus disahkan otoritas syariah/BAZNAS serta pengelola Lembaga sebelum digunakan di luar evaluasi.

## 4. Domisili dan Master Wilayah

Input identitas pada form konter Operator/Amil dan Formulir Publik memakai kontrol domisili yang sama.

- **Warga daerah:** memilih RW, kemudian RT yang berada di bawah RW tersebut. Pilihan berasal dari Master Wilayah Lembaga; pengguna tidak mengetik kode RW/RT sendiri.
- **Non-daerah:** pilihan RW dan RT disembunyikan dan nilai `areaId`, `rwId`, serta `rtId` khusus Lembaga tidak disimpan pada identitas tersebut.
- Daftar RT diperbarui mengikuti RW yang dipilih. Relasi RW/RT divalidasi terhadap Lembaga aktif.
- Bila Master Wilayah belum disiapkan Admin, pilihan Warga daerah tidak dapat dipakai. Warga luar daerah masih dapat memilih Non-daerah.
- Muzakki yang sudah login tetap memakai alamat/domisiIi per Lembaga melalui membership Layanan Mandiri.

Validasi ini berjalan di sisi browser prototype. Pada produksi, ID daerah/RW/RT harus divalidasi kembali oleh API agar tidak dapat dimanipulasi dari browser.

## 5. Format nominal

Semua kolom nominal Rupiah pada modul transaksi menggunakan teks terformat dan pemisah ribuan titik sesuai lokal Indonesia.

| Jenis nilai | Contoh input/tampilan | Aturan |
|---|---|---|
| Rupiah | `1.250.000` | Titik setiap tiga digit; tidak memakai pecahan Rupiah |
| Beras | `2,5` kg | Koma sebagai tanda desimal, sampai tiga angka pecahan |
| Dasar harta Maal/Profesi | `100.000.000` | Mengikuti format Rupiah |

Parser kalkulasi mengubah string terformat menjadi angka sebelum menghitung. Struk, ringkasan, dan pratinjau selalu menggunakan formatter Indonesia agar angka yang dibaca konsisten dengan angka yang tersimpan pada model transaksi.

## 6. Konfirmasi kelebihan pembayaran

Satu dialog bersama dipakai oleh ketiga kanal input. Untuk kategori yang mendukung pemisahan kelebihan (Fitrah, Maal, dan Profesi):

- Jika kotak **Pisahkan kelebihan pembayaran sebagai Infak/Sedekah** dicentang pada baris, nilai kewajiban dicatat pada kategori asal dan sisanya dibuat sebagai rincian Infak/Sedekah dengan media yang sama.
- Jika tidak dicentang dan jumlah dibayar melebihi estimasi kewajiban, dialog konfirmasi muncul sebelum transaksi disimpan.
- Pilihan untuk memisahkan kelebihan mengaktifkan pilihan tersebut pada baris terkait; pilihan untuk tetap mencatat sesuai kategori menyimpan nominal seperti yang diinput; pilihan kembali membatalkan proses simpan agar pengguna dapat memeriksa form.
- Fidyah dan Kafarat tidak otomatis dialihkan karena perlakuan kelebihannya memerlukan ketentuan khusus.

Konfirmasi tidak mengesahkan pembayaran. Seluruh transaksi tetap berstatus `pending` sampai petugas Amil menyelesaikan pemeriksaan dan penerimaan fisik sesuai alur operasional.

## 7. Struk yang seragam

Satu sumber data/aturan struk menghasilkan pratinjau, cetak/simpan PDF melalui dialog cetak browser, gambar PNG, dan tampilan cetak thermal 80 mm. Versi thermal menggunakan layout satu kolom bergaya POS dengan font monospace, header rata tengah, metadata dan nilai sejajar, pemisah ASCII, rincian pembayaran yang ringkas, total rata kanan, dan QR sekitar 30 mm. Lebar konten thermal 74 mm untuk kertas 80 mm. Format PDF tetap menggunakan layout dokumen biasa, tetapi seluruh fakta transaksi dan token QR-nya sama. Renderer dipakai untuk transaksi yang berasal dari:

- Input petugas Operator/Amil.
- Layanan Mandiri Muzakki.
- Formulir Publik.

Struk menampilkan identitas dan nama Lembaga, nomor dan ID transaksi, tanggal, nama Muzakki, sumber input, status, batas waktu QR, setiap rincian jenis/media, jumlah dan satuan bila relevan, dasar perhitungan harta jika ada, total uang, total beras, dan QR selama transaksi masih aktif. Jika transaksi batal/kedaluwarsa/ditolak, QR aktif tidak ditampilkan dan struk menjadi catatan arsip.

Struk berstatus Pending diberi label **STRUK RENCANA ZAKAT · SIMULASI**, bukan bukti pembayaran resmi. Bukti setor hanya dapat diterbitkan setelah proses penerimaan dan verifikasi Amil yang berlaku.

Pada thermal, rincian panjang dapat membungkus ke baris berikutnya tanpa menghilangkan nilai atau satuan. Footer menjelaskan apakah dokumen adalah struk rencana atau bukti setor simulasi. Cetak thermal dijalankan melalui dialog cetak browser dengan CSS yang meniru tata letak POS/ESC-POS; prototype belum mengirim byte/perintah ESC/POS langsung, sehingga pilihan kertas 80 mm, densitas, pemotongan kertas, dan dukungan QR tetap mengikuti driver printer yang digunakan.

## 8. Aturan transaksi dan batas prototype

- Satu transaksi gabungan memiliki satu serial dan satu QR; setiap rincian kategori/media berada di array `lines`.
- Satu orang dibatasi satu transaksi aktif per Lembaga/periode sesuai aturan prototype yang sedang berlaku. Beberapa kategori pembayaran digabung sebagai baris dalam transaksi yang sama, bukan dibuatkan transaksi aktif terpisah.
- Operator hanya mencatat rencana transaksi; Amil memeriksa QR, akad, uang/beras yang diterima, lalu mengesahkan sesuai alur.
- Formulir Publik membutuhkan OTP demo; OTP tidak dikirim ke WhatsApp/SMS/email dan tidak membuktikan kepemilikan kontak.
- Penyimpanan memakai `localStorage`, sehingga transaksi publik tidak muncul otomatis pada HP warga lain atau perangkat petugas yang berbeda.
- Tidak ada backend, database server, penguncian transaksi atomik, maupun otorisasi server. Manipulasi browser masih mungkin.

## 9. Kebutuhan sebelum produksi

1. **Sumber data bersama:** API dan database relasional untuk Lembaga, periode, identitas, membership, transaksi induk, dan rincian transaksi.
2. **Isolasi Lembaga:** setiap request menentukan Lembaga dari sesi/tautan tervalidasi di server; jangan mempercayai `tenantId` dari payload browser.
3. **Validasi server:** schema, jumlah baris maksimal, jenis/media yang diizinkan, tarif, kuantitas, status domisili, relasi Master Wilayah, nominal, serta formula dihitung ulang di server.
4. **Idempotensi dan anti-duplikasi:** idempotency key, unique/partial index, transaksi database atomik, dan penguncian saat dua kanal mengirim bersamaan.
5. **State machine:** server menentukan transisi Pending, diproses, Paid, setoran, batal, dan kedaluwarsa; QR harus ditandatangani atau opaque token yang diperiksa server.
6. **OTP sungguhan:** provider WhatsApp Business/SMS/email, kode sekali pakai yang di-hash server, rate limit, anti-enumeration, cooldown, audit, dan prosedur kontak bersama.
7. **Pembayaran multi-rincian:** stakeholder harus menyetujui tata buku per kategori/media, aturan split ke Infak/Sedekah, pengembalian kelebihan, settlement parsial, dan apakah seluruh baris wajib dibayar sekaligus.
8. **Bukti dan audit:** renderer server mengambil snapshot transaksi immutable; kuitansi resmi berbeda dari struk rencana. Audit append-only merekam perubahan setiap rincian.
9. **Privasi dan keamanan:** minimisasi data, pemberitahuan privasi, retensi/penghapusan, enkripsi TLS dan at-rest, RBAC server-side, MFA Admin, CSP, monitoring, backup dan pemulihan.
10. **Pengujian pra-rilis:** uji integrasi dan concurrency untuk input lintas kanal, perubahan tarif, transaksi ganda, pembatalan vs verifikasi yang bersamaan, QR lintas Lembaga, dan ekspor/cetak struk.

Untuk Portal Publik, rujuk juga `docs/PORTAL_ZAKAT_PUBLIK_EVALUASI.md` yang berisi checklist keamanan terperinci.
