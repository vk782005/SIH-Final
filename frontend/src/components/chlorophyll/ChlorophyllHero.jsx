
const ChlorophyllHero = ({ onLaunchGlobe }) => (
  <section className="chl-panel chl-hero">
    <div className="chl-hero-copy">
      <p className="chl-kicker">OCEAN-X / Learning Module 4</p>
      <h1 className="chl-hero-title">
        Ocean <span>Chlorophyll</span>
      </h1>
      <p className="chl-subtitle">
        Discover how microscopic phytoplankton, sunlight and nutrients shape
        the productivity of the ocean. Chlorophyll gives scientists a window
        into where marine life is most active.
      </p>
      <div style={{ marginTop: 24 }}>
        <button className="chl-button" type="button" onClick={onLaunchGlobe}>
          Explore on OCEAN-X Globe →
        </button>
      </div>
    </div>

    <div className="chl-hero-visual" aria-hidden="true">
      <div className="chl-orb-ring" />
      <div className="chl-ocean-orb" />
    </div>
  </section>
);

export default ChlorophyllHero;
