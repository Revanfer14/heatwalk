# LIMITATIONS

Kelima belas poin di bawah ini wajib tampil di halaman Limitations produk dan di slide pitch (PRD §8). Ini bukan daftar penyesalan yang dikubur di footer — ini yang membedakan HeatWalk dari klaim tanpa pengukuran. Setiap poin ditulis dengan angka konkret dari `data/out/` atau `docs/METHODOLOGY.md`, bukan sebagai kalimat generik.

Nomor mengikuti urutan PRD §8 persis. Delapan poin tambahan yang ditemukan selama pengerjaan (di luar limitasi yang sudah dituliskan PRD) ada di bagian akhir, ditandai eksplisit sebagai temuan implementasi.

---

## 1. Resolusi 60m tidak dapat membedakan trotoar sisi kiri vs kanan

Granularity raster FortyGuard adalah 60m (`GRANULARITY_M = 60`, `docs/METHODOLOGY.md` §Fase 0), dan ukuran tile terverifikasi 60,3 m setelah reproyeksi. Median panjang edge OSM di AOI ini hanya 45,4 m — lebih pendek dari satu sel raster. Konsekuensinya, skoring dilakukan di level **koridor jalan**, bukan trotoar spesifik. Dua trotoar berseberangan di jalan yang sama mendapat suhu identik dalam model ini, meski di dunia nyata satu sisi bisa lebih teduh dari sisi lain.

## 2. Bukan WBGT — indeks dosis panas berbasis suhu udara 2m

`tcm` (thermal comfort metric) FortyGuard adalah suhu udara ambien 2m AGL, diverifikasi ±3°C dari METAR referensi (`docs/METHODOLOGY.md` §Fase 0). Tidak ada wind speed maupun globe temperature — dua komponen wajib WBGT (Wet Bulb Globe Temperature), standar yang dipakai badan olahraga dan sebagian pedoman sekolah untuk keputusan aktivitas luar ruang. Produk ini secara sengaja **tidak mengklaim WBGT** dan tidak boleh disebut demikian di pitch atau UI — istilah yang dipakai selalu "indeks dosis panas berbasis suhu udara 2m".

## 3. Cakupan dibatasi jumlah tile yang berhasil ditarik

AOI final (`orl_ocps_core`, ~60 mi²) memuat **42 sekolah teranalisis** (seluruh sekolah K-12 dengan `enrollment > 0` dalam bbox, sejak `docs/METHODOLOGY.md` §Fase 9) dari 101.245 sekolah NCES nasional. Sekolah di luar bbox tampil sebagai pin abu-abu berlabel "Belum dianalisis" di Mode 1 (FR-20) — **tidak pernah** dengan angka hasil interpolasi atau tebakan. Memperluas lebih jauh (tile/bbox tambahan) tersedia tanpa kredit FortyGuard tambahan (data OSM/NCES/Census gratis), tapi butuh dukungan multi-tile yang belum dibangun (`step2_build_graph.py` dkk. masih mengasumsikan `TILES[0]` tunggal, §Fase 6) — dicatat sebagai utang teknis yang sengaja tidak diambil sebelum deadline, bukan keterbatasan yang tidak disadari.

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

Konsekuensi langsung poin 10. Kategori kuning (dose(terpendek) > threshold ≥ dose(teradem)) butuh rute teradem dan rute terpendek punya dosis yang berbeda di sisi berlawanan dari satu ambang. Karena mayoritas pasangan blok–sekolah punya `delta_mean_c = 0,000` persis (rute teradem identik dengan rute terpendek), hampir tidak ada ruang bagi satu ambang untuk memisahkan keduanya. Hasil aktual di enam sekolah gelombang 1–10: **0 blok kuning dari 2.304–3.198 blok berpenduduk**, di seluruh gelombang. **Sejak perluasan ke 42 sekolah (`docs/METHODOLOGY.md` §Fase 9), kategori kuning tidak lagi kosong — 5 dari 3.198 blok**, karena assignment blok→sekolah yang jauh lebih realistis (radius 2 mi) menghasilkan lebih banyak pasangan rute yang benar-benar duduk di sisi berlawanan ambang. Masih sangat kecil relatif terhadap 2.161 hijau dan 1.032 merah — pola dasarnya (kontras spasial kecil) tidak berubah, cuma celahnya sekarang cukup lebar untuk ditembus segelintir blok. **`THRESHOLD_DOSE_C_MIN` tidak pernah digeser** untuk memaksa kategori kuning terisi secara artifisial (dev plan §4.1, `docs/METHODOLOGY.md` Temuan 1).

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

### 16. Kalibrasi enrollment: 12 dari 42 sekolah di luar rentang 0,3–3,0 — pola sekolah menengah

