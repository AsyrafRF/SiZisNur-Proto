# Pemetaan Cakupan Prototype SiZisNur V5

Dokumen ini memisahkan apa yang dapat dicoba di prototype dari komponen yang masih memerlukan layanan produksi. `INTERAKTIF` berarti data demo lokal berubah ketika aksi dijalankan. `SIMULASI` berarti alur divisualisasikan tetapi layanan eksternal belum berjalan. `BELUM` berarti integrasi atau pengesahan belum disediakan.

| Area | Status prototype | Yang dapat diuji | Yang belum menjadi layanan produksi |
|---|---|---|---|
| Actor dan akses | INTERAKTIF + SIMULASI | Tujuh role, menu dan aksi per role, batas akses UI, persetujuan Pengurus | Otorisasi server, MFA, password/OTP, audit izin dan pembatasan API |
| Admin dan master | INTERAKTIF | Akun demo, role, tenant, periode, tarif, parameter, pendataan dan verifikasi Mustahik | Persetujuan platform sesungguhnya, versioning master bertanda tangan dan isolasi server |
| Muzakki | INTERAKTIF + SIMULASI | Self-registration, multi-tenant, profil, Daerah/RT, keluarga, kalkulator, satu transaksi aktif per tenant/periode, QR dan riwayat | Verifikasi kontak OTP, autentikasi, pengelolaan persetujuan privasi dan sinkronisasi multi-device |
| Operator | INTERAKTIF | Walk-in, identitas Muzakki, nominal berformat IDR/kg, transaksi Pending dan QR | Integrasi loket dan printer khusus yang tervalidasi |
| Amil | INTERAKTIF + SIMULASI | Buka/tutup shift, scan QR, ringkasan akad, verifikasi pembayaran, BSZ, cetak thermal | Validasi akad oleh otoritas agama, perangkat kasir dan printer tersertifikasi |
| Bendahara | INTERAKTIF + SIMULASI | Berita acara shift tertutup, kas aktual, rekening/logistik tahap dua, selisih, jurnal uang/beras, koreksi, alokasi dan batch | Bank feed, rekonsiliasi otomatis rekening, approval tambahan/dual-control server dan kebijakan akuntansi final |
| Relawan | INTERAKTIF + SIMULASI | UI mobile-first, QR atau kode, batch yang ditugaskan, cegah pencatatan ganda | Bukti tanda tangan digital, foto/GPS, mode konflik offline terjamin |
| Pengurus | INTERAKTIF + SIMULASI | Baca laporan, transaksi, kas, jurnal, koreksi, audit dan menyetujui program penyaluran | E-signature sah, dasbor lintas tenant terpusat dan notifikasi approval |
| Mustahik | INTERAKTIF + SIMULASI | Form survei, status dan formula sesuai workbook, QR penerima | Validasi lapangan, penetapan kebijakan final, verifikasi identitas dan persetujuan data |
| Dashboard | INTERAKTIF | Grafik kategori, filter, ringkasan uang dan beras terpisah | Live update lintas perangkat, analitik produksi dan kontrol kualitas data |
| Rekonsiliasi multi-tahap | INTERAKTIF + SIMULASI | Tahap 1 uang/beras fisik, tahap 2 rekening/logistik, selisih beralasan, koreksi dan hash audit | Bank API, kontrol approval di server, immutable log, backup dan rekonsiliasi eksternal |
| Alokasi dan batch | INTERAKTIF + SIMULASI | Workbook Tahap 1/2, draf fleksibel, approval Pengurus, batch bertahap dan distribusi | Kebijakan prioritas dan formula bantuan yang disahkan stakeholder |
| Jurnal dan laporan keuangan | INTERAKTIF + SIMULASI | Jurnal otomatis uang IDR dan persediaan kg, neraca ringkas, perubahan dana, ekspor XLSX | Bagan akun final, standar akuntansi, audit independen dan laporan resmi |
| Laporan dan UPZ | INTERAKTIF + SIMULASI | Filter periode/jenis, CSV, XLSX, cetak ke PDF, ringkasan UPZ | Pengiriman bulanan ke pusat, validasi skema dan integrasi resmi BAZNAS |
| Notifikasi | SIMULASI | Pesan lokal, status, ucapan transaksi dan kanal pilihan | Provider email/WA/SMS, template resmi, opt-out dan delivery receipts |
| Support dan feedback | INTERAKTIF + SIMULASI | Ticket bantuan/bug/feedback tersimpan lokal | Monitoring eksternal, SLA, notifikasi dan manajemen insiden |
| Offline-first | INTERAKTIF + SIMULASI | Cache shell PWA dan antrean perubahan pada browser | Backend sync, resolusi konflik, enkripsi lokal, autentikasi ulang dan jaminan transaksi offline |
| Audit | INTERAKTIF + SIMULASI | Rantai SHA-256, pemeriksaan konsistensi, log per tenant | Append-only server, digital signature, WORM, backup terpisah dan audit independen |
| Privasi dan legal | DOKUMENTASI | Checklist kesiapan rilis dan catatan risiko di halaman Evaluasi Prototype | Penilaian dampak privasi, perjanjian pemrosesan data, tinjauan hukum dan persetujuan BAZNAS |

