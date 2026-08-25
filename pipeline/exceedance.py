from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from pipeline import metar_client
from pipeline.config import SCHOOL_YEAR_END_MONTHS, SCHOOL_YEAR_START_MONTHS
from pipeline.dose import dose_c_min

SCHOOL_YEAR_MONTHS = SCHOOL_YEAR_START_MONTHS | SCHOOL_YEAR_END_MONTHS


def _parse_hourly_utc(csv_text: str) -> list[tuple[datetime, float]]:
    rows = []
    for line in csv_text.splitlines():
        if not line or line.startswith("station"):
            continue
        parts = line.split(",")
        if len(parts) < 3:
            continue
        _, valid_str, tmpc_str = parts[0], parts[1], parts[2]
        if tmpc_str in ("M", ""):
            continue
        try:
            valid_dt = datetime.strptime(valid_str, "%Y-%m-%d %H:%M").replace(tzinfo=timezone.utc)
            temp_c = float(tmpc_str)
        except ValueError:
            continue
        rows.append((valid_dt, temp_c))
    return rows


def _school_year_label(local_dt: datetime) -> int:
    return local_dt.year if local_dt.month in SCHOOL_YEAR_START_MONTHS else local_dt.year - 1


def station_temp_at_local_hour_by_date(
    station: str, start_date: str, end_date: str, timezone_name: str, local_hhmm: str
) -> dict[str, float]:
    csv_text = metar_client.fetch_range_csv(station, start_date, end_date)
    tz = ZoneInfo(timezone_name)
    target_hour, target_minute = (int(part) for part in local_hhmm.split(":"))
    target_total_minutes = target_hour * 60 + target_minute

    nearest_by_date: dict[str, tuple[int, float]] = {}
    for valid_dt_utc, temp_c in _parse_hourly_utc(csv_text):
        local_dt = valid_dt_utc.astimezone(tz)
        if local_dt.month not in SCHOOL_YEAR_MONTHS:
            continue
        delta_minutes = abs(local_dt.hour * 60 + local_dt.minute - target_total_minutes)
        date_key = local_dt.strftime("%Y-%m-%d")
        best = nearest_by_date.get(date_key)
        if best is None or delta_minutes < best[0]:
            nearest_by_date[date_key] = (delta_minutes, temp_c)

    return {date_key: temp_c for date_key, (_delta, temp_c) in nearest_by_date.items()}


def school_years_spanned(daily_temps: dict[str, float], timezone_name: str) -> int:
    tz = ZoneInfo(timezone_name)
    labels = set()
    for date_key in daily_temps:
        local_dt = datetime.strptime(date_key, "%Y-%m-%d").replace(tzinfo=tz)
        labels.add(_school_year_label(local_dt))
    return len(labels)


def spatial_offset_c(block_mean_c_on_fetch_date: float, station_temp_on_fetch_date: float) -> float:
    return block_mean_c_on_fetch_date - station_temp_on_fetch_date


def days_exceedance_per_year(
    daily_station_temps: dict[str, float],
    offset_c: float,
    coolest_len_m: float,
    threshold_dose_c_min: float,
    n_years: int,
) -> float:
    if n_years == 0:
        return 0.0
    exceedance_days = sum(
        1
        for station_temp_c in daily_station_temps.values()
        if dose_c_min(station_temp_c + offset_c, coolest_len_m) > threshold_dose_c_min
    )
    return round(exceedance_days / n_years, 2)
