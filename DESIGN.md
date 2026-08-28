# DESIGN.md

Sistem visual HeatWalk. Dokumen ini mengikat untuk seluruh `web/`. Kalau ada keputusan visual yang tidak tertulis di sini, ikuti prinsipnya, jangan improvisasi.

---

## Arah desain

**Monokrom, padat informasi, tanpa dekorasi.** Referensi: kesederhanaan [kurawal.dev](https://kurawal.dev) — hitam-putih, tipografi yang menanggung seluruh hierarki, garis tipis sebagai pemisah, ruang kosong yang lega, nol ornamen.

Produk ini dibawa ke rapat school board. Yang bikin dia dipercaya adalah angka yang bisa ditelusuri, bukan tampilan yang manis. Setiap elemen visual harus bisa menjawab: *informasi apa yang hilang kalau ini dihapus?* Kalau jawabannya "tidak ada", hapus.

Satu hal yang harus diingat orang setelah demo: **momen FR-16.** Satu klik, semua warna dan semua garis rute hilang, tinggal lingkaran putus-putus di atas peta abu-abu. Seluruh sistem visual di bawah ini didesain supaya momen itu terasa seperti lampu dimatikan.

### Yang dilarang

Gradient · glassmorphism · blur dekoratif · drop shadow di elemen non-overlay · sudut membulat besar · emoji di UI · ikon berwarna · ilustrasi · badge warna-warni · animasi masuk per-section · hero berukuran layar penuh · card bersarang di dalam card.

---

## Warna

Aturan tunggal yang menentukan segalanya:

> **Warna hanya boleh muncul di dalam peta, legend peta, dan badge status klasifikasi. Tidak di tempat lain.**

Tombol, tautan, border, teks, ikon, chart, tabel — semuanya monokrom, di kedua mode. Konsekuensinya, satu-satunya warna di layar selalu berarti sesuatu, dan tombol "sembunyikan data panas" membuat layar benar-benar kehilangan seluruh warnanya.

### Netral

| Token | Light | Dark | Pakai untuk |
|---|---|---|---|
| `--bg` | `#FFFFFF` | `#0A0A0A` | latar halaman |
| `--surface` | `#FAFAFA` | `#171717` | panel, sheet, header tabel |
| `--surface-raised` | `#FFFFFF` | `#1F1F1F` | dialog, popover, tooltip |
| `--border` | `#E5E5E5` | `#262626` | pemisah, garis tabel |
| `--border-strong` | `#D4D4D4` | `#3A3A3A` | border input, outline tombol |
| `--ink` | `#0A0A0A` | `#FAFAFA` | teks utama, angka headline |
| `--ink-muted` | `#525252` | `#A3A3A3` | teks sekunder, label |
| `--ink-subtle` | `#737373` | `#737373` | caption, placeholder, satuan |

`--ink-subtle` adalah batas bawah. Jangan pernah bikin teks lebih terang dari itu — semuanya sudah pas-pasan di 4,5:1 dan teks abu-abu muda "biar elegan" adalah cara tercepat bikin produk data terlihat tidak bisa dipercaya.

### Data (hanya di peta, legend, dan badge status)

| Token | Light | Dark | Arti |
|---|---|---|---|
| `--zone-safe` | `#3F6B4A` | `#7FB08C` | hijau — rute terpendek sudah aman |
| `--zone-reroute` | `#B07A1A` | `#E0B25C` | kuning — perlu pemilihan rute |
| `--zone-bus` | `#A33A28` | `#E0705C` | merah — rute teradem pun gagal |
| `--route-coolest` | `#1E5FA8` | `#7FB3EA` | biru — rute terpilih di Mode 2, "jawaban" (FR-28) |

Fill choropleth memakai token yang sama pada opacity 18% (safe), 22% (reroute), 30% (bus), dengan stroke 1px pada warna penuh.

**Redundansi wajib.** Hijau-kuning-merah adalah kombinasi terburuk untuk buta warna deuteran, dan ini keputusan yang menyangkut anak orang. Setiap kategori harus dapat dibedakan tanpa warna sama sekali:

- Blok merah diberi **arsir diagonal** di atas fill-nya.
- Blok kuning diberi **garis putus-putus** pada stroke-nya.
- Blok hijau polos.
- Setiap tempat yang menampilkan kategori wajib menyertakan **teks labelnya**, bukan cuma swatch.

### Basemap

**OpenFreeMap remote, style `liberty`.** Style URL `https://tiles.openfreemap.org/styles/liberty`, dibaca MapLibre langsung sebagai style JSON — basemap berwarna standar (taman hijau, air biru, jalan/bangunan warna natural), bukan `grayscale`.

Tanpa API key. **Keputusan produk 2026-08-27 malam (Revan):** rencana basemap self-hosted PMTiles (`web/public/heatwalk-aoi.pmtiles`) diganti ke tile server pihak ketiga OpenFreeMap — lihat `docs/METHODOLOGY.md` §Fase 8 untuk alasan dan angka biaya cakupannya. Konsekuensinya, verifikasi "cabut internet, demo tetap jalan" (dev plan Fase 7) **tidak lagi berlaku untuk basemap** — peta butuh internet saat runtime. Bagian lain aplikasi (data `data/out/`, graph, routing) tetap sepenuhnya offline setelah load pertama.

**Keputusan produk 2026-08-27 (Revan): basemap sengaja diganti dari `grayscale` ke `light` berwarna**, menggantikan aturan lama "kalau basemap-nya berwarna, seluruh sistem ini batal". Konsekuensinya, aturan "warna hanya di peta/legend/badge" di atas sekarang dibaca sebagai *warna non-peta tetap monokrom*, bukan lagi *basemap itu sendiri harus netral*. Overlay dosis panas, legend, dan badge klasifikasi tetap wajib kontras jelas terhadap basemap berwarna ini — verifikasi kontras AOI secara visual di layar tiap kali basemap atau palet overlay berubah, karena warna basemap sekarang bisa bentrok dengan warna zona (terutama merah/kuning terhadap jalan/bangunan). Atribusi OpenStreetMap wajib terlihat di peta.

### Rute

| Elemen | Gaya |
|---|---|
| Rute terpendek (Mode 2, data panas tampil) | 2,5px `--ink-subtle` saat kartunya tidak terpilih; 3,5px `--route-coolest` saat terpilih |
| Rute terpendek (FR-16 aktif) | 2px `--ink-subtle`, dashed `4 4` — balik ke netral; 3px saat terpilih |
| Rute teradem | 5px solid `--route-coolest`, dengan casing 8px `--bg` di bawahnya — 6,5px (casing 9,5px) saat terpilih; 2,5px `--ink-subtle` tanpa casing saat kartunya tidak terpilih |
| Rute alternatif (FR-30, Mode 2) | 2px solid `--ink-subtle`, tanpa dasharray — 3px saat kartunya terpilih di panel |
| Segmen prioritas top-5 (FR-24) | 7px `--zone-bus`, opacity 100%, di atas choropleth blok, + label rank |
| Lingkaran walk zone resmi | 1,5px `--ink-muted`, dashed `6 6`, tanpa fill |
| Lingkaran radius setara-dosis (FR-18) | 1,5px solid `--ink`, tanpa fill |
| Hover pada salah satu lingkaran (FR-26) | garis menebal ke 3px + tooltip deskripsi |

**Keputusan produk 2026-08-27 (Revan):** rute teradem memakai **biru** (`--route-coolest`), bukan tinta — biru adalah jawaban; ramp biru→oren pada rute terpendek menunjukkan paparan panas status quo. Dua rute tetap terbedakan tanpa warna lewat lebar (2,5px vs 5px + casing) dan legend berlabel. Saat FR-16 aktif, ramp dan rute teradem hilang total — rute terpendek kembali netral abu putus-putus, momen "lampu dimatikan" tetap utuh.

**Amendemen 2026-08-28 (Revan, FR-30):** rute alternatif memakai abu `--ink-subtle` polos, bukan hitam/merah seperti sempat diusulkan — merah tetap eksklusif milik `--zone-bus` (rute teradem gagal, segmen prioritas), dan menambah warna baru untuk alternatif akan melanggar aturan "warna hanya di peta/legend/badge". Alternatif juga hilang saat FR-16 aktif, sama seperti rute teradem — hanya rute terpendek netral yang bertahan. **Jumlahnya dipangkas dari dua menjadi satu** (amendemen lanjutan hari yang sama) — total tiga kartu rute (teradem, terpendek, satu alternatif), bukan empat.

**Amendemen 2026-08-28 (Revan): memilih kartu rute membingkai ulang peta ke rute itu.** Bug yang ditemukan Revan — peta tidak berubah saat kartu selain "Coolest" diklik — diperbaiki dengan dua mekanisme sekaligus: (1) rute yang kartunya terpilih menebalkan garisnya (lihat lebar per baris di tabel atas), dan (2) peta `fitBounds` ke kotak pembatas geometri rute itu (`hooks/useRouteFocus.ts`, padding 64px, `maxZoom` 17, durasi 600ms). Mekanisme kedua ini wajib ada karena ~90% pasangan blok–sekolah punya rute teradem yang identik dengan rute terpendek (G8, `docs/LIMITATIONS.md`) — kalau geometrinya sama persis, menebalkan garis saja tidak terlihat karena satu rute akan selalu digambar tepat di atas rute lain; `fitBounds` tetap memberi umpan balik nyata di kasus itu.

**Amendemen 2026-08-28 (Revan, lanjutan): di Mode 2, biru hanya milik rute yang kartunya terpilih.** Dengan tiga kartu, dua garis biru sekaligus (rute teradem selalu biru + ramp rute terpendek yang berujung biru) membuat seleksi tidak terbaca. Aturan baru: rute yang tidak terpilih — teradem, terpendek, alternatif — semuanya 2–2,5px `--ink-subtle` polos (rute teradem tanpa casing); rute terpilih `--route-coolest` dengan lebar + casing terpilih, dan layer-nya dipindah ke atas tumpukan (`hooks/useRouteLayerOrder.ts`, `moveLayer` tepat di bawah layer batas AOI) supaya geometri bersama G8 tidak menutupi garis biru. Ramp biru→oren kini eksklusif Mode 1, yang tidak punya seleksi kartu; token `--route-heat-*` tetap dipakai di sana. FR-16 tidak berubah: rute terpendek kembali netral abu putus-putus, rute teradem dan alternatif hilang total.

**Amendemen 2026-08-28 (Revan, penutup): rute dihapus dari Mode 1; ramp dipensiunkan dari seluruh produk.** Mode 1 kini murni zona — lingkaran kebijakan, choropleth dosis, lingkaran setara-dosis (amendemen FR-10 di PRD); seluruh baris tabel di atas hanya berlaku untuk Mode 2, dan baris "rute teradem gagal" dihapus. Konsekuensi bergandengan dengan amendemen sebelumnya: ramp biru→oren tidak lagi punya tempat tampil di mode mana pun. Token `--route-heat-cool`/`--route-heat-hot` dihapus dari `theme.css` dan kode ramp klien (`routeRampFeatures`) dihapus; teks ramp pada keputusan 2026-08-27 di atas berlaku sebagai catatan sejarah. Satu-satunya warna rute yang tersisa adalah `--route-coolest` untuk rute terpilih di Mode 2.

### Label di atas choropleth

Label suhu blok (FR-23): `Noto Sans Bold` ~10px, warna `--ink`, halo `--bg` 1,5px, di pusat poligon blok, muncul mulai zoom ±12,5 (collision detection MapLibre menangani kerapatan). Label rank top-5 segmen (FR-24): angka `1`–`5` dengan gaya sama, di midpoint segmen. Keduanya data panas — sembunyi saat FR-16.

### Penanda lokasi

Peran penanda dibedakan **lewat bentuk dan glyph, tidak pernah lewat warna** — konsekuensi langsung dari larangan ikon berwarna di atas. Ikon glyph dari `lucide-react`, stroke `1,5`, ukuran `16`.

| Peran | Bentuk | Glyph | Anchor |
|---|---|---|---|
| Your location (bisa digeser, Mode 2) | Teardrop, isi `--ink`, outline 1,5px `--bg` | `House`, warna `--bg`, di kepala teardrop | Ujung bawah (titik presisi) |
| Sekolah (tempat tetap, kedua mode) | Chip persegi radius `4px`, isi `--bg`, border 1,5px | `GraduationCap`, warna border | Tengah |

Sekolah teranalisis memakai border/glyph `--ink`; sekolah belum teranalisis (Mode 1) memakai `--ink-subtle`. Teardrop dipakai khusus untuk titik yang **dipilih dan digeser** orang tua; chip untuk tempat yang **sudah tetap** — kontrasnya harus tetap terbaca setelah difilter grayscale.

**Amendemen 2026-08-28 (Revan): pin belum-teranalisis tampil terkunci.** Pada zoom pin (≥10), pin belum-teranalisis di-redupkan (`icon-opacity` ±0,55) dan tidak membawa label nama — hanya pin teranalisis yang berlabel — supaya status "belum bisa dibuka" terbaca sekilas dari bentuknya. Kliknya tetap memunculkan notice "belum dianalisis" (FR-20). Saat satu sekolah sedang difokuskan di Mode 1, seluruh pin lain — teranalisis maupun belum — hilang dari peta; pin kembali tampil semua begitu fokus dilepas.

Setiap label teks di atas peta (nama sekolah, `Your location`, label suhu blok) wajib punya halo/outline `--bg` selebar minimal 1,5px di sekelilingnya, supaya tetap kontras terhadap basemap berwarna di kedua tema (lihat keputusan basemap di atas). `text-font` dilayani glyph server OpenFreeMap; yang tersedia hanya **`Noto Sans Regular` / `Bold` / `Italic`** — `Medium` dan `SemiBold` mengembalikan 404 sejak basemap pindah ke `liberty` (fontstack self-hosted di `web/public/fonts/` sudah dihapus). Jangan memakai fontstack lain di layer symbol.

Pin sekolah di Mode 1 (101 ribu+ sekolah nasional) hanya dirender sebagai chip + label pada zoom ≥ 10; di bawah itu mereka tetap titik `circle` polos (basemap AOI toh tidak ter-cover di bawah zoom itu). Pin sekolah teranalisis diberi `symbol-sort-key` lebih tinggi supaya tidak pernah kalah tabrakan label dari sekolah lain.

---

## Tipografi

**Inter** untuk semuanya. Satu keluarga, hierarki dibangun dari ukuran dan berat, bukan dari pergantian font.

Pasang via `@fontsource-variable/inter` (self-hosted — demo harus tetap jalan tanpa internet setelah load pertama, NFR §7). Jangan pakai Google Fonts CDN.

```css
font-optical-sizing: auto;
font-feature-settings: "cv05" 1, "ss01" 1;
```

### Aturan angka

Setiap angka di UI — suhu, dosis, jarak, jumlah anak, persentase — wajib `font-variant-numeric: tabular-nums`. Produk ini penuh tabel perbandingan; angka yang tidak sejajar kolomnya bikin panel FR-4 tidak terbaca.

Bikin satu komponen `<Metric>` yang menangani ini, jangan tempel utility-nya satu-satu.

### Skala

| Peran | Ukuran | Berat | Tracking |
|---|---|---|---|
| Display (judul halaman masuk) | `clamp(2rem, 5vw, 3.25rem)` | 600 | `-0.03em` |
| H1 seksi | `1.75rem` | 600 | `-0.02em` |
| H2 panel | `1.125rem` | 600 | `-0.01em` |
| Body | `0.9375rem` | 400 | `0` |
| Angka headline (mis. `41,2°C`) | `2rem` | 600 | `-0.02em` |
| Label / caption | `0.8125rem` | 500 | `0` |
| Eyebrow seksi | `0.75rem` | 500 | `0.08em`, uppercase, `--ink-subtle` |

Eyebrow uppercase dipakai hemat — maksimal satu per layar, persis seperti label seksi di kurawal.dev.

Line-height: 1,5 untuk body, 1,15 untuk display dan angka headline. Panjang baris prosa maksimal 70ch. Pakai `text-wrap: balance` di heading.

---

## Spasi, garis, radius

- Skala 4px: `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96`. Tidak ada nilai di luar skala.
- **Garis dulu, bayangan belakangan.** Pemisahan dikerjakan `1px solid --border`. Shadow hanya untuk elemen yang benar-benar melayang: dialog, popover, dropdown, bottom sheet, panel peta mengambang, dan cluster kontrol mengambang (lihat keputusan produk 2026-08-27 kedua di bawah).
- Radius: `4px` untuk input dan tombol, `8px` untuk panel dan dialog, `9999px` hanya untuk pill/badge. Peta dan choropleth **tanpa radius** — bentuk kotak-kotak per blok itu disengaja (PRD FR-7), jangan dihaluskan.
- Border tabel: hanya garis horizontal. Tidak ada garis vertikal, tidak ada zebra striping.

---

## Motion

Anggaran gerak sangat kecil, dan ini yang pertama dipotong kalau waktu mepet (dev plan).

- Durasi `120ms` (hover, fokus) sampai `200ms` (panel, sheet).
- Easing `cubic-bezier(0.16, 1, 0.3, 1)`. Tanpa bounce, tanpa elastic.
- Hanya `opacity` dan `transform`. Jangan animasikan properti layout.
- Tidak ada animasi masuk saat scroll. Tidak ada stagger.
- `@media (prefers-reduced-motion: reduce)` wajib ada dan mematikan semuanya.

Dua pengecualian yang boleh dipoles: transisi FR-16 (fade 180ms saat layer panas hilang) dan pergantian geometri rute teradem (fade 120ms, lihat bagian berikutnya) — di Mode 2 dipicu suhu live FortyGuard yang datang belakangan dan meng-upgrade jalur (FR-29). Keduanya cukup untuk terbaca sebagai perubahan, cukup cepat untuk tidak terasa seperti efek.

Angka **tidak pernah** di-tween. Lihat bagian Slider jam.

---

## Slider jam

**Amendemen 2026-08-28 (Revan, FR-13): kontrol ini sekarang eksklusif Mode 1.** Mode 2 menghapus slider — lihat amendemen §Mode 2 di atas — dan selalu memakai jam Orlando saat ini. Spesifikasi di bawah tetap berlaku penuh untuk `HourSlider` di panel distrik.

Kontrol paling sering disentuh di Mode 1 dan mengubah hampir semua angka di layar, jadi dia harus terasa langsung dan tidak boleh terlihat dekoratif.

### Bentuk

Track 2px `--border-strong`, satu tick per jam pada `--border`, thumb lingkaran 16px `--ink` dengan ring 2px `--bg` di bawahnya. Bagian track sebelum thumb tetap `--border-strong` — **jangan diberi fill berbeda.** Ini bukan progress bar; tidak ada jam yang "lebih selesai" dari jam lain.

Label jam di bawah track memakai ukuran caption dan `tabular-nums`. Tampilkan ujung dan jam aktif saja (`07:00 · · · 15:00 · · · 16:00`); menampilkan sepuluh label sekaligus membuat baris ini lebih ramai daripada angka yang seharusnya jadi fokus.

Jam aktif ditulis penuh di atas track, ukuran H2 panel, `--ink`. Ini satu-satunya tempat jam ditulis besar.

### Aturan

1. **Langkahnya dibaca dari `meta.hours`, bukan dari konstanta.** Tile dengan tiga jam menampilkan tiga tick, bukan sepuluh dengan tujuh yang mati.
2. **Diskrit, bukan kontinu.** Thumb mengunci ke tick. Tidak ada posisi antara dua jam, karena tidak ada datanya.
3. **Nol warna**, sesuai aturan tunggal di atas. Slider bukan peta, bukan legend, bukan badge status.
4. Target sentuh thumb minimum 44px — perbesar area sentuhnya, bukan lingkarannya.
5. Dapat dioperasikan penuh dengan keyboard: panah kiri/kanan geser satu jam, `Home`/`End` ke ujung. Focus ring 2px `--ink` seperti elemen lain.
6. `aria-valuetext` berisi jamnya dalam kata (`"15:00"`), bukan indeks langkahnya.

### Saat jam berganti

Angka di panel berganti **tanpa transisi**. Nilai numerik yang di-tween terbaca sebagai animasi dan membuat orang menunggu; di sini yang dibutuhkan adalah pergantian instan supaya menggeser slider terasa seperti memeriksa, bukan seperti memuat.

Yang boleh bertransisi cuma geometri rute di peta: fade 120ms saat jalur rute teradem berubah, supaya perubahan jalur terbaca sebagai perubahan dan bukan sebagai glitch. Rute terpendek tidak pernah berubah antar jam — kalau dia ikut berkedip, ada yang salah di render, bukan di desain.

Kalau perhitungan ulang melewati 500ms (NFR §7), tampilkan `skeleton` di baris angka — **jangan** kosongkan panelnya dan jangan tampilkan spinner di atas peta.

---

## Component library

**shadcn/ui** (Radix + Tailwind v4). Alasannya: monokrom secara default, aksesibilitas Radix sudah beres, dan komponennya di-copy ke repo sehingga tidak ada style vendor yang harus dilawan.

Allowlist — jangan generate di luar daftar ini tanpa alasan:

`button` · `dialog` · `sheet` · `tabs` · `table` · `tooltip` · `switch` · `select` · `slider` · `badge` · `separator` · `skeleton` · `accordion` (khusus halaman Metodologi & Limitations)

Aturan pemakaian:

1. **Hapus seluruh komentar bawaan** dari file yang di-generate CLI. Aturan nol-komentar di `CLAUDE.md` berlaku penuh untuk `components/ui/`.
2. Ikon dari `lucide-react`, stroke `1.5`, ukuran `16` atau `20`, warna selalu `currentColor`.
3. Variant tombol yang dipakai cuma `default` (ink solid), `outline`, dan `ghost`. Tidak ada `destructive` — merah adalah warna data, bukan warna tombol.
4. `card` tidak masuk allowlist. Pakai `<section>` dengan border dan padding. Card di dalam card selalu salah.
5. Komponen khusus produk (`RouteComparisonPanel`, `ZoneLegend`, `Metric`, `TemperaturePair`) hidup di `web/src/components/`, terpisah dari `components/ui/`.

---

## Tema

Default **light mode**, tanpa memandang `prefers-color-scheme`. Toggle manual di header, disimpan di `localStorage`, diterapkan sebagai class `dark` di `<html>` sebelum paint pertama supaya tidak ada kedipan.

Token diturunkan lewat `@theme` Tailwind v4 di satu file `web/src/styles/theme.css`. Tidak ada nilai warna literal di komponen mana pun — grep `#` di `src/` harus bersih kecuali di file itu.

---

## Layout per mode

**Keputusan produk 2026-08-27 (Revan), kedua: header persisten dibubarkan, diganti panel peta mengambang tunggal.** Sebelumnya arsitektur mengikat header penuh-lebar 48px plus (khusus Mode 1) tiga kolom penuh-tinggi yang menempel ke tepi viewport. Peta di baliknya memang sudah full-bleed secara teknis, tapi terkurung di keempat sisi sehingga terbaca sebagai jendela, bukan latar. Aturan baru: **peta mengisi seluruh viewport, dan seluruh produk dioperasikan dari satu panel mengambang.** Konsekuensinya, "empat hal di header" di atas sekarang tersebar ke dua tempat — wordmark pindah ke baris atas panel, tiga toggle jadi cluster kontrol mengambang — dan aturan "tiga kolom Mode 1" di bawah digantikan seluruhnya oleh subbagian baru. Prinsip yang tidak berubah: peta satu instance yang sama di kedua mode, tidak pernah di-unmount, dan FR-16 tetap harus terasa seperti lampu dimatikan — dengan peta benar-benar penuh layar sekarang, efeknya justru lebih kuat, bukan lebih lemah.

### Kerangka bersama

Satu aplikasi, dua route: `/` untuk mode orang tua (pintu masuk default) dan `/district` untuk mode distrik. Tidak ada login dan tidak ada sidebar navigasi — cuma ada dua tujuan, dipilih lewat **segmented control dua item** berlabel `Parent` / `District`.

**Peta mengisi seluruh viewport**, di bawah semua elemen lain, tanpa header opaque. Di atasnya mengambang dua hal saja:

1. **Panel peta** — satu `<section>` `--surface-raised`, border penuh, radius `8px`, shadow (lihat aturan shadow di atas), inset `16px` dari tepi kiri, atas, bawah viewport, lebar tetap `380px` pada viewport ≥768px. Baris atas panel berisi wordmark + label AOI (`HeatWalk` · `Orlando`) pada layar pertama, atau tombol kembali + judul konteks (`‹ Jackson Elementary`) saat menyelam ke detail. Isi panel di bawahnya scroll sendiri; baris bawah panel (footer) menampilkan hitungan hasil/cakupan, setara dengan atribusi status.
2. **Cluster kontrol** — satu wadah kecil mengambang di kanan atas, `--surface-raised`, border, radius `8px`, shadow, isinya empat hal (segmented switch `Parent`/`District` · toggle "hide heat data" FR-16 · toggle tema · tombol info metodologi FR-25, keputusan produk 2026-08-27) plus tombol collapse/expand panel.

**Nol kontrol lain yang mengambang di atas peta** — dengan satu pengecualian disengaja (keputusan produk 2026-08-27, FR-27): **legend peta sisi kanan**, yang justru harus terlihat saat panel samping di-collapse. Slider jam, toggle layer, dan export tetap hidup **di dalam** panel; legend mengambang di sisi kanan (bisa dilipat, sadar-mode), dan `map.setPadding` ikut me-reserve lebarnya supaya `flyTo` tetap terpusat di area yang benar-benar terlihat.

**Peta adalah satu instance yang sama di kedua mode.** Dia hidup di atas router; berpindah mode hanya mengganti isi panel dan memicu `flyTo`. Jangan pernah unmount peta saat pindah route — selain memicu reload basemap, itu memutus adegan kedua video demo, yang justru bertugas membuktikan kedua mode berbagi satu engine. `map.setPadding` wajib mengikuti geometri panel yang sedang tampil di kedua mode, supaya `flyTo` memusatkan target di area peta yang benar-benar terlihat, bukan di belakang panel.

### Mode 2 — orang tua (mobile-first, 390px naik)

**Keputusan produk 2026-08-28 (Revan): panel disusun ulang bergaya Google/Apple Maps.** Urutan lama (input alamat → kalimat status → slider jam → kalimat "aman sampai jam X" → panel perbandingan rute → tombol permohonan, semuanya kelihatan sekaligus) diganti urutan baru di bawah. Tidak ada FR yang dihapus — FR-2 (kalimat status), FR-4 (tabel perbandingan penuh), FR-5 (permohonan), dan kalimat `safe_until_hour` semuanya tetap ada, hanya dipindah posisi:

```
Origin field          ← input pencarian + saran alamat langsung (Nominatim, debounced)
Destination field     ← input pencarian dibatasi ke daftar sekolah dalam AOI, gaya field sama dengan Origin
Kalimat status (FR-2) ← "Rumah kamu 1,1 mil dari SD Lincoln — di dalam walk zone."
Kondisi langsung      ← "Now · 7:00 AM" + suhu live kalau tersedia, lihat amendemen di bawah
──────
Kartu rute: Coolest   ← waktu · jarak · suhu rata-rata
Kartu rute: Shortest
Kartu rute: Alternate 1 (FR-30, kalau ada)
──────
Kalimat "Safe until"  ← baris sendiri, lihat aturan di bawah
──────
▸ Details             ← tabel perbandingan FR-4 penuh + tombol permohonan FR-5, di balik disclosure
```

**Amendemen 2026-08-28 (Revan): panel dipangkas ke Origin, Destination, Routes, Details.** Chip alamat contoh dan teks bantuan "Or drag the pin on the map." dihapus dari Origin — saran pencarian langsung menggantikan kebutuhan chip, dan drag-pin tidak butuh keterangan lagi di produk sekelas "usual map". Destination berhenti jadi `<select>` native dan jadi input pencarian yang menyaring daftar sekolah secara live saat diketik; mengklik salah satu hasil adalah **satu-satunya** cara mengganti sekolah — teks yang tidak cocok apa pun kembali ke sekolah terpilih terakhir saat field kehilangan fokus, sehingga pengguna tidak bisa memilih sekolah di luar daftar. Kalimat status dan kondisi langsung tetap ada (FR-2 P0, tidak boleh dihapus) tapi dibaca sebagai bagian dari alur Destination→Routes, bukan sebagai section kelima yang berdiri sendiri.

FR-2 minta kalimat status ini sebagai **"output pertama"** begitu asal dan tujuan terisi — makanya dia duduk tepat di bawah dua field, sebelum kondisi langsung, dan tidak menunggu rute selesai dihitung (dia dari jarak lurus rumah↔sekolah, bukan dari graph routing).

**Amendemen 2026-08-28 (Revan, FR-13/FR-29): slider jam dihapus dari Mode 2.** Baris "Departure time" yang sebelumnya di sini dibingkai "Leave at" digantikan `LiveConditionsRow`, yang selalu menampilkan jam Orlando saat ini dalam format 12 jam ("Now · 7:00 AM", `formatHourAmPm` di `lib/units.ts`) — jam ini dihitung otomatis dari `clampToSchoolHour(currentOrlandoHour())`, bukan dipilih pengguna. Kalau suhu live FortyGuard berhasil didapat untuk sekolah dan jam itu, baris yang sama menambahkan suhu live dan selisihnya terhadap hari model. FR-13 (slider) selanjutnya murni kontrol Mode 1, dan tetap memakai format 24 jam di sana (tick jam mengikuti granularitas data `meta.hours`, bukan gaya "usual map").

Pada viewport ≥768px, panel peta dipakai sebagai **panel samping**: field, kalimat status, baris kondisi langsung, dan kartu-kartu rute selalu terlihat tanpa scroll berlebihan; `Details` dibuka di tempat (bukan overlay), scroll ikut panel.

Di bawah 768px, panel yang sama dirender sebagai **bottom sheet** dua detent: peek (field + kalimat status + kondisi langsung) dan expanded (kartu-kartu rute + `Details`). Target sentuh minimum 44px.

`Details` adalah `<button>` polos yang men-toggle satu section — **bukan** komponen `accordion` (itu jatah khusus halaman Metodologi & Limitations, lihat §Component library). Monokrom seperti seluruh kontrol lain — kartu rute tidak boleh memakai warna, karena warna hanya untuk peta, legend peta, dan badge status klasifikasi. Kartu terpilih dibedakan lewat border/latar netral (`border-ink` + `bg-surface`), bukan warna.

Hierarki di layar pertama: field Origin/Destination → kondisi langsung → kartu-kartu rute di panel + rute-rute di peta.

Angka terbesar di kartu Coolest adalah **suhu rata-rata rute teradem pada jam yang sedang dipilih** — `41,2°C (106,2°F)` — bukan selisih antar rute. Selisih antar rute kecil dan hadir sebagai baris tabel biasa di dalam `Details`, tidak dibesarkan (PRD FR-4). °C·menit hadir tapi lebih kecil dan selalu di sebelah °C-nya (NFR §7).

Kalimat `Aman kalau pulang sebelum 13:00` (`safe_until_hour`) tampil di baris sendiri antara kartu rute dan `Details`, bila blok belum merah sepanjang hari. Ini kalimat paling berguna di seluruh Mode 2 — jangan diselipkan ke dalam tabel.

### Mode 1 — distrik (desktop, 1280px naik)

Satu panel peta yang sama, dipakai sebagai **tumpukan tiga tampilan** yang saling menggantikan (bukan menumpuk), dinavigasi dengan tombol kembali di baris atas panel:

1. **Daftar sekolah** — pencarian + daftar sekolah teranalisis dan (opsional) sekolah nasional belum teranalisis.
2. **Sekolah terpilih** — ringkasan sekolah (FR-12) sebagai grid metrik dua kolom (bukan baris horizontal — lebar panel 380px tidak cukup untuk baris), toggle layer (A/B/C), slider jam, lalu (kalau ada) export CSV dan tabel prioritas segmen. Kembali → daftar sekolah. Legend zona tidak lagi di panel — pindah ke legend peta sisi kanan (FR-27).
3. **Blok terpilih** — panel detail blok (FR-9), termasuk "lihat kenapa" (FR-10) dan panel outcome (FR-11) saat kategori merah. Kembali → sekolah terpilih.

Slider jam ada di tampilan 2, di dalam panel. Di mode ini dia mengontrol layer zona: menggesernya mengganti warna choropleth, bukan angka panel.

---

## Bahasa UI

**Bahasa Inggris.** Penggunanya Transportation Director di distrik sekolah AS dan jurinya panitia FortyGuard — keduanya berbahasa Inggris. Contoh teks berbahasa Indonesia di PRD adalah spesifikasi isi, bukan string final; terjemahkan saat implementasi dan jaga strukturnya persis.

Nada: kalimat pendek, deklaratif, tanpa tanda seru. Angka dulu, penjelasan belakangan.

Format angka konsisten di seluruh produk: suhu satu desimal dengan °C dan °F berdampingan, dosis bilangan bulat, jarak dua desimal untuk km dan satu desimal untuk mil, persentase bilangan bulat dengan tanda. Semuanya lewat util tunggal `web/src/lib/units.ts`.

---

## Aksesibilitas

Bukan tambahan — produknya soal keselamatan anak dan akan dipresentasikan ke lembaga publik.

- Kontras teks minimum 4,5:1, teks besar 3:1. Verifikasi, jangan diperkirakan.
- Focus ring `2px solid --ink` dengan `outline-offset: 2px`. **Jangan pernah** `outline: none` tanpa pengganti.
- Kategori zona tidak boleh dibedakan hanya lewat warna (lihat aturan redundansi di atas).
- Seluruh alur Mode 2 dapat diselesaikan pakai keyboard.
- Peta bukan satu-satunya jalan ke informasi: daftar reklasifikasi berbentuk tabel yang dapat dibaca screen reader adalah jalur setara.
- Layout tidak boleh pecah di 390px.

---

## Checklist sebelum bilang selesai

- [ ] Tidak ada warna di luar peta, legend, dan badge status. Grep `#` di `src/` bersih kecuali `theme.css`.
- [ ] Semua angka memakai `tabular-nums`.
- [ ] Setiap °C·menit punya °C di sebelahnya; setiap angka headline punya °F.
- [ ] Kategori zona terbaca dalam grayscale (uji: buat screenshot, filter saturate 0).
- [ ] Light mode default; toggle tidak berkedip saat reload.
- [ ] Layout utuh di 390px dan 1280px.
- [ ] `prefers-reduced-motion` mematikan seluruh transisi.
- [ ] Focus ring terlihat di setiap elemen interaktif.
- [ ] Tidak ada komentar tersisa di `components/ui/`.
- [ ] Basemap memakai style `liberty` dari OpenFreeMap, dan atribusi OpenStreetMap terlihat.
- [ ] Semua layer symbol memakai `Noto Sans Regular`/`Bold`/`Italic` (fontstack lain 404 di glyph server).
- [ ] FR-16 mematikan **semua** layer data panas: zona, label suhu, top-5 segmen, tooltip radius dosis, rute teradem, rute alternatif (FR-30) — tersisa lingkaran kebijakan + rute terpendek netral saja (Mode 2; Mode 1 tidak punya rute).
- [ ] Overlay dosis panas, legend, dan badge klasifikasi tetap kontras jelas terhadap basemap berwarna (cek merah/kuning zona vs warna jalan/bangunan basemap).
- [ ] Slider jam (Mode 1) monokrom, diskrit, dan jumlah tick-nya sama dengan panjang `meta.hours`.
- [ ] Angka berganti tanpa tween saat jam digeser (Mode 1) atau saat suhu live tiba (Mode 2); hanya geometri rute yang fade (Mode 2).
- [ ] Slider (Mode 1) dapat digeser penuh dengan keyboard, dan `aria-valuetext` berisi jam.
- [ ] Mode 2 tidak punya slider jam — kondisi langsung ("Now · 7:00 AM", format 12 jam) selalu tampil di panel, dan hilang bersama field origin/destination saja, bukan lewat FR-16.
- [ ] Kartu rute alternatif (FR-30) monokrom, jumlahnya bisa 0 atau 1 (total 2–3 kartu) tanpa merusak layout panel.
- [ ] Memilih kartu rute mana pun menebalkan garisnya **dan** membuat peta `fitBounds` ke rute itu (`hooks/useRouteFocus.ts`) — verifikasi khususnya saat rute yang dipilih berbagi jalur identik dengan rute lain (kasus paling umum, G8), karena di situ lebar garis saja tidak akan terlihat.
- [ ] Origin tidak lagi punya chip alamat contoh atau teks "Or drag the pin" — hanya input pencarian dengan saran langsung.
- [ ] Destination adalah input pencarian, bukan `<select>`; mengetik nama yang tidak cocok apa pun tidak pernah mengganti sekolah terpilih, dan field kembali ke nama sekolah terakhir saat kehilangan fokus.
- [ ] Berpindah `/` ↔ `/district` tidak me-remount peta: basemap tidak berkedip, tile tidak dimuat ulang.
- [ ] Peta terlihat di keempat sisi panel (atas, bawah, kanan, dan celah kiri) — tidak ada bar opaque penuh-lebar tersisa.
- [ ] Collapse panel mengembalikan peta ke tampilan penuh, dan cluster kontrol tetap dapat diakses saat panel collapsed.
- [ ] `map.setPadding` cocok dengan geometri panel yang benar-benar tampil (samping vs bottom sheet vs collapsed) di kedua mode — uji dengan memilih sekolah dan cek pusat `flyTo` tidak tersembunyi di belakang panel.
- [ ] Di bawah 768px, panel peta menjadi bottom sheet; di atasnya, panel samping tetap 380px dan tidak melebar.
- [ ] Setiap sekolah di peta punya ikon pin dan nama pada zoom ≥ 10.
- [ ] Penanda rumah dan sekolah tetap bisa dibedakan setelah screenshot difilter `saturate(0)`.
- [ ] Seluruh teks peta punya halo `--bg` dan terbaca di atas basemap berwarna, di kedua tema.
