# Methodology

How HeatWalk turns temperature into a bus-eligibility decision. Every number on this site is read from a file in `data/out/`. Nothing on screen is recomputed or estimated in the browser.

---

## 1. The heat dose formula

For each edge of the walking network:

```
dose = max(temp_c − baseline_c, 0) × (length_m / walk_speed_mps) / 60
```

The result is in °C·minutes: how long a child spends above the baseline temperature, weighted by how far above it they are.

Two properties matter.

**The clamp at zero.** Dijkstra cannot route on negative weights, and a cool segment must never earn a credit that lets a longer route win.

**Walking speed is one constant for every child**, 1.2 m/s.

Routing runs twice over the same graph: once weighted by raw distance, once by `dose + λ × length_m`. λ is a detour penalty — without it the "coolest" route wanders. One λ per school, held constant across all hours, so the drawn route never changes for reasons unrelated to heat.

---

## 2. Parameters in use

| Parameter            | Value                                                     | Scope             |
| -------------------- | --------------------------------------------------------- | ----------------- |
| Baseline temperature | 33.0 °C (91.4 °F)                                         | Global            |
| Dose threshold       | 110 °C·min — about 12 minutes walking at 42 °C (107.6 °F) | Global            |
| Walking speed        | 1.2 m/s                                                   | Global            |
| Detour cap           | 1.4 × shortest distance                                   | Global            |
| Canonical hour       | 15:00                                                     | Derived from data |
| Hours pulled         | 07:00 to 16:00, ten slices, every hour                    | Per tile          |
| Modeled day          | 2023-08-08                                                | Per tile          |
| Detour penalty λ     | _read live from the selected school's_ `temps.json`       | Per school        |

### Why these values

**Baseline 33.0 °C (91.4 °F)** comes from Lanza et al. (2023), which identifies 33 °C as the behavioural turning point for children in heat. It is a documented choice, not a natural constant.

**The dose threshold of 110 °C·min is a calibration, not an existing safety standard.** No published threshold exists in °C·minutes. 110 was selected as the value that produced a non-degenerate three-category distribution, and it has not been moved since. It was not lowered to fill the yellow category when yellow came back empty, and not raised when the red share shifted as coverage grew. Where the distribution changed, the cause is documented below — never a threshold adjustment.

**The canonical hour is derived from the data, not hardcoded.** The pipeline computes a road-length-weighted mean air temperature for each of the ten hours across the whole street network and takes the highest.

| Hour | 07:00 | 08:00 | 09:00 | 10:00 | 11:00 | 12:00 | 13:00 | 14:00 | 15:00    | 16:00 |
| ---- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | -------- | ----- |
| °C   | 28.4  | 29.8  | 31.9  | 33.5  | 34.0  | 35.6  | 35.7  | 36.3  | **37.4** | 37.2  |

Classification uses 15:00 — the worst defensible case in a school day, chosen by the data rather than by argument.

**λ is calibrated per school**, as the smallest candidate from `[0, 0.005, 0.02, 0.05, 0.2, 1.0]` that keeps every route within 1.4× the shortest distance at **every** hour, not only the canonical one. Testing only the canonical hour was an early bug: between 07:00 and 09:00 the entire AOI sits below baseline, every dose is zero, and Dijkstra over a uniformly zero weight returns an arbitrary path — one school measured a 2.888× detour at 07:00. Testing across all hours removes it. At the canonical hour the correction changed no classification.

---

## 3. Where the temperature comes from

FortyGuard `POST /v1/heatmap`, `analytic_type=tcm`, 60 m granularity, one call per hour per tile.

**`tcm` is 2 m ambient air temperature, not surface temperature.** Verified against a METAR reading at Phoenix Sky Harbor at the same local hour: `tcm` 41.83 °C against 43.89 °C observed, a difference of −2.06 °C — inside the ±3 °C air-temperature criterion, and nowhere near the ≥ +8 °C offset a surface product would show. The check was run in Phoenix during site selection, before the demo city moved to Florida. What it establishes is what the metric measures, which is not location-specific.

Four API behaviours found by testing and applied throughout the pipeline:

