import json

from pipeline import edge_geometry, edge_sampling, hourly_curve, lambda_calibration, node_snapping, write_out
from pipeline.config import (
    BASELINE_C,
    DATA_INTERIM_DIR,
    DATA_OUT_DIR,
    DOSE_DECIMALS,
    FETCH_DATE,
    FETCH_HOURS,
    TEMP_DECIMALS,
    THRESHOLD_DOSE_C_MIN,
    TILES,
    utm_epsg_for_lon,
)
from pipeline.dose import dose_c_min
from pipeline.graph_integrity import check_no_orphan_edges


def build_tile_dataset(tile: dict) -> dict:
    tile_id = tile["id"]
    topology = edge_geometry.build_topology(tile_id, tile["bbox"])

    curve = hourly_curve.build_hourly_curve(tile_id, FETCH_HOURS)
    hourly_curve.print_curve_report(tile_id, curve)
    canonical_hour = hourly_curve.canonical_hour(curve)
    hours = [hour for hour in FETCH_HOURS if curve[hour] is not None]

    sampled = edge_sampling.sample_all_hours(tile_id, topology, hours)
    dropped_edge_ids = sampled["dropped_edge_ids"]

    kept_edges = {
        edge_id: edge for edge_id, edge in topology["edges"].items() if edge_id not in dropped_edge_ids
    }
    kept_node_ids = {node_id for edge in kept_edges.values() for node_id in (edge["u"], edge["v"])}
    kept_nodes = {node_id: coord for node_id, coord in topology["nodes"].items() if node_id in kept_node_ids}
    kept_street_names = {
        edge_id: name for edge_id, name in topology["street_names"].items() if edge_id in kept_edges
    }

    raw_dose_by_hour: dict[str, dict[str, float]] = {}
    temps_edges: dict[str, dict[str, list[float]]] = {}
    for edge_id, edge in kept_edges.items():
        temps_edges[edge_id] = {}
        for hour in hours:
            temp_c = sampled["temp_c"][hour][edge_id]
            peak_c = sampled["peak_c"][hour][edge_id]
            dose_value = dose_c_min(temp_c, edge["len_m"])
            raw_dose_by_hour.setdefault(hour, {})[edge_id] = dose_value
            temps_edges[edge_id][hour] = [
                round(temp_c, TEMP_DECIMALS),
                round(peak_c, TEMP_DECIMALS),
                round(dose_value, DOSE_DECIMALS),
            ]

    dropped_edges_total = (
        topology["dropped_self_loop"] + topology["dropped_zero_length"] + len(dropped_edge_ids)
    )

    return {
        "tile_id": tile_id,
        "canonical_hour": canonical_hour,
        "hours": hours,
        "nodes": kept_nodes,
        "edges": kept_edges,
        "street_names": kept_street_names,
        "temps_edges": temps_edges,
        "raw_dose_by_hour": raw_dose_by_hour,
        "total_edges_considered": topology["total_edges_considered"],
        "dropped_edges_total": dropped_edges_total,
    }


def build_school_outputs(tile_dataset: dict, school: dict, utm_epsg: int) -> tuple[dict, dict]:
    nodes = tile_dataset["nodes"]
    edges = tile_dataset["edges"]

    calibration_graph = lambda_calibration.build_calibration_graph(edges, tile_dataset["raw_dose_by_hour"])
    origin_node = node_snapping.snap_point(nodes, school["lon"], school["lat"], utm_epsg)
    lambda_detour = lambda_calibration.calibrate_lambda(calibration_graph, origin_node, tile_dataset["hours"])

    graph_payload = {
        "meta": {"school_id": school["id"], "tile_id": tile_dataset["tile_id"], "crs": "EPSG:4326"},
        "nodes": nodes,
        "edges": {
            edge_id: {"u": edge["u"], "v": edge["v"], "len_m": edge["len_m"], "geom": edge["geom"]}
            for edge_id, edge in edges.items()
        },
    }
    temps_payload = {
        "meta": {
            "hours": tile_dataset["hours"],
            "canonical_hour": tile_dataset["canonical_hour"],
            "baseline_c": BASELINE_C,
            "threshold": THRESHOLD_DOSE_C_MIN,
            "lambda_detour": lambda_detour,
            "fetched_at": FETCH_DATE,
        },
        "edges": tile_dataset["temps_edges"],
    }
    return graph_payload, temps_payload


def main() -> None:
    schools = json.loads((DATA_OUT_DIR / "schools.json").read_text(encoding="utf-8"))
    tile = TILES[0]
    utm_epsg = utm_epsg_for_lon((tile["bbox"][0] + tile["bbox"][2]) / 2)

    tile_dataset = build_tile_dataset(tile)
    write_out.write_json(
        DATA_INTERIM_DIR / "street_names" / f"{tile['id']}.json", tile_dataset["street_names"]
    )

    dropped_pct = 100 * tile_dataset["dropped_edges_total"] / tile_dataset["total_edges_considered"]
    print(
        f"\nEdge tile {tile['id']}: {len(tile_dataset['edges'])} dipakai, "
        f"{tile_dataset['dropped_edges_total']} dibuang ({dropped_pct:.2f}%) dari "
        f"{tile_dataset['total_edges_considered']} total"
    )

    for school in schools:
        graph_payload, temps_payload = build_school_outputs(tile_dataset, school, utm_epsg)
        check_no_orphan_edges(graph_payload["edges"], temps_payload)

        school_dir = DATA_OUT_DIR / "by_school" / school["id"]
        write_out.write_json(school_dir / "graph.json", graph_payload)
        write_out.write_json(school_dir / "temps.json", temps_payload)

        graph_bytes = (school_dir / "graph.json").stat().st_size
        temps_bytes = (school_dir / "temps.json").stat().st_size
        print(
            f"  {school['id']:32s} lambda_detour={temps_payload['meta']['lambda_detour']:<6} "
            f"graph.json={graph_bytes / 1024:.0f}KB temps.json={temps_bytes / 1024:.0f}KB"
        )

if __name__ == "__main__":
    main()
