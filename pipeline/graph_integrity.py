def check_no_orphan_edges(edge_topology: dict, temps_payload: dict) -> None:
    graph_ids = set(edge_topology)
    temp_ids = set(temps_payload["edges"])
    if graph_ids == temp_ids:
        return
    raise RuntimeError(
        f"edge_id yatim: {len(graph_ids - temp_ids)} hanya di graph.json, "
        f"{len(temp_ids - graph_ids)} hanya di temps.json."
    )