- **`-999` is a legacy null.** It is masked to NaN before any statistic is computed. Left in, it would corrupt every mean silently.
- **A `start_time` with a non-`:00` minute returns `Completed` with zero cells.** An empty success, not an error. Every slice is on the hour, and the client raises rather than accepting an empty response as data.
- **A heatmap call costs a flat 4,220 credits** regardless of area or granularity — verified across requests whose cell counts differed by 48×. So every call requests the full permitted box at the finest granularity; asking for less costs the same.
- **At 60 m, each cell reports minimum, average and maximum as the same number.** Peak temperature therefore cannot come from the API. It is computed as the maximum across the cells an edge crosses.

Edge temperatures are sampled roughly every 20 m along the original street geometry, before simplification. The median street segment here is 45.4 m — shorter than one 60 m cell — so an edge's peak often equals its mean. That is correct at this resolution, not a sampling failure.

---

## 4. Classification

At the canonical hour, for each populated census block:

| Category               | Rule                                                       |
| ---------------------- | ---------------------------------------------------------- |
| Safe to walk           | The shortest route is already under the threshold          |
| Route choice is enough | The shortest route exceeds it, but a cooler route does not |
| Bus recommended        | Even the coolest available route exceeds it                |

The third category is the product's actual claim: not that a better street exists, but that none does. Each block also stores the last hour before its coolest route crosses the threshold, which is what produces the "safe if they leave before ..." line.

Blocks are assigned to the nearest analyzed school. Real attendance boundaries were not usable — the district's ArcGIS portal blocks automated access, and NCES no longer publishes school attendance boundaries as a service — so nearest-school is a documented fallback and the largest single source of error on this page. Coverage of 42 analyzed schools brings 98.9% of blocks inside the policy radius of the school they are assigned to; at six schools it was 27.2%, which inflated distances and therefore doses. That change came from adding schools, not from touching any parameter.

---

## 5. What we measured

**Time of day matters far more than route choice.** Length-weighted mean air temperature across the network rises 8.97 °C (16.2 °F) between 07:00 and 15:00. Spatial contrast within the AOI at any single hour is roughly 1.8 °C. When a child walks home is a much larger lever than which street they take.

**Route choice buys very little, and that is reported as measured.** Comparing the coolest route against the shortest at the canonical hour, the difference in mean route temperature ranges from 0.00 °C down to −0.75 °C. For most origin–school pairs the coolest route _is_ the shortest route: there is no cooler alternative to find. Shade maps and surface-temperature maps imply a much larger benefit; measured 2 m air temperature does not support it. This is why HeatWalk's recommendation is a change of mode — walk to bus — rather than a change of street.

**The yellow category is thin by construction.** Yellow requires the shortest and coolest doses to fall on opposite sides of the threshold. When both routes are the same path, no threshold value can separate them. Yellow was empty in the initial six-school run and remains small at 42 schools. The threshold was never moved to fill it.

**The defensible radius is far below the policy radius.** The district applies a uniform 2.0 mile walk radius across all grade levels. The dose-equivalent radius — the furthest distance whose coolest route is still under the threshold at the canonical hour — is well under half of that at every school analyzed. Per-school figures appear in the district panel, read from `summary.json`.

**Exceedance days are a hybrid, not a measurement.** Days per school year above the threshold combine the hourly ASOS record at Orlando International (2019–2025, 2,130 school-calendar days) with a per-block spatial offset derived from FortyGuard on the modeled day. It assumes that offset is stable from day to day, and that assumption is not tested. No additional FortyGuard calls were made for it.

---

## 6. Estimating how many children

Student addresses are protected under FERPA and will never be available to anyone building a tool like this. Everything below is public data, pulled directly from the agencies that publish it. None of it is synthetic, sampled, or carried over from a fixture.

**Block geometry and population.** Census block boundaries and their 2020 populations come from the Census Bureau's TIGERweb service, queried against the study area — 3,198 blocks spanning 20 tracts. These are real 2020 Census blocks with their real GEOIDs, the same identifiers that appear in the exported reclassification list.

