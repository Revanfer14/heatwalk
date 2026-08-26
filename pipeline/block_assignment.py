from pipeline.geo_distance import distance_km

MI_PER_KM = 0.621371


def nearest_school(block_lonlat: list[float], schools: list[dict]) -> tuple[dict, float]:
    best_school = None
    best_km = None
    for school in schools:
        km = distance_km(block_lonlat, [school["lon"], school["lat"]])
        if best_km is None or km < best_km:
            best_km, best_school = km, school
    return best_school, best_km


def nearest_school_within_radius(block_lonlat: list[float], schools: list[dict]) -> tuple[dict, float] | None:
    school, distance_km_value = nearest_school(block_lonlat, schools)
    distance_mi = distance_km_value * MI_PER_KM
    if distance_mi > school["walk_radius_mi"]:
        return None
    return school, distance_km_value
