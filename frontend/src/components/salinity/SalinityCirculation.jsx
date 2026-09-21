
const SalinityCirculation = ({
  temperature,
  salinity,
}) => {

  const densityScore =
    salinity * 1.5 - temperature * 0.25;

  const sinking =
    densityScore > 46 ? "STRONG" :
    densityScore > 43 ? "MODERATE" :
    "WEAK";

  return (
    <div className="salinity-card circulation-card">

      <div className="salinity-card-header">

        <div>
          <span className="salinity-section-label">
            OCEAN DYNAMICS
          </span>

          <h2>Salinity helps drive circulation</h2>

          <p>
            Differences in temperature and salinity create
            density differences between water masses.
          </p>
        </div>

        <span className="salinity-experiment-number">
          EXP / 04
        </span>

      </div>

      <div className="circulation-grid">

        <div className="circulation-visual">

          <div className="circulation-ocean">

            <div className="circulation-current current-one">
              ↓
            </div>

            <div className="circulation-current current-two">
              →
            </div>

            <div className="circulation-current current-three">
              ↑
            </div>

            <div className="circulation-current current-four">
              ←
            </div>

            <div className="circulation-label surface-label">
              SURFACE WATER
            </div>

            <div className="circulation-label deep-label">
              DEEP WATER
            </div>

          </div>

        </div>

        <div className="circulation-info">

          <div className="circulation-variable">

            <span>TEMPERATURE</span>

            <strong>{temperature}°C</strong>

          </div>

          <div className="circulation-variable">

            <span>SALINITY</span>

            <strong>{salinity} PSU</strong>

          </div>

          <div className="circulation-variable">

            <span>DENSITY EFFECT</span>

            <strong>{sinking}</strong>

          </div>

          <div className="circulation-explanation">

            <span>WHY IT MATTERS</span>

            <p>
              Cold and relatively salty water tends to be denser.
              When sufficiently dense water sinks, it contributes
              to large-scale ocean circulation.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
};

export default SalinityCirculation;