MI_PER_KM = 0.621371


def dose_equivalent_radius_mi(routed: dict) -> float:
    canonical_hour = routed["meta"]["canonical_hour"]
    threshold = routed["meta"]["threshold"]

    under_threshold_distances = [
        record["distance_mi"]
        for record in routed["blocks"].values()
        if record["coolest"]["by_hour"].get(canonical_hour, {}).get("dose", float("inf")) <= threshold
    ]
    return round(max(under_threshold_distances), 3) if under_threshold_distances else 0.0


def dose_equivalent_radius_conservative_mi(routed: dict) -> float:
    canonical_hour = routed["meta"]["canonical_hour"]
    threshold = routed["meta"]["threshold"]

    over_threshold_distances = [
        record["distance_mi"]
        for record in routed["blocks"].values()
        if record["coolest"]["by_hour"].get(canonical_hour, {}).get("dose", 0.0) > threshold
    ]
    return round(min(over_threshold_distances), 3) if over_threshold_distances else 0.0
