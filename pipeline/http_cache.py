import json
from typing import Any, Callable

from pipeline.config import DATA_RAW_DIR


def fetch_json_cached(cache_name: str, fetch_fn: Callable[[], Any]) -> Any:
    cache_path = DATA_RAW_DIR / f"{cache_name}.json"
    if cache_path.exists():
        return json.loads(cache_path.read_text(encoding="utf-8"))

    result = fetch_fn()
    DATA_RAW_DIR.mkdir(parents=True, exist_ok=True)
    cache_path.write_text(json.dumps(result, indent=2), encoding="utf-8")
    return result
