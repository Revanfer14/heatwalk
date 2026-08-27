# HeatWalk — Development Plan

| | |
|---|---|
| **Sumber kebenaran** | `heatwalk-prd.md` untuk *apa*, `DESIGN.md` untuk *tampilannya* |
| **Fungsi dokumen ini** | Urutan eksekusi + definition of done per fase |
| **Hari ini** | 25 Agustus 2026 |
| **Deadline** | 30 Agustus 2026, 23:59 GST |

---

## Cara pakai dokumen ini (baca dulu sebelum ngoding)

1. Kerjakan **fase berurutan**. Jangan mulai fase berikutnya sebelum blok **Verifikasi** fase sekarang lulus semua.
2. Kalau verifikasi gagal → **berhenti dan lapor**. Jangan diam-diam ganti pendekatan. Tiap fase punya *fail branch* eksplisit; ikuti itu.
3. Nomor `FR-x` / `US-x` / `G-x` / `§x` merujuk ke `heatwalk-prd.md`. Kalau dokumen ini bentrok sama PRD, **PRD menang** untuk soal *apa*, dokumen ini menang untuk soal *urutan dan cara*. Untuk soal *tampilan* — warna, tipografi, komponen, layout — `DESIGN.md` yang menang, dan dia mengikat sepanjang Fase 5–7.
4. Setiap angka yang muncul di UI harus bisa ditelusuri ke file di `data/out/`. Tidak ada angka hardcoded di frontend kecuali di fixture dev.
5. Commit per fase dengan pesan `phase-N: <ringkasan>`. Jangan commit satu bom di akhir.
6. Kalau ada FR di PRD yang belum punya rumah di fase mana pun di dokumen ini, itu **utang dokumen ini** — lapor, jangan langsung improvisasi implementasinya.

### Satu gerbang magnitudo, sisanya dilaporkan

Hanya **G1** (minimal satu blok merah) yang menghentikan pekerjaan berdasarkan besarnya sebuah angka. Semua outcome lain — delta antar-jam, delta antar-rute, selisih luas zona, rentang exceedance — **dihitung dan dilaporkan apa adanya**, termasuk kalau kecil. Alasannya di PRD §1.5.

Gerbang lain yang berlaku bersifat operasional, bukan magnitudo: `tcm` terverifikasi, statuta terverifikasi, basemap `206`, demo jalan offline, live link di incognito, gerbang tanggal Phoenix.

**Jangan pernah menggeser `BASELINE_C`, `THRESHOLD`, atau `LAMBDA` supaya sebuah angka terlihat lebih besar.** Kalibrasi `THRESHOLD` hanya sah dalam satu kasus: kategori merah kosong (G1), dan alasannya wajib ditulis di `docs/METHODOLOGY.md`.

### Prinsip arsitektur yang tidak boleh dilanggar

- **Tidak ada backend server.** Pipeline Python offline → file statis → React baca file. Satu-satunya panggilan API saat runtime adalah tombol refresh (FR-17), dan itu terisolasi total.
- **Engine graph, bukan raster.** PRD §6.2. Raster cost-distance (`skimage.graph.MCP_Geometric`) hanya fallback darurat dan hanya untuk Mode 1.
- **GeoJSON di-`fetch()`, bukan di-`import`.**
- **Tidak ada autentikasi, tidak ada database.** Live demo wajib terbuka di incognito tanpa login (submission form field 12). Mode dipisah lewat route `/` dan `/district`, bukan lewat akun.
- **Basemap dari OpenFreeMap** (`tiles.openfreemap.org`, style `liberty`), tanpa API key. Keputusan produk 2026-08-27: basemap self-hosted `.pmtiles` diganti — lihat `docs/METHODOLOGY.md` §Fase 8. Peta sekarang butuh internet.
- **Cakupan lewat mosaik tile, bukan satu bbox.** `config.py` menerima daftar `TILES` (PRD §5.6). Menambah cakupan = menambah entri, nol kode baru.
- **Semua slice waktu di menit `:00`.** Menit non-`:00` mengembalikan nol tile secara senyap.
- **Geometri dipisah dari suhu.** `graph.json` sekali per sekolah, `temps.json` berisi angka per jam. Jangan pernah menduplikasi geometri per jam.
- **Jam dibaca dari data, bukan dikonstantakan di frontend.** `meta.hours` yang menentukan langkah slider. Jam yang tidak ditarik tidak pernah diinterpolasi.
- Ruled out: `deck.gl`, `react-map-gl`, PostGIS/DuckDB/Parquet, backend apa pun, autentikasi, tile server pihak ketiga.

---

## Struktur repo

```
heatwalk/
├── pipeline/
│   ├── config.py               # TILES[], baseline, threshold, jam, λ detour — UTM_EPSG diturunkan dari bbox
│   ├── fg_client.py            # wrapper FortyGuard + polling + retry + cache-to-disk
│   ├── step0_verify_api.py     # verifikasi API
│   ├── step1_scout_aoi.py      # scouting kandidat AOI — arsip
│   ├── step1_fetch_data.py     # heatmap, OSM, census, CCD, attendance
│   ├── step2_build_graph.py    # osmnx + sampling → graph dua bobot
│   ├── step3_routes.py         # dijkstra ×2 per blok
│   ├── step3b_outcomes.py      # hitung G1–G9
│   ├── step4_classify.py       # klasifikasi FR-8 + salah klasifikasi G4
│   ├── step5_export.py         # tulis ke data/out/, termasuk by_school/
│   ├── make_fixtures.py        # fixture palsu, skema PERSIS sama dengan output asli
│   └── run_all.py
├── data/
│   ├── raw/                    # cache respons API mentah (COMMIT — bukti API dipakai)
│   │   └── phase1_scouting/    # kandidat AOI + scratch file — arsip bukti temuan §1.5, BUKAN sampah
│   ├── interim/                # GeoTIFF, graph OSM, tabel sensus sebelum diproses
│   └── out/
│       ├── schools.json        # seluruh sekolah AOI + status analisis
│       ├── schools_national.json  # pin NCES nasional (FR-20), tanpa angka analisis
│       ├── tiles.json          # manifest bbox tile + status (§5.6)
│       ├── summary.json        # seluruh sekolah teranalisis
│       └── by_school/
│           └── <school_id>/
│               ├── graph.json      # geometri + topologi, sekali saja
│               ├── temps.json      # suhu & dosis per edge per jam
│               └── blocks.geojson
├── web/                        # Vite + React 19 + TS + Tailwind v4 + MapLibre v5
│   ├── public/
│   │   └── data/                  # symlink/copy dari data/out (fetch on-demand per sekolah)
│   └── src/                       # basemap: OpenFreeMap remote (tiles.openfreemap.org), bukan file lokal
│       ├── routes/              # "/" mode orang tua, "/district" mode distrik
│       ├── components/
│       │   └── ui/              # shadcn, komentar bawaan dihapus
│       ├── lib/                 # format.ts, dose.ts, dijkstra.ts, petition.ts
│       └── styles/theme.css     # satu-satunya tempat nilai warna literal
├── docs/
│   ├── METHODOLOGY.md
│   ├── LIMITATIONS.md
│   ├── CONTRACT.md
│   └── phase1-scouting.md      # tabel 8 kandidat AOI, dikutip di pitch
├── CLAUDE.md
├── DESIGN.md
└── README.md
```

