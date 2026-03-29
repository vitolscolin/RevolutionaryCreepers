# TrialTwin AI Team Guide

This README is for us, not for judges.

Its job is to make the app easy to explain during the presentation by answering four questions clearly:

1. What is the app doing?
2. Why are we doing it that way?
3. How does the data move through the system?
4. How should we talk about it in a demo?

## One-Sentence Pitch

TrialTwin AI gives each synthetic clinical trial participant a lightweight digital twin, scores their current operational risk, and shows how their future diverges under adherent versus non-adherent behavior.

## The Big Idea

We are not building a biological simulator.

We are building a clinical trial operations simulator that answers:

- Who looks risky right now?
- Why do they look risky?
- What future is likely if behavior improves or worsens?

That is why the product is centered on monitoring, risk scoring, and scenario comparison instead of physiology.

## The App Flow In Plain English

This is the simplest way to understand the whole system:

1. We generate fake but believable participant data.
2. We transform that history into model features.
3. We use interpretable models to estimate current risk.
4. We create a “twin” from the participant’s latest state.
5. We simulate future scenarios from that twin.
6. We present the result in a visual dashboard built for storytelling.

## Step By Step

### 1. Synthetic participant generation

File:
[generate_synthetic.py](/home/colinvitols/GitHub/Hackathon/RevolutionaryCreepers/backend/scripts/generate_synthetic.py)

What it does:

- Creates baseline participant profiles such as `stable_adherent`, `rising_risk`, and `poor_adherence`
- Samples age, weight, HbA1c, blood pressure, cholesterol, exercise, diet, and baseline medication adherence
- Simulates daily observations over time

Why it exists:

- We needed safe demo data
- We wanted consistent patterns that are easy to explain live
- We wanted participants with visibly different trajectories

What gets generated per day:

- heart rate
- systolic and diastolic blood pressure
- glucose proxy
- symptom score
- medication taken or not taken
- adherence percent
- drug level
- lab flag
- adverse event flag
- dropout event flag

Output files:

- `backend/data/patients.csv`
- `backend/data/observations.csv`
- `backend/data/demo_profiles.json`

Key talking point:

“We generate synthetic longitudinal trial histories so we can safely demonstrate the product without using real patient data.”

### 2. Feature engineering

File:
[feature_pipeline.py](/home/colinvitols/GitHub/Hackathon/RevolutionaryCreepers/backend/app/feature_pipeline.py)

What it does:

- Takes raw participant history
- Builds model-ready features from the latest and recent observations

Examples of features:

- latest glucose proxy
- latest symptom score
- latest adherence percent
- 3-day and 7-day rolling averages
- 7-day slopes for glucose, symptoms, adherence, and drug level
- recent lab flags and adverse events

Why it exists:

- Raw time series is hard for simple models to consume directly
- These summary features are more interpretable and easier to explain

Key talking point:

“We turn raw daily observations into simple trend-based features like rolling averages and short-term slopes, because that makes the model outputs easier to trust and explain.”

### 3. Model training

File:
[train_model.py](/home/colinvitols/GitHub/Hackathon/RevolutionaryCreepers/backend/scripts/train_model.py)

What it does:

- Reads the synthetic patient and observation data
- Builds a training frame from engineered features
- Trains three logistic regression models

The three models:

- Safety risk
- Dropout risk
- Adherence risk

Why logistic regression:

- Fast
- Interpretable
- Good enough for a hackathon MVP
- Easy to defend in front of judges

Artifacts saved:

- `backend/artifacts/model_safety.joblib`
- `backend/artifacts/model_dropout.joblib`
- `backend/artifacts/model_adherence.joblib`
- `backend/artifacts/feature_config.json`

Key talking point:

“We intentionally chose interpretable models over complex black-box approaches because explainability matters more than sophistication in this demo.”

### 4. Backend API and twin engine

Files:
[main.py](/home/colinvitols/GitHub/Hackathon/RevolutionaryCreepers/backend/app/main.py)
[twin_engine.py](/home/colinvitols/GitHub/Hackathon/RevolutionaryCreepers/backend/app/twin_engine.py)

What happens here:

- The FastAPI backend loads model artifacts
- Demo profiles are loaded
- Participants and observations are ingested into memory
- The twin engine computes a current summary for each participant

What the twin summary includes:

- patient summary
- current safety, dropout, and adherence risks
- current health score
- alerts
- recent observations
- current state

Why in-memory twins:

- Simpler architecture
- Faster for a live demo
- Good enough for the hackathon scope

Key talking point:

“The twin engine is a lightweight in-memory layer that keeps the current participant state and turns it into a live operational summary.”

### 5. Scenario simulation

