# Product Requirements Document — HeatWalk

| | |
|---|---|
| **Nama produk** | HeatWalk |
| **Tagline** | Walk zones drawn by heat, not distance |
| **Konteks** | FortyGuard Hackathon '26 |
| **Track submission** | Primary: Track 01 (Resilient Cities & Infrastructure) · Secondary: Track 07 (Data Analysis & Correlation) |
| **Deliverable wajib** | Working software prototype · Pitch presentation · Demo video |
| **Deadline** | 30 Agustus 2026, 23:59 GST |

---

## 1. Ringkasan

### 1.1 Produk

HeatWalk mengganti fungsi impedance pada perhitungan walk zone sekolah dari **jarak** menjadi **dosis panas kumulatif (°C·menit)**, memakai suhu udara 2m AGL resolusi 60m dari FortyGuard sebagai bobot jaringan jalan pejalan kaki.

Dari satu graph berbobot dosis itu, keluar dua hal — dan hanya dua hal:

**Mode 1 — Tampilan distrik (Transportation Director)**
Peta zona per sekolah: blok mana yang aman jalan kaki, blok mana yang cukup ganti rute, blok mana yang direkomendasikan bus. Plus daftar reklasifikasi yang bisa dibawa ke rapat school board.

**Mode 2 — Cek alamat (Orang tua / Siswa)**
Input alamat rumah + sekolah → beberapa opsi rute jalan kaki, dibandingkan berdasarkan paparan panas, bukan cuma jarak.

Dua mode, satu engine, satu objek visual yang sama. Segala sesuatu di dokumen ini melayani salah satu dari dua itu; kalau tidak, dia bukan bagian dari produk.

### 1.2 Masalah

Distrik sekolah di AS menentukan siapa yang naik bus dan siapa yang jalan kaki dengan menarik lingkaran radius dari sekolah — umumnya 1 mil untuk SD, 1,5 mil untuk SMP, 2 mil untuk SMA. Lingkaran itu murni geometris dan tidak memperhitungkan panas sama sekali.

Akibatnya dua anak berjarak identik dari sekolah mendapat keputusan yang sama, meskipun satu berjalan di bawah kanopi pohon dan satu lagi menyeberangi parkiran aspal terbuka.

Konsekuensinya menimpa dua pihak berbeda:

| Pihak | Konsekuensi |
|---|---|
| Transportation Director | Tidak punya dasar terukur untuk memberi bus pada anak yang jalurnya berbahaya secara termal |
| Orang tua & siswa | Anaknya tetap harus berjalan, tanpa informasi jalur mana yang lebih aman |

HeatWalk melayani keduanya dari satu perhitungan yang sama.

### 1.3 Konteks kunci: mekanisme hukumnya sudah ada

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

### 1.4 Aturan yang menghubungkan dua mode

> Sebuah blok masuk daftar reklasifikasi bus **kalau rute teradem yang tersedia pun masih melewati ambang dosis.**

Kalau masih ada rute aman, blok itu tidak direkomendasikan bus — orang tuanya diarahkan ke Mode 2 dengan rute tersebut.

Aturan ini membuat kedua mode konsisten secara aritmetika (satu perhitungan, bukan dua) dan menjawab pertanyaan paling mematikan di rapat school board: *"kenapa tidak suruh anaknya lewat jalan lain saja?"* — jawabannya jadi bukti, bukan opini.

Efek samping yang penting: aturan ini membuat daftar reklasifikasi **lebih pendek**. Terdengar seperti kerugian, padahal ini nilai jual. Distrik tidak akan mengadopsi tool yang bilang "500 anak harus dibusin". Tool yang bilang "142 anak benar-benar tidak punya opsi, 300 sisanya cukup diganti jalurnya" jauh lebih mungkin dipakai.

### 1.5 Apa yang sudah diukur soal suhu udara

`tcm` terverifikasi sebagai **suhu udara ambien °C pada 2m AGL**, bukan suhu permukaan. Konsekuensi fisiknya penting dan harus dipahami sebelum membaca sisa dokumen ini.

Pada siang hari lapisan batas atmosfer sudah tercampur secara konvektif, sehingga variasi suhu udara intra-urban dalam radius 5 km umumnya hanya 1–3°C. Delapan kotak diuji di dua kota dengan empat mekanisme fisik berbeda — gradien elevasi, efek oasis irigasi, kontras urban/gurun, kanopi vs arteri. Kontras spasial terbaik (`orl_pine_hills_n`) **1,84°C** (p95−p05).

Kontras 15–25°C yang terlihat di peta panas kota adalah **suhu permukaan**, dan itulah yang dipetakan hampir seluruh prior art di §1.8B.

> Kalau AOI mana pun menghasilkan kontras spasial >10°C pada `tcm`, itu justru alarm bahwa `tcm` bukan suhu udara.

**Konsekuensi ke produk:** selisih paparan antar dua rute realistis diperkirakan kecil — kisaran 0,5–0,8°C. Angka itu **dilaporkan apa adanya** di panel FR-4 dan di halaman Limitations. Tidak ada kalibrasi yang dilakukan untuk membesarkannya, dan tidak ada gerbang yang bergantung padanya.

Ini justru mempertajam premisnya. Bukan *"sebagian rute panas, pilih yang adem"*, melainkan:

> **Sebagian blok tidak punya rute aman sama sekali.**

Itu argumen yang jauh lebih sulit dibantah di rapat school board, dan otomatis memisahkan HeatWalk dari kolam "cool route planner" yang dikhawatirkan di §1.8.

**Yang tidak tersentuh oleh temuan ini:** kategori merah FR-8 bergantung pada **dosis absolut**, bukan kontras antar-rute. Mekanisme hukum §1.3 tidak bergantung pada data apa pun. Angka salah klasifikasi bergantung pada ambang, bukan selisih. FR-16 bergantung pada keberadaan layer, bukan besarnya delta. Dan tombol permohonan FR-5 justru menguat.

#### Tiga sumbu kontras yang dipakai produk

Ketiganya bersumber dari FortyGuard, jadi kriteria "API sentral" tidak melemah.

**Sumbu 1 — dosis absolut.** Yang menentukan klasifikasi blok bukan selisih antar tempat, melainkan apakah paparan total sebuah rute melewati ambang. Ini yang memikul Mode 1.

**Sumbu 2 — durasi × circuity.** Dosis = kelebihan suhu × waktu tempuh. Blok dengan jarak lurus 0,9 mi tetapi jarak jaringan 1,4 mi menerima dosis ~55% lebih besar pada suhu identik. Lingkaran radius resmi buta terhadap ini sepenuhnya. Output: **radius setara-dosis** (FR-18) — *"pada sore Agustus, radius yang dapat dipertahankan untuk SD adalah 0,42 mi, bukan 1,0 mi."*

**Sumbu 3 — exceedance.** Ambang bersifat nonlinear. Dua blok berselisih 1,8°C pada ambang 40°C dapat berbeda puluhan hari melewati ambang per tahun ajaran — selisih kecil di suhu berubah jadi selisih besar di hari. Ini persis alasan satuan dosis di atas baseline dipilih sejak awal.

Cara termurah memperolehnya: **jangan tarik 180 heatmap.** Ambil distribusi harian dari rekaman stasiun (Iowa Environmental Mesonet ASOS, jam-jaman sejak 2019, gratis), lalu pakai FortyGuard sebagai **offset spasial per blok** terhadap stasiun itu. FortyGuard tetap satu-satunya sumber yang dapat memberi offset per-blok 60m.

### 1.6 Waktu: data per jam, bukan dua tombol

Pipeline menarik **satu slice per jam sepanjang hari sekolah** — 07:00 sampai 16:00 — untuk setiap tile. Menit non-`:00` mengembalikan nol tile secara senyap; ini terverifikasi, dan bukan sesuatu yang boleh dilupakan saat menambah slice baru.

Alasannya sederhana: anak tidak pulang pada dua jam yang seragam. Ada yang bubar 14:45, ada yang ikut kegiatan sampai 16:00, ada yang pulang 11:00 karena hari pendek atau dijemput lebih awal. Produk yang cuma punya dua tombol memaksa orang tua memilih jam yang bukan jam anaknya.

Jadi Mode 2 bekerja seperti aplikasi peta biasa: **pilih sekolah, pilih jam, rute muncul.** Rute yang muncul adalah rute teradem pada jam itu — dan jalurnya boleh berbeda antar jam, karena bobot dosis per edge memang berubah.

**Klasifikasi zona (Mode 1) memakai satu jam kanonik: jam terpanas dalam hari sekolah**, diturunkan dari data (jam dengan rata-rata suhu AOI tertinggi), bukan dikonstantakan. Ini kasus terburuk yang dapat dipertahankan di rapat school board tanpa perlu menjelaskan kenapa suatu jam dipilih.

