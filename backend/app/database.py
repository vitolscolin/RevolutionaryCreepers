from __future__ import annotations

import sqlite3
from pathlib import Path


PATIENT_COLUMNS = [
    "patient_id",
    "age",
    "weight",
    "hba1c",
    "systolic_bp",
    "diastolic_bp",
    "cholesterol",
    "exercise_score",
    "diet_score",
    "medication_adherence_baseline",
    "profile_label",
]

OBSERVATION_COLUMNS = [
    "patient_id",
    "ts",
    "hr",
    "systolic_bp",
    "diastolic_bp",
    "glucose_proxy",
    "symptom_score",
    "med_due",
    "med_taken",
    "adherence_percent",
    "drug_level",
    "lab_flag",
    "adverse_event",
    "dropout_event",
]


class LocalTrialStore:
    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._initialize()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.db_path)
        connection.row_factory = sqlite3.Row
        return connection

    def _initialize(self) -> None:
        with self._connect() as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS patients (
                    patient_id TEXT PRIMARY KEY,
                    age INTEGER NOT NULL,
                    weight REAL NOT NULL,
                    hba1c REAL NOT NULL,
                    systolic_bp REAL NOT NULL,
                    diastolic_bp REAL NOT NULL,
                    cholesterol REAL NOT NULL,
                    exercise_score REAL NOT NULL,
                    diet_score REAL NOT NULL,
                    medication_adherence_baseline REAL NOT NULL,
                    profile_label TEXT
                )
                """
            )
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS observations (
                    patient_id TEXT NOT NULL,
                    ts TEXT NOT NULL,
                    hr REAL NOT NULL,
                    systolic_bp REAL NOT NULL,
                    diastolic_bp REAL NOT NULL,
                    glucose_proxy REAL NOT NULL,
                    symptom_score REAL NOT NULL,
                    med_due INTEGER NOT NULL,
                    med_taken INTEGER NOT NULL,
                    adherence_percent REAL NOT NULL,
                    drug_level REAL NOT NULL,
                    lab_flag INTEGER NOT NULL,
                    adverse_event INTEGER NOT NULL,
                    dropout_event INTEGER NOT NULL,
                    PRIMARY KEY (patient_id, ts),
                    FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
                )
                """
            )
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS uploads (
                    upload_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    patient_id TEXT NOT NULL,
                    source_name TEXT NOT NULL,
                    source_type TEXT NOT NULL,
                    observation_count INTEGER NOT NULL,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
                """
            )

    def upsert_patient(self, patient: dict) -> None:
        values = [patient.get(column) for column in PATIENT_COLUMNS]
        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO patients (
                    patient_id, age, weight, hba1c, systolic_bp, diastolic_bp, cholesterol,
                    exercise_score, diet_score, medication_adherence_baseline, profile_label
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(patient_id) DO UPDATE SET
                    age = excluded.age,
                    weight = excluded.weight,
                    hba1c = excluded.hba1c,
                    systolic_bp = excluded.systolic_bp,
                    diastolic_bp = excluded.diastolic_bp,
                    cholesterol = excluded.cholesterol,
                    exercise_score = excluded.exercise_score,
                    diet_score = excluded.diet_score,
                    medication_adherence_baseline = excluded.medication_adherence_baseline,
                    profile_label = excluded.profile_label
                """,
                values,
            )

    def upsert_observations(self, patient_id: str, observations: list[dict]) -> None:
        if not observations:
            return

        rows = [[observation.get(column) for column in OBSERVATION_COLUMNS] for observation in observations]
        with self._connect() as connection:
            connection.executemany(
                """
                INSERT INTO observations (
                    patient_id, ts, hr, systolic_bp, diastolic_bp, glucose_proxy, symptom_score,
                    med_due, med_taken, adherence_percent, drug_level, lab_flag,
                    adverse_event, dropout_event
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(patient_id, ts) DO UPDATE SET
                    hr = excluded.hr,
                    systolic_bp = excluded.systolic_bp,
                    diastolic_bp = excluded.diastolic_bp,
                    glucose_proxy = excluded.glucose_proxy,
                    symptom_score = excluded.symptom_score,
                    med_due = excluded.med_due,
                    med_taken = excluded.med_taken,
                    adherence_percent = excluded.adherence_percent,
                    drug_level = excluded.drug_level,
                    lab_flag = excluded.lab_flag,
                    adverse_event = excluded.adverse_event,
                    dropout_event = excluded.dropout_event
                """,
                rows,
            )

    def record_upload(self, patient_id: str, source_name: str, source_type: str, observation_count: int) -> None:
        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO uploads (patient_id, source_name, source_type, observation_count)
                VALUES (?, ?, ?, ?)
                """,
                [patient_id, source_name, source_type, observation_count],
            )

    def load_all(self) -> tuple[list[dict], list[dict]]:
        with self._connect() as connection:
            patients = [dict(row) for row in connection.execute("SELECT * FROM patients ORDER BY patient_id")]
            observations = [
                dict(row)
                for row in connection.execute("SELECT * FROM observations ORDER BY patient_id, ts")
            ]
        return patients, observations
