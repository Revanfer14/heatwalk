# Product Requirements Document — HeatWalk

|                           |                                                                                                           |
| ------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Product name**          | HeatWalk                                                                                                  |
| **Tagline**               | Walk zones drawn by heat, not distance                                                                    |
| **Context**               | FortyGuard Hackathon '26                                                                                  |
| **Submission track**      | Primary: Track 01 (Resilient Cities & Infrastructure) · Secondary: Track 07 (Data Analysis & Correlation) |
| **Required deliverables** | Working software prototype · Pitch presentation · Demo video                                              |
| **Deadline**              | August 30, 2026, 23:59 GST                                                                                |

---

## 1. Summary

### 1.1 Product

HeatWalk replaces the impedance function used to compute school walk zones — swapping **distance** for **cumulative heat dose (°C·minutes)** — using FortyGuard's 60m-resolution 2m-AGL air temperature as the weight on the pedestrian street network.

From that one dose-weighted graph come two things — and only two things:

**Mode 1 — District view (Transportation Director)**
A per-school zone map: which blocks are safe to walk, which just need a different route, which are recommended for the bus. Plus a reclassification list that can be brought to a school board meeting.

**Mode 2 — Address check (Parent / Student)**
Enter a home address + school → several walking route options, compared by heat exposure, not just distance.

Two modes, one engine, one shared visual object. Everything in this document serves one of those two; if it doesn't, it isn't part of the product.

### 1.2 The problem

US school districts decide who rides the bus and who walks by drawing a radius circle from the school — typically 1 mile for elementary, 1.5 miles for middle school, 2 miles for high school. That circle is purely geometric and accounts for zero heat.

As a result, two children the same distance from school get the same decision, even if one walks under tree canopy and the other crosses an open asphalt parking lot.

The consequence lands on two different parties:

| Party                   | Consequence                                                                   |
| ----------------------- | ----------------------------------------------------------------------------- |
| Transportation Director | Has no measurable basis for putting a thermally dangerous route on a bus      |
| Parents & students      | Their child still has to walk, with no information about which route is safer |

HeatWalk serves both from the same underlying calculation.

### 1.3 Key context: the legal mechanism already exists

This is the most important reframing in this document. HeatWalk isn't proposing new policy — it's filling a missing input into policy that already runs and is already funded.

Almost every US state has a **"hazardous walking conditions"** provision that lets a district bus a student **inside** the walk zone if the route is judged dangerous:

| State                 | Provision                                                                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Florida               | State funding for K–6 students facing hazardous walking conditions. FY 2019–2020: **19,693 additional bus riders** through this mechanism              |
| New Mexico            | Students of any grade may be transported at a shorter distance than the statutory rule if the local school board determines hazardous conditions exist |
| Utah                  | Local school boards may approve transport in hazardous areas, funded by the board's general fund or a Board Local Levy                                 |
| Texas                 | Districts can receive funding outside the regular transportation allocation for children within a 2-mile radius facing hazardous conditions            |
| Montgomery County, MD | Students facing hazardous walking conditions are entitled to a bus regardless of distance                                                              |

**Every "hazardous" criterion is traffic-based:** traffic volume, speed limit, number of lanes, presence of traffic control devices, path surface width (Florida: hazardous if under 4 feet).

**Heat is on none of these lists.** Not because anyone decided heat isn't dangerous, but because there has never been a way to measure it per block.

This mechanism also has a **written parent petition** process to the transportation director, running year-round. That's the thread connecting HeatWalk's two modes: the parent mode produces the petition, the district mode processes it.

> **Product position:** Districts already have the legal authority and the funding to bus children inside the walk zone. What's missing is the data to put heat into the definition of "hazardous." That's what HeatWalk provides.

### 1.4 The rule that connects the two modes

> A block enters the bus-reclassification list **only if even its available coolest route still crosses the dose threshold.**

If a safe route still exists, the block isn't recommended for the bus — its parents are pointed to Mode 2 with that route.

This rule makes the two modes arithmetically consistent (one calculation, not two) and answers the single most damaging question at a school board meeting: _"why not just send them a different way?"_ — the answer becomes evidence, not opinion.

An important side effect: this rule makes the reclassification list **shorter**. That sounds like a downside, but it's actually the selling point. A district won't adopt a tool that says "500 kids need a bus." A tool that says "142 kids genuinely have no option, the other 300 just need a different route" is far more likely to get used.

### 1.5 What's actually been measured about air temperature

`tcm` is verified as **ambient air temperature in °C at 2m AGL**, not surface temperature. The physical consequence matters and needs to be understood before reading the rest of this document.

During the day the atmospheric boundary layer is already convectively mixed, so intra-urban air-temperature variation within a 5 km radius is typically only 1–3°C. Eight candidate boxes were tested across two cities with four different physical mechanisms — elevation gradient, irrigation-oasis effect, urban/desert contrast, canopy vs. arterial road. The best spatial contrast found (`orl_pine_hills_n`) was **1.84°C** (p95−p05).

The 15–25°C contrast visible on urban heat maps is **surface** temperature, and that's what nearly all prior art in §1.9B maps.

> If any AOI produces a spatial contrast >10°C in `tcm`, that's an alarm that `tcm` isn't air temperature.

**Product consequence:** the exposure difference between two realistic routes is expected to be small — in the 0.5–0.8°C range. That number is **reported as-is** in the FR-4 panel and in `docs/METHODOLOGY.md`. No calibration is done to inflate it, and no gate depends on it.

This actually sharpens the premise. Not _"some routes are hot, pick the cool one,"_ but:

> **Some blocks have no safe route at all.**

That's a much harder argument to dismiss at a school board meeting, and it automatically separates HeatWalk from the "cool route planner" pool of concern raised in §1.9.

**What this finding does not touch:** the FR-8 red category depends on **absolute dose**, not route-to-route contrast. The legal mechanism in §1.3 doesn't depend on any of this data. The misclassification counts depend on the threshold, not on a delta. FR-16 depends on the layer's existence, not the size of the delta. And the FR-5 petition button only gets stronger.

#### The three axes of contrast the product uses

All three come from FortyGuard, so the "API is central" criterion doesn't weaken.

**Axis 1 — absolute dose.** What determines a block's classification isn't the difference between places, but whether a route's total exposure crosses the threshold. This carries Mode 1.

**Axis 2 — duration × circuity.** Dose = excess temperature × travel time. A block with a 0.9 mi straight-line distance but a 1.4 mi network distance receives ~55% more dose at identical temperature. The official radius circle is completely blind to this. Output: the **dose-equivalent radius** (FR-18) — _"on an August afternoon, the defensible radius for an elementary school is 0.42 mi, not 1.0 mi."_

**Axis 3 — exceedance.** The threshold is nonlinear. Two blocks 1.8°C apart at a 40°C threshold can differ by dozens of days crossing the threshold per school year — a small temperature difference becomes a large day-count difference. This is exactly why the above-baseline dose unit was chosen from the start.

The cheapest way to get this: **don't pull 180 heatmaps.** Take the daily distribution from a station record (Iowa Environmental Mesonet ASOS, hourly since 2019, free), then use FortyGuard as a **per-block spatial offset** against that station. FortyGuard remains the only source that can provide a per-block 60m offset.

### 1.6 Time: hourly data, not two buttons

The pipeline pulls **one slice per hour across the school day** — 07:00 to 16:00 — for each tile. Non-`:00` minutes silently return zero tiles; this is verified, and not something to forget when adding a new slice.

The reasoning is simple: children don't go home at two uniform hours. Some are dismissed at 14:45, some stay for activities until 16:00, some leave at 11:00 for an early-dismissal day. A product with just two buttons forces a parent to pick an hour that isn't their child's hour.

So Mode 2 behaves like an ordinary map app: **pick a school, pick an hour, the route appears.** The route shown is the coolest route at that hour — and the path can differ between hours, because the per-edge dose weight genuinely changes.

**Zone classification (Mode 1) uses one canonical hour: the hottest hour of the school day**, derived from data (the hour with the highest AOI-wide mean temperature), not hardcoded. This is the worst-case scenario defensible at a school board meeting without having to explain why a particular hour was picked.

**Trade-off to keep in mind:** time resolution and coverage area compete for the same credit and fetch-time budget (§5.1). The actual product uses full-hour coverage for its core tile; if coverage is ever extended further, an edge tile could drop to fewer slices, and that would be documented in `docs/METHODOLOGY.md`, not glossed over.

The dose used for classification is a single one-way trip. Children walk both directions every school day, so real exposure is the sum of morning + afternoon — this product's numbers are an **under-estimate**, not an over-estimate. An under-estimate is the safe direction for a recommendation that touches public budgets, and it's stated openly in `docs/METHODOLOGY.md`.

### 1.7 Product goals

