from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


ScenarioName = Literal["adherent", "non_adherent", "intervention_now"]


class ObservationIn(BaseModel):
    patient_id: str
    ts: str
    hr: float
    systolic_bp: float
    diastolic_bp: float
    glucose_proxy: float
    symptom_score: float
    med_due: int
    med_taken: int
    adherence_percent: float
    drug_level: float
    lab_flag: int
    adverse_event: int
    dropout_event: int


class PatientStaticIn(BaseModel):
    patient_id: str
    age: int
    weight: float
    hba1c: float
    systolic_bp: float
    diastolic_bp: float
    cholesterol: float
    exercise_score: float
    diet_score: float
    medication_adherence_baseline: float
    profile_label: str | None = None


class IngestRequest(BaseModel):
    patient: PatientStaticIn
    observations: list[ObservationIn] = Field(default_factory=list)


class PredictRequest(BaseModel):
    patient_id: str


class SimulateRequest(BaseModel):
    patient_id: str
    selected_scenario: ScenarioName = "adherent"
    scenarios: list[ScenarioName] = Field(default_factory=lambda: ["adherent", "non_adherent"])
    days: int = Field(default=21, ge=7, le=60)
