from pipeline import config, fg_client


def _aoi_polygon(bbox: tuple[float, float, float, float]) -> dict:
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


def probe_tcm() -> dict:
    payload = {
        "polygon_aoi": _aoi_polygon(config.VERIFY_AOI_BBOX),
        "date_time": {
            "start_date": config.VERIFY_DATE,
            "start_time": config.VERIFY_HOUR_LOCAL,
            "filter_type": 1,
        },
        "granularity": config.GRANULARITY_M,
        "analytic_type": "tcm",
    }
    return fg_client.run("heatmap", payload)


def probe_exceedance() -> dict:
    payload = {
        "polygon_aoi": _aoi_polygon(config.VERIFY_AOI_BBOX),
        "date_time": {
            "start_date": config.VERIFY_DATE,
            "start_time": "06:00",
            "end_time": "18:00",
            "filter_type": 2,
        },
        "granularity": config.GRANULARITY_M,
        "analytic_type": "exceedance",
        "threshold": config.VERIFY_EXCEEDANCE_THRESHOLD_C,
        "direction": "above",
    }
    return fg_client.run("heatmap", payload)


def probe_persistence() -> dict:
    payload = {
        "polygon_aoi": _aoi_polygon(config.VERIFY_AOI_BBOX),
        "date_time": {
            "start_date": config.VERIFY_DATE,
            "start_time": "06:00",
            "end_time": "18:00",
            "filter_type": 2,
        },
        "granularity": config.GRANULARITY_M,
        "analytic_type": "persistence",
        "threshold": config.VERIFY_EXCEEDANCE_THRESHOLD_C,
        "direction": "above",
    }
    return fg_client.run("heatmap", payload)


def probe_env_params(tcm_temperature_c: float) -> dict:
    payload = {
        "latitude": config.VERIFY_STATION_LAT,
        "longitude": config.VERIFY_STATION_LON,
        "temperature": tcm_temperature_c,
        "date_time": {
            "start_date": config.VERIFY_DATE,
            "start_time": config.VERIFY_HOUR_LOCAL,
            "filter_type": 1,
        },
        "analysis": [
            "wet_bulb_temperature_celsius",
            "relative_humidity_percent",
            "solar_irradiance",
        ],
    }
    return fg_client.run("env_params", payload)
