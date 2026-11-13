# Perubahan branding & landing page

## Identitas
- Brand sementara: **SiZisNur** (Sistem Informasi Zakat, Infak, dan Sedekah; unsur Nur merujuk asal pengembangan Masjid An-Nur).
- Logo memakai ikon versi aplikasi hasil persetujuan desain dari papan konsep, dengan warna hijau dan emas.
- Posisi: landing, favicon, login, sidebar.

## Kebutuhan yang tetap sama
Semua modul lama **tetap dipertahankan**: lembaga, akun/peran, dashboard, periode, aturan, jadwal amil, muzakki dan kartu, penerimaan multi-kategori, akad, QR & struk, setoran bendahara, survei mustahik, alokasi approval, distribusi, insentif, laporan, notifikasi, audit/arsip, dan portal publik.

## Halaman depan
- Beranda produk sebagai layar awal pengguna belum login.
- Tombol *Masuk / Coba Demo* menuju login role simulasi.
- *Portal publik* menuju rekap dan verifikasi QR tanpa identitas muzakki.
- *Ajukan lembaga* membuka simulasi permohonan lembaga.
- Alur operasi dan klaim manfaat didasarkan pada dokumen elisitasi; bukan janji performa ataupun layanan yang sudah diproduksi.

## Pembaruan copywriting landing page V5 (13 November 2026)

Landing page kembali memakai susunan visual yang telah digunakan pada V3. Ilustrasi dashboard di hero, strip ringkasan, kartu manfaat, enam kartu fitur, susunan langkah, kartu aktor, ilustrasi multi-lembaga, CTA, dan footer dipertahankan. Tidak ada perubahan pada CSS atau sistem desain visual landing page.

Copywriting diperbarui agar lebih berorientasi pada layanan yang tersedia dan tidak menonjolkan masalah awal pengembangan. Isi utama yang disampaikan adalah:

- Layanan mandiri Muzakki untuk data keluarga, kalkulator zakat, histori, QR transaksi, dan bukti setor.
- Transaksi mandiri maupun Walk-in berstatus Pending dan diverifikasi Amil melalui QR, akad, serta konfirmasi pembayaran.
- Rekonsiliasi kas dan rekening, jurnal, serta laporan oleh Bendahara.
- Persetujuan program oleh Pengurus dan pencatatan distribusi per batch oleh Relawan.
- Pengelolaan data dan kelayakan Mustahik oleh Admin, serta dukungan multi-lembaga untuk masjid dan lembaga.

Nilai uang dan kilogram yang ditampilkan pada ilustrasi dashboard merupakan data contoh, bukan angka operasional aktual.

## Kompatibilitas
- Data demo versi sebelumnya di browser yang sama dibaca otomatis bila database baru belum tersedia.
- Data tidak disinkronkan antarperangkat.
- Token QR yang baru berawalan `SIZISNUR|`, sedangkan token versi lama masih diterima dalam simulasi verifikasi.
- Jika membuka pada domain baru, browser memiliki penyimpanan terpisah; migrasi otomatis tidak dapat memindahkan data lintas-domain.

## Catatan UAT
1. Tanpa sesi aktif, halaman pertama yang muncul harus landing page SiZisNur.
2. Masuk demo sebagai Amil, buka shift, buat atau periksa transaksi Pending, lalu cek token QR.
3. Ganti ke Bendahara untuk rekonsiliasi. Pengurus meninjau dan menyetujui alokasi, lalu Relawan mencatat distribusi.
4. Coba Portal Publik dan verifikasi nomor transaksi/token QR baru.
5. Coba Pengajuan Lembaga dari landing dan masuk dari lembaga kedua.
6. Uji browser mobile, mode tema gelap, reset data, serta penyimpanan dan refresh.


## Catatan migrasi pada V3 (4 November 2026)

V3 memakai key database browser baru `sizisnur_demo_database_v4` dan session `sizisnur_demo_session_v4`. Dataset demo V2 tidak dimigrasikan otomatis agar struktur lama tidak tercampur dengan model skor dan alokasi workbook. Pengguna tetap dapat membuka paket V2 secara terpisah; V3 memulai data demo baru.
