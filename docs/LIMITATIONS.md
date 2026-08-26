# LIMITATIONS

Kelima belas poin di bawah ini wajib tampil di halaman Limitations produk dan di slide pitch (PRD §8). Ini bukan daftar penyesalan yang dikubur di footer — ini yang membedakan HeatWalk dari klaim tanpa pengukuran. Setiap poin ditulis dengan angka konkret dari `data/out/` atau `docs/METHODOLOGY.md`, bukan sebagai kalimat generik.

Nomor mengikuti urutan PRD §8 persis. Tiga poin tambahan yang ditemukan selama pengerjaan (di luar limitasi yang sudah dituliskan PRD) ada di bagian akhir, ditandai eksplisit sebagai temuan implementasi.

---

## 1. Resolusi 60m tidak dapat membedakan trotoar sisi kiri vs kanan

Granularity raster FortyGuard adalah 60m (`GRANULARITY_M = 60`, `docs/METHODOLOGY.md` §Fase 0), dan ukuran tile terverifikasi 60,3 m setelah reproyeksi. Median panjang edge OSM di AOI ini hanya 45,4 m — lebih pendek dari satu sel raster. Konsekuensinya, skoring dilakukan di level **koridor jalan**, bukan trotoar spesifik. Dua trotoar berseberangan di jalan yang sama mendapat suhu identik dalam model ini, meski di dunia nyata satu sisi bisa lebih teduh dari sisi lain.

## 2. Bukan WBGT — indeks dosis panas berbasis suhu udara 2m

`tcm` (thermal comfort metric) FortyGuard adalah suhu udara ambien 2m AGL, diverifikasi ±3°C dari METAR referensi (`docs/METHODOLOGY.md` §Fase 0). Tidak ada wind speed maupun globe temperature — dua komponen wajib WBGT (Wet Bulb Globe Temperature), standar yang dipakai badan olahraga dan sebagian pedoman sekolah untuk keputusan aktivitas luar ruang. Produk ini secara sengaja **tidak mengklaim WBGT** dan tidak boleh disebut demikian di pitch atau UI — istilah yang dipakai selalu "indeks dosis panas berbasis suhu udara 2m".

## 3. Cakupan dibatasi jumlah tile yang berhasil ditarik

AOI final (`orl_ocps_core`, ~60 mi²) hanya memuat **enam sekolah teranalisis** dari 101.245 sekolah NCES nasional dan puluhan sekolah OCPS nyata yang secara fisik berada dalam bbox yang sama (lihat poin tambahan di bawah). Sekolah di luar cakupan tampil sebagai pin abu-abu berlabel "Belum dianalisis" di Mode 1 (FR-20) — **tidak pernah** dengan angka hasil interpolasi atau tebakan. Memperluas ke seluruh sekolah dalam bbox tersedia tanpa kredit FortyGuard tambahan (data OSM/NCES/Census gratis), tapi akan mengalikan ukuran `graph.json`+`temps.json` (saat ini disalin utuh per sekolah dari graf tile penuh, §Fase 6) sampai ~660 MB — dicatat sebagai utang teknis yang sengaja tidak diambil sebelum deadline, bukan keterbatasan yang tidak disadari.

## 4. Rute dimodelkan dari jaringan OSM

Graph routing berasal dari `osmnx.graph_from_bbox(network_type='walk')` — jaringan jalan resmi OpenStreetMap, 78.416 edge mentah di AOI gabungan. Anak sungguhan mungkin memotong jalan lewat gang tak terpetakan, jalan setapak informal di lahan kosong, atau menyeberang di luar jalur yang dipetakan OSM. Dijkstra tidak bisa menemukan jalur yang tidak ada di graph — kalau jalur pintas informal itu lebih adem dari rute resmi yang dihitung, produk ini melewatkannya, dan sebaliknya kalau rute resmi sudah menghitung jalur teradem yang tersedia, itu tetap batasan atas dari opsi yang benar-benar dipertimbangkan.

## 5. Kecepatan jalan diasumsikan 1,2 m/s untuk semua anak

