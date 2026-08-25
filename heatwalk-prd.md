# Product Requirements Document — HeatWalk

| | |
|---|---|
| **Nama produk** | HeatWalk |
| **Tagline** | Walk zones drawn by heat, not distance |
| **Versi** | 1.4 |
| **Tanggal** | 23 Agustus 2026, direvisi 25 Agustus 2026 pasca-Fase 1 |
| **Konteks** | FortyGuard Hackathon '26 |
| **Track submission** | Primary: Track 01 (Resilient Cities & Infrastructure) · Secondary: Track 07 (Data Analysis & Correlation) |
| **Deliverable wajib** | Working software prototype · Pitch presentation · Demo video |
| **Deadline** | 30 Agustus 2026, 23:59 GST |

---

## 1. Ringkasan

### 1.1 Masalah

Distrik sekolah di AS menentukan siapa yang naik bus dan siapa yang jalan kaki dengan menarik lingkaran radius dari sekolah — umumnya 1 mil untuk SD, 1,5 mil untuk SMP, 2 mil untuk SMA. Lingkaran itu murni geometris dan tidak memperhitungkan panas sama sekali.

Akibatnya dua anak berjarak identik dari sekolah mendapat keputusan yang sama, meskipun satu berjalan di bawah kanopi pohon dan satu lagi menyeberangi parkiran aspal terbuka.

Konsekuensinya menimpa dua pihak berbeda:

| Pihak | Konsekuensi |
|---|---|
| Transportation Director | Tidak punya dasar terukur untuk memberi bus pada anak yang jalurnya berbahaya secara termal |
| Orang tua & siswa | Anaknya tetap harus berjalan, tanpa informasi jalur mana yang lebih aman |

HeatWalk melayani keduanya dari satu perhitungan yang sama.

### 1.2 Konteks kunci: mekanisme hukumnya sudah ada

Ini reframing terpenting dalam dokumen ini. HeatWalk tidak mengusulkan kebijakan baru — ia mengisi input yang hilang pada kebijakan yang sudah berjalan dan sudah dibiayai.

Hampir seluruh negara bagian punya ketentuan **"hazardous walking conditions"** yang membolehkan distrik memberi layanan bus kepada siswa **di dalam** walk zone bila jalurnya dinilai berbahaya:

| Negara bagian | Ketentuan |
|---|---|
| Florida | Dana negara bagian untuk siswa K–6 yang menghadapi hazardous walking condition. TA 2019–2020: **19.693 penumpang bus tambahan** lewat mekanisme ini |
| New Mexico | Siswa kelas berapa pun boleh diangkut pada jarak lebih pendek dari ketentuan UU, bila dewan sekolah lokal menetapkan adanya kondisi berbahaya |
| Utah | Dewan sekolah lokal boleh menyetujui pengangkutan di area berbahaya, dibiayai dana umum dewan atau Board Local Levy |
| Texas | Distrik bisa menerima dana di luar alokasi transportasi reguler untuk anak dalam radius 2 mil yang menghadapi kondisi berbahaya |
| Montgomery County, MD | Siswa yang menghadapi hazardous walking conditions berhak naik bus tanpa memandang jarak |

**Seluruh kriteria "berbahaya" bersifat lalu lintas:** jumlah lalu lintas, batas kecepatan, jumlah lajur, keberadaan alat pengatur lalu lintas, lebar permukaan jalur (Florida: berbahaya bila kurang dari 4 kaki).

**Panas tidak ada dalam daftar mana pun.** Bukan karena ada yang memutuskan panas tidak berbahaya, melainkan karena tidak pernah ada cara mengukurnya per blok.

Mekanisme ini juga punya alur **permohonan tertulis dari orang tua** ke direktur transportasi, yang berjalan sepanjang tahun ajaran. Inilah yang menghubungkan dua mode HeatWalk: mode orang tua menghasilkan permohonan, mode distrik memprosesnya.

> **Posisi produk:** Distrik sudah punya kewenangan hukum dan pendanaan untuk mem-bus-kan anak di dalam walk zone. Yang belum ada adalah data untuk memasukkan panas ke dalam definisi "berbahaya". Itu yang HeatWalk sediakan.

### 1.3 Temuan Fase 1 yang mengubah dokumen ini

**Tanggal 25 Agustus 2026, gerbang kontras AOI gagal pada 8 dari 8 kandidat.**

Delapan kotak diuji di dua kota dengan empat mekanisme fisik berbeda — gradien elevasi, efek oasis irigasi, kontras urban/gurun, kanopi vs arteri. Kontras spasial terbaik (`orl_pine_hills_n`) hanya **1,84°C** (p95−p05), sementara gerbang mensyaratkan ≥6°C dan ambang darurat "ganti AOI" ada di <4°C.

Ini bukan kegagalan pemilihan AOI. Ini konsekuensi fisika yang konsisten dengan hasil Fase 0: `tcm` terverifikasi sebagai suhu udara 2m AGL, dan pada siang hari lapisan batas atmosfer sudah tercampur secara konvektif sehingga variasi suhu udara intra-urban dalam radius 5 km umumnya hanya 1–3°C. Kontras 15–25°C yang terlihat di peta panas kota adalah **suhu permukaan**, bukan suhu udara — dan itulah yang dipetakan hampir seluruh prior art di §1.6B.

> Kalau AOI mana pun menghasilkan kontras spasial >10°C pada `tcm`, itu justru alarm bahwa `tcm` bukan suhu udara. Hasil kecil ini adalah konfirmasi ulang Fase 0, bukan kontradiksinya.

**Yang mati:** klaim "pilih rute lain, hemat 4°C". Delta rata-rata berbobot panjang antar dua rute realistis dalam AOI seperti ini diperkirakan 0,5–0,8°C. Tidak ada kalibrasi yang menyelamatkannya tanpa memanipulasi angka.

**Yang tidak tersentuh sama sekali:**

| Elemen | Kenapa selamat |
|---|---|
| FR-8 kategori merah | Bergantung pada **dosis absolut**, bukan kontras antar-rute |
| Mekanisme hukum §1.2 | Tidak bergantung pada data apa pun |
| G6 angka salah klasifikasi | Bergantung pada ambang, bukan selisih |
| FR-16 sembunyikan data panas | Bergantung pada keberadaan layer, bukan besarnya delta |
| FR-5 tombol permohonan | **Justru menguat** — lihat di bawah |

Ironisnya premis produk jadi lebih tajam. Bukan lagi *"sebagian rute panas, pilih yang adem"*, melainkan:

> **Tidak ada rute yang aman, di mana pun, di seluruh walk zone.**

Itu argumen yang jauh lebih sulit dibantah di rapat school board, dan otomatis memisahkan HeatWalk dari kolam "cool route planner" yang dikhawatirkan di §1.6.

#### Pivot: kontras dipindahkan dari ruang ke tiga sumbu lain

Ketiganya tetap bersumber dari FortyGuard, jadi kriteria "API sentral" tidak melemah.

**Sumbu 1 — waktu (paling besar, paling murah).**
Slice 07:30 vs 14:45 pada hari panas diperkirakan berselisih 9–11°C pada rute yang sama, anak yang sama. Ini persis format measurable outcome yang diminta panitia, dan merupakan keputusan distrik yang nyata: geser jam bubar, atau sediakan layanan khusus sesi sore. **Konsekuensi: FR-13 naik dari P1 ke P0.**

**Sumbu 2 — durasi × circuity.**
Dosis = kelebihan suhu × waktu tempuh. Blok dengan jarak lurus 0,9 mi tetapi jarak jaringan 1,4 mi menerima dosis ~55% lebih besar pada suhu identik. Lingkaran radius resmi buta terhadap ini sepenuhnya. Output baru: **radius setara-dosis** — *"pada sore Agustus p95, radius yang dapat dipertahankan untuk SD adalah 0,42 mi, bukan 1,0 mi."*

**Sumbu 3 — exceedance (di sinilah 1,84°C menjadi load-bearing).**
Ambang bersifat nonlinear. Dua blok berselisih 1,8°C pada ambang 40°C dapat berbeda 87 vs 143 hari melewati ambang per tahun ajaran — kontras 1,8°C berubah menjadi kontras 64%. Ini bukan mengakali angka; ini persis alasan satuan dosis di atas baseline dipilih sejak awal.

