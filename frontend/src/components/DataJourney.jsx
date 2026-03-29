function buildMethodCards(twin) {
  const latest = twin.current_state;

  return [
    {
      title: "Synthetic trial portals",
      detail:
        "We simulate participant baselines, daily medication behavior, symptom burden, lab flags, and retention events to create a believable clinical operations stream."
    },
    {
      title: "Feature pipeline",
      detail:
        "Rolling averages, short-run slopes, and recent flags convert raw observations into compact features for the risk models."
    },
    {
      title: "Interpretable ML models",
      detail:
        "Separate logistic regression models estimate safety, dropout, and adherence pressure from those engineered features."
    },
    {
      title: "Twin engine",
      detail:
        "The simulator projects future states under adherent, non-adherent, and intervention paths while preserving a transparent rules-based story."
    },
    {
      title: "Source profile",
      detail: `Example baseline: HbA1c ${twin.patient_summary.hba1c}, age ${twin.patient_summary.age}, exercise score ${twin.patient_summary.exercise_score}.`
    },
    {
      title: "Recent risk digest",
      detail: `Latest glucose ${latest.glucose_proxy}, symptoms ${latest.symptom_score}, adherence ${Math.round(latest.adherence_percent)}%.`
    }
  ];
}

export default function DataJourney({ twin }) {
  if (!twin) {
    return null;
  }

  return (
    <section id="methodology" className="method-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Methodology</p>
          <h2>How we generated and consumed the data</h2>
          <p className="section-copy">
            The split-screen story is powered by synthetic participant histories, interpretable
            feature engineering, and a lightweight twin engine built for a hackathon demo.
          </p>
        </div>
      </div>

      <div className="method-grid">
        {buildMethodCards(twin).map((item, index) => (
          <article key={item.title} className="method-card">
            <span className="method-icon">{String(index + 1).padStart(2, "0")}</span>
            <div>
              <h3>{item.title}</h3>
              <p>{item.detail}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
