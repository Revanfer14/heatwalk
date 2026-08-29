import json

import networkx as nx

from pipeline import block_table, enrollment_calibration, node_snapping, routing
from pipeline.config import DATA_INTERIM_DIR, DATA_OUT_DIR, TILES, utm_epsg_for_lon
from pipeline.write_out import write_json

ROUTES_DIR = DATA_INTERIM_DIR / "routes"


def _load_school_files(school_id: str) -> tuple[dict, dict]:
    school_dir = DATA_OUT_DIR / "by_school" / school_id
    graph_payload = json.loads((school_dir / "graph.json").read_text(encoding="utf-8"))
    temps_payload = json.loads((school_dir / "temps.json").read_text(encoding="utf-8"))
    return graph_payload, temps_payload


def route_school(school: dict, blocks: list[dict], utm_epsg: int) -> dict:
    graph_payload, temps_payload = _load_school_files(school["id"])
    nodes = graph_payload["nodes"]
    edges = graph_payload["edges"]
    temps_edges = temps_payload["edges"]
    hours = temps_payload["meta"]["hours"]
    lambda_detour = temps_payload["meta"]["lambda_detour"]

    canonical_hour = temps_payload["meta"]["canonical_hour"]
    school_node = node_snapping.snap_point(nodes, school["lon"], school["lat"], utm_epsg)
    block_nodes = node_snapping.snap_points(
        nodes,
        [block["lon"] for block in blocks],
        [block["lat"] for block in blocks],
        utm_epsg,
        exclude_node_id=school_node,
    )

    first_hour_graph = routing.build_routing_graph(edges, temps_edges, hours[0], lambda_detour)
    _, shortest_paths = nx.single_source_dijkstra(first_hour_graph, school_node, weight="len_m")

    block_records: dict[str, dict] = {
        block["block_id"]: {
            "kids_est": block["kids_est"],
            "distance_mi": block["distance_mi"],
            "node": node_id,
            "shortest": {"by_hour": {}},
            "coolest": {"by_hour": {}},
        }
        for block, node_id in zip(blocks, block_nodes)
    }

    for hour in hours:
        hour_graph = routing.build_routing_graph(edges, temps_edges, hour, lambda_detour)
        _, coolest_paths = nx.single_source_dijkstra(hour_graph, school_node, weight="weight_cool")

        for block, node_id in zip(blocks, block_nodes):
            record = block_records[block["block_id"]]

            shortest_path = shortest_paths.get(node_id)
            if shortest_path is not None:
                shortest_stats = routing.summarize_route(hour_graph, shortest_path)
                record["shortest"]["len_m"] = shortest_stats["len_m"]
                record["shortest"]["minutes"] = shortest_stats["minutes"]
                record["shortest"]["by_hour"][hour] = {
                    "mean_c": shortest_stats["mean_c"],
                    "peak_c": shortest_stats["peak_c"],
                    "dose": shortest_stats["dose"],
                }

            coolest_path = coolest_paths.get(node_id)
            if coolest_path is not None:
                coolest_stats = routing.summarize_route(hour_graph, coolest_path)
                shortest_len_m = record["shortest"].get("len_m")
                detour_ratio = coolest_stats["len_m"] / shortest_len_m if shortest_len_m else 1.0
                record["coolest"]["by_hour"][hour] = {
                    "len_m": coolest_stats["len_m"],
                    "minutes": coolest_stats["minutes"],
                    "mean_c": coolest_stats["mean_c"],
                    "peak_c": coolest_stats["peak_c"],
                    "dose": coolest_stats["dose"],
                    "detour_ratio": round(detour_ratio, 3),
                }
                if hour == canonical_hour:
                    record["coolest"]["path_edges_canonical"] = routing.path_edge_ids(hour_graph, coolest_path)

    unreachable_block_ids = [
        block_id for block_id, record in block_records.items() if not record["shortest"]["by_hour"]
    ]
    for block_id in unreachable_block_ids:
        del block_records[block_id]

    return {
        "meta": {
            "school_id": school["id"],
            "canonical_hour": temps_payload["meta"]["canonical_hour"],
            "hours": hours,
            "threshold": temps_payload["meta"]["threshold"],
            "lambda_detour": lambda_detour,
            "school_node": school_node,
        },
        "blocks": block_records,
        "unreachable_block_ids": unreachable_block_ids,
    }


def main() -> None:
    schools = json.loads((DATA_OUT_DIR / "schools.json").read_text(encoding="utf-8"))
    tile = TILES[0]
    utm_epsg = utm_epsg_for_lon((tile["bbox"][0] + tile["bbox"][2]) / 2)

    dasymetric_totals = enrollment_calibration.dasymetric_children_by_school(tile["id"], tile["bbox"], schools)
    correction_factors = enrollment_calibration.correction_factors(schools, dasymetric_totals)
    blocks = block_table.build_block_table(tile["id"], tile["bbox"], schools, correction_factors)

    ROUTES_DIR.mkdir(parents=True, exist_ok=True)
    print(f"\nRouting per blok, {len(blocks)} blok (termasuk POP100=0), {len(schools)} sekolah:")
    for school in schools:
        school_blocks = [block for block in blocks if block["school_id"] == school["id"]]
        routed = route_school(school, school_blocks, utm_epsg)
        write_json(ROUTES_DIR / f"{school['id']}.json", routed)

        canonical_hour = routed["meta"]["canonical_hour"]
        threshold = routed["meta"]["threshold"]
        red_at_canonical = sum(
            1
            for record in routed["blocks"].values()
            if record["coolest"]["by_hour"].get(canonical_hour, {}).get("dose", 0.0) > threshold
        )
        print(
            f"  {school['id']:32s} blocks={len(routed['blocks']):4d} "
            f"unreachable={len(routed['unreachable_block_ids']):3d} "
            f"red_at_canonical={red_at_canonical:3d}"
        )


if __name__ == "__main__":
    main()
