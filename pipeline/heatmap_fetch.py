from pipeline import fg_client
from pipeline.config import GRANULARITY_M_ALLOWED


def aoi_polygon_feature_collection(bbox: tuple[float, float, float, float]) -> dict:
    west, south, east, north = bbox
    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {},
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [west, south], [east, south],
                        [east, north], [west, north], [west, south],
                    ]],
                },
            }
        ],
    }


class UnsupportedStartTimeError(ValueError):
    pass


def _require_whole_hour(hour_local: str) -> None:
    _, minute = hour_local.split(":")
    if minute != "00":
        raise UnsupportedStartTimeError(
            f"FortyGuard start_time hanya menerima menit ':00' — '{hour_local}' akan "
            "diam-diam mengembalikan map_data kosong (n_cells=0), bukan error. "
            "Lihat docs/METHODOLOGY.md bagian granularitas start_time."
        )


class UnsupportedGranularityError(ValueError):
    pass


def _require_allowed_granularity(granularity_m: int) -> None:
    if granularity_m not in GRANULARITY_M_ALLOWED:
        raise UnsupportedGranularityError(
            f"granularity={granularity_m} ditolak FortyGuard (422) — hanya menerima "
            f"{GRANULARITY_M_ALLOWED}. Dicegah di sini supaya tidak membuang kredit "
            "pada validasi yang pasti gagal."
        )


def fetch_tcm(bbox: tuple[float, float, float, float], date: str, hour_local: str, granularity_m: int) -> dict:
    _require_whole_hour(hour_local)
    _require_allowed_granularity(granularity_m)
    payload = {
        "polygon_aoi": aoi_polygon_feature_collection(bbox),
        "date_time": {
            "start_date": date,
            "start_time": hour_local,
            "filter_type": 1,
        },
        "granularity": granularity_m,
        "analytic_type": "tcm",
    }
    return fg_client.run("heatmap", payload)
