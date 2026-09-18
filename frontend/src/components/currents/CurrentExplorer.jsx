import React from 'react';

const CurrentExplorer = ({
  selectedLatitude,
  onLatitudeChange,
  selectedCurrent,
  onCurrentChange,
  latitudeBand,
  currentInfo,
}) => {
  return (
    <div className="currents-panel">
      <div className="currents-panel-header">
        <div className="currents-eyebrow">INTERACTIVE LAB · 01</div>
        <h2 className="currents-panel-title">Trace a moving ocean</h2>
        <p className="currents-panel-subtitle">
          Change latitude and select a major current. Watch the schematic flow field
          respond and connect the current to its climate role.
        </p>
      </div>

      <div className="currents-grid-2">
        <div className="currents-control-column">
          <div className="currents-field">
            <div className="currents-label-row">
              <span className="currents-label">Ocean current</span>
            </div>

            <select
              className="currents-select"
              value={selectedCurrent}
              onChange={(e) => onCurrentChange(e.target.value)}
            >
              <option>Gulf Stream</option>
              <option>Kuroshio</option>
              <option>California Current</option>
              <option>Antarctic Circumpolar Current</option>
            </select>
          </div>

          <div className="currents-field">
            <div className="currents-label-row">
              <span className="currents-label">Latitude</span>
              <span className="currents-value">{selectedLatitude}°</span>
            </div>

            <input
              className="currents-range"
              type="range"
              min="-80"
              max="80"
              value={selectedLatitude}
              onChange={(e) => onLatitudeChange(Number(e.target.value))}
            />

            <div className="currents-label-row" style={{ marginTop: 8 }}>
              <span className="currents-label">80°S</span>
              <span className="currents-label">{latitudeBand}</span>
              <span className="currents-label">80°N</span>
            </div>
          </div>

          <div className="currents-info-card">
            <div className="currents-label">Selected system</div>
            <h3>{selectedCurrent}</h3>
            <p className="currents-muted">{currentInfo.effect}</p>

            <div className="currents-stat-grid">
              <div className="currents-stat">
                <span>Region</span>
                <strong>{currentInfo.region}</strong>
              </div>
              <div className="currents-stat">
                <span>Direction</span>
                <strong>{currentInfo.direction}</strong>
              </div>
              <div className="currents-stat">
                <span>Type</span>
                <strong>{currentInfo.type}</strong>
              </div>
              <div className="currents-stat">
                <span>Speed</span>
                <strong>{currentInfo.speed}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="currents-visual-column">
          <div className="current-map">
            <div className="current-center" />
            <div className="current-arrow a1" />
            <div className="current-arrow a2" />
            <div className="current-arrow a3" />
            <div className="current-arrow a4" />
            <div className="current-arrow a5" />
            <div className="current-arrow a6" />
            <div className="current-map-label">
              {latitudeBand.toUpperCase()} BAND · {selectedCurrent.toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrentExplorer;