Cara termurah memperolehnya: **jangan tarik 180 heatmap.** Ambil distribusi harian dari rekaman stasiun (Iowa Environmental Mesonet ASOS, jam-jaman sejak 2019, gratis), lalu pakai FortyGuard sebagai **offset spasial per blok** terhadap stasiun itu. FortyGuard tetap satu-satunya sumber yang dapat memberi offset per-blok 60m — dan justru offset kecil itulah yang menentukan selisih puluhan hari.

### 1.3.1 Solusi

HeatWalk mengganti fungsi impedance pada perhitungan walk zone dari **jarak** menjadi **dosis panas kumulatif (°C·menit)**, memakai suhu udara 2m AGL resolusi 60m dari FortyGuard sebagai bobot jaringan jalan pejalan kaki.

Dari satu graph berbobot dosis itu, keluar dua produk:

**Mode 1 — Tampilan distrik (Transportation Director)**
Peta zona + daftar reklasifikasi: blok mana yang seharusnya dipindahkan dari status "jalan kaki" ke "eligible bus", beserta bukti pendukungnya.

**Mode 2 — Cek alamat (Orang tua / Siswa)**
Input alamat rumah + sekolah → rute jalan kaki dengan dosis panas terendah, dibandingkan dengan rute terpendek. Untuk anak yang tetap harus berjalan, ini satu-satunya bentuk bantuan yang tersedia hari ini.

**Aturan yang menghubungkan keduanya:**

> Sebuah blok masuk daftar reklasifikasi bus **kalau rute teradem yang tersedia pun masih melewati ambang dosis.**

Kalau masih ada rute aman, blok itu tidak direkomendasikan bus — orang tuanya diarahkan ke Mode 2 dengan rute tersebut.

Aturan ini membuat kedua mode konsisten secara aritmetika (satu perhitungan, bukan dua) dan menjawab pertanyaan paling mematikan di rapat school board: *"kenapa tidak suruh anaknya lewat jalan lain saja?"* — jawabannya jadi bukti, bukan opini.

Efek samping yang penting: aturan ini membuat daftar reklasifikasi **lebih pendek**. Terdengar seperti kerugian, padahal ini nilai jual. Distrik tidak akan mengadopsi tool yang bilang "500 anak harus dibusin". Tool yang bilang "142 anak benar-benar tidak punya opsi, 300 sisanya cukup diganti jalurnya" jauh lebih mungkin dipakai.

### 1.4 Product goals

| # | Goal | Ukuran keberhasilan |
|---|---|---|
| **G1′** | Membuktikan waktu berangkat mengubah paparan secara terukur pada rute yang sama | Delta suhu rata-rata berbobot panjang antara slice 07:30 dan 14:45, dalam °C dan °F. **Target: ≥6°C** |
| **G2′** | Membuktikan radius kebijakan tidak dapat dipertahankan secara termal | Radius setara-dosis ≤70% radius kebijakan resmi, dinyatakan dalam mil |
| G2b | Pemilihan rute menurunkan paparan | Selisih °C dan % dosis antara rute terpendek dan teradem. **Dilaporkan apa adanya, bukan gerbang.** Diperkirakan 0,5–0,8°C berdasarkan Fase 1 |
| **G3** | Mengkuantifikasi paparan yang dihilangkan oleh keputusan bus | °C·menit per anak per hari dan per tahun ajaran yang tereliminasi |
| **G4** | Membuktikan sebagian blok benar-benar tidak punya opsi | Jumlah blok yang rute teradem-nya tetap melewati ambang |
| G5 | Menghasilkan batas walk zone yang berbeda nyata dari lingkaran | Selisih area ≥15% antara lingkaran dan zona dosis panas |
| G6 | Mengkuantifikasi siswa yang salah klasifikasi | Angka absolut + persentase per sekolah, terkalibrasi ke enrollment CCD |
| G7 | Membuktikan FortyGuard sentral, bukan periferal | Demo cabut-API: zona kolaps jadi lingkaran, rute teradem kolaps jadi rute terpendek |
| G8 | Membuktikan jalur adopsi nyata | Export yang dapat masuk ke mekanisme hazardous walking + software incumbent |
| **G9** | Membuktikan selisih spasial kecil tetap berkonsekuensi besar | Rentang exceedance antar-blok ≥40 hari per tahun ajaran |
| G10 | Membuktikan pipeline distrik-agnostik | Pipeline jalan penuh di AOI kedua (Phoenix) tanpa perubahan satu baris kode, hanya `config.py` |
| **G11** | Membuktikan cakupan bukan batasan arsitektur | Jumlah sekolah dengan zona penuh; target seluruh area padat sekolah OCPS. Menambah cakupan = menambah entri `TILES`, nol kode baru |

**Gerbang lama G1/G2 (delta antar-rute ≥4°C) dicabut pada 25 Agustus 2026** setelah gagal terverifikasi pada 8 dari 8 kandidat AOI. Alasan fisiknya di §1.3. Pencabutan ini **wajib dinyatakan terbuka** di halaman Limitations dan di pitch — ini temuan hasil pengukuran, bukan penyesuaian target agar terlihat lulus.

### 1.5 Non-goals

- ❌ **Optimasi rute bus / vehicle routing.** Anak di dalam bus berada di ruangan ber-AC — paparan panasnya nol. Data suhu 60m tidak memberi informasi apa pun ke keputusan itu, dan juri akan langsung bertanya kenapa ini butuh FortyGuard. Yang panas adalah jalan kaki dari rumah ke halte, bukan bus-nya
- ❌ Navigasi turn-by-turn atau rekomendasi sisi trotoar — resolusi 60m tidak mendukung
- ❌ Prediksi suhu dalam ruangan
- ❌ Klaim WBGT — tidak ada wind speed & globe temperature (kecuali terverifikasi tersedia, lihat §11)
- ❌ **Analisis multi-kota.** Cakupan analisis penuh menyasar seluruh OCPS lewat mosaik tile (§5.6). Kota lain **tidak** dianalisis. Seluruh sekolah AS tetap hadir di peta sebagai pin NCES (FR-20), tanpa satu pun angka — kehadiran pin bukan klaim analisis. AOI Phoenix dijalankan pipeline-only sebagai bukti portabilitas (G10) dan tidak masuk UI (§5.5)
- ❌ **Autentikasi user, role, dan database persisten.** Submission form field 12 mewajibkan live demo terbuka di jendela incognito **tanpa login dan tanpa install**, dan panitia menyatakan mereka akan mengeceknya sendiri. Login di depan produk bukan sekadar menambah risiko — ia menggagalkan syarat submission. Dua mode dipisahkan lewat route (`/` dan `/district`) plus satu switch di header, bukan lewat akun. Tidak ada yang perlu disimpan: seluruh output pipeline sudah berupa file statis yang di-commit

### 1.6 Competitive landscape

#### A. Software transportasi sekolah (incumbent)

Industri mapan: **Transfinder**, **Tyler Technologies Versatrans/Traversa**, **EDULOG** (school-first); Optibus, Trapeze, Remix (transit-first).

Harga nyata: distrik <5.000 siswa membayar $4.000–$12.000/tahun; distrik menengah $15.000–$50.000; Loudoun County Public Schools membayar **$592.000/tahun**.

Peta Versatrans **sudah punya layer "hazardous zones and streets"** — tetapi tidak punya data untuk mengisinya dengan panas.

**Posisi HeatWalk — komplementer, bukan kompetitor.** Software mereka *mengeksekusi* keputusan (bikin rute optimal setelah tahu siapa yang eligible). HeatWalk *menghasilkan input* untuk keputusan itu.

→ Konsekuensi produk: export CSV/GeoJSON (FR-14) bukan fitur pelengkap, melainkan **titik integrasi strategis** ke infrastruktur yang sudah dipakai distrik.

#### B. Prior art riset

| Nama | Pihak | Perbedaan dengan HeatWalk |
|---|---|---|
| "School Routes Aren't the Coolest" (Austin) | American Forests + UCLA Luskin + ASU SHaDE Lab + Austin ISD | Memetakan **naungan yang dimodelkan** (LiDAR + geometri matahari), output story map edukatif |
| "Thermal Walkability" / Cool Routes | Khan, Buo & Middel (ASU) | Model SOLWEIG, MRT per jam, output indeks akademik |
| Heat Factor | First Street Foundation | Skor per properti, resolusi kasar, untuk pembeli rumah |
| Temperature Dashboard® | FortyGuard sendiri | Jangan dibangun ulang — ini produk vendor |

**Delta HeatWalk:** (1) suhu udara **terukur** 2m AGL, bukan naungan dimodelkan; (2) output berupa **keputusan administratif** — radius setara-dosis dan daftar reklasifikasi — bukan peta untuk dilihat; (3) tidak ada satu pun yang menghitung angka siswa salah klasifikasi.

