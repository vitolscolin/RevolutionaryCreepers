function classifyRisk(value) {
  if (value >= 0.7) {
    return "High";
  }
  if (value >= 0.4) {
    return "Moderate";
  }
  return "Low";
}

function buildDecisionRows(twin) {
  const latest = twin.current_state;
  const risks = twin.current_risks;

  return [
    {
      model: "Safety model",
      score: `${Math.round(risks.safety_risk * 100)}%`,
      level: classifyRisk(risks.safety_risk),
      reason:
        latest.glucose_proxy > 145 || latest.symptom_score > 5
          ? "Elevated glucose proxy and symptom burden push the probability upward."
          : "Controlled symptoms and glucose reduce near-term safety pressure."
    },
    {
      model: "Dropout model",
      score: `${Math.round(risks.dropout_risk * 100)}%`,
      level: classifyRisk(risks.dropout_risk),
      reason:
        latest.adherence_percent < 70
          ? "Falling adherence increases the chance the participant disengages from the protocol."
          : "The current pattern suggests the participant is more likely to remain engaged."
    },
    {
      model: "Adherence model",
      score: `${Math.round(risks.adherence_risk * 100)}%`,
      level: classifyRisk(risks.adherence_risk),
      reason:
        latest.drug_level < 0.8
          ? "Low drug exposure plus recent adherence drift signals further deterioration risk."
          : "Current medication behavior looks more likely to remain stable."
    }
  ];
}

export default function DecisionLogic({ twin }) {
  if (!twin) {
    return null;
  }

  const rows = buildDecisionRows(twin);

  return (
    <section className="panel">
      <div className="section-head">
        <div>
          <p className="eyebrow">Decision Logic</p>
          <h2>How the models make these calls</h2>
          <p className="muted">
            Each risk score comes from a separate logistic regression model. The models weigh recent
            vitals, symptom burden, adherence behavior, drug exposure, and short-term trends to
            estimate what is most likely to happen next.
          </p>
        </div>
      </div>

      <div className="decision-grid">
        {rows.map((row) => (
          <div key={row.model} className="decision-card">
            <div className="decision-topline">
              <span>{row.model}</span>
              <span className={`decision-level ${row.level.toLowerCase()}`}>{row.level}</span>
            </div>
            <strong>{row.score}</strong>
            <p>{row.reason}</p>
          </div>
        ))}
      </div>

      <div className="decision-footer">
        <p className="muted">
          In the backend, these models operate on engineered features such as rolling averages,
          seven-day slopes, lab flags, and adherence behavior rather than raw single-point values
          alone.
        </p>
      </div>
    </section>
  );
}
