
const SalinityHero = () => {
  return (
    <section className="salinity-hero">

      <div className="salinity-hero-grid">

        <div className="salinity-hero-left">

          <div className="salinity-module-label">
            LEARNING MODULE 02
          </div>

          <h1>
            Ocean
            <br />
            <span>Salinity</span>
          </h1>

          <p className="salinity-hero-tagline">
            How salt is distributed through the ocean.
          </p>

        </div>

        <div className="salinity-hero-right">

          <div className="salinity-hero-stat">
            <span>AVERAGE OCEAN SALINITY</span>
            <strong>≈ 35 PSU</strong>
          </div>

          <p>
            Salinity describes the concentration of dissolved salts
            in seawater. It changes from place to place because of
            evaporation, precipitation, river input, ice processes
            and ocean circulation.
          </p>

          <div className="salinity-hero-facts">

            <div>
              <span>01</span>
              <strong>EVAPORATION</strong>
              <small>Raises salinity</small>
            </div>

            <div>
              <span>02</span>
              <strong>RAINFALL</strong>
              <small>Lowers salinity</small>
            </div>

            <div>
              <span>03</span>
              <strong>ICE</strong>
              <small>Changes salt distribution</small>
            </div>

          </div>

        </div>

      </div>

      <div className="salinity-hero-line" />

    </section>
  );
};

export default SalinityHero;