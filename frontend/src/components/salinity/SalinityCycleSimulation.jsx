import React, { useMemo } from "react";

const SalinityCycleSimulation = ({
  evaporation,
  setEvaporation,
  rainfall,
  setRainfall,
  freshwater,
  setFreshwater,
}) => {

  const simulatedSalinity = useMemo(() => {
    let value = 35;

    value += (evaporation - 50) * 0.035;
    value -= (rainfall - 30) * 0.025;
    value -= (freshwater - 20) * 0.02;

    return Math.max(28, Math.min(42, value));
  }, [evaporation, rainfall, freshwater]);

  return (
    <div className="salinity-card cycle-card">

      <div className="salinity-card-header">

        <div>
          <span className="salinity-section-label">
            EARTH SYSTEM SIMULATION
          </span>

          <h2>Change the water cycle</h2>

          <p>
            Experiment with the processes that control surface salinity.
          </p>
        </div>

        <span className="salinity-experiment-number">
          EXP / 03
        </span>

      </div>

      <div className="cycle-grid">

        <div className="cycle-controls">

          <div className="cycle-control">

            <div>
              <span>EVAPORATION</span>
              <strong>{evaporation}%</strong>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={evaporation}
              onChange={(e) =>
                setEvaporation(Number(e.target.value))
              }
            />

            <small>
              More evaporation → higher salinity
            </small>

          </div>

          <div className="cycle-control">

            <div>
              <span>RAINFALL</span>
              <strong>{rainfall}%</strong>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={rainfall}
              onChange={(e) =>
                setRainfall(Number(e.target.value))
              }
            />

            <small>
              More rain → lower surface salinity
            </small>

          </div>

          <div className="cycle-control">

            <div>
              <span>FRESHWATER INPUT</span>
              <strong>{freshwater}%</strong>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={freshwater}
              onChange={(e) =>
                setFreshwater(Number(e.target.value))
              }
            />

            <small>
              Rivers and melting ice add freshwater
            </small>

          </div>

        </div>

        <div className="cycle-visual">

          <div className="cycle-atmosphere">

            <span className="rain-particle p1" />
            <span className="rain-particle p2" />
            <span className="rain-particle p3" />

            <div className="cycle-cloud">
              ☁
            </div>

            <div className="evaporation-particles">
              ↑ ↑ ↑ ↑
            </div>

          </div>

          <div className="cycle-ocean">

            <div className="cycle-surface" />

            <div className="cycle-salt-particles">
              {Array.from({ length: 30 }).map((_, index) => (
                <span
                  key={index}
                  style={{
                    left: `${(index * 31) % 95}%`,
                    top: `${20 + ((index * 47) % 65)}%`,
                  }}
                />
              ))}
            </div>

            <div className="cycle-ocean-label">
              SIMULATED OCEAN
            </div>

          </div>

          <div className="cycle-result">

            <span>SIMULATED SURFACE SALINITY</span>

            <strong>
              {simulatedSalinity.toFixed(1)} PSU
            </strong>

          </div>

        </div>

      </div>

    </div>
  );
};

export default SalinityCycleSimulation;