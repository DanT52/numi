import test from "node:test";
import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import { lessons } from "../dist/lessons.js";
import { calculate, parse } from "../dist/math.js";
import { expressionToLine, lineModel } from "../dist/visual-models.js";
import { migrateSignedProgress } from "../dist/progress-migration.js";
import { legacyThreeNumberExpressions } from "../dist/lessons/signed-numbers/legacy-three-number-questions.js";
import {
  exportProgressCode,
  importProgressCode,
  normalizeProgress,
  mergeProgress,
} from "../dist/progress-transfer.js";
const countNumbers = (node) =>
  node.op === "number"
    ? 1
    : (node.left ? countNumbers(node.left) : 0) +
      (node.right ? countNumbers(node.right) : 0);
const magnitudes = (node) =>
  node.op === "number"
    ? [node.value]
    : [
        ...(node.left ? magnitudes(node.left) : []),
        ...(node.right ? magnitudes(node.right) : []),
      ];
test("signed path orders the two additions lessons before multiplication and review", () => {
  assert.deepEqual(
    lessons.filter((l) => l.topic === "integers").map((l) => l.id),
    [
      "integers-1",
      "integers-add-subtract-small-3",
      "integers-add-subtract-large-2",
      "integers-add-subtract-large-3",
      "integers-2",
      "integers-review",
    ],
  );
});
test("every advanced addition question uses three numbers and preloads both operations", () => {
  const lesson = lessons.find((l) => l.id === "integers-add-subtract-small-3");
  assert.equal(lesson.problems.length, 25);
  assert.equal(new Set(lesson.problems.map((p) => p.expr)).size, 25);
  for (const problem of lesson.problems) {
    assert.equal(countNumbers(parse(problem.expr)), 3);
    assert.ok(magnitudes(parse(problem.expr)).every((n) => n <= 15));
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
  assert.equal(lesson.problems.length, 24);
  for (const symbol of ["+", "-", "*", "/"])
    assert.ok(lesson.problems.some((p) => p.expr.includes(symbol)));
  for (const lesson of lessons.filter((l) =>
    ["integers-add-subtract-small-3", "integers-review"].includes(l.id),
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
    index: 24,
    stage: "practice",
    solved: [0, 11, 24],
    answers: { 11: "-10", 24: "-3" },
    hints: [24],
    reveals: [],
  };
  const state = {
    version: 1,
    lesson: "integers-add-subtract-small-3",
    progress: {
      "integers-add-subtract-small-3": p,
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

test("larger practice has the requested operand counts and ranges", () => {
  const basic = lessons.find((l) => l.id === "integers-1");
  assert.equal(basic.problems.length, 25);
  for (const [id, count] of [
    ["integers-add-subtract-large-2", 2],
    ["integers-add-subtract-large-3", 3],
  ]) {
    const lesson = lessons.find((l) => l.id === id);
    assert.equal(lesson.problems.length, 25);
    assert.equal(new Set(lesson.problems.map((p) => p.expr)).size, 25);
    for (const p of lesson.problems) {
      const nums = magnitudes(parse(p.expr));
      assert.equal(nums.length, count);
      assert.ok(nums.every((n) => n <= 200));
      assert.ok(nums.some((n) => n > 15));
      if (count === 2) assert.ok(nums.every((n) => n >= 15));
      const line = expressionToLine(p.expr);
      assert.ok(line);
      assert.equal(
        lineModel({ ...line, step: null }).result,
        calculate(p.answer),
      );
    }
  }
});

test("20 solved legacy triples and 8 basics retain all 28 credits after moving questions", () => {
  const basic = lessons.find((l) => l.id === "integers-1");
  const old = {
    version: 1,
    lesson: "integers-add-subtract-2",
    progress: {
      "integers-1": {
        index: 7,
        stage: "practice",
        solved: Array.from({ length: 8 }, (_, i) => i),
        answers: Object.fromEntries(
          basic.problems.slice(0, 8).map((p, i) => [i, p.answer]),
        ),
        hints: [],
        reveals: [],
      },
      "integers-add-subtract-2": {
        index: 19,
        stage: "practice",
        solved: Array.from({ length: 20 }, (_, i) => i),
        answers: Object.fromEntries(
          legacyThreeNumberExpressions
            .slice(0, 20)
            .map((expr, i) => [i, String(calculate(expr))]),
        ),
        hints: [10],
        reveals: [19],
      },
    },
  };
  const snapshot = JSON.stringify(old),
    migrated = normalizeProgress(old);
  assert.equal(JSON.stringify(old), snapshot);
  assert.equal(migrated.lesson, "integers-add-subtract-large-3");
  assert.equal(migrated.progress["integers-1"].solved.length, 8);
  assert.equal(
    migrated.progress["integers-add-subtract-small-3"].solved.length,
    15,
  );
  assert.equal(
    migrated.progress["integers-add-subtract-large-3"].solved.length,
    5,
  );
  assert.equal(migrated.progress["integers-add-subtract-large-3"].index, 4);
  assert.equal(
    Object.values(migrated.progress).reduce((n, p) => n + p.solved.length, 0),
    28,
  );
  for (const [id, p] of Object.entries(migrated.progress))
    for (const i of p.solved)
      assert.equal(
        calculate(p.answers[i]),
        calculate(lessons.find((l) => l.id === id).problems[i].answer),
      );
  assert.deepEqual(migrateSignedProgress(migrated), migrated);
  const already = {
    ...migrated.progress,
    "integers-add-subtract-small-3": {
      ...migrated.progress["integers-add-subtract-small-3"],
      solved: [
        ...migrated.progress["integers-add-subtract-small-3"].solved,
        24,
      ],
    },
  };
  assert.equal(
    mergeProgress(already, migrated.progress)["integers-add-subtract-small-3"]
      .solved.length,
    16,
    "Importing an old backup keeps new work too",
  );
});

test("all 25 legacy triples map once to the exact same expression", () => {
  const old = {
    version: 1,
    lesson: null,
    progress: {
      "integers-add-subtract-2": {
        index: 24,
        stage: "practice",
        solved: Array.from({ length: 25 }, (_, i) => i),
        answers: Object.fromEntries(
          legacyThreeNumberExpressions.map((expr, i) => [
            i,
            String(calculate(expr)),
          ]),
        ),
        hints: [],
        reveals: [],
      },
    },
  };
  const migrated = normalizeProgress(old),
    expressions = [];
  for (const [id, p] of Object.entries(migrated.progress))
    for (const i of p.solved)
      expressions.push(lessons.find((l) => l.id === id).problems[i].expr);
  assert.equal(expressions.length, 25);
  assert.deepEqual(
    expressions.sort(),
    [...legacyThreeNumberExpressions].sort(),
  );
});
test("each lesson is loaded from its own category file", async () => {
  const root = new URL("../dist/lessons/", import.meta.url),
    found = [];
  for (const folder of await readdir(root, { withFileTypes: true }))
    if (folder.isDirectory()) {
      for (const file of await readdir(new URL(folder.name + "/", root)))
        if (
          file.endsWith(".js") &&
          file !== "index.js" &&
          !file.startsWith("legacy-")
        ) {
          const { default: lesson } = await import(
            new URL(folder.name + "/" + file, root)
          );
          assert.ok(lesson?.id, file);
          assert.equal(
            lessons.find((l) => l.id === lesson.id),
            lesson,
          );
          found.push(lesson.id);
        }
    }
  assert.equal(found.length, lessons.length);
  assert.equal(new Set(found).size, lessons.length);
});
