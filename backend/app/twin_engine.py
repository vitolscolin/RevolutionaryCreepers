from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass

import pandas as pd

from .feature_pipeline import build_feature_row
from .model_store import load_artifact, load_feature_config
from .risk_equations import calculate_health_score, project_future_state


@dataclass
class PatientTwin:
    patient: dict
    observations: list[dict]


class TwinEngine:
    def __init__(self) -> None:
        self.twins: dict[str, PatientTwin] = {}
        self.demo_profiles: list[dict] = []
        self.models = {
            "safety": load_artifact("model_safety.joblib"),
            "dropout": load_artifact("model_dropout.joblib"),
            "adherence": load_artifact("model_adherence.joblib"),
        }
        self.feature_config = load_feature_config()

    def ingest(self, patient: dict, observations: list[dict]) -> None:
        existing = self.twins.get(patient["patient_id"])
        merged_observations = list(existing.observations) if existing else []
        merged_observations.extend(observations)
        merged_observations = sorted(merged_observations, key=lambda item: item["ts"])[-60:]

        self.twins[patient["patient_id"]] = PatientTwin(
            patient=patient,
            observations=merged_observations,
        )

    def ingest_bulk(self, patients: list[dict], observations: list[dict]) -> None:
        grouped: dict[str, list[dict]] = defaultdict(list)
        for observation in observations:
            grouped[observation["patient_id"]].append(observation)

        for patient in patients:
            self.ingest(patient, grouped.get(patient["patient_id"], []))

    def list_patients(self) -> list[dict]:
        entries = []
        for patient_id, twin in sorted(self.twins.items()):
            summary = self.get_twin_summary(patient_id)
            entries.append(
                {
                    "patient_id": patient_id,
                    "profile_label": twin.patient.get("profile_label", "generated"),
                    "health_score": summary["health_score"],
                    "safety_risk": summary["current_risks"]["safety_risk"],
                    "dropout_risk": summary["current_risks"]["dropout_risk"],
                    "adherence_risk": summary["current_risks"]["adherence_risk"],
                }
            )
        return entries

    def get_twin_summary(self, patient_id: str) -> dict:
        twin = self._get_twin(patient_id)
        patient_frame = pd.DataFrame([twin.patient])
        observation_frame = pd.DataFrame(twin.observations).sort_values("ts")
        latest = observation_frame.iloc[-1].to_dict()

        feature_row = build_feature_row(twin.patient, observation_frame)
        feature_vector = pd.DataFrame([feature_row])[self.feature_config["feature_columns"]]

        risks = {
            "safety_risk": round(float(self.models["safety"].predict_proba(feature_vector)[0][1]), 3),
            "dropout_risk": round(float(self.models["dropout"].predict_proba(feature_vector)[0][1]), 3),
            "adherence_risk": round(float(self.models["adherence"].predict_proba(feature_vector)[0][1]), 3),
        }
        health_score = calculate_health_score(
            glucose_proxy=latest["glucose_proxy"],
            symptom_score=latest["symptom_score"],
            adherence_percent=latest["adherence_percent"],
            systolic_bp=latest["systolic_bp"],
        )

        alerts = self._build_alerts(patient_id, risks, latest)
        recent_observations = observation_frame.tail(12).to_dict(orient="records")

        return {
            "patient_summary": twin.patient,
            "current_risks": risks,
            "health_score": health_score,
            "alerts": alerts,
            "recent_observations": recent_observations,
            "current_state": latest,
            "patient_features": patient_frame.to_dict(orient="records")[0],
        }

    def simulate(self, patient_id: str, selected_scenario: str, scenarios: list[str], days: int) -> dict:
        twin_summary = self.get_twin_summary(patient_id)
        baseline_state = twin_summary["current_state"]
        scenario_trajectories: dict[str, list[dict]] = {}

        for scenario in scenarios:
            trajectory = []
            for day_index in range(1, days + 1):
                future_state = project_future_state(scenario, baseline_state, day_index)
                trajectory.append(
                    {
                        "ts": day_index,
                        "projected_glucose_proxy": future_state["glucose_proxy"],
                        "projected_symptom_score": future_state["symptom_score"],
                        "projected_safety_risk": future_state["safety_risk"],
                        "projected_dropout_risk": future_state["dropout_risk"],
                        "projected_health_score": future_state["health_score"],
                    }
                )
            scenario_trajectories[scenario] = trajectory

        selected_trajectory = scenario_trajectories[selected_scenario]
        comparison_summary = {}
        for scenario, trajectory in scenario_trajectories.items():
            final_point = trajectory[-1]
            comparison_summary[scenario] = {
                "final_health_score": final_point["projected_health_score"],
                "final_safety_risk": final_point["projected_safety_risk"],
                "final_dropout_risk": final_point["projected_dropout_risk"],
            }

        narrative = self._build_narrative(
            twin_summary["patient_summary"],
            selected_scenario,
            comparison_summary,
        )

        return {
            "patient_id": patient_id,
            "selected_scenario": selected_scenario,
            "baseline_summary": {
                "health_score": twin_summary["health_score"],
                "current_risks": twin_summary["current_risks"],
                "glucose_proxy": baseline_state["glucose_proxy"],
                "symptom_score": baseline_state["symptom_score"],
                "adherence_percent": baseline_state["adherence_percent"],
            },
            "projected_trajectory": selected_trajectory,
            "scenario_trajectories": scenario_trajectories,
            "comparison_summary": comparison_summary,
            "narrative_explanation": narrative,
        }

    def set_demo_profiles(self, profiles: list[dict]) -> None:
        self.demo_profiles = profiles

    def get_demo_profiles(self) -> list[dict]:
        return self.demo_profiles

    def _build_alerts(self, patient_id: str, risks: dict, latest: dict) -> list[dict]:
        alerts = []
        if risks["safety_risk"] >= 0.55:
            alerts.append({"severity": "high", "title": "Safety review recommended", "detail": f"{patient_id} has elevated near-term safety risk."})
        if risks["dropout_risk"] >= 0.45:
            alerts.append({"severity": "medium", "title": "Retention risk rising", "detail": "Recent symptoms and adherence pattern suggest dropout pressure."})
        if latest["adherence_percent"] < 78:
            alerts.append({"severity": "medium", "title": "Adherence deterioration", "detail": "Medication adherence has moved below the preferred trial threshold."})
        if latest["lab_flag"] == 1:
            alerts.append({"severity": "low", "title": "Lab flag present", "detail": "A synthetic out-of-range lab marker is active in the latest observation."})
        return alerts

    def _build_narrative(self, patient: dict, selected_scenario: str, comparison_summary: dict) -> str:
        profile = patient.get("profile_label", "generated participant")
        adherent_score = comparison_summary.get("adherent", {}).get("final_health_score")
        non_adherent_score = comparison_summary.get("non_adherent", {}).get("final_health_score")
        intervention_score = comparison_summary.get("intervention_now", {}).get("final_health_score")

        if selected_scenario == "non_adherent":
            return (
                f"{profile} shows a visibly worsening trial path under non-adherence. "
                f"By the end of the projection window, health score falls relative to the adherent path "
                f"({non_adherent_score} vs {adherent_score})."
            )
        if selected_scenario == "intervention_now" and intervention_score is not None:
            return (
                f"{profile} demonstrates reversible risk. A timely intervention bends the projected curve "
                f"back toward stability and outperforms the non-adherent path."
            )
        return (
            f"{profile} remains more stable when medication behavior stays consistent. "
            f"The adherent future preserves health score and suppresses trial attrition pressure."
        )

    def _get_twin(self, patient_id: str) -> PatientTwin:
        if patient_id not in self.twins:
            raise KeyError(f"Unknown patient_id: {patient_id}")
        return self.twins[patient_id]
