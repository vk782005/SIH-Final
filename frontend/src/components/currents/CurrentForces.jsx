import React from 'react';

const ForceControl = ({
  icon,
  title,
  description,
  value,
  onChange,
}) => (
  <div className="force-card">
    <div className="force-icon">{icon}</div>
    <h3>{title}</h3>
    <p>{description}</p>

    <div className="currents-label-row">
      <span className="currents-label">Influence</span>
      <span className="currents-value">{value}%</span>
    </div>

    <input
      className="currents-range"
      type="range"
      min="0"
      max="100"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    />

    <div className="force-meter" style={{ marginTop: 12 }}>
      <div style={{ width: `${value}%` }} />
    </div>
  </div>
);

const CurrentForces = ({
  windStrength,
  onWindStrengthChange,
  coriolisStrength,
  onCoriolisStrengthChange,
  temperatureDifference,
  onTemperatureDifferenceChange,
  simulatedFlow,
}) => {
  return (
    <div className="currents-panel">
      <div className="currents-panel-header">
        <div className="currents-eyebrow">INTERACTIVE LAB · 02</div>
        <h2 className="currents-panel-title">Build a current</h2>
        <p className="currents-panel-subtitle">
          Adjust three major drivers and see how the simulated surface flow responds.
          The visualization is conceptual rather than a numerical ocean model.
        </p>
      </div>

      <div className="currents-grid-3">
        <ForceControl
          icon="≋"
          title="Wind"
          description="Persistent winds transfer momentum to the upper ocean and help organize surface circulation."
          value={windStrength}
          onChange={onWindStrengthChange}
        />

        <ForceControl
          icon="↻"
          title="Coriolis"
          description="Earth's rotation deflects moving water, shaping the large-scale direction of currents."
          value={coriolisStrength}
          onChange={onCoriolisStrengthChange}
        />

        <ForceControl
          icon="Δ"
          title="Density contrast"
          description="Temperature and salinity differences change density and help power deeper circulation."
          value={temperatureDifference}
          onChange={onTemperatureDifferenceChange}
        />
      </div>

      <div className="flow-lab">
        <div className="flow-lab-title">Simulated circulation response</div>

        <div className="flow-bars">
          <div className="flow-bar-row">
            <span>Surface transport</span>
            <div className="flow-bar"><div style={{ width: `${simulatedFlow.surface}%` }} /></div>
            <strong>{simulatedFlow.surface}%</strong>
          </div>

          <div className="flow-bar-row">
            <span>Deflection</span>
            <div className="flow-bar"><div style={{ width: `${simulatedFlow.turning}%` }} /></div>
            <strong>{simulatedFlow.turning}%</strong>
          </div>

          <div className="flow-bar-row">
            <span>Density drive</span>
            <div className="flow-bar"><div style={{ width: `${simulatedFlow.density}%` }} /></div>
            <strong>{simulatedFlow.density}%</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrentForces;
