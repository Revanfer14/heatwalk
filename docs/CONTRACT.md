# CONTRACT — `data/out/`

Schema of the files the frontend reads. Every field records its type, unit, nullability, and the pipeline source file that produces it. The frontend **never** recomputes any field here — every number is read directly.

All files below have identical schemas between the fixture (`pipeline/make_fixtures.py`, written to `data/fixtures/`) and the real output (`data/out/`, pipeline Phases 2–4). The frontend must not be able to tell the two apart — checked programmatically via recursive schema parity in `pipeline/verify_step4.py`.

**Fixtures never overwrite `data/out/` or `web/public/data/`.** `pipeline/make_fixtures.py` writes only to `data/fixtures/` and does not call `mirror_to_web()`. To test the frontend reading a fixture, copy `data/fixtures/` into `web/public/data/` manually (the file-swap test in dev plan §Phase 4), then revert (`git checkout web/public/data`).

Real data is `fetch()`ed from `web/public/data/`, a copy of `data/out/` via `pipeline/write_out.py:mirror_to_web()` (recursive mirror, including `by_school/`), called at the end of `pipeline/step5_export.py` (or `pipeline/run_all.py`).

Geometry is separated from temperature (PRD §5.6): `graph.json` once per school, `temps.json` holding numbers per edge per hour. Never duplicate geometry per hour.

---

## `tiles.json`

Tile mosaic manifest. Produced by `pipeline/step1_fetch_data.py` — real since Phase 1.5.4 (10-hour heatmap pulled, zero NaN per hour). The original tile id `orl_pine_hills_n` was replaced by `orl_ocps_core` in Phase 6 (merged bbox, see `docs/METHODOLOGY.md` §Phase 6). `make_fixtures.py` **no longer writes this file** — running it again would overwrite the real result with a stale static-status assumption.

```json
[
  {
    "id": "orl_ocps_core",
    "bbox": [-81.4763, 28.5277, -81.3719, 28.6612],
    "status": "done",
    "hours_fetched": ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"],
    "modeled_median_c_by_hour": { "07:00": 28.41, "15:00": 37.35 }
  }
]
```

