from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd


ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT_DIR / "data"
RNG = np.random.default_rng(42)


DEMO_PROFILE_CONFIG = {
    "stable_adherent": {"adherence": 0.96, "exercise": 82, "diet": 79, "risk_bias": -1.0},
    "rising_risk": {"adherence": 0.78, "exercise": 58, "diet": 55, "risk_bias": 0.4},
    "poor_adherence": {"adherence": 0.58, "exercise": 44, "diet": 42, "risk_bias": 1.2},
}


def clamp(value: float, lower: float, upper: float) -> float:
    return float(max(lower, min(upper, value)))


def build_patient(patient_id: str, profile_label: str, profile_config: dict) -> dict:
    age = int(RNG.integers(36, 74))
    weight = round(float(RNG.normal(88, 14)), 1)
    baseline_hba1c = round(clamp(RNG.normal(7.1 + profile_config["risk_bias"] * 0.55, 0.6), 5.8, 10.8), 1)
    systolic_bp = round(clamp(RNG.normal(126 + profile_config["risk_bias"] * 8, 10), 108, 168), 1)
    diastolic_bp = round(clamp(RNG.normal(80 + profile_config["risk_bias"] * 4, 7), 66, 102), 1)
    cholesterol = round(clamp(RNG.normal(188 + profile_config["risk_bias"] * 14, 18), 145, 285), 1)

    return {
        "patient_id": patient_id,
        "age": age,
        "weight": weight,
        "hba1c": baseline_hba1c,
        "systolic_bp": systolic_bp,
        "diastolic_bp": diastolic_bp,
        "cholesterol": cholesterol,
        "exercise_score": round(clamp(RNG.normal(profile_config["exercise"], 8), 25, 95), 1),
        "diet_score": round(clamp(RNG.normal(profile_config["diet"], 9), 20, 95), 1),
        "medication_adherence_baseline": round(clamp(profile_config["adherence"] * 100 + RNG.normal(0, 4), 40, 99), 1),
        "profile_label": profile_label,
    }


def generate_patient_timeseries(patient: dict, days: int) -> list[dict]:
    observations = []
    drug_level = 0.62
    cumulative_dropout = 0
    deteriorating = patient["profile_label"] in {"rising_risk", "poor_adherence"}

    for day in range(days):
        day_factor = day / max(days - 1, 1)
        adherence_baseline = patient["medication_adherence_baseline"] / 100.0

        if patient["profile_label"] == "stable_adherent":
            adherence_today = clamp(adherence_baseline + RNG.normal(0.01, 0.03), 0.82, 1.0)
        elif patient["profile_label"] == "rising_risk":
            adherence_today = clamp(adherence_baseline - 0.18 * day_factor + RNG.normal(0.0, 0.05), 0.45, 0.95)
        elif patient["profile_label"] == "poor_adherence":
            adherence_today = clamp(adherence_baseline - 0.24 * day_factor + RNG.normal(-0.03, 0.06), 0.25, 0.86)
        else:
            adherence_today = clamp(adherence_baseline - 0.08 * day_factor + RNG.normal(0.0, 0.05), 0.35, 0.98)

        med_due = 1
        med_taken = int(RNG.random() < adherence_today)
        drug_level = clamp(drug_level * 0.86 + med_taken * 0.22 + RNG.normal(0, 0.015), 0.0, 1.1)

        glucose_proxy = (
            108
            + (patient["hba1c"] - 6.2) * 13.5
            + (1 - adherence_today) * 36
            + (1 - drug_level) * 18
            + day_factor * (8 if deteriorating else -3)
            + RNG.normal(0, 5.5)
        )
        systolic_bp = (
            patient["systolic_bp"]
            + (1 - adherence_today) * 10
            + day_factor * (4 if deteriorating else -2)
            + RNG.normal(0, 4)
        )
        diastolic_bp = (
            patient["diastolic_bp"]
            + (1 - adherence_today) * 6
            + day_factor * (2 if deteriorating else -1)
            + RNG.normal(0, 3)
        )
        symptom_score = clamp(
            1.6
            + (glucose_proxy - 118) / 18
            + max(day_factor - 0.35, 0) * (3.2 if deteriorating else -0.6)
            + RNG.normal(0, 0.45),
            0,
            10,
        )
        hr = clamp(68 + (glucose_proxy - 115) * 0.12 + symptom_score * 0.6 + RNG.normal(0, 3.5), 55, 122)
        adherence_percent = round(adherence_today * 100, 1)
        lab_flag = int(glucose_proxy > 176 or systolic_bp > 154 or symptom_score > 7.6)

        adverse_event_probability = clamp(
            0.02
            + max(glucose_proxy - 145, 0) * 0.0032
            + max(symptom_score - 5.5, 0) * 0.036
            + (1 - adherence_today) * 0.14,
            0.0,
            0.75,
        )
        adverse_event = int(RNG.random() < adverse_event_probability)

        dropout_probability = clamp(
            0.008
            + max(symptom_score - 5.2, 0) * 0.028
            + max(0.72 - adherence_today, 0) * 0.18
            + adverse_event * 0.09,
            0.0,
            0.82,
        )
        dropout_event = 0
        if cumulative_dropout == 0 and RNG.random() < dropout_probability:
            dropout_event = 1
            cumulative_dropout = 1

        observations.append(
            {
                "patient_id": patient["patient_id"],
                "ts": (pd.Timestamp("2025-01-01") + pd.Timedelta(days=day)).isoformat(),
                "hr": round(hr, 1),
                "systolic_bp": round(systolic_bp, 1),
                "diastolic_bp": round(diastolic_bp, 1),
                "glucose_proxy": round(glucose_proxy, 1),
                "symptom_score": round(symptom_score, 2),
                "med_due": med_due,
                "med_taken": med_taken,
                "adherence_percent": adherence_percent,
                "drug_level": round(drug_level, 2),
                "lab_flag": lab_flag,
                "adverse_event": adverse_event,
                "dropout_event": dropout_event,
            }
        )

    return observations


