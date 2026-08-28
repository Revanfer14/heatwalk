import hashlib
import json
import time
from pathlib import Path
from typing import Any

import httpx

from pipeline.config import DATA_RAW_DIR, FG_BASE_URL, fortyguard_api_key


class FortyGuardError(RuntimeError):
    pass


def _payload_hash(payload: dict[str, Any]) -> str:
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return hashlib.sha1(canonical.encode("utf-8")).hexdigest()[:12]


def _cache_path(endpoint: str, payload: dict[str, Any]) -> Path:
    safe_endpoint = endpoint.strip("/").replace("/", "_")
    return DATA_RAW_DIR / f"{safe_endpoint}_{_payload_hash(payload)}.json"


def _headers() -> dict[str, str]:
    return {"api-key": fortyguard_api_key(), "Content-Type": "application/json"}


def submit(endpoint: str, payload: dict[str, Any]) -> str:
    url = f"{FG_BASE_URL}/{endpoint.strip('/')}"
    response = httpx.post(url, headers=_headers(), json=payload, timeout=30.0)
    if response.status_code != 200:
        raise FortyGuardError(
            f"submit {endpoint} gagal: {response.status_code} {response.text}"
        )
    body = response.json()
    activity_id = body.get("data", {}).get("activity_id")
    if not activity_id:
        raise FortyGuardError(f"submit {endpoint} tidak mengembalikan activity_id: {body}")
    return activity_id


RETRIABLE_STATUS_CODES = {502, 503, 504}


def poll(activity_id: str, timeout: float = 900.0, interval: float = 5.0) -> dict[str, Any]:
    url = f"{FG_BASE_URL}/status/{activity_id}"
    deadline = time.monotonic() + timeout
    while True:
        try:
            response = httpx.get(url, headers=_headers(), timeout=60.0)
        except httpx.TimeoutException:
            if time.monotonic() > deadline:
                raise FortyGuardError(f"activity {activity_id} timeout setelah {timeout}s (request timeout)")
            time.sleep(interval)
            continue
        if response.status_code in RETRIABLE_STATUS_CODES:
            if time.monotonic() > deadline:
                raise FortyGuardError(
                    f"activity {activity_id} timeout setelah {timeout}s (terakhir {response.status_code})"
                )
            time.sleep(interval)
            continue
        if response.status_code != 200:
            raise FortyGuardError(
                f"poll {activity_id} gagal: {response.status_code} {response.text}"
            )
        body = response.json()
        status = body.get("data", {}).get("status")
        if status == "Completed":
            return body
        if status == "Failed":
            raise FortyGuardError(f"activity {activity_id} berstatus Failed: {body}")
        if time.monotonic() > deadline:
            raise FortyGuardError(f"activity {activity_id} timeout setelah {timeout}s")
        time.sleep(interval)


def _read_cached_response(cache_path: Path) -> dict[str, Any]:
    cached = json.loads(cache_path.read_text(encoding="utf-8"))
    if "response" in cached and "request" in cached:
        return cached["response"]
    return cached


def _find_cached_file(cache_path: Path) -> Path | None:
    if cache_path.exists():
        return cache_path
    archived_candidates = sorted(cache_path.parent.rglob(cache_path.name))
    return archived_candidates[0] if archived_candidates else None


def run(endpoint: str, payload: dict[str, Any]) -> dict[str, Any]:
    cache_path = _cache_path(endpoint, payload)
    cached_file = _find_cached_file(cache_path)
    if cached_file is not None:
        return _read_cached_response(cached_file)

    activity_id = submit(endpoint, payload)
    result = poll(activity_id)

    DATA_RAW_DIR.mkdir(parents=True, exist_ok=True)
    envelope = {"request": {"endpoint": endpoint, "payload": payload}, "response": result}
    cache_path.write_text(json.dumps(envelope, indent=2), encoding="utf-8")
    return result


def check_credits() -> dict[str, Any]:
    url = f"{FG_BASE_URL}/system/fetch-api-key-usage"
    response = httpx.post(
        url, headers=_headers(), json={"api_key": fortyguard_api_key()}, timeout=30.0
    )
    if response.status_code != 200:
        raise FortyGuardError(
            f"check_credits gagal: {response.status_code} {response.text}"
        )
    return response.json()
