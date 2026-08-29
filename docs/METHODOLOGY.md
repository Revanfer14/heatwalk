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

## [Fase 2] Rumus dosis & kalibrasi

- `BASELINE_C = 33.0°C` (Lanza dkk. 2023) — dicatat sebagai pilihan kalibrasi, bukan konstanta alam.
- `WALK_SPEED_MPS = 1.2`.
- `dose = max(temp_c - BASELINE_C, 0) × (len_m / WALK_SPEED_MPS) / 60` (°C·menit). Rumus ini hidup satu kali di `pipeline/dose.py`, dipakai baik oleh pipeline asli (`step2_build_graph.py`) maupun `fixture_temps.py` — tidak ada salinan kedua.
- **Konsekuensi clamp di 07:00–09:00**: rata-rata raster tiga jam pertama (28,19–31,65°C) berada di bawah `BASELINE_C = 33,0`, jadi `dose = 0` untuk **seluruh** 4.931 edge di jam-jam itu. Ini efek samping clamp yang diantisipasi (dev plan §2.2 poin 3), bukan bug — tapi ia punya konsekuensi langsung pada kalibrasi λ, lihat di bawah.

### `LAMBDA_DETOUR` — hasil kalibrasi Fase 2.3, direvisi lintas-jam di Fase 3

`LAMBDA_DETOUR_CANDIDATES = [0.0, 0.005, 0.02, 0.05, 0.2, 1.0]`, `DETOUR_CAP_RATIO = 1.4`. Kalibrasi dilakukan per sekolah dari node sekolah (di-snap ke node OSM terdekat di UTM zone 17N, `pipeline/node_snapping.py` — tervektorisasi numpy sejak Fase 3, sebelumnya `step2_build_graph.py:snap_nearest_node` membuat `Transformer` baru di dalam loop per node; `ox.distance.nearest_nodes` tetap tidak dipakai karena butuh scikit-learn, sengaja tidak ditambahkan sebagai dependency).

**Kalibrasi awal Fase 2 hanya menguji cap detour 1,4× pada jam kanonik (15:00), dan mendapat `LAMBDA_DETOUR = 0.0` untuk keenam sekolah** — kandidat terkecil sudah lolos gerbang tanpa penalti panjang sama sekali, konsekuensi langsung temuan §1.5 (kontras suhu spasial kecil, `dose` per edge kurang lebih proporsional terhadap panjangnya).

**Bug yang ditemukan saat merancang Fase 3 (routing lintas-jam): pada `λ=0,0` dan jam 07:00–09:00, `dose` seragam nol di seluruh edge, sehingga `weight_cool = dose + 0·len_m = 0` di mana-mana.** Dijkstra atas bobot yang seragam nol tidak mengembalikan rute terpendek — ia mengembalikan jalur sembarang di antara semua jalur berbiaya sama, ditentukan urutan internal `networkx`. Terukur pada `sch_maynard_evans_high` jam 07:00: rasio detour **2,888×**, jauh melewati cap 1,4× yang justru menjadi salah satu checklist wajib Fase 3 ("Detour semua rute teradem ≤1,4×, **termasuk jam dingin**"). Ini bukan kesalahan `LAMBDA_DETOUR = 0,0` itu sendiri — pada jam kanonik nilai itu benar dan sudah lolos cap — tapi kalibrasi Fase 2 tidak pernah menguji kandidat λ di jam-jam berdosis nol karena hanya jam kanonik yang diuji.

**Perbaikan: `calibrate_lambda()` sekarang menguji cap detour 1,4× di seluruh `meta.hours`, bukan cuma jam kanonik** (`pipeline/lambda_calibration.py`, dipakai dari `step2_build_graph.py`), lalu memilih λ terkecil yang lolos di semua jam sekaligus — satu nilai λ untuk semua jam tetap dipertahankan (dev plan §2.3 melarang λ per jam, supaya jalur rute tidak lompat-lompat antar langkah slider tanpa alasan fisik).

**Hasil setelah kalibrasi ulang:**

| Sekolah | `LAMBDA_DETOUR` | Detour maksimum, seluruh jam |
|---|---|---|
| sch_maynard_evans_high | 0,02 | 1,188× |
| sch_rolling_hills_elementary | 0,005 | 1,206× |
| sch_meadowbrook_middle | 0,005 | 1,201× |
| sch_ridgewood_park_elementary | 0,005 | 1,332× |
| sch_rosemont_elementary | 0,005 | 1,370× |
| sch_ucp_pine_hills_charter | 0,005 | 1,269× |

Lima dari enam sekolah butuh `λ=0,005`; `sch_maynard_evans_high` butuh `λ=0,02` — topologinya di dekat sekolah punya lebih banyak jalur berbiaya-hampir-sama di jam dingin sehingga penalti jarak lebih besar dibutuhkan untuk menjaga hasil tetap dalam cap. **Nilai `λ` naik dari 0,0, bukan turun** — ini memperkecil ruang detour yang diizinkan, bukan memperbesarnya, sehingga tidak melanggar larangan menggeser parameter demi angka bagus (dev plan §2.3): perubahan ini memperbaiki bug, ia tidak mengejar delta rute yang lebih besar.

**Konsekuensi pada jam kanonik: nol.** Detour maksimum di jam kanonik untuk `sch_maynard_evans_high` tetap **1,188×** persis sama di `λ=0,0` dan `λ=0,02` — 3.544 dari 3.557 node punya dosis rute teradem yang identik sampai presisi float. **G1 (jumlah blok merah) tidak berubah sama sekali**: tetap 164 dari 368 blok berpenduduk, baik sebelum maupun sesudah kalibrasi ulang. Konsekuensinya murni terbatas ke jam-jam berdosis rendah/nol (07:00–11:00), di mana rute "teradem" sekarang benar-benar sama dengan rute terpendek (detour 1,000× persis) alih-alih rute sembarang — perilaku yang sudah diantisipasi baris di atas ("degenerate ke rute terpendek") tapi baru benar-benar terjadi setelah perbaikan ini.

Meminimalkan dosis tanpa penalti jarak sudah hampir sama dengan meminimalkan jarak di jam-jam panas — rute "teradem" tidak pernah menyimpang jauh untuk mengejar kantong sejuk kecil, karena kantong sejuk sebesar itu tidak ada di data suhu udara 2m.

### Edge dibuang

Dari 4.965 edge tak-berarah dalam graph OSM: **34 dibuang (0,68%)**, seluruhnya self-loop (`u == v`, hasil topologi OSM di persimpangan bundaran/median), nol dibuang karena panjang nol, dan **nol dibuang karena sampling NaN** — kesepuluh raster jam terverifikasi nol NaN (lihat tabel kurva jam di atas). Jauh di bawah gerbang 2%.

### `peak_c` per edge

Mengikuti koreksi Fase 0/1 (§ di atas): `peak_c` = maksimum sampel raster sepanjang geometri edge, **bukan** `max_temperature` dari respons API (yang identik dengan `average_temperature` pada granularitas 60m). Sampel diambil tiap ~20 m sepanjang geometri asli (sebelum disederhanakan Douglas-Peucker) via `pipeline/edge_sampling.py`. Karena median panjang edge OSM di AOI ini hanya **45,4 m** — lebih pendek dari satu sel raster 60m — `peak_c` sering **identik** dengan `temp_c` per edge; ini benar secara fisik, bukan tanda sampling rusak.

### Cakupan subgraph per sekolah: seluruh tile, bukan katchmen

Keputusan produk (bukan default diam-diam): keenam sekolah menulis `graph.json`/`temps.json` dari **graph tile penuh** (4.931 edge terpakai), bukan dipotong per katchmen sekolah. Konsekuensi ukuran, per sekolah:

| File | Ukuran aktual | Target dev plan Fase 2 |
|---|---|---|
| `graph.json` | ~630 KB | ≤5 MB — **lolos** |
| `temps.json` | ~1.323 KB (~1,3 MB) | ≤500 KB — **lewat ~2,6×** |

Total per sekolah ≈ 1,95 MB, masih di bawah plafon anggaran PRD §5.6 (±3,2 MB per sekolah untuk sepuluh jam) — jadi anggaran **produk** tetap terpenuhi, yang meleset hanya target line-item dev plan Fase 2. Tidak ditambal dengan menurunkan presisi di bawah 2 desimal (dilarang eksplisit oleh fail branch dev plan). Isi `graph.json`/`temps.json` identik di keenam sekolah kecuali `meta.school_id` dan `meta.lambda_detour` — lima sekolah bernilai `0,005`, satu (`sch_maynard_evans_high`) bernilai `0,02` per hasil kalibrasi lintas-jam di atas.

Lever cadangan kalau ukuran ini ternyata membebani slider FR-13 di Fase 5: potong subgraph per katchmen (hull blok ter-assign ke sekolah + buffer 500 m), terukur sebelumnya menghasilkan 850–1.800 edge (250–530 KB) per sekolah. Belum dipasang — tidak dibutuhkan kecuali performa Fase 5 menuntutnya.

## [Fase 3] Routing per blok & outcomes G1–G9

Routing dijalankan dari centroid **368 census block berpenduduk** (`POP100 > 0` dari 454 blok total dalam bbox, Census 2020 TIGERweb) ke node sekolah terdekat, Dijkstra dua-bobot (`weight='len_m'` dan `weight='dose + λ·len_m'`), untuk **seluruh sepuluh jam** di `meta.hours` — bukan cuma jam kanonik. `kids_est` per blok dihitung dasymetric (Census DHC P12 pita umur × bobot jenjang × `faktor_koreksi` sekolah, `pipeline/block_table.py`), total **4.999 anak** di 368 blok. Nol blok tidak terjangkau (`unreachable_block_ids` kosong di keenam sekolah) — graph OSM AOI ini terhubung penuh.

### 🚩 G1 — gerbang keras, LOLOS

**164 dari 368 blok berpenduduk (44,6%)** punya rute teradem yang tetap melewati `THRESHOLD_DOSE_C_MIN = 110,0` pada jam kanonik (15:00):

| Sekolah | Blok ter-assign | Blok merah | % |
|---|---|---|---|
| sch_maynard_evans_high | 53 | 4 | 7,5% |
| sch_rolling_hills_elementary | 49 | 14 | 28,6% |
| sch_meadowbrook_middle | 88 | 51 | 58,0% |
| sch_ridgewood_park_elementary | 40 | 19 | 47,5% |
| sch_rosemont_elementary | 102 | 67 | 65,7% |
| sch_ucp_pine_hills_charter | 36 | 9 | 25,0% |

Verifikasi tambahan (checklist dev plan §Fase 3, seluruhnya lolos, dicek programatik oleh `pipeline/verify_step3.py`): rute teradem tidak pernah lebih pendek secara fisik dari rute terpendek, di seluruh 368 blok × 10 jam; `detour_ratio ≤ 1,4×` di seluruh blok × jam termasuk 07:00–09:00 (lihat perbaikan λ lintas-jam di atas); rute terhitung lengkap di seluruh `meta.hours` untuk setiap blok.

### G2 — radius setara-dosis (FR-18)

Jarak lurus terjauh dari sekolah ke centroid blok yang rute teradem-nya masih di bawah ambang, pada jam kanonik:

| Sekolah | Radius kebijakan | Radius setara-dosis | Selisih |
|---|---|---|---|
| sch_maynard_evans_high | 2,00 mi | 0,83 mi | −58,5% |
| sch_rolling_hills_elementary | 2,00 mi | 0,65 mi | −67,5% |
| sch_meadowbrook_middle | 2,00 mi | 0,67 mi | −66,5% |
| sch_ridgewood_park_elementary | 2,00 mi | 0,63 mi | −68,5% |
| sch_rosemont_elementary | 2,00 mi | 0,85 mi | −57,5% |
| sch_ucp_pine_hills_charter | 2,00 mi | 0,58 mi | −71,0% |

Radius kebijakan OCPS 2,0 mi berlaku seragam SD–SMA (§1.3), jadi keenam radius setara-dosis dibandingkan terhadap angka yang sama. Radius setara-dosis selalu **jauh di bawah** radius kebijakan (gerbang G2 fail branch "radius setara-dosis > radius kebijakan" tidak pernah tersentuh) — sebagian besar selisih ini datang dari duration×circuity (Sumbu 2, §1.5 PRD): banyak blok yang jarak lurusnya di bawah 1 mi tetap melewati ambang karena jaringan jalan aktualnya memutar.

Varian sensitivitas (jarak *terdekat* ke blok yang *melewati* ambang, bukan jarak terjauh yang *aman* — pembacaan konservatif, `pipeline/dose_radius.py:dose_equivalent_radius_conservative_mi`) menghasilkan angka lebih kecil (0,28–0,45 mi di keenam sekolah), mengonfirmasi arah temuan yang sama dari sisi berlawanan. Angka yang dipakai di `summary.json` adalah pembacaan literal FR-18 ("jarak terjauh … yang masih di bawah ambang").

### G3 — dosis tereliminasi (FR-11), dilaporkan apa adanya per sekolah

Dihitung dari rata-rata `shortest.dose − coolest.dose` di antara blok merah, jam kanonik — **belum ditulis ke `summary.json`** (field itu masih milik `step4_classify.py` Fase 4, yang akan menghitungnya dari `blocks.geojson` asli, bukan fixture). Angka di bawah ini murni bukti-jalan G3 dari data routing Fase 3:

| Sekolah | Blok merah | Rata2 dosis tereliminasi/hari | /tahun ajaran | Setara menit di 42°C |
|---|---|---|---|---|
| sch_maynard_evans_high | 4 | 0,00 °C·menit | 0,0 | 0,00 mnt |
| sch_rolling_hills_elementary | 14 | 0,01 °C·menit | 1,5 | 0,00 mnt |
| sch_meadowbrook_middle | 51 | 0,51 °C·menit | 91,8 | 0,06 mnt |
| sch_ridgewood_park_elementary | 19 | 1,47 °C·menit | 263,9 | 0,16 mnt |
| sch_rosemont_elementary | 67 | 0,64 °C·menit | 115,6 | 0,07 mnt |
| sch_ucp_pine_hills_charter | 9 | 0,38 °C·menit | 68,8 | 0,04 mnt |

**`sch_maynard_evans_high` menunjukkan dosis tereliminasi persis nol** — keempat blok merahnya punya `coolest.dose == shortest.dose` persis di jam kanonik (`detour_ratio = 1,000`). Ini konsekuensi langsung `λ = 0,02` (nilai tertinggi di antara keenam sekolah, dibutuhkan supaya cap detour 1,4× tetap lolos di jam-jam dingin — lihat bagian λ di atas): pada λ sebesar itu, penalti jarak sudah cukup besar sehingga rute teradem tidak pernah menyimpang dari rute terpendek untuk blok-blok ini, bahkan di jam terpanas. Ini bukan bug — ia satu lagi bukti empiris temuan §1.5: pada AOI dengan kontras spasial sekecil ini, kemampuan pemilihan rute untuk mengurangi paparan benar-benar mendekati nol untuk sebagian sekolah.

### G7 — kurva dosis per jam per blok

Kurva dosis rute teradem tiap blok mengikuti bentuk kurva AOI (naik dari 07:00, puncak 14:00–16:00, turun ke 16:00) — diverifikasi programatik oleh `pipeline/verify_step3.py:check_dose_curve_shape` atas rute terpendek (path tetap per blok, sehingga anomali di sana murni sinyal suhu, bukan pergantian jalur teradem antar jam). Dua penyimpangan kecil dari bentuk searah-tunggal ditemukan, **keduanya sesuai kurva suhu AOI yang sudah terdokumentasi di §1.5.7** (kurva jam bergerigi di 12:00→13:00, 35,534°C→35,483°C), dengan magnitudo terukur:

| Pasangan jam | Jumlah blok terdampak (dari 368×6 kombinasi blok–hari) | Magnitudo maksimum |
|---|---|---|
| 10:00 → 11:00 | 224 | 10,01 °C·menit |
| 12:00 → 13:00 | 71 | 12,82 °C·menit |

