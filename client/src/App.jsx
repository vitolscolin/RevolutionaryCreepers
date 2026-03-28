import { useEffect, useState } from "react";

const defaultInputs = {
  threatLevel: 72,
  systemExposure: 68,
  dataSensitivity: 81,
  teamPreparedness: 49,
  controlProfile: "Elevated",
  monitoringMode: "Assisted",
  insuranceCoverage: true
};

const sliderFields = [
  { key: "threatLevel", label: "Threat level" },
  { key: "systemExposure", label: "System exposure" },
  { key: "dataSensitivity", label: "Data sensitivity" },
  { key: "teamPreparedness", label: "Team preparedness" }
];

function ScoreCard({ label, score, category, accent }) {
  return (
    <div className="score-card">
      <span className="score-label">{label}</span>
      <div className="score-value-row">
        <strong>{score ?? "--"}</strong>
        <span className={`pill ${accent}`}>{category ?? "Pending"}</span>
      </div>
    </div>
  );
}

export default function App() {
  const [inputs, setInputs] = useState(defaultInputs);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function simulateRisk() {
      setStatus("loading");
      setError("");

      try {
        const response = await fetch("/api/simulate-risk", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(inputs)
        });

        if (!response.ok) {
          throw new Error("Risk simulation failed");
        }

        const data = await response.json();
        if (!cancelled) {
          setResult(data);
          setStatus("success");
        }
      } catch (requestError) {
        if (!cancelled) {
          setStatus("error");
          setError(requestError.message);
        }
      }
    }

    simulateRisk();

    return () => {
      cancelled = true;
    };
  }, [inputs]);

  function updateValue(key, value) {
    setInputs((current) => ({
      ...current,
      [key]: value
    }));
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">Operational Risk Simulator</p>
        <h1>Test how security controls change your exposure profile.</h1>
        <p className="hero-copy">
          Adjust baseline conditions, model mitigation choices, and compare
          before and after risk scores in real time.
        </p>
      </section>

      <section className="dashboard">
        <div className="controls-panel">
          <h2>Scenario Inputs</h2>

          {sliderFields.map((field) => (
            <label key={field.key} className="control-group">
              <div className="control-heading">
                <span>{field.label}</span>
                <strong>{inputs[field.key]}</strong>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={inputs[field.key]}
                onChange={(event) =>
                  updateValue(field.key, Number(event.target.value))
                }
              />
            </label>
          ))}

          <label className="control-group">
            <div className="control-heading">
              <span>Control profile</span>
            </div>
            <select
              value={inputs.controlProfile}
              onChange={(event) =>
                updateValue("controlProfile", event.target.value)
              }
            >
              <option>Baseline</option>
              <option>Elevated</option>
              <option>Hardened</option>
            </select>
          </label>

          <label className="control-group">
            <div className="control-heading">
              <span>Monitoring mode</span>
            </div>
            <select
              value={inputs.monitoringMode}
              onChange={(event) =>
                updateValue("monitoringMode", event.target.value)
              }
            >
              <option>Manual</option>
              <option>Assisted</option>
              <option>Automated</option>
            </select>
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={inputs.insuranceCoverage}
              onChange={(event) =>
                updateValue("insuranceCoverage", event.target.checked)
              }
            />
            <span>Cyber insurance coverage in place</span>
          </label>
        </div>

        <div className="results-panel">
          <div className="results-header">
            <h2>Simulation Results</h2>
            <span className={`status-chip ${status}`}>{status}</span>
          </div>

          <div className="score-grid">
            <ScoreCard
              label="Before mitigation"
              score={result?.beforeScore}
              category={result?.beforeCategory}
              accent="warm"
            />
            <ScoreCard
              label="After mitigation"
              score={result?.afterScore}
              category={result?.afterCategory}
              accent="cool"
            />
          </div>

          <div className="delta-card">
            <span>Risk reduction</span>
            <strong>{result ? `${result.reduction} points` : "--"}</strong>
          </div>

          {error ? <p className="error-text">{error}</p> : null}

          <div className="explanation-card">
            <h3>How it works</h3>
            <p>
              The backend scores inherent risk from threat, exposure, data
              sensitivity, and preparedness. It then reduces the score based on
              selected controls, monitoring maturity, and insurance coverage.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
