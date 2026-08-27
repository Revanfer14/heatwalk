# CURRENT_STATE — 27 Agustus 2026

Snapshot progres HeatWalk (FortyGuard Hackathon '26, **deadline 30 Agu 2026 23:59 GST**).
Dipakai untuk re-orientasi cepat sesi berikutnya. Sumber lengkap: `heatwalk-prd.md`, `heatwalk-dev-plan.md`, plan feedback round 2 (`~/.claude/plans/majestic-knitting-shore.md`).

## Status per fase

| Fase | Isi | Status | Commit usulan |
|------|-----|--------|---------------|
| 0–8 | Pipeline + dua mode frontend (sesi sebelumnya) | ✅ committed (`d0c2b24` dst.) | — |
| 9 | PRD FR-22..FR-28 + amenden DESIGN.md | ✅ selesai, **belum di-commit** | `phase-9: PRD FR-22..FR-28 + amendmen DESIGN (rute biru, legend kanan, font usang)` |
| 10 | Pipeline: blok tak berpenduduk + `mean_c` per jam + file distrik gabungan | ✅ selesai, **belum di-commit** | `phase-10: klasifikasi blok tak berpenduduk + mean_c per jam + file blok distrik gabungan` |
| 11 | Distrik: render blok gabungan + label suhu blok + perbaikan font pin | ✅ selesai, **belum di-commit** | `phase-11: render blok distrik gabungan + label suhu blok + perbaikan font pin` |
| 12 | Distrik: hover lingkaran (FR-26) + highlight top-5 segmen (FR-24) | 🔄 **SEDANG BERJALAN** — desain final terkunci, belum ada kode ditulis | `phase-12: tooltip deskripsi lingkaran + highlight top-5 segmen prioritas di peta` |
| 13 | Legend peta sisi kanan (FR-27) + tombol info metodologi (FR-25) | ⏳ belum mulai | `phase-13: legend peta sisi kanan + tombol info metodologi` |
| 14 | Parent: rute teradem biru + ramp suhu biru→oren rute terpendek (FR-28) | ⏳ belum mulai (urutkan setelah 13 — butuh slot legend) | `phase-14: rute teradem biru + ramp suhu biru-oren rute terpendest` |

## Yang ada di working tree (uncommitted, 125 file)

Semua perubahan Fase 9 + 10 + 11 menumpuk di working tree:

- **Dokumen**: `heatwalk-prd.md` (FR-22..28), `DESIGN.md`, `docs/CONTRACT.md`, `docs/METHODOLOGY.md` (§Fase 10), `docs/LIMITATIONS.md` (#21 celah barat)
- **Pipeline**: `block_table.py` (hapus skip POP100=0), `blocks_hours.py` (+`mean_c`), `step5_export.py` (file distrik gabungan), `verify_step4.py` (cek skema jam + partisi distrik), **baru** `verify_schema_parity.py`
- **Data**: `data/out/` + mirror `web/public/data/` — 6 sekolah AOI ter-rebuild, **baru** `district_blocks.geojson` (3198 fitur, 5.8 MB) + `district_blocks_hours.json` (2.3 MB); fixtures ikut ter-generate ulang
- **Frontend**: `web/src` — loader distrik baru (`useDistrictBlocks`, `districtDataCache` singleton, `findDistrictBlock`), label suhu blok (`useBlockTempLabelsLayer`, `blockTempLabelFeatures`), `applyHourClass` stamp `temp_label`, font pin `Noto Sans Bold` (Medium 404), **dihapus** `useBlocksHours.ts`

## Angka kunci hasil Fase 10 (sudah disetujui user)

- Blok terklasifikasi: 2304 → **3198** (hijau 209→243, merah 2095→2955, kuning 0)
- Metrik kids (`in_walk_zone`, `reroute_enough`, `no_safe_route`) **identik** — blok baru tak berpenduduk
- Tidak ada blok lama berubah kelas (diverifikasi vs git HEAD)
- Radius setara-dosis Evans: 0.827 → **1.075 mi** (disetujui user via AskUserQuestion); 5 sekolah lain Δ ≤ 0.01 mi
- Celah barat bbox (di luar tile data panas): Meadowbrook ~17%, Ridgewood Park ~15%, UCP Pine Hills ~7%, Evans ~1%; Rosemont & Rolling Hills penuh

## Fase 12 — desain final (lanjut dari sini)

**Hover lingkaran (FR-26)** — semua keputusan sudah diambil:

- Baru `web/src/lib/mapHoverTooltip.ts` — singleton `maplibregl.Popup` (closeButton:false, closeOnMove:false, maxWidth ~260px), fungsi show/move/hide
- Baru `web/src/lib/circleDescriptions.ts` — teks tooltip dari data: kebijakan = "Policy walk zone — {formatMiles(walkRadiusMi)}" + "District policy, not federal: OCPS applies one walk zone to all grade levels (Florida Statute 1006.23)." (menjawab feedback D3); dosis = "Dose-equivalent radius — {formatMiles(doseRadiusMi)}" + "…under the heat threshold at {canonicalHour}"
- Baru `web/src/hooks/useCircleHoverTooltip.ts` — hover wiring dibagikan kedua lingkaran; ekspor `CIRCLE_RESTING_WIDTH_PX=1.5` / `CIRCLE_HOVER_WIDTH_PX=3`; mouseenter→width 3 + cursor pointer + popup, mousemove→popup ikut, mouseleave→restore
- Fold ke **dalam** `useOfficialZoneLayer` + `useDoseRadiusLayer` (ParentRoute 149/150 baris → nol baris baru); dose layer dapat input `canonicalHour` (di-thread via `useDistrictMapLayers` + DistrictRoute)
- Saat layer disembunyikan (toggle/FR-16): reset width + hide tooltip
- CSS `.maplibregl-popup-content` berbasis token ditambah ke `theme.css` (popup pertama di codebase); `maplibre-gl.css` sudah di-import di `MapRoot.tsx`

**Top-5 segmen (FR-24)**:

- `districtStateContext.ts`: `LayerVisibility` += `prioritySegments` (default on) + `selectedSegmentEdgeId`/setter di provider; label + entri `HEAT_DERIVED_LAYERS` di `LayerToggles` ("Top priority segments")
- Baru `lib/topSegmentFeatures.ts` — `TOP_SEGMENT_COUNT=5`, join `segments[i].edge_id` → `graph.edges[edge_id].geom` (geom = bare `number[][]`), LineString + label rank di vertex tengah; **tidak re-sort** (segments.json sudah urut pipeline)
- Baru `hooks/usePrioritySegmentsLayer.ts` — garis 7px `--zone-bus` (9px saat terpilih via case-expression), label rank Noto Sans Bold halo `--bg`, minzoom 12.5, `visible = layerVisibility.prioritySegments && !hideHeatData`; dipanggil setelah `useSegmentHighlightLayer`
- Baru `lib/geometryBounds.ts` + `hooks/useSegmentFocus.ts` — klik → `setSelectedSegmentEdgeId` + `map.fitBounds(geom, {maxZoom≈16})`
- `SegmentPriorityTable.tsx`: kolom rank, badge "Top 5" (`ui/badge.tsx` ada, variant outline), klik baris → `onSelectSegment`, baris terpilih di-highlight
- Build fitur top-5 di `useDistrictRouteData` (punya `schoolData.graph` + `segments` — pindahkan panggilan `useSegmentPriority` ke sini); refactor `useDistrictSelectionHandlers` baca context internal (input → `{districtBlocks}` saja) supaya DistrictRoute tetap ≤150 baris; clear `selectedSegmentEdgeId` saat klik blok / ganti sekolah
- Verifikasi: `npx tsc --noEmit`, `npm run build`, `wc -l` semua file tersentuh (≤150 TS/TSX), dev-server 200

## Yang menunggu mata Revan (visual, pasca Fase 11)

- Label suhu blok muncul di zoom ≥ 12.5 dan berganti saat slider jam digeser
- Zona penuh di dalam lingkaran 4 sekolah timur (celah barat sesuai LIMITATIONS #21)
- Klik blok milik sekolah lain → sekolah terpilih ikut berganti
- FR-16 ON → zona + label hilang; halo label terbaca di dark mode

## Catatan operasional

- **Nol operasi git** — Revan commit manual per fase dengan pesan usulan di tabel atas
- Python: `.venv/bin/python` (uv); re-run dari step3 tanpa `--fetch` = nol API call
- Jangan pernah membuka/mencetak `start_claude.sh` (berisi token)
- Dev server: `npm run dev` di `web/`