Keduanya jauh di bawah toleransi wobble 15% ambang (16,5 °C·menit) yang dipakai `verify_step3.py` sebagai gerbang — magnitudo ini adalah derau near-baseline yang wajar (dosis jam 10:00–11:00 mendekati nol, sensitif terhadap fluktuasi suhu sub-derajat di sekitar `BASELINE_C`) dan wobble AOI 12:00/13:00 yang sudah dicatat, **bukan** indikasi raster jam tertukar (yang akan muncul di pasangan jam acak dengan magnitudo besar, tidak pernah terjadi di 368 blok manapun).

**Jam paling awal blok merah melewati ambang** (dari blok merah tiap sekolah):

| Sekolah | Jam paling awal | Distribusi |
|---|---|---|
| sch_maynard_evans_high | 14:00 | {15:00: 3, 14:00: 1} |
| sch_rolling_hills_elementary | 12:00 | {12:00: 6, 14:00: 4, 15:00: 4} |
| sch_meadowbrook_middle | 12:00 | {12:00: 28, 14:00: 9, 15:00: 14} |
| sch_ridgewood_park_elementary | 12:00 | {12:00: 5, 14:00: 6, 15:00: 8} |
| sch_rosemont_elementary | 12:00 | {12:00: 19, 13:00: 8, 14:00: 17, 15:00: 23} |
| sch_ucp_pine_hills_charter | 12:00 | {12:00: 2, 15:00: 7} |

Kalimat produk yang bisa diturunkan dari sini (Fase 5, FR-9): untuk sebagian besar blok merah di lima dari enam sekolah, rute teradem sudah melewati ambang sejak **12:00** — jauh sebelum jam bubar sekolah biasa.

### G8 — kontras rute (FR-4), dilaporkan apa adanya

Seluruh **368 pasangan blok–sekolah** dibandingkan pada jam kanonik, bukan cuma top-20 di `contrast_report.csv`:

- `delta_mean_c` (coolest − shortest): rentang **−0,75°C hingga 0,00°C**, rata-rata **−0,010°C**.
- **331 dari 368 blok (89,9%) punya `delta_mean_c = 0,000` persis** — rute teradem identik dengan rute terpendek.
- Hanya **37 blok (10,1%)** punya rute teradem yang benar-benar berbeda jalur, dengan delta terbesar **−0,75°C** (`sch_ridgewood_park_elementary`, blok `120950123052001`) — persis di ujung atas rentang **0,5–0,8°C** yang diperkirakan PRD §1.5 dari temuan kontras spasial AOI.

Angka ini **bukan kegagalan** — ia bukti langsung argumen produk (PRD §1.5, §8 poin 10): pada AOI dengan variasi suhu udara 2m intra-urban sekecil ini (p95−p05 ≈ 1,84°C), pemilihan rute nyaris tidak bisa mengurangi paparan. Paparan didominasi durasi dan waktu hari (G7 di atas), bukan jalur yang dipilih. `contrast_report.csv` menulis top-20 `|delta_mean_c|` terbesar untuk keterbacaan tabel — tidak ada baris yang dipangkas karena kecil, populasi penuh 368 baris selalu dihitung dan dilaporkan di sini.

### G9 — exceedance (FR-19), hibrida berbasis dosis

Metode: (1) suhu stasiun ASOS MCO (Iowa Environmental Mesonet, `EXCEEDANCE_STATION_START_DATE=2019-01-01` s/d `EXCEEDANCE_STATION_END_DATE=2025-12-31`, difilter ke bulan Agustus–Mei sebagai proksi tahun ajaran) pada jam kanonik lokal tiap hari — **2.130 hari**, membentang **8 label tahun ajaran**; (2) offset spasial per blok = `coolest.mean_c` blok pada jam kanonik dikurangi suhu stasiun pada jam kanonik tanggal `FETCH_DATE` (2023-08-08, stasiun mencatat 36,67°C — hampir identik dengan `shortest.mean_c` blok contoh di atas, kecocokan silang yang meyakinkan); (3) tiap hari historis, `dose(suhu_stasiun + offset)` dihitung atas `coolest.len_m` blok itu; (4) rata-rata jumlah hari `dose > THRESHOLD_DOSE_C_MIN` per tahun, atas blok merah tiap sekolah. **Nol panggilan FortyGuard tambahan** — seluruhnya dari raster yang sudah ada plus satu panggilan ASOS gratis (di-cache).

| Sekolah | Hari exceedance/tahun (rata2 blok merah) |
|---|---|
| sch_maynard_evans_high | 1,6 |
| sch_rolling_hills_elementary | 4,3 |
| sch_meadowbrook_middle | 3,0 |
| sch_ridgewood_park_elementary | 2,4 |
| sch_rosemont_elementary | 2,8 |
| sch_ucp_pine_hills_charter | 3,1 |

**Asumsi eksplisit, tidak diuji (PRD §8 poin 14)**: offset spasial per blok diasumsikan stabil antar-hari — kondisi atmosfer hari `FETCH_DATE` (2023-08-08, hari terpanas 6+ tahun terakhir di rekaman MCO) dipakai untuk menurunkan offset yang lalu diterapkan ke 2.130 hari lain dengan kondisi cuaca berbeda-beda. Nilai per-blok berasal dari sampel FortyGuard **satu hari**, bukan deret waktu penuh — inilah yang membuat pendekatan ini hibrida, bukan pengukuran langsung.

## [Fase 1.5 → final Fase 4, lihat bagian Fase 4 di bawah] `THRESHOLD_DOSE_C_MIN`

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

**Nilai indikatif dipakai sementara di `pipeline/config.py`: `THRESHOLD_DOSE_C_MIN = 110,0`.** Dipilih supaya distribusi fixture (`pipeline/make_fixtures.py`, kurva jam diurnal 07:00–16:00 rentang 33–38°C, bukan lagi rentang Phoenix) tidak degenerate — hasil aktual **79 hijau / 30 kuning / 11 merah** dari 120 blok. Ini **bukan kalibrasi final**: begitu kurva jam asli dari data FortyGuard sungguhan tersedia (Fase 1.5.7 dan Fase 2), nilai ini wajib direvisi ulang di Fase 4.1 berdasarkan data panas nyata — keputusan produk, bukan keputusan pipeline. `BUS_NOT_NEEDED_MAX_EXCESS_MI = 0,25` mil juga masih placeholder untuk definisi "sedikit di luar radius" (G4), didokumentasikan ulang saat kalibrasi asli.

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

Sesuai fail branch dev plan (`faktor_koreksi di luar 0,3–3,0` → "jangan pakai angkanya, cek batas attendance dulu"): kedua angka **tetap ditulis apa adanya** ke `summary.json` (bukan disembunyikan di balik placeholder `1.0`) karena keduanya informatif dan sebabnya terjelaskan.

**Koreksi (Fase 7): klaim "murni deskriptif" pada kalimat di atas keliru dan sudah tidak berlaku.** `pipeline/block_table.py` memang memakai `correction_factor` sebagai pengali langsung `kids_est = dasymetric_estimate × factor` sejak awal — bukan angka dekoratif di `summary.json` saja. Kekeliruan kalimat lama tidak berdampak numerik (rumusnya tidak pernah diubah untuk "mematuhi" klaim itu), tapi klaimnya sendiri salah dan diperbaiki di sini. Metode kalibrasi itu sendiri direvisi di Fase 7 (§ di bawah) untuk membatasi penyebutnya ke radius jalan kaki — bukan lagi seluruh bbox gabungan.

## [Fase 1.5.7] Kurva jam & `canonical_hour` — dari data asli

Dihitung dari 10 GeoTIFF hasil fetch nyata (§1.5.4, `data/interim/heatmap/orl_pine_hills_n/*.tif`), disampel di titik tengah setiap edge jaringan jalan OSM asli (`data/interim/osm/orl_pine_hills_n_walk.graphml`, 9.930 edge), dirata-ratakan berbobot `length` (meter) per edge — `pipeline/hourly_curve.py`.

| Jam | 07:00 | 08:00 | 09:00 | 10:00 | 11:00 | 12:00 | 13:00 | 14:00 | 15:00 | 16:00 |
|---|---|---|---|---|---|---|---|---|---|---|
| °C (berbobot panjang jalan) | 28,186 | 29,605 | 31,647 | 33,925 | 33,994 | 35,534 | 35,483 | 36,391 | **37,409** | 36,912 |

**`canonical_hour = "15:00"`** — diturunkan dari data (rata-rata tertinggi), bukan dikonstantakan. Kebetulan cocok dengan asumsi fixture sebelumnya, tapi angka di baliknya sekarang nyata.

**`delta_temporal_c = 9,223°C`** (15:00 − 07:00) — rentang variasi suhu sepanjang hari sekolah jauh lebih besar dari kontras spasial AOI (§Fase 0/1, p95−p05 ≈ 1,8°C pada satu jam). Implikasi: **kapan** anak berjalan pulang jauh lebih menentukan dosis panas daripada **rute mana** yang mereka ambil — ini G7, dilaporkan apa adanya sesuai dev plan, bukan hasil yang dicari-cari.

Metode: `edges.geometry.interpolate(0.5, normalized=True)` pada GeoDataFrame OSM (CRS geografis) memicu warning akurasi dari GeoPandas untuk operasi jarak — diabaikan dengan sengaja di sini karena yang dihitung hanya **lokasi sampel** (bukan panjang; panjang tetap dari kolom `length` OSM dalam meter, hasil proyeksi UTM osmnx sendiri), sehingga distorsi CRS-geografis pada interpolasi titik tengah segmen pendek (median puluhan meter) dapat diabaikan.

## [Fase 4] Klasifikasi (FR-8) & angka ringkasan — final

**`THRESHOLD_DOSE_C_MIN = 110,0` dipertahankan, tidak direvisi terhadap data panas asli.** §1.5 di atas menulis nilai ini sebagai "indikatif", dikalibrasi dari kurva jam fixture (79/30/11 dari 120 blok) sebelum data FortyGuard asli tersedia. Dengan kurva jam nyata (§1.5.7) dan routing dua-bobot asli (Fase 2–3), distribusi pada `canonical_hour = "15:00"` di 368 blok berpenduduk gelombang 1 adalah:

**204 hijau / 0 kuning / 164 merah.**

Ini **pengakuan eksplisit bahwa ini kalibrasi, bukan standar yang sudah ada** (diminta dev plan §4.1): `110,0 °C·menit` dipilih semata supaya distribusi awal (era fixture) tidak degenerate, tidak diturunkan dari ambang keselamatan panas resmi mana pun. Dev plan §4.1 melarang eksplisit menggeser ambang untuk mengisi kategori kuning secara artifisial — instruksi itu diikuti di sini: kuning tetap nol, didokumentasikan di bawah, bukan ditambal dengan menurunkan `THRESHOLD`.

**Catatan: angka di seksi ini adalah angka gelombang 1 (368 blok, tile `orl_pine_hills_n`), dipertahankan sebagai catatan historis.** Setelah perluasan AOI Fase 6 (§ di bawah), populasi blok naik ke 2.304 dan distribusi bergeser ke 209 hijau / 0 kuning / 2.095 merah — kuning tetap nol dengan mekanisme yang sama persis dijelaskan di Temuan 1.

### Temuan 1 — kategori kuning kosong (0 dari 368 blok, gelombang 1)

Kuning butuh `dose(terpendek) > THRESHOLD ≥ dose(teradem)` — celah di antara dua ambang yang sama. G8 (`METHODOLOGY.md` di atas) sudah mencatat **331 dari 368 blok (89,9%) punya `delta_mean_c = 0,000` persis**: rute teradem identik dengan rute terpendek. Untuk blok-blok itu `dose(terpendek) = dose(teradem)` tepat sama, sehingga tidak ada nilai `THRESHOLD` — berapa pun — yang bisa menaruh satu dosis di atas ambang dan yang lainnya di bawah. Sisa 37 blok yang rutenya benar-benar berbeda jalur punya delta maksimum hanya `−0,75°C`, tidak cukup untuk memindahkan dosis melewati satu ambang tanpa juga memindahkan dosis terpendeknya. Kuning kosong bukan kegagalan kalibrasi; ia konsekuensi matematis langsung dari gerbang kontras spasial yang dicabut di §1.5 (kontras suhu udara 2m intra-urban terlalu kecil untuk membuat pemilihan rute berarti).

### Temuan 2 — `misclassified.bus_not_needed = 0` di keenam sekolah, struktural bukan kalibrasi

`BUS_NOT_NEEDED_MAX_EXCESS_MI = 0,25` mil (definisi eksplisit "sedikit di luar radius", dev plan §4.3) tidak pernah dievaluasi: keenam sekolah memakai `walk_radius_mi = 2,0` (FS §1006.23, kutipan OCPS yang sama untuk semuanya, §1.5.5), sementara tile AOI `orl_pine_hills_n` hanya berukuran ±5 km. **Nol dari 368 blok berpenduduk punya `status_now = "bus"`** — seluruhnya berada dalam radius 2 mil dari sekolah masing-masing. `bus_not_needed` butuh blok hijau **di luar** radius resmi; kalau tidak ada blok sama sekali di luar radius, hasilnya nol secara struktural, bukan karena tidak ada blok yang "salah klasifikasi". Konsekuensinya: `misclassified.walk_should_bus = no_safe_route` di seluruh sekolah (154/202/668/309/391/55) tetap valid dan jadi argumen utama, tapi sisi `bus_not_needed` dari G4 tidak bisa dibuktikan atau dibantah oleh AOI seukuran ini.

### Temuan 3 — `block_id` fixture disamakan formatnya dengan GEOID asli

`pipeline/make_fixtures.py` sebelumnya menulis `block_id` fixture sebagai `"FIXTURE-CCRR"` (12 karakter buatan), melanggar `docs/CONTRACT.md` yang menyatakan `block_id` adalah Census block GEOID. Diperbaiki di `pipeline/fixture_geometry.py:fixture_block_geoid()`: format `12095` (FIPS Orange County, FL, sama dengan data asli) + tract 6-digit sintetis + blok 4-digit sintetis = GEOID 15-karakter yang sah secara format. Ini memastikan kode frontend yang menurunkan state dari GEOID (mis. `web/src/lib/petition.ts` yang membaca 2 digit pertama sebagai kode FIPS negara bagian) berperilaku identik di fixture dan data asli — syarat pokok CLAUDE.md bahwa frontend tidak boleh bisa membedakan keduanya.

### Verifikasi Fase 4

Dicek programatik oleh `pipeline/verify_step4.py`: kategori merah tidak kosong (gerbang keras, G1); kategori kuning kosong dicatat sebagai `CATATAN`, bukan gerbang; jumlah `kids_est` blok walk per sekolah sama dengan `summary.json.in_walk_zone`; setiap blok merah punya `reason` non-kosong yang memuat angka konkret; `reroute_enough + no_safe_route ≤ in_walk_zone`; `0 < radius_setara_dosis_mi ≤ radius_kebijakan_mi`; kunci properti `blocks.geojson` sama persis dengan `classification.BLOCK_PROPERTY_KEYS`; **paritas skema rekursif** antara `data/fixtures/` dan `data/out/` (kunci `schools.json`, `summary.json`, dan `blocks.geojson` sampai level `shortest`/`coolest`/`misclassified`, tidak termasuk `graph.json`/`temps.json` yang skemanya tidak berubah sejak Fase 2 dan sudah diverifikasi di sana); `tiles.json` — tiap tile berstatus `"done"` punya `hours_fetched` non-kosong. Semua lulus pada commit ini kecuali temuan kuning-kosong yang secara sengaja ditandai dilaporkan-bukan-gerbang.

