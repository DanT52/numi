import test from "node:test";
import assert from "node:assert/strict";
import { calculate, checkAnswer, isPrimeProduct, math } from "../dist/math.js";
import { lessons, topics } from "../dist/lessons.js";
test("PEMDAS, signed powers, associativity, and percentages", () => {
  for (const [expr, result] of [
    ["-3^2", -9],
    ["(-3)^2", 9],
    ["18/3*2", 12],
    ["20-6+2", 16],
    ["2^3^2", 512],
    ["-2^-2", -0.25],
    ["(-2)^3+12/(-4)", -11],
    ["35%", 0.35],
    ["24/(-2*(1+2))-(-5)", 1],
  ])
    assert.equal(calculate(expr), result, expr);
});
test("fractions, decimals, and signed mixed numbers", () => {
  for (const [expr, result] of [
    ["1 1/2", 1.5],
    ["-1 1/2", -1.5],
    ["1 1/2+2 1/4", 3.75],
    ["3 1/3-1 5/6", 1.5],
    ["2 1/4 / (1 1/2)", 1.5],
    [".5+.25", 0.75],
  ])
    assert.ok(Math.abs(calculate(expr) - result) < 1e-10, expr);
});
test("reject unsafe or invalid expressions and zero division", () => {
  for (const expr of [
    "alert(1)",
    "process.exit()",
    "1/0",
    "0/0",
    "(2+3",
    "2+",
    "2 3",
    "Infinity",
    "2**4",
    "Math.sqrt(4)",
    "",
  ])
    assert.throws(() => calculate(expr), expr);
});
test("check answer formats and equivalent values", () => {
  assert.equal(checkAnswer("2/4", { answer: "1/2" }).correct, true);
  assert.equal(checkAnswer("1 1/2", { answer: "3/2" }).correct, true);
  assert.equal(
    checkAnswer("75%", { answer: "75", type: "percent" }).correct,
    true,
  );
  assert.equal(
    checkAnswer("75", { answer: "75", type: "percent" }).correct,
    true,
  );
  assert.equal(
    checkAnswer("0.75", { answer: "75", type: "percent" }).correct,
    false,
  );
  assert.equal(
    checkAnswer("0.5", { answer: "1/2", type: "fraction" }).correct,
    false,
  );
  assert.equal(
    checkAnswer("1/2", { answer: ".5", type: "decimal" }).correct,
    false,
  );
  assert.equal(
    checkAnswer("72", { answer: "72", type: "prime" }).correct,
    false,
  );
  assert.equal(
    checkAnswer("2^3*3^2", { answer: "72", type: "prime" }).correct,
    true,
  );
  assert.equal(checkAnswer("", { answer: "0" }).correct, false);
});
test("prime products only contain prime factors", () => {
  assert.equal(isPrimeProduct("2*2*3"), true);
  assert.equal(isPrimeProduct("2^2 * 3"), true);
  assert.equal(isPrimeProduct("4*3"), false);
  assert.equal(isPrimeProduct("1*2*3"), false);
  assert.equal(isPrimeProduct("2+3"), false);
});
test("expanded curriculum has complete lessons and valid problems", () => {
  assert.equal(lessons.length, 15);
  assert.equal(new Set(lessons.map((l) => l.id)).size, 15);
  for (const topic of topics)
    assert.equal(
      lessons.filter((l) => l.topic === topic.id).length,
      topic.id === "fractions" ? 7 : topic.id === "integers" ? 4 : 2,
    );
  for (const lesson of lessons) {
    assert.equal(
      lesson.problems.length,
      lesson.topic === "fractions" ||
        ["integers-add-subtract-2", "integers-review"].includes(lesson.id)
        ? 12
        : 8,
    );
    assert.ok(lesson.example.steps.length >= 3);
    assert.ok(lesson.rule);
    for (const p of lesson.problems) {
      assert.ok(p.hint && p.solution);
      assert.equal(
        checkAnswer(p.answer, p).correct,
        true,
        lesson.id + ": " + p.expr,
      );
    }
  }
});
test("arithmetic lesson answers agree with an independently evaluated expression", () => {
  for (const lesson of lessons.filter(
    (l) => !l.id.startsWith("factors") && l.id !== "fractions-2",
  ))
    for (const p of lesson.problems.filter((p) => p.type !== "equivalent"))
      assert.ok(
        Math.abs(calculate(p.expr) - calculate(p.answer)) < 1e-10,
        lesson.id + ": " + p.expr,
      );
});
test("MathML renders fractions and powers and escapes unexpected text", () => {
  assert.match(math("3/4"), /<mfrac>/);
  assert.match(math("(-3)^2"), /<msup>/);
  assert.ok(!math("<img src=x>").includes("<img"));
  assert.match(math("2+3"), /<math /);
});