**Delta keempat, hasil Fase 1:** seluruh prior art di atas memetakan **naungan atau suhu permukaan**, dan dari situ menyiratkan bahwa pemilihan rute memberi manfaat besar. HeatWalk mengukur **suhu udara** dan menemukan bahwa manfaat itu kecil (§1.3) — lalu melaporkannya, bukan menyembunyikannya. Sejauh yang diketahui, tidak ada prior art yang menguji dan mempublikasikan hasil negatif ini.

⚠️ **Cool route planner adalah contoh pertama yang panitia tulis sendiri di Track 01.** Kolam ini akan ramai. Diferensiasi HeatWalk bukan pada rutenya, melainkan pada mekanisme hukum, persona berkonsekuensi, dan aturan kausal di §1.3.1. Setelah Fase 1 ini makin benar: rutenya memang bukan nilai jualnya (§1.3). Ini harus eksplisit di menit pertama pitch, bukan diasumsikan terlihat sendiri.

### 1.7 Pemetaan ke kriteria penilaian resmi

Kriteria panitia: *"Real use of the platform (the API or Dashboard is central, not decorative); a clear problem and user; a measurable outcome (e.g. −7°F (−4°C) on this route); and a path to real-world deployment. Judges reward applied relevance over flashy demos."*

| Kriteria | Bukti dalam produk |
|---|---|
| **API sentral, bukan dekoratif** | Tombol "sembunyikan data panas" (FR-16): zona kolaps jadi lingkaran, rute teradem kolaps jadi rute terpendek, produk kembali ke status quo |
| **Problem & user jelas** | Dua persona, dua keputusan nyata, satu mekanisme hukum yang sudah berjalan |
| **Measurable outcome** | G1′ delta °C antar-jam pada rute sama · G2′ radius setara-dosis vs radius kebijakan · G3 °C·menit tereliminasi · G9 rentang exceedance. Panel rute (FR-4) memakai format °C dan °F persis seperti contoh panitia |
| **Path to deployment** | Mekanisme hukum + pendanaan negara bagian + software penerima semuanya sudah eksis (§1.2, §1.6A) |

**Alokasi usaha.** Kalimat *"judges reward applied relevance over flashy demos"* adalah instruksi prioritas eksplisit:

| Prioritaskan | Korbankan lebih dulu |
|---|---|
| Kalibrasi enrollment ke CCD | Animasi transisi zona |
| Halaman metodologi & keterbatasan | Styling peta yang cantik |
| Export CSV yang benar-benar bisa dipakai | Slider waktu yang super mulus |
| Angka delta suhu yang dapat diverifikasi | Efek hover, mikrointeraksi |
| Melaporkan temuan negatif Fase 1 secara terbuka | Menyembunyikannya agar demo terlihat mulus |

---

## 2. Target user

### 2.1 Primary A — Transportation Director (Mode 1)

| | |
|---|---|
| **Jabatan** | Transportation Director / Coordinator di distrik sekolah |
| **Konteks** | Mengelola armada bus untuk banyak sekolah dalam satu distrik |
| **Keputusan** | Setiap tahun menentukan siswa mana yang eligible bus; sepanjang tahun memproses permohonan hazardous walking dari orang tua |
| **Alat saat ini** | Peta GIS distrik + aturan radius tertulis |
| **Pain point** | Tidak punya cara mengetahui jalur mana yang berbahaya secara termal; keputusan hanya bisa dibela dengan "sesuai aturan jarak" |
| **Butuh dari HeatWalk** | Daftar blok yang direkomendasikan bus + bukti yang bisa dibawa ke rapat school board |

### 2.2 Primary B — Orang tua / Siswa (Mode 2)

| | |
|---|---|
| **Konteks** | Anaknya berada di dalam walk zone dan tidak mendapat bus |
| **Frekuensi** | Harian saat musim panas; meningkat tajam saat gelombang panas |
| **Keputusan** | Rute mana yang ditempuh anaknya setiap hari; apakah perlu mengajukan permohonan hazardous walking |
| **Alat saat ini** | Tidak ada. Google Maps memberi rute terpendek, tanpa informasi panas |
| **Butuh dari HeatWalk** | Rute teradem yang konkret, atau — kalau tidak ada rute aman — dasar tertulis untuk mengajukan permohonan ke distrik |

Persona ini adalah satu-satunya pemakaian harian produk, dan ia memberi makan Mode 1 lewat alur permohonan tertulis. Tanpa Mode 2, HeatWalk hanya dipakai sekali setahun.

### 2.3 Secondary — Facilities / City Parks Planner

Membutuhkan tabel prioritas segmen jalan untuk alokasi anggaran naungan dan penanaman pohon. Muncul sebagai efek samping FR-15, bukan target desain.

### 2.4 Peringatan fokus

Godaan terbesar: mendesain untuk semua persona sekaligus. **Desain untuk 2.1 dan 2.2 saja.** Keduanya berbagi satu engine, satu peta, dan satu objek visual (rute teradem) — itu yang membuat ini satu produk, bukan dua aplikasi yang digabung paksa.

---

## 3. User stories

### Mode 2 — Orang tua / Siswa (P0)

| ID | Sebagai | Saya ingin | Sehingga |
|---|---|---|---|
| US-01 | Orang tua | memasukkan alamat rumah dan nama sekolah | tahu apakah anak saya kebagian bus atau tidak |
| US-02 | Orang tua | melihat rute terpendek dan rute teradem berdampingan di peta | tahu jalur mana yang harus ditempuh anak saya |
| US-03 | Orang tua | melihat selisihnya dalam °C dan °F | paham seberapa besar bedanya tanpa perlu mengerti °C·menit |
| US-04 | Orang tua | diberi tahu kalau **tidak ada** rute aman | tahu bahwa masalahnya bukan pilihan jalur saya |
| US-05 | Orang tua | menyalin teks dasar permohonan | bisa mengajukan hazardous walking ke distrik |

### Mode 1 — Transportation Director (P0)

| ID | Sebagai | Saya ingin | Sehingga |
|---|---|---|---|
| US-06 | Direktur | mengklik sekolah di peta | melihat walk zone-nya dievaluasi ulang berdasarkan panas |
| US-07 | Direktur | melihat lingkaran resmi dan zona dosis panas bertumpuk | memahami seberapa jauh aturan saat ini meleset |
| US-08 | Direktur | melihat blok terbagi tiga kategori | langsung tahu area mana yang perlu tindakan dan tindakan apa |
| US-09 | Direktur | mengklik satu blok dan melihat "kenapa" | melihat rute teradem yang gagal sebagai bukti visual |
| US-10 | Direktur | melihat angka total siswa salah klasifikasi per sekolah | punya satu angka untuk dibawa ke rapat anggaran |

### P1 — Sangat diinginkan

| ID | Sebagai | Saya ingin | Sehingga |
|---|---|---|---|
| US-11 | Direktur | mengunduh daftar reklasifikasi sebagai CSV/GeoJSON | memasukkannya ke Transfinder/Versatrans yang sudah dipakai distrik |
| US-12 | Orang tua | menggeser slider antara jam masuk dan jam bubar | tahu kapan risikonya paling tinggi |
| US-13 | Facilities Planner | melihat tabel segmen jalan berperingkat | tahu di mana menanam pohon lebih dulu |
| US-14 | Sistem | menjalankan refresh forecast | membuktikan pipeline hidup |

---

## 4. Functional requirements

### Mode 2 — Cek alamat (pintu masuk default)

#### FR-1 — Input alamat + sekolah *(P0)*

- Satu input alamat (geocoding sederhana) + dropdown sekolah dalam AOI
- Pin dapat digeser di peta sebagai alternatif input teks
- Batas AOI ditampilkan sebagai boundary halus; klik di luar → "Area ini belum dipetakan"
- ⚠️ **Jangan pakai `navigator.geolocation` untuk demo** — lokasi developer bukan di AS. Pakai pin yang bisa digeser, default di tengah AOI

#### FR-2 — Penentuan status *(P0)*

Output pertama selalu satu kalimat status:
```
Rumah kamu 1,1 mil dari SD Lincoln — di dalam walk zone.
```

#### FR-3 — Dua rute di peta *(P0)*

- Polyline rute terpendek: garis tipis, warna netral
- Polyline rute teradem: garis tebal, berwarna
- Keduanya di-render dari `graph.json` pre-computed, **tanpa panggilan API saat runtime**