**Trade-off yang harus disadari:** resolusi waktu dan luas cakupan bersaing memperebutkan kredit dan waktu fetch yang sama (§5.1). Gelombang 1–2 memakai jam penuh; kalau gelombang 3 dijalankan, tile pinggiran boleh turun ke 3 slice dan itu dicatat di Limitations, bukan disamarkan.

Dosis yang dipakai untuk klasifikasi adalah dosis satu perjalanan. Anak berjalan dua arah setiap hari, sehingga paparan sebenarnya adalah penjumlahan pagi + sore — angka produk ini **under-estimate**, bukan over-estimate. Under-estimate aman untuk rekomendasi yang menyangkut anggaran publik, dan dinyatakan terbuka di Limitations.

### 1.7 Product goals

| # | Goal | Ukuran keberhasilan | Sifat |
|---|---|---|---|
| **G1** | Membuktikan sebagian blok benar-benar tidak punya opsi | Jumlah blok yang rute teradem-nya tetap melewati ambang. **Minimal 1** | 🚩 Gerbang |
| G2 | Membuktikan radius kebijakan tidak dapat dipertahankan secara termal | Radius setara-dosis vs radius kebijakan, dalam mil | Dilaporkan |
| G3 | Mengkuantifikasi paparan yang dihilangkan oleh keputusan bus | °C·menit per anak per hari dan per tahun ajaran yang tereliminasi | Dilaporkan |
| G4 | Mengkuantifikasi siswa yang salah klasifikasi | Angka absolut + persentase per sekolah, terkalibrasi ke enrollment CCD | Dilaporkan |
| G5 | Menghasilkan batas walk zone yang berbeda nyata dari lingkaran | Selisih area antara lingkaran dan zona dosis | Dilaporkan |
| G6 | Membuktikan FortyGuard sentral, bukan periferal | Demo cabut-API: zona kolaps jadi lingkaran, rute teradem kolaps jadi rute terpendek | Demonstrasi |
| G7 | Mengukur pengaruh jam terhadap paparan pada rute yang sama | Kurva dosis per jam sepanjang hari sekolah; delta jam terdingin vs terpanas dalam °C dan °F | Dilaporkan |
| G8 | Mengukur pengaruh pemilihan rute terhadap paparan | Selisih °C dan % dosis antara rute terpendek dan teradem. Diperkirakan 0,5–0,8°C (§1.5) | Dilaporkan |
| G9 | Membuktikan selisih spasial kecil tetap berkonsekuensi besar | Rentang exceedance antar-blok, hari per tahun ajaran | Dilaporkan |
| G10 | Membuktikan pipeline distrik-agnostik | Pipeline jalan penuh di AOI kedua (Phoenix) tanpa perubahan satu baris kode, hanya `config.py` | Demonstrasi |
| G11 | Membuktikan cakupan bukan batasan arsitektur | Jumlah sekolah dengan zona penuh. Menambah cakupan = menambah entri `TILES`, nol kode baru | Demonstrasi |

**Hanya G1 yang berupa gerbang.** Sisanya dihitung dan dilaporkan apa adanya, termasuk kalau angkanya kecil. Tidak ada ambang magnitudo yang menghentikan pekerjaan, dan tidak ada parameter yang digeser supaya sebuah angka terlihat besar. Alasannya di §1.5: angka kecil pada G8 bukan kegagalan produk, ia bagian dari argumennya.

### 1.8 Non-goals

- ❌ **Optimasi rute bus / vehicle routing.** Anak di dalam bus berada di ruangan ber-AC — paparan panasnya nol. Data suhu 60m tidak memberi informasi apa pun ke keputusan itu, dan juri akan langsung bertanya kenapa ini butuh FortyGuard. Yang panas adalah jalan kaki dari rumah ke halte, bukan bus-nya
- ❌ Navigasi turn-by-turn atau rekomendasi sisi trotoar — resolusi 60m tidak mendukung
- ❌ Prediksi suhu dalam ruangan
- ❌ Klaim WBGT — tidak ada wind speed & globe temperature
- ❌ **Analisis multi-kota.** Cakupan analisis penuh menyasar seluruh OCPS lewat mosaik tile (§5.6). Kota lain **tidak** dianalisis. Seluruh sekolah AS tetap hadir di peta sebagai pin NCES (FR-20), tanpa satu pun angka — kehadiran pin bukan klaim analisis. AOI Phoenix dijalankan pipeline-only sebagai bukti portabilitas (G10) dan tidak masuk UI (§5.5)
- ❌ **Autentikasi user, role, dan database persisten.** Submission form field 12 mewajibkan live demo terbuka di jendela incognito **tanpa login dan tanpa install**, dan panitia menyatakan mereka akan mengeceknya sendiri. Login di depan produk bukan sekadar menambah risiko — ia menggagalkan syarat submission. Dua mode dipisahkan lewat route (`/` dan `/district`) plus satu switch di header, bukan lewat akun. Tidak ada yang perlu disimpan: seluruh output pipeline sudah berupa file statis yang di-commit

### 1.9 Competitive landscape

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

**Delta HeatWalk:**

1. Suhu udara **terukur** 2m AGL, bukan naungan dimodelkan
2. Output berupa **keputusan administratif** — radius setara-dosis dan daftar reklasifikasi — bukan peta untuk dilihat
3. Tidak ada satu pun yang menghitung angka siswa salah klasifikasi
4. Seluruh prior art di atas memetakan **naungan atau suhu permukaan**, dan dari situ menyiratkan bahwa pemilihan rute memberi manfaat besar. HeatWalk mengukur **suhu udara** dan menemukan bahwa manfaat itu kecil (§1.5) — lalu melaporkannya, bukan menyembunyikannya

⚠️ **Cool route planner adalah contoh pertama yang panitia tulis sendiri di Track 01.** Kolam ini akan ramai. Diferensiasi HeatWalk bukan pada rutenya, melainkan pada mekanisme hukum, persona berkonsekuensi, dan aturan kausal di §1.4. Ini harus eksplisit di menit pertama pitch, bukan diasumsikan terlihat sendiri.

### 1.10 Pemetaan ke kriteria penilaian resmi

Kriteria panitia: *"Real use of the platform (the API or Dashboard is central, not decorative); a clear problem and user; a measurable outcome (e.g. −7°F (−4°C) on this route); and a path to real-world deployment. Judges reward applied relevance over flashy demos."*

| Kriteria | Bukti dalam produk |
|---|---|
| **API sentral, bukan dekoratif** | Tombol "sembunyikan data panas" (FR-16): zona kolaps jadi lingkaran, rute teradem kolaps jadi rute terpendek, produk kembali ke status quo |
| **Problem & user jelas** | Dua persona, dua keputusan nyata, satu mekanisme hukum yang sudah berjalan |
| **Measurable outcome** | G2 radius setara-dosis vs radius kebijakan · G3 °C·menit tereliminasi · G7 delta antar-jam · G9 rentang exceedance. Panel rute (FR-4) memakai format °C dan °F persis seperti contoh panitia |
| **Path to deployment** | Mekanisme hukum + pendanaan negara bagian + software penerima semuanya sudah eksis (§1.3, §1.9A) |

**Alokasi usaha.** Kalimat *"judges reward applied relevance over flashy demos"* adalah instruksi prioritas eksplisit:

| Prioritaskan | Korbankan lebih dulu |
|---|---|
| Kalibrasi enrollment ke CCD | Animasi transisi zona |
| Halaman metodologi & keterbatasan | Styling peta yang cantik |
| Export CSV yang benar-benar bisa dipakai | Slider waktu yang super mulus |
| Angka yang dapat diverifikasi | Efek hover, mikrointeraksi |
| Melaporkan temuan kecil secara terbuka | Menyembunyikannya agar demo terlihat mulus |

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
| **Butuh dari HeatWalk** | Zona per sekolah + daftar blok yang direkomendasikan bus, beserta bukti yang bisa dibawa ke rapat school board |

### 2.2 Primary B — Orang tua / Siswa (Mode 2)

