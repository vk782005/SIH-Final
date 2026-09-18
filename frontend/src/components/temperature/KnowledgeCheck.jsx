import React, { useState } from 'react';

const KnowledgeCheck = ({ score, onScoreChange, answered, onAnsweredChange }) => {
  const [answeredQuestions, setAnsweredQuestions] = useState({});

  const questions = [
    {
      id: 1,
      question: 'Where does most ocean heating occur?',
      options: ['Deep ocean (below 1000m)', 'Ocean surface', 'Seafloor'],
      correct: 1,
      explanation:
        'Solar radiation penetrates only the first 100-200 meters of the ocean. Most heating occurs near the surface where sunlight is abundant.',
    },
    {
      id: 2,
      question: 'What is the thermocline?',
      options: [
        'A layer where temperature changes slowly with depth',
        'A layer where temperature changes rapidly with depth',
        'The deepest layer of the ocean',
      ],
      correct: 1,
      explanation:
        'The thermocline is a region of sharp temperature gradient. Temperature typically drops from 20°C to 5°C over 100-200 meters.',
    },
    {
      id: 3,
      question: 'How does temperature affect seawater density?',
      options: ['Higher temperature → higher density', 'Higher temperature → lower density', 'Temperature has no effect'],
      correct: 1,
      explanation:
        'Warmer water expands and becomes less dense. This is why warm water tends to stay near the surface and cold water sinks.',
    },
    {
      id: 4,
      question: 'Which latitude receives the most solar energy per unit area?',
      options: ['Poles (90°)', 'Equator (0°)', 'Temperate regions (45°)'],
      correct: 1,
      explanation:
        'At the equator, the sun is high in the sky year-round, and solar rays hit the surface nearly perpendicularly. Polar regions receive oblique rays.',
    },
    {
      id: 5,
      question: 'What is a major consequence of temperature differences in the ocean?',
      options: [
        'They reduce light penetration',
        'They drive ocean circulation patterns',
        'They have no significant effect',
      ],
      correct: 1,
      explanation:
        'Temperature-driven density differences create pressure gradients that drive the thermohaline circulation, one of Earth\'s most important ocean current systems.',
    },
    {
      id: 6,
      question: 'How deep can sunlight typically penetrate the ocean?',
      options: ['10-20 meters', '100-200 meters', 'Over 1000 meters'],
      correct: 1,
      explanation:
        'Most sunlight is absorbed by water and dissolved particles in the first 100-200 meters. Below this, the ocean is too dark for photosynthesis.',
    },
  ];

  const handleSelectOption = (questionId, optionIndex) => {
    const question = questions.find((q) => q.id === questionId);

    setAnsweredQuestions((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));

    if (optionIndex === question.correct) {
      const newScore = score + 1;
      onScoreChange(newScore);
    }

    onAnsweredChange(answered + 1);
  };

  const isQuestionAnswered = (questionId) => answeredQuestions.hasOwnProperty(questionId);
  const getSelectedOption = (questionId) => answeredQuestions[questionId];

  const progressPercent = (answered / questions.length) * 100;

  return (
    <section>
      <div className="section-header">
        <div className="section-label">Section 10</div>
        <h2 className="section-title">Knowledge Check</h2>
      </div>

      <p className="section-subtitle">
        Test your understanding of ocean temperature. Answer these questions to see what you've learned.
      </p>

      {/* Progress bar */}
      <div style={{
        marginBottom: '2rem',
        marginTop: '1rem',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '0.5rem',
          fontSize: '0.9rem',
          color: 'var(--text-secondary)',
        }}>
          <span>Progress</span>
          <span>{answered} of {questions.length} answered</span>
        </div>
        <div style={{
          width: '100%',
          height: '6px',
          background: 'rgba(0, 136, 170, 0.2)',
          borderRadius: '2px',
          overflow: 'hidden',
          border: '1px solid var(--border-color)',
        }}>
          <div
            style={{
              width: `${progressPercent}%`,
              height: '100%',
              background: 'linear-gradient(90deg, var(--cyan-dim), var(--cyan-bright))',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Score display */}
      {answered > 0 && (
        <div className="quiz-score">
          <span className="quiz-score-label">Score</span>
          <span className="quiz-score-value">{score}/{answered}</span>
          <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {Math.round((score / answered) * 100)}%
          </span>
        </div>
      )}

      {/* Questions */}
      <div style={{ marginTop: '2rem' }}>
        {questions.map((q, index) => (
          <div key={q.id} className="quiz-container">
            <div className="quiz-question">
              <div className="quiz-question-number">Question {index + 1}</div>
              <div className="quiz-question-text">{q.question}</div>

              <div className="quiz-options">
                {q.options.map((option, optionIndex) => {
                  const isAnswered = isQuestionAnswered(q.id);
                  const selectedOption = getSelectedOption(q.id);
                  const isSelected = selectedOption === optionIndex;
                  const isCorrect = optionIndex === q.correct;

                  let buttonClass = 'quiz-option';
                  if (isAnswered) {
                    if (isSelected && isCorrect) {
                      buttonClass += ' correct';
                    } else if (isSelected && !isCorrect) {
                      buttonClass += ' incorrect';
                    } else if (isCorrect) {
                      buttonClass += ' correct';
                    }
                  } else if (isSelected) {
                    buttonClass += ' selected';
                  }

                  return (
                    <button
                      key={optionIndex}
                      className={buttonClass}
                      onClick={() => handleSelectOption(q.id, optionIndex)}
                      disabled={isAnswered}
                      style={{
                        opacity: isAnswered && !isSelected && !isCorrect ? 0.6 : 1,
                        cursor: isAnswered ? 'default' : 'pointer',
                      }}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>

              {isQuestionAnswered(q.id) && (
                <div className="quiz-feedback">
                  <strong>
                    {getSelectedOption(q.id) === q.correct ? '✓ Correct!' : '✗ Incorrect'}
                  </strong>
                  <p style={{ marginTop: '0.5rem', marginBottom: '0' }}>
                    {q.explanation}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      {answered === questions.length && (
        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          background: 'rgba(0, 88, 170, 0.15)',
          border: '1px solid var(--cyan-dim)',
          borderRadius: '2px',
        }}>
          <p style={{
            margin: '0 0 1rem 0',
            fontSize: '1.1rem',
            color: 'var(--text-primary)',
            fontWeight: '500',
          }}>
            Quiz Complete!
          </p>

          <p style={{
            margin: '0 0 1rem 0',
            fontSize: '0.95rem',
            color: 'var(--text-secondary)',
            lineHeight: '1.6',
          }}>
            You scored <strong>{score} out of {questions.length}</strong> ({Math.round((score / questions.length) * 100)}%).
          </p>

          {score === questions.length && (
            <p style={{
              margin: '0',
              fontSize: '0.9rem',
              color: 'var(--cyan-bright)',
              fontWeight: '600',
            }}>
              Perfect score! You've mastered ocean temperature concepts.
            </p>
          )}

          {score >= questions.length * 0.8 && score < questions.length && (
            <p style={{
              margin: '0',
              fontSize: '0.9rem',
              color: 'var(--cyan-bright)',
              fontWeight: '600',
            }}>
              Excellent work! You understand most concepts. Review the feedback above to reinforce your learning.
            </p>
          )}

          {score < questions.length * 0.8 && (
            <p style={{
              margin: '0',
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
              fontWeight: '600',
            }}>
              Review the feedback and explore the interactive sections above to deepen your understanding.
            </p>
          )}
        </div>
      )}

      {/* Encouragement */}
      {answered === 0 && (
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          background: 'rgba(0, 88, 170, 0.1)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '2px',
          textAlign: 'center',
        }}>
          <p style={{
            margin: '0',
            fontSize: '0.95rem',
            color: 'var(--text-secondary)',
            lineHeight: '1.6',
          }}>
            Ready to test your knowledge? Click an option above to get started.
          </p>
        </div>
      )}
    </section>
  );
};

export default KnowledgeCheck;