## Aturan operasional yang sudah dimodelkan

1. Semua transaksi dari Muzakki dan Operator dimulai pada status `Pending`.
2. Hanya Amil yang dapat memvalidasi transaksi setelah shift dibuka, QR sesuai tenant, pembayaran fisik diterima, dan akad dikonfirmasi.
3. Masa berlaku transaksi Pending adalah 24 jam atau sampai periode ditutup.
4. Satu akun Muzakki dapat terhubung dengan beberapa tenant, namun hanya satu transaksi aktif per tenant per periode.
5. Tenant hanya dapat memeriksa QR transaksi yang berasal dari tenant itu sendiri.
6. Operator tidak mempunyai wewenang menerima uang atau mengesahkan transaksi. Amil dapat melakukan input konter sebagai fungsi tambahan.
7. Serah terima Bendahara hanya dapat dimulai setelah shift Amil ditutup.
8. Rekonsiliasi saldo fleksibel mensyaratkan transaksi sudah selesai pada tahap rekening/logistik. Draf dan alokasi aktif mengurangi saldo yang tersedia.
9. Pengurus mendapat akses baca dan kewenangan persetujuan program alokasi. Pengurus tidak dapat mengubah transaksi, kas, jurnal, maupun master data.
10. Relawan hanya dapat mencatat penerima yang termasuk batch tugasnya. Pencatatan penerima pada alokasi yang sama dicegah jika sudah ada distribusi.
11. Koreksi transaksi memakai mekanisme permintaan dan keputusan Bendahara. Data transaksi sumber tidak ditimpa.
12. Nilai uang dan beras dipisahkan dengan satuan `Rp` dan `kg`, termasuk pada jurnal.

## Keputusan yang masih memerlukan stakeholder

- Apakah satu transaksi Muzakki per periode dapat berisi banyak kategori zakat atau perlu transaksi terpisah.
- Bagaimana prosedur klaim transaksi Walk-in ke akun baru setelah nomor HP atau email berhasil diverifikasi. Prototype tidak menautkan histori secara otomatis karena OTP belum tersedia.
- Apakah expiry Pending tetap 24 jam, mengikuti batas akhir periode, atau kebijakan lain.
- Formula alokasi fleksibel, kriteria prioritas, dan distribusi tahap sebelum hari raya.
- Perlakuan saldo agregat Tahap 2 workbook senilai Rp37.500 dan 13,04 paket.
- Validasi formula mustahik dan perbedaan nilai cache/formula row 16 pada workbook sumber.
- Struktur bagan akun untuk zakat, infak, sedekah, fidyah, kafarat, beras, dana terikat dan biaya.
- Format data serta otorisasi integrasi laporan bulanan BAZNAS/UPZ.
- Provider notifikasi, persetujuan kontak, dan ketentuan berhenti berlangganan.
- API, autentikasi, sinkronisasi offline, resolusi konflik, keamanan perangkat, retensi dan pemulihan data.
- Validasi lafaz akad, niat, doa, nisab dan tarif oleh pihak yang berwenang.

## Workbook 1447H/2026M

Prototype mempertahankan dataset 129 Mustahik sintetis dengan komposisi cache 21 Fakir, 103 Miskin, dan 5 Mualaf. Hitung ulang formula row 16 menghasilkan distribusi berbeda yaitu 21 Fakir, 102 Miskin, 1 Cukup Layak, dan 5 Mualaf. Perbedaan ini ditampilkan sebagai isu validasi, bukan diubah otomatis.

Tahap 1 dan Tahap 2 tetap disediakan sesuai workbook. Total yang diuji untuk alokasi dua tahap adalah Rp148.287.500 dan 1.882,6 kg. Saldo agregat Rp37.500 dan 13,04 paket tetap ditampilkan terpisah dan tidak dialokasikan ke individu.

## Standar kesiapan rilis

Sebelum go-live, tim perlu melakukan threat modeling, secure SDLC, kontrol akses server-side, MFA untuk role kritis, validasi input, enkripsi saat transit dan tersimpan, audit append-only, backup terpisah, uji pemulihan, logging terpantau, privacy impact assessment, pengujian aksesibilitas, uji beban dan UAT. Tinjau ketentuan pengelolaan zakat dan pelindungan data pribadi bersama penasihat hukum dan BAZNAS.
