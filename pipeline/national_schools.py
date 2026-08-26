import json
from pathlib import Path

import httpx

from pipeline.config import DATA_OUT_DIR, DATA_RAW_DIR
from pipeline.nces_schools import NCES_ADMIN_QUERY_URL
from pipeline.write_out import mirror_to_web, write_json

NATIONAL_CACHE_PATH = DATA_RAW_DIR / "nces_ccd_national.json"
PAGE_SIZE = 2000
COORDINATE_DECIMALS = 4


def _query_national_page(result_offset: int) -> tuple[list[dict], bool]:
    params = {
        "where": "1=1",
        "outFields": "NCESSCH,SCH_NAME,LATCOD,LONCOD",
        "returnGeometry": "false",
        "resultOffset": result_offset,
        "resultRecordCount": PAGE_SIZE,
        "f": "json",
    }
    response = httpx.get(NCES_ADMIN_QUERY_URL, params=params, timeout=60.0)
    response.raise_for_status()
    body = response.json()
    features = [feature["attributes"] for feature in body.get("features", [])]
    exceeded_transfer_limit = bool(body.get("exceededTransferLimit", False))
    return features, exceeded_transfer_limit


def _fetch_all_national_schools_live() -> list[dict]:
    all_rows: list[dict] = []
    result_offset = 0
    while True:
        page_rows, exceeded_transfer_limit = _query_national_page(result_offset)
        all_rows.extend(page_rows)
        print(f"  page offset={result_offset:>7} rows={len(page_rows):>5} total={len(all_rows):>7}")
        if not page_rows or (not exceeded_transfer_limit and len(page_rows) < PAGE_SIZE):
            break
        result_offset += len(page_rows)
    return all_rows


def query_national_schools_cached() -> list[dict]:
    if NATIONAL_CACHE_PATH.exists():
        return json.loads(NATIONAL_CACHE_PATH.read_text(encoding="utf-8"))

    raw_rows = _fetch_all_national_schools_live()
    DATA_RAW_DIR.mkdir(parents=True, exist_ok=True)
    NATIONAL_CACHE_PATH.write_text(json.dumps(raw_rows), encoding="utf-8")
    return raw_rows


def _analyzed_nces_ids(schools: list[dict]) -> set[str]:
    return {school["nces_id"] for school in schools}


def build_national_schools_payload(raw_rows: list[dict], schools: list[dict]) -> list[dict]:
    analyzed_ids = _analyzed_nces_ids(schools)
    payload = []
    for row in raw_rows:
        nces_id = row.get("NCESSCH")
        lat = row.get("LATCOD")
        lon = row.get("LONCOD")
        name = row.get("SCH_NAME")
        if nces_id is None or lat is None or lon is None or name is None:
            continue
        payload.append(
            {
                "id": f"nces_{nces_id}",
                "name": name,
                "lon": round(lon, COORDINATE_DECIMALS),
                "lat": round(lat, COORDINATE_DECIMALS),
                "analyzed": nces_id in analyzed_ids,
            }
        )
    return payload


def _load_json(path: Path) -> list[dict]:
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> None:
    schools = _load_json(DATA_OUT_DIR / "schools.json")
    raw_rows = query_national_schools_cached()
    payload = build_national_schools_payload(raw_rows, schools)

    write_json(DATA_OUT_DIR / "schools_national.json", payload)
    copied = mirror_to_web()

    analyzed_count = sum(1 for row in payload if row["analyzed"])
    print(f"\nschools_national.json: {len(payload)} sekolah, {analyzed_count} teranalisis")
    print(f"files copied to web/public/data: {len(copied)}")


if __name__ == "__main__":
    main()
