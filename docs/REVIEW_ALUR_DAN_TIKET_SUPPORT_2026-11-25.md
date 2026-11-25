# Review Alur SiZisNur dan Keputusan Implementasi Tiket Support — 25 November 2026

## 1. Konteks arsitektur yang dipertahankan

SiZisNur pada arsip ini merupakan prototype web statis berbasis HTML, CSS, dan JavaScript tanpa framework. `index.html` memuat modul secara berurutan: `app.js` sebagai inti aplikasi, `revision-v5.js` untuk alur V5, `platform-admin.js` untuk aktor root, lalu modul portal publik, pengaturan prototype, autentikasi, dan intake publik.

Database demo disimpan pada `localStorage` dengan key `sizisnur_demo_database_v5`. Modul-modul memakai bridge bersama `window.__SiZisNurBridge` untuk mengakses database, pengguna aktif, data tenant-scoped, audit, modal, render, dan persistensi. `service-worker.js` hanya menyimpan shell aplikasi; keberadaan service worker tidak berarti data database sudah menjadi cloud database.

### Pemisahan aktor

- **Tujuh role Lembaga:** Admin, Pengurus, Operator, Amil, Bendahara, Relawan, dan Muzakki. Hak akses halaman operasional ditentukan melalui matriks `PAGES`/fungsi `can()` dan data operasional dibatasi oleh `tenantId`.
- **Admin SiZisNur:** aktor platform terpisah dengan `scope: platform`, disimpan pada `platformAdmins`, tanpa `tenantId`, dan tidak dimasukkan ke `users` Lembaga. Konsol root memakai `platformSettings` dan `platformAudit` sendiri.
- **Lembaga/tenant:** tetap menggunakan identitas teknis `tenantId` dan koleksi tenant yang sudah ada. Label antarmuka menggunakan istilah Lembaga.

### Alur operasional yang tidak diubah

Pembaruan tiket tidak mengubah alur penerimaan transaksi Pending dan verifikasi Amil, masa berlaku QR dua jam, serah terima dan rekonsiliasi Bendahara, jurnal/koreksi, persetujuan alokasi oleh Pengurus, batch/penyaluran Relawan, data Mustahik, laporan, workbook 1447H, onboarding lembaga, atau Portal Publik. Tidak ada perubahan pada koleksi transaksi/ledger atau rumus bisnis zakat.

## 2. Kondisi fitur support sebelum pembaruan

Form bantuan berada di halaman **Panduan Demo** pada semua role Lembaga. Pengiriman sudah membuat record pada `supportTickets` yang menyimpan `tenantId`, `userId`, role, jenis laporan, prioritas, judul, uraian, kontak, status `baru`, dan waktu pembuatan. Event `support.created` juga masuk ke antrean sinkronisasi lokal.

Namun, belum ada inbox global untuk Admin SiZisNur, belum ada balasan, belum ada percakapan, dan tidak ada halaman riwayat tiket bagi pelapor. Akibatnya, Admin platform belum dapat meninjau tiket lintas Lembaga secara terpusat.

## 3. Keputusan desain

**Memperluas `supportTickets` yang sudah ada, bukan membuat koleksi atau alur laporan baru.** Ini menjaga kompatibilitas data demo dan menghindari duplikasi fitur.

Satu tiket tetap memiliki satu `tenantId` dan satu pemilik/pelapor awal (`userId`). Pesan percakapan ditambahkan pada `messages[]` dengan struktur:

| Field | Keterangan |
|---|---|
| `id` | ID pesan |
| `senderId` | ID pengguna pengirim |
| `senderName` | Nama tampilan pengirim |
| `senderRole` | Role pengirim |
| `senderScope` | `tenant` atau `platform` |
| `body` | Isi pesan |
| `createdAt` | Waktu pengiriman |

Field tiket lama seperti `subject`, `description`, `kind`, `priority`, `status`, `tenantId`, `userId`, dan `createdAt` tetap dipertahankan. Tiket lama tanpa `messages[]` menggunakan `description` sebagai pesan pertama ketika riwayat dibuka atau ketika balasan pertama ditambahkan.

### Status dan arah tindak lanjut

