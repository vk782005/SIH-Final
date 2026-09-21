import { useRef, useEffect, useMemo } from "react";

const HeatingSimulation = ({
  solarEnergy,
  onSolarEnergyChange,
  windMixing,
  onWindMixingChange,
  simulationTime,
  onSimulationTimeChange,
}) => {
  const canvasRef = useRef(null);
  // Derived directly from the simulation controls; keeping this as a memo
  // avoids an extra render every time the user moves a slider.
  const temperatureProfile = useMemo(() => {
    const surface = 15 + solarEnergy * 15;
    const depthOfMixing = 50 + windMixing * 150;
    const mid = surface - (depthOfMixing / 200) * (surface - 5);
    const deep = 5 + solarEnergy * 2;

    return { surface, mid, deep };
  }, [solarEnergy, windMixing]);

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

    const padding = 40;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;

    // Draw water layers with temperature gradient
    const layerHeight = graphHeight / 3;

    // Surface layer (affected by solar energy)
    const surfaceColor = `rgba(${255 - solarEnergy * 100}, ${107 + solarEnergy * 100}, ${53 + solarEnergy * 50}, 0.3)`;
    ctx.fillStyle = surfaceColor;
    ctx.fillRect(padding, padding, graphWidth, layerHeight);

    // Mixing depth (affected by wind)
    const mixingDepth = 50 + windMixing * 150;
    const mixingY = padding + (mixingDepth / 200) * layerHeight;
    ctx.fillStyle = 'rgba(0, 184, 212, 0.2)';
    ctx.fillRect(padding, mixingY, graphWidth, layerHeight - (mixingY - padding));

    // Deep water layer
    ctx.fillStyle = 'rgba(30, 58, 138, 0.15)';
    ctx.fillRect(padding, padding + layerHeight * 2, graphWidth, layerHeight);

    // Draw labels and temperatures
    ctx.fillStyle = 'var(--text-primary)';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    ctx.fillText('Surface', padding + 15, padding + 15);
    ctx.fillText(`${temperatureProfile.surface.toFixed(1)}°C`, padding + 15, padding + 35);

    ctx.font = '12px monospace';
    ctx.fillStyle = 'var(--text-secondary)';

    if (windMixing > 0.3) {
      ctx.fillText('Wind Mixing Active', padding + 15, mixingY + 15);
    }

    ctx.fillText('Deep Water', padding + 15, padding + layerHeight * 2 + 15);
    ctx.fillText(`${temperatureProfile.deep.toFixed(1)}°C`, padding + 15, padding + layerHeight * 2 + 35);

    // Draw sun indicator
    const sunY = padding - 20;
    ctx.fillStyle = `rgba(255, 107, 53, ${0.3 + solarEnergy * 0.7})`;
    ctx.beginPath();
    ctx.arc(padding + graphWidth / 2, sunY, 12 + solarEnergy * 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(255, 107, 53, ${0.2 + solarEnergy * 0.5})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(padding + graphWidth / 2, sunY, 20 + solarEnergy * 10, 0, Math.PI * 2);
    ctx.stroke();

    // Draw wind indicator (arrows if windMixing > 0)
    if (windMixing > 0.2) {
      ctx.strokeStyle = `rgba(0, 216, 255, ${windMixing * 0.6})`;
      ctx.lineWidth = 2;
      const arrowSpacing = graphWidth / 4;
      for (let i = 0; i < 4; i++) {
        const x = padding + arrowSpacing * (i + 0.5);
        const length = windMixing * 30;
        ctx.beginPath();
        ctx.moveTo(x, padding - 5);
        ctx.lineTo(x, padding - 5 - length);
        ctx.stroke();

        // Arrow head
        ctx.beginPath();
        ctx.moveTo(x - 4, padding - 5 - length + 4);
        ctx.lineTo(x, padding - 5 - length);
        ctx.lineTo(x + 4, padding - 5 - length + 4);
        ctx.stroke();
      }
    }

    // Draw border
    ctx.strokeStyle = 'var(--border-color)';
    ctx.lineWidth = 1;
    ctx.strokeRect(padding, padding, graphWidth, graphHeight);
  }, [solarEnergy, windMixing, temperatureProfile]);

  return (
    <section>
      <div className="section-header">
        <div className="section-label">Section 6</div>
        <h2 className="section-title">Surface Heating Simulation</h2>
      </div>

      <p className="section-subtitle">
        Observe how solar energy and wind mixing affect ocean surface temperature. Increase solar energy to see the surface warm up. Increase wind mixing to distribute heat deeper into the water column.
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

      {/* Controls */}
      <div className="controls-grid">
        <div className="control-group">
          <label className="control-label">
            Solar Energy
            <span className="control-value">{(solarEnergy * 100).toFixed(0)}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={solarEnergy}
            onChange={(e) => onSolarEnergyChange(Number(e.target.value))}
            className="slider"
          />
          <p style={{
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            margin: '0.5rem 0 0 0',
            lineHeight: '1.4',
          }}>
            Simulates daytime vs nighttime, season, or cloud cover.
          </p>
        </div>

        <div className="control-group">
          <label className="control-label">
            Wind Mixing Intensity
            <span className="control-value">{(windMixing * 100).toFixed(0)}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={windMixing}
            onChange={(e) => onWindMixingChange(Number(e.target.value))}
            className="slider"
          />
          <p style={{
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            margin: '0.5rem 0 0 0',
            lineHeight: '1.4',
          }}>
            Distributes heat deeper. Calm seas = shallow mixing; storms = deep mixing.
          </p>
        </div>

        <div className="control-group">
          <label className="control-label">
            Time of Day
            <span className="control-value">{String(simulationTime).padStart(2, '0')}:00</span>
          </label>
          <input
            type="range"
            min="0"
            max="23"
            step="1"
            value={simulationTime}
            onChange={(e) => onSimulationTimeChange(Number(e.target.value))}
            className="slider"
          />
        </div>
      </div>

      {/* Temperature indicators */}
      <div className="controls-grid">
        <div className="control-group">
          <label className="control-label">
            Surface Temperature
            <span className="control-value">{temperatureProfile.surface.toFixed(1)}°C</span>
          </label>
          <div className="info-box" style={{ margin: '0', fontSize: '0.9rem' }}>
            Most strongly affected by solar energy.
          </div>
        </div>

        <div className="control-group">
          <label className="control-label">
            Mixing Depth Temperature
            <span className="control-value">{temperatureProfile.mid.toFixed(1)}°C</span>
          </label>
          <div className="info-box" style={{ margin: '0', fontSize: '0.9rem' }}>
            Varies with wind mixing. Deeper mixing = cooler surface.
          </div>
        </div>

        <div className="control-group">
          <label className="control-label">
            Deep Water Temperature
            <span className="control-value">{temperatureProfile.deep.toFixed(1)}°C</span>
          </label>
          <div className="info-box" style={{ margin: '0', fontSize: '0.9rem' }}>
            Slowly warms when solar energy is high and sustained.
          </div>
        </div>
      </div>

      {/* Experiment suggestions */}
      <div style={{
        background: 'rgba(0, 88, 170, 0.1)',
        border: '1px solid var(--border-subtle)',
        padding: '1rem',
        borderRadius: '2px',
        marginTop: '1.5rem',
      }}>
        <p style={{
          margin: '0 0 0.5rem 0',
          fontSize: '0.9rem',
          color: 'var(--text-primary)',
          fontWeight: '500',
        }}>
          Try this: Increase solar energy to maximum, then notice what happens when you also increase wind mixing.
        </p>
        <p style={{
          margin: '0',
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          lineHeight: '1.5',
        }}>
          In the real ocean, high solar energy during calm conditions can create very warm surface temperatures, but sustained wind mixing redistributes that heat downward and prevents extreme warming.
        </p>
      </div>
    </section>
  );
};

export default HeatingSimulation;
