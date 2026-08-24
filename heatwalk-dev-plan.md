# HeatWalk — Development Plan

| | |
|---|---|
| **Sumber kebenaran** | `heatwalk-prd.md` (v1.3) untuk *apa*, `DESIGN.md` untuk *tampilannya* |
| **Fungsi dokumen ini** | Urutan eksekusi + definition of done per fase |
| **Tanggal mulai** | 24 Agustus 2026 |
| **Deadline** | 30 Agustus 2026, 23:59 GST |
| **Sisa waktu** | 6 hari kerja + 1 hari buffer |

---

## Cara pakai dokumen ini (baca dulu sebelum ngoding)

1. Kerjakan **fase berurutan**. Jangan mulai fase berikutnya sebelum blok **Verifikasi** fase sekarang lulus semua.
2. Kalau verifikasi gagal → **berhenti dan lapor**. Jangan diam-diam ganti pendekatan. Tiap fase punya *fail branch* eksplisit; ikuti itu.
3. Nomor `FR-x` / `US-x` / `§x` merujuk ke `heatwalk-prd.md`. Kalau dokumen ini bentrok sama PRD, **PRD menang** untuk soal *apa*, dokumen ini menang untuk soal *urutan dan cara*. Untuk soal *tampilan* — warna, tipografi, komponen, layout — `DESIGN.md` yang menang, dan dia mengikat sepanjang Fase 5–7.
4. Setiap angka yang muncul di UI harus bisa ditelusuri ke file di `data/out/`. Tidak ada angka hardcoded di frontend kecuali di fixture dev.
5. Commit per fase dengan pesan `phase-N: <ringkasan>`. Jangan commit satu bom di akhir.

### Prinsip arsitektur yang tidak boleh dilanggar

- **Tidak ada backend server.** Pipeline Python offline → file statis → React baca file. Satu-satunya panggilan API saat runtime adalah tombol refresh (FR-17), dan itu terisolasi total.
- **Engine graph, bukan raster.** PRD §6.2. Raster cost-distance (`skimage.graph.MCP_Geometric`) hanya fallback darurat dan hanya untuk Mode 1.
- **GeoJSON di-`fetch()`, bukan di-`import`.**
- **Tidak ada autentikasi, tidak ada database.** Live demo wajib terbuka di incognito tanpa login (submission form field 12). Mode dipisah lewat route `/` dan `/district`, bukan lewat akun.
- **Basemap di-host sendiri** sebagai satu file `.pmtiles` di `web/public/`. Tidak ada tile server pihak ketiga, tidak ada API key peta.
- Ruled out: `deck.gl`, `react-map-gl`, PostGIS/DuckDB/Parquet, backend apa pun, autentikasi.

---

## Struktur repo (bikin ini dulu di Fase 0)

```
heatwalk/
├── pipeline/
│   ├── config.py              # semua parameter: AOI, baseline, threshold, jam, λ detour
│   ├── fg_client.py           # wrapper FortyGuard + polling + retry + cache
│   ├── step0_verify_api.py    # GATE fase 0
│   ├── step1_fetch_data.py    # heatmap, census, CCD, OSM
│   ├── step2_build_graph.py   # osmnx + sampling → graph berbobot
│   ├── step3_routes.py        # dijkstra ×2 per blok
│   ├── step4_classify.py      # aturan FR-8
│   ├── step5_export.py        # tulis ke data/out/
│   ├── make_fixtures.py       # fixture palsu buat frontend (dibuat di Fase 0)
│   └── run_all.py
├── data/
│   ├── raw/                   # cache respons API mentah (COMMIT — ini bukti API dipakai)
│   └── out/                   # graph.0730.json, graph.1445.json, blocks.geojson,
│                              # schools.json, summary.json  (COMMIT)
├── web/                       # Vite + React 19 + TS + Tailwind v4 + MapLibre v5
│   ├── public/
│   │   ├── data/              # symlink/copy dari data/out
│   │   └── heatwalk-aoi.pmtiles   # basemap self-hosted (COMMIT)
│   └── src/
│       ├── routes/            # "/" mode orang tua, "/district" mode distrik
│       ├── components/        # komponen produk
│       │   └── ui/            # shadcn, komentar bawaan dihapus
│       ├── lib/               # format.ts, dose.ts, dijkstra.ts, petition.ts
│       └── styles/theme.css   # satu-satunya tempat nilai warna literal
├── docs/
│   ├── METHODOLOGY.md
│   └── LIMITATIONS.md
├── CLAUDE.md
├── DESIGN.md
└── README.md
```

---

## Peta fase

| Fase | Isi | Target selesai | Gate |
|---|---|---|---|
| 0 | Setup, verifikasi API, kunci data contract | 24 Agu | 🚩 `tcm` terverifikasi |
| 1 | Pilih AOI, tarik semua data | 24–25 Agu | Heatmap valid, coverage OSM oke |
| 2 | Graph berbobot dosis | 25 Agu | Dosis per edge masuk akal |
| 3 | Routing + uji kontras | 25 Agu | 🚩 Δ ≥ 4°C pada 1 pasang OD |
| 4 | Klasifikasi blok + export | 26 Agu | 3 kategori terisi semua |
| 5 | Frontend Mode 2 (orang tua) | 26–27 Agu | US-01…US-05 jalan |
| 6 | Frontend Mode 1 (distrik) | 28 Agu | US-06…US-10 jalan |
| 7 | Lintas-mode, metodologi, limitations | 28 Agu | FR-16 jalan |
| 8 | Deploy, video, submit | 29–30 Agu | Live link buka di incognito |

