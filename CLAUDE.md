# CLAUDE.md

Panduan kerja untuk Claude Code di repo ini. Baca sampai habis sebelum menulis baris pertama.

---

## Konteks proyek

HeatWalk menggambar ulang walk zone sekolah di AS memakai **dosis panas kumulatif (°C·menit)** sebagai fungsi impedance, bukan jarak. Output utamanya adalah daftar reklasifikasi blok dari status "jalan kaki" ke "eligible bus", beserta bukti yang bisa dibawa ke rapat school board.

Dibangun untuk FortyGuard Hackathon '26. Deadline 30 Agustus 2026, 23:59 GST.

---

## Sumber kebenaran

| Dokumen                | Isinya                                                                   | Dibaca sebelum                              |
| ---------------------- | ------------------------------------------------------------------------ | ------------------------------------------- |
| `heatwalk-prd.md`      | Product overview, persona, FR-x, US-x, data requirements, batasan produk | memutuskan **apa** yang dibangun            |
| `heatwalk-dev-plan.md` | Fase 0–8, urutan eksekusi, definition of done, gerbang                   | memutuskan **urutan dan cara**              |
| `docs/CONTRACT.md`     | Skema file di `data/out/`                                                | menyentuh pipeline atau data layer frontend |
| `DESIGN.md`            | Sistem visual: token, tipografi, warna, komponen, layout per mode        | menulis apa pun di `web/`                   |

Kalau dev plan bentrok dengan PRD: **PRD menang untuk soal _apa_, dev plan menang untuk soal _urutan dan cara_.** Jangan tambal konflik sendiri — berhenti dan lapor.

Jangan bangun apa pun yang tidak punya nomor FR-x atau US-x di PRD. Kalau ada ide bagus di luar itu, usulkan dulu, jangan langsung tulis.

---

## Desain

Seluruh keputusan visual tunduk pada `DESIGN.md`. Baca sampai habis sebelum menulis komponen pertama, dan jalankan checklist di bagian akhirnya sebelum menyatakan sebuah layar selesai.

Ringkasnya: monokrom, Inter, shadcn/ui, light mode default. **Warna hanya boleh muncul di dalam peta, legend peta, dan badge status klasifikasi** — tombol, tautan, border, teks, ikon, dan chart semuanya netral di kedua mode. Tidak ada nilai warna literal di komponen; semuanya lewat token di `web/src/styles/theme.css`.

Kalau sebuah kebutuhan visual tidak tertulis di `DESIGN.md`, ikuti prinsipnya dan lapor — jangan improvisasi diam-diam. Menambah warna, font, library komponen, atau efek visual baru adalah keputusan produk, bukan keputusan implementasi.

Catatan untuk file hasil generate shadcn CLI: **hapus seluruh komentar bawaannya.** Aturan nol-komentar di atas berlaku penuh untuk `components/ui/`.

---

## Empat aturan yang tidak bisa ditawar

### 1. Nol komentar di dalam kode

Tidak ada `//`, `/* */`, `#`, docstring, JSDoc, TSDoc, `MARK:`, `TODO:`, `NOTE:`, `FIXME:`, banner pemisah seksi (`// ===== Helpers =====`), maupun komentar yang cuma mengulang isi baris di bawahnya.

Satu-satunya pengecualian: komentar yang **otomatis dihasilkan tool** saat scaffolding (mis. header bawaan `npm create vite`, file generated). Itu boleh dibiarkan, tapi jangan ditambah.

Konsekuensinya: **penamaan yang menanggung beban penjelasan.** Kalau sebuah blok kode terasa butuh komentar, itu sinyal blok tersebut harus diekstrak jadi fungsi bernama jelas, bukan sinyal untuk menulis komentar.

Penjelasan "kenapa" yang memang perlu ada tempatnya di `docs/METHODOLOGY.md`, `docs/LIMITATIONS.md`, atau README — bukan di dalam file kode.

