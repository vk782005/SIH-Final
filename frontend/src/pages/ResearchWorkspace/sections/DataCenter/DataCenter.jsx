import "../../ModulePage.css";

function DataCenter({ onAddData }) {
  return (
    <div className="module-page">
      <div className="module-heading">
        <div><p className="eyebrow">DATA MANAGEMENT</p><h1>Data Center</h1><p>Manage scientific datasets, ingestion jobs, metadata and observation indexes.</p></div>
        <button className="primary-button" onClick={onAddData}>+ Add Dataset</button>
      </div>
      <div className="stats-grid">
        <div className="stat-card"><span>DATASETS</span><strong>248</strong><small>12 added this month</small></div>
        <div className="stat-card"><span>OBSERVATIONS</span><strong>14.8M</strong><small>Indexed observations</small></div>
        <div className="stat-card"><span>INGESTION JOBS</span><strong>6</strong><small>2 currently running</small></div>
        <div className="stat-card"><span>STORAGE</span><strong>1.8 TB</strong><small>Across active datasets</small></div>
      </div>
      <div className="module-table">
        {[
          ["ARGO 2026", "14.2M", "Processed", "Today"],
          ["Indian Ocean Temperature", "2.4M", "Indexed", "Yesterday"],
          ["Bay of Bengal Salinity", "820K", "Indexed", "2 days ago"],
          ["Surface Currents 2025", "1.1M", "Processing", "Running"],
        ].map(row => <div className="table-row" key={row[0]}>{row.map((cell, i) => <span key={i}>{cell}</span>)}<button>Inspect →</button></div>)}
      </div>
    </div>
  );
}

export default DataCenter;