---

## Peta fase

| Fase | Isi | Target | Gate |
|---|---|---|---|
| 0 | Setup, verifikasi API, verifikasi hukum | 23–24 Agu | ✅ `tcm` = suhu udara 2m AGL · ✅ statuta Florida terverifikasi |
| 1 | Pemilihan AOI | 25 pagi | ✅ `orl_pine_hills_n` dipilih lewat kriteria hukum-dulu |
| **1.5** | Kunci struktur + akuisisi data | 25 sore | Raster 10 jam, graph OSM, sekolah, blok, radius kebijakan tersedia |
| 2 | Graph berbobot dosis, gelombang 1 | 26 pagi | Dosis per edge masuk akal |
| 3 | Routing & outcomes | 26 siang | **🚩 G1** ≥1 blok merah; sisanya dilaporkan apa adanya |
| 4 | Klasifikasi + export + gelombang 2 | 26 malam | 3 kategori terisi |
| 5 | Frontend Mode 2 (orang tua) | 27 | US-01…US-05 jalan, slider jam penuh · **🚩 gerbang tanggal Phoenix** 27 siang |
| 6 | Frontend Mode 1 (distrik) | 28 | US-06…US-10 jalan |
| 7 | Lintas-mode, metodologi, kejujuran | 28 malam | FR-16 jalan, demo offline |
| 8 | Deploy, video, submit | 29–30 | Live link buka di incognito |

**Frontend bisa mulai paralel dari akhir Fase 1.5** lewat `make_fixtures.py`. Jangan tunggu pipeline selesai.

---

# FASE 0 — Setup & verifikasi API ✅

Status: lolos.

- `tcm` terverifikasi suhu udara ambien 2m AGL (dalam ±3°C dari METAR referensi)
- `-999` legacy null ter-handle eksplisit
- Biaya heatmap terbukti flat 4.220 kredit per panggilan, tidak bergantung jumlah sel
- Granularity terbatas 60/80/100m
- Menit non-`:00` mengembalikan nol tile secara senyap → semua slice di menit `:00`
- Statuta hazardous walking Arizona terverifikasi **tidak ada** (`ARS §15-901` murni jarak, kode ASBA EEAA dihapus); Florida Statute §1006.21/§1006.23 terverifikasi eksplisit menyebut "hazardous walking condition"

Angka dan detail verifikasi ada di `docs/METHODOLOGY.md`. Tidak ada kerja tersisa di fase ini.

---

# FASE 1 — Pemilihan AOI

## Status

Pemilihan AOI **selesai**; sebagian verifikasi pendukungnya **belum**. Jangan tandai fase ini lulus sampai seluruh checklist di bawah terisi dengan bukti yang bisa ditunjuk ke file dan baris konkret.

## Kriteria pemilihan (PRD §5.4), berurutan

1. Statuta hazardous walking negara bagian terverifikasi ada, dengan sitasi pasal
2. Kebijakan transportasi distrik tersedia publik sebagai PDF dengan radius walk zone tertulis
3. Batas attendance tersedia di portal ArcGIS distrik
4. Kepadatan sekolah — tile dipilih untuk memaksimalkan jumlah sekolah per panggilan
5. Kontras kanopi — **tie-breaker saja, bukan gerbang**

Kriteria 5 bukan gerbang karena PRD §1.5: suhu udara 2m tidak berperilaku seperti suhu permukaan pada siang hari. Delapan kandidat diuji di dua kota dengan empat mekanisme fisik berbeda; terbaik 1,84°C. Mencari kandidat ke-9 adalah pemborosan kredit — bukan soal AOI yang salah, soal premis pengujiannya yang salah sejak awal.

## Hasil

- **AOI terpilih: `orl_pine_hills_n`, Orlando/Orange County, FL.** Statuta terkuat & paling eksplisit di antara kandidat, angka konkret 19.693 anak TA 2019–2020.
- Phoenix, AZ dibuang dari UI produk (statuta tidak ada) tapi **dipertahankan sebagai bukti portabilitas pipeline** (G10, §5.5) — pipeline-only, tidak pernah dirender.
- Delapan kandidat **diarsipkan**, bukan dihapus, di `data/raw/phase1_scouting/` dan dirangkum di `docs/phase1-scouting.md`. Ini bukti empiris di balik PRD §1.5 dan dikutip di pitch.

## Sisa pekerjaan

### 1.1 Tulis `docs/phase1-scouting.md`

Tabel 8 kandidat dengan kolom mekanisme fisik dan p95−p05 (angkanya dari `data/out/aoi_scout.csv`), penjelasan kenapa ini temuan fisika dan bukan kesalahan pemilihan kotak, plus catatan persentil hari uji. File ini yang dikutip pitch — jangan biarkan tabelnya cuma hidup di `METHODOLOGY.md`.

### 1.2 Arsipkan `data/raw/phase1_scouting/`

Pindahkan respons kosong 19-byte, `scratch_pine_hills_samples.json`, dan file heatmap kandidat scouting ke sub-folder arsip.

⚠️ **Prasyarat:** `fg_client.py` melakukan cache-lookup di `data/raw/`. Periksa dulu bahwa pemindahan tidak membuat cache miss — satu cache miss membakar 4.220 kredit. Kalau lookup-nya tidak rekursif, tambahkan pembacaan rekursif **sebelum** memindahkan file.

### 1.3 Verifikasi kriteria #2 dan #3

Butuh riset web, bukan kredit API.

- Cari PDF kebijakan transportasi / hazardous walking OCPS. Catat **URL + nomor halaman + angka radius walk zone per jenjang** di `docs/METHODOLOGY.md`. Ini yang mengisi `walk_radius_mi` dan `policy_source` asli di `schools.json`, menggantikan placeholder fixture.
- Cek portal ArcGIS OCPS untuk batas attendance; catat tersedia/tidak beserta URL layer. Kalau tidak tersedia → fallback NCES EDGE SABS, catat sebagai limitasi (PRD §8 poin 9).
- Hitung jumlah sekolah nyata dalam bbox `orl_pine_hills_n` dari NCES CCD.

### 1.4 Rapikan dokumen yang masih menyebut AOI belum dikunci