Catatan: contoh skema berkomentar di `heatwalk-dev-plan.md` itu JSONC untuk dokumentasi, bukan kode produksi. Jangan dijadikan preseden.

### 2. Readable, maintainable, reusable

- Nama variabel dan fungsi ditulis lengkap. `meanTemperatureC`, bukan `mtc`. `coolestRoute`, bukan `cr2`.
- Satu fungsi = satu tanggung jawab. Kalau namanya mengandung "and", pecah.
- Konstanta bernama, bukan angka telanjang. `BASELINE_C`, `WALK_SPEED_MPS`, `THRESHOLD`, `LAMBDA_DETOUR` semuanya hidup di `pipeline/config.py` dan padanannya di frontend — jangan sebar nilai literal ke seluruh kode.
- Logika perhitungan dosis, konversi °C↔°F, dan format angka ditulis **sekali** di modul util, lalu dipakai ulang. Duplikasi rumus antara Mode 1 dan Mode 2 adalah bug yang menunggu terjadi.
- Frontend tidak menghitung ulang apa pun yang sudah dihitung pipeline. Angka di UI dibaca dari `data/out/`, tidak diturunkan ulang.
- Tidak ada angka hardcoded di frontend, kecuali di fixture dev.
- Fungsi murni sedapat mungkin: hitungan dipisah dari rendering, dipisah dari I/O.
- Error ditangani eksplisit. Jangan `try/except: pass`, jangan `catch {}` kosong.

### 3. Struktur file jelas, file pendek

- Ikuti struktur repo di `heatwalk-dev-plan.md` bagian "Struktur repo". Jangan bikin folder baru tanpa alasan yang bisa dijelaskan.
- **Batas lunak: 200 baris per file Python, 150 baris per file React/TS.** Lewat dari itu, pecah. Kalau sebuah file memang harus panjang, lapor alasannya sebelum menulisnya.
- Satu komponen React per file, nama file = nama komponen.
- Konvensi penamaan:
  - Python: `snake_case.py`, fungsi `snake_case`, konstanta `UPPER_SNAKE`
  - React component: `PascalCase.tsx`
  - Hook: `useSomething.ts`
  - Util/lib: `camelCase.ts`
  - Tipe TS: `types.ts` per domain, interface `PascalCase`
- Nama file harus menjelaskan isinya tanpa dibuka. `step3_routes.py`, `RouteComparisonPanel.tsx`, `petition.ts` — bukan `utils.ts`, `helpers.py`, `misc.tsx`, `index.ts` yang isinya campur aduk.
- Pengecualian batas baris: `web/src/components/ui/` berisi file hasil generate shadcn CLI. Jangan dipecah, cukup hapus komentarnya.
- Hindari file `utils` raksasa. Kalau butuh util, kelompokkan per domain: `lib/dose.ts`, `lib/units.ts`, `lib/dijkstra.ts`.

### 4. Nol operasi git

**Jangan pernah** menjalankan `git commit`, `git push`, `git add`, `git merge`, `git rebase`, `git checkout -b`, `git tag`, atau perintah `gh` apa pun. Revan yang melakukan itu manual.

Boleh dijalankan untuk inspeksi: `git status`, `git diff`, `git log`.

Setelah selesai satu unit kerja, cukup **laporkan file mana saja yang dibuat/diubah** dan usulkan pesan commit-nya dalam format `phase-N: <ringkasan>`. Jangan eksekusi.

Jangan menyentuh `.env`. Jangan mencetak isi API key ke terminal, log, atau file mana pun.

---

## Arsitektur yang tidak boleh dilanggar

Detail lengkap di PRD §6 dan dev plan bagian "Prinsip arsitektur".

