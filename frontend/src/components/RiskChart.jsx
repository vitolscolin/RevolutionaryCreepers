import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function RiskChart({ twin }) {
  if (!twin) {
    return null;
  }

  const chartData = twin.recent_observations.map((item) => ({
    day: item.ts.slice(5, 10),
    glucose: item.glucose_proxy,
    symptoms: item.symptom_score,
    adherence: item.adherence_percent
  }));

  return (
    <section className="panel">
      <div className="section-head">
        <div>
          <p className="eyebrow">Recent Signals</p>
          <h2>Observed participant trend</h2>
        </div>
      </div>

      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d9e2ee" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="glucose" stroke="#f97316" fill="#fed7aa" />
            <Area type="monotone" dataKey="symptoms" stroke="#dc2626" fill="#fecaca" />
            <Area type="monotone" dataKey="adherence" stroke="#2563eb" fill="#bfdbfe" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
