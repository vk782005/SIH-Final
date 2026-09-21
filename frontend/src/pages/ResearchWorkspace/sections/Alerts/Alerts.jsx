import "../../ModulePage.css";

function Alerts() {
  return (
    <div className="module-page">
      <div className="module-heading">
        <div><p className="eyebrow">SYSTEM NOTIFICATIONS</p><h1>Alerts</h1><p>Monitor dataset ingestion, anomaly detection and research workflow events.</p></div>
        <button className="secondary-button">Alert Settings</button>
      </div>
      <div className="task-list">
        {[
          ["Temperature anomaly detected", "Arabian Sea · +2.3°C", "41 min ago"],
          ["Dataset processing complete", "ARGO 2026 · 2.48M observations", "12 min ago"],
          ["Research region created", "Bay of Bengal", "1 hr ago"],
          ["Report updated", "Indian Ocean Climate Study", "3 hrs ago"],
        ].map(([title, meta, time]) => <div className="task-item" key={title}><span className="alert-dot"></span><div><strong>{title}</strong><small>{meta}</small></div><time>{time}</time></div>)}
      </div>
    </div>
  );
}

export default Alerts;
