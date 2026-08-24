# Product Requirements Document — HeatWalk

| | |
|---|---|
| **Nama produk** | HeatWalk |
| **Tagline** | Walk zones drawn by heat, not distance |
| **Versi** | 1.3 |
| **Tanggal** | 23 Agustus 2026, direvisi 24 Agustus 2026 |
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

### 1.3 Solusi

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
| **G1** | Membuktikan dua jalur berjarak sama punya beban panas berbeda secara terukur | Delta suhu antar-jalur pada jarak identik, dalam °C dan °F. Target: minimal satu pasangan dengan selisih ≥4°C |
| **G2** | Membuktikan pemilihan rute menurunkan paparan secara terukur | Selisih °C dan % dosis antara rute terpendek dan rute teradem, minimal satu pasangan asal-tujuan |
| **G3** | Mengkuantifikasi paparan yang dihilangkan oleh keputusan bus | °C·menit per anak per hari dan per tahun ajaran yang tereliminasi |
| **G4** | Membuktikan sebagian blok benar-benar tidak punya opsi | Jumlah blok yang rute teradem-nya tetap melewati ambang |
| G5 | Menghasilkan batas walk zone yang berbeda nyata dari lingkaran | Selisih area ≥15% antara lingkaran dan zona dosis panas |
| G6 | Mengkuantifikasi siswa yang salah klasifikasi | Angka absolut + persentase per sekolah, terkalibrasi ke enrollment CCD |
| G7 | Membuktikan FortyGuard sentral, bukan periferal | Demo cabut-API: zona kolaps jadi lingkaran, rute teradem kolaps jadi rute terpendek |
| G8 | Membuktikan jalur adopsi nyata | Export yang dapat masuk ke mekanisme hazardous walking + software incumbent |

### 1.5 Non-goals

- ❌ **Optimasi rute bus / vehicle routing.** Anak di dalam bus berada di ruangan ber-AC — paparan panasnya nol. Data suhu 60m tidak memberi informasi apa pun ke keputusan itu, dan juri akan langsung bertanya kenapa ini butuh FortyGuard. Yang panas adalah jalan kaki dari rumah ke halte, bukan bus-nya
- ❌ Navigasi turn-by-turn atau rekomendasi sisi trotoar — resolusi 60m tidak mendukung
- ❌ Prediksi suhu dalam ruangan
- ❌ Klaim WBGT — tidak ada wind speed & globe temperature (kecuali terverifikasi tersedia, lihat §11)
- ❌ Cakupan multi-kota — satu AOI demo saja
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

**Delta HeatWalk:** (1) suhu udara **terukur** 2m AGL, bukan naungan dimodelkan; (2) output berupa **keputusan administratif** dan **rute yang dapat ditempuh**, bukan peta untuk dilihat; (3) tidak ada satu pun yang menghitung angka siswa salah klasifikasi.

⚠️ **Cool route planner adalah contoh pertama yang panitia tulis sendiri di Track 01.** Kolam ini akan ramai. Diferensiasi HeatWalk bukan pada rutenya, melainkan pada mekanisme hukum, persona berkonsekuensi, dan aturan kausal di §1.3. Ini harus eksplisit di menit pertama pitch, bukan diasumsikan terlihat sendiri.

### 1.7 Pemetaan ke kriteria penilaian resmi

Kriteria panitia: *"Real use of the platform (the API or Dashboard is central, not decorative); a clear problem and user; a measurable outcome (e.g. −7°F (−4°C) on this route); and a path to real-world deployment. Judges reward applied relevance over flashy demos."*

| Kriteria | Bukti dalam produk |
|---|---|
| **API sentral, bukan dekoratif** | Tombol "sembunyikan data panas" (FR-16): zona kolaps jadi lingkaran, rute teradem kolaps jadi rute terpendek, produk kembali ke status quo |
| **Problem & user jelas** | Dua persona, dua keputusan nyata, satu mekanisme hukum yang sudah berjalan |
| **Measurable outcome** | G1–G3: delta °C antar-jalur, delta °C antar-rute, °C·menit tereliminasi. Panel rute (FR-4) memakai format °C dan °F persis seperti contoh panitia |
| **Path to deployment** | Mekanisme hukum + pendanaan negara bagian + software penerima semuanya sudah eksis (§1.2, §1.6A) |

**Alokasi usaha.** Kalimat *"judges reward applied relevance over flashy demos"* adalah instruksi prioritas eksplisit:

