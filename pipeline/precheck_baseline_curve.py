from pipeline import exceedance
from pipeline.config import (
    EXCEEDANCE_STATION_ICAO,
    EXCEEDANCE_STATION_END_DATE,
    EXCEEDANCE_STATION_START_DATE,
    FETCH_HOURS,
    TILES,
)

CANDIDATE_MONTH_PREFIX = "2025-08"
BASELINE_CANDIDATES_C = [33.0, 30.0]


def august_2025_temps(daily_station_temps: dict[str, float]) -> list[float]:
    return [
        temp_c
        for date_key, temp_c in daily_station_temps.items()
        if date_key.startswith(CANDIDATE_MONTH_PREFIX)
    ]


def mean_c(values: list[float]) -> float:
    return sum(values) / len(values)


def main() -> None:
    tile = TILES[0]
    print(f"{'jam':>5} | {'mean':>6} | {'min':>6} | {'max':>6} | margin@33 | margin@30 | hari<33 | hari<30")
    for hour in FETCH_HOURS:
        daily_station_temps = exceedance.station_temp_at_local_hour_by_date(
            EXCEEDANCE_STATION_ICAO,
            EXCEEDANCE_STATION_START_DATE,
            EXCEEDANCE_STATION_END_DATE,
            tile["timezone"],
            hour,
        )
        temps = august_2025_temps(daily_station_temps)
        if not temps:
            print(f"{hour:>5} | tidak ada data")
            continue
        mean_temp = mean_c(temps)
        below_33 = sum(1 for t in temps if t < 33.0)
        below_30 = sum(1 for t in temps if t < 30.0)
        print(
            f"{hour:>5} | {mean_temp:6.2f} | {min(temps):6.2f} | {max(temps):6.2f} | "
            f"{mean_temp - 33.0:+9.2f} | {mean_temp - 30.0:+9.2f} | {below_33:7d} | {below_30:7d}"
        )


if __name__ == "__main__":
    main()
