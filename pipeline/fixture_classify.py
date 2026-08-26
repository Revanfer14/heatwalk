import hashlib

from pipeline import step4_classify, summary_build
from pipeline.config import BASELINE_C, FETCH_HOURS, THRESHOLD_DOSE_C_MIN, WALK_SPEED_MPS
from pipeline.fixture_geometry import block_heat_factor, school_lonlat
from pipeline.fixture_temps import CANONICAL_HOUR, HOUR_OFFSET_C, ORLANDO_SPREAD_C
from pipeline.geo_distance import distance_km

MI_PER_KM = 0.621371
SYNTHETIC_STATION_DAYS = 300
SYNTHETIC_STATION_YEARS = 6


def _seeded_unit(*parts: object) -> float:
    digest = hashlib.sha1("_".join(str(p) for p in parts).encode()).hexdigest()
    return int(digest[:8], 16) / 0xFFFFFFFF


def _nearest_school(block: dict, schools: list[dict]) -> tuple[dict, float]:
    best_school = None
    best_km = None
    for school in schools:
        km = distance_km(block["centroid"], school_lonlat(school))
        if best_km is None or km < best_km:
            best_km, best_school = km, school
    return best_school, best_km


def _dose_reduction_frac(col: int, row: int) -> float:
    factor = block_heat_factor(col, row)
    noise = (_seeded_unit("cool", col, row) - 0.5) * 0.1
    if factor < 0.35:
        return min(max(0.85 + noise, 0.5), 0.98)
    if factor < 0.85:
        return min(max(0.35 + noise, 0.15), 0.6)
    return min(max(0.80 + noise, 0.6), 0.95)


def _route_stats(block: dict, distance_km_value: float, hhmm: str) -> dict:
    col, row = block["col"], block["row"]
    factor = block_heat_factor(col, row)
    noise = (_seeded_unit("mean", col, row, hhmm) - 0.5) * 1.0
    len_m = distance_km_value * 1000 * 1.25

    shortest_mean_c = round(BASELINE_C + factor * ORLANDO_SPREAD_C + HOUR_OFFSET_C[hhmm] + noise, 2)
    shortest_peak_c = round(shortest_mean_c + 1.2, 2)
    shortest_dose = round(max(shortest_mean_c - BASELINE_C, 0.0) * (len_m / WALK_SPEED_MPS) / 60.0, 1)

    frac = _dose_reduction_frac(col, row)
    detour_ratio = 1.05 + (1.0 - frac) * 0.30
    coolest_len_m = round(len_m * detour_ratio, 1)
    coolest_dose = round(shortest_dose * frac, 1)
    if coolest_dose > 0 and coolest_len_m > 0:
        coolest_mean_c = round(BASELINE_C + coolest_dose * 60.0 * WALK_SPEED_MPS / coolest_len_m, 2)
    else:
        coolest_mean_c = round(BASELINE_C - 1.0, 2)
    coolest_peak_c = round(coolest_mean_c + 1.0, 2)

    return {
        "shortest": {"len_m": round(len_m, 1), "mean_c": shortest_mean_c, "peak_c": shortest_peak_c, "dose": shortest_dose},
        "coolest": {"len_m": coolest_len_m, "mean_c": coolest_mean_c, "peak_c": coolest_peak_c, "dose": coolest_dose},
    }


def _build_routed_for_school(school: dict, school_blocks: list[dict], distances_km: dict[str, float]) -> dict:
    block_records: dict[str, dict] = {}
    for block in school_blocks:
        block_id = block["block_id"]
        km = distances_km[block_id]
        shortest_by_hour: dict[str, dict] = {}
        coolest_by_hour: dict[str, dict] = {}
        shortest_len_m = 0.0

        for hhmm in FETCH_HOURS:
            routes = _route_stats(block, km, hhmm)
            shortest_len_m = routes["shortest"]["len_m"]
            shortest_by_hour[hhmm] = {
                "mean_c": routes["shortest"]["mean_c"],
                "peak_c": routes["shortest"]["peak_c"],
                "dose": routes["shortest"]["dose"],
            }
            coolest_by_hour[hhmm] = {
                "len_m": routes["coolest"]["len_m"],
                "mean_c": routes["coolest"]["mean_c"],
                "peak_c": routes["coolest"]["peak_c"],
                "dose": routes["coolest"]["dose"],
            }

        block_records[block_id] = {
            "kids_est": 5 + int(_seeded_unit("kids", block["col"], block["row"]) * 40),
            "distance_mi": round(km * MI_PER_KM, 3),
            "shortest": {"len_m": shortest_len_m, "by_hour": shortest_by_hour},
            "coolest": {"by_hour": coolest_by_hour},
        }

    return {
        "meta": {
            "school_id": school["id"],
            "canonical_hour": CANONICAL_HOUR,
            "hours": FETCH_HOURS,
            "threshold": THRESHOLD_DOSE_C_MIN,
        },
        "blocks": block_records,
    }


def _synthetic_median_income_by_block_group(block_ids: list[str]) -> dict[str, int]:
    block_group_ids = {block_id[:summary_build.BLOCK_GROUP_GEOID_LENGTH] for block_id in block_ids}
    return {
        block_group_id: round(20000 + _seeded_unit("income", block_group_id) * 150000)
        for block_group_id in block_group_ids
    }


def _synthetic_daily_station_temps() -> dict[str, float]:
    return {
        str(day): round(BASELINE_C + (_seeded_unit("station", day) - 0.3) * ORLANDO_SPREAD_C * 2, 2)
        for day in range(SYNTHETIC_STATION_DAYS)
    }


def classify_and_summarize(
    blocks: list[dict], schools: list[dict], correction_factors: dict[str, float | None]
) -> tuple[dict[str, list[dict]], dict]:
    distances_km: dict[str, float] = {}
    blocks_by_school: dict[str, list[dict]] = {school["id"]: [] for school in schools}
    for block in blocks:
        school, km = _nearest_school(block, schools)
        distances_km[block["block_id"]] = km
        blocks_by_school[school["id"]].append(block)

    routed_by_school = {
        school["id"]: _build_routed_for_school(school, blocks_by_school[school["id"]], distances_km)
        for school in schools
    }
    classified_by_school = {
        school["id"]: step4_classify.classify_school_blocks(school, routed_by_school[school["id"]])
        for school in schools
    }

    median_income_by_block_group = _synthetic_median_income_by_block_group(
        [block["block_id"] for block in blocks]
    )
    daily_station_temps = _synthetic_daily_station_temps()
    station_temp_on_fetch_date = BASELINE_C + ORLANDO_SPREAD_C * 0.5

    summary = summary_build.build_summary(
        schools, classified_by_school, routed_by_school, correction_factors,
        median_income_by_block_group, daily_station_temps, station_temp_on_fetch_date,
        SYNTHETIC_STATION_YEARS,
    )
    return classified_by_school, summary
