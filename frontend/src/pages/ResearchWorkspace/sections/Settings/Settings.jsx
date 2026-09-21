import "../../ModulePage.css";

function Settings() {
  return (
    <div className="module-page">
      <div className="module-heading">
        <div><p className="eyebrow">PLATFORM CONFIGURATION</p><h1>Settings</h1><p>Configure workspace preferences and research environment defaults.</p></div>
      </div>
      <div className="module-grid">
        {[
          ["Workspace", "Default landing page, layout and display preferences."],
          ["Data", "Default datasets, units, depth and time preferences."],
          ["Analysis", "Chart, statistics and export defaults."],
          ["Notifications", "Configure anomaly and dataset alerts."],
        ].map(([title, text]) => <div className="module-card" key={title}><h3>{title}</h3><p>{text}</p><button>Configure →</button></div>)}
      </div>
    </div>
  );
}

export default Settings;
