
const takeaways = [
  {
    icon: '≋',
    title: 'Surface currents move heat',
    text: 'Wind-driven circulation transports warm and cool water between different parts of the ocean and influences climate.',
  },
  {
    icon: '↻',
    title: 'Earth changes the path',
    text: 'The Coriolis effect deflects moving water and helps organize currents into large basin-scale circulation patterns.',
  },
  {
    icon: '◉',
    title: 'Gyres organize the surface',
    text: 'Large circular systems of currents form around ocean basins, with characteristic western and eastern boundary currents.',
  },
  {
    icon: '↓',
    title: 'The deep ocean also moves',
    text: 'Density differences caused by temperature and salinity contribute to slow deep circulation and global overturning.',
  },
  {
    icon: '△',
    title: 'Currents redistribute energy',
    text: 'Ocean circulation is part of Earth’s climate system because it redistributes heat, nutrients and dissolved substances.',
  },
  {
    icon: '◎',
    title: 'Every current has context',
    text: 'Direction and strength depend on latitude, wind, rotation, basin geometry, density structure and interactions with other flows.',
  },
];

const CurrentTakeaways = ({ onLaunchGlobe }) => {
  return (
    <div>
      <div className="currents-panel">
        <div className="currents-panel-header">
          <div className="currents-eyebrow">MODULE SUMMARY · 07</div>
          <h2 className="currents-panel-title">What you should remember</h2>
          <p className="currents-panel-subtitle">
            The ocean is a connected moving system. Surface and deep currents work
            together to redistribute energy and matter around the planet.
          </p>
        </div>

        <div className="takeaway-grid">
          {takeaways.map((item) => (
            <article className="takeaway-card" key={item.title}>
              <div className="takeaway-icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="currents-cta">
        <div>
          <h3>Ready to see real ocean data?</h3>
          <p>
            Leave the learning module and explore current-related observations on the OCEAN-X globe.
          </p>
        </div>

        <button className="currents-primary-button" onClick={onLaunchGlobe}>
          OPEN OCEAN-X GLOBE →
        </button>
      </div>
    </div>
  );
};

export default CurrentTakeaways;
