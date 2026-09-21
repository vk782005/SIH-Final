import { useState, useCallback } from "react";
import './TemperaturePage.css';

import TemperatureHero from '../components/temperature/TemperatureHero';
import TemperatureDepthExplorer from '../components/temperature/TemperatureDepthExplorer';
import TemperatureDepthGraph from '../components/temperature/TemperatureDepthGraph';
import ThermoclineExplorer from '../components/temperature/ThermoclineExplorer';
import LatitudeExplorer from '../components/temperature/LatitudeExplorer';
import HeatingSimulation from '../components/temperature/HeatingSimulation';
import DensityExperiment from '../components/temperature/DensityExperiment';
import CirculationVisualization from '../components/temperature/CirculationVisualization';
import OceanExperiment from '../components/temperature/OceanExperiment';
import KnowledgeCheck from '../components/temperature/KnowledgeCheck';
import RealDataConnection from '../components/temperature/RealDataConnection';
import Takeaways from '../components/temperature/Takeaways';

const TemperaturePage = ({
  onBackToDashboard,
  onBack,
  onLaunchGlobe
}) => {

  // =========================================================
  // NAVIGATION
  // =========================================================

  // Supports either prop name so the page doesn't silently fail.
  const handleBackToDashboard = useCallback(() => {
    console.log('TemperaturePage: Back to Dashboard clicked');

    if (typeof onBackToDashboard === 'function') {
      onBackToDashboard();
      return;
    }

    if (typeof onBack === 'function') {
      onBack();
      return;
    }

    console.error(
      'TemperaturePage: No dashboard navigation function was provided.'
    );
  }, [onBackToDashboard, onBack]);


  // =========================================================
  // DEPTH STATE
  // =========================================================

  const [selectedDepth, setSelectedDepth] = useState(100);

  // =========================================================
  // THERMOCLINE STATE
  // =========================================================

  const [thermoclineDepth, setThermoclineDepth] = useState(200);

  // =========================================================
  // LATITUDE STATE
  // =========================================================

  const [selectedLatitude, setSelectedLatitude] = useState(0);

  // =========================================================
  // HEATING SIMULATION STATE
  // =========================================================

  const [solarEnergy, setSolarEnergy] = useState(0.5);
  const [windMixing, setWindMixing] = useState(0.3);
  const [simulationTime, setSimulationTime] = useState(12);

  // =========================================================
  // OCEAN EXPERIMENT STATE
  // =========================================================

  const [experimentSurfaceTemp, setExperimentSurfaceTemp] = useState(20);
  const [experimentDeepTemp, setExperimentDeepTemp] = useState(4);
  const [experimentThermoclineDepth, setExperimentThermoclineDepth] =
    useState(200);
  const [experimentWindMixing, setExperimentWindMixing] = useState(0.3);

  // =========================================================
  // QUIZ STATE
  // =========================================================

  const [quizScore, setQuizScore] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState(0);


  // =========================================================
  // DEPTH HANDLER
  // =========================================================

  const handleDepthChange = useCallback((depth) => {
    setSelectedDepth(depth);
  }, []);


  // =========================================================
  // TEMPERATURE PROFILE
  // =========================================================

  const getTemperatureAtDepth = useCallback((depth) => {

    const profile = [
      { depth: 0, temp: 24 },
      { depth: 50, temp: 23 },
      { depth: 100, temp: 20 },
      { depth: 150, temp: 16 },
      { depth: 200, temp: 12 },
      { depth: 300, temp: 8 },
      { depth: 500, temp: 5 },
      { depth: 1000, temp: 3 },
      { depth: 2000, temp: 2.5 },
      { depth: 4000, temp: 2 }
    ];

    for (let i = 0; i < profile.length - 1; i++) {

      if (
        depth >= profile[i].depth &&
        depth <= profile[i + 1].depth
      ) {

        const t =
          (depth - profile[i].depth) /
          (profile[i + 1].depth - profile[i].depth);

        return (
          profile[i].temp +
          t * (profile[i + 1].temp - profile[i].temp)
        );
      }
    }

    return profile[profile.length - 1].temp;

  }, []);


  // =========================================================
  // OCEAN LAYER
  // =========================================================

  const getLayerAtDepth = useCallback((depth) => {

    if (depth <= 100) {
      return 'Surface Mixed Layer';
    }

    if (depth <= 300) {
      return 'Thermocline';
    }

    return 'Deep Ocean';

  }, []);


  // =========================================================
  // DEPTH EXPLANATION
  // =========================================================

  const getExplanationAtDepth = useCallback((depth) => {

    if (depth <= 50) {
      return 'Solar radiation directly heats this region. Strong wind mixing keeps temperature relatively uniform.';
    }

    if (depth <= 150) {
      return 'Thermocline begins here. Temperature decreases rapidly with depth as sunlight is absorbed.';
    }

    if (depth <= 300) {
      return 'Thermocline continues. Temperature gradient is steep. Few organisms live at these depths.';
    }

    if (depth <= 1000) {
      return 'Temperature changes slowly. Very cold and dark. Most ocean volume is in this zone.';
    }

    return 'Abyssal zone. Near 0°C. Extreme pressure, minimal life.';

  }, []);


  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="temperature-page">

      {/* =====================================================
          HEADER / NAVIGATION
          ===================================================== */}

      <header className="temperature-header">

        <button
          type="button"
          className="temperature-nav-button temperature-back"
          onClick={handleBackToDashboard}
          aria-label="Back to dashboard"
        >
          <span className="temperature-back-arrow">←</span>
          <span>Back to Dashboard</span>
        </button>

        <div className="temperature-header-spacer" />

      </header>


      {/* =====================================================
          MAIN CONTENT
          ===================================================== */}

      <main className="temperature-main">

        {/* HERO */}

        <TemperatureHero />


        {/* ===================================================
            SECTION 2
            INTERACTIVE DEPTH EXPLORER
            =================================================== */}

        <section className="temperature-section">

          <TemperatureDepthExplorer
            selectedDepth={selectedDepth}
            onDepthChange={handleDepthChange}
            currentTemp={getTemperatureAtDepth(selectedDepth)}
            currentLayer={getLayerAtDepth(selectedDepth)}
            explanation={getExplanationAtDepth(selectedDepth)}
            thermoclineDepth={thermoclineDepth}
          />

        </section>


        {/* ===================================================
            SECTION 3
            TEMPERATURE VS DEPTH
            =================================================== */}

        <section className="temperature-section">

          <TemperatureDepthGraph
            selectedDepth={selectedDepth}
            onDepthChange={handleDepthChange}
            getTemperatureAtDepth={getTemperatureAtDepth}
            getLayerAtDepth={getLayerAtDepth}
          />

        </section>


        {/* ===================================================
            SECTION 4
            THERMOCLINE EXPLORER
            =================================================== */}

        <section className="temperature-section">

          <ThermoclineExplorer
            thermoclineDepth={thermoclineDepth}
            onThermoclineDepthChange={setThermoclineDepth}
            selectedDepth={selectedDepth}
            getTemperatureAtDepth={getTemperatureAtDepth}
          />

        </section>


        {/* ===================================================
            SECTION 5
            LATITUDE & SUNLIGHT
            =================================================== */}

        <section className="temperature-section">

          <LatitudeExplorer
            selectedLatitude={selectedLatitude}
            onLatitudeChange={setSelectedLatitude}
          />

        </section>


        {/* ===================================================
            SECTION 6
            SURFACE HEATING SIMULATION
            =================================================== */}

        <section className="temperature-section">

          <HeatingSimulation
            solarEnergy={solarEnergy}
            onSolarEnergyChange={setSolarEnergy}
            windMixing={windMixing}
            onWindMixingChange={setWindMixing}
            simulationTime={simulationTime}
            onSimulationTimeChange={setSimulationTime}
          />

        </section>


        {/* ===================================================
            SECTION 7
            TEMPERATURE & DENSITY
            =================================================== */}

        <section className="temperature-section">

          <DensityExperiment />

        </section>


        {/* ===================================================
            SECTION 8
            OCEAN CIRCULATION
            =================================================== */}

        <section className="temperature-section">

          <CirculationVisualization />

        </section>


        {/* ===================================================
            SECTION 9
            CHANGE THE OCEAN EXPERIMENT
            =================================================== */}

        <section className="temperature-section">

          <OceanExperiment
            surfaceTemp={experimentSurfaceTemp}
            onSurfaceTempChange={setExperimentSurfaceTemp}
            deepTemp={experimentDeepTemp}
            onDeepTempChange={setExperimentDeepTemp}
            thermoclineDepth={experimentThermoclineDepth}
            onThermoclineDepthChange={setExperimentThermoclineDepth}
            windMixing={experimentWindMixing}
            onWindMixingChange={setExperimentWindMixing}
          />

        </section>


        {/* ===================================================
            SECTION 10
            KNOWLEDGE CHECK
            =================================================== */}

        <section className="temperature-section">

          <KnowledgeCheck
            score={quizScore}
            onScoreChange={setQuizScore}
            answered={quizAnswered}
            onAnsweredChange={setQuizAnswered}
          />

        </section>


        {/* ===================================================
            SECTION 11
            REAL DATA CONNECTION
            =================================================== */}

        <section className="temperature-section">

          <RealDataConnection
            onLaunchGlobe={onLaunchGlobe}
          />

        </section>


        {/* ===================================================
            SECTION 12
            TAKEAWAYS
            =================================================== */}

        <section className="temperature-section">

          <Takeaways />

        </section>

      </main>


      {/* =====================================================
          FOOTER SPACER

          IMPORTANT:
          Keep this because your current scrolling fix
          depends on the page having natural document height.
          ===================================================== */}

      <div className="temperature-footer-spacer" />

    </div>
  );
};

export default TemperaturePage;