import { Line, LineChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function buildComparisonData(simulation) {
  const scenarios = simulation ? Object.keys(simulation.scenario_trajectories) : [];
  if (!simulation || scenarios.length === 0) {
    return [];
  }

  return simulation.scenario_trajectories[scenarios[0]].map((_, index) => {
    const row = { day: index + 1 };
    scenarios.forEach((scenario) => {
      row[scenario] = simulation.scenario_trajectories[scenario][index].projected_health_score;
    });
    return row;
  });
}

export default function ProjectionComparison({ simulation }) {
  if (!simulation) {
    return null;
  }

  const data = buildComparisonData(simulation);

  return (
    <section className="panel">
      <div className="section-head">
        <div>
          <p className="eyebrow">Dual-Future Projection</p>
          <h2>How outcomes diverge</h2>
          <p className="muted">{simulation.narrative_explanation}</p>
        </div>
      </div>

      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d9e2ee" />
            <XAxis dataKey="day" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="adherent" stroke="#059669" strokeWidth={3} dot={false} />
            <Line type="monotone" dataKey="non_adherent" stroke="#dc2626" strokeWidth={3} dot={false} />
            {simulation.scenario_trajectories.intervention_now ? (
              <Line type="monotone" dataKey="intervention_now" stroke="#2563eb" strokeWidth={3} dot={false} />
            ) : null}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="comparison-grid">
        {Object.entries(simulation.comparison_summary).map(([scenario, summary]) => (
          <div key={scenario} className="metric-card">
            <span>{scenario.replaceAll("_", " ")}</span>
            <strong>{summary.final_health_score}</strong>
            <small>Safety {Math.round(summary.final_safety_risk * 100)}%</small>
          </div>
        ))}
      </div>
    </section>
  );
}
