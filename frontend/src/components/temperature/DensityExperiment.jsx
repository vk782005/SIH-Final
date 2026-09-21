import { useState, useRef, useEffect } from "react";

const DensityExperiment = () => {
  const [temperature, setTemperature] = useState(15);
  const canvasRef = useRef(null);

  // Calculate density based on temperature (simplified seawater)
  const calculateDensity = (temp) => {
    // Simplified formula: density decreases with temperature
    // At 0°C, seawater ≈ 1028 kg/m³
    // At 30°C, seawater ≈ 1021 kg/m³
    return 1028 - (temp * 0.3);
  };

  const density = calculateDensity(temperature);
  const buoyancy = density > 1025 ? 'Tends to sink' : 'Tends to rise';
  const buoyancyColor = density > 1025 ? 'var(--temp-cold)' : 'var(--temp-warm)';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.offsetWidth;
    const height = 450;

    canvas.width = width;
    canvas.height = height;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#0a1428';
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const topY = 80;
    const bottomY = height - 80;
    const parcelRadius = 35;

    // Draw ocean surface and depth gradient
    ctx.fillStyle = 'linear-gradient' in ctx ? 'rgba(0, 88, 170, 0.15)' : 'rgba(0, 88, 170, 0.1)';
    ctx.fillRect(0, topY, width, bottomY - topY);

    // Draw water layers
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = `rgba(10, 20, 40, ${0.1 + i * 0.05})`;
      const y = topY + (i / 5) * (bottomY - topY);
      ctx.fillRect(0, y, width, (bottomY - topY) / 5);
    }

    // Draw surface line
    ctx.strokeStyle = 'var(--cyan-dim)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, topY);
    ctx.lineTo(width, topY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'var(--text-muted)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Ocean Surface', 10, topY - 10);

    // Calculate parcel position based on density
    // Warmer (low density) rises, cooler (high density) sinks
    const densityRange = 1028 - 1021; // 0-30°C range
    const relativePosition = (calculateDensity(temperature) - 1021) / densityRange;
    const parcelY = topY + relativePosition * (bottomY - topY);

    // Draw water parcel
    const parcelColor = temperature <= 15
      ? `rgba(30, 58, 138, ${0.3 + (1 - relativePosition) * 0.5})`
      : `rgba(255, 107, 53, ${0.2 + relativePosition * 0.3})`;

    ctx.fillStyle = parcelColor;
    ctx.beginPath();
    ctx.arc(centerX, parcelY, parcelRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'var(--cyan-bright)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, parcelY, parcelRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw parcel label
    ctx.fillStyle = 'var(--text-primary)';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Water Parcel', centerX, parcelY - 10);

    // Temperature indicator
    ctx.font = '12px monospace';
    ctx.fillStyle = 'var(--text-secondary)';
    ctx.fillText(`${temperature.toFixed(1)}°C`, centerX, parcelY + 15);

    // Buoyancy arrows
    if (density < 1025) {
      // Rising - draw upward arrows
      ctx.strokeStyle = 'var(--temp-warm)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const x = centerX - 25 + i * 25;
        const y = parcelY - parcelRadius - 20 - i * 10;
        ctx.beginPath();
        ctx.moveTo(x, y + 15);
        ctx.lineTo(x, y);
        ctx.stroke();

        // Arrow head
        ctx.beginPath();
        ctx.moveTo(x - 3, y + 5);
        ctx.lineTo(x, y);
        ctx.lineTo(x + 3, y + 5);
        ctx.stroke();
      }
    } else if (density > 1025) {
      // Sinking - draw downward arrows
      ctx.strokeStyle = 'var(--temp-cold)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const x = centerX - 25 + i * 25;
        const y = parcelY + parcelRadius + 20 + i * 10;
        ctx.beginPath();
        ctx.moveTo(x, y - 15);
        ctx.lineTo(x, y);
        ctx.stroke();

        // Arrow head
        ctx.beginPath();
        ctx.moveTo(x - 3, y - 5);
        ctx.lineTo(x, y);
        ctx.lineTo(x + 3, y - 5);
        ctx.stroke();
      }
    }

    // Draw depth scale on right
    ctx.fillStyle = 'var(--text-muted)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    [0, 100, 200, 300, 400, 500].forEach((depth, i) => {
      const y = topY + (i / 5) * (bottomY - topY);
      ctx.fillText(`${depth}m`, width - 50, y);
    });
  }, [temperature]);

  return (
    <section>
      <div className="section-header">
        <div className="section-label">Section 7</div>
        <h2 className="section-title">Temperature & Density</h2>
      </div>

      <p className="section-subtitle">
        Seawater density depends strongly on both temperature and salinity. Warmer water is less dense and tends to rise. Cooler water is denser and tends to sink. This relationship is fundamental to ocean circulation.
      </p>

      <div className="visualization-container">
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            minHeight: '350px',
          }}
        />
      </div>

      {/* Temperature Control */}
      <div className="controls-grid">
        <div className="control-group">
          <label className="control-label">
            Water Temperature
            <span className="control-value">{temperature.toFixed(1)}°C</span>
          </label>
          <input
            type="range"
            min="0"
            max="30"
            step="0.5"
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
            className="slider"
          />
        </div>

        <div className="control-group">
          <label className="control-label">
            Seawater Density
            <span className="control-value">{density.toFixed(2)} kg/m³</span>
          </label>
          <div className="info-box" style={{ margin: '0', fontSize: '0.9rem' }}>
            <strong>Reference:</strong> Pure water = 1000 kg/m³. Seawater is denser due to dissolved salts.
          </div>
        </div>

        <div className="control-group">
          <label className="control-label">
            Buoyancy
            <span className="control-value" style={{ color: buoyancyColor }}>
              {buoyancy}
            </span>
          </label>
          <div className="info-box" style={{ margin: '0', fontSize: '0.9rem' }}>
            {temperature < 15
              ? 'Cold, dense water sinks.'
              : temperature > 20
              ? 'Warm, light water rises.'
              : 'Neutral buoyancy — stays at current depth.'}
          </div>
        </div>
      </div>

      {/* Key insights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
        <div className="info-box">
          <div className="info-box-label">Temperature Effect</div>
          <p style={{ margin: '0', fontSize: '0.9rem', lineHeight: '1.5' }}>
            A 10°C increase in temperature decreases seawater density by about 3 kg/m³. This is a significant effect.
          </p>
        </div>

        <div className="info-box">
          <div className="info-box-label">Salinity Effect</div>
          <p style={{ margin: '0', fontSize: '0.9rem', lineHeight: '1.5' }}>
            Salinity also strongly affects density. Higher salinity increases density (denser water sinks). In this simulation, we focus on temperature alone.
          </p>
        </div>

        <div className="info-box">
          <div className="info-box-label">Thermohaline Circulation</div>
          <p style={{ margin: '0', fontSize: '0.9rem', lineHeight: '1.5' }}>
            Density differences from both temperature and salinity drive the global thermohaline circulation — a major ocean current system.
          </p>
        </div>
      </div>

      {/* Important note */}
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
          <strong>Important:</strong> Seawater density is controlled by both temperature and salinity. This experiment focuses on temperature to isolate its effect. In the real ocean, both factors matter equally and sometimes work in opposite directions, creating complex density structures.
        </p>
      </div>
    </section>
  );
};

export default DensityExperiment;
