import React from "react";

const SalinityDepthExplorer = ({
  selectedDepth,
  onDepthChange,
  selectedRegion,
  onRegionChange,
  currentSalinity,
  regionData,
}) => {

  const regions = [
    "Indian Ocean",
    "Atlantic Ocean",
    "Pacific Ocean",
    "Polar Ocean",
    "Red Sea",
  ];

  const getLayer = () => {
    if (selectedDepth < 100) {
      return "SURFACE LAYER";
    }

    if (selectedDepth < 1000) {
      return "INTERMEDIATE WATER";
    }

    return "DEEP OCEAN";
  };

  const getExplanation = () => {
    if (selectedDepth < 100) {
      return "Surface salinity responds strongly to evaporation, rainfall and freshwater input.";
    }

    if (selectedDepth < 1000) {
      return "Below the surface, salinity is influenced by mixing between different water masses.";
    }

    return "Deep ocean salinity varies more slowly and reflects the history of water masses formed elsewhere.";
  };

  return (
    <div className="salinity-card salinity-depth-card">

      <div className="salinity-card-header">

        <div>
          <span className="salinity-section-label">
            INTERACTIVE LAB
          </span>

          <h2>Dive through salinity</h2>

          <p>
            Change the region and depth. Watch the salinity profile respond.
          </p>
        </div>

        <span className="salinity-experiment-number">
          EXP / 01
        </span>

      </div>

      <div className="salinity-depth-grid">

        {/* CONTROLS */}
        <div className="salinity-depth-controls">

          <label>OCEAN REGION</label>

          <select
            value={selectedRegion}
            onChange={(e) => onRegionChange(e.target.value)}
          >
            {regions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>

          <div className="salinity-control-block">

            <div className="salinity-control-title">
              <span>DEPTH</span>
              <strong>{selectedDepth.toLocaleString()} m</strong>
            </div>

            <input
              type="range"
              min="0"
              max="4000"
              step="50"
              value={selectedDepth}
              onChange={(e) =>
                onDepthChange(Number(e.target.value))
              }
            />

            <div className="salinity-range-labels">
              <span>SURFACE</span>
              <span>1 KM</span>
              <span>2 KM</span>
              <span>4 KM</span>
            </div>

          </div>

          <div className="salinity-live-reading">

            <span>LIVE SALINITY</span>

            <strong>
              {currentSalinity.toFixed(2)}
            </strong>

            <small>PSU</small>

          </div>

          <div className="salinity-layer-info">

            <span>{getLayer()}</span>

            <p>
              {getExplanation()}
            </p>

          </div>

        </div>

        {/* VISUALIZATION */}
        <div className="salinity-ocean-visual">

          <div className="salinity-visual-header">
            <span>SALINITY PROFILE</span>
            <strong>
              {currentSalinity.toFixed(1)} PSU
            </strong>
          </div>

          <div className="salinity-water-column">

            <div className="salinity-water-surface">
              <span>SURFACE</span>
            </div>

            <div className="salinity-water-layer layer-one" />
            <div className="salinity-water-layer layer-two" />
            <div className="salinity-water-layer layer-three" />
            <div className="salinity-water-layer layer-four" />

            <div
              className="salinity-depth-marker"
              style={{
                top: `${Math.min(
                  (selectedDepth / 4000) * 100,
                  96
                )}%`,
              }}
            >
              <span>
                {currentSalinity.toFixed(1)} PSU
              </span>
            </div>

            <div className="salinity-depth-scale">

              <span>0 m</span>
              <span>500 m</span>
              <span>1,000 m</span>
              <span>2,000 m</span>
              <span>4,000 m</span>

            </div>

          </div>

          <div className="salinity-region-note">
            <strong>{selectedRegion}</strong>

            <p>
              Surface: {regionData.surface.toFixed(1)} PSU
              <br />
              Deep: {regionData.deep.toFixed(1)} PSU
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};

export default SalinityDepthExplorer;