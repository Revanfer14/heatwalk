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

## Status akhir (diperbarui 25 Agustus sore)

**Selesai — AOI terkunci `orl_pine_hills_n`, gerbang kontras spasial dicabut.** Empat opsi yang sempat terbuka (uji ulang hari p95, pindah ke dosis, pakai heat index, revisi gerbang) sudah diputuskan di PRD §1.3: kontras dipindahkan ke sumbu waktu, durasi × circuity, dan exceedance; delta antar-rute menjadi G2b yang dilaporkan apa adanya.

Analisis lengkap + tabel 8 kandidat + catatan persentil hari uji: `docs/phase1-scouting.md`.

File lama juga sudah beres: 22 respons kosong, file scratch, dan seluruh heatmap kandidat dipindah ke `data/raw/phase1_scouting/` (arsip bukti, bukan sampah). Cache `fg_client` tetap hit lewat lookup rekursif — diuji dengan re-run `step1_scout_aoi.py`, nol kredit terpakai.
