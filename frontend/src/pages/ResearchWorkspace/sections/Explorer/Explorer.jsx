import { useMemo, useState } from "react";
import "../../ModulePage.css";
import "./Explorer.css";

const PARAMETERS = {
  Temperature: {
    unit: "°C",
    values: [24.81, 25.02, 25.36, 25.78, 26.12, 25.94, 25.21, 24.62, 23.98, 23.51, 23.21, 23.44, 24.02, 24.71, 25.48, 26.01, 26.27, 26.12, 25.61, 24.82],
    min: 23.21,
    max: 26.27,
    mean: 24.85,
  },
  Salinity: {
    unit: "PSU",
    values: [35.12, 35.08, 35.14, 35.21, 35.26, 35.22, 35.18, 35.11, 35.04, 34.98, 34.93, 34.96, 35.02, 35.09, 35.15, 35.2, 35.24, 35.22, 35.17, 35.13],
    min: 34.93,
    max: 35.26,
    mean: 35.13,
  },
  Oxygen: {
    unit: "mg/L",
    values: [4.72, 4.81, 4.66, 4.53, 4.41, 4.34, 4.28, 4.36, 4.49, 4.61, 4.73, 4.84, 4.92, 4.88, 4.76, 4.63, 4.51, 4.47, 4.58, 4.69],
    min: 4.28,
    max: 4.92,
    mean: 4.60,
  },
  "Chlorophyll-a": {
    unit: "mg/m³",
    values: [0.31, 0.34, 0.38, 0.43, 0.47, 0.44, 0.39, 0.35, 0.29, 0.25, 0.22, 0.24, 0.28, 0.33, 0.4, 0.46, 0.51, 0.48, 0.42, 0.36],
    min: 0.22,
    max: 0.51,
    mean: 0.36,
  },
  Nitrate: {
    unit: "µmol/L",
    values: [4.1, 4.3, 4.8, 5.1, 5.6, 5.9, 6.2, 6.0, 5.5, 5.1, 4.7, 4.4, 4.2, 4.6, 5.0, 5.4, 5.8, 5.6, 5.1, 4.7],
    min: 4.1,
    max: 6.2,
    mean: 5.09,
  },
  Phosphate: {
    unit: "µmol/L",
    values: [0.21, 0.23, 0.27, 0.29, 0.31, 0.33, 0.35, 0.34, 0.31, 0.28, 0.25, 0.24, 0.22, 0.25, 0.28, 0.3, 0.32, 0.31, 0.28, 0.25],
    min: 0.21,
    max: 0.35,
    mean: 0.28,
  },
};

const OBSERVATIONS = [
  { id: "A1", lat: 18.21, lon: 66.42, depth: 0, value: 24.81, quality: "Good", source: "ARGO", date: "2026-09-26" },
  { id: "A2", lat: 18.43, lon: 66.72, depth: 25, value: 25.02, quality: "Good", source: "ARGO", date: "2026-08-18" },
  { id: "A3", lat: 18.62, lon: 67.02, depth: 50, value: 25.36, quality: "Good", source: "ARGO", date: "2026-07-22" },
  { id: "A4", lat: 18.92, lon: 67.34, depth: 100, value: 25.78, quality: "Provisional", source: "ARGO", date: "2026-06-15" },
  { id: "A5", lat: 19.18, lon: 67.71, depth: 250, value: 26.12, quality: "Good", source: "ARGO", date: "2026-05-11" },
  { id: "A6", lat: 17.81, lon: 68.02, depth: 500, value: 25.94, quality: "Good", source: "CTD", date: "2026-04-03" },
  { id: "A7", lat: 17.32, lon: 68.42, depth: 750, value: 25.21, quality: "Suspect", source: "CTD", date: "2026-03-19" },
  { id: "A8", lat: 16.94, lon: 68.81, depth: 1000, value: 24.62, quality: "Good", source: "ARGO", date: "2026-02-14" },
  { id: "A9", lat: 16.52, lon: 69.18, depth: 100, value: 23.98, quality: "Good", source: "ARGO", date: "2026-01-21" },
  { id: "A10", lat: 16.11, lon: 69.62, depth: 250, value: 23.51, quality: "Good", source: "ARGO", date: "2025-12-18" },
  { id: "A11", lat: 15.82, lon: 70.02, depth: 500, value: 23.21, quality: "Good", source: "ARGO", date: "2025-11-09" },
  { id: "A12", lat: 15.42, lon: 70.42, depth: 750, value: 23.44, quality: "Provisional", source: "CTD", date: "2025-10-17" },
];