`correction_factor` (`docs/METHODOLOGY.md` §Fase 7) dihitung dengan penyebut dibatasi radius jalan kaki (2,0 mi). Pada enam sekolah gelombang 3, tiga di luar rentang: Maynard Evans High (3,163×), UCP Pine Hills Charter (0,089×), Rosemont Elementary (0,232×). **Sejak perluasan ke 42 sekolah (`docs/METHODOLOGY.md` §Fase 9), dua dari tiga membaik seperti diprediksi** — Rosemont naik ke 0,483× (tetangga nyata yang tadinya belum dianalisis kini ikut menyerap blok yang salah terhitung sebagai catchment-nya) dan UCP Pine Hills naik ke 0,301× (pas di ambang bawah) — tapi Maynard Evans memburuk ke **7,777×**, dan total di luar rentang naik ke **12 dari 42**.

Polanya sekarang jauh lebih jelas dari sampel 6 sekolah: **sembilan melenceng ke atas, dan seluruh 4 SMA di AOI ini plus 3 dari 5 SMP ada di dalamnya** (Wekiva High 6,753×, Jones High 9,116×, Edgewater High 27,776×, plus Maynard Evans; Robinswood Middle 5,020×, Lockhart Middle 5,825×, College Park Middle 11,032×; juga dua charter, Orlando Science Elementary Charter 4,680× dan Orlando Science Middle/High Charter 93,141×). Diagnosis Maynard Evans dari Fase 1.5.6 ("satu-satunya SMA, catchment riil lebih besar dari bbox lama") ternyata bukan kasus khusus — ini pola struktural: catchment sekolah menengah nyata jauh lebih luas secara geografis daripada catchment SD, sementara `nearest_school_within_radius` hanya menjumlahkan anak di blok yang **paling dekat** ke bangunan sekolah itu, yang mayoritas justru lebih dekat ke SD-SD di sekitarnya. Dua yang melenceng ke bawah (AMIkids Orlando 0,110×, Lucious And Emma Nixon Academy Charter 0,152×) adalah program alternatif/charter kecil dengan enrollment non-zona — perpanjangan pola UCP Pine Hills (poin 9). Faktor-faktor ini tetap ditulis apa adanya di `summary.json` — bukan disembunyikan di balik `1.0` — karena masing-masing informatif dan sebabnya terjelaskan.

### 17. Asumsi pendinginan naungan (`SHADE_COOLING_C`) belum divalidasi lokal

Kolom FR-15 ("estimasi penurunan suhu puncak jika diteduhi") memakai konstanta seragam `SHADE_COOLING_C = 1,5°C` — dipilih konsisten dengan urutan besaran efek kanopi pohon pada suhu udara 2m yang dikutip literatur (Lanza dkk. 2023, Meng dkk. 2023), **bukan hasil pengukuran naungan nyata di AOI ini**. Diterapkan rata ke setiap edge segmen prioritas tanpa mempertimbangkan jenis pohon, kepadatan kanopi aktual, atau orientasi jalan terhadap matahari.

### 18. Geografi pendapatan dan kemiskinan tidak seragam

`lowest_income_quartile` di `summary.json` menggabungkan dua level geografi sensus berbeda: pendapatan median (ACS B19013) tersedia di level **block group**, tapi kemiskinan (ACS B17001) **disupresi total** di level block group untuk seluruh AOI ini dan harus diturunkan ke level **tract** yang lebih kasar (`docs/METHODOLOGY.md` §1.5.5). Blok dalam satu block group yang sama bisa mewarisi angka kemiskinan dari tract yang mencakup wilayah lebih luas dan lebih heterogen dari block group itu sendiri.

### 19. Satu temuan verifikasi Fase 3 belum terselesaikan

`pipeline/verify_step3.py` (dijalankan manual, bukan bagian otomatis `run_all.py`) menemukan, pada data gelombang 6-sekolah, **18 dari 751 blok** di Maynard Evans High di mana dosis rute terpendek melonjak lalu turun kembali secara tajam antara jam 12:00 dan 13:00, melewati ambang toleransi wobble raster. Kelima sekolah lain nol pelanggaran. **Sejak perluasan ke 42 sekolah (`docs/METHODOLOGY.md` §Fase 9), pola yang sama muncul di lokasi berbeda**: 16 dari 3.198 blok, tersebar di 4 sekolah (`sch_lucious_and_emma_nixon_academy_charter` ×2, `sch_orlo_vista_elementary` ×1, `sch_sunshine_high_school_greater_orlando_campus` ×3, `sch_washington_shores_elementary` ×10, jam 12:00–14:00) — Maynard Evans sendiri nol pelanggaran kali ini, karena catchment-nya turun dari ribuan blok ke 53 begitu 42 sekolah tersedia, jadi blok mana yang menampakkan wobble ini ikut bergeser mengikuti assignment baru. Fenomenanya (derau sampling raster antar-jam) identik, hanya populasinya yang berpindah. Belum diinvestigasi lebih lanjut atau diperbaiki — dicatat di sini dan di `docs/METHODOLOGY.md` (§Fase 7, §Fase 9) sebagai temuan terbuka. **Tidak memengaruhi gerbang G1** (dihitung di jam kanonik 15:00, bukan 12:00–14:00) dan tidak memengaruhi kategori merah/kuning/hijau final.

