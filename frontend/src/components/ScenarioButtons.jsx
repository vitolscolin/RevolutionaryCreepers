const options = [
  { value: "adherent", label: "Adherent Future" },
  { value: "non_adherent", label: "Non-Adherent Future" },
  { value: "intervention_now", label: "Intervention Now" }
];

export default function ScenarioButtons({ selectedScenario, onChange }) {
  return (
    <section className="panel">
      <div className="section-head">
        <div>
          <p className="eyebrow">Scenario Lab</p>
          <h2>Choose the focal future</h2>
        </div>
      </div>

      <div className="scenario-buttons">
        {options.map((option) => (
          <button
            key={option.value}
            className={option.value === selectedScenario ? "scenario-button active" : "scenario-button"}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </section>
  );
}