Files:
[twin_engine.py](/home/colinvitols/GitHub/Hackathon/RevolutionaryCreepers/backend/app/twin_engine.py)
[risk_equations.py](/home/colinvitols/GitHub/Hackathon/RevolutionaryCreepers/backend/app/risk_equations.py)

What it does:

- Starts from the participant’s latest current state
- Projects forward under multiple scenarios

The scenarios:

- `adherent`
- `non_adherent`
- `intervention_now`

What gets projected:

- projected glucose proxy
- projected symptom score
- projected safety risk
- projected dropout risk
- projected health score

Why it exists:

- Current risk is useful, but future divergence is the part judges remember
- The simulation makes the benefit of intervention visible immediately

Key talking point:

“The core value is not just scoring the participant today. It is showing how quickly the future changes depending on what happens next.”

### 6. Frontend experience

Folder:
[frontend/src](/home/colinvitols/GitHub/Hackathon/RevolutionaryCreepers/frontend/src)

What it does:

- Presents the twin as a visual story
- Lets the user choose a participant
- Shows the split between adherent and non-adherent futures
- Organizes the experience into tabs for faster judging flow

Current tab structure:

- `Overview`
- `Digital Twin`
- `Methodology`
- `Decisions`
- `Pitch`

Why the frontend matters:

- Judges understand visual metaphor faster than technical detail
- The split-screen layout explains the concept before numbers do

Key talking point:

“The UI is part of the pitch. Two sides, two colors, two futures. The layout itself explains the product.”

## What Each Major UI Section Means

### Overview

Purpose:

- Sets the story up quickly
- Explains that we are comparing two futures for one participant

What to say:

- “This app is about seeing where one participant might go next.”

### Digital Twin

Purpose:

- This is the core feature
- Shows twin cards, divergence chart, scoreboard, and observed trend

What to say:

- “Here is the same participant split into an adherent future and a non-adherent future.”
- “The chart makes the divergence obvious at a glance.”

### Methodology

Purpose:

- Defends the technical credibility of the MVP

What to say:

- “We generate synthetic data, engineer interpretable features, train simple models, and drive a lightweight simulator.”

### Decisions

Purpose:

- Shows how risk becomes action

What to say:

- “We do not stop at predictions. We convert them into an operational action queue.”

### Pitch

Purpose:

- Helps close the demo and summarize the value

What to say:

- “This is fast to understand, transparent enough to trust, and safe to demo.”

## Suggested Demo Script

### 30-second version

“TrialTwin AI gives each synthetic trial participant a lightweight digital twin. We score their current safety, dropout, and adherence risk, then simulate how their future diverges if they stay adherent versus fall off treatment. The goal is to help trial operations teams spot risk earlier and see the value of intervention immediately.”

### 2-minute version

1. Start on the `Digital Twin` tab.
2. Pick `rising_risk` or `poor_adherence`.
3. Point to the two mirrored participant futures.
4. Use the divergence chart to show how outcomes separate over time.
5. Show the observed trend below to connect projection back to recent data.
6. Switch to `Decisions` and show how scores become action items.
7. End on `Pitch` and summarize why the product matters.

## Why The Project Is Hackathon-Friendly

- Synthetic data means no privacy risk
- Logistic regression is easy to explain
- The twin engine is lightweight and fast
- The UI creates a memorable story quickly
- The scope stays focused on clinical trial operations rather than unrealistic full biology

## Setup Reference

### Backend

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
python3 backend/scripts/generate_synthetic.py
python3 backend/scripts/train_model.py
python3 -m uvicorn backend.app.main:app --reload
```

### Seed demo data

In a second terminal:

```bash
source .venv/bin/activate
python3 backend/scripts/seed_demo_data.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Repo Roles

Useful files to know:

- [README.md](/home/colinvitols/GitHub/Hackathon/RevolutionaryCreepers/README.md): judge-facing overview
- [generate_synthetic.py](/home/colinvitols/GitHub/Hackathon/RevolutionaryCreepers/backend/scripts/generate_synthetic.py): synthetic data generation
- [train_model.py](/home/colinvitols/GitHub/Hackathon/RevolutionaryCreepers/backend/scripts/train_model.py): model training
- [twin_engine.py](/home/colinvitols/GitHub/Hackathon/RevolutionaryCreepers/backend/app/twin_engine.py): current twin state + simulation
- [App.jsx](/home/colinvitols/GitHub/Hackathon/RevolutionaryCreepers/frontend/src/App.jsx): tabbed SPA shell

## Final Reminder For The Presentation

Do not oversell this as a clinical-grade prediction engine.

The strongest honest framing is:

- lightweight
- synthetic
- interpretable
- operations-focused
- demo-first

That framing is both accurate and strong.
