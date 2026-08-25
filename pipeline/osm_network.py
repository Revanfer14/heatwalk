from pathlib import Path

import networkx as nx
import osmnx as ox

from pipeline.config import DATA_RAW_DIR, DATA_INTERIM_DIR

ox.settings.cache_folder = str(DATA_RAW_DIR / "osm_cache")


def graph_path(tile_id: str) -> Path:
    return DATA_INTERIM_DIR / "osm" / f"{tile_id}_walk.graphml"


def fetch_walk_network(bbox: tuple[float, float, float, float]) -> nx.MultiDiGraph:
    return ox.graph_from_bbox(bbox=bbox, network_type="walk")


def save_walk_network(tile_id: str, bbox: tuple[float, float, float, float]) -> dict:
    graph = fetch_walk_network(bbox)
    path = graph_path(tile_id)
    path.parent.mkdir(parents=True, exist_ok=True)
    ox.save_graphml(graph, filepath=path)
    return {
        "tile_id": tile_id,
        "path": str(path),
        "n_nodes": graph.number_of_nodes(),
        "n_edges": graph.number_of_edges(),
    }
