# CURRENT_STATE — 28 Agustus 2026

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
| 13 | Legend peta sisi kanan (FR-27) + tombol info metodologi (FR-25) | 🔄 **sebagian selesai, belum di-commit** — FR-27 Mode 1 (kartu legend kanan-bawah, bisa dilipat, meredup FR-16) dan FR-25 (lewat dialog About baru, FR-31) selesai; FR-27 Mode 2 dan garis top-5 di legend Mode 1 belum | `phase-13: FR-27 map legend for district mode + FR-25/FR-31 about dialog` |
| 14 | Parent: rute teradem biru + ramp FR-28, suhu live per-sel FR-29, opsi rute majemuk FR-30, slider dihapus FR-13 | ✅ selesai, **belum di-commit** | `phase-14: rute biru/ramp FR-28, suhu live per-sel FR-29, opsi rute majemuk FR-30, slider dihapus dari mode orang tua` |

## Yang ada di working tree (uncommitted)

Tumpukan Fase 9 + 10 + 11 + 14 **sudah di-commit oleh Revan** sebagai `3424098` ("added more schools in orlando, restyled some ui details", 510 file), disusul migrasi Git LFS `3e5a19c` + `3571af2` (Census). `HEAD == origin/main`.

Yang belum di-commit sekarang (sesi 28 Agustus, kedua dan ketiga — permintaan Revan untuk mode orang tua lalu tampilan distrik):

**Lanjutan kedua (mode orang tua, route `/`):**

- **Biru hanya rute terpilih (amendemen FR-28, Mode 2)**: rute tak terpilih 2–2,5px `--ink-subtle`, casing teradem disembunyikan. Hook baru `useRouteLayerOrder.ts` memindahkan layer rute terpilih tepat di bawah batas AOI via `moveLayer` (id layer diekspor dari tiap hook) — tanpa ini, geometri bersama G8 membuat abu menutupi biru.
- **Origin**: hook baru `usePickOrigin.ts` (pin + `flyTo` zoom ≥14,5 saat saran dipilih); `useOriginAddressSync` ditulis ulang — teks langsung jadi koordinat (`formatPinCoordinates` di `units.ts`), alamat reverse-geocode menimpa hanya jika permintaan masih terbaru, kegagalan Nominatim (limit ±1 req/s) tidak lagi meninggalkan alamat basi. Rantai prop di-rename `onPinChange` → `onPickOrigin`.
- Catatan: Revan sendiri mengomentari prop `footer` MapPanel di `ParentRoute.tsx` — biarkan apa adanya.

**Lanjutan ketiga (tampilan distrik, route `/district`):**

- **Rute dihapus total dari Mode 1 (FR-10 dicabut)**: hapus `useDistrictSelectedRoute.ts`, `useSegmentHighlightLayer.ts`, `lib/segmentHighlight.ts`, `solveCoolestPathSegments`+`coolestDoseAcrossHours` di `routeSolver.ts`; `useDistrictMapLayers`/`DistrictRoute` tanpa input rute. Angka rute per blok tetap di panel detail (precompute pipeline).
- **Siklus fokus sekolah**: state baru `focusedSchoolId` (district-local, mulai null) di `DistrictStateProvider`; klik pin/baris → fokus (pin lain hilang dari peta via filter `resolveAnalyzedSchoolId`), klik pin yang sama lagi / tombol back → lepas fokus penuh (fokus+blok+notice+jam dibersihkan, panel kembali ke daftar). `appState.selectedSchoolId` tak lagi disentuh Mode 1. `SchoolList` kehilangan prop `selectedSchoolId` (selalu null di daftar sekarang).
- **Pin belum-teranalisis terkunci**: `useSchoolPinsLayer` — `icon-opacity` ±0,55 + tanpa label nama untuk pin redup; klik tetap memunculkan notice FR-20.
- **Ramp FR-28 dipensiunkan**: hapus `lib/routeRampFeatures.ts`, prop `unselectedColor`, token `--route-heat-*` dari `theme.css`+`mapPaint.ts` — ramp tak punya tempat tampil lagi (Mode 2 netral, Mode 1 tanpa rute). `--route-coolest` tetap.
- **Dokumen**: PRD FR-6/FR-10/FR-20/FR-28 amendemen; DESIGN.md §Rute tabel + 2 amendemen penutup + §Penanda lokasi + checklist; METHODOLOGY §Revisi Fase 14 lanjutan kedua & ketiga; CURRENT_STATE (bagian ini).

**Lanjutan keempat (Fase 13, legend kanan + dialog About, permintaan Revan):**