`docs/METHODOLOGY.md` dan `docs/FASE1-RINGKASAN.md` masih menulis AOI belum terkunci dan masih memuat daftar opsi terbuka yang sudah diputuskan PRD. Ganti jadi kesimpulan + tautan ke `docs/phase1-scouting.md`. **Seksi Fase 0 jangan disentuh** — sudah final dan lulus.

## Verifikasi

- [x] Statuta hazardous walking Florida terverifikasi dengan sitasi pasal
- [ ] Kebijakan transportasi OCPS tersedia sebagai PDF publik — URL + halaman + angka radius tercatat di `docs/METHODOLOGY.md`
- [ ] Batas attendance OCPS: tersedia di ArcGIS (URL layer tercatat) atau dinyatakan eksplisit fallback ke SABS
- [ ] `orl_pine_hills_n` memuat ≥2 sekolah nyata dari NCES CCD dalam kotak 10 mi²
- [ ] `docs/phase1-scouting.md` ada, dan setiap angka di tabelnya cocok baris-per-baris dengan `data/out/aoi_scout.csv`
- [ ] `data/raw/phase1_scouting/` berisi arsip, dan cache `fg_client` masih hit setelah pemindahan
- [ ] `grep -rn "belum dikunci" docs/` → nol hasil

### Fail branch

| Kalau | Maka |
|---|---|
| PDF kebijakan OCPS tidak ditemukan | Catat eksplisit "tidak ditemukan" di `docs/METHODOLOGY.md` dan pakai radius standar Florida sebagai asumsi yang dinyatakan terbuka. **Jangan kosongkan diam-diam** |
| Sekolah nyata dalam bbox <2 | **STOP dan lapor.** Ini menyentuh kriteria #4 (kepadatan sekolah) dan berarti bbox harus digeser — keputusan produk |
| Pemindahan arsip bikin cache miss | Kembalikan file ke posisi semula, betulkan `fg_client` dulu, baru pindahkan |

---

# FASE 1.5 — Kunci struktur & akuisisi data

**Target: 25 Agustus sore.** Ini fase yang membuat Fase 2 mungkin. Tanpa raster dan graph OSM di `data/interim/`, `rasterio.sample` di Fase 2 tidak punya apa pun untuk disampel.

## Overview

Dua hal: mengunci struktur data supaya tidak ada refactor tanggal 28, dan menarik semua data mentah yang dibutuhkan pipeline.

## What to do

### 1.5.1 Bersihkan `config.py`

- `utm_epsg_for_lon()` sudah ada, tapi belum diuji di AOI Orlando. Jalankan sampling raster sekali di bbox Orlando — kalau ada distorsi jarak >1% dibanding jarak geodesik, proyeksi masih salah.
- Grep manual untuk nilai per-kota lain yang masih hardcoded. Ini prasyarat eksplisit G10.
- Hapus `AOI_BBOX_PROVISIONAL` dan konstanta gerbang kontras yang sudah tidak dipakai (`AOI_CONTRAST_GATE_C`, `AOI_CONTRAST_ABORT_C`).
- Tulis bbox final `orl_pine_hills_n`.

### 1.5.2 Struktur `TILES`

```python
TILES = [
    {"id": "orl_pine_hills_n", "bbox": [...], "status": "pending"},
]
```

Minimal satu entri untuk gelombang 1. Entri gelombang 2–3 ditambah nanti tanpa kode baru.

### 1.5.3 Kunci skema di `docs/CONTRACT.md`

Tulis skema `tiles.json` (manifest bbox + status + **daftar jam yang ditarik per tile**) dan struktur `data/out/by_school/<school_id>/`.

Pemisahan geometri dari suhu wajib dikunci di sini, sebelum pipeline ditulis:

```jsonc
// graph.json — sekali per sekolah
{
  "meta": { "school_id": "...", "tile_id": "...", "crs": "EPSG:4326" },
  "nodes": { "<node_id>": [lon, lat] },
  "edges": {
    "<edge_id>": { "u": "...", "v": "...", "len_m": 84.2, "geom": [[lon,lat], ...] }
  }
}

// temps.json — angka saja, tanpa koordinat
{
  "meta": {
    "hours": ["07:00","08:00", ...],
    "canonical_hour": "15:00",
    "baseline_c": 33.0,
    "threshold": 000.0,
    "lambda_detour": 0.02,
    "fetched_at": "2026-08-25"
  },
  "edges": {
    "<edge_id>": { "07:00": [temp_c, peak_c, dose], "08:00": [...] }
  }
}
```

`edge_id` di `temps.json` **wajib** cocok satu-satu dengan `graph.json`. Kalau ada yang yatim di salah satu sisi, itu bug yang harus dilaporkan, bukan di-skip diam-diam.

Perbarui `pipeline/make_fixtures.py` supaya menghasilkan `tiles.json`, `graph.json`, dan `temps.json` fiktif dengan skema identik ke output asli — frontend Fase 5 mulai dari sini, paralel, tanpa menunggu pipeline. Fixture wajib memuat **minimal tiga jam berbeda**, supaya slider bisa diuji sebelum data asli masuk.

### 1.5.4 Tarik heatmap per jam

Tulis `pipeline/step1_fetch_data.py`.

- **Satu slice per jam, 07:00–16:00** (sepuluh panggilan per tile) pada hari panas dari data historis. Menit wajib `:00`
- Cek `data/raw/` dulu — sebagian panggilan mungkin sudah ada di cache dan gratis
- Mask `-999` → NaN sebelum menulis GeoTIFF
- Output: GeoTIFF per tile per jam di `data/interim/`
- Catat jam mana saja yang berhasil ke `tiles.json`. Panggilan yang balik kosong **tidak boleh** dihitung sebagai jam yang tersedia

Biaya gelombang 1: 10 × 4.220 = 42.200 kredit. Cek `fetch-api-key-usage` sebelum dan sesudah, catat selisihnya.

### 1.5.5 Tarik data pendukung

Masih di `step1_fetch_data.py`, per tile:

- Jaringan jalan: `osmnx.graph_from_bbox(network_type='walk')` → simpan ke `data/interim/`
- Sekolah + enrollment: NCES CCD, filter ke bbox
- Batas attendance: portal ArcGIS OCPS → fallback SABS → fallback nearest-school (catat mana yang dipakai)
- Anak 5–17 per blok: Census DHC P12 (atau ACS B01001 kalau block-level gagal)
- Pendapatan: ACS B19013, B17001
- `walk_radius_mi` per sekolah dari PDF kebijakan distrik (hasil Fase 1.3), bukan placeholder

### 1.5.6 Kalibrasi enrollment

```python
faktor_koreksi = enrollment_resmi_CCD / estimasi_dasymetric
```

Simpan per sekolah, catat nilainya di `docs/METHODOLOGY.md`.

### 1.5.7 Kurva jam & penentuan jam kanonik

Hitung rata-rata suhu **berbobot panjang jalan** untuk setiap jam pada jaringan jalan AOI yang sama. Hasilnya satu kurva sepuluh titik.

