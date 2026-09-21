import "../../ModulePage.css";

function Tasks() {
  return (
    <div className="module-page">
      <div className="module-heading">
        <div><p className="eyebrow">PERSONAL WORK QUEUE</p><h1>Research Tasks</h1><p>Keep scientific validation, analysis and reporting work organized.</p></div>
        <button className="primary-button">+ New Task</button>
      </div>
      <div className="task-list">
        {[
          ["Validate Arabian Sea anomaly", "High priority", "Today"],
          ["Review new ARGO dataset", "Normal", "Tomorrow"],
          ["Export monthly salinity analysis", "Normal", "Sep 21"],
          ["Update Indian Ocean report", "Low", "Sep 24"],
        ].map(([title, priority, due]) => <div className="task-item" key={title}><button className="task-check">□</button><div><strong>{title}</strong><small>{priority}</small></div><time>{due}</time></div>)}
      </div>
    </div>
  );
}

export default Tasks;
