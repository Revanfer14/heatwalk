import json
from pathlib import Path

from pipeline.config import BASELINE_C, DATA_INTERIM_DIR, SEGMENT_PRIORITY_TOP_N, SHADE_COOLING_C, WALK_SPEED_MPS
from pipeline.dose import dose_c_min

UNNAMED_STREET_LABEL = "Unnamed segment"


def _load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def _kids_affected_by_edge(routed: dict) -> dict[str, int]:
    kids_by_edge: dict[str, int] = {}
    for record in routed["blocks"].values():
        path_edges = record["coolest"].get("path_edges_canonical", [])
        kids_est = record["kids_est"]
        for edge_id in path_edges:
            kids_by_edge[edge_id] = kids_by_edge.get(edge_id, 0) + kids_est
    return kids_by_edge


def _segment_row(edge_id: str, kids_affected: int, graph: dict, temps: dict, street_names: dict) -> dict:
    len_m = graph["edges"][edge_id]["len_m"]
    canonical_hour = temps["meta"]["canonical_hour"]
    temp_c, peak_c, dose = temps["edges"][edge_id][canonical_hour]

    peak_shaded_c = round(peak_c - SHADE_COOLING_C, 2)
    temp_shaded_c = temp_c - SHADE_COOLING_C
    dose_shaded = dose_c_min(temp_shaded_c, len_m, BASELINE_C, WALK_SPEED_MPS)
    dose_reduction_pct = round((1 - dose_shaded / dose) * 100) if dose > 0 else 0

    return {
        "edge_id": edge_id,
        "street_name": street_names.get(edge_id) or UNNAMED_STREET_LABEL,
        "kids_affected": kids_affected,
        "peak_c": peak_c,
        "peak_shaded_c": peak_shaded_c,
        "dose_reduction_pct": dose_reduction_pct,
    }


def build_segment_priority(
    routed: dict, graph: dict, temps: dict, street_names: dict, top_n: int = SEGMENT_PRIORITY_TOP_N
) -> list[dict]:
    kids_by_edge = _kids_affected_by_edge(routed)
    rows = [
        _segment_row(edge_id, kids_affected, graph, temps, street_names)
        for edge_id, kids_affected in kids_by_edge.items()
    ]
    rows.sort(key=lambda row: (-row["kids_affected"], -row["peak_c"]))
    return rows[:top_n]


def load_street_names(tile_id: str) -> dict[str, str | None]:
    path = DATA_INTERIM_DIR / "street_names" / f"{tile_id}.json"
    return _load_json(path)
