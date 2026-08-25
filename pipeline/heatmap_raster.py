import statistics
from typing import Any

import numpy as np
import rasterio
from affine import Affine

from pipeline.config import NODATA_SENTINELS
from pipeline.heatmap_stats import detect_value_key


def _cell_bounds(geometry: dict[str, Any]) -> tuple[float, float, float, float]:
    coords = geometry["coordinates"][0]
    xs = [c[0] for c in coords]
    ys = [c[1] for c in coords]
    return min(xs), min(ys), max(xs), max(ys)


def build_grid(map_data: dict[str, Any]) -> tuple[np.ndarray, Affine]:
    features = map_data.get("features", [])
    if not features:
        raise ValueError("map_data tidak punya features")
    value_key = detect_value_key(map_data)
    cell_boxes = [_cell_bounds(f["geometry"]) for f in features]

    pixel_dx = statistics.median(box[2] - box[0] for box in cell_boxes)
    pixel_dy = statistics.median(box[3] - box[1] for box in cell_boxes)
    west = min(box[0] for box in cell_boxes)
    south = min(box[1] for box in cell_boxes)
    east = max(box[2] for box in cell_boxes)
    north = max(box[3] for box in cell_boxes)

    ncols = max(round((east - west) / pixel_dx), 1)
    nrows = max(round((north - south) / pixel_dy), 1)
    grid = np.full((nrows, ncols), np.nan, dtype=np.float32)

    for feature, box in zip(features, cell_boxes):
        raw_value = feature.get("properties", {}).get(value_key)
        if raw_value is None or raw_value in NODATA_SENTINELS:
            continue
        center_x = (box[0] + box[2]) / 2
        center_y = (box[1] + box[3]) / 2
        col = int((center_x - west) / pixel_dx)
        row = int((north - center_y) / pixel_dy)
        if 0 <= row < nrows and 0 <= col < ncols:
            grid[row, col] = float(raw_value)

    transform = Affine.translation(west, north) * Affine.scale(pixel_dx, -pixel_dy)
    return grid, transform


def nan_fraction(grid: np.ndarray) -> float:
    return float(np.isnan(grid).sum()) / grid.size


def write_geotiff(path, grid: np.ndarray, transform: Affine) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with rasterio.open(
        path,
        "w",
        driver="GTiff",
        height=grid.shape[0],
        width=grid.shape[1],
        count=1,
        dtype=grid.dtype,
        crs="EPSG:4326",
        transform=transform,
        nodata=np.nan,
    ) as dataset:
        dataset.write(grid, 1)
