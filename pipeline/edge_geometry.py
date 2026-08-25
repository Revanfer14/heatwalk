import osmnx as ox
from pyproj import Transformer
from shapely.geometry import LineString
from shapely.ops import transform as shapely_transform

from pipeline import osm_network
from pipeline.config import utm_epsg_for_lon

SIMPLIFY_TOLERANCE_M = 5.0


def _straight_line_geometry(undirected, u: str, v: str) -> LineString:
    ux, uy = float(undirected.nodes[u]["x"]), float(undirected.nodes[u]["y"])
    vx, vy = float(undirected.nodes[v]["x"]), float(undirected.nodes[v]["y"])
    return LineString([(ux, uy), (vx, vy)])


def _edge_geometry_wgs84(undirected, u: str, v: str, data: dict) -> LineString:
    geometry = data.get("geometry")
    if geometry is not None:
        return geometry
    return _straight_line_geometry(undirected, u, v)


def _simplified_geom(geometry_utm, to_wgs84: Transformer) -> list[list[float]]:
    simplified_utm = geometry_utm.simplify(SIMPLIFY_TOLERANCE_M, preserve_topology=False)
    simplified_wgs84 = shapely_transform(to_wgs84.transform, simplified_utm)
    return [[round(lon, 6), round(lat, 6)] for lon, lat in simplified_wgs84.coords]


def build_topology(tile_id: str, bbox: tuple[float, float, float, float]) -> dict:
    graph = ox.load_graphml(osm_network.graph_path(tile_id))
    undirected = ox.convert.to_undirected(graph)

    center_lon = (bbox[0] + bbox[2]) / 2
    utm_epsg = utm_epsg_for_lon(center_lon)
    to_utm = Transformer.from_crs("EPSG:4326", f"EPSG:{utm_epsg}", always_xy=True)
    to_wgs84 = Transformer.from_crs(f"EPSG:{utm_epsg}", "EPSG:4326", always_xy=True)

    node_compact_ids: dict[str, str] = {}
    nodes: dict[str, list[float]] = {}
    edges: dict[str, dict] = {}
    node_to_edges: dict[str, list[str]] = {}

    dropped_self_loop = 0
    dropped_zero_length = 0
    total_edges_considered = 0

    ordered_edges = sorted(
        undirected.edges(keys=True, data=True),
        key=lambda item: (item[0], item[1], item[2]),
    )

    for u, v, _key, data in ordered_edges:
        total_edges_considered += 1
        if u == v:
            dropped_self_loop += 1
            continue

        length_m = float(data["length"])
        if length_m <= 0:
            dropped_zero_length += 1
            continue

        for original_id in (u, v):
            if original_id not in node_compact_ids:
                compact_id = f"n{len(node_compact_ids)}"
                node_compact_ids[original_id] = compact_id
                lon = float(undirected.nodes[original_id]["x"])
                lat = float(undirected.nodes[original_id]["y"])
                nodes[compact_id] = [round(lon, 6), round(lat, 6)]

        geometry_wgs84 = _edge_geometry_wgs84(undirected, u, v, data)
        geometry_utm = shapely_transform(to_utm.transform, geometry_wgs84)

        edge_id = f"e{len(edges)}"
        u_id, v_id = node_compact_ids[u], node_compact_ids[v]
        edges[edge_id] = {
            "u": u_id,
            "v": v_id,
            "len_m": round(length_m, 1),
            "geom": _simplified_geom(geometry_utm, to_wgs84),
            "sampling_geometry_utm": geometry_utm,
        }
        node_to_edges.setdefault(u_id, []).append(edge_id)
        node_to_edges.setdefault(v_id, []).append(edge_id)

    adjacency: dict[str, list[str]] = {}
    for edge_id, edge in edges.items():
        neighbors = set(node_to_edges[edge["u"]]) | set(node_to_edges[edge["v"]])
        neighbors.discard(edge_id)
        adjacency[edge_id] = list(neighbors)

    return {
        "nodes": nodes,
        "edges": edges,
        "adjacency": adjacency,
        "to_utm": to_utm,
        "to_wgs84": to_wgs84,
        "dropped_self_loop": dropped_self_loop,
        "dropped_zero_length": dropped_zero_length,
        "total_edges_considered": total_edges_considered,
    }
