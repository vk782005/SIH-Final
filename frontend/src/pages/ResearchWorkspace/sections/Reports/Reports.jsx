import "../../ModulePage.css";

function Reports() {
  return (
    <div className="module-page">
      <div className="module-heading">
        <div><p className="eyebrow">SCIENTIFIC COMMUNICATION</p><h1>Reports</h1><p>Create, review and export research findings from validated analyses.</p></div>
        <button className="primary-button">+ New Report</button>
      </div>
      <div className="module-table">
        {[
          ["Indian Ocean Climate Study", "Draft", "Updated today"],
          ["Arabian Sea Temperature Review", "In review", "Updated yesterday"],
          ["Bay of Bengal Salinity Assessment", "Published", "Updated 4 days ago"],
        ].map(row => <div className="table-row" key={row[0]}>{row.map((cell, i) => <span key={i}>{cell}</span>)}<button>Open →</button></div>)}
      </div>
    </div>
  );
}

export default Reports;
