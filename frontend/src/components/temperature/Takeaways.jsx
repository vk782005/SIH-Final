
const Takeaways = () => {
  const takeaways = [
    {
      title: 'Ocean Temperature Varies by Location and Depth',
      description:
        'Tropical oceans are warm near the surface; polar oceans are cold. Depth dramatically affects temperature due to limited sunlight penetration.',
      icon: '🌍',
    },
    {
      title: 'Most Ocean Heating Occurs Near the Surface',
      description:
        'Solar radiation penetrates only the first 100–200 meters of water. Below this depth, sunlight becomes too weak to significantly warm the ocean.',
      icon: '☀️',
    },
    {
      title: 'Temperature Often Decreases Rapidly with Depth',
      description:
        'In most oceans, there is a thin surface mixed layer followed by a thermocline where temperature drops sharply, then cold deep water below.',
      icon: '📉',
    },
    {
      title: 'The Thermocline Is a Barrier to Mixing',
      description:
        'The thermocline is a region of rapid temperature change. It acts as a boundary that limits vertical mixing between warm surface and cold deep water.',
      icon: '🔗',
    },
    {
      title: 'Temperature Strongly Affects Seawater Density',
      description:
        'Warm water is less dense and rises; cold water is denser and sinks. This relationship drives major ocean circulation patterns.',
      icon: '⚖️',
    },
    {
      title: 'Temperature Differences Drive Ocean Circulation',
      description:
        "Global temperature gradients create density differences that power the thermohaline circulation, moving water across entire ocean basins.",
      icon: '🌊',
    },
    {
      title: 'Salinity Also Affects Seawater Density',
      description:
        "Salinity is equally important as temperature in controlling density. In the real ocean, both factors work together to create the ocean's structure.",
      icon: '🧂',
    },
  ];

  return (
    <section>
      <div className="section-header">
        <div className="section-label">Section 12</div>

        <h2 className="section-title">
          What You Should Know
        </h2>
      </div>

      <p className="section-subtitle">
        Here are the key concepts about ocean temperature you've
        learned in this module.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          marginTop: '2rem',
        }}
      >
        {takeaways.map((takeaway, index) => (
          <div
            key={index}
            style={{
              padding: '1.5rem',
              background: 'rgba(10, 20, 40, 0.5)',
              border: '1px solid var(--border-color)',
              borderRadius: '2px',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor =
                'var(--cyan-dim)';

              e.currentTarget.style.background =
                'rgba(10, 20, 40, 0.8)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor =
                'var(--border-color)';

              e.currentTarget.style.background =
                'rgba(10, 20, 40, 0.5)';
            }}
          >
            {/* Decorative top border */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background:
                  'linear-gradient(90deg, var(--cyan-dim), var(--cyan-bright), var(--cyan-dim))',
                opacity: 0,
                transition: 'opacity 0.3s ease',
              }}
            />

            {/* Icon */}
            <div
              style={{
                fontSize: '2rem',
                marginBottom: '0.5rem',
              }}
            >
              {takeaway.icon}
            </div>

            {/* Title */}
            <h3
              style={{
                margin: '0 0 0.75rem 0',
                fontSize: '1rem',
                fontWeight: '600',
                color: 'var(--cyan-bright)',
                lineHeight: '1.4',
              }}
            >
              {takeaway.title}
            </h3>

            {/* Description */}
            <p
              style={{
                margin: 0,
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
                lineHeight: '1.6',
              }}
            >
              {takeaway.description}
            </p>
          </div>
        ))}
      </div>

      {/* Reflection prompt */}
      <div
        style={{
          marginTop: '2rem',
          padding: '1.5rem',
          background:
            'linear-gradient(135deg, rgba(0, 216, 255, 0.08) 0%, rgba(0, 88, 170, 0.08) 100%)',
          border: '1px solid var(--border-color)',
          borderLeft: '3px solid var(--cyan-bright)',
          borderRadius: '2px',
        }}
      >
        <p
          style={{
            margin: '0 0 1rem 0',
            fontSize: '0.9rem',
            color: 'var(--cyan-bright)',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Reflect on Your Learning
        </p>

        <p
          style={{
            margin: 0,
            fontSize: '0.9rem',
            color: 'var(--text-secondary)',
            lineHeight: '1.6',
          }}
        >
          Can you explain why tropical oceans are warmer than polar
          oceans? How does temperature affect whether water rises or
          sinks? Why is the thermocline important to marine ecosystems?
          What other factors besides temperature do you think affect
          ocean circulation? Explore these questions further by
          checking out the OCEAN-X globe.
        </p>
      </div>

      {/* Next learning module teaser */}
      <div
        style={{
          marginTop: '2rem',
          padding: '1.5rem',
          background: 'rgba(0, 88, 170, 0.1)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '2px',
        }}
      >
        <p
          style={{
            margin: '0 0 0.75rem 0',
            fontSize: '0.9rem',
            color: 'var(--text-primary)',
            fontWeight: '600',
          }}
        >
          Coming Next in OCEAN-X Learning Modules:
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem',
            marginTop: '1rem',
          }}
        >
          {['Salinity', 'Ocean Currents', 'Water Depth'].map(
            (module, i) => (
              <div
                key={i}
                style={{
                  padding: '1rem',
                  background: 'rgba(0, 216, 255, 0.08)',
                  border: '1px solid var(--cyan-dim)',
                  borderRadius: '2px',
                  textAlign: 'center',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)',
                    fontWeight: '500',
                  }}
                >
                  Learning Module {i + 2}
                </p>

                <p
                  style={{
                    margin: '0.5rem 0 0 0',
                    fontSize: '0.95rem',
                    color: 'var(--cyan-bright)',
                    fontWeight: '600',
                  }}
                >
                  {module}
                </p>
              </div>
            )
          )}
        </div>
      </div>

      {/* Final CTA */}
      <div
        style={{
          marginTop: '2rem',
          textAlign: 'center',
          padding: '1rem',
        }}
      >
        <p
          style={{
            margin: '0 0 1.5rem 0',
            fontSize: '0.95rem',
            color: 'var(--text-secondary)',
            lineHeight: '1.6',
          }}
        >
          You've completed the Ocean Temperature learning module.
          Ready to explore more about our oceans?
        </p>

        <p
          style={{
            margin: 0,
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
          }}
        >
          Use the "EXPLORE ON OCEAN-X GLOBE" button at the top of
          the page to investigate real ocean temperature data around
          the world.
        </p>
      </div>
    </section>
  );
};

export default Takeaways;