| #      | Goal                                                              | Success measure                                                                                 | Nature        |
| ------ | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------- |
| **G1** | Prove that some blocks genuinely have no option                   | Number of blocks where the coolest route still crosses the threshold. **At least 1**            | 🚩 Gate       |
| G2     | Prove the policy radius isn't thermally defensible                | Dose-equivalent radius vs. policy radius, in miles                                              | Reported      |
| G3     | Quantify the exposure a bus decision eliminates                   | °C·minutes per child per day and per school year eliminated                                     | Reported      |
| G4     | Quantify misclassified students                                   | Absolute number + percentage per school, calibrated to CCD enrollment                           | Reported      |
| G5     | Produce a walk-zone boundary meaningfully different from a circle | Area difference between the circle and the dose zone                                            | Reported      |
| G6     | Prove FortyGuard is central, not peripheral                       | Pull-the-API demo: zones collapse to a circle, coolest route collapses to the shortest route    | Demonstration |
| G7     | Measure how much hour-of-day affects exposure on the same route   | Dose curve per hour across the school day; coolest-vs-hottest-hour delta in °C and °F           | Reported      |
| G8     | Measure how much route choice affects exposure                    | °C and % dose difference between the shortest and coolest route. Expected 0.5–0.8°C (§1.5)      | Reported      |
| G9     | Prove a small spatial difference still has a large consequence    | Range of exceedance across blocks, days per school year                                         | Reported      |
| G10    | Prove the pipeline is district-agnostic                           | Pipeline runs fully on a second AOI (Phoenix) with zero lines of code changed, only `config.py` | Demonstration |
| G11    | Prove coverage isn't an architectural limit                       | Number of schools with a full zone. Adding coverage = adding a `TILES` entry, zero new code     | Demonstration |

**Only G1 is a gate.** Everything else is computed and reported as-is, even when the number is small. There's no magnitude threshold that halts work, and no parameter is shifted to make a number look bigger. Reason in §1.5: a small number on G8 isn't a product failure, it's part of the argument.

### 1.8 Non-goals

- ❌ **Bus route optimization / vehicle routing.** A child on the bus is in an air-conditioned room — their heat exposure is zero. 60m temperature data adds nothing to that decision, and judges will immediately ask why this needs FortyGuard at all. What's hot is the walk from home to the stop, not the bus itself
- ❌ Turn-by-turn navigation or sidewalk-side recommendations — 60m resolution doesn't support it
- ❌ Indoor temperature prediction
- ❌ Claiming WBGT — no wind speed & globe temperature
- ❌ **Multi-city analysis.** Full analysis coverage targets all of OCPS via tile mosaicking (§5.6). Other cities are **not** analyzed. Every US school still appears on the map as an NCES pin (FR-20), with zero numbers attached — a pin's presence is not a claim of analysis. The Phoenix AOI is run pipeline-only as proof of portability (G10) and is not part of the UI (§5.5)
- ❌ **User authentication, roles, and a persistent database.** Submission form field 12 requires the live demo be open in an incognito window **with no login and no install**, and organizers state they will check this themselves. A login gate in front of the product isn't just added risk — it fails the submission requirement outright. The two modes are split via routes (`/` and `/district`) plus one header switch, not accounts. Nothing needs to be stored: the entire pipeline output is already committed static files

### 1.9 Competitive landscape

#### A. School transportation software (incumbents)

Established industry: **Transfinder**, **Tyler Technologies Versatrans/Traversa**, **EDULOG** (school-first); Optibus, Trapeze, Remix (transit-first).

Real pricing: districts under 5,000 students pay $4,000–$12,000/year; mid-size districts $15,000–$50,000; Loudoun County Public Schools pays **$592,000/year**.

Versatrans's map **already has a "hazardous zones and streets" layer** — it just has no data to fill it with heat.

**HeatWalk's position — complementary, not a competitor.** Their software _executes_ a decision (builds an optimal route once eligibility is known). HeatWalk _produces the input_ for that decision.

→ Product consequence: CSV/GeoJSON export (FR-14) isn't a nice-to-have, it's a **strategic integration point** into infrastructure districts already use.

#### B. Research prior art

| Name                                        | Party                                                       | Difference from HeatWalk                                                          |
| ------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------- |
| "School Routes Aren't the Coolest" (Austin) | American Forests + UCLA Luskin + ASU SHaDE Lab + Austin ISD | Maps **modeled shade** (LiDAR + sun geometry), output is an educational story map |
| "Thermal Walkability" / Cool Routes         | Khan, Buo & Middel (ASU)                                    | SOLWEIG model, hourly MRT, output is an academic index                            |
| Heat Factor                                 | First Street Foundation                                     | Per-property score, coarse resolution, for home buyers                            |
| Temperature Dashboard®                      | FortyGuard itself                                           | Not to be rebuilt — this is the vendor's own product                              |

**HeatWalk's delta:**

1. **Measured** 2m AGL air temperature, not modeled shade
2. Output is an **administrative decision** — dose-equivalent radius and a reclassification list — not a map to look at
3. None of the above computes a misclassified-student count
4. Every prior art above maps **shade or surface temperature**, and from that implies route choice carries a large benefit. HeatWalk measures **air temperature** and finds that benefit is small (§1.5) — then reports it, rather than hiding it

⚠️ **A cool route planner is the exact example organizers wrote themselves for Track 01.** This pool will be crowded. HeatWalk's differentiation isn't the route, it's the legal mechanism, the persona with real stakes, and the causal rule in §1.4. This has to be explicit in the pitch's first minute, not assumed to be self-evident.

### 1.10 Mapping to official judging criteria

Organizers' criteria: _"Real use of the platform (the API or Dashboard is central, not decorative); a clear problem and user; a measurable outcome (e.g. −7°F (−4°C) on this route); and a path to real-world deployment. Judges reward applied relevance over flashy demos."_

| Criterion                       | Evidence in the product                                                                                                                                                                                       |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **API central, not decorative** | The "hide heat data" button (FR-16): zones collapse to a circle, the coolest route collapses to the shortest route, the product reverts to the status quo                                                     |
| **Clear problem & user**        | Two personas, two real decisions, one legal mechanism that's already in force                                                                                                                                 |
| **Measurable outcome**          | G2 dose-equivalent radius vs. policy radius · G3 °C·minutes eliminated · G7 hour-to-hour delta · G9 exceedance range. The route panel (FR-4) uses the exact °C and °F format from the organizers' own example |
| **Path to deployment**          | The legal mechanism + state funding + receiving software all already exist (§1.3, §1.9A)                                                                                                                      |

**Effort allocation.** The line _"judges reward applied relevance over flashy demos"_ is an explicit priority instruction:

| Prioritize                            | Cut first                                  |
| ------------------------------------- | ------------------------------------------ |
| Calibration of enrollment against CCD | Zone transition animations                 |
| Methodology page                      | Pretty map styling                         |
| A CSV export that's actually usable   | A perfectly smooth time slider             |
| Verifiable numbers                    | Hover effects, microinteractions           |
| Reporting small findings openly       | Hiding them to make the demo look smoother |

---

## 2. Target users

### 2.1 Primary A — Transportation Director (Mode 1)

|                         |                                                                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Title**               | Transportation Director / Coordinator at a school district                                                                    |
| **Context**             | Manages a bus fleet for many schools within one district                                                                      |
| **Decision**            | Determines which students are bus-eligible each year; processes hazardous-walking petitions from parents year-round           |
| **Current tool**        | District GIS map + a written radius rule                                                                                      |
| **Pain point**          | No way to know which route is thermally dangerous; a decision can only be defended with "per the distance rule"               |
| **Needs from HeatWalk** | A per-school zone map + a list of blocks recommended for the bus, with evidence that can be brought to a school board meeting |

### 2.2 Primary B — Parent / Student (Mode 2)

|                         |                                                                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Context**             | Their child is inside the walk zone and doesn't get a bus                                                                          |
| **Frequency**           | Daily during the hot season; sharply higher during a heat wave                                                                     |
| **Decision**            | Which route their child takes each day; whether to file a hazardous-walking petition                                               |
| **Current tool**        | None. Google Maps gives the shortest route, with no heat information                                                               |
| **Needs from HeatWalk** | Concrete route options with their exposure, or — if no safe route exists — a written basis for filing a petition with the district |

This persona is the product's only daily use case, and it feeds Mode 1 through the written-petition flow. Without Mode 2, HeatWalk would only be used once a year.

### 2.3 Design focus warning

The biggest temptation: designing for every persona at once. **Design for 2.1 and 2.2 only.** Both share one engine, one map, and one shared visual object (the coolest route) — that's what makes this one product, not two apps forced together.

A third persona was considered early on — a Facilities/Parks planner using a ranked street-segment table to prioritize shade and tree-planting budget — but the feature it depended on (a segment priority table and its map highlight) was never built into the frontend; see the removed-features note under FR-15/FR-24. This persona has no product surface today.

---

## 3. User stories

### Mode 2 — Parent / Student (P0)

