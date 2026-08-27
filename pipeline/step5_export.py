import json
import math

from pyproj import Transformer
from shapely.geometry import shape
from shapely.ops import transform, unary_union

from pipeline import (
    block_geometry,
    blocks_hours,
    census_acs,
    classification,
    enrollment_calibration,
    segment_priority,
    summary_build,
)
from pipeline.config import (
    DATA_INTERIM_DIR,
    DATA_OUT_DIR,
    EXCEEDANCE_STATION_ICAO,
    EXCEEDANCE_STATION_END_DATE,
    EXCEEDANCE_STATION_START_DATE,
    FETCH_DATE,
    SUBGRAPH_CATCHMENT_BUFFER_KM,
    TILES,
    utm_epsg_for_lon,
)
from pipeline.exceedance import school_years_spanned, station_temp_at_local_hour_by_date
from pipeline.graph_integrity import check_no_orphan_edges
from pipeline.subgraph_prune import prune_to_catchment
from pipeline.write_out import mirror_to_web, write_json

CLASSIFIED_DIR = DATA_INTERIM_DIR / "classified"
ROUTES_DIR = DATA_INTERIM_DIR / "routes"
MI_TO_M = 1609.34


def _load_json(path) -> dict | list:
    return json.loads(path.read_text(encoding="utf-8"))


def build_blocks_geojson(classified_blocks: list[dict], polygons_by_geoid: dict[str, dict]) -> dict:
    features = []
    for block in classified_blocks:
        geometry = polygons_by_geoid.get(block["block_id"])
        if geometry is None:
            continue
        properties = {key: block[key] for key in classification.BLOCK_PROPERTY_KEYS}
        features.append({"type": "Feature", "geometry": geometry, "properties": properties})
    return {"type": "FeatureCollection", "features": features}


def build_district_blocks_geojson(blocks_geojson_by_school: dict[str, dict]) -> dict:
    features = [
        feature
        for blocks_geojson in blocks_geojson_by_school.values()
        for feature in blocks_geojson["features"]
    ]
    return {"type": "FeatureCollection", "features": features}


def build_district_blocks_hours(blocks_hours_by_school: dict[str, dict]) -> dict:
    merged: dict[str, dict] = {}
    for blocks_hours_payload in blocks_hours_by_school.values():
        merged.update(blocks_hours_payload)
    return merged


def _dose_zone_area_m2(classified_blocks: list[dict], polygons_by_geoid: dict[str, dict], to_utm) -> float:
    non_red_geometries = [
        transform(to_utm, shape(polygons_by_geoid[block["block_id"]]))
        for block in classified_blocks
        if block["class"] != "red" and block["block_id"] in polygons_by_geoid
    ]
    if not non_red_geometries:
        return 0.0
    return unary_union(non_red_geometries).area


def report_g5(schools: list[dict], classified_by_school: dict[str, list[dict]], polygons_by_geoid: dict[str, dict], utm_epsg: int) -> None:
    to_utm = Transformer.from_crs("EPSG:4326", f"EPSG:{utm_epsg}", always_xy=True).transform

    print("\nG5 — selisih luas lingkaran kebijakan vs zona dosis (dilaporkan, bukan gerbang):")
    for school in schools:
        classified_blocks = classified_by_school[school["id"]]
        policy_area_m2 = math.pi * (school["walk_radius_mi"] * MI_TO_M) ** 2
        dose_zone_area_m2 = _dose_zone_area_m2(classified_blocks, polygons_by_geoid, to_utm)
        delta_pct = round((dose_zone_area_m2 - policy_area_m2) / policy_area_m2 * 100, 1)
        print(
            f"  {school['id']:32s} lingkaran={policy_area_m2 / 1e6:6.2f} km2  "
            f"zona_dosis={dose_zone_area_m2 / 1e6:6.2f} km2  delta={delta_pct:+.1f}%"
        )


