import "./StudentDashboard.css";


// =============================================================
// STUDENT DASHBOARD
// =============================================================
//
// Navigation:
//
// StudentDashboard
//       |
//       |---- Temperature -> App.jsx -> TemperaturePage.jsx
//       |
//       |---- Salinity -> App.jsx -> SalinityPage.jsx
//       |
//       |---- Currents -> App.jsx -> CurrentsPage.jsx
//       |
//       |---- Chlorophyll -> App.jsx -> ChlorophyllPage.jsx
//
// App.jsx remains the single source of truth for navigation.
//
// =============================================================


const StudentDashboard = ({
    onLaunchGlobe,
    onOpenParameter,
}) => {


    // =========================================================
    // OPEN LEARNING PARAMETER
    // =========================================================

    const handleParameterClick = (parameter) => {

        console.log(
            "Opening learning parameter:",
            parameter
        );


        if (
            typeof onOpenParameter === "function"
        ) {

            onOpenParameter(
                parameter
            );

        } else {

            console.error(
                "StudentDashboard: onOpenParameter is not defined."
            );

        }

    };


    // =========================================================
    // OPEN OCEAN GLOBE
    // =========================================================

    const handleLaunchGlobe = () => {

        console.log(
            "Launching Ocean-X globe"
        );


        if (
            typeof onLaunchGlobe === "function"
        ) {

            onLaunchGlobe();

        } else {

            console.error(
                "StudentDashboard: onLaunchGlobe is not defined."
            );

        }

    };


    // =========================================================
    // RENDER
    // =========================================================

    return (

        <div className="student-dashboard">


            {/* =================================================
                TOP BAR
            ================================================= */}

            <header className="student-topbar">


                {/* BRAND */}

                <div className="student-brand">

                    <div className="student-brand-mark">
                        ◉
                    </div>


                    <div>

                        <div className="student-brand-name">
                            OCEAN-X
                        </div>

                        <div className="student-brand-subtitle">
                            OCEAN DATA PLATFORM
                        </div>

                    </div>

                </div>


                {/* STATUS */}

                <div className="student-status">

                    <span className="status-dot"></span>

                    STUDENT ENVIRONMENT

                </div>


            </header>



            {/* =================================================
                MAIN
            ================================================= */}

            <main className="student-main">


                {/* =================================================
                    HERO
                ================================================= */}

                <section className="student-hero">


                    <div className="hero-content">

                        <span className="student-eyebrow">
                            OCEAN-X LEARNING ENVIRONMENT
                        </span>


                        <h1>
                            Understand the Ocean.
                            <br />
                            Explore the Data.
                        </h1>


                        <p className="hero-description">

                            Explore the physical and biological
                            processes that shape our oceans through
                            interactive learning modules and real
                            ocean data.

                        </p>


                        {/* GLOBE BUTTON */}

                        <button
                            type="button"
                            className="launch-globe-button"
                            onClick={handleLaunchGlobe}
                        >

                            <span className="launch-globe-icon">
                                ◉
                            </span>

                            <span>
                                EXPLORE OCEAN-X GLOBE
                            </span>

                            <span className="launch-globe-arrow">
                                →
                            </span>

                        </button>


                    </div>


                    {/* HERO VISUAL */}

                    <div className="hero-visual">

                        <div className="hero-grid"></div>


                        <div className="hero-orbit orbit-one"></div>

                        <div className="hero-orbit orbit-two"></div>

                        <div className="hero-orbit orbit-three"></div>


                        <div className="hero-globe">

                            <div className="globe-lines"></div>

                            <div className="globe-center">
                                OCEAN-X
                            </div>

                        </div>


                    </div>


                </section>



                {/* =================================================
                    LEARNING WORKFLOW
                ================================================= */}

                <section className="dashboard-section workflow-section">


                    <div className="section-heading">

                        <span>
                            LEARNING WORKFLOW
                        </span>

                        <small>
                            HOW TO USE OCEAN-X
                        </small>

                    </div>


                    <div className="workflow-grid">


                        <div className="workflow-card">

                            <span className="workflow-number">
                                01
                            </span>

                            <div>

                                <h3>
                                    CHOOSE A PARAMETER
                                </h3>

                                <p>
                                    Select temperature,
                                    salinity, currents or
                                    chlorophyll to begin
                                    learning.
                                </p>

                            </div>

                        </div>


                        <div className="workflow-card">

                            <span className="workflow-number">
                                02
                            </span>

                            <div>

                                <h3>
                                    EXPERIMENT
                                </h3>

                                <p>
                                    Change variables,
                                    explore graphs and
                                    interact with simulations.
                                </p>

                            </div>

                        </div>


                        <div className="workflow-card">

                            <span className="workflow-number">
                                03
                            </span>

                            <div>

                                <h3>
                                    OBSERVE
                                </h3>

                                <p>
                                    See how changes affect
                                    the ocean through
                                    visualizations.
                                </p>

                            </div>

                        </div>


                        <div className="workflow-card">

                            <span className="workflow-number">
                                04
                            </span>

                            <div>

                                <h3>
                                    EXPLORE REAL DATA
                                </h3>

                                <p>
                                    Open the 3D globe and
                                    investigate real ocean
                                    observations.
                                </p>

                            </div>

                        </div>


                    </div>


                </section>



                {/* =================================================
                    LEARNING OBJECTIVES
                ================================================= */}

                <section className="dashboard-section objectives-section">


                    <div className="section-heading">

                        <span>
                            LEARNING OBJECTIVES
                        </span>

                        <small>
                            WHAT YOU WILL DISCOVER
                        </small>

                    </div>


                    <div className="objectives-grid">


                        <div className="objective-card">

                            <div className="objective-icon">
                                ◇
                            </div>

                            <h3>
                                PATTERNS
                            </h3>

                            <p>
                                Discover how ocean properties
                                change with location, depth
                                and time.
                            </p>

                        </div>


                        <div className="objective-card">

                            <div className="objective-icon">
                                ∿
                            </div>

                            <h3>
                                PROCESSES
                            </h3>

                            <p>
                                Understand the physical and
                                biological processes that
                                shape ocean conditions.
                            </p>

                        </div>


                        <div className="objective-card">

                            <div className="objective-icon">
                                ◎
                            </div>

                            <h3>
                                CONNECTIONS
                            </h3>

                            <p>
                                See how temperature, salinity,
                                currents and biology interact.
                            </p>

                        </div>


                        <div className="objective-card">

                            <div className="objective-icon">
                                ⌁
                            </div>

                            <h3>
                                DATA
                            </h3>

                            <p>
                                Learn how scientific ocean data
                                can be interpreted through
                                interactive visualization.
                            </p>

                        </div>


                    </div>


                </section>



                {/* =================================================
                    OCEAN PARAMETERS
                ================================================= */}

                <section className="dashboard-section">


                    <div className="section-heading">

                        <span>
                            OCEAN PARAMETERS
                        </span>

                        <small>
                            LEARN & EXPLORE
                        </small>

                    </div>


                    <div className="parameter-grid">


                        {/* =================================================
                            TEMPERATURE
                        ================================================= */}

                        <button
                            type="button"
                            className="parameter-card"
                            onClick={() =>
                                handleParameterClick("temperature")
                            }
                        >

                            <span className="parameter-number">
                                01
                            </span>


                            <h3>
                                TEMPERATURE
                            </h3>


                            <p>
                                How heat is distributed
                                throughout the ocean.
                            </p>


                            <span className="parameter-action">
                                LEARN →
                            </span>

                        </button>



                        {/* =================================================
                            SALINITY
                        ================================================= */}

                        <button
                            type="button"
                            className="parameter-card"
                            onClick={() =>
                                handleParameterClick("salinity")
                            }
                        >

                            <span className="parameter-number">
                                02
                            </span>


                            <h3>
                                SALINITY
                            </h3>


                            <p>
                                How dissolved salts affect
                                seawater properties.
                            </p>


                            <span className="parameter-action">
                                LEARN →
                            </span>

                        </button>



                        {/* =================================================
                            OCEAN CURRENTS
                        ================================================= */}

                        <button
                            type="button"
                            className="parameter-card"
                            onClick={() =>
                                handleParameterClick("currents")
                            }
                        >

                            <span className="parameter-number">
                                03
                            </span>


                            <h3>
                                OCEAN CURRENTS
                            </h3>


                            <p>
                                How moving water transports
                                heat, nutrients and energy.
                            </p>


                            <span className="parameter-action">
                                LEARN →
                            </span>

                        </button>



                        {/* =================================================
                            CHLOROPHYLL
                        ================================================= */}

                        <button
                            type="button"
                            className="parameter-card"
                            onClick={() =>
                                handleParameterClick("chlorophyll")
                            }
                        >

                            <span className="parameter-number">
                                04
                            </span>


                            <h3>
                                CHLOROPHYLL
                            </h3>


                            <p>
                                Explore marine productivity
                                and phytoplankton activity.
                            </p>


                            <span className="parameter-action">
                                LEARN →
                            </span>

                        </button>


                    </div>


                </section>



                {/* =================================================
                    LEARNING BANNER
                ================================================= */}

                <section className="learning-banner">


                    <div>

                        <span className="section-label">
                            OCEAN-X LEARNING ENVIRONMENT
                        </span>


                        <h2>
                            Learn the science behind the data.
                        </h2>


                        <p>

                            Select any ocean parameter above to
                            understand what it means, why it
                            matters and how it behaves throughout
                            the ocean.

                        </p>

                    </div>


                    <div className="learning-indicator">

                        <span className="status-dot"></span>

                        04 MODULES AVAILABLE

                    </div>


                </section>



                {/* =================================================
                    FOOTER
                ================================================= */}

                <footer className="student-footer">


                    <span>
                        SMART INDIA HACKATHON 2026
                    </span>


                    <span>
                        OCEAN-X v0.1
                    </span>


                </footer>


            </main>


        </div>

    );

};


export default StudentDashboard;