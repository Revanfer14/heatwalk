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


def poll(activity_id: str, timeout: float = 600.0, interval: float = 5.0) -> dict[str, Any]:
    url = f"{FG_BASE_URL}/status/{activity_id}"
    deadline = time.monotonic() + timeout
    while True:
        response = httpx.get(url, headers=_headers(), timeout=30.0)
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


def run(endpoint: str, payload: dict[str, Any]) -> dict[str, Any]:
    cache_path = _cache_path(endpoint, payload)
    if cache_path.exists():
        return json.loads(cache_path.read_text(encoding="utf-8"))

    activity_id = submit(endpoint, payload)
    result = poll(activity_id)

    DATA_RAW_DIR.mkdir(parents=True, exist_ok=True)
    cache_path.write_text(json.dumps(result, indent=2), encoding="utf-8")
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