`WALK_SPEED_MPS = 1,2` (`pipeline/config.py`) dipakai seragam di seluruh perhitungan dosis (`dose = suhu_diatas_baseline × (panjang/1,2) / 60`) — untuk siswa TK maupun SMA kelas 12, untuk anak dengan atau tanpa keterbatasan mobilitas. Kecepatan jalan anak bervariasi berdasarkan usia dan kondisi; satu konstanta ini adalah simplifikasi yang disengaja, bukan hasil pengukuran per kelompok umur.

## 6. Tidak semua anak dalam batas attendance bersekolah di situ

Estimasi `kids_est` per blok memakai asumsi nearest-school assignment (poin 9 di bawah) yang mengabaikan charter school (lotere se-distrik, bukan zona geografis — lihat UCP Pine Hills Charter, poin tambahan di bawah), sekolah swasta, dan program open enrollment. Meleset diperkirakan ~10–20% dari populasi riil per sekolah — angka ini sendiri adalah estimasi kasar, bukan hasil pengukuran terpisah di AOI ini.

## 7. Data sensus level block mengandung noise differential privacy

Census DHC P12 2020 menerapkan differential privacy (noise injection) pada level block untuk melindungi privasi individu di populasi kecil — semakin kecil populasi satu blok, semakin besar proporsi noise relatif terhadap nilai sebenarnya. `kids_est` per blok yang diturunkan dari sini (§1.5.5, §1.5.6) mewarisi ketidakpastian ini; ia adalah estimasi berbasis sensus dengan margin error bawaan, bukan hitungan kepala yang presisi.

## 8. Luas bangunan tidak sama dengan jumlah unit

Metode dasymetric yang dipakai (§1.5.6) mengasumsikan distribusi anak proporsional terhadap pita umur Census per blok, tanpa faktor koreksi terpisah untuk kepadatan hunian. Blok berisi kompleks apartemen padat akan under-estimate jumlah anak riil dibanding blok bertipe rumah tapak tunggal dengan luas lahan setara, karena Census block-level tidak membedakan tipe unit hunian dalam perhitungan ini.

## 9. Batas SABS berumur ~10 tahun jika data distrik langsung tidak tersedia

ArcGIS OCPS tidak bisa diakses otomatis untuk fetch programatik (`socket hang up` konsisten pada 7 percobaan berbeda, kemungkinan WAF/bot-block — `docs/METHODOLOGY.md` §1.3), dan NCES tidak menyediakan SABS (School Attendance Boundary Survey) sebagai REST service untuk AOI ini (pola URL bulk download SABS mengembalikan `404`). **Fallback yang benar-benar dipakai: nearest-school by centroid distance** — bukan SABS berumur 10 tahun (opsi itu sendiri tidak tersedia di sini), fallback ketiga di rantai yang diantisipasi dev plan §1.5.5. Ini batasan yang lebih dalam dari yang tertulis di PRD: assignment blok→sekolah bukan zona attendance resmi sama sekali, melainkan proksi geometris. Lihat poin tambahan di bawah untuk konsekuensi nyatanya pada kalibrasi enrollment.

## 10. Manfaat pemilihan rute kecil

Suhu udara 2m terukur menunjukkan variasi spasial intra-urban jauh lebih kecil daripada yang tersirat dari peta naungan atau suhu permukaan. Delapan kandidat AOI diuji di dua kota (`docs/phase1-scouting.md`); kontras terbaik 1,84°C (p95−p05). Konsekuensinya, delta rata-suhu antar-rute di AOI final berkisar **−0,75°C hingga 0,00°C** (2.304 pasangan blok–sekolah, rata-rata −0,055°C, `docs/METHODOLOGY.md` §Fase 7/G8) — persis di kisaran 0,5–0,8°C yang diperkirakan PRD §1.5. **Paparan didominasi durasi dan waktu hari, bukan pilihan jalur**: kurva jam AOI naik 8,97°C dari 07:00 ke 15:00 (§Fase 7/G7), jauh melampaui kontras spasial pada satu jam manapun.

## 11. Kategori kuning berisi lebih sedikit blok daripada yang intuitif

