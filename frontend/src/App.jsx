import { useEffect, useState } from "react";
import Alerts from "./components/Alerts";
import PatientSelector from "./components/PatientSelector";
import ProjectionComparison from "./components/ProjectionComparison";
import RiskChart from "./components/RiskChart";
import ScenarioButtons from "./components/ScenarioButtons";
import TwinSummaryCard from "./components/TwinSummaryCard";
import { fetchPatients, fetchTwin, simulatePatient } from "./api";

const defaultScenarios = ["adherent", "non_adherent", "intervention_now"];

export default function App() {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [twin, setTwin] = useState(null);
  const [simulation, setSimulation] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState("adherent");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPatients() {
      try {
        const patientList = await fetchPatients();
        setPatients(patientList);
        if (patientList.length > 0) {
          setSelectedPatientId(patientList[0].patient_id);
        }
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    }

    loadPatients();
  }, []);

  useEffect(() => {
    if (!selectedPatientId) {
      return;
    }

    async function loadTwin() {
      try {
        const twinResponse = await fetchTwin(selectedPatientId);
        setTwin(twinResponse);
      } catch (requestError) {
        setError(requestError.message);
      }
    }

    loadTwin();
  }, [selectedPatientId]);

  useEffect(() => {
    if (!selectedPatientId) {
      return;
    }

    async function loadSimulation() {
      try {
        const simulationResponse = await simulatePatient({
          patient_id: selectedPatientId,
          selected_scenario: selectedScenario,
          scenarios: defaultScenarios,
          days: 21
        });
        setSimulation(simulationResponse);
      } catch (requestError) {
        setError(requestError.message);
      }
    }

    loadSimulation();
  }, [selectedPatientId, selectedScenario]);

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">TrialTwin AI</p>
          <h1>Clinical trial monitoring with two futures on one screen.</h1>
          <p className="hero-copy">
            Track safety, dropout, and adherence risk for each participant twin, then show how
            behavior changes future trial outcomes.
          </p>
        </div>
        <div className="hero-callout">
          <span>Built for trial ops teams</span>
          <strong>Lightweight digital twin, not a biological twin</strong>
        </div>
      </header>

      {loading ? <p>Loading participants...</p> : null}
      {error ? <p className="error-banner">{error}</p> : null}

      <div className="layout-grid">
        <div className="main-column">
          <PatientSelector
            patients={patients}
            selectedPatientId={selectedPatientId}
            onChange={setSelectedPatientId}
          />
          <TwinSummaryCard twin={twin} />
          <ProjectionComparison simulation={simulation} />
          <RiskChart twin={twin} />
        </div>

        <aside className="side-column">
          <ScenarioButtons selectedScenario={selectedScenario} onChange={setSelectedScenario} />
          <Alerts alerts={twin?.alerts || []} />
          <section className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Demo Note</p>
                <h2>Why it works in a hackathon demo</h2>
              </div>
            </div>
            <p className="muted">
              TrialTwin AI uses synthetic participant streams, interpretable risk models, and
              transparent scenario logic to show how adherence changes likely trial outcomes.
            </p>
            <p className="muted small-print">
              Educational simulation only. Not medical advice.
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}