**Children per block.** Pulled live from the Census Bureau API: 2020 Decennial DHC table P12, six variables covering ages 5–9, 10–14 and 15–17 for both sexes, one request per tract, cached to disk. Income and poverty context come from ACS 2022 5-year B19013 at block-group level and B17001 at tract level. Poverty is suppressed by the Census Bureau at block-group level across this whole area, so it is read at the coarser tract level — a granularity limit, not a gap that was filled with a guess.

**Grade-range reallocation.** A block does not send every child aged 5–17 to the same school. The census five-year brackets are reallocated into real grade ranges before assignment — elementary takes all of 5–9 plus a fifth of 10–14, middle takes three-fifths of 10–14, high takes a fifth of 10–14 plus all of 15–17, assuming a uniform distribution within each bracket. An earlier version skipped this and pushed all 5–17 to the nearest school, which inflated elementary denominators with teenagers who would never attend there.

**Calibration to official enrollment.** The dasymetric estimate is scaled to the enrollment each school actually reports to NCES:

```
correction_factor = NCES enrollment / dasymetric estimate
```

with the denominator restricted to blocks inside that school's own policy radius.

**What "students in walk zone" means.** It is the calibrated child count of every block whose distance to the assigned school is within the policy radius. It is purely geometric — distance against a published radius — so it does not move when the hour slider moves, and it does not depend on temperature at all. The heat-dependent figures are the two misclassification rows beneath it, and those do change by hour.

12 of 42 schools land outside the 0.3–3.0 sanity band, and the pattern is not random: every high school and most middle schools in the area come out too high, while charter and alternative programs come out too low. Secondary catchments are geographically much larger than elementary ones, so a nearest-school estimate systematically undercounts their denominators; lottery-enrolled schools have no geographic catchment at all. Factors are published as computed rather than clipped into the band.

---

## 7. Today's conditions

The routes a parent sees are re-weighted against current temperature. One heatmap call covers a 5 km × 5 km tile centred on the selected school at the current local hour, and the returned grid is sampled cell by cell along each street segment in the browser, using the same 20 m spacing as the offline pipeline. The API key stays server-side; the browser only ever talks to a read-only function. Responses are cached for an hour, so repeat visitors in the same hour cost nothing. Streets outside that tile fall back to the modeled day.

Classification, the "safe until" hour, and every district-level number stay on the modeled day, 2023-08-08, and are labelled as such. Those numbers have to stay reproducible; they cannot shift because today happens to be mild.

---

## 8. What this page does not contain

This is the summary. The full record — every hourly curve, every school's calibration table, every gate outcome, every bug found and what it changed — lives in `docs/METHODOLOGY.md` in the repository, written as the work happened rather than after it.

---

## Sources and citations

**Scientific**

- Lanza K, et al. "Heat-Resilient Schoolyards: Access to Playgrounds and Shade." _J Phys Act Health_ 2023;20(2):134–141 — source of the 33 °C baseline.
- Meng Y, et al. "Investigation of heat stress on urban roadways for commuting children." _Urban Climate_ 2023;49:101564 — precedent for the °C·minute dose unit.
- Arizona Department of Health Services, _Managing Extreme Heat Recommendations for Schools_, 2021.

**Legal**

- Florida Statute §1006.21 — Transportation of public school students.
- Florida Statute §1006.23 — Hazardous walking conditions.
- Orange County Public Schools Transportation FAQs — source of the 2.0 mile walk radius and the policy citation. The underlying board policy PDF could not be retrieved; the FAQ is used in its place.

**Data and APIs**

- FortyGuard Temperature API — `tcm` heatmap, 60 m, hourly.
- Iowa Environmental Mesonet ASOS, Iowa State University — METAR ground truth and the Orlando MCO hourly record.
- NCES EDGE — school locations, grade levels and enrollment.
- US Census Bureau — TIGERweb 2020 block geometry, 2020 DHC table P12, ACS 2022 5-year B19013 and B17001.
- OpenStreetMap via OSMnx — pedestrian street network.
- OpenFreeMap — basemap vector tiles, data from OpenStreetMap.
