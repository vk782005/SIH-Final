
const GyreExplorer = ({ selectedLatitude }) => {
  const hemisphere = selectedLatitude >= 0 ? 'Northern' : 'Southern';
  const direction = selectedLatitude >= 0 ? 'Clockwise' : 'Counter-clockwise';

  return (
    <div className="currents-panel">
      <div className="currents-panel-header">
        <div className="currents-eyebrow">INTERACTIVE LAB · 03</div>
        <h2 className="currents-panel-title">Understand ocean gyres</h2>
        <p className="currents-panel-subtitle">
          Large-scale wind-driven circulation forms gyres. Their direction changes
          between hemispheres because the Coriolis effect reverses sign across the equator.
        </p>
      </div>

      <div className="currents-grid-2">
        <div className="currents-control-column">
          <div className="currents-info-card" style={{ marginTop: 0 }}>
            <div className="currents-label">Current latitude</div>
            <h3>{selectedLatitude}°</h3>
            <p className="currents-muted">
              You are exploring the {hemisphere} Hemisphere.
            </p>
          </div>

          <div className="currents-info-card">
            <div className="currents-label">Expected gyre rotation</div>
            <h3>{direction}</h3>
            <p className="currents-muted">
              Move the latitude slider in the previous experiment across the equator
              and observe how the conceptual rotation reverses.
            </p>
          </div>

          <div className="currents-stat-grid">
            <div className="currents-stat">
              <span>Scale</span>
              <strong>Ocean basin</strong>
            </div>
            <div className="currents-stat">
              <span>Driver</span>
              <strong>Wind + rotation</strong>
            </div>
          </div>
        </div>

        <div className="currents-visual-column">
          <div className="gyre-stage">
            <div className="gyre-ring">
              <div className="gyre-flow g1" />
              <div className="gyre-flow g2" />
              <div className="gyre-flow g3" />
              <div className="gyre-flow g4" />
            </div>

            <span className="gyre-label top">WESTERN BOUNDARY</span>
            <span className="gyre-label bottom">EQUATORWARD RETURN</span>
            <span className="gyre-label left">EASTERN BOUNDARY</span>
            <span className="gyre-label right">POLEWARD FLOW</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GyreExplorer;