| | |
|---|---|
| **Konteks** | Anaknya berada di dalam walk zone dan tidak mendapat bus |
| **Frekuensi** | Harian saat musim panas; meningkat tajam saat gelombang panas |
| **Keputusan** | Rute mana yang ditempuh anaknya setiap hari; apakah perlu mengajukan permohonan hazardous walking |
| **Alat saat ini** | Tidak ada. Google Maps memberi rute terpendek, tanpa informasi panas |
| **Butuh dari HeatWalk** | Opsi rute yang konkret dengan paparannya masing-masing, atau — kalau tidak ada rute aman — dasar tertulis untuk mengajukan permohonan ke distrik |

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
| US-12 | Orang tua | menggeser slider ke jam pulang anak saya yang sebenarnya | angkanya sesuai kondisi anak saya, bukan jam rata-rata |
| US-13 | Facilities Planner | melihat tabel segmen jalan berperingkat | tahu di mana menanam pohon lebih dulu |
| US-14 | Sistem | menjalankan refresh forecast | membuktikan pipeline hidup |
| US-15 | Orang tua | melihat rute berdasarkan suhu hari ini, bukan hari model | tahu rutenya relevan sekarang |

---

## 4. Functional requirements

### Mode 2 — Cek alamat (pintu masuk default)

#### FR-1 — Input alamat + sekolah *(P0)*

- Satu input alamat (geocoding) + input sekolah, keduanya bergaya pencarian dengan saran langsung — meniru pola "usual map" (amendemen 2026-08-28, Revan)
- **Origin:** mengetik memicu saran Nominatim langsung (debounced, sampai 5 hasil); klik saran atau Enter memindahkan pin. Chip alamat contoh dihapus dari panel produksi — sudah tidak dibutuhkan begitu saran langsung ada
- **Destination:** input pencarian yang **membatasi pilihan ke daftar sekolah dalam AOI saja** — mengetik menyaring nama sekolah yang cocok secara live; hanya mengklik satu hasil yang mengganti sekolah terpilih. Teks yang tidak cocok apa pun kembali (revert) ke sekolah terpilih terakhir saat field kehilangan fokus — pengguna tidak bisa "nyangkut" di sekolah yang tidak valid
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
- Keduanya di-render dari `graph.json` + `temps.json` pre-computed, **tanpa panggilan API saat runtime**

#### FR-4 — Panel perbandingan rute *(P0)*

Ini panel utama Mode 2. Isinya perbandingan **opsi rute** pada jam yang sedang dipilih:

```
Rumah kamu → SD Lincoln              Berangkat 15:00  ◀ ▶

              Terpendek    Teradem      Selisih
Jarak         1,42 km      1,68 km      +260 m
Waktu         20 mnt       23 mnt       +3 mnt
Suhu rata2    41,2°C       40,5°C       −0,7°C  (−1,3°F)
Suhu puncak   44,0°C       42,9°C       −1,1°C  (−2,0°F)
Dosis panas   503 °C·mnt   468 °C·mnt   −7%
```

Baris suhu **wajib menampilkan °C dan °F**. Ini format persis yang dipakai panitia di kriteria penilaian, dan audiens distrik sekolah AS berpikir dalam °F.

**Angka tidak boleh dibesar-besarkan.** Kalau selisihnya memang −0,7°C, tulis −0,7°C. Panel ini justru menjadi bukti argumen produk: pilihan rute bukan solusinya, dan itulah sebabnya sebagian anak butuh bus.

Slider jam (FR-13) mengganti seluruh angka di panel ini, dan boleh mengubah jalur rute teradem itu sendiri.

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

**Amendemen 2026-08-28 (Revan): seleksi sekolah di Mode 1 kini berbentuk siklus fokus.** Klik pin teranalisis (atau baris daftar) memfokuskan sekolah itu: semua pin sekolah lain — teranalisis maupun belum — hilang dari peta, menyisakan zona + blok + pin sekolah terfokus, supaya peta tidak bising saat satu sekolah sedang dibaca. Keluar dari fokus lewat tombol back di panel (kembali ke daftar sekolah) atau dengan mengklik pin yang sama sekali lagi. Saat tidak fokus, semua pin kembali tampil dan tidak ada zona yang dirender; Mode 1 tidak lagi mengunci satu sekolah terpilih sejak boot.

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

**Ambang batas:** turunan dari Lanza dkk. (2023) yang mengidentifikasi 33°C sebagai titik balik perilaku anak. Ambang dosis dihitung sebagai akumulasi °C·menit di atas baseline sepanjang jalur, pada **jam kanonik** (§1.6) — jam terpanas dalam hari sekolah, diturunkan dari data. **Nilai pastinya dikalibrasi saat implementasi dan wajib didokumentasikan sebagai parameter yang dapat diubah.**

Konsekuensi §1.5: kategori kuning akan berisi lebih sedikit blok daripada yang intuitif, karena selisih antar-rute kecil. Distribusi aktual dilaporkan apa adanya; **ambang tidak digeser untuk mengisi kategori kuning secara artifisial.**

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

**Amendemen 2026-08-28 (Revan): FR-10 dicabut dari produk.** Mode 1 tidak lagi me-render rute apa pun di peta — tampilan distrik kini murni zona: lingkaran kebijakan, choropleth dosis, dan lingkaran radius setara-dosis. Bukti kuantitatif per blok tetap utuh di panel detail blok (FR-9) dari angka yang di-precompute pipeline (`shortest`/`coolest` per blok); yang dihapus hanya garis rute di peta beserta kode klien yang menghitungnya di Mode 1 (`useDistrictSelectedRoute`, highlight segmen). Pembuktian rute visual tetap hidup di Mode 2 (FR-3).

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

Radius kebijakan              [n] mi
Radius setara-dosis           [n] mi  ([%])

Salah klasifikasi:
  Dapat bus, tidak perlu      [n]
  Jalan kaki, seharusnya bus  [n]