#### FR-4 — Panel perbandingan rute *(P0)*

Dua blok perbandingan, bukan satu. **Blok waktu ditampilkan lebih dulu dan lebih menonjol**, karena di situlah selisih terbesar berada (§1.3).

```
Rumah kamu → SD Lincoln
Rute teradem, berangkat jam berapa?

              07:30        14:45        Selisih
Suhu rata2    31,4°C       40,8°C       +9,4°C  (+16,9°F)
Suhu puncak   33,1°C       44,0°C       +10,9°C (+19,6°F)
Dosis panas    72 °C·mnt   503 °C·mnt   +598%
```

```
Pilihan rute pada jam bubar (14:45)

              Terpendek    Teradem      Selisih
Jarak         1,42 km      1,68 km      +260 m
Waktu         20 mnt       23 mnt       +3 mnt
Suhu rata2    41,2°C       40,5°C       −0,7°C  (−1,3°F)
Suhu puncak   44,0°C       42,9°C       −1,1°C  (−2,0°F)
Dosis panas   503 °C·mnt   468 °C·mnt   −7%
```

Baris suhu **wajib menampilkan °C dan °F**. Ini format persis yang dipakai panitia di kriteria penilaian, dan audiens distrik sekolah AS berpikir dalam °F.

**Angka blok kedua tidak boleh dibesar-besarkan.** Kalau selisihnya memang −0,7°C, tulis −0,7°C. Panel ini justru menjadi bukti argumen produk: pilihan rute bukan solusinya, dan itulah sebabnya sebagian anak butuh bus.

#### FR-5 — Kasus "tidak ada rute aman" *(P0)*

Bila rute teradem pun melewati ambang:

```
Rute teradem pun rata-rata 41,2°C.
Blok kamu masuk rekomendasi bus.

[Salin sebagai dasar permohonan hazardous walking]
```

Tombol salin menghasilkan teks siap tempel berisi alamat, sekolah, suhu rata-rata dan puncak rute teradem, dosis °C·menit, dan referensi ketentuan negara bagian yang berlaku.

Ini penghubung ke Mode 1: permohonan yang dihasilkan di sini adalah input yang diproses di sana.

### Mode 1 — Tampilan distrik

#### FR-6 — Pemilihan sekolah *(P0)*

Peta menampilkan pin seluruh sekolah NCES (FR-20). Klik pin sekolah teranalisis → memuat graph dan blok sekolah itu secara on-demand, lalu render analisis. Panel menampilkan nama, jenjang, total enrollment (NCES CCD), aturan walk zone yang berlaku, dan radius setara-dosis (FR-18).

Daftar sekolah di kolom kiri dapat dicari dan difilter ke "sudah dianalisis". Pada skala ratusan sekolah, daftar adalah jalur navigasi utama, bukan peta — dan ia sekaligus jalur setara yang dapat dibaca screen reader (§aksesibilitas `DESIGN.md`).

#### FR-7 — Rendering dua batas *(P0)*

- **Layer A:** lingkaran walk zone resmi — garis putus-putus, tanpa isian
- **Layer B:** zona dosis panas — choropleth per census block, terisi warna

Keduanya tampil bersamaan secara default; masing-masing dapat di-toggle.

Catatan visual: karena engine berbasis graph (§6), Layer B berbentuk kotak-kotak per blok, bukan gumpalan mulus. Ini disengaja dan lebih jujur — datanya memang per blok.

#### FR-8 — Klasifikasi tiga zona *(P0)*

| Zona | Warna | Definisi |
|---|---|---|
| Aman jalan kaki | Hijau | Rute terpendek sudah di bawah ambang |
| Perlu pemilihan rute | Kuning | Rute terpendek melewati ambang, **tapi ada rute teradem yang aman** |
| Direkomendasikan bus | Merah | **Rute teradem pun melewati ambang** |

Kategori kuning memisahkan masalah yang bisa diselesaikan gratis (ganti jalur) dari masalah yang butuh anggaran (bus). Ini yang membuat rekomendasi HeatWalk dapat dipercaya secara fiskal.

**Ambang batas:** turunan dari Lanza dkk. (2023) yang mengidentifikasi 33°C sebagai titik balik perilaku anak. Ambang dosis dihitung sebagai akumulasi °C·menit di atas baseline sepanjang jalur. **Nilai pastinya dikalibrasi saat implementasi dan wajib didokumentasikan sebagai parameter yang dapat diubah.**

#### FR-9 — Panel detail blok *(P0)*

Klik blok → panel menampilkan:
- Estimasi jumlah anak usia sekolah di blok
- **Suhu rata-rata & puncak rute teradem (°C dan °F)** — ditampilkan lebih menonjol daripada °C·menit
- Dosis rute terpendek vs rute teradem
- Delta terhadap blok hijau terdekat pada jarak setara (°C)
- Status klasifikasi saat ini + rekomendasi perubahan

#### FR-10 — "Lihat kenapa" *(P0)*

Klik blok merah → render rute teradem yang **gagal** di peta, dengan segmen penyumbang dosis tertinggi di-highlight.

Objeknya identik dengan yang dilihat orang tua di FR-3. Itu yang membuat dua mode ini satu produk, bukan dua.

#### FR-11 — Panel outcome kuantitatif *(P0)*

Setiap rekomendasi pemindahan ke bus harus menampilkan paparan yang **dihilangkan**, bukan hanya paparan yang ada:

```
Memindahkan 142 anak di Maple Ave ke bus menghilangkan:
  214 °C·menit per anak per hari
  ±38.500 °C·menit per anak per tahun ajaran (180 hari)
  Setara menghapus 43 menit berjalan di 42°C setiap hari
```

Baris terakhir wajib ada. °C·menit tidak intuitif; terjemahan ke "menit di suhu X" membuatnya dapat dipahami tanpa penjelasan.

#### FR-12 — Ringkasan sekolah *(P0)*

```
Siswa di walk zone            [n]
Cukup ganti rute              [n]  ([%])
Tidak punya rute aman         [n]  ([%])
Kuartil pendapatan terbawah   [n]  ([%] dari yang berisiko)

Salah klasifikasi:
  Dapat bus, tidak perlu      [n]
  Jalan kaki, seharusnya bus  [n]
```

#### FR-13 — Slider waktu *(P0 — dinaikkan dari P1 pada 25 Agu 2026)*

- Minimal dua state: jam masuk (~07.30) dan jam bubar (~14.45)
- Idealnya slider per jam sepanjang jam sekolah
- Perubahan slider me-render ulang dari file pre-computed, **bukan panggilan API**
- Hadir di **kedua mode**: Mode 2 sebagai kontrol utama panel FR-4, Mode 1 sebagai kontrol layer zona

Naik ke P0 karena sumbu waktu kini memikul measurable outcome utama (G1′). Dua state statis sudah memenuhi P0; slider per jam tetap P1.

#### FR-18 — Radius setara-dosis *(P0 — baru)*

Untuk tiap sekolah, hitung dan tampilkan radius lingkaran yang **seharusnya** dipakai kalau kriterianya dosis, bukan jarak: jarak terjauh dari sekolah yang rute teradem-nya masih di bawah ambang, pada slice 14:45.

```
Radius kebijakan     1,00 mi
Radius setara-dosis  0,42 mi   (−58%)
```

Dirender sebagai lingkaran ketiga di peta Mode 1, dan sebagai satu baris di ringkasan sekolah FR-12. Ini pengganti langsung untuk headline "−6,2°C" yang hilang, dan ia berbicara dalam satuan yang sudah dipakai kebijakan distrik hari ini.

#### FR-20 — Lapisan sekolah nasional *(P0 — baru)*

Peta merender **seluruh sekolah dari NCES Common Core of Data**, bukan hanya yang teranalisis. Data ini gratis, tidak menyentuh kredit FortyGuard, dan sudah dipakai di §5.2.

| Status sekolah | Render | Klik |
|---|---|---|
| Teranalisis | Pin penuh, dapat dipilih | Memuat zona + blok + rute |
| Belum teranalisis | Pin abu-abu kecil | "Belum dianalisis — tile ini belum ditarik" |

Zoom keluar memperlihatkan ribuan sekolah; zoom masuk memperlihatkan mana yang sudah punya zona. Cakupan menjadi terlihat sebagai **progres**, bukan sebagai batas.

**Aturan keras:** sekolah belum teranalisis **tidak boleh** menampilkan angka apa pun — bukan interpolasi, bukan rata-rata regional, bukan estimasi. Nol angka. Satu angka karangan yang ditemukan juri membatalkan kriteria "real use of the platform" untuk seluruh submission.

