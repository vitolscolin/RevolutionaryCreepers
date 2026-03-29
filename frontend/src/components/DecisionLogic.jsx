import CountUpValue from "./CountUpValue";

function classifyRisk(value) {
  if (value >= 0.7) {
    return "high";
  }
  if (value >= 0.4) {
    return "watch";
  }
  return "safe";
}

export default function DecisionLogic({ twin }) {
  if (!twin) {
    return null;
  }

  const risks = twin.current_risks;
  const escalationProxy = (risks.safety_risk + risks.dropout_risk + risks.adherence_risk) * 100;
  const pipeline = ["Inputs", "Features", "Models", "Risk scores", "Recommendations"];
  const metrics = [
    {
      label: "Safety model score",
      value: risks.safety_risk * 100,
      decimals: 0,
      tone: classifyRisk(risks.safety_risk)
    },
    {
      label: "Dropout model score",
      value: risks.dropout_risk * 100,
      decimals: 0,
      tone: classifyRisk(risks.dropout_risk)
    },
    {
      label: "Escalation proxy score",
      value: escalationProxy,
      decimals: 1,
      tone: escalationProxy >= 150 ? "high" : escalationProxy >= 100 ? "watch" : "safe"
    }
  ];

  return (
    <section className="decision-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Decision Engine</p>
          <h2>How the twin makes decisions</h2>
          <p className="section-copy">
            We turn recent observations into engineered features, feed them into interpretable
            models, then convert those scores into operational recommendations.
          </p>
        </div>
      </div>

      <div className="pipeline">
        {pipeline.map((step, index) => (
          <div key={step} className="pipeline-step">
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{step}</strong>
          </div>
        ))}
      </div>

      <div className="decision-metrics">
        {metrics.map((metric) => (
          <article key={metric.label} className={`decision-metric ${metric.tone}`}>
            <span>{metric.label}</span>
            <strong>
              <CountUpValue value={metric.value} decimals={metric.decimals} suffix={metric.label.includes("score") && metric.decimals === 0 ? "%" : ""} />
            </strong>
          </article>
        ))}
      </div>
    </section>
  );
}
