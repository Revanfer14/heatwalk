import numpy as np

from pipeline import dose_radius
from pipeline.config import (
    BASELINE_C,
    BUS_NOT_NEEDED_MAX_EXCESS_MI,
    EQUIVALENT_MINUTES_REFERENCE_C,
    INCOME_QUARTILE_PERCENTILE,
    SCHOOL_DAYS_PER_YEAR,
)
from pipeline.exceedance import days_exceedance_per_year, spatial_offset_c

BLOCK_GROUP_GEOID_LENGTH = 12


def income_quartile_threshold(median_income_by_block_group: dict[str, int | None]) -> float | None:
    valid_incomes = [income for income in median_income_by_block_group.values() if income is not None]
    if not valid_incomes:
        return None
    return float(np.percentile(valid_incomes, INCOME_QUARTILE_PERCENTILE))


def _lowest_income_quartile_kids(
    red_walk_blocks: list[dict],
    median_income_by_block_group: dict[str, int | None],
    income_threshold: float | None,
) -> int:
    if income_threshold is None:
        return 0
    total = 0
    for block in red_walk_blocks:
        income = median_income_by_block_group.get(block["block_id"][:BLOCK_GROUP_GEOID_LENGTH])
        if income is not None and income <= income_threshold:
            total += block["kids_est"]
    return total


def _bus_not_needed_kids(school_blocks: list[dict], walk_radius_mi: float) -> int:
    return sum(
        block["kids_est"]
        for block in school_blocks
        if block["status_now"] == "bus"
        and block["class"] == "green"
        and (block["distance_mi"] - walk_radius_mi) <= BUS_NOT_NEEDED_MAX_EXCESS_MI
    )


def _days_exceedance_for_school(
    routed: dict,
    threshold: float,
    daily_station_temps: dict[str, float],
    station_temp_on_fetch_date: float,
    n_years: int,
) -> float:
    canonical_hour = routed["meta"]["canonical_hour"]
    red_blocks = [
        record
        for record in routed["blocks"].values()
        if record["coolest"]["by_hour"][canonical_hour]["dose"] > threshold
    ]
    if not red_blocks:
        return 0.0

    per_block_days = []
    for record in red_blocks:
        coolest = record["coolest"]["by_hour"][canonical_hour]
        offset_c = spatial_offset_c(coolest["mean_c"], station_temp_on_fetch_date)
        per_block_days.append(
            days_exceedance_per_year(daily_station_temps, offset_c, coolest["len_m"], threshold, n_years)
        )
    return round(sum(per_block_days) / len(per_block_days), 1)


def build_summary(
    schools: list[dict],
    classified_by_school: dict[str, list[dict]],
    routed_by_school: dict[str, dict],
    correction_factors: dict[str, float | None],
    median_income_by_block_group: dict[str, int | None],
    daily_station_temps: dict[str, float],
    station_temp_on_fetch_date: float,
    n_years: int,
) -> dict[str, dict]:
    income_threshold = income_quartile_threshold(median_income_by_block_group)

    summary: dict[str, dict] = {}
    for school in schools:
        school_id = school["id"]
        school_blocks = classified_by_school[school_id]
        walk_blocks = [block for block in school_blocks if block["status_now"] == "walk"]
        red_walk_blocks = [block for block in walk_blocks if block["class"] == "red"]

        in_walk_zone = sum(block["kids_est"] for block in walk_blocks)
        reroute_enough = sum(block["kids_est"] for block in walk_blocks if block["class"] == "yellow")
        no_safe_route = sum(block["kids_est"] for block in red_walk_blocks)

        if red_walk_blocks:
            avg_eliminated = sum(
                block["shortest"]["dose"] - block["coolest"]["dose"] for block in red_walk_blocks
            ) / len(red_walk_blocks)
        else:
            avg_eliminated = 0.0

        routed = routed_by_school[school_id]
        threshold = routed["meta"]["threshold"]

        summary[school_id] = {
            "in_walk_zone": in_walk_zone,
            "reroute_enough": reroute_enough,
            "no_safe_route": no_safe_route,
            "lowest_income_quartile": _lowest_income_quartile_kids(
                red_walk_blocks, median_income_by_block_group, income_threshold
            ),
            "misclassified": {
                "bus_not_needed": _bus_not_needed_kids(school_blocks, school["walk_radius_mi"]),
                "walk_should_bus": no_safe_route,
            },
            "dose_eliminated_per_child_per_day": round(avg_eliminated, 1),
            "dose_eliminated_per_child_per_year": round(avg_eliminated * SCHOOL_DAYS_PER_YEAR, 1),
            "equivalent_minutes_at_42c": (
                round(avg_eliminated / (EQUIVALENT_MINUTES_REFERENCE_C - BASELINE_C), 1) if avg_eliminated else 0.0
            ),
            "correction_factor": correction_factors[school_id],
            "radius_setara_dosis_mi": dose_radius.dose_equivalent_radius_mi(routed),
            "radius_kebijakan_mi": school["walk_radius_mi"],
            "days_exceedance_per_year": _days_exceedance_for_school(
                routed, threshold, daily_station_temps, station_temp_on_fetch_date, n_years
            ),
        }
    return summary
