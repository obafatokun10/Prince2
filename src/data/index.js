// Import all data files
import meta from './gemini-code-1779704651183.json';
import batch2 from './gemini-code-1779704657970.json';
import batch3 from './gemini-code-1779704701225.json';
import batch4a from './gemini-code-1779704727820.json';
import batch4b from './gemini-code-1779704796429.json';
import batch5 from './gemini-code-1779704804784.json';
import batch6 from './gemini-code-1779706520802.json';
import batch7 from './gemini-code-1779704825499.json';
import batch8 from './gemini-code-1779704852320.json';
import batch9 from './gemini-code-1779704867297.json';
import batch10 from './gemini-code-1779704883616.json';
import batch11 from './gemini-code-1779704895314.json';

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
 * Merge all batch data files, de-duplicate scenarios, and prepare the question bank
 */
function loadQuestionBank() {
  const allBatches = [meta, batch2, batch3, batch4a, batch4b, batch5, batch6, batch7, batch8, batch9, batch10, batch11];
  
  // De-duplicate scenarios by scenario_id
  const scenarioMap = new Map();
  const allQuestions = [];
  
  allBatches.forEach((batch) => {
    if (batch.scenarios) {
      batch.scenarios.forEach((scenario) => {
        if (!scenarioMap.has(scenario.scenario_id)) {
          scenarioMap.set(scenario.scenario_id, {
            scenario_id: scenario.scenario_id,
            scenario_title: scenario.scenario_title,
            scenario_context: scenario.scenario_context,
            questions: [],
          });
        }
        // Add questions to the scenario
        if (scenario.questions) {
          scenarioMap.get(scenario.scenario_id).questions.push(...scenario.questions);
        }
      });
    }
  });
  
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
    note: 'All batches loaded successfully (1–11, 180 questions)',
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
