import { DEPTH_LAYERS, PARAMETER_CONFIG, getInterpolatedValue, getLayerAtDepth } from "../data/depthDemoData";

const DepthInsights = ({ parameter, depth, compareDepth, setCompareDepth }) => {
  const config = PARAMETER_CONFIG[parameter];
  const current = getInterpolatedValue(parameter, depth);
  const comparison = getInterpolatedValue(parameter, compareDepth);
  const surface = getInterpolatedValue(parameter, 0);
  const delta = current - surface;
  const layer = getLayerAtDepth(depth);

  const direction = delta > 0 ? "increase" : "decrease";

  return (
    <section className="da-insights-grid">
      <article className="da-panel da-insight-panel">
        <div className="da-panel-header compact">
          <div>
            <span className="da-eyebrow">SELECTED DEPTH</span>
            <h2>What is happening here?</h2>
          </div>
        </div>

        <div className="da-insight-hero">
          <div className={`da-insight-number ${config.accentClass}`}>
            {current.toFixed(config.decimals)}
            <small>{config.unit}</small>
          </div>
          <div>
            <strong>{depth.toLocaleString()} m</strong>
            <p>{layer.label} · {layer.note}</p>
          </div>
        </div>

        <div className="da-insight-copy">
          <p>
            Relative to the surface, {config.label.toLowerCase()} shows a{" "}
            <strong>{Math.abs(delta).toFixed(config.decimals)} {config.unit}</strong>{" "}
            {direction} at this depth.
          </p>
        </div>
      </article>

      <article className="da-panel da-compare-panel">
        <div className="da-panel-header compact">
          <div>
            <span className="da-eyebrow">COMPARE</span>
            <h2>Two depths, one profile</h2>
          </div>
        </div>

        <div className="da-compare-controls">
          <label>
            <span>Reference</span>
            <input
              type="range"
              min="0"
              max="1200"
              step="5"
              value={compareDepth}
              onChange={(event) => setCompareDepth(Number(event.target.value))}
            />
            <strong>{compareDepth} m</strong>
          </label>

          <div className="da-compare-vs">VS</div>

          <div className="da-compare-card">
            <span>{compareDepth} m</span>
            <strong>{comparison.toFixed(config.decimals)} {config.unit}</strong>
          </div>

          <div className="da-compare-card is-current">
            <span>{depth} m · current</span>
            <strong>{current.toFixed(config.decimals)} {config.unit}</strong>
          </div>
        </div>

        <div className="da-delta-row">
          <span>Difference</span>
          <strong>{Math.abs(current - comparison).toFixed(config.decimals)} {config.unit}</strong>
        </div>
      </article>

      <article className="da-panel da-layer-guide">
        <div className="da-panel-header compact">
          <div>
            <span className="da-eyebrow">OCEAN STRUCTURE</span>
            <h2>Depth layers</h2>
          </div>
        </div>

        <div className="da-layer-list">
          {DEPTH_LAYERS.map((item) => (
            <div key={item.label} className={`da-layer-row ${item.label === layer.label ? "is-active" : ""}`}>
              <span className="da-layer-range">{item.start}–{item.end}m</span>
              <div>
                <strong>{item.label}</strong>
                <small>{item.note}</small>
              </div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
};

export default DepthInsights;