`pipeline/run_all.py` memverifikasi keseluruhan rantai bisa dijalankan ulang dari cache **tanpa satu panggilan API pun** dan menghasilkan `data/out/` serta `web/public/data/` yang deterministik dari data yang sama. *(Klaim jalur re-run di paragraf ini sudah usang sejak Fase 8 — `step5_export` kini memangkas graph per-sekolah di tempat, sehingga re-run harus mulai dari `step2_build_graph`, bukan `step3_routes`. Rincian dan angka verifikasinya di §Fase 10.)*

## [Fase 6] Perluasan cakupan — bbox tunggal digabung, bukan mosaik tile

Dev plan menulis "cakupan lewat mosaik tile, menambah entri `TILES` = nol kode baru". Pemeriksaan sebelum eksekusi Fase 6 menemukan ini **tidak benar untuk kode yang ada**: hanya `step1_fetch_data.py` yang benar-benar melooping seluruh `TILES`; `step2_build_graph.py`, `step3_routes.py`, `step3b_outcomes.py`, dan `step5_export.py` semuanya mengasumsikan `tile = TILES[0]` tunggal — termasuk `schools.json` yang hanya di-generate dari bbox tile pertama. Menambah entri `TILES` baru tanpa mengubah keempat file itu akan diam-diam memberi sekolah gelombang-3 graf dan suhu milik tile lain — bug data, bukan fitur.

**Keputusan (dilaporkan ke Revan sebelum dieksekusi, disetujui):** alih-alih menulis dukungan multi-tile penuh, `TILES[0]` diganti satu entri `orl_ocps_core` dengan bbox gabungan (`(-81.4763, 28.5277, -81.3719, 28.6612)`, ~60 mi², union dari rencana 4-tile awal), menggantikan `orl_pine_hills_n`. Tile id sengaja diganti (bukan dipertahankan) karena `nces_ccd_<tile_id>.json`, `census_blocks_<tile_id>.json`, dan `census_block_geoms_<tile_id>.json` di-cache murni berdasar nama `tile_id`, bukan bbox — memakai ulang id lama dengan bbox baru akan diam-diam menyajikan cache sekolah/blok dari area lama yang lebih kecil.

Verifikasi biaya sebelum commit ke fetch penuh: satu panggilan `heatmap` uji pada bbox baru (41.720 sel, 6,3× sel maksimum yang pernah diuji `docs/METHODOLOGY.md` §Fase 0-1) tetap **4.220 kredit flat** dan NaN 1,04% — pricing flat-per-panggilan bertahan di luar rentang yang diuji sebelumnya.

**Hasil run nyata:** kredit terpakai run gelombang ini = **37.980** (bukan 42.200) — satu dari sepuluh jam (`15:00`, dari panggilan uji di atas) sudah tercache, jadi 9 panggilan baru × 4.220. Sebelum: 255.300 dari 2.000.000 (12,8%); sesudah: 293.280 (14,7%). Jaringan jalan OSM baru: 27.496 node, 78.416 edge mentah → 38.842 edge dipakai setelah pembuangan self-loop/zero-length (0,93% dibuang, jauh di bawah ambang 2%).

**Distribusi klasifikasi berubah signifikan pada AOI yang diperluas.** Gelombang 1 (`orl_pine_hills_n`, 368 blok): 204 hijau / 0 kuning / 164 merah (44,6% merah). AOI gabungan ini (`orl_ocps_core`, 2.304 blok berpenduduk, 6 sekolah yang sama): **209 hijau / 0 kuning / 2.095 merah (90,9% merah)**. Kuning tetap kosong, konsisten dengan Temuan 1 di atas. Lonjakan proporsi merah **bukan hasil menggeser `THRESHOLD_DOSE_C_MIN`** (tetap 110,0 °C·menit, tidak disentuh) — dosis terakumulasi proporsional terhadap jarak tempuh (`dose = suhu_diatas_baseline × waktu_jalan`), dan bbox 6× lebih luas menyertakan jauh lebih banyak blok pada jarak jalan kaki yang jauh dari sekolah, yang secara struktural mengakumulasi dosis lebih besar. Dilaporkan apa adanya per aturan §1.5 dan dev plan §Fase 3 — G1 tetap jauh dari nol (justru menguat), jadi tidak ada fail branch yang tersentuh.

**Peringatan ukuran file — melebihi target CONTRACT secara signifikan.** `graph.json` per sekolah sekarang ≈4,9 MB (pas di bawah target ≤5 MB, sebelum toleransi Douglas-Peucker dinaikkan). `temps.json` per sekolah ≈10 MB — **20× target ≤500 KB**, naik dari ~1,3 MB pada gelombang 1 karena jumlah edge per sekolah naik dari ~758 (fixture)/beberapa ribu menjadi 38.842 (setiap sekolah membawa seluruh graf tile, bukan subgraf yang relevan untuk sekolah itu — inefisiensi arsitektur yang sudah ada sejak Fase 2, terekspos di skala ini). Penyebabnya struktural (jumlah edge, bukan presisi angka — sudah 2 desimal), sehingga tidak bisa diperbaiki dengan menaikkan toleransi simplifikasi geometri saja (itu hanya mengecilkan `graph.json`, tidak menyentuh `temps.json`). Perbaikan yang benar adalah pemangkasan graf per sekolah ke subgraf yang relevan — **di luar cakupan Fase 6, dicatat sebagai utang teknis untuk fase berikutnya.** Dampak nyata terhadap NFR `<2 detik klik sekolah` diukur langsung di browser saat verifikasi Fase 6, bukan diasumsikan.

## [Fase 6] `blocks_hours.json` — choropleth per jam (FR-13 Mode 1)

`blocks.geojson` mengunci `class` di `canonical_hour` saja (FR-8, sengaja). Slider jam Mode 1 butuh warna choropleth berubah per jam (FR-13) — ini butuh klasifikasi di **setiap** jam, bukan hanya kanonik. `data/interim/routes/<school_id>.json` sudah menyimpan `shortest.by_hour` dan `coolest.by_hour` (dosis per jam) sejak Fase 3; `pipeline/blocks_hours.py` murni me-reserialisasi angka yang sudah ada lewat `classification.classify()` yang sama dipakai `step4_classify.py` — **nol routing ulang, nol kredit API, nol duplikasi rumus**. Frontend membaca `class` per jam dari sini, geometri dan properti lain tetap dari `blocks.geojson`.

## [Fase 6] FR-15 — asumsi `SHADE_COOLING_C`

Kolom wajib FR-15 ("estimasi penurunan suhu puncak jika diteduhi") tidak punya koefisien pendinginan naungan di `config.py` atau di PRD manapun — ini pilihan kalibrasi baru. **`SHADE_COOLING_C = 1,5°C`** dipilih sebagai konstanta seragam: diterapkan rata ke `peak_c` dan `temp_c` (mean) setiap edge segmen prioritas untuk menghitung `peak_shaded_c` dan `dose_reduction_pct`. Ini **bukan hasil pengukuran naungan nyata di AOI ini** — nilainya konsisten dengan urutan besaran efek kanopi pohon pada suhu udara 2m yang dikutip literatur (Lanza dkk. 2023, Meng dkk. 2023) tapi tidak divalidasi lokal. Dicatat sebagai limitasi eksplisit, bukan disamarkan sebagai pengukuran — lihat `docs/LIMITATIONS.md` (Fase 7) untuk poin yang setara dengan limitasi G9/exceedance (offset diasumsikan stabil, tidak diuji).

## [Fase 6] `schools_national.json` (FR-20)

Query nasional ke endpoint NCES CCD yang sama dengan `pipeline/nces_schools.py` (`EDGE_ADMINDATA_PUBLICSCH_2324`), tanpa filter bbox, dipaginasi lewat `resultOffset`/`resultRecordCount`. Cache mentah di `data/raw/nces_ccd_national.json` (11 MB, di-commit). Biaya: nol kredit FortyGuard — endpoint NCES gratis, tidak menyentuh `fg_client`.

**Hasil:** 101.245 sekolah NCES nasional, 51 halaman paginasi (2.000/halaman), 6 di antaranya `analyzed: true` — cocok satu-satu dengan `schools.json`. `schools_national.json` = 10 MB. Karena `di-fetch() lazy hanya saat masuk /district` (bukan saat boot `/`), ukuran ini tidak menyentuh anggaran waktu boot Mode 2.

**Keputusan terkait — jumlah sekolah teranalisis tetap 6, tidak 44.** Ditemukan saat verifikasi bahwa **tidak ada satu pun step pipeline asli (non-fixture) yang benar-benar menulis `data/out/schools.json`** — file itu dibaca oleh `step2_build_graph.py`, `step3_routes.py`, `step3b_outcomes.py`, `step4_classify.py`, `step5_export.py`, tapi tidak pernah *ditulis ulang* oleh keduanya; ia adalah artefak statis dari Fase 1.5.5 (`pipeline/fixture_geometry.py:SCHOOLS_FIXTURE` yang men-generate ulang dari bbox baru itu jalur **fixture**, bukan jalur asli). Akibatnya, memperluas `TILES[0]` ke bbox gabungan **tidak** menambah sekolah teranalisis — ia hanya memperluas kolam blok sensus yang bisa dirutekan ke 6 sekolah yang sama (368 → 2.304 blok).

Opsi memperluas ke ~44 sekolah (menulis `nces_schools.build_schools_payload` ke jalur asli, lalu re-run) tersedia dengan **nol tambahan kredit FortyGuard** (OSM/NCES/Census gratis), tapi akan mengalikan `graph.json`+`temps.json` — yang saat ini **identik untuk setiap sekolah karena disalin utuh dari seluruh graf tile**, bukan dipangkas per sekolah (lihat catatan ukuran file di atas) — sampai ~660 MB. **Keputusan: pertahankan 6 sekolah.** Pemangkasan graf per sekolah dicatat sebagai utang teknis untuk fase berikutnya sebelum cakupan sekolah diperluas.

## [Fase 7] Kalibrasi enrollment dibatasi radius jalan kaki — perbaikan dan angka final gelombang 3

**Semua tabel di §1.5.6, §Fase 2 (λ), dan §Fase 3 (G1/G2/G3/G8/G9) di atas adalah angka gelombang 1 (368 blok, tile `orl_pine_hills_n`), dipertahankan sebagai catatan historis metodologi.** Bagian ini menulis angka final gelombang 3 (2.304 blok, tile `orl_ocps_core`, enam sekolah yang sama) dan satu perbaikan metodologi yang menyertainya.

### Akar masalah

`enrollment_calibration.dasymetric_children_by_school()` (dipakai §1.5.6) menjumlahkan **seluruh blok dalam bbox** ke sekolah terdekatnya, tanpa batas jarak. Itu masuk akal selama bbox seukuran `orl_pine_hills_n` (~5×5 km, dekat dengan radius kebijakan 2 mi). Begitu Fase 6 memperluas bbox ke `orl_ocps_core` (~60 mi², §Fase 6 di atas), sel nearest-neighbor tiap sekolah ikut melebar jauh melewati radius kebijakannya sendiri — penyebut kalibrasi membengkak tanpa hubungan lagi dengan populasi yang benar-benar relevan (anak yang tinggal dalam jarak jalan kaki). Ini yang menjatuhkan `correction_factor` Rosemont Elementary ke 0,077 dan UCP Pine Hills Charter ke 0,04 pada commit Fase 6 — jauh di luar 0,3–3,0, dan tidak terdiagnosis sampai Fase 7.

### Perbaikan

`pipeline/block_assignment.py` (baru) menyatukan logika nearest-school yang sebelumnya diduplikasi persis di `enrollment_calibration.py` dan `block_table.py`, dan menambah `nearest_school_within_radius()`: sebuah blok hanya dihitung ke penyebut kalibrasi sekolah kalau jaraknya ke sekolah itu ≤ `walk_radius_mi` (2,0 mi, kutipan OCPS yang sama di §1.3). Ini **bukan angka yang dikarang untuk memperbaiki rasio** — populasi yang dipakai sebagai penyebut sekarang persis sama dengan populasi yang dijumlahkan jadi `summary.json.in_walk_zone`. `block_table.build_block_table()` sendiri (assignment blok→sekolah untuk routing dan `kids_est`) **tidak dibatasi radius** — tetap nearest-school di seluruh bbox, supaya blok jauh yang statusnya sudah `"bus"` tetap terhitung dan tetap punya `kids_est`, bukan hilang dari `blocks.geojson`.

Dijalankan ulang dari cache (`data/raw/`, tanpa satu panggilan FortyGuard/Overpass baru — `python -m pipeline.run_all --fetch`, seluruhnya cache-hit) setelah interim scratch sempat hilang (gitignored, tidak masalah — cache di `data/raw/` dan output di `data/out/` cukup untuk rebuild penuh).

| Sekolah | `enrollment_CCD` | `estimasi_dasymetric` (radius-dibatasi) | `correction_factor` |
|---|---|---|---|
| Maynard Evans High | 2.403 | 759,8 | **3,163** — di luar rentang |
| Rolling Hills Elementary | 513 | 401,2 | 1,279 |
| Meadowbrook Middle | 894 | 518,4 | 1,725 |
| Ridgewood Park Elementary | 469 | 740,8 | 0,633 |
| Rosemont Elementary | 561 | 2.416,8 | **0,232** — di luar rentang |
| UCP Pine Hills Charter | 160 | 1.795,0 | **0,089** — di luar rentang |

**3 dari 6 sekolah tetap di luar 0,3–3,0 setelah perbaikan.** Per aturan dev plan §Fase 1.5 fail branch dan `CLAUDE.md` ("jangan pernah menggeser ambang supaya angka terlihat bagus"), radius **tidak** digeser lagi untuk memaksakan ketiganya masuk rentang — dicatat apa adanya dengan sebab masing-masing:

- **Maynard Evans High (3,163×, sisi atas):** sama seperti temuan wave-1 (dulu 4,926×) — satu-satunya SMA di AOI ini, catchment SMA riil lebih besar dari radius 2 mi kebijakan itu sendiri. Restriksi radius memperbaiki rasio (4,926→3,163) tapi tidak menghilangkan sebabnya: sebagian siswa terdaftarnya secara sah tinggal di luar 2 mi (dapat bus lewat mekanisme jarak biasa, bukan hazardous walking), radius kebijakan sendiri sudah lebih kecil dari kebutuhan riil SMA ini.
- **UCP Pine Hills Charter (0,089×, sisi bawah):** tidak berubah dari diagnosis wave-1 — sekolah charter beroperasi lewat lotere se-distrik, bukan zona geografis. Asumsi inti nearest-school assignment tidak berlaku untuknya sama sekali.
- **Rosemont Elementary (0,232×, sisi bawah, baru muncul di gelombang 3):** diverifikasi lewat `schools_national.json` — dalam radius 2 mi dari Rosemont ada **13 sekolah NCES nyata**, tapi hanya 4 di antaranya masuk subset "enam sekolah teranalisis" (Rolling Hills 1,01 mi, Meadowbrook 1,52 mi, Maynard Evans 1,74 mi, Ridgewood Park 1,81 mi). Dua sekolah dasar nyata yang lebih dekat dari sebagian blok — **Lockhart Elementary (1,39 mi)** dan **Lake Weston Elementary (1,85 mi)** — tidak termasuk subset teranalisis. Karena `nearest_school_within_radius()` hanya memilih di antara enam sekolah yang dianalisis, blok yang di dunia nyata masuk zona Lockhart/Lake Weston tetap jatuh ke Rosemont sebagai "terdekat yang dianalisis", membengkakkan penyebutnya. Ini bukan bug perbaikan Fase 7 — ini konsekuensi struktural dari cakupan enam-sekolah (§Fase 6 "jumlah sekolah teranalisis tetap 6, tidak 44") yang bertemu dengan kalibrasi berbasis nearest-school. Dicatat sebagai limitasi baru di `docs/LIMITATIONS.md`.

### G7 — kurva jam, gelombang 3

