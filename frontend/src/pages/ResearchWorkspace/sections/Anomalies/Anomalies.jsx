import "../../ModulePage.css";

function Anomalies({ onNavigate }) {
  return (
    <div className="module-page">
      <div className="module-heading">
        <div><p className="eyebrow">DETECTION & REVIEW</p><h1>Anomalies</h1><p>Review unusual observations and determine whether they warrant investigation.</p></div>
        <button className="secondary-button">Configure Detection</button>
      </div>
      <div className="module-table">
        {[
          ["Temperature anomaly", "Arabian Sea", "+2.3°C", "High", "Review"],
          ["Salinity deviation", "Bay of Bengal", "-0.8 PSU", "Medium", "Review"],
          ["Current velocity anomaly", "Equatorial Indian Ocean", "+18%", "Medium", "Assigned"],
        ].map(row => <div className="table-row" key={row[0]}>{row.map((cell, i) => <span key={i}>{cell}</span>)}<button onClick={() => onNavigate("investigations")}>Investigate →</button></div>)}
      </div>
    </div>
  );
}

export default Anomalies;
