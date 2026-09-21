import "../../ModulePage.css";

function SavedViews({ onNavigate }) {
  return (
    <div className="module-page">
      <div className="module-heading">
        <div><p className="eyebrow">PERSONAL WORKSPACES</p><h1>Saved Views</h1><p>Return quickly to frequently used scientific configurations.</p></div>
        <button className="primary-button" onClick={() => onNavigate("explorer")}>Open Explorer</button>
      </div>
      <div className="module-grid">
        {["Arabian Sea Temperature · Surface", "Bay of Bengal Salinity · 0–100m", "Indian Ocean Currents · 2020–2026"].map(name => <div className="module-card" key={name}><h3>{name}</h3><p>Saved globe, filters and analysis configuration.</p><button onClick={() => onNavigate("explorer")}>Open View →</button></div>)}
      </div>
    </div>
  );
}

export default SavedViews;
