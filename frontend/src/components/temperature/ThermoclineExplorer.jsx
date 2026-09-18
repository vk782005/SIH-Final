import React, { useRef, useEffect } from 'react';

const ThermoclineExplorer = ({
  thermoclineDepth,
  onThermoclineDepthChange,
  selectedDepth,
  getTemperatureAtDepth,
}) => {
  const canvasRef = useRef(null);

  // Calculate temperature gradient at thermocline
  const tempAboveThermocline = getTemperatureAtDepth(Math.max(0, thermoclineDepth - 50));
  const tempBelowThermocline = getTemperatureAtDepth(Math.min(4000, thermoclineDepth + 50));
  const temperatureGradient = (tempAboveThermocline - tempBelowThermocline) / 100;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.offsetWidth;
    const height = 500;

    canvas.width = width;
    canvas.height = height;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#0a1428';
    ctx.fillRect(0, 0, width, height);

    const padding = 50;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;
    const maxDepth = 2000;

    const scale = graphHeight / maxDepth;

    // Draw three regions
    const surfaceEnd = thermoclineDepth - 75;
    const thermoclineStart = thermoclineDepth - 75;
    const thermoclineEnd = thermoclineDepth + 75;

    // Surface Mixed Layer
    ctx.fillStyle = 'rgba(255, 107, 53, 0.1)';
    ctx.fillRect(
      padding,
      padding,
      graphWidth,
      surfaceEnd * scale
    );

    // Thermocline
    ctx.fillStyle = 'rgba(0, 216, 255, 0.2)';
    ctx.fillRect(
      padding,
      padding + thermoclineStart * scale,
      graphWidth,
      (thermoclineEnd - thermoclineStart) * scale
    );

    // Deep Ocean
    ctx.fillStyle = 'rgba(30, 58, 138, 0.1)';
    ctx.fillRect(
      padding,
      padding + thermoclineEnd * scale,
      graphWidth,
      (maxDepth - thermoclineEnd) * scale
    );

    // Draw region labels
    ctx.fillStyle = 'var(--text-muted)';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';

    ctx.fillText('Surface Mixed Layer', padding + 10, padding + 20);
    ctx.fillText('THERMOCLINE', padding + 10, padding + thermoclineStart * scale + 30);
    ctx.fillText('Deep Ocean', padding + 10, padding + thermoclineEnd * scale + 30);

    // Draw thermocline center line
    const tcY = padding + thermoclineDepth * scale;
    ctx.strokeStyle = 'var(--cyan-bright)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padding, tcY);
    ctx.lineTo(padding + graphWidth, tcY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw depth markers
    ctx.fillStyle = 'var(--text-secondary)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    [0, 250, 500, 750, 1000, 1500, 2000].forEach((d) => {
      const y = padding + d * scale;
      ctx.fillText(`${d}m`, padding - 10, y);
    });

    // Draw left border
    ctx.strokeStyle = 'var(--border-color)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, padding + graphHeight);
    ctx.stroke();

    // Draw temperature values overlay
    ctx.fillStyle = 'var(--text-secondary)';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';

    // Show temperatures at key depths
    const tempAtSurface = getTemperatureAtDepth(0);
    const tempAtThermocline = getTemperatureAtDepth(thermoclineDepth);
    const tempAtDeep = getTemperatureAtDepth(Math.min(2000, thermoclineEnd + 100));

    ctx.fillText(`${tempAtSurface.toFixed(1)}°C`, padding + graphWidth + 30, padding + 10);
    ctx.fillText(`${tempAtThermocline.toFixed(1)}°C`, padding + graphWidth + 30, tcY);
    ctx.fillText(`${tempAtDeep.toFixed(1)}°C`, padding + graphWidth + 30, padding + graphHeight - 10);

    // Draw selected depth indicator
    if (selectedDepth <= 2000) {
      const selectedY = padding + selectedDepth * scale;
      ctx.strokeStyle = 'var(--temp-warm)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(padding, selectedY);
      ctx.lineTo(padding + graphWidth, selectedY);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [thermoclineDepth, selectedDepth, getTemperatureAtDepth]);

  return (
    <section>
      <div className="section-header">
        <div className="section-label">Section 4</div>
        <h2 className="section-title">The Thermocline</h2>
      </div>

      <p className="section-subtitle">
        The thermocline is a distinct layer where temperature changes rapidly with depth. Adjust the thermocline depth slider to see how it affects ocean stratification. The steeper the gradient, the more abrupt the temperature change.
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

      {/* Controls */}
      <div className="controls-grid">
        <div className="control-group">
          <label className="control-label">
            Thermocline Center Depth
            <span className="control-value">{thermoclineDepth} m</span>
          </label>
          <input
            type="range"
            min="50"
            max="1500"
            step="25"
            value={thermoclineDepth}
            onChange={(e) => onThermoclineDepthChange(Number(e.target.value))}
            className="slider"
          />
          <p style={{
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            margin: '0.5rem 0 0 0',
            lineHeight: '1.4',
          }}>
            Move the slider to adjust where the thermocline is located. Deeper thermoclines are common in tropical oceans; shallower ones are typical in polar regions.
          </p>
        </div>

        <div className="control-group">
          <label className="control-label">
            Temperature Gradient
            <span className="control-value">{Math.abs(temperatureGradient).toFixed(3)}°C/m</span>
          </label>
          <div className="info-box" style={{ margin: '0' }}>
            Temperature changes by approximately <strong>{Math.abs(temperatureGradient).toFixed(3)}°C</strong> for every meter of depth in the thermocline.
          </div>
        </div>
      </div>

      {/* Key insights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
        <div className="info-box">
          <div className="info-box-label">Surface Mixed Layer</div>
          <p style={{ margin: '0', fontSize: '0.9rem', lineHeight: '1.5' }}>
            Above the thermocline, wind mixing and solar heating keep temperatures relatively uniform. Most marine life lives here.
          </p>
        </div>

        <div className="info-box">
          <div className="info-box-label">Thermocline Region</div>
          <p style={{ margin: '0', fontSize: '0.9rem', lineHeight: '1.5' }}>
            Temperature drops rapidly with depth. This layer acts as a barrier to vertical mixing and limits heat penetration to deeper water.
          </p>
        </div>

        <div className="info-box">
          <div className="info-box-label">Deep Ocean</div>
          <p style={{ margin: '0', fontSize: '0.9rem', lineHeight: '1.5' }}>
            Below the thermocline, temperatures change slowly. This stable, cold region contains most of Earth's ocean water.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ThermoclineExplorer;
