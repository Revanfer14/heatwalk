from pipeline import classification


def build_blocks_hours(routed: dict) -> dict[str, dict[str, dict]]:
    threshold = routed["meta"]["threshold"]
    hours = routed["meta"]["hours"]

    blocks_hours: dict[str, dict[str, dict]] = {}
    for block_id, record in routed["blocks"].items():
        by_hour: dict[str, dict] = {}
        for hour in hours:
            shortest_hour = record["shortest"]["by_hour"].get(hour)
            coolest_hour = record["coolest"]["by_hour"].get(hour)
            if shortest_hour is None or coolest_hour is None:
                continue

            shortest_dose = shortest_hour["dose"]
            coolest_dose = coolest_hour["dose"]
            by_hour[hour] = {
                "shortest": shortest_dose,
                "coolest": coolest_dose,
                "class": classification.classify(shortest_dose, coolest_dose, threshold),
            }
        blocks_hours[block_id] = by_hour

    return blocks_hours
