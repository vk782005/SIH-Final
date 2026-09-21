import "../../ModulePage.css";

const analysisModules = [
  {
    key: "01",
    eyebrow: "TIME SERIES",
    title: "Time Series",
    description: "Track how a selected parameter changes through a defined time window.",
    meta: "Temporal response",
  },
  {
    key: "02",
    eyebrow: "RELATIONSHIPS",
    title: "Correlation",
    description: "Compare variables side-by-side to expose relationships and co-variation.",
    meta: "Multi-parameter",
  },
  {
    key: "03",
    eyebrow: "VERTICAL STRUCTURE",
    title: "Depth Profile",
    description: "Inspect the water column and move from the surface to 1,200 m interactively.",
    meta: "Interactive depth",
    action: "depth",
    featured: true,
  },
  {
    key: "04",
    eyebrow: "REGIONAL METRICS",
    title: "Spatial Statistics",
    description: "Summarize selected regions with compact spatial statistics and coverage context.",
    meta: "Regional analysis",
  },
  {
    key: "05",
    eyebrow: "DEVIATION",
    title: "Anomaly Analysis",
    description: "Compare observations against a reference baseline to surface meaningful deviations.",
    meta: "Baseline comparison",
    action: "anomalies",
  },
  {
    key: "06",
    eyebrow: "OUTPUT",
    title: "Export Analysis",
    description: "Prepare figures, analysis outputs and supporting data for reporting workflows.",
    meta: "Report-ready",
    action: "reports",
  },
];

function Analysis({ onNavigate, onOpenGlobe }) {
  return (
    <div className="module-page analysis-page">
      <header className="module-hero">
        <div className="module-hero-copy">
          <p className="eyebrow">SCIENTIFIC WORKBENCH / ANALYSIS</p>
          <h1>Analysis Lab</h1>
          <p>
            Build focused investigations from regions, parameters, datasets and time ranges without leaving the research workspace.
          </p>
        </div>

        <div className="analysis-heading-actions">
          <button className="primary-button analysis-new-button" type="button">
            <span aria-hidden="true">+</span>
            New Analysis
          </button>
          <button
            className="explore-globe-button"
            type="button"
            onClick={onOpenGlobe}
            aria-label="Return to Ocean Explorer globe"
          >
            <span className="explore-globe-icon" aria-hidden="true">◎</span>
            EXPLORE GLOBE
          </button>
        </div>
      </header>

      <section className="analysis-overview-strip" aria-label="Analysis workspace summary">
        <div>
          <span className="analysis-strip-label">WORKSPACE</span>
          <strong>6 analysis modules</strong>
        </div>
        <div>
          <span className="analysis-strip-label">ACTIVE CONTEXT</span>
          <strong>Parameter + region + time</strong>
        </div>
        <div>
          <span className="analysis-strip-label">QUICK PATH</span>
          <strong>Explore → Analyze → Export</strong>
        </div>
      </section>

      <div className="analysis-section-heading">
        <div>
          <p className="eyebrow">ANALYSIS MODULES</p>
          <h2>Choose a scientific view</h2>
        </div>
        <span>All modules stay within the same research context.</span>
      </div>

      <section className="analysis-module-grid" aria-label="Analysis modules">
        {analysisModules.map((module) => (
          <article className={`analysis-module-card ${module.featured ? "featured" : ""}`} key={module.key}>
            <div className="analysis-card-topline">
              <span className="analysis-card-index">{module.key}</span>
              <span className="analysis-card-eyebrow">{module.eyebrow}</span>
              {module.featured && <span className="analysis-card-badge">INTERACTIVE</span>}
            </div>

            <div className="analysis-card-body">
              <h3>{module.title}</h3>
              <p>{module.description}</p>
            </div>

            <div className="analysis-card-footer">
              <span>{module.meta}</span>
              {module.action ? (
                <button type="button" onClick={() => onNavigate?.(module.action)}>
                  Open <span aria-hidden="true">↗</span>
                </button>
              ) : (
                <span className="analysis-coming-soon">Coming next</span>
              )}
            </div>
          </article>
        ))}
      </section>

      <section className="analysis-workflow-panel">
        <div>
          <p className="eyebrow">RECOMMENDED WORKFLOW</p>
          <h2>Keep the investigation focused</h2>
          <p>
            Select the study area in Ocean Explorer, choose the variable you need, inspect the resulting profile, then export the context you want to report.
          </p>
        </div>

        <div className="analysis-workflow-steps">
          {[
            ["01", "Select", "Region or point"],
            ["02", "Inspect", "Parameter + depth"],
            ["03", "Compare", "Patterns + change"],
            ["04", "Export", "Figures + outputs"],
          ].map(([number, title, detail], index, items) => (
            <div className="analysis-workflow-step" key={number}>
              <span>{number}</span>
              <strong>{title}</strong>
              <small>{detail}</small>
              {index < items.length - 1 && <i aria-hidden="true">→</i>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Analysis;