**Frontend bisa mulai paralel dari akhir Fase 0** lewat `make_fixtures.py`. Jangan tunggu pipeline selesai.

---

# FASE 0 — Setup & verifikasi API

**Target: 24 Agustus. Ini gate paling berbahaya di seluruh proyek.**

## Overview

Sebelum satu baris kode pipeline ditulis, satu hal harus dipastikan: `tcm` itu suhu udara ambien °C pada 2m AGL atau bukan. Kalau ternyata land surface temperature, seluruh kerangka °C·menit dan seluruh klaim "suhu yang dirasakan anak" batal, dan produk harus dirombak sebelum, bukan sesudah, dibangun. Selain itu fase ini mengunci **data contract** supaya frontend bisa jalan paralel tanpa nunggu pipeline.

## What to do

### 0.1 Scaffold

- Bikin struktur repo di atas. `git init`, `.gitignore` (jangan ignore `data/raw` dan `data/out`).
- Python 3.11 venv. Install: `geopandas shapely pyproj rasterio numpy osmnx networkx httpx python-dotenv pandas`.
- `.env` untuk `FORTYGUARD_API_KEY`. **Jangan pernah commit `.env`.** Bikin `.env.example`.
- `web/`: `npm create vite@latest . -- --template react-ts`, install `maplibre-gl@^5 recharts tailwindcss@4 pmtiles protomaps-themes-base @fontsource-variable/inter`.
- shadcn/ui: init, lalu generate **hanya** komponen di allowlist `DESIGN.md`. Hapus seluruh komentar bawaan CLI setelah generate.
- Token warna: bikin `web/src/styles/theme.css` dari tabel di `DESIGN.md` sebelum komponen pertama ditulis. Tidak ada nilai warna literal di tempat lain.
- **Basemap.** Ambil binary `pmtiles` dari GitHub Releases, lalu:
  ```
  pmtiles extract https://build.protomaps.com/<tanggal-build>.pmtiles \
    web/public/heatwalk-aoi.pmtiles --bbox=<bbox AOI>
  ```
  Sebelum AOI final dikunci di Fase 1, pakai bbox sementara supaya frontend bisa jalan; ekstrak ulang setelah bbox final. Style dari `protomaps-themes-base` tema `grayscale`. Atribusi OpenStreetMap wajib terlihat di peta.

### 0.2 `fg_client.py`

Wrapper minimal tapi harus punya:
- `submit(endpoint, payload) -> activity_id`
- `poll(activity_id, timeout=600, interval=5) -> result` — semua endpoint analisis async, wajib polling ke `GET /v1/status/{activity_id}`.
- **Cache-to-disk sebelum parsing.** Setiap respons mentah ditulis ke `data/raw/<endpoint>_<hash_payload>.json` dan dibaca dari situ kalau sudah ada. Kredit trial terbatas — jangan pernah dua kali request payload yang sama.
- `check_credits()` → `GET /v1/system/fetch-api-key-usage`. Panggil sebelum dan sesudah tiap batch fetch, log selisihnya.

### 0.3 `step0_verify_api.py` — skrip verifikasi

Tarik **satu heatmap kecil** (AOI ~1 mi², granularity 60m, analytic type `tcm`) di lokasi dan jam yang punya pembanding stasiun cuaca. Rekomendasi: kotak kecil di sekitar Phoenix Sky Harbor (KPHX, ±33.4342 N, −112.0116 W) — di situ ada observasi METAR per jam yang bisa dibanding.

Skrip harus mencetak:

1. **Statistik nilai**: min, p05, median, p95, max, jumlah nilai `-999`, persentase valid.
2. **Bentuk respons**: struktur JSON/GeoTIFF, nama field, CRS, ukuran grid aktual, apakah benar 60m.
3. **Perbandingan ground truth**: nilai `tcm` di pixel terdekat KPHX vs suhu udara METAR pada jam yang sama.
4. **Cara request jam spesifik**: parameter mana yang mengatur tanggal/jam, dan apakah `time_of_measure` mengembalikan seri per jam atau hanya metadata waktu pengukuran.
5. **Ketersediaan tier Basic** untuk: `exceedance`, `persistence`, dan `env_params` (GHI, wet bulb, relative humidity). Coba satu request kecil masing-masing, catat sukses/403.

### 0.4 Kunci data contract + fixture

Tulis `docs/CONTRACT.md` dan `pipeline/make_fixtures.py` yang menghasilkan file palsu dengan skema **persis** seperti output asli nanti.

```jsonc
// data/out/graph.<HHMM>.json
{
  "meta": {
    "aoi_bbox": [minlon, minlat, maxlon, maxlat],
    "date": "2025-07-15", "hour": "14:45",
    "baseline_c": 33.0, "walk_speed_mps": 1.2,
    "lambda_detour": 0.05, "source": "fortyguard tcm 60m"
  },
  "nodes": { "<node_id>": [lon, lat] },
  "edges": [
    { "u": "<node_id>", "v": "<node_id>", "len_m": 84.2,
      "temp_c": 41.3, "dose": 9.7, "geom": [[lon,lat],[lon,lat]] }
  ]
}
```

