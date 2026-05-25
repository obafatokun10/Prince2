import React, { useState, useEffect } from 'react';
import {
  scenarios,
  questionIndex,
  getFocusesForSyllabusArea,
  getQuestionsByFilter,
  getScenarioQuestions,
} from './data/index.js';

// ============================================================================
// HELPER FUNCTIONS FOR SESSION TRACKING
// ============================================================================
const sessionStorageHelpers = {
  saveSession: (profile, sessionData) => {
    const sessions = JSON.parse(localStorage.getItem(`p2p:${profile}:sessions`) || '[]');
    sessions.push({
      ...sessionData,
      timestamp: Date.now(),
      date: new Date().toLocaleDateString(),
    });
    localStorage.setItem(`p2p:${profile}:sessions`, JSON.stringify(sessions));
  },
  
  getSessions: (profile) => {
    return JSON.parse(localStorage.getItem(`p2p:${profile}:sessions`) || '[]');
  },
  
  getWrongQuestions: (profile) => {
    return JSON.parse(localStorage.getItem(`p2p:${profile}:wrongQuestions`) || '[]');
  },
  
  toggleWrongQuestion: (profile, questionId) => {
    const wrongQs = sessionStorageHelpers.getWrongQuestions(profile);
    const index = wrongQs.indexOf(questionId);
    if (index > -1) {
      wrongQs.splice(index, 1);
    } else {
      wrongQs.push(questionId);
    }
    localStorage.setItem(`p2p:${profile}:wrongQuestions`, JSON.stringify(wrongQs));
    return wrongQs;
  },
  
  getCategoryBreakdown: (answers) => {
    const breakdown = {
      principles: { correct: 0, total: 0 },
      processes: { correct: 0, total: 0 },
      practices: { correct: 0, total: 0 },
      people: { correct: 0, total: 0 },
    };
    
    answers.forEach(answer => {
      const q = questionIndex.get(answer.questionId);
      if (q) {
        const area = q.syllabus_area || 'practices';
        breakdown[area].total++;
        if (answer.correct) breakdown[area].correct++;
      }
    });
    
    return breakdown;
  },
};