- `canonical_hour` = jam dengan rata-rata tertinggi. Diturunkan dari data, **jangan dikonstantakan**
- `delta_temporal_c` = jam terpanas − jam terdingin

Catat kurvanya di `docs/METHODOLOGY.md` beserta metodenya. Berapa pun hasilnya, **lanjut ke Fase 2.** Ini G7, dan G7 dilaporkan apa adanya.

## Verifikasi

- [ ] `utm_epsg_for_lon()` diuji di AOI Orlando, distorsi jarak <1% vs geodesik
- [ ] `config.py` bersih dari nilai per-kota hardcoded dan konstanta gerbang mati — grep manual
- [ ] bbox final Orlando terkunci; tidak ada bbox sementara tersisa di kode (basemap tidak lagi diekstrak lokal — lihat §Fase 8)
- [ ] `TILES` berisi minimal entri `orl_pine_hills_n` berstatus `"pending"`
- [ ] `docs/CONTRACT.md` memuat skema `tiles.json` dan `by_school/`
- [ ] `python pipeline/make_fixtures.py` menghasilkan `data/out/tiles.json` dan `data/out/by_school/<fake_id>/` yang valid
- [ ] GeoTIFF **sepuluh jam** ada di `data/interim/`, `-999` sudah jadi NaN, **NaN <10%** dari sel di tiap jam
- [ ] Tidak ada file GeoTIFF berukuran nol atau respons 19-byte yang lolos dianggap sukses
- [ ] `tiles.json` mencatat daftar jam yang benar-benar berhasil ditarik per tile
- [ ] Graph OSM tersimpan, **≥3.000 edge** dalam bbox
- [ ] `schools.json` berisi sekolah **nyata** dari CCD dengan `walk_radius_mi` dan `policy_source` asli — nol entri fixture
- [ ] `faktor_koreksi` per sekolah berada di rentang **0,3–3,0**
- [ ] Kurva sepuluh jam terhitung, `canonical_hour` diturunkan dari data, keduanya tercatat di `docs/METHODOLOGY.md`
- [ ] `docs/CONTRACT.md` memuat skema `graph.json` + `temps.json` terpisah, dan fixture punya ≥3 jam

### Fail branch

| Kalau | Maka |
|---|---|
| NaN >10% pada sebagian jam | Buang jam itu dari `meta.hours`, jangan buang seluruh tile. Catat di `tiles.json` |
| NaN >10% di semua jam | Jangan lanjut. Cek apakah bbox keluar cakupan API. Kalau cakupan memang bolong, geser bbox — keputusan produk, lapor |
| Panggilan balik nol tile | Cek menitnya `:00`. Kalau sudah `:00` dan tetap kosong, jam itu tidak tersedia — catat, jangan ulang panggilan (4.220 kredit per percobaan) |
| Edge OSM <3.000 | bbox kemungkinan salah atau terlalu kecil. Cek visual di peta sebelum lanjut |
| `faktor_koreksi` di luar 0,3–3,0 | Ada yang salah di assign blok→sekolah. Jangan pakai angkanya, cek batas attendance dulu |
| `walk_radius_mi` tidak bisa didapat dari PDF | Pakai standar Florida sebagai asumsi, nyatakan eksplisit di Limitations |

---

# FASE 2 — Graph berbobot dosis

**Target: 26 Agustus pagi. Gelombang 1 (`orl_pine_hills_n`) saja.**

## Overview

Satu graph, dua bobot per edge: `len_m` dan `dose`. Dari sini semuanya turun — Mode 1 dan Mode 2 memakai objek yang sama persis.

## What to do

### 2.1 Sampling suhu per edge

Untuk tiap edge, **untuk tiap jam**: ambil titik sampel sepanjang geometri tiap ~20m, `rasterio.sample` di raster jam itu, buang NaN, ambil rata-rata → `temp_c`. Simpan juga `peak_c` per edge per jam (maksimum sampel) — dibutuhkan FR-4 dan FR-9.

Geometri disampel sekali dan dipakai ulang untuk sepuluh jam. Jangan ulang perhitungan titik sampel per jam.

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

Cari `LAMBDA` terkecil yang membuat detour ≤ **1,4× jarak rute terpendek** pada jam kanonik. Satu nilai `LAMBDA` untuk semua jam — jangan dicari ulang per jam, itu bikin jalur rute lompat-lompat antar langkah slider tanpa alasan fisik. Implementasi paling sederhana: coba `LAMBDA ∈ [0, 0.005, 0.02, 0.05, 0.2, 1.0]`, ambil kandidat pertama yang lolos cap, simpan nilainya ke `meta.lambda_detour`. Detour cap juga masuk ke `docs/METHODOLOGY.md`.

**Kalau `LAMBDA` hasil pencarian membuat delta rute tetap kecil, itu hasil yang diharapkan** (PRD §1.5), bukan tanda ada bug. Jangan mengutak-atik `BASELINE_C` atau `LAMBDA` untuk memaksakan delta lebih besar.

### 2.4 Export

Dua file per sekolah di `data/out/by_school/<school_id>/`, skema persis `docs/CONTRACT.md`:

- `graph.json` — geometri + topologi, **sekali saja**. Sederhanakan geometri edge dengan Douglas-Peucker (toleransi ~5m) sebelum serialisasi. Target **≤5 MB**; kalau lewat, naikkan toleransi dulu sebelum ganti format
- `temps.json` — `temp_c`, `peak_c`, `dose` per edge per jam. Angka saja, tanpa koordinat. Target **≤500 KB** untuk sepuluh jam

Bulatkan suhu ke 2 desimal dan dosis ke 2 desimal sebelum serialisasi — presisi float penuh menggandakan ukuran file tanpa menambah informasi.

## Verifikasi

- [ ] `graph.json` ada per sekolah gelombang 1, valid JSON, **≤5 MB**
- [ ] `temps.json` ada, **≤500 KB**, memuat seluruh jam di `meta.hours`
- [ ] Setiap `edge_id` di `temps.json` punya pasangan di `graph.json` dan sebaliknya — nol yatim, dicek programatik
- [ ] Skema **persis** sama dengan `docs/CONTRACT.md`. Bandingkan key-nya dengan output `make_fixtures.py` secara programatik, jangan dengan mata
- [ ] Tidak ada `dose` negatif, tidak ada NaN, tidak ada `len_m` = 0
- [ ] Sanity fisik: edge 100m pada 43°C dengan baseline 33 harus menghasilkan dose ≈ **13,9 °C·menit** (`10 × (100/1.2)/60`). Tulis ini sebagai unit test
- [ ] Kurva suhu per jam **monoton naik lalu turun**, puncaknya di `canonical_hour` yang sama dengan hasil Fase 1.5. Kurva bergerigi = raster tertukar antar jam
- [ ] Rata-rata `temp_c` jam kanonik **lebih tinggi** dari jam pagi (beda arah tidak boleh)
- [ ] Jumlah edge yang dibuang karena NaN <2% dari total

