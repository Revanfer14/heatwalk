from typing import Any

import numpy as np
from pyproj import Transformer
from shapely.geometry import Point, shape

from pipeline.config import NODATA_SENTINELS, UTM_EPSG

VALUE_KEY_CANDIDATES = (
    "average_temperature",
    "value",
    "tcm",
    "temperature",
    "temp_c",
    "temperature_c",
    "mean",
    "avg_temp",
)

PEAK_KEY_CANDIDATES = ("max_temperature", "average_temperature", "value")


def _find_value_key(properties: dict[str, Any]) -> str:
    for key in VALUE_KEY_CANDIDATES:
        if key in properties:
            return key
    raise KeyError(
        f"Tidak ada key suhu yang dikenali di properties tile: {sorted(properties.keys())}"
    )


def detect_value_key(map_data: dict[str, Any]) -> str:
    features = map_data.get("features", [])
    if not features:
        raise ValueError("map_data tidak punya features")
    return _find_value_key(features[0].get("properties", {}))


def tile_values(map_data: dict[str, Any]) -> tuple[np.ndarray, int, int]:
    features = map_data.get("features", [])
    value_key = detect_value_key(map_data)
    raw = [f.get("properties", {}).get(value_key) for f in features]

    null_count = sum(1 for v in raw if v is None)
    sentinel_count = sum(1 for v in raw if v is not None and v in NODATA_SENTINELS)

    values = np.array(
        [np.nan if (v is None or v in NODATA_SENTINELS) else float(v) for v in raw],
        dtype=float,
    )
    return values, null_count, sentinel_count


def describe(values: np.ndarray) -> dict[str, float]:
    valid = values[~np.isnan(values)]
    total = len(values)
    if len(valid) == 0:
        return {"min": float("nan"), "p05": float("nan"), "median": float("nan"),
                "p95": float("nan"), "max": float("nan"), "pct_valid": 0.0}
    return {
        "min": float(np.min(valid)),
        "p05": float(np.percentile(valid, 5)),
        "median": float(np.median(valid)),
        "p95": float(np.percentile(valid, 95)),
        "max": float(np.max(valid)),
        "pct_valid": 100.0 * len(valid) / total,
    }


def tile_size_meters(map_data: dict[str, Any], utm_epsg: int = UTM_EPSG) -> float | None:
    features = map_data.get("features", [])
    if not features:
        return None
    transformer = Transformer.from_crs("EPSG:4326", f"EPSG:{utm_epsg}", always_xy=True)
    geom = shape(features[0]["geometry"])
    coords = list(geom.exterior.coords) if geom.geom_type == "Polygon" else None
    if not coords:
        return None
    projected = [transformer.transform(lon, lat) for lon, lat in coords]
    xs = [p[0] for p in projected]
    ys = [p[1] for p in projected]
    width = max(xs) - min(xs)
    height = max(ys) - min(ys)
    return round((width + height) / 2, 1)


def value_at(map_data: dict[str, Any], lon: float, lat: float) -> float | None:
    features = map_data.get("features", [])
    value_key = detect_value_key(map_data)
    point = Point(lon, lat)
    for feature in features:
        geom = shape(feature["geometry"])
        if geom.contains(point) or geom.intersects(point):
            raw_value = feature.get("properties", {}).get(value_key)
            if raw_value is None or raw_value in NODATA_SENTINELS:
                return None
            return float(raw_value)
    return None
