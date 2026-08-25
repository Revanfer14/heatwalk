import httpx
from shapely.geometry import MultiPolygon, Point, Polygon, mapping
from shapely.geometry.polygon import orient

from pipeline.http_cache import fetch_json_cached

TIGERWEB_BLOCKS_URL = (
    "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Tracts_Blocks/MapServer/2/query"
)


def _signed_area(ring: list[list[float]]) -> float:
    total = 0.0
    for (x1, y1), (x2, y2) in zip(ring, ring[1:]):
        total += x1 * y2 - x2 * y1
    return total / 2.0


def _build_geometry(rings: list[list[list[float]]]) -> Polygon | MultiPolygon:
    exteriors = [ring for ring in rings if _signed_area(ring) < 0]
    holes = [ring for ring in rings if _signed_area(ring) >= 0]

    if len(exteriors) <= 1:
        exterior = exteriors[0] if exteriors else rings[0]
        return orient(Polygon(exterior, holes))

    exterior_polygons = [Polygon(exterior) for exterior in exteriors]
    holes_by_exterior: list[list[list[list[float]]]] = [[] for _ in exterior_polygons]
    for hole in holes:
        point = Point(hole[0])
        owner = next(
            (i for i, exterior_polygon in enumerate(exterior_polygons) if exterior_polygon.contains(point)),
            0,
        )
        holes_by_exterior[owner].append(hole)

    parts = [
        orient(Polygon(exterior, holes_by_exterior[i])) for i, exterior in enumerate(exteriors)
    ]
    return MultiPolygon(parts)


def _repair_if_invalid(geometry: Polygon | MultiPolygon) -> Polygon | MultiPolygon:
    return geometry if geometry.is_valid else geometry.buffer(0)


def _fetch_all_features_live(bbox: tuple[float, float, float, float]) -> list[dict]:
    west, south, east, north = bbox
    base_params = {
        "geometry": f"{west},{south},{east},{north}",
        "geometryType": "esriGeometryEnvelope",
        "inSR": "4326",
        "spatialRel": "esriSpatialRelIntersects",
        "outFields": "GEOID",
        "returnGeometry": "true",
        "outSR": "4326",
        "f": "json",
    }

    features: list[dict] = []
    offset = 0
    while True:
        response = httpx.get(TIGERWEB_BLOCKS_URL, params={**base_params, "resultOffset": offset}, timeout=60.0)
        response.raise_for_status()
        payload = response.json()
        batch = payload.get("features", [])
        features.extend(batch)
        if not batch or not payload.get("exceededTransferLimit"):
            break
        offset += len(batch)
    return features


def polygons_by_geoid(tile_id: str, bbox: tuple[float, float, float, float]) -> dict[str, dict]:
    features = fetch_json_cached(f"census_block_geoms_{tile_id}", lambda: _fetch_all_features_live(bbox))
    result: dict[str, dict] = {}
    for feature in features:
        geoid = feature["attributes"]["GEOID"]
        geometry = _repair_if_invalid(_build_geometry(feature["geometry"]["rings"]))
        result[geoid] = mapping(geometry)
    return result
