import numpy as np
import rasterio

from pipeline import fetch_heatmap_tile

SAMPLE_SPACING_M = 20.0


def _sample_fractions(line_length_m: float, spacing_m: float = SAMPLE_SPACING_M) -> list[float]:
    if line_length_m <= 0:
        return [0.0]
    steps = max(int(line_length_m // spacing_m) + 1, 1)
    return [step / steps for step in range(steps + 1)]


def build_sample_points(topology: dict) -> tuple[np.ndarray, np.ndarray, dict[str, tuple[int, int]]]:
    to_wgs84 = topology["to_wgs84"]
    lons: list[float] = []
    lats: list[float] = []
    offsets: dict[str, tuple[int, int]] = {}
    cursor = 0

    for edge_id, edge in topology["edges"].items():
        line_utm = edge["sampling_geometry_utm"]
        fractions = _sample_fractions(line_utm.length)
        for fraction in fractions:
            point = line_utm.interpolate(fraction, normalized=True)
            lon, lat = to_wgs84.transform(point.x, point.y)
            lons.append(lon)
            lats.append(lat)
        offsets[edge_id] = (cursor, cursor + len(fractions))
        cursor += len(fractions)

    return np.array(lons), np.array(lats), offsets


def sample_hour(
    raster_path,
    lons: np.ndarray,
    lats: np.ndarray,
    offsets: dict[str, tuple[int, int]],
) -> tuple[dict[str, float | None], dict[str, float | None]]:
    with rasterio.open(raster_path) as dataset:
        values = np.array([value[0] for value in dataset.sample(zip(lons, lats))], dtype=float)

    temp_c: dict[str, float | None] = {}
    peak_c: dict[str, float | None] = {}
    for edge_id, (start, end) in offsets.items():
        segment = values[start:end]
        valid = segment[~np.isnan(segment)]
        if valid.size == 0:
            temp_c[edge_id] = None
            peak_c[edge_id] = None
        else:
            temp_c[edge_id] = float(valid.mean())
            peak_c[edge_id] = float(valid.max())
    return temp_c, peak_c


def _neighbor_fill(
    values_by_edge: dict[str, float | None],
    adjacency: dict[str, list[str]],
) -> dict[str, float | None]:
    filled = dict(values_by_edge)
    for edge_id, value in list(filled.items()):
        if value is not None:
            continue
        neighbor_values = [filled[n] for n in adjacency.get(edge_id, ()) if filled.get(n) is not None]
        if neighbor_values:
            filled[edge_id] = sum(neighbor_values) / len(neighbor_values)
    return filled


def sample_all_hours(tile_id: str, topology: dict, hours: list[str]) -> dict:
    lons, lats, offsets = build_sample_points(topology)
    adjacency = topology["adjacency"]

    temp_c_by_hour: dict[str, dict[str, float | None]] = {}
    peak_c_by_hour: dict[str, dict[str, float | None]] = {}
    dropped_edge_ids: set[str] = set()

    for hour in hours:
        raster_path = fetch_heatmap_tile.geotiff_path(tile_id, hour)
        temp_c, peak_c = sample_hour(raster_path, lons, lats, offsets)
        temp_c = _neighbor_fill(temp_c, adjacency)
        peak_c = _neighbor_fill(peak_c, adjacency)

        for edge_id in offsets:
            if temp_c[edge_id] is None or peak_c[edge_id] is None:
                dropped_edge_ids.add(edge_id)

        temp_c_by_hour[hour] = temp_c
        peak_c_by_hour[hour] = peak_c

    return {
        "temp_c": temp_c_by_hour,
        "peak_c": peak_c_by_hour,
        "dropped_edge_ids": dropped_edge_ids,
    }
