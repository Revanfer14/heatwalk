from pipeline.config import (
    BASELINE_C,
    DATA_OUT_DIR,
    DISMISSAL_HHMM,
    LAMBDA_DETOUR_CANDIDATES,
    MORNING_HHMM,
    PHOENIX_AOI_BBOX_PROVISIONAL,
    WALK_SPEED_MPS,
)
from pipeline.fixture_classify import build_summary, classify_blocks
from pipeline.fixture_geometry import (
    SCHOOLS_FIXTURE,
    build_block_grid,
    build_edges,
    build_nodes,
    school_lonlat,
)
from pipeline.write_out import mirror_to_web, write_json

FIXTURE_DATE = "2026-08-18"
FIXTURE_LAMBDA = LAMBDA_DETOUR_CANDIDATES[1]


def build_graph_payload(hhmm: str) -> dict:
    return {
        "meta": {
            "aoi_bbox": list(PHOENIX_AOI_BBOX_PROVISIONAL),
            "date": FIXTURE_DATE,
            "hour": hhmm,
            "baseline_c": BASELINE_C,
            "walk_speed_mps": WALK_SPEED_MPS,
            "lambda_detour": FIXTURE_LAMBDA,
            "source": "FIXTURE — synthetic, bukan data FortyGuard asli",
        },
        "nodes": build_nodes(),
        "edges": build_edges(hhmm),
    }


def build_schools_payload(classified_blocks: list[dict]) -> list[dict]:
    schools_payload = []
    for school in SCHOOLS_FIXTURE:
        enrollment = sum(b["kids_est"] for b in classified_blocks if b["school_id"] == school["id"])
        lonlat = school_lonlat(school)
        schools_payload.append({
            "id": school["id"],
            "name": school["name"],
            "level": school["level"],
            "enrollment": enrollment,
            "walk_radius_mi": school["walk_radius_mi"],
            "lon": lonlat[0],
            "lat": lonlat[1],
            "policy_source": school["policy_source"],
        })
    return schools_payload


def build_blocks_geojson(classified_blocks: list[dict]) -> dict:
    features = []
    for block in classified_blocks:
        properties = {k: v for k, v in block.items() if k != "polygon"}
        features.append({
            "type": "Feature",
            "geometry": {"type": "Polygon", "coordinates": block["polygon"]},
            "properties": properties,
        })
    return {"type": "FeatureCollection", "features": features}


def main() -> None:
    blocks = build_block_grid()
    classified_blocks = classify_blocks(blocks, SCHOOLS_FIXTURE)

    write_json(DATA_OUT_DIR / f"graph.{MORNING_HHMM.replace(':', '')}.json", build_graph_payload(MORNING_HHMM))
    write_json(DATA_OUT_DIR / f"graph.{DISMISSAL_HHMM.replace(':', '')}.json", build_graph_payload(DISMISSAL_HHMM))
    write_json(DATA_OUT_DIR / "blocks.geojson", build_blocks_geojson(classified_blocks))
    write_json(DATA_OUT_DIR / "schools.json", build_schools_payload(classified_blocks))
    write_json(DATA_OUT_DIR / "summary.json", build_summary(classified_blocks, SCHOOLS_FIXTURE))

    copied = mirror_to_web()

    class_counts = {"green": 0, "yellow": 0, "red": 0}
    for block in classified_blocks:
        class_counts[block["class"]] += 1

    print(f"blocks: {len(classified_blocks)} total -> {class_counts}")
    print(f"schools: {len(SCHOOLS_FIXTURE)}")
    print(f"files copied to web/public/data: {len(copied)}")

    if class_counts["red"] == 0:
        raise RuntimeError("Kategori merah kosong — kalibrasi fixture salah, lihat FR-8.")
    if class_counts["green"] == 0 or class_counts["yellow"] == 0:
        raise RuntimeError("Salah satu kategori kosong — distribusi tidak boleh degenerate.")


if __name__ == "__main__":
    main()