### Fail branch

| Kalau | Maka |
|---|---|
| Kurva jam bergerigi atau puncaknya di pagi hari | Raster tertukar antar jam. Jangan lanjut — ini bug, bukan temuan |
| Edge dibuang >2% | Cakupan raster bolong. Cek bbox dan NaN handling di Fase 1.5 sebelum lanjut |
| `graph.json` >5 MB setelah toleransi dinaikkan 3× | Lapor — mungkin perlu kirim topologi saja dan render geometri dari tile |
| `temps.json` >500 KB | Cek pembulatan. Kalau sudah 2 desimal dan tetap besar, kurangi jam untuk tile itu, bukan kurangi presisi di bawah 2 desimal |

---

# FASE 3 — Routing & outcomes

**Target: 26 Agustus siang. Gerbang keras satu-satunya di seluruh dokumen ini ada di sini: G1.**

## Overview

Buktikan bahwa produk punya angka yang bisa dipertanggungjawabkan. Semua outcome dihitung dan dilaporkan apa adanya; hanya G1 yang stop/lanjut.

## What to do

### 3.1 Routing per blok

Untuk tiap centroid blok → node sekolah:

- Dijkstra `weight='len_m'` → rute terpendek
- Dijkstra `weight=weight_cool` → rute teradem
- Untuk masing-masing hitung: `len_m`, `mean_c` (rata-rata berbobot panjang, **bukan** rata-rata polos per edge), `peak_c`, `dose` total, waktu tempuh
- **Jalankan untuk setiap jam di `meta.hours`** — slider FR-13 butuh semuanya. Rute teradem boleh berbeda jalur antar jam; itu bukan bug, itu produknya
- Rute terpendek identik di semua jam (bobot `len_m` tidak berubah) — hitung sekali, pakai ulang

### 3.2 G8 — delta rute, dilaporkan apa adanya

Keluarkan tabel top-20 pasangan OD berdasarkan `delta_mean_c` terbesar → `data/out/contrast_report.csv`. **Tidak ada ambang lolos/gagal.** Kalau hasilnya 0,5–0,8°C seperti perkiraan PRD, itu ditulis apa adanya di panel FR-4 dan di `docs/LIMITATIONS.md` poin 10–11.

### 3.3 G7 — kurva dosis per jam per blok

Kurva dari Fase 1.5 adalah rata-rata AOI. Di sini hitung per rute realistis (rumah→sekolah): dosis rute teradem untuk tiap jam, per blok.

Dua hal yang dicari:
- Blok yang menyimpang jauh dari bentuk kurva AOI tanpa penjelasan (mis. rutenya didominasi satu segmen ternaungi penuh)
- **Jam paling awal sebuah blok melewati ambang** — ini angka yang berguna buat orang tua: *"aman kalau pulang sebelum 13:00"*

### 3.4 G2 — radius setara-dosis (FR-18)

Untuk tiap sekolah: cari jarak terjauh dari sekolah yang rute teradem-nya (bukan terpendek) masih di bawah ambang dosis, pada **jam kanonik**. Bandingkan dengan radius kebijakan resmi dari `walk_radius_mi`.

```
Radius kebijakan     1,00 mi
Radius setara-dosis  0,42 mi   (−58%)
```

Simpan di `summary.json` per sekolah.

### 3.5 G3 & G1

- **G3**: `dose_eliminated_per_child_per_day` dan `_per_year` untuk anak di blok yang direkomendasikan pindah ke bus.
- **G1**: jumlah blok yang rute teradem-nya **tetap** melewati ambang. Ini jantung argumen produk dan satu-satunya gerbang keras.

### 3.6 G9 — exceedance (FR-19)

Hybrid: distribusi harian dari stasiun ASOS (Iowa Environmental Mesonet, jam-jaman sejak 2019, gratis) + offset spasial per blok dari FortyGuard `tcm`. **Jangan tarik 180 heatmap** — FortyGuard dipakai sebagai offset, bukan sumber deret waktu penuh.

Kalau waktu mepet, ini yang pertama boleh diturunkan ke P1 — tapi catat eksplisit di Limitations bahwa exceedance memakai asumsi offset stabil antar-hari (PRD §8 poin 13), jangan diam-diam di-skip tanpa catatan.

## Verifikasi

- [ ] **🚩 G1 — gerbang keras**: minimal **satu blok** yang rute teradem-nya tetap melewati ambang
- [ ] `contrast_report.csv` ada, bisa dibuka, angkanya masuk akal secara manual untuk 3 baris acak. **Tidak ada baris yang dipangkas karena "tidak cukup besar"**
- [ ] Rute teradem **tidak pernah** lebih pendek dari rute terpendek (kalau iya, ada bug di bobot)
- [ ] Detour semua rute teradem ≤ 1,4× (atau nilai cap yang dipakai)
- [ ] Radius setara-dosis terhitung untuk semua sekolah gelombang 1, bukan 0 dan tidak lebih besar dari radius kebijakan
- [ ] Rute terhitung untuk **seluruh jam** di `meta.hours`, bukan cuma jam kanonik
- [ ] Dosis per blok naik lalu turun mengikuti kurva jam — tidak ada blok yang dosisnya melonjak di satu jam lalu balik normal (tanda raster jam itu rusak)
- [ ] G3 terhitung untuk minimal satu blok merah sebagai uji coba
- [ ] G7 (kurva per jam), G8, G9 tercatat angkanya di `docs/METHODOLOGY.md` — berapa pun hasilnya

### Fail branch

| Kalau | Maka |
|---|---|
| G1 = 0 blok merah | **STOP dan lapor.** Kalibrasi ulang `THRESHOLD` dan dokumentasikan alasannya di `docs/METHODOLOGY.md`. Jangan lanjut ke Fase 4 dengan nol blok merah — itu meruntuhkan seluruh argumen PRD §1.4 dan mengosongkan Mode 1 |
| Radius setara-dosis > radius kebijakan | Jangan lanjut — cek bug tanda di `weight_cool` atau clamp dosis |
| G9 tidak bisa dihitung (data ASOS gagal) | Turunkan FR-19 ke catatan Limitations sebagai P1 yang tidak sempat, **bukan angka karangan** |

---

# FASE 4 — Klasifikasi & export

**Target: 26 Agustus malam. Termasuk gelombang 2 tile (+5 tile OCPS) — nol kode baru, hanya entri `TILES` ditambah dan `run_all.py` dijalankan ulang.**

## Overview

Terjemahkan hasil routing jadi keputusan administratif: tiga kategori blok, angka ringkasan per sekolah, dan file yang siap dibaca frontend.

## What to do

### 4.1 Ambang & klasifikasi (FR-8)