| Jam | 07:00 | 08:00 | 09:00 | 10:00 | 11:00 | 12:00 | 13:00 | 14:00 | 15:00 | 16:00 |
|---|---|---|---|---|---|---|---|---|---|---|
| °C (berbobot panjang jalan) | 28,415 | 29,751 | 31,868 | 33,477 | 33,970 | 35,560 | 35,709 | 36,259 | **37,389** | 37,171 |

`canonical_hour = "15:00"` tetap konsisten dengan gelombang 1. `delta_temporal_c = 8,974°C` (vs 9,223°C gelombang 1) — sedikit lebih kecil karena bbox lebih luas merata-ratakan lebih banyak jalan, tapi kesimpulannya sama: variasi antar-jam jauh melampaui kontras spasial AOI manapun yang terukur.

### G1 — gerbang keras, gelombang 3, tetap LOLOS

**2.095 dari 2.304 blok berpenduduk (90,9%)** melewati ambang pada jam kanonik (`THRESHOLD_DOSE_C_MIN` tidak disentuh, tetap 110,0):

| Sekolah | Blok ter-assign | Blok merah | % |
|---|---|---|---|
| sch_maynard_evans_high | 751 | 704 | 93,7% |
| sch_rolling_hills_elementary | 55 | 20 | 36,4% |
| sch_meadowbrook_middle | 114 | 77 | 67,5% |
| sch_ridgewood_park_elementary | 40 | 19 | 47,5% |
| sch_rosemont_elementary | 964 | 929 | 96,4% |
| sch_ucp_pine_hills_charter | 380 | 346 | 91,1% |

Naik dari 44,6% (gelombang 1) ke 90,9% — sudah dijelaskan di §Fase 6 (bbox lebih luas menyertakan lebih banyak blok pada jarak jalan kaki jauh dari sekolah, mengakumulasi dosis lebih besar; bukan hasil menggeser `THRESHOLD`).

### G2 — radius setara-dosis (FR-18), gelombang 3

| Sekolah | Radius kebijakan | Radius setara-dosis | Selisih |
|---|---|---|---|
| sch_maynard_evans_high | 2,00 mi | 0,827 mi | −58,7% |
| sch_rolling_hills_elementary | 2,00 mi | 0,65 mi | −67,5% |
| sch_meadowbrook_middle | 2,00 mi | 0,667 mi | −66,7% |
| sch_ridgewood_park_elementary | 2,00 mi | 0,634 mi | −68,3% |
| sch_rosemont_elementary | 2,00 mi | 0,852 mi | −57,4% |
| sch_ucp_pine_hills_charter | 2,00 mi | 0,566 mi | −71,7% |

Konsisten dengan gelombang 1 secara arah dan magnitudo (radius setara-dosis selalu jauh di bawah radius kebijakan) — gerbang G2 fail branch tidak tersentuh.

### G3 — dosis tereliminasi (FR-11), gelombang 3

| Sekolah | Blok merah | Dosis tereliminasi/hari | /tahun ajaran | Setara menit di 42°C |
|---|---|---|---|---|
| sch_maynard_evans_high | 704 | 0,2 °C·menit | 29,3 | 0,0 mnt |
| sch_rolling_hills_elementary | 20 | 0,0 °C·menit | 0,4 | 0,0 mnt |
| sch_meadowbrook_middle | 77 | 0,3 °C·menit | 54,7 | 0,0 mnt |
| sch_ridgewood_park_elementary | 19 | 1,5 °C·menit | 269,7 | 0,2 mnt |
| sch_rosemont_elementary | 929 | 0,4 °C·menit | 66,5 | 0,0 mnt |
| sch_ucp_pine_hills_charter | 346 | 0,1 °C·menit | 22,9 | 0,0 mnt |

Angka-angka ini kecil, dan **wajib dibaca lewat PRD §8 poin 10, bukan sebagai kegagalan produk**: kontras suhu udara 2m antar-rute di AOI ini tipis (G8 di bawah), jadi "dosis yang dihindari dengan memilih rute lebih adem" memang mendekati nol untuk hampir semua sekolah — argumen produk berdiri di atas **memindah moda** (jalan → bus), bukan di atas "rute A lebih baik dari rute B". `equivalent_minutes_at_42c = 0,0` di lima dari enam sekolah bukan pembulatan yang disembunyikan; itu konsekuensi numerik langsung dari dosis tereliminasi yang memang di bawah satu menit setara.

### G8 — kontras rute (FR-4), gelombang 3

Seluruh **2.304 pasangan blok–sekolah**: `delta_mean_c` (coolest − shortest) rentang **−0,750°C hingga 0,000°C**, rata-rata **−0,055°C** — lebih negatif dari rata-rata gelombang 1 (−0,010°C) karena populasi blok 6× lebih besar menyertakan lebih banyak blok dengan rute alternatif yang benar-benar berbeda, tapi rentang ekstremnya (min/max) identik dengan gelombang 1. Kesimpulan sama: manfaat pemilihan rute kecil dan terukur, bukan nol tapi jauh dari besar.

### G9 — exceedance (FR-19), gelombang 3

| Sekolah | Hari exceedance/tahun (rata2 blok merah) |
|---|---|
| sch_maynard_evans_high | 19,2 |
| sch_rolling_hills_elementary | 7,7 |
| sch_meadowbrook_middle | 4,7 |
| sch_ridgewood_park_elementary | 2,4 |
| sch_rosemont_elementary | 15,0 |
| sch_ucp_pine_hills_charter | 19,9 |

Naik signifikan dari gelombang 1 (1,6–4,3 hari/tahun) — konsekuensi langsung populasi blok merah yang jauh lebih besar dan lebih jauh dari sekolah (rute lebih panjang → offset spasial dan `dose(suhu_stasiun + offset)` lebih sering melewati ambang di riwayat 2.130 hari ASOS). Metode tidak berubah dari §Fase 3 (hibrida, asumsi offset stabil antar-hari, PRD §8 poin 14, tidak diuji).

### `LAMBDA_DETOUR`, gelombang 3

| Sekolah | `LAMBDA_DETOUR` |
|---|---|
| sch_maynard_evans_high | 0,05 |
| sch_rolling_hills_elementary | 0,02 |
| sch_meadowbrook_middle | 0,02 |
| sch_ridgewood_park_elementary | 0,02 |
| sch_rosemont_elementary | 0,02 |
| sch_ucp_pine_hills_charter | 0,05 |

Naik dari `0,005`/`0,02` (gelombang 1) ke `0,02`/`0,05` — bbox 6× lebih besar berarti lebih banyak jalur berbiaya-hampir-sama yang butuh penalti jarak lebih besar untuk tetap lolos cap detour 1,4× di semua jam. Edge dibuang: **366 dari 39.208 (0,93%)**, di bawah gerbang 2%.

### Temuan 2, direvisi — `misclassified.bus_not_needed = 0` bertahan, sebab berubah total

Wave-1 (§Fase 4 di atas): nol karena **tidak ada blok berstatus `"bus"` sama sekali** dalam AOI sekecil itu — semuanya dalam radius 2 mi. **Ini tidak lagi benar di gelombang 3.** Bbox 60 mi² menghasilkan banyak blok `status_now = "bus"`: 661 di Maynard Evans High, 773 di Rosemont, 187 di UCP, 21 di Meadowbrook, 4 di Rolling Hills, 0 di Ridgewood Park. `bus_not_needed = 0` tetap bertahan, tapi sekarang karena alasan yang berbeda dan lebih informatif: **nol dari seluruh blok berstatus bus itu berklasifikasi hijau.** Setiap blok yang sudah cukup jauh untuk secara sah dapat bus (>2 mi) juga cukup jauh sehingga rute teradem-nya tetap melewati ambang dosis — pada AOI ini, jarak yang membuat seorang anak berhak atas bus jarak-standar juga membuatnya berhak atas bus karena panas. Dua kriteria kelayakan bertumpuk, tidak berlawanan.

### Temuan terbuka — `verify_step3.py` gagal di satu sekolah, belum diselesaikan

Menjalankan ulang `pipeline/verify_step3.py` (bukan bagian otomatis `run_all.py`, dijalankan manual saat verifikasi Fase 7) terhadap data gelombang 3 menemukan **18 blok** di `sch_maynard_evans_high` (dari 751, 2,4%) di mana dosis rute **terpendek** (jalur tetap per blok, bukan rute teradem yang bisa berpindah jalur) melonjak 16,6–20,1 °C·menit di jam 12:00 lalu turun kembali persis di 13:00, melewati toleransi wobble 15% (`check_dose_curve_shape`, pesan tool: *"indikasi raster jam tertukar"*). Kelima sekolah lain: nol pelanggaran. Ini **berbeda** dari wobble AOI-wide 12:00→13:00 yang sudah didokumentasikan di §Fase 3 (kurva rata-rata gelombang 1 turun tipis −0,051°C di rentang itu, dianggap derau near-baseline) — kurva rata-rata gelombang 3 di atas justru **naik** monoton 12:00→13:00 (35,560→35,709), jadi lonjakan 18 blok ini bukan sekadar bayangan derau AOI-wide, melainui anomali lokal yang belum terjelaskan.

**Tidak ditambal dalam Fase 7 ini** — perbaikan raster-per-jam yang spekulatif tanpa investigasi yang lebih dalam berisiko melanggar aturan `CLAUDE.md` "jangan diam-diam ganti pendekatan". Dicatat di sini dan di `docs/LIMITATIONS.md` sebagai temuan terbuka yang butuh keputusan Revan: investigasi lebih lanjut (bandingkan GeoTIFF jam 12:00 vs 13:00 di lokasi 18 blok itu) atau diterima sebagai limitasi data yang dinyatakan eksplisit. **Tidak memengaruhi gerbang G1** (dihitung dari rute teradem di jam kanonik 15:00, bukan jam 12:00) — tetap 2.095 blok merah, LOLOS.

### FR-17 — tidak dibangun; digantikan sebagian oleh FR-29 (2026-08-28)

Tombol refresh forecast (P1, dev plan urutan potong ke-5) sengaja tidak dibangun. Alasannya masih berlaku persis seperti semula: satu-satunya cara jujur memanggil FortyGuard live langsung dari situs statis adalah membungkus API key ke bundel browser, yang berarti mempublikasikannya ke siapa pun yang membuka DevTools.

**FR-29 (§heatwalk-prd.md) mengatasi masalah yang sama lewat jalur berbeda — bukan FR-17 dibangun ulang.** Alih-alih memanggil FortyGuard langsung dari browser, satu fungsi serverless read-only (`web/api/live-temperature-start.ts`, `web/api/live-temperature-result.ts`) menahan kunci API di sisi server (env var Vercel, tidak pernah masuk bundel), dan browser hanya bicara ke fungsi itu. Ini konsisten dengan aturan pengganti di §Fase 8 di bawah: *"tidak ada key yang bisa bocor atau habis"* — bukan lagi *"tidak ada dependency remote sama sekali"*.

**Kenapa terpisah dari render rute.** `heatmap` FortyGuard adalah job async — submit dapat `activity_id`, lalu polling `/status/{id}` tiap 5 detik sampai 600 detik (`pipeline/fg_client.py`). PRD §7 mensyaratkan rute ter-render <1 detik, dan §6.1 menyatakan arsitektur statis ada persis supaya demo tidak bisa gagal karena job async menggantung. Karena itu FR-29 tidak pernah menghalangi render: rute selalu tampil dari `temps.json` seperti biasa, panggilan live berjalan di latar belakang, dan panel meng-upgrade begitu jawabannya datang.

**Kenapa satu offset seragam per AOI *(rilis awal, superseded — lihat §Fase 14)*.** Biaya `heatmap` flat 4.220 kredit per panggilan (lihat tabel di bawah) tanpa peduli luas atau granularity — terlalu mahal untuk memanggilnya per interaksi, dan raster→edge sampling (`pipeline/edge_sampling.py`) hanya ada di Python, tidak bisa dijalankan di browser saat runtime. Solusi rilis awal: satu panggilan per jam mengembalikan **median** suhu AOI hari ini; median itu dikurangi `modeled_median_c_by_hour` (median suhu AOI di hari model 2023-08-08, jam yang sama, dari `tiles.json`) menghasilkan satu scalar °C ditambahkan rata ke `temp_c` setiap edge. **§Fase 14 mengganti ini dengan sampling per-sel dalam satu tile per sekolah** — raster→edge sampling ternyata bisa di-port ke TypeScript (`web/src/lib/edgeLiveTemperatures.ts`), jadi keterbatasan "tidak bisa dijalankan di browser" di atas tidak lagi berlaku. Median tetap dipakai untuk statistik ringkasan (bukan lagi untuk offset routing) karena robust terhadap sentinel `-999`.

**Kenapa klasifikasi blok tidak ikut live.** Kategori merah/kuning/hijau, `safe_until_hour`, dan `summary.json` (termasuk gerbang G1 — 2.955 blok merah) dihitung sekali dari hari model dan harus tetap bisa direproduksi persis, tidak boleh bergeser karena hari ini kebetulan panas atau sejuk. Panel FR-29 menyatakan eksplisit "modeled day 2023-08-08" pada angka-angka ini saat suhu live aktif. Ini **tidak berubah** oleh amendemen §Fase 14.

**Batas kredit *(angka rilis awal, lihat §Fase 14 untuk angka setelah amendemen)*.** `web/api/live-temperature-start.ts` mengembalikan header `Cache-Control: s-maxage=3600`, sehingga CDN memberi `activity_id` yang sama ke semua pengunjung dalam satu jam yang sama.

### Basemap offline — glyph self-hosted *(superseded, lihat §Fase 8 di bawah)*

`web/src/lib/basemapStyle.ts` sebelumnya memuat glyph label peta dari `cdn.protomaps.com`, diambil lazily oleh MapLibre per viewport. Ini melanggar gerbang "demo jalan offline setelah load pertama, termasuk pan ke sudut AOI yang belum pernah dibuka" (dev plan §Fase 7). Diperbaiki saat itu: tiga fontstack yang dipakai tema (`Noto Sans Regular`, `Noto Sans Medium`, `Noto Sans Italic`) diunduh ke `web/public/fonts/` (rentang kode Latin dasar sampai general punctuation, ~1,2 MB total, sumber sama persis dengan CDN Protomaps) dan `glyphs` diarahkan ke path same-origin `/fonts/{fontstack}/{range}.pbf`. Satu-satunya request runtime yang tersisa saat itu adalah `/data/*` dan `/heatwalk-aoi.pmtiles`, keduanya same-origin.

**Catatan historis:** pendekatan ini digantikan §Fase 8 di bawah. `web/public/fonts/` dan `web/public/heatwalk-aoi.pmtiles` sudah dihapus dari repo; tersedia di riwayat git kalau keputusan dibalik.

## [Fase 8] Basemap pindah ke OpenFreeMap — PMTiles self-hosted dicabut

**Pemicu:** peta di `/district` menampilkan pita abu-abu di luar area kecil di tengah AOI. Investigasi menemukan `web/public/heatwalk-aoi.pmtiles` diekstrak dengan bbox yang lebih kecil dari `TILES[0]["bbox"]` di `pipeline/config.py`:

| | west | south | east | north |
|---|---|---|---|---|
| `TILES[0]["bbox"]` | -81.4763 | 28.5277 | -81.3719 | 28.6612 |
| bounds arsip lama (`pmtiles show`) | -81.4763 | 28.5722 | -81.4241 | 28.6167 |

Arsip lama cuma berisi 79 tile z0–15. Probe langsung dengan `pmtiles tile` mengonfirmasi: `z14/4484/6832` (barat AOI) mengembalikan 22.642 byte, tapi `z14/4487/6835` (timur AOI), `z14/4486/6836` (selatan AOI), dan `z12/1121/1709` (selatan AOI) semuanya **0 byte** — sekitar tiga perempat AOI terkunci tidak punya basemap sama sekali.

