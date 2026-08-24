from datetime import datetime, timedelta, timezone

from pipeline import config, fg_client, heatmap_stats, metar_client, step0_probes


def report_value_stats(map_data: dict) -> dict:
    values, null_count, sentinel_count = heatmap_stats.tile_values(map_data)
    stats = heatmap_stats.describe(values)
    print("\n=== 1. Statistik nilai (tcm) ===")
    print(f"min={stats['min']:.2f} p05={stats['p05']:.2f} median={stats['median']:.2f} "
          f"p95={stats['p95']:.2f} max={stats['max']:.2f}")
    print(f"jumlah null: {null_count} | jumlah -999: {sentinel_count} | %valid: {stats['pct_valid']:.1f}%")
    return stats


def report_shape(map_data: dict) -> None:
    features = map_data.get("features", [])
    value_key = heatmap_stats.detect_value_key(map_data) if features else "?"
    size_m = heatmap_stats.tile_size_meters(map_data)
    print("\n=== 2. Bentuk respons ===")
    print(f"jumlah tile: {len(features)}")
    print(f"tipe geometri: {features[0]['geometry']['type'] if features else '?'}")
    print(f"key nilai terdeteksi di properties: '{value_key}'")
    print(f"CRS asumsi: EPSG:4326 (GeoJSON standar)")
    print(f"ukuran tile terukur (setelah reproyeksi EPSG:{config.UTM_EPSG}): {size_m} m")
    print(f"granularity diminta: {config.GRANULARITY_M} m -> {'COCOK' if size_m and abs(size_m - config.GRANULARITY_M) <= 5 else 'TIDAK COCOK, cek ulang'}")


def _local_to_utc(date_str: str, hhmm: str, utc_offset_hours: int) -> datetime:
    naive = datetime.strptime(f"{date_str} {hhmm}", "%Y-%m-%d %H:%M")
    return naive.replace(tzinfo=timezone(timedelta(hours=utc_offset_hours))).astimezone(timezone.utc)


def report_ground_truth(map_data: dict) -> tuple[float | None, float | None, str]:
    tile_temp = heatmap_stats.value_at(map_data, config.VERIFY_STATION_LON, config.VERIFY_STATION_LAT)
    utc_if_local = _local_to_utc(config.VERIFY_DATE, config.VERIFY_HOUR_LOCAL, config.AOI_UTC_OFFSET_HOURS)
    utc_if_already_utc = datetime.strptime(
        f"{config.VERIFY_DATE} {config.VERIFY_HOUR_LOCAL}", "%Y-%m-%d %H:%M"
    ).replace(tzinfo=timezone.utc)

    metar_local_interp = metar_client.nearest_temperature_c(config.VERIFY_STATION_ICAO, config.VERIFY_DATE, utc_if_local)
    metar_utc_interp = metar_client.nearest_temperature_c(config.VERIFY_STATION_ICAO, config.VERIFY_DATE, utc_if_already_utc)

    print("\n=== 3 & 4. Ground truth + konvensi jam ===")
    print(f"nilai tile di titik KPHX ({config.VERIFY_STATION_LAT}, {config.VERIFY_STATION_LON}): {tile_temp}")
    print(f"METAR jika start_time = waktu lokal Phoenix (UTC{config.AOI_UTC_OFFSET_HOURS:+d}): {metar_local_interp}")
    print(f"METAR jika start_time = UTC langsung: {metar_utc_interp}")

    convention = "tidak dapat ditentukan (tile_temp kosong)"
    if tile_temp is not None:
        if metar_local_interp is not None and abs(tile_temp - metar_local_interp) <= config.TCM_AIR_TEMP_TOLERANCE_C:
            convention = "start_time adalah WAKTU LOKAL AOI"
        elif metar_utc_interp is not None and abs(tile_temp - metar_utc_interp) <= config.TCM_AIR_TEMP_TOLERANCE_C:
            convention = "start_time adalah UTC"
        else:
            convention = "TIDAK COCOK dengan kedua interpretasi zona waktu"
    print(f"kesimpulan konvensi waktu: {convention}")

    best_metar = metar_local_interp if "LOKAL" in convention else metar_utc_interp
    return tile_temp, best_metar, convention


def report_tier_status(results: dict[str, dict | Exception]) -> None:
    print("\n=== 5. Status tier Basic per probe ===")
    for name, result in results.items():
        status = "OK" if not isinstance(result, Exception) else f"GAGAL: {result}"
        print(f"{name}: {status}")


def gate_decision(tile_temp: float | None, metar_temp: float | None) -> str:
    print("\n=== GERBANG tcm ===")
    if tile_temp is None or metar_temp is None:
        return "TIDAK DAPAT DIPUTUSKAN — data tidak lengkap. STOP dan lapor."
    delta = tile_temp - metar_temp
    print(f"tile_tcm={tile_temp:.2f}C, metar={metar_temp:.2f}C, delta={delta:+.2f}C")
    if abs(delta) <= config.TCM_AIR_TEMP_TOLERANCE_C:
        return f"LULUS: dalam +-{config.TCM_AIR_TEMP_TOLERANCE_C}C -> tcm = suhu udara ambien. Lanjut Fase 1."
    if delta >= config.TCM_SURFACE_TEMP_DELTA_C:
        return "GAGAL: delta >= +8C secara sistematis -> tcm kemungkinan suhu permukaan. STOP, lapor, jangan lanjut."
    return "AMBIGU: di luar toleransi tapi di bawah ambang permukaan. STOP dan lapor untuk keputusan manual."


def _run_probes() -> dict[str, dict | Exception]:
    results: dict[str, dict | Exception] = {}
    for name, probe in (
        ("tcm", step0_probes.probe_tcm),
        ("exceedance", step0_probes.probe_exceedance),
        ("persistence", step0_probes.probe_persistence),
    ):
        try:
            results[name] = probe()
        except Exception as exc:
            results[name] = exc
    return results


def main() -> None:
    print("HeatWalk — step0_verify_api")
    print(f"AOI verifikasi: {config.VERIFY_AOI_BBOX}")
    print(f"Tanggal/jam: {config.VERIFY_DATE} {config.VERIFY_HOUR_LOCAL} (lokal, asumsi awal)")

    credits_before = fg_client.check_credits()
    results = _run_probes()

    tcm_result = results.get("tcm")
    if isinstance(tcm_result, dict):
        map_data = tcm_result["data"]["result"]["map_data"]
        stats = report_value_stats(map_data)
        report_shape(map_data)
        tile_temp, metar_temp, _convention = report_ground_truth(map_data)

        try:
            results["env_params"] = step0_probes.probe_env_params(
                tile_temp if tile_temp is not None else stats["median"]
            )
        except Exception as exc:
            results["env_params"] = exc
    else:
        tile_temp, metar_temp = None, None
        print("\nTCM probe gagal, laporan 1-4 dilewati.")
        results["env_params"] = RuntimeError("dilewati karena tcm gagal")

    report_tier_status(results)

    verdict = gate_decision(tile_temp, metar_temp)
    print(f"\n{verdict}")

    credits_after = fg_client.check_credits()
    print("\n=== Kredit ===")
    print(f"sebelum: {credits_before}")
    print(f"sesudah: {credits_after}")


if __name__ == "__main__":
    main()
