import hashlib
import math

from pipeline.config import BASELINE_C, PHOENIX_AOI_BBOX_PROVISIONAL

N_EDGE_COLS = 20
N_EDGE_ROWS = 18
N_BLOCK_COLS = 12
N_BLOCK_ROWS = 10

HOUR_OFFSET_C = {"07:30": -6.0, "14:45": 0.0}

SCHOOLS_FIXTURE = [
    {
        "id": "sch_fixture_west",
        "name": "Fixture Elementary",
        "level": "elementary",
        "walk_radius_mi": 1.0,
        "grid_col": 2,
        "grid_row": 5,
        "policy_source": "FIXTURE placeholder — diganti PDF kebijakan distrik asli di Fase 1.",
    },
    {
        "id": "sch_fixture_east",
        "name": "Fixture Middle School",
        "level": "middle",
        "walk_radius_mi": 1.5,
        "grid_col": 17,
        "grid_row": 12,
        "policy_source": "FIXTURE placeholder — diganti PDF kebijakan distrik asli di Fase 1.",
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


def _heat_factor(col: int, row: int, n_cols: int) -> float:
    base = col / max(n_cols - 1, 1)
    wobble = (_seeded_unit("heat", col, row) - 0.5) * 0.15
    return min(max(base + wobble, 0.0), 1.0)


def edge_heat_factor(col: int, row: int) -> float:
    return _heat_factor(col, row, N_EDGE_COLS)


def block_heat_factor(col: int, row: int) -> float:
    return _heat_factor(col, row, N_BLOCK_COLS)


def edge_temp_c(col: int, row: int, hhmm: str) -> float:
    factor = edge_heat_factor(col, row)
    noise = (_seeded_unit("temp", col, row, hhmm) - 0.5) * 1.5
    return round(BASELINE_C - 4.0 + factor * 13.0 + HOUR_OFFSET_C[hhmm] + noise, 2)


def node_id(col: int, row: int) -> str:
    return f"n{col}_{row}"


def build_nodes(bbox: tuple[float, float, float, float] = PHOENIX_AOI_BBOX_PROVISIONAL) -> dict[str, list[float]]:
    return {
        node_id(col, row): _lonlat(bbox, col, row, N_EDGE_COLS, N_EDGE_ROWS)
        for row in range(N_EDGE_ROWS + 1)
        for col in range(N_EDGE_COLS + 1)
    }


def build_edges(hhmm: str, bbox: tuple[float, float, float, float] = PHOENIX_AOI_BBOX_PROVISIONAL) -> list[dict]:
    cell_w_m, cell_h_m = _cell_size_m(bbox, N_EDGE_COLS, N_EDGE_ROWS)
    nodes = build_nodes(bbox)
    edges: list[dict] = []

    for row in range(N_EDGE_ROWS + 1):
        for col in range(N_EDGE_COLS + 1):
            u = node_id(col, row)
            if col < N_EDGE_COLS:
                v = node_id(col + 1, row)
                edges.append(_edge(u, v, nodes, cell_w_m, col, row, hhmm))
            if row < N_EDGE_ROWS:
                v = node_id(col, row + 1)
                edges.append(_edge(u, v, nodes, cell_h_m, col, row, hhmm))

    return edges


def _edge(u: str, v: str, nodes: dict[str, list[float]], len_m: float, col: int, row: int, hhmm: str) -> dict:
    from pipeline.config import WALK_SPEED_MPS

    temp_c = edge_temp_c(col, row, hhmm)
    dose = round(max(temp_c - BASELINE_C, 0.0) * (len_m / WALK_SPEED_MPS) / 60.0, 3)
    return {
        "u": u,
        "v": v,
        "len_m": round(len_m, 1),
        "temp_c": temp_c,
        "dose": dose,
        "geom": [nodes[u], nodes[v]],
    }


def build_block_grid(bbox: tuple[float, float, float, float] = PHOENIX_AOI_BBOX_PROVISIONAL) -> list[dict]:
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


def school_lonlat(school: dict, bbox: tuple[float, float, float, float] = PHOENIX_AOI_BBOX_PROVISIONAL) -> list[float]:
    return _lonlat(bbox, school["grid_col"], school["grid_row"], N_EDGE_COLS, N_EDGE_ROWS)


def distance_km(a_lonlat: list[float], b_lonlat: list[float]) -> float:
    lat_mid = math.radians((a_lonlat[1] + b_lonlat[1]) / 2)
    dx_km = (a_lonlat[0] - b_lonlat[0]) * 111.320 * math.cos(lat_mid)
    dy_km = (a_lonlat[1] - b_lonlat[1]) * 110.540
    return math.hypot(dx_km, dy_km)
