import { useCallback, useState } from "react";
import "./SalinityPage.css";

import SalinityHero from "../components/salinity/SalinityHero";
import SalinityDepthExplorer from "../components/salinity/SalinityDepthExplorer";
import SalinityDensityLab from "../components/salinity/SalinityDensityLab";
import SalinityCycleSimulation from "../components/salinity/SalinityCycleSimulation";
import SalinityCirculation from "../components/salinity/SalinityCirculation";
import SalinityQuiz from "../components/salinity/SalinityQuiz";
import SalinityTakeaways from "../components/salinity/SalinityTakeaways";

const SalinityPage = ({
  onBackToDashboard,
  onLaunchGlobe,
}) => {
  const [selectedDepth, setSelectedDepth] = useState(0);
  const [selectedRegion, setSelectedRegion] = useState("Indian Ocean");

  const [temperature, setTemperature] = useState(20);
  const [salinity, setSalinity] = useState(35);

  const [evaporation, setEvaporation] = useState(50);
  const [rainfall, setRainfall] = useState(30);
  const [freshwater, setFreshwater] = useState(20);

  const [quizScore, setQuizScore] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState(0);

  const regions = {
    "Indian Ocean": {
      surface: 35.0,
      deep: 34.7,
      description:
        "The Indian Ocean is strongly influenced by monsoon rainfall, evaporation and freshwater input.",
    },
    "Atlantic Ocean": {
      surface: 35.5,
      deep: 34.9,
      description:
        "The Atlantic contains relatively salty surface waters in several subtropical regions because of strong evaporation.",
    },
    "Pacific Ocean": {
      surface: 34.2,
      deep: 34.7,
      description:
        "The Pacific generally has lower average surface salinity because of substantial precipitation and freshwater input.",
    },
    "Polar Ocean": {
      surface: 32.5,
      deep: 34.5,
      description:
        "Polar waters are strongly affected by sea-ice formation, melting and freshwater processes.",
    },
    "Red Sea": {
      surface: 40.0,
      deep: 40.5,
      description:
        "The Red Sea has exceptionally high salinity because evaporation is intense while freshwater input is limited.",
    },
  };

  const getSalinityAtDepth = useCallback(
    (depth) => {
      const region = regions[selectedRegion];

      const surface = region.surface;
      const deep = region.deep;

      const normalizedDepth = Math.min(depth / 4000, 1);

      return surface + (deep - surface) * normalizedDepth;
    },
    [selectedRegion]
  );

  const handleDepthChange = useCallback((depth) => {
    setSelectedDepth(depth);
  }, []);

  const currentSalinity = getSalinityAtDepth(selectedDepth);

  const handleLaunchGlobe = () => {
    if (onLaunchGlobe) {
      onLaunchGlobe({
        parameter: "salinity",
        region: selectedRegion,
        depth: selectedDepth,
      });
    }
  };

  return (
    <div className="salinity-page">

      {/* HEADER */}
      <header className="salinity-header">
        <div className="salinity-header-inner">

          <button
            className="salinity-back-button"
            onClick={onBackToDashboard}
          >
            ← Back to Dashboard
          </button>

          <div className="salinity-header-title">
            <span className="salinity-status-dot" />
            STUDENT ENVIRONMENT
          </div>

        </div>
      </header>

      {/* MAIN */}
      <main className="salinity-main">

        <SalinityHero />

        {/* DEPTH EXPLORER */}
        <section className="salinity-section">
          <SalinityDepthExplorer
            selectedDepth={selectedDepth}
            onDepthChange={handleDepthChange}
            selectedRegion={selectedRegion}
            onRegionChange={setSelectedRegion}
            currentSalinity={currentSalinity}
            regionData={regions[selectedRegion]}
          />
        </section>

        {/* DENSITY */}
        <section className="salinity-section">
          <SalinityDensityLab
            temperature={temperature}
            setTemperature={setTemperature}
            salinity={salinity}
            setSalinity={setSalinity}
          />
        </section>

        {/* SALINITY CYCLE */}
        <section className="salinity-section">
          <SalinityCycleSimulation
            evaporation={evaporation}
            setEvaporation={setEvaporation}
            rainfall={rainfall}
            setRainfall={setRainfall}
            freshwater={freshwater}
            setFreshwater={setFreshwater}
          />
        </section>

        {/* CIRCULATION */}
        <section className="salinity-section">
          <SalinityCirculation
            temperature={temperature}
            salinity={salinity}
          />
        </section>

        {/* QUIZ */}
        <section className="salinity-section">
          <SalinityQuiz
            score={quizScore}
            setScore={setQuizScore}
            answered={quizAnswered}
            setAnswered={setQuizAnswered}
          />
        </section>

        {/* TAKEAWAYS */}
        <section className="salinity-section">
          <SalinityTakeaways />
        </section>

        {/* REAL DATA */}
        <section className="salinity-globe-section">

          <div className="salinity-globe-content">

            <div>
              <span className="salinity-section-label">
                REAL OCEAN DATA
              </span>

              <h2>
                Explore salinity on OCEAN-X
              </h2>

              <p>
                Take what you've learned into the OCEAN-X globe and
                investigate real ocean observations.
              </p>
            </div>

            <button
              className="salinity-globe-button"
              onClick={handleLaunchGlobe}
            >
              EXPLORE ON GLOBE
              <span>↗</span>
            </button>

          </div>

        </section>

      </main>

      <footer className="salinity-footer">
        OCEAN-X · SALINITY LEARNING MODULE
      </footer>

    </div>
  );
};

export default SalinityPage;