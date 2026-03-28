from __future__ import annotations

import os
from pathlib import Path

import pandas as pd
import requests


ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT_DIR / "data"
API_URL = os.getenv("TRIALTWIN_API_URL", "http://localhost:8000")
TOKEN = os.getenv("TRIALTWIN_TOKEN", "dev-token")


def main() -> None:
    patients = pd.read_csv(DATA_DIR / "patients.csv")
    observations = pd.read_csv(DATA_DIR / "observations.csv")
    headers = {"x-trialtwin-token": TOKEN}

    seeded_count = 0
    for patient in patients.head(8).to_dict(orient="records"):
        patient_observations = (
            observations.loc[observations["patient_id"] == patient["patient_id"]]
            .tail(45)
            .to_dict(orient="records")
        )
        payload = {"patient": patient, "observations": patient_observations}
        response = requests.post(f"{API_URL}/ingest", json=payload, headers=headers, timeout=15)
        response.raise_for_status()
        seeded_count += 1

    print(f"Seeded {seeded_count} demo patients into {API_URL}")


if __name__ == "__main__":
    main()
