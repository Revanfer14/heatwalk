import json
import re
from pathlib import Path

import httpx

from pipeline.config import DATA_RAW_DIR

NCES_ADMIN_QUERY_URL = (
    "https://nces.ed.gov/opengis/rest/services/K12_School_Locations/"
    "EDGE_ADMINDATA_PUBLICSCH_2324/MapServer/1/query"
)

INCLUDED_SCHOOL_LEVELS = {"Elementary", "Middle", "High"}
MIN_ENROLLMENT = 1

POLICY_SOURCE_CITATION = (
    "OCPS Transportation FAQs (ocps.net/transportation-faqs), radius 2 mi per FS 1006.23"
)
WALK_RADIUS_MI = 2.0


def _cache_path(tile_id: str) -> Path:
    return DATA_RAW_DIR / f"nces_ccd_{tile_id}.json"


def _slug(name: str) -> str:
    lowered = re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")
    return f"sch_{lowered}"


KNOWN_ACRONYMS = {"ucp", "ocps"}


def _title_case_preserving_acronyms(name: str) -> str:
    words = name.split()
    titled = [word.upper() if word.lower() in KNOWN_ACRONYMS else word.title() for word in words]
    return " ".join(titled)


def _query_ccd_schools_live(bbox: tuple[float, float, float, float]) -> list[dict]:
    west, south, east, north = bbox
    params = {
        "geometry": f"{west},{south},{east},{north}",
        "geometryType": "esriGeometryEnvelope",
        "inSR": "4326",
        "spatialRel": "esriSpatialRelIntersects",
        "outFields": "NCESSCH,SCH_NAME,SCHOOL_LEVEL,GSLO,GSHI,TOTAL,STATUS,LATCOD,LONCOD",
        "where": "1=1",
        "f": "json",
    }
    response = httpx.get(NCES_ADMIN_QUERY_URL, params=params, timeout=30.0)
    response.raise_for_status()
    body = response.json()
    return [feature["attributes"] for feature in body.get("features", [])]


def query_ccd_schools_cached(tile_id: str, bbox: tuple[float, float, float, float]) -> list[dict]:
    cache_path = _cache_path(tile_id)
    if cache_path.exists():
        return json.loads(cache_path.read_text(encoding="utf-8"))

    raw_schools = _query_ccd_schools_live(bbox)
    DATA_RAW_DIR.mkdir(parents=True, exist_ok=True)
    cache_path.write_text(json.dumps(raw_schools, indent=2), encoding="utf-8")
    return raw_schools


def _is_analyzable_school(row: dict) -> bool:
    level = row.get("SCHOOL_LEVEL")
    if level not in INCLUDED_SCHOOL_LEVELS:
        return False
    return int(row["TOTAL"]) >= MIN_ENROLLMENT


def build_schools_payload(tile_id: str, bbox: tuple[float, float, float, float]) -> list[dict]:
    raw_schools = query_ccd_schools_cached(tile_id, bbox)
    schools = []
    for row in raw_schools:
        if not _is_analyzable_school(row):
            continue
        level = row["SCHOOL_LEVEL"]
        schools.append(
            {
                "id": _slug(row["SCH_NAME"]),
                "name": _title_case_preserving_acronyms(row["SCH_NAME"]),
                "level": level.lower(),
                "enrollment": int(row["TOTAL"]),
                "walk_radius_mi": WALK_RADIUS_MI,
                "lon": round(row["LONCOD"], 6),
                "lat": round(row["LATCOD"], 6),
                "policy_source": POLICY_SOURCE_CITATION,
                "nces_id": row["NCESSCH"],
            }
        )
    schools.sort(key=lambda school: school["name"])
    return schools