```jsonc
// data/out/blocks.geojson — FeatureCollection, geometri census block
{ "properties": {
    "block_id": "040130610001007",
    "school_id": "040...", "kids_est": 23,
    "class": "red",                      // green | yellow | red
    "shortest": { "len_m": 1420, "mean_c": 40.3, "peak_c": 44.0, "dose": 503 },
    "coolest":  { "len_m": 1680, "mean_c": 34.1, "peak_c": 36.8, "dose": 289 },
    "delta_mean_c": -6.2, "delta_dose_pct": -43,
    "status_now": "walk", "status_rec": "bus_eligible",
    "reason": "coolest route mean 41.2C exceeds threshold"
} }
```

```jsonc
// data/out/schools.json
[{ "id": "...", "name": "Lincoln Elementary", "level": "elementary",
   "enrollment": 512, "walk_radius_mi": 1.0, "lon": ..., "lat": ...,
   "policy_source": "PUSD Transportation Policy 2024, p.4" }]

// data/out/summary.json — per school, angka FR-12
{ "<school_id>": {
    "in_walk_zone": 412, "reroute_enough": 118, "no_safe_route": 142,
    "lowest_income_quartile": 61,
    "misclassified": { "bus_not_needed": 12, "walk_should_bus": 142 },
    "dose_eliminated_per_child_per_day": 214,
    "dose_eliminated_per_child_per_year": 38520,
    "equivalent_minutes_at_42c": 43 } }
```

Aturan: **kalau skema berubah setelah Fase 0, update `make_fixtures.py` di commit yang sama.** Frontend tidak boleh pernah tahu bedanya fixture dan data asli.

## Verification

Lulus kalau semua ini benar:

- [ ] `python pipeline/step0_verify_api.py` selesai tanpa error dan mencetak kelima blok laporan di 0.3.
- [ ] **`tcm` terverifikasi.** Kriteria putus: median `tcm` di pixel KPHX berada dalam **±3°C** dari suhu udara METAR pada jam sama → suhu udara, lanjut. Kalau selisihnya **+8°C atau lebih secara sistematis** → itu suhu permukaan, bukan udara.
- [ ] Nilai `-999` terhitung dan tertangani sebagai NaN, bukan ikut masuk statistik.
- [ ] Grid benar-benar 60m (cek jarak antar-pixel dalam meter setelah reproyeksi ke UTM lokal).
- [ ] Terdokumentasi cara meminta jam/tanggal spesifik.
- [ ] Status Basic tier untuk `exceedance`, `persistence`, `env_params` tercatat di `docs/METHODOLOGY.md`.
- [ ] `npm run dev` di `web/` jalan dan me-render basemap PMTiles grayscale — bukan peta kosong, bukan basemap berwarna.
- [ ] **Range request terverifikasi.** Deploy satu preview Vercel berisi `heatwalk-aoi.pmtiles`, buka tab Network, pastikan statusnya `206 Partial Content`. Kalau `200` dan seluruh file ditarik tiap load → pindahkan file ke Cloudflare R2 **sekarang**, jangan tunggu Fase 8. Tes ini 15 menit; menemukannya tanggal 29 jauh lebih mahal.
- [ ] `python pipeline/make_fixtures.py` menghasilkan `data/out/*` yang valid; `blocks.geojson` bisa dibuka di geojson.io.

### Fail branch

| Kalau | Maka |
|---|---|
| API key belum aktif | Kerjakan 0.1, 0.2, 0.4 dulu. Frontend jalan penuh dari fixture. **Jangan tunda 0.3 lebih dari saat key masuk** — begitu key aktif, verifikasi jadi tugas nomor satu. |
| `tcm` = suhu permukaan | **STOP dan lapor.** Jangan lanjut ke Fase 1. Opsi: (a) pakai `env_params` apparent temperature / heat index sebagai bobot utama kalau tersedia di Basic; (b) turunkan klaim jadi "indeks paparan panas berbasis suhu permukaan" dan revisi §7 PRD, seluruh angka °C·menit diberi label ulang. Ini keputusan produk, bukan keputusan teknis. |
| Granularity bukan 60m | Catat resolusi aktual, sesuaikan §8 batasan. Kalau >100m, koridor jadi terlalu kasar → lapor. |
| `exceedance` Premium-only | Turunkan FR ke P2, hitung sendiri dari `tcm` historis kalau kredit cukup. |

---

# FASE 1 — AOI & akuisisi data

**Target: 24–25 Agustus.**

## Overview

Pilih satu AOI 10 mi² yang **kontras kanopinya ekstrem** dan tarik seluruh data pendukung sekali jalan. Pemilihan AOI adalah keputusan yang menentukan hidup-matinya Fase 3: AOI homogen = rute teradem ≈ rute terpendek = premis produk runtuh.

## What to do

### 1.1 Pilih AOI

- Default: Phoenix, AZ (PRD §5.4). Cek dulu statuta hazardous walking Arizona; kalau tidak ada, pindah ke Florida (Orlando/Tampa) dan ganti seluruh kutipan kebijakan.
- Kriteria kotak 10 mi² (≈5,1 × 5,1 km):
  - memuat **2–3 sekolah** (lebih dari itu tidak muat, PRD §5.1),
  - ada kawasan berkanopi bersebelahan langsung dengan parkiran besar / kawasan industri / arterial tanpa pohon,
  - sanity check pakai NLCD Tree Canopy Cover **sebelum** menarik heatmap: hitung stdev tutupan kanopi dalam kotak. Kalau stdev rendah, geser kotak.
