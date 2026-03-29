const timestamps = ["Just now", "Today", "Next review window", "Queue monitor"];

export default function Alerts({ alerts }) {
  const resolvedAlerts = alerts?.length
    ? alerts
    : [
        {
          severity: "low",
          title: "No active alerts",
          detail: "The participant is stable enough for routine monitoring."
        }
      ];

  return (
    <section className="queue-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Action Queue</p>
          <h2>Recommended clinical actions</h2>
        </div>
      </div>

      <div className="queue-list">
        {resolvedAlerts.map((alert, index) => (
          <article key={`${alert.title}-${alert.severity}`} className={`queue-item ${alert.severity}`}>
            <div className="queue-priority">
              <span className={`priority-dot ${alert.severity}`} />
              <strong>{alert.severity.toUpperCase()}</strong>
            </div>
            <div className="queue-copy">
              <h3>{alert.title}</h3>
              <p>{alert.detail}</p>
            </div>
            <time>{timestamps[index] || "Today"}</time>
          </article>
        ))}
      </div>
    </section>
  );
}
