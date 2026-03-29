import CountUpValue from "./CountUpValue";

function createPath(points) {
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
}

function buildMirroredPoints(values, centerX, width, height, invertDirection) {
  const topPadding = 24;
  const bottomPadding = 44;
  const span = height - topPadding - bottomPadding;
  const step = (width / 2 - 48) / Math.max(values.length - 1, 1);

  return values.map((value, index) => {
    const x = invertDirection ? centerX - index * step : centerX + index * step;
    const y = topPadding + ((100 - value) / 100) * span;
    return { x, y, value, index };
  });
}

export default function ProjectionComparison({ simulation }) {
  if (!simulation?.scenario_trajectories?.adherent || !simulation?.scenario_trajectories?.non_adherent) {
    return null;
  }

  const width = 1040;
  const height = 360;
  const centerX = width / 2;
  const baseline = simulation.baseline_summary.health_score;
  const adherentValues = [baseline, ...simulation.scenario_trajectories.adherent.map((point) => point.projected_health_score)];
  const nonAdherentValues = [baseline, ...simulation.scenario_trajectories.non_adherent.map((point) => point.projected_health_score)];

  const leftPoints = buildMirroredPoints(adherentValues, centerX, width, height, true);
  const rightPoints = buildMirroredPoints(nonAdherentValues, centerX, width, height, false);

  const leftArea = `${createPath(leftPoints)} L ${centerX} ${height - 20} L ${leftPoints[leftPoints.length - 1].x} ${height - 20} Z`;
  const rightArea = `${createPath(rightPoints)} L ${rightPoints[rightPoints.length - 1].x} ${height - 20} L ${centerX} ${height - 20} Z`;
  const adherentSummary = simulation.comparison_summary.adherent;
  const nonAdherentSummary = simulation.comparison_summary.non_adherent;
  const milestoneA = leftPoints[Math.min(7, leftPoints.length - 1)];
  const milestoneB = rightPoints[Math.min(14, rightPoints.length - 1)];

  return (
    <section className="mirror-chart-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Diverging Outcomes</p>
          <h2>See where the path leads</h2>
          <p className="section-copy">{simulation.narrative_explanation}</p>
        </div>
      </div>

      <div className="mirror-chart">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Adherent and non-adherent futures diverge from a shared baseline">
          <defs>
            <linearGradient id="adherentFill" x1="0%" x2="0%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#A3D9C0" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#A3D9C0" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="nonAdherentFill" x1="0%" x2="0%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#E8A598" stopOpacity="0.82" />
              <stop offset="100%" stopColor="#E8A598" stopOpacity="0.04" />
            </linearGradient>
            <linearGradient id="splitWash" x1="0%" x2="100%" y1="0%" y2="0%">
              <stop offset="0%" stopColor="#F0F7F4" />
              <stop offset="50%" stopColor="#FAFAFA" />
              <stop offset="100%" stopColor="#F5F0F0" />
            </linearGradient>
          </defs>

          <rect x="0" y="0" width={width} height={height} rx="28" fill="url(#splitWash)" />

          {[20, 40, 60, 80].map((tick) => {
            const y = 24 + ((100 - tick) / 100) * (height - 68);
            return <line key={tick} x1="28" x2={width - 28} y1={y} y2={y} className="chart-gridline" />;
          })}

          <line x1={centerX} x2={centerX} y1="18" y2={height - 18} className="chart-seam" />
          <path d={leftArea} className="chart-area adherent" />
          <path d={rightArea} className="chart-area nonadherent" />
          <path d={createPath(leftPoints)} className="chart-path adherent" pathLength="100" />
          <path d={createPath(rightPoints)} className="chart-path nonadherent" pathLength="100" />

          <circle cx={centerX} cy={leftPoints[0].y} r="7" className="chart-origin" />
          <circle cx={milestoneA.x} cy={milestoneA.y} r="6" className="chart-milestone adherent" />
          <circle cx={milestoneB.x} cy={milestoneB.y} r="6" className="chart-milestone nonadherent" />

          <text x={milestoneA.x - 16} y={milestoneA.y - 14} className="chart-label adherent">
            Day 7: stability holds
          </text>
          <text x={milestoneB.x - 128} y={milestoneB.y - 14} className="chart-label nonadherent">
            Day 14: risk gap widens
          </text>

          <text x={centerX - 38} y="24" className="chart-axis-top">
            Shared baseline
          </text>
          <text x="32" y={height - 18} className="chart-axis-bottom">
            Day 21
          </text>
          <text x={width - 82} y={height - 18} className="chart-axis-bottom">
            Day 21
          </text>
        </svg>
      </div>

      <div className="scoreboard">
        <div className="scoreboard-card adherent">
          <span>Adherent projected health score</span>
          <strong>
            <CountUpValue value={adherentSummary.final_health_score} decimals={1} />
          </strong>
        </div>
        <div className="scoreboard-card nonadherent">
          <span>Non-adherent projected health score</span>
          <strong>
            <CountUpValue value={nonAdherentSummary.final_health_score} decimals={1} />
          </strong>
        </div>
      </div>
    </section>
  );
}
