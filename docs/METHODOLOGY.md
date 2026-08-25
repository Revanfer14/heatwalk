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

**[Fase 1] Temuan kritis — `start_time` hanya menerima menit `:00`.** `date_time.start_time` dengan menit bukan-nol (`07:30`, `14:15`, `14:30`, `14:45`) mengembalikan respons **`Completed` tanpa error**, tapi `map_data.features = []` dan `stats_data.n_cells = 0` — kosong senyap, bukan gagal. `14:00` dan `15:00` (menit `:00`) di bbox dan tanggal yang sama mengembalikan data penuh (863 tile).

Diverifikasi dengan payload identik kecuali `start_time`, pada `VERIFY_AOI_BBOX` + tanggal `2023-08-11`:

| `start_time` | Tile terkembalikan |
|---|---|
| `15:00` | 863 |
| `14:00` | 863 |
| `14:45` | **0** |
| `14:30` | **0** |
| `14:15` | **0** |
| `07:30` | **0** |

Konsekuensi: `MORNING_HHMM = "07:30"` dan `DISMISSAL_HHMM = "14:45"` di `pipeline/config.py` (nilai awal Fase 0, sesuai PRD §5.1/FR-13 "±07:30" dan "±14:45") **akan gagal senyap** kalau dipakai apa adanya — pipeline akan membangun graph dengan `temp_c` kosong tanpa satu pun exception. Diubah ke **`MORNING_HHMM = "08:00"`, `DISMISSAL_HHMM = "15:00"`** (menit `:00` terdekat). FR-13 menulis "~07:30" dan "~14:45" (tilde, aproksimasi), jadi pergeseran 15–30 menit ke jam bulat ini konsisten dengan spesifikasi, bukan penyimpangan darinya.

`pipeline/heatmap_fetch.py:_require_whole_hour()` memvalidasi ini secara eksplisit — memanggil `fetch_tcm()` dengan menit bukan `:00` melempar `UnsupportedStartTimeError` alih-alih diam-diam mengembalikan data kosong.

---

## [Fase 0] Skema respons `heatmap` — temuan empiris

Dokumentasi FortyGuard menyebut hasil sebagai `{map_data, stats_data}` tanpa merinci nama field di dalam `properties` tiap tile. Hasil empiris:

| `analytic_type` | Key nilai di `properties` tile | Key statistik agregat (`stats_data`) |
|---|---|---|
| `tcm` | `average_temperature`, `min_temperature`, `max_temperature` (°C) | `temperature_stats.{minimum,maximum,mean,standard_deviation}`, `overall_temperature_distribution`, `normal_temperature_distribution`, `temperature_frequency` |
| `exceedance` | `value` (jam) | `analytic_type`, `units`, `n_cells`, `min`, `max`, `mean` |
| `persistence` | `value` (jam) | sama seperti `exceedance` |

`pipeline/heatmap_stats.py` mendeteksi key yang tersedia secara otomatis (`detect_value_key`), bukan hardcode satu nama — kedua skema di atas sudah tercakup.

**Koreksi (Fase 1):** `peak_c` per edge (dibutuhkan Fase 2.1 / FR-4 / FR-9) **tidak** diambil dari `max_temperature`. Diverifikasi pada 863/863 tile respons `tcm` bahwa `min_temperature == average_temperature == max_temperature` — tile 60m adalah unit resolusi terkecil, `max_temperature` tidak membawa informasi sub-tile apa pun. Raster yang dibangun Fase 1.2 karena itu **satu band** dari `average_temperature`. `peak_c` per edge Fase 2.1 dihitung sebagai maksimum antar-tile yang dilintasi geometri edge.

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

**[Fase 1] Koreksi biaya kredit — flat per panggilan, bukan per sel/luas.** Angka "0,8%" di atas dari 863 tile saja, sebelum scouting Fase 1. Diverifikasi ulang dengan tiga panggilan terkontrol pada `VERIFY_AOI_BBOX`:

