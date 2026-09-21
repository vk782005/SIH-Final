import { useState } from "react";

const questions = [
  {
    question: 'What is one major driver of surface ocean currents?',
    options: ['Wind', 'Moonlight', 'Seafloor temperature only', 'Earthquakes'],
    answer: 0,
  },
  {
    question: 'Why does the Coriolis effect matter for large-scale currents?',
    options: [
      'It stops water from moving.',
      'It deflects moving water because Earth rotates.',
      'It makes seawater evaporate.',
      'It changes ocean salinity directly.',
    ],
    answer: 1,
  },
  {
    question: 'What helps drive deep ocean circulation?',
    options: [
      'Density differences caused by temperature and salinity',
      'Cloud cover',
      'Tides only',
      'Sunlight at 4000 m',
    ],
    answer: 0,
  },
];

const CurrentQuiz = ({ score, onScoreChange, answered, onAnsweredChange }) => {
  const [selected, setSelected] = useState({});

  const answerQuestion = (questionIndex, optionIndex) => {
    if (selected[questionIndex] !== undefined) return;

    const question = questions[questionIndex];

    setSelected((prev) => ({
      ...prev,
      [questionIndex]: optionIndex,
    }));

    onAnsweredChange(answered + 1);

    if (optionIndex === question.answer) {
      onScoreChange(score + 1);
    }
  };

  return (
    <div className="currents-panel">
      <div className="currents-panel-header">
        <div className="currents-eyebrow">KNOWLEDGE CHECK · 06</div>
        <h2 className="currents-panel-title">Can you read the current?</h2>
        <p className="currents-panel-subtitle">
          Test the concepts you explored above.
        </p>
      </div>

      {questions.map((question, qIndex) => (
        <div className="quiz-question" key={question.question}>
          <h3>{qIndex + 1}. {question.question}</h3>

          <div className="quiz-options">
            {question.options.map((option, optionIndex) => {
              const wasSelected = selected[qIndex] === optionIndex;
              const wasAnswered = selected[qIndex] !== undefined;
              const isCorrect = optionIndex === question.answer;

              let className = 'quiz-option';
              if (wasAnswered && isCorrect) className += ' correct';
              else if (wasSelected && !isCorrect) className += ' wrong';

              return (
                <button
                  key={option}
                  className={className}
                  onClick={() => answerQuestion(qIndex, optionIndex)}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="quiz-score">
        SCORE · {score}/{questions.length} · ANSWERED {answered}/{questions.length}
      </div>
    </div>
  );
};

export default CurrentQuiz;
