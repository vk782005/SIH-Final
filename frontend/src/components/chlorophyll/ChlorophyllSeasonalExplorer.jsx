
const data = {
  Spring: {
    light: "Increasing",
    nutrients: "Often available",
    activity: "Bloom potential",
    text: "Increasing sunlight combined with nutrients can support strong seasonal productivity in many regions."
  },
  Summer: {
    light: "High",
    nutrients: "Can become limiting",
    activity: "Variable",
    text: "Longer days provide light, but surface warming and stratification can reduce nutrient supply from below."
  },
  Autumn: {
    light: "Decreasing",
    nutrients: "Increasing mixing",
    activity: "Possible rebound",
    text: "Cooling and stronger mixing can return nutrients toward the surface while light begins to decline."
  },
  Winter: {
    light: "Low",
    nutrients: "Often replenished",
    activity: "Light-limited",
    text: "Deep mixing can replenish nutrients, but short days and low light often limit photosynthesis."
  }
};

const ChlorophyllSeasonalExplorer = ({ season, onSeasonChange }) => {
  const current = data[season];

  return (
    <div className="chl-panel">
      <p className="chl-kicker">Section 05 · Seasonal cycle</p>
      <h2 className="chl-title">Chlorophyll changes with the seasons</h2>
      <p className="chl-subtitle">
        Seasonal cycles are controlled by the changing balance between light,
        nutrients, mixing and water-column structure.
      </p>

      <div className="chl-pill-row" style={{ marginTop: 22 }}>
        {Object.keys(data).map((item) => (
          <button
            key={item}
            type="button"
            className={`chl-pill ${season === item ? "active" : ""}`}
            onClick={() => onSeasonChange(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="chl-grid chl-grid-4" style={{ marginTop: 18 }}>
        <div className="chl-card chl-season-card"><h3>Light</h3><p>{current.light}</p></div>
        <div className="chl-card chl-season-card"><h3>Nutrients</h3><p>{current.nutrients}</p></div>
        <div className="chl-card chl-season-card"><h3>Biological activity</h3><p>{current.activity}</p></div>
        <div className="chl-card chl-season-card"><h3>Why?</h3><p>{current.text}</p></div>
      </div>
    </div>
  );
};

export default ChlorophyllSeasonalExplorer;
