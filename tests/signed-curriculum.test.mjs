import test from "node:test";
import assert from "node:assert/strict";
import { lessons, totalProblems } from "../dist/lessons.js";
import { calculate, parse } from "../dist/math.js";
import { expressionToLine, lineModel } from "../dist/visual-models.js";
import {
  exportProgressCode,
  importProgressCode,
} from "../dist/progress-transfer.js";
const countNumbers = (node) =>
  node.op === "number"
    ? 1
    : (node.left ? countNumbers(node.left) : 0) +
      (node.right ? countNumbers(node.right) : 0);
test("signed path orders the two additions lessons before multiplication and review", () => {
  assert.deepEqual(
    lessons.filter((l) => l.topic === "integers").map((l) => l.id),
    ["integers-1", "integers-add-subtract-2", "integers-2", "integers-review"],
  );
  assert.equal(totalProblems, 156);
});
test("every advanced addition question uses three numbers and preloads both operations", () => {
  const lesson = lessons.find((l) => l.id === "integers-add-subtract-2");
  assert.equal(lesson.problems.length, 12);
  for (const problem of lesson.problems) {
    assert.equal(countNumbers(parse(problem.expr)), 3);
    assert.ok(!/[*/^]/.test(problem.expr));
    const inputs = expressionToLine(problem.expr);
    assert.ok(inputs);
    assert.equal(inputs.operations.length, 1);
    assert.equal(
      lineModel({ ...inputs, step: null }).result,
      calculate(problem.answer),
    );
    assert.equal(lineModel(inputs).complete, false);
  }
});
test("review covers all four operations with standalone and multi-step practice", () => {
  const lesson = lessons.find((l) => l.id === "integers-review");
  assert.equal(lesson.problems.length, 12);
  for (const symbol of ["+", "-", "*", "/"])
    assert.ok(lesson.problems.some((p) => p.expr.includes(symbol)));
  for (const lesson of lessons.filter((l) =>
    ["integers-add-subtract-2", "integers-review"].includes(l.id),
  )) {
    assert.equal(
      calculate(lesson.example.expr),
      calculate(lesson.example.answer),
    );
    for (const step of lesson.example.steps)
      for (const line of step.lines)
        for (const term of line)
          assert.equal(calculate(term), calculate(line[0]));
  }
  assert.equal(
    expressionToLine("5-(-2)*3"),
    null,
    "Do not reorder mixed-precedence expressions as sequential number-line operations",
  );
});
test("new lesson progress round trips alongside existing signed lessons", () => {
  const p = {
    index: 11,
    stage: "practice",
    solved: [0, 11],
    answers: { 11: "3" },
    hints: [11],
    reveals: [],
  };
  const state = {
    version: 1,
    lesson: "integers-add-subtract-2",
    progress: {
      "integers-add-subtract-2": p,
      "integers-1": {
        ...p,
        index: 0,
        solved: [0],
        answers: { 0: "2" },
        hints: [],
      },
    },
  };
  assert.deepEqual(importProgressCode(exportProgressCode(state)), state);
});
