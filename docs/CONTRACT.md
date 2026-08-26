# CONTRACT — `data/out/`

Skema file yang dibaca frontend. Setiap field mencatat tipe, satuan, nullability, dan file sumber pipeline yang menghasilkannya. Frontend **tidak pernah** menghitung ulang field manapun di sini — semua angka dibaca langsung.

Semua file di bawah identik skemanya antara fixture (`pipeline/make_fixtures.py`, ditulis ke `data/fixtures/`) dan output asli (`data/out/`, pipeline Fase 2–4). Frontend tidak boleh bisa membedakan keduanya — dicek programatik lewat paritas skema rekursif di `pipeline/verify_step4.py`.

**Fixture tidak pernah menimpa `data/out/` atau `web/public/data/`.** `pipeline/make_fixtures.py` menulis ke `data/fixtures/` saja dan tidak memanggil `mirror_to_web()`. Untuk menguji frontend membaca fixture, salin `data/fixtures/` ke `web/public/data/` secara manual (uji tukar-file dev plan §Fase 4), lalu kembalikan (`git checkout web/public/data`).

Data asli di-`fetch()` dari `web/public/data/`, salinan dari `data/out/` lewat `pipeline/write_out.py:mirror_to_web()` (mirror rekursif, termasuk `by_school/`), dipanggil di akhir `pipeline/step5_export.py` (atau `pipeline/run_all.py`).

Geometri dipisah dari suhu (PRD §5.6): `graph.json` sekali per sekolah, `temps.json` berisi angka per edge per jam. Jangan pernah menduplikasi geometri per jam.

---

## `tiles.json`

Manifest mosaik tile. Dihasilkan `pipeline/step1_fetch_data.py` — real sejak Fase 1.5.4 (heatmap 10 jam ditarik untuk `orl_pine_hills_n`, nol NaN per jam, 42.200 kredit). `make_fixtures.py` **tidak lagi menulis file ini** — akan menimpa hasil real dengan asumsi status statis kalau dijalankan lagi.

```json
[
  {
    "id": "orl_pine_hills_n",
    "bbox": [-81.4763, 28.5722, -81.4241, 28.6167],
    "status": "done",
    "hours_fetched": ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"]
  }
]
```

| Field | Tipe | Satuan | Null? | Sumber |
|---|---|---|---|---|
| `id` | `string` | — | tidak | `pipeline/config.py:TILES` |
| `bbox` | `[number,number,number,number]` | derajat (west, south, east, north) | tidak | `pipeline/config.py:TILES` |
| `status` | `"pending" \| "done"` | — | tidak | status fetch tile ini |
| `hours_fetched` | `string[]` (`HH:MM`) | — | tidak, boleh `[]` | jam yang **benar-benar** mengembalikan data — jam kosong-senyap tidak dihitung (§5.1) |

---

## `by_school/<school_id>/graph.json`

Geometri + topologi jalan untuk satu sekolah, **sekali saja**, tanpa suhu. Dihasilkan `pipeline/step2_build_graph.py` (asli, real sejak Fase 2) / `pipeline/make_fixtures.py` (fixture). Target ukuran **≤5 MB** (real; toleransi Douglas-Peucker dinaikkan dulu kalau lewat, sebelum ganti format).

```json
{
  "meta": { "school_id": "sch_pine_hills_elem", "tile_id": "orl_pine_hills_n", "crs": "EPSG:4326" },
  "nodes": { "n1": [-81.4763, 28.5722] },
  "edges": {
    "n1-n2": { "u": "n1", "v": "n2", "len_m": 84.2, "geom": [[-81.4763, 28.5722], [-81.4760, 28.5723]] }
  }
}
```

| Field | Tipe | Satuan | Null? | Sumber |
|---|---|---|---|---|
| `meta.school_id` | `string` | — | tidak | id di `schools.json` |
| `meta.tile_id` | `string` | — | tidak | id di `tiles.json` |
| `meta.crs` | `string` | — | tidak | selalu `"EPSG:4326"` |
| `nodes.<id>` | `[lon, lat]` | derajat | tidak | node graph OSM/fixture |
| `edges.<edge_id>.u`, `.v` | `string` | id node | tidak | topologi graph |
| `edges.<edge_id>.len_m` | `number` | meter | tidak, `> 0` | panjang geometri edge |
| `edges.<edge_id>.geom` | `[[lon,lat], ...]` | derajat | tidak | geometri disederhanakan (Douglas-Peucker ~5m) |

