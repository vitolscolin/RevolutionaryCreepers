# TrialTwin AI

TrialTwin AI is a hackathon-ready clinical trial operations demo that gives each synthetic participant a lightweight digital twin. It helps a trial team understand two possible futures for the same participant: what happens if they stay adherent, and what happens if they fall off track.

This is not a biological digital twin. It is an explainable monitoring and scenario simulation tool built for fast communication, not clinical deployment.

## What It Does

TrialTwin AI combines four ideas in one experience:

- synthetic participant generation
- interpretable risk scoring
- twin-based future simulation
- a visual dashboard that makes divergence obvious

The app shows how recent participant behavior can affect safety risk, dropout risk, and projected health score over time.

## Why It Matters

Clinical trials do not just fail because of biology. They also fail because participants drift, disengage, or develop signals that are noticed too late.

TrialTwin AI is designed to help a trial operations team answer a simple question:

If this participant keeps going the way they are going now, what is most likely to happen next?

And just as importantly:

What changes if we intervene early?

## Core Demo Story

The product is built around a judge-friendly narrative:

1. Pick a participant.
2. Show their current risk picture.
3. Split the participant into two futures.
4. Compare the adherent path with the non-adherent path.
5. Show how an intervention can bend the future back toward stability.

The UI is intentionally designed so the concept is visible before anyone reads the details.

## How It Works

At a high level:

1. The backend generates synthetic diabetes-like trial participants and daily observations.
2. Feature engineering turns those histories into usable model inputs such as rolling averages and short-term slopes.
3. Logistic regression models estimate safety, dropout, and adherence risk.
4. A lightweight twin engine uses the current state plus scenario rules to project future paths.
5. The frontend presents those paths in a split-screen comparison.

## Tech Stack

- Frontend: React + Vite
- Visualization: Recharts + custom SVG
- Backend: FastAPI
- Modeling: pandas, scikit-learn
- Data: fully synthetic CSV- and JSON-based demo data

## Repo Map

```text
backend/
  app/
    main.py
    twin_engine.py
    feature_pipeline.py
    risk_equations.py
    model_store.py
  scripts/
    generate_synthetic.py
    train_model.py
    seed_demo_data.py
  data/
  artifacts/

frontend/
  src/
    App.jsx
    api.js
    components/
```

## Quickstart

### 1. Install backend dependencies

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

If `python3 -m venv` is unavailable:

```bash
pip3 install --user -r backend/requirements.txt
```

### 2. Generate synthetic data

```bash
python3 backend/scripts/generate_synthetic.py
```

### 3. Train the models

```bash
python3 backend/scripts/train_model.py
```

### 4. Run the backend

```bash
python3 -m uvicorn backend.app.main:app --reload
```

### 5. Seed demo data

In a second terminal:

```bash
python3 backend/scripts/seed_demo_data.py
```

### 6. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Demo Flow For Visitors

If you are opening the app for the first time, the best walkthrough is:

1. Start on the `Digital Twin` tab.
2. Choose a higher-risk participant such as `rising_risk` or `poor_adherence`.
3. Compare the adherent and non-adherent twin panels.
4. Look at the diverging outcomes chart and projected scores.
5. Review the observed trend and the action queue.
6. Switch the scenario focus to `intervention_now` to show reversibility.

## Important Constraints

- Uses synthetic data only.
- Uses simple, interpretable models.
- Uses an in-memory twin engine for demo speed.
- Is meant for education and hackathon storytelling, not clinical care.

## Want The Detailed Teammate Guide?

See [TEAM_README.md](/home/colinvitols/GitHub/Hackathon/RevolutionaryCreepers/TEAM_README.md) for the full step-by-step explanation of what the app is doing, why each layer exists, and how to explain it during the presentation.

## Disclaimer

TrialTwin AI is an educational hackathon prototype using synthetic data. It is not medical advice and should not be used for clinical care decisions.