```

#### FR-13 — Slider jam *(P0)*

Kontrol jam berangkat sepanjang hari sekolah, satu langkah per jam dari 07:00 sampai 16:00.

- Mode 1: kontrol layer zona. Ganti jam → choropleth ter-render ulang
- Perubahan slider me-render ulang dari file pre-computed, **bukan panggilan API**

**Amendemen 2026-08-28 (Revan): slider dihapus dari Mode 2.** Sejak FR-29, mode orang tua selalu memakai jam Orlando saat ini (`clampToSchoolHour(currentOrlandoHour())`) — meniru Google/Apple Maps yang tidak meminta pengguna memilih "jam berangkat" secara manual. Panel FR-4 tidak lagi punya kontrol jam; jam yang sedang berlaku ditampilkan sebagai teks ("Now · 15:00") di baris kondisi langsung (`LiveConditionsRow`), bukan sebagai slider. FR-13 selanjutnya hanya berlaku untuk Mode 1.

Jam yang tersedia dibaca dari `meta.hours` di data, bukan dikonstantakan di frontend. Tile yang cuma punya sebagian jam menampilkan langkah yang tersedia saja — jangan interpolasi jam yang tidak ditarik.

⚠️ Menit non-`:00` mengembalikan nol tile dari API. Slice baru apa pun harus di menit `:00`.

#### FR-14 — Export CSV / GeoJSON *(P1)*

Unduh daftar reklasifikasi berisi kolom: blok · estimasi anak · status sekarang · rekomendasi · suhu rata-rata rute teradem (°C dan °F) · dosis (°C·menit) · alasan.

Ini titik integrasi ke Transfinder/Versatrans/EDULOG yang sudah punya layer "hazardous zones and streets". Sebutkan eksplisit di pitch sebagai jawaban atas "kenapa bukan incumbent saja yang bikin?"

#### FR-15 — Tabel prioritas segmen *(P1)*

Tabel terurut: nama segmen jalan · jumlah anak terdampak · estimasi penurunan suhu puncak (°C) · estimasi penurunan dosis (%) jika diteduhi.

Kolom penurunan suhu wajib ada — inilah bentuk measurable outcome untuk intervensi naungan.

#### FR-18 — Radius setara-dosis *(P0)*

Untuk tiap sekolah, hitung dan tampilkan radius lingkaran yang **seharusnya** dipakai kalau kriterianya dosis, bukan jarak: jarak terjauh dari sekolah yang rute teradem-nya masih di bawah ambang, pada jam kanonik (§1.6).

```
Radius kebijakan     1,00 mi
Radius setara-dosis  0,42 mi   (−58%)
```

Dirender sebagai lingkaran ketiga di peta Mode 1, dan sebagai satu baris di ringkasan sekolah FR-12. Ini berbicara dalam satuan yang sudah dipakai kebijakan distrik hari ini.

#### FR-19 — Exceedance per blok *(P1)*

Berapa hari per tahun ajaran rute teradem sebuah blok melewati ambang. Sumber: distribusi harian stasiun ASOS dikombinasikan dengan offset spasial per blok dari FortyGuard (§1.5, sumbu 3).

Ditampilkan di panel detail blok FR-9 dan di kolom export FR-14. Ini pembawa G9.

#### FR-20 — Lapisan sekolah nasional *(P0)*

Peta merender **seluruh sekolah dari NCES Common Core of Data**, bukan hanya yang teranalisis. Data ini gratis dan tidak menyentuh kredit FortyGuard.

| Status sekolah | Render | Klik |
|---|---|---|
| Teranalisis | Pin penuh, dapat dipilih | Memuat zona + blok + rute |
| Belum teranalisis | Pin abu-abu kecil | "Belum dianalisis — tile ini belum ditarik" |

Zoom keluar memperlihatkan ribuan sekolah; zoom masuk memperlihatkan mana yang sudah punya zona. Cakupan menjadi terlihat sebagai **progres**, bukan sebagai batas.

**Aturan keras:** sekolah belum teranalisis **tidak boleh** menampilkan angka apa pun — bukan interpolasi, bukan rata-rata regional, bukan estimasi. Nol angka. Satu angka karangan yang ditemukan juri membatalkan kriteria "real use of the platform" untuk seluruh submission.

**Amendemen 2026-08-28 (Revan): pin belum-teranalisis tampil terkunci.** Pada zoom pin (≥10), pin belum-teranalisis di-redupkan (opasitas ikon ±0,55) dan tidak lagi membawa label nama — hanya pin teranalisis yang berlabel — supaya status "belum bisa dibuka" terbaca sekilas dari bentuknya. Klik pin belum-teranalisis tetap memunculkan notice "belum dianalisis" (tidak berubah), dan saat satu sekolah sedang difokuskan (amendemen FR-6) seluruh pin lain — termasuk yang belum teranalisis — hilang dari peta.

Sumber: NCES CCD school directory (lat/lon, nama, jenjang, enrollment, distrik). Dimuat sebagai satu file terpisah dan di-render sebagai layer simbol MapLibre — bukan marker DOM, yang akan mematikan browser pada jumlah segini.

#### FR-21 — Peta cakupan tile *(P1)*

Layer tipis yang menampilkan batas tile yang sudah ditarik, dengan tanggal fetch dan jam slice-nya. Menjawab "data ini dari mana" secara visual, dan memperlihatkan pipeline sebagai sesuatu yang berjalan bertahap, bukan sekali jadi.

### Lintas-mode

#### FR-16 — Tombol "Sembunyikan data panas" *(P0)*

Satu tombol yang mengembalikan produk ke status quo:
- Layer B & C hilang → tersisa lingkaran walk zone resmi saja
- Rute teradem hilang → tersisa rute terpendek saja
- Semua angka turunan panas berubah jadi `—`

Fungsinya adalah demonstrasi kriteria "API sentral, bukan dekoratif" dalam satu klik. Juri melihat langsung apa yang distrik punya hari ini versus apa yang FortyGuard tambahkan. **Fitur paling murah dibangun dengan dampak persuasif tertinggi di seluruh dokumen ini.**

#### FR-17 — Refresh forecast *(P1)*

Satu tombol yang memicu panggilan live ke FortyGuard forecast 12 jam, membuktikan pipeline berfungsi. Wajib punya loading state dan error handling yang jelas, dan terisolasi total dari jalur demo utama.

### Feedback QA demo 2026-08-27

Tujuh FR berikut lahir dari QA demo menjelang submission. Keputusan coverage FR-22 dan warna FR-28 adalah keputusan produk eksplisit Revan, 2026-08-27.

#### FR-22 — Cakupan zona penuh di dalam lingkaran *(P0)*

Interior lingkaran kebijakan **dan** lingkaran radius setara-dosis di Mode 1 harus tertutup penuh choropleth zona — tidak boleh ada "lubang" abu-abu basemap di dalamnya, karena lubang terbaca sebagai "distrik tidak tahu" padahal datanya ada.

Caranya dua lapis: (1) pipeline mengklasifikasi **semua** blok sensus yang berpotongan bbox, termasuk blok dengan `POP100 = 0` (sebelumnya di-skip); blok kosong otomatis punya `kids_est = 0` sehingga tidak mengubah metrik anak di `summary.json`; (2) Mode 1 me-render file blok **gabungan seluruh sekolah** (`district_blocks.geojson`), bukan file per-sekolah — file per-sekolah adalah partisi nearest-school, sehingga blok di dalam lingkaran sekolah X yang lebih dekat ke sekolah Y tidak pernah muncul di view X.

Aturan penutupnya (keputusan Revan, 2026-08-27): render dibatasi ke **interior lingkaran kebijakan sekolah terpilih** — blok di luar lingkaran itu (termasuk blok milik sekolah lain yang berada di luar lingkaran sekolah terpilih) tidak dirender sama sekali. Zona hijau/merah hanya pernah tampil di dalam lingkaran yang sedang digambar; clip dihitung client-side dari centroid blok vs `walk_radius_mi` (`web/src/lib/blocksInsidePolicyCircle.ts`).

Pengecualian yang diterima secara sadar dan didokumentasikan di `docs/LIMITATIONS.md`: porsi lingkaran kebijakan yang jatuh **di luar bbox tile data panas** di sisi barat tetap kosong — terukur ±17% lingkaran Meadowbrook Middle, ±15% Ridgewood Park Elementary, ±7% UCP Pine Hills Charter, ±1% Maynard Evans High (Rosemont dan Rolling Hills penuh). Menutupnya menuntut perluasan bbox + fetch API baru, dinilai tidak sepadan 3 hari sebelum deadline.

#### FR-23 — Label suhu blok *(P1)*

Pada zoom cukup dekat, tiap blok menampilkan label suhu rata-rata rutenya (mis. `36.6°C`) di pusat blok, berganti mengikuti slider jam (dari `blocks_hours` per jam). Label adalah data panas: sembunyi total saat FR-16, dan memakai halo `--bg` supaya terbaca di atas basemap berwarna.

#### FR-24 — Highlight top-5 segmen prioritas *(P1)*

Lima segmen teratas `segments.json` (urutan existing: kids terdampang, lalu suhu puncak) dirender persisten di peta dengan garis tebal kategori merah + label rank 1–5, dan tabel FR-15 mendapat kolom rank; klik baris tabel menerbangkan peta ke segmennya dan menegaskan highlight-nya. Hilang saat FR-16.

#### FR-25 — Tombol info metodologi *(P2)*

Satu tombol ikon di cluster kontrol yang membuka `/methodology`. Panel metodologi sudah ada; tombol ini membuatnya ditemukan tanpa harus tahu link tersembunyi di atribusi peta.

#### FR-26 — Deskripsi lingkaran saat hover *(P2)*

Hover pada lingkaran kebijakan (putus-putus) atau lingkaran radius setara-dosis (solid) menebalkan garisnya dan menampilkan tooltip penjelasan: apa lingkaran ini, berapa milnya (dari data, bukan teks mati), dan untuk lingkaran kebijakan — bahwa 2,0 mi adalah kebijakan **distrik** (OCPS, seragam K–12 per FS 1006.23), bukan aturan federal. Tooltip radius setara-dosis ikut sembunyi saat FR-16.

#### FR-27 — Legend peta sisi kanan *(P1)*

Legend mengambang di sisi kanan peta, bisa dilipat, sadar-mode: kelas zona + makna kedua lingkaran + garis top-5 (Mode 1); rute + ramp suhu + lingkaran kebijakan (Mode 2). Ini **pengecualian disengaja** atas aturan "nol kontrol lain yang mengambang di atas peta" di DESIGN.md — legend dipindah ke atas peta supaya selalu terlihat saat panel samping collapsed, dan `map.setPadding` ikut me-reserve lebarnya. Konten legend meredup saat FR-16.

#### FR-28 — Warna suhu di rute Mode 2 *(P1)*

Rute terpendest diberi warna per segmen mengikuti suhu jalannya pada jam terpilih: ramp **biru → oren** (biru = di baseline, makin oren = makin panas), jangkar domain dari `meta.baseline_c` sampai segmen terpanas di jalur. Rute teradem berubah dari tinta hitam menjadi **biru solid** — keputusan produk 2026-08-27: biru = "jawaban", ramp di rute terpendest = paparan status quo. Saat FR-16, rute terpendest kembali netral abu putus-putus dan seluruh warna hilang — momen "lampu dimatikan" tetap utuh.

**Amendemen 2026-08-28 (Revan): di Mode 2, biru hanya milik rute yang kartunya terpilih.** Dengan tiga kartu rute (FR-30), peta menampilkan terlalu banyak biru sekaligus — rute teradem selalu biru dan ramp rute terpendek berujung biru — sehingga kartu yang sedang terpilih tidak terbaca dari warna. Aturan baru Mode 2: satu-satunya garis biru (`--route-coolest`) adalah rute yang kartunya terpilih di panel; semua rute lain (teradem, terpendek, alternatif) netral `--ink-subtle`. Konsekuensi: ramp biru→oren tidak lagi muncul di Mode 2 dan hanya hidup di Mode 1 (di sana tidak ada seleksi kartu), dan rute terpilih dipindah ke atas tumpukan layer supaya geometri bersama (G8) tidak menutupi garis biru. FR-16 tidak berubah.

**Amendemen 2026-08-28 (Revan, penutup): ramp biru→oren dipensiunkan dari seluruh produk.** Konsekuensi bergandengan dua keputusan hari ini — biru hanya untuk rute terpilih di Mode 2 (di atas) dan rute dihapus total dari Mode 1 (amendemen FR-10) — ramp per-segmen tidak lagi punya tempat tampil di mode mana pun. Token `--route-heat-cool`/`--route-heat-hot` dihapus dari `theme.css`, kode ramp klien (`routeRampFeatures`) dihapus, dan rute kini tampil di Mode 2 saja. Satu-satunya warna rute di produk adalah `--route-coolest` untuk rute terpilih.

#### FR-29 — Suhu live di Mode 2 *(P1)*

Keputusan produk 2026-08-28 (Revan): mode orang tua memanggil FortyGuard secara live untuk suhu **hari ini**, alih-alih murni memakai hari model 2023-08-08, supaya rute terasa seperti Google/Apple Maps — relevan hari ini, bukan riset historis.

Ini **bukan** FR-17 dibangun ulang. FR-17 (di atas) tetap tidak dibangun untuk alasan yang sama seperti sebelumnya (kunci API tidak boleh dibundel ke browser). FR-29 mengatasi persis masalah itu lewat satu fungsi serverless read-only yang menahan kunci API — lihat amendemen §6.1 di bawah — bukan lewat memanggil FortyGuard langsung dari browser.

Batasan yang mengikat implementasi:

- **Terpisah dari render rute.** Rute selalu ter-render dari `temps.json` dalam <1 detik seperti sekarang (FR-3); panggilan live berjalan di latar belakang dan meng-upgrade rute yang sudah tampil begitu datang. Rute tidak pernah menunggu jawaban FortyGuard.
- **Klasifikasi blok tidak ikut live.** Kategori merah/kuning/hijau, `safe_until_hour`, dan seluruh `summary.json` tetap dari hari model — gerbang G1 (2.955 blok merah) dihitung dari data itu dan harus tetap bisa direproduksi. Panel wajib menyatakan eksplisit "modeled day 2023-08-08" untuk angka-angka ini saat suhu live aktif, supaya tidak diam-diam kontradiktif dengan rute yang sudah live.
- **Jam mengikuti jam Orlando saat ini**, dipotong ke rentang 07:00–16:00 yang datanya tersedia (lihat amendemen FR-13 — tidak ada lagi kontrol slider di Mode 2, jam ini otomatis).
- **Gagal senyap.** Timeout, error, atau limit kredit membuat produk tetap di hari model — tidak ada state error yang menghalangi jalur demo utama.

**Amendemen 2026-08-28 (Revan): per-sel dalam satu tile per sekolah, bukan satu offset seragam per AOI.** Rilis awal FR-29 memakai "satu offset seragam per AOI, bukan per sel" karena AOI penuh (±58 mi²) jauh melebihi batas 10 mi² per panggilan `heatmap`. Keputusan baru mempersempit cakupan panggilan live, bukan mempersempit resolusinya:

- Satu panggilan `heatmap` per sekolah per jam, di-scope ke tile 5,0 × 5,0 km (±9,65 mi², di bawah batas 10 mi²) berpusat di titik sekolah — bukan bbox AOI penuh. `schoolId` divalidasi di server terhadap `schools.json`; ini pagar kredit, bukan cuma kenyamanan API, karena bbox sembarang dari klien bisa membakar 4.220 kredit per permintaan.
- Respons `heatmap` (grid sel `map_data.features`) digrid di server (`web/api/_lib/heatmapGrid.ts`, port dari `pipeline/heatmap_raster.py:build_grid`) dan dikirim ke klien sebagai raster ringan (~35 KB, ~84×84 sel) alih-alih hanya median skalar.
- Klien menyampel grid itu ke sepanjang geometri tiap edge jalan (`web/src/lib/edgeLiveTemperatures.ts`, spasi sampel 20 m — mencerminkan `pipeline/edge_sampling.py`) menghasilkan `temp_c`/`peak_c` **per edge**, bukan satu offset yang diratakan ke seluruh graph. Dosis dihitung ulang dari nilai live itu lewat `doseCMin()` yang sama, satu-satunya rumus dosis di kode.
- Edge di luar tile 5×5 km (fringe walk zone sekolah besar) tidak punya sampel live dan jatuh kembali ke suhu model + offset seragam sebagai fallback — didokumentasikan di `docs/LIMITATIONS.md`.
- Karena slider jam sudah dihapus dari Mode 2 (amendemen FR-13), hanya ada **satu** jam live yang pernah diminta per sekolah per hari — konsumsi kredit tidak bertambah dari perubahan ini dibanding rencana rilis awal FR-29.

#### FR-30 — Opsi rute majemuk *(P1)*

Keputusan produk 2026-08-28 (Revan): selain rute teradem dan rute terpendek (FR-3), Mode 2 menampilkan **hingga tiga rute terbaik secara total** — satu rute alternatif tambahan di atas keduanya. Amendemen 2026-08-28 lanjutan (same-day): rilis pertama FR-30 menampilkan hingga dua alternatif (empat kartu total); Revan memangkas ke satu alternatif (tiga kartu total) supaya panel tetap ringkas, meniru pengalaman "beberapa opsi rute" pada Google/Apple Maps tanpa terasa penuh.

- Alternatif dicari dengan metode penalti: jalankan ulang Dijkstra pada bobot `weight_cool` dengan bobot edge yang sudah dipakai rute lain dikalikan `ALTERNATE_PENALTY_FACTOR`, tolak kandidat yang berbagi lebih dari `MAX_SHARED_LENGTH_RATIO` panjangnya dengan rute yang sudah diterima (`web/src/lib/routeAlternatives.ts`).
- **Jumlahnya boleh nol.** FR-8/G8 sudah menunjukkan ~90% blok punya rute teradem yang identik dengan rute terpendek di jaringan grid Orlando — pada blok begitu, mesin pencari alternatif genuinely kehabisan jalur yang cukup berbeda. Panel harus tetap benar dirender dengan 2 atau 3 kartu total; jangan memaksakan jumlah tetap dengan melonggarkan ambang kemiripan.
- Rute alternatif dirender abu netral (`--ink-subtle`, 2px solid) — lihat amendemen §Rute di `DESIGN.md`. Ini bukan penambahan warna baru; keduanya konsisten dengan aturan "warna hanya di peta/legend/badge" karena abu bukan warna kategori.
- **Memilih kartu rute mana pun** (teradem, terpendek, atau alternatif) menebalkan garisnya di peta **dan** membingkai ulang tampilan peta ke batas geometri rute itu (`hooks/useRouteFocus.ts`, `map.fitBounds`) — satu-satunya cara membedakan antar-rute yang kebetulan berbagi jalur identik, sebelum legend FR-27 mencakup Mode 2 sepenuhnya.
- Alternatif ikut hilang saat FR-16 aktif, sama seperti rute teradem.

**Amendemen 2026-08-28 (Revan, lanjutan): rute terpendek dihapus dari kartu dan dari peta; alternatif naik dari satu jadi dua.** Revan melaporkan rute terpendek kebanyakan redundan secara visual dengan rute teradem (G8 di atas). Kartu "Shortest route" dan garisnya di peta dihapus dari Mode 2; `ALTERNATE_ROUTE_COUNT` di `web/src/lib/routeAlternatives.ts` naik dari 1 ke 2, jadi panel tetap tiga kartu total — teradem + hingga dua alternatif, bisa kurang kalau mesin pencari kehabisan jalur berbeda (aturan "boleh nol" di atas kini berlaku untuk dua slot). FR-3 (rute terpendek) tidak dihapus dari produk — `routeSolver.ts` tetap menghitungnya, dan tetap satu-satunya pembanding di tabel FR-4 (`RouteComparisonPanel`), cuma berhenti punya representasi visual dan berhenti bisa dipilih sebagai kartu. Peran "garis netral putus-putus" FR-16 berpindah dari rute terpendek ke rute teradem sendiri — lihat amendemen §Rute di `DESIGN.md`.

---

## 5. Data requirements

### 5.1 FortyGuard API

| Endpoint | Parameter | Fungsi dalam produk | Prioritas |
|---|---|---|---|
| `POST /v1/heatmap` | `tcm`, granularity 60m | **Bobot dosis per edge jalan. Satu-satunya yang load-bearing — tanpa ini tidak ada produk** | P0 |
| `POST /v1/heatmap` | `time_of_measure` | Satu slice per jam, 07:00–16:00 | P0 |
| `GET /v1/status/{activity_id}` | — | Polling job async. Wajib, semua endpoint analisis bersifat async | P0 |
| `POST /v1/heatmap` | `exceedance` | Berapa hari per tahun ajaran jalur melewati ambang | P1 |
| `POST /v1/heatmap` | `persistence` | Durasi panas bertahan di suatu titik | P2 |
| `GET /v1/system/fetch-api-key-usage` | — | Menjaga kredit trial tidak habis | Ops |

**Tidak dipakai:** Satellite View Segmentation, Street View Segmentation, Heat Intelligence — semuanya Premium-only. `env_params` di-skip: belum terverifikasi apakah ia mengembalikan grid seluruh AOI atau hanya titik tunggal, dan menambah dependency belum teruji bukan risiko yang sepadan. Konsekuensinya batasan §8 poin 2 berbunyi "indeks berbasis suhu udara 2m", bukan "+ beban radiasi".

**Batasan tier Basic yang harus dihormati:**

- **AOI maksimum 10 mi² per panggilan ≈ 5,1 km × 5,1 km.** Ini batas per-panggilan, **bukan** batas cakupan produk. Cakupan dibangun dengan **memosaikkan banyak tile** (§5.6). Satu walk zone SD radius 1 mil = 3,14 mi², jadi satu tile memuat beberapa walk zone penuh
- **Biaya flat 4.220 kredit per panggilan**, terverifikasi dengan tiga panggilan terkontrol (863 / 309 / 6.642 sel, ketiganya identik). Konsekuensi langsung: **jangan pernah meminta kotak kecil.** Selalu minta 10 mi² penuh
- **Menit non-`:00` mengembalikan nol tile secara senyap.** Semua slice harus di menit `:00`
- Granularity terbatas 60/80/100m
- Semua job async → wajib polling via Check Status
- Nilai `-999` adalah legacy null → **harus di-handle eksplisit**, jika tidak statistik akan rusak diam-diam
- Forecast horizon 12 jam; data historis tersedia sejak 2019

**Strategi fetch:** satu panggilan per jam per tile, 07:00–16:00, pada hari panas dari data historis. Hasilnya dibekukan ke disk — **bukan** fetch berkelanjutan. Cache seluruh respons mentah sebelum diproses, dan cek cache sebelum memanggil.

**Resolusi waktu vs luas cakupan bersaing memperebutkan kredit yang sama:**

| Cakupan | 10 slice/tile | % jatah |
|---|---|---|
| Gelombang 1 (1 tile) | 42.200 | 2,4% |
| Gelombang 2 (6 tile) | 253.200 | 14% |
| Gelombang 3 (30 tile) | 1.266.000 | 71% |

Kredit muat untuk ketiganya, tapi **waktu fetch yang jadi batasan nyata** — 300 panggilan async berpolling memakan berjam-jam. Aturan yang berlaku:

- Gelombang 1–2: **jam penuh** (10 slice per tile)
- Gelombang 3: boleh turun ke **3 slice** (pagi, jam kanonik, sore) per tile, dan itu **dicatat di Limitations dan di `tiles.json`**, bukan disamarkan
- Frontend membaca jam yang tersedia dari data. Tile bergigi jarang menampilkan langkah slider yang lebih sedikit — **tidak pernah menginterpolasi jam yang tidak ditarik**

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

### 5.4 Kota demo — Orlando / Orange County, FL

**AOI terpilih: `orl_pine_hills_n`.**

Statuta hazardous walking Arizona diverifikasi **tidak ada** — `ARS §15-901` murni berbasis jarak, dan kode kebijakan model ASBA "Walkers and Riders" (EEAA) berstatus dihapus dari template kebijakan distrik Arizona. Florida punya mekanisme paling kuat dan paling eksplisit: **Florida Statute §1006.21/§1006.23**, dengan definisi "hazardous walking condition" tertulis dan angka konkret 19.693 anak TA 2019–2020.

**Kriteria pemilihan AOI, berurutan:**

1. Statuta hazardous walking negara bagian terverifikasi ada, dengan sitasi pasal
2. Kebijakan transportasi distrik tersedia publik sebagai PDF dengan radius walk zone tertulis
3. Batas attendance tersedia di portal ArcGIS distrik
4. Kepadatan sekolah — tile dipilih untuk memaksimalkan jumlah sekolah per panggilan
5. Kontras kanopi — **tie-breaker saja, bukan gerbang**

Kriteria 5 bukan gerbang karena §1.5: suhu udara 2m tidak berperilaku seperti suhu permukaan, jadi mencari AOI dengan kontras spasial besar adalah pencarian yang tidak akan berhasil di kota mana pun.

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

**Phoenix tidak boleh masuk UI, dan ini bukan soal waktu.** Statuta hazardous walking Arizona tidak ada. Blok merah di Phoenix berarti tombol permohonan tanpa dasar hukum untuk dikutip — lubang pertama yang akan ditemukan juri, dan ia merusak §1.3 yang merupakan fondasi seluruh pitch.

**Nilai Phoenix ada di pitch, bukan di produk.** Satu tabel pembanding: *"config diganti, bbox diganti, pipeline jalan tanpa satu baris kode berubah."* Klaim distrik-agnostik jadi terbukti, bukan diklaim.

**Prasyarat:** `config.py` harus bersih dari nilai per-kota yang hardcoded.

**Gerbang tanggal — 27 Agustus 12:00.** Kalau Orlando belum lulus seluruh checklist klasifikasi & export, **Phoenix dibuang seluruhnya**, bukan dikurangi. Keputusan ini diambil sekarang, bukan tanggal 29 dini hari.

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
    │   ├── graph.json              geometri + topologi, sekali saja
    │   ├── temps.json              suhu & dosis per edge per jam
    │   └── blocks.geojson
```

