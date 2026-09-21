import { useMemo } from "react";

const ChlorophyllBloomSimulator = ({
  light, onLightChange,
  nutrients, onNutrientsChange,
  mixing, onMixingChange,
  temperature, onTemperatureChange
}) => {
  const bloom = useMemo(() => {
    const lightScore = 1 - Math.abs(light - 72) / 100;
    const tempScore = 1 - Math.min(1, Math.abs(temperature - 18) / 25);
    const nutrientScore = nutrients / 100;
    const mixingScore = 0.45 + 0.55 * (mixing / 100);

    return Math.max(
      0,
      Math.min(
        100,
        Math.round(100 * lightScore * tempScore * (0.35 + 0.65 * nutrientScore) * mixingScore)
      )
    );
  }, [light, nutrients, mixing, temperature]);

  const bars = Array.from({ length: 22 }, (_, i) => {
    const wave = 0.7 + 0.3 * Math.sin(i * 0.9);
    return Math.max(5, bloom * wave * (0.65 + i / 70));
  });

  return (
    <div className="chl-panel">
      <p className="chl-kicker">Section 04 · Simulation</p>
      <h2 className="chl-title">Can you trigger a bloom?</h2>
      <p className="chl-subtitle">
        Experiment with the environmental controls. This is a teaching model,
        not a predictive ecological model.
      </p>

      <div className="chl-grid chl-grid-2" style={{ marginTop: 26 }}>
        <div>
          {[
            ["Light", light, onLightChange, "%"],
            ["Nutrients", nutrients, onNutrientsChange, "%"],
            ["Mixing", mixing, onMixingChange, "%"],
            ["Temperature", temperature, onTemperatureChange, "°C"]
          ].map(([label, value, setter, unit]) => (
            <div className="chl-control" key={label}>
              <div className="chl-control-row">
                <span>{label}</span>
                <strong>{value}{unit}</strong>
              </div>
              <input
                className="chl-range"
                type="range"
                min={label === "Temperature" ? 0 : 0}
                max={label === "Temperature" ? 35 : 100}
                value={value}
                onChange={(e) => setter(Number(e.target.value))}
              />
            </div>
          ))}
        </div>

        <div>
          <div className="chl-stat">
            <div className="chl-stat-value">{bloom}%</div>
            <div className="chl-stat-label">Bloom intensity</div>
          </div>

          <div className="chl-bloom" style={{ marginTop: 16 }}>
            {bars.map((height, i) => (
              <div
                key={i}
                className="chl-bloom-bar"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChlorophyllBloomSimulator;
