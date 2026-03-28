from __future__ import annotations

import sys
from pathlib import Path

import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT_DIR / "data"
PROJECT_ROOT = ROOT_DIR.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.feature_pipeline import build_training_frame
from backend.app.model_store import save_artifact, save_feature_config


def build_classifier() -> Pipeline:
    return Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
            ("model", LogisticRegression(max_iter=2000, class_weight="balanced")),
        ]
    )


def train_single_model(features: pd.DataFrame, labels: pd.Series, name: str) -> Pipeline:
    if labels.nunique() < 2:
        raise ValueError(f"{name} labels only contain one class. Regenerate synthetic data.")

    x_train, x_test, y_train, y_test = train_test_split(
        features,
        labels,
        test_size=0.25,
        random_state=42,
        stratify=labels if labels.value_counts().min() >= 2 else None,
    )

    model = build_classifier()
    model.fit(x_train, y_train)
    predicted = model.predict(x_test)
    probabilities = model.predict_proba(x_test)[:, 1]

    forest = RandomForestClassifier(n_estimators=120, random_state=42, class_weight="balanced")
    forest.fit(x_train, y_train)
    forest_probabilities = forest.predict_proba(x_test)[:, 1]

    print(f"\n=== {name.upper()} MODEL ===")
    print(f"LogisticRegression ROC-AUC: {roc_auc_score(y_test, probabilities):.3f}")
    print(f"RandomForest ROC-AUC: {roc_auc_score(y_test, forest_probabilities):.3f}")
    print(classification_report(y_test, predicted, digits=3))

    return model


def main() -> None:
    patients = pd.read_csv(DATA_DIR / "patients.csv")
    observations = pd.read_csv(DATA_DIR / "observations.csv")
    bundle = build_training_frame(observations, patients)
    frame = bundle.frame

    features = frame[bundle.feature_columns]
    safety_model = train_single_model(features, frame["target_safety"], "safety")
    dropout_model = train_single_model(features, frame["target_dropout"], "dropout")
    adherence_model = train_single_model(features, frame["target_adherence"], "adherence")

    save_artifact("model_safety.joblib", safety_model)
    save_artifact("model_dropout.joblib", dropout_model)
    save_artifact("model_adherence.joblib", adherence_model)
    save_feature_config({"feature_columns": bundle.feature_columns})

    print("\nSaved model artifacts and feature configuration to backend/artifacts/")


if __name__ == "__main__":
    main()
