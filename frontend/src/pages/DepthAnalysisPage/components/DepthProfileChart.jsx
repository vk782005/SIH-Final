import { useState } from "react";
import { DEPTH_LIMIT, PARAMETER_CONFIG } from "../data/depthDemoData";

const WIDTH = 720;
const HEIGHT = 310;
const PAD = { top: 24, right: 28, bottom: 42, left: 58 };

const DepthProfileChart = ({ parameter, depth, setDepth }) => {
  const [hoverDepth, setHoverDepth] = useState(null);
  const config = PARAMETER_CONFIG[parameter];

  const plotWidth = WIDTH - PAD.left - PAD.right;
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;

  const yForDepth = (value) => PAD.top + (value / DEPTH_LIMIT) * plotHeight;
  const xForValue = (value) => {
    const [min, max] = config.range;
    return PAD.left + ((value - min) / (max - min)) * plotWidth;
  };

  const points = config.sample
    .map(([d, value]) => `${xForValue(value)},${yForDepth(d)}`)
    .join(" ");

  const activeDepth = hoverDepth ?? depth;
  const activeValue = config.sample.length
    ? (() => {
        for (let i = 1; i < config.sample.length; i += 1) {
          const [d1, v1] = config.sample[i - 1];
          const [d2, v2] = config.sample[i];
          if (activeDepth <= d2) {
            const t = (activeDepth - d1) / (d2 - d1);
            return v1 + (v2 - v1) * t;
          }
        }
        return config.sample[config.sample.length - 1][1];
      })()
    : 0;

  const onPlotPointer = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const relativeY = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    setDepth(Math.round((relativeY * DEPTH_LIMIT) / 5) * 5);
  };

  return (
    <section className="da-panel da-profile-panel">
      <div className="da-panel-header">
        <div>
          <span className="da-eyebrow">VERTICAL PROFILE</span>
          <h2>{config.label} vs depth</h2>
        </div>
        <div className={`da-live-value ${config.accentClass}`}>
          <span>{activeDepth.toLocaleString()} m</span>
          <strong>{activeValue.toFixed(config.decimals)} {config.unit}</strong>
        </div>
      </div>

      <div
        className="da-chart-shell"
        onPointerMove={onPlotPointer}
        onPointerLeave={() => setHoverDepth(null)}
        onPointerEnter={() => setHoverDepth(depth)}
      >
        <svg
          className="da-profile-svg"
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label={`${config.label} vertical profile`}
        >
          <defs>
            <linearGradient id={`profileFill-${parameter}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" />
              <stop offset="100%" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0, 300, 600, 900, 1200].map((tick) => (
            <g key={tick}>
              <line
                x1={PAD.left}
                x2={WIDTH - PAD.right}
                y1={yForDepth(tick)}
                y2={yForDepth(tick)}
                className="da-grid-line"
              />
              <text x={PAD.left - 12} y={yForDepth(tick) + 4} textAnchor="end" className="da-axis-text">
                {tick}m
              </text>
            </g>
          ))}

          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
            const value = config.range[0] + (config.range[1] - config.range[0]) * fraction;
            return (
              <text
                key={fraction}
                x={PAD.left + plotWidth * fraction}
                y={HEIGHT - 12}
                textAnchor="middle"
                className="da-axis-text"
              >
                {value.toFixed(config.decimals)}
              </text>
            );
          })}

          <polyline
            points={points}
            className={`da-profile-line ${config.accentClass}`}
          />

          <line
            x1={PAD.left}
            x2={WIDTH - PAD.right}
            y1={yForDepth(activeDepth)}
            y2={yForDepth(activeDepth)}
            className={`da-cursor-line ${config.accentClass}`}
          />

          <circle
            cx={xForValue(activeValue)}
            cy={yForDepth(activeDepth)}
            r="7"
            className={`da-profile-dot ${config.accentClass}`}
          />

          <text
            x={Math.min(WIDTH - PAD.right - 4, xForValue(activeValue) + 14)}
            y={yForDepth(activeDepth) - 10}
            className="da-point-label"
          >
            {activeValue.toFixed(config.decimals)} {config.unit}
          </text>
        </svg>

        <div className="da-chart-hint">Click or drag across the profile to move through depth</div>
      </div>
    </section>
  );
};

export default DepthProfileChart;
