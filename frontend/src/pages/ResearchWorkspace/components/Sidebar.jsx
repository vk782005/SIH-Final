import "./Sidebar.css";

const workspaceItems = [
  ["overview", "Overview", "⌂"],
  ["explorer", "Ocean Explorer", "◉"],
  ["regions", "Research Regions", "◇"],
  ["analysis", "Analysis Lab", "⌁"],
  ["depth", "Depth Analysis", "↕"],
  ["data", "Data Center", "▣"],
  ["ai", "AI Research Lab", "✦"],
  ["anomalies", "Anomalies", "△"],
  ["investigations", "Investigations", "◇"],
  ["projects", "Projects", "□"],
  ["reports", "Reports", "▤"],
  ["tasks", "Research Tasks", "✓"],
  ["saved", "Saved Views", "☆"],
];

const systemItems = [
  ["alerts", "Alerts", "!"],
  ["settings", "Settings", "⚙"],
];

function Sidebar({ activePage, onNavigate, onLogout }) {
  return (
    <aside className="research-sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">O</div>
        <div>
          <strong>OCEAN-X</strong>
          <span>RESEARCH PLATFORM</span>
        </div>
      </div>

      <div className="sidebar-scroll">
        <div className="sidebar-group">
          <p className="sidebar-label">WORKSPACE</p>
          {workspaceItems.map(([id, label, icon]) => (
            <button
              key={id}
              className={`sidebar-item ${activePage === id ? "active" : ""}`}
              onClick={() => onNavigate(id)}
            >
              <span className="sidebar-icon">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="sidebar-group">
          <p className="sidebar-label">SYSTEM</p>
          {systemItems.map(([id, label, icon]) => (
            <button
              key={id}
              className={`sidebar-item ${activePage === id ? "active" : ""}`}
              onClick={() => onNavigate(id)}
            >
              <span className="sidebar-icon">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="sidebar-profile">
        <div className="profile-avatar">RS</div>
        <div className="profile-copy">
          <strong>Research Scientist</strong>
          <span>Ocean Research</span>
        </div>
        <button className="logout-button" onClick={onLogout} title="Log out">
          ↪
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
