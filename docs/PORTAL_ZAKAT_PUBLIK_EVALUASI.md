# Portal Zakat Publik & Pendataan Mandiri — Evaluasi Prototype

**Status: TAHAP EVALUASI SIMULASI. BUKAN IMPLEMENTASI PRODUKSI.**  
Tanggal pembaruan: 15 November 2026

> Portal ini belum menggunakan backend standar aman produksi. Seluruh data berada pada `localStorage` browser, OTP dibuat dan ditampilkan pada halaman yang sama, dan tautan/QR tidak menyinkronkan data ant perangkat. Tidak ada OTP sungguhan yang dikirim ke WhatsApp, SMS, atau email. Gunakan data sintetis saja; jangan masukkan data warga, kontak, alamat, ataupun transaksi nyata. Fitur ini tidak menerima atau memproses pembayaran uang/beras sungguhan.

## 1. Tujuan dan ruang lingkup

Portal Zakat Publik memungkinkan warga membuka formulir khusus satu Lembaga tanpa membuat akun dan tanpa login Muzakki. Tautan dapat dibagikan petugas melalui WhatsApp atau dicetak sebagai QR pada banner/meja pelayanan masjid. Formulir membuat identitas Muzakki lokal dan rencana transaksi berstatus `pending` di dataset prototype lembaga terkait.

Fitur ini menyatukan tiga jalur input pada model data transaksi yang sama:

1. Input konter oleh Operator/Amil melalui menu operasional yang sudah ada.
2. Input mandiri dari tautan publik yang dibagikan kepada warga.
3. Input mandiri di lokasi melalui QR banner yang menuju tautan publik lembaga.

QR formulir publik dan QR transaksi adalah dua artefak berbeda. QR formulir hanya membuka formulir tenant; QR transaksi mewakili satu rencana transaksi.

## 2. Penanda evaluasi yang wajib terlihat

Penanda berikut tampil pada halaman manajemen, halaman publik, banner cetak, dan bukti transaksi:

- `TAHAP EVALUASI SIMULASI`.
- Belum menggunakan backend standar aman produksi.
- OTP hanya dibuat dan ditampilkan di browser; tidak ada WhatsApp/SMS/email sungguhan.
- Data tersimpan lokal pada browser dan tidak dibagikan ant perangkat.
- Bukti yang dibuat adalah struk rencana simulasi, bukan bukti pembayaran resmi.
- Dilarang memasukkan data pribadi atau transaksi nyata.

Penanda ini tidak boleh dihapus dari build evaluasi atau disembunyikan ketika tautan dipakai pada banner demo.

## 3. Pengelolaan tautan oleh petugas

Menu: **Formulir Publik & QR Warga**.

Role yang dapat membuka dan mengelola menu pada prototype:

- Admin lembaga.
- Amil.
- Operator.

Bendahara, Relawan, Pengurus, dan Muzakki tidak mendapat akses pengelolaan tautan.

Petugas dapat:

1. Menerbitkan tautan bila lembaga aktif dan memiliki periode zakat aktif.
2. Melihat daftar tautan, periode, waktu penerbitan, dan status.
3. Menyalin tautan.
4. Membuka tautan WhatsApp dengan pesan siap dibagikan.
5. Mencetak banner QR.
6. Melihat pratinjau halaman publik.
7. Mencabut tautan; tautan yang dicabut tidak dapat membuka formulir.

Tautan terikat pada satu `tenantId` dan `periodId` pada saat diterbitkan. Halaman publik menolak tautan bila token tidak ditemukan, dicabut, lembaga tidak aktif, portal publik dinonaktifkan, atau periode yang ditautkan bukan lagi periode aktif. Periode baru memerlukan tautan baru.

Token demo dibuat memakai `crypto.getRandomValues` di browser dan disimpan sebagai nilai biasa pada database lokal prototype. Token ini hanya cukup untuk demonstrasi opaque-link; ia bukan credential produksi, belum di-hash di server, dan tidak membuktikan keamanan akses.

## 4. Alur warga

### Langkah 1 — Identitas

- Nama lengkap: wajib.
- Nomor HP/WhatsApp: wajib.
- Email: opsional, kecuali jika dipilih sebagai kanal OTP simulasi.
- Alamat lengkap: wajib pada prototype.
- Domisili: warga daerah lembaga atau dari luar daerah.
- Persetujuan: warga harus mencentang bahwa ia memahami batas simulasi dan tidak menggunakan data nyata.

### Langkah 2 — OTP simulasi