Seluruh klasifikasi dihitung pada **jam kanonik**, bukan dirata-rata antar jam:

```
green  : dose(rute terpendek) ≤ THRESHOLD
yellow : dose(terpendek) > THRESHOLD  AND  dose(teradem) ≤ THRESHOLD
red    : dose(teradem) > THRESHOLD
```

Simpan juga `safe_until_hour` per blok — jam terakhir sebelum rute teradem melewati ambang, atau `null` kalau blok sudah merah sejak jam pertama. Ini yang dipakai FR-9 dan teks permohonan FR-5.

`THRESHOLD` di `config.py`, **wajib dapat diubah dan wajib didokumentasikan**. Kalibrasi awal: pilih nilai yang menghasilkan distribusi yang tidak degenerate (tidak 100% satu warna). Setelah dipilih, tulis alasannya di `docs/METHODOLOGY.md` — termasuk pengakuan bahwa ini kalibrasi, bukan standar yang sudah ada.

Kategori kuning akan berisi lebih sedikit blok daripada yang intuitif (PRD §8 poin 11). Distribusi aktual dilaporkan apa adanya; **ambang tidak digeser untuk mengisi kategori kuning secara artifisial.**

### 4.2 Angka ringkasan (FR-11, FR-12, FR-18)

Per sekolah hitung semua field `summary.json`, termasuk `radius_setara_dosis_mi` dan `radius_kebijakan_mi`. Untuk FR-11, baris terakhir wajib ada:

```python
equivalent_minutes = dose_eliminated_per_day / (42.0 - BASELINE_C)
```

### 4.3 Salah klasifikasi (G4)

- `walk_should_bus` = jumlah anak di blok merah yang saat ini di dalam walk zone resmi
- `bus_not_needed` = anak di luar radius resmi (dapat bus) yang blok-nya hijau **dan** jaraknya hanya sedikit di luar radius. Definisikan "sedikit" secara eksplisit di config, jangan implisit

### 4.4 Export

- `blocks.geojson`, `schools.json`, `summary.json`, `graph.*.json` → `data/out/by_school/<school_id>/`, **commit**
- `tiles.json` diperbarui status tile gelombang 1–2 jadi `"done"`
- Export CSV reklasifikasi (FR-14): kolom `block_id, kids_est, status_now, status_rec, coolest_mean_c, coolest_mean_f, dose, reason`. Generate di frontend dari `blocks.geojson`, bukan file terpisah

### 4.5 Teks permohonan (FR-5)

Bikin template di `web/src/lib/petition.ts` yang mengisi: alamat, sekolah, `mean_c`/`mean_f` dan `peak_c`/`peak_f` rute teradem, dosis, dan referensi Florida Statute §1006.21/§1006.23. **Tidak berlaku untuk Phoenix** — PRD §5.5 melarang keras tombol permohonan tampil di AOI Phoenix.

## Verifikasi

- [ ] Ketiga kategori terisi — tidak ada kategori dengan 0 blok. Kalau kategori merah 0, itu regresi dari G1 — berhenti dan lapor
- [ ] Jumlah `kids_est` di ketiga kategori = total `in_walk_zone` per sekolah
- [ ] Setiap blok merah punya `reason` non-kosong yang menyebut angka konkret
- [ ] Konversi °F benar: cek manual `34,1°C → 93,4°F`
- [ ] `summary.json` lolos silang: `reroute_enough + no_safe_route ≤ in_walk_zone`
- [ ] G5 (selisih luas lingkaran vs zona dosis) dihitung dan dicatat — **dilaporkan, bukan gerbang**
- [ ] `radius_setara_dosis_mi` ada di `summary.json` untuk semua sekolah gelombang 1–2
- [ ] Semua file di `data/out/` punya skema identik dengan fixture. **Uji secara harfiah: tukar file, refresh, jangan sentuh kode**
- [ ] `tiles.json` mencerminkan status tile yang benar-benar sudah diproses

---

# FASE 5 — Frontend Mode 2 (orang tua)

**Target: 27 Agustus. Bisa dimulai dari akhir Fase 1.5 pakai fixture.**

## Overview

Pintu masuk default aplikasi. Persona orang tua, kemungkinan besar dari HP. Ini juga adegan pertama video demo, jadi harus paling mulus.

## 5.0 🚩 Gerbang tanggal Phoenix — 27 Agustus 12:00

Cek: apakah Orlando sudah lolos seluruh checklist Fase 4? Ya → Phoenix pipeline-only boleh dijalankan paralel (bukti G10, tidak masuk UI). Tidak → **Phoenix dibuang seluruhnya**, bukan dikurangi. Keputusan ini sudah diambil di PRD §5.5 — di sini cuma dieksekusi, bukan didiskusikan ulang.

## What to do

### 5.1 Shell

- MapLibre v5 raw (bukan `react-map-gl`). Basemap: style URL remote `https://tiles.openfreemap.org/styles/liberty` (basemap berwarna standar — lihat keputusan produk 2026-08-27 di `DESIGN.md`, diperbarui lagi 2026-08-27 malam di `docs/METHODOLOGY.md` §Fase 8 saat pindah dari PMTiles self-hosted)
- **Satu instance MapLibre untuk kedua mode.** Peta hidup di atas router. Berpindah `/` ↔ `/district` hanya mengganti panel dan memicu `flyTo` — peta tidak boleh unmount
- Route: `/` (Mode 2, default) dan `/district` (Mode 1). Header persisten berisi empat hal saja: wordmark · segmented switch `Parent` / `District` · toggle FR-16 · toggle tema
- Muat `schools.json` + `tiles.json` lewat `fetch()` sekali di boot. `graph.*.json` dan `blocks.geojson` di-`fetch()` **on-demand per sekolah**
- **Mobile-first** untuk Mode 2 (PRD §7)

### 5.2 Input (FR-1)

- Satu input alamat + dropdown sekolah dalam AOI
- **Pin yang bisa digeser**, default di tengah AOI. **Jangan pakai `navigator.geolocation`** — lokasi developer bukan di AS dan demo akan pecah
- Klik di luar batas AOI → "Area ini belum dipetakan". Boundary AOI di-render sebagai garis halus
- Geocoding: Nominatim gratis, dibatasi ke bbox AOI. Kalau rate-limit mengganggu, sediakan 3–5 alamat contoh sebagai chip

### 5.3 Status + rute (FR-2, FR-3)

- Kalimat status satu baris
- Snap titik ke node graph terdekat, Dijkstra client-side (~50 baris, tanpa library), dua kali: `len_m` dan `weight_cool`
- Polyline terpendek: tipis, netral. Polyline teradem: tebal, berwarna

### 5.4 Panel perbandingan (FR-4)

Format persis PRD §4 FR-4: perbandingan rute terpendek vs teradem pada jam yang sedang dipilih, dengan baris jarak, waktu, suhu rata-rata, suhu puncak, dan dosis.

