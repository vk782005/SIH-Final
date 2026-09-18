import React from "react";

const ChlorophyllRealDataConnection = ({ onLaunchGlobe }) => (
  <div className="chl-panel">
    <p className="chl-kicker">Section 08 · Real data</p>
    <h2 className="chl-title">Take the lesson to the real ocean</h2>
    <p className="chl-subtitle">
      Learning models explain the concepts. The OCEAN-X globe lets you move
      from those concepts to spatial ocean observations and investigate how
      marine conditions vary across the planet.
    </p>

    <div className="chl-grid chl-grid-3" style={{ marginTop: 24 }}>
      <div className="chl-card"><h3>Locate</h3><p>Choose a region of interest.</p></div>
      <div className="chl-card"><h3>Compare</h3><p>Explore spatial patterns in ocean parameters.</p></div>
      <div className="chl-card"><h3>Investigate</h3><p>Use the globe to connect observations with the concepts from this module.</p></div>
    </div>

    <div style={{ marginTop: 24 }}>
      <button className="chl-button" type="button" onClick={onLaunchGlobe}>
        Explore on OCEAN-X Globe →
      </button>
    </div>
  </div>
);

export default ChlorophyllRealDataConnection;
