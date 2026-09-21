import { useMemo } from "react";

const SalinityDensityLab = ({
  temperature,
  setTemperature,
  salinity,
  setSalinity,
}) => {

  const density = useMemo(() => {
    const baseDensity = 1024.5;

    const salinityEffect = (salinity - 35) * 0.75;
    const temperatureEffect = (20 - temperature) * 0.2;

    return baseDensity + salinityEffect + temperatureEffect;
  }, [temperature, salinity]);

  const densityLevel =
    density > 1026
      ? "HIGH DENSITY"
      : density > 1024.5
      ? "MODERATE DENSITY"
      : "LOW DENSITY";

  return (
    <div className="salinity-card density-lab">

      <div className="salinity-card-header">

        <div>
          <span className="salinity-section-label">
            PHYSICS LAB
          </span>

          <h2>Temperature + Salinity = Density</h2>

          <p>
            Change both variables and observe how the density
            of seawater responds.
          </p>
        </div>

        <span className="salinity-experiment-number">
          EXP / 02
        </span>

      </div>

      <div className="density-lab-grid">

        <div className="density-controls">

          <div className="density-slider">

            <div>
              <span>TEMPERATURE</span>
              <strong>{temperature}°C</strong>
            </div>

            <input
              type="range"
              min="-2"
              max="35"
              value={temperature}
              onChange={(e) =>
                setTemperature(Number(e.target.value))
              }
            />

          </div>

          <div className="density-slider">

            <div>
              <span>SALINITY</span>
              <strong>{salinity} PSU</strong>
            </div>

            <input
              type="range"
              min="30"
              max="42"
              step="0.5"
              value={salinity}
              onChange={(e) =>
                setSalinity(Number(e.target.value))
              }
            />

          </div>

          <div className="density-result">

            <span>ESTIMATED DENSITY</span>

            <strong>
              {density.toFixed(1)}
            </strong>

            <small>kg/m³</small>

            <div className="density-status">
              {densityLevel}
            </div>

          </div>

        </div>

        <div className="density-visual">

          <div
            className="density-water"
            style={{
              transform: `scaleY(${1 + (density - 1024) / 100})`,
            }}
          >

            <div className="density-particles">
              {Array.from({ length: 24 }).map((_, index) => (
                <span
                  key={index}
                  style={{
                    left: `${10 + ((index * 37) % 80)}%`,
                    top: `${8 + ((index * 53) % 82)}%`,
                    animationDelay: `${index * 0.1}s`,
                  }}
                />
              ))}
            </div>

            <div className="density-water-label">
              {densityLevel}
            </div>

          </div>

          <div className="density-arrow">
            ↓
          </div>

          <div className="density-bottom-label">
            GREATER DENSITY → GREATER SINKING TENDENCY
          </div>

        </div>

      </div>

    </div>
  );
};

export default SalinityDensityLab;