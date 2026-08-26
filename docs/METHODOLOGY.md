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

Sesuai fail branch dev plan (`faktor_koreksi di luar 0,3–3,0` → "jangan pakai angkanya, cek batas attendance dulu"): kedua angka **tetap ditulis apa adanya** ke `summary.json` (bukan disembunyikan di balik placeholder `1.0`) karena keduanya informatif dan sebabnya terjelaskan, tapi **tidak dipakai sebagai pengali tervalidasi** di perhitungan dose-eliminated manapun — `correction_factor` di `summary.json` saat ini murni deskriptif. Revisit di Fase 4 kalau batas attendance nyata (ArcGIS/SABS, §1.3/1.5.5) akhirnya bisa diakses.

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

`pipeline/run_all.py` memverifikasi keseluruhan rantai `step3_routes → step3b_outcomes → step4_classify → step5_export` bisa dijalankan ulang dari cache yang sudah ada (`data/raw/`, `by_school/*/graph.json`+`temps.json`) **tanpa satu panggilan API pun**, dan menghasilkan `data/out/` serta `web/public/data/` byte-identik dengan yang sudah di-commit — bukti bahwa pipeline benar-benar deterministik dari data yang sama.

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

## [Pending] Sumber data & sitasi

- Lanza K, dkk. "Heat-Resilient Schoolyards: Access to Playgrounds and Shade." *J Phys Act Health* 2023;20(2):134–141.
- Arizona DHS. *Managing Extreme Heat Recommendations for Schools*, 2021. (sitasi ilmiah ambang perilaku panas — tetap dipakai meski kota demo pindah ke Florida; bukan sandaran hukum)
- Meng Y, dkk. "Investigation of heat stress on urban roadways for commuting children." *Urban Climate* 2023;49:101564.
- Basu R, dkk. (2024).
- Florida Statute §1006.21 — *Transportation of public school students*; §1006.23 — *Hazardous walking conditions* — `flsenate.gov/Laws/Statutes/2024/1006.21`, `.../1006.23`. Sandaran hukum FR-5 & §1.2, menggantikan Arizona per pivot Fase 1.
- FortyGuard API — `https://docs-api.fortyguard.com`.
- Iowa Environmental Mesonet ASOS (ground truth METAR) — `https://mesonet.agron.iastate.edu`.