- **Legend peta sisi kanan (FR-27, Mode 1 saja)**: konten statis di `lib/legendContent.ts` + `lib/aboutContent.ts` (baru); `LegendLineSwatch.tsx` (baru, swatch garis SVG dash/solid via token `currentColor`); `MapLegendContent.tsx` (baru) — empat seksi: kelas zona (pakai ulang `ClassificationBadge`), dua lingkaran radius (label + mil dari `schoolSummary`), batas AOI + catatan label suhu blok, dan paragraf baseline/threshold nyata dari `schoolData.temps.meta`. Baris/seksi yang berasal dari data panas meredup saat FR-16; baris lingkaran kebijakan dan batas AOI tetap penuh.
- **`MapLegend.tsx`** (baru) — kartu mengambang kanan-bawah, bisa dilipat (state `legendCollapsed` diangkat ke `DistrictStateProvider` karena `useMapPanelPadding` membutuhkannya), dirender di `DistrictRoute` hanya pada viewport ≥768px. `panelGeometry.ts` += `LEGEND_WIDTH_PX`/`LEGEND_ATTRIBUTION_CLEARANCE_PX`; `useMapPanelPadding` += opsi `rightReservedPx` supaya `map.setPadding` ikut me-reserve lebar legend.
- **Viewport sempit**: `MapLegendContent` yang sama dirender **di dalam** panel sekolah (`DistrictSchoolView.tsx`, ganti `ZoneLegend`) saat `useIsSidePanelViewport()` `false` — satu sumber konten, dua tempat tampil tergantung ukuran layar. `ZoneLegend.tsx` dihapus (nol importer setelahnya).
- **Dialog About (FR-31, baru, tanpa nomor FR sebelum sesi ini)**: `AboutDialog.tsx`, dipasang di `FloatingControls.tsx` sehingga tampil di kedua mode. Isi: tiga seksi prosa dari `aboutContent.ts` + baris baseline/threshold nyata (`useSchoolMeta`, sekolah pertama teranalisis) + dua tautan ke `/methodology` dan `/limitations` (dialog ditutup dulu sebelum `navigate`, supaya overlay Radix tidak tertinggal di atas halaman doc). Menyerap FR-25 — tombol info metodologi kini membuka dialog ini, bukan langsung `/methodology`.
- **Beres-beres sisa edit `DistrictPanel.tsx`**: prop `tile`/import `Tile` yang sudah tak terpakai (sisa dari pembersihan `TileCoverageInfo` sebelumnya) dibuang; `DistrictRoute.tsx` berhenti mengoper `tile` ke panel.
- **Dilaporkan, tidak dieksekusi**: `TileCoverageInfo.tsx` masih nol-importer di seluruh repo (menyentuh FR-21) — keputusan hapus/tidaknya diserahkan ke Revan.
- **Dokumen**: PRD FR-31 baru + amendemen FR-25/FR-27; DESIGN.md §Layout per mode (cluster kontrol + catatan ketidaksesuaian FR-27 di Mode 1); CURRENT_STATE (bagian ini).

**Lanjutan kelima (29 Agustus, mode orang tua, permintaan Revan):**

- **Hint drag-pin dikembalikan ke Origin**: `OriginField.tsx` — satu baris caption (`text-xs text-ink-subtle`) permanen di bawah input, teks default *"Can't find your address? Drag the pin on the map."* Fungsi murni `originHintFor(isSuggestionListOpen, status)` menggantikan dua blok `{isOpen && status === ...}` lama, sehingga hint dan pesan `not_found`/`error` berbagi satu slot — tidak pernah dua baris sekaligus, tidak ada layout shift ke Destination. Chip alamat contoh (dihapus 28 Agustus, lihat entri di atas) **tetap tidak dikembalikan**. Pin sudah `draggable: true` sejak awal (`usePinMarker.tsx`) dan tidak ada handler klik-di-peta — perubahan ini murni memberi hint itu affordance visual, tanpa menyentuh logika pin/geocode.
- **Dokumen**: DESIGN.md §Mode 2 (amendemen baru 2026-08-29) + checklist; CURRENT_STATE (bagian ini).

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
- Mode 2: satu-satunya garis biru = rute yang kartunya terpilih; klik kartu lain → biru berpindah dan garis terpilih tidak tertutup abu pada geometri bersama
- Mode 2: pilih saran Origin → kamera terbang ke pin baru; seret pin → teks Origin berganti (koordinat dulu, lalu alamat)
- Mode 1 tanpa fokus: semua pin tampil, tidak ada zona/rute, pin belum-teranalisis redup tanpa label; klik pinnya → notice "belum dianalisis"
- Mode 1 fokus: hanya pin sekolah terfokus yang tersisa + zona penuh; klik pin itu sekali lagi atau tombol back → kembali ke daftar semua pin
- Mode 1: pindah fokus antar sekolah me-reset slider jam ke jam kanonik

## Fase 14 — selesai, dikerjakan di luar urutan (lompat sebelum Fase 13)

Dikerjakan atas permintaan eksplisit Revan 2026-08-28 sebelum Fase 13 (legend) selesai — dicatat di sini karena itu pengecualian atas "kerjakan fase berurutan" `CLAUDE.md`. Tanpa legend FR-27, kartu rute terpilih di panel (border + garis menebal di peta) adalah satu-satunya penghubung visual kartu↔garis di Mode 2.

**Yang dibangun** (detail penuh di `docs/METHODOLOGY.md` §Fase 14):