Konsekuensi langsung poin 10. Kategori kuning (dose(terpendek) > threshold ≥ dose(teradem)) butuh rute teradem dan rute terpendek punya dosis yang berbeda di sisi berlawanan dari satu ambang. Karena **89,9% pasangan blok–sekolah punya `delta_mean_c = 0,000` persis** (rute teradem identik dengan rute terpendek), hampir tidak ada ruang bagi satu ambang untuk memisahkan keduanya. Hasil aktual: **0 blok kuning dari 2.304 blok berpenduduk** di keenam sekolah, gelombang 1 maupun gelombang 3. Distribusi ini dilaporkan apa adanya; **`THRESHOLD_DOSE_C_MIN` tidak pernah digeser** untuk memaksa kategori kuning terisi secara artifisial (dev plan §4.1, `docs/METHODOLOGY.md` Temuan 1).

## 12. Klasifikasi memakai jam kanonik dan dosis satu perjalanan — angka ini under-estimate

Klasifikasi FR-8 dihitung pada `canonical_hour = "15:00"` (jam terpanas hari sekolah, diturunkan dari data) dan dosis **satu kali jalan** (rumah → sekolah). Anak berjalan **dua arah** setiap hari sekolah — pagi (sekitar 08:00, lebih sejuk) dan sore/bubar sekolah (sekitar jam kanonik, terpanas). Paparan harian sebenarnya adalah penjumlahan kedua perjalanan, bukan satu. Karena jam kanonik adalah jam terpanas, bukan rata-rata, dan hanya satu dari dua perjalanan yang dihitung, **setiap angka dosis di produk ini adalah under-estimate terhadap paparan riil harian anak**, bukan over-estimate. Ini berlaku untuk `dose_eliminated_per_child_per_day/year`, radius setara-dosis (G2), dan status merah/kuning/hijau itu sendiri.

## 13. Cakupan jam tidak seragam antar tile

AOI final ditarik sebagai satu tile gabungan (`orl_ocps_core`) dengan sepuluh slice jam penuh (07:00–16:00) — pada implementasi saat ini seluruh enam sekolah berbagi cakupan jam yang sama karena mereka berbagi satu tile. Kalau cakupan diperluas ke tile tambahan di masa depan (dev plan §5.6, "cakupan lewat mosaik, bukan satu bbox"), tile baru bisa saja hanya berhasil menarik sebagian jam (mis. 3 dari 10) tergantung anggaran kredit saat itu ditarik. Slider jam frontend membaca `meta.hours` per sekolah, bukan konstanta — tile dengan cakupan jam parsial akan menampilkan tick sesedikit jam yang benar-benar berhasil ditarik, **tidak pernah menginterpolasi** jam yang tidak ada.

## 14. Angka exceedance (FR-19) adalah hibrida

`days_exceedance_per_year` (§Fase 7/G9: 2,4–19,9 hari/tahun di enam sekolah) dihitung dari distribusi temporal stasiun ASOS titik-tunggal (bandara MCO, 2.130 hari historis 2019–2025) yang di-offset secara spasial memakai **satu** sampel FortyGuard per blok (tanggal `FETCH_DATE = 2023-08-08`). Metode ini mengasumsikan offset spasial per blok (selisih suhu blok vs stasiun) **stabil antar-hari** — asumsi yang **tidak diuji**. Kondisi atmosfer berbeda (kelembapan, tutupan awan, arah angin) bisa mengubah offset spasial riil dari hari ke hari; produk ini tidak punya cara memverifikasi stabilitas itu dengan data yang tersedia.

## 15. AOI Phoenix hanya bukti portabilitas pipeline

Phoenix, AZ diuji sebagai kota kandidat awal (§Fase 1) tapi dibuang dari UI produk setelah verifikasi menemukan statuta *hazardous walking conditions* Arizona **tidak ada** (`ARS §15-901` murni berbasis jarak). Phoenix dipertahankan **pipeline-only** — dijalankan untuk membuktikan pipeline portabel lintas-kota (G10), **tidak pernah dirender di UI produk**, dan tidak punya kalibrasi enrollment, batas attendance distrik, maupun dasar statuta. Kalau data Phoenix pernah terlihat di mana pun dalam produk ini, itu bug — laporkan, jangan ditafsirkan sebagai rekomendasi kebijakan untuk Phoenix.

