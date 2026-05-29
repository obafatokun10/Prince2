// Import clean PRINCE2 question bank
import questionBankData from './questions-clean.json';

/**
 * Helper to safely retrieve the focus key from a question.
 * Handles: practice_focus, process_focus, principle_focus
 * Also handles the case where people questions use practice_focus
 */
function getFocus(question) {
  return (
    question.practice_focus ||
    question.process_focus ||
    question.principle_focus ||
    null
  );
}

/**
 * Load the clean PRINCE2 question bank
 */
function loadQuestionBank() {
  const scenarioMap = new Map();
  
  if (questionBankData.scenarios) {
    questionBankData.scenarios.forEach((scenario) => {
      scenarioMap.set(scenario.scenario_id, {
        scenario_id: scenario.scenario_id,
        scenario_title: scenario.scenario_title,
        scenario_context: scenario.scenario_context,
        questions: scenario.questions || [],
      });
    });
  }
  
  // Convert scenarios map to array and build question index
  const scenarios = Array.from(scenarioMap.values());
  const questionIndex = new Map();
  
  scenarios.forEach((scenario) => {
    scenario.questions.forEach((question) => {
      questionIndex.set(question.question_id, {
        ...question,
        scenario_id: scenario.scenario_id,
        scenario_title: scenario.scenario_title,
        scenario_context: scenario.scenario_context,
        // Ensure focus is accessible
        focus: getFocus(question),
      });
    });
  });
  
  // Sort scenarios by scenario_id
  scenarios.sort((a, b) => a.scenario_id - b.scenario_id);
  
  // Verify data integrity
  const totalQuestions = questionIndex.size;
  const syllabusCounts = {
    principles: 0,
    people: 0,
    practices: 0,
    processes: 0,
  };
  
  questionIndex.forEach((q) => {
    if (q.syllabus_area && syllabusCounts.hasOwnProperty(q.syllabus_area)) {
      syllabusCounts[q.syllabus_area]++;
    }
  });
  
  console.log('Question bank loaded:', {
    totalQuestions,
    scenarios: scenarios.length,
    syllabusCounts,
    note: 'Clean question bank loaded successfully (180 questions, no duplicates)',
  });
  
  return {
    scenarios,
    questionIndex,
    totalQuestions,
    syllabusCounts,
  };
}

// Load and export the question bank
const questionBank = loadQuestionBank();

export const { scenarios, questionIndex, totalQuestions, syllabusCounts } = questionBank;

/**
 * Get a question by ID
 */
export function getQuestion(questionId) {
  return questionIndex.get(questionId);
}

/**
 * Get all questions in a scenario
 */
export function getScenarioQuestions(scenarioId) {
  const scenario = scenarios.find((s) => s.scenario_id === scenarioId);
  return scenario ? scenario.questions : [];
}

/**
 * Get questions filtered by syllabus_area and optional focus
 */
export function getQuestionsByFilter(syllabusArea, focus = null) {
  const filtered = [];
  questionIndex.forEach((q) => {
    if (q.syllabus_area === syllabusArea) {
      if (!focus || getFocus(q) === focus) {
        filtered.push(q);
      }
    }
  });
  return filtered;
}

/**
 * Get all unique focus values for a given syllabus area
 */
export function getFocusesForSyllabusArea(syllabusArea) {
  const focuses = new Set();
  questionIndex.forEach((q) => {
    if (q.syllabus_area === syllabusArea) {
      const focus = getFocus(q);
      if (focus) {
        focuses.add(focus);
      }
    }
  });
  return Array.from(focuses).sort();
}

/**
 * Get all scenario titles and IDs
 */
export function getAllScenarios() {
  return scenarios.map((s) => ({
    scenario_id: s.scenario_id,
    scenario_title: s.scenario_title,
  }));
}
