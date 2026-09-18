import React from "react";

const takeaways = [
  ["Chlorophyll is a pigment", "It is used by photosynthetic organisms to capture light energy."],
  ["Phytoplankton matter", "They are microscopic producers that support many marine food webs."],
  ["Light matters", "Photosynthesis becomes increasingly light-limited as depth increases."],
  ["Nutrients matter", "Nitrogen, phosphorus and other nutrients can control phytoplankton growth."],
  ["Mixing matters", "Vertical mixing can redistribute nutrients and influence surface productivity."],
  ["Upwelling matters", "Upwelling can deliver nutrient-rich deeper water to the sunlit surface."],
  ["Seasons matter", "Changes in light, mixing and stratification can create seasonal productivity patterns."],
  ["Chlorophyll is an indicator", "Chlorophyll observations help scientists investigate biological productivity."]
];

const ChlorophyllTakeaways = () => (
  <div className="chl-panel">
    <p className="chl-kicker">Section 09 · What you should know</p>
    <h2 className="chl-title">Key takeaways</h2>
    <p className="chl-subtitle">
      These are the ideas to carry with you when you explore real ocean data.
    </p>

    <div className="chl-grid chl-grid-2" style={{ marginTop: 25 }}>
      {takeaways.map(([title, text], index) => (
        <article className="chl-card" key={title}>
          <p className="chl-kicker">0{index + 1}</p>
          <h3>{title}</h3>
          <p>{text}</p>
        </article>
      ))}
    </div>

    <div className="chl-card" style={{ marginTop: 20 }}>
      <p className="chl-kicker">Reflect</p>
      <h3>Think like an ocean scientist</h3>
      <p>
        If you found a region with unusually high chlorophyll, what would you
        investigate next: nutrient supply, mixing, season, temperature,
        currents, or depth? Use the OCEAN-X globe to form and test your own
        hypotheses.
      </p>
    </div>

    <div style={{ textAlign: "center", marginTop: 28 }}>
      <p className="chl-subtitle" style={{ margin: "0 auto 15px" }}>
        You've completed the Ocean Chlorophyll learning module.
      </p>
      <p style={{ color: "#647e8d", fontSize: 12 }}>
        Continue exploring Salinity, Ocean Currents and the other OCEAN-X learning modules.
      </p>
    </div>
  </div>
);

export default ChlorophyllTakeaways;
