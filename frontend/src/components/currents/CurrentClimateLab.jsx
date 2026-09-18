import React, { useMemo } from 'react';

const CurrentClimateLab = ({
  surfaceTemp,
  onSurfaceTempChange,
  deepTemp,
  onDeepTempChange,
  salinityDifference,
  onSalinityDifferenceChange,
}) => {
  const densityContrast = useMemo(() => {
    const thermal = Math.max(0, surfaceTemp - deepTemp);
    return Math.min(100, Math.round((thermal / 30) * 65 + salinityDifference * 0.35));
  }, [surfaceTemp, deepTemp, salinityDifference]);

  return (
    <div className="currents-panel">
      <div className="currents-panel-header">
        <div className="currents-eyebrow">INTERACTIVE LAB · 05</div>
        <h2 className="currents-panel-title">Temperature, salinity & deep circulation</h2>
        <p className="currents-panel-subtitle">
          Temperature and salinity influence seawater density. This conceptual experiment
          shows why density differences matter for large-scale circulation.
        </p>
      </div>

      <div className="currents-grid-2">
        <div className="currents-control-column">
          <div className="currents-field">
            <div className="currents-label-row">
              <span className="currents-label">Surface temperature</span>
              <span className="currents-value">{surfaceTemp}°C</span>
            </div>
            <input
              className="currents-range"
              type="range"
              min="0"
              max="35"
              value={surfaceTemp}
              onChange={(e) => onSurfaceTempChange(Number(e.target.value))}
            />
          </div>

          <div className="currents-field">
            <div className="currents-label-row">
              <span className="currents-label">Deep temperature</span>
              <span className="currents-value">{deepTemp}°C</span>
            </div>
            <input
              className="currents-range"
              type="range"
              min="0"
              max="15"
              value={deepTemp}
              onChange={(e) => onDeepTempChange(Number(e.target.value))}
            />
          </div>

          <div className="currents-field">
            <div className="currents-label-row">
              <span className="currents-label">Salinity difference</span>
              <span className="currents-value">{salinityDifference}%</span>
            </div>
            <input
              className="currents-range"
              type="range"
              min="0"
              max="100"
              value={salinityDifference}
              onChange={(e) => onSalinityDifferenceChange(Number(e.target.value))}
            />
          </div>

          <div className="currents-info-card">
            <div className="currents-label">Conceptual density contrast</div>
            <h3>{densityContrast}%</h3>
            <p className="currents-muted">
              Increasing the contrast between warm surface water and colder, saltier
              water increases the potential for density-driven circulation.
            </p>
          </div>
        </div>

        <div className="currents-visual-column">
          <div className="climate-simulation">
            <div className="climate-sun" />
            <div className="climate-ocean" />
            <div className="climate-surface" />

            <div className="climate-arrow c1" />
            <div className="climate-arrow c2" />
            <div className="climate-arrow c3" />

            <div style={{
              position: 'absolute',
              top: '31%',
              left: '12%',
              color: '#c6f5fb',
              fontSize: 11,
            }}>
              warm surface water
            </div>

            <div style={{
              position: 'absolute',
              bottom: '12%',
              right: '10%',
              color: '#77b3c2',
              fontSize: 11,
            }}>
              cold dense return flow
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrentClimateLab;