def generate_dataset(num_patients: int = 40, days: int = 90) -> tuple[pd.DataFrame, pd.DataFrame, list[dict]]:
    patients = []
    observations = []
    demo_profiles = []
    recorded_profiles: set[str] = set()
    profile_order = list(DEMO_PROFILE_CONFIG.keys())

    for index in range(num_patients):
        profile_label = profile_order[index] if index < len(profile_order) else RNG.choice(profile_order + ["generated_balanced"])
        config = DEMO_PROFILE_CONFIG.get(profile_label, {"adherence": 0.82, "exercise": 63, "diet": 61, "risk_bias": 0.1})
        patient_id = f"P{index + 1:03d}"
        patient = build_patient(patient_id, profile_label, config)
        patient_observations = generate_patient_timeseries(patient, days)
        patients.append(patient)
        observations.extend(patient_observations)

        if profile_label in DEMO_PROFILE_CONFIG and profile_label not in recorded_profiles:
            demo_profiles.append(
                {
                    "patient_id": patient_id,
                    "profile_label": profile_label,
                    "summary": f"{profile_label.replace('_', ' ')} synthetic demo participant",
                }
            )
            recorded_profiles.add(profile_label)

    return pd.DataFrame(patients), pd.DataFrame(observations), demo_profiles


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    patients_frame, observations_frame, demo_profiles = generate_dataset()

    patients_path = DATA_DIR / "patients.csv"
    observations_path = DATA_DIR / "observations.csv"
    demo_profiles_path = DATA_DIR / "demo_profiles.json"

    patients_frame.to_csv(patients_path, index=False)
    observations_frame.to_csv(observations_path, index=False)
    demo_profiles_path.write_text(json.dumps(demo_profiles, indent=2))

    print(f"Wrote {len(patients_frame)} patients to {patients_path}")
    print(f"Wrote {len(observations_frame)} observations to {observations_path}")
    print(f"Wrote {len(demo_profiles)} demo profiles to {demo_profiles_path}")


if __name__ == "__main__":
    main()
