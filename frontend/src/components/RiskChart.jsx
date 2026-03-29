import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

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
    <section className="neutral-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Observed Participant Trend</p>
          <h2>What actually happened before the twin split</h2>
          <p className="section-copy">
            This is the neutral timeline: the real synthetic observation stream that feeds both
            projected futures.
          </p>
        </div>
      </div>

      <div className="neutral-chart-wrap">
        <ResponsiveContainer width="100%" height={310}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d6dde5" vertical={false} />
            <XAxis dataKey="day" stroke="#6b7280" tickLine={false} axisLine={false} />
            <YAxis stroke="#6b7280" tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                borderRadius: 18,
                border: "1px solid #d8dde6",
                boxShadow: "0 16px 40px rgba(31, 41, 55, 0.08)"
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="glucose" stroke="#6b7c93" strokeWidth={2.4} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="symptoms" stroke="#94a3b8" strokeWidth={2.2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="adherence" stroke="#4b6b88" strokeWidth={2.4} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
