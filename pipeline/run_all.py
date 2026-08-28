import argparse
import sys

from pipeline import (
    step1_fetch_data,
    step1b_schools,
    step2_build_graph,
    step3_routes,
    step3b_outcomes,
    step4_classify,
    step5_export,
)

PIPELINE_STEPS = [
    ("step1_fetch_data", step1_fetch_data.main),
    ("step1b_schools", step1b_schools.main),
    ("step2_build_graph", step2_build_graph.main),
    ("step3_routes", step3_routes.main),
    ("step3b_outcomes", step3b_outcomes.main),
    ("step4_classify", step4_classify.main),
    ("step5_export", step5_export.main),
]

STEP_NAMES = [name for name, _ in PIPELINE_STEPS]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Jalankan pipeline HeatWalk step1-5 berurutan.")
    parser.add_argument(
        "--fetch", action="store_true",
        help="Jalankan step1_fetch_data (panggilan API FortyGuard). Default dilewati untuk hemat kredit.",
    )
    parser.add_argument(
        "--from", dest="from_step", choices=STEP_NAMES, default=None,
        help="Mulai dari step tertentu, lewati semua step sebelumnya.",
    )
    return parser.parse_args()


def steps_to_run(args: argparse.Namespace) -> list[tuple[str, object]]:
    steps = PIPELINE_STEPS
    if args.from_step is not None:
        start_index = STEP_NAMES.index(args.from_step)
        steps = steps[start_index:]
    if not args.fetch:
        steps = [(name, fn) for name, fn in steps if name != "step1_fetch_data"]
    return steps


def main() -> None:
    args = parse_args()
    steps = steps_to_run(args)

    if not steps:
        print("Tidak ada step untuk dijalankan (cek --from dan --fetch).")
        return

    for name, step_main in steps:
        print(f"\n{'=' * 20} {name} {'=' * 20}")
        try:
            step_main()
        except Exception as error:
            print(f"\nGAGAL di {name}: {error}")
            sys.exit(1)

    print(f"\n{'=' * 20} selesai {'=' * 20}")
    print(f"Step yang dijalankan: {', '.join(name for name, _ in steps)}")


if __name__ == "__main__":
    main()