- FR-28: token warna `--route-coolest`/`--route-heat-cool`/`--route-heat-hot` ditambah ke `theme.css` + `mapPaint.ts`; rute teradem jadi biru solid, rute terpendek jadi ramp biru→oren per segmen (`lib/routeRampFeatures.ts`, `hooks/useShortestRouteLayer.ts`, dipakai kedua mode).
- FR-29 diamendemen: suhu live FortyGuard sekarang **per-sel** dalam satu tile 5×5 km per sekolah (bukan satu offset se-AOI) — `web/api/live-temperature-start.ts` (bbox per-sekolah + validasi `schoolId`), `web/api/_lib/heatmapGrid.ts` + `live-temperature-result.ts` (grid raster ~84×84 sel), `lib/liveTemperatureGrid.ts` + `lib/edgeLiveTemperatures.ts` (sampling client-side ke tiap edge).
- FR-30 baru: hingga satu rute alternatif — total tiga kartu (`lib/routeAlternatives.ts`, metode penalti), Dijkstra client-side diganti binary heap (`lib/dijkstra.ts`) supaya tiga pencarian tetap <1 detik. Kartu panel bisa dipilih (`RouteOptionCard`/`RouteOptionList`).
- FR-13 diamendemen: slider jam dihapus dari Mode 2 — selalu `clampToSchoolHour(currentOrlandoHour())`, ditampilkan format 12 jam. `LiveConditionsRow` jadi affordance waktu ("Now · 7:00 AM"). Slider + `useDefaultHour` tetap dipakai penuh di Mode 1 (24 jam).

**Revisi same-day, dari review tangkapan layar Revan:** panel dipangkas jadi Origin/Destination/Routes/Details murni — chip alamat contoh dan teks "Or drag the pin" dihapus dari Origin, digantikan saran pencarian langsung (`hooks/useGeocodeSuggestions.ts`, ganti `useGeocode.ts` lama); Destination diganti dari `<select>` native jadi input pencarian yang dibatasi ke daftar sekolah — mengetik menyaring, hanya klik hasil yang mengganti sekolah, teks tak cocok kembali ke sekolah terakhir saat blur. Jumlah alternatif dipangkas dari rencana awal dua ke satu. **Bug diperbaiki:** memilih kartu rute selain "Coolest" tidak mengubah apa pun di peta — diperbaiki dengan lebar-garis reaktif-seleksi di `useRouteLayers`/`useShortestRouteLayer` (prop `selected?` baru) ditambah `hooks/useRouteFocus.ts` baru yang `fitBounds` ke rute terpilih setiap klik kartu, penting karena ~90% rute teradem/terpendek berbagi geometri identik (G8) sehingga lebar garis saja tidak selalu terlihat.

**Dokumen diamendemen dalam commit yang sama:** `heatwalk-prd.md` (FR-1, FR-13, FR-29, FR-30 baru + revisi jumlah alternatif), `DESIGN.md` (§Rute, §Mode 2, §Slider jam, checklist), `docs/METHODOLOGY.md` (§Fase 14 baru + §Revisi Fase 14 lanjutan), `docs/LIMITATIONS.md` (#23 ditulis ulang, #24 baru + revisi jumlah), `docs/CONTRACT.md` (kontrak respons `web/api/live-temperature-*`).

**Verifikasi yang lulus:** `npx tsc --noEmit` bersih, `npm run build` bersih, `wc -l` semua file baru/tersentuh ≤150 baris, grep `#` di `src/` bersih kecuali `theme.css`. Diverifikasi manual lewat `npm run dev` + browser dua putaran: (1) FR-28/29/30/13 awal — 2–4 kartu rute merender, toggle "Hide heat data" mematikan rute teradem+alternatif dan mengembalikan rute terpendek ke abu putus-putus (momen "lampu dimatikan" utuh), kegagalan `/api/live-temperature-*` (lingkungan dev tidak punya `vercel dev`/kunci API) terbukti gagal senyap — status `unavailable`, nol error console; (2) revisi panel — saran Origin muncul saat mengetik dan memindahkan pin saat diklik, Destination menolak nama sekolah yang tidak cocok dan kembali ke sekolah semula saat blur, tepat tiga kartu rute tampil, dan mengklik kartu mana pun (termasuk yang geometrinya identik dengan kartu lain) membingkai ulang peta ke rute itu.

**Belum diverifikasi** (butuh `vercel dev` + `FORTYGUARD_API_KEY` asli): jalur live sungguhan — apakah grid benar-benar datang, apakah dosis rute ter-upgrade setelah grid tiba, dan biaya kredit riil per sekolah dibuka. Jangan anggap ini lolos sampai dicoba dengan kunci asli.

## Catatan operasional

- **Nol operasi git** — Revan commit manual per fase dengan pesan usulan di tabel atas
- Python: `.venv/bin/python` (uv); re-run dari step3 tanpa `--fetch` = nol API call
- Jangan pernah membuka/mencetak `start_claude.sh` (berisi token)
- Dev server: `npm run dev` di `web/`
