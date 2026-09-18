import "./Learn.css";

function Learn({ onLaunchGlobe }) {
    return (
        <div className="learn-page">

            <header className="learn-header">

                <div>
                    <div className="learn-system-label">
                        OCEAN-X / LEARNING ENVIRONMENT
                    </div>

                    <h1>Understand the Ocean</h1>

                    <p>
                        Learn how the physical properties of the ocean
                        interact to shape Earth's marine environment.
                    </p>
                </div>

                <button
                    className="learn-globe-button"
                    onClick={onLaunchGlobe}
                >
                    EXPLORE 3D GLOBE →
                </button>

            </header>


            {/* TEMPERATURE */}

            <section className="learning-module">

                <div className="module-number">
                    01
                </div>

                <div className="module-content">

                    <div className="module-label">
                        OCEAN PARAMETER
                    </div>

                    <h2>Temperature</h2>

                    <p className="module-description">
                        Ocean temperature describes how warm or cold
                        seawater is. It varies across the surface of
                        the ocean and changes significantly with depth.
                    </p>


                    <div className="concept-grid">

                        <div>
                            <span>SURFACE</span>
                            <strong>Warmer</strong>
                            <p>
                                Solar radiation primarily heats the
                                surface ocean.
                            </p>
                        </div>

                        <div>
                            <span>THERMOCLINE</span>
                            <strong>Rapid change</strong>
                            <p>
                                Temperature can decrease rapidly
                                through this transition zone.
                            </p>
                        </div>

                        <div>
                            <span>DEEP OCEAN</span>
                            <strong>Colder</strong>
                            <p>
                                Deep water receives little direct
                                solar heating.
                            </p>
                        </div>

                    </div>


                    <div className="effect-box">

                        <span>EFFECTS</span>

                        <div>
                            Marine ecosystems · Weather ·
                            Circulation · Climate
                        </div>

                    </div>


                    <button
                        className="module-action"
                        onClick={onLaunchGlobe}
                    >
                        VIEW TEMPERATURE DATA →
                    </button>

                </div>

            </section>


            {/* SALINITY */}

            <section className="learning-module">

                <div className="module-number">
                    02
                </div>

                <div className="module-content">

                    <div className="module-label">
                        OCEAN PARAMETER
                    </div>

                    <h2>Salinity</h2>

                    <p className="module-description">
                        Salinity describes the concentration of dissolved
                        salts in seawater. It varies depending on processes
                        such as evaporation, precipitation and freshwater
                        input.
                    </p>


                    <div className="concept-grid">

                        <div>
                            <span>EVAPORATION</span>
                            <strong>Salinity ↑</strong>
                            <p>
                                Water leaves the ocean while dissolved
                                salts remain.
                            </p>
                        </div>

                        <div>
                            <span>PRECIPITATION</span>
                            <strong>Salinity ↓</strong>
                            <p>
                                Freshwater enters the ocean and dilutes
                                dissolved salts.
                            </p>
                        </div>

                        <div>
                            <span>FRESHWATER</span>
                            <strong>Lower salinity</strong>
                            <p>
                                Rivers and melting ice introduce
                                freshwater into the ocean.
                            </p>
                        </div>

                    </div>


                    <div className="effect-box">

                        <span>IMPORTANT CONNECTION</span>

                        <div>
                            Salinity + Temperature → Water Density
                        </div>

                    </div>


                    <button
                        className="module-action"
                        onClick={onLaunchGlobe}
                    >
                        VIEW SALINITY DATA →
                    </button>

                </div>

            </section>


            {/* CURRENTS */}

            <section className="learning-module">

                <div className="module-number">
                    03
                </div>

                <div className="module-content">

                    <div className="module-label">
                        OCEAN DYNAMICS
                    </div>

                    <h2>Water Currents</h2>

                    <p className="module-description">
                        Ocean currents are large-scale movements of
                        seawater. They transport heat, nutrients and
                        other properties throughout the ocean.
                    </p>


                    <div className="flow-diagram">

                        <div>
                            WIND
                        </div>

                        <span>→</span>

                        <div>
                            SURFACE
                            <small>CURRENTS</small>
                        </div>

                        <span>→</span>

                        <div>
                            HEAT
                            <small>TRANSPORT</small>
                        </div>

                    </div>


                    <div className="effect-box">

                        <span>DEEP CIRCULATION</span>

                        <div>
                            Temperature + Salinity → Density →
                            Sinking / Rising → Deep Ocean Circulation
                        </div>

                    </div>


                    <button
                        className="module-action"
                        onClick={onLaunchGlobe}
                    >
                        EXPLORE OCEAN CURRENTS →
                    </button>

                </div>

            </section>


            {/* OCEAN SYSTEM */}

            <section className="learning-module system-module">

                <div className="module-number">
                    04
                </div>

                <div className="module-content">

                    <div className="module-label">
                        OCEAN SYSTEM
                    </div>

                    <h2>How the Ocean Works</h2>

                    <p className="module-description">
                        Ocean properties do not operate independently.
                        Temperature, salinity and density interact to
                        influence ocean circulation and the global climate
                        system.
                    </p>


                    <div className="ocean-flow">

                        <div>
                            TEMPERATURE
                        </div>

                        <span>+</span>

                        <div>
                            SALINITY
                        </div>

                        <span>↓</span>

                        <div>
                            WATER DENSITY
                        </div>

                        <span>↓</span>

                        <div>
                            OCEAN CIRCULATION
                        </div>

                    </div>


                    <button
                        className="module-action"
                        onClick={onLaunchGlobe}
                    >
                        EXPLORE THE OCEAN SYSTEM →
                    </button>

                </div>

            </section>

        </div>
    );
}

export default Learn;