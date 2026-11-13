# Admin SiZisNur — Akun Root Platform

**Status:** interaktif untuk demonstrasi lokal; belum merupakan autentikasi atau otorisasi produksi.

## 1. Tujuan aktor root

Admin SiZisNur adalah aktor pengelola platform secara global. Akun ini berbeda dari Admin tenant dan tidak menjadi role operasional kedelapan pada tenant. Admin tenant tetap mengelola kebijakan dan operasional lembaganya masing-masing.

## 2. Akun demonstrasi

| Atribut | Nilai |
|---|---|
| Nama | Admin SiZisNur |
| Role | `Admin SiZisNur` |
| Email demo | `root@sizisnur.demo` |
| ID | `PA-SIZISNUR-ROOT` |
| Scope | `platform` |
| Tenant | Tidak terikat tenant (`tenantId` tidak tersedia) |
| Lokasi data | `db.platformAdmins` — terpisah dari `db.users` |

Pada halaman **Masuk ke demo SiZisNur**, pilih tile **Admin SiZisNur** atau opsi akun root pada dropdown akun demonstrasi. Prototype tidak meminta password atau OTP. Jangan mempublikasikan akun ini sebagai kredensial produksi.

## 3. Menu konsol root

| Menu | Kemampuan |
|---|---|
| Ringkasan | Melihat jumlah tenant aktif, pengajuan menunggu, akun tenant, transaksi agregat, dan aktivitas root terbaru. |
| Tenant terdaftar | Melihat seluruh tenant, ringkasan akun/transaksi, metadata lembaga, serta mengaktifkan atau menangguhkan akses tenant. |
| Pengajuan tenant | Meninjau pengajuan dari portal publik; menyetujui dan membuat tenant beserta Admin awal, atau menolak dengan catatan. |
| Akun pengguna tenant | Melihat pengguna lintas tenant dan mengaktifkan/menonaktifkan akun. Akun root ditampilkan terpisah. |
| Pengaturan sistem | Mengubah nama platform, email dukungan, buka/tutup pendaftaran, status default tenant baru, pengumuman global, dan mode pemeliharaan. |
| Audit platform | Melihat catatan aktivitas yang dibuat melalui konsol root. |
| Akun root | Mengubah nama tampilan dan email akun root serta memeriksa pemisahan kewenangan. |

Saat tenant baru dibuat, prototype juga membuat satu akun Admin tenant, menyalin parameter aturan awal dari tenant contoh, dan menambahkan satu periode draf. Admin tenant harus memeriksa serta mengesahkan tarif dan parameter lokal sebelum dipakai.

## 4. Aturan akses prototype

- Akun root disimpan di `platformAdmins`, sedangkan semua akun tenant tetap berada di `users` dengan `tenantId`.
- `scope: platform` dan role `Admin SiZisNur` menjadi penanda aktor root pada UI prototype.
- Admin SiZisNur mengelola status dan metadata tenant serta pengaturan platform, tetapi tidak mengelola transaksi, kas, tarif zakat, Mustahik, atau penyaluran sebagai operator tenant.
- Tenant berstatus `ditangguhkan` tidak dapat membuka workspace. Saat `maintenanceMode` aktif, workspace pengguna tenant dibatasi dan pesan pemeliharaan ditampilkan; akun root tetap dapat masuk.
- Pengajuan publik disimpan dengan status `menunggu` dan hanya diputuskan dari konsol root. Jalur pemeriksaan platform publik yang lama telah ditutup.
- `platformSettings` menyimpan konfigurasi global dan `platformAudit` menyimpan catatan aktivitas root, terpisah dari pengaturan dan audit tenant.

## 5. Uji cepat UAT

1. Buka halaman login dan pastikan tile Admin SiZisNur terlihat terpisah dari tujuh peran tenant.
2. Masuk sebagai Admin SiZisNur. Pastikan header menunjukkan **KONSOL PLATFORM / ROOT** dan menu global tersedia.
3. Buat tenant uji beserta Admin awal. Pastikan tenant muncul di daftar dan akun Admin baru berada pada `users` dengan `tenantId` tenant tersebut.
4. Tangguhkan tenant uji. Coba masuk sebagai Admin tenant tersebut dan pastikan workspace diblokir. Aktifkan kembali tenant.
5. Kirim pengajuan dari portal publik. Pastikan statusnya `menunggu`, lalu setujui/tolak melalui menu Pengajuan Tenant.
6. Aktifkan mode pemeliharaan dan pastikan akun tenant dibatasi sementara root tetap dapat masuk. Matikan kembali mode pemeliharaan setelah uji.
7. Periksa Audit Platform untuk melihat rekam perubahan yang dilakukan selama pengujian.

## 6. Keamanan sebelum produksi

Fitur ini belum boleh digunakan sebagai superadmin produksi. Prototype berjalan dengan JavaScript dan `localStorage`; pengguna yang memiliki akses ke browser dapat memeriksa atau mengubah data, memalsukan sesi, dan memodifikasi koleksi platform. Tidak ada password, MFA, backend, otorisasi server-side, maupun audit immutable. Pemisahan koleksi hanya pemisahan logis pada data demo.

Sebelum produksi, minimal implementasikan:

1. Identitas root pada layanan autentikasi backend terpisah dari tenant; gunakan password kuat, MFA wajib, pemulihan akun terkontrol, rate limit, dan notifikasi login.
2. RBAC/ABAC server-side dengan scope platform yang eksplisit. Jangan mempercayai `role`, `scope`, `tenantId`, atau status akun dari browser.
3. Isolasi tenant di lapisan API/database. Semua operasi tenant harus memeriksa tenant context server-side; operasi root harus memakai endpoint khusus dan prinsip least privilege.
4. Audit platform append-only di server, mencatat aktor, waktu, IP/perangkat, nilai sebelum/sesudah, alasan, serta hasil tindakan. Pertimbangkan persetujuan ganda untuk tindakan sensitif seperti suspend, penghapusan, atau perubahan kebijakan global.
5. Prosedur break-glass, backup teruji, pemantauan aktivitas anomali, manajemen secrets, retensi log, dan rencana pemulihan insiden.
6. Workflow onboarding legal untuk tenant: verifikasi badan/lembaga, penanggung jawab, kontak, dokumen, persetujuan layanan, serta proses deaktivasi dan ekspor data.

Pengujian otomatis `tests/platform-admin.test.cjs` memeriksa pemisahan akun root, konsol, pembuatan tenant, pencatatan audit, dan pemblokiran tenant yang ditangguhkan. Tes ini tidak menggantikan penetration test, review backend, atau UAT browser.


## Pengaturan visibilitas Portal Publik

Pada **Tenant Terdaftar → Detail Tenant**, Admin SiZisNur dapat menyalakan atau mematikan opsi **Tampilkan tenant pada Portal Publik**. Tenant aktif dipublikasikan secara default. Tenant berstatus ditangguhkan tidak tampil, sekalipun opsi publikasinya aktif. Setiap perubahan visibilitas tercatat pada Audit Platform.

Portal publik hanya menampilkan ringkasan agregat. Admin root tidak mengubah transaksi tenant; angka yang tampil berasal dari transaksi yang sudah disahkan Amil dan catatan penyaluran berstatus selesai. Rincian identitas Muzakki/Mustahik tidak dipublikasikan.
