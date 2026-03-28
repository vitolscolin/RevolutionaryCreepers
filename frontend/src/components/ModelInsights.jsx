function buildSignals(twin) {
  if (!twin) {
    return [];
  }

  const latest = twin.current_state;
  const risks = twin.current_risks;
  const signals = [];

  signals.push({
    label: "Adherence trend",
    value: `${Math.round(latest.adherence_percent)}%`,
    impact:
      latest.adherence_percent < 70
        ? "Strongly increases dropout and adherence risk"
        : "Currently supportive of participant stability"
  });

  signals.push({
    label: "Glucose proxy",
    value: latest.glucose_proxy.toFixed(1),
    impact:
      latest.glucose_proxy > 145
        ? "Pushing the safety model upward"
        : "Within a more controlled range"
  });

  signals.push({
    label: "Symptom score",
    value: latest.symptom_score.toFixed(1),
    impact:
      latest.symptom_score > 5
        ? "Contributing to higher safety and dropout pressure"
        : "Symptoms remain relatively contained"
  });

  signals.push({
    label: "Drug level",
    value: latest.drug_level.toFixed(2),
    impact:
      latest.drug_level < 0.8
        ? "Suggests the participant is drifting off protocol"
        : "Suggests the regimen is being maintained"
  });

  if (risks.safety_risk > 0.7) {
    signals.unshift({
      label: "Safety model output",
      value: `${Math.round(risks.safety_risk * 100)}%`,
      impact: "Logistic regression flags this twin for near-term review"
    });
  }

  return signals.slice(0, 4);
}

export default function ModelInsights({ twin }) {
  if (!twin) {
    return null;
  }

  const signals = buildSignals(twin);

  return (
    <section className="panel">
      <div className="section-head">
        <div>
          <p className="eyebrow">ML Layer</p>
          <h2>How the twin makes decisions</h2>
          <p className="muted">
            TrialTwin AI uses interpretable logistic regression models trained on synthetic
            longitudinal trial data. The future curves are rules-based scenario projections layered
            on top of those risk scores.
          </p>
        </div>
      </div>

      <div className="model-badges">
        <span className="model-badge">Safety model: Logistic Regression</span>
        <span className="model-badge">Dropout model: Logistic Regression</span>
        <span className="model-badge">Adherence model: Logistic Regression</span>
      </div>

      <div className="insight-grid">
        {signals.map((signal) => (
          <div key={signal.label} className="insight-card">
            <span>{signal.label}</span>
            <strong>{signal.value}</strong>
            <p>{signal.impact}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