- OTP 6 digit dihasilkan lokal menggunakan Web Crypto bila tersedia.
- OTP ditampilkan langsung pada halaman dengan label `KODE OTP DEMO — TIDAK DIKIRIM KE WHATSAPP / EMAIL`.
- Kode berlaku 5 menit dan maksimal 5 kali percobaan.
- Sesi setelah verifikasi berlaku 10 menit pada memori halaman.
- Ubah data atau mulai ulang mengharuskan pembuatan kode baru.

Ini hanya simulasi antarmuka. OTP tidak membuktikan penguasaan kontak pada perangkat lain karena penerima dan kode berada di browser yang sama.

### Langkah 3 — Pemeriksaan identitas dan transaksi

Setelah OTP demo dianggap benar, aplikasi mencari identitas hanya pada `tenantId` dan periode terkait. Pencocokan dilakukan pada kontak sesuai kanal verifikasi, dinormalisasi, serta nama yang harus cocok dengan identitas tersimpan.

Kasus ambigu dihentikan dan diarahkan ke petugas, antara lain:

- satu kontak terhubung ke beberapa identitas;
- nomor HP dan email mengarah ke orang berbeda;
- kontak ditemukan tetapi nama tidak cocok.

Aplikasi tidak otomatis menggabungkan dua data hanya karena nomor HP/email sama. Ini penting karena satu nomor dapat dipakai bersama oleh anggota keluarga.

### Langkah 4 — Transaksi

Jika tidak ada rencana yang masih belum diselesaikan, warga dapat mengisi formulir zakat dan kalkulator berdasarkan tarif lembaga. Daftar yang tersedia mengikuti kalkulator prototype: Zakat Fitrah, Zakat Maal, Zakat Profesi, Fidyah, Kafarat, dan Infak/Sedekah.

Transaksi disimpan dengan:

- `source: public-intake`;
- `tenantId` dan `periodId` dari tautan;
- `personId` hasil identitas atau person baru;
- `status: pending`;
- nomor transaksi dengan awalan `PU-`;
- waktu kedaluwarsa demo 24 jam;
- kontak dan kanal OTP simulasi yang digunakan.

Transaksi muncul pada daftar transaksi lembaga yang sama sehingga petugas dapat melanjutkan pemeriksaan QR, penerimaan fisik, akad, dan verifikasi memakai alur operasional yang sudah tersedia.

## 5. Deteksi transaksi yang sudah ada

Setelah verifikasi kontak simulasi, pencarian dibatasi pada tenant dan periode tautan. Status `pending` dan `tercatat` diperlakukan sebagai transaksi belum selesai yang menghalangi pembuatan transaksi baru. Halaman memperlihatkan transaksi yang ditemukan dan membuka bukti/QR.

Status yang sudah disahkan Amil/diteruskan ke Bendahara/selesai rekonsiliasi tidak dianggap sebagai transaksi unpaid. Riwayat transaksi tersebut ditampilkan pada bagian riwayat; warga dapat melanjutkan formulir baru sesuai aturan prototype. Di produksi, kebijakan bisnis perlu diputuskan apakah transaksi baru boleh dibuat setelah pembayaran sebelumnya selesai.

## 6. Pembatalan publik

Pembatalan bukan penghapusan. Pada prototype, pembatalan dapat dilakukan hanya bila seluruh syarat berikut dipenuhi:

- transaksi milik `personId` hasil sesi kontak yang telah diverifikasi;
- `tenantId` cocok dengan tautan yang dibuka;
- sumber transaksi `public-intake` atau `self-service`;
- status tepat `pending`;
- belum memiliki penanda `verifiedAt`, `verifiedBy`, `handledBy`, `operatorId`, `assignedAmilId`, `shiftId`, atau `depositId`;
- belum tercantum pada berita acara/setoran;
- belum kedaluwarsa;
- alasan pembatalan minimal 5 karakter dan konfirmasi dicentang.

Jika memenuhi syarat, status menjadi `batal`; alasan, waktu, kanal, dan event audit disimpan. QR transaksi batal tidak ditampilkan lagi sebagai QR aktif. Status `paid`, `disetor`, `kas_diterima`, `terverifikasi`, atau transaksi yang sudah diproses petugas tidak dapat dibatalkan dari Portal Publik.

Pemeriksaan pada browser hanya simulasi. Produksi harus mengulang seluruh pemeriksaan secara atomik di backend, bukan mempercayai nilai yang dikirim browser.

## 7. Batasan prototype yang harus dipahami