| Panggilan | `granularity` | `n_cells` | Kredit terpakai |
|---|---|---|---|
| A | 60 | 863 | 4.220 |
| B | 100 | 309 | 4.220 |
| C (kotak 10 mi² penuh) | 60 | 6.642 | 4.220 |

Ketiganya identik meski `n_cells` berbeda 21×. **`heatmap` (`analytic_type=tcm`) dikenakan biaya flat 4.220 kredit per panggilan**, tidak bergantung granularity maupun luas AOI (dalam rentang yang diuji). Ini juga menjelaskan rata-rata `151.920 / 36 = 4.220` yang teramati sebelumnya — **setiap satu dari 36 panggilan `heatmap` Fase 0–1, termasuk 22 yang kosong senyap, dikenai biaya sama.** ≈92.840 kredit (22 × 4.220) terbuang pada panggilan yang tidak menghasilkan data.

Konsekuensi untuk desain `pipeline/step1_scout_aoi.py`: tidak ada insentif biaya memakai granularity kasar untuk screening — semua scouting langsung memakai `granularity=60` (resolusi final) karena harganya sama. `pipeline/config.py:GRANULARITY_M_ALLOWED = (60, 80, 100)` — nilai lain ditolak API dengan HTTP 422 sebelum activity dibuat (gratis, tapi dicegah lebih dulu di `heatmap_fetch._require_allowed_granularity()` supaya jelas kenapa gagal).

**Penyebab 22 panggilan kosong senyap:** tidak bisa direkonstruksi retroaktif — `data/raw/` menyimpan respons tapi bukan payload permintaannya (bug yang sudah diperbaiki, lihat di bawah). Empat di antaranya terdokumentasi (menit `start_time` bukan `:00`, tabel di atas); sisanya (18 panggilan, cluster 21:53–22:27, kemungkinan besar scouting kandidat AOI awal dengan payload yang belum tervalidasi) tidak punya jejak. `pipeline/fg_client.py:run()` sekarang menyimpan `{"request": {...}, "response": {...}}` per panggilan (kompatibel mundur dengan cache lama yang hanya berisi `response`), jadi kegagalan senyap ke depan bisa didiagnosis langsung dari file cache-nya.

Kredit riil terpakai sampai akhir scouting AOI Fase 1 (dicek `fg_client.check_credits()`): **213.100 dari 2.000.000 (10,7%)**, sisa 1.786.900. Bukan 0,8% seperti tercatat sebelumnya.

Biaya kredit per endpoint: `heatmap` (`tcm`) 4.220/panggilan flat; `env_params` ~2.900/panggilan (belum diverifikasi flat/variabel, jumlah panggilan terlalu sedikit untuk disimpulkan).

---

## [Fase 1] Kota demo — pivot Phoenix → Florida

Statuta *hazardous walking conditions* Arizona (PRD §11, §5.4) diverifikasi **tidak ada** pada 24 Agustus 2026, sebelum data Fase 1 apa pun ditarik:

- `ARS §15-901` ("Definitions") mendefinisikan "eligible student" murni berbasis jarak: >1 mil untuk siswa SD, >1,5 mil untuk SMP/SMA. Tidak ada carve-out kondisi berbahaya.
- Satu-satunya kemunculan kata "hazardous" di statuta itu ada di definisi "small isolated school district" — soal jarak mengemudi *antar-sekolah*, bukan soal siswa berjalan kaki.
- Kode kebijakan model Arizona School Boards Association untuk "Walkers and Riders" (**EEAA**) — kode NEOLA tempat ketentuan hazardous-walking biasanya hidup di negara bagian lain — berstatus **dihapus** dari daftar kebijakan advisory ASBA.
- Sumber: `azleg.gov/ars/15/00901.htm`, `azsba.org/policy-advisories/`.

