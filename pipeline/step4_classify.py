import json

from pipeline import classification
from pipeline.config import DATA_INTERIM_DIR, DATA_OUT_DIR
from pipeline.write_out import write_json

ROUTES_DIR = DATA_INTERIM_DIR / "routes"
CLASSIFIED_DIR = DATA_INTERIM_DIR / "classified"


def _load_routed(school_id: str) -> dict:
    return json.loads((ROUTES_DIR / f"{school_id}.json").read_text(encoding="utf-8"))


def _route_leg(len_m: float, hour_stats: dict) -> dict:
    return {
        "len_m": len_m,
        "mean_c": hour_stats["mean_c"],
        "peak_c": hour_stats["peak_c"],
        "dose": hour_stats["dose"],
    }


def classify_school_blocks(school: dict, routed: dict) -> list[dict]:
    canonical_hour = routed["meta"]["canonical_hour"]
    threshold = routed["meta"]["threshold"]
    hours = routed["meta"]["hours"]
    walk_radius_mi = school["walk_radius_mi"]

    classified: list[dict] = []
    for block_id, record in routed["blocks"].items():
        shortest_hour = record["shortest"]["by_hour"][canonical_hour]
        coolest_hour = record["coolest"]["by_hour"][canonical_hour]
        shortest = _route_leg(record["shortest"]["len_m"], shortest_hour)
        coolest = _route_leg(coolest_hour["len_m"], coolest_hour)

        block_class = classification.classify(shortest["dose"], coolest["dose"], threshold)
        distance_mi = record["distance_mi"]
        status_now = classification.status_now_for(distance_mi, walk_radius_mi)

        delta_dose_pct = (
            round((coolest["dose"] - shortest["dose"]) / shortest["dose"] * 100)
            if shortest["dose"] > 0
            else 0
        )

        classified.append({
            "block_id": block_id,
            "school_id": school["id"],
            "kids_est": record["kids_est"],
            "class": block_class,
            "shortest": shortest,
            "coolest": coolest,
            "delta_mean_c": round(coolest["mean_c"] - shortest["mean_c"], 2),
            "delta_dose_pct": delta_dose_pct,
            "distance_mi": distance_mi,
            "status_now": status_now,
            "status_rec": classification.status_rec_for(block_class),
            "reason": classification.reason_for(block_class, shortest, coolest, threshold),
            "safe_until_hour": classification.safe_until_hour(
                record["coolest"]["by_hour"], hours, threshold, block_class
            ),
        })
    return classified


def main() -> None:
    schools = json.loads((DATA_OUT_DIR / "schools.json").read_text(encoding="utf-8"))

    CLASSIFIED_DIR.mkdir(parents=True, exist_ok=True)
    print("\nKlasifikasi FR-8 per sekolah (jam kanonik):")
    global_counts = {"green": 0, "yellow": 0, "red": 0}
    for school in schools:
        routed = _load_routed(school["id"])
        classified = classify_school_blocks(school, routed)
        write_json(CLASSIFIED_DIR / f"{school['id']}.json", classified)

        counts = {"green": 0, "yellow": 0, "red": 0}
        for block in classified:
            counts[block["class"]] += 1
            global_counts[block["class"]] += 1

        print(f"  {school['id']:32s} blocks={len(classified):4d} {counts}")

    print(f"\nGlobal: {global_counts}")


if __name__ == "__main__":
    main()
