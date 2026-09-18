import React, { useMemo, useState } from 'react';
import './CurrentsPage.css';

import CurrentsHero from '../components/currents/CurrentsHero';
import CurrentExplorer from '../components/currents/CurrentExplorer';
import CurrentForces from '../components/currents/CurrentForces';
import GyreExplorer from '../components/currents/GyreExplorer';
import DepthCurrentExplorer from '../components/currents/DepthCurrentExplorer';
import CurrentClimateLab from '../components/currents/CurrentClimateLab';
import CurrentQuiz from '../components/currents/CurrentQuiz';
import CurrentTakeaways from '../components/currents/CurrentTakeaways';

const CurrentsPage = ({ onBackToDashboard, onLaunchGlobe }) => {
  const [selectedLatitude, setSelectedLatitude] = useState(20);
  const [selectedCurrent, setSelectedCurrent] = useState('Gulf Stream');
  const [windStrength, setWindStrength] = useState(65);
  const [coriolisStrength, setCoriolisStrength] = useState(55);
  const [temperatureDifference, setTemperatureDifference] = useState(60);
  const [depth, setDepth] = useState(0);
  const [surfaceTemp, setSurfaceTemp] = useState(27);
  const [deepTemp, setDeepTemp] = useState(4);
  const [salinityDifference, setSalinityDifference] = useState(45);
  const [quizScore, setQuizScore] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState(0);

  const latitudeBand = useMemo(() => {
    if (selectedLatitude > 60 || selectedLatitude < -60) return 'Polar';
    if (Math.abs(selectedLatitude) >= 30) return 'Temperate';
    return 'Tropical';
  }, [selectedLatitude]);

  const currentInfo = useMemo(() => {
    const data = {
      'Gulf Stream': {
        region: 'North Atlantic',
        direction: 'North-East',
        type: 'Warm western boundary current',
        speed: '2–2.5 m/s',
        effect: 'Carries warm tropical water toward western Europe.',
      },
      'Kuroshio': {
        region: 'North Pacific',
        direction: 'North-East',
        type: 'Warm western boundary current',
        speed: '1–2 m/s',
        effect: 'Moves warm tropical water northward along Japan.',
      },
      'California Current': {
        region: 'Eastern North Pacific',
        direction: 'South',
        type: 'Cold eastern boundary current',
        speed: '0.1–0.3 m/s',
        effect: 'Transports cool water equatorward along western North America.',
      },
      'Antarctic Circumpolar Current': {
        region: 'Southern Ocean',
        direction: 'East',
        type: 'Cold circumpolar current',
        speed: '0.2–0.6 m/s',
        effect: 'Connects the Atlantic, Pacific and Indian Ocean basins around Antarctica.',
      },
    };
    return data[selectedCurrent];
  }, [selectedCurrent]);

  const simulatedFlow = useMemo(() => {
    const wind = windStrength / 100;
    const coriolis = coriolisStrength / 100;
    const temp = temperatureDifference / 100;
    return {
      surface: Math.round(35 + wind * 45),
      turning: Math.round(10 + coriolis * 80),
      density: Math.round(15 + temp * 70),
    };
  }, [windStrength, coriolisStrength, temperatureDifference]);

  return (
    <div className="currents-page">
      <header className="currents-header">
        <button className="currents-back-button" onClick={onBackToDashboard}>
          ← Back to Dashboard
        </button>

        <div className="currents-header-meta">
          <span className="currents-live-dot" />
          STUDENT ENVIRONMENT
        </div>
      </header>

      <main className="currents-main">
        <CurrentsHero onLaunchGlobe={onLaunchGlobe} />

        <section className="currents-section">
          <CurrentExplorer
            selectedLatitude={selectedLatitude}
            onLatitudeChange={setSelectedLatitude}
            selectedCurrent={selectedCurrent}
            onCurrentChange={setSelectedCurrent}
            latitudeBand={latitudeBand}
            currentInfo={currentInfo}
          />
        </section>

        <section className="currents-section">
          <CurrentForces
            windStrength={windStrength}
            onWindStrengthChange={setWindStrength}
            coriolisStrength={coriolisStrength}
            onCoriolisStrengthChange={setCoriolisStrength}
            temperatureDifference={temperatureDifference}
            onTemperatureDifferenceChange={setTemperatureDifference}
            simulatedFlow={simulatedFlow}
          />
        </section>

        <section className="currents-section">
          <GyreExplorer selectedLatitude={selectedLatitude} />
        </section>

        <section className="currents-section">
          <DepthCurrentExplorer depth={depth} onDepthChange={setDepth} />
        </section>

        <section className="currents-section">
          <CurrentClimateLab
            surfaceTemp={surfaceTemp}
            onSurfaceTempChange={setSurfaceTemp}
            deepTemp={deepTemp}
            onDeepTempChange={setDeepTemp}
            salinityDifference={salinityDifference}
            onSalinityDifferenceChange={setSalinityDifference}
          />
        </section>

        <section className="currents-section">
          <CurrentQuiz
            score={quizScore}
            onScoreChange={setQuizScore}
            answered={quizAnswered}
            onAnsweredChange={setQuizAnswered}
          />
        </section>

        <section className="currents-section">
          <CurrentTakeaways onLaunchGlobe={onLaunchGlobe} />
        </section>
      </main>
    </div>
  );
};

export default CurrentsPage;
