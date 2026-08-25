BlockClass = str

STATUS_REC_BY_CLASS = {"green": "walk", "yellow": "reroute", "red": "bus_eligible"}

BLOCK_PROPERTY_KEYS = (
    "block_id", "school_id", "kids_est", "class", "shortest", "coolest",
    "delta_mean_c", "delta_dose_pct", "distance_mi", "status_now",
    "status_rec", "reason", "safe_until_hour",
)


def classify(shortest_dose: float, coolest_dose: float, threshold: float) -> BlockClass:
    if shortest_dose <= threshold:
        return "green"
    if coolest_dose <= threshold:
        return "yellow"
    return "red"


def status_now_for(distance_mi: float, walk_radius_mi: float) -> str:
    return "walk" if distance_mi <= walk_radius_mi else "bus"


def status_rec_for(block_class: BlockClass) -> str:
    return STATUS_REC_BY_CLASS[block_class]


def reason_for(block_class: BlockClass, shortest: dict, coolest: dict, threshold: float) -> str:
    if block_class == "red":
        return (
            f"Coolest route mean {coolest['mean_c']:.1f}C exceeds threshold "
            f"({threshold:.0f} C-min dose, actual {coolest['dose']:.0f})."
        )
    if block_class == "yellow":
        return (
            f"Shortest route exceeds threshold, but coolest route mean {coolest['mean_c']:.1f}C "
            f"stays under it (dose {coolest['dose']:.0f})."
        )
    return f"Shortest route already under threshold (dose {shortest['dose']:.0f})."


def safe_until_hour(
    coolest_by_hour: dict[str, dict], hours: list[str], threshold: float, block_class: BlockClass
) -> str | None:
    if block_class != "red":
        return None
    previous_hour = None
    for hour in hours:
        hour_stats = coolest_by_hour.get(hour)
        if hour_stats is None:
            continue
        if hour_stats["dose"] > threshold:
            return previous_hour
        previous_hour = hour
    return None