### 20. Basemap bergantung pada layanan pihak ketiga gratis tanpa SLA

Sejak §Fase 8 (`docs/METHODOLOGY.md`), peta memuat basemap dari OpenFreeMap (`tiles.openfreemap.org`, style `liberty`) alih-alih file `.pmtiles` self-hosted. Ini menggantikan bug cakupan bbox yang salah (arsip lama hanya menutupi ~seperempat AOI terkunci) dengan trade-off yang berbeda: **peta tidak lagi berfungsi tanpa internet**, dan tidak ada API key untuk dikendalikan kalau layanan ini rate-limit atau tidak tersedia di tengah masa penjurian. Gerbang "demo jalan offline" pada dev plan Fase 7 tidak lagi berlaku untuk lapisan basemap — bagian lain aplikasi (data `data/out/`, graph, routing, klasifikasi) tetap sepenuhnya statis dan offline setelah load pertama.

### 21. Empat lingkaran kebijakan menjorok keluar bbox tile data panas di sisi barat

Sejak §Fase 10 (`docs/METHODOLOGY.md`) semua blok sensus yang berpotongan bbox diklasifikasi — termasuk blok tak berpenduduk, yang otomatis membawa `kids_est = 0` — dan Mode 1 me-render gabungan blok seluruh sekolah (FR-22), sehingga lubang *di dalam* bbox tertutup. Yang tersisa murni geometri: lingkaran kebijakan 2,0 mi Meadowbrook Middle, Ridgewood Park Elementary, UCP Pine Hills Charter, dan Maynard Evans High menjorok melewati batas barat bbox tile data panas (`-81.4763`), dan blok sensus di luar bbox tidak pernah di-fetch. Terukur dari data: ±17%, ±15%, ±7%, dan ±1% luas lingkaran masing-masing tetap tanpa choropleth; Rosemont dan Rolling Hills tertutup penuh. Ini keputusan produk sadar (2026-08-27): menutupnya menuntut perluasan bbox + fetch TIGERweb/FortyGuard baru, dinilai tidak sepadan tiga hari sebelum deadline. Angka anak tidak terpengaruh — area di luar bbox memang tidak pernah masuk kolam blok.

### 22. Geocoding alamat (field Origin, Mode 2) bergantung pada Nominatim gratis tanpa SLA

Sejak amendemen 2026-08-28, mengetik alamat di field Origin dan menekan Enter/Search memanggil `nominatim.openstreetmap.org/search` langsung dari browser, dibatasi ke bbox tile (`bounded=1`, `viewbox`), tanpa API key — memenuhi aturan pengganti di `docs/METHODOLOGY.md` §Fase 8 ("tidak ada key yang bisa bocor atau habis"), sama seperti basemap OpenFreeMap di limitasi #20 di atas. Konsekuensinya sama: **tidak ada SLA**, dan layanan bisa rate-limit atau tidak tersedia saat penjurian. Ini dirancang untuk gagal senyap — pencarian yang gagal, ditolak batasnya, atau kena rate-limit meninggalkan pin persis di posisi semula dan menampilkan satu baris keterangan; chip alamat contoh dan drag pin tetap berfungsi penuh tanpa jaringan sama sekali. Pencarian dipicu submit (Enter/tombol), bukan type-ahead, justru untuk menekan volume permintaan selama demo. Bagian lain Mode 2 — routing, panel perbandingan, klasifikasi blok — tetap 100% offline setelah load pertama; geocoding adalah permintaan runtime kedua di aplikasi ini setelah basemap, keduanya keluar dari cakupan gerbang "demo jalan offline" yang sudah gugur sejak §Fase 8.

### 23. Suhu live Mode 2 (FR-29) per-sel hanya di dalam tile 5×5 km sekolah, fringe jatuh ke fallback seragam