**Baris suhu wajib °C dan °F berdampingan.** Setiap tempat yang menampilkan °C·menit wajib menampilkan °C di sebelahnya. **Angka tidak boleh dibesar-besarkan** — kalau selisihnya −0,7°C, tulis −0,7°C.

### 5.5 Slider jam (FR-13)

Slider satu langkah per jam, isinya dibaca dari `meta.hours` — **jangan hardcode daftar jamnya.** Default di `canonical_hour`.

- Ganti jam → panel FR-4 ter-render ulang **dan** jalur rute teradem dihitung ulang client-side dari `temps.json`
- Nol network request: `graph.json` + `temps.json` sudah di memori sejak sekolah dipilih
- Target <500 ms per langkah (NFR §7). Kalau Dijkstra client-side terlalu lambat untuk dijalankan per geser, debounce 150 ms — jangan pre-compute semua jam di boot
- Tile yang cuma punya sebagian jam menampilkan langkah yang ada saja. **Jangan interpolasi jam yang tidak ditarik**

### 5.6 Tidak ada rute aman (FR-5)

Kalau blok = merah: tampilkan status merah + tombol **[Salin sebagai dasar permohonan hazardous walking]** yang menyalin teks dari `petition.ts`, mengutip Florida Statute.

## Verifikasi

- [ ] US-01…US-05 semua bisa diperagakan berurutan tanpa reload
- [ ] Slider jam bekerja penuh dari `meta.hours`, mengubah panel FR-4 **dan** jalur rute teradem, tanpa network request
- [ ] Geser satu langkah → render ulang <500 ms. Ukur di devtools, jangan dikira-kira
- [ ] Uji dengan fixture yang jamnya cuma tiga: slider menampilkan tiga langkah, bukan sepuluh
- [ ] Input alamat → dua rute ter-render **<1 detik** (NFR §7). Ukur, jangan dikira-kira
- [ ] Dijkstra client-side menghasilkan rute **identik** dengan hasil Python untuk 3 pasangan OD uji. Bandingkan `dose` total sampai 2 desimal
- [ ] Tombol salin permohonan mengisi clipboard dengan teks yang mengutip Florida Statute, bukan Arizona
- [ ] Angka °F benar di semua tempat. Layout tidak pecah di viewport 390px

---

# FASE 6 — Frontend Mode 1 (distrik)

**Target: 28 Agustus. Termasuk gelombang 3 tile.**

## Overview

Tampilan Transportation Director. Objek visual "rute teradem yang gagal" di sini **harus identik** dengan yang dilihat orang tua di Mode 2.

## What to do

### 6.1 Peta & zona (FR-6, FR-7, FR-20)

- Route `/district`. Peta instance yang sama dengan Mode 2 — masuk ke mode ini memicu `flyTo`, bukan remount
- **FR-20**: layer simbol MapLibre (bukan marker DOM) menampilkan **seluruh sekolah NCES**. Pin penuh + dapat dipilih untuk yang teranalisis; pin abu-abu kecil untuk yang belum, dengan pesan "Belum dianalisis — tile ini belum ditarik". **Aturan keras: sekolah belum teranalisis tidak boleh menampilkan angka apa pun**
- Klik pin sekolah teranalisis → `fetch()` on-demand `by_school/<school_id>/`
- Layer A: lingkaran walk zone resmi — garis putus-putus, tanpa isian
- Layer B: choropleth per census block, tiga warna FR-8. Kotak-kotak per blok disengaja
- Layer C: lingkaran radius setara-dosis (FR-18), garis solid tipis, berdampingan dengan Layer A
- Ketiganya dapat di-toggle independen

### 6.2 Detail blok (FR-9, FR-10, FR-19)

- Klik blok → panel: `kids_est`, suhu rata-rata & puncak rute teradem (°C dan °F, **lebih menonjol** daripada °C·menit), dosis terpendek vs teradem, delta ke blok hijau terdekat, status sekarang + rekomendasi. Kalau FR-19 sempat dibangun, tampilkan juga hari exceedance per tahun ajaran
- Klik blok merah → render rute teradem yang gagal, segmen penyumbang dosis tertinggi di-highlight (top 20% dose per meter)

### 6.3 Angka (FR-11, FR-12, FR-18)

Panel outcome dan ringkasan sekolah persis format PRD, termasuk baris radius setara-dosis vs radius kebijakan.

### 6.4 P1 kalau waktu cukup

FR-14 export CSV/GeoJSON · FR-15 tabel prioritas segmen · FR-21 peta cakupan tile · slider per-jam penuh.

## Verifikasi

- [ ] US-06…US-10 bisa diperagakan berurutan
- [ ] Klik sekolah → zona ter-render **<2 detik**, termasuk `fetch()` on-demand
- [ ] Layer pin NCES nasional render tanpa jank pada zoom keluar penuh — **wajib layer simbol, uji dengan devtools performance kalau ragu**
- [ ] Sekolah belum teranalisis tidak menampilkan angka apa pun saat diklik — cek manual minimal 3 pin abu-abu
- [ ] Rute yang muncul di FR-10 **byte-identik** dengan rute yang muncul di FR-3 untuk blok yang sama
- [ ] Angka di panel = angka di `summary.json`. Tidak ada perhitungan ulang di frontend
- [ ] Lingkaran radius setara-dosis (Layer C) render dan angkanya cocok dengan `summary.json`
- [ ] Toggle layer (A/B/C) bekerja independen

### Jalur mundur

Kalau 28 Agustus malam Mode 1 belum jalan: potong jadi statis — tabel reklasifikasi + peta zona tanpa interaksi klik-blok. Yang **tidak boleh dipotong**: kategori merah FR-8.

---

# FASE 7 — Lintas-mode, metodologi, kejujuran

**Target: 28 Agustus malam. Fase termurah dengan dampak penilaian tertinggi.**

## What to do

### 7.1 FR-16 — "Sembunyikan data panas" (prioritas tertinggi di fase ini)

Satu toggle global: Layer B & C hilang → tersisa lingkaran resmi saja · rute teradem hilang → tersisa rute terpendek saja · semua angka turunan panas berubah jadi `—`. Mulus dan instan. Adegan ke-3 video demo.

### 7.2 `docs/METHODOLOGY.md` + halaman Metodologi di UI

Isi wajib: definisi `tcm` sesuai hasil verifikasi Fase 0 · rumus dosis · nilai `BASELINE_C`, `THRESHOLD`, `LAMBDA` beserta alasannya · cara `canonical_hour` diturunkan dari data · kurva jam G7 dan angka G8 apa adanya · tanggal & jam data · faktor kalibrasi enrollment per sekolah · metode hybrid G9 · URL PDF kebijakan OCPS + halaman · seluruh sumber data dengan tautan · sitasi Lanza dkk. 2023, Meng dkk. 2023, Basu dkk. 2024, ADHS 2021.

