const options = [
  {
    value: "adherent",
    label: "Monitoring Center",
    detail: "Focus the narrative on the stable path while keeping both futures visible."
  },
  {
    value: "non_adherent",
    label: "Risk Pressure",
    detail: "Shift the framing toward dropout and deteriorating health if adherence slips."
  },
  {
    value: "intervention_now",
    label: "Recovery Move",
    detail: "Show how an ops intervention bends the trajectory back toward the healthier twin."
  }
];

export default function ScenarioButtons({ selectedScenario, onChange }) {
  return (
    <section className="focus-band" aria-label="Scenario focus">
      {options.map((option) => (
        <button
          key={option.value}
          className={option.value === selectedScenario ? "focus-pill active" : "focus-pill"}
          onClick={() => onChange(option.value)}
        >
          <span>{option.label}</span>
          <small>{option.detail}</small>
        </button>
      ))}
    </section>
  );
}
