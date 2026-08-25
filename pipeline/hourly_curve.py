from pathlib import Path

import numpy as np
import osmnx as ox
import rasterio

from pipeline import fetch_heatmap_tile, osm_network


def edge_sample_points(tile_id: str) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    graph = ox.load_graphml(osm_network.graph_path(tile_id))
    edges = ox.graph_to_gdfs(graph, nodes=False, edges=True)
    midpoints = edges.geometry.interpolate(0.5, normalized=True)
    lengths = edges["length"].to_numpy(dtype=float)
    lons = midpoints.x.to_numpy(dtype=float)
    lats = midpoints.y.to_numpy(dtype=float)
    return lons, lats, lengths


def sample_hour_mean_c(raster_path: Path, lons: np.ndarray, lats: np.ndarray, lengths: np.ndarray) -> float | None:
    with rasterio.open(raster_path) as dataset:
        samples = np.array([value[0] for value in dataset.sample(zip(lons, lats))], dtype=float)
    valid = ~np.isnan(samples)
    if valid.sum() == 0:
        return None
    return float(np.average(samples[valid], weights=lengths[valid]))


def build_hourly_curve(tile_id: str, hours_available: list[str]) -> dict[str, float | None]:
    lons, lats, lengths = edge_sample_points(tile_id)
    curve = {}
    for hour in hours_available:
        path = fetch_heatmap_tile.geotiff_path(tile_id, hour)
        curve[hour] = sample_hour_mean_c(path, lons, lats, lengths)
    return curve


def canonical_hour(curve: dict[str, float | None]) -> str:
    valid = {hour: temp for hour, temp in curve.items() if temp is not None}
    if not valid:
        raise RuntimeError("Kurva jam kosong — tidak ada jam dengan suhu valid untuk menentukan canonical_hour.")
    return max(valid, key=valid.get)


def delta_temporal_c(curve: dict[str, float | None]) -> float:
    valid = [temp for temp in curve.values() if temp is not None]
    return round(max(valid) - min(valid), 3)


def print_curve_report(tile_id: str, curve: dict[str, float | None]) -> None:
    print(f"\nKurva jam ({tile_id}), rata-rata suhu berbobot panjang jalan:")
    for hour, temp in curve.items():
        display = f"{temp:.3f}C" if temp is not None else "n/a (jam dibuang)"
        print(f"  {hour}  {display}")
    print(f"canonical_hour = {canonical_hour(curve)}")
    print(f"delta_temporal_c = {delta_temporal_c(curve)}")