**Geometri dipisah dari suhu.** Geometri jalan identik di semua jam dan berukuran 2–4 MB; menyimpannya ulang per jam berarti pemborosan sepuluh kali lipat. `temps.json` berisi array angka saja — tanpa koordinat, tanpa nama jalan — sehingga sepuluh jam muat dalam ±200 KB.

```
graph.json   nodes, edges, len_m, geometri tersederhanakan   ~3 MB
temps.json   { meta: { hours: [...], canonical_hour: "15:00" },
               edges: { <edge_id>: { "07:00": [temp_c, peak_c, dose], ... } } }
```

Total per sekolah ±3,2 MB untuk sepuluh jam, bukan 30 MB. Skema pastinya dikunci di `docs/CONTRACT.md` sebelum pipeline ditulis.

Frontend hanya mem-`fetch()` sekolah yang sedang dibuka, sekali, lalu seluruh jam berpindah di memori. Repo boleh 150 MB; yang ditarik browser tetap ±3,2 MB per sekolah.

**Sekolah yang walk zone-nya melintasi batas tile** memakai graph gabungan dari tile-tile yang bersinggungan. `step2_build_graph.py` menggabung sebelum routing, bukan sesudah — routing lintas-batas pada graph yang terpotong menghasilkan rute palsu.

