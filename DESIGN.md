# DESIGN.md

HeatWalk's visual system. This document is binding for all of `web/`. If a visual decision isn't written here, follow its principles — don't improvise.

---

## Design direction

**Monochrome, information-dense, no decoration.** Reference: the simplicity of [kurawal.dev](https://kurawal.dev) — black and white, typography carrying the entire hierarchy, thin rules as separators, generous whitespace, zero ornament.

This product gets brought to a school board meeting. What makes it trustworthy is traceable numbers, not a pretty finish. Every visual element must be able to answer: *what information is lost if this is removed?* If the answer is "none," remove it.

The one thing people should remember after the demo: **the FR-16 moment.** One click, every color and every route line disappears, leaving only a dashed circle on a gray map. The entire visual system below is designed so that moment feels like the lights going out.

### Forbidden

Gradients · glassmorphism · decorative blur · drop shadows on non-overlay elements · large rounded corners · emoji in the UI · colored icons · illustrations · multicolor badges · per-section entrance animations · full-screen hero sections · cards nested inside cards.

---

## Color

One rule that governs everything:

> **Color may only appear inside the map, the map legend, and classification status badges. Nowhere else.**

Buttons, links, borders, text, icons, charts, tables — all monochrome, in both modes. Consequence: the only color ever on screen always means something, and the "hide heat data" button makes the screen genuinely lose all of its color.

### Neutrals

| Token | Light | Dark | Used for |
|---|---|---|---|
| `--bg` | `#FFFFFF` | `#0A0A0A` | page background |
| `--surface` | `#FAFAFA` | `#171717` | panels, sheets, table headers |
| `--surface-raised` | `#FFFFFF` | `#1F1F1F` | dialogs, popovers, tooltips |
| `--border` | `#E5E5E5` | `#262626` | separators, table rules |
| `--border-strong` | `#D4D4D4` | `#3A3A3A` | input borders, button outlines |
| `--ink` | `#0A0A0A` | `#FAFAFA` | primary text, headline numbers |
| `--ink-muted` | `#525252` | `#A3A3A3` | secondary text, labels |
| `--ink-subtle` | `#737373` | `#737373` | captions, placeholders, units |

`--ink-subtle` is the floor. Never make text lighter than that — everything is already right at the edge of 4.5:1, and light-gray text "for elegance" is the fastest way to make a data product look untrustworthy.

### Data colors (map, legend, and status badges only)

| Token | Light | Dark | Meaning |
|---|---|---|---|
| `--zone-safe` | `#3F6B4A` | `#7FB08C` | green — shortest route is already safe |
| `--zone-reroute` | `#B07A1A` | `#E0B25C` | yellow — needs route choice |
| `--zone-bus` | `#A33A28` | `#E0705C` | red — even the coolest route fails |
| `--route-coolest` | `#1E5FA8` | `#7FB3EA` | blue — the selected route in Mode 2, the "answer" (FR-28) |

Choropleth fill uses the same tokens at 18% opacity (safe), 22% (reroute), 30% (bus), with a 1px stroke at full color.

**Redundancy is mandatory.** Green-yellow-red is the worst possible combination for deuteranopia, and this is a decision that affects someone's kid. Every category must be distinguishable with zero color:

- Red blocks get a **diagonal hatch** over their fill.
- Yellow blocks get a **dashed** stroke.
- Green blocks are plain.
- Anywhere a category is shown must include its **text label**, not just a swatch.

### Basemap

**Remote OpenFreeMap, style `liberty`.** Style URL `https://tiles.openfreemap.org/styles/liberty`, read directly by MapLibre as style JSON — a standard colored basemap (green parks, blue water, natural-colored roads/buildings), not `grayscale`.

No API key. **Product decision, night of 2026-08-27 (Revan):** the planned self-hosted PMTiles basemap (`web/public/heatwalk-aoi.pmtiles`) was replaced with the third-party OpenFreeMap tile server — see `docs/METHODOLOGY.md` §Phase 8 for the reasoning and the coverage-cost numbers. Consequence: the "pull the internet, demo still works" verification (dev plan Phase 7) **no longer applies to the basemap** — the map needs internet at runtime. The rest of the app (`data/out/` data, graph, routing) remains fully offline after the first load.

**Product decision 2026-08-27 (Revan): the basemap was deliberately switched from `grayscale` to colored `light`**, replacing the old rule "if the basemap is colored, this whole system is void." Consequence: the "color only in map/legend/badge" rule above is now read as *non-map color stays monochrome*, not *the basemap itself must be neutral*. The heat-dose overlay, legend, and classification badges must still contrast clearly against this colored basemap — verify AOI contrast visually on screen every time the basemap or overlay palette changes, because basemap colors can now clash with zone colors (especially red/yellow against roads/buildings). OpenStreetMap attribution must be visible on the map.

### Routes

| Element | Style |
|---|---|
| Coolest route (heat data shown) | 5px solid `--route-coolest`, with an 8px `--bg` casing beneath it — 6.5px (9.5px casing) when selected; 2.5px `--ink-subtle` with no casing when its card is not selected |
| Coolest route (FR-16 active) | 2px `--ink-subtle`, dashed `4 4` — reverts to neutral; 3px when selected, no casing. The only line left on the map while FR-16 is active |
| Alternate route (FR-30, Mode 2) | 2px solid `--ink-subtle`, no dasharray — 3px when its card is selected |
| Top-5 priority segment (FR-24) | 7px `--zone-bus`, 100% opacity, above the block choropleth, + rank label — **not built**, see FR-24 status |
| Official walk-zone circle | 1.5px `--ink-muted`, dashed `6 6`, no fill |
| Dose-equivalent radius circle (FR-18) | 1.5px solid `--ink`, no fill |
| Hover on either circle (FR-26) | not built — see FR-26 status |

**Product decision 2026-08-27 (Revan):** the coolest route uses **blue** (`--route-coolest`), not ink — blue is the answer; the blue→orange ramp on the shortest route showed status-quo heat exposure. The two routes stay distinguishable without color via width (2.5px vs 5px + casing) and a labeled legend. When FR-16 is active, the ramp and the coolest route disappear entirely — the shortest route returns to neutral dashed gray, and the "lights out" moment stays intact.

**2026-08-28 amendment (Revan, FR-30):** alternate routes use plain gray `--ink-subtle`, not black/red as briefly proposed — red stays exclusive to `--zone-bus` (failing coolest route, priority segments), and adding a new color for alternates would break the "color only in map/legend/badge" rule. Alternates also disappear when FR-16 is active, same as the coolest route. **Their count was cut from two to one** (same-day follow-up amendment) — three route cards total (coolest, shortest, one alternate), not four.

**2026-08-28 amendment (Revan): selecting a route card reframes the map to that route.** A bug Revan found — the map didn't change when a card other than "Coolest" was clicked — was fixed with two mechanisms at once: (1) the route whose card is selected gets a thicker line (see per-row widths in the table above), and (2) the map `fitBounds`s to that route's geometry bounding box (`hooks/useRouteFocus.ts`, 64px padding, `maxZoom` 17, 600ms duration). The second mechanism is required because ~90% of block–school pairs have a coolest route identical to the shortest route (G8, `docs/METHODOLOGY.md`) — when the geometry is exactly the same, thickening the line alone isn't visible, since one route is always drawn directly on top of the other; `fitBounds` still gives real feedback in that case.

**2026-08-28 amendment (Revan, follow-up): in Mode 2, blue belongs only to the route whose card is selected.** With three cards, two simultaneous blue lines (the coolest route always blue + the shortest route's ramp ending in blue) made the selection unreadable. New rule: unselected routes — coolest, shortest, alternate — are all plain 2–2.5px `--ink-subtle` (coolest route with no casing); the selected route is `--route-coolest` with the selected width + casing, and its layer is moved to the top of the stack (`hooks/useRouteLayerOrder.ts`, `moveLayer` just below the AOI boundary layer) so that shared geometry (G8) doesn't cover the blue line. The blue→orange ramp is now exclusive to Mode 1, which has no card selection; the `--route-heat-*` tokens still apply there. FR-16 is unchanged: the shortest route returns to neutral dashed gray, and the coolest route and alternates disappear entirely.

**2026-08-28 amendment (Revan, closing): routes removed from Mode 1; the ramp retired from the whole product.** Mode 1 is now purely zones — policy circle, dose choropleth, dose-equivalent circle (FR-10 amendment in the PRD); every row in the table above now applies to Mode 2 only, and the "coolest route fails" row is removed. Consequence, alongside the previous amendment: the blue→orange ramp no longer has anywhere to display in any mode. The `--route-heat-cool`/`--route-heat-hot` tokens are removed from `theme.css` and the client ramp code (`routeRampFeatures`) is removed; the ramp text in the 2026-08-27 decision above stands as historical record. The only route color left in the product is `--route-coolest` for the selected route in Mode 2.

**2026-08-28 amendment (Revan, follow-up): the shortest route is removed from cards and from the map; alternates go from one to two.** Revan reported the shortest route was mostly redundant with the coolest route (G8, ~90% of block–school pairs share an identical path) — its card and line are removed from Mode 2. `hooks/useShortestRouteLayer.ts` is removed; `web/src/lib/routeAlternatives.ts`'s `ALTERNATE_ROUTE_COUNT` goes from 1 to 2, so the panel still shows three cards (coolest + two alternates) instead of two. The shortest route is **still computed** by `routeSolver.ts` for the FR-4 comparison table (`RouteComparisonPanel`) — it just stops having a visual representation on the map and stops being selectable. Consequence: the role of "neutral dashed line while FR-16 is active," previously held by the shortest route, is now held by the coolest route itself (`hooks/useRouteLayers.ts`, via `lib/coolestRoutePaint.ts`): while FR-16 is active, the coolest route's line turns `--ink-subtle` 2px dashed `4 4` (3px when selected), with no casing, and the `--zone-bus` color (failing route) is completely ignored while FR-16 is active — red is a heat signal, and FR-16 turns off every heat signal.

### Labels over the choropleth

Block temperature labels (FR-23): `Noto Sans Bold` ~10px, `--ink` color, `--bg` halo 1.5px, centered on the block polygon, appearing from zoom ±12.5 (MapLibre collision detection handles density). Top-5 segment rank labels (FR-24, not built): numbers `1`–`5` in the same style, at the segment midpoint. Both are heat data — hidden when FR-16 is active.

### Location markers

Marker roles are distinguished **by shape and glyph, never by color** — a direct consequence of the ban on colored icons above. Glyph icons from `lucide-react`, stroke `1.5`, size `16`.

| Role | Shape | Glyph | Anchor |
|---|---|---|---|
| Your location (draggable, Mode 2) | Teardrop, `--ink` fill, 1.5px `--bg` outline | `House`, `--bg` color, at the teardrop's head | Bottom tip (precise point) |
| School (fixed location, both modes) | Square chip, `4px` radius, `--bg` fill, 1.5px border | `GraduationCap`, border color | Center |

Analyzed schools use `--ink` border/glyph; unanalyzed schools (Mode 1) use `--ink-subtle`. The teardrop is used specifically for the point a parent **selects and drags**; the chip is for a location that's **already fixed** — its contrast must stay legible after a grayscale filter.

**2026-08-28 amendment (Revan): unanalyzed pins render as locked.** At pin zoom (≥10), unanalyzed pins are dimmed (icon opacity ±0.55) and carry no name label — only analyzed pins are labeled — so the "not yet unlockable" status reads at a glance from its shape alone. Clicking one still surfaces the "not analyzed" notice (FR-20), unchanged. While a school is focused in Mode 1, every other pin — analyzed or not — disappears from the map; all pins reappear once focus is cleared.

Every text label over the map (school name, `Your location`, block temperature label) must have a `--bg` halo/outline at least 1.5px wide around it, to stay legible against the colored basemap in both themes (see the basemap decision above). `text-font` is served by the OpenFreeMap glyph server; only **`Noto Sans Regular` / `Bold` / `Italic`** are available — `Medium` and `SemiBold` return 404 since the basemap moved to `liberty` (the self-hosted fontstack at `web/public/fonts/` has been removed). Don't use any other fontstack on symbol layers.

School pins in Mode 1 (101,000+ national schools) render as a chip + label only at zoom ≥ 10; below that they remain plain `circle` points (the AOI basemap isn't even covered below that zoom anyway). Analyzed school pins get a higher `symbol-sort-key` so they never lose a label collision to another school.

---

## Typography

**Inter** for everything. One family, hierarchy built from size and weight, not by switching fonts.

Loaded via `@fontsource-variable/inter` (self-hosted). Don't use the Google Fonts CDN.

```css
font-optical-sizing: auto;
font-feature-settings: "cv05" 1, "ss01" 1;
```

### Number rule

Every number in the UI — temperature, dose, distance, child count, percentage — must use `font-variant-numeric: tabular-nums`. This product is full of comparison tables; numbers whose columns don't align make the FR-4 panel unreadable.

Build one `<Metric>` component that handles this, don't sprinkle the utility one-off.

### Scale

| Role | Size | Weight | Tracking |
|---|---|---|---|
| Display (entry page title) | `clamp(2rem, 5vw, 3.25rem)` | 600 | `-0.03em` |
| Section H1 | `1.75rem` | 600 | `-0.02em` |
| Panel H2 | `1.125rem` | 600 | `-0.01em` |
| Body | `0.9375rem` | 400 | `0` |
| Headline number (e.g. `41.2°C`) | `2rem` | 600 | `-0.02em` |
| Label / caption | `0.8125rem` | 500 | `0` |
| Section eyebrow | `0.75rem` | 500 | `0.08em`, uppercase, `--ink-subtle` |

Uppercase eyebrows are used sparingly — at most one per screen, exactly like the section labels on kurawal.dev.

Line height: 1.5 for body, 1.15 for display and headline numbers. Prose line length maxes out at 70ch. Use `text-wrap: balance` on headings.

---

## Spacing, lines, radius

- 4px scale: `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96`. No values outside the scale.
- **Lines first, shadows later.** Separation is done with `1px solid --border`. Shadows only for elements that genuinely float: dialogs, popovers, dropdowns, bottom sheets, the floating map panel, and the floating control cluster (see the second 2026-08-27 product decision below).
- Radius: `4px` for inputs and buttons, `8px` for panels and dialogs, `9999px` only for pills/badges. The map and choropleth have **no radius** — the blocky per-block shape is deliberate (PRD FR-7), don't smooth it out.
- Table borders: horizontal rules only. No vertical rules, no zebra striping.

---

## Motion

The motion budget is very small, and it's the first thing cut if time runs short (dev plan).

- Duration `120ms` (hover, focus) to `200ms` (panel, sheet).
- Easing `cubic-bezier(0.16, 1, 0.3, 1)`. No bounce, no elastic.
- Only `opacity` and `transform`. Don't animate layout properties.
- No scroll-triggered entrance animations. No stagger.
- `@media (prefers-reduced-motion: reduce)` must exist and turn everything off.

Two exceptions get polish: the FR-16 transition (180ms fade when the heat layer disappears) and the coolest-route geometry change (120ms fade, see the next section) — in Mode 2, triggered when live FortyGuard temperature arrives later and upgrades the route (FR-29). Both are enough to read as a change, fast enough not to feel like an effect.

Numbers are **never** tweened. See the Hour slider section.

---

## Hour slider

**2026-08-28 amendment (Revan, FR-13): this control is now exclusive to Mode 1.** Mode 2 removes the slider — see the §Mode 2 amendment above — and always uses the current Orlando hour. The spec below still applies in full to the `HourSlider` in the district panel.

**2026-08-28 amendment (Revan): the Mode 1 slider is written in 12-hour AM/PM, superseding the earlier "keep the 24-hour format" note.** Hours are now presented via `formatHourAmPm` (`web/src/lib/units.ts`, already used by `LiveConditionsRow` in Mode 2) so both modes are consistent. The steps are still read from `meta.hours` unchanged — only the presentation changes, from `"15:00"` to `"3:00 PM"`.

The most-touched control in Mode 1, and it changes nearly every number on screen, so it must feel direct and never decorative.

### Shape

Track 2px `--border-strong`, one tick per hour on `--border`, a 16px `--ink` circular thumb with a 2px `--bg` ring underneath. The track segment before the thumb stays `--border-strong` — **don't give it a different fill.** This isn't a progress bar; no hour is "more done" than another.

Hour labels below the track use caption size and `tabular-nums`. Show only the endpoints and the active hour (`7:00 AM · · · 3:00 PM · · · 4:00 PM`); showing all ten labels at once makes this row busier than the number it's supposed to draw focus to.

The active hour is written large above the track, panel-H2 size, `--ink`. This is the only place the hour is written large.

### Rules

1. **Steps are read from `meta.hours`, not a constant.** A tile with three hours shows three ticks, not ten with seven dead.
2. **Discrete, not continuous.** The thumb snaps to a tick. There's no position between two hours, because there's no data for it.
3. **Zero color**, per the single rule above. The slider is not a map, not a legend, not a status badge.
4. Minimum 44px touch target on the thumb — enlarge the hit area, not the visible circle.
5. Fully keyboard-operable: left/right arrows move one hour, `Home`/`End` jump to the ends. 2px `--ink` focus ring like every other element.
6. `aria-valuetext` contains the hour in words (`"3:00 PM"`), not its step index.

### When the hour changes

Numbers in the panel change **with no transition**. Tweened numeric values read as animation and make people wait; what's needed here is an instant switch so dragging the slider feels like checking, not like loading.

The only thing allowed to transition is route geometry on the map: a 120ms fade when the coolest route's path changes, so a path change reads as a change and not a glitch. The shortest route never changes between hours — if it flickers too, something's wrong in the render, not the design.

If recomputation takes longer than 500ms (NFR §7), show a `skeleton` in the number row — **don't** blank the panel and don't show a spinner over the map.

---

## Component library

**shadcn/ui** (Radix + Tailwind v4). Reasoning: monochrome by default, Radix accessibility already handled, and components are copied into the repo so there's no vendor style to fight.

Allowlist — don't generate outside this list without a reason:

`button` · `dialog` · `sheet` · `tabs` · `table` · `tooltip` · `switch` · `select` · `slider` · `badge` · `separator` · `skeleton` · `accordion` (generated, currently unused)

Usage rules:

1. **Strip all built-in comments** from CLI-generated files. The zero-comments rule in `CLAUDE.md` applies in full to `components/ui/`.
2. Icons from `lucide-react`, stroke `1.5`, size `16` or `20`, color always `currentColor`.
3. The only button variants used are `default` (solid ink), `outline`, and `ghost`. No `destructive` — red is a data color, not a button color.
4. `card` is not on the allowlist. Use a `<section>` with a border and padding. A card inside a card is always wrong.
5. Product-specific components (`RouteComparisonPanel`, `ZoneLegend`, `Metric`, `TemperaturePair`) live in `web/src/components/`, separate from `components/ui/`.

---

## Theme

Default is **light mode**, regardless of `prefers-color-scheme`. Manual toggle in the header, stored in `localStorage`, applied as a `dark` class on `<html>` before the first paint so there's no flash.

Tokens are derived through Tailwind v4's `@theme` in a single file, `web/src/styles/theme.css`. No literal color values in any component — a grep for `#` in `src/` should come back clean except for that file.

---

## Layout per mode

**Product decision 2026-08-27 (Revan), second: the persistent header is dissolved, replaced by a single floating map panel.** The earlier architecture bound a full-width 48px+ header plus (Mode 1 only) three full-height columns pinned to the viewport edges. The map behind them was already technically full-bleed, but boxed in on all four sides so it read as a window, not a backdrop. New rule: **the map fills the entire viewport, and the whole product is operated from one floating panel.** Consequence: the "four things in the header" are now split across two places — the wordmark moves to the panel's top row, the three toggles become a floating control cluster — and the "Mode 1 three columns" rule below is entirely replaced by a new subsection. What doesn't change: one and the same map instance in both modes, never unmounted, and FR-16 still has to feel like the lights going out — with the map now genuinely full-screen, that effect is stronger, not weaker.

### Shared frame

One app, two routes: `/` for parent mode (the default entry point) and `/district` for district mode. No login and no navigation sidebar — there are only two destinations, chosen via a **two-item segmented control** labeled `Parent` / `District`.

**The map fills the entire viewport**, beneath every other element, with no opaque header. Only two things float above it:

1. **The map panel** — a single `<section>`, `--surface-raised`, full border, `8px` radius, shadow (see the shadow rule above), inset `16px` from the left, top, and bottom viewport edges, fixed `380px` width at viewport ≥768px. The panel's top row holds the wordmark + AOI label (`HeatWalk` · `Orlando`) on the first screen, or a back button + contextual title (`‹ Jackson Elementary`) when drilled into detail. The panel body below scrolls on its own; the panel's bottom row (footer) shows a results/coverage count, equivalent to a status attribution line.
2. **The control cluster** — a small floating container in the top right, `--surface-raised`, border, `8px` radius, shadow, containing four things (the `Parent`/`District` segmented switch · the "hide heat data" toggle FR-16 · the theme toggle · the info button FR-25, product decision 2026-08-27) plus a panel collapse/expand button. **Status as of 2026-08-28:** the FR-25 info button is built as the About dialog (FR-31, `AboutDialog.tsx`) — it opens prose about the product's problem/solution plus a link to `/methodology` at the bottom, rather than navigating directly to one page.

**Zero other controls float over the map** — with one deliberate exception (product decision 2026-08-27, FR-27): **the right-side map legend**, which specifically needs to stay visible when the side panel is collapsed. The hour slider, layer toggles, and export live **inside** the panel; the legend floats on the right side (collapsible, theme-aware), and `map.setPadding` reserves its width so `flyTo` still centers on the area that's actually visible.

**The map is one and the same instance in both modes.** It lives above the router; switching modes only changes the panel contents and triggers a `flyTo`. Never unmount the map when switching routes — besides triggering a basemap reload, it breaks the second scene of the demo video, whose job is precisely to prove both modes share one engine. `map.setPadding` must track whichever panel geometry is currently showing in both modes, so `flyTo` centers its target in the area of the map that's actually visible, not behind the panel.

### Mode 2 — parent (mobile-first, 390px up)

**Product decision 2026-08-28 (Revan): the panel is restructured in a Google/Apple Maps style.** The old order (address input → status sentence → hour slider → "safe until hour X" sentence → route comparison panel → petition button, all visible at once) is replaced by the order below. No FR is removed — FR-2 (status sentence), FR-4 (full comparison table), FR-5 (petition), and the `safe_until_hour` sentence are all still present, just repositioned:

```
Origin field          ← search input + live address suggestions (Nominatim, debounced)
Destination field     ← search input restricted to the school list within the AOI, same field style as Origin
Status sentence (FR-2) ← "Your home is 1.1 mi from Lincoln Elementary — inside the walk zone."
Live conditions        ← "Now · 7:00 AM" + live temperature if available, see amendment below
──────
Route card: Coolest    ← time · distance · mean temperature
Route card: Alternate 1 (FR-30, if any)
Route card: Alternate 2 (FR-30, if any)
──────
"Safe until" sentence  ← its own row, see the rule below
──────
▸ Details              ← full FR-4 comparison table + FR-5 petition button, behind a disclosure
```

**2026-08-28 amendment (Revan): the panel is trimmed to Origin, Destination, Routes, Details.** The example-address chip and the "Or drag the pin on the map." help text are removed from Origin — live search suggestions replace the need for the chip, and drag-pin doesn't need explanation anymore in a product at this level of "usual map." Destination stops being a native `<select>` and becomes a search input that filters the school list live as you type; clicking one of the results is the **only** way to change the school — text that doesn't match anything reverts to the last-selected school when the field loses focus, so the user can't land on a school outside the list. The status sentence and live-conditions row are still present (FR-2 P0, must not be removed) but are read as part of the Destination→Routes flow, not as a standalone fifth section.

FR-2 asks for this status sentence as the **"first output"** as soon as origin and destination are filled in — that's why it sits right below the two fields, before live conditions, and doesn't wait for route computation to finish (it comes from the straight-line home↔school distance, not from graph routing).

**2026-08-29 amendment (Revan): the drag-pin help text is restored to Origin, the example-address chip stays removed.** The origin pin has always been draggable (`usePinMarker.tsx`), but that's the map's only way to move the origin point — no click-on-map, and without written copy that ability has no visual affordance at all. One caption line (`text-xs text-ink-subtle`) now shows permanently under the Origin input: *"Can't find your address? Drag the pin on the map."* This line **shares one slot** with the existing `not_found`/`error` message — not a fourth stacked element — so the panel never shows two hint lines at once or jumps in height when search status changes. While the suggestion list is open, this line switches to the relevant search-status message; once closed or blurred, it reverts to the drag-pin text. The 2026-08-28 amendment above still applies to everything else — the example-address chip does not come back.

**2026-08-28 amendment (Revan, FR-13/FR-29): the hour slider is removed from Mode 2.** The "Departure time" row previously framed as "Leave at" is replaced by `LiveConditionsRow`, which always shows the current Orlando hour in 12-hour format ("Now · 7:00 AM", `formatHourAmPm` in `lib/units.ts`) — this hour is computed automatically from `clampToSchoolHour(currentOrlandoHour())`, not chosen by the user. If live FortyGuard temperature is successfully fetched for that school and hour, the same row adds the live temperature and its delta against the model day. FR-13 (slider) is henceforth purely a Mode 1 control, and still uses the 24-hour format there (tick granularity follows the `meta.hours` data, not the "usual map" style).

At viewport ≥768px, the map panel is used as a **side panel**: fields, status sentence, live-conditions row, and route cards are always visible without excessive scrolling; `Details` expands in place (not an overlay), scrolling with the panel.

Below 768px, the same panel renders as a **two-detent bottom sheet**: peek (fields + status sentence + live conditions) and expanded (route cards + `Details`). Minimum 44px touch target.

`Details` is a plain `<button>` that toggles one section — **not** the `accordion` component (that's reserved for the Methodology page, see §Component library). Monochrome like every other control — route cards must not use color, since color is reserved for the map, the map legend, and classification status badges. The selected card is distinguished by a neutral border/background (`border-ink` + `bg-surface`), not color.

Hierarchy on the first screen: Origin/Destination fields → live conditions → route cards in the panel + routes on the map.

The largest number on the Coolest card is the **coolest route's mean temperature at the currently selected hour** — `41.2°C (106.2°F)` — not the delta between routes. The delta between routes is small and appears as an ordinary table row inside `Details`, not enlarged (PRD FR-4). °C·min is present but smaller and always next to its °C (NFR §7).

The sentence `Safe if you leave before 1:00 PM` (`safe_until_hour`) appears on its own row between the route cards and `Details`, when the block hasn't been red all day. This is the single most useful sentence in all of Mode 2 — don't tuck it into a table.

### Mode 1 — district (desktop, 1280px up)

The same map panel, used as a **stack of three views** that replace each other (not stacked on top of each other), navigated with a back button in the panel's top row:

1. **School list** — search + list of analyzed schools and (optionally) unanalyzed national schools.
2. **Selected school** — school summary (FR-12) as a two-column metric grid (not a horizontal row — the 380px panel width isn't wide enough for a row), zone legend, layer toggles (A/B/C), hour slider, then (if available) CSV export. Back → school list.

**2026-08-28 amendment (Revan): the two misclassification rows in the school summary (FR-12) each get a `<Switch>` that highlights the relevant blocks on the map.** The highlight is drawn as a neutral outline over the choropleth — a 4px `--bg` casing then a 2px `--ink` line, zero new color — not a new fill, staying compliant with "color only in map/legend/badge." The two categories are independent and can both be on at once. The switch is dimmed and disabled when FR-16 is active **or** when its count is zero (e.g. "Gets bus, doesn't need it" is zero across all 42 wave-1 schools today) — not hidden, so the zero still reads as a fact, not as something silently missing.

**Amendment (Revan): the FR-15 segment priority table is dropped from the panel.** Too much diagnostic detail on one screen for what should be a simple decision ("this block is green/red, why"); FR-15 was already the first item on the dev plan's cut list after animations. `SegmentPriorityTable.tsx` and `useSegmentPriority.ts` were removed from `web/src/`, not hidden. Neither was ever rebuilt, and the related map highlight (FR-24) was never built either — the pipeline still produces `segments.json` (`docs/CONTRACT.md`), but nothing in the frontend currently reads it.

**Status as of 2026-08-28: the mismatches above have been fixed.** The zone legend now lives in a floating bottom-right card (`MapLegend.tsx` + `MapLegendContent.tsx`, FR-27), collapsible, theme-aware, dimmed when FR-16 is active — no longer only inside the school panel. `ZoneLegend.tsx` is removed. A copy of `MapLegendContent` is still rendered **inside** the school panel on viewports below `SIDE_PANEL_MIN_VIEWPORT_PX` (768px), because the floating card would collide with the bottom sheet that occupies the entire bottom of the screen there — not duplicated content, one source (`legendContent.ts`) rendered in one of two places depending on viewport. `map.setPadding` reserves the legend's width via `useMapPanelPadding`'s `rightReservedPx`. **The Mode 2 side of FR-27 (routes + policy circle) is now built too**, via `ParentMapLegendContent.tsx`, wired into `ParentRoute.tsx` — FR-27 is complete for both modes. The top-5 segment line (FR-24) referenced in earlier drafts of this legend spec was never built (see the Mode 1 amendment above) and isn't part of the legend.
3. **Selected block** — block detail panel (FR-9), with the outcome panel (FR-11) shown for red-category blocks. Back → selected school.

The hour slider lives in view 2, inside the panel. In this mode it controls the zone layer: moving it changes the choropleth color, not panel numbers.

---

## UI language

**English.** The audience is a Transportation Director at a US school district and the FortyGuard judges — both English-speaking.

Tone: short, declarative sentences, no exclamation marks. Numbers first, explanation after.

Consistent number formatting across the product: temperature to one decimal with °C and °F side by side, dose as a whole number, distance to two decimals for km and one decimal for miles, percentages as a signed whole number. All of it through the single util `web/src/lib/units.ts`.

---

## Accessibility

Not an add-on — this product is about child safety and will be presented to a public institution.

- Minimum text contrast 4.5:1, large text 3:1. Verify it, don't estimate it.
- Focus ring `2px solid --ink` with `outline-offset: 2px`. **Never** `outline: none` without a replacement.
- Zone categories must not be distinguished by color alone (see the redundancy rule above).
- The entire Mode 2 flow must be completable with a keyboard.
- The map is not the only path to information: a screen-reader-readable table of the reclassification list is an equivalent path.
- Layout must not break at 390px.

---

## Checklist before calling it done

- [ ] No color outside the map, legend, and status badges. A grep for `#` in `src/` is clean except in `theme.css`.
- [ ] All numbers use `tabular-nums`.
- [ ] Every °C·min has a °C next to it; every headline number has a °F.
- [ ] Zone categories read correctly in grayscale (test: take a screenshot, apply a saturate-0 filter).
- [ ] Light mode is the default; the toggle doesn't flash on reload.
- [ ] Layout holds at 390px and 1280px.
- [ ] `prefers-reduced-motion` turns off every transition.
- [ ] A visible focus ring on every interactive element.
- [ ] No leftover comments in `components/ui/`.
- [ ] The basemap uses OpenFreeMap's `liberty` style, and OpenStreetMap attribution is visible.
- [ ] Every symbol layer uses `Noto Sans Regular`/`Bold`/`Italic` (any other fontstack 404s on the glyph server).
- [ ] FR-16 turns off **every** heat signal: zones, temperature labels, route (Mode 2), tooltip radius dose — leaving only the policy circle + the neutral dashed coolest route (Mode 2; Mode 1 has no routes at all).
- [ ] The heat-dose overlay, legend, and classification badges still contrast clearly against the colored basemap (check red/yellow zones vs. basemap road/building colors).
- [ ] The hour slider (Mode 1) is monochrome, discrete, and has as many ticks as `meta.hours` is long.
- [ ] Numbers change with no tween when the hour is dragged (Mode 1) or when live temperature arrives (Mode 2); only route geometry fades (Mode 2).
- [ ] The slider (Mode 1) is fully draggable with a keyboard, and `aria-valuetext` contains the hour.
- [ ] Mode 2 has no hour slider — live conditions ("Now · 7:00 AM", 12-hour format) are always shown in the panel, and disappear only along with the origin/destination fields, not via FR-16.
- [ ] Alternate route cards (FR-30) are monochrome, their count can be 0, 1, or 2 (1–3 cards total) without breaking the panel layout.
- [ ] Selecting any route card thickens its line **and** makes the map `fitBounds` to that route (`hooks/useRouteFocus.ts`) — verify this especially when the selected route shares an identical path with another route (the most common case, G8), since line width alone won't be visible there.
- [ ] Origin has no example-address chip — only a search input with live suggestions, plus one permanent drag-pin caption line beneath it that shares a slot with the `not_found`/`error` message (never two lines at once, never shifting Destination's layout).
- [ ] Destination is a search input, not a `<select>`; typing a name that matches nothing never changes the selected school, and the field reverts to the last-selected school's name on blur.
- [ ] Switching `/` ↔ `/district` does not remount the map: no basemap flash, no tile reload.
- [ ] The map is visible on all four sides of the panel (top, bottom, right, and the left gap) — no full-width opaque bar left anywhere.
- [ ] Collapsing the panel returns the map to full view, and the control cluster stays reachable while the panel is collapsed.
- [ ] `map.setPadding` matches the panel geometry actually showing (side panel vs. bottom sheet vs. collapsed) in both modes — test by selecting a school and checking the `flyTo` center isn't hidden behind the panel.
- [ ] Below 768px, the map panel becomes a bottom sheet; above it, the side panel stays 380px and doesn't widen.
- [ ] Every school on the map has a pin icon and name at zoom ≥ 10.
- [ ] The home and school markers stay distinguishable after a `saturate(0)` filter on a screenshot.
- [ ] All map text has a `--bg` halo and reads clearly over the colored basemap, in both themes.
