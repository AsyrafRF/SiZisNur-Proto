# Pemetaan Cakupan Prototype Terhadap 16 Modul FR

**Definisi label:** INTERAKTIF = aksi lokal benar-benar memodifikasi data demo. SIMULASI = UI/interaksi meniru perilaku produksi tanpa teknologi backend. BELUM = perlu implementasi selanjutnya.

| Modul FR | Status utama | Yang bisa dicoba | Belum diimplementasikan sebagai sistem nyata |
|---|---|---|---|
| 01 Tenant | INTERAKTIF + SIMULASI | Form pengajuan, profil tenant, dua tenant demo | Otoritas approval platform, isolasi server, provisioning otomatis |
| 02 Akun & hak akses | INTERAKTIF + SIMULASI | Role-based menu, sesi, login demo | Password/SSO/OAuth, JWT, izin backend, MFA |
| 03 Dashboard | INTERAKTIF | Total uang/beras/jiwa, status rekap | Streaming real-time banyak operator, monitoring produksi |
| 04 Tarif & periode | INTERAKTIF | Ubah tarif, bobot; buka/tutup periode dan arsip demo | Versi aturan ditandatangani dan aturan resmi |
| 05 Jadwal amil | INTERAKTIF | Jadwal, hadir, pengganti | Fingerprint, absensi terverifikasi, sanksi/otorisasi |
| 06 Muzakki & kartu | INTERAKTIF | Identitas, pencarian, kartu QR, histori | e-KTP reader, physical card printer/encoder, PDF server |
| 07 Transaksi | INTERAKTIF | Multi-kategori, uang/beras, auto fitrah, lebih bayar, serial kelompok 50 | Mesin transaksi ACID, pembayaran online, split mixed media per jiwa |
| 08 Akad, struk, QR | INTERAKTIF + SIMULASI | Pop-out akad, QR nyata, cetak 2 rangkap | Driver printer Epson, laman QR produksi, persetujuan lafaz |
| 09 Bendahara | INTERAKTIF | Setoran, nilai aktual, selisih, verifikasi | Rekonsiliasi rekening, koreksi formal berlapis approval, kas fisik |
| 10 Mustahik | INTERAKTIF + SIMULASI | Lima faktor skor sesuai formula workbook, jalur F/M, jalur Mualaf, final status, metadata survey; data demo anonim | Validasi anomali formula baris pertama dan cache/formula R16, kebijakan final pengurus, integrasi survei lapangan |
| 11 Alokasi | INTERAKTIF + SIMULASI | Alokasi Tahap 1/2 sesuai nominal per asnaf dan paket 2,5 kg dari workbook; alokasi fleksibel tetap tersedia; approval | Konfirmasi saldo agregat tahap 2, pembatasan sumber dana per kategori, pengesahan pengurus |
| 12 Distribusi | INTERAKTIF | Realisasi, cek pencatatan ganda, saldo | Tanda tangan penerima, foto, GPS, offline sync |
| 13 Laporan & API | INTERAKTIF + SIMULASI | Rekap, CSV, print, JSON publik hanya visual | API HTTP sungguhan, API auth, laporan terverifikasi |
| 14 Insentif | INTERAKTIF + SIMULASI | Dua formula workbook: proporsi blanko (pool Rp8 juta) dan kehadiran (pool Rp8 juta), data kontribusi anonim | Keputusan apakah Q/R alternatif atau digabung; persetujuan dan pembayaran insentif |
| 15 Notifikasi | SIMULASI | Antrian lokal, consent contoh | Email/WA/SMS via provider, unsubscribe server |
| 16 Audit & arsip | INTERAKTIF + SIMULASI | Log lokal, arsip, JSON backup manual, reset | Audit immutable, backup otomatis 23.59, retensi terjamin |

## Catatan aturan yang sengaja tidak diputuskan otomatis

- Formula mayoritas LIST MUSTAHIK 2026 diterapkan: skor >360 Fakir, >240 Miskin, selain itu Cukup Layak; final status mengikuti formula R. Rumus status pernikahan baris pertama berbeda dari baris berikutnya dan ditandai. Kategori penghasilan 4–5 JUTA mendapat default 0 karena tidak ada cabang formula; skor 100 tanggungan hanya berlaku untuk teks `4 ATAU LEBIH`, bukan angka 4.
- Pembagian persentase/nominal per asnaf bukan otomatis persentase hak zakat; bobot bawaan hanyalah ilustrasi UI.
- Workbook memiliki pool insentif Q dan R masing-masing Rp8 juta (blanko dan kehadiran), tetapi hubungan kedua metode belum dijelaskan. V3 menampilkannya terpisah; tidak otomatis dijumlahkan.
- Aturan koreksi nominal transaksi setelah setoran membutuhkan persetujuan formal; prototype hanya menyediakan pembatalan transaksi belum disetor dan pemeriksaan aktual setoran.
- Distribusi oleh role Petugas dalam prototype adalah asumsi alur untuk simulasi; role Distributor sesungguhnya belum disahkan.

## Keamanan prototype

Role di frontend hanyalah pembatas antarmuka, bukan security boundary. Jangan gunakan aplikasi dan data ini dalam transaksi zakat aktual, meskipun tampilannya mirip aplikasi administrasi produksi.

## Penambahan alur aktivasi multi-tenant

Mode **Simulasi Verifikasi Platform** menampilkan pengajuan menunggu, keputusan setuju/tolak dan pembuatan tenant baru dengan akun Admin demo. Konsol ini memang dapat dibuka tanpa autentikasi agar mudah diuji; **tidak boleh dianggap implementasi kontrol akses platform.**


## Acuan workbook 1447H/2026M pada V3

- Halaman **Acuan Workbook 1447H** menyimpan angka agregat dan daftar temuan, bukan salinan identitas warga.
- Dataset mustahik demo dibuat sintetis dengan komposisi rekap cached 129 orang: 21 Fakir, 103 Miskin, 5 Mualaf. Hitung ulang formula sumber menghasilkan 21 Fakir, 102 Miskin, 1 Cukup Layak, 5 Mualaf karena cache row 16 berbeda dari formula R.
- Alokasi Tahap 1 dan 2 dapat dibuat sebagai draf, diajukan, disetujui Pengurus, lalu item individual disalurkan. Saldo agregat tahap 2 tidak dipetakan ke individu.
- V3 tidak mengubah selisih beras 0,6 kg, saldo tahap 1/2, formula anomali, atau #REF! sumber. Temuan ditampilkan agar dapat diputuskan oleh pengurus.
- Lihat `IMPLEMENTASI_WORKBOOK_1447H.md` untuk angka, rumus, dan daftar konfirmasi.
