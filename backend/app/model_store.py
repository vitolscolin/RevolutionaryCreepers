from __future__ import annotations

import json
from pathlib import Path

import joblib


ARTIFACTS_DIR = Path(__file__).resolve().parents[1] / "artifacts"


def save_artifact(name: str, artifact) -> None:
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(artifact, ARTIFACTS_DIR / name)


def load_artifact(name: str):
    return joblib.load(ARTIFACTS_DIR / name)


def save_feature_config(config: dict) -> None:
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    (ARTIFACTS_DIR / "feature_config.json").write_text(json.dumps(config, indent=2))


def load_feature_config() -> dict:
    return json.loads((ARTIFACTS_DIR / "feature_config.json").read_text())


def artifacts_ready() -> bool:
    required = [
        ARTIFACTS_DIR / "model_safety.joblib",
        ARTIFACTS_DIR / "model_dropout.joblib",
        ARTIFACTS_DIR / "model_adherence.joblib",
        ARTIFACTS_DIR / "feature_config.json",
    ]
    return all(path.exists() for path in required)
