import json
import re
import sys
from pathlib import Path

from pipeline import classification
from pipeline.config import DATA_FIXTURES_DIR, DATA_OUT_DIR

REASON_HAS_DIGIT = re.compile(r"\d")


def _load(path: Path) -> dict | list:
    return json.loads(path.read_text(encoding="utf-8"))


def _load_blocks_by_school(base_dir: Path, school_ids: list[str]) -> dict[str, list[dict]]:
    blocks_by_school: dict[str, list[dict]] = {}
    for school_id in school_ids:
        geojson = _load(base_dir / "by_school" / school_id / "blocks.geojson")
        blocks_by_school[school_id] = [feature["properties"] for feature in geojson["features"]]
    return blocks_by_school


def check_red_not_empty(blocks_by_school: dict[str, list[dict]], errors: list[str]) -> None:
    total_red = sum(1 for blocks in blocks_by_school.values() for block in blocks if block["class"] == "red")
    if total_red < 1:
        errors.append("Kategori merah kosong di seluruh sekolah — regresi dari G1, berhenti dan lapor")


def check_yellow_empty_is_reported(blocks_by_school: dict[str, list[dict]], notes: list[str]) -> None:
    all_blocks = [block for blocks in blocks_by_school.values() for block in blocks]
    total_yellow = sum(1 for block in all_blocks if block["class"] == "yellow")
    if total_yellow == 0:
        zero_delta = sum(1 for block in all_blocks if block["delta_mean_c"] == 0.0)
        notes.append(
            f"kategori kuning kosong (0 blok) — {zero_delta}/{len(all_blocks)} blok punya "
            "delta_mean_c=0.000, lihat docs/METHODOLOGY.md"
        )
    else:
        notes.append(f"kategori kuning: {total_yellow} blok")


def check_geojson_property_keys(blocks_by_school: dict[str, list[dict]], errors: list[str]) -> None:
    expected = set(classification.BLOCK_PROPERTY_KEYS)
    for school_id, blocks in blocks_by_school.items():
        for block in blocks:
            if set(block.keys()) != expected:
                errors.append(f"{school_id}/{block['block_id']}: kunci properti tidak cocok BLOCK_PROPERTY_KEYS")
                return


def check_red_reason_has_number(blocks_by_school: dict[str, list[dict]], errors: list[str]) -> None:
    for school_id, blocks in blocks_by_school.items():
        for block in blocks:
            if block["class"] != "red":
                continue
            reason = block.get("reason", "")
            if not reason or not REASON_HAS_DIGIT.search(reason):
                errors.append(f"{school_id}/{block['block_id']}: reason kosong atau tanpa angka konkret")


def check_kids_sum_matches_in_walk_zone(
    schools: list[dict], summary: dict, blocks_by_school: dict[str, list[dict]], errors: list[str]
) -> None:
    for school in schools:
        school_id = school["id"]
        walk_kids = sum(block["kids_est"] for block in blocks_by_school[school_id] if block["status_now"] == "walk")
        in_walk_zone = summary[school_id]["in_walk_zone"]
        if walk_kids != in_walk_zone:
            errors.append(
                f"{school_id}: sum(kids_est) blok walk = {walk_kids}, summary.in_walk_zone = {in_walk_zone}"
            )


def check_reroute_and_no_safe_within_walk_zone(schools: list[dict], summary: dict, errors: list[str]) -> None:
    for school in schools:
        school_id = school["id"]
        row = summary[school_id]
        if row["reroute_enough"] + row["no_safe_route"] > row["in_walk_zone"]:
            errors.append(
                f"{school_id}: reroute_enough + no_safe_route ({row['reroute_enough'] + row['no_safe_route']}) "
                f"> in_walk_zone ({row['in_walk_zone']})"
            )


def check_dose_radius_within_policy(schools: list[dict], summary: dict, errors: list[str]) -> None:
    for school in schools:
        school_id = school["id"]
        row = summary[school_id]
        radius = row["radius_setara_dosis_mi"]
        policy_radius = row["radius_kebijakan_mi"]
        if radius <= 0:
            errors.append(f"{school_id}: radius_setara_dosis_mi harus > 0, dapat {radius}")
        if radius > policy_radius:
            errors.append(f"{school_id}: radius_setara_dosis_mi ({radius}) > radius_kebijakan_mi ({policy_radius})")


def check_blocks_hours_matches_geojson(
    school_ids: list[str], blocks_by_school: dict[str, list[dict]], errors: list[str]
) -> None:
    for school_id in school_ids:
        blocks_hours_payload = _load(DATA_OUT_DIR / "by_school" / school_id / "blocks_hours.json")
        geojson_block_ids = {block["block_id"] for block in blocks_by_school[school_id]}
        blocks_hours_ids = set(blocks_hours_payload.keys())
        if blocks_hours_ids != geojson_block_ids:
            errors.append(f"{school_id}: block_id blocks_hours.json tidak cocok satu-satu dengan blocks.geojson")


