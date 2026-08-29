from pipeline import exceedance
from pipeline.config import (
    BASELINE_C,
    EXCEEDANCE_STATION_ICAO,
    EXCEEDANCE_STATION_END_DATE,
    EXCEEDANCE_STATION_START_DATE,
    TILES,
)

REFERENCE_FETCH_DATE = "2023-08-08"
CANDIDATE_MONTH_PREFIX = "2025-08"
CANONICAL_HOUR_CANDIDATE = "15:00"


def august_2025_dates(daily_station_temps: dict[str, float]) -> list[str]:
    return sorted(
        date_key for date_key in daily_station_temps if date_key.startswith(CANDIDATE_MONTH_PREFIX)
    )


def mean_c(values: list[float]) -> float:
    return sum(values) / len(values)


def main() -> None:
    tile = TILES[0]
    daily_station_temps = exceedance.station_temp_at_local_hour_by_date(
        EXCEEDANCE_STATION_ICAO,
        EXCEEDANCE_STATION_START_DATE,
        EXCEEDANCE_STATION_END_DATE,
        tile["timezone"],
        CANONICAL_HOUR_CANDIDATE,
    )

    reference_temp_c = daily_station_temps.get(REFERENCE_FETCH_DATE)
    august_dates = august_2025_dates(daily_station_temps)
    august_temps_c = [daily_station_temps[date_key] for date_key in august_dates]

    print(f"Stasiun: {EXCEEDANCE_STATION_ICAO}, jam kanonik kandidat: {CANONICAL_HOUR_CANDIDATE}")
    print(f"Jendela METAR tersedia: {EXCEEDANCE_STATION_START_DATE} .. {EXCEEDANCE_STATION_END_DATE}")
    print()

    if reference_temp_c is None:
        print(f"PERINGATAN: {REFERENCE_FETCH_DATE} tidak ditemukan di data METAR (bukan bulan sekolah?).")
    else:
        print(f"Referensi lama {REFERENCE_FETCH_DATE}: {reference_temp_c:.2f}°C")

    print(f"Hari Agustus 2025 ditemukan di data METAR: {len(august_dates)} / 31")
    if len(august_dates) == 0:
        print("GAGAL: tidak ada satu hari Agustus 2025 pun di data METAR. Cek EXCEEDANCE_STATION_END_DATE.")
        return

    mean_temp_c = mean_c(august_temps_c)
    min_temp_c = min(august_temps_c)
    max_temp_c = max(august_temps_c)
    below_baseline = [
        (date_key, temp_c)
        for date_key, temp_c in zip(august_dates, august_temps_c)
        if temp_c < BASELINE_C
    ]

    print(f"Mean stasiun Agustus 2025 @ {CANONICAL_HOUR_CANDIDATE}: {mean_temp_c:.2f}°C "
          f"(min {min_temp_c:.2f}°C, max {max_temp_c:.2f}°C)")
    if reference_temp_c is not None:
        print(f"Selisih terhadap referensi lama: {mean_temp_c - reference_temp_c:+.2f}°C")
    print(f"BASELINE_C saat ini: {BASELINE_C:.1f}°C")
    print(f"Hari Agustus 2025 di bawah BASELINE_C: {len(below_baseline)} / {len(august_dates)}")
    for date_key, temp_c in below_baseline:
        print(f"  {date_key}: {temp_c:.2f}°C")

    print()
    margin_c = mean_temp_c - BASELINE_C
    if margin_c <= 0:
        print(f"GERBANG GAGAL: mean berada DI BAWAH BASELINE_C ({margin_c:+.2f}°C). "
              "Dosis di jam kanonik akan kolaps ke ~0 di hampir semua blok. BERHENTI — jangan fetch.")
    elif margin_c < 2.0:
        print(f"GERBANG WASPADA: mean cuma {margin_c:+.2f}°C di atas BASELINE_C. "
              "Dosis kemungkinan sangat tipis dan gerbang G1 (blok merah > 0) berisiko gagal. "
              "Laporkan angka ini sebelum melanjutkan fetch.")
    else:
        print(f"GERBANG LULUS: mean {margin_c:+.2f}°C di atas BASELINE_C. Aman melanjutkan ke Langkah 1.")


if __name__ == "__main__":
    main()