function SelectField({ label, value, options, onChange }) {
  return (
    <label className="explorer-field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

function Sparkline({ values, height = 280 }) {
  const width = 1000;
  const pad = 24;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (width - pad * 2);
    const y = height - pad - ((v - min) / range) * (height - pad * 2);
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg className="explorer-sparkline" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      {[0.2, 0.4, 0.6, 0.8].map((p) => (
        <line key={p} x1="0" x2={width} y1={height * p} y2={height * p} className="chart-grid" />
      ))}
      <polyline points={points} className="chart-line" />
      {values.map((v, i) => {
        const x = pad + (i / (values.length - 1)) * (width - pad * 2);
        const y = height - pad - ((v - min) / range) * (height - pad * 2);
        return <circle key={i} cx={x} cy={y} r="4" className="chart-point" />;
      })}
    </svg>
  );
}

function MapView({ observations, selectedId, onSelect, showGrid, showVectors, showUncertainty }) {
  const width = 1000;
  const height = 560;
  const [hovered, setHovered] = useState(null);

  const project = (lat, lon) => ({
    x: 90 + ((lon - 64) / 10) * 800,
    y: 475 - ((lat - 14) / 7) * 390,
  });

  return (
    <div className="map-canvas">
      <svg viewBox={`0 0 ${width} ${height}`} className="map-svg" aria-label="Indian Ocean observation map">
        {showGrid && (
          <g className="map-grid">
            {[64, 66, 68, 70, 72, 74].map((lon) => {
              const p = project(14, lon);
              return <line key={`lon-${lon}`} x1={p.x} x2={p.x} y1="45" y2="500" />;
            })}
            {[15, 17, 19, 21].map((lat) => {
              const p = project(lat, 64);
              return <line key={`lat-${lat}`} x1="55" x2="925" y1={p.y} y2={p.y} />;
            })}
          </g>
        )}

        <path d="M55 102 C170 58 265 120 350 92 C440 62 500 110 585 80 C690 45 790 88 935 58" className="coastline" />
        <path d="M85 462 C190 430 290 472 385 447 C490 420 585 468 685 438 C775 410 850 440 930 420" className="bathymetry" />
        <text x="465" y="278" className="map-label">INDIAN OCEAN</text>

        {showVectors && (
          <g className="current-vectors">
            {[0, 1, 2, 3, 4].map((i) => {
              const x = 180 + i * 145;
              const y = 350 - i * 25;
              return (
                <g key={i}>
                  <line x1={x} y1={y} x2={x + 62} y2={y - 20} />
                  <path d={`M${x + 62} ${y - 20} l-11 2 l4 9`} />
                </g>
              );
            })}
          </g>
        )}

        {observations.map((obs) => {
          const p = project(obs.lat, obs.lon);
          const selected = obs.id === selectedId;
          return (
            <g
              key={obs.id}
              className="map-observation"
              onClick={() => onSelect(obs.id)}
              onMouseEnter={() => setHovered(obs.id)}
              onMouseLeave={() => setHovered(null)}
            >
              {showUncertainty && <circle cx={p.x} cy={p.y} r="22" className="uncertainty-ring" />}
              {selected && <circle cx={p.x} cy={p.y} r="18" className="selection-ring" />}
              <circle cx={p.x} cy={p.y} r={selected ? 9 : 6} className={selected ? "obs-point selected" : "obs-point"} />
              {selected && <text x={p.x + 14} y={p.y - 13} className="obs-id selected-text">{obs.id}</text>}
              {hovered === obs.id && !selected && (
                <g className="map-tooltip" transform={`translate(${Math.min(p.x + 14, 760)}, ${Math.max(p.y - 62, 20)})`}>
                  <rect width="160" height="52" rx="5" />
                  <text x="10" y="18">{obs.id} · {obs.value.toFixed(2)} {PARAMETERS.Temperature.unit}</text>
                  <text x="10" y="36">{obs.lat.toFixed(2)}°N · {obs.lon.toFixed(2)}°E</text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      <div className="map-axis-bottom"><span>64°E</span><span>66°E</span><span>68°E</span><span>70°E</span><span>72°E</span><span>74°E</span></div>
      <div className="map-axis-left"><span>21°N</span><span>19°N</span><span>17°N</span><span>15°N</span></div>

      <div className="map-legend">
        <span><i className="legend-dot" /> Observation</span>
        <span><i className="legend-selected" /> Selected</span>
        {showVectors && <span><i className="legend-arrow">→</i> Current</span>}
        {showUncertainty && <span><i className="legend-ring" /> Uncertainty</span>}
      </div>

      <div className="map-help">Click an observation to inspect its profile</div>
    </div>
  );
}

function DepthProfile({ parameter }) {
  const depths = [0, 25, 50, 100, 250, 500, 750, 1000];
  const values = depths.map((_, i) => parameter.values[Math.min(i * 2, parameter.values.length - 1)] * (1 - i * 0.012));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const x = (v) => 90 + ((v - min) / (max - min || 1)) * 470;

  return (
    <div className="depth-profile">
      <svg viewBox="0 0 620 520" className="depth-svg">
        {[0, 100, 250, 500, 750, 1000].map((d) => {
          const y = 24 + (d / 1000) * 460;
          return (
            <g key={d}>
              <line x1="90" x2="580" y1={y} y2={y} className="chart-grid" />
              <text x="10" y={y + 4} className="depth-label">{d} m</text>
            </g>
          );
        })}
        <polyline points={values.map((v, i) => `${x(v)},${24 + (depths[i] / 1000) * 460}`).join(" ")} className="profile-line" />
        {values.map((v, i) => (
          <circle key={i} cx={x(v)} cy={24 + (depths[i] / 1000) * 460} r="6" className="chart-point" />
        ))}
        <text x="470" y="510" className="axis-caption">{parameter.unit}</text>
      </svg>
      <div className="profile-readout">
        <div className="readout-title">Vertical measurements</div>
        {depths.map((depth, i) => (
          <div className="profile-row" key={depth}>
            <span>{depth} m</span>
            <strong>{values[i].toFixed(2)} {parameter.unit}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatisticsView({ parameter }) {
  const values = parameter.values;
  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted.length % 2 ? sorted[Math.floor(sorted.length / 2)] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
  const variance = values.reduce((sum, v) => sum + (v - parameter.mean) ** 2, 0) / values.length;
  const sd = Math.sqrt(variance);

  return (
    <div className="statistics-view">
      <div className="stat-grid">
        <div><span>Mean</span><strong>{parameter.mean.toFixed(2)} {parameter.unit}</strong></div>
        <div><span>Median</span><strong>{median.toFixed(2)} {parameter.unit}</strong></div>
        <div><span>Minimum</span><strong>{parameter.min.toFixed(2)} {parameter.unit}</strong></div>
        <div><span>Maximum</span><strong>{parameter.max.toFixed(2)} {parameter.unit}</strong></div>
        <div><span>Std. deviation</span><strong>±{sd.toFixed(2)} {parameter.unit}</strong></div>
        <div><span>Range</span><strong>{(parameter.max - parameter.min).toFixed(2)} {parameter.unit}</strong></div>
      </div>

      <div className="distribution-card">
        <div className="section-heading"><div><small>VALUE DISTRIBUTION</small><h3>{parameterName(parameter)} samples</h3></div><span>n = {values.length}</span></div>
        <div className="histogram">
          {values.map((v, i) => <div key={i} className="hist-bar" style={{ height: `${25 + ((v - parameter.min) / (parameter.max - parameter.min || 1)) * 70}%` }}><span>{v.toFixed(1)}</span></div>)}
        </div>
      </div>

      <div className="correlation-card">
        <div className="section-heading"><div><small>DIAGNOSTIC</small><h3>Cross-parameter relationships</h3></div></div>
        <div className="correlation-row"><span>Temperature ↔ Salinity</span><strong>-0.42</strong><em>moderate inverse</em></div>
        <div className="correlation-row"><span>Temperature ↔ Oxygen</span><strong>+0.63</strong><em>moderate positive</em></div>
        <div className="correlation-row"><span>Salinity ↔ Oxygen</span><strong>-0.71</strong><em>strong inverse</em></div>
      </div>
    </div>
  );
}

function QualityControlView({ observations }) {
  const counts = observations.reduce((acc, o) => ({ ...acc, [o.quality]: (acc[o.quality] || 0) + 1 }), {});
  const rules = [
    ["Physical range", "All values inside parameter limits", "PASS"],
    ["Spike detection", "No abrupt temporal excursions", "PASS"],
    ["Temporal consistency", "Sequential profile is coherent", "PASS"],
    ["Spatial consistency", "Neighbouring observations checked", "PASS"],
    ["Duplicate detection", "No duplicate observation IDs", "PASS"],
    ["Missing-value scan", "2 provisional fields require review", "REVIEW"],
  ];

  return (
    <div className="qc-view">
      <div className="qc-summary">
        {["Good", "Provisional", "Suspect"].map((label) => (
          <div className="qc-card" key={label}>
            <span className={`quality-badge ${label.toLowerCase()}`}>{label}</span>
            <strong>{counts[label] || 0}</strong>
            <small>{label === "Good" ? "Passed automated checks" : label === "Provisional" ? "Requires review" : "Flagged for inspection"}</small>
          </div>
        ))}
      </div>
      <div className="qc-rules">
        <div className="section-heading"><div><small>AUTOMATED VALIDATION</small><h3>Quality-control rules</h3></div><span>6 rules enabled</span></div>
        {rules.map(([name, desc, status]) => (
          <div className="qc-rule" key={name}>
            <div className={`qc-status ${status.toLowerCase()}`}>{status === "PASS" ? "✓" : "!"}</div>
            <div><strong>{name}</strong><span>{desc}</span></div>
          </div>
        ))}
      </div>
      <button className="primary-action">Run QC analysis</button>
    </div>
  );
}

function parameterName(parameter) {
  return Object.keys(PARAMETERS).find((key) => PARAMETERS[key] === parameter) || "Parameter";
}

export default function Explorer() {
  const [activeTab, setActiveTab] = useState("Map");
  const [parameterNameState, setParameterNameState] = useState("Temperature");
  const [region, setRegion] = useState("Indian Ocean");
  const [depth, setDepth] = useState("Surface");
  const [quality, setQuality] = useState("All observations");
  const [showGrid, setShowGrid] = useState(true);
  const [showVectors, setShowVectors] = useState(false);
  const [showUncertainty, setShowUncertainty] = useState(false);
  const [selectedId, setSelectedId] = useState("A1");
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [tableOpen, setTableOpen] = useState(false);
  const [search, setSearch] = useState("");

  const parameter = PARAMETERS[parameterNameState];
  const selected = OBSERVATIONS.find((o) => o.id === selectedId) || OBSERVATIONS[0];

  const filteredObservations = useMemo(() => OBSERVATIONS.filter((o) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || `${o.id} ${o.source} ${o.lat} ${o.lon} ${o.date}`.toLowerCase().includes(q);
    const matchesQuality = quality === "All observations" || o.quality === quality;
    return matchesSearch && matchesQuality;
  }), [search, quality]);

  const anomaly = selected.value - parameter.mean;
  const standardDeviation = Math.sqrt(parameter.values.reduce((s, v) => s + (v - parameter.mean) ** 2, 0) / parameter.values.length);
  const tabs = ["Map", "Time Series", "Depth Profile", "Statistics", "Quality Control"];

  const reset = () => {
    setSearch("");
    setQuality("All observations");
    setDepth("Surface");
    setParameterNameState("Temperature");
    setActiveTab("Map");
    setShowGrid(true);
    setShowVectors(false);
    setShowUncertainty(false);
  };

  return (
    <div className="explorer-page">
      <header className="explorer-header">
        <div className="title-block">
          <span className="eyebrow">OCEANOGRAPHIC DATA WORKBENCH</span>
          <h1>Ocean Explorer</h1>
          <p>Explore spatial observations, temporal behaviour and vertical structure.</p>
        </div>
        <div className="header-actions">
          <div className="dataset-status"><span /> ARGO GLOBAL <b>14.8M observations</b></div>
          <button>Data Center</button>
          <button className="accent-button">Open Analysis</button>
        </div>
      </header>

      <section className="explorer-toolbar">
        <div className="search-box">
          <span>⌕</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search observation, source or coordinate" />
        </div>
        <SelectField label="Region" value={region} options={["Indian Ocean", "Arabian Sea", "Bay of Bengal", "Equatorial Indian Ocean"]} onChange={setRegion} />
        <SelectField label="Parameter" value={parameterNameState} options={Object.keys(PARAMETERS)} onChange={setParameterNameState} />
        <SelectField label="Depth" value={depth} options={["Surface", "0–100 m", "100–250 m", "250–500 m", "500–1000 m"]} onChange={setDepth} />
        <button className="reset-button" onClick={reset}>Reset</button>
      </section>

      <section className="analysis-strip">
        <div className="strip-title"><span>ACTIVE DATA</span><strong>{region}</strong><em>{parameterNameState} · {depth}</em></div>
        <div className="strip-stat"><span>OBSERVATIONS</span><strong>{filteredObservations.length}</strong></div>
        <div className="strip-stat"><span>MEAN</span><strong>{parameter.mean.toFixed(2)} {parameter.unit}</strong></div>
        <div className="strip-stat"><span>RANGE</span><strong>{parameter.min.toFixed(2)}–{parameter.max.toFixed(2)}</strong></div>
        <div className="strip-stat"><span>SELECTED</span><strong>{selected.id}</strong></div>
      </section>

      <div className="explorer-workspace">
        <aside className="explorer-sidebar">
          <section>
            <div className="side-title">VARIABLE</div>
            <div className="variable-list">
              {Object.entries(PARAMETERS).map(([name, data]) => (
                <button key={name} className={name === parameterNameState ? "active" : ""} onClick={() => setParameterNameState(name)}>
                  <span className="variable-dot" />
                  <span>{name}</span>
                  <small>{data.unit}</small>
                </button>
              ))}
            </div>
          </section>

          <section className="sidebar-section">
            <div className="side-title">QUALITY</div>
            <select value={quality} onChange={(e) => setQuality(e.target.value)}>
              <option>All observations</option><option>Good</option><option>Provisional</option><option>Suspect</option>
            </select>
          </section>

          <section className="sidebar-section">
            <div className="side-title">MAP LAYERS</div>
            {[
              ["Coordinate grid", showGrid, setShowGrid],
              ["Current vectors", showVectors, setShowVectors],
              ["Uncertainty", showUncertainty, setShowUncertainty],
            ].map(([label, value, setter]) => (
              <button className="toggle-row" key={label} onClick={() => setter(!value)}>
                <span>{label}</span><i className={value ? "toggle on" : "toggle"}><b /></i>
              </button>
            ))}
          </section>

          <section className="dataset-card">
            <div className="side-title">DATASET</div>
            <strong>ARGO Global</strong>
            <p>2022–2026</p>
            <p>1° × 1° gridded product</p>
            <p>12 depth levels</p>
            <button>View dataset metadata →</button>
          </section>
        </aside>

        <main className="analysis-area">
          <nav className="analysis-tabs" aria-label="Analysis modes">
            {tabs.map((tab) => (
              <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)}>{tab}</button>
            ))}
          </nav>

          <div className="analysis-canvas">
            {activeTab === "Map" && (
              <div className="map-mode">
                <div className="mode-heading">
                  <div><span>SPATIAL DISTRIBUTION</span><h2>{parameterNameState} observations</h2><p>Click a point to inspect its measurement. Use the layer controls to change the map.</p></div>
                  <div className="mode-tools"><button onClick={() => setShowGrid(!showGrid)} className={showGrid ? "tool-active" : ""}>Grid</button><button onClick={() => setShowVectors(!showVectors)} className={showVectors ? "tool-active" : ""}>Currents</button><button onClick={() => setShowUncertainty(!showUncertainty)} className={showUncertainty ? "tool-active" : ""}>Uncertainty</button></div>
                </div>
                <MapView observations={filteredObservations} selectedId={selectedId} onSelect={setSelectedId} showGrid={showGrid} showVectors={showVectors} showUncertainty={showUncertainty} />
              </div>
            )}

            {activeTab === "Time Series" && (
              <div className="panel-view">
                <div className="mode-heading"><div><span>TEMPORAL EVOLUTION</span><h2>{parameterNameState} · {region}</h2><p>Monthly observations across the selected analysis period.</p></div><div className="period-control">Sep 2022 — Sep 2026</div></div>
                <div className="chart-frame">
                  <div className="chart-y-labels"><span>{parameter.max.toFixed(1)}</span><span>{((parameter.max + parameter.min) / 2).toFixed(1)}</span><span>{parameter.min.toFixed(1)}</span></div>
                  <Sparkline values={parameter.values} height={330} />
                </div>
                <div className="chart-x-labels"><span>Oct 2024</span><span>Apr 2025</span><span>Oct 2025</span><span>Apr 2026</span><span>Sep 2026</span></div>
                <div className="metric-cards">
                  <div><span>MEAN</span><strong>{parameter.mean.toFixed(2)} {parameter.unit}</strong></div>
                  <div><span>MINIMUM</span><strong>{parameter.min.toFixed(2)} {parameter.unit}</strong></div>
                  <div><span>MAXIMUM</span><strong>{parameter.max.toFixed(2)} {parameter.unit}</strong></div>
                  <div><span>STD. DEV.</span><strong>±{standardDeviation.toFixed(2)} {parameter.unit}</strong></div>
                </div>
              </div>
            )}

            {activeTab === "Depth Profile" && (
              <div className="panel-view"><div className="mode-heading"><div><span>VERTICAL STRUCTURE</span><h2>{parameterNameState} depth profile</h2><p>Change in {parameterNameState.toLowerCase()} through the water column.</p></div><div className="period-control">Surface — 1000 m</div></div><DepthProfile parameter={parameter} /></div>
            )}

            {activeTab === "Statistics" && (
              <div className="panel-view"><div className="mode-heading"><div><span>STATISTICAL SUMMARY</span><h2>{parameterNameState} distribution</h2><p>Summary statistics for the current filtered observations.</p></div><div className="period-control">n = {parameter.values.length}</div></div><StatisticsView parameter={parameter} /></div>
            )}

            {activeTab === "Quality Control" && (
              <div className="panel-view"><div className="mode-heading"><div><span>OBSERVATION VALIDATION</span><h2>Quality control</h2><p>Review automated checks before using observations in an investigation.</p></div><div className="qc-status-summary">5 / 6 checks passed</div></div><QualityControlView observations={OBSERVATIONS} /></div>
            )}
          </div>

          <button className="observation-drawer-button" onClick={() => setTableOpen(!tableOpen)}>
            <span>Observation records</span><strong>{filteredObservations.length} matching records</strong><b>{tableOpen ? "Hide" : "Show"}</b>
          </button>

          {tableOpen && (
            <div className="observation-table">
              <div className="table-head"><span>ID</span><span>LATITUDE</span><span>LONGITUDE</span><span>DEPTH</span><span>VALUE</span><span>QUALITY</span><span>SOURCE</span><span>DATE</span></div>
              {filteredObservations.map((o) => (
                <button className={o.id === selectedId ? "table-row selected" : "table-row"} key={o.id} onClick={() => { setSelectedId(o.id); setInspectorOpen(true); }}>
                  <span>{o.id}</span><span>{o.lat.toFixed(2)}°</span><span>{o.lon.toFixed(2)}°</span><span>{o.depth} m</span><span>{o.value.toFixed(2)} {parameter.unit}</span><span><em className={`quality-badge ${o.quality.toLowerCase()}`}>{o.quality}</em></span><span>{o.source}</span><span>{o.date}</span>
                </button>
              ))}
            </div>
          )}
        </main>

        {inspectorOpen && (
          <aside className="inspector">
            <div className="inspector-header"><div><span>SELECTED OBSERVATION</span><h3>{selected.id}</h3></div><button onClick={() => setInspectorOpen(false)}>×</button></div>
            <div className="inspector-value"><span>{parameterNameState}</span><strong>{selected.value.toFixed(2)} <small>{parameter.unit}</small></strong><em className={`quality-badge ${selected.quality.toLowerCase()}`}>{selected.quality}</em></div>
            <div className="coordinate-grid">
              <div><span>LATITUDE</span><strong>{selected.lat.toFixed(2)}° N</strong></div>
              <div><span>LONGITUDE</span><strong>{selected.lon.toFixed(2)}° E</strong></div>
              <div><span>DEPTH</span><strong>{selected.depth} m</strong></div>
              <div><span>SOURCE</span><strong>{selected.source}</strong></div>
            </div>
            <div className="inspector-details">
              <div><span>TIMESTAMP</span><strong>{selected.date}</strong></div>
              <div><span>REGION</span><strong>{region}</strong></div>
              <div><span>ANOMALY</span><strong className={anomaly >= 0 ? "warm" : "cool"}>{anomaly >= 0 ? "+" : ""}{anomaly.toFixed(2)} {parameter.unit}</strong></div>
            </div>
            <div className="inspector-section"><span>CONTEXT</span><p>This observation is {Math.abs(anomaly).toFixed(2)} {parameter.unit} {anomaly >= 0 ? "above" : "below"} the current mean.</p></div>
            <div className="inspector-actions"><button onClick={() => setActiveTab("Time Series")}>View time series</button><button onClick={() => setActiveTab("Depth Profile")}>View depth profile</button><button className="wide" onClick={() => setTableOpen(true)}>Open observation table</button></div>
          </aside>
        )}
      </div>

      {!inspectorOpen && <button className="inspector-reopen" onClick={() => setInspectorOpen(true)}>Open observation</button>}
    </div>
  );
}
