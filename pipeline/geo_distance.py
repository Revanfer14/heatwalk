import math

KM_PER_DEG_LAT = 110.540
KM_PER_DEG_LON_AT_EQUATOR = 111.320


def distance_km(a_lonlat: list[float], b_lonlat: list[float]) -> float:
    lat_mid = math.radians((a_lonlat[1] + b_lonlat[1]) / 2)
    dx_km = (a_lonlat[0] - b_lonlat[0]) * KM_PER_DEG_LON_AT_EQUATOR * math.cos(lat_mid)
    dy_km = (a_lonlat[1] - b_lonlat[1]) * KM_PER_DEG_LAT
    return math.hypot(dx_km, dy_km)