| Area | Kondisi simulasi | Konsekuensi |
|---|---|---|
| Database | `localStorage` pada satu browser | Perangkat warga tidak tersinkron ke perangkat petugas |
| Tautan/QR | Token dicatat pada data lokal | QR yang dibuka di perangkat lain biasanya tidak menemukan data tautannya |
| OTP | Kode dibuat dan ditampilkan di halaman | Tidak ada verifikasi nomor/email sungguhan |
| Pencarian identitas | Query pada dataset lokal | Bukan pemeriksaan identitas resmi |
| Anti-duplikasi | Validasi JavaScript lokal | Tidak tahan race condition antar perangkat |
| Pembatalan | Mutasi object lokal dan audit demo | Tidak tahan manipulasi DevTools atau perubahan data browser |
| Bukti | QR/struk dihasilkan sisi browser | Bukan kuitansi resmi, bukan bukti uang/beras diterima |
| Pembayaran | Tidak ada payment gateway/bank | Tidak ada dana sungguhan yang diterima |
| Audit | Record pada localStorage | Dapat diubah oleh pemilik browser |
| Offline | Shell aplikasi dapat di-cache | Tidak ada sinkronisasi transaksi cloud |

**Cara mengevaluasi di satu perangkat:** login sebagai Admin/Amil/Operator, terbitkan tautan, buka pratinjau pada browser yang sama, isi data sintetis, gunakan OTP yang ditampilkan, buat transaksi, kemudian buka menu transaksi sebagai petugas (tetap pada browser dan dataset yang sama). Untuk meniru perpindahan warga ke petugas, salin link dan buka tab lain pada profil browser yang sama. Jangan menganggap ini uji lintas perangkat.

## 8. Persyaratan keamanan dan arsitektur produksi

Semua item berikut merupakan pekerjaan sebelum Portal Zakat Publik boleh dipakai warga secara nyata.

### 8.1 Backend, database, dan isolasi tenant

- Sediakan API backend dan database relasional bersama (misalnya PostgreSQL) dengan transaksi ACID.
- Semua operasi publik menggunakan HTTPS.
- Tenant ditentukan dari token tautan yang diverifikasi server; jangan mempercayai `tenantId` dari payload browser.
- Terapkan tenant scoping pada setiap query serta Row-Level Security bila sesuai arsitektur.
- Pastikan primary/foreign key dan relasi transaksi, person, periode, dan tenant diverifikasi server.
- Tidak boleh menyertakan data tenant lain pada response publik, error, log, export, maupun cache.
- Jangan meletakkan secret, API key provider, signing key, atau database credential di JavaScript/browser.
- Tentukan sumber kebenaran untuk periode aktif, status lembaga, tarif, dan status transaksi pada server.

### 8.2 Token tautan publik dan QR formulir

- Gunakan CSPRNG sisi server dengan entropi minimal 256 bit untuk token opaque.
- Simpan hash token di database; jangan menyimpan token mentah bila tidak diperlukan.
- Token tidak memuat nama, nomor HP, email, alamat, ID transaksi, atau informasi pribadi.
- Tautan memiliki status aktif/dicabut, masa berlaku, tanggal penerbitan, pencabut, dan rotasi token.
- Sediakan tombol cabut dan terbitkan ulang; cabut token lama secara server-side.
- Batasi permission token hanya untuk form publik pada satu tenant dan periode, bukan akses umum ke API tenant.
- Atur kebijakan referrer, query logging, dan analytics agar token tidak bocor melalui log, pihak ketiga, screenshot, atau URL referer.
- QR banner harus dapat diuji dan dicabut; sertakan identitas lembaga yang mudah dikenali tanpa menampilkan PII.

### 8.3 OTP dan verifikasi kontak

- Integrasikan provider WhatsApp Business/SMS/email yang sah; pengiriman dan validasi dilakukan melalui server.
- OTP dibuat dengan CSPRNG pada server, di-hash saat disimpan, sekali pakai, maksimum 5 menit, dan terikat pada tujuan, kontak, tenant, serta sesi.
- Terapkan batas kirim/resend, batas percobaan, cooldown, lockout adaptif, deteksi otomatisasi, dan rate limit per IP, nomor, email, token, serta perangkat.
- Jangan mengembalikan OTP pada response API; jangan menulis OTP atau isi lengkap pesan ke log.
- Pesan error tidak boleh membocorkan apakah nomor/email telah terdaftar (anti-enumeration).
- Gunakan idempotency untuk permintaan kirim ulang dan kendalikan biaya/provider abuse.
- OTP hanya membuktikan akses ke kontak, bukan identitas hukum atau kepemilikan tunggal nomor yang dipakai keluarga. Kasus kontak bersama/duplikat harus mempunyai verifikasi tambahan oleh petugas.
- Siapkan proses kegagalan provider, delivery status, retry aman, dan kanal alternatif yang tidak melemahkan pemeriksaan.

