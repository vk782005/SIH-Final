import { useState } from "react";

const questions = [
  {
    q: "Why is chlorophyll useful when studying ocean productivity?",
    options: [
      "It is an indicator associated with phytoplankton biomass",
      "It directly measures ocean depth",
      "It measures wave height",
      "It measures salinity only"
    ],
    answer: 0,
    explanation: "Chlorophyll measurements are commonly used as an indicator of phytoplankton biomass and biological productivity."
  },
  {
    q: "Which combination can strongly influence phytoplankton growth?",
    options: [
      "Only water colour",
      "Light, nutrients, mixing and temperature",
      "Only ocean depth",
      "Only wind speed"
    ],
    answer: 1,
    explanation: "Phytoplankton growth depends on interacting physical and chemical conditions."
  },
  {
    q: "Why can upwelling create productive surface waters?",
    options: [
      "It removes all nutrients",
      "It brings deeper nutrient-rich water toward the surface",
      "It blocks sunlight",
      "It stops mixing"
    ],
    answer: 1,
    explanation: "Upwelling can transport nutrients from deeper water into the sunlit zone."
  },
  {
    q: "What commonly limits photosynthesis as depth increases?",
    options: [
      "Decreasing light",
      "Increasing sunlight",
      "Increasing atmospheric pressure only",
      "The colour of the seafloor"
    ],
    answer: 0,
    explanation: "Light decreases with depth, increasingly limiting photosynthesis."
  }
];

const ChlorophyllKnowledgeCheck = ({
  score,
  onScoreChange,
  answered,
  onAnsweredChange
}) => {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);

  const question = questions[current];

  const choose = (index) => {
    if (selected !== null) return;
    setSelected(index);
    onAnsweredChange(answered + 1);
    if (index === question.answer) onScoreChange(score + 1);
  };

  const next = () => {
    if (current < questions.length - 1) {
      setCurrent(current + 1);
      setSelected(null);
    }
  };

  return (
    <div className="chl-panel">
      <p className="chl-kicker">Section 07 · Knowledge check</p>
      <h2 className="chl-title">Test your understanding</h2>
      <p className="chl-subtitle">
        Question {current + 1} of {questions.length} · Score {score}/{questions.length}
      </p>

      <div className="chl-progress">
        <div
          className="chl-progress-fill"
          style={{ width: `${((current + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="chl-question">
        <h3>{question.q}</h3>
        {question.options.map((option, index) => {
          const state =
            selected === null
              ? ""
              : index === question.answer
                ? "correct"
                : selected === index
                  ? "wrong"
                  : "";

          return (
            <button
              key={option}
              type="button"
              className={`chl-answer ${state}`}
              onClick={() => choose(index)}
            >
              {option}
            </button>
          );
        })}

        {selected !== null && (
          <div className="chl-note">
            {selected === question.answer ? "Correct. " : "Not quite. "}
            {question.explanation}
          </div>
        )}
      </div>

      {selected !== null && current < questions.length - 1 && (
        <button className="chl-button" type="button" onClick={next}>
          Next Question →
        </button>
      )}

      {selected !== null && current === questions.length - 1 && (
        <div className="chl-note">
          Quiz complete. Final score: <strong>{score}/{questions.length}</strong>
        </div>
      )}
    </div>
  );
};

export default ChlorophyllKnowledgeCheck;