- Bikin heatmap uji di dashboard FortyGuard untuk AOI ini dulu, lihat visualnya, baru scripting.
- Kunci bbox final di `config.py`.

### 1.2 Tarik heatmap

- Dua slice waktu: **±07:30** (jam masuk) dan **±14:45** (jam bubar).
- Hari yang dipilih: hari persentil ~95 terpanas dari data historis (2019+), bukan p90. Dokumentasikan tanggalnya.
- Simpan mentah ke `data/raw/`, konversi ke GeoTIFF di `data/interim/`.
- Mask `-999` → NaN. Kalau NaN >10% dari AOI, lapor.

### 1.3 Data pendukung

| Data | Sumber | Catatan |
|---|---|---|
| Jaringan jalan | `osmnx.graph_from_bbox(network_type='walk')` | jangan `footway`-only |
| Lokasi & enrollment sekolah | NCES CCD | filter ke AOI |
| Batas attendance | portal ArcGIS distrik → fallback NCES EDGE SABS → fallback terakhir: nearest school per jenjang (catat sebagai limitasi) |
| Anak 5–17 per blok | Census 2020 DHC P12 (block) → fallback ACS B01001 (block group) |
| Pendapatan | ACS B19013, B17001 |
| Aturan walk zone | PDF kebijakan distrik, **baca manual**, masukkan ke `schools.json` beserta sitasi halaman |

### 1.4 Kalibrasi populasi

```python
faktor_koreksi = enrollment_resmi_CCD / estimasi_dasymetric_dalam_attendance_boundary
kids_est_blok = kids_dasymetric_blok * faktor_koreksi
```
Simpan `faktor_koreksi` per sekolah di `summary.json` dan tampilkan di halaman metodologi.

## Verification

- [ ] Heatmap AOI ter-render sebagai GeoTIFF; `rasterio` bisa buka; CRS benar; bounding box cocok dengan `config.py`.
- [ ] Sebaran nilai masuk akal: p95 − p05 dalam AOI **≥ 6°C** pada slice 14:45. Kalau <4°C, AOI-nya homogen → **ganti AOI sekarang**, jangan lanjut.
- [ ] `-999` sudah jadi NaN, persentase NaN tercatat dan <10%.
- [ ] Graph OSM punya **≥3.000 edge** di AOI 10 mi². Jauh di bawah itu artinya bbox salah atau network_type keliru.
- [ ] `schools.json` terisi 2–3 sekolah dengan enrollment CCD dan `walk_radius_mi` dari PDF kebijakan asli (bukan asumsi).
- [ ] `faktor_koreksi` per sekolah berada di rentang **0,3–3,0**. Di luar itu artinya ada yang salah di assignment blok→sekolah.
- [ ] Total `kids_est` dalam attendance boundary = enrollment CCD (±1 karena pembulatan).

---

# FASE 2 — Graph berbobot dosis

**Target: 25 Agustus pagi.**

## Overview

Satu graph, dua bobot per edge: `len_m` dan `dose`. Dari sini semuanya turun — Mode 1 dan Mode 2 memakai objek yang sama persis.

## What to do

### 2.1 Sampling suhu per edge

Untuk tiap edge: ambil titik sampel sepanjang geometri tiap ~20m, `rasterio.sample` di tiap titik, buang NaN, ambil rata-rata → `temp_c`. Simpan juga `peak_c` per edge (maksimum sampel) — dibutuhkan FR-4 dan FR-9.

Edge yang seluruh sampelnya NaN: isi dari rata-rata edge tetangga (1-hop). Kalau masih kosong, buang edge dari graph dan catat jumlahnya.

### 2.2 Hitung dosis

```python
dose = max(temp_c - BASELINE_C, 0.0) * (len_m / WALK_SPEED_MPS) / 60.0
```

Tiga hal yang wajib benar:

1. **Clamp di 0.** `networkx` Dijkstra tidak menerima bobot negatif, dan edge sejuk tidak boleh memberi "kredit" yang bikin rute panjang menang.
2. **`BASELINE_C` adalah parameter yang dapat diubah**, taruh di `config.py`, jangan sebar di kode. Nilai awal 33,0°C (Lanza dkk. 2023). Catat di metodologi bahwa ini pilihan, bukan konstanta alam.
3. **Efek samping clamp**: kalau seluruh AOI di bawah baseline, semua dose = 0 dan routing degenerate. Karena itu bobot routing sebenarnya adalah komposit (2.3), bukan `dose` telanjang.

### 2.3 Bobot komposit + detour cap

Rute teradem tanpa batas bisa jadi jalan memutar 5 km. Itu bukan rekomendasi yang bisa dipakai anak SD.

```python
weight_cool = dose + LAMBDA * len_m
```

Cari `LAMBDA` terkecil yang membuat detour ≤ **1,4× jarak rute terpendek**. Implementasi paling sederhana: coba `LAMBDA ∈ [0, 0.005, 0.02, 0.05, 0.2, 1.0]`, ambil kandidat pertama yang lolos cap, simpan nilainya ke `meta.lambda_detour`. Detour cap juga masuk ke `docs/METHODOLOGY.md`.

### 2.4 Export

Tulis `graph.0730.json` dan `graph.1445.json`. Sederhanakan geometri edge dengan Douglas-Peucker (toleransi ~5m) sebelum serialisasi. Target **≤5 MB per file**; kalau lewat, naikkan toleransi dulu sebelum ganti format.

