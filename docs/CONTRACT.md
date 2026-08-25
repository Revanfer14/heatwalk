# CONTRACT — `data/out/`

Skema file yang dibaca frontend. Setiap field mencatat tipe, satuan, nullability, dan file sumber pipeline yang menghasilkannya. Frontend **tidak pernah** menghitung ulang field manapun di sini — semua angka dibaca langsung.

Semua file di bawah identik skemanya antara fixture (`pipeline/make_fixtures.py`) dan output asli (pipeline Fase 2–4, belum ditulis). Frontend tidak boleh bisa membedakan keduanya.

Semua file di-`fetch()` dari `web/public/data/`, salinan dari `data/out/` lewat `pipeline/write_out.py:mirror_to_web()` (mirror rekursif, termasuk `by_school/`).

Geometri dipisah dari suhu (PRD §5.6): `graph.json` sekali per sekolah, `temps.json` berisi angka per edge per jam. Jangan pernah menduplikasi geometri per jam.

---

## `tiles.json`

Manifest mosaik tile. Dihasilkan `pipeline/step1_fetch_data.py` (asli, belum ditulis) / `pipeline/make_fixtures.py` (fixture).

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

Geometri + topologi jalan untuk satu sekolah, **sekali saja**, tanpa suhu. Dihasilkan `pipeline/step2_build_graph.py` (asli, belum ditulis) / `pipeline/make_fixtures.py` (fixture). Target ukuran **≤5 MB** (real; toleransi Douglas-Peucker dinaikkan dulu kalau lewat, sebelum ganti format).

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

Suhu dan dosis per edge per jam. Angka saja — tanpa koordinat, tanpa nama jalan. Dihasilkan `pipeline/step2_build_graph.py` (asli, belum ditulis) / `pipeline/make_fixtures.py` (fixture). Target ukuran **≤500 KB** untuk seluruh jam.

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

`FeatureCollection`, satu Feature per census block **milik sekolah ini** (assignment blok→sekolah, §1.3). Klasifikasi dihitung pada `meta.canonical_hour`, bukan dirata-rata antar jam (FR-8). Dihasilkan `pipeline/step4_classify.py` (asli, belum ditulis) / `pipeline/make_fixtures.py` (fixture).

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": { "type": "Polygon", "coordinates": [[[0, 0]]] },
      "properties": {
        "block_id": "FIXTURE-0900",
        "school_id": "sch_fixture_east",
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
| `properties.distance_mi` | `number` | mil | tidak, `>= 0` | jarak lurus centroid blok ke sekolah — dasar `status_now` dan G6 `bus_not_needed` |
| `properties.status_now` | `"walk" \| "bus"` | — | tidak | radius resmi distrik (`walk_radius_mi`) |
| `properties.status_rec` | `"walk" \| "reroute" \| "bus_eligible"` | — | tidak | turunan `class` |
| `properties.reason` | `string` | — | tidak untuk `red`/`yellow`, kosong diperbolehkan untuk `green` | template + angka konkret |
| `properties.safe_until_hour` | `string` (`HH:MM`) atau `null` | — | ya | hanya diisi untuk blok `red`: jam terakhir sebelum rute teradem melewati ambang, `null` kalau sudah merah sejak jam pertama di `meta.hours`. Selalu `null` untuk `green`/`yellow` — rute teradem mereka sudah aman di seluruh jam, angka ini tidak relevan |

---

## `schools.json`

Array objek, satu per sekolah dalam AOI. Dihasilkan `pipeline/step1_fetch_data.py` (asli, belum ditulis) / `pipeline/make_fixtures.py` (fixture).

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

---

## `schools_national.json` — Fase 6 (FR-20), belum diproduksi pipeline

Pin **seluruh sekolah NCES** di AS untuk Layer simbol nasional Mode 1, **tanpa angka analisis apa pun** — sekolah yang belum dianalisis tidak boleh menampilkan angka (aturan keras FR-20). Skema didokumentasikan di sini agar Fase 6 tidak menebak-nebak; belum ada produser pipeline sampai Fase 6 dimulai.

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

Objek keyed by `school_id`. Dihasilkan `pipeline/step4_classify.py` (asli, belum ditulis) / `pipeline/make_fixtures.py` (fixture).

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
| `misclassified.bus_not_needed` | `integer` | anak | tidak | definisi G6 di `docs/METHODOLOGY.md`, ambang `BUS_NOT_NEEDED_MAX_EXCESS_MI` |
| `misclassified.walk_should_bus` | `integer` | anak | tidak | = jumlah anak blok merah di dalam walk zone resmi |
| `dose_eliminated_per_child_per_day` | `number` | °C·menit | tidak | `shortest.dose - coolest.dose` rata-rata blok merah |
| `dose_eliminated_per_child_per_year` | `number` | °C·menit | tidak | `× SCHOOL_DAYS_PER_YEAR` |
| `equivalent_minutes_at_42c` | `number` | menit | tidak | `dose_eliminated_per_day / (42.0 - baseline_c)` |
| `correction_factor` | `number` | — | tidak, rentang `0.3–3.0` | `enrollment_CCD / estimasi_dasymetric` |

Belum di `summary.json` (menyusul Fase 3): `radius_setara_dosis_mi` / `radius_kebijakan_mi` (FR-18, G2) dan `days_exceedance_per_year` (FR-19, G9, P1).

---

## Aturan lintas file

- Setiap angka yang tampil di UI harus bisa ditelusuri ke satu baris tabel di atas.
- Setiap tempat yang menampilkan °C·menit **wajib** menampilkan °C di sebelahnya; setiap angka headline wajib punya °F.
- `edge_id` di `temps.json` **wajib** cocok satu-satu dengan `graph.json` sekolah yang sama — dicek programatik di setiap build (`make_fixtures.py:_check_no_orphan_edges`), bukan dengan mata.
- Kalau skema di atas berubah, `pipeline/make_fixtures.py` diupdate di commit yang sama.
