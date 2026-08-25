import json
import sys
from pathlib import Path

from pipeline import contrast_report
from pipeline.config import CONTRAST_REPORT_TOP_N, DATA_INTERIM_DIR, DATA_OUT_DIR, DETOUR_CAP_RATIO

ROUTES_DIR = DATA_INTERIM_DIR / "routes"
DETOUR_TOLERANCE = 1e-6
LEN_M_TOLERANCE = 1e-3

DOSE_CURVE_WOBBLE_FRACTION_OF_THRESHOLD = 0.15


def _load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def _unimodal_violation(values: list[float], hours: list[str]) -> tuple[tuple[str, str], float] | None:
    peak = max(range(len(values)), key=lambda i: values[i])
    for i in range(peak):
        if values[i] > values[i + 1]:
            return (hours[i], hours[i + 1]), values[i] - values[i + 1]
    for i in range(peak, len(values) - 1):
        if values[i + 1] > values[i]:
            return (hours[i], hours[i + 1]), values[i + 1] - values[i]
    return None


def check_g1_gate(routed_by_school: dict[str, dict], errors: list[str]) -> int:
    total_red = 0
    for school_id, routed in routed_by_school.items():
        canonical_hour = routed["meta"]["canonical_hour"]
        threshold = routed["meta"]["threshold"]
        total_red += sum(
            1
            for record in routed["blocks"].values()
            if record["coolest"]["by_hour"][canonical_hour]["dose"] > threshold
        )
    if total_red < 1:
        errors.append("G1 GAGAL: nol blok merah pada jam kanonik di seluruh sekolah")
    return total_red


def check_all_hours_routed(school_id: str, routed: dict, errors: list[str]) -> None:
    hours = set(routed["meta"]["hours"])
    for block_id, record in routed["blocks"].items():
        if set(record["shortest"]["by_hour"]) != hours:
            errors.append(f"{school_id}/{block_id}: rute terpendek tidak lengkap di seluruh meta.hours")
        if set(record["coolest"]["by_hour"]) != hours:
            errors.append(f"{school_id}/{block_id}: rute teradem tidak lengkap di seluruh meta.hours")


def check_coolest_never_shorter_and_detour_cap(school_id: str, routed: dict, errors: list[str]) -> None:
    for block_id, record in routed["blocks"].items():
        shortest_len_m = record["shortest"]["len_m"]
        for hour, coolest_hour in record["coolest"]["by_hour"].items():
            if coolest_hour["len_m"] < shortest_len_m - LEN_M_TOLERANCE:
                errors.append(
                    f"{school_id}/{block_id}@{hour}: rute teradem ({coolest_hour['len_m']}m) lebih pendek "
                    f"dari rute terpendek ({shortest_len_m}m)"
                )
            if coolest_hour["detour_ratio"] > DETOUR_CAP_RATIO + DETOUR_TOLERANCE:
                errors.append(
                    f"{school_id}/{block_id}@{hour}: detour_ratio {coolest_hour['detour_ratio']} > "
                    f"cap {DETOUR_CAP_RATIO}"
                )


def check_dose_curve_shape(school_id: str, routed: dict, errors: list[str]) -> None:
    hours = routed["meta"]["hours"]
    threshold = routed["meta"]["threshold"]
    tolerance = DOSE_CURVE_WOBBLE_FRACTION_OF_THRESHOLD * threshold

    for block_id, record in routed["blocks"].items():
        sequence = [record["shortest"]["by_hour"][hour]["dose"] for hour in hours]
        violation = _unimodal_violation(sequence, hours)
        if violation is not None and violation[1] > tolerance:
            (hour_a, hour_b), magnitude = violation
            errors.append(
                f"{school_id}/{block_id}: dosis melonjak {magnitude:.2f} C-menit lalu balik normal di "
                f"({hour_a}, {hour_b}), melewati toleransi wobble {tolerance:.1f} C-menit "
                f"({DOSE_CURVE_WOBBLE_FRACTION_OF_THRESHOLD:.0%} threshold) — indikasi raster jam tertukar"
            )