| ID    | As a   | I want                                                                  | So that                                                                         |
| ----- | ------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| US-01 | Parent | to enter my home address and school name                                | I know whether my child gets a bus or not                                       |
| US-02 | Parent | to see the shortest route and the coolest route side by side on the map | I know which path my child should take                                          |
| US-03 | Parent | to see the difference in °C and °F                                      | I understand how big the difference is without needing to understand °C·minutes |
| US-04 | Parent | to be told when **no** safe route exists                                | I know the problem isn't my choice of route                                     |
| US-05 | Parent | to copy a petition-basis text                                           | I can file a hazardous-walking petition with the district                       |

### Mode 1 — Transportation Director (P0)

| ID    | As a     | I want                                                       | So that                                                     |
| ----- | -------- | ------------------------------------------------------------ | ----------------------------------------------------------- |
| US-06 | Director | to click a school on the map                                 | I see its walk zone re-evaluated based on heat              |
| US-07 | Director | to see the official circle and the heat-dose zone overlaid   | I understand how far off today's rule is                    |
| US-08 | Director | to see blocks split into three categories                    | I immediately know which areas need action, and what action |
| US-09 | Director | to click a block and see "why"                               | I see the failing coolest route as visual evidence          |
| US-10 | Director | to see the total number of misclassified students per school | I have one number to bring to a budget meeting              |

### P1 — Highly desired

| ID    | As a     | I want                                                         | So that                                                                  |
| ----- | -------- | -------------------------------------------------------------- | ------------------------------------------------------------------------ |
| US-11 | Director | to download the reclassification list as CSV/GeoJSON           | I can bring it into the Transfinder/Versatrans the district already uses |
| US-12 | Parent   | to drag the slider to my child's actual dismissal hour         | the numbers match my child's actual situation, not an average hour       |
| US-15 | Parent   | to see a route based on today's temperature, not the model day | I know the route is relevant right now                                   |

---

## 4. Functional requirements

### Mode 2 — Address check (default entry point)

#### FR-1 — Address + school input _(P0)_

- One address input (geocoding) + one school input, both search-style with live suggestions — mirroring "usual map" patterns (2026-08-28 amendment, Revan)
- **Origin:** typing triggers live Nominatim suggestions (debounced, up to 5 results); clicking a suggestion or pressing Enter moves the pin. The example-address chip is removed from the production panel — no longer needed once live suggestions exist
- **Destination:** a search input that **restricts choices to the school list within the AOI** — typing filters matching school names live; only clicking a result changes the selected school. Text matching nothing reverts to the last-selected school when the field loses focus — the user can never get "stuck" on an invalid school
- The pin can be dragged on the map as an alternative to text input
- The AOI boundary is shown as a soft outline; clicking outside it → "This area hasn't been mapped yet"
- ⚠️ **Don't use `navigator.geolocation` for the demo** — the developer's location isn't in the US. Use a draggable pin, defaulting to the AOI center

#### FR-2 — Status determination _(P0)_

The first output is always one status sentence:

```
Your home is 1.1 mi from Lincoln Elementary — inside the walk zone.
```

#### FR-3 — Route rendering on the map _(P0)_

- The coolest route is drawn on the map from precomputed `graph.json` + `temps.json`, **with no runtime API call**
- **Built state differs from the original spec:** the shortest route is still computed (`routeSolver.ts`) and shown as a comparison column in the FR-4 table, but it is no longer drawn on the map or selectable as a card — see the FR-30 amendment below. What's drawn on the map today is the coolest route plus up to two alternates (FR-30)

#### FR-4 — Route comparison panel _(P0)_

This is Mode 2's main panel. It compares **route options** at the currently selected hour:

```
Your home → Lincoln Elementary      Departing 15:00  ◀ ▶

              Shortest      Coolest      Difference
Distance      1.42 km       1.68 km      +260 m
Time          20 min        23 min       +3 min
Mean temp     41.2°C        40.5°C       −0.7°C  (−1.3°F)
Peak temp     44.0°C        42.9°C       −1.1°C  (−2.0°F)
Heat dose     503 °C·min    468 °C·min   −7%
```

The temperature row **must show °C and °F**. This is exactly the format organizers use in the judging criteria, and a US school-district audience thinks in °F.

**Numbers must never be inflated.** If the difference really is −0.7°C, write −0.7°C. This panel is itself evidence for the product's argument: route choice isn't the fix, and that's exactly why some children need a bus.

#### FR-5 — The "no safe route" case _(P0)_

When even the coolest route crosses the threshold:

```
Even the coolest route averages 41.2°C.
Your block qualifies for a bus recommendation.

[Copy as a hazardous-walking petition basis]
```

The copy button produces paste-ready text with the address, school, the coolest route's mean and peak temperature, the °C·minute dose, and a citation to the applicable state provision.

This is the link into Mode 1: the petition generated here is the input processed there.

### Mode 1 — District view

#### FR-6 — School selection _(P0)_

The map shows pins for every NCES school (FR-20). Clicking an analyzed school's pin loads that school's graph and blocks on demand, then renders the analysis. The panel shows name, level, total enrollment (NCES CCD), the applicable walk-zone rule, and the dose-equivalent radius (FR-18).

The school list in the left column is searchable and filterable to "analyzed only." At a scale of hundreds of schools, the list is the primary navigation path, not the map — and it doubles as a screen-reader-readable equivalent path (`DESIGN.md` §Accessibility).

**2026-08-28 amendment (Revan): Mode 1 school selection is now a focus cycle.** Clicking an analyzed pin (or a list row) focuses that school: every other school pin — analyzed or not — disappears from the map, leaving only the zone + blocks + the focused school's pin, so the map isn't noisy while one school is being read. Exit focus via the panel's back button (returns to the school list) or by clicking the same pin again. When unfocused, all pins reappear and no zone is rendered; Mode 1 no longer locks onto one preselected school on boot.

#### FR-7 — Dual-boundary rendering _(P0)_

- **Layer A:** the official walk-zone circle — dashed line, no fill
- **Layer B:** the heat-dose zone — a filled census-block choropleth

Both show by default; each can be toggled independently.

Visual note: because the engine is graph-based (§6), Layer B is blocky per block, not a smooth blob. This is deliberate and more honest — the data really is per block.

#### FR-8 — Three-zone classification _(P0)_

| Zone                | Color  | Definition                                                                    |
| ------------------- | ------ | ----------------------------------------------------------------------------- |
| Safe to walk        | Green  | The shortest route is already under the threshold                             |
| Needs route choice  | Yellow | The shortest route crosses the threshold, **but a safe coolest route exists** |
| Recommended for bus | Red    | **Even the coolest route crosses the threshold**                              |

The yellow category separates a free-to-fix problem (a different route) from a budget problem (a bus). This is what makes HeatWalk's recommendation fiscally credible.

**Threshold:** derived from Lanza et al. (2023), which identifies 33°C as the behavioral turning point for children. The dose threshold is computed as accumulated °C·minutes above baseline along the path, at the **canonical hour** (§1.6) — the hottest hour of the school day, derived from data. **The exact value is a calibration, documented as an adjustable parameter — see `pipeline/config.py:THRESHOLD_DOSE_C_MIN` and `docs/METHODOLOGY.md`.**

Consequence of §1.5: the yellow category holds fewer blocks than intuition suggests, because the route-to-route difference is small. The actual distribution is reported as-is; **the threshold is never shifted to artificially populate the yellow category.**

#### FR-9 — Block detail panel _(P0)_

Clicking a block shows a panel with:

- Estimated number of school-age children in the block
- **The coolest route's mean & peak temperature (°C and °F)** — shown more prominently than °C·minutes
- Shortest-route vs. coolest-route dose
- Delta against the nearest green block at an equivalent distance (°C)
- Current classification status + recommended change
- Exceedance days per school year (FR-19)

#### FR-10 — "See why" _(Removed 2026-08-28)_

Originally specified as: clicking a red block draws its failing coolest route on the map, with the highest-dose-contributing segment highlighted.

**Removed.** Mode 1 no longer renders any route on the map at all — the district view is now purely zones: the policy circle, the dose choropleth, and the dose-equivalent radius circle. Per-block quantitative evidence remains fully intact in the block detail panel (FR-9) from pipeline-precomputed numbers (`shortest`/`coolest` per block); only the map route line and the client code that computed it in Mode 1 were removed. Visual route proof still lives in Mode 2 (FR-3).

#### FR-11 — Quantitative outcome panel _(P0)_

Every bus-move recommendation must show the exposure **eliminated**, not just the exposure that exists:

```
Moving 142 children on Maple Ave to a bus eliminates:
  214 °C·minutes per child per day
  ±38,500 °C·minutes per child per school year (180 days)
  Equivalent to removing 43 minutes of walking at 42°C every day
```

The last line is required. °C·minutes isn't intuitive; translating it into "minutes at temperature X" makes it understandable with no explanation needed.

#### FR-12 — School summary _(P0)_

```
Students in walk zone            [n]

Walking, should be bused         [n]  [toggle map highlight]
Gets a bus, doesn't need one     [n]  [toggle map highlight]
```

