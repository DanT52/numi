import { topics } from "./lessons.js";

export const quizGoal = 10;
// Keep accepting records from the earlier configurable quiz.
const savedSignedPasses = [quizGoal, 15, 20];
const scoreKeys = topics.flatMap(({ id, quizBestKey, quizPassKey }) =>
  quizPassKey ? [id, quizBestKey, quizPassKey] : [id],
);

export function normalizeActivityScores(scores) {
  const result = {};
  for (const key of scoreKeys) {
    const score = scores?.[key];
    if (!Number.isSafeInteger(score) || score < 1 || score > 1000000) continue;
    if (key === "signedQuizBest" && score > 20) continue;
    if (key === "signedQuizPassed" && !savedSignedPasses.includes(score)) continue;
    if (key === "pemdasQuizBest" && score > quizGoal) continue;
    if (key === "pemdasQuizPassed" && score !== quizGoal) continue;
    result[key] = score;
  }
  return result;
}

export function mergeActivityScores(first, second) {
  const scores = normalizeActivityScores(first);
  for (const [key, score] of Object.entries(normalizeActivityScores(second)))
    scores[key] = Math.max(scores[key] || 0, score);
  return scores;
}