| Prioritaskan | Korbankan lebih dulu |
|---|---|
| Kalibrasi enrollment ke CCD | Animasi transisi zona |
| Halaman metodologi & keterbatasan | Styling peta yang cantik |
| Export CSV yang benar-benar bisa dipakai | Slider waktu yang super mulus |
| Angka delta suhu yang dapat diverifikasi | Efek hover, mikrointeraksi |

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

```
Rumah kamu → SD Lincoln

              Terpendek    Teradem      Selisih
Jarak         1,42 km      1,68 km      +260 m
Waktu         20 mnt       23 mnt       +3 mnt
Suhu rata2    40,3°C       34,1°C       −6,2°C  (−11,2°F)
Suhu puncak   44,0°C       36,8°C       −7,2°C  (−13,0°F)
Dosis panas   503 °C·mnt   289 °C·mnt   −43%
```

Baris suhu **wajib menampilkan °C dan °F**. Ini format persis yang dipakai panitia di kriteria penilaian, dan audiens distrik sekolah AS berpikir dalam °F.

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

Peta menampilkan pin seluruh sekolah dalam AOI. Klik pin → memuat analisis. Panel menampilkan nama, jenjang, total enrollment (NCES CCD), aturan walk zone yang berlaku.

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

#### FR-13 — Slider waktu *(P1)*

- Minimal dua state: jam masuk (~07.30) dan jam bubar (~14.45)
- Idealnya slider per jam sepanjang jam sekolah
- Perubahan slider me-render ulang dari file pre-computed, **bukan panggilan API**

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

- **AOI maksimum 10 mi² ≈ 5,1 km × 5,1 km.** Ini yang membatasi Mode 2 ke "lingkungan kamu", bukan "ke mana saja di kota". Untungnya seluruh trip jalan kaki anak sekolah (maksimal 1–1,5 mil) muat di dalamnya
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

**Rekomendasi: Phoenix, AZ** jika statuta hazardous walking Arizona terkonfirmasi ada. Jika tidak, pindah ke **Florida** (Orlando/Tampa) dan ganti kutipan kebijakan dari ADHS ke ketentuan Florida.

| Kandidat | Kekuatan | Kelemahan |
|---|---|---|
| Phoenix, AZ | Panduan ADHS berlaku di sana; riset ASU SHaDE Lab berbasis di sana; krisis panas paling terdokumentasi | ⚠️ Statuta hazardous walking Arizona belum diverifikasi |
| Florida | Mekanisme paling terdokumentasi + angka konkret 19.693 anak; pendanaan negara bagian eksplisit | Prior art ASU/ADHS kurang nyambung |
| Austin, TX | Studi Lanza dkk. dilakukan di sana; Texas punya dana tambahan | Prior art American Forests paling dekat → risiko dianggap duplikatif |

**Kriteria pemilihan AOI 10 mi² sangat spesifik:** pilih area dengan **kontras kanopi ekstrem** — kawasan berkanopi yang bersebelahan dengan kawasan industri atau parkiran besar. Kalau AOI-nya homogen, rute teradem dan rute terpendek akan nyaris identik dan seluruh premis produk kehilangan taringnya.

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

**Ukuran `graph.json`:** AOI 10 mi² walk network di Phoenix diperkirakan 5–15 ribu edge → 2–4 MB setelah geometri disederhanakan. Kalau melewati 5 MB, sederhanakan geometri edge (Douglas-Peucker) sebelum pindah ke format lain.

**Format data:** simpan hasil per jam sebagai file terpisah agar slider waktu instan. GeoJSON di-`fetch()`, bukan di-`import`.

**Explicitly ruled out:** `deck.gl`, `react-map-gl`, backend server apa pun, PostGIS/DuckDB/Parquet, autentikasi, tile server pihak ketiga.

---

## 7. Non-functional requirements

| Kategori | Requirement |
|---|---|
| **Performa** | Input alamat → dua rute ter-render dalam <1 detik |
| **Performa** | Klik sekolah → zona ter-render dalam <2 detik |
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
3. AOI terbatas 10 mi² → rute hanya tersedia di dalam area yang dipetakan
4. Rute dimodelkan dari jaringan OSM — anak sungguhan mungkin memotong jalan atau menempuh jalur informal
5. Kecepatan jalan diasumsikan 1,2 m/s untuk semua anak
6. Tidak semua anak dalam batas attendance bersekolah di situ (charter/swasta/open enrollment), meleset ~10–20%
7. Data sensus level block mengandung noise differential privacy
8. Luas bangunan ≠ jumlah unit → apartemen akan under-estimate
9. Batas SABS berumur ~10 tahun jika data distrik langsung tidak tersedia

