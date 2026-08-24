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

Fill choropleth memakai token yang sama pada opacity 18% (safe), 22% (reroute), 30% (bus), dengan stroke 1px pada warna penuh.

**Redundansi wajib.** Hijau-kuning-merah adalah kombinasi terburuk untuk buta warna deuteran, dan ini keputusan yang menyangkut anak orang. Setiap kategori harus dapat dibedakan tanpa warna sama sekali:

- Blok merah diberi **arsir diagonal** di atas fill-nya.
- Blok kuning diberi **garis putus-putus** pada stroke-nya.
- Blok hijau polos.
- Setiap tempat yang menampilkan kategori wajib menyertakan **teks labelnya**, bukan cuma swatch.

### Basemap

**Protomaps PMTiles self-hosted.** Satu file `.pmtiles` hasil ekstrak bbox AOI, di-commit ke `web/public/heatwalk-aoi.pmtiles`, dibaca browser lewat HTTP range request. Style dari `protomaps-themes-base` tema `grayscale`, dengan label, jalan, dan badan air diturunkan saturasinya sampai netral penuh.

Tanpa tile server pihak ketiga, tanpa API key. Ini yang membuat verifikasi "cabut internet, demo tetap jalan" (dev plan Fase 7) benar-benar lolos, bukan lolos karena kebetulan tile-nya masih ter-cache.

Kalau basemap-nya berwarna, seluruh sistem ini batal — periksa style-nya di layar sebelum menulis komponen berikutnya. Atribusi OpenStreetMap wajib terlihat di peta, dan atribusi itu memakai `--ink-subtle`, bukan warna.

### Rute

| Elemen | Gaya |
|---|---|
| Rute terpendek | 2px, `--ink-subtle`, dashed `4 4` |
| Rute teradem | 5px solid `--ink`, dengan casing 8px `--bg` di bawahnya |
| Rute teradem yang **gagal** (FR-10) | 5px solid `--zone-bus`, casing sama |
| Segmen penyumbang dosis tertinggi | 7px `--zone-bus`, opacity 100%, di atas layer rute |
| Lingkaran walk zone resmi | 1,5px `--ink-muted`, dashed `6 6`, tanpa fill |

Rute teradem sengaja memakai tinta, bukan warna — dia jawabannya, dan di layar monokrom garis hitam tebal adalah benda paling menonjol yang ada.

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
| Angka headline (mis. `−6,2°C`) | `2rem` | 600 | `-0.02em` |
| Label / caption | `0.8125rem` | 500 | `0` |
| Eyebrow seksi | `0.75rem` | 500 | `0.08em`, uppercase, `--ink-subtle` |

Eyebrow uppercase dipakai hemat — maksimal satu per layar, persis seperti label seksi di kurawal.dev.

Line-height: 1,5 untuk body, 1,15 untuk display dan angka headline. Panjang baris prosa maksimal 70ch. Pakai `text-wrap: balance` di heading.

---

## Spasi, garis, radius

- Skala 4px: `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96`. Tidak ada nilai di luar skala.
- **Garis dulu, bayangan belakangan.** Pemisahan dikerjakan `1px solid --border`. Shadow hanya untuk elemen yang benar-benar melayang: dialog, popover, dropdown, bottom sheet.
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

Satu pengecualian yang boleh dipoles: transisi FR-16. Fade 180ms saat layer panas hilang — cukup untuk terbaca sebagai perubahan, cukup cepat untuk tidak terasa seperti efek.

---

## Component library

**shadcn/ui** (Radix + Tailwind v4). Alasannya: monokrom secara default, aksesibilitas Radix sudah beres, dan komponennya di-copy ke repo sehingga tidak ada style vendor yang harus dilawan.

Allowlist — jangan generate di luar daftar ini tanpa alasan:

`button` · `dialog` · `sheet` · `tabs` · `table` · `tooltip` · `switch` · `select` · `badge` · `separator` · `skeleton` · `accordion` (khusus halaman Metodologi & Limitations)

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

### Kerangka bersama

Satu aplikasi, dua route: `/` untuk mode orang tua (pintu masuk default) dan `/district` untuk mode distrik. Tidak ada login dan tidak ada sidebar navigasi — cuma ada dua tujuan, jadi navigasinya berbentuk **segmented control dua item** berlabel `Parent` / `District` di kanan header.

Header persisten setinggi 48px, `--surface` dengan garis bawah `--border`, isinya empat hal dan tidak lebih: wordmark · segmented switch · toggle "hide heat data" (FR-16) · toggle tema.

**Peta adalah satu instance yang sama di kedua mode.** Dia hidup di atas router; berpindah mode hanya mengganti panel di sekelilingnya dan memicu `flyTo`. Jangan pernah unmount peta saat pindah route — selain memicu reload basemap, itu memutus adegan kedua video demo, yang justru bertugas membuktikan kedua mode berbagi satu engine.

### Mode 2 — orang tua (mobile-first, 390px naik)

Peta full-bleed, panel sebagai bottom sheet dengan dua detent: peek (kalimat status saja) dan expanded (panel perbandingan penuh). Input alamat mengambang di atas, chip alamat contoh tepat di bawahnya. Target sentuh minimum 44px.

Hierarki di layar pertama: kalimat status → dua rute di peta → selisih suhu. Angka `−6,2°C (−11,2°F)` adalah objek terbesar di panel; °C·menit hadir tapi lebih kecil dan selalu di sebelah °C-nya (NFR §7).

### Mode 1 — distrik (desktop, 1280px naik)

Tiga kolom: daftar sekolah (280px) · peta (fleksibel) · panel detail (360px). Panel detail berubah isi mengikuti seleksi, bukan menumpuk. Ringkasan sekolah (FR-12) tampil sebagai baris metrik di atas peta, bukan sebagai grid card.

---

## Bahasa UI

**Bahasa Inggris.** Penggunanya Transportation Director di distrik sekolah AS dan jurinya panitia FortyGuard — keduanya berbahasa Inggris. Contoh teks berbahasa Indonesia di PRD adalah spesifikasi isi, bukan string final; terjemahkan saat implementasi dan jaga strukturnya persis.

Nada: kalimat pendek, deklaratif, tanpa tanda seru. Angka dulu, penjelasan belakangan.

Format angka konsisten di seluruh produk: suhu satu desimal dengan °C dan °F berdampingan, dosis bilangan bulat, jarak dua desimal untuk km dan satu desimal untuk mil, persentase bilangan bulat dengan tanda. Semuanya lewat util tunggal `web/src/lib/format.ts`.

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
- [ ] Basemap benar-benar grayscale, dan atribusi OpenStreetMap terlihat.
- [ ] Berpindah `/` ↔ `/district` tidak me-remount peta: basemap tidak berkedip, tile tidak dimuat ulang.