### 8.4 Identitas, privasi, dan persetujuan

- Tentukan data yang benar-benar diperlukan; minimalkan data dan hindari meminta data sensitif tanpa dasar yang jelas.
- Berikan pemberitahuan privasi sebelum pengiriman: pengendali data, tujuan, dasar pemrosesan, kategori data, masa simpan, penerima data, hak subjek, dan kontak pengaduan.
- Rekam versi pemberitahuan/persetujuan, timestamp, sumber, dan tindakan pengguna sesuai dasar pemrosesan yang telah ditetapkan penasihat hukum.
- Tentukan retensi untuk form gagal, OTP, identitas, transaksi batal/kedaluwarsa, bukti, dan audit; lakukan penghapusan atau anonimisasi sesuai kebijakan.
- Enkripsi koneksi dengan TLS; enkripsi data sensitif saat tersimpan dan kelola kunci terpisah dari database.
- Redaksi nomor HP/email/alamat pada log, telemetry, error report, dan dashboard yang tidak membutuhkan detail.
- Sediakan prosedur koreksi, akses, ekspor, dan penghapusan data sesuai ketentuan pelindungan data yang berlaku.
- Lakukan tinjauan hukum dan privasi sebelum publikasi, termasuk UU Pelindungan Data Pribadi dan aturan terkait pengelolaan zakat.

### 8.5 Pencocokan identitas dan anti-duplikasi

- Cocokkan berdasarkan tenant dan periode; tetapkan algoritma normalisasi nomor Indonesia/email dan aturan perubahan kontak.
- Jangan menggabungkan person otomatis hanya berdasarkan nomor HP; nomor keluarga bersama harus dapat ditangani.
- Bila lebih dari satu person cocok, nama tidak cocok, atau email/HP mengarah ke orang berbeda, hentikan alur mandiri dan buat tugas verifikasi petugas tanpa membocorkan data lain.
- Terapkan unique/partial index atau mekanisme lock transaksi untuk mencegah lebih dari satu transaksi terbuka untuk kunci bisnis yang disepakati (tenant, periode, person/account, jenis aturan bila diperlukan).
- Periksa status transaksi pada server tepat sebelum insert.
- Gunakan idempotency key untuk mencegah double-submit akibat klik berulang, jaringan terputus, refresh, atau retry.
- Tetapkan kebijakan bisnis bila satu orang ingin membayar beberapa jenis zakat dalam satu periode: satu bundel multi-line atau beberapa transaksi terpisah.

### 8.6 State machine transaksi, QR transaksi, dan bukti

- Tetapkan state machine yang eksplisit dan tervalidasi server: dibuat/pending, diproses, paid, disetor, rekonsiliasi, terverifikasi, batal, kedaluwarsa, ditolak, serta aturan transisinya.
- Hanya actor yang berwenang yang dapat memindahkan status; publik tidak dapat mengubah `paid` atau mengesahkan penerimaan.
- QR transaksi membawa identifier opaque/signed token tanpa PII; verifikasi harus memeriksa tenant, serial, status, masa berlaku, dan signature di server.
- Gunakan HMAC atau tanda tangan digital dengan key yang disimpan server untuk QR yang perlu diverifikasi offline/antar sistem; tetapkan rotasi key.
- Struk rencana harus jelas berbeda dari kuitansi pembayaran. Kuitansi resmi hanya dibuat setelah proses penerimaan dan verifikasi yang ditetapkan lembaga selesai.
- QR transaksi batal/kedaluwarsa/terpakai harus ditolak server, bukan sekadar disembunyikan oleh UI.

### 8.7 Pembatalan atomik dan audit

- Endpoint pembatalan harus mengunci row atau menggunakan compare-and-swap/version agar tidak bentrok dengan verifikasi Amil.
- Backend memeriksa tenant, person, source, status, expiry, actor, shift, setoran, dan setiap penanda proses panitia pada saat yang sama dengan update status.
- Bila Amil memproses transaksi lebih dahulu, pembatalan publik harus gagal; bila pembatalan lebih dahulu, Amil tidak boleh mengesahkan QR lama.
- Simpan alasan, waktu server, pihak, channel, request ID, versi state, serta hasil keputusan pada audit append-only.
- Jangan menghapus transaksi asal; koreksi/pembatalan harus menjadi event yang dapat ditelusuri.
- Audit harus memiliki kontrol akses, integrity protection, retensi, monitoring, serta backup terpisah.

