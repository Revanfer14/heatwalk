import json
import shutil
from pathlib import Path
from typing import Any

from pipeline.config import DATA_OUT_DIR, WEB_PUBLIC_DATA_DIR


def write_json(path: Path, obj: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = path.with_suffix(path.suffix + ".tmp")
    tmp_path.write_text(json.dumps(obj, separators=(",", ":")), encoding="utf-8")
    tmp_path.replace(path)


def mirror_to_web() -> list[Path]:
    WEB_PUBLIC_DATA_DIR.mkdir(parents=True, exist_ok=True)
    copied: list[Path] = []
    for source in DATA_OUT_DIR.glob("*"):
        if source.name == ".gitkeep" or not source.is_file():
            continue
        destination = WEB_PUBLIC_DATA_DIR / source.name
        shutil.copyfile(source, destination)
        copied.append(destination)
    return copied
