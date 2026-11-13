# Matriks Implementasi Revisi Actor 14 November 2026

Dokumen ini menjadi jejak keterlacakan dari butir revisi ke modul prototype. Status **interaktif** berarti dapat dicoba menggunakan data lokal browser. Status **simulasi** berarti kanal eksternal, kewenangan hukum, atau pengamanan server belum disediakan.

| Bagian revisi | Implementasi di prototype | Modul utama | Batas yang masih ada |
|---|---|---|---|
| 6 actor inti diubah menjadi Admin, Pengurus, Operator, Amil, Bendahara, Relawan | Matriks role diperbarui. Petugas lama dimigrasikan ke akun demo Admin. | `js/revision-v5.js` | Migrasi ini hanya untuk database demo lokal. |
| Muzakki sebagai actor ketujuh | Akun self-service ditambahkan dan dapat mendaftar ke beberapa tenant. | `my-zis`, `accounts`, `muzakkiMemberships` | Verifikasi OTP dan identitas belum ada. |
| Admin mengelola sistem, master dan Mustahik | Akun, role, tenant, periode, tarif, pengaturan serta verifikasi Mustahik tersedia untuk Admin. | `users`, `tenant`, `periods`, `settings`, `mustahik` | Otorisasi harus ditegakkan ulang di server. |
| Admin tidak boleh mengubah transaksi terverifikasi | Tidak tersedia edit/hapus langsung. Koreksi harus diajukan dan diputuskan Bendahara. | `transactions`, `corrections` | Database browser masih dapat dimodifikasi langsung oleh pemilik perangkat. |
| Admin SiZisNur sebagai aktor root terpisah | Akun root memiliki `scope: platform`, tidak memiliki `tenantId`, dan disimpan di `platformAdmins`, terpisah dari `users` tenant. | `js/platform-admin.js`, `platformAdmins`, `platformSettings`, `platformAudit` | Autentikasi dan otorisasi masih demo lokal; backend wajib menegakkan isolasi root/tenant. |
| Kelola tenant dan pengajuan global | Root dapat membuat tenant + Admin awal, meninjau pengajuan publik, mengubah metadata dan status tenant. | Konsol root: Tenant, Pengajuan, Akun Tenant | Pemeriksaan legal dan onboarding nyata berada di luar prototype. |
| Pengaturan root tingkat platform | Root dapat mengatur nama/email dukungan, buka/tutup pendaftaran, status default tenant, pengumuman, dan mode pemeliharaan. | `platformSettings` | Penyebaran pengumuman dan pemblokiran sesi di sini hanya berlaku dalam browser demo. |
| Audit platform terpisah | Aksi root dicatat dalam daftar audit tersendiri, tidak tercampur dengan audit operasional tenant. | `platformAudit` | Log localStorage dapat diubah pengguna perangkat dan belum immutable. |
| Operator walk-in membuat transaksi Pending | Form konter menghasilkan transaksi Pending dan QR/struk sementara. Operator tidak memverifikasi atau menerima kas. | `transactions`, `operator-new` | Printer fisik dan integrasi perangkat perlu diuji. |
| Amil dapat merangkap fungsi Operator | Amil memperoleh fungsi input konter, tetapi Operator tidak memperoleh tindakan Amil. | `transactions`, `schedule` | Pemisahan tugas harus juga ditegakkan pada API. |
| Shift Amil, scan QR, akad, pembayaran dan BSZ | Amil membuka/tutup shift, memindai token tenant, memeriksa rincian, mengonfirmasi akad dan penerimaan fisik, lalu mengesahkan. | `schedule`, `transactions`, struk | Konfirmasi akad adalah checkbox simulasi, bukan bukti syariah atau bukti kas. |
| QR hanya sah di tenant asal | Token mengandung tenant dan transaksi. Pemeriksaan membandingkan tenant aktif. | `transactionToken`, scanner | Validasi server tetap wajib untuk mencegah pemalsuan token. |
| Pending kedaluwarsa | Pending berakhir setelah 24 jam atau saat periode ditutup. | `expirePending` | Waktu dan aturan final perlu disahkan stakeholder. |
| Satu transaksi aktif per Muzakki per tenant/periode | Guard mencegah pembuatan transaksi aktif kedua pada kombinasi akun, tenant dan periode yang sama. | `oneTxPerTenantPeriod` | Aturan multi-jenis dalam satu transaksi masih perlu keputusan. |
| Riwayat keluarga dapat digunakan kembali | Data rumah tangga disimpan per akun dan dipakai kembali pada transaksi mandiri. | `households`, `my-zis` | Akun lintas perangkat belum tersinkron. |
| Klaim transaksi Walk-in oleh akun baru | Belum diaktifkan otomatis. Pencocokan histori menunggu verifikasi kontak dan keputusan alur klaim. | `prototype` | OTP belum tersedia, sehingga transaksi lama tidak boleh ditautkan hanya berdasarkan teks nomor HP atau email. |
| Struk digital QR, PNG, PDF dan thermal | QR tampil pada struk. Aksi unduh PNG, cetak/simpan PDF, dan layout thermal tersedia. | `showReceiptV5` | PDF menggunakan print browser, bukan generator PDF server. Driver printer perlu UAT. |
| Notifikasi kepada Muzakki | Pesan terima kasih, ringkasan keluarga, nominal, tenant dan instruksi QR dicatat sebagai notifikasi lokal. | `notifications` | Email/WhatsApp tidak dikirim sampai provider dan persetujuan kontak tersedia. |
| Bendahara menerima uang/beras dari Amil | Berita acara hanya dapat dibuat setelah shift Amil ditutup. Tahap fisik mencocokkan uang dan kg. | `deposits` | Belum ada cash drawer atau timbangan terhubung. |
| Rekonsiliasi multi-tahap | Tahap kas/beras fisik terpisah dari tahap mutasi rekening/logistik. Selisih dan status tersimpan. | `deposits` | Mutasi bank belum diimpor melalui API. |
| Controlled correction dan audit trail | Permintaan koreksi terpisah, keputusan Bendahara, nilai efektif dan jurnal penyesuaian; rantai audit SHA-256. | `corrections`, `ledger`, `audit` | Hash lokal tidak immutable dan bukan tanda tangan digital. |
| Bendahara mengelola jurnal, neraca dan perubahan dana | Jurnal uang dan persediaan beras dipisah satuan IDR/kg, dengan ringkasan saldo dan perubahan dana. | `ledger` | Bagan akun dan kebijakan akuntansi belum final. |
| Alokasi fleksibel dan distribusi bertahap | Draf alokasi hanya menggunakan saldo terverifikasi. Batch dapat dibentuk bertahap setelah persetujuan Pengurus. | `allocation`, `distribution` | Pembagian rata hanya asumsi demonstrasi, bukan formula final. |
| Relawan mobile-first dan QR | Halaman Relawan mengutamakan scan atau input kode, hanya menampilkan batch tugas, dan mencegah distribusi ganda. | `distribution` | Kamera membutuhkan HTTPS/izin. Bukti foto/GPS dan tanda tangan belum disertakan. |
| Pengurus read-only | Pengurus dapat membaca laporan, transaksi, serah terima, jurnal, koreksi dan audit, serta menyetujui/menolak program alokasi. | `pageAccess`, `allocation` | Pembatasan UI bukan jaminan keamanan server. |
| Dashboard grafik interaktif dan filter | Dashboard menampilkan total uang/beras tercatat, Muzakki terdaftar, jiwa dibayarkan, penyaluran uang/beras, Status Distribusi, Transaksi Terbaru, dan alur sesuai role. Grafik enam kategori memiliki filter media Uang/Beras serta status Tercatat/Terverifikasi/Tersalurkan. | `dashboard`, `reports` | Grafik Terverifikasi bersumber dari berita acara setoran berstatus terverifikasi; distribusi tanpa rincian kategori ditandai Belum dipetakan. Data tidak live lintas perangkat. |
| Laporan PDF, XLSX dan CSV | Ekspor CSV, pembuatan XLSX, serta cetak/simpan PDF dari browser. Paket UPZ disertakan. | `reports` | Skema UPZ perlu persetujuan BAZNAS. Tidak ada pengiriman otomatis. |
| Daerah dan RT | Tenant mempunyai label Daerah. Form Muzakki memisahkan VPA dan Non VPA serta menampilkan RT untuk VPA. | `tenant`, `my-zis`, `muzakki` | Rekap wilayah masih sebatas data demo. |
| Kalkulator zakat dan BSZ pribadi | Kalkulator jenis zakat, ringkasan transaksi dan unduh/cetak bukti tersedia di akun Muzakki. | `my-zis` | Tarif dan nisab masih parameter demo. |
| Panduan sesuai role dan diagram | Setiap role mendapat panduan dengan langkah alur. Relawan mempunyai tampilan tersendiri. | `help`, `amil-guide` | Materi akad perlu ditinjau pihak berwenang sebelum layanan resmi. |
| Dalil, niat, doa dan akad Amil | Halaman Amil memuat pengingat proses, dalil, niat, doa dan ringkasan akad saat verifikasi. | `amil-guide`, `transactions` | Konten bukan fatwa dan wajib divalidasi. |
| Support dan feedback | Tiket bantuan, bug, saran, atau dugaan masalah keamanan disimpan di localStorage. | `help`, `supportTickets` | Forwarding ke monitoring memerlukan endpoint eksternal. |
| Offline dan sinkronisasi kembali | Cache shell PWA, antrean event lokal dan percobaan sync ketika online jika API base tersedia. | `service-worker.js`, `syncQueue` | Belum ada API, konflik, autentikasi, enkripsi lokal, atau jaminan transaksi offline. |
| Kesiapan privasi, keamanan dan hukum | Halaman evaluasi dan dokumen checklist menyebut kontrol yang harus dibangun sebelum rilis. | `prototype`, `LEGAL_READINESS.md` | Ini bukan audit kepatuhan atau sertifikasi. |
| Keputusan bisnis yang belum pasti | Halaman evaluasi mencatat pertanyaan aturan, saldo, UPZ, akad, notifikasi dan backend. | `prototype` | Tetap perlu keputusan stakeholder dan UAT. |