## Verification

- [ ] `graph.0730.json` dan `graph.1445.json` ada, valid JSON, **≤5 MB** masing-masing.
- [ ] Skema **persis** sama dengan `docs/CONTRACT.md`. Bandingkan key-nya dengan output `make_fixtures.py` secara programatik, jangan dengan mata.
- [ ] Tidak ada `dose` negatif, tidak ada NaN, tidak ada `len_m` = 0.
- [ ] Sanity fisik: edge 100m pada 43°C dengan baseline 33 harus menghasilkan dose ≈ **13,9 °C·menit** (`10 × (100/1.2)/60`). Tulis ini sebagai unit test.
- [ ] Slice 14:45 punya rata-rata `temp_c` **lebih tinggi** dari slice 07:30. Kalau terbalik, ada yang salah di request jam.
- [ ] Jumlah edge yang dibuang karena NaN <2% dari total.
- [ ] Distribusi `temp_c` antar-edge punya rentang ≥6°C. Kalau semua edge nyaris sama suhunya, Fase 3 sudah pasti gagal — balik ke 1.1 sekarang.

---

# FASE 3 — 🚩 GERBANG KONTRAS

**Target: 25 Agustus sore. Ini gerbang kedua, dan PRD §9 melarang lanjut kalau gagal.**

## Overview

Buktikan bahwa memilih rute benar-benar mengubah paparan secara terukur. Kalau tidak, produknya tidak punya taring dan lebih baik ketahuan hari ini daripada hari ke-6.

## What to do

### 3.1 Routing per blok

Untuk tiap centroid blok → node sekolah:
- Dijkstra `weight='len_m'` → rute terpendek
- Dijkstra `weight=weight_cool` → rute teradem
- Untuk masing-masing hitung: `len_m`, `mean_c` (rata-rata berbobot panjang, **bukan** rata-rata polos per edge), `peak_c`, `dose` total, waktu tempuh.

`mean_c` berbobot panjang itu penting — rata-rata polos bikin gang pendek punya pengaruh sama besar dengan arteri panjang.

### 3.2 Uji kontras

Jalankan untuk semua blok, lalu keluarkan tabel top-20 pasangan OD berdasarkan `delta_mean_c` terbesar. Simpan ke `data/out/contrast_report.csv`.

### 3.3 Kalau kontras tipis

Sebelum menyerah, coba berurutan:
1. Pindah slice waktu ke jam bubar hari yang lebih ekstrem (p97, bukan p95).
2. Naikkan `LAMBDA` ke sisi lebih permisif (cap detour 1,6×) dan lihat apakah ada rute lebih sejuk yang tadinya terpotong cap.
3. Geser AOI ke kotak dengan kontras kanopi lebih tajam.

Kalau ketiganya tidak menolong: **laporkan apa adanya**. PRD §10 sudah menyatakan ini temuan jujur, bukan aib. Tapi keputusan mau lanjut atau pivot bukan keputusan yang diambil sendiri — lapor dulu.

## Verification

- [ ] **Gate utama:** minimal **1 pasangan asal–tujuan** dengan `delta_mean_c ≤ −4,0°C` antara rute teradem dan rute terpendek (G1/G2 PRD §1.4).
- [ ] Gate sekunder yang lebih meyakinkan: **≥5 pasangan** dengan delta ≤ −3,0°C. Kalau cuma satu outlier yang lolos, itu rapuh untuk demo.
- [ ] Rute teradem **tidak pernah** lebih pendek dari rute terpendek (kalau iya, ada bug di bobot).
- [ ] Detour semua rute teradem ≤ 1,4× (atau nilai cap yang dipakai).
- [ ] Ada minimal **satu blok** yang rute teradem-nya **tetap** melewati ambang → ini kategori merah, jantung argumen produk (G4). Kalau nol, ambang perlu dikalibrasi ulang — dan kalibrasi itu harus didokumentasikan, bukan diam-diam digeser sampai angkanya bagus.
- [ ] `contrast_report.csv` bisa dibuka dan angkanya masuk akal secara manual untuk 3 baris acak.

### Fail branch

Δ maksimum <2°C setelah tiga mitigasi 3.3 → **STOP dan lapor.** Jangan lanjut ke Fase 4 dengan asumsi "nanti juga kelihatan di UI".

---

# FASE 4 — Klasifikasi & export

**Target: 26 Agustus.**

## Overview

Terjemahkan hasil routing jadi keputusan administratif: tiga kategori blok, angka ringkasan per sekolah, dan file yang siap dibaca frontend.

## What to do

### 4.1 Ambang & klasifikasi (FR-8)

```
green  : dose(rute terpendek) ≤ THRESHOLD
yellow : dose(terpendek) > THRESHOLD  AND  dose(teradem) ≤ THRESHOLD
red    : dose(teradem) > THRESHOLD
```

`THRESHOLD` di `config.py`, **wajib dapat diubah dan wajib didokumentasikan**. Kalibrasi awal: pilih nilai yang menghasilkan distribusi tiga kategori yang tidak degenerate (tidak 100% satu warna). Setelah dipilih, tulis alasannya di `docs/METHODOLOGY.md` — termasuk pengakuan bahwa ini kalibrasi, bukan standar yang ada.

### 4.2 Angka ringkasan (FR-11, FR-12)