Sumber: NCES CCD school directory (lat/lon, nama, jenjang, enrollment, distrik). Dimuat sebagai satu file terpisah dan di-render sebagai layer simbol MapLibre — bukan marker DOM, yang akan mematikan browser pada jumlah segini.

#### FR-21 — Peta cakupan tile *(P1 — baru)*

Layer tipis yang menampilkan batas tile yang sudah ditarik, dengan tanggal fetch dan jam slice-nya. Menjawab "data ini dari mana" secara visual, dan memperlihatkan pipeline sebagai sesuatu yang berjalan bertahap, bukan sekali jadi.

#### FR-19 — Exceedance per blok *(P1 — baru)*

Berapa hari per tahun ajaran rute teradem sebuah blok melewati ambang. Sumber: distribusi harian stasiun ASOS dikombinasikan dengan offset spasial per blok dari FortyGuard (§1.3, sumbu 3).

Ditampilkan di panel detail blok FR-9 dan di kolom export FR-14. Ini pembawa G9.

#### FR-14 — Export CSV / GeoJSON *(P1)*

Unduh daftar reklasifikasi berisi kolom: blok · estimasi anak · status sekarang · rekomendasi · suhu rata-rata rute teradem (°C) · dosis (°C·menit) · alasan.

Ini titik integrasi ke Transfinder/Versatrans/EDULOG yang sudah punya layer "hazardous zones and streets". Sebutkan eksplisit di pitch sebagai jawaban atas "kenapa bukan incumbent saja yang bikin?"

#### FR-15 — Tabel prioritas segmen *(P1)*

Tabel terurut: nama segmen jalan · jumlah anak terdampak · estimasi penurunan suhu puncak (°C) · estimasi penurunan dosis (%) jika diteduhi.

Kolom penurunan suhu wajib ada — inilah bentuk measurable outcome untuk intervensi naungan.

### Lintas-mode

#### FR-16 — Tombol "Sembunyikan data panas" *(P0)*

Satu tombol yang mengembalikan produk ke status quo:
- Layer B hilang → tersisa lingkaran walk zone resmi saja
- Rute teradem hilang → tersisa rute terpendek saja

Fungsinya adalah demonstrasi kriteria "API sentral, bukan dekoratif" dalam satu klik. Juri melihat langsung apa yang distrik punya hari ini versus apa yang FortyGuard tambahkan. **Fitur paling murah dibangun dengan dampak persuasif tertinggi di seluruh dokumen ini.**

#### FR-17 — Refresh forecast *(P1)*

Satu tombol yang memicu panggilan live ke FortyGuard forecast 12 jam, membuktikan pipeline berfungsi. Wajib punya loading state dan error handling yang jelas, dan terisolasi total dari jalur demo utama.

---

## 5. Data requirements

### 5.1 FortyGuard API

Tiga endpoint yang dipakai dari tujuh yang tersedia. Sisanya Premium-only.

| Endpoint | Parameter | Fungsi dalam produk | Prioritas |
|---|---|---|---|
| `POST /v1/heatmap` | `tcm`, granularity 60m | **Bobot dosis per edge jalan. Satu-satunya yang load-bearing — tanpa ini tidak ada produk** | P0 |
| `POST /v1/heatmap` | `time_of_measure` | Variasi per jam untuk slider jam masuk vs jam bubar | P0 |
| `GET /v1/status/{activity_id}` | — | Polling job async. Wajib, semua endpoint analisis bersifat async | P0 |
| `POST /v1/env_params` | GHI + wet bulb + relative humidity | Beban radiasi matahari & kelembapan → argumen "bukan sekadar suhu udara" | P1 |
| `POST /v1/heatmap` | `exceedance` | Berapa hari per tahun ajaran jalur melewati ambang | P1 |
| `POST /v1/heatmap` | `persistence` | Durasi panas bertahan di suatu titik | P2 |
| `GET /v1/system/fetch-api-key-usage` | — | Menjaga kredit trial tidak habis | Ops |

**Tidak dipakai:** Satellite View Segmentation, Street View Segmentation, Heat Intelligence — semuanya Premium-only.

**Batasan tier Basic yang harus dihormati:**

- **AOI maksimum 10 mi² per panggilan ≈ 5,1 km × 5,1 km.** Ini batas per-panggilan, **bukan** batas cakupan produk. Cakupan dibangun dengan **memosaikkan banyak tile** (§5.6). Satu walk zone SD radius 1 mil = 3,14 mi², jadi satu tile memuat beberapa walk zone penuh
- **Biaya flat 4.220 kredit per panggilan**, terverifikasi Fase 1 dengan tiga panggilan terkontrol (863 / 309 / 6.642 sel, ketiganya identik). Konsekuensi langsung: **jangan pernah meminta kotak kecil.** Selalu minta 10 mi² penuh
- **Environmental Parameters hanya 3 parameter per request.** Kombinasi yang dipilih: GHI + wet bulb + relative humidity. DNI/DHI tidak dipakai karena HeatWalk tidak memodelkan naungan secara geometris
- Semua job async → wajib polling via Check Status
- Nilai `-999` adalah legacy null → **harus di-handle eksplisit**, jika tidak statistik akan rusak diam-diam
- Forecast horizon 12 jam; data historis tersedia sejak 2019

**Strategi fetch:** ambil snapshot pada jam representatif (±07.30 dan ±14.45) dari beberapa hari terpanas dalam data historis, lalu bekukan hasilnya. **Bukan** fetch berkelanjutan. Cache seluruh respons mentah ke disk sebelum diproses.

### 5.2 Estimasi populasi siswa

Alamat siswa dilindungi FERPA dan tidak akan pernah tersedia. Populasi diestimasi via dasymetric mapping.

| Langkah | Sumber |
|---|---|
| Jumlah anak 5–17 per unit kecil | US Census 2020 DHC tabel P12 (block) atau ACS B01001 (block group) |
| Assign blok → sekolah | Portal open data distrik (utama), NCES EDGE SABS (fallback) |
| **Kalibrasi ke enrollment asli** | NCES Common Core of Data |
| Aturan walk zone | PDF kebijakan transportasi distrik, dibaca manual |

Kalibrasi wajib:
```
faktor_koreksi = enrollment_resmi_CCD / estimasi_dasymetric
```

⚠️ SABS hanya tersedia untuk TA 2013–14 dan 2015–16 (survei eksperimental yang sudah berhenti). Selalu cek portal ArcGIS distrik lebih dulu.

### 5.3 Data geospasial pendukung

| Data | Sumber |
|---|---|
| Jaringan jalan pejalan kaki | OpenStreetMap via `osmnx`, `network_type='walk'` |
| Tutupan kanopi pohon | NLCD Tree Canopy Cover (USGS/MRLC) |
| Demografi & pendapatan | US Census ACS (B19013, B17001) |
| % free/reduced lunch | NCES CCD |

### 5.4 Kota demo

**Keputusan (24 Agustus 2026): Florida (Orlando/Tampa).** Statuta hazardous walking Arizona diverifikasi **tidak ada** — `ARS §15-901` murni berbasis jarak (>1 mil SD, >1,5 mil SMP/SMA), satu-satunya kemunculan kata "hazardous" di statuta itu soal jarak antar-sekolah untuk klasifikasi distrik terisolasi, tidak relevan dengan siswa jalan kaki. Kode kebijakan model ASBA untuk "Walkers and Riders" (EEAA) — tempat ketentuan semacam ini biasanya hidup — berstatus **dihapus** dari template kebijakan distrik Arizona. Detail verifikasi di `docs/METHODOLOGY.md`.

| Kandidat | Kekuatan | Kelemahan |
|---|---|---|
| **Florida** ✅ | Mekanisme hukum paling kuat & eksplisit — **Florida Statute §1006.21/§1006.23**, definisi "hazardous walking condition" tertulis (lebar jalur <4 kaki, dst); angka konkret 19.693 anak TA 2019–2020; distrik wajib punya proses penetapan tahunan → sumber sitasi `policy_source` yang nyata | Prior art ASU SHaDE Lab / panduan ADHS kurang nyambung geografis |
| Phoenix, AZ ❌ | Panduan ADHS berlaku di sana; riset ASU SHaDE Lab berbasis di sana; krisis panas paling terdokumentasi | **Statuta hazardous walking tidak ada** (terverifikasi 24 Agu 2026) — merusak fondasi hukum FR-5/§1.2 |
| Austin, TX | Studi Lanza dkk. dilakukan di sana; Texas punya dana tambahan | Prior art American Forests paling dekat → risiko dianggap duplikatif |

