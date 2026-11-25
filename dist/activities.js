import { lessons, topics } from "./lessons.js";
import { calculate, checkAnswer, pretty } from "./math.js";
import { signedQuizGroups, signedWarmup } from "./signed-activities.js";
import { orderWarmup } from "./pemdas-warmup.js";
import { orderQuizGroups } from "./pemdas-quiz.js";
import { mergeActivityScores, quizGoal } from "./activity-scores.js";

const warmupPools = { integers: signedWarmup, pemdas: orderWarmup };

function quizBank(groups) {
  const questions = [];
  const questionGroups = Object.entries(groups).map(([group, expressions]) =>
    expressions.map((expr) => {
      questions.push({ group, expr, answer: pretty(calculate(expr)), type: "number" });
      return questions.length - 1;
    }),
  );
  return { questions, questionGroups };
}

const quizBanks = {
  integers: quizBank(signedQuizGroups),
  pemdas: quizBank(orderQuizGroups),
};
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

function shuffledQuiz(topic, random) {
  return shuffle(
    quizBanks[topic].questionGroups.map((group) => group[Math.floor(random() * group.length)]),
    random,
  );
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

export function startActivity(mode, topic, random = Math.random) {
  if (
    !Object.hasOwn(reviewPools, topic) ||
    (mode === "quiz" && !Object.hasOwn(quizBanks, topic))
  )
    return null;
  let deck;
  if (mode === "quiz") deck = shuffledQuiz(topic, random);
  if (mode === "review") deck = reviewDeck(topic, undefined, random);
  if (mode === "warmup")
    deck = shuffle(warmupPools[topic]?.map((_, i) => i) || [], random);
  if (!deck?.length) return null;
  return {
    mode,
    topic,
    deck,
    index: 0,
    streak: 0,
    correctCount: 0,
    result: null,
    ...(mode === "warmup" && topic === "pemdas"
      ? { choiceOrders: deck.map((index) => shuffle(orderWarmup[index].choices, random)) }
      : {}),
  };
}

export function restoreFixedQuiz(state) {
  const run = state.activity;
  if (run?.mode !== "quiz" || run.topic !== "integers" || !(run.deck?.length > quizGoal)) return;
  const deck = run.deck.slice(0, quizGoal);
  if (run.correctCount < quizGoal) {
    state.activity = { ...run, deck };
    return;
  }
  state.activity = {
    ...run,
    deck,
    index: quizGoal - 1,
    streak: quizGoal,
    correctCount: quizGoal,
    result: { correct: true },
  };
  state.activityScores = mergeActivityScores(state.activityScores, {
    signedQuizBest: quizGoal,
    signedQuizPassed: quizGoal,
  });
}

export function activityQuestion(run) {
  if (!run) return undefined;
  const pool =
    run.mode === "quiz"
      ? quizBanks[run.topic]?.questions
      : run.mode === "warmup"
        ? warmupPools[run.topic]
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
  if (run.mode === "warmup" && !(question.choices || ["positive", "negative", "zero", "undefined"]).includes(answer))
    return null;
  const quizNumber = run.topic === "integers" ? /^[+−-]?\d+$/ : /^[+−-]?(?:\d+(?:\.\d*)?|\.\d+)$/;
  const correct =
    run.mode === "warmup"
      ? answer === (question.first || question.sign)
      : (run.mode !== "quiz" || quizNumber.test(answer.trim())) &&
        checkAnswer(answer, question).correct;
  const next = {
    ...run,
    streak: correct ? run.streak + 1 : 0,
    correctCount: run.correctCount + Number(correct),
    result: { correct },
  };
  const point = run.mode === "review" ? { [run.topic]: next.streak } : {};
  if (run.mode === "quiz") {
    const { quizBestKey, quizPassKey } = topics.find(({ id }) => id === run.topic);
    point[quizBestKey] = next.streak;
    if (next.streak === quizGoal) point[quizPassKey] = quizGoal;
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