def main() -> None:
    schools = _load_json(DATA_OUT_DIR / "schools.json")
    tile = TILES[0]

    classified_by_school = {
        school["id"]: _load_json(CLASSIFIED_DIR / f"{school['id']}.json") for school in schools
    }
    routed_by_school = {
        school["id"]: _load_json(ROUTES_DIR / f"{school['id']}.json") for school in schools
    }

    polygons_by_geoid = block_geometry.polygons_by_geoid(tile["id"], tile["bbox"])
    median_income_by_block_group = census_acs.median_income_by_block_group(tile["id"], tile["bbox"])

    dasymetric_totals = enrollment_calibration.dasymetric_children_by_school(tile["id"], tile["bbox"], schools)
    correction_factors = enrollment_calibration.correction_factors(schools, dasymetric_totals)

    canonical_hour = next(iter(routed_by_school.values()))["meta"]["canonical_hour"]
    daily_station_temps = station_temp_at_local_hour_by_date(
        EXCEEDANCE_STATION_ICAO, EXCEEDANCE_STATION_START_DATE, EXCEEDANCE_STATION_END_DATE,
        tile["timezone"], canonical_hour,
    )
    station_temp_on_fetch_date = daily_station_temps[FETCH_DATE]
    n_years = school_years_spanned(daily_station_temps, tile["timezone"])

    summary = summary_build.build_summary(
        schools, classified_by_school, routed_by_school, correction_factors,
        median_income_by_block_group, daily_station_temps, station_temp_on_fetch_date, n_years,
    )
    write_json(DATA_OUT_DIR / "summary.json", summary)

    street_names = segment_priority.load_street_names(tile["id"])

    blocks_geojson_by_school: dict[str, dict] = {}
    blocks_hours_by_school: dict[str, dict] = {}
    for school in schools:
        blocks_geojson = build_blocks_geojson(classified_by_school[school["id"]], polygons_by_geoid)
        write_json(DATA_OUT_DIR / "by_school" / school["id"] / "blocks.geojson", blocks_geojson)
        blocks_geojson_by_school[school["id"]] = blocks_geojson

        blocks_hours_payload = blocks_hours.build_blocks_hours(routed_by_school[school["id"]])
        write_json(DATA_OUT_DIR / "by_school" / school["id"] / "blocks_hours.json", blocks_hours_payload)
        blocks_hours_by_school[school["id"]] = blocks_hours_payload

        school_dir = DATA_OUT_DIR / "by_school" / school["id"]
        school_graph = _load_json(school_dir / "graph.json")
        school_temps = _load_json(school_dir / "temps.json")
        segments_payload = segment_priority.build_segment_priority(
            routed_by_school[school["id"]], school_graph, school_temps, street_names
        )
        write_json(school_dir / "segments.json", segments_payload)

        pruned_graph, pruned_temps = prune_to_catchment(
            school_graph, school_temps, school, SUBGRAPH_CATCHMENT_BUFFER_KM
        )
        check_no_orphan_edges(pruned_graph["edges"], pruned_temps)
        write_json(school_dir / "graph.json", pruned_graph)
        write_json(school_dir / "temps.json", pruned_temps)

        graph_bytes = (school_dir / "graph.json").stat().st_size
        temps_bytes = (school_dir / "temps.json").stat().st_size
        print(
            f"  {school['id']:32s} subgraph pruned {len(school_graph['edges'])} -> {len(pruned_graph['edges'])} edges "
            f"graph.json={graph_bytes / 1024:.0f}KB temps.json={temps_bytes / 1024:.0f}KB"
        )

    utm_epsg = utm_epsg_for_lon((tile["bbox"][0] + tile["bbox"][2]) / 2)
    report_g5(schools, classified_by_school, polygons_by_geoid, utm_epsg)

    district_blocks = build_district_blocks_geojson(blocks_geojson_by_school)
    write_json(DATA_OUT_DIR / "district_blocks.geojson", district_blocks)
    district_blocks_hours = build_district_blocks_hours(blocks_hours_by_school)
    write_json(DATA_OUT_DIR / "district_blocks_hours.json", district_blocks_hours)
    print(
        f"\ndistrict_blocks.geojson: {len(district_blocks['features'])} fitur, "
        f"district_blocks_hours.json: {len(district_blocks_hours)} blok"
    )

    copied = mirror_to_web()
    print(f"\nfiles copied to web/public/data: {len(copied)}")

    for school_id, summary_row in summary.items():
        print(
            f"  {school_id:32s} in_walk_zone={summary_row['in_walk_zone']:4d} "
            f"reroute_enough={summary_row['reroute_enough']:3d} no_safe_route={summary_row['no_safe_route']:3d}"
        )


if __name__ == "__main__":
    main()
