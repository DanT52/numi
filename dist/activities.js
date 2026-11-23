import { lessons, topics } from "./lessons.js";
import { calculate, checkAnswer } from "./math.js";
import { signedQuizGroups, signedWarmup } from "./signed-activities.js";
import { mergeActivityScores, quizTargets } from "./activity-scores.js";

const quizGroups = Object.entries(signedQuizGroups).map(
  ([group, expressions]) =>
    expressions.map((expr) => ({
      group,
      expr,
      answer: String(calculate(expr)),
      type: "number",
    })),
);
const quizPool = quizGroups.flat();
const reviewPools = Object.fromEntries(
  topics.map(({ id }) => [
    id,
    lessons
      .filter((lesson) => lesson.topic === id)
      .flatMap((lesson) =>
        lesson.problems.map((problem) => ({ ...problem, group: lesson.title })),
      ),
  ]),
);

function shuffle(items, random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const swap = Math.floor(random() * (i + 1));
    [result[i], result[swap]] = [result[swap], result[i]];
  }
  return result;
}

export function shuffledQuiz(target, random = Math.random) {
  if (!quizTargets.includes(target)) return [];
  const groups = quizGroups.map((group) => shuffle(group, random));
  const deck = [];
  // Each block of ten includes one question from every group, in random order.
  for (let round = 0; deck.length < target; round++)
    deck.push(
      ...shuffle(
        groups.map((group) => group[round]),
        random,
      ),
    );
  return deck.slice(0, target);
}

function reviewDeck(topic, last, random) {
  const deck = shuffle(
    reviewPools[topic].map((_, i) => i),
    random,
  );
  if (deck.length > 1 && deck[0] === last)
    [deck[0], deck[1]] = [deck[1], deck[0]];
  return deck;
}

export function startActivity(
  mode,
  topic,
  target = quizTargets[0],
  random = Math.random,
) {
  if (
    !Object.hasOwn(reviewPools, topic) ||
    (mode !== "review" && topic !== "integers")
  )
    return null;
  let deck;
  if (mode === "quiz")
    deck = shuffledQuiz(target, random).map((problem) =>
      quizPool.indexOf(problem),
    );
  if (mode === "review") deck = reviewDeck(topic, undefined, random);
  if (mode === "warmup") deck = signedWarmup.map((_, i) => i);
  if (!deck?.length) return null;
  return {
    mode,
    topic,
    deck,
    index: 0,
    streak: 0,
    correctCount: 0,
    result: null,
  };
}

export function activityQuestion(run) {
  if (!run) return undefined;
  const pool =
    run.mode === "quiz"
      ? quizPool
      : run.mode === "warmup"
        ? signedWarmup
        : reviewPools[run.topic];
  return pool?.[run.deck?.[run.index]];
}

export function activityIsOver(run) {
  return (
    !!run.result &&
    ((run.mode === "quiz" && !run.result.correct) ||
      (run.mode !== "review" && run.index === run.deck.length - 1))
  );
}

export function checkActivity(run, answer, scores) {
  const question = activityQuestion(run);
  if (!question || run.result || !answer.trim()) return null;
  if (
    run.mode === "warmup" &&
    !["positive", "negative", "zero", "undefined"].includes(answer)
  )
    return null;
  const correct =
    run.mode === "warmup"
      ? answer === question.sign
      : (run.mode !== "quiz" || /^[+−-]?\d+$/.test(answer.trim())) &&
        checkAnswer(answer, question).correct;
  const next = {
    ...run,
    streak: correct ? run.streak + 1 : 0,
    correctCount: run.correctCount + Number(correct),
    result: { correct },
  };
  const point = run.mode === "review" ? { [run.topic]: next.streak } : {};
  if (run.mode === "quiz") {
    point.signedQuizBest = next.streak;
    if (next.streak === run.deck.length)
      point.signedQuizPassed = run.deck.length;
  }
  return { run: next, scores: mergeActivityScores(scores, point) };
}

export function nextActivityQuestion(run, random = Math.random) {
  if (!run.result || activityIsOver(run)) return run;
  if (run.index + 1 < run.deck.length)
    return { ...run, index: run.index + 1, result: null };
  return {
    ...run,
    index: 0,
    deck: reviewDeck(run.topic, run.deck[run.index], random),
    result: null,
  };
}