**Kenapa tidak sekadar re-extract dengan bbox yang benar.** Basemap self-hosted `.pmtiles` di-commit sebagai file statis, jadi cakupannya selalu terbatas pada bbox ekstraksi. Angka nyata dari `pmtiles extract --dry-run` terhadap build harian Protomaps (`build.protomaps.com`):

| cakupan | ukuran arsip |
|---|---|
| seluruh planet, z0–15 | 128,2 GB |
| Metro Orlando ~90×70 km, z0–15 | 82 MB |
| Orange County, z0–15 | 53 MB |
| AOI terkunci + margin 6 km, z0–15 | 13 MB (sekadar menutup AOI penuh) |
| arsip lama (bug) | 2,7 MB |

Bahkan sekadar menutup AOI penuh plus margin secukupnya untuk mengisi layar default sudah 5× ukuran arsip lama, dan FR-20 (`heatwalk-prd.md` §"Lapisan sekolah nasional") secara eksplisit meminta zoom-keluar sampai skala ribuan sekolah tetap berguna — area itu jauh melampaui bbox `TILES` mana pun yang bisa diekstrak dengan biaya wajar untuk di-commit ke git.

**Keputusan Revan, 2026-08-27 malam:** ganti ke tile server pihak ketiga **OpenFreeMap** (`https://tiles.openfreemap.org`, style `liberty`), diverifikasi tanpa API key dan tanpa signup (style JSON dan tile MVT sama-sama `200` lewat curl langsung). Style `liberty` dipakai apa adanya karena paletnya (`background #f8f4f0`, air `rgb(158,189,255)`, taman `#d8e8c8`) sudah cocok dengan `DESIGN.md` — basemap berwarna standar, bukan grayscale — sehingga tidak perlu keputusan desain baru.

**Konsekuensi yang diterima secara eksplisit, bukan diam-diam:**
- Gerbang "demo jalan offline" (dev plan §Fase 7, `heatwalk-dev-plan.md` tabel ringkasan gerbang) **gugur** untuk basemap — peta sekarang butuh internet saat runtime. Sisa aplikasi (data `data/out/`, graph, routing, klasifikasi) tetap 100% offline setelah load pertama.
- Gerbang verifikasi basemap `206 Partial Content` tidak berlaku lagi — tidak ada lagi file range-request lokal untuk diverifikasi.
- Aturan `CLAUDE.md` "tidak ada tile server pihak ketiga" dicabut dan diganti "tidak ada tile server yang butuh API key" — batas yang tetap dipertahankan adalah *tidak ada key yang bisa bocor atau habis*, bukan *tidak ada dependency remote*.
- `web/public/heatwalk-aoi.pmtiles` dan `web/public/fonts/` dihapus dari repo; dependency `pmtiles` dan `protomaps-themes-base` dicabut dari `web/package.json`.

**Yang tidak berubah:** satu instance MapLibre lintas mode, batas AOI putus-putus dan `OutOfAoiNotice` (keduanya dibaca dari `tiles.json`, bukan dari basemap), dan seluruh layer analisis (choropleth blok, radius, rute, pin sekolah nasional).

## [Fase 10] Blok tak berpenduduk, ekspor distrik gabungan, `mean_c` per jam

**Pemicu (feedback QA demo 2026-08-27, FR-22/FR-23):** interior lingkaran kebijakan di Mode 1 menampakkan "lubang" abu-abu. Penyebab pertama: blok dengan `POP100 = 0` di-skip sejak awal (`pipeline/block_table.py`) — taman, danau, kuburan, dan area industri tidak pernah diklasifikasi. Penyebab kedua: Mode 1 me-render file blok per-sekolah, padahal file itu partisi nearest-school — blok di dalam lingkaran X yang lebih dekat ke sekolah Y tidak pernah muncul di view X.

**Perubahan pipeline:** filter `POP100` dihapus; `kids_est` blok kosong otomatis 0 (band DHC kosong) sehingga seluruh metrik anak stabil; `blocks_hours.json` kini membawa `mean_c` rute terpendek per jam (bahan label suhu FR-23); `step5_export` menulis `district_blocks.geojson` (gabungan keenam file per-sekolah) + `district_blocks_hours.json` ke root `data/out/`; `make_fixtures` menulis pasangan file yang sama.

**Angka sebelum → sesudah** (jalur: re-run penuh dari step2, nol panggilan API):

| Metrik | sebelum | sesudah |
|---|---|---|
| blok diklasifikasi | 2.304 | 3.198 (+1 unreachable di Evans) |
| hijau / kuning / merah | 209 / 0 / 2.095 | 243 / 0 / 2.955 |
| `in_walk_zone` keenam sekolah | 2402/513/886/471/560/150 | identik |
| `no_safe_route` keenam sekolah | 986/203/672/309/435/108 | identik |
| `radius_setara_dosis_mi` Evans | 0,827 | 1,075 |
| `radius_setara_dosis_mi` lima sekolah lain | 0,566–0,852 | berubah ≤ 0,01 |

Diverifikasi terhadap commit sebelumnya: **tidak ada satu pun blok lama yang berubah kelas** — seluruh 34 blok hijau baru adalah blok `POP100 = 0`. Pergeseran radius Evans murni karena koridor hijau tak berpenduduk yang terjauh kini terlihat (blok `120950124031072`, 1,075 mi); definisi metrik — jarak maksimum blok yang rute terademnya di bawah ambang pada jam kanonik (`pipeline/dose_radius.py`) — tidak berubah. Rata-rata turunan blok merah (`dose_eliminated_per_child_*`, `days_exceedance_per_year`) ikut bergeser karena penyebutnya kini mencakup blok merah tak berpenduduk; semua ditampilkan apa adanya di `summary.json`.

**Celah barat, terukur:** union blok menutup 100% bbox, tapi lingkaran kebijakan 2,0 mi empat sekolah menjorok melewati batas barat bbox `-81,4763`: ±17% luas lingkaran Meadowbrook, ±15% Ridgewood Park, ±7% UCP Pine Hills, ±1% Evans (Rosemont dan Rolling Hills penuh). Blok di luar bbox tidak pernah di-fetch; menutupnya menuntut bbox baru + fetch baru — keputusan produk 2026-08-27: diterima, didokumentasikan di `docs/LIMITATIONS.md` #21.

**Verifikasi baru di `pipeline/verify_step4.py`:** kunci record `blocks_hours` kini `{shortest, coolest, mean_c, class}` (dicek di data asli dan fixture); `district_blocks.geojson` dicek bebas duplikat `block_id` dan identik dengan union file per-sekolah; `district_blocks_hours.json` dicek satu-satu kuncinya terhadap geojson pasangannya. Pemeriksaan paritas fixture dipindah ke `pipeline/verify_schema_parity.py`; keduanya kini juga mencakup pasangan file distrik gabungan.

**Ukuran payload:** `district_blocks.geojson` 5,8 MB + `district_blocks_hours.json` 2,3 MB di-fetch sekali per sesi distrik (cache); `web/public/data` tumbuh menjadi ±44 MB — masih statis penuh, tanpa backend.

## [Fase 9] Perluasan cakupan sekolah teranalisis: 6 → 42

**Pemicu:** `/district` menampilkan 101.245 pin sekolah NCES nasional, tapi hanya 6 punya angka — bukan karena kredit API, bukan karena bbox. Investigasi menemukan **`data/out/schools.json` adalah artefak buatan tangan**: tidak ada satu pun step pipeline asli yang pernah menulisnya. `pipeline/nces_schools.py:build_schools_payload()` sudah mengembalikan seluruh 44 sekolah K-12 di bbox `orl_ocps_core`, tapi satu-satunya pemanggilnya adalah `pipeline/fixture_geometry.py` — jalur fixture, bukan jalur asli (lihat §Fase 6 di atas, "Keputusan terkait — jumlah sekolah teranalisis tetap 6", **sekarang superseded**). Prasyarat yang dicatat di sana — pemangkasan graf per sekolah — sudah dipenuhi di Fase 8.

**Perbaikan pipeline:** `pipeline/step1b_schools.py` (baru, dijalankan antara `step1_fetch_data` dan `step2_build_graph`) memanggil `build_schools_payload` dan menulis `data/out/schools.json` langsung dari cache `data/raw/nces_ccd_orl_ocps_core.json` — nol panggilan jaringan. Filter `MIN_ENROLLMENT = 1` ditambahkan di dalam `build_schools_payload` itu sendiri (bukan di step1b) supaya jalur fixture (`pipeline/fixture_geometry.py:SCHOOLS_FIXTURE`) ikut kena filter yang sama dan paritas skema fixture↔asli tetap terjaga. Dua baris dibuang: `ORANGE TECHNICAL COLLEGE` dan satu record nama rusak `34-M-W-7 (34-M-N-7)`, keduanya `enrollment = 0` — bukan sekolah dengan walk zone nyata. **44 → 42 sekolah** (28 elementary, 5 middle, 9 high). Hasil diurutkan A–Z (`schools.sort(key=lambda s: s["name"])`) untuk output deterministik; frontend menambah `DEFAULT_SCHOOL_ID = "sch_maynard_evans_high"` di `AppStateProvider.tsx` (fallback ke `schools[0]` kalau id itu tidak ada) supaya urutan A–Z tidak diam-diam mengganti sekolah yang terbuka saat boot.

`step2_build_graph.py` tidak lagi memanggil `mirror_to_web()` di akhir — sebelumnya setiap re-run menyalin graf tile penuh (~4,9 MB + ~9,5 MB × 42 sekolah ≈ 626 MB) ke `web/public/data` sebelum `step5_export.py` memangkasnya beberapa menit kemudian. Mirror final tetap terjadi di akhir `step5_export.py`, sekarang dengan file yang sudah dipangkas saja.

**`pipeline/lambda_calibration.py` dioptimalkan** — `nx.single_source_dijkstra_path_length(graph, source, weight="len_m")` sebelumnya dihitung ulang di setiap kombinasi kandidat λ × jam (sampai 60× per sekolah) padahal hasilnya tidak bergantung pada keduanya; sekarang dihitung sekali per sekolah dan dilewatkan sebagai argumen. `worst_detour_ratio_across_hours` juga berhenti lebih awal begitu `cap_ratio` terlampaui, alih-alih selalu mengevaluasi seluruh 10 jam. Kedua perubahan menghasilkan `lambda_detour` yang identik dengan sebelumnya (diverifikasi: hasil kalibrasi sama persis untuk keenam sekolah lama). `step2_build_graph.py` untuk 42 sekolah selesai dalam **~16 menit** (11:51–12:07 WIB), jauh dari perkiraan 3+ jam tanpa optimasi ini.

**Presisi angka dipangkas** untuk menekan ukuran file — `TEMP_DECIMALS = 1`, `DOSE_DECIMALS = 1` (turun dari 2 desimal) di `pipeline/config.py`, dipakai `step2_build_graph.py`; `EDGE_GEOM_COORD_DECIMALS = 5` (turun dari 6, ≈1,1 m — jauh di bawah `SIMPLIFY_TOLERANCE_M = 5,0` yang sudah dipakai, jadi tidak menambah kesalahan berarti) di `pipeline/edge_geometry.py`. **Dosis sengaja tetap 1 desimal, bukan 0**: dosis rute adalah penjumlahan ~100 edge dibandingkan terhadap `THRESHOLD_DOSE_C_MIN = 110,0`; dosis per edge cuma ~3,5 C·menit, jadi pembulatan ke bilangan bulat menambah galat akumulasi orde ±3 pada rute bernilai ~350 — cukup untuk menggeser blok yang duduk persis di ambang, demi penghematan ukuran yang kecil (≈4 MB dari 154 MB). Diukur pada `sch_maynard_evans_high`: `temps.json` 2,47 MB → 2,25 MB (−9%), `graph.json` 1,20 MB → 1,15 MB (−5%), gabungan **−7,4%**. Untuk 42 sekolah, total `web/public/data` terukur **160 MB** setelah pruning per-sekolah (Fase 8) + trim presisi ini — di dalam kisaran ~140–160 MB yang diperkirakan, sedikit di atas titik tengah karena beberapa sekolah bertetangga rapat (mis. `sch_rock_lake_elementary`, subgraf 15.254 edge) mewarisi radius catchment tumpang-tindih lebih besar dari sekolah-sekolah gelombang 1. Per klik sekolah tetap terbatas pada satu pasang `graph.json`+`temps.json` (~500 KB–3,7 MB tergantung kepadatan jalan lokal) — jumlah total sekolah tidak memengaruhi waktu muat satu klik.

### Cacat data yang ikut terungkap dan ikut diperbaiki

`pipeline/block_table.py` memakai `nearest_school()` **tanpa batas radius** untuk assignment blok→sekolah (routing, `kids_est`, `blocks.geojson`) — sengaja dipertahankan tanpa batas (lihat §Fase 7 di atas: blok jauh yang statusnya `"bus"` tetap harus terhitung). Konsekuensinya, dengan hanya 6 sekolah teranalisis, **870 dari 3.199 blok (27,2%)** benar-benar berada dalam radius kebijakan 2 mi dari sekolah yang di-assign — sisanya di-assign ke sekolah teranalisis terdekat, sejauh apa pun jaraknya, karena sekolah yang sebenarnya lebih dekat belum dianalisis. Dengan 42 sekolah: **3.163 dari 3.199 (98,9%)**.

Ini akar dari lonjakan tajam angka merah di §Fase 6 (90,9% pada 6 sekolah) — sebagian besar bukan panas, melainkan jarak palsu. Klasifikasi ulang pada populasi blok yang **identik** (3.198 blok, tile `orl_ocps_core` yang sama, angka Fase 10 sebagai baseline):

| Metrik | 6 sekolah (Fase 10) | 42 sekolah (Fase 9, ini) |
|---|---|---|
| hijau / kuning / merah | 243 / 0 / 2.955 | 2.161 / 5 / 1.032 |
| % merah | 92,4% | 32,3% |
| blok dalam radius 2 mi dari sekolah yang di-assign | 870/3.199 (27,2%) | 3.163/3.199 (98,9%) |

**Kategori kuning tidak lagi kosong** — 5 blok, pertama sejak Fase 1. Dengan lebih banyak sekolah dan jarak assignment yang jauh lebih realistis, sebagian pasangan blok–sekolah sekarang punya `dose(terpendek)` dan `dose(teradem)` yang benar-benar duduk di sisi berlawanan `THRESHOLD_DOSE_C_MIN` — mekanisme yang sama yang membuatnya nol sebelumnya (Temuan 1, §Fase 4) tinggal celah sempit, bukan tertutup total. `docs/LIMITATIONS.md` poin 11 diperbarui dengan angka ini.

`THRESHOLD_DOSE_C_MIN`, `BASELINE_C`, `LAMBDA_DETOUR_CANDIDATES`, dan aturan assignment `block_table.py` **tidak disentuh** untuk menghasilkan pergeseran ini — murni konsekuensi dari mengganti sekolah pembanding yang tersedia untuk setiap blok.

### `correction_factor`: dari 3/6 di luar rentang ke 12/42 — pola baru yang lebih jelas

Dua dari tiga sekolah yang sebelumnya di luar rentang **membaik seperti diprediksi**: Rosemont Elementary 0,232 → **0,483** (9 dari 13 sekolah tetangga nyata dalam radius 2 mi sekarang ikut teranalisis, tidak lagi menyerap blok yang di dunia nyata masuk zona tetangga), UCP Pine Hills Charter 0,089 → **0,301** (pas di ambang bawah). Maynard Evans High memburuk, 3,163 → **7,777**.

Total di luar rentang **naik dari 3/6 menjadi 12/42** — dilaporkan apa adanya, `THRESHOLD` kalibrasi tidak digeser. Pola di baliknya sekarang jauh lebih jelas dibanding saat sampelnya cuma 6 sekolah:

| Sekolah | `enrollment_CCD` | `estimasi_dasymetric` (radius-dibatasi) | `correction_factor` |
|---|---|---|---|
| AMIkids Orlando | 26 | 237,4 | 0,110 — di luar rentang (bawah) |
| Lucious And Emma Nixon Academy Charter | 86 | 567,2 | 0,152 — di luar rentang (bawah) |
| Orlando Science Elementary Charter | 717 | 153,2 | 4,680 — di luar rentang (atas) |
| Robinswood Middle | 997 | 198,6 | 5,020 — di luar rentang (atas) |
| Rock Lake Elementary | 308 | 53,4 | 5,768 — di luar rentang (atas) |
| Lockhart Middle | 741 | 127,2 | 5,825 — di luar rentang (atas) |
| Wekiva High | 2.184 | 323,4 | 6,753 — di luar rentang (atas) |
| Maynard Evans High | 2.403 | 309,0 | 7,777 — di luar rentang (atas) |
| Jones High | 1.619 | 177,6 | 9,116 — di luar rentang (atas) |
| College Park Middle | 695 | 63,0 | 11,032 — di luar rentang (atas) |
| Edgewater High | 2.011 | 72,4 | 27,776 — di luar rentang (atas) |
| Orlando Science Middle/High Charter | 1.453 | 15,6 | 93,141 — di luar rentang (atas) |

**Sembilan dari dua belas melenceng ke atas, dan pola sekolahnya bukan acak: seluruh 4 SMA di AOI ini plus 3 dari 5 SMP ada di daftar.** Ini memperkuat diagnosis Maynard Evans dari §1.5.6 (satu-satunya SMA di bbox lama) ke bentuk yang lebih umum: **catchment sekolah menengah nyata jauh lebih luas secara geografis daripada catchment SD** — remaja rutin ditempatkan ke satu SMA/SMP yang melayani area luas, sementara estimasi dasymetric nearest-school hanya menjumlahkan anak di blok-blok yang *paling dekat* ke bangunan itu, yang sebagian besar justru lebih dekat ke SD-SD di sekitarnya. Dua sekolah yang melenceng ke bawah (AMIkids Orlando, Lucious And Emma Nixon Academy Charter) adalah program alternatif/charter kecil dengan pola enrollment non-zona — perpanjangan langsung dari diagnosis UCP Pine Hills Charter di §1.5.6 (lotere se-distrik, bukan geografi). Ini bukan bug pipeline: `nearest_school_within_radius` bekerja persis seperti didesain (lihat `docs/LIMITATIONS.md` poin 9, fallback SABS-tidak-tersedia) — ia hanya semakin jelas terlihat gagal untuk sekolah menengah begitu sampelnya cukup besar untuk menunjukkan polanya. `docs/LIMITATIONS.md` poin 16 diperbarui dengan tabel dan angka ini.

### Verifikasi

`pipeline.verify_step2` lulus untuk seluruh 42 sekolah (edge dibuang 366/39.208 = 0,93%, di bawah gerbang 2%; tidak ada `graph.json` di atas 5 MB, terbesar 1,84 MB `sch_rock_lake_elementary`). `pipeline.verify_step4` lulus (paritas skema fixture↔asli, partisi `district_blocks.geojson`, dll). `pipeline.verify_step3` menemukan **16 blok** (dari 3.198, di 4 sekolah: `sch_lucious_and_emma_nixon_academy_charter` ×2, `sch_orlo_vista_elementary` ×1, `sch_sunshine_high_school_greater_orlando_campus` ×3, `sch_washington_shores_elementary` ×10) dengan pola dosis rute-terpendek melonjak lalu turun di jam 12:00–14:00, melewati toleransi wobble `check_dose_curve_shape` — **kategori temuan yang sama** dengan yang sudah dicatat sebagai terbuka di §Fase 7 (18/751 blok, hanya `sch_maynard_evans_high`, gelombang 6-sekolah). Bukan regresi baru: assignment blok berubah total begitu 42 sekolah tersedia (Maynard Evans turun dari ribuan blok ke 53), jadi blok mana yang menampakkan wobble raster ini ikut bergeser ke sekolah lain — fenomenanya (derau sampling raster antar-jam) sama persis, populasinya berbeda karena assignment-nya berbeda. **Tidak memengaruhi gerbang G1** (dihitung di jam kanonik 15:00) atau kategori merah/kuning/hijau final. Belum diinvestigasi lebih dalam, sama seperti temuan asalnya — keputusan Revan untuk fase berikutnya.

## [Fase 14] Mode 2 jadi peta biasa: suhu live per-sel, opsi rute majemuk, slider dihapus

**Pemicu:** Revan minta Mode 2 terasa seperti Google/Apple Maps sungguhan — rute dihitung terhadap kondisi hari ini (bukan cuma offset seragam dari hari model), beberapa opsi rute ditawarkan sekaligus, dan tidak ada slider jam yang harus digeser manual (§DESIGN.md amendemen 2026-08-28).

**Suhu live per-sel, bukan lagi offset seragam per AOI (amendemen FR-29).** AOI penuh (±58 mi²) melebihi batas 10 mi² per panggilan `heatmap`, itulah sebabnya rilis awal FR-29 mundur ke satu offset skalar. Perbaikannya bukan melonggarkan batas itu, melainkan mempersempit cakupan panggilan: satu tile 5,0 × 5,0 km (±9,65 mi², di bawah batas) dipusatkan ke titik sekolah yang sedang dipilih (`web/api/live-temperature-start.ts:schoolTileBbox`), bukan ke bbox AOI. `schoolId` divalidasi di server terhadap `data/schools.json` sebelum bbox dihitung — pagar kredit, karena bbox sembarang dari klien bisa membakar 4.220 kredit per permintaan tanpa itu.

Respons `heatmap` (`map_data.features`, satu polygon per sel) digrid di server, bukan direduksi ke satu median saja: `web/api/_lib/heatmapGrid.ts:buildTemperatureGrid` adalah port langsung dari `pipeline/heatmap_raster.py:build_grid` — piksel size dari median lebar/tinggi sel, dibinning ke array `values` berdasar titik tengah sel. Grid (~84×84 sel, ~35 KB) dikirim ke klien alih-alih dihitung habis di server, karena penyampelan per edge butuh geometri jalan (`graph.json`) yang hanya ada di klien.

Klien menyampel grid itu di sepanjang tiap edge (`web/src/lib/edgeLiveTemperatures.ts`), memakai pendekatan yang sama seperti `pipeline/edge_sampling.py`: densifikasi tiap segmen `geom` pada `SAMPLE_SPACING_M = 20`, sampel grid di tiap titik, `temp_c` = rata-rata sampel yang valid, `peak_c` = maksimumnya. Beda dari pipeline: interpolasi titik sampel di sini linear dalam ruang lon/lat (bukan proyeksi UTM) — pada spasi 20 m dan skala kota, distorsi proyeksi di titik ini diabaikan karena tujuannya real-time UX, bukan angka yang dipakai gerbang G1–G9. Hasilnya (`Record<edgeId, {temp_c, peak_c}>`) masuk ke `buildRoutingGraph` sebagai `liveEdgeTemps` opsional; kalau sebuah edge tidak punya sampel live (di luar tile 5×5 km, atau tile gagal), ia jatuh kembali ke jalur lama: suhu model + offset seragam. Dosis tetap lewat satu `doseCMin()` yang sama, dipanggil ulang dengan `temp_c` mana pun yang berlaku per edge.

**Konsekuensi kredit.** Karena slider jam sudah dihapus dari Mode 2 (amendemen FR-13 di bawah), hanya ada **satu** jam live yang mungkin diminta per sekolah per hari — jam Orlando saat ini, dipotong ke 07:00–16:00. Biaya per sekolah dibuka tetap 4.220 kredit (satu panggilan `heatmap`), di-cache `s-maxage=3600` di CDN dan `sessionStorage` di klien, jadi pengunjung berulang dalam jam yang sama nol kredit tambahan. Ini **lebih murah per-panggilan** dibanding rencana rilis awal (yang juga satu panggilan per jam, tapi untuk AOI 58 mi² yang sebenarnya melebihi batas per-panggilan tier Basic) — trade-off-nya bukan biaya, melainkan cakupan: tile 5×5 km tidak menutupi seluruh walk zone sekolah menengah yang radiusnya 2,0 mi (3,2 km, melebihi setengah-sisi tile 2,5 km). Fringe di luar tile jatuh ke fallback seragam, dicatat di `docs/LIMITATIONS.md`.