Konsekuensi: fondasi hukum FR-5 (teks permohonan) dan §1.2 PRD tidak punya sandaran di Arizona. Keputusan (Revan, 24 Agu 2026): **pindah kota demo ke Florida** (Orlando/Tampa), memakai **Florida Statute §1006.21/§1006.23** — definisi "hazardous walking condition" tertulis eksplisit (lebar jalur <4 kaki, dst.), angka historis 19.693 siswa TA 2019–2020 lewat mekanisme ini, dan distrik Florida wajib punya proses penetapan tahunan yang menghasilkan dokumen publik → sumber `policy_source` yang bisa disitasi langsung, bukan diasumsikan.

`PRD §5.4` dan `§11` sudah diperbarui untuk mencatat keputusan ini. `pipeline/config.py` konstanta `VERIFY_*` (KPHX/METAR) **tidak diubah** — itu catatan Fase 0 yang sudah lulus dan independen dari kota demo (properti `tcm` sebagai suhu udara berlaku di mana pun, bukan spesifik lokasi).

## [Fase 1] AOI terpilih & pencabutan gerbang kontras

**Gerbang kontras spasial gagal pada seluruh 8 kandidat yang diuji** — terbaik `orl_pine_hills_n` 1,84°C (31% dari syarat 6°C). Hasil ini justru mengonfirmasi ulang properti `tcm` hasil Fase 0: suhu udara 2m AGL tercampur konvektif sehingga variasi intra-urban dalam radius 5 km memang hanya 1–3°C. Kontras 15–25°C pada peta panas kota adalah suhu **permukaan**, bukan suhu udara.

Keputusan produk 25 Agustus 2026 (PRD §1.3), sudah dieksekusi:

- Gerbang kontras spasial **dicabut**; klaim "pilih rute lain, hemat 4°C" tidak dipakai lagi. Kontras berpindah ke tiga sumbu yang tetap bersumber FortyGuard: waktu (G1′, target ≥6°C antar-slice pada rute yang sama), durasi × circuity (radius setara-dosis), dan exceedance (offset spasial per blok terhadap distribusi ASOS). Delta antar-rute menjadi G2b — dilaporkan apa adanya.
- **AOI terkunci: `orl_pine_hills_n`**, dipilih lewat kriteria hukum-dulu PRD §5.4 (statuta hazardous walking Florida terkuat, 19.693 siswa TA 2019–2020). Kontras kanopi hanya tie-breaker, tidak lagi menentukan.
- Phoenix dipertahankan **pipeline-only** sebagai bukti portabilitas (G10), tidak pernah dirender di UI.

Tabel lengkap 8 kandidat, catatan persentil hari uji (PHX p91,9; MCO belum dianalisis), dan temuan tambahan (tiga slice waktu `orl_pine_hills_n` dari arsip pra-kalibrasi; amplifikasi `heat_index` ×2,1 pada sampel `env_params` 2023-08-11): **`docs/phase1-scouting.md`**. Respons mentahnya diarsipkan di `data/raw/phase1_scouting/` dan tetap berfungsi sebagai cache `fg_client`.

## [Fase 1.3] Kebijakan transportasi OCPS, batas attendance, kepadatan sekolah

**Kriteria #2 — radius walk zone.** `ocps.net/transportation-faqs` (diakses 25 Agustus 2026): siswa layak bus kalau tinggal ≥2 mil dari sekolah yang ditugaskan, ATAU punya IEP/504 aktif, ATAU (khusus SD) tinggal <2 mil tapi tanpa rute pejalan kaki bebas hazard sesuai FS §1006.23. Kutipan kunci: *"The Orange County School Board has approved this criteria be applied for secondary students as well"* — radius 2 mil berlaku **seragam SD–SMA**, bukan bertingkat per jenjang seperti asumsi awal fixture. Jarak diukur dari batas properti rumah (titik temu dengan right-of-way publik) ke pintu masuk gedung sekolah terdekat, rute pejalan kaki terpendek.

