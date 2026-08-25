from pipeline import fetch_heatmap_tile, write_out
from pipeline.config import DATA_OUT_DIR, FETCH_HOURS, TILES


def build_tiles_manifest(fetch_results_by_tile: dict[str, list[dict]]) -> list[dict]:
    manifest = []
    for tile in TILES:
        results = fetch_results_by_tile[tile["id"]]
        hours_fetched = [row["hour"] for row in results if row["status"] == "ok"]
        status = "done" if hours_fetched else "failed_no_coverage"
        manifest.append(
            {
                "id": tile["id"],
                "bbox": list(tile["bbox"]),
                "status": status,
                "hours_fetched": hours_fetched,
            }
        )
    return manifest


def fetch_all_tiles() -> dict[str, list[dict]]:
    return {
        tile["id"]: fetch_heatmap_tile.fetch_tile_all_hours(tile["id"], tile["bbox"], FETCH_HOURS)
        for tile in TILES
    }


def main() -> None:
    fetch_results_by_tile = fetch_all_tiles()
    manifest = build_tiles_manifest(fetch_results_by_tile)

    for tile_manifest in manifest:
        if not tile_manifest["hours_fetched"]:
            raise RuntimeError(
                f"Tile {tile_manifest['id']}: NaN >10% (atau kosong) di SEMUA jam. "
                "Kemungkinan bbox keluar cakupan API — lapor, jangan lanjut. "
                "Lihat fail branch [Fase 1.5] di heatwalk-dev-plan.md."
            )

    write_out.write_json(DATA_OUT_DIR / "tiles.json", manifest)
    write_out.mirror_to_web()

    print("\ntiles.json ditulis:")
    for tile_manifest in manifest:
        print(f"  {tile_manifest['id']}: status={tile_manifest['status']} hours_fetched={tile_manifest['hours_fetched']}")


if __name__ == "__main__":
    main()
