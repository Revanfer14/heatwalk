import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_RAW_DIR = REPO_ROOT / "data" / "raw"
DATA_INTERIM_DIR = REPO_ROOT / "data" / "interim"
DATA_OUT_DIR = REPO_ROOT / "data" / "out"
DOCS_DIR = REPO_ROOT / "docs"
WEB_PUBLIC_DATA_DIR = REPO_ROOT / "web" / "public" / "data"

FG_BASE_URL = "https://api.fortyguard.com/v1"
FG_API_KEY_ENV = "FORTYGUARD_API_KEY"

GRANULARITY_M = 60
UTM_EPSG = 32612
NODATA_SENTINELS = (-999, -999.0)

BASELINE_C = 33.0
WALK_SPEED_MPS = 1.2
LAMBDA_DETOUR_CANDIDATES = [0.0, 0.005, 0.02, 0.05, 0.2, 1.0]
DETOUR_CAP_RATIO = 1.4
THRESHOLD_DOSE_C_MIN = 220.0
BUS_NOT_NEEDED_MAX_EXCESS_MI = 0.25
SCHOOL_DAYS_PER_YEAR = 180

MORNING_HHMM = "07:30"
DISMISSAL_HHMM = "14:45"

AOI_TIMEZONE = "America/Phoenix"
AOI_UTC_OFFSET_HOURS = -7

VERIFY_AOI_BBOX = (-112.020, 33.430, -112.000, 33.445)
VERIFY_STATION_ICAO = "PHX"
VERIFY_STATION_LON = -112.0116
VERIFY_STATION_LAT = 33.4342
VERIFY_DATE = "2026-08-18"
VERIFY_HOUR_LOCAL = "15:00"
VERIFY_EXCEEDANCE_THRESHOLD_C = 40.0

TCM_AIR_TEMP_TOLERANCE_C = 3.0
TCM_SURFACE_TEMP_DELTA_C = 8.0

PHOENIX_AOI_BBOX_PROVISIONAL = (-112.12, 33.45, -112.05, 33.51)


def fortyguard_api_key() -> str:
    key = os.environ.get(FG_API_KEY_ENV, "")
    if not key:
        raise RuntimeError(
            f"{FG_API_KEY_ENV} tidak ditemukan di environment. Isi file .env."
        )
    return key
