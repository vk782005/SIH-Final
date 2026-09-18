import React from 'react';

const TemperatureHero = () => {
  return (
    <section className="temperature-section temperature-hero">
      <div className="section-header">
        <div className="section-label">Learning Module 01</div>
        <h1 className="section-title">Ocean Temperature</h1>
      </div>
      
      <p className="section-subtitle">
        Heat is distributed throughout Earth's oceans through complex processes involving solar radiation, atmospheric mixing, and ocean currents. Understanding ocean temperature is key to comprehending ocean circulation, weather patterns, and marine ecosystems.
      </p>

      <div className="visualization-container hero-visualization">
        <svg viewBox="0 0 800 300" xmlns="http://www.w3.org/2000/svg" className="hero-diagram">
          {/* Sun */}
          <circle cx="400" cy="30" r="20" fill="url(#sunGradient)" opacity="0.9" />
          
          {/* Sun rays */}
          <g stroke="url(#sunRay)" strokeWidth="1" opacity="0.4">
            <line x1="400" y1="10" x2="400" y2="-10" />
            <line x1="414" y1="14" x2="428" y2="0" />
            <line x1="420" y1="30" x2="440" y2="30" />
            <line x1="414" y1="46" x2="428" y2="60" />
            <line x1="386" y1="46" x2="372" y2="60" />
            <line x1="380" y1="30" x2="360" y2="30" />
            <line x1="386" y1="14" x2="372" y2="0" />
          </g>

          {/* Ocean surface */}
          <ellipse cx="400" cy="80" rx="350" ry="8" fill="none" stroke="var(--cyan-dim)" strokeWidth="2" opacity="0.6" />
          
          {/* Warm surface layer */}
          <rect x="100" y="80" width="600" height="50" fill="url(#warmWaterGradient)" opacity="0.3" />
          <text x="750" y="110" fontSize="14" fill="var(--text-secondary)" fontFamily="var(--font-mono)">24°C</text>

          {/* Thermocline zone */}
          <rect x="100" y="130" width="600" height="60" fill="url(#thermoclineGradient)" opacity="0.4" />
          <path d="M 80 130 Q 90 150 80 180" stroke="var(--cyan-bright)" strokeWidth="2" fill="none" opacity="0.5" />
          <text x="750" y="165" fontSize="14" fill="var(--text-secondary)" fontFamily="var(--font-mono)">12°C</text>
          <text x="70" y="165" fontSize="12" fill="var(--cyan-dim)" textAnchor="end">Thermocline</text>

          {/* Cold deep water */}
          <rect x="100" y="190" width="600" height="80" fill="url(#coldWaterGradient)" opacity="0.3" />
          <text x="750" y="235" fontSize="14" fill="var(--text-secondary)" fontFamily="var(--font-mono)">2°C</text>
          <text x="70" y="235" fontSize="12" fill="var(--text-muted)">Deep Ocean</text>

          {/* Depth markers */}
          <g stroke="var(--border-subtle)" strokeWidth="1" opacity="0.4" strokeDasharray="4,4">
            <line x1="50" y1="80" x2="90" y2="80" />
            <line x1="50" y1="130" x2="90" y2="130" />
            <line x1="50" y1="190" x2="90" y2="190" />
          </g>

          {/* Depth labels */}
          <text x="40" y="85" fontSize="12" fill="var(--text-muted)" textAnchor="end" fontFamily="var(--font-mono)">0 m</text>
          <text x="40" y="135" fontSize="12" fill="var(--text-muted)" textAnchor="end" fontFamily="var(--font-mono)">100 m</text>
          <text x="40" y="195" fontSize="12" fill="var(--text-muted)" textAnchor="end" fontFamily="var(--font-mono)">500 m</text>

          {/* Animated heat particles */}
          <g className="heat-particles">
            <circle cx="200" cy="85" r="2" fill="var(--temp-warm)" opacity="0.6">
              <animate attributeName="cy" from="85" to="280" dur="4s" repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.8" to="0.1" dur="4s" repeatCount="indefinite" />
            </circle>
            <circle cx="400" cy="90" r="2" fill="var(--temp-warm)" opacity="0.5">
              <animate attributeName="cy" from="90" to="280" dur="5s" repeatCount="indefinite" begin="0.5s" />
              <animate attributeName="opacity" from="0.8" to="0.1" dur="5s" repeatCount="indefinite" begin="0.5s" />
            </circle>
            <circle cx="600" cy="87" r="2" fill="var(--temp-warm)" opacity="0.6">
              <animate attributeName="cy" from="87" to="280" dur="4.5s" repeatCount="indefinite" begin="1s" />
              <animate attributeName="opacity" from="0.8" to="0.1" dur="4.5s" repeatCount="indefinite" begin="1s" />
            </circle>
          </g>

          {/* Gradients */}
          <defs>
            <radialGradient id="sunGradient">
              <stop offset="0%" stopColor="#ffd700" stopOpacity="1" />
              <stop offset="100%" stopColor="#ff6b35" stopOpacity="0.7" />
            </radialGradient>
            <linearGradient id="sunRay" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ff6b35" />
              <stop offset="100%" stopColor="#ff6b35" />
            </linearGradient>
            <linearGradient id="warmWaterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ff6b35" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#00b8d4" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="thermoclineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00b8d4" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="coldWaterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#050810" stopOpacity="0.3" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="hero-content">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
          <div className="info-box">
            <div className="info-box-label">What is ocean temperature?</div>
            <p style={{ fontSize: '0.95rem', lineHeight: '1.6', margin: '0' }}>
              The measure of heat energy in seawater. Temperature varies by location, depth, season, and time of day, and strongly influences ocean circulation patterns and ecosystems.
            </p>
          </div>
          
          <div className="info-box">
            <div className="info-box-label">Why does it vary?</div>
            <p style={{ fontSize: '0.95rem', lineHeight: '1.6', margin: '0' }}>
              Solar radiation heats the surface. Depth decreases heating because sunlight is absorbed by overlying water. Ocean currents redistribute heat globally.
            </p>
          </div>
          
          <div className="info-box">
            <div className="info-box-label">Why does it matter?</div>
            <p style={{ fontSize: '0.95rem', lineHeight: '1.6', margin: '0' }}>
              Temperature differences drive ocean circulation, affect marine life distribution, influence weather patterns, and are sensitive to climate change.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TemperatureHero;
