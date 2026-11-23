import { calculate } from "./math.js";

// Four questions per group. Each set of ten draws from all ten groups.
export const signedQuizGroups = {
  "Small addition": ["-7+12", "8+(-13)", "-11+(-4)", "-14+14"],
  "Small subtraction": ["-2-7", "3-11", "-9-(-12)", "8-(-3)"],
  "Three small numbers": [
    "-5+11-3",
    "7-(-6)+(-9)",
    "-12-(-3)+5",
    "6+(-10)-(-7)",
  ],
  "Two larger numbers": ["-61+149", "123-(-46)", "-158-35", "75+(-134)"],
  "Three larger numbers": [
    "-163+87-26",
    "146-(-32)+(-55)",
    "-91-(-128)-43",
    "58+(-176)+99",
  ],
  "Multiply matching signs": ["(-6)*(-4)", "(-12)*(-7)", "9*6", "(-11)*(-3)"],
  "Multiply different signs": ["7*(-5)", "(-9)*8", "12*(-4)", "(-11)*5"],
  "Divide matching signs": ["(-56)/(-8)", "(-63)/(-7)", "84/12", "(-96)/(-12)"],
  "Divide different signs": ["(-42)/6", "108/(-9)", "(-121)/11", "72/(-12)"],
  "Mixed operations": [
    "5-(-2)*3",
    "(-24)/6-(-7)",
    "(-3)*9+17",
    "(-8+2)*(-3)-5",
  ],
};

// Focus on the result's sign so students can rehearse the rule itself.
const warmupGroups = [
  [
    "Addition",
    [
      ["1+2", "Two positive numbers add to a positive number."],
      ["-1+(-2)", "Two negative numbers add to a negative number."],
      [
        "2+(-1)",
        "With opposite signs, use the sign of the number farther from zero. Here, that is positive 2.",
      ],
      [
        "1+(-2)",
        "With opposite signs, use the sign of the number farther from zero. Here, that is negative 2.",
      ],
      [
        "-1+2",
        "With opposite signs, use the sign of the number farther from zero. Here, that is positive 2.",
      ],
      [
        "-2+1",
        "With opposite signs, use the sign of the number farther from zero. Here, that is negative 2.",
      ],
      ["-1+1", "A number and its opposite cancel to zero."],
      ["2+(-2)", "A number and its opposite cancel to zero."],
      ["1+0", "Adding zero leaves the original number unchanged."],
      ["-1+0", "Adding zero leaves the original number unchanged."],
      ["0+1", "Adding a number to zero gives that same number."],
      ["0+(-1)", "Adding zero leaves the original number unchanged."],
      ["0+0", "Zero plus zero is zero."],
    ],
  ],
  [
    "Subtraction",
    [
      [
        "2-1",
        "Subtracting a smaller positive from a larger positive leaves a positive result.",
      ],
      [
        "1-2",
        "Subtracting a larger positive from a smaller positive gives a negative result.",
      ],
      ["1-1", "Subtracting a number from itself gives zero."],
      [
        "-2-1",
        "Subtracting a positive from a negative moves farther left, so the result stays negative.",
      ],
      [
        "2-(-1)",
        "Subtracting a negative means adding a positive. Here both terms are positive.",
      ],
      [
        "-1-(-2)",
        "Rewrite subtraction as addition: −1 + 2. The positive term is farther from zero.",
      ],
      [
        "-2-(-1)",
        "Rewrite subtraction as addition: −2 + 1. The negative term is farther from zero.",
      ],
      ["-1-(-1)", "Rewrite subtraction as addition: −1 + 1. Opposites cancel."],
      [
        "0-1",
        "Subtracting from zero gives the opposite of the number. Here the opposite is negative.",
      ],
      [
        "0-(-1)",
        "Subtracting from zero gives the opposite of the number. Here the opposite is positive.",
      ],
      ["-1-0", "Subtracting zero leaves the original number unchanged."],
      ["1-0", "Subtracting zero leaves the original number unchanged."],
      ["0-0", "Zero minus zero is zero."],
    ],
  ],
  [
    "Multiplication",
    [
      [
        "2*1",
        "Two positive factors have matching signs, so their product is positive.",
      ],
      [
        "(-1)*(-1)",
        "Two negative factors have matching signs, so their product is positive.",
      ],
      ["2*(-1)", "Factors with different signs give a negative product."],
      [
        "(-1)*2",
        "Factors with different signs give a negative product in either order.",
      ],
      [
        "0*(-2)",
        "Multiplying by zero gives zero, whatever the other factor’s sign.",
      ],
      [
        "0*2",
        "Multiplying by zero gives zero, whatever the other factor’s sign.",
      ],
      [
        "2*0",
        "Multiplying by zero gives zero, whatever the other factor’s sign.",
      ],
      [
        "(-2)*0",
        "Multiplying by zero gives zero, whatever the other factor’s sign.",
      ],
      ["0*0", "Multiplying zero by zero gives zero."],
    ],
  ],
  [
    "Division",
    [
      ["2/1", "Matching nonzero signs give a positive quotient."],
      [
        "(-2)/(-1)",
        "Two negatives have matching signs, so their quotient is positive.",
      ],
      ["2/(-1)", "Different signs give a negative quotient."],
      ["(-2)/1", "Different signs give a negative quotient."],
      ["0/2", "Zero divided by any nonzero number is zero."],
      [
        "0/(-2)",
        "Zero divided by any nonzero number is zero, including negatives.",
      ],
      ["1/0", "Division by zero is undefined."],
      [
        "(-1)/0",
        "Division by zero is undefined, even with a negative numerator.",
      ],
      ["0/0", "Division by zero is undefined, including zero divided by zero."],
    ],
  ],
];

export const signedWarmup = warmupGroups.flatMap(([group, problems]) =>
  problems.map(([expr, explanation]) => {
    const number = expr.endsWith("/0") ? null : calculate(expr);
    const sign =
      number === null
        ? "undefined"
        : number === 0
          ? "zero"
          : number > 0
            ? "positive"
            : "negative";
    return {
      group,
      expr,
      explanation,
      sign,
      answer: number === null ? null : String(number),
    };
  }),
);
