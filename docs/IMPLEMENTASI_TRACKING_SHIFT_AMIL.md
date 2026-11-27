# Implementasi Pelacakan Shift Amil — 27 November 2026

## Tujuan dan keputusan lingkup

Sistem aktif tidak menyediakan penjadwalan, kalkulasi, pembagian, atau pembayaran insentif Amil. Workflow jadwal manual lama tidak dipakai untuk membuat shift baru. Data lama pada koleksi `schedule` tidak dihapus otomatis karena dapat menjadi referensi historis/kompatibilitas.

Pelacakan pelayanan memanfaatkan record `db.shiftSessions` yang sudah digunakan dalam alur penerimaan dan serah-terima Bendahara. Tidak dibuat koleksi shift alternatif.

## Alur operasional

1. Amil masuk ke halaman **Penerimaan & Verifikasi**.
2. Amil menekan tombol **Mulai Shift** yang sudah tersedia. Sistem membuat satu record `shiftSessions` dengan `tenantId`, `amilId`, `openedAt`, label waktu, status `open`, serta metadata perangkat terbatas.
3. Saat Amil mengesahkan transaksi setelah pembayaran fisik dan akad dikonfirmasi, workflow V5 yang sudah ada mengubah transaksi menjadi `Paid` dan menetapkan `tx.shiftId` ke shift aktif.
4. Ketika shift ditutup, sistem menyimpan waktu selesai, status, durasi, alasan penutupan, jumlah transaksi, total uang, total beras, serta audit. Bendahara tetap menggunakan shift dengan status `closed` untuk berita acara serah-terima.
5. Menu **Pelacakan Shift Amil** menyajikan histori shift dan aktivitas transaksi. Tidak ada form pencatatan shift atau waktu manual.

## Sumber hitungan

Transaksi dihitung bila:

- `tx.tenantId === shift.tenantId`;
- `tx.shiftId === shift.id`;
- status termasuk `paid`, `disetor`, `kas_diterima`, atau `terverifikasi`.

Transaksi Pending, batal, kedaluwarsa, atau ditolak tidak dihitung. Total uang dan beras diambil dari rincian transaksi menggunakan perhitungan total yang sama seperti sistem transaksi. Koreksi dengan status `disetujui` diperhitungkan. Filter tanggal menggunakan tanggal kalender lokal perangkat, bukan potongan tanggal UTC dari timestamp. Halaman detail menunjukkan transaksi yang benar-benar masuk hitungan. Total agregat pada laporan merupakan jumlah seluruh shift dalam hasil filter.

## Hak akses

| Role | Cakupan |
|---|---|
| Amil | Hanya shift dengan `amilId` sama dengan akun aktif pada `tenantId` aktif. Pilihan filter Amil tidak ditampilkan; manipulasi filter tidak memperluas data. |
| Admin Lembaga | Semua shift pada tenant aktif; filter Amil/tanggal/status, sortir waktu, durasi, jumlah transaksi, uang, dan beras; detail dan ekspor. |
| Pengurus | Sama seperti Admin untuk peninjauan; tidak disediakan aksi membuat, menutup, atau mengubah shift. |
| Role lain | Tidak memiliki akses route Pelacakan Shift Amil. |

Penyaringan dan otorisasi ini merupakan pembatasan UI JavaScript pada prototype. Bukan pengganti otorisasi backend.

## Laporan

CSV dan XLSX mengikuti filter dan urutan aktif. Kolom mencakup ID shift, nama Amil, mulai, selesai, durasi menit, status, jumlah transaksi, total uang (Rp), total beras (kg), dan alasan penutupan. Baris akhir menyajikan total jumlah transaksi, uang dan beras pada seluruh hasil filter. File ekspor tidak memuat data identitas Muzakki selain yang diperlukan pada detail dalam aplikasi; laporan shift berbentuk agregat per shift.

## Penutupan otomatis

Shift terbuka milik Amil ditutup saat:

- logout eksplisit;
- pergantian akun yang dilakukan ketika sesi sebelumnya adalah Amil;
- navigasi keluar dari area akun menuju beranda/portal publik;
- event browser `pagehide` saat tab/dokumen ditinggalkan (best-effort).

Penutupan dilakukan sebelum fungsi logout menghapus sesi dan sebelum pergantian akun diselesaikan. Semua shift terbuka untuk kombinasi tenant dan akun Amil ditutup, termasuk record terbuka ganda dari data legacy. Penutupan `pagehide` bergantung pada kesempatan browser menjalankan event dan menulis localStorage; kondisi crash, force-kill, baterai habis, atau browser menghentikan proses tidak dapat dijamin.

## Yang harus dibuat pada backend produksi

- Model ShiftSession dengan constraint agar satu Amil tidak mempunyai lebih dari satu shift aktif per tenant.
- Endpoint start/close shift dengan pemeriksaan identitas server-side dan operasi transaksional.
- Penutupan saat logout di endpoint server; session lease/heartbeat dan kebijakan timeout untuk perangkat yang terputus.
- Database server sebagai sumber kebenaran transaksi dan shift; `shiftId` ditetapkan oleh backend saat Amil mengesahkan transaksi.
- RBAC server-side: Amil hanya membaca milik sendiri; Admin/Pengurus hanya tenant aktif yang diotorisasi.
- Audit append-only, idempotensi close request, rekonsiliasi sesi/perangkat, backup dan retensi.
- CSV/XLSX dibangkitkan server-side dari query dengan otorisasi yang sama dengan layar.

## Verifikasi

Jalankan:

```bash
node --check js/app.js
node --check js/revision-v5.js
node tests/amil-shifts.test.cjs
```

Tes memverifikasi tombol mulai, relasi transaksi `shiftId`, status transaksi yang masuk hitungan, koreksi disetujui, akses Amil/Admin/Pengurus, filter tanggal lokal (termasuk timestamp UTC yang melewati tengah malam WIB), filter dan sortir, struktur XLSX Office Open XML dan ekspor CSV, logout, pergantian akun, dan fallback pagehide. Pengaturan lama `monthlyIncentive`/`method` pada konfigurasi tarif V5 dibuang saat bootstrap atau impor cadangan.
