import json

from pipeline import contrast_report, dose_radius, exceedance
from pipeline.config import (
    BASELINE_C,
    CONTRAST_REPORT_TOP_N,
    DATA_INTERIM_DIR,
    DATA_OUT_DIR,
    EQUIVALENT_MINUTES_REFERENCE_C,
    EXCEEDANCE_STATION_ICAO,
    EXCEEDANCE_STATION_END_DATE,
    EXCEEDANCE_STATION_START_DATE,
    FETCH_DATE,
    SCHOOL_DAYS_PER_YEAR,
    TILES,
)

ROUTES_DIR = DATA_INTERIM_DIR / "routes"


def load_routed_schools(school_ids: list[str]) -> dict[str, dict]:
    return {
        school_id: json.loads((ROUTES_DIR / f"{school_id}.json").read_text(encoding="utf-8"))
        for school_id in school_ids
    }


def red_blocks_at_canonical_hour(routed: dict) -> list[dict]:
    canonical_hour = routed["meta"]["canonical_hour"]
    threshold = routed["meta"]["threshold"]
    return [
        record
        for record in routed["blocks"].values()
        if record["coolest"]["by_hour"][canonical_hour]["dose"] > threshold
    ]


def g1_red_block_counts(routed_by_school: dict[str, dict]) -> tuple[dict[str, int], int]:
    per_school = {
        school_id: len(red_blocks_at_canonical_hour(routed)) for school_id, routed in routed_by_school.items()
    }
    return per_school, sum(per_school.values())


def g3_dose_eliminated(routed: dict) -> dict:
    canonical_hour = routed["meta"]["canonical_hour"]
    red_blocks = red_blocks_at_canonical_hour(routed)
    if not red_blocks:
        return {"dose_eliminated_per_child_per_day": 0.0, "dose_eliminated_per_child_per_year": 0.0, "equivalent_minutes_at_42c": 0.0}

    eliminated = [
        record["shortest"]["by_hour"][canonical_hour]["dose"] - record["coolest"]["by_hour"][canonical_hour]["dose"]
        for record in red_blocks
    ]
    avg_eliminated = sum(eliminated) / len(eliminated)
    return {
        "dose_eliminated_per_child_per_day": round(avg_eliminated, 1),
        "dose_eliminated_per_child_per_year": round(avg_eliminated * SCHOOL_DAYS_PER_YEAR, 1),
        "equivalent_minutes_at_42c": round(avg_eliminated / (EQUIVALENT_MINUTES_REFERENCE_C - BASELINE_C), 1),
    }


def g9_days_exceedance(routed: dict, daily_station_temps: dict[str, float], station_temp_on_fetch_date: float, n_years: int) -> float:
    canonical_hour = routed["meta"]["canonical_hour"]
    threshold = routed["meta"]["threshold"]
    red_blocks = red_blocks_at_canonical_hour(routed)
    if not red_blocks:
        return 0.0

    per_block_days = []
    for record in red_blocks:
        coolest = record["coolest"]["by_hour"][canonical_hour]
        offset_c = exceedance.spatial_offset_c(coolest["mean_c"], station_temp_on_fetch_date)
        per_block_days.append(
            exceedance.days_exceedance_per_year(daily_station_temps, offset_c, coolest["len_m"], threshold, n_years)
        )
    return round(sum(per_block_days) / len(per_block_days), 1)


def first_exceedance_hour_by_block(routed: dict) -> dict[str, str | None]:
    threshold = routed["meta"]["threshold"]
    result: dict[str, str | None] = {}
    for block_id, record in routed["blocks"].items():
        first_hour = None
        for hour in routed["meta"]["hours"]:
            hour_stats = record["coolest"]["by_hour"].get(hour)
            if hour_stats and hour_stats["dose"] > threshold:
                first_hour = hour
                break
        result[block_id] = first_hour
    return result


def main() -> None:
    schools = json.loads((DATA_OUT_DIR / "schools.json").read_text(encoding="utf-8"))
    tile = TILES[0]

    routed_by_school = load_routed_schools([school["id"] for school in schools])
    canonical_hour = next(iter(routed_by_school.values()))["meta"]["canonical_hour"]

    per_school_red, total_red = g1_red_block_counts(routed_by_school)
    print(f"\nG1 — blok merah pada jam kanonik: total {total_red}")
    for school_id, count in per_school_red.items():
        print(f"  {school_id:32s} {count}")

    print("\nG7 — jam paling awal blok merah melewati ambang:")
    for school_id, routed in routed_by_school.items():
        first_hours = [hour for hour in first_exceedance_hour_by_block(routed).values() if hour is not None]
        if not first_hours:
            print(f"  {school_id:32s} tidak ada blok merah")
            continue
        distribution: dict[str, int] = {}
        for hour in first_hours:
            distribution[hour] = distribution.get(hour, 0) + 1
        print(f"  {school_id:32s} earliest={min(first_hours)} distribusi={distribution}")

    daily_station_temps = exceedance.station_temp_at_local_hour_by_date(
        EXCEEDANCE_STATION_ICAO, EXCEEDANCE_STATION_START_DATE, EXCEEDANCE_STATION_END_DATE,
        tile["timezone"], canonical_hour,
    )
    station_temp_on_fetch_date = daily_station_temps[FETCH_DATE]
    n_years = exceedance.school_years_spanned(daily_station_temps, tile["timezone"])

    all_contrast_rows = contrast_report.build_all_rows(routed_by_school)
    top_rows = contrast_report.top_n_by_abs_delta(all_contrast_rows, CONTRAST_REPORT_TOP_N)
    contrast_report.write_csv(DATA_OUT_DIR / "contrast_report.csv", top_rows)

    deltas = [row["delta_mean_c"] for row in all_contrast_rows]
    print(
        f"\nG8 — kontras rute, {len(all_contrast_rows)} pasangan OD pada jam kanonik: "
        f"delta_mean_c min={min(deltas):.3f} max={max(deltas):.3f} rata2={sum(deltas)/len(deltas):.3f}"
    )

    print("\nG2/G3/G9 per sekolah (diagnostik konsol, ditulis ke summary.json oleh step5_export):")
    for school in schools:
        school_id = school["id"]
        routed = routed_by_school[school_id]

        radius_literal = dose_radius.dose_equivalent_radius_mi(routed)
        g3 = g3_dose_eliminated(routed)
        days_exceedance = g9_days_exceedance(routed, daily_station_temps, station_temp_on_fetch_date, n_years)

        print(
            f"  {school_id:32s} radius_setara_dosis={radius_literal:.2f}mi/{school['walk_radius_mi']:.2f}mi "
            f"G3_dose_elim/day(routing-based)={g3['dose_eliminated_per_child_per_day']:.1f} "
            f"days_exceedance/yr={days_exceedance:.1f}"
        )


if __name__ == "__main__":
    main()