**Kriteria "kontras kanopi ekstrem" sudah tidak berlaku sebagai kriteria pemilihan.** Fase 1 menguji 8 kotak dengan mekanisme fisik berbeda; semuanya mendarat di 0,25–1,84°C. Suhu udara 2m tidak berperilaku seperti suhu permukaan (§1.3). Mencari AOI ke-9 adalah pemborosan kredit dan waktu.

**Kriteria pemilihan AOI yang berlaku sekarang, berurutan:**

1. Statuta hazardous walking negara bagian terverifikasi ada, dengan sitasi pasal
2. Kebijakan transportasi distrik tersedia publik sebagai PDF dengan radius walk zone tertulis
3. Batas attendance tersedia di portal ArcGIS distrik
4. Kepadatan sekolah — tile dipilih untuk memaksimalkan jumlah sekolah per panggilan
5. Kontras kanopi — **tie-breaker saja, bukan gerbang**

### 5.6 Cakupan tile — seluruh distrik, bukan satu kotak

**Target: setiap sekolah OCPS punya zona.** Batas 10 mi² adalah batas per-panggilan, dan diatasi dengan memosaikkan tile.

#### Aritmetika

```
Sisa kredit                     1.786.900
Biaya per panggilan                 4.220
Muat                             ~423 panggilan
Dua slice waktu per tile          ~211 tile = ~2.110 mi²
Orange County (daratan)             ~900 mi²
Bagian padat sekolah                ~300 mi² = 30 tile = 60 panggilan
Biaya cakupan padat                253.200 kredit (14% jatah)
```

**Seluruh area padat sekolah OCPS muat dengan sisa besar.** Batasan sebenarnya bukan kredit, melainkan waktu fetch (60 panggilan async berpolling) dan ukuran file.

#### Konsekuensi arsitektur: file dipecah per sekolah

`graph.json` monolitik mati pada skala ini — 30 tile ≈ 150 MB, tidak mungkin di-`fetch()` browser.

```
data/out/
├── schools.json                    seluruh sekolah + status analisis
├── tiles.json                      manifest bbox tile + status
├── summary.json                    seluruh sekolah teranalisis
└── by_school/
    ├── <school_id>/
    │   ├── graph.0730.json
    │   ├── graph.1445.json
    │   └── blocks.geojson
```

Frontend hanya mem-`fetch()` sekolah yang sedang dibuka. Repo boleh 150 MB; yang ditarik browser tetap ~5 MB per sekolah.

**Sekolah yang walk zone-nya melintasi batas tile** memakai graph gabungan dari tile-tile yang bersinggungan. `step2_build_graph.py` menggabung sebelum routing, bukan sesudah — routing lintas-batas pada graph yang terpotong menghasilkan rute palsu.

#### `config.py` menerima daftar, bukan satu bbox

```python
TILES = [
    {"id": "ocps_01", "bbox": [...], "status": "done"},
    {"id": "ocps_02", "bbox": [...], "status": "pending"},
]
```

Menambah cakupan = menambah entri + jalankan ulang. **Tidak ada kode baru.** Ini keputusan struktur yang harus diambil sebelum Fase 2 ditulis — membangun single-bbox sekarang berarti refactor tanggal 28, dan refactor tanggal 28 adalah cara paling umum proyek hackathon mati.

#### Urutan rollout

| Gelombang | Isi | Kapan |
|---|---|---|
| 1 | 1 tile (Pine Hills) | Fase 2–4, gerbang penuh |
| 2 | +5 tile inti OCPS | setelah gelombang 1 lolos |
| 3 | Sisa area padat sekolah | selama waktu dan kredit ada |

Gelombang 1 wajib lolos seluruh checklist Fase 4 sebelum gelombang 2 dijalankan. Bukan soal keraguan cakupan — soal jangan menggandakan bug yang sama ke 30 tile.

### 5.5 Dua AOI, dua peran berbeda

| | **Orlando (`orl_pine_hills_n`)** | **Phoenix** |
|---|---|---|
| Peran | Produk penuh | Bukti portabilitas (G10) |
| Masuk UI | ✅ | ❌ tidak pernah dirender |
| Heatmap 2 slice | ✅ | ✅ |
| Graph + dosis + klasifikasi | ✅ | ✅ |
| PDF kebijakan dibaca manual | ✅ | ❌ |
| Attendance boundary distrik | ✅ | ❌ nearest-school, dicatat sebagai limitasi |
| Kalibrasi enrollment CCD | ✅ | ❌ |
| FR-5 tombol permohonan | ✅ | ❌ **tidak boleh dibuat** |
| Output | seluruh `data/out/` | `contrast_report.csv` saja |

**Phoenix tidak boleh masuk UI, dan ini bukan soal waktu.** Statuta hazardous walking Arizona diverifikasi tidak ada (§5.4). Blok merah di Phoenix berarti tombol permohonan tanpa dasar hukum untuk dikutip — lubang pertama yang akan ditemukan juri, dan ia merusak §1.2 yang merupakan fondasi seluruh pitch.

**Nilai Phoenix ada di pitch, bukan di produk.** Satu tabel pembanding: *"config diganti, bbox diganti, pipeline jalan tanpa satu baris kode berubah."* Klaim distrik-agnostik jadi terbukti, bukan diklaim. Bonus: pembanding iklim kering vs lembap — bukti bahwa keputusan panas tidak dapat disalin antar-iklim.

**Prasyarat:** `config.py` harus bersih dari nilai per-kota yang hardcoded. Bug `UTM_EPSG` yang mengunci ke zona Arizona (ditemukan di Fase 1) adalah contoh persis dari yang harus dibereskan lebih dulu.

**Gerbang tanggal — 27 Agustus 12:00.** Kalau Orlando belum lulus seluruh checklist Fase 4 pada titik itu, **Phoenix dibuang seluruhnya**, bukan dikurangi. Keputusan ini diambil sekarang, bukan tanggal 29 dini hari.

---

## 6. Arsitektur teknis

### 6.1 Prinsip

```
[Pipeline Python offline]  →  [graph.json statis]  →  [Web app React]
   jalan sekali/terjadwal        di-commit ke repo        routing client-side
```

**Tidak ada backend server. Tidak ada panggilan API saat runtime**, kecuali tombol refresh (FR-17). Ini yang membuat timeline realistis dan demo tidak bisa gagal karena job async yang menggantung.

### 6.2 Engine: graph routing

Seluruh produk berjalan di atas satu graph jaringan jalan pejalan kaki dengan dua bobot per edge: panjang dan dosis panas.

Alasan memilih graph, bukan raster cost-distance:

1. **Satu engine untuk dua mode.** Mode 2 mutlak butuh graph routing. Kalau Mode 1 memakai raster, dalam 7 hari harus dibangun dua pipeline berbeda
2. **Dua metode bisa saling kontradiksi.** Raster bilang blok X aman, engine rute bilang jalur terbaik dari blok X 41°C — dua angka dari dua metode di aplikasi yang sama. Juri yang teliti akan menemukannya
3. **Output produk memang per blok**, bukan permukaan kontinu

Kekhawatiran umum "cakupan trotoar OSM sering bolong" berlaku untuk `footway`, tetapi tidak untuk `network_type='walk'`, yang menarik seluruh jalan yang dapat dilewati pejalan kaki termasuk jalan perumahan. Cakupan jalan di OSM Amerika berbasis TIGER dan hampir lengkap.

**Fallback:** jika graph gagal, raster cost-distance (`skimage.graph.MCP_Geometric`) tetap jalan cadangan yang valid — tapi hanya untuk Mode 1, dan Mode 2 harus dipotong.

### 6.3 Pipeline analisis (Python 3.11)

```
1. POST /v1/heatmap → tcm 60m → GeoTIFF AOI
2. osmnx.graph_from_bbox(network_type='walk')
3. Per edge: rasterio sample sepanjang geometri → suhu rata-rata edge
4. Per edge: dose = (suhu − baseline) × (panjang_m / 1.2) / 60   → °C·menit
5. Per centroid blok: dijkstra ×2 (weight='length', weight='dose')
6. Klasifikasi blok per aturan FR-8
7. Export graph.json + blocks.geojson
```

| Fungsi | Library |
|---|---|
| Vector GIS | `geopandas`, `shapely`, `pyproj` |
| Raster sampling | `rasterio`, `numpy` |
| Graph + routing | `osmnx` + `networkx` |
| Census API | `census` / `cenpy` |
| FortyGuard + polling | `httpx` |

