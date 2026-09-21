import "../../ModulePage.css";

function Investigations() {
  return (
    <div className="module-page">
      <div className="module-heading">
        <div><p className="eyebrow">SCIENTIFIC CASEWORK</p><h1>Investigations</h1><p>Track hypotheses, evidence, analyses and conclusions for ongoing scientific questions.</p></div>
        <button className="primary-button">+ New Investigation</button>
      </div>
      <div className="module-grid">
        {[
          ["Arabian Sea Warming", "78%", "Active"],
          ["Indian Ocean Circulation", "42%", "Active"],
          ["Bay of Bengal Salinity", "24%", "Draft"],
        ].map(([title, progress, status]) => <div className="module-card" key={title}><span className="card-status">{status}</span><h3>{title}</h3><p>Evidence, observations and analysis collected for this research question.</p><div className="progress-track"><div style={{width: progress}} /></div><small>{progress} complete</small></div>)}
      </div>
    </div>
  );
}

export default Investigations;
