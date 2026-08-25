import csv

from pipeline import config, fg_client, heatmap_fetch, heatmap_stats
from pipeline.config import DATA_OUT_DIR

REPORT_PATH = DATA_OUT_DIR / "aoi_scout.csv"

FIELDNAMES = [
    "name", "bbox", "date", "hour", "granularity_m",
    "n_cells", "p05", "median", "p95", "contrast_c", "pct_valid", "verdict",
]


def verdict_for(contrast_c: float) -> str:
    if contrast_c >= config.AOI_CONTRAST_GATE_C:
        return "LULUS"
    if contrast_c < config.AOI_CONTRAST_ABORT_C:
        return "GAGAL"
    return "AMBIGU"


def scout_one(name: str, bbox: tuple[float, float, float, float]) -> dict:
    result = heatmap_fetch.fetch_tcm(bbox, config.AOI_SCOUT_DATE, config.AOI_SCOUT_HOUR, config.GRANULARITY_M)
    map_data = result["data"]["result"]["map_data"]
    n_cells = len(map_data.get("features", []))
    base = {
        "name": name, "bbox": bbox, "date": config.AOI_SCOUT_DATE,
        "hour": config.AOI_SCOUT_HOUR, "granularity_m": config.GRANULARITY_M,
    }
    if n_cells == 0:
        return {
            **base, "n_cells": 0, "p05": None, "median": None, "p95": None,
            "contrast_c": None, "pct_valid": 0.0, "verdict": "KOSONG SENYAP",
        }
    values, _null_count, _sentinel_count = heatmap_stats.tile_values(map_data)
    stats = heatmap_stats.describe(values)
    contrast_c = round(stats["p95"] - stats["p05"], 2)
    return {
        **base, "n_cells": n_cells,
        "p05": round(stats["p05"], 2), "median": round(stats["median"], 2),
        "p95": round(stats["p95"], 2), "contrast_c": contrast_c,
        "pct_valid": round(stats["pct_valid"], 1), "verdict": verdict_for(contrast_c),
    }


def write_report(rows: list[dict]) -> None:
    DATA_OUT_DIR.mkdir(parents=True, exist_ok=True)
    with REPORT_PATH.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDNAMES)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def print_ranking(rows: list[dict]) -> None:
    ranked = sorted(rows, key=lambda r: (r["contrast_c"] is None, -(r["contrast_c"] or 0)))
    print(f"\n{'kandidat':30} {'kontras (p95-p05)':>18} {'n_cells':>8}  verdict")
    for row in ranked:
        contrast_display = f"{row['contrast_c']:.2f}C" if row["contrast_c"] is not None else "n/a"
        print(f"{row['name']:30} {contrast_display:>18} {row['n_cells']:>8}  {row['verdict']}")


def main() -> None:
    credits_before = fg_client.check_credits()["credit_summary"]["cycle_credits_used"]

    rows = [scout_one(name, bbox) for name, bbox in config.AOI_SCOUT_CANDIDATES.items()]

    write_report(rows)
    print_ranking(rows)

    scored = [r for r in rows if r["contrast_c"] is not None]
    best = max(scored, key=lambda r: r["contrast_c"], default=None)
    print(f"\nGerbang: kontras >= {config.AOI_CONTRAST_GATE_C}C LULUS, "
          f"< {config.AOI_CONTRAST_ABORT_C}C GAGAL, di antaranya AMBIGU.")
    if best is None:
        print("Semua kandidat kosong senyap — tidak ada kandidat yang bisa dinilai.")
    else:
        print(f"Kandidat terbaik: {best['name']} ({best['contrast_c']}C) -> {best['verdict']}")

    credits_after = fg_client.check_credits()["credit_summary"]["cycle_credits_used"]
    print(f"\nKredit terpakai run ini: {credits_after - credits_before}")


if __name__ == "__main__":
    main()
