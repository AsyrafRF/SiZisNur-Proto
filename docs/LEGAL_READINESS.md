# Checklist Kesiapan Hukum, Privasi dan Keamanan SiZisNur

**Status:** dokumen persiapan prototype, bukan pendapat hukum, audit kepatuhan, izin operasional, atau sertifikasi keamanan.

## Rujukan primer untuk ditelaah

1. [UU Nomor 23 Tahun 2011 tentang Pengelolaan Zakat — JDIH BPK](https://peraturan.bpk.go.id/Details/39267/uu-no-23tahun-2011). JDIH BPK menampilkan status berlaku dan ruang lingkup pengumpulan, pendistribusian, pendayagunaan, pelaporan, pembinaan serta pengawasan zakat.
2. [PP Nomor 14 Tahun 2014 tentang Pelaksanaan UU 23/2011 — JDIH BPK](https://peraturan.bpk.go.id/Details/5451/pp-no-14-tahun-2014). JDIH BPK menampilkan status berlaku sebagai peraturan pelaksanaan pengelolaan zakat.
3. [UU Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi — JDIH BPK](https://peraturan.bpk.go.id/Details/229798/uu-no-27-tahun-2022). JDIH BPK menampilkan status berlaku. Periksa juga putusan pengujian materi yang ditautkan pada laman tersebut dan peraturan pelaksana terbaru.

Rujukan di atas adalah titik awal pemeriksaan. Pengurus dan penasihat hukum perlu memastikan peraturan pelaksana, putusan pengadilan, ketentuan BAZNAS, ketentuan daerah, serta kebijakan terbaru yang relevan sebelum operasional.

## Checklist tata kelola zakat dan UPZ

- Pastikan bentuk organisasi, kewenangan penghimpunan dan status UPZ atau bentuk kerja sama dengan BAZNAS sesuai ketentuan yang berlaku.
- Tetapkan pihak yang bertanggung jawab atas penghimpunan, penyimpanan, pendistribusian, pendayagunaan, pelaporan dan pengawasan.
- Sahkan kebijakan per jenis dana, termasuk zakat, infak, sedekah, fidyah, kafarat, dana terikat, serta persediaan beras.
- Tetapkan prosedur penerimaan, serah terima, rekonsiliasi, koreksi, approval, distribusi, bukti penerimaan, laporan dan audit.
- Minta persetujuan pihak berwenang atas nisab, kadar, lafaz akad, doa, kriteria mustahik, formula penyaluran dan materi keagamaan.
- Sepakati skema, akun, periode, format, jadwal, otorisasi dan mekanisme koreksi untuk laporan bulanan BAZNAS.

## Checklist pelindungan data pribadi

- Identifikasi pengendali dan prosesor data serta tujuan dan dasar pemrosesan setiap kategori data.
- Terapkan minimisasi data. Hindari mengumpulkan NIK atau informasi lain jika tidak benar-benar dibutuhkan.
- Berikan pemberitahuan privasi yang mudah dipahami dan simpan bukti persetujuan jika persetujuan menjadi dasar pemrosesan.
- Atur akses subjek data, koreksi, retensi, penghapusan, pengungkapan, transfer, dan penanganan permintaan.
- Lakukan penilaian dampak pelindungan data bila pemrosesan berisiko tinggi atau diwajibkan.
- Siapkan prosedur insiden dan pemberitahuan kebocoran sesuai ketentuan yang berlaku.
- Ikat penyedia hosting, notifikasi, monitoring dan layanan lain dengan perjanjian pemrosesan data serta kontrol akses yang sesuai.

## Checklist keamanan teknis sebelum go-live

- Bangun backend dan basis data dengan isolasi lembaga pada query dan policy server-side.
- Gunakan autentikasi kuat, MFA untuk role kritis, pengelolaan sesi, rate limiting, pemulihan akun dan pencabutan perangkat.
- Terapkan validasi input server-side, CSRF protection, pengamanan XSS, CSP, secure headers, secret management dan dependency scanning.
- Enkripsi koneksi TLS dan data sensitif saat tersimpan dengan pengelolaan kunci yang terpisah.
- Terapkan audit append-only pada server, timestamp tepercaya, jejak approval, idempotensi serta dual control untuk koreksi.
- Siapkan backup terenkripsi, retensi, uji restore, disaster recovery, monitoring, alert dan prosedur respons insiden.
- Rancang sinkronisasi offline dengan konflik, idempotency key, batas perangkat, re-authentication, enkripsi penyimpanan lokal dan rekonsiliasi server.
- Jalankan threat modeling, secure code review, penetration test, uji aksesibilitas, uji beban dan UAT.

## Batas prototype saat ini

Project yang disertakan adalah front-end statis. `localStorage`, pembatasan menu JavaScript dan rantai hash di browser tidak menyediakan autentikasi, enkripsi, kontrol akses kuat, isolasi lembaga, audit immutable, ataupun kepatuhan hukum. Data demo tidak boleh diganti dengan data pribadi atau transaksi sesungguhnya.