def check_blocks_hours_record_shape(base_dir: Path, schools: list[dict], errors: list[str]) -> None:
    expected_hour_record_keys = {"shortest", "coolest", "class"}
    for school in schools:
        payload = _load(base_dir / "by_school" / school["id"] / "blocks_hours.json")
        for block_id, by_hour in payload.items():
            for hour, record in by_hour.items():
                if set(record.keys()) != expected_hour_record_keys:
                    errors.append(
                        f"{base_dir.name}/{school['id']}/{block_id}/{hour}: kunci blocks_hours record "
                        f"tidak cocok {expected_hour_record_keys}"
                    )
                    return


def check_tiles_status(errors: list[str]) -> None:
    tiles = _load(DATA_OUT_DIR / "tiles.json")
    for tile in tiles:
        if tile["status"] == "done" and not tile.get("hours_fetched"):
            errors.append(f"tile {tile['id']}: status=done tapi hours_fetched kosong")


def _key_shape(value: object) -> object:
    if isinstance(value, dict):
        return {key: _key_shape(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_key_shape(value[0])] if value else []
    return None


def _shape_diff(path: str, fixture_shape: object, real_shape: object, diffs: list[str]) -> None:
    if isinstance(fixture_shape, dict) and isinstance(real_shape, dict):
        fixture_keys, real_keys = set(fixture_shape), set(real_shape)
        for key in sorted(fixture_keys - real_keys):
            diffs.append(f"{path}.{key} hanya ada di fixture")
        for key in sorted(real_keys - fixture_keys):
            diffs.append(f"{path}.{key} hanya ada di data asli")
        for key in fixture_keys & real_keys:
            _shape_diff(f"{path}.{key}", fixture_shape[key], real_shape[key], diffs)
    elif isinstance(fixture_shape, list) and isinstance(real_shape, list):
        if fixture_shape and real_shape:
            _shape_diff(f"{path}[]", fixture_shape[0], real_shape[0], diffs)


def check_fixture_schema_parity(schools: list[dict], errors: list[str]) -> None:
    if not DATA_FIXTURES_DIR.exists():
        errors.append("data/fixtures/ tidak ada — jalankan `python -m pipeline.make_fixtures` dulu")
        return

    diffs: list[str] = []
    fixture_schools = _load(DATA_FIXTURES_DIR / "schools.json")
    real_schools = _load(DATA_OUT_DIR / "schools.json")
    _shape_diff("schools.json", _key_shape(fixture_schools), _key_shape(real_schools), diffs)

    fixture_summary = _load(DATA_FIXTURES_DIR / "summary.json")
    real_summary = _load(DATA_OUT_DIR / "summary.json")
    fixture_summary_record = next(iter(fixture_summary.values()))
    real_summary_record = next(iter(real_summary.values()))
    _shape_diff("summary.json[record]", _key_shape(fixture_summary_record), _key_shape(real_summary_record), diffs)

    school_ids = [school["id"] for school in schools]
    for school_id in school_ids:
        relative_path = f"by_school/{school_id}/blocks.geojson"
        fixture_geojson = _load(DATA_FIXTURES_DIR / relative_path)
        real_geojson = _load(DATA_OUT_DIR / relative_path)
        _shape_diff(relative_path, _key_shape(fixture_geojson), _key_shape(real_geojson), diffs)

    errors.extend(f"paritas skema fixture vs asli: {diff}" for diff in diffs)


def main() -> int:
    schools = _load(DATA_OUT_DIR / "schools.json")
    summary = _load(DATA_OUT_DIR / "summary.json")
    school_ids = [school["id"] for school in schools]
    blocks_by_school = _load_blocks_by_school(DATA_OUT_DIR, school_ids)

    errors: list[str] = []
    notes: list[str] = []

    check_red_not_empty(blocks_by_school, errors)
    check_yellow_empty_is_reported(blocks_by_school, notes)
    check_geojson_property_keys(blocks_by_school, errors)
    check_red_reason_has_number(blocks_by_school, errors)
    check_kids_sum_matches_in_walk_zone(schools, summary, blocks_by_school, errors)
    check_reroute_and_no_safe_within_walk_zone(schools, summary, errors)
    check_dose_radius_within_policy(schools, summary, errors)
    check_tiles_status(errors)
    check_fixture_schema_parity(schools, errors)
    check_blocks_hours_matches_geojson(school_ids, blocks_by_school, errors)
    check_blocks_hours_record_shape(DATA_OUT_DIR, schools, errors)
    if DATA_FIXTURES_DIR.exists():
        check_blocks_hours_record_shape(DATA_FIXTURES_DIR, schools, errors)

    print(f"sekolah diperiksa: {len(schools)}")
    for note in notes:
        print(f"CATATAN: {note}")

    if errors:
        print(f"\nGAGAL - {len(errors)} masalah:")
        for error in errors:
            print(f"  - {error}")
        return 1

    print("\nSemua verifikasi Fase 4 lulus.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
