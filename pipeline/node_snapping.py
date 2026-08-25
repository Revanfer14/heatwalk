import numpy as np
from pyproj import Transformer


def snap_points(nodes: dict[str, list[float]], lons: list[float], lats: list[float], utm_epsg: int) -> list[str]:
    node_ids = list(nodes)
    to_utm = Transformer.from_crs("EPSG:4326", f"EPSG:{utm_epsg}", always_xy=True)

    node_lons = np.array([nodes[node_id][0] for node_id in node_ids])
    node_lats = np.array([nodes[node_id][1] for node_id in node_ids])
    node_x, node_y = to_utm.transform(node_lons, node_lats)

    query_x, query_y = to_utm.transform(np.asarray(lons, dtype=float), np.asarray(lats, dtype=float))
    query_x = np.atleast_1d(query_x)
    query_y = np.atleast_1d(query_y)

    snapped: list[str] = []
    for x, y in zip(query_x, query_y):
        distances_sq = (node_x - x) ** 2 + (node_y - y) ** 2
        snapped.append(node_ids[int(np.argmin(distances_sq))])
    return snapped


def snap_point(nodes: dict[str, list[float]], lon: float, lat: float, utm_epsg: int) -> str:
    return snap_points(nodes, [lon], [lat], utm_epsg)[0]