| Field | Type | Unit | Null? | Source |
|---|---|---|---|---|
| `id` | `string` | — | no | `pipeline/config.py:TILES` |
| `bbox` | `[number,number,number,number]` | degrees (west, south, east, north) | no | `pipeline/config.py:TILES` |
| `status` | `"pending" \| "done"` | — | no | fetch status of this tile |
| `hours_fetched` | `string[]` (`HH:MM`) | — | no, may be `[]` | hours that **actually** returned data — silently-empty hours don't count (§5.1) |
| `modeled_median_c_by_hour` | `Record<HH:MM, number>` | °C | no, may be `{}` | median AOI temperature on the model day (`FETCH_DATE`) per hour — `pipeline/heatmap_stats.py:describe()` over `tile_values()`, one entry per hour in `hours_fetched`. Used by FR-29 as the live-temperature offset reference; **not** `temps.json:meta.baseline_c` (that's the dose threshold, not a measured temperature) |

---

## `by_school/<school_id>/graph.json`

Road geometry + topology for one school, **once only**, no temperature. Produced by `pipeline/step2_build_graph.py` (real, real since Phase 2) / `pipeline/make_fixtures.py` (fixture). Target size **≤5 MB** (real; raise the Douglas-Peucker tolerance first if it's exceeded, before changing the format).

```json
{
  "meta": { "school_id": "sch_pine_hills_elem", "tile_id": "orl_ocps_core", "crs": "EPSG:4326" },
  "nodes": { "n1": [-81.4763, 28.5722] },
  "edges": {
    "n1-n2": { "u": "n1", "v": "n2", "len_m": 84.2, "geom": [[-81.4763, 28.5722], [-81.4760, 28.5723]] }
  }
}
```

| Field | Type | Unit | Null? | Source |
|---|---|---|---|---|
| `meta.school_id` | `string` | — | no | id in `schools.json` |
| `meta.tile_id` | `string` | — | no | id in `tiles.json` |
| `meta.crs` | `string` | — | no | always `"EPSG:4326"` |
| `nodes.<id>` | `[lon, lat]` | degrees | no | OSM/fixture graph node |
| `edges.<edge_id>.u`, `.v` | `string` | node id | no | graph topology |
| `edges.<edge_id>.len_m` | `number` | meters | no, `> 0` | edge geometry length |
| `edges.<edge_id>.geom` | `[[lon,lat], ...]` | degrees, 5 decimals (~1.1 m) | no | simplified geometry (Douglas-Peucker ~5m) |

**`edge_id` must match one-to-one with the `edges` keys in `temps.json` for the same school.** An orphan on either side is a bug to be reported, not silently skipped — checked programmatically, not by eye.

---

## `by_school/<school_id>/temps.json`

Temperature and dose per edge per hour. Numbers only — no coordinates, no street names. Produced by `pipeline/step2_build_graph.py` (real, real since Phase 2) / `pipeline/make_fixtures.py` (fixture). Target size **≤500 KB** for all hours combined — currently exceeded (~1.3 MB, full-tile coverage), see `docs/METHODOLOGY.md`.

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

| Field | Type | Unit | Null? | Source |
|---|---|---|---|---|
| `meta.hours` | `string[]` (`HH:MM`) | — | no | hours available for **this school** — a subset of the parent tile's `hours_fetched` if any hour was dropped for >10% NaN (§1.5) |
| `meta.canonical_hour` | `string` (`HH:MM`) | — | no, must be ∈ `meta.hours` | the hour with the highest average temperature, derived from data (§1.5.7) — **never hardcoded** |
| `meta.baseline_c` | `number` | °C | no | `BASELINE_C` |
| `meta.threshold` | `number` | °C·min | no | `THRESHOLD_DOSE_C_MIN` — indicative, see `docs/METHODOLOGY.md` section `[Phase 4] THRESHOLD` |
| `meta.lambda_detour` | `number` | — | no | result of Phase 2.3 calibration (1.4× detour cap) |
| `meta.fetched_at` | `string` (`YYYY-MM-DD`) | — | no | date of the heatmap snapshot (`FETCH_DATE`) |
| `edges.<edge_id>.<HH:MM>` | `[temp_c, peak_c, dose]` | [°C, °C, °C·min], 1 decimal | no | `temp_c`/`peak_c` = mean/max raster sample along the edge; `dose = max(temp_c - baseline_c, 0) * (len_m / walk_speed_mps) / 60` |

---

## `by_school/<school_id>/blocks.geojson`

`FeatureCollection`, one Feature per census block **belonging to this school** (block→school assignment, §1.3). Classification is computed at `meta.canonical_hour`, not averaged across hours (FR-8). **Real since Phase 4** — `pipeline/step4_classify.py` + `pipeline/step5_export.py` (real, 368 populated blocks in wave 1) / `pipeline/fixture_classify.py` + `pipeline/make_fixtures.py` (fixture, `data/fixtures/`). **Since Phase 10, blocks with `POP100 = 0` are also classified** (FR-22): their `kids_est` is 0, geometry stays full, so the interior of the walk-zone circle is fully covered by the choropleth. The property schema is unchanged.

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

| Field | Type | Unit | Null? | Source |
|---|---|---|---|---|
| `properties.block_id` | `string` | Census block GEOID | no | Census 2020 DHC |
| `properties.school_id` | `string` | id in `schools.json` | no | block→school assignment |
| `properties.kids_est` | `integer` | children | no, `>= 0` | dasymetric × `correction_factor` |
| `properties.class` | `"green" \| "yellow" \| "red"` | — | no | FR-8 rule, `THRESHOLD_DOSE_C_MIN` in `config.py` |
| `properties.shortest.*` | `{len_m, mean_c, peak_c, dose}` | m / °C / °C / °C·min | no | Dijkstra `weight='len_m'` at `meta.canonical_hour` |
| `properties.coolest.*` | same as `shortest.*` | — | no | Dijkstra `weight=weight_cool` at `meta.canonical_hour` |
| `properties.delta_mean_c` | `number` | °C | no | `coolest.mean_c - shortest.mean_c` |
| `properties.delta_dose_pct` | `number` | % (rounded) | no | `(coolest.dose - shortest.dose) / shortest.dose * 100` |
| `properties.distance_mi` | `number` | miles | no, `>= 0` | straight-line distance from block centroid to school — basis for `status_now` and G4 `bus_not_needed` |
| `properties.status_now` | `"walk" \| "bus"` | — | no | official district radius (`walk_radius_mi`) |
| `properties.status_rec` | `"walk" \| "reroute" \| "bus_eligible"` | — | no | derived from `class` |
| `properties.reason` | `string` | — | no for `red`/`yellow`, may be empty for `green` | template + concrete numbers |
| `properties.safe_until_hour` | `string` (`HH:MM`) or `null` | — | yes | only populated for `red` blocks: the last hour before the coolest route crosses the threshold, `null` if it's been red since the first hour in `meta.hours`. Always `null` for `green`/`yellow` — their coolest route is already safe at every hour, so this number is not relevant |

---

## `by_school/<school_id>/blocks_hours.json` — Phase 6

FR-8 classification and dose **per hour** per block, used by the Mode 1 choropleth when the hour slider moves (FR-13). `blocks.geojson` remains the source of truth for the canonical hour; this file is an additional layer for the other hours, not a replacement. Produced by `pipeline/blocks_hours.py`, called from `pipeline/step5_export.py` (real) and `pipeline/make_fixtures.py` (fixture) — a pure re-serialization of `shortest.by_hour` / `coolest.by_hour` already computed by `pipeline/step3_routes.py`, zero re-routing.

```json
{
  "120950124023009": {
    "07:00": { "shortest": 0.0, "coolest": 0.0, "mean_c": 28.4, "class": "green" },
    "15:00": { "shortest": 259.1, "coolest": 259.1, "mean_c": 36.9, "class": "red" }
  }
}
```

| Field | Type | Unit | Null? | Source |
|---|---|---|---|---|
| `<block_id>` | key | Census block GEOID | — | matches the `block_id` key in the same school's `blocks.geojson` exactly — checked programmatically one by one (`pipeline/verify_step4.py:check_blocks_hours_matches_geojson`) |
| `<block_id>.<HH:MM>` | key | — | — | subset of `meta.hours` in the same school's `temps.json` |
| `<block_id>.<HH:MM>.shortest` | `number` | °C·min | no | shortest-route dose at this hour — `routed["blocks"][id]["shortest"]["by_hour"][hour]["dose"]` |
| `<block_id>.<HH:MM>.coolest` | `number` | °C·min | no | coolest-route dose at this hour |
| `<block_id>.<HH:MM>.mean_c` | `number` | °C | no | shortest-route mean temperature at this hour — used for the block temperature label (FR-23, Phase 10) |
| `<block_id>.<HH:MM>.class` | `"green" \| "yellow" \| "red"` | — | no | `pipeline/classification.py:classify()`, same thresholds as FR-8 |

**Not a replacement for `blocks.geojson`.** The frontend reads geometry, `kids_est`, `reason`, `safe_until_hour`, and other properties from `blocks.geojson` once; `blocks_hours.json` is only used to update `class` (choropleth color) and `mean_c` (temperature label) when the hour changes — zero dose recomputation on the frontend.

---

## `district_blocks.geojson` — Phase 10 (FR-22)

Merges every `by_school/*/blocks.geojson` into a single `FeatureCollection` at the root of `data/out/`. Because nearest-school assignment is a disjoint partition, the merge equals every classified block, with no duplicate `block_id`. The per-Feature schema is identical to `by_school/<school_id>/blocks.geojson`.

Mode 1 (district) renders this file, not the per-school files: a block inside school X's circle whose assignment is to school Y (because it's closer) still shows up in X's view with its route classification to Y — so the circle's interior is fully covered. Rendering is clipped to the interior of the selected school's policy circle: blocks whose centroid falls outside the selected school's `walk_radius_mi` are not rendered (client-side clip, `web/src/lib/blocksInsidePolicyCircle.ts`) — a zone is never shown outside the circle it's drawn in. Mode 2 (parent) and the FR-14 CSV export still use the per-school files.

---

## `district_blocks_hours.json` — Phase 10 (FR-23)

Merges every `by_school/*/blocks_hours.json` into a single object at the root of `data/out/`; the per-`<block_id>` per-hour schema is identical (including `mean_c`). Used by Mode 1 alongside `district_blocks.geojson`.

---

## `by_school/<school_id>/segments.json` — Phase 6 (FR-15, P1)

The top `SEGMENT_PRIORITY_TOP_N` (20) street segments most crossed by red/yellow blocks' coolest routes for this school at the canonical hour, sorted by `kids_affected` descending then `peak_c` descending. Produced by `pipeline/segment_priority.py`, called from `pipeline/step5_export.py` (real) and `pipeline/make_fixtures.py` (fixture). **The temperature-reduction column uses a uniform `SHADE_COOLING_C` (°C) assumption** — see `docs/METHODOLOGY.md`, not a measurement of real shade cover. This file is still produced by the pipeline; the frontend table and map highlight that were meant to consume it (FR-15, FR-24) were never built — see `heatwalk-prd.md`.

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

| Field | Type | Unit | Null? | Source |
|---|---|---|---|---|
| `edge_id` | `string` | — | no | matches the `edges` key in the same school's `graph.json` one-to-one |
| `street_name` | `string` | — | no | OSM street name; `"Unnamed segment"` if OSM has no name on record |
| `kids_affected` | `integer` | children | no, `> 0` | Σ `kids_est` of blocks whose coolest route (canonical hour) crosses this edge |
| `peak_c` | `number` | °C | no | edge peak temperature at the canonical hour, from `temps.json` |
| `peak_shaded_c` | `number` | °C | no | `peak_c - SHADE_COOLING_C` — an estimate, uniform ΔT assumption |
| `dose_reduction_pct` | `number` | % (rounded) | no | dose reduction on the edge if its mean temperature also dropped by `SHADE_COOLING_C` |

---

## `schools.json`

Array of objects, one per school in the AOI, sorted A–Z by `name`. **Real since Phase 1.5.5, produced by the pipeline since Phase 9** — `pipeline/nces_schools.py` pulls NCES CCD (`EDGE_ADMINDATA_PUBLICSCH_2324`, cached at `data/raw/nces_ccd_<tile_id>.json`) and filters out schools with `enrollment = 0`. `pipeline/step1b_schools.py` calls it and writes `data/out/schools.json` directly — no longer a hand-built artifact. `pipeline/fixture_geometry.py:SCHOOLS_FIXTURE` imports the same function, `pipeline/make_fixtures.py` writes it as-is to `data/fixtures/schools.json` (zero fixture entries — the schools are exactly the same as `data/out/schools.json`; only `by_school/` data is synthetic).

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

| Field | Type | Unit | Null? | Source |
|---|---|---|---|---|
| `id` | `string` | — | no | internal slug |
| `name` | `string` | — | no | NCES CCD |
| `level` | `"elementary" \| "middle" \| "high"` | — | no | NCES CCD |
| `enrollment` | `integer` | students | no, `>= 0` | NCES CCD |
| `walk_radius_mi` | `number` | miles | no | district transportation policy |
| `lon`, `lat` | `number` | degrees | no | NCES CCD |
| `policy_source` | `string` | — | no | policy source citation |
| `nces_id` | `string` | NCESSCH id | no | traceability to CCD, not used by the frontend |

---

## `schools_national.json` — Phase 6 (FR-20)

Pins for **every NCES school** in the US for Mode 1's national symbol layer, **with no analysis numbers whatsoever** — an unanalyzed school must not display any number (FR-20 hard rule). Produced by `pipeline/national_schools.py`, a paginated query to the same endpoint as `pipeline/nces_schools.py` but without a bbox filter. Raw cache at `data/raw/nces_ccd_national.json` (committed — proof the API was used). Coordinates rounded to 4 decimals (~11 m) to keep file size down.

```json
[
  { "id": "nces_120144001399", "name": "Pine Hills Elementary", "lon": -81.418, "lat": 28.583, "analyzed": true },
  { "id": "nces_999999999999", "name": "Some Other School", "lon": -95.0, "lat": 40.0, "analyzed": false }
]
```

| Field | Type | Unit | Null? | Source |
|---|---|---|---|---|
| `id` | `string` | NCES school id, `nces_` prefix | no | NCES CCD |
| `name` | `string` | — | no | NCES CCD |
| `lon`, `lat` | `number` | degrees | no | NCES EDGE geocode |
| `analyzed` | `boolean` | — | no | `true` only if `id` (without the prefix) appears in `schools.json` |

---

## `summary.json`

Object keyed by `school_id`. **Real since Phase 4** — `pipeline/summary_build.py` called from `pipeline/step5_export.py` (real) and `pipeline/fixture_classify.py` (fixture, `data/fixtures/summary.json`) — identical calculation logic, reused, not duplicated.

```json
{
  "sch_pine_hills_elem": {
    "in_walk_zone": 412,
    "reroute_enough": 118,
    "no_safe_route": 142,
    "lowest_income_quartile": 61,
    "misclassified": { "bus_not_needed": 12, "walk_should_bus": 142 },
    "misclassified_by_hour": {
      "07:00": { "bus_not_needed": 4, "walk_should_bus": 0 },
      "15:00": { "bus_not_needed": 12, "walk_should_bus": 142 }
    },
    "dose_eliminated_per_child_per_day": 214,
    "dose_eliminated_per_child_per_year": 38520,
    "equivalent_minutes_at_42c": 43,
    "correction_factor": 1.08
  }
}
```

| Field | Type | Unit | Null? | Source |
|---|---|---|---|---|
| `in_walk_zone` | `integer` | children | no | sum of `kids_est` for blocks inside the official radius |
| `reroute_enough` | `integer` | children | no | sum of `kids_est` for yellow blocks |
| `no_safe_route` | `integer` | children | no | sum of `kids_est` for red blocks |
| `lowest_income_quartile` | `integer` | children | no | ACS B19013 bottom quartile, within red blocks |
| `misclassified.bus_not_needed` | `integer` | children | no | G4 definition in `docs/METHODOLOGY.md`, `BUS_NOT_NEEDED_MAX_EXCESS_MI` threshold. **Zero across all 42 analyzed schools** (also zero in the six wave-1/Phase 10 schools) — no longer because there are no `bus`-status blocks (that only held in the small wave-1 bbox), but because zero `bus`-status blocks classify as green. See `docs/METHODOLOGY.md` §Phase 4 and §Phase 10 Finding 2 |
| `misclassified.walk_should_bus` | `integer` | children | no | = number of children in red blocks within the official walk zone |
| `misclassified_by_hour.<HH:MM>.bus_not_needed` / `.walk_should_bus` | `integer` | children | no | **Real since the 2026-08-29 revision (FR-13 × FR-12).** Identical definition to `misclassified.*`, re-evaluated for each hour in `meta.hours`, with `class` taken from `blocks_hours.json` at that hour instead of the canonical `class` in `blocks.geojson` — so the value moves as the Mode 1 hour slider moves, instead of staying fixed at the canonical hour. `misclassified_by_hour[canonical_hour]` always matches `misclassified` above exactly (verified across all 42 schools). Computed by `pipeline/summary_build.py:_misclassified_by_hour`, zero recomputation on the frontend — the Mode 1 panel (`SchoolSummaryRow.tsx`) only picks the active hour's key via `web/src/lib/misclassifiedHighlight.ts:misclassifiedCountsForHour`. |
| `dose_eliminated_per_child_per_day` | `number` | °C·min | no | average `shortest.dose - coolest.dose` over red blocks |
| `dose_eliminated_per_child_per_year` | `number` | °C·min | no | `× SCHOOL_DAYS_PER_YEAR` |
| `equivalent_minutes_at_42c` | `number` | minutes | no | `dose_eliminated_per_day / (42.0 - baseline_c)` |
| `correction_factor` | `number` | — | no | `enrollment_CCD / dasymetric_estimate`, **expected** range `0.3–3.0` — 12 of 42 schools fall outside it with a diagnosed cause (nearest-school proxy, not a bug), see `docs/METHODOLOGY.md` §1.5.6 and §Phase 9 |
| `radius_setara_dosis_mi` | `number` | miles | no, `> 0` | **Real since Phase 3**, `pipeline/dose_radius.py` + `pipeline/step3b_outcomes.py`. Farthest straight-line distance from the school to a block centroid whose coolest route is still ≤ `THRESHOLD_DOSE_C_MIN`, at `canonical_hour`. Must be `≤ radius_kebijakan_mi` (G2 fail branch) |
| `radius_kebijakan_mi` | `number` | miles | no | **Real since Phase 3**. Copy of `schools.json.walk_radius_mi` for the same school, written alongside so the FR-12 panel doesn't need to join two files |
| `days_exceedance_per_year` | `number` | days/school year | no, `>= 0` | **Real since Phase 3**, `pipeline/exceedance.py`. Average, over red blocks at `canonical_hour`, of the number of school days (August–May, 2019–2025) where `dose(ASOS_MCO_station_temp + block_spatial_offset) > THRESHOLD_DOSE_C_MIN`, divided by the number of school years in the range. `block_spatial_offset = block coolest.mean_c at canonical_hour − MCO station temp at canonical_hour on date `FETCH_DATE``, assumed stable day to day (PRD §8 point 14, untested) |

Other classification fields (`in_walk_zone`, `reroute_enough`, `no_safe_route`, `misclassified`, `dose_eliminated_*`, `equivalent_minutes_at_42c`) are **real since Phase 4** — `pipeline/summary_build.py`, called from `pipeline/step5_export.py` (real) and `pipeline/fixture_classify.py` (fixture). `reroute_enough = 0` across all wave-1 schools (empty yellow category, see `docs/METHODOLOGY.md` §Phase 4) — reported as-is, not a bug.

---

## `contrast_report.csv`

The top `CONTRAST_REPORT_TOP_N` (20) block–school pairs by largest `|delta_mean_c|` at `canonical_hour`, all wave-1 schools merged into one file. Produced by `pipeline/contrast_report.py` + `pipeline/step3b_outcomes.py`, **real since Phase 3**. The full population (368 rows in wave 1) and the delta range are always computed and reported as-is in `docs/METHODOLOGY.md` — trimming to 20 CSV rows is purely for table readability, not filtering by magnitude.

```
school_id,block_id,hour,shortest_len_m,coolest_len_m,shortest_mean_c,coolest_mean_c,delta_mean_c,shortest_dose,coolest_dose,delta_dose_pct,detour_ratio
sch_ridgewood_park_elementary,120950123052001,15:00,3083.2,3342.6,37.97,37.22,-0.75,212.83,195.82,-8.0,1.084
```

| Column | Type | Unit | Source |
|---|---|---|---|
| `school_id` | `string` | — | id in `schools.json` |
| `block_id` | `string` | Census block GEOID | block→school assignment |
| `hour` | `string` (`HH:MM`) | — | always that school's `canonical_hour` |
| `shortest_len_m`, `coolest_len_m` | `number` | meters | physical route length |
| `shortest_mean_c`, `coolest_mean_c` | `number` | °C | length-weighted mean |
| `delta_mean_c` | `number` | °C | `coolest_mean_c - shortest_mean_c` |
| `shortest_dose`, `coolest_dose` | `number` | °C·min | total route dose |
| `delta_dose_pct` | `number` | % | `(coolest_dose - shortest_dose) / shortest_dose * 100` |
| `detour_ratio` | `number` | — | `coolest_len_m / shortest_len_m` |

---

## `web/api/` — runtime endpoint responses (not `data/out/`, but a contract the frontend reads all the same)

Two read-only serverless functions (FR-29, 2026-08-28 amendment §Phase 14 `docs/METHODOLOGY.md`) — they write nothing to `data/out/`, but their response shape is a contract that `web/src/hooks/useLiveTemperature.ts` depends on exactly as other hooks depend on the static files above.

### `GET /api/live-temperature-start?schoolId=<id>&hour=<HH:MM>`

```json
{ "activityId": "abc123..." }
```

| Field | Type | Null? | Notes |
|---|---|---|---|
| `activityId` | `string` | no (200) | FortyGuard job id, polled via the endpoint below |
| `error` | `string` | only on non-200 | `400` (invalid `schoolId`/`hour`), `500` (API key missing), `502` (FortyGuard failed) |

`schoolId` **must** match an entry in `data/schools.json` — validated server-side before the tile bbox is computed; this is a credit fence (§Phase 14), not just input validation.

### `GET /api/live-temperature-result?activityId=<id>`

```json
{
  "state": "ready",
  "medianC": 34.82,
  "grid": {
    "west": -81.4901,
    "north": 28.5812,
    "pixelDx": 0.00054,
    "pixelDy": 0.00054,
    "cols": 84,
    "rows": 84,
    "values": [34.1, 34.3, null, 35.0]
  }
}
```

| Field | Type | Unit | Null? | Notes |
|---|---|---|---|---|
| `state` | `"pending" \| "ready" \| "failed"` | — | no | `pending`/`failed` do not include `medianC`/`grid` |
| `medianC` | `number` | °C | only when `state="ready"` | median of valid cells within the tile, `-999` sentinels already discarded |
| `grid.west`, `grid.north` | `number` | degrees | only when `state="ready"` | grid's top-left corner (WGS84) |
| `grid.pixelDx`, `grid.pixelDy` | `number` | degrees | only when `state="ready"` | cell width/height, from the median cell size of `map_data.features` (`web/api/_lib/heatmapGrid.ts:buildTemperatureGrid`, ported from `pipeline/heatmap_raster.py:build_grid`) |
| `grid.cols`, `grid.rows` | `integer` | — | only when `state="ready"` | dimensions of the `values` array (row-major: index `row*cols+col`) |
| `grid.values` | `(number \| null)[]` | °C | individual elements may be `null` (empty cell/sentinel) | read client-side by `lib/liveTemperatureGrid.ts:sampleGridAt`, sampled onto each edge by `lib/edgeLiveTemperatures.ts` |
| `grid` (as a whole) | — | — | `null` if the grid failed to build (e.g. `map_data` empty) | `medianC` can still be available on its own; the client falls back to a uniform offset per edge |

Typical grid size for a 5×5 km tile / 60 m granularity: ~84×84 cells, ~35 KB per response.

**Silent failure still applies (FR-29):** the client never shows an error state that blocks the main demo path — any endpoint failure (network, timeout, `state: "failed"`) makes `useLiveTemperature` fall back to `unavailable` status, and routing keeps using `temps.json` + the uniform offset fallback.

---

## Cross-file rules

- **Phase 4 status (August 26, 2026):** every file in `data/out/` is now **real** — `tiles.json`, `schools.json`, `by_school/<school_id>/{graph.json,temps.json,blocks.geojson}`, `summary.json` (all fields), `contrast_report.csv`. No more placeholder fields from fixtures. `pipeline/run_all.py` runs `step2_build_graph → step3_routes → step3b_outcomes → step4_classify → step5_export` in sequence; `pipeline/verify_step4.py` verifies the result including schema parity against `data/fixtures/`.
- Every number shown in the UI must be traceable to one row in a table above.
- Every place that displays °C·minutes **must** show °C next to it; every headline number must have °F. The only place this conversion lives in code is `web/src/lib/units.ts`.
- `edge_id` in `temps.json` **must** match `graph.json` for the same school one-to-one — checked programmatically on every build (`pipeline/graph_integrity.py:check_no_orphan_edges`, used by `step2_build_graph.py` and `make_fixtures.py`), not by eye.
- `district_blocks.geojson` / `district_blocks_hours.json` **must** be an exact union of every `by_school/*` — no duplicate `block_id`, and no block that exists per-school but is missing from the merge. Both are written in `pipeline/step5_export.py` from the same objects as the per-school files, so parity holds by construction.
- The frontend derives `temp_label` (the `NN.N°C` string for the FR-23 map label) client-side from `mean_c` — `applyHourClass` stamps it onto in-memory block features; that property **never** exists in the data files.
- If the schema above changes, `pipeline/make_fixtures.py` is updated in the same commit.
- FR-5 (hazardous-walking petition button) is built in `web/src/lib/petition.ts`. It refuses to build text (`null`) for non-red blocks and for a `block_id` whose state FIPS code has no statute-citation entry — Arizona is deliberately excluded (PRD §5.5).
