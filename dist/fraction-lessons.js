import { workedExamples, fractionExamples } from "./worked-examples.js";
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const fraction = (n, d) => {
  const g = gcd(n, d);
  return d / g === 1 ? String(n / g) : `${n / g}/${d / g}`;
};
const q = (
  expr,
  answer,
  hint,
  solution,
  prompt = "Find the answer.",
  type = "number",
) => ({ expr, answer, hint, solution, prompt, type });
const step = (text, ...lines) => ({ text, lines });
const lesson = (
  id,
  title,
  subtitle,
  rule,
  example,
  problems,
  moreExamples = [],
) => ({
  id,
  topic: "fractions",
  title,
  subtitle,
  rule,
  example,
  problems,
  moreExamples,
  minutes: 15,
  tool: "fractions",
});

export function buildFractionLessons(conversions) {
  const simplify = lesson(
    "fractions-simplify",
    "Simplifying fractions",
    "Start by reducing a fraction without changing its value.",
    "Divide the numerator and denominator by the same common factor. Using their greatest common factor reduces the fraction in one step.",
    {
      expr: "6/8",
      answer: "3/4",
      steps: [
        step(
          "Find a factor shared by the numerator and denominator. The greatest common factor of 6 and 8 is 2.",
        ),
        step("Divide both parts by 2.", ["6/8", "(6/2)/(8/2)", "3/4"]),
        step(
          "Three and four share no factor greater than 1, so the fraction is in simplest form.",
          ["3/4"],
        ),
      ],
    },
    [
      [2, 4],
      [3, 9],
      [4, 6],
      [6, 8],
      [8, 12],
      [10, 15],
      [12, 18],
      [15, 20],
      [18, 24],
      [24, 36],
      [33, 75],
      [42, 56],
    ].map(([n, d]) => {
      const g = gcd(n, d);
      return q(
        `${n}/${d}`,
        fraction(n, d),
        `Find a common factor of ${n} and ${d}. Try ${g}.`,
        `Divide both the numerator and denominator by ${g}: ${n} ÷ ${g} = ${n / g} and ${d} ÷ ${g} = ${d / g}. The simplest form is ${fraction(n, d)}.`,
        "Write this fraction in simplest form.",
        "simplified",
      );
    }),
  );
  const equivalent = lesson(
    "fractions-equivalent",
    "Equivalent fractions",
    "Rewrite fractions with a chosen denominator.",
    "Multiply or divide both parts of a fraction by the same nonzero number. To build a common denominator, find the factor that changes the old denominator into the new one.",
    {
      expr: "1/2",
      answer: "3/6",
      steps: [
        step(
          "We want to rewrite one half with denominator 6. Find the scale factor.",
          ["6/2", "3"],
        ),
        step("Multiply the numerator and denominator by that factor.", [
          "1/2",
          "(1*3)/(2*3)",
          "3/6",
        ]),
        step("The missing numerator is 3. The amount has not changed.", [
          "1/2",
          "3/6",
        ]),
      ],
    },
    [
      [1, 2, 4],
      [1, 3, 6],
      [2, 3, 12],
      [3, 4, 8],
      [2, 5, 20],
      [3, 5, 25],
      [5, 6, 18],
      [7, 8, 24],
      [3, 10, 50],
      [5, 12, 36],
      [7, 15, 75],
      [11, 25, 100],
    ].map(([n, d, target]) => ({
      ...q(
        `${n}/${d}`,
        String((n * target) / d),
        `Divide ${target} by ${d} to find the scale factor.`,
        `The scale factor is ${target / d}. Multiply both parts by ${target / d}: ${n}/${d} = ${(n * target) / d}/${target}.`,
        `Rewrite this fraction with denominator ${target}. Enter only the missing numerator.`,
        "equivalent",
      ),
      targetDenominator: target,
    })),
  );
  const conversionLesson = {
    ...conversions,
    title: "Fractions, decimals & percentages",
    subtitle: "Connect fraction values to decimal and percent notation.",
    problems: [
      ...conversions.problems,
      q(
        "1/5",
        "0.2",
        "Divide 1 by 5.",
        "1 ÷ 5 = 0.2.",
        "Write this fraction as a decimal.",
        "decimal",
      ),
      q(
        "0.45",
        "9/20",
        "Start with 45/100 and simplify by 5.",
        "0.45 = 45/100 = 9/20.",
        "Write this decimal as a fraction.",
        "fraction",
      ),
      q(
        "12.5%",
        "0.125",
        "Divide the percent number by 100.",
        "12.5 ÷ 100 = 0.125.",
        "Write this percentage as a decimal.",
        "decimal",
      ),
      q(
        "7/8",
        "87.5",
        "Divide 7 by 8, then multiply by 100.",
        "7 ÷ 8 = 0.875, so 7/8 = 87.5%.",
        "Write this fraction as a percentage.",
        "percent",
      ),
    ],
  };
  const add = lesson(
    "fractions-add-subtract",
    "Adding & subtracting fractions",
    "Start with matching denominators, then find common denominators.",
    "Use a common denominator before adding or subtracting. Add or subtract only the numerators, keep the denominator, and simplify the result.",
    workedExamples["fractions-1"],
    [
      [1, 4, "+", 2, 4],
      [2, 7, "+", 3, 7],
      [5, 8, "-", 1, 8],
      [7, 10, "-", 3, 10],
      [1, 2, "+", 1, 4],
      [2, 3, "+", 1, 6],
      [3, 4, "-", 1, 2],
      [5, 6, "-", 1, 3],
      [3, 4, "-", 1, 6],
      [2, 5, "+", 1, 3],
      [7, 8, "-", 1, 6],
      [5, 12, "+", 7, 18],
    ].map(([a, b, op, c, d]) => {
      const common = (b * d) / gcd(b, d),
        left = (a * common) / b,
        right = (c * common) / d,
        n = op === "+" ? left + right : left - right;
      return q(
        `${a}/${b}${op}${c}/${d}`,
        fraction(n, common),
        b === d
          ? "The denominators already match. Work with the numerators."
          : `Use ${common} as the common denominator.`,
        `${a}/${b} = ${left}/${common} and ${c}/${d} = ${right}/${common}. ${op === "+" ? "Add" : "Subtract"} the numerators: ${left} ${op} ${right} = ${n}. Simplify ${n}/${common} to ${fraction(n, common)}.`,
      );
    }),
    [fractionExamples[0]],
  );
  const multiply = lesson(
    "fractions-multiply",
    "Multiplying fractions",
    "Multiply parts of a whole and cancel common factors.",
    "Multiply numerators together and denominators together. You do not need a common denominator. Simplify before or after multiplying.",
    fractionExamples[1],
    [
      [1, 2, 1, 3],
      [1, 4, 2, 5],
      [2, 5, 3, 4],
      [3, 7, 2, 3],
      [2, 3, 3, 5],
      [4, 5, 5, 8],
      [5, 6, 3, 10],
      [7, 9, 3, 14],
      [5, 8, 4, 15],
      [7, 12, 6, 7],
      [3, 4, 2, 1],
      [8, 9, 27, 16],
    ].map(([a, b, c, d]) =>
      q(
        `(${a}/${b})*(${c}/${d})`,
        fraction(a * c, b * d),
        "Multiply the two numerators and the two denominators, then simplify.",
        `(${a} × ${c}) / (${b} × ${d}) = ${a * c}/${b * d} = ${fraction(a * c, b * d)}.`,
      ),
    ),
  );
  const divide = lesson(
    "fractions-divide",
    "Dividing fractions",
    "Use reciprocals to turn division into multiplication.",
    "Keep the first fraction, change division to multiplication, and flip the second fraction. Multiply, then simplify. For a whole-number divisor, write it over 1 first.",
    fractionExamples[2],
    [
      [1, 2, 1, 4],
      [1, 3, 1, 6],
      [2, 5, 1, 5],
      [3, 4, 1, 2],
      [2, 3, 4, 5],
      [5, 6, 2, 3],
      [3, 8, 3, 4],
      [7, 10, 7, 5],
      [4, 9, 2, 3],
      [5, 12, 5, 18],
      [3, 5, 2, 1],
      [7, 8, 7, 16],
    ].map(([a, b, c, d]) =>
      q(
        `(${a}/${b})/(${c}/${d})`,
        fraction(a * d, b * c),
        `The reciprocal of ${c}/${d} is ${d}/${c}.`,
        `Keep ${a}/${b} and multiply by ${d}/${c}: (${a} × ${d}) / (${b} × ${c}) = ${a * d}/${b * c} = ${fraction(a * d, b * c)}.`,
      ),
    ),
  );
  const mixed = lesson(
    "fractions-mixed",
    "Mixed numbers & fraction review",
    "Convert mixed numbers, then apply all four operations.",
    "Convert mixed numbers to improper fractions first: multiply the whole number by the denominator and add the numerator. Then use the rule for the operation. Simplify and convert back when asked.",
    fractionExamples[3],
    [
      q(
        "1 1/2",
        "3/2",
        "Multiply the whole number by 2, then add 1.",
        "(1 × 2 + 1)/2 = 3/2.",
        "Write this mixed number as an improper fraction.",
        "fraction",
      ),
      q(
        "2 1/3",
        "7/3",
        "Multiply 2 by 3, then add 1.",
        "(2 × 3 + 1)/3 = 7/3.",
        "Write this mixed number as an improper fraction.",
        "fraction",
      ),
      q(
        "7/4",
        "1 3/4",
        "Divide 7 by 4 and use the remainder as the numerator.",
        "7 = 1 × 4 + 3, so 7/4 = 1 3/4.",
        "Write this improper fraction as a mixed number.",
        "mixed",
      ),
      q(
        "11/3",
        "3 2/3",
        "Divide 11 by 3 and keep the remainder.",
        "11 = 3 × 3 + 2, so 11/3 = 3 2/3.",
        "Write this improper fraction as a mixed number.",
        "mixed",
      ),
      q(
        "1 1/2+2 1/4",
        "15/4",
        "Rewrite the mixed numbers as 3/2 and 9/4.",
        "3/2 + 9/4 = 6/4 + 9/4 = 15/4, or 3 3/4.",
      ),
      q(
        "3 1/3-1 5/6",
        "3/2",
        "Convert to improper fractions, then use sixths.",
        "10/3 − 11/6 = 20/6 − 11/6 = 9/6 = 3/2.",
      ),
      q(
        "(1 1/2)*(2 2/3)",
        "4",
        "Convert to 3/2 × 8/3 and cancel common factors.",
        "3/2 × 8/3 = 24/6 = 4.",
      ),
      q(
        "(2 1/4)/(1 1/2)",
        "3/2",
        "Convert to 9/4 divided by 3/2.",
        "9/4 × 2/3 = 18/12 = 3/2, or 1 1/2.",
      ),
      q(
        "2 2/5+1 3/10",
        "37/10",
        "Convert to 12/5 + 13/10 and use tenths.",
        "12/5 + 13/10 = 24/10 + 13/10 = 37/10, or 3 7/10.",
      ),
      q(
        "5 1/4-2 2/3",
        "31/12",
        "Convert to 21/4 − 8/3 and use twelfths.",
        "63/12 − 32/12 = 31/12, or 2 7/12.",
      ),
      q(
        "(2 1/4)*(1 1/3)",
        "3",
        "Convert to 9/4 × 4/3.",
        "9/4 × 4/3 = 36/12 = 3.",
      ),
      q(
        "(3 1/2)/(1 1/6)",
        "3",
        "Convert to 7/2 divided by 7/6.",
        "7/2 × 6/7 = 42/14 = 3.",
      ),
    ],
  );
  return [
    simplify,
    equivalent,
    conversionLesson,
    add,
    multiply,
    divide,
    mixed,
  ].map((l, i) => ({ ...l, sequence: i + 1, sequenceTotal: 7 }));
}
