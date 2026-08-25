from pipeline.config import (
    BASELINE_C,
    FETCH_DATE,
    FETCH_HOURS,
    LAMBDA_DETOUR_CANDIDATES,
    THRESHOLD_DOSE_C_MIN,
)
from pipeline.dose import dose_c_min
from pipeline.fixture_geometry import _seeded_unit, edge_midpoint_lon, lon_heat_factor

HOUR_OFFSET_C = {
    "07:00": -3.0,
    "08:00": -2.4,
    "09:00": -1.6,
    "10:00": -0.8,
    "11:00": -0.2,
    "12:00": 0.3,
    "13:00": 0.8,
    "14:00": 1.2,
    "15:00": 1.5,
    "16:00": 0.9,
}

CANONICAL_HOUR = max(HOUR_OFFSET_C, key=HOUR_OFFSET_C.get)

ORLANDO_SPREAD_C = 3.5


def edge_temp_c(eid: str, lon: float, hhmm: str) -> float:
    factor = lon_heat_factor(lon, seed=eid)
    noise = (_seeded_unit("temp", eid, hhmm) - 0.5) * 1.5
    return round(BASELINE_C + factor * ORLANDO_SPREAD_C + HOUR_OFFSET_C[hhmm] + noise, 2)


def edge_peak_c(mean_c: float, eid: str, hhmm: str) -> float:
    bump = 0.8 + _seeded_unit("peak", eid, hhmm) * 0.8
    return round(mean_c + bump, 2)


def edge_dose(temp_c: float, len_m: float) -> float:
    return round(dose_c_min(temp_c, len_m), 2)


def build_temps_payload(edge_topology: dict[str, dict], hours: list[str] = FETCH_HOURS) -> dict:
    edges_payload: dict[str, dict] = {}
    for eid, edge in edge_topology.items():
        lon = edge_midpoint_lon(edge)
        per_hour: dict[str, list[float]] = {}
        for hhmm in hours:
            temp_c = edge_temp_c(eid, lon, hhmm)
            peak_c = edge_peak_c(temp_c, eid, hhmm)
            dose = edge_dose(temp_c, edge["len_m"])
            per_hour[hhmm] = [temp_c, peak_c, dose]
        edges_payload[eid] = per_hour

    return {
        "meta": {
            "hours": hours,
            "canonical_hour": CANONICAL_HOUR,
            "baseline_c": BASELINE_C,
            "threshold": THRESHOLD_DOSE_C_MIN,
            "lambda_detour": LAMBDA_DETOUR_CANDIDATES[1],
            "fetched_at": FETCH_DATE,
        },
        "edges": edges_payload,
    }
