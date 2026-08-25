# Arsip scouting AOI — Fase 1

Bukti empiris di balik PRD §1.3 (pencabutan gerbang kontras spasial) dan dev plan Fase 1.1/1.2. Bukan sampah — jangan dihapus. Analisis lengkap: `docs/phase1-scouting.md`.

Isi:

- 22 file `heatmap_*.json` ukuran 396 B: respons berstatus `Completed` dengan `n_cells = 0` — kegagalan senyap (menit `start_time` bukan `:00` dan payload pra-validasi). ±92.840 kredit terbuang pada panggilan-panggilan ini, catatan lengkap di `docs/METHODOLOGY.md`
- 8 file `heatmap_*.json` dengan envelope `request`/`response`: panggilan `pipeline/step1_scout_aoi.py` untuk 8 kandidat, `2026-08-18 15:00` lokal, granularity 60 m — sumber baris `data/out/aoi_scout.csv`
- 9 file `heatmap_*.json` tanpa envelope: tarikan kandidat dari sesi sebelum perbaikan logging request, bbox kandidatnya direkonstruksi dari koordinat tile
- `scratch_pine_hills_samples.json`: sampel titik `env_params` Orlando untuk catatan amplifikasi heat index di `docs/phase1-scouting.md`

`pipeline/fg_client.py` mencari cache secara rekursif dari `data/raw/` — file di arsip ini tetap berfungsi sebagai cache dan re-run `step1_scout_aoi.py` tidak membakar kredit.
