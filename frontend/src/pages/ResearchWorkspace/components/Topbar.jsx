import "./Topbar.css";

const titles = {
  overview: "Overview",
  explorer: "Ocean Explorer",
  regions: "Research Regions",
  analysis: "Analysis Lab",
  data: "Data Center",
  ai: "AI Research Lab",
  anomalies: "Anomalies",
  investigations: "Investigations",
  projects: "Projects",
  reports: "Reports",
  tasks: "Research Tasks",
  saved: "Saved Views",
  alerts: "Alerts",
  settings: "Settings",
};

function Topbar({ activePage, onNavigate }) {
  return (
    <header className="research-topbar">
      <div className="topbar-location">
        <span>RESEARCH WORKSPACE</span>
        <b>/</b>
        <strong>{titles[activePage]}</strong>
      </div>

      <div className="topbar-actions">
        <button
          className="global-search"
          onClick={() => onNavigate("data")}
        >
          <span>⌕</span>
          <span>Search datasets, regions, analyses...</span>
          <kbd>⌘ K</kbd>
        </button>

        <button className="topbar-icon" onClick={() => onNavigate("alerts")}>
          ◦
        </button>

        <button className="topbar-user" onClick={() => onNavigate("settings")}>
          RS
        </button>

        <div className="topbar-user-copy">
          <strong>Research Scientist</strong>
          <span>Researcher</span>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
