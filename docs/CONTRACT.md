# CONTRACT — `data/out/`

Skema file yang dibaca frontend. Setiap field mencatat tipe, satuan, nullability, dan file sumber pipeline yang menghasilkannya. Frontend **tidak pernah** menghitung ulang field manapun di sini — semua angka dibaca langsung.

Empat file ini identik antara fixture (`pipeline/make_fixtures.py`) dan output asli (`pipeline/step5_export.py`). Frontend tidak boleh bisa membedakan keduanya.

Semua file di-`fetch()` dari `web/public/data/`, salinan dari `data/out/` lewat `pipeline/write_out.py:mirror_to_web()`.

---

## `graph.<HHMM>.json`

Dua file: `graph.0730.json` (jam masuk) dan `graph.1445.json` (jam bubar). Dihasilkan `pipeline/step2_build_graph.py` (asli) / `pipeline/make_fixtures.py` (fixture).

```json
{
  "meta": {
    "aoi_bbox": [-112.12, 33.45, -112.05, 33.51],
    "date": "2026-08-18",
    "hour": "14:45",
    "baseline_c": 33.0,
    "walk_speed_mps": 1.2,
    "lambda_detour": 0.05,
    "source": "fortyguard tcm 60m"
  },
  "nodes": {
    "n1": [-112.09, 33.48]
  },
  "edges": [
    {
      "u": "n1",
      "v": "n2",
      "len_m": 84.2,
      "temp_c": 41.3,
      "dose": 9.7,
      "geom": [[-112.09, 33.48], [-112.089, 33.481]]
    }
  ]
}
```

| Field | Tipe | Satuan | Null? | Sumber |
|---|---|---|---|---|
| `meta.aoi_bbox` | `[number,number,number,number]` | derajat (lon/lat) | tidak | `pipeline/config.py` |
| `meta.date` | `string` (`YYYY-MM-DD`) | — | tidak | tanggal snapshot heatmap dipilih |
| `meta.hour` | `string` (`HH:MM`) | — | tidak | `MORNING_HHMM` / `DISMISSAL_HHMM` |
| `meta.baseline_c` | `number` | °C | tidak | `BASELINE_C` |
| `meta.walk_speed_mps` | `number` | m/s | tidak | `WALK_SPEED_MPS` |
| `meta.lambda_detour` | `number` | — | tidak | hasil kalibrasi Fase 2.3 |
| `meta.source` | `string` | — | tidak | deskriptif |
| `nodes.<id>` | `[lon, lat]` | derajat | tidak | node graph OSM/fixture |
| `edges[].u`, `edges[].v` | `string` | id node | tidak | topologi graph |
| `edges[].len_m` | `number` | meter | tidak, `> 0` | panjang geometri edge |
| `edges[].temp_c` | `number` | °C | tidak | rata-rata sampel raster sepanjang edge |
| `edges[].dose` | `number` | °C·menit | tidak, `>= 0` | `max(temp_c - baseline_c, 0) * (len_m / walk_speed_mps) / 60` |
| `edges[].geom` | `[[lon,lat], ...]` | derajat | tidak | geometri disederhanakan (Douglas-Peucker ~5m) |

---

## `blocks.geojson`

