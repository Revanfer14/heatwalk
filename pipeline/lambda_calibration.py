import networkx as nx

from pipeline.config import DETOUR_CAP_RATIO, LAMBDA_DETOUR_CANDIDATES

MIN_SHORTEST_LEN_M = 100.0


def build_calibration_graph(edges: dict[str, dict], raw_dose_canonical: dict[str, float]) -> nx.Graph:
    graph = nx.Graph()
    for edge_id, edge in edges.items():
        u, v, len_m = edge["u"], edge["v"], edge["len_m"]
        dose_value = raw_dose_canonical[edge_id]
        if graph.has_edge(u, v) and graph[u][v]["len_m"] <= len_m:
            continue
        graph.add_edge(u, v, len_m=len_m, dose=dose_value)
    return graph


def _coolest_physical_length_m(graph: nx.Graph, source: str, lambda_value: float) -> dict[str, float]:
    for _u, _v, data in graph.edges(data=True):
        data["weight_cool"] = data["dose"] + lambda_value * data["len_m"]

    _costs, paths = nx.single_source_dijkstra(graph, source, weight="weight_cool")
    lengths: dict[str, float] = {}
    for target, path in paths.items():
        lengths[target] = sum(graph[path[i]][path[i + 1]]["len_m"] for i in range(len(path) - 1))
    return lengths


def max_detour_ratio(graph: nx.Graph, source: str, lambda_value: float) -> float:
    shortest = nx.single_source_dijkstra_path_length(graph, source, weight="len_m")
    coolest = _coolest_physical_length_m(graph, source, lambda_value)

    ratios = [
        coolest[node] / shortest[node]
        for node in shortest
        if shortest[node] >= MIN_SHORTEST_LEN_M and node in coolest
    ]
    return max(ratios) if ratios else 1.0


def calibrate_lambda(
    graph: nx.Graph,
    source: str,
    candidates: list[float] = LAMBDA_DETOUR_CANDIDATES,
    cap_ratio: float = DETOUR_CAP_RATIO,
) -> float:
    for lambda_value in candidates:
        if max_detour_ratio(graph, source, lambda_value) <= cap_ratio:
            return lambda_value
    return candidates[-1]
