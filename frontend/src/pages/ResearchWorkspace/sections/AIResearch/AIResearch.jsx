import "../../ModulePage.css";

function AIResearch({ onNavigate }) {
  return (
    <div className="module-page">
      <div className="module-heading">
        <div><p className="eyebrow">ASSISTED SCIENTIFIC REASONING</p><h1>AI Research Lab</h1><p>Use AI to summarize observations, surface patterns and assist with scientific workflows.</p></div>
        <button className="primary-button">+ New AI Analysis</button>
      </div>
      <div className="module-grid three">
        <div className="module-card"><h3>Region Summary</h3><p>Generate a concise scientific summary for a selected region and time range.</p><button>Start →</button></div>
        <div className="module-card"><h3>Anomaly Explanation</h3><p>Explore possible drivers and supporting evidence for detected anomalies.</p><button onClick={() => onNavigate("anomalies")}>Start →</button></div>
        <div className="module-card"><h3>Report Assistant</h3><p>Turn validated analyses into structured research reports.</p><button onClick={() => onNavigate("reports")}>Start →</button></div>
      </div>
    </div>
  );
}

export default AIResearch;