### 8.8 Proteksi aplikasi dan infrastruktur

- Gunakan secure session cookie `HttpOnly`, `Secure`, `SameSite` atau pola token yang sesuai threat model; jangan simpan session produksi di `localStorage`.
- Terapkan CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, proteksi clickjacking, CORS allowlist, dan CSRF control bila menggunakan cookie.
- Validasi schema dan batas ukuran semua input di server; encode output, cegah XSS, SQL injection, SSRF, path traversal, mass assignment, dan insecure direct object reference.
- Gunakan CAPTCHA/bot management yang ramah warga, rate limiting, WAF, monitoring pola request, dan proteksi denial-of-wallet pada OTP.
- Terapkan MFA untuk Admin lembaga dan Root; role dan kewenangan diperiksa pada setiap API, bukan hanya menu.
- Terapkan least privilege, pemisahan tugas, dan audit perubahan role/tautan/tarif/periode.
- Kelola secret di secret manager; lakukan rotasi dan pencabutan kredensial vendor.
- Siapkan backup terenkripsi, pemulihan berkala, rencana insiden, notifikasi pelanggaran data, pemantauan, dan disaster recovery.

### 8.9 Uji pra-produksi dan operasi

- Threat modeling serta security review berdasarkan alur warga, petugas, tenant, provider OTP, QR, dan transaksi.
- Unit/integration tests untuk tenant isolation, OTP abuse, duplicate concurrency, state transition, pembatalan race, token revoke, dan akses lintas person.
- Penetration test eksternal dan pengujian OWASP ASVS/Top 10 yang relevan.
- Uji perangkat Android/iOS, browser, aksesibilitas, jaringan lambat/putus, provider OTP gagal, dan beban puncak Ramadan.
- UAT bersama Admin, Amil, Operator, Bendahara, Pengurus, dan warga.
- Tetapkan SOP antrian lapangan, verifikasi fisik, fallback manual, pelatihan, serta prosedur saat koneksi/provider down.
- Tetapkan pemilik proses, SLA, helpdesk, monitoring, dan respons insiden.

## 9. Checklist gate sebelum produksi

- [ ] Backend dan database bersama tersedia dan diuji.
- [ ] Isolasi tenant ditetapkan dan telah diuji.
- [ ] Token tautan opaque di-hash di server, dapat dicabut, dan kedaluwarsa.
- [ ] Provider OTP sungguhan terintegrasi dan anti-abuse aktif.
- [ ] Kebijakan pencocokan identitas dan keluarga dengan kontak bersama disetujui.
- [ ] Pencegahan duplikasi atomik dan idempotency aktif.
- [ ] State machine dan aturan pembatalan diverifikasi backend.
- [ ] QR transaksi ditandatangani/diotorisasi server dan tidak memuat PII.
- [ ] Bukti rencana dibedakan dari kuitansi pembayaran resmi.
- [ ] Privasi, retensi, persetujuan, dan prosedur hak subjek disahkan.
- [ ] Enkripsi, session hardening, WAF/rate limit, audit, monitoring, backup, dan incident response siap.
- [ ] Threat modeling, code review, penetration test, UAT, dan persetujuan stakeholder selesai.

## 10. Pengujian prototype

Tes otomatis: `node tests/public-intake.test.cjs`.

Tes tersebut mencakup:

- role pengelola tautan Admin/Amil/Operator dan penolakan Bendahara;
- penerbitan token, binding tenant/periode, tampilan QR dan halaman manager;
- akses form tanpa login dan penanda simulasi;
- data warga tidak terekspos sebelum verifikasi OTP;
- OTP demo dan sesi kontak;
- pembuatan identitas dan transaksi Pending tenant-scoped;
- deteksi transaksi unpaid dan blokir duplikasi;
- akses bukti dan pembatalan yang memenuhi syarat;
- larangan pembatalan setelah diproses petugas atau berstatus Paid;
- riwayat Paid tidak memblokir rencana baru;
- pencabutan tautan dan isolasi data lintas tenant.

Tes ini menggunakan mock browser Node dan tidak menguji pengiriman OTP/provider, perangkat lain, backend, produksi, atau keamanan nyata.
