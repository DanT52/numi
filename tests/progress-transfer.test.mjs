import test from "node:test";
import assert from "node:assert/strict";
import {
  exportProgressCode,
  importProgressCode,
  normalizeProgress,
  mergeProgress,
} from "../dist/progress-transfer.js";
import { lessons } from "../dist/lessons.js";
import { calculate, math } from "../dist/math.js";
const p = {
  index: 2,
  stage: "practice",
  solved: [0, 1],
  answers: { 0: "−3", 1: "1 1/2" },
  hints: [2],
  reveals: [],
};
const state = {
  version: 1,
  progress: { "integers-1": p },
  lesson: "integers-1",
};
test("progress codes round trip Unicode answers and lesson position", () => {
  const code = exportProgressCode(state);
  assert.deepEqual(importProgressCode(code), state);
  assert.deepEqual(
    importProgressCode(code.slice(0, 20) + "\n" + code.slice(20)),
    state,
  );
});
test("corrupted, incomplete, and oversized codes are rejected", () => {
  const code = exportProgressCode(state),
    corrupt = code.slice(0, -1) + (code.endsWith("0") ? "1" : "0");
  for (const input of [
    corrupt,
    code.slice(0, -10),
    "wrong",
    "NUMI1." + "x".repeat(200001),
  ])
    assert.throws(() => importProgressCode(input));
  assert.throws(() =>
    normalizeProgress({ version: 2, progress: state.progress }),
  );
  assert.throws(() =>
    normalizeProgress({
      version: 1,
      progress: { "integers-1": { ...p, solved: [99] } },
    }),
  );
});
test("imports keep already solved problems and support previous JSON files", () => {
  const incoming = normalizeProgress({
    ...state,
    progress: {
      "integers-1": {
        ...p,
        solved: [1, 2],
        hints: undefined,
        reveals: undefined,
      },
    },
  });
  const merged = mergeProgress(state.progress, incoming.progress);
  assert.deepEqual(merged["integers-1"].solved, [0, 1, 2]);
  assert.equal(merged["integers-1"].answers[0], "−3");
  assert.deepEqual(state.progress["integers-1"].solved, [0, 1]);
});
test("every rendered worked-equation line is mathematically equivalent", () => {
  for (const example of lessons.flatMap((l) => [
    l.example,
    ...(l.moreExamples || []),
  ])) {
    assert.ok(
      Math.abs(calculate(example.expr) - calculate(example.answer)) < 1e-10,
      example.expr,
    );
    for (const step of example.steps)
      for (const line of step.lines) {
        const first = calculate(line[0]);
        for (const term of line) {
          assert.ok(Math.abs(calculate(term) - first) < 1e-10, line.join("="));
          assert.match(math(term), /<math /);
        }
      }
  }
});

test("help unlock counts round trip, validate, and merge without relocking", () => {
  const withAttempts = {
    ...state,
    progress: { "integers-1": { ...p, failedChecks: { 0: 1, 2: 2 } } },
  };
  assert.deepEqual(
    importProgressCode(exportProgressCode(withAttempts)),
    withAttempts,
  );
  const incoming = { "integers-1": { ...p, failedChecks: { 0: 2, 2: 1 } } };
  const merged = mergeProgress(withAttempts.progress, incoming);
  assert.deepEqual(merged["integers-1"].failedChecks, { 0: 2, 2: 2 });
  const legacy = mergeProgress(withAttempts.progress, state.progress);
  assert.deepEqual(legacy["integers-1"].failedChecks, { 0: 1, 2: 2 });
  for (const failedChecks of [
    [],
    null,
    { 0: -1 },
    { 0: 3 },
    { 0: 0.5 },
    { 99: 1 },
    { other: 1 },
  ])
    assert.throws(() =>
      normalizeProgress({
        ...state,
        progress: { "integers-1": { ...p, failedChecks } },
      }),
    );
});
