
const ChlorophyllEcosystem = () => (
  <div className="chl-panel">
    <p className="chl-kicker">Section 06 · Ecosystem</p>
    <h2 className="chl-title">From sunlight to the food web</h2>
    <p className="chl-subtitle">
      Phytoplankton are tiny, but their photosynthetic activity supports a
      huge fraction of marine food webs and participates in global carbon
      cycling.
    </p>

    <div className="chl-flow" style={{ marginTop: 30 }}>
      <div className="chl-flow-node"><strong>☀</strong><br />Sunlight</div>
      <div className="chl-flow-arrow">→</div>
      <div className="chl-flow-node"><strong>●</strong><br />Phytoplankton</div>
      <div className="chl-flow-arrow">→</div>
      <div className="chl-flow-node"><strong>◌</strong><br />Zooplankton</div>
      <div className="chl-flow-arrow">→</div>
      <div className="chl-flow-node"><strong>◈</strong><br />Fish & wildlife</div>
      <div className="chl-flow-arrow">→</div>
    </div>

    <div className="chl-grid chl-grid-3" style={{ marginTop: 22 }}>
      <div className="chl-card">
        <h3>Food webs</h3>
        <p>Phytoplankton form the base of many marine food chains.</p>
      </div>
      <div className="chl-card">
        <h3>Carbon cycle</h3>
        <p>Photosynthesis moves carbon from dissolved inorganic forms into organic matter.</p>
      </div>
      <div className="chl-card">
        <h3>Oxygen</h3>
        <p>Marine photosynthesis contributes substantially to oxygen production.</p>
      </div>
    </div>
  </div>
);

export default ChlorophyllEcosystem;
