import hashlib
import math

from pipeline.config import SCHOOL_SELECTION_BBOX, SCHOOL_SELECTION_TILE_ID, TILES
from pipeline.nces_schools import build_schools_payload

AOI_BBOX = TILES[0]["bbox"]

N_EDGE_COLS = 20
N_EDGE_ROWS = 18
N_BLOCK_COLS = 12
N_BLOCK_ROWS = 10

SCHOOLS_FIXTURE = build_schools_payload(SCHOOL_SELECTION_TILE_ID, SCHOOL_SELECTION_BBOX)


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


FIXTURE_STATE_COUNTY_FIPS = "12095"


def fixture_block_geoid(col: int, row: int) -> str:
    tract = 123000 + col * 100
    block = 1000 + row
    return f"{FIXTURE_STATE_COUNTY_FIPS}{tract:06d}{block:04d}"


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


def nearest_grid_cell(
    lon: float, lat: float, bbox: tuple[float, float, float, float] = AOI_BBOX
) -> tuple[int, int]:
    west, south, east, north = bbox
    col = round((lon - west) / (east - west) * N_EDGE_COLS)
    row = round((lat - south) / (north - south) * N_EDGE_ROWS)
    return min(max(col, 0), N_EDGE_COLS), min(max(row, 0), N_EDGE_ROWS)


def grid_path_edges(from_cell: tuple[int, int], to_cell: tuple[int, int]) -> list[str]:
    col, row = from_cell
    to_col, to_row = to_cell
    edges: list[str] = []

    while col != to_col:
        next_col = col + 1 if to_col > col else col - 1
        u, v = (col, next_col) if next_col > col else (next_col, col)
        edges.append(edge_id(node_id(u, row), node_id(v, row)))
        col = next_col

    while row != to_row:
        next_row = row + 1 if to_row > row else row - 1
        u, v = (row, next_row) if next_row > row else (next_row, row)
        edges.append(edge_id(node_id(col, u), node_id(col, v)))
        row = next_row

    return edges


def _parse_node_id(node: str) -> tuple[int, int]:
    col_str, row_str = node[1:].split("_")
    return int(col_str), int(row_str)


def build_street_names(edge_topology: dict[str, dict]) -> dict[str, str]:
    names: dict[str, str] = {}
    for eid, edge in edge_topology.items():
        u_col, u_row = _parse_node_id(edge["u"])
        _v_col, v_row = _parse_node_id(edge["v"])
        names[eid] = f"Grid Ave {u_row}" if u_row == v_row else f"Grid St {u_col}"
    return names


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
                "block_id": fixture_block_geoid(col, row),
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


def school_lonlat(school: dict) -> list[float]:
    return [school["lon"], school["lat"]]
