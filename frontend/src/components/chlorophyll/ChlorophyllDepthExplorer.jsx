import { useMemo } from "react";

const ChlorophyllDepthExplorer = ({ depth, onDepthChange }) => {
  const model = useMemo(() => {
    const light = Math.max(0, 100 * Math.exp(-depth / 65));
    const lightFactor = light / 100;

    let layer = "Surface";
    let explanation = "Strong light is available, but nutrient availability can still control productivity.";

    if (depth > 30 && depth <= 120) {
      layer = "Euphotic zone";
      explanation = "Light is decreasing with depth. Phytoplankton can still photosynthesize, while nutrient conditions become increasingly important.";
    } else if (depth > 120) {
      layer = "Below the main light zone";
      explanation = "Light is strongly reduced. Photosynthesis becomes increasingly light-limited.";
    }

    const conceptualChl = Math.max(5, Math.round(90 * lightFactor * (0.65 + 0.35 * Math.exp(-Math.pow((depth - 55) / 65, 2)))));

    return { light, layer, explanation, conceptualChl };
  }, [depth]);

  return (
    <div className="chl-panel">
      <p className="chl-kicker">Section 03 · Interactive</p>
      <h2 className="chl-title">Dive through the chlorophyll layer</h2>
      <p className="chl-subtitle">
        Move downward and watch a conceptual light-and-chlorophyll profile
        change. Real profiles vary by location, season and water conditions.
      </p>

      <div className="chl-grid chl-grid-2" style={{ marginTop: 26 }}>
        <div className="chl-depth-tank">
          <div
            className="chl-depth-marker"
            style={{ top: `${Math.min(92, Math.max(5, depth / 8))}%` }}
          >
            <span>{depth} m</span>
          </div>
        </div>

        <div>
          <div className="chl-control">
            <div className="chl-control-row">
              <span>Depth</span>
              <strong>{depth} m</strong>
            </div>
            <input
              className="chl-range"
              type="range"
              min="0"
              max="800"
              step="10"
              value={depth}
              onChange={(e) => onDepthChange(Number(e.target.value))}
            />
          </div>

          <div className="chl-grid chl-grid-2" style={{ marginTop: 20 }}>
            <div className="chl-stat">
              <div className="chl-stat-value">{Math.round(model.light)}%</div>
              <div className="chl-stat-label">Relative light</div>
            </div>
            <div className="chl-stat">
              <div className="chl-stat-value">{model.conceptualChl}</div>
              <div className="chl-stat-label">Conceptual chlorophyll index</div>
            </div>
          </div>

          <div className="chl-card" style={{ marginTop: 16 }}>
            <p className="chl-kicker">{model.layer}</p>
            <p>{model.explanation}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChlorophyllDepthExplorer;
