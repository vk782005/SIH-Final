
const RealDataConnection = ({ onLaunchGlobe }) => {
  return (
    <section>
      <div className="section-header">
        <div className="section-label">Section 11</div>
        <h2 className="section-title">From Model to Real Ocean</h2>
      </div>

      <p className="section-subtitle">
        The simulations above are educational models designed to teach fundamental concepts. The OCEAN-X 3D globe lets you explore real oceanographic observations from satellites and research stations around the world.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginTop: '2rem',
      }}>
        {/* Model vs Reality comparison */}
        <div className="info-box">
          <div className="info-box-label">Educational Models</div>
          <p style={{ margin: '0', fontSize: '0.9rem', lineHeight: '1.6' }}>
            <strong>Simplified.</strong> Focus on one or two key concepts at a time. Use realistic but idealized data. Help build intuition.
          </p>
        </div>

        <div className="info-box">
          <div className="info-box-label">Real Observations</div>
          <p style={{ margin: '0', fontSize: '0.9rem', lineHeight: '1.6' }}>
            <strong>Complex.</strong> Multiple interacting factors. Real measurements with uncertainty. Reveal true ocean variability.
          </p>
        </div>

        <div className="info-box">
          <div className="info-box-label">Why Both Matter</div>
          <p style={{ margin: '0', fontSize: '0.9rem', lineHeight: '1.6' }}>
            Models teach principles. Real data shows how principles play out in Earth's actual ocean with all its complexity.
          </p>
        </div>
      </div>

      {/* Data sources */}
      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        background: 'rgba(0, 88, 170, 0.1)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '2px',
      }}>
        <p style={{
          margin: '0 0 1rem 0',
          fontSize: '0.9rem',
          color: 'var(--cyan-bright)',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          Data Sources Used in OCEAN-X Globe:
        </p>
        <ul style={{
          margin: '0',
          paddingLeft: '1.5rem',
          fontSize: '0.85rem',
          color: 'var(--text-secondary)',
          lineHeight: '1.8',
        }}>
          <li><strong>Satellite Data:</strong> Sea Surface Temperature (SST) from NOAA, Copernicus, and NASA satellites updated daily.</li>
          <li><strong>Argo Floats:</strong> Over 4000 autonomous profiling floats measure temperature and salinity throughout ocean depths.</li>
          <li><strong>Research Cruises:</strong> CTD (Conductivity, Temperature, Depth) profiles from oceanographic research vessels.</li>
          <li><strong>Climate Models:</strong> Reanalysis products combining observations with numerical ocean models.</li>
          <li><strong>Real-Time Buoys:</strong> Moored buoys and ocean observatories providing continuous measurements.</li>
        </ul>
      </div>

      {/* Call to action */}
      <div style={{
        marginTop: '2rem',
        padding: '2rem',
        background: 'linear-gradient(135deg, rgba(0, 216, 255, 0.1) 0%, rgba(0, 88, 170, 0.1) 100%)',
        border: '2px solid var(--cyan-dim)',
        borderRadius: '2px',
        textAlign: 'center',
      }}>
        <p style={{
          margin: '0 0 1.5rem 0',
          fontSize: '1rem',
          color: 'var(--text-primary)',
          fontWeight: '400',
          lineHeight: '1.6',
        }}>
          You've learned the fundamentals of ocean temperature. Now explore real-world temperature data on an interactive 3D globe. See how tropical oceans differ from polar oceans. Track seasonal changes. Investigate current systems and upwelling zones.
        </p>

        <button
          className="button-primary"
          onClick={onLaunchGlobe}
          style={{
            fontSize: '0.95rem',
            padding: '0.75rem 1.5rem',
            background: 'rgba(0, 216, 255, 0.15)',
            borderColor: 'var(--cyan-bright)',
            color: 'var(--cyan-bright)',
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(0, 216, 255, 0.25)';
            e.target.style.boxShadow = '0 0 20px rgba(0, 216, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(0, 216, 255, 0.15)';
            e.target.style.boxShadow = 'none';
          }}
        >
          Explore Real Temperature Data on OCEAN-X Globe →
        </button>
      </div>

      {/* Next steps */}
      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        background: 'rgba(0, 88, 170, 0.05)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '2px',
      }}>
        <p style={{
          margin: '0 0 1rem 0',
          fontSize: '0.9rem',
          color: 'var(--text-primary)',
          fontWeight: '600',
        }}>
          What to Look For on the Globe:
        </p>
        <ul style={{
          margin: '0',
          paddingLeft: '1.5rem',
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          lineHeight: '1.8',
        }}>
          <li>Tropical regions (near the equator) appear warmer (red/orange) than polar regions (blue).</li>
          <li>Western boundaries of ocean basins often show warmer currents (e.g., Gulf Stream).</li>
          <li>Coastal upwelling zones show cool water rising to the surface.</li>
          <li>Seasonal variations — compare summer and winter hemispheres.</li>
          <li>Use the depth controls to see subsurface temperature variations.</li>
        </ul>
      </div>
    </section>
  );
};

export default RealDataConnection;