- **Tidak ada backend server, kecuali satu fungsi serverless read-only untuk FR-29** (suhu live Mode 2, `web/api/`) yang menahan kunci API FortyGuard — tanpa database, tanpa state, di luar jalur render rute. Pipeline Python offline → file statis di `data/out/` → React membaca file, tetap prinsip utama. Selain FR-29, satu-satunya panggilan API saat runtime adalah tombol refresh (FR-17, tidak dibangun), dan itu terisolasi total.
- **Engine graph, bukan raster.** Raster cost-distance (`skimage.graph.MCP_Geometric`) hanya fallback darurat, hanya untuk Mode 1.
- **GeoJSON di-`fetch()`, bukan di-`import`.**
- **Tidak ada autentikasi, tidak ada database.** Live demo wajib terbuka di incognito tanpa login (submission form field 12). Dua mode dipisah lewat route `/` dan `/district`, bukan lewat akun.
- **Basemap dari OpenFreeMap** (`tiles.openfreemap.org`, style `liberty`), tanpa API key. Keputusan produk 2026-08-27: basemap self-hosted `.pmtiles` diganti karena cakupan bbox lokal (13 MB–128 GB tergantung luas) tidak bisa menutupi AOI penuh dengan biaya wajar; lihat `docs/METHODOLOGY.md` §Fase 8. Konsekuensinya, gerbang "demo jalan offline" dan "basemap `206`" gugur — peta sekarang butuh internet.
- **Satu instance MapLibre untuk kedua mode.** Peta hidup di atas router dan tidak pernah di-unmount saat pindah route.
- Setiap angka yang muncul di UI harus bisa ditelusuri ke satu file di `data/out/`.
- Setiap tempat yang menampilkan °C·menit **wajib** menampilkan °C di sebelahnya. Setiap angka headline wajib punya °F di samping °C.
- Ditolak permanen: `deck.gl`, `react-map-gl`, PostGIS, DuckDB, Parquet, backend apa pun, ORM apa pun, autentikasi, tile server yang butuh API key.

Stack yang dipakai: Python 3.11 (`geopandas`, `rasterio`, `numpy`, `osmnx`, `networkx`, `httpx`) · React 19 + TypeScript + Vite + Tailwind v4 + MapLibre GL JS v5 + OpenFreeMap (vector tiles, tanpa API key) + shadcn/ui + Inter + Recharts · Vercel statis.

---

## Cara kerja per fase

1. Kerjakan fase **berurutan**. Jangan mulai fase berikutnya sebelum seluruh checklist **Verification** fase sekarang lulus.
2. Kalau verifikasi gagal → **berhenti dan lapor.** Jangan diam-diam ganti pendekatan, jangan geser ambang sampai angkanya kelihatan bagus. Tiap fase punya _fail branch_ eksplisit di dev plan; ikuti itu.
3. Gerbang yang menghentikan pekerjaan (dev plan, tabel "Ringkasan gerbang"): verifikasi `tcm`, kontras AOI, delta rute ≥4°C, kategori merah terisi, demo jalan offline, live link di incognito. Semua ini keputusan produk, bukan keputusan teknis — jangan diambil sendiri.
4. Kalau skema data berubah, **update `pipeline/make_fixtures.py` di perubahan yang sama.** Frontend tidak boleh pernah tahu bedanya fixture dan data asli.

## Yang dikorbankan lebih dulu kalau waktu mepet

Urut dari yang paling boleh dibuang: animasi & mikrointeraksi → FR-15 tabel prioritas segmen → FR-13 slider waktu → FR-17 refresh forecast → interaktivitas Mode 1 jadi tabel statis.

**Tidak boleh dipotong dalam keadaan apa pun:** FR-8 kategori merah, FR-16 tombol sembunyikan data panas, halaman Limitations, kolom °F di semua angka headline.

---

## Kalau ragu

Tanya sebelum menulis, bukan sesudah. Khususnya untuk: perubahan skema data, penambahan dependency, pemilihan AOI, kalibrasi `BASELINE_C` / `THRESHOLD` / `LAMBDA`, dan apa pun yang menyentuh gerbang di atas.