Tidak ditemukan **PDF kebijakan** dengan nomor halaman eksplisit — pencarian ke `go.boarddocs.com/fla/orcpsfl` menemukan dokumen kebijakan JCA "Assignment of Students to School" tapi bukan kebijakan transportasi/JC yang memuat radius, dan aksesnya `403 Forbidden` untuk fetch otomatis. Sumber yang dipakai untuk `walk_radius_mi = 2.0` dan `policy_source` adalah halaman FAQ resmi OCPS di atas, bukan PDF — dicatat eksplisit sebagai limitasi (PRD §8), bukan disamarkan sebagai PDF yang tidak ada.

**Kriteria #3 — batas attendance ArcGIS.** OCPS punya beberapa halaman GIS publik (`ocps.net/gis`, `ocps.net/gis-home`, `ocps.net/school-attendance-zone-maps`, disebut juga "OCPS GIS Data HUB" dan alat "Find My School"), tapi **`ocps.net` menolak fetch otomatis** (`socket hang up` konsisten pada 7 percobaan berbeda, kemungkinan WAF/bot-block) dan pencarian tidak menemukan URL REST service ArcGIS langsung yang bisa diverifikasi independen. **Fallback ke NCES EDGE SABS** dipakai untuk Fase 1.5.5, dicatat sebagai limitasi PRD §8 poin 9 — bukan kegagalan diam-diam.

**Kriteria #4 — kepadatan sekolah, NCES CCD.** Diverifikasi lewat query langsung ke REST service resmi NCES EDGE (`nces.ed.gov/opengis/rest/services/K12_School_Locations/EDGE_GEOCODE_PUBLICSCH_1920/MapServer/0/query`, envelope `bbox` `orl_pine_hills_n`, vintage tahun ajaran 2019–20): **10 sekolah** dikembalikan dalam bbox, jauh di atas gerbang minimum 2. Sembilan teridentifikasi by name: Gateway, Maynard Evans High, Rolling Hills Elementary, Meadowbrook Middle, Ridgewood Park Elementary, Devereux Treatment Program, Rosemont Elementary, Sheeler High Charter, Positive Pathways Transition Center (satu record tambahan tidak sempat ditarik namanya). **Gerbang kriteria #4 lolos jauh dari batas** — bbox tidak perlu digeser.

## [Pending Fase 2] Rumus dosis & kalibrasi

- `BASELINE_C = 33.0°C` (Lanza dkk. 2023) — dicatat sebagai pilihan kalibrasi, bukan konstanta alam.
- `WALK_SPEED_MPS = 1.2`.
- `dose = max(temp_c - BASELINE_C, 0) × (len_m / WALK_SPEED_MPS) / 60` (°C·menit).
- `LAMBDA_DETOUR`: _diisi setelah kalibrasi cap detour 1,4× di Fase 2.3._

## [Pending Fase 3] Hasil gerbang kontras rute

_Diisi setelah Fase 3: delta °C top-20 pasangan OD, `contrast_report.csv`._

## [Fase 1.5, indikatif — final di Fase 4] `THRESHOLD_DOSE_C_MIN`

**`THRESHOLD_DOSE_C_MIN = 220,0` (nilai awal, era-Phoenix) diverifikasi mustahil dicapai di Orlando — nol panggilan API, dua sumber yang sudah ada di cache.**

Distribusi suhu raster asli `orl_pine_hills_n` (2026-08-18 15:00, 6.970 sel, nol NaN, `data/raw/phase1_scouting/heatmap_720b637f5aa4.json`):

| Persentil | p05 | p50 | p90 | p95 | p99 | max |
|---|---|---|---|---|---|---|
| °C | 33,31 | 33,74 | 34,69 | 35,15 | 35,43 | 35,54 |

Dosis (°C·menit) untuk perjalanan bersuhu seragam, `BASELINE_C = 33,0`, `WALK_SPEED_MPS = 1,2`:

| jarak \ suhu | 33,7°C | 35,2°C | 36,0°C | 37,2°C | 38,0°C |
|---|---|---|---|---|---|
| 0,5 mi | 7,8 | 24,6 | 33,5 | 46,9 | 55,9 |
| 1,0 mi | 15,6 | 49,2 | 67,1 | 93,9 | 111,8 |
| 1,5 mi | 23,5 | 73,8 | 100,6 | 140,8 | 167,6 |
| 2,0 mi | 31,3 | 98,3 | 134,1 | 187,8 | 223,5 |