const CategoryBreakdownDisplay = ({ answers }) => {
  const breakdown = sessionStorageHelpers.getCategoryBreakdown(answers);
  const categoryNames = {
    principles: 'Principles',
    processes: 'Processes',
    practices: 'Practices',
    people: 'People',
  };

  return (
    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #ddd' }}>
      <h3 style={{ marginTop: 0, marginBottom: '12px' }}>Score by Category</h3>
      {Object.entries(breakdown).map(([key, data]) => {
        if (data.total === 0) return null;
        const pct = ((data.correct / data.total) * 100).toFixed(0);
        return (
          <div key={key} style={{ marginBottom: '12px', fontSize: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span><strong>{categoryNames[key]}</strong></span>
              <span>{data.correct} / {data.total} ({pct}%)</span>
            </div>
            <div style={{ height: '8px', backgroundColor: '#e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  backgroundColor: pct >= 70 ? '#4caf50' : '#d32f2f',
                  width: `${pct}%`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ============================================================================
// STYLES
// ============================================================================
const styles = {
  app: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    fontFamily: 'inherit',
  },
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '16px',
  },
  header: {
    backgroundColor: '#1e4078',
    color: 'white',
    padding: '16px',
    marginBottom: '24px',
    borderRadius: '4px',
  },
  headerTitle: {
    fontSize: '24px',
    fontWeight: '600',
    margin: '0 0 8px 0',
  },
  headerSubtitle: {
    fontSize: '14px',
    opacity: '0.9',
    margin: 0,
  },
  button: {
    padding: '10px 16px',
    backgroundColor: '#1e4078',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  buttonSecondary: {
    padding: '10px 16px',
    backgroundColor: '#e0e0e0',
    color: '#333',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  buttonDanger: {
    padding: '10px 16px',
    backgroundColor: '#d32f2f',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  card: {
    backgroundColor: 'white',
    padding: '16px',
    marginBottom: '16px',
    borderRadius: '4px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  input: {
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    marginBottom: '8px',
    fontFamily: 'inherit',
  },
  select: {
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    marginBottom: '8px',
    fontFamily: 'inherit',
  },
};

// ============================================================================
// WELCOME / PROFILE MANAGEMENT
// ============================================================================
function WelcomeScreen({ onProfileSelect }) {
  const [name, setName] = useState('');
  const [profiles, setProfiles] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('p2p:users');
    if (saved) {
      setProfiles(JSON.parse(saved));
    }
  }, []);

  const addProfile = () => {
    if (!name.trim()) return;
    const newProfiles = [...profiles, { name: name.trim(), createdAt: Date.now() }];
    localStorage.setItem('p2p:users', JSON.stringify(newProfiles));
    onProfileSelect(name.trim());
    setProfiles(newProfiles);
    setName('');
  };

  const selectProfile = (profileName) => {
    onProfileSelect(profileName);
  };

  const deleteProfile = (profileName) => {
    const newProfiles = profiles.filter((p) => p.name !== profileName);
    localStorage.setItem('p2p:users', JSON.stringify(newProfiles));
    setProfiles(newProfiles);
    // Delete all profile data
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(`p2p:${profileName}:`)) {
        localStorage.removeItem(key);
      }
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>PRINCE2 7 Practitioner</h1>
        <p style={styles.headerSubtitle}>Practice Questions • 180 questions available</p>
      </div>

      <div style={styles.card}>
        <h2>Welcome</h2>
        <p>Create or select a profile to begin practicing.</p>

        {profiles.length > 0 && (
          <>
            <h3 style={{ marginTop: '16px', marginBottom: '8px' }}>Your Profiles</h3>
            {profiles.map((p) => (
              <div
                key={p.name}
                style={{
                  padding: '12px',
                  marginBottom: '8px',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <button
                  style={{
                    ...styles.button,
                    backgroundColor: '#1e4078',
                    flex: 1,
                    marginRight: '8px',
                  }}
                  onClick={() => selectProfile(p.name)}
                >
                  {p.name}
                </button>
                <button
                  style={styles.buttonDanger}
                  onClick={() => deleteProfile(p.name)}
                >
                  Delete
                </button>
              </div>
            ))}
          </>
        )}

        {!showAddForm ? (
          <button
            style={{ ...styles.button, marginTop: '16px', width: '100%' }}
            onClick={() => setShowAddForm(true)}
          >
            + Create New Profile
          </button>
        ) : (
          <div style={{ marginTop: '16px' }}>
            <input
              style={styles.input}
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addProfile()}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={{ ...styles.button, flex: 1 }} onClick={addProfile}>
                Create
              </button>
              <button
                style={{ ...styles.buttonSecondary, flex: 1 }}
                onClick={() => {
                  setShowAddForm(false);
                  setName('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// QUESTION RENDERERS
// ============================================================================
function ClassicQuestion({ question, onAnswer }) {
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [confidence, setConfidence] = useState(null);

  useEffect(() => {
    setSelected(null);
    setSubmitted(false);
    setConfidence(null);
  }, [question.question_id]);

  const handleSubmit = () => {
    if (selected === null) return;
    onAnswer({
      questionId: question.question_id,
      answer: selected,
      correct: selected === question.correct_answer,
      confidence: confidence || 'guessed',
      format: 'classic',
    });
    setSubmitted(true);
  };

  const isCorrect = selected === question.correct_answer;

  return (
    <div style={styles.card}>
      <div style={{ marginBottom: '16px' }}>
        <h3>{question.stem}</h3>
      </div>

      <div style={{ marginBottom: '16px' }}>
        {question.options.map((opt) => (
          <div
            key={opt.letter}
            style={{
              padding: '12px',
              marginBottom: '8px',
              border:
                selected === opt.letter
                  ? '2px solid #1e4078'
                  : submitted
                  ? opt.letter === question.correct_answer
                    ? '2px solid #4caf50'
                    : opt.letter === selected && !isCorrect
                    ? '2px solid #d32f2f'
                    : '1px solid #ddd'
                  : '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor:
                submitted && opt.letter === question.correct_answer
                  ? '#f1f8f4'
                  : submitted && opt.letter === selected && !isCorrect
                  ? '#fff3f3'
                  : 'white',
              cursor: 'pointer',
            }}
            onClick={() => !submitted && setSelected(opt.letter)}
          >
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>
              {opt.letter}. {opt.text}
            </div>
            <div style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
              {opt.justification}
            </div>
          </div>
        ))}
      </div>

      {!submitted ? (
        <div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={confidence === 'confident'}
                onChange={(e) => setConfidence(e.target.checked ? 'confident' : null)}
              />
              <span style={{ marginLeft: '8px', fontSize: '14px' }}>I'm confident</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginTop: '8px' }}>
              <input
                type="checkbox"
                checked={confidence === 'guessed'}
                onChange={(e) => setConfidence(e.target.checked ? 'guessed' : null)}
              />
              <span style={{ marginLeft: '8px', fontSize: '14px' }}>I guessed</span>
            </label>
          </div>
          <button
            style={{
              ...styles.button,
              width: '100%',
              opacity: selected === null ? 0.5 : 1,
              cursor: selected === null ? 'not-allowed' : 'pointer',
            }}
            onClick={handleSubmit}
            disabled={selected === null}
          >
            Submit Answer
          </button>
        </div>
      ) : (
        <div>
          <div
            style={{
              padding: '12px',
              marginBottom: '12px',
              backgroundColor: isCorrect ? '#f1f8f4' : '#fff3f3',
              borderLeft: `4px solid ${isCorrect ? '#4caf50' : '#d32f2f'}`,
              borderRadius: '4px',
            }}
          >
            <div style={{ fontWeight: '600', marginBottom: '8px' }}>
              {isCorrect ? '✓ Correct' : '✗ Incorrect'}
            </div>
            <div style={{ fontSize: '14px', marginBottom: '8px' }}>
              <strong>Why:</strong> {question.explain_correct}
            </div>
            {!isCorrect && question.explain_wrong && question.explain_wrong[selected] && (
              <div style={{ fontSize: '14px', marginBottom: '8px', color: '#d32f2f' }}>
                <strong>Your answer:</strong> {question.explain_wrong[selected]}
              </div>
            )}
            {question.citation && (
              <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                <strong>Citation:</strong> {question.citation}
              </div>
            )}
          </div>
          <button
            style={{ ...styles.button, width: '100%', marginTop: '16px' }}
            onClick={() => {
              onAnswer({
                questionId: question.question_id,
                answer: selected,
                correct: selected === question.correct_answer,
                confidence: confidence || 'guessed',
                format: 'classic',
                nextQuestion: true,
              });
            }}
          >
            Next Question →
          </button>
        </div>
      )}
    </div>
  );
}

function MatchingQuestion({ question, onAnswer }) {
  const [selections, setSelections] = useState({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setSelections({});
    setSubmitted(false);
  }, [question.question_id]);

  const handleSelect = (itemId, optionLetter) => {
    setSelections({ ...selections, [itemId]: optionLetter });
  };

  const handleSubmit = () => {
    const allSelected = question.matching_context.items.every((item) => selections[item.item_id]);
    if (!allSelected) return;

    const correct = question.matching_context.correct_pairings.filter(
      (pairing) => selections[pairing.item_id] === pairing.matched_option
    ).length;

    onAnswer({
      questionId: question.question_id,
      selections,
      correct,
      total: 3,
      format: 'matching',
    });
    setSubmitted(true);
  };

  const score = submitted
    ? question.matching_context.correct_pairings.filter(
        (p) => selections[p.item_id] === p.matched_option
      ).length
    : null;

  return (
    <div style={styles.card}>
      <div style={{ marginBottom: '16px' }}>
        <h3>{question.matching_context.instructions}</h3>
      </div>

      <div style={{ marginBottom: '16px' }}>
        {question.matching_context.items.map((item) => {
          const isCorrect =
            submitted &&
            selections[item.item_id] ===
              question.matching_context.correct_pairings.find((p) => p.item_id === item.item_id)
                ?.matched_option;

          return (
            <div
              key={item.item_id}
              style={{
                padding: '12px',
                marginBottom: '12px',
                border:
                  submitted && isCorrect
                    ? '2px solid #4caf50'
                    : submitted && selections[item.item_id] && !isCorrect
                    ? '2px solid #d32f2f'
                    : '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor:
                  submitted && isCorrect
                    ? '#f1f8f4'
                    : submitted && !isCorrect
                    ? '#fff3f3'
                    : 'white',
              }}
            >
              <div style={{ fontWeight: '600', marginBottom: '8px' }}>
                {item.item_id}. {item.text}
              </div>
              <select
                style={{
                  ...styles.select,
                  marginBottom: 0,
                  color: selections[item.item_id] ? '#333' : '#999',
                }}
                value={selections[item.item_id] || ''}
                onChange={(e) => handleSelect(item.item_id, e.target.value)}
                disabled={submitted}
              >
                <option value="">-- Select option --</option>
                {question.matching_context.options.map((opt) => (
                  <option key={opt.option_letter} value={opt.option_letter}>
                    {opt.option_letter}. {opt.text}
                  </option>
                ))}
              </select>
              {submitted && (
                <div
                  style={{
                    marginTop: '8px',
                    fontSize: '12px',
                    color: isCorrect ? '#4caf50' : '#d32f2f',
                  }}
                >
                  {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                  {question.matching_context.rationales &&
                    question.matching_context.rationales[`item_${item.item_id}`] && (
                      <div style={{ marginTop: '4px', color: '#333' }}>
                        {question.matching_context.rationales[`item_${item.item_id}`]}
                      </div>
                    )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!submitted ? (
        <button
          style={{
            ...styles.button,
            width: '100%',
            opacity: Object.keys(selections).length < 3 ? 0.5 : 1,
            cursor: Object.keys(selections).length < 3 ? 'not-allowed' : 'pointer',
          }}
          onClick={handleSubmit}
          disabled={Object.keys(selections).length < 3}
        >
          Submit Answer
        </button>
      ) : (
        <div
          style={{
            padding: '12px',
            marginTop: '12px',
            backgroundColor: '#f9f9f9',
            borderRadius: '4px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontWeight: '600' }}>
            Score: {score} / {question.matching_context.items.length}
          </div>
          {question.citation && (
            <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
              <strong>Citation:</strong> {question.citation}
            </div>
          )}
          <button
            style={{ ...styles.button, width: '100%', marginTop: '16px' }}
            onClick={() => {
              onAnswer({
                questionId: question.question_id,
                selections,
                correct: score,
                total: 3,
                format: 'matching',
                nextQuestion: true,
              });
            }}
          >
            Next Question →
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MODE: SCENARIO RUN
// ============================================================================
function ScenarioRun({ profile, onBack }) {
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showSectionScore, setShowSectionScore] = useState(false);

  if (!selectedScenario) {
    return (
      <div style={styles.container}>
        <button style={styles.button} onClick={onBack}>
          ← Back
        </button>
        <h2 style={{ marginTop: '16px', marginBottom: '16px' }}>Select a Scenario</h2>
        {scenarios.map((s) => (
          <div
            key={s.scenario_id}
            style={{
              ...styles.card,
              cursor: 'pointer',
              transition: 'box-shadow 0.2s',
            }}
            onClick={() => {
              setSelectedScenario(s);
              setCurrentQuestionIndex(0);
              setAnswers([]);
              setShowSectionScore(false);
            }}
          >
            <h3 style={{ margin: '0 0 8px 0' }}>{s.scenario_title}</h3>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>
              {s.scenario_context}
            </p>
            <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>
              {s.questions.length} questions
            </p>
          </div>
        ))}
      </div>
    );
  }

  const currentQuestion = selectedScenario.questions[currentQuestionIndex];
  const progress = currentQuestionIndex + 1;

  if (showSectionScore) {
    const correctCount = answers.filter((a) => a.correct).length;
    const wrongCount = answers.length - correctCount;
    const sectionScore = ((correctCount / answers.length) * 100).toFixed(1);
    
    let performanceMessage = '';
    if (sectionScore >= 80) performanceMessage = 'Excellent work!';
    else if (sectionScore >= 70) performanceMessage = 'Good job!';
    else if (sectionScore >= 60) performanceMessage = 'Keep practicing!';
    else performanceMessage = 'Review these topics';

    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2>Section Complete</h2>
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              backgroundColor: sectionScore >= 70 ? '#f1f8f4' : '#fff3f3',
              borderRadius: '4px',
              marginBottom: '16px',
              borderLeft: `4px solid ${sectionScore >= 70 ? '#4caf50' : '#d32f2f'}`,
            }}
          >
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#1e4078', marginBottom: '8px' }}>
              {correctCount}/{answers.length}
            </div>
            <div style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px', color: sectionScore >= 70 ? '#4caf50' : '#d32f2f' }}>
              {sectionScore}%
            </div>
            <div style={{ fontSize: '16px', color: '#666', marginBottom: '16px' }}>
              {performanceMessage}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              <div style={{ marginBottom: '4px' }}>✓ {correctCount} correct</div>
              <div>✗ {wrongCount} incorrect</div>
            </div>
          </div>
          <CategoryBreakdownDisplay answers={answers} />
          <button
            style={{ ...styles.button, width: '100%', marginBottom: '8px', marginTop: '16px' }}
            onClick={() => {
              sessionStorageHelpers.saveSession(profile, {
                type: 'scenario',
                scenario: selectedScenario.scenario_title,
                correct: correctCount,
                total: answers.length,
                score: sectionScore,
              });
              setSelectedScenario(null);
              setAnswers([]);
            }}
          >
            Back to Scenarios
          </button>
          <button
            style={{ ...styles.buttonSecondary, width: '100%' }}
            onClick={() => {
              setCurrentQuestionIndex(0);
              setAnswers([]);
              setShowSectionScore(false);
            }}
          >
            Restart Scenario
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <button style={styles.button} onClick={() => setSelectedScenario(null)}>
          ← Back
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Progress</div>
          <div style={{ fontSize: '14px', fontWeight: '600' }}>
            {progress} / {selectedScenario.questions.length}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Score</div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e4078' }}>
            {answers.filter(a => a.correct).length} / {answers.length}
          </div>
        </div>
      </div>

      <div style={{ ...styles.card, marginBottom: '16px', backgroundColor: '#f0f5fa' }}>
        <h3 style={{ margin: '0 0 8px 0' }}>{selectedScenario.scenario_title}</h3>
        <p style={{ margin: 0, fontSize: '14px', color: '#555' }}>{selectedScenario.scenario_context}</p>
      </div>

      {currentQuestion.format_type === 'classic_1_mark' ? (
        <ClassicQuestion
          question={currentQuestion}
          onAnswer={(answer) => {
            const newAnswers = [...answers, answer];
            setAnswers(newAnswers);

            if (answer.nextQuestion) {
              if (progress < selectedScenario.questions.length) {
                setCurrentQuestionIndex(progress);
              } else {
                setShowSectionScore(true);
              }
            }
          }}
        />
      ) : (
        <MatchingQuestion
          question={currentQuestion}
          onAnswer={(answer) => {
            const newAnswers = [...answers, answer];
            setAnswers(newAnswers);

            if (answer.nextQuestion) {
              if (progress < selectedScenario.questions.length) {
                setCurrentQuestionIndex(progress);
              } else {
                setShowSectionScore(true);
              }
            }
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// MODE: CONTINUOUS
// ============================================================================
function ContinuousMode({ profile, onBack }) {
  const [filters, setFilters] = useState({
    syllabusArea: null,
    focus: null,
  });
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [seenQuestions, setSeenQuestions] = useState(new Set());
  const [answers, setAnswers] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [showRecycleOverlay, setShowRecycleOverlay] = useState(false);

  useEffect(() => {
    const shuffleArray = (arr) => {
      const shuffled = [...arr];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    let qs = [];
    if (!filters.syllabusArea && !filters.focus) {
      // All questions (randomized)
      qs = Array.from(questionIndex.values());
    } else if (filters.syllabusArea && !filters.focus) {
      // All questions in area (randomized)
      qs = getQuestionsByFilter(filters.syllabusArea);
    } else if (filters.syllabusArea && filters.focus) {
      // Questions in area with specific focus (randomized)
      qs = getQuestionsByFilter(filters.syllabusArea, filters.focus);
    }
    
    setFilteredQuestions(shuffleArray(qs));
    setCurrentQuestionIndex(0);
    setSeenQuestions(new Set());
    setAnswers([]);
  }, [filters.syllabusArea, filters.focus]);

  if (filteredQuestions.length === 0) {
    return (
      <div style={styles.container}>
        <button style={styles.button} onClick={onBack}>
          ← Back
        </button>
        <div style={styles.card}>
          <p>No questions match your filters. Please try again.</p>
        </div>
      </div>
    );
  }

  if (currentQuestionIndex >= filteredQuestions.length && seenQuestions.size > 0) {
    const correctCount = answers.filter((a) => a.correct).length;
    const wrongCount = answers.length - correctCount;
    const score = ((correctCount / answers.length) * 100).toFixed(1);
    
    let performanceMessage = '';
    if (score >= 80) performanceMessage = 'Excellent work!';
    else if (score >= 70) performanceMessage = 'Good job!';
    else if (score >= 60) performanceMessage = 'Keep practicing!';
    else performanceMessage = 'Review these topics';

    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2>Session Complete</h2>
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              backgroundColor: score >= 70 ? '#f1f8f4' : '#fff3f3',
              borderRadius: '4px',
              marginBottom: '16px',
              borderLeft: `4px solid ${score >= 70 ? '#4caf50' : '#d32f2f'}`,
            }}
          >
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#1e4078', marginBottom: '8px' }}>
              {correctCount}/{answers.length}
            </div>
            <div style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px', color: score >= 70 ? '#4caf50' : '#d32f2f' }}>
              {score}%
            </div>
            <div style={{ fontSize: '16px', color: '#666', marginBottom: '16px' }}>
              {performanceMessage}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              <div style={{ marginBottom: '4px' }}>✓ {correctCount} correct</div>
              <div>✗ {wrongCount} incorrect</div>
            </div>
          </div>
          <CategoryBreakdownDisplay answers={answers} />
          <button
            style={{ ...styles.button, width: '100%', marginBottom: '8px', marginTop: '16px' }}
            onClick={() => {
              answers.forEach(ans => {
                if (!ans.correct) {
                  sessionStorageHelpers.toggleWrongQuestion(profile, ans.questionId);
                }
              });
              sessionStorageHelpers.saveSession(profile, {
                type: 'continuous',
                correct: correctCount,
                total: answers.length,
                score: score,
              });
              setSeenQuestions(new Set());
              setCurrentQuestionIndex(0);
              setAnswers([]);
            }}
          >
            Start Over
          </button>
          <button style={{ ...styles.buttonSecondary, width: '100%' }} onClick={onBack}>
            Back
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = filteredQuestions[currentQuestionIndex];
  const progress = seenQuestions.size + 1;

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <button style={styles.button} onClick={onBack}>
          ← Back
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Progress</div>
          <div style={{ fontSize: '14px', fontWeight: '600' }}>
            {progress} of {filteredQuestions.length}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Score</div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e4078' }}>
            {answers.filter(a => a.correct).length} / {answers.length}
          </div>
        </div>
      </div>

      <div style={{ ...styles.card, marginBottom: '16px', backgroundColor: '#f0f5fa' }}>
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Filter</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <select
            style={{
              ...styles.select,
              flex: 1,
              minWidth: '150px',
              marginBottom: 0,
            }}
            value={filters.syllabusArea || ''}
            onChange={(e) =>
              setFilters({ ...filters, syllabusArea: e.target.value || null, focus: null })
            }
          >
            <option value="">All Areas</option>
            <option value="principles">Principles</option>
            <option value="people">People</option>
            <option value="practices">Practices</option>
            <option value="processes">Processes</option>
          </select>
          {filters.syllabusArea && (
            <select
              style={{
                ...styles.select,
                flex: 1,
                minWidth: '150px',
                marginBottom: 0,
              }}
              value={filters.focus || ''}
              onChange={(e) => setFilters({ ...filters, focus: e.target.value || null })}
            >
              <option value="">All {filters.syllabusArea}</option>
              {getFocusesForSyllabusArea(filters.syllabusArea).map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {currentQuestion.format_type === 'classic_1_mark' ? (
        <ClassicQuestion
          question={currentQuestion}
          onAnswer={(answer) => {
            const newAnswers = [...answers, answer];
            setAnswers(newAnswers);
            
            if (answer.nextQuestion) {
              const newSeen = new Set(seenQuestions);
              newSeen.add(currentQuestion.question_id);
              setSeenQuestions(newSeen);
              setCurrentQuestionIndex(currentQuestionIndex + 1);
            }
          }}
        />
      ) : (
        <MatchingQuestion
          question={currentQuestion}
          onAnswer={(answer) => {
            const newAnswers = [...answers, answer];
            setAnswers(newAnswers);
            
            if (answer.nextQuestion) {
              const newSeen = new Set(seenQuestions);
              newSeen.add(currentQuestion.question_id);
              setSeenQuestions(newSeen);
              setCurrentQuestionIndex(currentQuestionIndex + 1);
            }
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// MODE: WRONG QUESTIONS PRACTICE
// ============================================================================
function WrongQuestionsMode({ profile, onBack }) {
  const wrongQIds = sessionStorageHelpers.getWrongQuestions(profile);
  const wrongQuestions = wrongQIds
    .map(id => questionIndex.get(id))
    .filter(q => q)
    .sort(() => Math.random() - 0.5);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);

  if (wrongQuestions.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <button style={styles.button} onClick={onBack}>
            ← Back
          </button>
          <h2 style={{ marginTop: '16px' }}>No Wrong Questions Yet</h2>
          <p>As you practice and mark questions as wrong, they'll appear here for review.</p>
        </div>
      </div>
    );
  }

  if (currentQuestionIndex >= wrongQuestions.length && answers.length > 0) {
    const correctCount = answers.filter(a => a.correct).length;
    const wrongCount = answers.length - correctCount;
    const score = ((correctCount / answers.length) * 100).toFixed(1);

    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2>Review Complete</h2>
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              backgroundColor: score >= 70 ? '#f1f8f4' : '#fff3f3',
              borderRadius: '4px',
              marginBottom: '16px',
              borderLeft: `4px solid ${score >= 70 ? '#4caf50' : '#d32f2f'}`,
            }}
          >
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#1e4078', marginBottom: '8px' }}>
              {correctCount}/{answers.length}
            </div>
            <div style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px', color: score >= 70 ? '#4caf50' : '#d32f2f' }}>
              {score}%
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              <div style={{ marginBottom: '4px' }}>✓ {correctCount} correct</div>
              <div>✗ {wrongCount} incorrect</div>
            </div>
          </div>
          <CategoryBreakdownDisplay answers={answers} />
          <button
            style={{ ...styles.button, width: '100%', marginBottom: '8px', marginTop: '16px' }}
            onClick={() => {
              setCurrentQuestionIndex(0);
              setAnswers([]);
            }}
          >
            Try Again
          </button>
          <button style={{ ...styles.buttonSecondary, width: '100%' }} onClick={onBack}>
            Back
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = wrongQuestions[currentQuestionIndex];
  const progress = currentQuestionIndex + 1;

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <button style={styles.button} onClick={onBack}>
          ← Back
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Progress</div>
          <div style={{ fontSize: '14px', fontWeight: '600' }}>
            {progress} / {wrongQuestions.length}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Score</div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e4078' }}>
            {answers.filter(a => a.correct).length} / {answers.length}
          </div>
        </div>
      </div>

      {currentQuestion.format_type === 'classic_1_mark' ? (
        <ClassicQuestion
          question={currentQuestion}
          onAnswer={(answer) => {
            const newAnswers = [...answers, answer];
            setAnswers(newAnswers);

            if (answer.nextQuestion) {
              setCurrentQuestionIndex(progress);
            }
          }}
        />
      ) : (
        <MatchingQuestion
          question={currentQuestion}
          onAnswer={(answer) => {
            const newAnswers = [...answers, answer];
            setAnswers(newAnswers);

            if (answer.nextQuestion) {
              setCurrentQuestionIndex(progress);
            }
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// SESSION HISTORY SCREEN
// ============================================================================
function SessionHistoryScreen({ profile, onBack }) {
  const sessions = sessionStorageHelpers.getSessions(profile);
  const avgScore = sessions.length > 0
    ? (sessions.reduce((sum, s) => sum + parseFloat(s.score), 0) / sessions.length).toFixed(1)
    : 0;

  return (
    <div style={styles.container}>
      <button style={styles.button} onClick={onBack}>
        ← Back
      </button>

      <div style={styles.card}>
        <h2>Session History</h2>
        {sessions.length === 0 ? (
          <p>No sessions yet. Complete a practice session to see your history here.</p>
        ) : (
          <>
            <div style={{ backgroundColor: '#f0f5fa', padding: '16px', borderRadius: '4px', marginBottom: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Average Score</div>
              <div style={{ fontSize: '28px', fontWeight: '600', color: '#1e4078' }}>{avgScore}%</div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>{sessions.length} sessions</div>
            </div>

            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {[...sessions].reverse().map((session, idx) => (
                <div key={idx} style={{ 
                  padding: '12px', 
                  marginBottom: '8px', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px',
                  backgroundColor: session.score >= 70 ? '#f1f8f4' : '#fff3f3'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div>
                      <strong>{session.type === 'scenario' ? '📑' : '∞'} {session.scenario || 'Continuous Practice'}</strong>
                    </div>
                    <div style={{ fontWeight: '600', color: session.score >= 70 ? '#4caf50' : '#d32f2f' }}>
                      {session.score}%
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {session.correct}/{session.total} correct • {session.date}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// HOME SCREEN
// ============================================================================
function HomeScreen({ profile, onLogout }) {
  const [mode, setMode] = useState(null);

  if (mode === 'scenario') {
    return <ScenarioRun profile={profile} onBack={() => setMode(null)} />;
  }

  if (mode === 'continuous') {
    return <ContinuousMode profile={profile} onBack={() => setMode(null)} />;
  }
  
  if (mode === 'wrongQuestions') {
    return <WrongQuestionsMode profile={profile} onBack={() => setMode(null)} />;
  }
  
  if (mode === 'sessionHistory') {
    return <SessionHistoryScreen profile={profile} onBack={() => setMode(null)} />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>Welcome, {profile}!</h1>
        <p style={styles.headerSubtitle}>180 questions ready to practice</p>
      </div>

      <div style={styles.card}>
        <h2>Choose Your Mode</h2>
        <button
          style={{
            ...styles.button,
            width: '100%',
            marginBottom: '8px',
            padding: '16px',
            fontSize: '16px',
          }}
          onClick={() => setMode('scenario')}
        >
          📑 Scenario Run
        </button>
        <p style={{ fontSize: '12px', color: '#666', marginBottom: '16px' }}>
          Work through a complete scenario with all its questions
        </p>

        <button
          style={{
            ...styles.button,
            width: '100%',
            marginBottom: '8px',
            padding: '16px',
            fontSize: '16px',
          }}
          onClick={() => setMode('continuous')}
        >
          ∞ Continuous Practice
        </button>
        <p style={{ fontSize: '12px', color: '#666', marginBottom: '16px' }}>
          Questions across scenarios with filtering by topic
        </p>

        <button
          style={{
            ...styles.button,
            width: '100%',
            marginBottom: '8px',
            padding: '16px',
            fontSize: '16px',
          }}
          onClick={() => setMode('wrongQuestions')}
        >
          🔴 Practice Wrong Questions
        </button>
        <p style={{ fontSize: '12px', color: '#666', marginBottom: '16px' }}>
          Focus on questions you've answered incorrectly
        </p>

        <button
          style={{
            ...styles.button,
            width: '100%',
            marginBottom: '8px',
            padding: '16px',
            fontSize: '16px',
          }}
          onClick={() => setMode('sessionHistory')}
        >
          📊 Session History
        </button>
        <p style={{ fontSize: '12px', color: '#666', marginBottom: '16px' }}>
          View past sessions and track your progress
        </p>

        <button style={{ ...styles.buttonSecondary, width: '100%' }} onClick={onLogout}>
          Switch Profile
        </button>
      </div>

      <div style={styles.card}>
        <h3>Question Bank</h3>
        <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
          <strong>Total:</strong> 180 questions (all batches complete)
        </p>
        <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
          <strong>Principles:</strong> ~18 questions
        </p>
        <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
          <strong>People:</strong> ~15 questions
        </p>
        <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
          <strong>Practices:</strong> ~93 questions
        </p>
        <p style={{ margin: 0, fontSize: '14px' }}>
          <strong>Processes:</strong> ~30 questions
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN APP
// ============================================================================
export default function App() {
  const [activeProfile, setActiveProfile] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('p2p:activeProfile');
    if (saved) {
      setActiveProfile(saved);
    }
  }, []);

  const handleProfileSelect = (profileName) => {
    localStorage.setItem('p2p:activeProfile', profileName);
    setActiveProfile(profileName);
  };

  const handleLogout = () => {
    localStorage.setItem('p2p:activeProfile', '');
    setActiveProfile(null);
  };

  return (
    <div style={styles.app}>
      {!activeProfile ? (
        <WelcomeScreen onProfileSelect={handleProfileSelect} />
      ) : (
        <HomeScreen profile={activeProfile} onLogout={handleLogout} />
      )}
    </div>
  );
}
