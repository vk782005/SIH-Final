import { useRef, useEffect } from "react";

const CirculationVisualization = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const timeRef = useRef(0);

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

    const animate = () => {
      timeRef.current += 0.01;

      // Clear canvas
      ctx.fillStyle = '#0a1428';
      ctx.fillRect(0, 0, width, height);

      const padding = 40;
      const graphWidth = width - padding * 2;
      const graphHeight = height - padding * 2;

      // Draw ocean basin outline
      ctx.strokeStyle = 'var(--border-color)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(padding + 20, padding);
      ctx.lineTo(padding + 20, padding + graphHeight);
      ctx.lineTo(padding + graphWidth - 20, padding + graphHeight);
      ctx.lineTo(padding + graphWidth - 20, padding);
      ctx.closePath();
      ctx.stroke();

      // Draw sun on the left (tropical)
      ctx.fillStyle = 'rgba(255, 107, 53, 0.6)';
      ctx.beginPath();
      ctx.arc(padding + 40, padding - 10, 15, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'var(--text-secondary)';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('TROPICAL', padding + 40, height - 20);

      // Draw ice on the right (polar)
      ctx.fillStyle = 'rgba(30, 58, 138, 0.4)';
      ctx.beginPath();
      ctx.moveTo(padding + graphWidth - 40, padding - 10);
      ctx.lineTo(padding + graphWidth - 50, padding + 10);
      ctx.lineTo(padding + graphWidth - 30, padding + 10);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(padding + graphWidth - 40, padding + 15);
      ctx.lineTo(padding + graphWidth - 55, padding + 30);
      ctx.lineTo(padding + graphWidth - 25, padding + 30);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'var(--text-secondary)';
      ctx.textAlign = 'center';
      ctx.fillText('POLAR', padding + graphWidth - 40, height - 20);

      // Draw warm water layer (surface)
      ctx.fillStyle = 'rgba(255, 107, 53, 0.15)';
      ctx.fillRect(
        padding + 20,
        padding,
        graphWidth - 40,
        graphHeight * 0.3
      );

      // Draw cold water layer (deep)
      ctx.fillStyle = 'rgba(30, 58, 138, 0.15)';
      ctx.fillRect(
        padding + 20,
        padding + graphHeight * 0.3,
        graphWidth - 40,
        graphHeight * 0.7
      );

      // Labels
      ctx.fillStyle = 'var(--text-muted)';
      ctx.font = '11px monospace';
      ctx.textAlign = 'left';

      ctx.fillText('Warm Water', padding + 30, padding + 15);
      ctx.fillText('(Low Density)', padding + 30, padding + 30);

      ctx.fillText('Cold Water', padding + 30, padding + graphHeight * 0.3 + 15);
      ctx.fillText('(High Density)', padding + 30, padding + graphHeight * 0.3 + 30);

      // Draw circulation patterns with particles
      const particleCount = 12;

      for (let i = 0; i < particleCount; i++) {
        const progress = (timeRef.current + (i / particleCount)) % 1;

        // Upper circulation (surface, moving right to left)
        if (i < particleCount / 2) {
          const x = padding + graphWidth - 40 - progress * (graphWidth - 60) + Math.sin(timeRef.current * 2 + i) * 8;
          const y = padding + graphHeight * 0.15 + Math.sin(progress * Math.PI) * 20;

          ctx.fillStyle = `rgba(255, 107, 53, ${0.3 + Math.sin(progress * Math.PI) * 0.3})`;
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Lower circulation (deep, moving left to right)
          const x = padding + 40 + progress * (graphWidth - 60) + Math.sin(timeRef.current * 2 + i) * 8;
          const y = padding + graphHeight * 0.6 + Math.sin(progress * Math.PI) * 30;

          ctx.fillStyle = `rgba(30, 58, 138, ${0.3 + Math.sin(progress * Math.PI) * 0.3})`;
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw circulation arrows
      // Surface flow (right to left - warm water moving poleward)
      ctx.strokeStyle = 'rgba(255, 107, 53, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);

      ctx.beginPath();
      ctx.bezierCurveTo(
        padding + graphWidth - 30,
        padding + graphHeight * 0.15,
        padding + graphWidth / 2,
        padding + graphHeight * 0.05,
        padding + 50,
        padding + graphHeight * 0.15
      );
      ctx.stroke();

      // Deep flow (left to right - cold water moving equatorward)
      ctx.strokeStyle = 'rgba(30, 58, 138, 0.4)';
      ctx.beginPath();
      ctx.bezierCurveTo(
        padding + 50,
        padding + graphHeight * 0.6,
        padding + graphWidth / 2,
        padding + graphHeight * 0.8,
        padding + graphWidth - 30,
        padding + graphHeight * 0.6
      );
      ctx.stroke();

      // Upwelling on the left
      ctx.strokeStyle = 'rgba(0, 216, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.moveTo(padding + 50, padding + graphHeight * 0.5);
      ctx.lineTo(padding + 50, padding + graphHeight * 0.2);
      ctx.stroke();

      // Arrow for upwelling
      ctx.beginPath();
      ctx.moveTo(padding + 45, padding + graphHeight * 0.25);
      ctx.lineTo(padding + 50, padding + graphHeight * 0.2);
      ctx.lineTo(padding + 55, padding + graphHeight * 0.25);
      ctx.stroke();

      ctx.fillStyle = 'var(--cyan-bright)';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Upwelling', padding + 50, padding + graphHeight * 0.15 - 15);

      // Title and legend
      ctx.fillStyle = 'var(--text-primary)';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Thermohaline Circulation', padding + graphWidth / 2 + 20, padding - 15);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <section>
      <div className="section-header">
        <div className="section-label">Section 8</div>
        <h2 className="section-title">Temperature & Ocean Circulation</h2>
      </div>

      <p className="section-subtitle">
        Temperature differences create density variations that drive ocean circulation. Warm surface water in tropical regions is less dense and flows toward polar regions. Cold, dense water in polar regions sinks and flows toward the equator at depth. This creates a global circulation pattern called the thermohaline circulation.
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

      {/* Key mechanisms */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
        <div className="info-box">
          <div className="info-box-label">Tropical Surface</div>
          <p style={{ margin: '0', fontSize: '0.9rem', lineHeight: '1.5' }}>
            Warm water (25–30°C) has low density. It spreads poleward at the surface and creates the major ocean gyres and currents like the Gulf Stream.
          </p>
        </div>

        <div className="info-box">
          <div className="info-box-label">Polar Deep</div>
          <p style={{ margin: '0', fontSize: '0.9rem', lineHeight: '1.5' }}>
            Cold water (0–5°C) has high density. It sinks and flows equatorward at depth, forming the abyssal circulation that turns over the entire ocean every ~1000 years.
          </p>
        </div>

        <div className="info-box">
          <div className="info-box-label">Multiple Drivers</div>
          <p style={{ margin: '0', fontSize: '0.9rem', lineHeight: '1.5' }}>
            While temperature is a major driver, real ocean circulation is also controlled by wind, salinity, Earth's rotation, and geography. This is a simplified view.
          </p>
        </div>
      </div>

      {/* Important factors */}
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
          Other factors that influence ocean circulation:
        </p>
        <ul style={{
          margin: '0',
          paddingLeft: '1.5rem',
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          lineHeight: '1.6',
        }}>
          <li><strong>Salinity:</strong> Evaporation increases salt content, making water denser and more likely to sink.</li>
          <li><strong>Wind:</strong> Surface winds drive major ocean gyres and upwelling zones.</li>
          <li><strong>Earth's Rotation:</strong> The Coriolis effect deflects moving water and shapes current patterns.</li>
          <li><strong>Geography:</strong> Ocean basins, islands, and continental boundaries direct and constrain flows.</li>
          <li><strong>Pressure:</strong> Deep water pressure affects water properties and circulation.</li>
        </ul>
      </div>
    </section>
  );
};

export default CirculationVisualization;
