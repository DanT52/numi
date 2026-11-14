import { parse } from "./math.js";
// Keep diagrams bounded in size while retaining the exact values entered.
export function expressionToLine(expression) {
  const number = (node) =>
    node.op === "number"
      ? node.value
      : node.op === "group" || node.op === "unary+"
        ? number(node.right)
        : node.op === "unary-"
          ? number(node.right) === null
            ? null
            : -number(node.right)
          : null;
  const walk = (node) => {
    const n = number(node);
    if (n !== null) return { a: n, operations: [] };
    if (node.op === "group") return walk(node.right);
    if (!["+", "-", "*", "/"].includes(node.op)) return null;
    const left = walk(node.left),
      right = number(node.right);
    if (!left || right === null) return null;
    return {
      ...left,
      operations: [...left.operations, { op: node.op, value: right }],
    };
  };
  try {
    const result = walk(parse(expression));
    if (!result?.operations.length) return null;
    const [first, ...operations] = result.operations;
    return { a: result.a, op: first.op, b: first.value, operations, step: 0 };
  } catch {
    return null;
  }
}
export function numberLineScale(...numbers) {
  const peak = Math.max(6, ...numbers.filter(Number.isFinite).map(Math.abs));
  const target = peak / 4;
  const magnitude = 10 ** Math.floor(Math.log10(target));
  const ratio = target / magnitude;
  const tick =
    peak <= 8
      ? 1
      : (ratio <= 1 ? 1 : ratio <= 2 ? 2 : ratio <= 5 ? 5 : 10) * magnitude;
  const divisions = Math.ceil(peak / tick) + 1;
  const extent = Number.isFinite(divisions * tick)
    ? divisions * tick
    : Number.MAX_VALUE;
  const count = Math.floor(extent / tick);
  const ticks = Array.from(
    { length: count * 2 + 1 },
    (_, i) => (i - count) * tick,
  );
  return { tick, ticks, extent, x: (n) => 400 + 350 * (n / extent) };
}

export function tickLabel(value) {
  const abs = Math.abs(value),
    sign = value < 0 ? "−" : "";
  if (abs >= 1e15)
    return sign + Number(abs.toPrecision(3)).toExponential().replace("e+", "e");
  for (const [scale, suffix] of [
    [1e12, "T"],
    [1e9, "B"],
    [1e6, "M"],
    [1e3, "k"],
  ])
    if (abs >= scale)
      return sign + Number((abs / scale).toPrecision(3)) + suffix;
  return sign + Number(abs.toPrecision(5));
}

export function lineOperations(lab) {
  return [{ op: lab.op, value: lab.b }, ...(lab.operations || [])];
}

export function lineModel(lab) {
  const operations = lineOperations(lab),
    segments = [];
  let value = lab.a,
    error = null;
  for (const operation of operations) {
    const from = value,
      b = operation.value;
    const to =
      operation.op === "+"
        ? from + b
        : operation.op === "-"
          ? from - b
          : operation.op === "*"
            ? from * b
            : b === 0
              ? NaN
              : from / b;
    if (!Number.isFinite(to)) {
      error =
        operation.op === "/" && b === 0
          ? "Division by zero is undefined."
          : "This result exceeds the numeric range.";
      break;
    }
    segments.push({ ...operation, from, to });
    value = to;
  }
  const result = error ? null : value;
  const axis = numberLineScale(lab.a, ...segments.map((s) => s.to));
  let total = 0;
  for (const segment of segments) {
    const distanceInTicks = Math.abs(
      segment.to / axis.tick - segment.from / axis.tick,
    );
    segment.steps = Math.max(1, Math.ceil(distanceInTicks - 1e-12));
    segment.startStep = total;
    total += segment.steps;
    segment.endStep = total;
  }
  const step =
    lab.step === null
      ? total
      : Math.min(total, Math.max(0, Math.floor(lab.step || 0)));
  const complete = !error && step === total && total > 0;
  let end = lab.a;
  for (const segment of segments) {
    segment.walked = Math.max(
      0,
      Math.min(segment.steps, step - segment.startStep),
    );
    segment.complete = segment.walked === segment.steps;
    if (segment.walked === 0) segment.current = segment.from;
    else if (segment.complete) segment.current = segment.to;
    else
      segment.current =
        (segment.from / axis.tick +
          Math.sign(segment.to - segment.from) * segment.walked) *
        axis.tick;
    if (segment.walked > 0) end = segment.current;
  }
  const activeIndex = segments.findIndex((s) => step < s.endStep);
  return {
    result,
    start: lab.a,
    end,
    total,
    step,
    complete,
    segments,
    axis,
    error,
    activeIndex:
      activeIndex === -1 ? Math.max(0, segments.length - 1) : activeIndex,
  };
}

export function fractionModel(numerator, denominator) {
  const wholeCount = Math.floor(numerator / denominator);
  const remainder = numerator % denominator;
  const compact = wholeCount > 3;
  const rows = compact
    ? [
        {
          index: 0,
          shaded: denominator,
          label: `${wholeCount.toLocaleString()} complete wholes`,
          multiplier: wholeCount,
        },
        ...(remainder
          ? [
              {
                index: wholeCount,
                shaded: remainder,
                label: "The remaining part",
              },
            ]
          : []),
      ]
    : Array.from(
        { length: Math.max(1, wholeCount + (remainder ? 1 : 0)) },
        (_, i) => ({
          index: i,
          shaded: Math.min(
            denominator,
            Math.max(0, numerator - i * denominator),
          ),
          label: `Whole ${i + 1}`,
        }),
      );
  let columns = Math.min(denominator, 15);
  if (denominator > 15 && denominator <= 200) {
    for (let c = 15; c >= 6; c--)
      if (denominator % c === 0) {
        columns = c;
        break;
      }
  }
  return { wholeCount, remainder, rows, columns, grouped: denominator > 200 };
}