`FeatureCollection`, satu Feature per census block. Dihasilkan `pipeline/step4_classify.py` (asli) / `pipeline/make_fixtures.py` (fixture).

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": { "type": "Polygon", "coordinates": [[[0, 0]]] },
      "properties": {
        "block_id": "040130610001007",
        "school_id": "sch_lincoln",
        "kids_est": 23,
        "class": "red",
        "shortest": { "len_m": 1420, "mean_c": 40.3, "peak_c": 44.0, "dose": 503 },
        "coolest": { "len_m": 1680, "mean_c": 34.1, "peak_c": 36.8, "dose": 289 },
        "delta_mean_c": -6.2,
        "delta_dose_pct": -43,
        "status_now": "walk",
        "status_rec": "bus_eligible",
        "reason": "coolest route mean 41.2C exceeds threshold"
      }
    }
  ]
}
```

| Field | Tipe | Satuan | Null? | Sumber |
|---|---|---|---|---|
| `properties.block_id` | `string` | Census block GEOID | tidak | Census 2020 DHC |
| `properties.school_id` | `string` | id di `schools.json` | tidak | assignment blok→sekolah (Fase 1.3) |
| `properties.kids_est` | `integer` | anak | tidak, `>= 0` | dasymetric × `faktor_koreksi` |
| `properties.class` | `"green" \| "yellow" \| "red"` | — | tidak | aturan FR-8, `THRESHOLD` di `config.py` |
| `properties.shortest.len_m` | `number` | meter | tidak | Dijkstra `weight='len_m'` |
| `properties.shortest.mean_c` | `number` | °C | tidak | rata-rata berbobot panjang |
| `properties.shortest.peak_c` | `number` | °C | tidak | maksimum edge di rute |
| `properties.shortest.dose` | `number` | °C·menit | tidak, `>= 0` | jumlah dose sepanjang rute |
| `properties.coolest.*` | sama seperti `shortest.*` | — | tidak | Dijkstra `weight=weight_cool` |
| `properties.delta_mean_c` | `number` | °C | tidak | `coolest.mean_c - shortest.mean_c` |
| `properties.delta_dose_pct` | `number` | % (bulat) | tidak | `(coolest.dose - shortest.dose) / shortest.dose * 100` |
| `properties.status_now` | `"walk" \| "bus"` | — | tidak | radius resmi distrik |
| `properties.status_rec` | `"walk" \| "reroute" \| "bus_eligible"` | — | tidak | turunan `class` |
| `properties.reason` | `string` | — | tidak untuk `red`, kosong diperbolehkan untuk `green` | template + angka konkret |

---

## `schools.json`

Array objek, satu per sekolah dalam AOI. Dihasilkan `pipeline/step1_fetch_data.py` (asli) / `pipeline/make_fixtures.py` (fixture).

```json
[
  {
    "id": "sch_lincoln",
    "name": "Lincoln Elementary",
    "level": "elementary",
    "enrollment": 512,
    "walk_radius_mi": 1.0,
    "lon": -112.09,
    "lat": 33.48,
    "policy_source": "PUSD Transportation Policy 2024, p.4"
  }
]
```

| Field | Tipe | Satuan | Null? | Sumber |
|---|---|---|---|---|
| `id` | `string` | — | tidak | slug internal |
| `name` | `string` | — | tidak | NCES CCD |
| `level` | `"elementary" \| "middle" \| "high"` | — | tidak | NCES CCD |
| `enrollment` | `integer` | siswa | tidak, `>= 0` | NCES CCD |
| `walk_radius_mi` | `number` | mil | tidak | PDF kebijakan distrik |
| `lon`, `lat` | `number` | derajat | tidak | NCES CCD |
| `policy_source` | `string` | — | tidak | sitasi halaman PDF |

---

## `summary.json`

Objek keyed by `school_id`. Dihasilkan `pipeline/step4_classify.py` (asli) / `pipeline/make_fixtures.py` (fixture).

```json
{
  "sch_lincoln": {
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
| `misclassified.bus_not_needed` | `integer` | anak | tidak | definisi G6 di `docs/METHODOLOGY.md` |
| `misclassified.walk_should_bus` | `integer` | anak | tidak | = jumlah anak blok merah di dalam walk zone resmi |
| `dose_eliminated_per_child_per_day` | `number` | °C·menit | tidak | `shortest.dose - coolest.dose` rata-rata blok merah |
| `dose_eliminated_per_child_per_year` | `number` | °C·menit | tidak | `× 180 hari` |
| `equivalent_minutes_at_42c` | `number` | menit | tidak | `dose_eliminated_per_day / (42.0 - baseline_c)` |
| `correction_factor` | `number` | — | tidak, rentang `0.3–3.0` | `enrollment_CCD / estimasi_dasymetric` |

---

## Aturan lintas file

- Setiap angka yang tampil di UI harus bisa ditelusuri ke satu baris tabel di atas.
- Setiap tempat yang menampilkan °C·menit **wajib** menampilkan °C di sebelahnya; setiap angka headline wajib punya °F.
- Kalau skema di atas berubah, `pipeline/make_fixtures.py` diupdate di commit yang sama.