### 7.3 `docs/LIMITATIONS.md` + halaman Limitations di UI

Kelima belas poin PRD §8 apa adanya, **termasuk eksplisit poin 10–15** (delta rute kecil, kategori kuning tipis, klasifikasi jam kanonik & satu arah, cakupan jam tidak seragam antar tile, sifat hybrid G9, keterbatasan Phoenix). Ini bukan aib — ini yang membedakan HeatWalk dari peserta yang mengklaim tanpa mengukur. Mudah diakses dari UI utama, bukan dikubur di footer.

### 7.4 FR-17 — Refresh forecast (P1)

Tombol yang memicu satu panggilan live ke FortyGuard. Wajib loading state, error handling eksplisit, **terisolasi total**.

## Verifikasi

- [ ] FR-16 bekerja di kedua mode, satu klik, tanpa reload
- [ ] Matikan koneksi internet setelah load pertama → seluruh demo tetap berfungsi kecuali FR-17. **Uji secara harfiah**, termasuk pan/zoom peta ke sudut AOI yang belum pernah dibuka
- [ ] Halaman Metodologi dan Limitations bisa dicapai dari UI utama dalam ≤2 klik
- [ ] Halaman Limitations menyatakan temuan delta kecil sebagai hasil pengukuran, bukan sebagai kelemahan yang disamarkan
- [ ] Setiap angka headline di UI bisa ditelusuri ke satu file di `data/out/`
- [ ] Geser slider ke setiap jam yang tersedia, di kedua mode, tanpa error dan tanpa network request
- [ ] Tidak ada °C·menit yang muncul tanpa °C di sebelahnya. Grep seluruh komponen

---

# FASE 8 — Deploy, demo, submit

**Target: 29–30 Agustus.**

## What to do

### 8.1 Deploy

- Vercel statis dari `web/`. **Buka sendiri di incognito browser bersih** sebelum submit
- Cek ulang basemap OpenFreeMap termuat di production (bukan lagi diverifikasi lewat status `206` — itu gerbang untuk arsip PMTiles lokal, sudah gugur sejak §Fase 8)

### 8.2 README

Isi: satu paragraf apa ini · cara jalankan pipeline · cara jalankan web · struktur data · tautan metodologi & limitations · disclosure penggunaan AI.

### 8.3 Video demo (≤3 menit)

1. Orang tua di Orlando mengecek alamat → dua opsi rute muncul dengan paparannya → geser slider dari 11:00 ke jam bubar → dosis melonjak, jalur teradem berubah → "tidak ada rute aman"
2. Zoom out ke tampilan distrik → 142 anak lain kondisinya sama; radius kebijakan vs radius setara-dosis
3. Klik "sembunyikan data panas" → semuanya kolaps jadi lingkaran → *"ini yang distrik punya hari ini"*
4. Tutup dengan daftar reklasifikasi + export CSV

Rekam layar produk asli. Slide tidak dihitung.

### 8.4 Pitch deck

Buka dengan **mekanisme hukum dan aturan kausal**, bukan dengan peta rute. Sebut prior art Austin (American Forests/UCLA/ASU SHaDE Lab) **lebih dulu**, lalu artikulasikan bedanya. Sebut delapan kandidat AOI dan temuan delta kecil secara terbuka — ini diferensiator, bukan kelemahan. Sebut nama distrik realistis (OCPS) sebagai calon adopter.

### 8.5 Isi submission form

Semua 13 field. Cek gerbang tanggal Phoenix sudah dieksekusi sebelum menulis field 5/6.

## Verifikasi

- [ ] Live link buka di **incognito**, tanpa login, tanpa install, di jaringan berbeda
- [ ] Semua data ter-load dari `public/data/` — cek tab Network, tidak ada 404
- [ ] Video ≤3:00 dan memperlihatkan produk berjalan, bukan slide
- [ ] Repo publik, atau privat dengan `hackathon@fortyguard.com` sudah jadi collaborator
- [ ] `data/raw/` ter-commit, **termasuk `data/raw/phase1_scouting/`** — ini bukti API benar-benar dipanggil
- [ ] `.env` **tidak** ter-commit. Cek `git log -p` untuk API key yang bocor
- [ ] Ketigabelas field submission form terisi
- [ ] Submit **sebelum** 30 Agustus 23:59 GST, bukan tepat di menitnya

---

## Ringkasan gerbang yang menghentikan pekerjaan

| Gerbang | Fase | Kriteria | Kalau gagal |
|---|---|---|---|
| `tcm` = suhu udara 2m AGL | 0 | ±3°C dari METAR | ✅ Lolos |
| Statuta hazardous walking ada | 0–1 | Sitasi pasal terverifikasi | ✅ Lolos, Florida |
| Sekolah nyata dalam bbox ≥2 | 1 | NCES CCD | Geser bbox — keputusan produk, lapor |
| NaN raster <10% | 1.5 | Per tile per jam | Buang jam itu dari `meta.hours`; kalau semua jam gagal, cek bbox |
| **🚩 G1 kategori merah ≥1 blok** | **3** | **Rute teradem tetap lewat ambang** | Kalibrasi ulang `THRESHOLD`, dokumentasikan |
| Gerbang tanggal Phoenix | 5.0 | Orlando lulus Fase 4 pada 27 Agu 12:00 | Phoenix dibuang total, bukan dikurangi |
| ~~Basemap `206 Partial Content`~~ | ~~5/8~~ | **Gugur §Fase 8** — basemap pindah ke OpenFreeMap remote, tidak ada lagi file range-request lokal | — |
| ~~Demo jalan offline~~ | ~~7~~ | **Gugur §Fase 8** — basemap butuh internet; keputusan produk 2026-08-27 malam, lihat `docs/METHODOLOGY.md` | — |
| Live link di incognito | 8 | Buka bersih | Perbaiki sebelum submit |

Tidak ada gerbang berbasis besarnya delta suhu. G7, G8, G9, dan G5 dihitung dan dilaporkan apa adanya.

## Yang dikorbankan lebih dulu kalau waktu mepet

Urutan pemotongan, dari yang paling boleh dibuang:

1. Animasi transisi, mikrointeraksi, styling peta yang cantik
2. FR-21 peta cakupan tile · FR-15 tabel prioritas segmen
3. G9/FR-19 exceedance (catat di Limitations sebagai tidak sempat, bukan angka karangan)
4. Jam untuk tile gelombang 3 (turun ke 3 slice; tile inti tetap jam penuh)
5. FR-17 refresh forecast
6. Interaktivitas Mode 1 → jadi tabel statis

**Tidak boleh dipotong dalam keadaan apa pun:** FR-8 kategori merah, FR-16 tombol sembunyikan data panas, halaman Limitations, dan kolom °F di semua angka headline.
