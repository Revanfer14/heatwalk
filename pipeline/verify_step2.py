import json
import sys
from pathlib import Path

from pipeline import edge_geometry
from pipeline.config import DATA_OUT_DIR, LAMBDA_DETOUR_CANDIDATES, TILES
from pipeline.dose import dose_c_min
from pipeline.make_fixtures import _check_no_orphan_edges

GRAPH_META_KEYS = {"school_id", "tile_id", "crs"}
GRAPH_EDGE_KEYS = {"u", "v", "len_m", "geom"}
TEMPS_META_KEYS = {"hours", "canonical_hour", "baseline_c", "threshold", "lambda_detour", "fetched_at"}

GRAPH_JSON_MAX_BYTES = 5 * 1024 * 1024
TEMPS_JSON_TARGET_BYTES = 500 * 1024

SANITY_TEMP_C = 43.0
SANITY_BASELINE_C = 33.0
SANITY_LEN_M = 100.0
SANITY_EXPECTED_DOSE = 13.9
SANITY_TOLERANCE = 0.05

MAX_DROPPED_EDGE_RATIO = 0.02


def _load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def check_sanity_dose(errors: list[str]) -> None:
    computed = dose_c_min(SANITY_TEMP_C, SANITY_LEN_M, baseline_c=SANITY_BASELINE_C)
    if abs(computed - SANITY_EXPECTED_DOSE) > SANITY_TOLERANCE:
        errors.append(
            f"sanity dosis gagal: dose({SANITY_TEMP_C}C, {SANITY_LEN_M}m, baseline={SANITY_BASELINE_C}) "
            f"= {computed:.3f}, diharap ~{SANITY_EXPECTED_DOSE}"
        )


def check_schema(school_id: str, graph: dict, temps: dict, errors: list[str]) -> None:
    if set(graph["meta"]) != GRAPH_META_KEYS:
        errors.append(f"{school_id}: meta graph.json tidak cocok kontrak: {set(graph['meta'])}")
    if set(temps["meta"]) != TEMPS_META_KEYS:
        errors.append(f"{school_id}: meta temps.json tidak cocok kontrak: {set(temps['meta'])}")

    sample_edge_id = next(iter(graph["edges"]), None)
    if sample_edge_id is not None and set(graph["edges"][sample_edge_id]) != GRAPH_EDGE_KEYS:
        errors.append(f"{school_id}: field edge graph.json tidak cocok kontrak")

    sample_hours = next(iter(temps["edges"].values()), {})
    for triple in sample_hours.values():
        if len(triple) != 3:
            errors.append(f"{school_id}: nilai edge temps.json bukan triple [temp_c, peak_c, dose]")
        break

    if temps["meta"]["lambda_detour"] not in LAMBDA_DETOUR_CANDIDATES:
        errors.append(
            f"{school_id}: lambda_detour {temps['meta']['lambda_detour']} bukan salah satu "
            f"LAMBDA_DETOUR_CANDIDATES"
        )


def check_sizes(school_id: str, graph_path: Path, temps_path: Path, errors: list[str], notes: list[str]) -> None:
    graph_bytes = graph_path.stat().st_size
    temps_bytes = temps_path.stat().st_size
    if graph_bytes > GRAPH_JSON_MAX_BYTES:
        errors.append(f"{school_id}: graph.json {graph_bytes} byte > gerbang 5 MB")
    if temps_bytes > TEMPS_JSON_TARGET_BYTES:
        notes.append(
            f"{school_id}: temps.json {temps_bytes / 1024:.0f} KB melewati target 500 KB "
            "(keputusan cakupan seluruh-tile per sekolah, lihat docs/METHODOLOGY.md)"
        )


def check_values(school_id: str, graph: dict, temps: dict, errors: list[str]) -> None:
    for edge_id, edge in graph["edges"].items():
        if edge["len_m"] <= 0:
            errors.append(f"{school_id}: len_m<=0 di {edge_id}")

    for edge_id, per_hour in temps["edges"].items():
        for hour, (temp_c, peak_c, dose_value) in per_hour.items():
            if dose_value < 0:
                errors.append(f"{school_id}: dose negatif di {edge_id}@{hour}")
            if temp_c != temp_c or peak_c != peak_c or dose_value != dose_value:
                errors.append(f"{school_id}: NaN di {edge_id}@{hour}")
            if peak_c < temp_c:
                errors.append(f"{school_id}: peak_c < temp_c di {edge_id}@{hour}")


def check_hourly_curve(school_id: str, temps: dict, errors: list[str]) -> None:
    hours = temps["meta"]["hours"]
    canonical_hour = temps["meta"]["canonical_hour"]
    if canonical_hour not in hours:
        errors.append(f"{school_id}: canonical_hour {canonical_hour} tidak ada di meta.hours")
        return

    means: dict[str, float] = {}
    for hour in hours:
        values = [per_hour[hour][0] for per_hour in temps["edges"].values() if hour in per_hour]
        if values:
            means[hour] = sum(values) / len(values)

    if not means:
        errors.append(f"{school_id}: kurva jam kosong")
        return

    peak_hour = max(means, key=means.get)
    if peak_hour != canonical_hour:
        errors.append(f"{school_id}: puncak kurva jam {peak_hour} != canonical_hour {canonical_hour}")

    first_hour = hours[0]
    if first_hour in means and means[canonical_hour] <= means[first_hour]:
        errors.append(f"{school_id}: suhu rata-rata jam kanonik tidak lebih tinggi dari jam pertama")


def check_dropped_edge_ratio(tile: dict, sample_graph: dict, errors: list[str], notes: list[str]) -> None:
    topology = edge_geometry.build_topology(tile["id"], tile["bbox"])
    total_before_drop = topology["total_edges_considered"]
    kept_after_topology_drop = len(topology["edges"])
    kept_in_output = len(sample_graph["edges"])

    dropped_total = total_before_drop - kept_in_output
    ratio = dropped_total / total_before_drop if total_before_drop else 0.0
    notes.append(
        f"edge dibuang: {dropped_total}/{total_before_drop} ({ratio:.2%}) - "
        f"self-loop/zero-length={total_before_drop - kept_after_topology_drop}, "
        f"gagal sampling={kept_after_topology_drop - kept_in_output}"
    )
    if ratio >= MAX_DROPPED_EDGE_RATIO:
        errors.append(f"edge dibuang {ratio:.2%} dari total >= gerbang 2%")


def main() -> int:
    schools = _load(DATA_OUT_DIR / "schools.json")
    errors: list[str] = []
    notes: list[str] = []

    check_sanity_dose(errors)

    sample_graph = None
    for school in schools:
        school_dir = DATA_OUT_DIR / "by_school" / school["id"]
        graph_path = school_dir / "graph.json"
        temps_path = school_dir / "temps.json"
        graph = _load(graph_path)
        temps = _load(temps_path)
        sample_graph = sample_graph or graph

        check_schema(school["id"], graph, temps, errors)
        check_sizes(school["id"], graph_path, temps_path, errors, notes)
        _check_no_orphan_edges(graph["edges"], temps)
        check_values(school["id"], graph, temps, errors)
        check_hourly_curve(school["id"], temps, errors)

    if sample_graph is not None:
        check_dropped_edge_ratio(TILES[0], sample_graph, errors, notes)

    print(f"sekolah diperiksa: {len(schools)}")
    for note in notes:
        print(f"CATATAN: {note}")

    if errors:
        print(f"\nGAGAL - {len(errors)} masalah:")
        for error in errors:
            print(f"  - {error}")
        return 1

    print("\nSemua verifikasi Fase 2 lulus.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
