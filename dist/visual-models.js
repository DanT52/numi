// Keep diagrams bounded in size while retaining the exact values entered.
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

export function lineModel({ a, b, op, step: current }) {
  const raw =
    op === "+"
      ? a + b
      : op === "-"
        ? a - b
        : op === "*"
          ? a * b
          : b === 0
            ? NaN
            : a / b;
  const result = Number.isFinite(raw) ? raw : null;
  const start = ["+", "-"].includes(op) ? a : 0;
  const total = op === "/" ? 1 : Math.abs(b);
  const step = current === null ? total : Math.min(total, current);
  const delta = result === null ? 0 : result - start;
  const end =
    result === null
      ? start
      : step === total
        ? result
        : start + (total ? (step / total) * delta : 0);
  return { result, start, total, step, delta, end };
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
