from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

import numpy as np
import pandas as pd


ROLLING_WINDOWS = (3, 7)


@dataclass
class FeatureBundle:
    frame: pd.DataFrame
    feature_columns: list[str]


def _safe_slope(values: Iterable[float]) -> float:
    clean_values = [float(value) for value in values if pd.notna(value)]
    if len(clean_values) < 2:
        return 0.0
    x_axis = np.arange(len(clean_values))
    slope = np.polyfit(x_axis, clean_values, 1)[0]
    return float(slope)


def build_training_frame(observations: pd.DataFrame, patients: pd.DataFrame) -> FeatureBundle:
    observations = observations.sort_values(["patient_id", "ts"]).copy()
    observations["ts"] = pd.to_datetime(observations["ts"])
    patients = patients.copy()

    rows: list[dict] = []
    for patient_id, patient_obs in observations.groupby("patient_id"):
        patient_obs = patient_obs.reset_index(drop=True)
        patient_static = patients.loc[patients["patient_id"] == patient_id].iloc[0].to_dict()

        for index in range(6, len(patient_obs) - 7):
            history = patient_obs.iloc[: index + 1]
            future = patient_obs.iloc[index + 1 : index + 8]

            feature_row = build_feature_row(patient_static, history)
            feature_row.update(
                {
                    "patient_id": patient_id,
                    "ts": history.iloc[-1]["ts"].isoformat(),
                    "target_safety": int(future["adverse_event"].max()),
                    "target_dropout": int(future["dropout_event"].max()),
                    "target_adherence": int(
                        future["adherence_percent"].mean() < 75
                        or future["med_taken"].mean() < 0.8
                    ),
                }
            )
            rows.append(feature_row)

    frame = pd.DataFrame(rows).fillna(0.0)
    feature_columns = [
        column
        for column in frame.columns
        if column not in {"patient_id", "ts", "target_safety", "target_dropout", "target_adherence"}
    ]
    return FeatureBundle(frame=frame, feature_columns=feature_columns)


def build_feature_row(patient_static: dict, history: pd.DataFrame) -> dict:
    latest = history.iloc[-1]

    features = {
        "age": patient_static["age"],
        "weight": patient_static["weight"],
        "baseline_hba1c": patient_static["hba1c"],
        "baseline_systolic_bp": patient_static["systolic_bp"],
        "baseline_diastolic_bp": patient_static["diastolic_bp"],
        "cholesterol": patient_static["cholesterol"],
        "exercise_score": patient_static["exercise_score"],
        "diet_score": patient_static["diet_score"],
        "medication_adherence_baseline": patient_static["medication_adherence_baseline"],
        "latest_hr": latest["hr"],
        "latest_systolic_bp": latest["systolic_bp"],
        "latest_diastolic_bp": latest["diastolic_bp"],
        "latest_glucose_proxy": latest["glucose_proxy"],
        "latest_symptom_score": latest["symptom_score"],
        "latest_adherence_percent": latest["adherence_percent"],
        "latest_drug_level": latest["drug_level"],
        "latest_lab_flag": latest["lab_flag"],
        "days_observed": len(history),
    }

    for window in ROLLING_WINDOWS:
        slice_frame = history.tail(window)
        features[f"avg_glucose_{window}"] = float(slice_frame["glucose_proxy"].mean())
        features[f"avg_symptom_{window}"] = float(slice_frame["symptom_score"].mean())
        features[f"avg_adherence_{window}"] = float(slice_frame["adherence_percent"].mean())
        features[f"avg_drug_level_{window}"] = float(slice_frame["drug_level"].mean())
        features[f"avg_systolic_bp_{window}"] = float(slice_frame["systolic_bp"].mean())
        features[f"avg_diastolic_bp_{window}"] = float(slice_frame["diastolic_bp"].mean())

    recent_window = history.tail(7)
    features["glucose_slope_7"] = _safe_slope(recent_window["glucose_proxy"].tolist())
    features["symptom_slope_7"] = _safe_slope(recent_window["symptom_score"].tolist())
    features["adherence_slope_7"] = _safe_slope(recent_window["adherence_percent"].tolist())
    features["drug_level_slope_7"] = _safe_slope(recent_window["drug_level"].tolist())
    features["systolic_slope_7"] = _safe_slope(recent_window["systolic_bp"].tolist())
    features["recent_lab_flags"] = int(recent_window["lab_flag"].sum())
    features["recent_adverse_events"] = int(recent_window["adverse_event"].sum())

    return features


def build_live_feature_frame(
    patients: pd.DataFrame,
    observations: pd.DataFrame,
    feature_columns: list[str],
) -> pd.DataFrame:
    rows: list[dict] = []
    for patient_id, patient_obs in observations.groupby("patient_id"):
        patient_static = patients.loc[patients["patient_id"] == patient_id].iloc[0].to_dict()
        row = build_feature_row(patient_static, patient_obs.sort_values("ts"))
        row["patient_id"] = patient_id
        rows.append(row)

    frame = pd.DataFrame(rows).fillna(0.0)
    for column in feature_columns:
        if column not in frame.columns:
            frame[column] = 0.0

    ordered_columns = ["patient_id"] + feature_columns
    return frame[ordered_columns]