**2026-08-28 amendment (Revan): the school summary is trimmed to three rows.** Five rows — reroute-enough, no-safe-route, lowest income quartile, policy radius, dose-equivalent radius — were removed from the panel because they buried the two numbers that are the actual _ask_ for the school board. G4 (quantify misclassified students) is still fully satisfied: the two misclassification rows are promoted into map controls instead — a `<Switch>` next to each number turns on a neutral outline (`--ink` over `--bg`, zero new color) that highlights exactly the blocks contributing to that number on the Mode 1 choropleth (`web/src/hooks/useMisclassifiedHighlightLayer.ts`). "No safe route" isn't lost as information — `no_safe_route` is identical to `misclassified.walk_should_bus` in `summary.json` (`pipeline/summary_build.py`), verified equal across all 42 schools. Lowest income quartile and policy radius remain fully available in `summary.json` and the CSV export (FR-14); they just aren't panel rows anymore. Dose-equivalent radius moved to the legend — see the FR-18 amendment.

#### FR-13 — Hour slider _(P0, Mode 1 only)_

Controls the departure hour across the school day, one step per hour from 07:00 to 16:00.

- Mode 1: controls the zone layer. Changing the hour re-renders the choropleth
- Slider changes re-render from precomputed files, **not an API call**

**2026-08-28 amendment (Revan): the slider is removed from Mode 2.** Since FR-29, parent mode always uses the current Orlando hour (`clampToSchoolHour(currentOrlandoHour())`) — mirroring Google/Apple Maps, which doesn't ask the user to manually pick a "departure hour." The FR-4 panel no longer has an hour control; the currently active hour is shown as text ("Now · 15:00") in the live-conditions row (`LiveConditionsRow`), not as a slider. FR-13 is henceforth Mode 1 only.

Available hours are read from `meta.hours` in the data, not hardcoded in the frontend. A tile with only some hours shows only the available steps — never interpolate an hour that wasn't pulled.

⚠️ Non-`:00` minutes return zero tiles from the API. Any new slice must be on a `:00` minute.

#### FR-14 — CSV / GeoJSON export _(P1, built)_

Download the reclassification list with columns: block · estimated children · current status · recommendation · coolest route mean temperature (°C and °F) · dose (°C·minutes) · reason.

This is the integration point into Transfinder/Versatrans/EDULOG, which already have a "hazardous zones and streets" layer. Mention this explicitly in the pitch as the answer to "why not just let an incumbent build this?"

#### FR-15 — Segment priority table _(Never built)_

Originally specified as: a ranked table — street segment name · number of children affected · estimated peak-temperature reduction (°C) · estimated dose reduction (%) if shaded.

**Never built in the frontend.** The pipeline still produces the underlying data (`pipeline/segment_priority.py` → `by_school/<school_id>/segments.json`, see `docs/CONTRACT.md`), but no table or UI consumes it. `SegmentPriorityTable.tsx` and `useSegmentPriority.ts` were removed from `web/src/` early, and this was the first item cut from the dev plan's priority list after animations.

#### FR-18 — Dose-equivalent radius _(P0)_

For each school, compute and display the radius that **should** be used if the criterion were dose instead of distance: the farthest distance from the school whose coolest route is still under the threshold, at the canonical hour (§1.6).

```
Policy radius            1.00 mi
Dose-equivalent radius   0.42 mi   (−58%)
```

Drawn as a third circle on the Mode 1 map. **2026-08-28 amendment (Revan): moved from the school summary panel into the legend.** Since the FR-12 amendment left the summary panel with only three rows, the policy radius and dose-equivalent radius (with the mile figures and percent change) are now read in the §Radius circles section of the map legend (`MapLegendContent.tsx`), still sourced from `summary.json` with no frontend recomputation. The third circle on the map and its layer toggle (`Dose-equivalent radius` in `LayerToggles`) are unchanged.

#### FR-19 — Per-block exceedance _(P1, built)_

How many days per school year a block's coolest route crosses the threshold. Source: the ASOS station's daily distribution combined with a per-block spatial offset from FortyGuard (§1.5, axis 3).

Shown in the block detail panel (FR-9) and the FR-14 export column. This is what carries G9.

#### FR-20 — National school layer _(P0)_

The map renders **every school from the NCES Common Core of Data**, not only analyzed ones. This data is free and doesn't touch FortyGuard credit.

| School status | Rendering            | Click                                             |
| ------------- | -------------------- | ------------------------------------------------- |
| Analyzed      | Full pin, selectable | Loads zone + blocks + route                       |
| Not analyzed  | Small gray pin       | "Not analyzed — this tile hasn't been pulled yet" |

Zooming out shows thousands of schools; zooming in shows which ones already have a zone. Coverage reads visually as **progress**, not as a limit.

**Hard rule:** an unanalyzed school **must not** show any number — not an interpolation, not a regional average, not an estimate. Zero numbers. One fabricated number found by a judge invalidates the "real use of the platform" criterion for the whole submission.

**2026-08-28 amendment (Revan): unanalyzed pins render as locked.** At pin zoom (≥10), unanalyzed pins are dimmed (icon opacity ±0.55) and carry no name label — only analyzed pins are labeled — so the "not yet unlockable" status reads at a glance. Clicking an unanalyzed pin still surfaces the "not analyzed" notice (unchanged), and while a school is focused (FR-6 amendment) every other pin — including unanalyzed ones — disappears.

Source: the NCES CCD school directory (lat/lon, name, level, enrollment, district). Loaded as one separate file and rendered as a MapLibre symbol layer — not DOM markers, which would choke the browser at this volume.

#### FR-21 — Tile coverage indicator _(P1, built as a simplified text line)_

Originally specified as a thin map layer showing pulled-tile boundaries with fetch date and hour slice. **What's actually built** (`TileCoverageInfo.tsx`) is a single caption line — tile id, fetch date, and the fetched hours — not a boundary layer on the map. It answers "where does this data come from" in text rather than visually.

### Cross-mode

#### FR-16 — "Hide heat data" button _(P0)_

One button that returns the product to the status quo:

- Layers B & C disappear → only the official walk-zone circle remains
- The coolest route disappears → only the shortest route remains, now shown neutral and dashed
- Every heat-derived number turns into `—`

Its function is a one-click demonstration of the "API central, not decorative" criterion. Judges see directly what the district has today versus what FortyGuard adds. **The cheapest feature to build with the highest persuasive impact in this whole document.**

#### FR-17 — Forecast refresh _(P1, never built)_

Originally specified as a button that triggers a live call to FortyGuard's 12-hour forecast, proving the pipeline is functional. **Never built** — deliberately, for the same reason stated in the architecture principles (§6.1): an API key must never be bundled into the browser, and this feature would have required exactly that without the serverless proxy FR-29 later introduced for a narrower purpose.

### QA demo feedback, 2026-08-27

The following FRs were born from pre-submission QA. The FR-22 coverage decision and the FR-28 color decision were explicit product decisions by Revan, 2026-08-27.

#### FR-22 — Full zone coverage inside the circle _(P0)_

The interior of both the policy circle **and** the dose-equivalent radius circle in Mode 1 must be fully covered by the zone choropleth — no gray basemap "holes," since a hole reads as "the district doesn't know" when the data actually exists.

Two mechanisms make this work: (1) the pipeline classifies **every** census block intersecting the bbox, including blocks with `POP100 = 0` (previously skipped); an empty block automatically has `kids_est = 0` so it doesn't change the child metrics in `summary.json`; (2) Mode 1 renders the **merged, all-schools** block file (`district_blocks.geojson`), not the per-school file — the per-school file is a nearest-school partition, so a block inside school X's circle that's closer to school Y never showed up in X's view.

