from __future__ import annotations


def clamp(value: float, lower: float = 0.0, upper: float = 1.0) -> float:
    return max(lower, min(upper, value))


def calculate_health_score(glucose_proxy: float, symptom_score: float, adherence_percent: float, systolic_bp: float) -> float:
    score = (
        100
        - abs(glucose_proxy - 118) * 0.45
        - symptom_score * 4.5
        - max(systolic_bp - 122, 0) * 0.28
        - max(80 - adherence_percent, 0) * 0.35
    )
    return round(clamp(score, 0, 100), 1)


def estimate_health_drift(
    scenario: str,
    baseline_glucose: float,
    baseline_symptom_score: float,
    baseline_adherence_percent: float,
    baseline_drug_level: float,
    day_index: int,
) -> dict:
    if scenario == "adherent":
        glucose_delta = -0.9 * day_index
        symptom_delta = -0.08 * day_index
        adherence_delta = min(100 - baseline_adherence_percent, 0.6 * day_index)
        drug_level_delta = max(0.0, 0.03 * day_index)
    elif scenario == "non_adherent":
        glucose_delta = 1.6 * day_index
        symptom_delta = 0.16 * day_index
        adherence_delta = -1.2 * day_index
        drug_level_delta = -0.04 * day_index
    else:
        recovery_factor = max(day_index - 3, 0)
        glucose_delta = 1.0 * min(day_index, 3) - 1.4 * recovery_factor
        symptom_delta = 0.1 * min(day_index, 3) - 0.12 * recovery_factor
        adherence_delta = -0.3 * min(day_index, 3) + 1.2 * recovery_factor
        drug_level_delta = -0.01 * min(day_index, 2) + 0.06 * recovery_factor

    return {
        "glucose_proxy": baseline_glucose + glucose_delta,
        "symptom_score": max(0.0, baseline_symptom_score + symptom_delta),
        "adherence_percent": clamp((baseline_adherence_percent + adherence_delta) / 100.0, 0.35, 1.0) * 100,
        "drug_level": max(0.0, baseline_drug_level + drug_level_delta),
    }


def estimate_event_risk(glucose_proxy: float, symptom_score: float, adherence_percent: float, systolic_bp: float) -> float:
    risk = (
        0.08
        + max(glucose_proxy - 135, 0) * 0.003
        + symptom_score * 0.018
        + max(systolic_bp - 130, 0) * 0.002
        + max(78 - adherence_percent, 0) * 0.004
    )
    return round(clamp(risk, 0.02, 0.95), 3)


def estimate_dropout_risk(symptom_score: float, adherence_percent: float, adverse_event_pressure: float) -> float:
    risk = 0.05 + symptom_score * 0.024 + max(75 - adherence_percent, 0) * 0.005 + adverse_event_pressure * 0.18
    return round(clamp(risk, 0.02, 0.98), 3)


def project_future_state(
    scenario: str,
    baseline_state: dict,
    day_index: int,
) -> dict:
    drift = estimate_health_drift(
        scenario=scenario,
        baseline_glucose=baseline_state["glucose_proxy"],
        baseline_symptom_score=baseline_state["symptom_score"],
        baseline_adherence_percent=baseline_state["adherence_percent"],
        baseline_drug_level=baseline_state["drug_level"],
        day_index=day_index,
    )

    projected_systolic = baseline_state["systolic_bp"] + (0.3 * day_index if scenario == "non_adherent" else -0.15 * day_index)
    safety_risk = estimate_event_risk(
        glucose_proxy=drift["glucose_proxy"],
        symptom_score=drift["symptom_score"],
        adherence_percent=drift["adherence_percent"],
        systolic_bp=projected_systolic,
    )
    dropout_risk = estimate_dropout_risk(
        symptom_score=drift["symptom_score"],
        adherence_percent=drift["adherence_percent"],
        adverse_event_pressure=safety_risk,
    )
    health_score = calculate_health_score(
        glucose_proxy=drift["glucose_proxy"],
        symptom_score=drift["symptom_score"],
        adherence_percent=drift["adherence_percent"],
        systolic_bp=projected_systolic,
    )

    return {
        "glucose_proxy": round(drift["glucose_proxy"], 1),
        "symptom_score": round(drift["symptom_score"], 2),
        "adherence_percent": round(drift["adherence_percent"], 1),
        "drug_level": round(drift["drug_level"], 2),
        "systolic_bp": round(projected_systolic, 1),
        "safety_risk": safety_risk,
        "dropout_risk": dropout_risk,
        "health_score": health_score,
    }
