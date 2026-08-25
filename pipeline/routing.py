import networkx as nx

from pipeline.config import WALK_SPEED_MPS
from pipeline.dose import weight_cool


def build_routing_graph(
    edges: dict[str, dict],
    temps_edges: dict[str, dict],
    hour: str,
    lambda_detour: float,
) -> nx.Graph:
    graph = nx.Graph()
    for edge_id, edge in edges.items():
        u, v, len_m = edge["u"], edge["v"], edge["len_m"]
        if graph.has_edge(u, v) and graph[u][v]["len_m"] <= len_m:
            continue
        temp_c, peak_c, dose_value = temps_edges[edge_id][hour]
        graph.add_edge(
            u,
            v,
            len_m=len_m,
            temp_c=temp_c,
            peak_c=peak_c,
            dose=dose_value,
            weight_cool=weight_cool(dose_value, len_m, lambda_detour),
        )
    return graph


def summarize_route(graph: nx.Graph, path: list[str]) -> dict:
    total_len_m = 0.0
    total_dose = 0.0
    weighted_temp_sum = 0.0
    peak_c = None

    for i in range(len(path) - 1):
        edge = graph[path[i]][path[i + 1]]
        total_len_m += edge["len_m"]
        total_dose += edge["dose"]
        weighted_temp_sum += edge["temp_c"] * edge["len_m"]
        if peak_c is None or edge["peak_c"] > peak_c:
            peak_c = edge["peak_c"]

    mean_c = weighted_temp_sum / total_len_m if total_len_m > 0 else 0.0
    return {
        "len_m": round(total_len_m, 1),
        "minutes": round(total_len_m / WALK_SPEED_MPS / 60.0, 1),
        "mean_c": round(mean_c, 2),
        "peak_c": round(peak_c, 2) if peak_c is not None else None,
        "dose": round(total_dose, 2),
    }
