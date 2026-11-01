# Perubahan branding & landing page

## Identitas
- Brand sementara: **SiZisNur** (Sistem Informasi Zakat, Infak, dan Sedekah; unsur Nur merujuk asal pengembangan Masjid An-Nur).
- Logo memakai ikon versi aplikasi hasil persetujuan desain dari papan konsep, dengan warna hijau dan emas.
- Posisi: landing, favicon, login, sidebar.

## Kebutuhan yang tetap sama
Semua modul lama **tetap dipertahankan**: tenant, akun/peran, dashboard, periode, aturan, jadwal amil, muzakki dan kartu, penerimaan multi-kategori, akad, QR & struk, setoran bendahara, survei mustahik, alokasi approval, distribusi, insentif, laporan, notifikasi, audit/arsip, dan portal publik.

## Halaman depan
- Beranda produk sebagai layar awal pengguna belum login.
- Tombol *Masuk / Coba Demo* menuju login role simulasi.
- *Portal publik* menuju rekap dan verifikasi QR tanpa identitas muzakki.
- *Ajukan lembaga* membuka simulasi permohonan tenant.
- Alur operasi dan klaim manfaat didasarkan pada dokumen elisitasi; bukan janji performa ataupun layanan yang sudah diproduksi.

## Kompatibilitas
- Data demo versi sebelumnya di browser yang sama dibaca otomatis bila database baru belum tersedia.
- Data tidak disinkronkan antarperangkat.
- Token QR yang baru berawalan `SIZISNUR|`, sedangkan token versi lama masih diterima dalam simulasi verifikasi.
- Jika membuka pada domain baru, browser memiliki penyimpanan terpisah; migrasi otomatis tidak dapat memindahkan data lintas-domain.

## Catatan UAT
1. Tanpa sesi aktif, halaman pertama yang muncul harus landing page SiZisNur.
2. Klik masuk demo, pilih Amilin, catat transaksi, dan cek token QR.
3. Ganti Bendahara dan verifikasi setoran; lalu Petugas/Pengurus untuk alokasi dan distribusi.
4. Coba Portal Publik dan verifikasi nomor transaksi/token QR baru.
5. Coba Pengajuan Lembaga dari landing dan masuk dari tenant kedua.
6. Uji browser mobile, mode tema gelap, reset data, serta penyimpanan dan refresh.