**Opsi rute majemuk (FR-30).** Dicari sampai dua rute alternatif lewat metode penalti (`web/src/lib/routeAlternatives.ts`, `ALTERNATE_ROUTE_COUNT = 2` — riwayat lengkapnya 2 → 1 → 2 lewat dua §Revisi di bawah, terakhir dinaikkan kembali saat rute terpendek berhenti digambar): jalankan ulang Dijkstra pada `weight_cool` dengan bobot edge yang sudah dipakai rute-rute lain dikalikan `ALTERNATE_PENALTY_FACTOR = 2.5`, ulangi sampai `MAX_ALTERNATE_ATTEMPTS = 6`, terima kandidat hanya kalau porsi panjangnya yang tumpang tindih dengan rute yang sudah diterima ≤ `MAX_SHARED_LENGTH_RATIO = 0.7`. Ini pencarian jalur k-terbaik yang disederhanakan (bukan Yen's algorithm penuh) — cukup untuk graf jalan skala catchment sekolah (ribuan edge), dan sengaja tidak menjamin alternatif selalu ditemukan: temuan G8 (§Fase 3) sudah menunjukkan ~90% pasangan blok–sekolah punya rute teradem yang identik dengan rute terpendek, jadi banyak jaringan lokal genuinely tidak punya jalur berbeda yang layak. Rute terpendek tetap dihitung untuk tabel perbandingan FR-4 tapi tidak lagi digambar di peta (§Revisi lanjutan keempat di bawah) — pencarian alternatif sekarang hanya menghindari geometri rute teradem. Dijkstra client-side sendiri diganti dari linear-scan O(V²) ke binary heap (`web/src/lib/dijkstra.ts`) supaya menjalankannya sampai empat kali (teradem, terpendek, dua percobaan alternatif) tetap di bawah <1 detik NFR §7 pada graf 6-8 ribu edge.

**Slider jam dihapus dari Mode 2 (amendemen FR-13).** Jam yang berlaku sekarang selalu `clampToSchoolHour(currentOrlandoHour())` — dihitung, bukan dipilih. `HourSlider` dan `useDefaultHour` tetap dipakai penuh di Mode 1 (kontrol layer zona choropleth); hanya jalur Mode 2 yang berhenti membaca/menulis `hour` context bersama.

**Warna rute FR-28 akhirnya dibangun.** Token `--route-coolest`, `--route-heat-cool`, `--route-heat-hot` yang sudah lama tertulis di `DESIGN.md` (keputusan 2026-08-27) ditambahkan ke `theme.css` dan `RouteColors` (`web/src/lib/mapPaint.ts`) — sebelumnya rute teradem masih memakai `--ink` (tinta hitam). Rute terpendek yang ter-ramp jadi `web/src/lib/routeRampFeatures.ts` (ekspresi `interpolate` MapLibre, domain `meta.baseline_c` sampai segmen terpanas di jalur) dan `web/src/hooks/useShortestRouteLayer.ts`; layer ini dipakai kedua mode supaya gerbang §Fase 6 "rute FR-10 byte-identik dengan FR-3" tetap berlaku pada tampilannya, bukan cuma datanya.

**Verifikasi:** `npx tsc --noEmit` dan `npm run build` bersih; `wc -l` semua file baru/tersentuh ≤150 baris TS/TSX (dicek manual, `web/src/routes/ParentRoute.tsx` 143, `web/api/live-temperature-result.ts` dipecah jadi 49 + `web/api/_lib/heatmapGrid.ts` 109); grep `#[0-9a-fA-F]` di `web/src` bersih kecuali `theme.css`; diverifikasi manual di dev server (`npm run dev`) — panel menampilkan 2-4 kartu rute, kartu bisa dipilih dan menebalkan garis alternatif terkait, toggle "Hide heat data" mematikan rute teradem + alternatif dan mengembalikan rute terpendek ke abu putus-putus, dan kegagalan `/api/live-temperature-*` (tidak ada `vercel dev` di lingkungan ini) terbukti gagal senyap — status `unavailable`, nol error console, produk tetap di hari model.

### Revisi Fase 14 (lanjutan, same-day 2026-08-28): panel dipangkas, rute jadi tiga, bug seleksi-peta diperbaiki

**Pemicu:** review Revan atas tangkapan layar panel yang baru dibangun — panel dinilai terlalu ramai dibanding "usual map" (chip alamat contoh, dropdown sekolah native), jumlah rute (4 kartu) dinilai terlalu banyak, jam masih 24 jam, dan yang paling penting: mengklik kartu rute selain "Coolest" tidak mengubah apa pun di peta — bug, bukan fitur.

**Origin jadi pencarian dengan saran langsung, bukan chip.** `web/src/components/OriginField.tsx` dirombak: chip lokasi contoh (`SAMPLE_LOCATIONS`) dan teks "Or drag the pin on the map." dihapus dari UI (nilai default `SAMPLE_LOCATIONS[0]` tetap dipakai untuk pin awal, hanya tampilannya yang hilang). `hooks/useGeocode.ts` (satu hasil, dipicu submit) diganti `hooks/useGeocodeSuggestions.ts` (debounce 300ms, sampai 5 hasil dari `lib/geocode.ts:geocodeSuggestions`, limit Nominatim dinaikkan dari 1 ke 5) — mengetik menampilkan dropdown saran yang bisa diklik, Enter tanpa memilih saran memakai hasil teratas.

**Destination jadi pencarian yang dibatasi ke daftar sekolah, bukan `<select>` native.** `web/src/components/DestinationField.tsx` dirombak total: dari shadcn `Select` menjadi `<input>` polos + dropdown saran yang menyaring `schools` (props yang sudah ada, tanpa panggilan jaringan baru) berdasar substring nama, maksimum 8 hasil. **Constraint kuncinya:** `onSelect` hanya terpanggil saat mengklik satu hasil — mengetik teks bebas tidak pernah mengganti `selectedSchoolId`. Saat field kehilangan fokus (`onBlur`, delay 150ms supaya klik pada opsi sempat terdaftar), teks input dipaksa kembali ke nama sekolah yang sedang terpilih. Pengguna tidak bisa "nyangkut" di teks yang bukan nama sekolah valid.

**Jumlah rute alternatif dipangkas dari dua ke satu — total tiga kartu, bukan empat.** `ALTERNATE_ROUTE_COUNT` di `lib/routeAlternatives.ts` diubah dari `2` ke `1`. Tidak ada perubahan pada metode pencarian (penalti + ambang kemiripan) — hanya berhenti lebih awal.

**Bug diperbaiki: memilih kartu rute sekarang benar-benar mengubah peta.** Akar masalahnya: `useShortestRouteLayer` dan `useRouteLayers` (rute teradem) tidak pernah menerima informasi "sedang terpilih atau tidak" — hanya layer rute alternatif (`useAlternateRoutesLayer`) yang punya logika lebar-garis bersyarat. Klik pada kartu "Coolest" atau "Shortest" karena itu betul-betul nol efek visual. Dua perbaikan ditambahkan sekaligus:

1. **Lebar garis reaktif terhadap seleksi** di ketiga hook layer rute — kedua fungsi menerima prop `selected?: boolean` baru (default `false`, jadi panggilan Mode 1 yang sudah ada tidak perlu berubah): rute teradem 5px→6,5px (casing 8px→9,5px), rute terpendek 2,5px→3,5px (mode FR-16: 2px→3px).
2. **`map.fitBounds` ke geometri rute terpilih** — hook baru `hooks/useRouteFocus.ts` menghitung kotak pembatas (`lib/routeBounds.ts:boundsFromCoordinates`) dari geometri rute yang sedang dipilih (`lib/selectedRouteId.ts:selectedRouteGeometry`) dan memanggil `fitBounds` (padding 64px, `maxZoom` 17, durasi 600ms) setiap kali `selectedRouteId` — bukan geometrinya — berubah. Kuncinya di situ: geometri disimpan lewat `useRef` dan dibaca di dalam effect, bukan dijadikan dependency, supaya rute yang di-upgrade suhu live (FR-29) tidak memicu lompatan kamera yang tidak diminta pengguna.

Mekanisme kedua ini yang benar-benar menyelesaikan laporan bug: karena ~90% pasangan blok–sekolah punya rute teradem yang identik dengan rute terpendek (G8, §Fase 3), lebar garis saja tidak selalu terlihat — kalau dua rute berbagi geometri persis, satu akan selalu tergambar tepat di atas yang lain berapa pun lebarnya. `fitBounds` memberi umpan balik yang selalu terlihat, terlepas dari apakah geometrinya sama atau berbeda.

**Jam jadi format 12 jam di Mode 2.** `lib/units.ts:formatHourAmPm` baru (regex `HH:MM` → `H:MM AM/PM`), dipakai `LiveConditionsRow` ("Now · 7:00 AM") dan `RouteComparisonPanel` (header "Coolest route, mean temperature at 7:00 AM"). String `hour` (`"07:00"`) yang mendasari **tidak berubah** di mana pun — hanya lapisan tampilan yang diformat ulang, jadi tidak ada risiko terhadap logika routing atau `HourSlider` Mode 1 (tetap 24 jam, sesuai granularitas `meta.hours`).

**Verifikasi:** `npx tsc --noEmit` dan `npm run build` bersih; semua file baru/tersentuh ≤150 baris; grep `#[0-9a-fA-F]` bersih kecuali `theme.css`; diverifikasi manual di dev server — saran Origin muncul saat mengetik dan memindahkan pin saat diklik, mengetik nama sekolah yang tidak ada menampilkan "No matching school" dan kembali ke sekolah semula saat blur, panel menampilkan tepat tiga kartu rute (Coolest/Shortest/Alternate route 1) untuk `sch_maynard_evans_high`, dan mengklik "Shortest route" maupun "Alternate route 1" masing-masing memindahkan kartu terpilih **dan** membingkai ulang peta ke rute itu — termasuk kasus rute teradem/terpendek yang geometrinya identik.

### Revisi Fase 14 (sesi 28 Agustus, lanjutan kedua): biru hanya rute terpilih + pencarian Origin memindahkan pin dan kamera

**Biru hanya untuk kartu terpilih (amendemen FR-28).** Sebelum revisi ini, rute teradem selalu biru dan rute terpendek yang tidak terpilih memakai ramp biru→oren — dua sumber biru sekaligus di peta, dan seleksi kartu hanya terbaca dari lebar garis. Kedua hook layer rute (`useRouteLayers`, `useShortestRouteLayer`) kini menerima prop `unselectedColor: 'data' | 'neutral'`: Mode 2 (`useParentMapLayers`) memakai `'neutral'` — rute tidak-terpilih digambar 2–2,5px `--ink-subtle` polos, casing rute teradem disembunyikan — sedangkan Mode 1 (`useDistrictMapLayers`) memakai `'data'` eksplisit sehingga tampilannya (biru teradem + ramp terpendek) tidak berubah. Konsekuensi produk: ramp FR-28 tidak lagi muncul di Mode 2 dan hanya hidup di Mode 1.

**Rute terpilih dipindah ke atas tumpukan layer.** Tanpa ini, revisi warna di atas justru memperburuk bug lama: layer rute teradem (yang paling atas sejak awal) yang kini netral abu akan menutupi garis biru rute terpendek/alternatif yang baru saja terpilih, persis pada ~90% geometri bersama (G8). Hook baru `hooks/useRouteLayerOrder.ts` mengurutkan ulang keempat layer rute dengan `map.moveLayer(layerId, AOI_BOUNDARY_LAYER_ID)` — dipasang tepat di bawah batas AOI, bukan ke puncak mutlak, supaya lingkaran kebijakan dan batas AOI tetap di atas rute. Id layer rute diekspor dari masing-masing hook untuk keperluan ini.

**Pencarian Origin memindahkan pin dan kamera.** Memilih saran pencarian kini juga memanggil `map.flyTo` ke titik baru (`hooks/usePickOrigin.ts`, zoom minimal 14,5 — tidak pernah mengecilkan zoom yang sudah lebih dekat). Sebelumnya pin berpindah tapi kamera diam, jadi alamat di luar layar terlihat seperti "tidak terjadi apa-apa".

**Kotak Origin selalu sinkron dengan pin yang diseret.** Laporan Revan: setelah menyeret pin, teks Origin tetap menampilkan alamat lama. Akar masalah di `hooks/useOriginAddressSync.ts`: kegagalan `reverseGeocode` (Nominatim membatasi ±1 permintaan/detik; debounce pencarian 300ms + seret pin mudah melampauinya) ditelan `.catch(() => undefined)` sehingga teks diam di alamat basi — dan respons yang telat bisa saling menimpa. revisi: (1) teks langsung disetel ke koordinat pin (`lib/units.ts:formatPinCoordinates`, 4 desimal) sehingga kotak tidak pernah menampilkan lokasi lain daripada pin; (2) alamat hasil reverse-geocode menimpa koordinat hanya saat permintaan itu masih yang terbaru (penjaga `latestRequestRef` terhadap seret beruntun); (3) kegagalan eksplisit membiarkan koordinat bertahan.

**Verifikasi:** `npx tsc --noEmit` bersih; semua file tersentuh ≤150 baris (terpanjang `ParentRoute.tsx` 148); tanpa komentar baru.

### Revisi Fase 14 (sesi 28 Agustus, lanjutan ketiga): Mode 1 tanpa rute, siklus fokus sekolah, pin terkunci, ramp dipensiunkan

Tiga permintaan Revan untuk `/district` yang mengubah bentuk Mode 1 dan menutup riwayat ramp FR-28.

**Rute dihapus total dari Mode 1 (FR-10 dicabut).** Tampilan distrik kini murni zona: lingkaran kebijakan, choropleth dosis, lingkaran setara-dosis. Dihapus: `hooks/useDistrictSelectedRoute.ts` (menghitung rute blok→sekolah di klien), `hooks/useSegmentHighlightLayer.ts` + `lib/segmentHighlight.ts` (highlight segmen penyumbang dosis tertinggi), fungsi `solveCoolestPathSegments` + `coolestDoseAcrossHours` di `lib/routeSolver.ts` (terakhir sudah tanpa konsumen), dan seluruh input rute di `useDistrictMapLayers`/`DistrictRoute`. Angka rute per blok (`shortest`/`coolest` — mean/peak °C, dosis) tetap tampil di panel detail blok (FR-9) karena di-precompute pipeline; yang dihapus hanya garis di peta. Tabel prioritas segmen per sekolah (FR-15) tetap — itu data jalan per sekolah, bukan rute.

**Siklus fokus sekolah.** Sebelumnya Mode 1 memakai `appState.selectedSchoolId` (terkunci ke Evans sejak boot) sehingga selalu ada sekolah terpilih dan penuh pin + zona sekaligus. Kini Mode 1 punya state sendiri `focusedSchoolId` (di `DistrictStateProvider`, mulai `null`): klik pin/baris teranalisis → fokus — `useDistrictMapLayers` memfilter `nationalSchools` ke sekolah terfokus saja (`resolveAnalyzedSchoolId`) sehingga semua pin lain hilang dari peta; klik pin yang sama lagi, atau tombol back di header panel, melepas fokus sepenuhnya (fokus, blok, notice, jam dibersihkan; panel kembali ke daftar sekolah; kamera tidak bergerak). Tanpa fokus, tidak ada zona yang dirender (`selectedSchool === null` → semua layer zona kosong secara alami). `appState.selectedSchoolId` tidak lagi disentuh Mode 1; Mode 2 tidak berubah.

**Pin belum-teranalisis terkunci.** `useSchoolPinsLayer` menambah `icon-opacity` ±0,55 untuk pin belum-teranalisis dan menyembunyikan label namanya (`text-field` case) — hanya pin teranalisis yang berlabel. Klik pin redup tetap memunculkan notice "belum dianalisis" (FR-20 tidak berubah); di bawah zoom 10 titik `circle` kecil tetap.

**Ramp FR-28 dipensiunkan.** Dua keputusan di atas + amendemen "biru hanya rute terpilih" menyisakan ramp tanpa satu pun tempat tampil: Mode 2 tidak memakainya, Mode 1 tidak punya rute. Dihapus: `lib/routeRampFeatures.ts`, cabang ramp di `useShortestRouteLayer` (kini geometri polos, warna `--route-coolest` terpilih / `--ink-subtle` tidak), prop `unselectedColor` dari kedua hook layer rute (netral-tak-terpilih jadi satu-satunya perilaku), token `--route-heat-cool`/`--route-heat-hot` dari `theme.css` + `mapPaint.ts`. `--route-coolest` tetap sebagai satu-satunya warna rute.

### Revisi Fase 14 (sesi 28 Agustus, lanjutan keempat): rute terpendek dihapus dari Mode 2, alternatif naik dari satu jadi dua

**Pemicu:** dua laporan Revan atas Mode 2. Pertama, kenapa rute kadang bergaris merah — bukan bug: `useRouteLayers.ts` mewarnai rute teradem `--zone-bus` saat pin origin jatuh di blok `class === 'red'` (rute teradem pun melewati ambang dosis, "bus recommended", FR-8). Sinyal ini disengaja; tidak diubah di revisi ini. Kedua, kartu "Shortest route" dinilai kebanyakan redundan dengan "Coolest route" (G8: ~90% pasangan blok–sekolah punya geometri identik) — diminta dihapus, dan jumlah rute alternatif dinaikkan dari satu jadi dua supaya panel tetap tiga kartu.

**Rute terpendek berhenti digambar dan berhenti jadi kartu, tapi tetap dihitung.** `web/src/hooks/useShortestRouteLayer.ts` dihapus beserta pemanggilannya di `useParentMapLayers.ts` dan entrinya di `useRouteLayerOrder.ts`. Kartu "Shortest route" dihapus dari `RouteOptionList.tsx`. `SelectedRouteId` (`lib/selectedRouteId.ts`) menyempit ke `'coolest' | \`alternate-${number}\``. `routeSolver.ts` **tidak berubah pada baris yang menghitung `shortest`** — jalur itu tetap dicari dan tetap dikembalikan di `SolvedRoutes.shortest`, karena `RouteComparisonPanel` (tabel FR-4, di balik disclosure "Details") masih membandingkannya terhadap `coolest`. Yang berubah cuma argumen `findAlternateRoutes`: daftar jalur-yang-dihindari turun dari `[shortestPath, coolestPath]` jadi `[coolestPath]` saja, karena tidak ada lagi alasan menjauhkan alternatif dari geometri yang sudah tidak digambar.

**`ALTERNATE_ROUTE_COUNT` naik dari 1 ke 2** (`lib/routeAlternatives.ts`) — kebalikan tepat dari pemangkasan same-day 2026-08-28 yang dicatat di §Revisi pertama Fase 14 di atas. Metode pencarian (penalti `ALTERNATE_PENALTY_FACTOR = 2.5`, ambang kemiripan `MAX_SHARED_LENGTH_RATIO = 0.7`, `MAX_ALTERNATE_ATTEMPTS = 6`) tidak berubah — hanya berhenti lebih lambat. Panel tetap tiga kartu total (teradem + dua alternatif), sama seperti sebelum revisi ini, tapi komposisinya berubah dari (teradem, terpendek, 1 alternatif) jadi (teradem, alternatif 1, alternatif 2).

**Rute teradem mengambil alih peran garis netral FR-16.** Sebelumnya, saat "Hide heat data" aktif, satu-satunya garis yang bertahan di peta adalah rute terpendek (netral abu putus-putus) — rute teradem dan alternatif hilang total. Karena rute terpendek sudah tidak digambar, peran itu harus pindah ke rute teradem sendiri, dan warna gagalnya (`--zone-bus`, sinyal panas) harus ikut mati selama FR-16 aktif — kalau tidak, toggle "matikan data panas" akan tetap menampilkan sinyal panas paling mencolok di peta. Logika warna diekstrak jadi fungsi murni `lib/coolestRoutePaint.ts` (dipisah dari efek MapLibre di `useRouteLayers.ts` supaya file itu tidak melewati batas 150 baris), dengan urutan prioritas: `hideHeatData` menang mutlak (abu putus-putus, `routeFailed` diabaikan) → lalu `routeFailed` (merah) → lalu status terpilih (biru/abu). Perbaikan alur data yang menyertainya: efek yang men-set-data sumber geometri rute teradem sebelumnya `return` lebih awal saat `hideHeatData` sehingga geometri tidak pernah dipasang ke source-nya; sekarang layer teradem selalu `visible` dan selalu menerima geometri, hanya casing birunya yang ikut disembunyikan lewat `casingVisible` dari `coolestRoutePaint`.

**Verifikasi:** `npx tsc --noEmit` dan `npm run build` bersih; grep `shortest` di `web/src` hanya menyisakan pemakaian level blok/pipeline (`routeSolver.ts`, `routeStats.ts`, `types.ts`, `classification.ts`, `RouteComparisonPanel.tsx`, `BlockDetailPanel.tsx`, dll) — nol sisa sebagai ID rute yang bisa dipilih; grep `#[0-9a-fA-F]` bersih kecuali `theme.css`; semua file baru/tersentuh ≤150 baris (`useRouteLayers.ts` 121, `coolestRoutePaint.ts` 41).

**Verifikasi:** `npx tsc --noEmit` bersih; `npm run build` bersih; semua file tersentuh ≤150 baris; tanpa komentar baru.

### Revisi Fase 6/12 (sesi 28 Agustus, lanjutan): ringkasan sekolah dipangkas, salah klasifikasi jadi sorotan peta

**Pemicu:** Revan minta panel sekolah Mode 1 dipangkas ke tiga baris (siswa di walk zone, dua baris salah klasifikasi), dengan dua baris salah klasifikasi diberi toggle yang menyorot blok bersangkutan langsung di peta. Lihat amendemen FR-12/FR-18 di `heatwalk-prd.md` dan §Mode 1/§Slider jam di `DESIGN.md` untuk keputusan produknya; catatan di sini murni tentang kenapa predikat sorotannya dibangun seperti ini.

**Predikat sorotan dibangun dari `class` + `status_now`, bukan dari `status_rec`.** `status_rec` dihitung sekali oleh pipeline di jam kanonik dan tidak berubah saat slider digeser, sedangkan `class` (dan karenanya himpunan blok yang tampak merah di choropleth) diperbarui per jam oleh `web/src/lib/applyHourClass.ts`. Kalau predikat sorotan memakai `status_rec`, sorotan akan diam di jam kanonik sementara warna blok di bawahnya berubah — dua sinyal yang seharusnya sama akan lepas sinkron begitu pengguna menggeser slider. `web/src/lib/misclassifiedHighlight.ts` karena itu memakai `['==', ['get','class'],'red']` + `['==', ['get','status_now'],'walk']` untuk "Walks, should get bus", dan pasangan `class === 'green'` + `status_now === 'bus'` untuk "Gets bus, doesn't need it" — persis definisi `pipeline/summary_build.py`, cuma dievaluasi ulang di client per jam alih-alih dibaca statis dari `summary.json`.

**`BUS_NOT_NEEDED_MAX_EXCESS_MI = 0.25` sengaja dicerminkan di frontend**, bukan dibaca dari data, karena nilainya perlu dipakai di dalam ekspresi filter MapLibre (`['<=', ['-', ['get','distance_mi'], walkRadiusMi], 0.25]`) yang dievaluasi di GPU/layer engine, bukan di JS — tidak ada jalur untuk membawa satu angka dari `pipeline/config.py` ke situ selain menyalinnya. Konsekuensinya: kalau `BUS_NOT_NEEDED_MAX_EXCESS_MI` di `pipeline/config.py` pernah dikalibrasi ulang, nilai kembarnya di `misclassifiedHighlight.ts` harus ikut diubah di komit yang sama, atau himpunan blok yang tersorot akan berbeda dari angka yang ditampilkan panel (yang tetap dibaca langsung dari `summary.json`, tidak dihitung ulang).

**Sorotan di-scope ke `school_id` sekolah terpilih lewat source terpisah** (`focusedSchoolBlocks` di `useDistrictRouteData.ts`, bukan `policyCircleBlocks` yang dipakai choropleth), karena `blocksInsidePolicyCircle` mengkliping berdasarkan jarak ke titik sekolah tanpa menyaring `school_id` — blok sekolah tetangga bisa jatuh di dalam lingkaran kebijakan sekolah lain, dan blok "gets bus, doesn't need it" (di luar radius kebijakan, hampir per definisi) sering jatuh di luar lingkaran itu sama sekali.

**Verifikasi:** `npx tsc -b` dan `npm run build` bersih; `npm run lint` (oxlint) nol warning baru; diperiksa manual di `/district` untuk Hiawassee Elementary (13 blok merah di walk zone) — outline muncul tepat di blok tersebut, hilang saat toggle dimatikan atau saat FR-16 aktif, dan ikut berubah saat slider digeser ke jam non-kanonik; Edgewater High (`no_safe_route = 0`) menunjukkan kedua switch nonaktif dengan angka `0`; semua file baru/tersentuh ≤150 baris.

### Revisi Fase 6/12 (sesi 29 Agustus): `misclassified` ikut jam slider — dan dua bug pipeline pre-existing yang ikut ketemu

**Pemicu:** Revan menyadari "Students in walk zone" tidak pernah berubah saat slider digeser, dan menanyakan apakah perlu fetch ulang. Jawabannya: `in_walk_zone` memang murni geografis (jarak ke sekolah vs radius kebijakan) dan seharusnya tidak pernah berubah — tapi `misclassified.walk_should_bus`/`bus_not_needed` (baris "Walks, should get bus" / "Gets bus, doesn't need it") **seharusnya** ikut jam, karena predikatnya bergantung pada `class` yang heat-dependent, sementara `summary.json` cuma snapshot di jam kanonik. Ditanya bagaimana ingin diselesaikan: hitung ulang di pipeline (bukan di frontend, sesuai aturan "frontend tidak menghitung ulang" di `CLAUDE.md`) — Revan memilih opsi ini.

**Implementasi yang diminta:** `pipeline/summary_build.py:_misclassified_by_hour` mengevaluasi ulang predikat `misclassified` yang sama (`status_now`/`class`/`distance_mi` vs `BUS_NOT_NEEDED_MAX_EXCESS_MI`) untuk **setiap** jam di `meta.hours`, dengan `class` diambil dari `blocks_hours.build_blocks_hours(routed)` (sumber yang sama dipakai choropleth per jam) alih-alih `class` canonical di `blocks.geojson`. Ditulis ke `summary.json.misclassified_by_hour`, field baru — lihat `docs/CONTRACT.md`. `pipeline/step5_export.py` dan `pipeline/fixture_classify.py` direstrukturisasi supaya `blocks_hours_by_school` dihitung **sebelum** `summary_build.build_summary` dipanggil (sebelumnya dihitung belakangan, di dalam loop per-sekolah) — perubahan urutan murni, logika `blocks_hours.build_blocks_hours` sendiri tidak disentuh. Frontend: `SchoolSummaryRow.tsx` menerima `hour` dan memilih baris lewat `web/src/lib/misclassifiedHighlight.ts:misclassifiedCountsForHour(summary, hour)` — jatuh balik ke `summary.misclassified` (snapshot kanonik) kalau `hour` null atau tidak ada di `misclassified_by_hour`. Efek samping yang diinginkan: switch "Gets bus, doesn't need it" (yang **selalu** disabled sebelumnya karena `0` di jam kanonik untuk seluruh 42 sekolah) sekarang bisa aktif di jam-jam lain — dikonfirmasi di browser: Hiawassee Elementary menunjukkan `49` anak pada 08:00 untuk kategori itu, padahal `0` pada jam kanonik 15:00.

**Temuan 1 — cache `data/interim/classified/*.json` basi untuk 6 sekolah, angka `no_safe_route` yang salah selama ini.** Menjalankan `pipeline/step5_export.py` untuk meregenerasi `summary.json` mengekspos: `data/interim/classified/sch_hiawassee_elementary.json` (mtime 28 Agustus 12:09) lebih tua dari `data/interim/routes/sch_hiawassee_elementary.json` (mtime 28 Agustus 15:02) — artinya `pipeline/step4_classify.py` tidak pernah dijalankan ulang setelah rute terakhir kali dihitung ulang untuk sekolah itu, entah kenapa, dari sesi kerja sebelumnya (bukan dari sesi ini — `pipeline/step3_routes.py` sendiri sedang diedit Revan, belum di-commit, menambah `exclude_node_id=school_node` ke `node_snapping.snap_points`, tapi edit itu sendiri baru disentuh 29 Agustus 00:11, jauh setelah rute Hiawassee terakhir dihitung — dua hal yang berbeda, kebetulan tumpang tindih). Efeknya: `blocks.geojson` (dari cache basi) dan `blocks_hours.json` (dihitung fresh dari `routed`, tidak bergantung pada cache classify) sudah lama tidak sepakat soal `class` sebuah blok di jam kanonik untuk 6 sekolah: `sch_hiawassee_elementary`, `sch_jones_high`, `sch_hungerford_elementary`, `sch_ivey_lane_elementary`, `sch_killarney_elementary`, `sch_legends_academy_charter`. Konsekuensinya nyata secara angka — bukan kosmetik: `no_safe_route` (dan `misclassified.walk_should_bus`) Hiawassee naik dari **329 → 513** anak, Jones High dari **300 → 757** anak, setelah `pipeline/step4_classify.py` dijalankan ulang (murni offline, membaca `data/interim/routes/*.json` yang sudah ada, tanpa panggilan jaringan) untuk meregenerasi cache classify dari data rute yang benar-benar terkini. Diverifikasi: `no_safe_route == misclassified.walk_should_bus == misclassified_by_hour[canonical_hour].walk_should_bus == Σkids_est` dari `blocks.geojson` sekarang cocok persis di seluruh 42 sekolah (dicek programatik, nol selisih) — sebelumnya tidak, untuk 6 sekolah itu. **Angka baru ini sudah masuk `data/out/summary.json` dan `web/public/data/summary.json`** (lihat Temuan 2 soal bagaimana ini ditulis tanpa lewat `step5_export.py` yang utuh). Kalau angka-angka ini sudah pernah dibawa ke materi rapat, materi itu perlu diperbarui — perubahannya besar untuk dua sekolah tersebut.

**Temuan 2 — `pipeline/step5_export.py` tidak aman dijalankan dua kali; `graph.json`/`segments.json` untuk `sch_hiawassee_elementary` masih dari kerja Revan yang belum selesai, TIDAK disentuh sesi ini.** Baris 142 (`school_graph = _load_json(school_dir / "graph.json")`) membaca graph dari `DATA_OUT_DIR` — lokasi yang sama yang ditulis balik pruned di baris 153. Skrip ini diam-diam mengasumsikan `graph.json` yang dibaca masih graph **penuh** (dari `pipeline/step2_build_graph.py`), bukan hasil pruning run sebelumnya — asumsi yang tidak eksplisit di mana pun dan tidak diverifikasi. Menjalankan `step5_export.py` untuk kedua kalinya di sesi ini memicu `KeyError: 'e60462'` di `segment_priority.build_segment_priority` untuk `sch_hiawassee_elementary`: sebuah edge yang dipakai rute salah satu blok tidak ada lagi di `graph.json` yang sudah di-prune. Ditelusuri lebih jauh (mtime + tiga kali percobaan run, termasuk foreground penuh untuk memastikan exit code sebenarnya = 1, bukan 0 seperti yang sempat dilaporkan proses background): `graph.json`/`temps.json`/`segments.json` milik `sch_hiawassee_elementary` di `data/out/` **belum pernah disentuh sesi ini sama sekali** (mtime tetap 29 Agustus 00:25, dari pekerjaan Revan sendiri pagi itu, sebelum sesi ini dimulai) — crash-nya reproducible di data apa adanya, bukan sesuatu yang rusak akibat perubahan di sesi ini. `prune_to_catchment` (`pipeline/subgraph_prune.py`) sendiri murni idempoten (filter spasial berdasarkan parameter tetap, `P(P(x)) = P(x)`) — jadi 4 sekolah yang sempat ter-prune dua kali di sesi ini (`sch_amikids_orlando`, `sch_aspire_academy_charter`, `sch_college_park_middle`, `sch_edgewater_high`, sebelum proses berhenti di Hiawassee) matematis identik dengan hasil prune sekali, tidak rusak.

**Yang dilakukan untuk menyelesaikan Temuan 1 tanpa menyentuh masalah di Temuan 2:** ditulis skrip sekali-pakai (`_recover_summary_export.py`, dijalankan lalu dihapus, bukan bagian permanen `pipeline/`) yang mereproduksi persis bagian `step5_export.py:main()` yang dibutuhkan — `summary.json`, `blocks.geojson`, `blocks_hours.json` per sekolah, `district_blocks.geojson`, `district_blocks_hours.json`, `mirror_to_web()` — **tanpa** memanggil `segment_priority.build_segment_priority` atau `prune_to_catchment` sama sekali. `graph.json`, `temps.json`, `segments.json` untuk seluruh 42 sekolah dibiarkan apa adanya, tidak diregenerasi, tidak di-restore dari git — status mereka sekarang persis sama seperti sebelum sesi ini dimulai. `pipeline/verify_step4.py` lulus penuh atas hasilnya (termasuk `check_blocks_hours_matches_geojson` dan `check_district_blocks_partition`, yang tadinya gagal untuk 6 sekolah — ternyata gejala dari cache classify basi yang sama di Temuan 1, bukan masalah geometri terpisah seperti dugaan awal).

**Yang TIDAK diperbaiki, sengaja, dan perlu keputusan Revan:** akar masalah Temuan 2 (`step5_export.py` membaca `graph.json` miliknya sendiri sebagai kalau itu masih graph penuh) belum diperbaiki. Menjalankan `python -m pipeline.step5_export` secara utuh **akan crash lagi** di Hiawassee sampai salah satu dari ini terjadi: (a) `graph.json` untuk seluruh sekolah diregenerasi dari nol lewat `pipeline/step2_build_graph.py` (network/OSM, tidak dijalankan sesi ini), atau (b) `step5_export.py` diubah supaya tidak membaca ulang output pruning-nya sendiri sebagai input (mis. baca dari salinan `data/interim/` yang belum di-prune). `segments.json` (FR-15, tabel prioritas segmen) sendiri sudah dicabut dari frontend (`SegmentPriorityTable.tsx`/`useSegmentPriority.ts` dihapus, lihat amendemen Mode 1 di `DESIGN.md`) — jadi crash ini menghentikan seluruh ekspor demi menulis satu file yang tidak lagi dibaca siapa pun; salah satu perbaikan termurah adalah membuang langkah `segments.json` dari `step5_export.py`, tapi itu keputusan arsitektur di luar cakupan permintaan asli, tidak diambil sendiri.

**Verifikasi:** `python -m pipeline.verify_step4` lulus (`Semua verifikasi Fase 4 lulus`); `no_safe_route == misclassified.walk_should_bus == misclassified_by_hour[canonical].walk_should_bus` dicek programatik nol selisih di 42/42 sekolah; `web/public/data/summary.json` dicek byte-identik dengan `data/out/summary.json`; `npx tsc -b`, `npm run build`, `npm run lint` bersih; diverifikasi manual di browser untuk Hiawassee Elementary — panel `513` pada 15:00, `351` pada 13:00, `0`/`49` pada 08:00, sorotan peta ikut berubah setiap kali.

## Sumber data & sitasi (final, Fase 7)

### Sitasi ilmiah

- Lanza K, dkk. "Heat-Resilient Schoolyards: Access to Playgrounds and Shade." *J Phys Act Health* 2023;20(2):134–141. `journals.humankinetics.com/view/journals/jpah/20/2/article-p134.xml` — sumber `BASELINE_C = 33,0°C` dan `SHADE_COOLING_C` (§Fase 6).
- Meng Y, dkk. "Investigation of heat stress on urban roadways for commuting children." *Urban Climate* 2023;49:101564. — sitasi pendukung dosis panas rute komuter anak.
- Arizona DHS. *Managing Extreme Heat Recommendations for Schools* (pilot version), 2021. `azdhs.gov/documents/preparedness/epidemiology-disease-control/extreme-weather/heat/managing-extreme-heat-recommendations-for-schools.pdf` — sitasi ilmiah ambang perilaku panas, tetap dipakai meski kota demo pindah ke Florida (§Fase 1); bukan sandaran hukum.
- **"Basu R, dkk. (2024)" — sitasi tidak lengkap sejak draf awal dan tidak berhasil diverifikasi ulang lewat pencarian literatur di Fase 7 (nama penulis umum di bidang epidemiologi panas, tidak cukup untuk menunjuk satu makalah spesifik tanpa berisiko salah kutip).** Dihapus dari daftar aktif di atas sampai sumber aslinya bisa dikonfirmasi — **jangan dikutip di pitch atau materi lain dalam bentuk ini.** Kalau Revan punya referensi spesifik yang dimaksud, tempelkan judul/DOI-nya di sini.

### Data resmi & API

- Florida Statute §1006.21 — *Transportation of public school students*; §1006.23 — *Hazardous walking conditions*. `flsenate.gov/Laws/Statutes/2024/1006.21`, `flsenate.gov/Laws/Statutes/2024/1006.23`. Sandaran hukum FR-5 & §1.2, menggantikan Arizona per pivot Fase 1.
- OCPS Transportation FAQs — `ocps.net/transportation-faqs`. Sumber `walk_radius_mi = 2,0` dan `policy_source` (§1.3) — dipakai sebagai pengganti PDF kebijakan resmi yang tidak berhasil diakses (`403` di `go.boarddocs.com/fla/orcpsfl`), dicatat sebagai limitasi eksplisit di `docs/LIMITATIONS.md`.
- FortyGuard API — `https://docs-api.fortyguard.com`. Sumber `tcm` (heatmap) dan `env_params`.
- Iowa Environmental Mesonet ASOS (Iowa State University) — `https://mesonet.agron.iastate.edu`. Ground truth METAR (Fase 0) dan riwayat jam-jaman stasiun MCO 2019–2025 (G9, §Fase 3).
- NCES EDGE — `nces.ed.gov/opengis/rest/services`. Layanan `EDGE_ADMINDATA_PUBLICSCH_2324` (enrollment + jenjang, §1.5.5) dan `EDGE_GEOCODE_PUBLICSCH_1920` (kepadatan sekolah, §1.3); tanpa filter bbox untuk `schools_national.json` (FR-20, §Fase 6).
- TIGERweb (US Census Bureau) — `tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Tracts_Blocks/MapServer/2`. Geometri dan `POP100` 2020 Census block (§1.5.5).
- Census Bureau API — `api.census.gov`. 2020 DHC P12 (anak 5–17 per pita umur per blok) dan ACS 2022 5-year B19013 (pendapatan, block group) / B17001 (kemiskinan, tract) (§1.5.5).
- OpenStreetMap / Overpass, lewat `osmnx` — `overpass-api.de`. Jaringan jalan pejalan kaki (§1.5.5).
- OpenFreeMap — basemap dan glyph font vector tiles remote, style `liberty` (§Fase 8 di atas), `tiles.openfreemap.org`, data asal OpenStreetMap.
