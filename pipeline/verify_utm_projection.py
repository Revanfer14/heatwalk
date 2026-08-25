from pyproj import Geod, Transformer

from pipeline.config import TILES, utm_epsg_for_lon

MAX_DISTORTION_PCT = 1.0

TEST_POINT_PAIRS = [
    ((-81.4763, 28.5722), (-81.4241, 28.6167)),
    ((-81.4763, 28.5722), (-81.4763, 28.6167)),
    ((-81.4241, 28.5722), (-81.4241, 28.6167)),
    ((-81.4502, 28.5945), (-81.4300, 28.6100)),
]


def geodesic_distance_m(a: tuple[float, float], b: tuple[float, float]) -> float:
    geod = Geod(ellps="WGS84")
    _, _, distance_m = geod.inv(a[0], a[1], b[0], b[1])
    return distance_m


def projected_distance_m(a: tuple[float, float], b: tuple[float, float], epsg: int) -> float:
    transformer = Transformer.from_crs("EPSG:4326", f"EPSG:{epsg}", always_xy=True)
    ax, ay = transformer.transform(*a)
    bx, by = transformer.transform(*b)
    return ((bx - ax) ** 2 + (by - ay) ** 2) ** 0.5


def main() -> None:
    bbox = TILES[0]["bbox"]
    center_lon = (bbox[0] + bbox[2]) / 2
    epsg = utm_epsg_for_lon(center_lon)
    print(f"AOI {TILES[0]['id']}: center_lon={center_lon:.4f}, EPSG:{epsg}")

    worst_pct = 0.0
    for a, b in TEST_POINT_PAIRS:
        geodesic = geodesic_distance_m(a, b)
        projected = projected_distance_m(a, b, epsg)
        distortion_pct = abs(projected - geodesic) / geodesic * 100
        worst_pct = max(worst_pct, distortion_pct)
        print(f"  {a} -> {b}: geodesic={geodesic:.2f}m projected={projected:.2f}m distortion={distortion_pct:.4f}%")

    print(f"\nDistorsi terburuk: {worst_pct:.4f}% (ambang {MAX_DISTORTION_PCT}%)")
    if worst_pct > MAX_DISTORTION_PCT:
        raise RuntimeError(
            f"utm_epsg_for_lon({center_lon}) -> EPSG:{epsg} distorsi {worst_pct:.4f}% "
            f"melebihi ambang {MAX_DISTORTION_PCT}% — proyeksi salah untuk AOI ini."
        )
    print("LULUS: distorsi jarak proyeksi UTM vs geodesik di bawah 1% untuk AOI Orlando.")


if __name__ == "__main__":
    main()
