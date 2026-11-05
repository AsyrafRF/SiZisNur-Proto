# Implementasi Workbook Resmi 1447H/2026M ke SiZisNur V3

## Prinsip implementasi

V3 mengambil aturan dan angka agregat dari workbook **01. REKAPITULASI DATA ZAKAT 1447H_2026M R1 (Resmi - Tervalidasi)**. Identitas pribadi warga, nomor kontak, NIK, alamat, dan nama amil dari workbook tidak disalin ke prototype. Dataset uji mustahik dibuat sintetis dengan komposisi agregat yang sama.

Rumus atau saldo yang tidak jelas tidak dibetulkan secara otomatis. Hal yang belum disahkan ditampilkan sebagai temuan/konfirmasi. Menu acuan workbook dibatasi ke tenant Masjid An-Nur; akun tenant demo lain tidak dapat melihat ringkasan workbook tersebut.

## Rekap penerimaan

| Indikator | Nilai |
|---|---:|
| Jumlah jiwa muzakki | 3.114 |
| Total blanko | 980 |
| Total uang | Rp175.240.500 |
| Zakat fitrah | Rp140.342.500 |
| Zakat maal | Rp7.395.000 |
| Zakat profesi | Rp1.375.000 |
| Fidyah | Rp7.945.000 |
| Kafarat | Rp0 |
| Infak/sedekah | Rp18.183.000 |
| Beras zakat | 1.882,6 kg |
| Beras infaq | 71,5 kg |
| Total beras Summary2 | 1.954,1 kg |

### Rekap menurut tab input

| Tab | Jiwa | Uang | Blanko |
|---|---:|---:|---:|
| ARIS | 440 | Rp22.212.000 | 138 |
| HAFIZ | 644 | Rp39.389.000 | 199 |
| AZIZ | 994 | Rp61.129.000 | 307 |
| ZAKI | 1.036 | Rp52.510.500 | 336 |

## Mustahik: formula yang diterapkan

Master sheet `LIST MUSTAHIK 2026` memakai kolom H–M sebagai lima faktor skor. Total O adalah jumlah U:Y.

| Faktor | Nilai input | Skor |
|---|---|---:|
| Wilayah (H) | Kosong | 0 |
| Wilayah (H) | NON RW 10 | 50 |
| Wilayah (H) | Nilai lain | 100 |
| Tempat tinggal (I) | Milik sendiri / Menumpang / Kontrakan / Kost | 25 / 50 / 75 / 100 |
| Status pernikahan (J) | Menikah / Tidak menikah / Cerai hidup / Cerai mati | 25 / 50 / 75 / 100* |
| Penghasilan (L) | NOL / <1 juta / 1–2 juta / 2–3 juta / 3–4 juta / 4–5 juta / >5 juta | 100 / 80 / 60 / 40 / 20 / 0 / 0 |
| Tanggungan (M) | 1 / 2 / 3 / teks `4 ATAU LEBIH` | 25 / 50 / 75 / 100 |

`P` (jalur Fakir/Miskin): skor 0 = kosong; skor >360 = FAKIR; skor >240 = MISKIN; selain itu = CUKUP LAYAK.

`R` (final status) mengikuti formula workbook:

- Q kosong + P FAKIR → FAKIR.
- Q kosong + P MISKIN → MISKIN.
- Q MUALAF + P MISKIN → MISKIN.
- Q MUALAF + P CUKUP LAYAK → MUALAF.
- Q kosong + P kosong → kosong.
- Kondisi lain → CUKUP LAYAK.

**Anomali formula:** baris data pertama (row 7) pada kolom W memberi skor menikah 50 dan tidak menikah 25. Formula mayoritas baris 8 dan seterusnya membaliknya (menikah 25, tidak menikah 50). V3 menggunakan formula mayoritas baris 8+ dan menampilkan anomali tersebut untuk konfirmasi.

**Perbedaan cache dan formula final:** row 16 menyimpan R=MISKIN, tetapi formula R yang terlihat pada sel akan menghasilkan CUKUP LAYAK ketika dihitung ulang (Q=MUALAF dan P=FAKIR). Menghitung ulang semua formula dengan pengecualian rumus W row 7 menghasilkan 21 Fakir, 102 Miskin, 1 Cukup Layak, dan 5 Mualaf. Rekap Summary1 tetap menggunakan 21 Fakir, 103 Miskin, 5 Mualaf. V3 mempertahankan kedua hasil sebagai referensi yang berbeda; pengurus perlu memutuskan sumber mana yang menjadi dasar daftar penerima.

**Kategori tidak lengkap:** opsi 4–5 JUTA ada pada data, tetapi formula X tidak memiliki cabang untuk kategori ini. Hasilnya mengikuti default formula 0. V3 tidak mengarang skor pengganti.

**Input tanggungan:** formula Y memberi skor 100 hanya saat nilai sel berupa teks `4 ATAU LEBIH`. Jika nilai angka `4` dimasukkan, formula mengikuti default 0. V3 menyediakan pilihan teks tersebut agar input sesuai workbook.

### Dataset mustahik demo

V3 menyediakan 129 penerima sintetis untuk menguji komposisi rekap Summary1: 21 Fakir, 103 Miskin, 5 Mualaf, 0 Cukup Layak. Tidak ada identitas warga dari workbook yang digunakan. Ini adalah komposisi yang dilaporkan/cached oleh workbook, bukan hasil hitung ulang seluruh formula.

Form V3 juga menampung No. HP dan Awal Mualaf dari `FORM SURVEY R1`; keduanya disimpan sebagai metadata form karena padanan kolom master tidak ditemukan. Master juga memuat field NIK, tempat/tanggal lahir, alamat, pekerjaan, dan catatan.

