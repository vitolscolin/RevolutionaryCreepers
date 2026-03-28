# TrialTwin AI

TrialTwin AI is a hackathon-ready MVP for clinical trial operations teams. It creates a lightweight digital twin for each synthetic participant, scores current safety, dropout, and adherence risk, and simulates how future outcomes diverge under adherent, non-adherent, and intervention scenarios.

This is not a biological digital twin. It is a trial-focused monitoring and scenario simulation tool designed for rapid demo value.

## Product Overview

TrialTwin AI combines:

- clinical trial monitoring and decision support
- explainable risk scoring
- dual-future simulation for participant behavior
- a visual dashboard for trial staff and CRO teams

The MVP uses synthetic diabetes-like trial data to make adherence-driven future scenarios intuitive during a demo.

## ELI5

Imagine a clinical trial team has a smart practice patient for every real participant.

TrialTwin AI does three simple things:

1. It makes fake but realistic patient data for a clinical trial.
2. It studies that data to learn patterns that usually come before safety issues, dropout, or poor adherence.
3. It shows trial staff what might happen next if a participant stays on track, falls off track, or gets help right away.

In plain English:

- the backend creates synthetic patient histories
- the models look at recent patterns like symptoms, blood pressure, glucose trend, and medication behavior
- the app turns that into risk scores
- the simulator then shows two or three possible futures on the screen

So the app is basically saying:

"Based on what this participant has looked like lately, here is how risky they seem right now, and here is how their future may change depending on what they do next."

That is why it feels like a digital twin. It is a lightweight, trial-focused mirror of a participant's current state plus a simple forecast of where they might go.

## Architecture

- `backend/scripts/generate_synthetic.py` creates patient and observation data
- `backend/scripts/train_model.py` trains interpretable scikit-learn models
- `backend/app/twin_engine.py` maintains in-memory participant twin state
- `backend/app/main.py` serves FastAPI endpoints for monitoring and simulation
- `frontend/` provides a React + Vite dashboard with Recharts visualizations

## Folder Structure

```text
backend/
  app/
    main.py
    schemas.py
    twin_engine.py
    risk_equations.py
    feature_pipeline.py
    model_store.py
  scripts/
    generate_synthetic.py
    train_model.py
    seed_demo_data.py
  data/
  artifacts/
  requirements.txt

frontend/
  src/
    components/
      PatientSelector.jsx
      TwinSummaryCard.jsx
      RiskChart.jsx
      ScenarioButtons.jsx
      Alerts.jsx
      ProjectionComparison.jsx
    api.js
    App.jsx
    main.jsx
  package.json
```

## Setup

### Backend dependencies

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

If `python3 -m venv` is unavailable on your machine, use:

```bash
pip3 install --user -r backend/requirements.txt
```

### Generate synthetic data

```bash
python3 backend/scripts/generate_synthetic.py
```

### Train the models

```bash
python3 backend/scripts/train_model.py
```

### Run the backend

```bash
python3 -m uvicorn backend.app.main:app --reload
```

### Seed demo data into the API

In a second terminal, with the backend running:

```bash
python3 backend/scripts/seed_demo_data.py
```

### Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## 5-Minute Quickstart

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
python3 backend/scripts/generate_synthetic.py
python3 backend/scripts/train_model.py
python3 -m uvicorn backend.app.main:app --reload
```

Then in another terminal:

```bash
source .venv/bin/activate
python3 backend/scripts/seed_demo_data.py
cd frontend
npm install
npm run dev
```

If your machine does not support `python3 -m venv`, use this instead:

```bash
pip3 install --user -r backend/requirements.txt
python3 backend/scripts/generate_synthetic.py
python3 backend/scripts/train_model.py
python3 -m uvicorn backend.app.main:app --reload
```

Then in another terminal:

```bash
python3 backend/scripts/seed_demo_data.py
cd frontend
npm install
npm run dev
```

## Example API Usage

Health check:

```bash
curl http://localhost:8000/health
```

List patients:

```bash
curl -H "x-trialtwin-token: dev-token" http://localhost:8000/patients
```

Simulate an intervention:

```bash
curl -X POST http://localhost:8000/simulate \
  -H "Content-Type: application/json" \
  -H "x-trialtwin-token: dev-token" \
  -d '{"patient_id":"P003","selected_scenario":"intervention_now","scenarios":["adherent","non_adherent","intervention_now"],"days":21}'
```

## Demo Flow For Judges

1. Start on the dashboard and explain that each participant has a lightweight trial twin.
2. Select the `rising_risk` or `poor_adherence` demo patient.
3. Highlight current safety, dropout, and adherence risk.
4. Show alerts and recent participant observations.
5. Compare adherent and non-adherent futures on the projection chart.
6. Switch to `intervention_now` to show reversibility and decision support value.

## Limitations And Future Work

- Uses synthetic data and simple interpretable models only.
- In-memory twin storage is reset when the API restarts.
- The projection engine is rules-based rather than a true causal or physiological simulator.
- Authentication is a single shared token intended for local demo use.
- Future work could add protocol milestones, site-level aggregation, and richer intervention workflows.

## Disclaimer

TrialTwin AI is an educational hackathon prototype using synthetic data. It is not medical advice and should not be used for clinical care decisions.
