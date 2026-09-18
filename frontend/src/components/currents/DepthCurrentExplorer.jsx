import React from 'react';

const DepthCurrentExplorer = ({ depth, onDepthChange }) => {
  const depthKm = depth / 1000;

  let zone = 'Surface current';
  let description = 'Wind-driven currents dominate the upper ocean.';
  if (depth > 100 && depth <= 1000) {
    zone = 'Thermocline transition';
    description = 'Density changes become increasingly important as sunlight and direct wind influence weaken.';
  } else if (depth > 1000) {
    zone = 'Deep circulation';
    description = 'Cold, dense water participates in slow global overturning circulation.';
  }

  const markerTop = Math.min(94, 5 + (depth / 6000) * 89);

  return (
    <div className="currents-panel">
      <div className="currents-panel-header">
        <div className="currents-eyebrow">INTERACTIVE LAB · 04</div>
        <h2 className="currents-panel-title">Dive through the current system</h2>
        <p className="currents-panel-subtitle">
          Ocean movement changes with depth. Explore the transition from fast surface
          pathways to the slow, dense-water circulation of the deep ocean.
        </p>
      </div>

      <div className="currents-grid-2">
        <div className="currents-control-column">
          <div className="currents-field">
            <div className="currents-label-row">
              <span className="currents-label">Depth</span>
              <span className="currents-value">{depth.toLocaleString()} m</span>
            </div>

            <input
              className="currents-range"
              type="range"
              min="0"
              max="6000"
              step="50"
              value={depth}
              onChange={(e) => onDepthChange(Number(e.target.value))}
            />
          </div>

          <div className="currents-info-card">
            <div className="currents-label">Current regime</div>
            <h3>{zone}</h3>
            <p className="currents-muted">{description}</p>
          </div>

          <div className="currents-stat-grid">
            <div className="currents-stat">
              <span>Depth</span>
              <strong>{depthKm.toFixed(2)} km</strong>
            </div>
            <div className="currents-stat">
              <span>Movement</span>
              <strong>{depth < 1000 ? 'Faster' : 'Slower'}</strong>
            </div>
          </div>
        </div>

        <div className="currents-visual-column">
          <div className="depth-visual">
            {[0, 500, 1000, 2000, 4000, 6000].map((value) => (
              <div
                key={value}
                className="depth-layer"
                style={{ top: `${5 + (value / 6000) * 89}%` }}
              >
                <span>{value.toLocaleString()} m</span>
              </div>
            ))}

            {Array.from({ length: 25 }).map((_, index) => (
              <div
                key={index}
                className="depth-particle"
                style={{
                  left: `${8 + ((index * 37) % 84)}%`,
                  top: `${8 + ((index * 53) % 82)}%`,
                  animationDelay: `${index * 0.17}s`,
                }}
              />
            ))}

            <div className="depth-marker" style={{ top: `${markerTop}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepthCurrentExplorer;
