import "../../ModulePage.css";

function Regions({ onNavigate }) {
  return (
    <div className="module-page">
      <div className="module-heading">
        <div><p className="eyebrow">SPATIAL WORKSPACES</p><h1>Research Regions</h1><p>Define, save and monitor geographic areas for repeated scientific analysis.</p></div>
        <button className="primary-button">+ New Region</button>
      </div>
      <div className="module-table">
        {[
          ["Arabian Sea", "Temperature", "Active", "2020–2026"],
          ["Bay of Bengal", "Salinity", "Active", "2015–2026"],
          ["Indian Ocean Basin", "Currents", "Active", "2000–2026"],
          ["Equatorial Indian Ocean", "Chlorophyll", "Draft", "2018–2026"],
        ].map(row => <div className="table-row" key={row[0]}>{row.map((cell, i) => <span key={i}>{cell}</span>)}<button onClick={() => onNavigate("analysis")}>Analyze →</button></div>)}
      </div>
    </div>
  );
}

export default Regions;
