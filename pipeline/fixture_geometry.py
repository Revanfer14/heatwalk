import hashlib
import math

from pipeline.config import TILES

AOI_BBOX = TILES[0]["bbox"]

N_EDGE_COLS = 20
N_EDGE_ROWS = 18
N_BLOCK_COLS = 12
N_BLOCK_ROWS = 10

SCHOOLS_FIXTURE = [
    {
        "id": "sch_fixture_west",
        "name": "Fixture Elementary",
        "level": "elementary",
        "walk_radius_mi": 2.0,
        "grid_col": 2,
        "grid_row": 5,
        "policy_source": "OCPS Transportation FAQs (ocps.net/transportation-faqs), radius 2 mi per FS 1006.23 — FIXTURE placeholder untuk lokasi/enrollment, diganti data sekolah asli di Fase 1.5.5.",
    },
    {
        "id": "sch_fixture_east",
        "name": "Fixture Middle School",
        "level": "middle",
        "walk_radius_mi": 2.0,
        "grid_col": 17,
        "grid_row": 12,
        "policy_source": "OCPS Transportation FAQs (ocps.net/transportation-faqs), radius 2 mi per FS 1006.23 — FIXTURE placeholder untuk lokasi/enrollment, diganti data sekolah asli di Fase 1.5.5.",
    },
]


def _seeded_unit(*parts: object) -> float:
    digest = hashlib.sha1("_".join(str(p) for p in parts).encode()).hexdigest()
    return int(digest[:8], 16) / 0xFFFFFFFF


def _lonlat(bbox: tuple[float, float, float, float], col: int, row: int, n_cols: int, n_rows: int) -> list[float]:
    west, south, east, north = bbox
    lon = west + (east - west) * col / n_cols
    lat = south + (north - south) * row / n_rows
    return [round(lon, 6), round(lat, 6)]


def _cell_size_m(bbox: tuple[float, float, float, float], n_cols: int, n_rows: int) -> tuple[float, float]:
    west, south, east, north = bbox
    lat_mid = (south + north) / 2
    m_per_deg_lon = 111_320 * math.cos(math.radians(lat_mid))
    m_per_deg_lat = 110_540
    cell_w_m = (east - west) / n_cols * m_per_deg_lon
    cell_h_m = (north - south) / n_rows * m_per_deg_lat
    return cell_w_m, cell_h_m


def lon_heat_factor(lon: float, bbox: tuple[float, float, float, float] = AOI_BBOX, seed: str = "") -> float:
    west, _south, east, _north = bbox
    base = (lon - west) / (east - west)
    wobble = (_seeded_unit("heat", seed) - 0.5) * 0.15
    return min(max(base + wobble, 0.0), 1.0)


def block_heat_factor(col: int, row: int) -> float:
    base = col / max(N_BLOCK_COLS - 1, 1)
    wobble = (_seeded_unit("heat", col, row) - 0.5) * 0.15
    return min(max(base + wobble, 0.0), 1.0)


def node_id(col: int, row: int) -> str:
    return f"n{col}_{row}"


def edge_id(u: str, v: str) -> str:
    return f"{u}-{v}"


def build_nodes(bbox: tuple[float, float, float, float] = AOI_BBOX) -> dict[str, list[float]]:
    return {
        node_id(col, row): _lonlat(bbox, col, row, N_EDGE_COLS, N_EDGE_ROWS)
        for row in range(N_EDGE_ROWS + 1)
        for col in range(N_EDGE_COLS + 1)
    }


def build_edge_topology(bbox: tuple[float, float, float, float] = AOI_BBOX) -> dict[str, dict]:
    cell_w_m, cell_h_m = _cell_size_m(bbox, N_EDGE_COLS, N_EDGE_ROWS)
    nodes = build_nodes(bbox)
    edges: dict[str, dict] = {}

    for row in range(N_EDGE_ROWS + 1):
        for col in range(N_EDGE_COLS + 1):
            u = node_id(col, row)
            if col < N_EDGE_COLS:
                v = node_id(col + 1, row)
                edges[edge_id(u, v)] = _topology_edge(u, v, nodes, cell_w_m)
            if row < N_EDGE_ROWS:
                v = node_id(col, row + 1)
                edges[edge_id(u, v)] = _topology_edge(u, v, nodes, cell_h_m)

    return edges


def _topology_edge(u: str, v: str, nodes: dict[str, list[float]], len_m: float) -> dict:
    return {
        "u": u,
        "v": v,
        "len_m": round(len_m, 1),
        "geom": [nodes[u], nodes[v]],
    }


def edge_midpoint_lon(edge: dict) -> float:
    return (edge["geom"][0][0] + edge["geom"][1][0]) / 2


def build_block_grid(bbox: tuple[float, float, float, float] = AOI_BBOX) -> list[dict]:
    west, south, east, north = bbox
    dx = (east - west) / N_BLOCK_COLS
    dy = (north - south) / N_BLOCK_ROWS

    blocks: list[dict] = []
    for row in range(N_BLOCK_ROWS):
        for col in range(N_BLOCK_COLS):
            block_west = west + col * dx
            block_east = block_west + dx
            block_south = south + row * dy
            block_north = block_south + dy
            centroid = [round((block_west + block_east) / 2, 6), round((block_south + block_north) / 2, 6)]
            blocks.append({
                "block_id": f"FIXTURE-{col:02d}{row:02d}",
                "col": col,
                "row": row,
                "centroid": centroid,
                "polygon": [[
                    [round(block_west, 6), round(block_south, 6)],
                    [round(block_east, 6), round(block_south, 6)],
                    [round(block_east, 6), round(block_north, 6)],
                    [round(block_west, 6), round(block_north, 6)],
                    [round(block_west, 6), round(block_south, 6)],
                ]],
            })
    return blocks


def school_lonlat(school: dict, bbox: tuple[float, float, float, float] = AOI_BBOX) -> list[float]:
    return _lonlat(bbox, school["grid_col"], school["grid_row"], N_EDGE_COLS, N_EDGE_ROWS)


def distance_km(a_lonlat: list[float], b_lonlat: list[float]) -> float:
    lat_mid = math.radians((a_lonlat[1] + b_lonlat[1]) / 2)
    dx_km = (a_lonlat[0] - b_lonlat[0]) * 111.320 * math.cos(lat_mid)
    dy_km = (a_lonlat[1] - b_lonlat[1]) * 110.540
    return math.hypot(dx_km, dy_km)
