# Fase 1 — Scouting AOI: delapan kandidat, satu temuan fisika

Dokumen ini bukti empiris di balik dua keputusan produk 25 Agustus 2026: pencabutan gerbang kontras spasial (PRD §1.3) dan pemilihan AOI `orl_pine_hills_n`. Angka pada tabel di sini bersumber baris-per-baris dari `data/out/aoi_scout.csv`, yang dihasilkan `pipeline/step1_scout_aoi.py` dan bisa dijalankan ulang tanpa kredit (cache `data/raw/phase1_scouting/`).

---

## Metode uji

| Parameter | Nilai |
|---|---|
| Tanggal & jam | `2026-08-18`, `15:00` waktu lokal AOI |
| Ukuran kotak | ~10 mi² (≈5,1 × 5,1 km) per kandidat |
| Granularity | 60 m (resolusi final — biaya heatmap flat per panggilan, tidak ada penghematan dari granularity kasar) |
| Metrik | `p95 − p05` suhu `tcm` antar tile dalam kotak |
| Gerbang saat itu | ≥6°C lulus · <4°C ganti AOI · di antaranya ambigu |
| Validitas data | 100% tile valid pada seluruh kandidat (nol `−999`, nol null) |

## Hasil

Diurutkan dari kontras terbesar. Kandidat terbaik mencapai **31%** dari syarat gerbang; tidak satu pun melewati ambang darurat 4°C.

| # | Kandidat | Mekanisme fisik yang diuji | p05 | Median | p95 | **p95−p05** | Tile | Verdict |
|---|---|---|---|---|---|---|---|---|
| 1 | `orl_pine_hills_n` | Orlando — kanopi padat vs jalan arteri tanpa pohon | 33,31 | 33,74 | 35,15 | **1,84** | 6.970 | GAGAL |
| 2 | `phx_south_phoenix` | Phoenix — kaki elevasi South Mountain vs lembah kota | 40,04 | 40,91 | 41,66 | **1,62** | 6.293 | GAGAL |
| 3 | `orl_pine_hills_sw` | Orlando — kanopi residensial vs komersial | 34,70 | 35,25 | 36,14 | **1,44** | 6.972 | GAGAL |
| 4 | `phx_south_mountain_centered` | Phoenix — puncak South Mountain (Δ~700 m) di tengah kotak | 40,04 | 40,37 | 41,36 | **1,32** | 7.269 | GAGAL |
| 5 | `orl_pine_hills_s` | Orlando — kanopi campuran | 35,00 | 35,60 | 35,83 | **0,83** | 6.800 | GAGAL |
| 6 | `phx_south_mountain_laveen` | Phoenix — lereng gunung vs lahan pertanian Laveen | 41,19 | 41,50 | 41,73 | **0,55** | 6.938 | GAGAL |
| 7 | `phx_arcadia_camelback` | Phoenix — kebun jeruk irigasi vs batuan Camelback Mountain | 41,03 | 41,16 | 41,40 | **0,36** | 6.642 | GAGAL |
| 8 | `phx_papago_tempe` | Phoenix — gurun Papago vs urban Tempe/Sky Harbor | 41,43 | 41,57 | 41,68 | **0,25** | 6.736 | GAGAL |

## Kenapa ini temuan fisika, bukan salah pilih kotak

Empat mekanisme fisik berbeda diuji di dua kota, dan semuanya mentok di rentang yang sama-sama kecil: gradien elevasi (South Mountain, Δ~700 m), efek oasis irigasi (Arcadia vs batuan telanjang), kontras urban/gurun (Papago/Tempe), dan kanopi vs arteri (Pine Hills). Kalau masalahnya pemilihan kotak, keempat mekanisme ini tidak akan gagal serentak.