**`edge_id` wajib cocok satu-satu dengan key `edges` di `temps.json` yang sekolah sama.** Yatim di salah satu sisi adalah bug yang dilaporkan, bukan di-skip diam-diam — dicek programatik, bukan dengan mata.

---

## `by_school/<school_id>/temps.json`

Suhu dan dosis per edge per jam. Angka saja — tanpa koordinat, tanpa nama jalan. Dihasilkan `pipeline/step2_build_graph.py` (asli, real sejak Fase 2) / `pipeline/make_fixtures.py` (fixture). Target ukuran **≤500 KB** untuk seluruh jam — dilewati saat ini (~1,3 MB, cakupan seluruh tile), lihat `docs/METHODOLOGY.md`.

```json
{
  "meta": {
    "hours": ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"],
    "canonical_hour": "15:00",
    "baseline_c": 33.0,
    "threshold": 110.0,
    "lambda_detour": 0.005,
    "fetched_at": "2023-08-08"
  },
  "edges": {
    "n1-n2": { "07:00": [33.4, 34.6, 4.9], "08:00": [33.9, 35.1, 12.3] }
  }
}
```

| Field | Tipe | Satuan | Null? | Sumber |
|---|---|---|---|---|
| `meta.hours` | `string[]` (`HH:MM`) | — | tidak | jam yang tersedia untuk **sekolah ini** — subset dari `hours_fetched` tile induknya kalau ada jam yang dibuang karena NaN >10% (§1.5) |
| `meta.canonical_hour` | `string` (`HH:MM`) | — | tidak, harus ∈ `meta.hours` | jam dengan rata-rata suhu tertinggi, diturunkan dari data (§1.5.7) — **tidak pernah dikonstantakan** |
| `meta.baseline_c` | `number` | °C | tidak | `BASELINE_C` |
| `meta.threshold` | `number` | °C·menit | tidak | `THRESHOLD_DOSE_C_MIN` — indikatif, lihat `docs/METHODOLOGY.md` bagian `[Fase 4] THRESHOLD` |
| `meta.lambda_detour` | `number` | — | tidak | hasil kalibrasi Fase 2.3 (cap detour 1,4×) |
| `meta.fetched_at` | `string` (`YYYY-MM-DD`) | — | tidak | tanggal snapshot heatmap (`FETCH_DATE`) |
| `edges.<edge_id>.<HH:MM>` | `[temp_c, peak_c, dose]` | [°C, °C, °C·menit] | tidak | `temp_c`/`peak_c` = rata-rata/maksimum sampel raster sepanjang edge; `dose = max(temp_c - baseline_c, 0) * (len_m / walk_speed_mps) / 60` |

---

## `by_school/<school_id>/blocks.geojson`