## Cakupan lintas-modul

- Semua tampilan uang menggunakan format Rupiah dan pemisah ribuan Indonesia. Beras memakai satuan kilogram.
- Data transaksi, kas, batch, distribusi, koreksi, tiket dan jurnal dibatasi menurut tenant pada alur UI.
- Perubahan penting menambahkan catatan audit dan event ke antrean sinkronisasi lokal.
- Dataset mustahik contoh tetap sintetis dan hasil workbook 1447H tidak ditimpa oleh pembaruan actor.

Akun demo root `root@sizisnur.demo` (tile **Admin SiZisNur**) tersedia pada halaman login. Lihat `ADMIN_SIZISNUR_ROOT.md` untuk cakupan konsol dan batas keamanan. Lihat `CAKUPAN_FITUR.md` untuk status interaktif/simulasi/belum, `SKENARIO_UAT.md` untuk pengujian manual, dan `LEGAL_READINESS.md` untuk checklist sebelum rilis.

### Aturan rincian kategori distribusi dashboard

Grafik penyaluran membaca `categoryBreakdown` hanya bila disimpan eksplisit pada record distribusi atau item alokasinya. Format yang didukung adalah array objek seperti `[{ category: 'Zakat Fitrah', money: 50000, rice: 0 }]` atau objek dengan `type: 'uang'|'beras'` dan `value`. Jumlah setiap kategori harus sama dengan total uang dan beras pada record distribusi. Bila rincian tidak ada, tidak lengkap, atau tidak cocok, seluruh nilai record ditampilkan sebagai **Belum dipetakan**; aplikasi tidak membagi total ke kategori berdasarkan asumsi.

