from pipeline.config import DATA_OUT_DIR, SCHOOL_SELECTION_BBOX, SCHOOL_SELECTION_TILE_ID
from pipeline.nces_schools import build_schools_payload
from pipeline.write_out import write_json


def main() -> None:
    schools = build_schools_payload(SCHOOL_SELECTION_TILE_ID, SCHOOL_SELECTION_BBOX)
    write_json(DATA_OUT_DIR / "schools.json", schools)

    counts_by_level: dict[str, int] = {}
    for school in schools:
        counts_by_level[school["level"]] = counts_by_level.get(school["level"], 0) + 1

    print(f"\nschools.json: {len(schools)} sekolah teranalisis di {SCHOOL_SELECTION_TILE_ID}")
    for level, count in sorted(counts_by_level.items()):
        print(f"  {level:12s} {count}")


if __name__ == "__main__":
    main()
