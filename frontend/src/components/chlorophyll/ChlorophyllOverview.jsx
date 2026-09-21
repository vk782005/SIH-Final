
const ChlorophyllOverview = () => (
  <div className="chl-panel">
    <p className="chl-kicker">Section 01</p>
    <h2 className="chl-title">The green signal of ocean life</h2>
    <p className="chl-subtitle">
      Chlorophyll is a pigment used by photosynthetic organisms. In the
      ocean, measurements of chlorophyll are widely used as an indicator of
      phytoplankton biomass and biological productivity.
    </p>

    <div className="chl-grid chl-grid-3" style={{ marginTop: 26 }}>
      <article className="chl-card">
        <h3>01 · Pigment</h3>
        <p>
          Chlorophyll helps phytoplankton capture light energy for
          photosynthesis.
        </p>
      </article>
      <article className="chl-card">
        <h3>02 · Phytoplankton</h3>
        <p>
          Tiny photosynthetic organisms use sunlight, carbon dioxide and
          nutrients to grow.
        </p>
      </article>
      <article className="chl-card">
        <h3>03 · Ocean indicator</h3>
        <p>
          Chlorophyll observations help scientists map patterns of ocean
          productivity over large areas.
        </p>
      </article>
    </div>

    <div className="chl-note">
      <strong>Think about it:</strong> when you see a strong chlorophyll
      signal, ask what combination of light, nutrients, mixing and ecosystem
      conditions could be supporting it.
    </div>
  </div>
);

export default ChlorophyllOverview;
