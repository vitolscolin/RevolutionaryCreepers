export default function Alerts({ alerts }) {
  return (
    <section className="panel">
      <div className="section-head">
        <div>
          <p className="eyebrow">Monitoring Alerts</p>
          <h2>Action queue</h2>
        </div>
      </div>

      <div className="alert-list">
        {alerts?.length ? (
          alerts.map((alert) => (
            <div key={`${alert.title}-${alert.severity}`} className={`alert-card ${alert.severity}`}>
              <strong>{alert.title}</strong>
              <p>{alert.detail}</p>
            </div>
          ))
        ) : (
          <div className="alert-card low">
            <strong>No active alerts</strong>
            <p>The participant is currently stable enough for routine monitoring.</p>
          </div>
        )}
      </div>
    </section>
  );
}