Penjelasannya sudah terverifikasi di Fase 0: `tcm` adalah suhu udara 2 m AGL, dan pada siang hari lapisan batas atmosfer tercampur secara konvektif sehingga variasi suhu udara intra-urban dalam radius 5 km memang hanya 1–3°C. Kontras 15–25°C yang terlihat di peta panas kota adalah suhu **permukaan**, bukan suhu udara — dan itulah yang dipetakan hampir seluruh prior art. Sinyal ini sudah terlihat sejak kotak verifikasi Fase 0 (~1 mi² bandara, rentang antar tile 0,17°C); skala 10 mi² memperbesar rentangnya, tapi tidak sampai 6°C.

> Kalau kotak mana pun menghasilkan kontras `tcm` >10°C, itu justru alarm bahwa `tcm` bukan suhu udara. Hasil kecil ini mengonfirmasi ulang Fase 0, bukan mengontradiksinya.

## Catatan persentil hari uji

- `2026-08-18` adalah **persentil ke-91,9** suhu maksimum harian Phoenix 2019–2026 (METAR, `pipeline/metar_client.py`) — dekat p90, belum mencapai p95 yang disyaratkan desain uji. Lima hari terpanas dalam rentang itu: `2023-07-20` (48,33°C), `2023-07-18` (47,78°C), `2023-07-19` (47,78°C), `2025-08-07` (47,78°C), `2020-07-30` (47,22°C).
- Hari uji yang sama untuk kandidat Orlando **belum dianalisis** persentilnya terhadap riwayat METAR MCO (`data/raw/metar_range_MCO_*.csv` sudah tersedia di cache).
- Kontras yang bersumber dari tutupan lahan/elevasi relatif stabil hari-ke-hari, sehingga hari yang lebih panas diperkirakan menggeser p05 dan p95 **bersamaan** (menaikkan keduanya), bukan melebarkan jaraknya — namun ini asumsi, belum diverifikasi. Mencari kandidat ke-9 di hari p95 berarti menguji ulang premis yang sudah gugur secara fisik, dengan biaya 4.220 kredit per panggilan.

## Temuan tambahan dari arsip pra-kalibrasi

Tarikan kandidat dari sesi sebelum perbaikan logging request (`data/raw/phase1_scouting/`, tanpa jejak payload) memuat tiga slice `orl_pine_hills_n` pada waktu berbeda — rentang diamati 28,67–30,10°C, 35,80–37,58°C, dan 36,41–38,26°C pada kotak identik. Ini sinyal awal yang paling berguna dari seluruh scouting: **kontras di sumbu waktu jauh lebih besar daripada kontras di sumbu ruang** pada AOI yang sama.

Sampel `env_params` pada 4 titik Orlando (`2023-08-11 15:00` lokal, RH 39,7% konstan) menunjukkan `heat_index_celsius` mengamplifikasi rentang `tcm` ~2,1× (rentang 1,56°C → 3,30°C) — opsi yang dicatat namun tidak dipilih, karena pivot exceedance (PRD §1.3 sumbu 3) memperoleh efek nonlinear yang lebih besar dari offset spasial FortyGuard tanpa mengubah satuan paparan.

## Keputusan

Dua keputusan produk diambil dari temuan ini pada 25 Agustus 2026:

1. **Gerbang kontras spasial dicabut** (PRD §1.3). Klaim "pilih rute lain, hemat 4°C" mati; kontras dipindahkan ke tiga sumbu lain — waktu (target baru G1′: ≥6°C antar-slice pada rute yang sama), durasi × circuity (radius setara-dosis), dan exceedance (offset spasial terhadap distribusi ASOS). Delta antar-rute dilaporkan apa adanya sebagai G2b, diperkirakan 0,5–0,8°C.
2. **AOI terpilih `orl_pine_hills_n`** lewat kriteria hukum-dulu PRD §5.4 — statuta hazardous walking Florida terkuat di antara kandidat, angka historis 19.693 siswa TA 2019–2020. Kontras kanopi hanya tie-breaker dan tidak lagi menentukan. Phoenix dipertahankan pipeline-only sebagai bukti portabilitas (G10), tidak pernah dirender di UI.

Pencabutan gerbang ini wajib dinyatakan terbuka di halaman Limitations dan di pitch — ini temuan hasil pengukuran, bukan penyesuaian target agar terlihat lulus.