Its closure rule (Revan's decision, 2026-08-27): rendering is clipped to the **interior of the selected school's policy circle** — blocks outside that circle (including blocks belonging to other schools that fall outside the selected school's circle) are not rendered at all. Green/red zones only ever appear inside the circle currently being drawn; the clip is computed client-side from block centroid vs. `walk_radius_mi` (`web/src/lib/blocksInsidePolicyCircle.ts`).

Consciously accepted exception, documented in `docs/METHODOLOGY.md`: the portion of the policy circle that falls **outside the heat-data tile's bbox** on the west side stays empty — measured at ±17% of Meadowbrook Middle's circle, ±15% Ridgewood Park Elementary, ±7% UCP Pine Hills Charter, ±1% Maynard Evans High (Rosemont and Rolling Hills fully covered). Closing it would require expanding the bbox and a new API fetch, judged not worth it three days before the deadline.

#### FR-23 — Block temperature label _(P1, built)_

At sufficiently close zoom, each block shows its route's mean-temperature label (e.g. `36.6°C`) at the block's center, updating with the hour slider (from per-hour `blocks_hours`). The label is heat data: fully hidden under FR-16, and uses a `--bg` halo to stay legible over the colored basemap.

#### FR-24 — Top-5 priority segment highlight _(Never built)_

Originally specified as: the top five segments from `segments.json` (existing order: children affected, then peak temperature) rendered persistently on the map with a thick red-category line + rank labels 1–5, with the FR-15 table gaining a rank column and row-click flying the map to that segment. **Never built** — it depended on the FR-15 table, which itself was never built into the frontend.

#### FR-25 — Methodology info button _(Superseded by FR-31)_

Originally specified as a standalone icon button opening `/methodology` directly. Superseded: the control-cluster info icon opens the About dialog (FR-31) instead, which links to `/methodology` from within it. See FR-31.

#### FR-26 — Circle hover description _(Never built)_

Originally specified as: hovering the policy circle (dashed) or the dose-equivalent radius circle (solid) thickens its line and shows an explanatory tooltip — what the circle is, its mileage (from data, not static text), and, for the policy circle, that 2.0 mi is a **district** policy (OCPS, uniform K–12 per FS 1006.23), not a federal rule. **Never built** — no hover/tooltip code exists on either circle layer in the current codebase.

#### FR-27 — Right-side map legend _(P1, built for both modes)_

A floating, collapsible, theme-aware legend on the right side of the map: zone classes + both circles' meaning + the top-5 line (Mode 1, though that line was never built, see FR-24); routes + policy circle (Mode 2). This is a **deliberate exception** to the "zero other floating controls over the map" rule in `DESIGN.md` — the legend was moved above the map so it's always visible when the side panel is collapsed, and `map.setPadding` reserves its width.

**Built as of 2026-08-28:** `MapLegend.tsx` + `MapLegendContent.tsx` cover zone classes, both radius circles, the AOI boundary, and the baseline/threshold row for district mode. **The Mode 2 side is also built**, via `ParentMapLegendContent.tsx` (routes + policy circle), wired into `ParentRoute.tsx` — FR-27 is complete for both modes. The top-5 segment line referenced in the original spec was never built (see FR-24) and isn't part of the legend content.

#### FR-28 — Route temperature color _(Superseded — see current state)_

The original spec called for a per-segment blue→orange temperature ramp on the shortest route and a solid-blue coolest route. Through several 2026-08-28 amendments this was progressively narrowed and then retired:

- Blue was reserved for the coolest route as "the answer," with the ramp on the shortest route showing status-quo exposure.
- With three route cards (FR-30), blue was then restricted to whichever card was selected, to keep selection readable.
- Once routes were removed from Mode 1 entirely and the shortest route was dropped from Mode 2's cards and map (FR-30 amendment), the ramp had nowhere left to display in any mode.

**Current state:** the blue→orange ramp is retired everywhere. The `--route-heat-cool`/`--route-heat-hot` tokens and the client ramp code (`routeRampFeatures`) are removed. The only route color left in the product is `--route-coolest`, applied to whichever route card is selected in Mode 2.

#### FR-29 — Live temperature in Mode 2 _(P1, built)_

Product decision 2026-08-28 (Revan): parent mode calls FortyGuard live for **today's** temperature, instead of relying purely on the 2023-08-08 model day, so routes feel like Google/Apple Maps — relevant today, not historical research.

This is **not** FR-17 rebuilt. FR-17 remains unbuilt for the same reason as before (an API key must never be bundled into the browser). FR-29 solves exactly that problem through one read-only serverless function that holds the API key (§6.1) — not by calling FortyGuard directly from the browser.

Binding constraints:

- **Decoupled from route rendering.** The route always renders from `temps.json` in <1 second as today (FR-3); the live call runs in the background and upgrades the already-shown route once it arrives. The route never waits on FortyGuard's answer.
- **Block classification does not go live.** Red/yellow/green categories, `safe_until_hour`, and all of `summary.json` remain from the model day — gate G1 is computed from that data and must stay reproducible. The panel must explicitly state "modeled day 2023-08-08" for these numbers whenever live temperature is active, so it never silently contradicts an already-live route.
- **The hour follows the current Orlando hour**, clamped to the 07:00–16:00 range the data covers (see the FR-13 amendment — there's no slider control in Mode 2 anymore, this hour is automatic).
- **Fails silently.** A timeout, error, or credit limit keeps the product on the model day — no error state ever blocks the main demo path.

**Built as: per-cell within one tile per school, not one uniform AOI-wide offset.** An early draft of FR-29 planned "one uniform offset for the whole AOI, not per cell" because the full AOI (±58 mi²) far exceeds the 10 mi² limit per `heatmap` call. The shipped design narrows the call's _coverage_, not its _resolution_:

- One `heatmap` call per school per hour, scoped to a 5.0 × 5.0 km tile (±9.65 mi², under the 10 mi² limit) centered on the school point — not the full AOI bbox. `schoolId` is validated server-side against `schools.json`; this is a credit fence, not just convenience, since an arbitrary client-supplied bbox could burn 4,220 credits per request.
- The `heatmap` response (the `map_data.features` cell grid) is gridded server-side (`web/api/_lib/heatmapGrid.ts`, ported from `pipeline/heatmap_raster.py:build_grid`) and sent to the client as a lightweight raster (~35 KB, ~84×84 cells) instead of just a scalar median.
- The client samples that grid along each road edge's geometry (`web/src/lib/edgeLiveTemperatures.ts`, 20 m sample spacing — mirroring `pipeline/edge_sampling.py`), producing `temp_c`/`peak_c` **per edge**, not one offset flattened across the whole graph. Dose is recomputed from those live values through the same `doseCMin()` — the only dose formula in the codebase.
- Edges outside the 5×5 km tile (the fringe of a large school's walk zone) have no live sample and fall back to the model temperature + uniform offset — documented in `docs/METHODOLOGY.md`.
- Since the hour slider is already removed from Mode 2 (FR-13 amendment), only **one** live hour is ever requested per school per day — credit consumption doesn't increase relative to the original FR-29 plan.

#### FR-30 — Multiple route options _(P1, built)_

Product decision 2026-08-28 (Revan): alongside the coolest route (FR-3), Mode 2 shows **up to three routes total** — the coolest route plus up to two alternates.

- Alternates are found via a penalty method: rerun Dijkstra on `weight_cool` with edge weights already used by another accepted route multiplied by `ALTERNATE_PENALTY_FACTOR`, rejecting a candidate that shares more than `MAX_SHARED_LENGTH_RATIO` of its length with an already-accepted route (`web/src/lib/routeAlternatives.ts`).
- **The count can be zero.** G8 already shows ~90% of blocks have a coolest route identical to the shortest route on Orlando's grid network — on those blocks, the alternate-route search genuinely runs out of sufficiently different paths. The panel must render correctly with 2 or 3 cards total; never force a fixed count by loosening the similarity threshold.
- Alternate routes render plain neutral gray (`--ink-subtle`, 2px solid) — see the §Routes amendments in `DESIGN.md`. This isn't a new color; it's consistent with "color only in map/legend/badge" because gray isn't a category color.
- **Selecting any route card** (coolest or alternate) thickens its map line **and** reframes the map view to that route's geometry bounds (`hooks/useRouteFocus.ts`, `map.fitBounds`) — the only way to distinguish routes that happen to share an identical path.
- Alternates also disappear when FR-16 is active, same as the coolest route.

**The shortest route was later removed from cards and from the map entirely.** Revan reported the shortest route was mostly visually redundant with the coolest route (G8 above). The "Shortest route" card and its map line were removed from Mode 2; `ALTERNATE_ROUTE_COUNT` in `web/src/lib/routeAlternatives.ts` went from 1 to 2, so the panel still shows three cards total — coolest + up to two alternates, possibly fewer if the search runs out of distinct paths. FR-3 (shortest route) wasn't removed from the product — `routeSolver.ts` still computes it, and it's still the sole comparison in the FR-4 table (`RouteComparisonPanel`) — it just stopped having a visual representation and stopped being selectable as a card. FR-16's "neutral dashed line" role moved from the shortest route to the coolest route itself — see the §Routes amendments in `DESIGN.md`.

#### FR-31 — About dialog _(P1, built)_

Added 2026-08-28 at Revan's direct request; not part of the original PRD draft, recorded here so it doesn't become code without an FR number (see CLAUDE.md §"When in doubt"). One icon button (`Info`, lucide-react) in the control cluster opens a shadcn/ui `Dialog` containing several short prose sections — the problem being solved (a fixed-distance walk zone knows nothing about heat), why cumulative heat dose replaces it, and what HeatWalk produces (a reclassified block list + per-block evidence) — plus a threshold/baseline section stating the real calibration values, and a link at the bottom to `/methodology`. The dialog closes before navigating to the doc page so the Radix overlay doesn't linger. Rendered in `FloatingControls`, so it appears in both modes. Subsumes FR-25.

**2026-08-29 amendment (Revan): content expanded from three to five sections; the live baseline/threshold row was replaced by prose stating the numbers literally.** `ABOUT_SECTIONS` (`web/src/lib/aboutContent.ts`) is now: The problem (expanded with pediatric CDC/ED evidence and a "commute isn't a choice" argument), **Why Orlando, for now** (the FortyGuard Basic-tier 10 mi²-per-call limit, and the legal reasoning: Florida FS §1006.23 vs. Arizona's distance-only ARS §15-901; the Phoenix AOI is mentioned explicitly as pipeline-portability proof that is deliberately not rendered on the map), Why heat dose (unchanged), What HeatWalk produces (unchanged), **Threshold & baseline** (new — replacing the old live `useSchoolMeta` row, stating `BASELINE_C = 33.0°C` and `THRESHOLD_DOSE_C_MIN = 110.0 °C·min` as literal text along with their origin: Lanza et al. 2023 for the baseline, a 220→110 calibration history for the threshold). `AboutDialog.tsx` no longer calls `useSchoolMeta`/`useAppState` at all — the dialog is now purely presentational. **This is an explicit, Revan-approved exception to CLAUDE.md §2 and §Architecture** ("zero hardcoded numbers in the frontend," "every number in the UI must be traceable to `data/out/`"); as mitigation, both numbers are still read live from `temps.json` in `MethodologyParameters.tsx`, one click away via the Methodology button in the same dialog, so the traceable path isn't lost from the product — it just no longer appears inside About itself.

---

## 5. Data requirements

### 5.1 FortyGuard API

| Endpoint                             | Parameter              | Function in the product                                                                        | Priority |
| ------------------------------------ | ---------------------- | ---------------------------------------------------------------------------------------------- | -------- |
| `POST /v1/heatmap`                   | `tcm`, 60m granularity | **Per-edge dose weight. The single load-bearing dependency — without it, there is no product** | P0       |
| `POST /v1/heatmap`                   | `time_of_measure`      | One slice per hour, 07:00–16:00                                                                | P0       |
| `GET /v1/status/{activity_id}`       | —                      | Polling async jobs. Required — every analysis endpoint is async                                | P0       |
| `POST /v1/heatmap`                   | `exceedance`           | Days per school year a route crosses the threshold                                             | P1       |
| `POST /v1/heatmap`                   | `persistence`          | How long heat persists at a point                                                              | P2       |
| `GET /v1/system/fetch-api-key-usage` | —                      | Keeping trial credit from running out                                                          | Ops      |

**Not used:** Satellite View Segmentation, Street View Segmentation, Heat Intelligence — all Premium-only. `env_params` is skipped: it's unverified whether it returns a grid for the whole AOI or just a single point, and adding an untested dependency isn't a risk worth taking. Consequence: limitation §8 point 2 reads "an air-temperature-based index," not "+ radiation load."

**Basic-tier limits that must be respected:**

- **Maximum 10 mi² per call ≈ 5.1 km × 5.1 km.** This is a per-call limit, **not** a product coverage limit. Coverage is built by **mosaicking many tiles** (§5.6). One elementary school's 1-mile-radius walk zone = 3.14 mi², so one tile holds several full walk zones
- **Flat cost of 4,220 credits per call**, verified with three controlled calls (863 / 309 / 6,642 cells, all three identical). Direct consequence: **never request a small box.** Always request the full 10 mi²
- **Non-`:00` minutes silently return zero tiles.** Every slice must be on a `:00` minute
- Granularity limited to 60/80/100m
- All jobs are async → polling via Check Status is required
- A value of `-999` is a legacy null → **must be handled explicitly**, or statistics silently break
- Forecast horizon 12 hours; historical data available since 2019

**Fetch strategy:** one call per hour per tile, 07:00–16:00, on a hot day from historical data. Results are frozen to disk — **not** continuously fetched. Cache every raw response before processing, and check the cache before calling.

**Time resolution vs. coverage area compete for the same credit:**

| Coverage          | 10 slices/tile | % of budget |
| ----------------- | -------------- | ----------- |
| Wave 1 (1 tile)   | 42,200         | 2.4%        |
| Wave 2 (6 tiles)  | 253,200        | 14%         |
| Wave 3 (30 tiles) | 1,266,000      | 71%         |

Credit is enough for all three, but **fetch time is the real constraint** — 300 polled async calls take hours. The rule applied:

- Waves 1–2: **full hours** (10 slices per tile)
- Wave 3: may drop to **3 slices** (morning, canonical hour, afternoon) per tile, documented in `tiles.json`, not glossed over
- The frontend reads available hours from the data. A sparsely-fetched tile shows fewer slider steps — **never** interpolating a missing hour

**Actual outcome:** the product shipped as a single merged AOI (tile id `orl_ocps_core`, see `docs/METHODOLOGY.md` §Phase 6), reaching 42 analyzed schools with full 10-hour coverage — see §5.4 below for the current AOI identity.

### 5.2 Student population estimate

Student addresses are FERPA-protected and will never be available. Population is estimated via dasymetric mapping.

| Step                                   | Source                                                           |
| -------------------------------------- | ---------------------------------------------------------------- |
| Number of children 5–17 per small unit | US Census 2020 DHC table P12 (block) or ACS B01001 (block group) |
| Assign block → school                  | District open-data portal (primary), NCES EDGE SABS (fallback)   |
| **Calibrate to real enrollment**       | NCES Common Core of Data                                         |
| Walk-zone rule                         | District transportation policy PDF, read manually                |

Required calibration:

```
correction_factor = official_CCD_enrollment / dasymetric_estimate
```

⚠️ SABS is only available for FY2013–14 and 2015–16 (a discontinued experimental survey). Always check the district's ArcGIS portal first.

### 5.3 Supporting geospatial data

| Data                      | Source                                           |
| ------------------------- | ------------------------------------------------ |
| Pedestrian street network | OpenStreetMap via `osmnx`, `network_type='walk'` |
| Tree canopy cover         | NLCD Tree Canopy Cover (USGS/MRLC)               |
| Demographics & income     | US Census ACS (B19013, B17001)                   |
| % free/reduced lunch      | NCES CCD                                         |

### 5.4 Demo city — Orlando / Orange County, FL

**AOI: `orl_ocps_core`** — a merged bbox covering the district's dense-school core, reached after starting from a single scouting tile (`orl_pine_hills_n`) and expanding coverage per §5.6. See `docs/METHODOLOGY.md` §Phase 6 for the merge and §Phase 9 for the 42-school scale-up.

Arizona's hazardous-walking statute was verified to **not exist** — `ARS §15-901` is purely distance-based, and the ASBA model policy code "Walkers and Riders" (EEAA) is marked removed from Arizona district policy templates. Florida has the strongest, most explicit mechanism: **Florida Statute §1006.21/§1006.23**, with a written "hazardous walking condition" definition and a concrete figure of 19,693 children in FY2019–2020.

**AOI selection criteria, in order:**

1. A verified state hazardous-walking statute, with a section citation
2. A publicly available district transportation policy PDF with a written walk-zone radius
3. Attendance boundaries available on the district's ArcGIS portal
4. School density — tiles chosen to maximize schools per call
5. Canopy contrast — a **tie-breaker only, not a gate**

Criterion 5 isn't a gate because of §1.5: 2m air temperature doesn't behave like surface temperature, so searching for an AOI with large spatial contrast is a search that won't succeed in any city.

### 5.5 Two AOIs, two different roles

|                               | **Orlando (`orl_ocps_core`)** | **Phoenix**                                   |
| ----------------------------- | ----------------------------- | --------------------------------------------- |
| Role                          | Full product                  | Portability proof (G10)                       |
| In the UI                     | ✅                            | ❌ never rendered                             |
| Graph + dose + classification | ✅                            | ✅                                            |
| Policy PDF read manually      | ✅                            | ❌                                            |
| District attendance boundary  | ✅                            | ❌ nearest-school, documented as a limitation |
| CCD enrollment calibration    | ✅                            | ❌                                            |
| FR-5 petition button          | ✅                            | ❌ **must not be built**                      |
| Output                        | all of `data/out/`            | `contrast_report.csv` only                    |

**Phoenix must not be in the UI, and this isn't about time.** Arizona's hazardous-walking statute doesn't exist. A red block in Phoenix would mean a petition button with no legal basis to cite — the first hole a judge would find, and it would undermine §1.3, which is the foundation of the whole pitch.

**Phoenix's value is in the pitch, not the product.** One comparison line: _"config changed, bbox changed, the pipeline ran with zero lines of code touched."_ The district-agnostic claim becomes proven, not just claimed.

### 5.6 Tile coverage — the whole district, not one box

**Target: every OCPS school gets a zone.** The 10 mi² limit is per-call, and it's addressed by mosaicking tiles.

#### The arithmetic

```
Remaining credit                1,786,900
Cost per call                       4,220
Fits                              ~423 calls
Two time slices per tile          ~211 tiles = ~2,110 mi²
Orange County (land area)           ~900 mi²
Dense-school portion                ~300 mi² = 30 tiles = 60 calls
Cost of dense coverage             253,200 credits (14% of budget)
```

**The entire dense-school portion of OCPS fits with a large margin.** The real constraint isn't credit, it's fetch time (60 polled async calls) and file size.

#### Architectural consequence: files split per school

A monolithic `graph.json` dies at this scale — 30 tiles ≈ 150 MB, impossible to `fetch()` in a browser.

```
data/out/
├── schools.json                    every school + analysis status
├── tiles.json                      tile bbox manifest + status
├── summary.json                    every analyzed school
└── by_school/
    ├── <school_id>/
    │   ├── graph.json              geometry + topology, once
    │   ├── temps.json              temperature & dose per edge per hour
    │   └── blocks.geojson
```

**Geometry is separated from temperature.** Road geometry is identical across all hours and runs 2–4 MB; storing it again per hour would be a ten-fold waste. `temps.json` holds only number arrays — no coordinates, no street names — so ten hours fit in ±200 KB.

```
graph.json   nodes, edges, len_m, simplified geometry   ~3 MB
temps.json   { meta: { hours: [...], canonical_hour: "15:00" },
               edges: { <edge_id>: { "07:00": [temp_c, peak_c, dose], ... } } }
```

Total per school ±3.2 MB for ten hours, not 30 MB. The exact schema is locked in `docs/CONTRACT.md` before the pipeline is written.

The frontend only `fetch()`es the school currently open, once, then moves across all hours in memory. The repo can be 150 MB; what the browser pulls stays ±3.2 MB per school.

**A school whose walk zone crosses a tile boundary** uses a merged graph from the overlapping tiles. `step2_build_graph.py` merges before routing, not after — routing across a boundary on a clipped graph produces false routes.

#### `config.py` takes a list, not one bbox

```python
TILES = [
    {"id": "ocps_01", "bbox": [...], "status": "done"},
    {"id": "ocps_02", "bbox": [...], "status": "pending"},
]
```

Adding coverage = adding an entry + rerunning. **No new code.** This is a structural decision made before the graph was written — building single-bbox now and refactoring later is the most common way a hackathon project dies.

#### Rollout order

| Wave | Contents                    | When                                           |
| ---- | --------------------------- | ---------------------------------------------- |
| 1    | 1 tile (Pine Hills)         | Until the full classification checklist passes |
| 2    | +5 core OCPS tiles          | After wave 1 passes                            |
| 3    | Remaining dense-school area | While time and credit allow                    |

Wave 1 had to pass the full checklist before wave 2 ran. Not about doubting coverage — about not duplicating the same bug across 30 tiles.

---

## 6. Technical architecture

### 6.1 Principle

```
[Offline Python pipeline]  →  [static files in data/out/]  →  [React web app]
   runs once/on schedule        committed to the repo           client-side routing
```

**No backend server, except one read-only serverless function that holds the FortyGuard API key for FR-29** — no database, no state, and outside the route-render path (the route always renders from `data/out/` in <1 second; the live call upgrades its numbers later, never blocking it). Beyond that, **no API calls at runtime** except the refresh button (FR-17, never built) and FR-29. This is what keeps the timeline realistic and keeps the demo from failing on a hung async job.

### 6.2 Engine: graph routing

The entire product runs on one pedestrian street-network graph with two weights per edge: length and heat dose.

Why a graph, not raster cost-distance:

1. **One engine for two modes.** Mode 2 absolutely needs graph routing. If Mode 1 used raster, two separate pipelines would need to be built
2. **The two methods can contradict each other.** Raster says block X is safe, the route engine says the best path from block X is 41°C — two numbers from two methods in the same app. A careful judge would find it
3. **The product's output really is per block**, not a continuous surface

The common concern "OSM sidewalk coverage is often full of gaps" applies to `footway` tags, but not to `network_type='walk'`, which pulls every road a pedestrian can use, including residential streets. OSM road coverage in the US is TIGER-based and nearly complete.

**Fallback:** if the graph fails, raster cost-distance (`skimage.graph.MCP_Geometric`) is still a valid backup — but only for Mode 1; Mode 2 would have to be cut.

### 6.3 Analysis pipeline (Python 3.11)

```
1. POST /v1/heatmap → tcm 60m, one slice per hour 07:00–16:00 → GeoTIFF per tile per hour
2. osmnx.graph_from_bbox(network_type='walk')
3. Per edge per hour: rasterio sample along the geometry → edge mean & peak temperature
4. Per edge: dose = max(temp − baseline, 0) × (length_m / 1.2) / 60   → °C·minutes
5. Per block centroid per hour: dijkstra ×2 (weight='len_m', weight=weight_cool)
6. Classify blocks per the FR-8 rule, at the canonical hour
7. Export graph.json + temps.json + blocks.geojson per school
```

| Function             | Library                          |
| -------------------- | -------------------------------- |
| Vector GIS           | `geopandas`, `shapely`, `pyproj` |
| Raster sampling      | `rasterio`, `numpy`              |
| Graph + routing      | `osmnx` + `networkx`             |
| Census API           | `census` / `cenpy`               |
| FortyGuard + polling | `httpx`                          |

### 6.4 Frontend

| Function            | Choice                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------ |
| Framework           | React 19 + TypeScript + Vite                                                               |
| Map                 | MapLibre GL JS v5 (raw, not `react-map-gl`)                                                |
| Styling             | Tailwind v4                                                                                |
| Chart               | Recharts                                                                                   |
| Client-side routing | Manual Dijkstra (~50 lines), no library                                                    |
| Basemap             | OpenFreeMap (remote vector tiles, style `liberty`) — no API key, needs internet at runtime |
| UI components       | shadcn/ui (Radix + Tailwind), allowlist in `DESIGN.md`                                     |
| Font                | Inter, self-hosted via `@fontsource-variable/inter`                                        |
| Hosting             | Vercel (static)                                                                            |

**Mode separation:** two routes on one app — `/` for Mode 2 (default entry point) and `/district` for Mode 1 — with one segmented switch in the header. **The MapLibre instance must never be unmounted when switching modes**; the Mode 2 → Mode 1 transition in the demo video is a `flyTo` on the same map instance, and that's the visual proof both modes share one engine.

**Basemap:** remote style URL `https://tiles.openfreemap.org/styles/liberty`. No API key that can run out or be retired mid-judging. Product decision, night of 2026-08-27 (see `docs/METHODOLOGY.md` §Phase 8): the original self-hosted PMTiles plan was replaced because one local bbox couldn't cover the AOI + the FR-20 zoomed-out view at a file cost reasonable to commit to git (128 GB for full-planet coverage). Accepted consequence: the map needs internet at runtime, so the "demo works offline" claim in the dev plan is retracted for the basemap specifically — the rest of the app (`data/out/`, graph, routing) stays fully offline after the first load.

**File size:** the graph is split **per school**, not per AOI, and geometry is separated from temperature (§5.6). One school ≈ 5–15 thousand edges → `graph.json` 2–4 MB after Douglas-Peucker simplification, `temps.json` ±200 KB for ten hours. Target ≤5 MB for `graph.json`; if exceeded, raise the simplification tolerance before changing format.

**Data format:** `graph.json` and `temps.json` are `fetch()`ed once when a school is selected, then every hour moves in memory — the slider never triggers a request. GeoJSON is `fetch()`ed, not `import`ed. The frontend loads `schools.json` + `tiles.json` on boot; graph and blocks load **on demand when a school is selected**, not all up front.

**Explicitly ruled out:** `deck.gl`, `react-map-gl`, any backend server, PostGIS/DuckDB/Parquet, authentication, a third-party tile server that requires an API key.

---

## 7. Non-functional requirements

| Category          | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Performance**   | Address input → both routes render in <1 second                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Performance**   | School click → zone renders in <2 seconds, including the on-demand `fetch()` of that school's file                                                                                                                                                                                                                                                                                                                                                    |
| **Performance**   | The NCES pin layer renders with no jank at full zoom-out. Must use a MapLibre symbol layer, not DOM markers                                                                                                                                                                                                                                                                                                                                           |
| **Performance**   | Hour slider change → re-render in <500 ms, with no network request                                                                                                                                                                                                                                                                                                                                                                                    |
| **Reliability**   | The demo must work fully **with no internet connection at all** after the first load, except the refresh button (FR-17) — **with one exception: the basemap**. OpenFreeMap requires a live connection at runtime (§6.4); this was a deliberate, documented trade-off (`docs/METHODOLOGY.md` §Phase 8), not an oversight. Everything else — `data/out/` data, the graph, routing, classification — stays fully static and offline after the first load |
| **Units**         | Every place that displays °C·minutes **must** show °C alongside it. °C·minutes is scientifically correct and has literature precedent (Meng et al. 2023), but isn't intuitive — nobody knows if 340 °C·minutes is bad. Everybody knows 41°C is dangerous                                                                                                                                                                                              |
| **Units**         | Include °F next to °C on every headline number                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Transparency**  | Every number shown must be traceable to a data source; a "Methodology" page is required                                                                                                                                                                                                                                                                                                                                                               |
| **Compatibility** | A modern desktop browser for Mode 1. **Mode 2 should be mobile-friendly**, since its persona is a parent checking from their phone                                                                                                                                                                                                                                                                                                                    |

---

## 8. Limitations to be documented

The fifteen points below must be documented — currently in `docs/METHODOLOGY.md` — and stated in the pitch slide. The requirement below is updated to match: these limitations must be documented and traceable, not necessarily on their own route.

1. 60m resolution can't tell left-side vs. right-side sidewalks apart → scoring happens at the **corridor** level, not the sidewalk
2. No wind speed & globe temperature → **not WBGT**; call it "a heat-dose index based on 2m air temperature"
3. Coverage is limited to the tiles successfully pulled before the deadline. Schools outside a tile render as a gray pin labeled "not analyzed," never with an interpolated or guessed number
4. Routes are modeled from the OSM network — real children may cut through or take informal paths
5. Walking speed is assumed at 1.2 m/s for every child
6. Not every child inside an attendance boundary attends that school (charter/private/open enrollment), off by an estimated ~10–20%
7. Census block-level data carries differential-privacy noise
8. Building footprint ≠ unit count → apartments will be under-estimated
9. SABS boundary data is ~10 years old where direct district data isn't available
10. **The benefit of route choice is small.** Measured 2m air temperature shows far less intra-urban spatial variation than shade or surface-temperature maps imply. Eight candidate AOIs across two cities were tested; the best contrast was 1.84°C (p95−p05). Consequently the route-to-route delta sits in the 0.5–0.8°C range. **Exposure is dominated by duration and time of day, not route choice**
11. The yellow category (FR-8) holds fewer blocks than intuition suggests, as a direct consequence of point 10. The actual distribution is reported as-is; the threshold is never shifted to populate it
12. **Classification uses the canonical hour (the school day's hottest hour) and a one-way dose.** Children walk both directions every day, so real exposure is the sum of morning + afternoon. This product's numbers are an **under-estimate**, not an over-estimate
13. **Hour coverage isn't uniform across tiles.** Wave 1–2 tiles have ten hourly slices; a wave-3 tile might have only three. The slider only ever shows hours actually pulled, and per-tile status is readable in `tiles.json`. No hour is ever interpolated
14. The exceedance number (FR-19) is a **hybrid**: temporal distribution from a single-point ASOS station, spatial offset from FortyGuard. It assumes the per-block spatial offset is stable day to day — an assumption that is untested
15. The Phoenix AOI has no enrollment calibration, no district attendance boundary, and no statutory basis. It exists only as pipeline-portability proof and must not be read as a policy recommendation

---

## 9. Milestones

Historical day-by-day plan from the build window, August 23–30, 2026 (deadline August 30, 23:59 GST). Kept here as a record of how the schedule was actually run, not as a forward-looking plan.

| Date             | Target                            | Definition of done                                                                                                                                     |
| ---------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ~~23~~           | ✅ API verification               | `tcm` confirmed as 2m AGL air temperature; `-999` handled; flat cost of 4,220 credits/call confirmed; non-`:00` minutes confirmed to return zero tiles |
| ~~24~~           | ✅ Legal verification             | Arizona statute confirmed absent; Florida chosen as the demo state                                                                                     |
| ~~25 morning~~   | ✅ AOI selection                  | `orl_pine_hills_n` chosen via legal-first criteria                                                                                                     |
| **25 afternoon** | Lock structure + data acquisition | `TILES` & `graph.json`/`temps.json` schema locked; 10-slice raster, OSM graph, CCD schools, census blocks, OCPS policy radius land in `data/interim/`  |
| **26 morning**   | Dose-weighted graph               | Per-edge per-hour dose is sane, `graph.json` per school ≤5 MB                                                                                          |
| **26 midday**    | Routing & outcomes                | 🚩 **Gate G1**: ≥1 red block. Everything else reported as-is                                                                                           |
| **26 evening**   | Classification + export + wave 2  | 3 categories populated, `data/out/by_school/` complete, +5 OCPS tiles                                                                                  |
| **27**           | Mode 2 frontend                   | US-01…US-05 working. 🚩 Phoenix date gate, 12:00                                                                                                       |
| **28**           | Mode 1 frontend + wave 3          | US-06…US-10 working, FR-16, FR-20 national pins                                                                                                        |
| **28 evening**   | Cross-mode + honesty              | Methodology page, offline demo check                                                                                                                   |
| **29**           | Demo + deck                       | Demo video, pitch deck, README, deploy                                                                                                                 |
| **30**           | Buffer + submit                   | —                                                                                                                                                      |

**Fallback path if day 28 got tight:** cut Mode 1 to static — a table + map with no click-through interaction. What **could not** be cut was the "even the coolest route fails" rule (FR-8 red category), since it's the heart of the argument.

**Demo video order:** parent first, district second.

1. A parent in Orlando checks an address → two route options appear with their exposure → drag the slider from 11:00 to dismissal hour → dose spikes, the coolest path changes → "no safe route"
2. Zoom out to the district view → 142 other children are in the same situation; policy radius 1.0 mi vs. dose-equivalent radius 0.42 mi
3. Click "hide heat data" → everything collapses to a circle → _"this is what the district has today"_
4. Close with the reclassification list + CSV export

---

## 10. Risks & mitigations

| Risk                                                 | Impact                                                           | Mitigation                                                                                                                                                                     |
| ---------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Zero red blocks after classification**             | **Critical — Mode 1 is empty, the product's argument collapses** | Recalibrate `THRESHOLD` and document why. This is gate G1, the only one that halts work                                                                                        |
| Judges see this as a generic cool route planner      | **High** — this is organizers' own first example for Track 01    | Open the pitch with the legal mechanism and the causal rule, not a route map. Cite the Austin prior art first and articulate the difference                                    |
| Phoenix eats into Orlando's time                     | **High**                                                         | Date gate, Aug 27 12:00 (§5.5). Work sequentially, not in parallel — debugging two datasets at once hides where a bug actually is                                              |
| An async job is slow or fails during the demo        | **Critical**                                                     | Everything is precomputed; the refresh button is isolated with a fallback                                                                                                      |
| Trial credit runs out                                | High                                                             | Always request the full 10 mi² (flat cost), cache every raw response, never repeat a cached call                                                                               |
| **Full-hour fetch time exceeds schedule**            | **High** — 10 slices × 30 tiles = 300 async calls                | Full hours only for waves 1–2. Wave 3 drops to 3 slices per tile, documented in `tiles.json` + `docs/METHODOLOGY.md`. Coverage may shrink; full hours on the core tile may not |
| `graph.json` too large                               | Medium                                                           | Split per school; simplify edge geometry; raise the Douglas-Peucker tolerance before changing format                                                                           |
| District attendance boundary unavailable             | Medium                                                           | Fall back to SABS + state the data's age                                                                                                                                       |
| `exceedance` turns out to be Premium-only            | Medium                                                           | Downgrade FR-19 to a documented limitation, not a fabricated number                                                                                                            |
| Judges ask "why didn't Transfinder just build this?" | Medium                                                           | They **execute** routes, they don't determine thermal eligibility — and they don't have 60m data. Show the CSV export as the integration point                                 |
| Judges ask "isn't this used once a year?"            | Medium                                                           | Mode 2 is daily use; the hazardous-walking petition flow is monthly use                                                                                                        |
| Judges ask "why is the delta so small?"              | Medium                                                           | State it up front as a measurement finding, complete with the eight-candidate-AOI table. Other entrants will claim a route benefit without measuring it                        |
| Scope creep                                          | **High**                                                         | P0 is locked; P1/P2 are touched only after P0 is fully done                                                                                                                    |

---

## 11. Open questions

- [x] **Definition of `tcm`** → ambient air temperature in °C at 2m AGL
- [x] **Does Arizona have a hazardous-walking statute?** → No. `ARS §15-901` is purely distance-based, the ASBA EEAA code is removed. Florida chosen as the demo state
- [x] Official OCPS walk-zone radius per grade level → sourced from the district transportation policy FAQ page (the underlying board policy PDF could not be retrieved)
- [x] District attendance boundary availability → OCPS's ArcGIS portal could not be reached programmatically; the product falls back to nearest-school assignment, documented as a limitation (§8 point 9)
- [x] Dose threshold value (°C·minutes) → calibrated empirically, documented as `THRESHOLD_DOSE_C_MIN` in `pipeline/config.py`
- [x] **Baseline temperature for dose calculation** → 33°C (Lanza), documented as a calibration choice
- [ ] Exceedance threshold (°C) for FR-19, and whether FortyGuard's spatial offset is stable enough day to day to support it
- [ ] Column format accepted by Transfinder/Versatrans for importing a hazardous layer
- [ ] Whether the submission form allows more than one track

---

## Appendix — Key references

1. **Lanza K, et al.** "Heat-Resilient Schoolyards: Access to Playgrounds and Shade." _J Phys Act Health_ 2023;20(2):134–141. DOI: 10.1123/jpah.2022-0405 — the 33°C child-behavior turning point
2. **Arizona DHS.** _Managing Extreme Heat Recommendations for Schools_, 2021 — acknowledges NWS warning thresholds are too high for children, and that data access is the barrier
3. **Meng Y, et al.** "Investigation of heat stress on urban roadways for commuting children." _Urban Climate_ 2023;49:101564 — precedent for the °C·minute unit
4. **Basu R, et al.** (2024) — heat stress significantly alters perceived walking distance