Untuk menyentuh 220 dibutuhkan suhu rata-rata edge **42,8°C pada rute 1 mil**, 39,6°C pada 1,5 mil, 37,9°C pada 2 mil (radius kebijakan OCPS, lihat §1.3 di atas). METAR MCO 2019–2025 (`data/raw/metar_range_MCO_60fc44e79e19.csv`, 55.446 baris jam-jaman) mencatat suhu maksimum harian tertinggi dalam 6+ tahun hanya **37,2°C** (2023-08-08). Pada `THRESHOLD = 220`, G1 (≥1 blok merah) tidak akan pernah terpenuhi di Orlando — ini bukan bug, `220` memang angka Phoenix yang belum pernah dikalibrasi ulang terhadap AOI final.

**Konsekuensi pada tanggal fetch (Fase 1.5.4, belum dijalankan):** dikunci ke **2023-08-08**, hari terpanas di seluruh rekaman MCO dan berada di bulan sekolah. `2023-08-11` (tiga hari kemudian) sudah terbukti mengembalikan 863 tile penuh di Fase 0 — rentang historis 2023 dipastikan didukung API.

**Nilai indikatif dipakai sementara di `pipeline/config.py`: `THRESHOLD_DOSE_C_MIN = 110,0`.** Dipilih supaya distribusi fixture (`pipeline/make_fixtures.py`, kurva jam diurnal 07:00–16:00 rentang 33–38°C, bukan lagi rentang Phoenix) tidak degenerate — hasil aktual **79 hijau / 30 kuning / 11 merah** dari 120 blok. Ini **bukan kalibrasi final**: begitu kurva jam asli dari data FortyGuard sungguhan tersedia (Fase 1.5.7 dan Fase 2), nilai ini wajib direvisi ulang di Fase 4.1 berdasarkan data panas nyata — keputusan produk, bukan keputusan pipeline. `BUS_NOT_NEEDED_MAX_EXCESS_MI = 0,25` mil juga masih placeholder untuk definisi "sedikit di luar radius" (G6), didokumentasikan ulang saat kalibrasi asli.

## [Fase 1.5.5] Akuisisi data pendukung

**Jaringan jalan (OSM).** `osmnx.graph_from_bbox(bbox=orl_pine_hills_n, network_type='walk')` → **3.557 node, 9.930 edge**, jauh di atas gerbang minimum 3.000. Disimpan `data/interim/osm/orl_pine_hills_n_walk.graphml`. Overpass API (`overpass-api.de`) menolak request tanpa header `User-Agent` eksplisit (`406 Not Acceptable`) — bukan masalah cakupan data, sudah ditangani di `pipeline/osm_network.py` (osmnx mengatur User-Agent sendiri secara default).

**Sekolah + enrollment (NCES CCD, real — bukan fixture).** Query ulang ke service admin data terkini `EDGE_ADMINDATA_PUBLICSCH_2324` (tahun ajaran 2023–24, punya field `TOTAL` enrollment dan `SCHOOL_LEVEL`, tidak seperti service geocode `EDGE_GEOCODE_PUBLICSCH_1920` yang dipakai di §1.3 untuk hitung kepadatan saja). Envelope `bbox` `orl_pine_hills_n` mengembalikan 11 record; 5 dibuang (`SCHOOL_LEVEL = "Other"` — program virtual/treatment center yang berbagi satu koordinat kantor distrik, bukan gedung sekolah dengan walk zone nyata). **6 sekolah fisik nyata masuk `schools.json`:**

