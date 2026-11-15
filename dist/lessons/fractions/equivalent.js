export default {
  id: "fractions-equivalent",
  topic: "fractions",
  title: "Equivalent fractions",
  subtitle: "Rewrite fractions with a chosen denominator.",
  rule: "Multiply or divide both parts of a fraction by the same nonzero number. To build a common denominator, find the factor that changes the old denominator into the new one.",
  example: {
    expr: "1/2",
    answer: "3/6",
    steps: [
      {
        text: "We want to rewrite one half with denominator 6. Find the scale factor.",
        lines: [["6/2", "3"]],
      },
      {
        text: "Multiply the numerator and denominator by that factor.",
        lines: [["1/2", "(1*3)/(2*3)", "3/6"]],
      },
      {
        text: "The missing numerator is 3. The amount has not changed.",
        lines: [["1/2", "3/6"]],
      },
    ],
  },
  problems: [
    {
      expr: "1/2",
      answer: "2",
      hint: "Divide 4 by 2 to find the scale factor.",
      solution: "The scale factor is 2. Multiply both parts by 2: 1/2 = 2/4.",
      prompt:
        "Rewrite this fraction with denominator 4. Enter only the missing numerator.",
      type: "equivalent",
      targetDenominator: 4,
    },
    {
      expr: "1/3",
      answer: "2",
      hint: "Divide 6 by 3 to find the scale factor.",
      solution: "The scale factor is 2. Multiply both parts by 2: 1/3 = 2/6.",
      prompt:
        "Rewrite this fraction with denominator 6. Enter only the missing numerator.",
      type: "equivalent",
      targetDenominator: 6,
    },
    {
      expr: "2/3",
      answer: "8",
      hint: "Divide 12 by 3 to find the scale factor.",
      solution: "The scale factor is 4. Multiply both parts by 4: 2/3 = 8/12.",
      prompt:
        "Rewrite this fraction with denominator 12. Enter only the missing numerator.",
      type: "equivalent",
      targetDenominator: 12,
    },
    {
      expr: "3/4",
      answer: "6",
      hint: "Divide 8 by 4 to find the scale factor.",
      solution: "The scale factor is 2. Multiply both parts by 2: 3/4 = 6/8.",
      prompt:
        "Rewrite this fraction with denominator 8. Enter only the missing numerator.",
      type: "equivalent",
      targetDenominator: 8,
    },
    {
      expr: "2/5",
      answer: "8",
      hint: "Divide 20 by 5 to find the scale factor.",
      solution: "The scale factor is 4. Multiply both parts by 4: 2/5 = 8/20.",
      prompt:
        "Rewrite this fraction with denominator 20. Enter only the missing numerator.",
      type: "equivalent",
      targetDenominator: 20,
    },
    {
      expr: "3/5",
      answer: "15",
      hint: "Divide 25 by 5 to find the scale factor.",
      solution: "The scale factor is 5. Multiply both parts by 5: 3/5 = 15/25.",
      prompt:
        "Rewrite this fraction with denominator 25. Enter only the missing numerator.",
      type: "equivalent",
      targetDenominator: 25,
    },
    {
      expr: "5/6",
      answer: "15",
      hint: "Divide 18 by 6 to find the scale factor.",
      solution: "The scale factor is 3. Multiply both parts by 3: 5/6 = 15/18.",
      prompt:
        "Rewrite this fraction with denominator 18. Enter only the missing numerator.",
      type: "equivalent",
      targetDenominator: 18,
    },
    {
      expr: "7/8",
      answer: "21",
      hint: "Divide 24 by 8 to find the scale factor.",
      solution: "The scale factor is 3. Multiply both parts by 3: 7/8 = 21/24.",
      prompt:
        "Rewrite this fraction with denominator 24. Enter only the missing numerator.",
      type: "equivalent",
      targetDenominator: 24,
    },
    {
      expr: "3/10",
      answer: "15",
      hint: "Divide 50 by 10 to find the scale factor.",
      solution:
        "The scale factor is 5. Multiply both parts by 5: 3/10 = 15/50.",
      prompt:
        "Rewrite this fraction with denominator 50. Enter only the missing numerator.",
      type: "equivalent",
      targetDenominator: 50,
    },
    {
      expr: "5/12",
      answer: "15",
      hint: "Divide 36 by 12 to find the scale factor.",
      solution:
        "The scale factor is 3. Multiply both parts by 3: 5/12 = 15/36.",
      prompt:
        "Rewrite this fraction with denominator 36. Enter only the missing numerator.",
      type: "equivalent",
      targetDenominator: 36,
    },
    {
      expr: "7/15",
      answer: "35",
      hint: "Divide 75 by 15 to find the scale factor.",
      solution:
        "The scale factor is 5. Multiply both parts by 5: 7/15 = 35/75.",
      prompt:
        "Rewrite this fraction with denominator 75. Enter only the missing numerator.",
      type: "equivalent",
      targetDenominator: 75,
    },
    {
      expr: "11/25",
      answer: "44",
      hint: "Divide 100 by 25 to find the scale factor.",
      solution:
        "The scale factor is 4. Multiply both parts by 4: 11/25 = 44/100.",
      prompt:
        "Rewrite this fraction with denominator 100. Enter only the missing numerator.",
      type: "equivalent",
      targetDenominator: 100,
    },
  ],
  moreExamples: [],
  minutes: 15,
  tool: "fractions",
  sequence: 2,
  sequenceTotal: 7,
};