#### `config.py` menerima daftar, bukan satu bbox

```python
TILES = [
    {"id": "ocps_01", "bbox": [...], "status": "done"},
    {"id": "ocps_02", "bbox": [...], "status": "pending"},
]
```

Menambah cakupan = menambah entri + jalankan ulang. **Tidak ada kode baru.** Ini keputusan struktur yang harus diambil sebelum graph ditulis — membangun single-bbox sekarang berarti refactor tanggal 28, dan refactor tanggal 28 adalah cara paling umum proyek hackathon mati.

#### Urutan rollout

| Gelombang | Isi | Kapan |
|---|---|---|
| 1 | 1 tile (Pine Hills) | Sampai seluruh checklist klasifikasi lolos |
| 2 | +5 tile inti OCPS | setelah gelombang 1 lolos |
| 3 | Sisa area padat sekolah | selama waktu dan kredit ada |

Gelombang 1 wajib lolos seluruh checklist sebelum gelombang 2 dijalankan. Bukan soal keraguan cakupan — soal jangan menggandakan bug yang sama ke 30 tile.

---

## 6. Arsitektur teknis

### 6.1 Prinsip

```
[Pipeline Python offline]  →  [file statis di data/out/]  →  [Web app React]
   jalan sekali/terjadwal        di-commit ke repo             routing client-side
```

