import { DEPTH_LIMIT, DEPTH_LAYERS, PARAMETER_CONFIG, getInterpolatedValue, getLayerAtDepth } from "../data/depthDemoData";

const OceanColumn = ({ parameter, depth }) => {
  const config = PARAMETER_CONFIG[parameter];
  const layer = getLayerAtDepth(depth);

  return (
    <section className="da-panel da-column-panel">
      <div className="da-panel-header">
        <div>
          <span className="da-eyebrow">WATER COLUMN</span>
          <h2>Vertical structure</h2>
        </div>
        <span className="da-status-dot">LIVE PROFILE</span>
      </div>

      <div className="da-column-layout">
        <div className="da-column-visual">
          <div className="da-surface-line">
            <span>SURFACE</span>
            <i />
          </div>

          <div className="da-ocean-column">
            {DEPTH_LAYERS.map((item) => {
              const isActive = item.label === layer.label;
              const height = ((item.end - item.start) / DEPTH_LIMIT) * 100;

              return (
                <div
                  key={item.label}
                  className={`da-column-layer ${isActive ? "is-active" : ""}`}
                  style={{ height: `${height}%` }}
                >
                  <span>{item.label}</span>
                </div>
              );
            })}

            <div
              className="da-column-marker"
              style={{ top: `${(depth / DEPTH_LIMIT) * 100}%` }}
            >
              <span>{depth.toLocaleString()} m</span>
            </div>
          </div>

          <div className="da-depth-end">
            <span>1200 m</span>
            <small>reference profile</small>
          </div>
        </div>

        <div className="da-column-readout">
          <span className="da-eyebrow">SELECTED LAYER</span>
          <h3>{layer.label}</h3>
          <p>{layer.note}</p>

          <div className={`da-column-value ${config.accentClass}`}>
            <span>{config.label}</span>
            <strong>
              {getInterpolatedValue(parameter, depth).toFixed(config.decimals)}
              <small> {config.unit}</small>
            </strong>
          </div>

          <div className="da-column-metrics">
            <div>
              <span>Depth</span>
              <strong>{depth.toLocaleString()} m</strong>
            </div>
            <div>
              <span>Layer</span>
              <strong>{layer.start}–{layer.end}m</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OceanColumn;
