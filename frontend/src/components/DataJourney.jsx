function buildFeatureSummary(twin) {
  if (!twin) {
    return [];
  }

  const latest = twin.current_state;

  return [
    {
      title: "Synthetic source profile",
      detail: `Baseline HbA1c ${twin.patient_summary.hba1c}, age ${twin.patient_summary.age}, exercise ${twin.patient_summary.exercise_score}.`
    },
    {
      title: "Recent trial signals",
      detail: `Latest glucose proxy ${latest.glucose_proxy}, symptoms ${latest.symptom_score}, adherence ${Math.round(latest.adherence_percent)}%.`
    },
    {
      title: "Engineered model inputs",
      detail: "Rolling averages, 7-day slopes, drug level trend, blood pressure trend, and recent lab flags."
    },
    {
      title: "Operational outputs",
      detail: "Safety, dropout, adherence, health score, alerts, and scenario comparisons for trial staff."
    }
  ];
}

export default function DataJourney({ twin }) {
  if (!twin) {
    return null;
  }

  const steps = buildFeatureSummary(twin);

  return (
    <section className="panel">
      <div className="section-head">
        <div>
          <p className="eyebrow">Data Journey</p>
          <h2>How we generated and consumed the data</h2>
          <p className="muted">
            The dashboard values are not hand-entered. They are created from synthetic longitudinal
            patient records, transformed into interpretable model features, then consumed by the
            twin engine and scenario simulator.
          </p>
        </div>
      </div>

      <div className="journey-grid">
        <div className="journey-card">
          <span className="journey-step">1. Generate</span>
          <strong>Synthetic trial patients</strong>
          <p>
            We create diabetes-like participant baselines and daily observations with medication
            decay, adherence drift, symptoms, lab flags, adverse events, and dropout events.
          </p>
        </div>

        <div className="journey-card">
          <span className="journey-step">2. Engineer</span>
          <strong>Feature pipeline</strong>
          <p>
            The backend converts raw observations into latest values, rolling averages, and short
            trend slopes so the models can score current participant risk.
          </p>
        </div>

        <div className="journey-card">
          <span className="journey-step">3. Learn</span>
          <strong>Interpretable ML models</strong>
          <p>
            Logistic regression models estimate safety, dropout, and adherence risk from those
            features using patterns learned from synthetic patient history.
          </p>
        </div>

        <div className="journey-card">
          <span className="journey-step">4. Simulate</span>
          <strong>Twin + futures</strong>
          <p>
            The twin engine consumes the risk scores and latest state, then projects adherent,
            non-adherent, and intervention paths with transparent rules-based logic.
          </p>
        </div>
      </div>

      <div className="insight-grid">
        {steps.map((step) => (
          <div key={step.title} className="insight-card">
            <span>{step.title}</span>
            <strong>{step.detail}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