## Alokasi uang

| Asnaf | Jumlah | Tahap 1 / orang | Total Tahap 1 | Tahap 2 / orang | Total Tahap 2 |
|---|---:|---:|---:|---:|---:|
| Fakir | 21 | Rp900.000 | Rp18.900.000 | Rp1.100.000 | Rp23.100.000 |
| Miskin | 103 | Rp500.000 | Rp51.500.000 | Rp500.000 | Rp51.500.000 |
| Mualaf | 5 | Rp300.000 | Rp1.500.000 | Rp350.000 | Rp1.750.000 |
| **Total dasar** | **129** |  | **Rp71.900.000** |  | **Rp76.350.000** |

- Pool Tahap 1 pada sheet: Rp73.451.500; saldo Tahap 1 Rp1.551.500.
- Tahap 2 menambahkan saldo Rp37.500 ke total Miskin pada rekap, sehingga total uang Tahap 2 menjadi Rp76.387.500.
- Total penyaluran Summary1: **Rp148.287.500**.
- V3 menampilkan saldo Rp37.500 secara agregat dan tidak membaginya otomatis ke 103 penerima Miskin. Persetujuan rencana Tahap 1/2 dibandingkan dengan baseline agregat workbook; alokasi fleksibel biasa tetap dibandingkan dengan saldo transaksi demo. Kedua ledger tidak dicampur.

## Alokasi beras

Satu paket = **2,5 kg**.

| Asnaf | Tahap 1 paket/orang | Total Tahap 1 | Tahap 2 paket/orang | Total dasar Tahap 2 |
|---|---:|---:|---:|---:|
| Fakir | 3 | 63 | 7 | 147 |
| Miskin | 2 | 206 | 3 | 309 |
| Mualaf | 1 | 5 | 2 | 10 |
| **Total** |  | **274** |  | **466** |

- Tahap 1: 274 paket = 685 kg.
- Tahap 2: 466 paket dasar + saldo 13,04 paket = 479,04 paket = 1.197,6 kg.
- Total rekap: 753,04 paket × 2,5 kg = **1.882,6 kg**.
- `PEMBAGIAN TOTAL!P43` berisi angka manual 388 dan `P49` saldo 114; keduanya tidak ikut pada total Summary1 753,04 paket. Makna angka tersebut perlu klarifikasi.
- Summary1 memberi label beras dalam Kg, padahal angka 210 / 528,04 / 15 / 753,04 adalah paket. V3 membedakan paket dan kg.

## Bendahara dan rekonsiliasi

- BENDAHARA memiliki 55 baris setoran terisi.
- Blanko cocok: 980.
- Uang cocok: Rp175.240.500.
- Beras BENDAHARA: 1.953,5 kg; Summary2: 1.954,1 kg; selisih **0,6 kg**.
- V3 mempertahankan selisih sebagai temuan dan tidak mengoreksi angka sumber.
- Kode status AL dan FZ sama-sama muncul pada data; daftar validasi yang ditemukan hanya menjelaskan FZ. Arti AL perlu dikonfirmasi.

## Insentif amil

- Metode Q: pool Rp8.000.000 dibagi proporsional berdasarkan blanko (980 total).
- Metode R: pool Rp8.000.000 berdasarkan kehadiran (146 hari; tarif dasar = pool / 146).
- Workbook belum menyatakan apakah Q dan R merupakan alternatif atau harus digabung. V3 menampilkan keduanya terpisah dan tidak menjumlahkan.
- Nilai manual K38 Rp17.208.500 ditampilkan terpisah; tidak dicampur ke pool Q/R.
- Nama amil disamarkan menjadi label anonim pada rincian kontribusi V3.

## Organisasi dan jadwal

Empat divisi panitia:

1. Pencatatan & Penerimaan.
2. Penimbangan, Pengemasan & Penyimpanan Beras.
3. Registrasi, Pendataan & Pengamplopan Uang.
4. Distribusi & Logistik.

Empat shift konter:

- 08:00–11:00 WIB.
- 13:00–15:30 WIB.
- 16:00–18:00 WIB.
- 21:00–23:00 WIB.

Tanggal jadwal pada workbook: 5–18 Maret 2026.

## Temuan tambahan

- Tujuh formula `#REF!`.
- Satu tautan eksternal ke workbook lama.
- Tanggal campuran antara teks dan nilai tanggal.
- `FORM SURVEY R1` memiliki No. HP dan Awal Mualaf yang tidak ditemukan sebagai kolom master.
- Data batch/lembar historis tidak dihapus atau digabung otomatis.

## Batasan V3

V3 adalah prototype front-end lokal. Penyimpanan menggunakan `localStorage`, otorisasi role hanya simulasi, dan tidak ada server, enkripsi, backup terjadwal, integrasi rekening, API produksi, atau tanda tangan penerima. Rencana alokasi workbook harus diuji dan disetujui pengurus sebelum menjadi aturan operasional.


## Lembar pendukung yang belum menjadi formulir V3 terpisah

`TANDA TERIMA FORM ZAKAT`, `TT ZAKAT BENDAHARA`, `TT BERAS BENDAHARA`, `TANDA TERIMA AMIL ZAKAT`, dan `TANDA TERIMA BERAS INFAK` masih berupa template/dokumen sumber dan belum dibangun sebagai formulir cetak interaktif terpisah. `FORM ANAK YATIM` adalah template kosong tanpa data/logic terintegrasi. `FLOW 1` dan `FLOW 2` berupa gambar/shape, bukan struktur tabel. V3 saat ini memetakan alur inti penerimaan, setoran, mustahik, alokasi, distribusi, jadwal, dan insentif; lembar pendukung ini masuk daftar pengembangan lanjutan.