| Sekolah | Level | Enrollment | NCES id |
|---|---|---|---|
| Maynard Evans High | high | 2.403 | 120144001404 |
| Rolling Hills Elementary | elementary | 513 | 120144001421 |
| Meadowbrook Middle | middle | 894 | 120144001435 |
| Ridgewood Park Elementary | elementary | 469 | 120144001449 |
| Rosemont Elementary | elementary | 561 | 120144003218 |
| UCP Pine Hills Charter | elementary | 160 | 120144004114 |

`walk_radius_mi = 2,0` dan `policy_source` dipakai sama untuk keenamnya, dari kutipan OCPS FAQ §1.3 di atas — bukan asumsi baru.

**Batas attendance — fallback nearest-school dikonfirmasi dipakai.** ArcGIS OCPS tetap tidak bisa diakses otomatis (lihat §1.3). NCES tidak menyediakan SABS (School Attendance Boundary Survey) sebagai REST service — hanya `K12_School_Locations`, `School_District_Boundaries` (level distrik, terlalu kasar), `Postsecondary_School_Locations`, `Locale_Boundaries`, `Social_Economic`, `Utilities` yang tersedia di `nces.ed.gov/opengis/rest/services`. Percobaan unduh langsung pola URL SABS bulk (`.../edge/data/SABS_2122_PUBSCH.zip`, `.../edge/Geographic/SchoolBoundaries`) kembali `404`. **Assignment blok→sekolah dipakai nearest-school by centroid distance** (fallback ketiga yang sudah diantisipasi dev plan §1.5.5) — dijalankan nanti di Fase 2/4 saat geometri blok Census sudah ada, dicatat di sini supaya keputusannya terkunci sebelum kode ditulis. Limitasi ini masuk `docs/LIMITATIONS.md` di Fase 7.

**Blokir sementara — Census API key (selesai, lihat lanjutan di bawah).** `.env` sempat punya `CENSUS_API_KEY=` kosong; `api.census.gov` menolak **semua** query data (bahkan satu variabel, level negara bagian) tanpa key — balasan `200 OK` tapi body HTML "Missing Key", bukan JSON. Revan mendaftar key gratis lewat `api.census.gov/data/key_signup.html` dan menempelnya ke `.env` sendiri (tindakan pendaftaran akun tidak diambil alih otomatis, sesuai batas di `CLAUDE.md`). Key butuh waktu aktivasi (percobaan pertama `Invalid Key`, lihat §1.5.5 lanjutan) sebelum akhirnya bekerja.

## [Fase 1.5.5 lanjutan] Census DHC P12, ACS B19013/B17001 — key aktif

Key Census sempat ditolak (`Invalid Key`) pada percobaan pertama (25 Agustus 2026) — key terbaca tapi belum aktif, kemungkinan menunggu konfirmasi email/propagasi. Setelah Revan konfirmasi ulang, key aktif dan seluruh query di bawah berhasil tanpa perubahan kode.

**Geometri blok nyata.** TIGERweb (`tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Tracts_Blocks/MapServer/2`, layer "2020 Census Blocks") dipakai untuk menemukan **454 blok sensus** yang berpotongan dengan bbox `orl_pine_hills_n`, merentang **20 tract**. Layer ini juga membawa `POP100` (populasi total 2020) dan titik-dalam (`INTPTLAT`/`INTPTLON`) per blok secara gratis — dipakai sebagai centroid untuk assignment nearest-school, bukan geometri poligon penuh (poligon sebenarnya menunggu Fase 4 kalau dibutuhkan untuk `blocks.geojson` asli).

**Anak 5–17 (Census 2020 DHC P12).** Ditarik per-tract (20 panggilan, gratis, di-cache `data/raw/census_dhc_p12_*.json`) untuk 3 kelompok umur × 2 jenis kelamin (`P12_004N/005N/006N` laki-laki, `P12_028N/029N/030N` perempuan, kelompok 5–9/10–14/15–17). **Total 11.417 anak 5–17 tahun** di 454 blok dalam bbox.

**Pendapatan (ACS 2022 5-year, B19013).** Level **block group** (lebih detail dari tract) — 56 block group dalam bbox, **53 bernilai valid**, 3 disupresi (estimasi tidak reliable, ditandai `-666666666` oleh Census sendiri — bukan kegagalan pipeline). Rentang pendapatan median `$16.190–$237.351`.