Sejak amendemen 2026-08-28 (§Fase 14, `docs/METHODOLOGY.md`), panel Mode 2 bisa meng-upgrade suhu rute dari hari model (2023-08-08) ke hari ini lewat FortyGuard live, **per sel jalan** — bukan lagi satu offset seragam se-AOI seperti rilis awal. Batasan yang tersisa setelah perbaikan ini bergeser dari "resolusi spasial" ke "cakupan tile": satu panggilan `heatmap` di-scope ke tile 5,0 × 5,0 km berpusat di sekolah (di bawah batas 10 mi² per panggilan tier Basic), bukan seluruh AOI. Walk zone sekolah menengah (radius kebijakan 2,0 mi ≈ 3,2 km) melebihi setengah-sisi tile itu (2,5 km) — edge jalan di fringe terluar catchment sekolah besar tidak pernah tersampel live, dan jatuh kembali ke suhu model + offset seragam sebagai fallback (`web/src/lib/edgeLiveTemperatures.ts` mengembalikan `undefined` untuk edge tanpa sampel valid; `routeGraph.ts` menutupinya). Pada catchment SD (radius 2,0 mi juga per kebijakan seragam OCPS, lihat limitasi kebijakan di §1.3 PRD) fringe yang sama tetap berlaku — tile 5×5 km bukan solusi radius-aware, ia solusi biaya-aware.

Konsekuensinya: rute yang mendekati tepi walk zone sebuah sekolah bisa memakai campuran suhu live (segmen dekat sekolah) dan suhu model+offset (segmen jauh) dalam satu perhitungan dosis yang sama. Ini tidak diberi tanda visual terpisah di UI — panel hanya menyatakan suhu live aktif atau tidak secara keseluruhan, bukan per segmen. Memperluas tile menuntut memecahnya jadi beberapa panggilan `heatmap` (mosaik, seperti `TILES[]` pipeline di §5.6 PRD) yang mengalikan kredit per sekolah dibuka; dinilai tidak sepadan untuk kasus tepi yang jarang tersentuh rute aktual (sebagian besar rute pendek, berpusat dekat sekolah).

**Klasifikasi blok, `safe_until_hour`, dan seluruh `summary.json` tidak ikut bergeser** saat suhu live aktif — angka-angka itu tetap dari hari model 2023-08-08, termasuk gerbang G1 (2.955 blok merah), supaya tetap bisa direproduksi dan tidak berubah hanya karena hari ini kebetulan lebih panas atau lebih sejuk dari 2023-08-08. Panel menyatakan ini eksplisit setiap kali suhu live aktif, bukan diam-diam membiarkan rute live dan klasifikasi baseline tampak seolah dari sumber yang sama. Ini tidak berubah oleh amendemen ini.

### 24. Rute alternatif (FR-30) bisa berjumlah nol, dan tidak dijamin k-terpendek yang optimal

Sejak amendemen 2026-08-28 (§Fase 14, lanjutan keempat), Mode 2 mencari sampai **dua** rute alternatif selain rute teradem (rute terpendek dihitung untuk tabel FR-4 tapi tidak lagi ditampilkan sebagai kartu atau garis peta — lihat `docs/METHODOLOGY.md` §Fase 14 lanjutan keempat), lewat metode penalti berulang (`web/src/lib/routeAlternatives.ts`) — bukan algoritma k-shortest-path yang terbukti optimal (mis. Yen's algorithm). Metode ini cukup untuk graf jalan skala catchment sekolah dan cepat dihitung client-side, tapi dua konsekuensi mengikutinya: (1) **alternatifnya bisa saja tidak ditemukan sama sekali, atau cuma satu dari dua slot** — temuan G8 (`docs/METHODOLOGY.md` §Fase 3) sudah menunjukkan ~90% pasangan blok–sekolah punya rute teradem yang identik dengan rute terpendek, jadi jaringan lokal yang padat sering genuinely kehabisan jalur berbeda yang tidak terlalu tumpang tindih; (2) alternatif yang ditemukan adalah alternatif **pertama yang lolos ambang kemiripan** pada percobaan penalti, bukan alternatif paling optimal secara global. Panel dan peta dirancang menerima 1, 2, atau 3 kartu tanpa mematahkan layout — ini bukan bug saat sebuah pasangan asal–sekolah hanya menampilkan rute teradem tanpa alternatif sama sekali.

**Catatan terkait:** temuan #10 di atas (route choice barely reduces exposure) juga menjelaskan kenapa mengklik kartu rute yang identik dengan kartu lain tidak mengubah warna/posisi garis di peta — kedua rute digambar di koordinat yang sama persis. `hooks/useRouteFocus.ts` (§Fase 14 lanjutan, `docs/METHODOLOGY.md`) mengatasi ini dengan membingkai ulang peta (`fitBounds`) ke rute yang dipilih setiap kali kartu diklik, terlepas dari apakah geometrinya sama dengan rute lain atau tidak — jadi peta tetap terasa merespons, walau garis birunya sendiri tidak "berpindah" saat dua rute memang identik.

---

Dicatat di sini, bukan disamarkan: angka kecil, kategori kosong, dan faktor di luar rentang validasi di dokumen ini semuanya adalah **hasil pengukuran**, bukan kegagalan yang disembunyikan. Ini yang membedakan produk yang mengukur dari yang mengklaim.