---

## 9. Milestone

Hari ini 23 Agustus 2026. Deadline 30 Agustus 23:59 GST → **7 hari.**

| Tanggal | Target | Definition of done |
|---|---|---|
| **23** | Verifikasi API | `tcm` terkonfirmasi sebagai suhu udara ambien °C pada 2m AGL; 1 heatmap 60m berhasil ditarik; `-999` ter-handle; ketersediaan `exceedance`/`persistence`/GHI di Basic terkonfirmasi |
| **24** | Graph berbobot | `osmnx` graph + sampling raster → `graph.json` jadi; fixture palsu dibuat untuk paralelisasi frontend |
| **25** | **🚩 Gerbang** | Minimal 1 pasangan asal-tujuan dengan selisih rute teradem vs terpendek ≥4°C. **Kalau gagal, ganti AOI ke area kontras tinggi — bukan lanjut** |
| **26–27** | Frontend Mode 2 | Peta, input alamat, dua rute, panel perbandingan, kasus "tidak ada rute aman", tombol salin permohonan |
| **28** | Frontend Mode 1 | Zona, daftar reklasifikasi, "lihat kenapa", tombol sembunyikan data panas, angka siswa |
| **29** | Demo + deck | Video demo, pitch deck, README |
| **30** | Buffer + submit | — |

**Jalur mundur kalau hari 27 mepet:** potong Mode 1 jadi statis — tabel + peta tanpa interaksi klik-blok. Yang **tidak boleh dipotong** adalah aturan "rute teradem pun gagal" (FR-8 kategori merah), karena itu jantung argumennya.

**Urutan demo video:** orang tua dulu, distrik belakangan.
1. Ibu di Phoenix mengecek alamat → "tidak ada rute aman" → momen emosional
2. Zoom out ke tampilan distrik → 142 anak lain kondisinya sama
3. Klik "sembunyikan data panas" → semuanya kolaps jadi lingkaran → *"ini yang distrik punya hari ini"*
4. Tutup dengan daftar reklasifikasi + export CSV

---

## 10. Risiko & mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| **`tcm` bukan suhu udara ambien 2m AGL** | **Kritis — seluruh kerangka °C·menit batal** | Verifikasi hari 1 lewat tes API langsung. Ini blocker nomor satu, sebelum satu baris kode pipeline ditulis |
| **Selisih rute teradem vs terpendek kecil (<2°C)** | **Kritis — premis produk runtuh** | Uji hari 25. Mitigasi: pilih AOI dengan kontras kanopi ekstrem; pilih jam bubar di hari persentil 95, bukan 90. Kalau tetap kecil, ini temuan yang dilaporkan jujur, bukan disembunyikan |
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
- [ ] **Apakah `env_params` menyediakan WBGT?** Demo ColdRoute FortyGuard menampilkan angka WBGT, tetapi dokumentasi hanya menyebut wet bulb. Kalau tersedia di Basic, non-goal WBGT (§1.5) bisa dicabut
- [ ] Apakah Arizona punya statuta hazardous walking conditions? → menentukan kota demo
- [ ] Distrik sekolah spesifik yang batas attendance-nya tersedia publik dan terkini
- [ ] Nilai ambang dosis (°C·menit) yang akan dipakai — perlu kalibrasi empiris
- [ ] **Baseline suhu untuk perhitungan dosis** — 33°C (Lanza) atau suhu minimum AOI? Ini memengaruhi semua angka di produk
- [ ] Format kolom yang diterima Transfinder/Versatrans untuk import layer hazardous
- [ ] Apakah form submission mengizinkan lebih dari satu track

---

## Lampiran — Referensi kunci

1. **Lanza K, dkk.** "Heat-Resilient Schoolyards: Access to Playgrounds and Shade." *J Phys Act Health* 2023;20(2):134–141. DOI: 10.1123/jpah.2022-0405 — titik balik perilaku anak pada 33°C
2. **Arizona DHS.** *Managing Extreme Heat Recommendations for Schools*, 2021 — pengakuan bahwa ambang peringatan NWS terlalu tinggi untuk anak, dan akses data menjadi hambatan
3. **Meng Y, dkk.** "Investigation of heat stress on urban roadways for commuting children." *Urban Climate* 2023;49:101564 — preseden satuan °C·menit
4. **Basu R, dkk.** (2024) — heat stress secara signifikan mengubah persepsi jarak berjalan
