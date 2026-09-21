import { useRef, useEffect, useMemo } from "react";

const OceanExperiment = ({
  surfaceTemp,
  onSurfaceTempChange,
  deepTemp,
  onDeepTempChange,
  thermoclineDepth,
  onThermoclineDepthChange,
  windMixing,
  onWindMixingChange,
}) => {
  const canvasRef = useRef(null);

  // Calculate derived metrics
  const tempDifference = surfaceTemp - deepTemp;
  const stratification = tempDifference > 15 ? 'Strong' : tempDifference > 8 ? 'Moderate' : 'Weak';

  // Generate explanation of changes
  const getExplanation = useMemo(() => {
    const explanations = [];

    if (surfaceTemp > 25) {
      explanations.push('High surface temperature creates strong density differences with deep water.');
    }
    if (deepTemp > 10) {
      explanations.push('Warm deep water reduces the temperature gradient.');
    }
    if (tempDifference > 20) {
      explanations.push('Extreme temperature difference → strong stratification. Vertical mixing nearly impossible.');
    }
    if (windMixing > 0.6) {
      explanations.push('Strong wind mixing prevents thermal stratification from becoming established.');
    }
    if (thermoclineDepth < 100) {
      explanations.push('Shallow thermocline: Mixed layer is thin. Rapid transition to cold deep water.');
    }
    if (thermoclineDepth > 400) {
      explanations.push('Deep thermocline: Extended mixed layer. Gradual transition to deep water.');
    }

    if (explanations.length === 0) {
      explanations.push('Current ocean state is stable.');
    }

    return explanations;
  }, [surfaceTemp, deepTemp, tempDifference, windMixing, thermoclineDepth]);

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

    const padding = 50;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;
    const maxDepth = 2000;

    const scale = graphHeight / maxDepth;

    // Draw ocean layers
    // Surface layer
    const surfaceColor = `rgba(${Math.min(255, 200 + surfaceTemp * 2)}, ${Math.max(50, 107 - surfaceTemp * 2)}, 53, 0.15)`;
    ctx.fillStyle = surfaceColor;
    ctx.fillRect(padding, padding, graphWidth, thermoclineDepth * scale);

    // Thermocline
    const thermoclineColor = `rgba(0, ${184 + (surfaceTemp - deepTemp) * 3}, ${212 - Math.abs(surfaceTemp - deepTemp) * 2}, 0.2)`;
    ctx.fillStyle = thermoclineColor;
    ctx.fillRect(
      padding,
      padding + thermoclineDepth * scale,
      graphWidth,
      200 * scale
    );

    // Deep water
    const deepColor = `rgba(30, ${Math.min(138, 58 + deepTemp * 5)}, ${Math.min(200, 138 + deepTemp * 5)}, 0.1)`;
    ctx.fillStyle = deepColor;
    ctx.fillRect(
      padding,
      padding + (thermoclineDepth + 200) * scale,
      graphWidth,
      (maxDepth - thermoclineDepth - 200) * scale
    );

    // Draw temperature profile curve
    ctx.strokeStyle = 'var(--cyan-bright)';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const points = [];
    for (let depth = 0; depth <= maxDepth; depth += 100) {
      let temp;
      if (depth <= thermoclineDepth) {
        temp = surfaceTemp;
      } else if (depth <= thermoclineDepth + 200) {
        const ratio = (depth - thermoclineDepth) / 200;
        temp = surfaceTemp - ratio * (surfaceTemp - deepTemp);
      } else {
        temp = deepTemp;
      }

      const x = padding + (temp / 35) * graphWidth;
      const y = padding + depth * scale;

      points.push({ x, y, temp });

      if (depth === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();

    // Draw text labels
    ctx.fillStyle = 'var(--text-secondary)';
    ctx.font = '12px monospace';

    // Surface temperature label
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(`Surface: ${surfaceTemp.toFixed(1)}°C`, padding - 10, padding + 5);

    // Deep temperature label
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`Deep: ${deepTemp.toFixed(1)}°C`, padding - 10, padding + graphHeight - 5);

    // Thermocline indicator
    ctx.strokeStyle = 'var(--cyan-dim)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    const tcY = padding + thermoclineDepth * scale;
    ctx.beginPath();
    ctx.moveTo(padding, tcY);
    ctx.lineTo(padding + graphWidth, tcY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'var(--cyan-dim)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`Thermocline: ${thermoclineDepth}m`, padding + 10, tcY - 3);

    // Depth markers
    ctx.fillStyle = 'var(--text-muted)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    [0, 500, 1000, 1500, 2000].forEach((depth) => {
      const y = padding + depth * scale;
      ctx.fillText(`${depth}m`, padding - 5, y);
    });

    // Temperature scale at top
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = 'var(--text-muted)';

    for (let temp = 0; temp <= 35; temp += 10) {
      const x = padding + (temp / 35) * graphWidth;
      ctx.fillText(temp.toString(), x, padding - 5);
    }

    // Border
    ctx.strokeStyle = 'var(--border-color)';
    ctx.lineWidth = 1;
    ctx.strokeRect(padding, padding, graphWidth, graphHeight);
  }, [surfaceTemp, deepTemp, thermoclineDepth]);

  return (
    <section>
      <div className="section-header">
        <div className="section-label">Section 9</div>
        <h2 className="section-title">Change the Ocean</h2>
      </div>

      <p className="section-subtitle">
        Adjust multiple parameters and observe how the ocean structure responds. Every change creates a different thermal structure with different biological and physical consequences.
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
            Surface Temperature
            <span className="control-value">{surfaceTemp.toFixed(1)}°C</span>
          </label>
          <input
            type="range"
            min="10"
            max="35"
            step="0.5"
            value={surfaceTemp}
            onChange={(e) => onSurfaceTempChange(Number(e.target.value))}
            className="slider"
          />
        </div>

        <div className="control-group">
          <label className="control-label">
            Deep Ocean Temperature
            <span className="control-value">{deepTemp.toFixed(1)}°C</span>
          </label>
          <input
            type="range"
            min="0"
            max="15"
            step="0.5"
            value={deepTemp}
            onChange={(e) => onDeepTempChange(Number(e.target.value))}
            className="slider"
          />
        </div>

        <div className="control-group">
          <label className="control-label">
            Thermocline Depth
            <span className="control-value">{thermoclineDepth} m</span>
          </label>
          <input
            type="range"
            min="50"
            max="500"
            step="25"
            value={thermoclineDepth}
            onChange={(e) => onThermoclineDepthChange(Number(e.target.value))}
            className="slider"
          />
        </div>

        <div className="control-group">
          <label className="control-label">
            Wind Mixing
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
        </div>
      </div>

      {/* Metrics */}
      <div className="controls-grid">
        <div className="control-group">
          <label className="control-label">
            Temperature Difference
            <span className="control-value">{tempDifference.toFixed(1)}°C</span>
          </label>
          <div className="info-box" style={{ margin: '0', fontSize: '0.9rem' }}>
            The steeper the difference, the more isolated the layers.
          </div>
        </div>

        <div className="control-group">
          <label className="control-label">
            Stratification
            <span className="control-value">{stratification}</span>
          </label>
          <div className="info-box" style={{ margin: '0', fontSize: '0.9rem' }}>
            {stratification === 'Strong'
              ? 'Layers are well-separated. Little vertical mixing.'
              : stratification === 'Moderate'
              ? 'Layers are partially separated. Some mixing possible.'
              : 'Layers are weakly separated. Strong mixing occurs.'}
          </div>
        </div>
      </div>

      {/* What changed section */}
      <div style={{
        background: 'rgba(0, 88, 170, 0.1)',
        border: '1px solid var(--border-subtle)',
        padding: '1rem',
        borderRadius: '2px',
        marginTop: '1.5rem',
      }}>
        <p style={{
          margin: '0 0 0.75rem 0',
          fontSize: '0.9rem',
          color: 'var(--cyan-bright)',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          What Changed?
        </p>
        <ul style={{
          margin: '0',
          paddingLeft: '1.5rem',
          fontSize: '0.9rem',
          color: 'var(--text-primary)',
          lineHeight: '1.7',
        }}>
          {getExplanation.map((exp, i) => (
            <li key={i}>{exp}</li>
          ))}
        </ul>
      </div>

      {/* Try these scenarios */}
      <div style={{
        marginTop: '1.5rem',
        padding: '1rem',
        background: 'rgba(0, 88, 170, 0.05)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '2px',
      }}>
        <p style={{
          margin: '0 0 0.75rem 0',
          fontSize: '0.9rem',
          color: 'var(--text-primary)',
          fontWeight: '600',
        }}>
          Try These Scenarios:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem' }}>
          <button
            className="button-primary"
            onClick={() => {
              onSurfaceTempChange(28);
              onDeepTempChange(3);
              onThermoclineDepthChange(150);
              onWindMixingChange(0.1);
            }}
            style={{ fontSize: '0.85rem' }}
          >
            Tropical
          </button>
          <button
            className="button-primary"
            onClick={() => {
              onSurfaceTempChange(15);
              onDeepTempChange(5);
              onThermoclineDepthChange(300);
              onWindMixingChange(0.5);
            }}
            style={{ fontSize: '0.85rem' }}
          >
            Temperate
          </button>
          <button
            className="button-primary"
            onClick={() => {
              onSurfaceTempChange(2);
              onDeepTempChange(0);
              onThermoclineDepthChange(50);
              onWindMixingChange(0.8);
            }}
            style={{ fontSize: '0.85rem' }}
          >
            Polar
          </button>
          <button
            className="button-primary"
            onClick={() => {
              onSurfaceTempChange(22);
              onDeepTempChange(8);
              onThermoclineDepthChange(200);
              onWindMixingChange(0.3);
            }}
            style={{ fontSize: '0.85rem' }}
          >
            Reset
          </button>
        </div>
      </div>
    </section>
  );
};

export default OceanExperiment;
