import CountUpValue from "./CountUpValue";

function formatPercent(value) {
  return `${Math.round(value * 100)}%`;
}

function buildSideMetrics(twin, simulation, side) {
  const patient = twin.patient_summary;
  const summary = simulation?.comparison_summary?.[side];
  const isAdherent = side === "adherent";

  return {
    label: isAdherent ? "Adherent twin" : "Non-adherent twin",
    badge: isAdherent ? "Adherent future" : "Non-adherent future",
    stats: [
      {
        label: "Projected health",
        value: summary?.final_health_score ?? twin.health_score,
        decimals: 1
      },
      {
        label: "Safety risk",
        value: formatPercent(summary?.final_safety_risk ?? twin.current_risks.safety_risk)
      },
      {
        label: "Dropout risk",
        value: formatPercent(summary?.final_dropout_risk ?? twin.current_risks.dropout_risk)
      },
      {
        label: "Adherence path",
        value: isAdherent ? "100%" : "Falling"
      },
      {
        label: "Baseline HbA1c",
        value: patient.hba1c
      },
      {
        label: "Exercise score",
        value: patient.exercise_score
      }
    ]
  };
}

function SideCard({ tone, twin, side, simulation }) {
  const patient = twin.patient_summary;
  const content = buildSideMetrics(twin, simulation, side);
  const avatarText = `${patient.patient_id.slice(0, 1)}${patient.patient_id.slice(-1)}`;

  return (
    <article className={`twin-card ${tone}`}>
      <p className="twin-card-label">{content.label}</p>
      <div className="twin-card-head">
        <div className="twin-avatar">{avatarText}</div>
        <div>
          <h3>{patient.patient_id}</h3>
          <p>{patient.profile_label || "Generated clinical profile"}</p>
        </div>
        <span className={`twin-badge ${tone}`}>{content.badge}</span>
      </div>

      <div className="twin-card-grid">
        {content.stats.map((item) => (
          <div key={item.label} className="twin-stat">
            <span>{item.label}</span>
            {typeof item.value === "number" ? (
              <strong>
                <CountUpValue value={item.value} decimals={item.decimals || 0} />
              </strong>
            ) : (
              <strong>{item.value}</strong>
            )}
          </div>
        ))}
      </div>

      <div className="twin-card-footer">
        <span>Age {patient.age}</span>
        <span>{tone === "adherent" ? "Stable participation pattern" : "Diverging risk trajectory"}</span>
      </div>
    </article>
  );
}

export default function TwinSummaryCard({ twin, simulation }) {
  if (!twin) {
    return null;
  }

  return (
    <section className="split-profile">
      <div className="section-heading split-heading">
        <div>
          <p className="eyebrow">Mirror Twin</p>
          <h2>One participant, split into two futures</h2>
        </div>
      </div>

      <div className="split-profile-grid">
        <SideCard tone="adherent" twin={twin} side="adherent" simulation={simulation} />
        <div className="split-profile-divider" aria-hidden="true">
          <span>⋮⋮</span>
        </div>
        <SideCard tone="nonadherent" twin={twin} side="non_adherent" simulation={simulation} />
      </div>
    </section>
  );
}