`FeatureCollection`, satu Feature per census block **milik sekolah ini** (assignment blok→sekolah, §1.3). Klasifikasi dihitung pada `meta.canonical_hour`, bukan dirata-rata antar jam (FR-8). **Real sejak Fase 4** — `pipeline/step4_classify.py` + `pipeline/step5_export.py` (asli, 368 blok berpenduduk gelombang 1) / `pipeline/fixture_classify.py` + `pipeline/make_fixtures.py` (fixture, `data/fixtures/`).

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": { "type": "Polygon", "coordinates": [[[0, 0]]] },
      "properties": {
        "block_id": "FIXTURE-0900",
        "school_id": "sch_meadowbrook_middle",
        "kids_est": 33,
        "class": "red",
        "shortest": { "len_m": 3810, "mean_c": 37.65, "peak_c": 38.85, "dose": 246.1 },
        "coolest": { "len_m": 4263.1, "mean_c": 36.2, "peak_c": 37.2, "dose": 189.6 },
        "delta_mean_c": -1.45,
        "delta_dose_pct": -23,
        "distance_mi": 1.894,
        "status_now": "walk",
        "status_rec": "bus_eligible",
        "reason": "Coolest route mean 36.2C exceeds threshold (110 C-min dose, actual 190).",
        "safe_until_hour": "11:00"
      }
    }
  ]
}
```

| Field | Tipe | Satuan | Null? | Sumber |
|---|---|---|---|---|
| `properties.block_id` | `string` | Census block GEOID | tidak | Census 2020 DHC |
| `properties.school_id` | `string` | id di `schools.json` | tidak | assignment blok→sekolah |
| `properties.kids_est` | `integer` | anak | tidak, `>= 0` | dasymetric × `faktor_koreksi` |
| `properties.class` | `"green" \| "yellow" \| "red"` | — | tidak | aturan FR-8, `THRESHOLD_DOSE_C_MIN` di `config.py` |
| `properties.shortest.*` | `{len_m, mean_c, peak_c, dose}` | m / °C / °C / °C·menit | tidak | Dijkstra `weight='len_m'` pada `meta.canonical_hour` |
| `properties.coolest.*` | sama seperti `shortest.*` | — | tidak | Dijkstra `weight=weight_cool` pada `meta.canonical_hour` |
| `properties.delta_mean_c` | `number` | °C | tidak | `coolest.mean_c - shortest.mean_c` |
| `properties.delta_dose_pct` | `number` | % (bulat) | tidak | `(coolest.dose - shortest.dose) / shortest.dose * 100` |
| `properties.distance_mi` | `number` | mil | tidak, `>= 0` | jarak lurus centroid blok ke sekolah — dasar `status_now` dan G4 `bus_not_needed` |
| `properties.status_now` | `"walk" \| "bus"` | — | tidak | radius resmi distrik (`walk_radius_mi`) |
| `properties.status_rec` | `"walk" \| "reroute" \| "bus_eligible"` | — | tidak | turunan `class` |
| `properties.reason` | `string` | — | tidak untuk `red`/`yellow`, kosong diperbolehkan untuk `green` | template + angka konkret |
| `properties.safe_until_hour` | `string` (`HH:MM`) atau `null` | — | ya | hanya diisi untuk blok `red`: jam terakhir sebelum rute teradem melewati ambang, `null` kalau sudah merah sejak jam pertama di `meta.hours`. Selalu `null` untuk `green`/`yellow` — rute teradem mereka sudah aman di seluruh jam, angka ini tidak relevan |

---

## `by_school/<school_id>/blocks_hours.json` — Fase 6

Klasifikasi FR-8 dan dosis **per jam** per blok, dipakai choropleth Mode 1 saat slider jam digeser (FR-13). `blocks.geojson` tetap sumber kebenaran untuk jam kanonik; file ini adalah lapisan tambahan untuk jam-jam lain, bukan pengganti. Dihasilkan `pipeline/blocks_hours.py`, dipanggil dari `pipeline/step5_export.py` (asli) dan `pipeline/make_fixtures.py` (fixture) — murni re-serialisasi `shortest.by_hour` / `coolest.by_hour` yang sudah dihitung `pipeline/step3_routes.py`, nol routing ulang.

```json
{
  "120950124023009": {
    "07:00": { "shortest": 0.0, "coolest": 0.0, "class": "green" },
    "15:00": { "shortest": 259.1, "coolest": 259.1, "class": "red" }
  }
}
```

| Field | Tipe | Satuan | Null? | Sumber |
|---|---|---|---|---|
| `<block_id>` | key | Census block GEOID | — | sama persis dengan key `block_id` di `blocks.geojson` sekolah yang sama — dicek programatik satu-satu (`pipeline/verify_step4.py:check_blocks_hours_matches_geojson`) |
| `<block_id>.<HH:MM>` | key | — | — | subset dari `meta.hours` di `temps.json` sekolah yang sama |
| `<block_id>.<HH:MM>.shortest` | `number` | °C·menit | tidak | dosis rute terpendek pada jam ini — `routed["blocks"][id]["shortest"]["by_hour"][hour]["dose"]` |
| `<block_id>.<HH:MM>.coolest` | `number` | °C·menit | tidak | dosis rute teradem pada jam ini |
| `<block_id>.<HH:MM>.class` | `"green" \| "yellow" \| "red"` | — | tidak | `pipeline/classification.py:classify()`, ambang sama dengan FR-8 |

**Bukan pengganti `blocks.geojson`.** Frontend membaca geometri, `kids_est`, `reason`, `safe_until_hour`, dan properti lain dari `blocks.geojson` sekali; `blocks_hours.json` hanya dipakai untuk memperbarui `class` (warna choropleth) saat jam berganti — nol perhitungan ulang dosis di frontend.

---

## `by_school/<school_id>/segments.json` — Fase 6 (FR-15, P1)

Top-`SEGMENT_PRIORITY_TOP_N` (20) segmen jalan yang paling banyak dilewati rute teradem blok merah/kuning sekolah ini pada jam kanonik, terurut berdasarkan `kids_affected` menurun lalu `peak_c` menurun. Dihasilkan `pipeline/segment_priority.py`, dipanggil dari `pipeline/step5_export.py` (asli) dan `pipeline/make_fixtures.py` (fixture). **Kolom penurunan suhu memakai asumsi `SHADE_COOLING_C` (°C) seragam** — lihat `docs/METHODOLOGY.md` dan `docs/LIMITATIONS.md`, bukan hasil pengukuran naungan nyata.

```json
[
  {
    "edge_id": "e412",
    "street_name": "Silver Star Rd",
    "kids_affected": 34,
    "peak_c": 38.9,
    "peak_shaded_c": 37.4,
    "dose_reduction_pct": 18
  }
]
```

| Field | Tipe | Satuan | Null? | Sumber |
|---|---|---|---|---|
| `edge_id` | `string` | — | tidak | cocok satu-satu dengan key `edges` di `graph.json` sekolah yang sama |
| `street_name` | `string` | — | tidak | nama jalan OSM; `"Unnamed segment"` kalau OSM tidak mencatat nama |
| `kids_affected` | `integer` | anak | tidak, `> 0` | Σ `kids_est` blok yang rute teradem-nya (jam kanonik) melewati edge ini |
| `peak_c` | `number` | °C | tidak | suhu puncak edge pada jam kanonik, dari `temps.json` |
| `peak_shaded_c` | `number` | °C | tidak | `peak_c - SHADE_COOLING_C` — estimasi, asumsi ΔT seragam |
| `dose_reduction_pct` | `number` | % (bulat) | tidak | penurunan dosis edge kalau suhu rata-ratanya juga turun `SHADE_COOLING_C` |

---

## `schools.json`

Array objek, satu per sekolah dalam AOI. **Real sejak Fase 1.5.5** — `pipeline/nces_schools.py` menarik NCES CCD (`EDGE_ADMINDATA_PUBLICSCH_2324`, cache `data/raw/nces_ccd_<tile_id>.json`), `pipeline/fixture_geometry.py:SCHOOLS_FIXTURE` mengimpornya, `pipeline/make_fixtures.py` menulisnya apa adanya ke `data/fixtures/schools.json` (nol entri fixture — sekolahnya sama persis dengan `data/out/schools.json`, hanya `by_school/` yang datanya sintetis).

```json
[
  {
    "id": "sch_pine_hills_elem",
    "name": "Pine Hills Elementary",
    "level": "elementary",
    "enrollment": 512,
    "walk_radius_mi": 2.0,
    "lon": -81.40,
    "lat": 28.53,
    "policy_source": "OCPS Transportation FAQs (ocps.net/transportation-faqs) — 2 mi, FS 1006.23"
  }
]
```

| Field | Tipe | Satuan | Null? | Sumber |
|---|---|---|---|---|
| `id` | `string` | — | tidak | slug internal |
| `name` | `string` | — | tidak | NCES CCD |
| `level` | `"elementary" \| "middle" \| "high"` | — | tidak | NCES CCD |
| `enrollment` | `integer` | siswa | tidak, `>= 0` | NCES CCD |
| `walk_radius_mi` | `number` | mil | tidak | kebijakan transportasi distrik |
| `lon`, `lat` | `number` | derajat | tidak | NCES CCD |
| `policy_source` | `string` | — | tidak | sitasi sumber kebijakan |
| `nces_id` | `string` | NCESSCH id | tidak | traceability ke CCD, tidak dipakai frontend |

---

## `schools_national.json` — Fase 6 (FR-20)

Pin **seluruh sekolah NCES** di AS untuk Layer simbol nasional Mode 1, **tanpa angka analisis apa pun** — sekolah yang belum dianalisis tidak boleh menampilkan angka (aturan keras FR-20). Dihasilkan `pipeline/national_schools.py`, query berpaginasi ke endpoint yang sama dengan `pipeline/nces_schools.py` tapi tanpa filter bbox. Cache mentah di `data/raw/nces_ccd_national.json` (di-commit — bukti API dipakai). Koordinat dibulatkan 4 desimal (~11 m) untuk ukuran file.

```json
[
  { "id": "nces_120144001399", "name": "Pine Hills Elementary", "lon": -81.418, "lat": 28.583, "analyzed": true },
  { "id": "nces_999999999999", "name": "Some Other School", "lon": -95.0, "lat": 40.0, "analyzed": false }
]
```

| Field | Tipe | Satuan | Null? | Sumber |
|---|---|---|---|---|
| `id` | `string` | NCES school id, prefiks `nces_` | tidak | NCES CCD |
| `name` | `string` | — | tidak | NCES CCD |
| `lon`, `lat` | `number` | derajat | tidak | NCES EDGE geocode |
| `analyzed` | `boolean` | — | tidak | `true` hanya kalau `id` (tanpa prefiks) muncul di `schools.json` |

---

## `summary.json`

Objek keyed by `school_id`. **Real sejak Fase 4** — `pipeline/summary_build.py` dipanggil dari `pipeline/step5_export.py` (asli) dan `pipeline/fixture_classify.py` (fixture, `data/fixtures/summary.json`) — logika perhitungan sama persis, dipakai ulang, tidak diduplikasi.

```json
{
  "sch_pine_hills_elem": {
    "in_walk_zone": 412,
    "reroute_enough": 118,
    "no_safe_route": 142,
    "lowest_income_quartile": 61,
    "misclassified": { "bus_not_needed": 12, "walk_should_bus": 142 },
    "dose_eliminated_per_child_per_day": 214,
    "dose_eliminated_per_child_per_year": 38520,
    "equivalent_minutes_at_42c": 43,
    "correction_factor": 1.08
  }
}
```

| Field | Tipe | Satuan | Null? | Sumber |
|---|---|---|---|---|
| `in_walk_zone` | `integer` | anak | tidak | jumlah `kids_est` blok dalam radius resmi |
| `reroute_enough` | `integer` | anak | tidak | jumlah `kids_est` blok kuning |
| `no_safe_route` | `integer` | anak | tidak | jumlah `kids_est` blok merah |
| `lowest_income_quartile` | `integer` | anak | tidak | ACS B19013 kuartil terbawah, dalam blok merah |
| `misclassified.bus_not_needed` | `integer` | anak | tidak | definisi G4 di `docs/METHODOLOGY.md`, ambang `BUS_NOT_NEEDED_MAX_EXCESS_MI`. **Nol di keenam sekolah gelombang 1** — struktural, bukan kalibrasi: `walk_radius_mi = 2,0` di seluruh AOI melebihi ukuran tile (±5 km), jadi nol blok berstatus `bus`. Lihat `docs/METHODOLOGY.md` §Fase 4 |
| `misclassified.walk_should_bus` | `integer` | anak | tidak | = jumlah anak blok merah di dalam walk zone resmi |
| `dose_eliminated_per_child_per_day` | `number` | °C·menit | tidak | `shortest.dose - coolest.dose` rata-rata blok merah |
| `dose_eliminated_per_child_per_year` | `number` | °C·menit | tidak | `× SCHOOL_DAYS_PER_YEAR` |
| `equivalent_minutes_at_42c` | `number` | menit | tidak | `dose_eliminated_per_day / (42.0 - baseline_c)` |
| `correction_factor` | `number` | — | tidak | `enrollment_CCD / estimasi_dasymetric`, rentang **diharapkan** `0.3–3.0` — 2 dari 6 sekolah AOI ini melenceng dengan sebab terdiagnosis (bukan bug), lihat `docs/METHODOLOGY.md` §1.5.6 |
| `radius_setara_dosis_mi` | `number` | mil | tidak, `> 0` | **Real sejak Fase 3**, `pipeline/dose_radius.py` + `pipeline/step3b_outcomes.py`. Jarak lurus terjauh dari sekolah ke centroid blok yang rute teradem-nya masih ≤ `THRESHOLD_DOSE_C_MIN`, pada `canonical_hour`. Wajib `≤ radius_kebijakan_mi` (G2 fail branch) |
| `radius_kebijakan_mi` | `number` | mil | tidak | **Real sejak Fase 3**. Salinan `schools.json.walk_radius_mi` untuk sekolah yang sama, ditulis berdampingan supaya panel FR-12 tidak perlu join dua file |
| `days_exceedance_per_year` | `number` | hari/tahun ajaran | tidak, `>= 0` | **Real sejak Fase 3**, `pipeline/exceedance.py`. Rata-rata, atas blok merah pada `canonical_hour`, dari jumlah hari sekolah (Agustus–Mei, 2019–2025) di mana `dose(suhu_stasiun_ASOS_MCO + offset_spasial_blok) > THRESHOLD_DOSE_C_MIN`, dibagi jumlah tahun ajaran dalam rentang. `offset_spasial_blok = coolest.mean_c blok pada canonical_hour − suhu stasiun MCO pada canonical_hour tanggal `FETCH_DATE``, diasumsikan stabil antar-hari (PRD §8 poin 14, tidak diuji) |

Field klasifikasi lain (`in_walk_zone`, `reroute_enough`, `no_safe_route`, `misclassified`, `dose_eliminated_*`, `equivalent_minutes_at_42c`) **real sejak Fase 4** — `pipeline/summary_build.py`, dipanggil dari `pipeline/step5_export.py` (asli) dan `pipeline/fixture_classify.py` (fixture). `reroute_enough = 0` di seluruh sekolah gelombang 1 (kategori kuning kosong, lihat `docs/METHODOLOGY.md` §Fase 4) — dilaporkan apa adanya, bukan bug.

---

## `contrast_report.csv`

Top-`CONTRAST_REPORT_TOP_N` (20) pasangan blok–sekolah berdasarkan `|delta_mean_c|` terbesar pada `canonical_hour`, seluruh sekolah gelombang 1 digabung satu file. Dihasilkan `pipeline/contrast_report.py` + `pipeline/step3b_outcomes.py`, **real sejak Fase 3**. Populasi penuh (368 baris pada gelombang 1) dan rentang delta selalu dihitung dan dilaporkan apa adanya di `docs/METHODOLOGY.md` — pemotongan ke 20 baris CSV murni untuk keterbacaan tabel, bukan penyaringan berdasarkan besar-kecilnya angka.

```
school_id,block_id,hour,shortest_len_m,coolest_len_m,shortest_mean_c,coolest_mean_c,delta_mean_c,shortest_dose,coolest_dose,delta_dose_pct,detour_ratio
sch_ridgewood_park_elementary,120950123052001,15:00,3083.2,3342.6,37.97,37.22,-0.75,212.83,195.82,-8.0,1.084
```

| Kolom | Tipe | Satuan | Sumber |
|---|---|---|---|
| `school_id` | `string` | — | id di `schools.json` |
| `block_id` | `string` | Census block GEOID | assignment blok→sekolah |
| `hour` | `string` (`HH:MM`) | — | selalu `canonical_hour` sekolah itu |
| `shortest_len_m`, `coolest_len_m` | `number` | meter | panjang fisik rute |
| `shortest_mean_c`, `coolest_mean_c` | `number` | °C | rata-rata berbobot panjang |
| `delta_mean_c` | `number` | °C | `coolest_mean_c - shortest_mean_c` |
| `shortest_dose`, `coolest_dose` | `number` | °C·menit | dosis total rute |
| `delta_dose_pct` | `number` | % | `(coolest_dose - shortest_dose) / shortest_dose * 100` |
| `detour_ratio` | `number` | — | `coolest_len_m / shortest_len_m` |

---

## Aturan lintas file

- **Status Fase 4 (26 Agustus 2026):** seluruh file di `data/out/` sekarang **real** — `tiles.json`, `schools.json`, `by_school/<school_id>/{graph.json,temps.json,blocks.geojson}`, `summary.json` (semua field), `contrast_report.csv`. Tidak ada lagi field placeholder dari fixture. `pipeline/run_all.py` menjalankan `step2_build_graph → step3_routes → step3b_outcomes → step4_classify → step5_export` berurutan; `pipeline/verify_step4.py` memverifikasi hasilnya termasuk paritas skema terhadap `data/fixtures/`.
- Setiap angka yang tampil di UI harus bisa ditelusuri ke satu baris tabel di atas.
- Setiap tempat yang menampilkan °C·menit **wajib** menampilkan °C di sebelahnya; setiap angka headline wajib punya °F. Satu-satunya tempat konversi ini hidup di kode: `web/src/lib/units.ts`.
- `edge_id` di `temps.json` **wajib** cocok satu-satu dengan `graph.json` sekolah yang sama — dicek programatik di setiap build (`pipeline/graph_integrity.py:check_no_orphan_edges`, dipakai `step2_build_graph.py` dan `make_fixtures.py`), bukan dengan mata.
- Kalau skema di atas berubah, `pipeline/make_fixtures.py` diupdate di commit yang sama.
- FR-5 (tombol permohonan hazardous walking) dibangun di `web/src/lib/petition.ts`. Ia menolak membangun teks (`null`) untuk blok non-merah dan untuk `block_id` berkode FIPS negara bagian yang tidak punya entri sitasi statuta — Arizona sengaja tidak dimasukkan (PRD §5.5).
