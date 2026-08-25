import httpx

from pipeline.config import census_api_key
from pipeline.http_cache import fetch_json_cached

TIGERWEB_BLOCKS_URL = (
    "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Tracts_Blocks/MapServer/2/query"
)
DHC_URL = "https://api.census.gov/data/2020/dec/dhc"

AGE_BAND_VARIABLES = {
    "5_9": ("P12_004N", "P12_028N"),
    "10_14": ("P12_005N", "P12_029N"),
    "15_17": ("P12_006N", "P12_030N"),
}
CHILDREN_5_17_VARIABLES = tuple(v for variables in AGE_BAND_VARIABLES.values() for v in variables)


def _query_blocks_in_bbox_live(bbox: tuple[float, float, float, float]) -> list[dict]:
    west, south, east, north = bbox
    params = {
        "geometry": f"{west},{south},{east},{north}",
        "geometryType": "esriGeometryEnvelope",
        "inSR": "4326",
        "spatialRel": "esriSpatialRelIntersects",
        "outFields": "STATE,COUNTY,TRACT,BLOCK,GEOID,POP100,AREALAND,INTPTLAT,INTPTLON",
        "returnGeometry": "false",
        "f": "json",
    }
    response = httpx.get(TIGERWEB_BLOCKS_URL, params=params, timeout=60.0)
    response.raise_for_status()
    return [feature["attributes"] for feature in response.json().get("features", [])]


def query_blocks_in_bbox(tile_id: str, bbox: tuple[float, float, float, float]) -> list[dict]:
    return fetch_json_cached(f"census_blocks_{tile_id}", lambda: _query_blocks_in_bbox_live(bbox))


def _query_children_for_tract_live(state: str, county: str, tract: str) -> list[dict]:
    params = {
        "get": ",".join(CHILDREN_5_17_VARIABLES),
        "for": "block:*",
        "in": f"state:{state} county:{county} tract:{tract}",
        "key": census_api_key(),
    }
    response = httpx.get(DHC_URL, params=params, timeout=60.0, follow_redirects=True)
    response.raise_for_status()
    header, *rows = response.json()
    return [dict(zip(header, row)) for row in rows]


def _children_for_tract_cached(state: str, county: str, tract: str) -> list[dict]:
    return fetch_json_cached(
        f"census_dhc_p12_{state}{county}{tract}",
        lambda: _query_children_for_tract_live(state, county, tract),
    )


def children_by_age_band_by_block(tile_id: str, bbox: tuple[float, float, float, float]) -> dict[str, dict[str, int]]:
    blocks = query_blocks_in_bbox(tile_id, bbox)
    tracts = sorted({(b["STATE"], b["COUNTY"], b["TRACT"]) for b in blocks})

    bands_by_geoid: dict[str, dict[str, int]] = {}
    for state, county, tract in tracts:
        for row in _children_for_tract_cached(state, county, tract):
            geoid = f"{row['state']}{row['county']}{row['tract']}{row['block']}"
            bands_by_geoid[geoid] = {
                band: sum(int(row[variable]) for variable in variables)
                for band, variables in AGE_BAND_VARIABLES.items()
            }

    block_geoids = {block["GEOID"] for block in blocks}
    return {geoid: bands for geoid, bands in bands_by_geoid.items() if geoid in block_geoids}


def children_5_17_by_block(tile_id: str, bbox: tuple[float, float, float, float]) -> dict[str, int]:
    bands_by_geoid = children_by_age_band_by_block(tile_id, bbox)
    return {geoid: sum(bands.values()) for geoid, bands in bands_by_geoid.items()}