def check_contrast_report(routed_by_school: dict[str, dict], errors: list[str], notes: list[str]) -> None:
    csv_path = DATA_OUT_DIR / "contrast_report.csv"
    if not csv_path.exists():
        errors.append("contrast_report.csv tidak ada")
        return

    lines = csv_path.read_text(encoding="utf-8").strip().splitlines()
    header = lines[0].split(",")
    if tuple(header) != contrast_report.CONTRAST_REPORT_COLUMNS:
        errors.append(f"contrast_report.csv header tidak cocok kontrak: {header}")

    all_rows = contrast_report.build_all_rows(routed_by_school)
    expected_row_count = min(CONTRAST_REPORT_TOP_N, len(all_rows))
    actual_row_count = len(lines) - 1
    if actual_row_count != expected_row_count:
        errors.append(
            f"contrast_report.csv berisi {actual_row_count} baris, diharap {expected_row_count} "
            f"(top-{CONTRAST_REPORT_TOP_N} dari {len(all_rows)} pasangan OD yang tersedia)"
        )
    notes.append(f"contrast_report: {len(all_rows)} pasangan OD tersedia, {expected_row_count} ditulis ke CSV")


def check_radius_g2(schools: list[dict], summary: dict, errors: list[str]) -> None:
    for school in schools:
        school_summary = summary.get(school["id"], {})
        radius = school_summary.get("radius_setara_dosis_mi")
        policy_radius = school_summary.get("radius_kebijakan_mi")
        if radius is None or policy_radius is None:
            errors.append(f"{school['id']}: radius_setara_dosis_mi/radius_kebijakan_mi belum ada di summary.json")
            continue
        if radius <= 0:
            errors.append(f"{school['id']}: radius_setara_dosis_mi harus > 0, dapat {radius}")
        if radius > policy_radius:
            errors.append(
                f"{school['id']}: radius_setara_dosis_mi ({radius}) > radius_kebijakan_mi ({policy_radius}) "
                "— cek bug tanda di weight_cool atau clamp dosis"
            )


def check_block_school_membership(schools: list[dict], routed_by_school: dict[str, dict], errors: list[str]) -> None:
    school_ids = {school["id"] for school in schools}
    for school_id, routed in routed_by_school.items():
        if routed["meta"]["school_id"] not in school_ids:
            errors.append(f"{school_id}: meta.school_id tidak ada di schools.json")


def main() -> int:
    schools = _load(DATA_OUT_DIR / "schools.json")
    summary = _load(DATA_OUT_DIR / "summary.json")

    errors: list[str] = []
    notes: list[str] = []

    routed_by_school: dict[str, dict] = {}
    for school in schools:
        school_id = school["id"]
        route_path = ROUTES_DIR / f"{school_id}.json"
        if not route_path.exists():
            errors.append(f"{school_id}: data/interim/routes/{school_id}.json tidak ada — jalankan step3_routes dulu")
            continue
        routed_by_school[school_id] = _load(route_path)

    if errors:
        print("\nGAGAL - routing belum lengkap:")
        for error in errors:
            print(f"  - {error}")
        return 1

    total_red = check_g1_gate(routed_by_school, errors)
    notes.append(f"G1: {total_red} blok merah pada jam kanonik di seluruh sekolah")

    for school_id, routed in routed_by_school.items():
        check_all_hours_routed(school_id, routed, errors)
        check_coolest_never_shorter_and_detour_cap(school_id, routed, errors)
        check_dose_curve_shape(school_id, routed, errors)

    check_contrast_report(routed_by_school, errors, notes)
    check_radius_g2(schools, summary, errors)
    check_block_school_membership(schools, routed_by_school, errors)

    print(f"sekolah diperiksa: {len(schools)}")
    for note in notes:
        print(f"CATATAN: {note}")

    if errors:
        print(f"\nGAGAL - {len(errors)} masalah:")
        for error in errors:
            print(f"  - {error}")
        return 1

    print("\nSemua verifikasi Fase 3 lulus.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
