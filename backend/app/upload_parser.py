from __future__ import annotations

import csv
import io
import json
from pathlib import Path

from .database import OBSERVATION_COLUMNS, PATIENT_COLUMNS


def parse_upload_payload(filename: str, payload: bytes) -> tuple[dict, list[dict], str]:
    suffix = Path(filename).suffix.lower()
    if suffix == ".json":
        patient, observations = _parse_json_payload(payload)
        return patient, observations, "json"
    if suffix == ".csv":
        patient, observations = _parse_csv_payload(payload)
        return patient, observations, "csv"
    raise ValueError("Unsupported upload format. Use .json or .csv.")


def _parse_json_payload(payload: bytes) -> tuple[dict, list[dict]]:
    parsed = json.loads(payload.decode("utf-8"))
    patient = parsed.get("patient")
    observations = parsed.get("observations", [])
    if not patient or not isinstance(observations, list):
        raise ValueError("JSON upload must contain 'patient' and 'observations'.")
    if not observations:
        raise ValueError("Uploaded patient data must include at least one observation.")
    return patient, observations


def _parse_csv_payload(payload: bytes) -> tuple[dict, list[dict]]:
    text = payload.decode("utf-8")
    reader = csv.DictReader(io.StringIO(text))
    rows = list(reader)
    if not rows:
        raise ValueError("CSV upload contained no rows.")

    first_row = rows[0]
    patient = {column: _coerce_value(first_row.get(column)) for column in PATIENT_COLUMNS}
    if not patient.get("patient_id"):
        raise ValueError("CSV upload must include patient static columns, including patient_id.")

    observations = []
    for row in rows:
        observation = {column: _coerce_value(row.get(column)) for column in OBSERVATION_COLUMNS}
        if observation.get("patient_id") != patient["patient_id"]:
            raise ValueError("All CSV rows must belong to the same patient_id.")
        observations.append(observation)

    if not observations:
        raise ValueError("Uploaded patient data must include at least one observation.")

    return patient, observations


def _coerce_value(value: str | None):
    if value is None:
        return None
    stripped = value.strip()
    if stripped == "":
        return None
    try:
        if "." in stripped:
            return float(stripped)
        return int(stripped)
    except ValueError:
        return stripped
