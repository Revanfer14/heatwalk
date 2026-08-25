from pipeline.config import BASELINE_C, WALK_SPEED_MPS


def dose_c_min(
    temp_c: float,
    len_m: float,
    baseline_c: float = BASELINE_C,
    walk_speed_mps: float = WALK_SPEED_MPS,
) -> float:
    return max(temp_c - baseline_c, 0.0) * (len_m / walk_speed_mps) / 60.0


def weight_cool(dose_value: float, len_m: float, lambda_detour: float) -> float:
    return dose_value + lambda_detour * len_m
