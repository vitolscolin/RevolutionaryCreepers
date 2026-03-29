import { useEffect, useMemo, useState } from "react";
import Alerts from "./components/Alerts";
import DataJourney from "./components/DataJourney";
import DecisionLogic from "./components/DecisionLogic";
import PatientSelector from "./components/PatientSelector";
import ProjectionComparison from "./components/ProjectionComparison";
import RiskChart from "./components/RiskChart";
import ScenarioButtons from "./components/ScenarioButtons";
import TwinSummaryCard from "./components/TwinSummaryCard";
import { fetchPatients, fetchTwin, simulatePatient } from "./api";

const defaultScenarios = ["adherent", "non_adherent", "intervention_now"];

const navItems = [
  { id: "tab-overview", label: "Overview" },
  { id: "tab-twin", label: "Digital Twin" },
  { id: "tab-methodology", label: "Methodology" },
  { id: "tab-decisions", label: "Decisions" },
  // { id: "tab-pitch", label: "Pitch" },
];

function getInitialTab(validTabIds) {
  if (typeof window === "undefined") {
    return "tab-twin";
  }

  const hash = window.location.hash.replace("#", "");
  return validTabIds.has(hash) ? hash : "tab-twin";
}

export default function App() {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [twin, setTwin] = useState(null);
  const [simulation, setSimulation] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState("adherent");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const validTabIds = useMemo(
    () => new Set(navItems.map((item) => item.id)),
    [],
  );
  const [activeTab, setActiveTab] = useState(() => getInitialTab(validTabIds));

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
    function syncTabFromLocation() {
      const nextHash = window.location.hash.replace("#", "");
      if (validTabIds.has(nextHash)) {
        setActiveTab(nextHash);
      } else {
        setActiveTab("tab-twin");
      }
    }

    window.addEventListener("popstate", syncTabFromLocation);
    return () => window.removeEventListener("popstate", syncTabFromLocation);
  }, [validTabIds]);

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
          days: 21,
        });
        setSimulation(simulationResponse);
      } catch (requestError) {
        setError(requestError.message);
      }
    }

    loadSimulation();
  }, [selectedPatientId, selectedScenario]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const nextHash = `#${activeTab}`;
    if (window.location.hash !== nextHash) {
      window.history.pushState({ tab: activeTab }, "", nextHash);
    }
  }, [activeTab]);

  function handleTabChange(tabId) {
    setActiveTab(tabId);
    window.history.pushState({ tab: tabId }, "", `#${tabId}`);
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  const statusMessage = loading
    ? "Loading participant twins..."
    : "Synthetic longitudinal stream ready for mirror-twin comparison.";

  return (
    <main className="app-shell">
      <header className="topbar sticky-topbar">
        <div className="brand-block">
          <div className="brand-icon" aria-hidden="true">
            <span />
            <span />
          </div>
          <div>
            <p className="brand-eyebrow">RevolutionUC 2026</p>
            <h1 className="brand-wordmark">TrialTwin AI</h1>
          </div>
        </div>

        <nav className="top-nav" aria-label="Primary">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={activeTab === item.id ? "active" : ""}
              onClick={(event) => {
                event.preventDefault();
                handleTabChange(item.id);
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <PatientSelector
          patients={patients}
          selectedPatientId={selectedPatientId}
          onChange={setSelectedPatientId}
        />
      </header>

      <div className="tab-content-area">
        <section
          id="tab-overview"
          className={`tab-panel ${activeTab === "tab-overview" ? "active" : ""}`}
          hidden={activeTab !== "tab-overview"}
        >
          <section className="hero-shell">
            <div className="hero-copy">
              <p className="eyebrow">Split Screen / Mirror Twin</p>
              <h2>Two futures. One choice.</h2>
              <p className="hero-subtitle">
                TrialTwin AI turns a synthetic participant into two visible
                outcomes: one adherent, one non-adherent.
              </p>
            </div>

            <div className="hero-path" aria-hidden="true">
              <div className="hero-path-origin" />
              <div className="hero-path-line hero-path-line-left" />
              <div className="hero-path-line hero-path-line-right" />
              <div className="hero-path-bloom hero-path-bloom-left" />
              <div className="hero-path-bloom hero-path-bloom-right" />
            </div>
          </section>

          <ScenarioButtons
            selectedScenario={selectedScenario}
            onChange={setSelectedScenario}
          />
          <p className="status-banner">{statusMessage}</p>
          {error ? <p className="error-banner">{error}</p> : null}
        </section>

        <section
          id="tab-twin"
          className={`tab-panel ${activeTab === "tab-twin" ? "active" : ""}`}
          hidden={activeTab !== "tab-twin"}
        >
          <section className="mirror-stage">
            <div className="mirror-shell">
              <div className="mirror-seam" aria-hidden="true">
                <span className="mirror-handle">⋮⋮</span>
              </div>

              <TwinSummaryCard twin={twin} simulation={simulation} />
              <ProjectionComparison simulation={simulation} />
            </div>
          </section>

          <RiskChart twin={twin} />
        </section>

        <section
          id="tab-methodology"
          className={`tab-panel ${activeTab === "tab-methodology" ? "active" : ""}`}
          hidden={activeTab !== "tab-methodology"}
        >
          <DataJourney twin={twin} />
        </section>

        <section
          id="tab-decisions"
          className={`tab-panel ${activeTab === "tab-decisions" ? "active" : ""}`}
          hidden={activeTab !== "tab-decisions"}
        >
          <DecisionLogic twin={twin} />
          <Alerts alerts={twin?.alerts || []} />
        </section>

        {/* <section
          id="tab-pitch"
          className={`tab-panel ${activeTab === "tab-pitch" ? "active" : ""}`}
          hidden={activeTab !== "tab-pitch"}
        >
          <section className="pitch-section">
            <div className="section-heading">
              <p className="eyebrow">Pitch</p>
              <h2>Why it lands in a live pitch</h2>
            </div>

            <div className="pitch-points">
              <div className="pitch-point">
                <span className="pitch-mark">01</span>
                <div>
                  <strong>Fast story arc</strong>
                  <p>
                    One participant becomes two futures instantly, so the demo
                    explains itself while the presenter talks.
                  </p>
                </div>
              </div>
              <div className="pitch-point">
                <span className="pitch-mark">02</span>
                <div>
                  <strong>Transparent enough to trust</strong>
                  <p>
                    The methodology and decision flow are explainable,
                    demo-safe, and easy to defend under judge questioning.
                  </p>
                </div>
              </div>
              <div className="pitch-point">
                <span className="pitch-mark">03</span>
                <div>
                  <strong>Demo-safe scope</strong>
                  <p>
                    Synthetic data only, lightweight twin logic, and a polished
                    interface built for a 24-hour hackathon reveal.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </section> */}
      </div>

      <footer className="site-footer">
        <div>
          <p className="footer-title">Built at RevolutionUC 2026</p>
          <p className="footer-meta">
            Team RevolutionaryCreepers · TrialTwin AI
          </p>
        </div>
        <div className="footer-badge">Two sides. Two futures.</div>
      </footer>
    </main>
  );
}
