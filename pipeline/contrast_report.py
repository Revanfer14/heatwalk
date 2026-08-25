CONTRAST_REPORT_COLUMNS = (
    "school_id", "block_id", "hour",
    "shortest_len_m", "coolest_len_m",
    "shortest_mean_c", "coolest_mean_c", "delta_mean_c",
    "shortest_dose", "coolest_dose", "delta_dose_pct",
    "detour_ratio",
)


def _row(school_id: str, block_id: str, hour: str, shortest: dict, coolest: dict, shortest_len_m: float) -> dict:
    delta_mean_c = round(coolest["mean_c"] - shortest["mean_c"], 3)
    delta_dose_pct = (
        round((coolest["dose"] - shortest["dose"]) / shortest["dose"] * 100, 1) if shortest["dose"] > 0 else 0.0
    )
    return {
        "school_id": school_id,
        "block_id": block_id,
        "hour": hour,
        "shortest_len_m": shortest_len_m,
        "coolest_len_m": coolest["len_m"],
        "shortest_mean_c": shortest["mean_c"],
        "coolest_mean_c": coolest["mean_c"],
        "delta_mean_c": delta_mean_c,
        "shortest_dose": shortest["dose"],
        "coolest_dose": coolest["dose"],
        "delta_dose_pct": delta_dose_pct,
        "detour_ratio": coolest["detour_ratio"],
    }


def build_all_rows(routed_by_school: dict[str, dict]) -> list[dict]:
    rows: list[dict] = []
    for school_id, routed in routed_by_school.items():
        canonical_hour = routed["meta"]["canonical_hour"]
        for block_id, record in routed["blocks"].items():
            shortest = record["shortest"]["by_hour"].get(canonical_hour)
            coolest = record["coolest"]["by_hour"].get(canonical_hour)
            if shortest is None or coolest is None:
                continue
            rows.append(_row(school_id, block_id, canonical_hour, shortest, coolest, record["shortest"]["len_m"]))
    return rows


def top_n_by_abs_delta(rows: list[dict], top_n: int) -> list[dict]:
    return sorted(rows, key=lambda row: abs(row["delta_mean_c"]), reverse=True)[:top_n]


def write_csv(path, rows: list[dict]) -> None:
    lines = [",".join(CONTRAST_REPORT_COLUMNS)]
    for row in rows:
        lines.append(",".join(str(row[column]) for column in CONTRAST_REPORT_COLUMNS))
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
