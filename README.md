# HeatWalk

**Walk zones drawn by heat, not distance.**

US school districts decide who rides the bus and who walks by drawing a radius circle around each school — typically 1 mile for elementary, 1.5 for middle, 2 for high school. That circle is purely geometric: it doesn't know whether a child walks under tree canopy or across an open parking lot.

HeatWalk replaces distance with **cumulative heat dose (°C·min)** as the impedance function over the pedestrian network, using FortyGuard's 60 m, 2 m-above-ground-level air temperature data. From one dose-weighted graph it produces two things — a parent-facing route comparison, and a district-facing block reclassification list that can be brought to a school board meeting.

Built for **FortyGuard Hackathon '26**. Modeled area: 42 schools in Orange County Public Schools (Orlando, FL), for `2023-08-08`, hours 07:00–16:00.

## Two roles, two modes

HeatWalk has no accounts and no login. The two audiences are separated by route, not by auth:

| Role                        | Route       | What they do                                                                           |
| --------------------------- | ----------- | -------------------------------------------------------------------------------------- |
| **Parent / student**        | `/`         | Enter a home address, pick a school, compare walking routes by heat exposure           |
| **Transportation Director** | `/district` | See per-school heat zone maps and the block reclassification list for the school board |

Both modes read from the same dose calculation, tied together by one rule: a block only appears on the district's bus-reclassification list if _even its coolest available route_ still crosses the heat dose threshold. If a safe route exists, the block isn't reclassified — parents are pointed to that route in Mode 1 instead.

### Parent mode (`/`)

Enter an origin address (autocomplete, or drag the pin on the map) and pick a destination school. HeatWalk solves walking routes client-side against that school's pedestrian graph and shows a "Coolest route" card plus alternates, each with heat dose, mean/peak temperature, and a "safe until" hour. A live-conditions row shows current temperature where available.

### Transportation Director mode (`/district`)

Browse the list of analyzed schools, then drill into one to see its walk zone map: green (safe to walk), yellow (reroute is enough), and red (no safe route — bus-eligible) blocks, an hour slider across the school day, layer toggles, and a CSV export. Click a block for its full detail — estimated children affected, dose comparison to the shortest route, exceedance days per school year, and a recommendation with reasoning.

For the reasoning behind the thresholds and known caveats, see the in-app **About** dialog (links to `/methodology`) in the top-right panel.

## Quick start

Requirements: **Node 20.19+** (22 or 24 recommended — this repo was built against Node 24), **Git LFS**, and an internet connection (the basemap is loaded live from OpenFreeMap, so there is no offline mode).

```bash
git clone <repo-url> heatwalk
cd heatwalk

git lfs install
git lfs pull

cd web
npm install
npm run dev
```

Open `http://localhost:5173` for Parent mode, `http://localhost:5173/district` for Transportation Director mode.

That's it — no API key, no database, no backend to start. The app reads its data straight from static JSON/GeoJSON files already committed in the repo.

> **Git LFS is not optional.** `data/out/` and `web/public/data/` — the map and school data the frontend fetches — are tracked with Git LFS. If you skip `git lfs pull`, those files are left as small text pointer stubs instead of real JSON, and the app will fail to load data with an error like "Could not load HeatWalk data". If you hit that, run `git lfs pull` and reload.

### Other frontend scripts

Run from `web/`:

| Command           | Does                                        |
| ----------------- | ------------------------------------------- |
| `npm run build`   | Type-check (`tsc -b`) then production build |
| `npm run preview` | Preview the production build locally        |
| `npm run lint`    | Lint with oxlint                            |

## Optional: running with live temperatures

One panel (the live-conditions row in Parent mode) can show a real-time temperature grid instead of modeled data. This is served by two Vercel Edge functions in `web/api/` that hold the FortyGuard API key server-side. Plain `npm run dev` does **not** serve `web/api/`, so this feature quietly reports "unavailable" under normal dev — everything else in the app works fine without it.

To exercise it locally:

```bash
cd web
cp ../.env.example .env
# edit .env and set FORTYGUARD_API_KEY
vercel dev
```

This consumes FortyGuard API credits per request and, as of this writing, has not been verified end-to-end against a real key in this repo — treat it as best-effort. Never commit `.env` or print its contents.

## Where the numbers come from

Everything shown in the app is precomputed offline by a Python pipeline in `pipeline/` — it fetches OpenStreetMap pedestrian networks and FortyGuard heatmap tiles, builds a dose-weighted walking graph, solves coolest routes per school, classifies Census blocks into green/yellow/red, and exports static files to `data/out/`, which are mirrored into `web/public/data/` for the browser to fetch. Nothing is computed on a server at request time, and every number in the UI traces back to one file in `data/out/` (schema documented in `docs/CONTRACT.md`).

You do **not** need to run this pipeline to run the app — the output is already committed via Git LFS. If you do want to regenerate it, the entrypoint is `pipeline/run_all.py`, it needs a `FORTYGUARD_API_KEY` and `CENSUS_API_KEY` in a root `.env`, and the key constants (baseline temperature, dose threshold, walk speed) live in `pipeline/config.py`.

## Repo layout

```
pipeline/          Python: fetch, graph build, routing, classification, export
data/
  raw/              Fetched OSM/FortyGuard/Census data (Git LFS)
  interim/          Intermediate pipeline output (not committed)
  out/              Final static output the frontend reads (Git LFS)
  fixtures/         Synthetic data for pipeline schema tests
web/
  src/              React app: routes, components, hooks, lib
  api/              Vercel Edge functions (live temperature only)
  public/data/      Mirror of data/out/, served to the browser
docs/
  CONTRACT.md        Schema of every file in data/out/
heatwalk-prd.md     Product requirements
```

## Stack

**Frontend:** React 19, TypeScript, Vite, Tailwind v4, MapLibre GL JS v5, OpenFreeMap (`liberty` style, no API key), shadcn/ui, Recharts.
**Pipeline:** Python 3.11, geopandas, rasterio, osmnx, networkx.
**Data sources:** FortyGuard (heat data), OpenStreetMap (pedestrian network), US Census (block geometry, ACS income), NCES (school locations), Iowa Environmental Mesonet ASOS (historical station temperatures).
