from __future__ import annotations

import json
import os
from pathlib import Path

import pandas as pd
from fastapi import Depends, FastAPI, File, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .database import LocalTrialStore
from .model_store import artifacts_ready
from .schemas import IngestRequest, PredictRequest, SimulateRequest
from .twin_engine import TwinEngine
from .upload_parser import parse_upload_payload


ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT_DIR / "data"
DB_PATH = DATA_DIR / "trialtwin.db"
TOKEN = os.getenv("TRIALTWIN_TOKEN", "dev-token")

app = FastAPI(title="TrialTwin AI", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine: TwinEngine | None = None
store: LocalTrialStore | None = None


def require_token(x_trialtwin_token: str = Header(default="")) -> None:
    if x_trialtwin_token != TOKEN:
        raise HTTPException(status_code=401, detail="Invalid token")


@app.on_event("startup")
def startup_event() -> None:
    global engine, store
    if not artifacts_ready():
        raise RuntimeError("Model artifacts are missing. Run generate_synthetic.py and train_model.py first.")

    store = LocalTrialStore(DB_PATH)
    engine = TwinEngine(store=store)
    demo_profiles_path = DATA_DIR / "demo_profiles.json"
    if demo_profiles_path.exists():
        engine.set_demo_profiles(json.loads(demo_profiles_path.read_text()))


@app.get("/health")
def health() -> dict:
    patient_count = len(_engine().twins) if engine is not None else 0
    return {"status": "ok", "artifacts_ready": artifacts_ready(), "db_path": str(DB_PATH), "patient_count": patient_count}


@app.get("/patients", dependencies=[Depends(require_token)])
def list_patients() -> list[dict]:
    return _engine().list_patients()


@app.post("/ingest", dependencies=[Depends(require_token)])
def ingest(payload: IngestRequest) -> dict:
    _engine().ingest(
        patient=payload.patient.model_dump(),
        observations=[observation.model_dump() for observation in payload.observations],
    )
    return {"status": "ingested", "patient_id": payload.patient.patient_id, "observation_count": len(payload.observations)}


@app.post("/upload", dependencies=[Depends(require_token)])
async def upload_patient_file(file: UploadFile = File(...)) -> dict:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Uploaded file must have a filename.")

    raw_payload = await file.read()
    try:
        patient, observations, source_type = parse_upload_payload(file.filename, raw_payload)
        _engine().ingest(patient=patient, observations=observations)
        _store().record_upload(
            patient_id=patient["patient_id"],
            source_name=file.filename,
            source_type=source_type,
            observation_count=len(observations),
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    return {
        "status": "uploaded",
        "patient_id": patient["patient_id"],
        "source_name": file.filename,
        "source_type": source_type,
        "observation_count": len(observations),
    }


@app.get("/twin/{patient_id}", dependencies=[Depends(require_token)])
def get_twin(patient_id: str) -> dict:
    try:
        return _engine().get_twin_summary(patient_id)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@app.post("/predict", dependencies=[Depends(require_token)])
def predict(payload: PredictRequest) -> dict:
    try:
        summary = _engine().get_twin_summary(payload.patient_id)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error

    return {
        "patient_id": payload.patient_id,
        "current_risks": summary["current_risks"],
        "health_score": summary["health_score"],
        "alerts": summary["alerts"],
    }


@app.post("/simulate", dependencies=[Depends(require_token)])
def simulate(payload: SimulateRequest) -> dict:
    scenarios = list(dict.fromkeys(payload.scenarios + [payload.selected_scenario]))
    try:
        return _engine().simulate(
            patient_id=payload.patient_id,
            selected_scenario=payload.selected_scenario,
            scenarios=scenarios,
            days=payload.days,
        )
    except KeyError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@app.get("/demo-profiles")
def demo_profiles() -> list[dict]:
    return _engine().get_demo_profiles()


@app.post("/seed-from-files", dependencies=[Depends(require_token)])
def seed_from_files() -> dict:
    patients_path = DATA_DIR / "patients.csv"
    observations_path = DATA_DIR / "observations.csv"
    if not patients_path.exists() or not observations_path.exists():
        raise HTTPException(status_code=404, detail="Data files are missing. Run generate_synthetic.py first.")

    patients = pd.read_csv(patients_path).to_dict(orient="records")
    observations = pd.read_csv(observations_path).to_dict(orient="records")
    _engine().ingest_bulk(patients, observations)
    return {"status": "seeded", "patient_count": len(patients), "observation_count": len(observations)}


def _engine() -> TwinEngine:
    if engine is None:
        raise HTTPException(status_code=503, detail="Twin engine not initialized")
    return engine


def _store() -> LocalTrialStore:
    if store is None:
        raise HTTPException(status_code=503, detail="Trial store not initialized")
    return store
