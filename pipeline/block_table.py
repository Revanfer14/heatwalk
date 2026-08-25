from pipeline import census_acs, census_blocks
from pipeline.enrollment_calibration import LEVEL_AGE_BAND_WEIGHTS
from pipeline.geo_distance import distance_km

MI_PER_KM = 0.621371
BLOCK_GROUP_GEOID_LENGTH = 12


def _grade_band_estimate(bands: dict[str, int], level: str) -> float:
    weights = LEVEL_AGE_BAND_WEIGHTS[level]
    return sum(bands.get(band, 0) * weight for band, weight in weights.items())


def _nearest_school(block_lonlat: list[float], schools: list[dict]) -> tuple[dict, float]:
    best_school = None
    best_km = None
    for school in schools:
        km = distance_km(block_lonlat, [school["lon"], school["lat"]])
        if best_km is None or km < best_km:
            best_km, best_school = km, school
    return best_school, best_km


def build_block_table(
    tile_id: str,
    bbox: tuple[float, float, float, float],
    schools: list[dict],
    correction_factors: dict[str, float | None],
) -> list[dict]:
    raw_blocks = census_blocks.query_blocks_in_bbox(tile_id, bbox)
    bands_by_geoid = census_blocks.children_by_age_band_by_block(tile_id, bbox)
    income_by_block_group = census_acs.median_income_by_block_group(tile_id, bbox)

    table: list[dict] = []
    for block in raw_blocks:
        if block["POP100"] <= 0:
            continue

        geoid = block["GEOID"]
        lon, lat = float(block["INTPTLON"]), float(block["INTPTLAT"])
        school, distance_km_value = _nearest_school([lon, lat], schools)

        bands = bands_by_geoid.get(geoid, {})
        dasymetric_estimate = _grade_band_estimate(bands, school["level"])
        factor = correction_factors.get(school["id"]) or 1.0
        kids_est = round(dasymetric_estimate * factor)

        table.append(
            {
                "block_id": geoid,
                "school_id": school["id"],
                "lon": lon,
                "lat": lat,
                "kids_est": kids_est,
                "distance_mi": round(distance_km_value * MI_PER_KM, 3),
                "median_income": income_by_block_group.get(geoid[:BLOCK_GROUP_GEOID_LENGTH]),
            }
        )
    return table
