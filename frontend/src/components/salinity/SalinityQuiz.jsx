import React, { useState } from "react";

const questions = [
  {
    question:
      "What generally happens to surface salinity when evaporation increases?",
    options: [
      "It increases",
      "It decreases",
      "It becomes zero",
      "It does not change",
    ],
    answer: 0,
    explanation:
      "When water evaporates, much of the salt remains behind, increasing the concentration of dissolved salts.",
  },
  {
    question:
      "Which water mass is generally denser if temperature is the same?",
    options: [
      "30 PSU",
      "32 PSU",
      "35 PSU",
      "38 PSU",
    ],
    answer: 3,
    explanation:
      "At the same temperature, increasing salinity generally increases seawater density.",
  },
  {
    question:
      "What does heavy rainfall generally do to surface ocean salinity?",
    options: [
      "Raises it",
      "Lowers it",
      "Has no possible effect",
      "Turns seawater into ice",
    ],
    answer: 1,
    explanation:
      "Rain adds freshwater to the ocean surface and can reduce surface salinity.",
  },
];

const SalinityQuiz = ({
  score,
  setScore,
  answered,
  setAnswered,
}) => {

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const question = questions[currentQuestion];

  const submitAnswer = () => {
    if (selected === null || submitted) return;

    if (selected === question.answer) {
      setScore(score + 1);
    }

    setAnswered(answered + 1);
    setSubmitted(true);
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelected(null);
      setSubmitted(false);
    }
  };

  return (
    <div className="salinity-card quiz-card">

      <div className="salinity-card-header">

        <div>
          <span className="salinity-section-label">
            KNOWLEDGE CHECK
          </span>

          <h2>Test your understanding</h2>

          <p>
            Use what you've learned about salinity and density.
          </p>
        </div>

        <div className="quiz-score">
          {score} / {questions.length}
        </div>

      </div>

      <div className="quiz-progress">

        <span>
          QUESTION {currentQuestion + 1}
        </span>

        <div>
          {questions.map((_, index) => (
            <i
              key={index}
              className={
                index === currentQuestion
                  ? "active"
                  : index < currentQuestion
                  ? "completed"
                  : ""
              }
            />
          ))}
        </div>

      </div>

      <div className="quiz-question">

        <h3>
          {question.question}
        </h3>

        <div className="quiz-options">

          {question.options.map((option, index) => {

            let className = "quiz-option";

            if (selected === index) {
              className += " selected";
            }

            if (submitted && index === question.answer) {
              className += " correct";
            }

            if (
              submitted &&
              selected === index &&
              index !== question.answer
            ) {
              className += " incorrect";
            }

            return (
              <button
                key={option}
                className={className}
                onClick={() => setSelected(index)}
                disabled={submitted}
              >
                <span>
                  {String.fromCharCode(65 + index)}
                </span>

                {option}
              </button>
            );
          })}

        </div>

        {!submitted ? (
          <button
            className="quiz-submit"
            onClick={submitAnswer}
            disabled={selected === null}
          >
            CHECK ANSWER
          </button>
        ) : (
          <div className="quiz-feedback">

            <div>
              {selected === question.answer
                ? "✓ CORRECT"
                : "✕ NOT QUITE"}
            </div>

            <p>
              {question.explanation}
            </p>

            {currentQuestion < questions.length - 1 && (
              <button
                className="quiz-submit"
                onClick={nextQuestion}
              >
                NEXT QUESTION →
              </button>
            )}

          </div>
        )}

      </div>

    </div>
  );
};

export default SalinityQuiz;