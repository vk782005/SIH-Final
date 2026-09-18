import React, { useCallback, useState } from "react";
import "./ChlorophyllPage.css";

import ChlorophyllHero from "../components/chlorophyll/ChlorophyllHero";
import ChlorophyllOverview from "../components/chlorophyll/ChlorophyllOverview";
import ChlorophyllDistribution from "../components/chlorophyll/ChlorophyllDistribution";
import ChlorophyllDepthExplorer from "../components/chlorophyll/ChlorophyllDepthExplorer";
import ChlorophyllBloomSimulator from "../components/chlorophyll/ChlorophyllBloomSimulator";
import ChlorophyllSeasonalExplorer from "../components/chlorophyll/ChlorophyllSeasonalExplorer";
import ChlorophyllEcosystem from "../components/chlorophyll/ChlorophyllEcosystem";
import ChlorophyllKnowledgeCheck from "../components/chlorophyll/ChlorophyllKnowledgeCheck";
import ChlorophyllRealDataConnection from "../components/chlorophyll/ChlorophyllRealDataConnection";
import ChlorophyllTakeaways from "../components/chlorophyll/ChlorophyllTakeaways";

const ChlorophyllPage = ({ onBackToDashboard, onLaunchGlobe }) => {
  const [depth, setDepth] = useState(20);
  const [light, setLight] = useState(75);
  const [nutrients, setNutrients] = useState(55);
  const [mixing, setMixing] = useState(50);
  const [temperature, setTemperature] = useState(20);
  const [season, setSeason] = useState("Spring");
  const [quizScore, setQuizScore] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState(0);

  const handleQuizScore = useCallback((score) => setQuizScore(score), []);
  const handleQuizAnswered = useCallback((answered) => setQuizAnswered(answered), []);

  return (
    <div className="chlorophyll-page">
      <div className="chlorophyll-scroll">
        <header className="chlorophyll-header">
          <button
            className="chlorophyll-back-button"
            onClick={onBackToDashboard}
            type="button"
          >
            ← Back to Dashboard
          </button>
          <div className="chlorophyll-header-status">
            <span className="status-dot" />
            OCEAN-X / LEARNING / CHLOROPHYLL
          </div>
        </header>

        <main className="chlorophyll-main">
          <ChlorophyllHero onLaunchGlobe={onLaunchGlobe} />

          <section className="chlorophyll-section">
            <ChlorophyllOverview />
          </section>

          <section className="chlorophyll-section">
            <ChlorophyllDistribution />
          </section>

          <section className="chlorophyll-section">
            <ChlorophyllDepthExplorer
              depth={depth}
              onDepthChange={setDepth}
            />
          </section>

          <section className="chlorophyll-section">
            <ChlorophyllBloomSimulator
              light={light}
              onLightChange={setLight}
              nutrients={nutrients}
              onNutrientsChange={setNutrients}
              mixing={mixing}
              onMixingChange={setMixing}
              temperature={temperature}
              onTemperatureChange={setTemperature}
            />
          </section>

          <section className="chlorophyll-section">
            <ChlorophyllSeasonalExplorer
              season={season}
              onSeasonChange={setSeason}
            />
          </section>

          <section className="chlorophyll-section">
            <ChlorophyllEcosystem />
          </section>

          <section className="chlorophyll-section">
            <ChlorophyllKnowledgeCheck
              score={quizScore}
              onScoreChange={handleQuizScore}
              answered={quizAnswered}
              onAnsweredChange={handleQuizAnswered}
            />
          </section>

          <section className="chlorophyll-section">
            <ChlorophyllRealDataConnection onLaunchGlobe={onLaunchGlobe} />
          </section>

          <section className="chlorophyll-section">
            <ChlorophyllTakeaways />
          </section>
        </main>

        <footer className="chlorophyll-footer">
          <span>OCEAN-X</span>
          <span>Interactive Ocean Learning Environment</span>
        </footer>
      </div>
    </div>
  );
};

export default ChlorophyllPage;
