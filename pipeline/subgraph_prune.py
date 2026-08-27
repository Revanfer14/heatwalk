from pipeline.geo_distance import distance_km

MI_TO_KM = 1.609344


def prune_to_catchment(graph_payload: dict, temps_payload: dict, school: dict, buffer_km: float) -> tuple[dict, dict]:
    school_point = [school["lon"], school["lat"]]
    catchment_km = school["walk_radius_mi"] * MI_TO_KM + buffer_km
    nodes = graph_payload["nodes"]

    node_in_catchment = {
        node_id: distance_km(school_point, coord) <= catchment_km for node_id, coord in nodes.items()
    }

    kept_edge_ids = {
        edge_id
        for edge_id, edge in graph_payload["edges"].items()
        if node_in_catchment.get(edge["u"], False) or node_in_catchment.get(edge["v"], False)
    }
    kept_node_ids = {
        node_id
        for edge_id in kept_edge_ids
        for node_id in (graph_payload["edges"][edge_id]["u"], graph_payload["edges"][edge_id]["v"])
    }

    pruned_graph = {
        "meta": graph_payload["meta"],
        "nodes": {node_id: nodes[node_id] for node_id in kept_node_ids},
        "edges": {edge_id: graph_payload["edges"][edge_id] for edge_id in kept_edge_ids},
    }
    pruned_temps = {
        "meta": temps_payload["meta"],
        "edges": {edge_id: temps_payload["edges"][edge_id] for edge_id in kept_edge_ids},
    }
    return pruned_graph, pruned_temps
