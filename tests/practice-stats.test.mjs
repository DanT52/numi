import test from "node:test";
import assert from "node:assert/strict";
import { parseHTML } from "linkedom";
import { activityDay, createPracticeClock, createPracticeTracker, emptyStats } from "../dist/practice-stats.js";
import { createAdminDashboard, summarizeActivity } from "../dist/admin-dashboard.js";

function exampleClock(initial = Date.parse("2026-11-25T17:00:00Z")) {
  let time = initial;
  let visible = true;
  const days = new Map();
  const clock = createPracticeClock({
    now: () => time,
    visible: () => visible,
    record(day, _, delta) {
      if (!days.has(day)) days.set(day, emptyStats());
      for (const [key, value] of Object.entries(delta || {})) days.get(day)[key] += value;
    },
  });
  return {
    clock, days,
    stats: () => days.get(activityDay(time)),
    wait: (seconds) => { time += seconds * 1000; },
    hide: () => { visible = false; clock.pause(); },
    show: () => { visible = true; clock.resume(); },
  };
}

test("practice counts all answer modes and only active time leading up to an answer", () => {
  const { clock, stats, wait, hide, show } = exampleClock();
  clock.interact();
  wait(30);
  hide();
  wait(60);
  show();
  wait(10);
  clock.answer("lesson", { correct: false });
  assert.equal(stats().activeMs, 40_000);
  wait(40);
  clock.answer("warmup", { correct: true });
  assert.equal(stats().activeMs, 80_000);
  wait(301);
  clock.interact();
  assert.equal(stats().activeMs, 80_000);
  wait(12);
  clock.answer("review", { correct: true, topic: "fractions" });
  wait(40);
  assert.equal(stats().activeMs, 92_000);
  assert.equal(stats().timedSignedReview, 0);
  assert.equal(stats().lesson, 1);
  assert.equal(stats().warmup, 1);
  assert.equal(stats().review, 1);
  assert.equal(stats().correct, 2);
});

test("a midnight answer allocates practice minutes to both Pacific dates", () => {
  const { clock, days, wait } = exampleClock(Date.parse("2026-11-25T07:59:50Z"));
  clock.interact();
  wait(25);
  clock.answer("lesson", { correct: true });
  assert.deepEqual([...days].map(([day, stats]) => [day, stats.activeMs, stats.lesson]), [
    ["2026-11-24", 10_000, 0], ["2026-11-25", 15_000, 1],
  ]);
});

test("timing compares the signed review and quiz and only measures complete observed passes", () => {
  const { clock, stats, wait, hide, show } = exampleClock();
  clock.interact();
  clock.openQuestion();
  wait(32);
  clock.answer("review", { correct: true, topic: "integers" });
  clock.startQuiz();
  clock.openQuestion();
  wait(7);
  clock.answer("quiz", { correct: true });
  wait(5);
  clock.openQuestion();
  wait(14);
  hide();
  wait(90);
  show();
  wait(2);
  clock.answer("quiz", { correct: true, finished: true });
  // A resumed quiz run contributes its outcome, with no fabricated timing.
  clock.answer("quiz", { correct: true, finished: true });
  assert.equal(stats().timedQuiz, 2);
  assert.equal(stats().quizMs, 23_000);
  assert.equal(stats().signedReviewMs, 32_000);
  assert.equal(stats().quizPasses, 2);
  assert.equal(stats().timedPasses, 1);
  assert.equal(stats().passedQuizMs, 28_000);
});

test("stats retries keep the same batch ID without leaking the signed-out account’s queue", async () => {
  const stored = new Map();
  const storage = {
    get length() { return stored.size; },
    key: (i) => [...stored.keys()][i],
    getItem: (key) => stored.get(key),
    setItem: (key, value) => stored.set(key, value),
    removeItem: (key) => stored.delete(key),
  };
  const sent = [];
  let retry = true;
  const tracker = createPracticeTracker({ storage, visible: () => true, write: async (entry) => {
    sent.push(entry);
    if (retry) throw Object.assign(new Error(), { code: "permission-denied" });
  } });
  assert.equal(tracker.clock, null);
  const alice = { uid: "alice", email: "alice@example.com" };
  tracker.setUser(alice);
  tracker.clock.answer("quiz", { correct: false, finished: true });
  await tracker.flush();
  tracker.setUser(null);
  await tracker.flush();
  assert.equal(tracker.clock, null);
  assert.equal(storage.length, 1);
  retry = false;
  tracker.setUser({ uid: "bob", email: "bob@example.com" });
  await tracker.flush();
  assert.equal(storage.length, 1);
  tracker.setUser(alice);
  await Promise.resolve();
  await tracker.flush();
  assert.equal(storage.length, 0);
  assert.ok(sent.every((entry) => entry.id === sent[0].id && entry.quiz === 1 && entry.uid === "alice"));
});

test("dashboard groups calendar days and shows comparable timing and sample sizes", async () => {
  const today = activityDay();
  const base = { uid: "learner", email: "learner@example.com", lastAt: Date.now(), day: today, ...emptyStats() };
  const rows = [
    { ...base, quiz: 10, quizMs: 80_000, timedQuiz: 10, quizRuns: 1, quizPasses: 1, timedPasses: 1, passedQuizMs: 99_000 },
    { ...base, review: 5, signedReviewMs: 100_000, timedSignedReview: 5, activeMs: 125_000, warmup: 1 },
  ];
  const [learner] = summarizeActivity(rows);
  assert.equal(learner.days.size, 1);
  assert.equal(learner.days.get(today).quiz, 10);
  const dashboard = createAdminDashboard({ read: async () => rows, redraw: () => {} });
  await dashboard.load();
  const { document } = parseHTML(dashboard.view());
  assert.match(document.querySelector(`[data-action="admin-day:${today}"]`).getAttribute("aria-label"), /16 attempts, 2m 5s active/);
  assert.deepEqual([...document.querySelectorAll(".admin-bar strong")].map(({ textContent }) => textContent), ["8s", "20s"]);
  assert.match(document.querySelector(".admin-timing").textContent, /1m 39s/);
});
