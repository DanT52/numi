import test from "node:test";
import assert from "node:assert/strict";
import { lessons, totalProblems } from "../dist/lessons.js";
import { calculate, checkAnswer } from "../dist/math.js";
import {
  migrateFractionProgress,
  legacyFractionMap,
} from "../dist/progress-migration.js";
import {
  normalizeProgress,
  exportProgressCode,
  importProgressCode,
} from "../dist/progress-transfer.js";

test("fraction path progresses from representations to arithmetic and mixed numbers", () => {
  const fractions = lessons.filter((l) => l.topic === "fractions");
  assert.deepEqual(
    fractions.map((l) => l.id),
    [
      "fractions-simplify",
      "fractions-equivalent",
      "fractions-2",
      "fractions-add-subtract",
      "fractions-multiply",
      "fractions-divide",
      "fractions-mixed",
    ],
  );
  assert.equal(
    fractions.reduce((n, l) => n + l.problems.length, 0),
    84,
  );
  assert.equal(totalProblems, 156);
  for (const [index, l] of fractions.entries()) {
    assert.equal(l.sequence, index + 1);
    assert.equal(l.problems.length, 12);
    for (const step of l.example.steps)
      for (const line of step.lines || [])
        for (const expression of line)
          assert.ok(
            Math.abs(calculate(expression) - calculate(line[0])) < 1e-10,
          );
  }
  for (const problem of fractions[1].problems)
    assert.equal(
      calculate(problem.expr) * problem.targetDenominator,
      Number(problem.answer),
    );
});
test("simplifying practice requires lowest terms rather than just equivalent values", () => {
  const p = lessons.find((l) => l.id === "fractions-simplify").problems[3];
  assert.equal(checkAnswer("6/8", p).correct, false);
  assert.equal(checkAnswer("3/4", p).correct, true);
  assert.equal(checkAnswer("0.75", p).correct, false);
});
test("legacy progress moves to matching questions without adding completions", () => {
  const legacy = {
    index: 5,
    stage: "practice",
    solved: [0, 1, 2, 3, 4, 5, 6, 7],
    answers: {
      0: "3/4",
      1: "7/12",
      2: "2/5",
      3: "3/2",
      4: "3 3/4",
      5: "3/2",
      6: "4",
      7: "3/2",
    },
    hints: [1],
    reveals: [3],
  };
  const state = {
    version: 1,
    lesson: "fractions-1",
    progress: { "fractions-1": legacy },
  };
  const updated = migrateFractionProgress(state);
  assert.equal(updated.lesson, "fractions-mixed");
  assert.equal(updated.progress["fractions-mixed"].index, 5);
  assert.equal(
    Object.values(updated.progress).reduce((n, p) => n + p.solved.length, 0),
    8,
  );
  assert.ok(!updated.progress["fractions-1"]);
  assert.ok(
    state.progress["fractions-1"],
    "Migration does not mutate the input",
  );
  for (const [old, [id, index]] of legacyFractionMap.entries()) {
    assert.ok(updated.progress[id].solved.includes(index));
    assert.equal(updated.progress[id].answers[index], legacy.answers[old]);
  }
  assert.deepEqual(updated.progress["fractions-add-subtract"].hints, [8]);
  assert.deepEqual(updated.progress["fractions-divide"].reveals, [3]);
  assert.deepEqual(migrateFractionProgress(updated), updated);
  assert.deepEqual(
    importProgressCode(exportProgressCode(state)),
    normalizeProgress(updated),
  );
});
test("progress codes keep answers and navigation beyond problem eight", () => {
  const state = {
    version: 1,
    lesson: "fractions-divide",
    progress: {
      "fractions-divide": {
        index: 11,
        stage: "practice",
        solved: [8, 9, 10, 11],
        answers: { 11: "2" },
        hints: [10],
        reveals: [11],
      },
    },
  };
  assert.deepEqual(importProgressCode(exportProgressCode(state)), state);
});