**Kemiskinan (ACS 2022 5-year, B17001).** **Disupresi total di level block group** untuk seluruh AOI ini (`null` di semua 56 block group, dikonfirmasi bukan bug — variabel yang sama bekerja normal di level county). Turun ke **level tract** (20 tract, semua valid): rentang tingkat kemiskinan **1,9%–32,1%**. Dicatat sebagai limitasi granularitas: `lowest_income_quartile` di `summary.json` idealnya butuh join blok→block-group (income) tapi blok→tract (kemiskinan) — dua level geografi berbeda, bukan pilihan sembarangan.

## [Fase 1.5.6] Faktor kalibrasi enrollment per sekolah

`faktor_koreksi = enrollment_CCD / estimasi_dasymetric`. `estimasi_dasymetric` = jumlah anak per blok (Census DHC P12 di atas) dijumlahkan ke sekolah terdekat (nearest-school, fallback §1.5.5), **dibatasi pita umur sesuai jenjang sekolah** — bukan sekadar total 5–17 tahun mentah.

Percobaan pertama (total 5–17 tanpa pembatasan jenjang) menghasilkan **3 dari 6 sekolah di luar rentang 0,3–3,0**, semuanya under-estimate parah (faktor 0,12–0,28) — gejala jelas: setiap blok menyumbang SEMUA anak 5–17 ke sekolah terdekatnya, jadi remaja SMA di dekat sebuah SD ikut membengkakkan penyebut SD itu padahal mereka tidak akan pernah bersekolah di sana. Diperbaiki dengan realokasi bracket 5-tahunan Census (`5–9`, `10–14`, `15–17`) ke rentang kelas riil pakai asumsi distribusi seragam dalam tiap bracket: SD (K–5) = `5–9` penuh + 1/5 dari `10–14`; SMP (6–8) = 3/5 dari `10–14`; SMA (9–12) = 1/5 dari `10–14` + `15–17` penuh. Ini perbaikan metodologi (bug nyata: pita umur salah), bukan pergeseran ambang untuk memperbagus hasil.

| Sekolah | `enrollment_CCD` | `estimasi_dasymetric` (pita umur) | `faktor_koreksi` |
|---|---|---|---|
| Maynard Evans High | 2.403 | 487,8 | **4,926** — di luar rentang |
| Rolling Hills Elementary | 513 | 400,0 | 1,282 |
| Meadowbrook Middle | 894 | 513,6 | 1,741 |
| Ridgewood Park Elementary | 469 | 740,8 | 0,633 |
| Rosemont Elementary | 561 | 1.777,8 | 0,316 |
| UCP Pine Hills Charter | 160 | 618,0 | **0,259** — di luar rentang |

**4 dari 6 sekolah masuk rentang 0,3–3,0 setelah perbaikan pita umur.** Dua sisanya punya sebab terdiagnosis, bukan pipeline yang salah:

- **Maynard Evans High (4,93×):** ini satu-satunya SMA dalam bbox kecil `orl_pine_hills_n` (~5×5 km). Catchment SMA nyata jauh lebih besar dari catchment SD/SMP — sebagian besar dari 2.403 siswa terdaftarnya tinggal **di luar bbox**, jadi estimasi dasymetric yang dibatasi ke blok-blok dalam bbox otomatis under-estimate. Bukan kesalahan assignment, tapi keterbatasan AOI yang sengaja kecil (§Fase 1).
- **UCP Pine Hills Charter (0,26×):** sekolah charter beroperasi lewat **lotere se-distrik**, bukan zona geografis. Asumsi inti nearest-school assignment (anak bersekolah di sekolah terdekat) tidak berlaku untuknya sama sekali — faktor ini secara struktural tidak bisa dipercaya berapa pun metodenya diperhalus, kecuali data enrollment by-address sungguhan tersedia (tidak ada, di luar cakupan hackathon).