Per sekolah hitung semua field `summary.json`. Untuk FR-11, baris terakhir wajib ada:

```python
equivalent_minutes = dose_eliminated_per_day / (42.0 - BASELINE_C)
# "setara menghapus N menit berjalan di 42°C setiap hari"
```

### 4.3 Salah klasifikasi (G6)

- `walk_should_bus` = jumlah anak di blok merah yang saat ini di dalam walk zone resmi.
- `bus_not_needed` = anak di luar radius resmi (dapat bus) yang blok-nya hijau **dan** jaraknya hanya sedikit di luar radius. Definisikan "sedikit" secara eksplisit di config, jangan implisit.

### 4.4 Export

- `blocks.geojson`, `schools.json`, `summary.json`, `graph.*.json` → `data/out/`, **commit**.
- Export CSV reklasifikasi (FR-14): kolom `block_id, kids_est, status_now, status_rec, coolest_mean_c, coolest_mean_f, dose, reason`. Generate di frontend dari `blocks.geojson`, bukan file terpisah.

### 4.5 Teks permohonan (FR-5)

Bikin template teks di `web/src/lib/petition.ts` yang mengisi: alamat, sekolah, `mean_c`/`mean_f` dan `peak_c`/`peak_f` rute teradem, dosis, dan referensi ketentuan negara bagian yang berlaku. Referensi statuta harus dari sumber asli yang sudah diverifikasi di Fase 1, bukan dari ingatan.

## Verification

- [ ] Ketiga kategori terisi — tidak ada kategori dengan 0 blok. Kalau ada, ambang salah kalibrasi.
- [ ] Jumlah `kids_est` di ketiga kategori = total `in_walk_zone` per sekolah.
- [ ] Setiap blok merah punya `reason` non-kosong yang menyebut angka konkret.
- [ ] Konversi °F benar: cek manual `34,1°C → 93,4°F`.
- [ ] `summary.json` lolos silang: `reroute_enough + no_safe_route ≤ in_walk_zone`.
- [ ] G5: selisih luas antara lingkaran walk zone resmi dan gabungan zona dosis **≥15%**. Hitung dan catat angkanya.
- [ ] Semua file di `data/out/` punya skema identik dengan fixture; frontend yang jalan di fixture harus jalan tanpa perubahan kode saat file asli ditukar masuk. **Uji ini secara harfiah: tukar file, refresh, jangan sentuh kode.**

---

# FASE 5 — Frontend Mode 2 (orang tua)

**Target: 26–27 Agustus. Bisa dimulai dari Fase 0 pakai fixture.**

## Overview

Pintu masuk default aplikasi. Persona orang tua, kemungkinan besar dari HP. Ini juga yang jadi adegan pertama video demo, jadi harus paling mulus.

## What to do

### 5.1 Shell

- MapLibre v5 raw (bukan `react-map-gl`). Basemap: `web/public/heatwalk-aoi.pmtiles`, style `protomaps-themes-base` tema `grayscale`, disesuaikan ke netral penuh sesuai `DESIGN.md`.
- Register protocol **sekali** di komponen root: `maplibregl.addProtocol("pmtiles", protocol.tile)`, dengan `removeProtocol` di cleanup. Jangan dipanggil per komponen peta.
- **Satu instance MapLibre untuk kedua mode.** Peta hidup di atas router, bukan di dalam salah satu route. Berpindah `/` ↔ `/district` hanya mengganti panel dan memicu `flyTo` — peta tidak boleh unmount, karena adegan 2 video demo bergantung pada transisi itu.
- Route: `/` (Mode 2, pintu masuk default) dan `/district` (Mode 1). Header persisten berisi empat hal saja: wordmark · segmented switch `Parent` / `District` · toggle FR-16 · toggle tema.
- Muat `graph.*.json`, `blocks.geojson`, `schools.json` lewat `fetch()` sekali di boot, simpan di context.
- **Mobile-first** untuk Mode 2 (PRD §7). Layout dan token visual mengikuti `DESIGN.md`.

### 5.2 Input (FR-1)

- Satu input alamat + dropdown sekolah dalam AOI.
- **Pin yang bisa digeser**, default di tengah AOI. **Jangan pakai `navigator.geolocation`** — lokasi developer bukan di AS dan demo akan pecah.
- Klik di luar batas AOI → "Area ini belum dipetakan". Boundary AOI di-render sebagai garis halus.
- Geocoding: Nominatim gratis, dibatasi ke bbox AOI. Kalau rate-limit mengganggu, sediakan 3–5 alamat contoh sebagai chip yang bisa diklik — ini juga mempercepat demo.

### 5.3 Status + rute (FR-2, FR-3)

- Kalimat status satu baris: `Rumah kamu 1,1 mil dari SD Lincoln — di dalam walk zone.`
- Snap titik ke node graph terdekat, Dijkstra client-side (~50 baris, tanpa library), dua kali: `len_m` dan `weight_cool`.
- Polyline terpendek: tipis, netral. Polyline teradem: tebal, berwarna.

### 5.4 Panel perbandingan (FR-4)

Format persis PRD §4 FR-4. **Baris suhu wajib °C dan °F berdampingan.** Setiap tempat yang menampilkan °C·menit wajib menampilkan °C di sebelahnya.

### 5.5 Tidak ada rute aman (FR-5)

Kalau blok = merah: tampilkan blok merah + tombol **[Salin sebagai dasar permohonan hazardous walking]** yang menyalin teks dari 4.5 ke clipboard.

