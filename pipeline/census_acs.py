import httpx

from pipeline.census_blocks import query_blocks_in_bbox
from pipeline.config import census_api_key
from pipeline.http_cache import fetch_json_cached

ACS_URL = "https://api.census.gov/data/2022/acs/acs5"

MEDIAN_INCOME_VARIABLE = "B19013_001E"
POVERTY_TOTAL_VARIABLE = "B17001_001E"
POVERTY_BELOW_VARIABLE = "B17001_002E"


def _query_income_by_block_group_live(state: str, county: str, tract: str) -> list[dict]:
    params = {
        "get": MEDIAN_INCOME_VARIABLE,
        "for": "block group:*",
        "in": f"state:{state} county:{county} tract:{tract}",
        "key": census_api_key(),
    }
    response = httpx.get(ACS_URL, params=params, timeout=60.0, follow_redirects=True)
    response.raise_for_status()
    header, *rows = response.json()
    return [dict(zip(header, row)) for row in rows]


def _query_poverty_by_tract_live(state: str, county: str) -> list[dict]:
    params = {
        "get": f"{POVERTY_TOTAL_VARIABLE},{POVERTY_BELOW_VARIABLE}",
        "for": "tract:*",
        "in": f"state:{state} county:{county}",
        "key": census_api_key(),
    }
    response = httpx.get(ACS_URL, params=params, timeout=60.0, follow_redirects=True)
    response.raise_for_status()
    header, *rows = response.json()
    return [dict(zip(header, row)) for row in rows]


def median_income_by_block_group(tile_id: str, bbox: tuple[float, float, float, float]) -> dict[str, int | None]:
    blocks = query_blocks_in_bbox(tile_id, bbox)
    tracts = sorted({(b["STATE"], b["COUNTY"], b["TRACT"]) for b in blocks})

    income_by_geoid: dict[str, int | None] = {}
    for state, county, tract in tracts:
        rows = fetch_json_cached(
            f"census_acs_income_{state}{county}{tract}",
            lambda s=state, c=county, t=tract: _query_income_by_block_group_live(s, c, t),
        )
        for row in rows:
            geoid = f"{row['state']}{row['county']}{row['tract']}{row['block group']}"
            value = row[MEDIAN_INCOME_VARIABLE]
            income_by_geoid[geoid] = int(value) if value not in (None, "-666666666") else None
    return income_by_geoid


def poverty_rate_by_tract(tile_id: str, bbox: tuple[float, float, float, float]) -> dict[str, float | None]:
    blocks = query_blocks_in_bbox(tile_id, bbox)
    counties = sorted({(b["STATE"], b["COUNTY"]) for b in blocks})
    tracts_in_aoi = {b["TRACT"] for b in blocks}

    poverty_by_geoid: dict[str, float | None] = {}
    for state, county in counties:
        rows = fetch_json_cached(
            f"census_acs_poverty_{state}{county}",
            lambda s=state, c=county: _query_poverty_by_tract_live(s, c),
        )
        for row in rows:
            if row["tract"] not in tracts_in_aoi:
                continue
            geoid = f"{row['state']}{row['county']}{row['tract']}"
            total = row[POVERTY_TOTAL_VARIABLE]
            below = row[POVERTY_BELOW_VARIABLE]
            poverty_by_geoid[geoid] = (
                round(int(below) / int(total) * 100, 1) if total not in (None, "0") else None
            )
    return poverty_by_geoid
