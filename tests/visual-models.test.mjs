import test from "node:test";
import assert from "node:assert/strict";
import {
  numberLineScale,
  fractionModel,
  lineModel,
  tickLabel,
} from "../dist/visual-models.js";
import { normalizeAppearance } from "../dist/appearance.js";
import { pretty } from "../dist/math.js";
test("axis bounds contain large inputs, with a bounded number of finite ticks", () => {
  for (const values of [
    [-3, 2],
    [-12500, 17500],
    [-1e12, 2e12],
    [1e150, -1e150],
    [1e308, 0],
  ]) {
    const axis = numberLineScale(...values);
    assert.ok(axis.ticks.length <= 25);
    assert.ok(axis.ticks.every(Number.isFinite));
    for (const value of values)
      assert.ok(
        Number.isFinite(axis.x(value)) &&
          axis.x(value) >= 50 &&
          axis.x(value) <= 750,
      );
  }
  assert.equal(tickLabel(-12500), "−12.5k");
  assert.equal(
    pretty(1000000000001),
    "1000000000001",
    "Large integer results retain the units digit",
  );
});
test("large line steps avoid overflowing intermediate calculations", () => {
  assert.ok(
    Math.abs(
      lineModel({ a: 1e150, b: 1e150, op: "*", step: null }).result / 1e300 - 1,
    ) < 1e-14,
  );
  assert.ok(
    Math.abs(
      lineModel({ a: 1e150, b: 1e150, op: "*", step: null }).end / 1e300 - 1,
    ) < 1e-14,
  );
  assert.equal(lineModel({ a: 1e308, b: 2, op: "*", step: null }).result, null);
  assert.equal(lineModel({ a: 12, b: 0, op: "/", step: null }).result, null);
});
test("fraction models retain all pieces and compact very large wholes", () => {
  const small = fractionModel(33, 75);
  assert.equal(small.rows[0].shaded, 33);
  assert.equal(small.grouped, false);
  const large = fractionModel(12345, 75000);
  assert.equal(large.rows[0].shaded, 12345);
  assert.equal(large.grouped, true);
  const improper = fractionModel(1000001, 2);
  assert.equal(improper.wholeCount, 500000);
  assert.equal(improper.remainder, 1);
  assert.equal(improper.rows.length, 2);
  assert.equal(fractionModel(0, 75).rows[0].shaded, 0);
});
test("invalid appearance preferences fall back to safe defaults", () => {
  assert.deepEqual(
    normalizeAppearance({ theme: "bogus", size: "100px", weight: "invalid" }),
    { theme: "matcha", size: "comfortable", weight: "regular", motion: true },
  );
});
