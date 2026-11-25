import { cloudDocument } from "./cloud-progress.js";
import { lessons, topics } from "./lessons.js";

export function practiceSummary(email, value) {
  const { data, revision } = cloudDocument(value);
  const completedLessons = lessons.filter(({ id, problems }) => data.progress[id]?.solved.length === problems.length).length;
  const reviewBest = Object.fromEntries(topics.map(({ id }) => [id, data.activityScores?.[id] ?? 0]));
  return { email, revision, completedLessons, reviewBest };
}
