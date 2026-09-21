import "./Overview.css";

const investigations = [
  ["Arabian Sea Warming", "Temperature · 2010–2026", 78, "Active"],
  ["Indian Ocean Circulation", "Currents · 2020–2026", 42, "Active"],
  ["Bay of Bengal Salinity", "Salinity · 2015–2026", 24, "Draft"],
];

const activity = [
  ["ARGO 2026 dataset processed", "2.48M observations indexed", "12 min ago"],
  ["Temperature anomaly detected", "Arabian Sea · +2.3°C", "41 min ago"],
  ["New research region created", "Bay of Bengal", "1 hr ago"],
  ["Research report updated", "Indian Ocean Climate Study", "3 hrs ago"],
];

function Overview({ onOpenGlobe, onAddData, onNavigate }) {
  return (
    <div className="overview-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">SCIENTIFIC COMMAND CENTER</p>
          <h1>Research Overview</h1>
          <p>Monitor datasets, investigations, analyses and scientific findings from one workspace.</p>
        </div>

        <div className="heading-actions">
          <button className="secondary-button" onClick={() => onNavigate("analysis")}>
            Open Analysis Lab
          </button>
          <button className="primary-button" onClick={onAddData}>
            + Add Data
          </button>
        </div>
      </div>

      <div className="system-banner">
        <span className="status-indicator"></span>
        <strong>RESEARCH SYSTEM OPERATIONAL</strong>
        <span>Last synchronized 2 minutes ago</span>
      </div>

      <div className="stats-grid">
        {[
          ["DATASETS", "248", "+12 this month"],
          ["OBSERVATIONS", "14.8M", "+2.4M indexed"],
          ["RESEARCH REGIONS", "12", "8 active · 4 archived"],
          ["OPEN ANOMALIES", "3", "Needs review"],
        ].map(([label, value, meta]) => (
          <div className="stat-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{meta}</small>
          </div>
        ))}
      </div>

      <div className="overview-grid">
        <section className="panel investigations-panel">
          <PanelHeader eyebrow="WORK IN PROGRESS" title="Active Investigations" action="View all →" onClick={() => onNavigate("investigations")} />

          <div className="investigation-list">
            {investigations.map(([name, meta, progress, status]) => (
              <div className="investigation-row" key={name}>
                <div className="investigation-name">
                  <span className="row-dot"></span>
                  <div>
                    <strong>{name}</strong>
                    <small>{meta}</small>
                  </div>
                </div>
                <div className="progress-area">
                  <div className="progress-track"><div style={{ width: `${progress}%` }} /></div>
                  <span>{progress}%</span>
                </div>
                <small>{status}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <PanelHeader eyebrow="SYSTEM ACTIVITY" title="Recent Activity" action="Activity log →" onClick={() => onNavigate("alerts")} />
          <div className="activity-list">
            {activity.map(([title, meta, time]) => (
              <div className="activity-row" key={title}>
                <div className="activity-icon">□</div>
                <div>
                  <strong>{title}</strong>
                  <small>{meta}</small>
                </div>
                <time>{time}</time>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="overview-grid lower">
        <section className="panel">
          <PanelHeader eyebrow="REQUIRES ATTENTION" title="Open Anomalies" action="View anomalies →" onClick={() => onNavigate("anomalies")} />
          <div className="empty-research-state">
            <span>3</span>
            <div>
              <strong>Scientific anomalies require review</strong>
              <p>Review detected temperature, salinity and circulation deviations.</p>
            </div>
          </div>
        </section>

        <section className="panel">
          <PanelHeader eyebrow="YOUR WORK" title="Research Tasks" action="Open tasks →" onClick={() => onNavigate("tasks")} />
          <div className="task-preview">
            <div><span className="task-check">□</span><strong>Validate Arabian Sea anomaly</strong></div>
            <div><span className="task-check">□</span><strong>Review new ARGO dataset</strong></div>
            <div><span className="task-check">□</span><strong>Export monthly salinity analysis</strong></div>
          </div>
        </section>
      </div>

      <button className="explorer-shortcut" onClick={onOpenGlobe}>
        Open Ocean Explorer →
      </button>
    </div>
  );
}

function PanelHeader({ eyebrow, title, action, onClick }) {
  return (
    <div className="panel-header">
      <div>
        <p>{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      <button onClick={onClick}>{action}</button>
    </div>
  );
}

export default Overview;
