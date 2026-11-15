export default {
  id: "fractions-add-subtract",
  topic: "fractions",
  title: "Adding & subtracting fractions",
  subtitle: "Start with matching denominators, then find common denominators.",
  rule: "Use a common denominator before adding or subtracting. Add or subtract only the numerators, keep the denominator, and simplify the result.",
  example: {
    expr: "1/2+1/3",
    answer: "5/6",
    steps: [
      {
        text: "Choose a common denominator. The smallest number divisible by both 2 and 3 is 6.",
        lines: [],
      },
      {
        text: "Rewrite the first fraction in sixths. Multiply its numerator and denominator by 3. This changes the pieces, but not the value.",
        lines: [["1/2", "(1*3)/(2*3)", "3/6"]],
      },
      {
        text: "Rewrite the second fraction in sixths. Multiply its numerator and denominator by 2.",
        lines: [["1/3", "(1*2)/(3*2)", "2/6"]],
      },
      {
        text: "Replace the original fractions with their equivalents. Now both fractions count sixths.",
        lines: [["1/2+1/3", "3/6+2/6"]],
      },
      {
        text: "Add the numerators and keep the denominator.",
        lines: [["3/6+2/6", "(3+2)/6", "5/6"]],
      },
      {
        text: "Check whether the answer simplifies. Five and six share no factor greater than 1, so this is the final answer.",
        lines: [["5/6"]],
      },
    ],
  },
  problems: [
    {
      expr: "1/4+2/4",
      answer: "3/4",
      hint: "The denominators already match. Work with the numerators.",
      solution:
        "1/4 = 1/4 and 2/4 = 2/4. Add the numerators: 1 + 2 = 3. Simplify 3/4 to 3/4.",
      prompt: "Find the answer.",
      type: "number",
    },
    {
      expr: "2/7+3/7",
      answer: "5/7",
      hint: "The denominators already match. Work with the numerators.",
      solution:
        "2/7 = 2/7 and 3/7 = 3/7. Add the numerators: 2 + 3 = 5. Simplify 5/7 to 5/7.",
      prompt: "Find the answer.",
      type: "number",
    },
    {
      expr: "5/8-1/8",
      answer: "1/2",
      hint: "The denominators already match. Work with the numerators.",
      solution:
        "5/8 = 5/8 and 1/8 = 1/8. Subtract the numerators: 5 - 1 = 4. Simplify 4/8 to 1/2.",
      prompt: "Find the answer.",
      type: "number",
    },
    {
      expr: "7/10-3/10",
      answer: "2/5",
      hint: "The denominators already match. Work with the numerators.",
      solution:
        "7/10 = 7/10 and 3/10 = 3/10. Subtract the numerators: 7 - 3 = 4. Simplify 4/10 to 2/5.",
      prompt: "Find the answer.",
      type: "number",
    },
    {
      expr: "1/2+1/4",
      answer: "3/4",
      hint: "Use 4 as the common denominator.",
      solution:
        "1/2 = 2/4 and 1/4 = 1/4. Add the numerators: 2 + 1 = 3. Simplify 3/4 to 3/4.",
      prompt: "Find the answer.",
      type: "number",
    },
    {
      expr: "2/3+1/6",
      answer: "5/6",
      hint: "Use 6 as the common denominator.",
      solution:
        "2/3 = 4/6 and 1/6 = 1/6. Add the numerators: 4 + 1 = 5. Simplify 5/6 to 5/6.",
      prompt: "Find the answer.",
      type: "number",
    },
    {
      expr: "3/4-1/2",
      answer: "1/4",
      hint: "Use 4 as the common denominator.",
      solution:
        "3/4 = 3/4 and 1/2 = 2/4. Subtract the numerators: 3 - 2 = 1. Simplify 1/4 to 1/4.",
      prompt: "Find the answer.",
      type: "number",
    },
    {
      expr: "5/6-1/3",
      answer: "1/2",
      hint: "Use 6 as the common denominator.",
      solution:
        "5/6 = 5/6 and 1/3 = 2/6. Subtract the numerators: 5 - 2 = 3. Simplify 3/6 to 1/2.",
      prompt: "Find the answer.",
      type: "number",
    },
    {
      expr: "3/4-1/6",
      answer: "7/12",
      hint: "Use 12 as the common denominator.",
      solution:
        "3/4 = 9/12 and 1/6 = 2/12. Subtract the numerators: 9 - 2 = 7. Simplify 7/12 to 7/12.",
      prompt: "Find the answer.",
      type: "number",
    },
    {
      expr: "2/5+1/3",
      answer: "11/15",
      hint: "Use 15 as the common denominator.",
      solution:
        "2/5 = 6/15 and 1/3 = 5/15. Add the numerators: 6 + 5 = 11. Simplify 11/15 to 11/15.",
      prompt: "Find the answer.",
      type: "number",
    },
    {
      expr: "7/8-1/6",
      answer: "17/24",
      hint: "Use 24 as the common denominator.",
      solution:
        "7/8 = 21/24 and 1/6 = 4/24. Subtract the numerators: 21 - 4 = 17. Simplify 17/24 to 17/24.",
      prompt: "Find the answer.",
      type: "number",
    },
    {
      expr: "5/12+7/18",
      answer: "29/36",
      hint: "Use 36 as the common denominator.",
      solution:
        "5/12 = 15/36 and 7/18 = 14/36. Add the numerators: 15 + 14 = 29. Simplify 29/36 to 29/36.",
      prompt: "Find the answer.",
      type: "number",
    },
  ],
  moreExamples: [
    {
      title: "Subtracting fractions",
      expr: "3/4-1/6",
      answer: "7/12",
      steps: [
        {
          text: "Use 12 as the common denominator.",
          lines: [],
        },
        {
          text: "Multiply both parts of the first fraction by 3.",
          lines: [["3/4", "(3*3)/(4*3)", "9/12"]],
        },
        {
          text: "Multiply both parts of the second fraction by 2.",
          lines: [["1/6", "(1*2)/(6*2)", "2/12"]],
        },
        {
          text: "Subtract the numerators. Keep the denominator.",
          lines: [["3/4-1/6", "9/12-2/12", "(9-2)/12", "7/12"]],
        },
      ],
    },
  ],
  minutes: 15,
  tool: "fractions",
  sequence: 4,
  sequenceTotal: 7,
};
