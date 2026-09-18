import React, { useState } from "react";

const regions = {
  Coastal: {
    value: "High",
    text: "Coastal waters can receive nutrients from land, rivers and sediments, making them productive in many locations."
  },
  Upwelling: {
    value: "Very High",
    text: "Upwelling can transport nutrient-rich deeper water toward the sunlit surface and support phytoplankton growth."
  },
  Gyres: {
    value: "Low",
    text: "Large subtropical gyres are often strongly stratified and nutrient-poor near the surface."
  },
  Polar: {
    value: "Seasonal",
    text: "Polar waters can experience strong seasonal changes in light, ice cover, mixing and biological activity."
  }
};

const ChlorophyllDistribution = () => {
  const [selected, setSelected] = useState("Coastal");
  const current = regions[selected];

  return (
    <div className="chl-panel">
      <p className="chl-kicker">Section 02</p>
      <h2 className="chl-title">Where is chlorophyll concentrated?</h2>
      <p className="chl-subtitle">
        Chlorophyll is not distributed uniformly across the ocean. Local
        physical and biological conditions create strong spatial patterns.
      </p>

      <div className="chl-grid chl-grid-2" style={{ marginTop: 26 }}>
        <div>
          <div className="chl-pill-row">
            {Object.keys(regions).map((region) => (
              <button
                key={region}
                type="button"
                className={`chl-pill ${selected === region ? "active" : ""}`}
                onClick={() => setSelected(region)}
              >
                {region}
              </button>
            ))}
          </div>

          <div className="chl-card" style={{ marginTop: 18 }}>
            <p className="chl-kicker">Selected region</p>
            <h3 style={{ fontSize: 25 }}>{selected}</h3>
            <p>{current.text}</p>
            <div className="chl-stat" style={{ marginTop: 18 }}>
              <div className="chl-stat-value">{current.value}</div>
              <div className="chl-stat-label">Typical conceptual chlorophyll signal</div>
            </div>
          </div>
        </div>

        <div className="chl-card">
          <p className="chl-kicker">Pattern to remember</p>
          <div className="chl-grid chl-grid-2">
            <div className="chl-stat"><div className="chl-stat-value">↑</div><div className="chl-stat-label">Nutrients can increase productivity</div></div>
            <div className="chl-stat"><div className="chl-stat-value">↓</div><div className="chl-stat-label">Light limits growth at depth</div></div>
            <div className="chl-stat"><div className="chl-stat-value">↕</div><div className="chl-stat-label">Mixing redistributes nutrients</div></div>
            <div className="chl-stat"><div className="chl-stat-value">↻</div><div className="chl-stat-label">Seasons alter conditions</div></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChlorophyllDistribution;
