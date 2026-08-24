# METHODOLOGY

Dokumen ini diisi bertahap seiring fase pipeline. Bagian bertanda **[Fase 0]** sudah final; bagian lain diisi Fase 1–7.

---

## [Fase 0] Definisi `tcm` — hasil verifikasi

**Kesimpulan: `tcm` adalah suhu udara ambien °C, bukan suhu permukaan.** Gerbang lulus.

Verifikasi dijalankan `pipeline/step0_verify_api.py` terhadap kotak ~1 mi² di sekitar Phoenix Sky Harbor (KPHX), tanggal `2026-08-18`, jam `15:00` waktu lokal Phoenix.

| Sumber | Nilai |
|---|---|
| `tcm` di tile yang memuat KPHX (33.4342, −112.0116) | **41.83°C** |
| METAR PHX jam sama (Iowa Environmental Mesonet ASOS) | **43.89°C** |
| Delta | **−2.06°C** |
| Kriteria putus | ±3°C → udara; ≥+8°C sistematis → permukaan |
| **Hasil** | **Dalam toleransi → suhu udara ambien.** |

Statistik tile di kotak verifikasi (863 tile, granularity 60m):

| min | p05 | median | p95 | max | %valid |
|---|---|---|---|---|---|
| 41.68°C | 41.69°C | 41.81°C | 41.85°C | 41.85°C | 100% |

Rentang sangat sempit (0.17°C) — diharapkan untuk kotak ~1 mi² homogen (parkiran/landasan bandara), bukan kegagalan. Kontras AOI demo adalah keputusan Fase 1 terpisah, diuji pada kotak jauh lebih besar dengan kanopi heterogen.

Ukuran tile terukur setelah reproyeksi ke EPSG:32612: **60.3 m** — cocok dengan `granularity=60` yang diminta.

`-999` dan `null` tertangani eksplisit di `pipeline/heatmap_stats.py:tile_values()` (dijadikan NaN, dikecualikan dari statistik). Pada respons verifikasi ini jumlah keduanya nol (data lengkap).

---

## [Fase 0] Cara meminta jam/tanggal spesifik

- `date_time.filter_type`: `1` = satu jam (`start_time` wajib), `2` = rentang jam sehari (`start_time`+`end_time`), `3` = satu hari penuh, `4` = rentang hari (≤1 bulan).
- `time_of_measure` **bukan** parameter pemilih jam — itu `analytic_type` terpisah yang mengembalikan jam puncak (0–23 UTC) per tile.
- **Konvensi zona waktu `start_time`: waktu lokal AOI, bukan UTC.** Dua bukti independen:
  1. Respons `POST /v1/env_params` untuk `start_time: "15:00"` mengembalikan `metadata.timestamps: ["2026-08-18T15:00:00-07:00"]` — offset `-07:00` = Phoenix (MST, tanpa DST), langsung menegaskan `15:00` diinterpretasikan sebagai jam lokal AOI.
  2. `tcm` di titik KPHX (41.83°C) hanya cocok dengan METAR pada interpretasi jam-lokal (43.89°C, delta −2.06°C). Interpretasi UTC langsung menghasilkan METAR jam 15:00 UTC (= 08:00 pagi lokal, 35.56°C) yang jelas tidak cocok.

Nilai ini penting: salah tafsir zona waktu bisa memberi selisih >10°C di Phoenix bulan Agustus dan menyebabkan gerbang gagal secara keliru.

---

## [Fase 0] Skema respons `heatmap` — temuan empiris

Dokumentasi FortyGuard menyebut hasil sebagai `{map_data, stats_data}` tanpa merinci nama field di dalam `properties` tiap tile. Hasil empiris:

| `analytic_type` | Key nilai di `properties` tile | Key statistik agregat (`stats_data`) |
|---|---|---|
| `tcm` | `average_temperature`, `min_temperature`, `max_temperature` (°C) | `temperature_stats.{minimum,maximum,mean,standard_deviation}`, `overall_temperature_distribution`, `normal_temperature_distribution`, `temperature_frequency` |
| `exceedance` | `value` (jam) | `analytic_type`, `units`, `n_cells`, `min`, `max`, `mean` |
| `persistence` | `value` (jam) | sama seperti `exceedance` |

`pipeline/heatmap_stats.py` mendeteksi key yang tersedia secara otomatis (`detect_value_key`), bukan hardcode satu nama — kedua skema di atas sudah tercakup.