**Tidak ada backend server, kecuali satu fungsi serverless read-only yang menahan kunci API FortyGuard untuk FR-29** — tanpa database, tanpa state, dan di luar jalur render rute (rute selalu ter-render dari `data/out/` dalam <1 detik; panggilan live meng-upgrade angkanya belakangan, tidak pernah menghalanginya). Di luar itu, **tidak ada panggilan API saat runtime** kecuali tombol refresh (FR-17, tidak dibangun) dan FR-29. Ini yang membuat timeline realistis dan demo tidak bisa gagal karena job async yang menggantung.

### 6.2 Engine: graph routing

Seluruh produk berjalan di atas satu graph jaringan jalan pejalan kaki dengan dua bobot per edge: panjang dan dosis panas.

Alasan memilih graph, bukan raster cost-distance:

1. **Satu engine untuk dua mode.** Mode 2 mutlak butuh graph routing. Kalau Mode 1 memakai raster, harus dibangun dua pipeline berbeda
2. **Dua metode bisa saling kontradiksi.** Raster bilang blok X aman, engine rute bilang jalur terbaik dari blok X 41°C — dua angka dari dua metode di aplikasi yang sama. Juri yang teliti akan menemukannya
3. **Output produk memang per blok**, bukan permukaan kontinu

Kekhawatiran umum "cakupan trotoar OSM sering bolong" berlaku untuk `footway`, tetapi tidak untuk `network_type='walk'`, yang menarik seluruh jalan yang dapat dilewati pejalan kaki termasuk jalan perumahan. Cakupan jalan di OSM Amerika berbasis TIGER dan hampir lengkap.

**Fallback:** jika graph gagal, raster cost-distance (`skimage.graph.MCP_Geometric`) tetap jalan cadangan yang valid — tapi hanya untuk Mode 1, dan Mode 2 harus dipotong.

### 6.3 Pipeline analisis (Python 3.11)

```
1. POST /v1/heatmap → tcm 60m, satu slice per jam 07:00–16:00 → GeoTIFF per tile per jam
2. osmnx.graph_from_bbox(network_type='walk')
3. Per edge per jam: rasterio sample sepanjang geometri → suhu rata-rata & puncak edge
4. Per edge: dose = max(suhu − baseline, 0) × (panjang_m / 1.2) / 60   → °C·menit
5. Per centroid blok per jam: dijkstra ×2 (weight='len_m', weight=weight_cool)
6. Klasifikasi blok per aturan FR-8, pada jam kanonik
7. Export graph.json + temps.json + blocks.geojson per sekolah
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
| Basemap | OpenFreeMap (vector tiles remote, style `liberty`) — tanpa API key, butuh internet saat runtime |
| Komponen UI | shadcn/ui (Radix + Tailwind), allowlist di `DESIGN.md` |
| Font | Inter, self-hosted via `@fontsource-variable/inter` |
| Hosting | Vercel (statis) |

**Pemisahan mode:** dua route pada satu aplikasi — `/` untuk Mode 2 (pintu masuk default) dan `/district` untuk Mode 1 — dengan satu segmented switch di header. **Instance MapLibre tidak boleh di-unmount saat berpindah mode**; transisi Mode 2 → Mode 1 di video demo adalah `flyTo` pada peta yang sama, dan itulah bukti visual bahwa keduanya satu engine.

**Basemap:** style URL remote `https://tiles.openfreemap.org/styles/liberty`. Tidak ada API key yang bisa habis atau di-retire di tengah masa penjurian. Keputusan produk 2026-08-27 malam (lihat `docs/METHODOLOGY.md` §Fase 8): rencana awal PMTiles self-hosted diganti karena satu bbox lokal tidak bisa menutupi AOI + zoom-keluar FR-20 dengan biaya file yang wajar untuk di-commit ke git (128 GB untuk cakupan planet penuh). Konsekuensi yang diterima: peta butuh internet saat runtime, jadi klaim "demo jalan offline" pada dev plan dicabut untuk basemap.

**Ukuran file:** graph dipecah **per sekolah**, bukan per AOI, dan geometri dipisah dari suhu (§5.6). Satu sekolah ≈ 5–15 ribu edge → `graph.json` 2–4 MB setelah disederhanakan Douglas-Peucker, `temps.json` ±200 KB untuk sepuluh jam. Target ≤5 MB untuk `graph.json`; kalau lewat, naikkan toleransi penyederhanaan sebelum mengganti format.

**Format data:** `graph.json` dan `temps.json` di-`fetch()` sekali saat sekolah dipilih, lalu seluruh jam berpindah di memori — slider tidak memicu request. GeoJSON di-`fetch()`, bukan di-`import`. Frontend memuat `schools.json` + `tiles.json` saat boot; graph dan blok dimuat **on-demand saat sekolah dipilih**, tidak semuanya di depan.

**Explicitly ruled out:** `deck.gl`, `react-map-gl`, backend server apa pun, PostGIS/DuckDB/Parquet, autentikasi, tile server pihak ketiga.

---

## 7. Non-functional requirements

| Kategori | Requirement |
|---|---|
| **Performa** | Input alamat → dua rute ter-render dalam <1 detik |
| **Performa** | Klik sekolah → zona ter-render dalam <2 detik, termasuk `fetch()` on-demand file sekolah itu |
| **Performa** | Layer pin NCES ter-render tanpa jank pada zoom keluar penuh. Wajib layer simbol MapLibre, bukan marker DOM |
| **Performa** | Perubahan slider jam → render ulang <500 ms, tanpa network request |
| **Reliabilitas** | Demo harus berfungsi penuh **tanpa koneksi internet sama sekali** setelah load pertama, kecuali tombol refresh (FR-17). Ini termasuk basemap — karena itu basemap di-host sendiri sebagai file statis |
| **Satuan** | Setiap tempat yang menampilkan °C·menit **wajib** menampilkan °C berdampingan. °C·menit benar secara ilmiah dan punya preseden literatur (Meng dkk. 2023), tetapi tidak intuitif — tidak ada yang tahu apakah 340 °C·menit itu buruk. Semua orang tahu 41°C itu berbahaya |
| **Satuan** | Sertakan °F di samping °C pada semua angka headline |
| **Transparansi** | Setiap angka yang ditampilkan harus dapat ditelusuri ke sumber data; halaman "Metodologi" wajib ada |
| **Kejujuran** | Halaman "Limitations" wajib ada dan mudah diakses dari UI utama |
| **Kompatibilitas** | Desktop browser modern untuk Mode 1. **Mode 2 sebaiknya mobile-friendly** karena personanya orang tua yang mengecek dari HP |

---

## 8. Batasan yang harus dinyatakan di produk

Wajib tampil di halaman Limitations dan di slide pitch:

1. Resolusi 60m tidak dapat membedakan trotoar sisi kiri vs kanan → skoring dilakukan di level **koridor**, bukan trotoar
2. Tanpa wind speed & globe temperature → **bukan WBGT**; sebut "indeks dosis panas berbasis suhu udara 2m"
3. Cakupan dibatasi jumlah tile yang berhasil ditarik sebelum deadline. Sekolah di luar tile ter-render sebagai pin abu-abu berlabel "belum dianalisis", tidak pernah dengan angka hasil interpolasi atau tebakan
4. Rute dimodelkan dari jaringan OSM — anak sungguhan mungkin memotong jalan atau menempuh jalur informal
5. Kecepatan jalan diasumsikan 1,2 m/s untuk semua anak
6. Tidak semua anak dalam batas attendance bersekolah di situ (charter/swasta/open enrollment), meleset ~10–20%
7. Data sensus level block mengandung noise differential privacy
8. Luas bangunan ≠ jumlah unit → apartemen akan under-estimate
9. Batas SABS berumur ~10 tahun jika data distrik langsung tidak tersedia
10. **Manfaat pemilihan rute kecil.** Suhu udara 2m terukur menunjukkan variasi spasial intra-urban jauh lebih kecil daripada yang tersirat dari peta naungan atau suhu permukaan. Delapan kandidat AOI di dua kota diuji; kontras terbaik 1,84°C (p95−p05). Konsekuensinya delta antar-rute berada di kisaran 0,5–0,8°C. **Paparan didominasi durasi dan waktu hari, bukan pilihan jalur**
11. Kategori kuning (FR-8) berisi lebih sedikit blok daripada yang intuitif, sebagai konsekuensi langsung poin 10. Distribusi aktual dilaporkan apa adanya; ambang tidak digeser untuk mengisinya
12. **Klasifikasi memakai jam kanonik (jam terpanas hari sekolah) dan dosis satu perjalanan.** Anak berjalan dua arah setiap hari, sehingga paparan sebenarnya adalah penjumlahan pagi + sore. Angka produk ini **under-estimate**, bukan over-estimate
13. **Cakupan jam tidak seragam antar tile.** Tile gelombang 1–2 punya sepuluh slice per jam; tile gelombang 3 mungkin hanya tiga. Slider hanya menampilkan jam yang benar-benar ditarik, dan status per tile terbaca di `tiles.json`. Tidak ada jam yang diinterpolasi
14. Angka exceedance (FR-19) adalah **hibrida**: distribusi temporal dari stasiun ASOS titik tunggal, offset spasial dari FortyGuard. Ia mengasumsikan offset spasial per blok stabil antar-hari — asumsi yang tidak diuji
15. AOI Phoenix tidak memiliki kalibrasi enrollment, batas attendance distrik, maupun dasar statuta. Ia hadir sebagai bukti portabilitas pipeline saja dan tidak boleh dibaca sebagai rekomendasi kebijakan

