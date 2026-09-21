import "../../ModulePage.css";

function Projects() {
  return (
    <div className="module-page">
      <div className="module-heading">
        <div><p className="eyebrow">RESEARCH PROGRAMS</p><h1>Projects</h1><p>Organize investigations, datasets and reports into larger research programs.</p></div>
        <button className="primary-button">+ New Project</button>
      </div>
      <div className="module-grid">
        {["Indian Ocean Climate Study", "ARGO Observation Program", "Monsoon Variability Research"].map((name, i) => <div className="module-card" key={name}><span className="card-status">Active</span><h3>{name}</h3><p>{i + 3} investigations · {12 - i * 2} datasets · {4 + i} reports</p><button>Open Project →</button></div>)}
      </div>
    </div>
  );
}

export default Projects;
