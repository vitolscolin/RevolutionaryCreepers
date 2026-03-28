function formatPercent(value) {
  return `${Math.round(value * 100)}%`;
}

export default function TwinSummaryCard({ twin }) {
  if (!twin) {
    return null;
  }

  const { patient_summary: patient, current_risks: risks, health_score: healthScore } = twin;

  return (
    <section className="panel summary-panel">
      <div className="section-head">
        <div>
          <p className="eyebrow">Trial Twin</p>
          <h2>{patient.patient_id}</h2>
          <p className="muted">{patient.profile_label || "generated profile"}</p>
        </div>
        <div className="health-badge">
          <span>Health Score</span>
          <strong>{healthScore}</strong>
        </div>
      </div>

      <div className="summary-grid">
        <div className="metric-card">
          <span>Safety risk</span>
          <strong>{formatPercent(risks.safety_risk)}</strong>
        </div>
        <div className="metric-card">
          <span>Dropout risk</span>
          <strong>{formatPercent(risks.dropout_risk)}</strong>
        </div>
        <div className="metric-card">
          <span>Adherence risk</span>
          <strong>{formatPercent(risks.adherence_risk)}</strong>
        </div>
        <div className="metric-card">
          <span>Baseline HbA1c</span>
          <strong>{patient.hba1c}</strong>
        </div>
      </div>
    </section>
  );
}