`peak_c` per edge (dibutuhkan Fase 2.1 / FR-4 / FR-9) diambil dari `max_temperature`, bukan dihitung ulang dari sampel titik.

`map_data` adalah `GeoJSON FeatureCollection` berisi poligon tile — **bukan GeoTIFF**. Fase 2 merasterisasi poligon ini ke GeoTIFF 60m di `data/interim/` sebelum `rasterio.sample`.

---

## [Fase 0] Status tier Basic

Diprobe langsung terhadap API (bukan hanya dipercaya dari dokumentasi), keempatnya berhasil dengan API key trial:

| Endpoint / `analytic_type` | Status |
|---|---|
| `heatmap`, `analytic_type=tcm` | **OK** — Basic, granularity 60m tersedia |
| `heatmap`, `analytic_type=exceedance` | **OK** — Basic |
| `heatmap`, `analytic_type=persistence` | **OK** — Basic |
| `env_params` (wet_bulb, relative_humidity, solar_irradiance — 3 parameter, batas Basic) | **OK** — Basic |

Konsekuensi: FR-4 non-goal WBGT tetap berlaku (tidak ada wind speed/globe temperature), tapi `env_params` memberi `apparent_temperature_celsius` (43.7°C pada sampel verifikasi, vs `tcm` 41.83°C) dan `heat_index_celsius` (40.1°C) — bisa dipakai sebagai argumen "bukan sekadar suhu udara" di metodologi/pitch tanpa mengklaim WBGT.

Biaya kredit teramati: heatmap ~4.220 kredit/panggilan pada kotak ~1 mi² (863 tile); env_params ~2.900 kredit/panggilan. Kredit total paket Hackathon: 2.000.000 — verifikasi Fase 0 memakai 15.560 (0,8%).

---

## [Pending Fase 1] AOI final & kontras kanopi

_Diisi setelah AOI 10 mi² dikunci: bbox, tanggal persentil-95 terpanas, stdev tutupan kanopi, hasil uji p95−p05 ≥ 6°C._

## [Pending Fase 2] Rumus dosis & kalibrasi

- `BASELINE_C = 33.0°C` (Lanza dkk. 2023) — dicatat sebagai pilihan kalibrasi, bukan konstanta alam.
- `WALK_SPEED_MPS = 1.2`.
- `dose = max(temp_c - BASELINE_C, 0) × (len_m / WALK_SPEED_MPS) / 60` (°C·menit).
- `LAMBDA_DETOUR`: _diisi setelah kalibrasi cap detour 1,4× di Fase 2.3._

## [Pending Fase 3] Hasil gerbang kontras rute

_Diisi setelah Fase 3: delta °C top-20 pasangan OD, `contrast_report.csv`._

## [Pending Fase 4] `THRESHOLD` klasifikasi & definisi G6

_Diisi setelah kalibrasi ambang tiga kategori di Fase 4.1, dan definisi eksplisit "sedikit di luar radius" untuk `bus_not_needed`._

Catatan sementara: `pipeline/make_fixtures.py` memakai `THRESHOLD_DOSE_C_MIN = 220` (°C·menit) hanya supaya ketiga kategori — termasuk overlap dengan blok yang **saat ini** di dalam radius resmi — terisi di data fixture. Ini bukan kalibrasi final; nilai asli ditentukan Fase 4.1 dari data panas sungguhan. `BUS_NOT_NEEDED_MAX_EXCESS_MI = 0.25` mil juga baru placeholder untuk definisi "sedikit di luar radius" (G6), didokumentasikan ulang saat kalibrasi asli.

## [Pending Fase 1] Faktor kalibrasi enrollment per sekolah

_Diisi per sekolah: `faktor_koreksi = enrollment_CCD / estimasi_dasymetric`._

## [Pending] Sumber data & sitasi

- Lanza K, dkk. "Heat-Resilient Schoolyards: Access to Playgrounds and Shade." *J Phys Act Health* 2023;20(2):134–141.
- Arizona DHS. *Managing Extreme Heat Recommendations for Schools*, 2021.
- Meng Y, dkk. "Investigation of heat stress on urban roadways for commuting children." *Urban Climate* 2023;49:101564.
- Basu R, dkk. (2024).
- FortyGuard API — `https://docs-api.fortyguard.com`.
- Iowa Environmental Mesonet ASOS (ground truth METAR) — `https://mesonet.agron.iastate.edu`.