---

## Temuan implementasi tambahan (di luar PRD §8, ditemukan selama pengerjaan)

Tiga poin ini bukan bagian dari lima belas poin resmi PRD, tapi ditemukan konkret selama Fase 1.5–7 dan sama pentingnya untuk dibaca sebelum mempercayai angka produk ini.

### 16. Kalibrasi enrollment: tiga dari enam sekolah tetap di luar rentang 0,3–3,0

`correction_factor` (`docs/METHODOLOGY.md` §Fase 7) dihitung ulang di Fase 7 dengan penyebut dibatasi radius jalan kaki (2,0 mi), memperbaiki dua dari lima sekolah yang sebelumnya di luar rentang validasi. **Tiga tetap di luar rentang setelah perbaikan**: Maynard Evans High (3,163× — satu-satunya SMA di AOI, catchment riil lebih besar dari radius kebijakan sendiri), UCP Pine Hills Charter (0,089× — sekolah lotere se-distrik, tidak mengikuti zona geografis sama sekali), dan Rosemont Elementary (0,232× — dalam radius 2 mi dari Rosemont ada 13 sekolah NCES nyata, tapi hanya 4 di antaranya masuk subset enam-sekolah teranalisis; dua SD nyata yang lebih dekat dari sebagian blok, Lockhart Elementary dan Lake Weston Elementary, tidak dianalisis, sehingga blok yang di dunia nyata masuk zona mereka salah terhitung sebagai bagian catchment Rosemont). Faktor-faktor ini tetap ditulis apa adanya di `summary.json` — bukan disembunyikan di balik `1.0` — karena masing-masing informatif dan sebabnya terjelaskan.

### 17. Asumsi pendinginan naungan (`SHADE_COOLING_C`) belum divalidasi lokal

Kolom FR-15 ("estimasi penurunan suhu puncak jika diteduhi") memakai konstanta seragam `SHADE_COOLING_C = 1,5°C` — dipilih konsisten dengan urutan besaran efek kanopi pohon pada suhu udara 2m yang dikutip literatur (Lanza dkk. 2023, Meng dkk. 2023), **bukan hasil pengukuran naungan nyata di AOI ini**. Diterapkan rata ke setiap edge segmen prioritas tanpa mempertimbangkan jenis pohon, kepadatan kanopi aktual, atau orientasi jalan terhadap matahari.

### 18. Geografi pendapatan dan kemiskinan tidak seragam

`lowest_income_quartile` di `summary.json` menggabungkan dua level geografi sensus berbeda: pendapatan median (ACS B19013) tersedia di level **block group**, tapi kemiskinan (ACS B17001) **disupresi total** di level block group untuk seluruh AOI ini dan harus diturunkan ke level **tract** yang lebih kasar (`docs/METHODOLOGY.md` §1.5.5). Blok dalam satu block group yang sama bisa mewarisi angka kemiskinan dari tract yang mencakup wilayah lebih luas dan lebih heterogen dari block group itu sendiri.

### 19. Satu temuan verifikasi Fase 3 belum terselesaikan

`pipeline/verify_step3.py` (dijalankan manual saat verifikasi Fase 7 terhadap data gelombang 3, bukan bagian otomatis `run_all.py`) menemukan **18 dari 751 blok** di Maynard Evans High di mana dosis rute terpendek melonjak lalu turun kembali secara tajam antara jam 12:00 dan 13:00, melewati ambang toleransi wobble raster. Kelima sekolah lain nol pelanggaran. Belum diinvestigasi lebih lanjut atau diperbaiki — dicatat di sini dan di `docs/METHODOLOGY.md` (§Fase 7) sebagai temuan terbuka. **Tidak memengaruhi gerbang G1** (dihitung di jam kanonik 15:00, bukan 12:00) dan tidak memengaruhi kategori merah/kuning/hijau final.

---

Dicatat di sini, bukan disamarkan: angka kecil, kategori kosong, dan faktor di luar rentang validasi di dokumen ini semuanya adalah **hasil pengukuran**, bukan kegagalan yang disembunyikan. Ini yang membedakan produk yang mengukur dari yang mengklaim.
