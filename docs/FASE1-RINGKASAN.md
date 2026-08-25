# Ringkasan Fase 1 — AOI & Akuisisi Data

## Apa yang dikerjakan

1. **Cek ulang data lama.** Sesi sebelumnya sudah menarik 6 kotak kandidat lokasi (AOI) tapi belum pernah menghitung apakah kontras panasnya cukup. Saya hitung, dan ternyata gagal jauh.
2. **Perbaiki dua bug/celah sebelum lanjut menarik data:**
   - `fg_client.py` menyimpan respons API tapi tidak menyimpan permintaannya — jadi kalau ada respons aneh, tidak bisa dilacak itu permintaan apa. Sudah diperbaiki, sekarang keduanya disimpan bareng.
   - `UTM_EPSG` (zona proyeksi peta) hardcode ke zona Arizona, padahal AOI sudah pindah ke Florida. Sudah diperbaiki jadi otomatis menyesuaikan lokasi.
3. **Bikin alat scouting** (`pipeline/step1_scout_aoi.py`) buat nguji kontras panas di banyak kandidat kotak sekaligus, dan bisa dijalankan ulang tanpa buang kredit API (pakai cache).
4. **Uji 8 kandidat kotak** — 5 di Phoenix (gradasi ketinggian gunung, kebun jeruk vs batu gundul, gurun vs kota padat) dan 3 di Orlando (kawasan rindang vs jalan arteri).

## Hasil: GAGAL

Syarat lolos: beda suhu (`p95 − p05`) dalam satu kotak minimal **6°C**. Kalau di bawah **4°C**, harusnya ganti kotak sama sekali.

Kandidat terbaik cuma **1,84°C** — 31% dari syarat, dan itu pun masih di bawah ambang darurat 4°C. Semua 8 kandidat gagal, tanpa terkecuali:

| Kandidat | Kontras |
|---|---|
| Orlando – Pine Hills utara | 1,84°C |
| Phoenix – South Mountain | 1,62°C |
| Orlando – Pine Hills barat daya | 1,44°C |
| Phoenix – South Mountain (versi lain) | 1,32°C |
| Orlando – Pine Hills selatan | 0,83°C |
| Phoenix – gunung ke lahan tani | 0,55°C |
| Phoenix – kebun jeruk vs Camelback Mountain | 0,36°C |
| Phoenix – gurun Papago vs kota Tempe | 0,25°C |

**Kenapa ini bukan salah pilih kotak.** Fase 0 sudah membuktikan data suhu yang dipakai (`tcm`) itu suhu udara, bukan suhu permukaan tanah. Suhu udara memang jauh lebih rata secara spasial dibanding suhu aspal/atap — jadi wajar kalau kontrasnya kecil di mana pun dicoba. Saya sudah uji 3 mekanisme fisik berbeda (ketinggian gunung, irigasi vs gurun, kota vs alam) dan semuanya mentok di angka yang sama-sama kecil.

## Temuan sampingan yang penting

- **Biaya API itu flat**, bukan tergantung ukuran kotak: setiap panggilan `heatmap` kena **4.220 kredit**, entah kotaknya kecil atau besar. Ini juga menjelaskan kenapa 22 dari 36 panggilan sesi lalu yang hasilnya kosong tetap membakar total ~93.000 kredit sia-sia.
- Kredit yang sudah terpakai sampai sekarang: **213.100 dari 2.000.000 (10,7%)**. Masih banyak sisa.

## Status sekarang

**AOI belum dikunci.** Ini keputusan produk yang bukan wewenang saya ambil sendiri. Empat opsi tercatat lengkap di `docs/METHODOLOGY.md`:

1. Uji ulang di hari betul-betul terpanas (hari yang dipakai kemarin ternyata baru persentil ke-92, bukan 95).
2. Ganti dasar perhitungan dari "beda suhu" ke "beda dosis panas" — lebih sensitif ke selisih kecil.
3. Pakai `heat_index` (suhu terasa) alih-alih suhu udara mentah — di sampel Orlando ini memperbesar kontras sekitar 2×.
4. Terima kontrasnya kecil, dan revisi syarat gerbang di PRD secara terbuka.

Saya juga menemukan file-file lama yang sebaiknya dibereskan (folder `data/raw/` sudah 110MB dengan 22 file kosong, satu file scratch di root yang sudah tidak kepakai) — tapi belum saya hapus, tunggu keputusan Anda.
