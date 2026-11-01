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
| 10 Mustahik | INTERAKTIF + SIMULASI | Survei, skor indikatif, asnaf manual, status | Integrasi survei RT real, validasi kebijakan skor |
| 11 Alokasi | INTERAKTIF + SIMULASI | Perencanaan, bobot asnaf, pembulatan, approval | Pengesahan syariah, dana terikat per kategori, versi parameter |
| 12 Distribusi | INTERAKTIF | Realisasi, cek pencatatan ganda, saldo | Tanda tangan penerima, foto, GPS, offline sync |
| 13 Laporan & API | INTERAKTIF + SIMULASI | Rekap, CSV, print, JSON publik hanya visual | API HTTP sungguhan, API auth, laporan terverifikasi |
| 14 Insentif | SIMULASI | Estimasi hadir + jiwa | Formula resmi, persetujuan dan pembayaran insentif |
| 15 Notifikasi | SIMULASI | Antrian lokal, consent contoh | Email/WA/SMS via provider, unsubscribe server |
| 16 Audit & arsip | INTERAKTIF + SIMULASI | Log lokal, arsip, JSON backup manual, reset | Audit immutable, backup otomatis 23.59, retensi terjamin |

## Catatan aturan yang sengaja tidak diputuskan otomatis

- Terdapat konflik ambang skor mustahik (lebih dari 360 vs minimal 375), sehingga skor hanya indikator dan petugas memilih asnaf secara eksplisit.
- Pembagian persentase/nominal per asnaf bukan otomatis persentase hak zakat; bobot bawaan hanyalah ilustrasi UI.
- Perhitungan kontribusi/insentif amil dalam hasil wawancara mengandung beberapa dasar berbeda (jam kerja, kehadiran, jumlah jiwa, blanko); fitur tetap indikatif.
- Aturan koreksi nominal transaksi setelah setoran membutuhkan persetujuan formal; prototype hanya menyediakan pembatalan transaksi belum disetor dan pemeriksaan aktual setoran.
- Distribusi oleh role Petugas dalam prototype adalah asumsi alur untuk simulasi; role Distributor sesungguhnya belum disahkan.

## Keamanan prototype

Role di frontend hanyalah pembatas antarmuka, bukan security boundary. Jangan gunakan aplikasi dan data ini dalam transaksi zakat aktual, meskipun tampilannya mirip aplikasi administrasi produksi.

## Penambahan alur aktivasi multi-tenant

Mode **Simulasi Verifikasi Platform** menampilkan pengajuan menunggu, keputusan setuju/tolak dan pembuatan tenant baru dengan akun Admin demo. Konsol ini memang dapat dibuka tanpa autentikasi agar mudah diuji; **tidak boleh dianggap implementasi kontrol akses platform.**