Sesuai fail branch dev plan (`faktor_koreksi di luar 0,3–3,0` → "jangan pakai angkanya, cek batas attendance dulu"): kedua angka **tetap ditulis apa adanya** ke `summary.json` (bukan disembunyikan di balik placeholder `1.0`) karena keduanya informatif dan sebabnya terjelaskan, tapi **tidak dipakai sebagai pengali tervalidasi** di perhitungan dose-eliminated manapun — `correction_factor` di `summary.json` saat ini murni deskriptif. Revisit di Fase 4 kalau batas attendance nyata (ArcGIS/SABS, §1.3/1.5.5) akhirnya bisa diakses.

## [Fase 1.5.7] Kurva jam & `canonical_hour` — dari data asli

Dihitung dari 10 GeoTIFF hasil fetch nyata (§1.5.4, `data/interim/heatmap/orl_pine_hills_n/*.tif`), disampel di titik tengah setiap edge jaringan jalan OSM asli (`data/interim/osm/orl_pine_hills_n_walk.graphml`, 9.930 edge), dirata-ratakan berbobot `length` (meter) per edge — `pipeline/hourly_curve.py`.

| Jam | 07:00 | 08:00 | 09:00 | 10:00 | 11:00 | 12:00 | 13:00 | 14:00 | 15:00 | 16:00 |
|---|---|---|---|---|---|---|---|---|---|---|
| °C (berbobot panjang jalan) | 28,186 | 29,605 | 31,647 | 33,925 | 33,994 | 35,534 | 35,483 | 36,391 | **37,409** | 36,912 |

**`canonical_hour = "15:00"`** — diturunkan dari data (rata-rata tertinggi), bukan dikonstantakan. Kebetulan cocok dengan asumsi fixture sebelumnya, tapi angka di baliknya sekarang nyata.

**`delta_temporal_c = 9,223°C`** (15:00 − 07:00) — rentang variasi suhu sepanjang hari sekolah jauh lebih besar dari kontras spasial AOI (§Fase 0/1, p95−p05 ≈ 1,8°C pada satu jam). Implikasi: **kapan** anak berjalan pulang jauh lebih menentukan dosis panas daripada **rute mana** yang mereka ambil — ini G7, dilaporkan apa adanya sesuai dev plan, bukan hasil yang dicari-cari.

Metode: `edges.geometry.interpolate(0.5, normalized=True)` pada GeoDataFrame OSM (CRS geografis) memicu warning akurasi dari GeoPandas untuk operasi jarak — diabaikan dengan sengaja di sini karena yang dihitung hanya **lokasi sampel** (bukan panjang; panjang tetap dari kolom `length` OSM dalam meter, hasil proyeksi UTM osmnx sendiri), sehingga distorsi CRS-geografis pada interpolasi titik tengah segmen pendek (median puluhan meter) dapat diabaikan.

## [Pending] Sumber data & sitasi

- Lanza K, dkk. "Heat-Resilient Schoolyards: Access to Playgrounds and Shade." *J Phys Act Health* 2023;20(2):134–141.
- Arizona DHS. *Managing Extreme Heat Recommendations for Schools*, 2021. (sitasi ilmiah ambang perilaku panas — tetap dipakai meski kota demo pindah ke Florida; bukan sandaran hukum)
- Meng Y, dkk. "Investigation of heat stress on urban roadways for commuting children." *Urban Climate* 2023;49:101564.
- Basu R, dkk. (2024).
- Florida Statute §1006.21 — *Transportation of public school students*; §1006.23 — *Hazardous walking conditions* — `flsenate.gov/Laws/Statutes/2024/1006.21`, `.../1006.23`. Sandaran hukum FR-5 & §1.2, menggantikan Arizona per pivot Fase 1.
- FortyGuard API — `https://docs-api.fortyguard.com`.
- Iowa Environmental Mesonet ASOS (ground truth METAR) — `https://mesonet.agron.iastate.edu`.