## Verification

- [ ] US-01…US-05 semua bisa diperagakan berurutan tanpa reload.
- [ ] Input alamat → dua rute ter-render **<1 detik** (NFR §7). Ukur, jangan dikira-kira.
- [ ] Dijkstra client-side menghasilkan rute **identik** dengan hasil Python untuk 3 pasangan OD uji. Bandingkan `dose` total sampai 2 desimal. Kalau beda, ada mismatch bobot antara pipeline dan frontend — ini bug yang akan ketahuan juri.
- [ ] Tombol salin permohonan benar-benar mengisi clipboard dan teksnya berisi angka yang sama dengan panel.
- [ ] Angka °F benar di semua tempat.
- [ ] Layout tidak pecah di viewport 390px.
- [ ] Klik di luar AOI memberi pesan yang benar, bukan crash.

---

# FASE 6 — Frontend Mode 1 (distrik)

**Target: 28 Agustus.**

## Overview

Tampilan Transportation Director. Objek visual "rute teradem yang gagal" di sini **harus identik** dengan yang dilihat orang tua di Mode 2 — itu yang membuat ini satu produk.

## What to do

### 6.1 Peta & zona (FR-6, FR-7)

- Route `/district`. Peta yang dipakai adalah instance yang sama dengan Mode 2 — masuk ke mode ini memicu `flyTo` ke seluruh AOI, bukan remount.
- Pin semua sekolah dalam AOI; klik → muat analisis sekolah itu.
- Layer A: lingkaran walk zone resmi, garis putus-putus tanpa isian.
- Layer B: choropleth per census block, tiga warna FR-8. Bentuk kotak-kotak per blok itu **disengaja** — jangan dihaluskan.
- Keduanya tampil bersamaan default, masing-masing bisa di-toggle.

### 6.2 Detail blok (FR-9, FR-10)

- Klik blok → panel: `kids_est`, suhu rata-rata & puncak rute teradem (°C dan °F, **lebih menonjol** daripada °C·menit), dosis terpendek vs teradem, delta ke blok hijau terdekat pada jarak setara, status sekarang + rekomendasi.
- Klik blok merah → render rute teradem yang gagal, segmen penyumbang dosis tertinggi di-highlight (top 20% dose per meter).

### 6.3 Angka (FR-11, FR-12)

Panel outcome dan ringkasan sekolah persis format PRD. Baris "setara menghapus N menit berjalan di 42°C" wajib ada.

### 6.4 P1 kalau waktu cukup

FR-13 slider waktu (dua state minimal: 07:30 / 14:45, render ulang dari file, **bukan** panggilan API) · FR-14 export CSV · FR-15 tabel prioritas segmen.

## Verification

- [ ] US-06…US-10 bisa diperagakan berurutan.
- [ ] Klik sekolah → zona ter-render **<2 detik**.
- [ ] Rute yang muncul di FR-10 **byte-identik** dengan rute yang muncul di FR-3 untuk blok yang sama. Uji dengan satu blok merah spesifik dari kedua mode.
- [ ] Angka di panel = angka di `summary.json`. Tidak ada perhitungan ulang di frontend yang bisa menyimpang.
- [ ] Toggle layer bekerja independen.
- [ ] Kalau slider dibuat: perubahan slider render ulang **<500 ms** dan tidak memicu network request ke FortyGuard.
- [ ] Kalau CSV dibuat: file terunduh, terbuka di Excel, kolom sesuai FR-14.

### Jalur mundur

Kalau 27 Agustus malam Mode 1 belum jalan: potong jadi statis — tabel reklasifikasi + peta zona tanpa interaksi klik-blok. Yang **tidak boleh dipotong**: kategori merah FR-8 (aturan "rute teradem pun gagal").

---

# FASE 7 — Lintas-mode, metodologi, kejujuran

**Target: 28 Agustus.**

## Overview

Fase termurah dengan dampak penilaian tertinggi. FR-16 adalah satu tombol yang membuktikan kriteria "API sentral, bukan dekoratif" dalam satu klik.

## What to do

### 7.1 FR-16 — "Sembunyikan data panas" (P0, prioritas tertinggi di fase ini)

Satu toggle global:
- Layer B hilang → tersisa lingkaran resmi saja
- Rute teradem hilang → tersisa rute terpendek saja
- Semua angka turunan panas berubah jadi `—`

Ini harus mulus dan instan. Ini adegan ke-3 video demo.

### 7.2 `docs/METHODOLOGY.md` + halaman Metodologi di UI

Isi wajib: definisi `tcm` sesuai hasil verifikasi Fase 0 · rumus dosis · nilai `BASELINE_C`, `THRESHOLD`, `LAMBDA` beserta alasannya · tanggal & jam data · faktor kalibrasi enrollment per sekolah · seluruh sumber data dengan tautan · sitasi Lanza dkk. 2023, Meng dkk. 2023, Basu dkk. 2024, ADHS 2021.

### 7.3 `docs/LIMITATIONS.md` + halaman Limitations di UI

Kesembilan poin PRD §8, apa adanya. Tambahkan temuan jujur dari Fase 0 dan 3 kalau ada. **Mudah diakses dari UI utama**, bukan dikubur di footer.

### 7.4 FR-17 — Refresh forecast (P1)

Tombol yang memicu satu panggilan live ke FortyGuard. Wajib: loading state, error handling eksplisit, dan **terisolasi total** — gagalnya tombol ini tidak boleh mempengaruhi apa pun di jalur demo utama.

