import hashlib

from pipeline.config import (
    BASELINE_C,
    BUS_NOT_NEEDED_MAX_EXCESS_MI,
    EQUIVALENT_MINUTES_REFERENCE_C,
    FETCH_HOURS,
    SCHOOL_DAYS_PER_YEAR,
    THRESHOLD_DOSE_C_MIN,
    WALK_SPEED_MPS,
)
from pipeline.fixture_geometry import block_heat_factor, school_lonlat
from pipeline.geo_distance import distance_km
from pipeline.fixture_temps import CANONICAL_HOUR, HOUR_OFFSET_C, ORLANDO_SPREAD_C

MI_PER_KM = 0.621371


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


def _classify(routes: dict) -> str:
    if routes["shortest"]["dose"] <= THRESHOLD_DOSE_C_MIN:
        return "green"
    if routes["coolest"]["dose"] <= THRESHOLD_DOSE_C_MIN:
        return "yellow"
    return "red"


def _reason(block_class: str, routes: dict) -> str:
    coolest = routes["coolest"]
    if block_class == "red":
        return (
            f"Coolest route mean {coolest['mean_c']:.1f}C exceeds threshold "
            f"({THRESHOLD_DOSE_C_MIN:.0f} C-min dose, actual {coolest['dose']:.0f})."
        )
    if block_class == "yellow":
        return (
            f"Shortest route exceeds threshold, but coolest route mean {coolest['mean_c']:.1f}C "
            f"stays under it (dose {coolest['dose']:.0f})."
        )
    return f"Shortest route already under threshold (dose {routes['shortest']['dose']:.0f})."


def _safe_until_hour(block: dict, distance_km_value: float, block_class: str) -> str | None:
    if block_class != "red":
        return None
    previous_hour = None
    for hhmm in FETCH_HOURS:
        routes = _route_stats(block, distance_km_value, hhmm)
        if routes["coolest"]["dose"] > THRESHOLD_DOSE_C_MIN:
            return previous_hour
        previous_hour = hhmm
    return None


def classify_blocks(blocks: list[dict], schools: list[dict]) -> list[dict]:
    classified: list[dict] = []
    for block in blocks:
        school, km = _nearest_school(block, schools)
        routes = _route_stats(block, km, CANONICAL_HOUR)
        block_class = _classify(routes)
        distance_mi = km * MI_PER_KM
        status_now = "walk" if distance_mi <= school["walk_radius_mi"] else "bus"
        status_rec = {"green": "walk", "yellow": "reroute", "red": "bus_eligible"}[block_class]
        kids_est = 5 + int(_seeded_unit("kids", block["col"], block["row"]) * 40)

        classified.append({
            "block_id": block["block_id"],
            "school_id": school["id"],
            "kids_est": kids_est,
            "class": block_class,
            "shortest": routes["shortest"],
            "coolest": routes["coolest"],
            "delta_mean_c": round(routes["coolest"]["mean_c"] - routes["shortest"]["mean_c"], 2),
            "delta_dose_pct": (
                round((routes["coolest"]["dose"] - routes["shortest"]["dose"]) / routes["shortest"]["dose"] * 100)
                if routes["shortest"]["dose"] > 0
                else 0
            ),
            "status_now": status_now,
            "status_rec": status_rec,
            "reason": _reason(block_class, routes),
            "safe_until_hour": _safe_until_hour(block, km, block_class),
            "distance_mi": round(distance_mi, 3),
            "polygon": block["polygon"],
        })
    return classified


def _dose_equivalent_radius_mi(school_blocks: list[dict]) -> float:
    under_threshold = [b["distance_mi"] for b in school_blocks if b["class"] != "red"]
    return round(max(under_threshold), 3) if under_threshold else 0.0


def _estimate_exceedance_days_per_year(coolest_dose: float) -> float:
    excess_ratio = coolest_dose / THRESHOLD_DOSE_C_MIN
    return round(min(SCHOOL_DAYS_PER_YEAR, SCHOOL_DAYS_PER_YEAR * (1.0 - 1.0 / excess_ratio)), 1)


def build_summary(classified_blocks: list[dict], schools: list[dict], correction_factors: dict[str, float | None]) -> dict:
    summary: dict[str, dict] = {}
    for school in schools:
        school_blocks = [b for b in classified_blocks if b["school_id"] == school["id"]]
        walk_blocks = [b for b in school_blocks if b["status_now"] == "walk"]

        in_walk_zone = sum(b["kids_est"] for b in walk_blocks)
        reroute_enough = sum(b["kids_est"] for b in walk_blocks if b["class"] == "yellow")
        no_safe_route = sum(b["kids_est"] for b in walk_blocks if b["class"] == "red")
        red_walk_blocks = [b for b in walk_blocks if b["class"] == "red"]

        bus_not_needed = sum(
            b["kids_est"] for b in school_blocks
            if b["status_now"] == "bus" and b["class"] == "green"
            and (b["distance_mi"] - school["walk_radius_mi"]) <= BUS_NOT_NEEDED_MAX_EXCESS_MI
        )

        if red_walk_blocks:
            avg_eliminated = sum(
                b["shortest"]["dose"] - b["coolest"]["dose"] for b in red_walk_blocks
            ) / len(red_walk_blocks)
            avg_exceedance_days = sum(
                _estimate_exceedance_days_per_year(b["coolest"]["dose"]) for b in red_walk_blocks
            ) / len(red_walk_blocks)
        else:
            avg_eliminated = 0.0
            avg_exceedance_days = 0.0

        summary[school["id"]] = {
            "in_walk_zone": in_walk_zone,
            "reroute_enough": reroute_enough,
            "no_safe_route": no_safe_route,
            "lowest_income_quartile": round(no_safe_route * 0.4),
            "misclassified": {"bus_not_needed": bus_not_needed, "walk_should_bus": no_safe_route},
            "dose_eliminated_per_child_per_day": round(avg_eliminated, 1),
            "dose_eliminated_per_child_per_year": round(avg_eliminated * SCHOOL_DAYS_PER_YEAR, 1),
            "equivalent_minutes_at_42c": (
                round(avg_eliminated / (EQUIVALENT_MINUTES_REFERENCE_C - BASELINE_C), 1) if avg_eliminated else 0.0
            ),
            "correction_factor": correction_factors[school["id"]],
            "radius_setara_dosis_mi": _dose_equivalent_radius_mi(school_blocks),
            "radius_kebijakan_mi": school["walk_radius_mi"],
            "days_exceedance_per_year": round(avg_exceedance_days, 1),
        }
    return summary