### 6.4 Frontend

| Fungsi | Pilihan |
|---|---|
| Framework | React 19 + TypeScript + Vite |
| Peta | MapLibre GL JS v5 (raw, bukan `react-map-gl`) |
| Styling | Tailwind v4 |
| Chart | Recharts |
| Routing client-side | Dijkstra manual (~50 baris), tanpa library |
| Basemap | Protomaps PMTiles self-hosted — satu file statis, tanpa API key |
| Komponen UI | shadcn/ui (Radix + Tailwind), allowlist di `DESIGN.md` |
| Font | Inter, self-hosted via `@fontsource-variable/inter` |
| Hosting | Vercel (statis) |

**Pemisahan mode:** dua route pada satu aplikasi — `/` untuk Mode 2 (pintu masuk default) dan `/district` untuk Mode 1 — dengan satu segmented switch di header. **Instance MapLibre tidak boleh di-unmount saat berpindah mode**; transisi Mode 2 → Mode 1 di video demo adalah `flyTo` pada peta yang sama, dan itulah bukti visual bahwa keduanya satu engine.

**Basemap:** file `.pmtiles` hasil ekstrak bbox AOI, di-commit ke `web/public/`, dibaca browser lewat HTTP range request. Tidak ada tile server pihak ketiga, tidak ada API key yang bisa habis atau di-retire di tengah masa penjurian. Ini juga yang membuat NFR reliabilitas di §7 benar-benar dapat dipenuhi. Detail visual di `DESIGN.md`.

**Ukuran file:** graph dipecah **per sekolah**, bukan per AOI (§5.6). Satu sekolah ≈ 5–15 ribu edge → 2–4 MB setelah disederhanakan Douglas-Peucker. Target ≤5 MB per file; kalau lewat, naikkan toleransi penyederhanaan sebelum mengganti format.

**Format data:** simpan hasil per jam sebagai file terpisah agar slider waktu instan. GeoJSON di-`fetch()`, bukan di-`import`. Frontend memuat `schools.json` + `tiles.json` saat boot; graph dan blok dimuat **on-demand saat sekolah dipilih**, tidak semuanya di depan.

**Basemap pada cakupan luas:** bbox PMTiles harus mencakup gabungan seluruh tile, bukan satu tile. Ekstrak ulang setiap kali gelombang tile bertambah, dan verifikasi ulang status `206 Partial Content`.

**Explicitly ruled out:** `deck.gl`, `react-map-gl`, backend server apa pun, PostGIS/DuckDB/Parquet, autentikasi, tile server pihak ketiga.

---

## 7. Non-functional requirements

| Kategori | Requirement |
|---|---|
| **Performa** | Input alamat → dua rute ter-render dalam <1 detik |
| **Performa** | Klik sekolah → zona ter-render dalam <2 detik, termasuk `fetch()` on-demand file sekolah itu |
| **Performa** | Layer pin NCES ter-render tanpa jank pada zoom keluar penuh. Wajib layer simbol MapLibre, bukan marker DOM |
| **Performa** | Perubahan slider waktu → render ulang <500 ms |
| **Reliabilitas** | Demo harus berfungsi penuh **tanpa koneksi internet sama sekali** setelah load pertama, kecuali tombol refresh (FR-17). Ini termasuk basemap — karena itu basemap di-host sendiri sebagai file statis, bukan ditarik dari tile server pihak ketiga |
| **Satuan** | Setiap tempat yang menampilkan °C·menit **wajib** menampilkan °C berdampingan. °C·menit benar secara ilmiah dan punya preseden literatur (Meng dkk. 2023), tetapi tidak intuitif — tidak ada yang tahu apakah 340 °C·menit itu buruk. Semua orang tahu selisih 6°C itu berbahaya |
| **Satuan** | Sertakan °F di samping °C pada semua angka headline |
| **Transparansi** | Setiap angka yang ditampilkan harus dapat ditelusuri ke sumber data; halaman "Metodologi" wajib ada |
| **Kejujuran** | Halaman "Limitations" wajib ada dan mudah diakses dari UI utama |
| **Kompatibilitas** | Desktop browser modern untuk Mode 1. **Mode 2 sebaiknya mobile-friendly** karena personanya orang tua yang mengecek dari HP |

---

## 8. Batasan yang harus dinyatakan di produk

Wajib tampil di halaman Limitations dan di slide pitch:

1. Resolusi 60m tidak dapat membedakan trotoar sisi kiri vs kanan → skoring dilakukan di level **koridor**, bukan trotoar
2. Tanpa wind speed & globe temperature → **bukan WBGT**; sebut "indeks dosis panas berbasis suhu udara 2m + beban radiasi"
3. Cakupan dibatasi jumlah tile yang berhasil ditarik sebelum deadline. Sekolah di luar tile ter-render sebagai pin abu-abu berlabel "belum dianalisis", tidak pernah dengan angka hasil interpolasi atau tebakan
4. Rute dimodelkan dari jaringan OSM — anak sungguhan mungkin memotong jalan atau menempuh jalur informal
5. Kecepatan jalan diasumsikan 1,2 m/s untuk semua anak
6. Tidak semua anak dalam batas attendance bersekolah di situ (charter/swasta/open enrollment), meleset ~10–20%
7. Data sensus level block mengandung noise differential privacy
8. Luas bangunan ≠ jumlah unit → apartemen akan under-estimate
9. Batas SABS berumur ~10 tahun jika data distrik langsung tidak tersedia
10. **Manfaat pemilihan rute ternyata kecil.** Suhu udara 2m terukur menunjukkan variasi spasial intra-urban yang jauh lebih kecil daripada yang tersirat dari peta naungan atau suhu permukaan. Delapan kandidat AOI di dua kota diuji; kontras terbaik 1,84°C (p95−p05). Konsekuensinya delta antar-rute berada di kisaran 0,5–0,8°C, bukan ≥4°C seperti hipotesis awal. **Paparan didominasi durasi dan waktu hari, bukan pilihan jalur.** Gerbang G1/G2 dicabut dan diganti G1′/G2′ pada 25 Agustus 2026
11. Kategori kuning (FR-8) akan berisi jauh lebih sedikit blok daripada yang diasumsikan v1.3, sebagai konsekuensi langsung poin 10. Distribusi aktual dilaporkan apa adanya; ambang tidak digeser untuk mengisinya
12. Angka exceedance (FR-19) adalah **hibrida**: distribusi temporal dari stasiun ASOS titik tunggal, offset spasial dari FortyGuard. Ia mengasumsikan offset spasial per blok stabil antar-hari — asumsi yang tidak diuji
13. AOI Phoenix tidak memiliki kalibrasi enrollment, batas attendance distrik, maupun dasar statuta. Ia hadir sebagai bukti portabilitas pipeline saja dan tidak boleh dibaca sebagai rekomendasi kebijakan

---

## 9. Milestone

Hari ini 25 Agustus 2026. Deadline 30 Agustus 23:59 GST → **5 hari + buffer.**

| Tanggal | Target | Definition of done |
|---|---|---|
| ~~23~~ | ✅ Verifikasi API | `tcm` terkonfirmasi suhu udara 2m AGL; `-999` ter-handle; biaya heatmap terbukti flat 4.220 kredit/panggilan; granularity terbatas 60/80/100 |
| ~~24~~ | ✅ Verifikasi hukum | Statuta Arizona terverifikasi **tidak ada**; kota demo pindah ke Florida |
| ~~25 pagi~~ | ❌→✅ Scouting AOI | 8 kandidat gagal gerbang kontras. Pivot tiga sumbu, PRD v1.4 |
| **25 sore** | **🚩 Gerbang baru** | Delta temporal 07:30 vs 14:45 pada AOI Orlando **≥6°C** (G1′). Kunci bbox Orlando. **Kalau gagal, lapor — jangan lanjut** |
| **26** | Fase 2–4, gelombang 1 | Graph berbobot, routing, klasifikasi, `data/out/by_school/` lengkap untuk tile pertama dan lolos seluruh checklist |
| **26 malam** | Gelombang 2 | +5 tile OCPS. Nol kode baru — hanya entri `TILES` dan jalankan ulang |
| **26–27** | Frontend Mode 2 | Peta, input alamat, panel FR-4 dua blok, kasus "tidak ada rute aman", tombol salin permohonan |
| **27 siang** | **🚩 Gerbang tanggal** | Orlando lulus Fase 4? Ya → Phoenix boleh jalan. Tidak → Phoenix dibuang |
| **28** | Frontend Mode 1 + gelombang 3 | Zona, radius setara-dosis, daftar reklasifikasi, FR-16, FR-20 pin nasional; sisa tile ditarik selama waktu ada; Phoenix pipeline-only kalau gerbang lolos |
| **29** | Demo + deck | Video demo, pitch deck, README, halaman Metodologi & Limitations |
| **30** | Buffer + submit | — |

