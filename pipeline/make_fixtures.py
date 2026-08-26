from pipeline import enrollment_calibration, step5_export
from pipeline.config import DATA_FIXTURES_DIR, TILES
from pipeline.fixture_classify import classify_and_summarize
from pipeline.fixture_geometry import (
    SCHOOLS_FIXTURE,
    build_block_grid,
    build_edge_topology,
    build_nodes,
)
from pipeline.fixture_temps import build_temps_payload
from pipeline.graph_integrity import check_no_orphan_edges
from pipeline.write_out import write_json

FIXTURE_TILE = TILES[0]


def build_graph_payload(school: dict, edge_topology: dict[str, dict]) -> dict:
    return {
        "meta": {"school_id": school["id"], "tile_id": FIXTURE_TILE["id"], "crs": "EPSG:4326"},
        "nodes": build_nodes(),
        "edges": edge_topology,
    }


def _polygons_by_geoid(blocks: list[dict]) -> dict[str, dict]:
    return {
        block["block_id"]: {"type": "Polygon", "coordinates": block["polygon"]}
        for block in blocks
    }


def main() -> None:
    blocks = build_block_grid()
    polygons_by_geoid = _polygons_by_geoid(blocks)
    edge_topology = build_edge_topology()
    temps_payload = build_temps_payload(edge_topology)
    check_no_orphan_edges(edge_topology, temps_payload)

    dasymetric_totals = enrollment_calibration.dasymetric_children_by_school(
        FIXTURE_TILE["id"], FIXTURE_TILE["bbox"], SCHOOLS_FIXTURE
    )
    correction_factors = enrollment_calibration.correction_factors(SCHOOLS_FIXTURE, dasymetric_totals)
    enrollment_calibration.print_calibration_report(SCHOOLS_FIXTURE, dasymetric_totals, correction_factors)

    classified_by_school, summary = classify_and_summarize(blocks, SCHOOLS_FIXTURE, correction_factors)

    write_json(DATA_FIXTURES_DIR / "schools.json", SCHOOLS_FIXTURE)
    write_json(DATA_FIXTURES_DIR / "summary.json", summary)

    class_counts = {"green": 0, "yellow": 0, "red": 0}
    for school in SCHOOLS_FIXTURE:
        school_id = school["id"]
        school_dir = DATA_FIXTURES_DIR / "by_school" / school_id
        write_json(school_dir / "graph.json", build_graph_payload(school, edge_topology))
        write_json(school_dir / "temps.json", temps_payload)
        blocks_geojson = step5_export.build_blocks_geojson(classified_by_school[school_id], polygons_by_geoid)
        write_json(school_dir / "blocks.geojson", blocks_geojson)
        for feature in blocks_geojson["features"]:
            class_counts[feature["properties"]["class"]] += 1

    print(f"blocks: {sum(class_counts.values())} total -> {class_counts}")
    print(f"schools: {len(SCHOOLS_FIXTURE)}")
    print(f"edges: {len(edge_topology)}, hours: {len(temps_payload['meta']['hours'])}")
    print(f"fixtures written to: {DATA_FIXTURES_DIR}")

    if class_counts["red"] == 0:
        raise RuntimeError("Kategori merah kosong — kalibrasi fixture salah, lihat FR-8.")
    if class_counts["green"] == 0:
        raise RuntimeError("Kategori hijau kosong — distribusi tidak boleh degenerate.")
    if class_counts["yellow"] == 0:
        print("CATATAN: kategori kuning kosong di fixture, mencerminkan data asli (lihat docs/METHODOLOGY.md).")


if __name__ == "__main__":
    main()