---

## 9. Milestone

Hari ini 25 Agustus 2026. Deadline 30 Agustus 23:59 GST.

| Tanggal | Target | Definition of done |
|---|---|---|
| ~~23~~ | ✅ Verifikasi API | `tcm` terkonfirmasi suhu udara 2m AGL; `-999` ter-handle; biaya flat 4.220 kredit/panggilan; menit non-`:00` mengembalikan nol tile |
| ~~24~~ | ✅ Verifikasi hukum | Statuta Arizona terverifikasi tidak ada; kota demo Florida |
| ~~25 pagi~~ | ✅ Pemilihan AOI | `orl_pine_hills_n` dipilih lewat kriteria hukum-dulu |
| **25 sore** | Kunci struktur + akuisisi data | `TILES` & skema `graph.json`/`temps.json` dikunci; raster 10 slice, graph OSM, sekolah CCD, blok sensus, radius kebijakan OCPS masuk `data/interim/` |
| **26 pagi** | Graph berbobot dosis | Dosis per edge per jam masuk akal, `graph.json` per sekolah ≤5 MB |
| **26 siang** | Routing & outcomes | 🚩 **Gerbang G1**: ≥1 blok merah. Sisanya dilaporkan apa adanya |
| **26 malam** | Klasifikasi + export + gelombang 2 | 3 kategori terisi, `data/out/by_school/` lengkap, +5 tile OCPS |
| **27** | Frontend Mode 2 | US-01…US-05 jalan. 🚩 Gerbang tanggal Phoenix 12:00 |
| **28** | Frontend Mode 1 + gelombang 3 | US-06…US-10 jalan, FR-16, FR-20 pin nasional |
| **28 malam** | Lintas-mode + kejujuran | Metodologi & Limitations, demo jalan offline |
| **29** | Demo + deck | Video demo, pitch deck, README, deploy |
| **30** | Buffer + submit | — |

**Jalur mundur kalau hari 28 mepet:** potong Mode 1 jadi statis — tabel + peta tanpa interaksi klik-blok. Yang **tidak boleh dipotong** adalah aturan "rute teradem pun gagal" (FR-8 kategori merah), karena itu jantung argumennya.

**Urutan demo video:** orang tua dulu, distrik belakangan.

1. Orang tua di Orlando mengecek alamat → dua opsi rute muncul dengan paparannya → geser slider dari jam 11:00 ke jam bubar → dosis melonjak, jalur teradem berubah → "tidak ada rute aman"
2. Zoom out ke tampilan distrik → 142 anak lain kondisinya sama; radius kebijakan 1,0 mi vs radius setara-dosis 0,42 mi
3. Klik "sembunyikan data panas" → semuanya kolaps jadi lingkaran → *"ini yang distrik punya hari ini"*
4. Tutup dengan daftar reklasifikasi + export CSV

---

## 10. Risiko & mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| **Nol blok merah setelah klasifikasi** | **Kritis — Mode 1 kosong, argumen produk runtuh** | Kalibrasi ulang `THRESHOLD` dan dokumentasikan alasannya. Ini gerbang G1, satu-satunya yang menghentikan pekerjaan |
| Juri menganggap ini cool route planner generik | **Tinggi** — ini contoh pertama panitia di Track 01 | Buka pitch dengan mekanisme hukum dan aturan kausal, bukan dengan peta rute. Sebut prior art Austin lebih dulu dan artikulasikan perbedaannya |
| Phoenix menyita waktu Orlando | **Tinggi** | Gerbang tanggal 27 Agu 12:00 (§5.5). Kerjakan berurutan, jangan paralel — debugging dua dataset sekaligus menyembunyikan sumber bug |
| Job async lambat/gagal saat demo | **Kritis** | Semua data pre-computed; tombol refresh terisolasi dengan fallback |
| Kredit trial habis | Tinggi | Selalu minta 10 mi² penuh (biaya flat), cache seluruh respons mentah, jangan ulang panggilan yang sudah ada di cache |
| **Waktu fetch jam penuh melebihi jadwal** | **Tinggi** — 10 slice × 30 tile = 300 panggilan async | Jam penuh hanya untuk gelombang 1–2. Gelombang 3 turun ke 3 slice per tile dan dicatat di `tiles.json` + Limitations. Cakupan boleh berkurang; jam penuh di tile inti tidak |
| `graph.json` terlalu besar | Sedang | Pecah per sekolah; sederhanakan geometri edge; naikkan toleransi Douglas-Peucker sebelum ganti format |
| Batas attendance distrik tidak tersedia | Sedang | Fallback ke SABS + nyatakan umur data |
| `exceedance` ternyata Premium-only | Sedang | Turunkan FR-19 ke catatan Limitations, bukan angka karangan |
| Juri bertanya "kenapa Transfinder tidak bikin sendiri?" | Sedang | Mereka **mengeksekusi** rute, bukan menentukan eligibilitas termal — dan tidak punya data 60m. Tunjukkan export CSV sebagai titik integrasi |
| Juri bertanya "dipakainya cuma setahun sekali?" | Sedang | Mode 2 adalah pemakaian harian; alur permohonan hazardous walking adalah pemakaian bulanan |
| Juri bertanya "kenapa deltanya kecil?" | Sedang | Nyatakan lebih dulu sebagai temuan pengukuran, lengkap dengan tabel 8 kandidat. Peserta lain akan mengklaim manfaat rute tanpa mengukurnya |
| Scope creep | **Tinggi** | P0 dikunci; P1/P2 hanya disentuh setelah P0 selesai penuh |

---

## 11. Open questions

- [x] **Definisi `tcm`** → suhu udara ambien °C pada 2m AGL
- [x] **Apakah Arizona punya statuta hazardous walking?** → Tidak. `ARS §15-901` murni jarak, kode ASBA EEAA dihapus. Kota demo Florida
- [ ] Radius walk zone resmi OCPS per jenjang — butuh PDF kebijakan transportasi distrik, dengan URL dan nomor halaman
- [ ] Apakah batas attendance OCPS tersedia di portal ArcGIS distrik, atau harus fallback ke SABS
- [ ] Nilai ambang dosis (°C·menit) yang akan dipakai — perlu kalibrasi empiris, wajib didokumentasikan sebagai kalibrasi
- [ ] **Baseline suhu untuk perhitungan dosis** — 33°C (Lanza) atau p05 AOI? Ini memengaruhi semua angka di produk. Baseline mendekati p05 menaikkan selisih dosis relatif tapi tidak mengubah kesimpulan §1.5. Kalau dipilih, dokumentasikan sebagai pilihan kalibrasi
- [ ] Ambang exceedance (°C) untuk FR-19, dan apakah offset spasial FortyGuard cukup stabil antar-hari untuk mendukungnya
- [ ] Format kolom yang diterima Transfinder/Versatrans untuk import layer hazardous
- [ ] Apakah form submission mengizinkan lebih dari satu track

---

## Lampiran — Referensi kunci

1. **Lanza K, dkk.** "Heat-Resilient Schoolyards: Access to Playgrounds and Shade." *J Phys Act Health* 2023;20(2):134–141. DOI: 10.1123/jpah.2022-0405 — titik balik perilaku anak pada 33°C
2. **Arizona DHS.** *Managing Extreme Heat Recommendations for Schools*, 2021 — pengakuan bahwa ambang peringatan NWS terlalu tinggi untuk anak, dan akses data menjadi hambatan
3. **Meng Y, dkk.** "Investigation of heat stress on urban roadways for commuting children." *Urban Climate* 2023;49:101564 — preseden satuan °C·menit
4. **Basu R, dkk.** (2024) — heat stress secara signifikan mengubah persepsi jarak berjalan