**Jalur mundur kalau hari 27 mepet:** potong Mode 1 jadi statis — tabel + peta tanpa interaksi klik-blok. Yang **tidak boleh dipotong** adalah aturan "rute teradem pun gagal" (FR-8 kategori merah), karena itu jantung argumennya.

**Urutan demo video:** orang tua dulu, distrik belakangan.
1. Orang tua di Orlando mengecek alamat → geser slider ke jam bubar → dosis melonjak → "tidak ada rute aman" → momen emosional
2. Zoom out ke tampilan distrik → 142 anak lain kondisinya sama; radius kebijakan 1,0 mi vs radius setara-dosis 0,42 mi
3. Klik "sembunyikan data panas" → semuanya kolaps jadi lingkaran → *"ini yang distrik punya hari ini"*
4. Tutup dengan daftar reklasifikasi + export CSV

Ganti kota dari Phoenix ke Orlando di seluruh naskah. Adegan 1 sekarang punya dua beat, bukan satu: **waktu dulu, baru rute** — karena di situlah angka terbesarnya.

---

## 10. Risiko & mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| **`tcm` bukan suhu udara ambien 2m AGL** | **Kritis — seluruh kerangka °C·menit batal** | Verifikasi hari 1 lewat tes API langsung. Ini blocker nomor satu, sebelum satu baris kode pipeline ditulis |
| ~~Selisih rute teradem vs terpendek kecil~~ | ~~Kritis~~ | **TERJADI, 25 Agu 2026.** 8/8 kandidat gagal, terbaik 1,84°C. Diselesaikan lewat pivot tiga sumbu (§1.3) dan pencabutan G1/G2. Bukan lagi risiko — sudah jadi temuan |
| **Delta temporal ternyata juga kecil (<6°C)** | **Kritis — G1′ ikut runtuh** | Uji **hari ini juga**, sebelum Fase 2. Dua slice sudah harus ditarik di Fase 1; bandingkan rata-rata AOI-nya. Kalau <6°C, mitigasi berurutan: (a) pindah ke hari p97; (b) geser slice ke 15:30. Kalau tetap gagal, produk bertumpu pada G2′ radius setara-dosis + G9 exceedance saja — dan itu **keputusan produk, lapor dulu** |
| Juri menganggap pencabutan G1/G2 sebagai menggeser target | Sedang | Nyatakan lebih dulu di pitch sebagai temuan pengukuran, lengkap dengan tabel 8 kandidat. Peserta lain akan mengklaim manfaat rute tanpa mengukurnya; HeatWalk satu-satunya yang mengukur dan melaporkan bahwa premis umum itu lemah |
| Phoenix menyita waktu Orlando | **Tinggi** | Gerbang tanggal 27 Agu 12:00 (§5.5). Kerjakan berurutan, jangan paralel — debugging dua dataset sekaligus menyembunyikan sumber bug |
| Juri menganggap ini cool route planner generik | **Tinggi** — ini contoh pertama panitia di Track 01 | Buka pitch dengan mekanisme hukum dan aturan kausal, bukan dengan peta rute. Sebut prior art Austin lebih dulu dan artikulasikan perbedaannya |
| `graph.json` terlalu besar | Sedang | Sederhanakan geometri edge; kalau perlu kirim topologi saja dan render geometri dari tile |
| `exceedance`/`persistence` ternyata Premium-only | Sedang | Hitung sendiri dari data historis 2019+ lewat `tcm` berulang, dengan biaya kredit |
| GHI/DNI/DHI tidak tersedia di Basic | **Tinggi** — melemahkan argumen "bukan sekadar suhu" | Turunkan klaim ke suhu udara saja; nyatakan keterbatasan terbuka |
| Job async lambat/gagal saat demo | **Kritis** | Semua data pre-computed; tombol refresh terisolasi dengan fallback |
| Kredit trial habis | Tinggi | Batasi fetch ke snapshot representatif; cache seluruh respons mentah |
| Batas attendance distrik tidak tersedia | Sedang | Fallback ke SABS + nyatakan umur data |
| Scope creep | **Tinggi** | P0 dikunci; P1/P2 hanya disentuh setelah P0 selesai penuh |
| Juri bertanya "kenapa Transfinder tidak bikin sendiri?" | Sedang | Mereka **mengeksekusi** rute, bukan menentukan eligibilitas termal — dan tidak punya data 60m. Tunjukkan export CSV sebagai titik integrasi |
| Juri bertanya "dipakainya cuma setahun sekali?" | Sedang | Mode 2 adalah pemakaian harian; alur permohonan hazardous walking adalah pemakaian bulanan |
| Statuta hazardous walking Arizona tidak ada | Sedang | Pindah kota demo ke Florida (mekanisme paling terdokumentasi + angka 19.693) |

---

## 11. Open questions

- [ ] **Definisi `tcm`** — apakah suhu udara ambien °C pada 2m AGL? (prioritas hari 1, blocker)
- [x] **Definisi `tcm`** — terverifikasi Fase 0: suhu udara ambien °C pada 2m AGL
- [ ] ~~Apakah `env_params` menyediakan WBGT?~~ **Ditunda, keputusan 25 Agu 2026.** `env_params` di-skip untuk siklus ini: belum terverifikasi apakah ia mengembalikan grid seluruh AOI atau hanya titik tunggal, dan menambah dependency belum teruji di hari ke-5 adalah risiko yang tidak sebanding. Bobot tetap `tcm`. **Konsekuensi:** batasan §8 poin 2 tetap berbunyi "indeks berbasis suhu udara 2m", bukan "+ beban radiasi"
- [ ] Opsional kalau sempat 28 Agu: satu panggilan `env_params` di **satu titik** tengah AOI untuk satu kalimat metodologi — *"kelembapan 68% membuat 34°C terasa seperti 41°C"*. Tidak menyentuh pipeline, menutup celah argumen "ini kan cuma suhu udara"
- [ ] **Delta temporal 07:30 vs 14:45 — berapa sebenarnya?** Blocker berikutnya, pengganti langsung blocker `tcm`. Harus dijawab sebelum Fase 2
- [x] Apakah Arizona punya statuta hazardous walking conditions? → **Tidak.** Diverifikasi 24 Agu 2026 lewat `ARS §15-901` (murni jarak) dan kode kebijakan ASBA EEAA (dihapus). Kota demo pindah ke Florida, lihat §5.4
- [ ] Distrik sekolah spesifik yang batas attendance-nya tersedia publik dan terkini
- [ ] Nilai ambang dosis (°C·menit) yang akan dipakai — perlu kalibrasi empiris
- [ ] **Baseline suhu untuk perhitungan dosis** — 33°C (Lanza) atau suhu minimum AOI? Ini memengaruhi semua angka di produk. Catatan pasca-Fase 1: baseline mendekati p05 AOI menaikkan selisih dosis relatif (mis. 7,0 vs 8,8 = 26%), tetapi **tidak** menghasilkan 4°C. Kalau dipilih, dokumentasikan sebagai pilihan kalibrasi, bukan sebagai temuan
- [ ] Ambang exceedance (°C) untuk FR-19, dan apakah offset spasial FortyGuard cukup stabil antar-hari untuk mendukungnya
- [ ] Format kolom yang diterima Transfinder/Versatrans untuk import layer hazardous
- [ ] Apakah form submission mengizinkan lebih dari satu track

---

## Lampiran — Referensi kunci

1. **Lanza K, dkk.** "Heat-Resilient Schoolyards: Access to Playgrounds and Shade." *J Phys Act Health* 2023;20(2):134–141. DOI: 10.1123/jpah.2022-0405 — titik balik perilaku anak pada 33°C
2. **Arizona DHS.** *Managing Extreme Heat Recommendations for Schools*, 2021 — pengakuan bahwa ambang peringatan NWS terlalu tinggi untuk anak, dan akses data menjadi hambatan
3. **Meng Y, dkk.** "Investigation of heat stress on urban roadways for commuting children." *Urban Climate* 2023;49:101564 — preseden satuan °C·menit
4. **Basu R, dkk.** (2024) — heat stress secara signifikan mengubah persepsi jarak berjalan
