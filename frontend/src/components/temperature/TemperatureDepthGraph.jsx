import { useRef, useEffect, useState } from "react";

const TemperatureDepthGraph = ({
  selectedDepth,
  onDepthChange,
  getTemperatureAtDepth,
  getLayerAtDepth,
}) => {
  const canvasRef = useRef(null);
  const [hoveredDepth, setHoveredDepth] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

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

    // Clear canvas
    ctx.fillStyle = '#0a1428';
    ctx.fillRect(0, 0, width, height);

    // Configuration
    const padding = 60;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;
    const maxDepth = 4000;
    const maxTemp = 25;

    const tempToX = (temp) => padding + (temp / maxTemp) * graphWidth;
    const depthToY = (depth) => padding + (depth / maxDepth) * graphHeight;

    // Draw grid
    ctx.strokeStyle = 'rgba(0, 136, 170, 0.1)';
    ctx.lineWidth = 1;

    // Vertical grid lines (temperature)
    for (let temp = 0; temp <= 25; temp += 5) {
      const x = tempToX(temp);
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, padding + graphHeight);
      ctx.stroke();
    }

    // Horizontal grid lines (depth)
    for (let depth = 0; depth <= 4000; depth += 500) {
      const y = depthToY(depth);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + graphWidth, y);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = 'var(--border-color)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, padding + graphHeight);
    ctx.lineTo(padding + graphWidth, padding + graphHeight);
    ctx.stroke();

    // Draw axis labels - Temperature (top)
    ctx.fillStyle = 'var(--text-secondary)';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let temp = 0; temp <= 25; temp += 5) {
      const x = tempToX(temp);
      ctx.fillText(temp.toString(), x, padding - 20);
    }

    // Temperature axis label
    ctx.fillStyle = 'var(--text-muted)';
    ctx.textAlign = 'center';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('Temperature (°C)', padding + graphWidth / 2, 15);

    // Draw axis labels - Depth (left)
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.font = '12px monospace';
    ctx.fillStyle = 'var(--text-secondary)';

    for (let depth = 0; depth <= 4000; depth += 500) {
      const y = depthToY(depth);
      ctx.fillText(depth.toString(), padding - 15, y);
    }

    // Depth axis label
    ctx.save();
    ctx.translate(15, padding + graphHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.font = 'bold 13px monospace';
    ctx.fillStyle = 'var(--text-muted)';
    ctx.fillText('Depth (m)', 0, 0);
    ctx.restore();

    // Draw gradient fill under curve
    ctx.fillStyle = 'rgba(0, 216, 255, 0.15)';
    ctx.beginPath();
    ctx.moveTo(tempToX(profilePoints[0].temp), depthToY(profilePoints[0].depth));

    for (let i = 1; i < profilePoints.length; i++) {
      const point = profilePoints[i];
      ctx.lineTo(tempToX(point.temp), depthToY(point.depth));
    }

    // Draw back to surface at x=0
    ctx.lineTo(tempToX(0), depthToY(maxDepth));
    ctx.lineTo(tempToX(0), depthToY(0));
    ctx.closePath();
    ctx.fill();

    // Draw temperature profile curve
    ctx.strokeStyle = 'var(--cyan-bright)';
    ctx.lineWidth = 3;
    ctx.beginPath();

    for (let i = 0; i < profilePoints.length; i++) {
      const point = profilePoints[i];
      const x = tempToX(point.temp);
      const y = depthToY(point.depth);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Draw selected depth marker
    const currentTemp = getTemperatureAtDepth(selectedDepth);
    const markerX = tempToX(currentTemp);
    const markerY = depthToY(selectedDepth);

    // Highlight point
    ctx.fillStyle = 'var(--temp-warm)';
    ctx.beginPath();
    ctx.arc(markerX, markerY, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'var(--temp-warm)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(markerX, markerY, 10, 0, Math.PI * 2);
    ctx.stroke();

    // Hover point (if hovering)
    if (hoveredDepth !== null) {
      const hoverTemp = getTemperatureAtDepth(hoveredDepth);
      const hoverX = tempToX(hoverTemp);
      const hoverY = depthToY(hoveredDepth);

      ctx.fillStyle = 'rgba(0, 216, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(hoverX, hoverY, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [selectedDepth, hoveredDepth, getTemperatureAtDepth]);

  const handleCanvasInteraction = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const y = e.clientY - rect.top;

    const padding = 60;
    const graphHeight = canvas.offsetHeight - padding * 2;
    const maxDepth = 4000;

    // Convert y position to depth
    const relativeY = y - padding;
    if (relativeY >= 0 && relativeY <= graphHeight) {
      const newDepth = Math.round((relativeY / graphHeight) * maxDepth);
      onDepthChange(Math.max(0, Math.min(maxDepth, newDepth)));

      if (e.type === 'mousedown' || e.type === 'touchstart') {
        setIsDragging(true);
      }
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      handleCanvasInteraction(e);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, onDepthChange]);

  const handleCanvasMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const y = e.clientY - rect.top;

    const padding = 60;
    const graphHeight = canvas.offsetHeight - padding * 2;
    const maxDepth = 4000;

    const relativeY = y - padding;
    if (relativeY >= 0 && relativeY <= graphHeight) {
      const depth = Math.round((relativeY / graphHeight) * maxDepth);
      setHoveredDepth(Math.max(0, Math.min(maxDepth, depth)));
      canvas.style.cursor = 'grab';
    } else {
      setHoveredDepth(null);
      canvas.style.cursor = 'default';
    }
  };

  const handleCanvasMouseLeave = () => {
    setHoveredDepth(null);
  };

  return (
    <section>
      <div className="section-header">
        <div className="section-label">Section 3</div>
        <h2 className="section-title">Temperature Profile Graph</h2>
      </div>

      <p className="section-subtitle">
        Drag vertically on the graph to explore temperature at different depths. The graph shows a realistic ocean temperature profile from surface to 4000 meters.
      </p>

      <div className="visualization-container">
        <canvas
          ref={canvasRef}
          onMouseDown={handleCanvasInteraction}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={handleCanvasMouseLeave}
          onTouchStart={handleCanvasInteraction}
          onTouchMove={handleCanvasInteraction}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            minHeight: '350px',
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
          }}
        />
      </div>

      {/* Display current values */}
      <div className="controls-grid">
        <div className="control-group">
          <label className="control-label">
            Current Depth
            <span className="control-value">{selectedDepth} m</span>
          </label>
          <div className="info-box" style={{ margin: '0', fontSize: '0.9rem' }}>
            {getLayerAtDepth(selectedDepth)}
          </div>
        </div>

        <div className="control-group">
          <label className="control-label">
            Temperature
            <span className="control-value">{getTemperatureAtDepth(selectedDepth).toFixed(2)}°C</span>
          </label>
          <div className="info-box" style={{ margin: '0', fontSize: '0.9rem' }}>
            {hoveredDepth !== null ? (
              <>Hovering: {hoveredDepth}m, {getTemperatureAtDepth(hoveredDepth).toFixed(2)}°C</>
            ) : (
              'Drag on graph to explore'
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TemperatureDepthGraph;
