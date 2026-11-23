import { topics } from "./lessons.js";

export const quizTargets = [10, 15, 20];
const scoreKeys = [
  "signedQuizBest",
  "signedQuizPassed",
  ...topics.map(({ id }) => id),
];

export function normalizeActivityScores(scores) {
  const result = {};
  for (const key of scoreKeys) {
    const score = scores?.[key];
    if (!Number.isSafeInteger(score) || score < 1 || score > 1000000) continue;
    if (key === "signedQuizBest" && score > Math.max(...quizTargets)) continue;
    if (key === "signedQuizPassed" && !quizTargets.includes(score)) continue;
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
