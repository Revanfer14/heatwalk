import hashlib
from datetime import datetime, timedelta, timezone

import httpx

from pipeline.config import DATA_RAW_DIR

ASOS_URL = "https://mesonet.agron.iastate.edu/cgi-bin/request/asos.py"


def _cache_path(station: str, date_str: str) -> str:
    key = hashlib.sha1(f"{station}_{date_str}".encode()).hexdigest()[:12]
    return str(DATA_RAW_DIR / f"metar_{station}_{key}.csv")


def fetch_day_csv(station: str, date_str: str) -> str:
    cache_path = _cache_path(station, date_str)
    from pathlib import Path

    cached = Path(cache_path)
    if cached.exists():
        return cached.read_text(encoding="utf-8")

    day = datetime.strptime(date_str, "%Y-%m-%d")
    next_day = day + timedelta(days=1)
    params = {
        "station": station,
        "data": "tmpc",
        "year1": day.year,
        "month1": day.month,
        "day1": day.day,
        "year2": next_day.year,
        "month2": next_day.month,
        "day2": next_day.day,
        "tz": "UTC",
        "format": "onlycomma",
        "latlon": "no",
        "missing": "M",
        "trace": "T",
        "direct": "no",
        "report_type": "3",
    }
    response = httpx.get(ASOS_URL, params=params, timeout=30.0)
    response.raise_for_status()
    DATA_RAW_DIR.mkdir(parents=True, exist_ok=True)
    cached.write_text(response.text, encoding="utf-8")
    return response.text


def nearest_temperature_c(station: str, date_str: str, target_utc: datetime) -> float | None:
    csv_text = fetch_day_csv(station, date_str)
    lines = [line for line in csv_text.splitlines() if line and not line.startswith("station")]
    if not lines:
        return None

    best_temp = None
    best_delta = None
    for line in lines:
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
        delta = abs((valid_dt - target_utc).total_seconds())
        if best_delta is None or delta < best_delta:
            best_delta = delta
            best_temp = temp_c
    return best_temp
