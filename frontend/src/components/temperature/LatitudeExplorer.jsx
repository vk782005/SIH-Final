import React, { useRef, useEffect } from 'react';

const LatitudeExplorer = ({ selectedLatitude, onLatitudeChange }) => {
  const canvasRef = useRef(null);

  // Estimate ocean surface temperature based on latitude
  const getTemperatureFromLatitude = (lat) => {
    const absLat = Math.abs(lat);
    // Tropical: ~27°C, Temperate: ~15°C, Polar: ~0°C
    if (absLat <= 30) {
      return 27 - (absLat / 30) * 12;
    } else if (absLat <= 60) {
      return 15 - ((absLat - 30) / 30) * 15;
    } else {
      return 0 + ((90 - absLat) / 30) * 2;
    }
  };

  const estimatedTemp = getTemperatureFromLatitude(selectedLatitude);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.offsetWidth;
    const height = 400;

    canvas.width = width;
    canvas.height = height;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#0a1428';
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const earthRadius = 80;

    // Draw sun rays
    const sunAngle = -Math.PI / 4;
    ctx.strokeStyle = 'rgba(255, 107, 53, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const angle = sunAngle + (i - 2) * 0.15;
      const x1 = centerX + Math.cos(angle) * 30;
      const y1 = centerY + Math.sin(angle) * 30;
      const x2 = centerX + Math.cos(angle) * 150;
      const y2 = centerY + Math.sin(angle) * 150;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Draw sun
    ctx.fillStyle = 'rgba(255, 107, 53, 0.8)';
    ctx.beginPath();
    ctx.arc(centerX - 80, centerY - 80, 12, 0, Math.PI * 2);
    ctx.fill();

    // Draw Earth
    ctx.fillStyle = 'rgba(30, 58, 138, 0.4)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, earthRadius, 0, Math.PI * 2);
    ctx.fill();

    // Draw Earth border
    ctx.strokeStyle = 'var(--cyan-dim)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, earthRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw latitude lines
    ctx.strokeStyle = 'rgba(0, 136, 170, 0.2)';
    ctx.lineWidth = 1;
    for (let lat = -90; lat <= 90; lat += 30) {
      const angle = (lat * Math.PI) / 180;
      const radius = earthRadius * Math.cos(angle);
      const y = centerY - earthRadius * Math.sin(angle);

      ctx.beginPath();
      ctx.ellipse(centerX, y, radius, 3, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Calculate latitude lines and heating
    const latitudeLinePositions = [];
    for (let lat = -90; lat <= 90; lat += 30) {
      const angle = (lat * Math.PI) / 180;
      const y = centerY - earthRadius * Math.sin(angle);
      latitudeLinePositions.push({ lat, y });
    }

    // Draw selected latitude indicator and heating
    const selectedAngle = (selectedLatitude * Math.PI) / 180;
    const selectedY = centerY - earthRadius * Math.sin(selectedAngle);
    const selectedRadius = earthRadius * Math.cos(selectedAngle);

    // Heat intensity visualization at selected latitude
    const heatIntensity = Math.cos(selectedAngle);
    const heatColor = `rgba(255, 107, 53, ${Math.max(0.1, Math.abs(heatIntensity) * 0.8)})`;

    ctx.fillStyle = heatColor;
    ctx.beginPath();
    ctx.ellipse(centerX, selectedY, selectedRadius + 5, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw selected latitude line
    ctx.strokeStyle = 'var(--temp-warm)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(centerX, selectedY, selectedRadius, 3, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Draw latitude labels
    ctx.fillStyle = 'var(--text-secondary)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    latitudeLinePositions.forEach(({ lat, y }) => {
      if (lat === 0) {
        ctx.fillStyle = 'var(--cyan-bright)';
        ctx.fillText(`${lat}° Equator`, centerX - earthRadius - 15, y);
      } else if (lat > 0) {
        ctx.fillStyle = 'var(--text-secondary)';
        ctx.fillText(`${lat}°N`, centerX - earthRadius - 15, y);
      } else {
        ctx.fillStyle = 'var(--text-secondary)';
        ctx.fillText(`${Math.abs(lat)}°S`, centerX - earthRadius - 15, y);
      }
    });

    // Draw incoming solar radiation intensity bars
    const barStart = centerX + earthRadius + 40;
    const barWidth = 15;
    const barHeight = 200;

    ctx.fillStyle = 'rgba(0, 136, 170, 0.1)';
    ctx.fillRect(barStart - barWidth / 2 - 20, centerY - barHeight / 2, barWidth, barHeight);

    // Draw solar intensity for selected latitude
    const sunIntensity = Math.max(0, Math.cos(selectedAngle)) * 100;
    const barColor = `rgba(255, 107, 53, ${0.3 + Math.cos(selectedAngle) * 0.5})`;
    ctx.fillStyle = barColor;
    ctx.fillRect(
      barStart - barWidth / 2 - 20,
      centerY - sunIntensity / 2,
      barWidth,
      sunIntensity
    );

    // Label for solar intensity
    ctx.fillStyle = 'var(--text-secondary)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Solar Energy', barStart - 20, centerY + barHeight / 2 + 15);
  }, [selectedLatitude]);

  return (
    <section>
      <div className="section-header">
        <div className="section-label">Section 5</div>
        <h2 className="section-title">Latitude & Solar Energy</h2>
      </div>

      <p className="section-subtitle">
        Solar energy reaching Earth's surface varies with latitude. Tropical regions receive more concentrated sunlight, while polar regions receive less. This is the primary reason tropical oceans are warmer than polar oceans.
      </p>

      <div className="visualization-container">
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            minHeight: '300px',
          }}
        />
      </div>

      {/* Latitude Control */}
      <div className="controls-grid">
        <div className="control-group">
          <label className="control-label">
            Selected Latitude
            <span className="control-value">
              {selectedLatitude >= 0 ? selectedLatitude + '°N' : Math.abs(selectedLatitude) + '°S'}
            </span>
          </label>
          <input
            type="range"
            min="-90"
            max="90"
            step="5"
            value={selectedLatitude}
            onChange={(e) => onLatitudeChange(Number(e.target.value))}
            className="slider"
          />
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {[-90, -60, -30, 0, 30, 60, 90].map((lat) => (
              <button
                key={lat}
                onClick={() => onLatitudeChange(lat)}
                style={{
                  background: selectedLatitude === lat ? 'rgba(0, 216, 255, 0.2)' : 'transparent',
                  border: `1px solid ${selectedLatitude === lat ? 'var(--cyan-bright)' : 'var(--border-color)'}`,
                  color: 'var(--text-secondary)',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '2px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: selectedLatitude === lat ? '600' : '400',
                }}
                onMouseEnter={(e) => {
                  if (selectedLatitude !== lat) {
                    e.target.style.borderColor = 'var(--cyan-dim)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedLatitude !== lat) {
                    e.target.style.borderColor = 'var(--border-color)';
                  }
                }}
              >
                {lat >= 0 ? lat + '°N' : Math.abs(lat) + '°S'}
              </button>
            ))}
          </div>
        </div>

        <div className="control-group">
          <label className="control-label">
            Estimated Surface Temperature
            <span className="control-value">{estimatedTemp.toFixed(1)}°C</span>
          </label>
          <div className="info-box" style={{ margin: '0' }}>
            <p style={{ margin: '0', fontSize: '0.9rem' }}>
              {selectedLatitude >= -30 && selectedLatitude <= 30
                ? 'Tropical zone: Warm, high solar heating'
                : selectedLatitude >= -60 && selectedLatitude <= 60
                ? 'Temperate zone: Moderate heating'
                : 'Polar zone: Minimal solar heating'}
            </p>
          </div>
        </div>
      </div>

      {/* Educational model note */}
      <div style={{
        background: 'rgba(0, 88, 170, 0.1)',
        border: '1px solid var(--border-subtle)',
        padding: '1rem',
        borderRadius: '2px',
        marginTop: '1.5rem',
      }}>
        <p style={{
          margin: '0',
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          lineHeight: '1.6',
        }}>
          <strong>Educational Model:</strong> This visualization simplifies complex climate dynamics. Actual ocean temperatures depend on solar radiation angle, atmospheric conditions, ocean currents, season, time of day, and many other factors.
        </p>
      </div>

      {/* Key insights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
        <div className="info-box">
          <div className="info-box-label">Tropical Oceans (0–30°)</div>
          <p style={{ margin: '0', fontSize: '0.9rem', lineHeight: '1.5' }}>
            Receive concentrated solar rays year-round. Surface temperatures typically 25–30°C. High evaporation rates.
          </p>
        </div>

        <div className="info-box">
          <div className="info-box-label">Temperate Oceans (30–60°)</div>
          <p style={{ margin: '0', fontSize: '0.9rem', lineHeight: '1.5' }}>
            Solar angle varies seasonally. Surface temperatures typically 10–20°C. Strong seasonal temperature variations.
          </p>
        </div>

        <div className="info-box">
          <div className="info-box-label">Polar Oceans (60–90°)</div>
          <p style={{ margin: '0', fontSize: '0.9rem', lineHeight: '1.5' }}>
            Receive oblique solar rays, even in summer. Surface temperatures near 0°C or below. Sea ice common.
          </p>
        </div>
      </div>
    </section>
  );
};

export default LatitudeExplorer;
