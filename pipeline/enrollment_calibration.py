from pipeline import census_blocks
from pipeline.block_assignment import nearest_school_within_radius

MIN_VALID_FACTOR = 0.3
MAX_VALID_FACTOR = 3.0

LEVEL_AGE_BAND_WEIGHTS = {
    "elementary": {"5_9": 1.0, "10_14": 0.2, "15_17": 0.0},
    "middle": {"5_9": 0.0, "10_14": 0.6, "15_17": 0.0},
    "high": {"5_9": 0.0, "10_14": 0.2, "15_17": 1.0},
}


def grade_band_estimate(bands: dict[str, int], level: str) -> float:
    weights = LEVEL_AGE_BAND_WEIGHTS[level]
    return sum(bands.get(band, 0) * weight for band, weight in weights.items())


def dasymetric_children_by_school(tile_id: str, bbox: tuple[float, float, float, float], schools: list[dict]) -> dict[str, float]:
    blocks = census_blocks.query_blocks_in_bbox(tile_id, bbox)
    bands_by_geoid = census_blocks.children_by_age_band_by_block(tile_id, bbox)

    totals = {school["id"]: 0.0 for school in schools}
    for block in blocks:
        bands = bands_by_geoid.get(block["GEOID"])
        if bands is None:
            continue
        block_lonlat = [float(block["INTPTLON"]), float(block["INTPTLAT"])]
        assignment = nearest_school_within_radius(block_lonlat, schools)
        if assignment is None:
            continue
        school, _ = assignment
        totals[school["id"]] += grade_band_estimate(bands, school["level"])
    return {school_id: round(total, 1) for school_id, total in totals.items()}


def correction_factors(schools: list[dict], dasymetric_totals: dict[str, int]) -> dict[str, float | None]:
    factors: dict[str, float | None] = {}
    for school in schools:
        estimate = dasymetric_totals[school["id"]]
        factors[school["id"]] = round(school["enrollment"] / estimate, 3) if estimate > 0 else None
    return factors


def print_calibration_report(schools: list[dict], dasymetric_totals: dict[str, int], factors: dict[str, float | None]) -> None:
    print("\nKalibrasi enrollment (nearest-school-dalam-radius, Census DHC P12 5-17 tahun):")
    for school in schools:
        estimate = dasymetric_totals[school["id"]]
        factor = factors[school["id"]]
        in_range = factor is not None and MIN_VALID_FACTOR <= factor <= MAX_VALID_FACTOR
        flag = "" if in_range else "  <- DI LUAR RENTANG 0.3-3.0"
        print(f"  {school['id']:32} enrollment_ccd={school['enrollment']:>5}  dasymetric={estimate:>5}  factor={factor}{flag}")