| Status | Makna |
|---|---|
| `baru` | Laporan baru dari Lembaga |
| `diproses` | Sedang ditangani Admin SiZisNur |
| `menunggu_tenant` | Admin SiZisNur menunggu jawaban/informasi dari Lembaga |
| `menunggu_admin` | Lembaga sudah membalas; perlu ditindaklanjuti root |
| `selesai` | Tiket ditandai selesai |

Root mengirim jawaban dan memilih status tindak lanjut. Balasan baru dari Lembaga mengubah status menjadi `menunggu_admin`; bila tiket sebelumnya `selesai`, tiket dibuka kembali. Prioritas tetap Normal/Tinggi/Mendesak dan dapat disesuaikan root.

### Aturan visibilitas

- **Admin SiZisNur:** dapat melihat seluruh tiket lintas Lembaga dan identitas asalnya.
- **Admin Lembaga:** dapat melihat dan membalas semua tiket dalam `tenantId` Lembaga aktif.
- **Role Lembaga selain Admin:** hanya dapat melihat dan membalas tiket yang diajukannya sendiri.
- **Aktor root tetap tidak menjadi anggota tenant:** jawaban root dicatat sebagai pesan `senderScope: platform` dan aktivitasnya masuk `platformAudit`.

Pembatasan di atas diterapkan pada alur UI prototype. Pada produksi, aturan yang sama wajib ditegakkan di backend untuk setiap operasi baca, balas, dan perubahan status.

## 4. Alur pengguna

1. Pengguna Lembaga membuka **Panduan Demo → Bantuan, dukungan dan umpan balik**, lalu mengirim laporan.
2. Tiket baru muncul pada konsol **Admin SiZisNur → Tiket Bantuan**. Inbox menunjukkan nama dan ID Lembaga, pelapor/role, kategori, prioritas, status, dan waktu aktivitas terakhir.
3. Root membuka tiket, membaca seluruh percakapan, mengirim jawaban, mengatur prioritas, dan memilih status.
4. Pengguna/pelapor membaca jawaban di halaman Bantuan dan dapat mengirim informasi tambahan.
5. Balasan Lembaga mengembalikan tiket ke antrean root. Root dapat menindaklanjuti atau menandai selesai.
6. Balasan root dicatat ke `platformAudit`. Pembuatan dan balasan dari Lembaga dicatat pada audit tenant serta antrean sinkronisasi lokal.

## 5. Batas prototype dan pekerjaan produksi

Pada mode saat ini, `localStorage` hanya dibagikan oleh sesi/browser yang menggunakan database lokal yang sama. Tiket tidak otomatis dikirim ke server monitoring dan jawaban root tidak otomatis sampai ke browser Lembaga pada perangkat lain. Tidak ada notifikasi email/WhatsApp, lampiran, SLA, penugasan petugas, atau eskalasi insiden.

Sebelum rilis produksi, perlu disediakan layanan backend tiket dengan:
- autentikasi dan otorisasi server-side berdasarkan `scope: platform` atau membership `tenantId`;
- penyimpanan tiket dan pesan transaksional, dengan validasi status serta kontrol akses di setiap endpoint;
- notifikasi dan delivery status;
- audit append-only untuk balasan, perubahan prioritas/status, serta pembukaan kembali tiket;
- retensi, penghapusan/ekspor data, pembatasan file/lampiran, serta SOP khusus laporan keamanan;
- rate limiting, validasi input, sanitasi output, dan proteksi informasi sensitif.

**Jangan menganggap perubahan localStorage ini sebagai kanal support lintas perangkat yang sudah aktif.** Implementasi di arsip ini menyiapkan alur UI dan struktur percakapan untuk diuji; backend dan kontrol produksi tetap merupakan pekerjaan terpisah.

## 6. Verifikasi yang dijalankan

`tests/support-tickets.test.cjs` menguji pembuatan tiket, pencatatan Lembaga/pelapor, inbox root lintas tenant, kebijakan visibilitas Admin/non-Admin, balasan root, balasan tenant, status selesai dan buka kembali, kompatibilitas tiket legacy, serta jejak audit dan antrean sinkronisasi lokal. Semua berkas `tests/*.test.cjs` dan pemeriksaan sintaks JavaScript lulus pada pembaruan ini.
