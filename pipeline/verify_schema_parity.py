import json
from pathlib import Path

from pipeline.config import DATA_FIXTURES_DIR, DATA_OUT_DIR


def _load(path: Path) -> dict | list:
    return json.loads(path.read_text(encoding="utf-8"))


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

    fixture_district = _load(DATA_FIXTURES_DIR / "district_blocks.geojson")
    real_district = _load(DATA_OUT_DIR / "district_blocks.geojson")
    _shape_diff("district_blocks.geojson", _key_shape(fixture_district), _key_shape(real_district), diffs)

    fixture_district_hours = _load(DATA_FIXTURES_DIR / "district_blocks_hours.json")
    real_district_hours = _load(DATA_OUT_DIR / "district_blocks_hours.json")
    fixture_hours_record = next(iter(fixture_district_hours.values()))
    real_hours_record = next(iter(real_district_hours.values()))
    _shape_diff(
        "district_blocks_hours.json[record]",
        _key_shape(fixture_hours_record),
        _key_shape(real_hours_record),
        diffs,
    )

    errors.extend(f"paritas skema fixture vs asli: {diff}" for diff in diffs)
