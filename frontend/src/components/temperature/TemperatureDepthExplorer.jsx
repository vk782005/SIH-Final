import { useRef, useEffect } from "react";

const TemperatureDepthExplorer = ({
  selectedDepth,
  onDepthChange,
  currentTemp,
  currentLayer,
  explanation,
  thermoclineDepth,
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.offsetWidth;
    const height = 600;
    
    canvas.width = width;
    canvas.height = height;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.fillStyle = '#0a1428';
    ctx.fillRect(0, 0, width, height);

    // Configuration
    const padding = 40;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;
    const maxDepth = 4000;
    const scale = graphHeight / maxDepth;

    // Draw depth scale on left
    ctx.fillStyle = '#708090';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const depthMarkers = [0, 100, 250, 500, 1000, 2000, 4000];
    depthMarkers.forEach((depth) => {
      const y = padding + depth * scale;
      ctx.fillText(`${depth}m`, padding - 10, y);
      ctx.strokeStyle = 'rgba(0, 136, 170, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding - 2, y);
      ctx.lineTo(padding + graphWidth, y);
      ctx.stroke();
    });

    // Temperature profile curve
    const profilePoints = [
      { depth: 0, temp: 24 },
      { depth: 50, temp: 23 },
      { depth: 100, temp: 20 },
      { depth: 150, temp: 16 },
      { depth: 200, temp: 12 },
      { depth: 300, temp: 8 },
      { depth: 500, temp: 5 },
      { depth: 1000, temp: 3 },
      { depth: 2000, temp: 2.5 },
      { depth: 4000, temp: 2 },
    ];

    const maxTemp = 25;
    const tempScale = graphWidth / maxTemp;

    // Draw temperature gradient zones
    // Warm surface
    const warmZoneDepth = 100;
    ctx.fillStyle = 'rgba(255, 107, 53, 0.1)';
    ctx.fillRect(padding, padding, graphWidth, warmZoneDepth * scale);

    // Thermocline
    ctx.fillStyle = 'rgba(0, 184, 212, 0.15)';
    ctx.fillRect(padding, padding + warmZoneDepth * scale, graphWidth, (300 - warmZoneDepth) * scale);

    // Deep ocean
    ctx.fillStyle = 'rgba(30, 58, 138, 0.1)';
    ctx.fillRect(padding, padding + 300 * scale, graphWidth, (maxDepth - 300) * scale);

    // Draw thermocline indicator line
    if (thermoclineDepth) {
      const tcY = padding + thermoclineDepth * scale;
      ctx.strokeStyle = 'rgba(0, 216, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(padding, tcY);
      ctx.lineTo(padding + graphWidth, tcY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'var(--cyan-dim)';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('Thermocline', padding + 10, tcY - 5);
    }

    // Draw temperature profile curve
    ctx.strokeStyle = 'var(--cyan-bright)';
    ctx.lineWidth = 3;
    ctx.beginPath();

    for (let i = 0; i < profilePoints.length; i++) {
      const point = profilePoints[i];
      const x = padding + point.temp * tempScale;
      const y = padding + point.depth * scale;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Draw filled area under curve
    ctx.strokeStyle = 'none';
    ctx.fillStyle = 'rgba(0, 216, 255, 0.15)';
    ctx.beginPath();
    ctx.moveTo(padding, padding + 0 * scale); // Start at surface
    for (let i = 0; i < profilePoints.length; i++) {
      const point = profilePoints[i];
      const x = padding + point.temp * tempScale;
      const y = padding + point.depth * scale;
      ctx.lineTo(x, y);
    }
    // Draw back down the right edge
    ctx.lineTo(padding, padding + maxDepth * scale);
    ctx.closePath();
    ctx.fill();

    // Draw selected depth marker
    const selectedX = padding + (currentTemp * tempScale);
    const selectedY = padding + selectedDepth * scale;

    // Crosshair
    ctx.strokeStyle = 'var(--temp-warm)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(selectedX, selectedY, 8, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 107, 53, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(selectedX, selectedY - 12);
    ctx.lineTo(selectedX, selectedY + 12);
    ctx.moveTo(selectedX - 12, selectedY);
    ctx.lineTo(selectedX + 12, selectedY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw outer border
    ctx.strokeStyle = 'var(--border-color)';
    ctx.lineWidth = 1;
    ctx.strokeRect(padding, padding, graphWidth, graphHeight);

    // Temperature axis label
    ctx.fillStyle = 'var(--text-secondary)';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Temperature (°C)', padding + graphWidth / 2, height - 10);

    // Depth axis label
    ctx.save();
    ctx.translate(10, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Depth (m)', 0, 0);
    ctx.restore();
  }, [selectedDepth, currentTemp, thermoclineDepth]);

  const depthOptions = [0, 50, 100, 150, 250, 500, 1000, 2000, 4000];

  return (
    <section>
      <div className="section-header">
        <div className="section-label">Section 2</div>
        <h2 className="section-title">Temperature Cross-Section</h2>
      </div>

      <p className="section-subtitle">
        Explore how temperature changes with depth in the ocean. Click a depth marker or drag the slider to see the temperature profile at that depth.
      </p>

      <div className="visualization-container">
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            minHeight: '400px',
          }}
        />
      </div>

      {/* Depth Selection */}
      <div className="controls-grid">
        <div className="control-group">
          <label className="control-label">
            Selected Depth
            <span className="control-value">{selectedDepth} m</span>
          </label>
          <input
            type="range"
            min="0"
            max="4000"
            step="50"
            value={selectedDepth}
            onChange={(e) => onDepthChange(Number(e.target.value))}
            className="slider"
          />
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {depthOptions.map((depth) => (
              <button
                key={depth}
                onClick={() => onDepthChange(depth)}
                style={{
                  background: selectedDepth === depth ? 'rgba(0, 216, 255, 0.2)' : 'transparent',
                  border: `1px solid ${selectedDepth === depth ? 'var(--cyan-bright)' : 'var(--border-color)'}`,
                  color: 'var(--text-secondary)',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '2px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: selectedDepth === depth ? '600' : '400',
                }}
                onMouseEnter={(e) => {
                  if (selectedDepth !== depth) {
                    e.target.style.borderColor = 'var(--cyan-dim)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedDepth !== depth) {
                    e.target.style.borderColor = 'var(--border-color)';
                  }
                }}
              >
                {depth}m
              </button>
            ))}
          </div>
        </div>

        <div className="control-group">
          <label className="control-label">
            Temperature
            <span className="control-value">{currentTemp.toFixed(1)}°C</span>
          </label>
          <div className="info-box" style={{ margin: '0' }}>
            <strong>{currentLayer}</strong>
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div className="info-box">
        <div className="info-box-label">What's Happening at {selectedDepth}m</div>
        <p style={{ margin: '0', fontSize: '0.95rem', lineHeight: '1.6' }}>
          {explanation}
        </p>
      </div>
    </section>
  );
};

export default TemperatureDepthExplorer;
