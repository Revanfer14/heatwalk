from pipeline.config import DATA_OUT_DIR, FETCH_HOURS, TILES
from pipeline.fixture_classify import build_summary, classify_blocks
from pipeline.fixture_geometry import (
    SCHOOLS_FIXTURE,
    build_block_grid,
    build_edge_topology,
    build_nodes,
    school_lonlat,
)
from pipeline.fixture_temps import build_temps_payload
from pipeline.write_out import mirror_to_web, write_json

FIXTURE_TILE = TILES[0]

GEOJSON_PROPERTY_KEYS = (
    "block_id", "school_id", "kids_est", "class", "shortest", "coolest",
    "delta_mean_c", "delta_dose_pct", "distance_mi", "status_now",
    "status_rec", "reason", "safe_until_hour",
)


def build_tiles_payload() -> list[dict]:
    return [
        {
            "id": tile["id"],
            "bbox": list(tile["bbox"]),
            "status": "done",
            "hours_fetched": list(FETCH_HOURS),
        }
        for tile in TILES
    ]


def build_graph_payload(school: dict, edge_topology: dict[str, dict]) -> dict:
    return {
        "meta": {"school_id": school["id"], "tile_id": FIXTURE_TILE["id"], "crs": "EPSG:4326"},
        "nodes": build_nodes(),
        "edges": edge_topology,
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


def build_blocks_geojson(classified_blocks: list[dict], school_id: str) -> dict:
    features = []
    for block in classified_blocks:
        if block["school_id"] != school_id:
            continue
        properties = {key: block[key] for key in GEOJSON_PROPERTY_KEYS}
        features.append({
            "type": "Feature",
            "geometry": {"type": "Polygon", "coordinates": block["polygon"]},
            "properties": properties,
        })
    return {"type": "FeatureCollection", "features": features}


def _check_no_orphan_edges(edge_topology: dict, temps_payload: dict) -> None:
    graph_ids = set(edge_topology)
    temp_ids = set(temps_payload["edges"])
    if graph_ids == temp_ids:
        return
    raise RuntimeError(
        f"edge_id yatim: {len(graph_ids - temp_ids)} hanya di graph.json, "
        f"{len(temp_ids - graph_ids)} hanya di temps.json."
    )


def main() -> None:
    blocks = build_block_grid()
    classified_blocks = classify_blocks(blocks, SCHOOLS_FIXTURE)
    edge_topology = build_edge_topology()
    temps_payload = build_temps_payload(edge_topology)
    _check_no_orphan_edges(edge_topology, temps_payload)

    write_json(DATA_OUT_DIR / "tiles.json", build_tiles_payload())
    write_json(DATA_OUT_DIR / "schools.json", build_schools_payload(classified_blocks))
    write_json(DATA_OUT_DIR / "summary.json", build_summary(classified_blocks, SCHOOLS_FIXTURE))

    for school in SCHOOLS_FIXTURE:
        school_dir = DATA_OUT_DIR / "by_school" / school["id"]
        write_json(school_dir / "graph.json", build_graph_payload(school, edge_topology))
        write_json(school_dir / "temps.json", temps_payload)
        write_json(school_dir / "blocks.geojson", build_blocks_geojson(classified_blocks, school["id"]))

    copied = mirror_to_web()

    class_counts = {"green": 0, "yellow": 0, "red": 0}
    for block in classified_blocks:
        class_counts[block["class"]] += 1

    print(f"blocks: {len(classified_blocks)} total -> {class_counts}")
    print(f"schools: {len(SCHOOLS_FIXTURE)}")
    print(f"edges: {len(edge_topology)}, hours: {len(temps_payload['meta']['hours'])}")
    print(f"files copied to web/public/data: {len(copied)}")

    if class_counts["red"] == 0:
        raise RuntimeError("Kategori merah kosong — kalibrasi fixture salah, lihat FR-8.")
    if class_counts["green"] == 0 or class_counts["yellow"] == 0:
        raise RuntimeError("Salah satu kategori kosong — distribusi tidak boleh degenerate.")


if __name__ == "__main__":
    main()
