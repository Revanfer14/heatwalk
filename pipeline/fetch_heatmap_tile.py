from pathlib import Path

from pipeline import fg_client, heatmap_raster, heatmap_fetch
from pipeline.config import DATA_INTERIM_DIR, FETCH_DATE, GRANULARITY_M

NAN_FRACTION_DROP_THRESHOLD = 0.10


def geotiff_path(tile_id: str, hour_local: str) -> Path:
    return DATA_INTERIM_DIR / "heatmap" / tile_id / f"{hour_local.replace(':', '')}.tif"


def fetch_hour(tile_id: str, bbox: tuple[float, float, float, float], hour_local: str) -> dict:
    result = heatmap_fetch.fetch_tcm(bbox, FETCH_DATE, hour_local, GRANULARITY_M)
    map_data = result["data"]["result"]["map_data"]
    n_cells = len(map_data.get("features", []))
    if n_cells == 0:
        return {"hour": hour_local, "status": "empty", "n_cells": 0, "nan_pct": None}

    grid, transform = heatmap_raster.build_grid(map_data)
    nan_pct = round(heatmap_raster.nan_fraction(grid) * 100, 2)
    path = geotiff_path(tile_id, hour_local)
    heatmap_raster.write_geotiff(path, grid, transform)

    kept = nan_pct <= NAN_FRACTION_DROP_THRESHOLD * 100
    return {
        "hour": hour_local,
        "status": "ok" if kept else "dropped_high_nan",
        "n_cells": n_cells,
        "nan_pct": nan_pct,
        "path": str(path),
    }


def fetch_tile_all_hours(tile_id: str, bbox: tuple[float, float, float, float], hours: list[str]) -> list[dict]:
    credits_before = fg_client.check_credits()["credit_summary"]["cycle_credits_used"]
    results = [fetch_hour(tile_id, bbox, hour) for hour in hours]
    credits_after = fg_client.check_credits()["credit_summary"]["cycle_credits_used"]

    print(f"\nTile {tile_id}: kredit terpakai run ini = {credits_after - credits_before}")
    for row in results:
        print(f"  {row['hour']}  status={row['status']:18} n_cells={row['n_cells']:>6}  nan%={row['nan_pct']}")
    return results
