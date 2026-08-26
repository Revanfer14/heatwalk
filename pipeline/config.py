import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_RAW_DIR = REPO_ROOT / "data" / "raw"
DATA_INTERIM_DIR = REPO_ROOT / "data" / "interim"
DATA_OUT_DIR = REPO_ROOT / "data" / "out"
DATA_FIXTURES_DIR = REPO_ROOT / "data" / "fixtures"
DOCS_DIR = REPO_ROOT / "docs"
WEB_PUBLIC_DATA_DIR = REPO_ROOT / "web" / "public" / "data"

FG_BASE_URL = "https://api.fortyguard.com/v1"
FG_API_KEY_ENV = "FORTYGUARD_API_KEY"
CENSUS_API_KEY_ENV = "CENSUS_API_KEY"

GRANULARITY_M = 60
GRANULARITY_M_ALLOWED = (60, 80, 100)
NODATA_SENTINELS = (-999, -999.0)


def utm_epsg_for_lon(longitude: float) -> int:
    zone = int((longitude + 180) // 6) + 1
    return 32600 + zone


BASELINE_C = 33.0
WALK_SPEED_MPS = 1.2
LAMBDA_DETOUR_CANDIDATES = [0.0, 0.005, 0.02, 0.05, 0.2, 1.0]
DETOUR_CAP_RATIO = 1.4
THRESHOLD_DOSE_C_MIN = 110.0
BUS_NOT_NEEDED_MAX_EXCESS_MI = 0.25
SCHOOL_DAYS_PER_YEAR = 180
EQUIVALENT_MINUTES_REFERENCE_C = 42.0
INCOME_QUARTILE_PERCENTILE = 25.0

CONTRAST_REPORT_TOP_N = 20

SHADE_COOLING_C = 1.5
SEGMENT_PRIORITY_TOP_N = 20

EXCEEDANCE_STATION_ICAO = "MCO"
EXCEEDANCE_STATION_START_DATE = "2019-01-01"
EXCEEDANCE_STATION_END_DATE = "2025-12-31"
SCHOOL_YEAR_START_MONTHS = frozenset({8, 9, 10, 11, 12})
SCHOOL_YEAR_END_MONTHS = frozenset({1, 2, 3, 4, 5})

MORNING_HHMM = "08:00"
DISMISSAL_HHMM = "15:00"

FETCH_DATE = "2023-08-08"
FETCH_HOURS = [f"{hour:02d}:00" for hour in range(7, 17)]

TILES = [
    {
        "id": "orl_ocps_core",
        "bbox": (-81.4763, 28.5277, -81.3719, 28.6612),
        "timezone": "America/New_York",
        "utc_offset_hours": -4,
        "status": "pending",
    },
]

VERIFY_AOI_BBOX = (-112.020, 33.430, -112.000, 33.445)
VERIFY_STATION_ICAO = "PHX"
VERIFY_STATION_LON = -112.0116
VERIFY_STATION_LAT = 33.4342
VERIFY_STATION_UTC_OFFSET_HOURS = -7
VERIFY_DATE = "2026-08-18"
VERIFY_HOUR_LOCAL = "15:00"
VERIFY_EXCEEDANCE_THRESHOLD_C = 40.0

TCM_AIR_TEMP_TOLERANCE_C = 3.0
TCM_SURFACE_TEMP_DELTA_C = 8.0

AOI_SCOUT_CANDIDATES = {
    "phx_south_phoenix": (-112.0669, 33.3400, -112.0183, 33.3857),
    "phx_arcadia_camelback": (-111.9925, 33.487, -111.9375, 33.533),
    "phx_south_mountain_centered": (-112.0855, 33.310, -112.0305, 33.356),
    "phx_south_mountain_laveen": (-112.150, 33.355, -112.095, 33.401),
    "phx_papago_tempe": (-111.980, 33.415, -111.925, 33.461),
    "orl_pine_hills_n": (-81.4763, 28.5722, -81.4241, 28.6167),
    "orl_pine_hills_sw": (-81.4476, 28.5233, -81.3968, 28.5688),
    "orl_pine_hills_s": (-81.4916, 28.4799, -81.4425, 28.5260),
}

AOI_SCOUT_DATE = VERIFY_DATE
AOI_SCOUT_HOUR = "15:00"


def fortyguard_api_key() -> str:
    key = os.environ.get(FG_API_KEY_ENV, "")
    if not key:
        raise RuntimeError(
            f"{FG_API_KEY_ENV} tidak ditemukan di environment. Isi file .env."
        )
    return key


def census_api_key() -> str:
    key = os.environ.get(CENSUS_API_KEY_ENV, "")
    if not key:
        raise RuntimeError(
            f"{CENSUS_API_KEY_ENV} tidak ditemukan di environment. Isi file .env."
        )
    return key