## Verification

- [ ] FR-16 bekerja di kedua mode, satu klik, tanpa reload.
- [ ] Matikan koneksi internet setelah load pertama → seluruh demo tetap berfungsi kecuali FR-17 (NFR §7 reliabilitas). **Uji ini secara harfiah**, dan termasuk pan/zoom peta ke sudut AOI yang belum pernah dibuka — kalau basemap-nya bolong di situ, ada tile yang masih ditarik dari luar.
- [ ] Halaman Metodologi dan Limitations bisa dicapai dari UI utama dalam ≤2 klik.
- [ ] Setiap angka headline di UI bisa ditelusuri ke satu file di `data/out/`.
- [ ] Tidak ada °C·menit yang muncul tanpa °C di sebelahnya. Grep seluruh komponen.
- [ ] Kalau FR-17 dibuat: matikan API key sengaja → tombol menampilkan error yang jelas, sisa aplikasi tidak terpengaruh.

---

# FASE 8 — Deploy, demo, submit

**Target: 29–30 Agustus.**

## Overview

Deliverable wajib: prototype jalan, pitch presentation, demo video ≤3 menit. Live link harus buka di incognito tanpa login sampai penjurian selesai.

## What to do

### 8.1 Deploy

- Vercel statis dari `web/`. Bukan Streamlit/Render/HF Spaces — panitia secara eksplisit menyebut free tier yang bisa tidur.
- **Buka sendiri di incognito browser bersih** sebelum submit. Tidak boleh ada login, tidak boleh ada install (submission form field 12).
- Cek ulang `heatwalk-aoi.pmtiles` di production: statusnya `206`, bukan `200`.

### 8.2 README

Isi: satu paragraf apa ini · cara jalankan pipeline · cara jalankan web · struktur data · tautan metodologi & limitations · disclosure penggunaan AI.

### 8.3 Video demo (≤3 menit, urutan PRD §9)

1. Orang tua di Phoenix cek alamat → "tidak ada rute aman" → momen emosional
2. Zoom out ke tampilan distrik → 142 anak lain kondisinya sama
3. Klik "sembunyikan data panas" → semuanya kolaps jadi lingkaran → *"ini yang distrik punya hari ini"*
4. Tutup dengan daftar reklasifikasi + export CSV

Rekam layar produk asli. Slide tidak dihitung.

### 8.4 Pitch deck

Buka dengan **mekanisme hukum dan aturan kausal**, bukan dengan peta rute. Sebut prior art Austin (American Forests/UCLA/ASU SHaDE Lab) **lebih dulu**, lalu artikulasikan bedanya: suhu udara terukur vs naungan dimodelkan; output keputusan vs output visualisasi. Sebut nama distrik yang realistis sebagai calon adopter, bukan cuma "sekolah" secara abstrak.

### 8.5 Isi submission form

Semua 13 field. Yang perlu disiapkan lebih awal: API key (field 8), repo link + collaborator `hackathon@fortyguard.com` (field 10–11), live link (12), video link (13).

## Verification

- [ ] Live link buka di **incognito**, tanpa login, tanpa install, di jaringan berbeda.
- [ ] Semua data ter-load dari `public/data/` — cek tab Network, tidak ada 404.
- [ ] Video ≤3:00 dan memperlihatkan produk berjalan, bukan slide.
- [ ] Repo publik, atau privat dengan `hackathon@fortyguard.com` sudah jadi collaborator.
- [ ] `data/raw/` ter-commit — ini bukti API benar-benar dipanggil.
- [ ] `.env` **tidak** ter-commit. Cek `git log -p` untuk API key yang bocor.
- [ ] Ketigabelas field submission form terisi.
- [ ] Submit **sebelum** 30 Agustus 23:59 GST, bukan tepat di menitnya.

---

## Ringkasan gerbang yang menghentikan pekerjaan

| Gerbang | Fase | Kriteria | Kalau gagal |
|---|---|---|---|
| 🚩 `tcm` = suhu udara 2m AGL | 0 | ±3°C dari METAR | STOP, lapor, keputusan produk |
| Kontras AOI | 1 | p95 − p05 ≥ 6°C | Ganti AOI |
| Δ rute | 3 | ≥1 pasangan ≤ −4°C | Tiga mitigasi, lalu STOP dan lapor |
| Kategori merah ada isinya | 3 | ≥1 blok | Kalibrasi ambang, dokumentasikan |
| Basemap `206 Partial Content` | 0 | Preview Vercel | Pindah file ke Cloudflare R2 |
| Demo jalan offline | 7 | Cabut internet, termasuk pan peta | Cari runtime call yang bocor |
| Live link di incognito | 8 | Buka bersih | Perbaiki sebelum submit |

## Yang dikorbankan lebih dulu kalau waktu mepet

Urutan pemotongan, dari yang paling boleh dibuang:

1. Animasi transisi, mikrointeraksi, styling peta yang cantik
2. FR-15 tabel prioritas segmen
3. FR-13 slider waktu (sisakan dua state statis)
4. FR-17 refresh forecast
5. Interaktivitas Mode 1 → jadi tabel statis

**Tidak boleh dipotong dalam keadaan apa pun:** FR-8 kategori merah, FR-16 tombol sembunyikan data panas, halaman Limitations, dan kolom °F di semua angka headline.
