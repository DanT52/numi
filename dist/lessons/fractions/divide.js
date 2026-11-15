export default {
  id: "fractions-divide",
  topic: "fractions",
  title: "Dividing fractions",
  subtitle: "Use reciprocals to turn division into multiplication.",
  rule: "Keep the first fraction, change division to multiplication, and flip the second fraction. Multiply, then simplify. For a whole-number divisor, write it over 1 first.",
  example: {
    title: "Dividing fractions",
    expr: "3/4 / (1/2)",
    answer: "3/2",
    steps: [
      {
        text: "Keep the first fraction. Change division to multiplication, and flip the second fraction to its reciprocal.",
        lines: [["3/4 / (1/2)", "(3/4)*(2/1)"]],
      },
      {
        text: "Multiply across.",
        lines: [["(3/4)*(2/1)", "(3*2)/(4*1)", "6/4"]],
      },
      {
        text: "Simplify by dividing both parts by 2.",
        lines: [["6/4", "(6/2)/(4/2)", "3/2"]],
      },
      {
        text: "As a mixed number, three halves is one whole and one half.",
        lines: [["3/2", "1 1/2"]],
      },
    ],
  },
  problems: [
    {
      expr: "(1/2)/(1/4)",
      answer: "2",
      hint: "The reciprocal of 1/4 is 4/1.",
      solution: "Keep 1/2 and multiply by 4/1: (1 × 4) / (2 × 1) = 4/2 = 2.",
      prompt: "Find the answer.",
      type: "number",
    },
    {
      expr: "(1/3)/(1/6)",
      answer: "2",
      hint: "The reciprocal of 1/6 is 6/1.",
      solution: "Keep 1/3 and multiply by 6/1: (1 × 6) / (3 × 1) = 6/3 = 2.",
      prompt: "Find the answer.",
      type: "number",
    },
    {
      expr: "(2/5)/(1/5)",
      answer: "2",
      hint: "The reciprocal of 1/5 is 5/1.",
      solution: "Keep 2/5 and multiply by 5/1: (2 × 5) / (5 × 1) = 10/5 = 2.",
      prompt: "Find the answer.",
      type: "number",
    },
    {
      expr: "(3/4)/(1/2)",
      answer: "3/2",
      hint: "The reciprocal of 1/2 is 2/1.",
      solution: "Keep 3/4 and multiply by 2/1: (3 × 2) / (4 × 1) = 6/4 = 3/2.",
      prompt: "Find the answer.",
      type: "number",
    },
    {
      expr: "(2/3)/(4/5)",
      answer: "5/6",
      hint: "The reciprocal of 4/5 is 5/4.",
      solution:
        "Keep 2/3 and multiply by 5/4: (2 × 5) / (3 × 4) = 10/12 = 5/6.",
      prompt: "Find the answer.",
      type: "number",
    },
    {
      expr: "(5/6)/(2/3)",
      answer: "5/4",
      hint: "The reciprocal of 2/3 is 3/2.",
      solution:
        "Keep 5/6 and multiply by 3/2: (5 × 3) / (6 × 2) = 15/12 = 5/4.",
      prompt: "Find the answer.",
      type: "number",
    },
    {
      expr: "(3/8)/(3/4)",
      answer: "1/2",
      hint: "The reciprocal of 3/4 is 4/3.",
      solution:
        "Keep 3/8 and multiply by 4/3: (3 × 4) / (8 × 3) = 12/24 = 1/2.",
      prompt: "Find the answer.",
      type: "number",
    },
    {
      expr: "(7/10)/(7/5)",
      answer: "1/2",
      hint: "The reciprocal of 7/5 is 5/7.",
      solution:
        "Keep 7/10 and multiply by 5/7: (7 × 5) / (10 × 7) = 35/70 = 1/2.",
      prompt: "Find the answer.",
      type: "number",
    },
    {
      expr: "(4/9)/(2/3)",
      answer: "2/3",
      hint: "The reciprocal of 2/3 is 3/2.",
      solution:
        "Keep 4/9 and multiply by 3/2: (4 × 3) / (9 × 2) = 12/18 = 2/3.",
      prompt: "Find the answer.",
      type: "number",
    },
    {
      expr: "(5/12)/(5/18)",
      answer: "3/2",
      hint: "The reciprocal of 5/18 is 18/5.",
      solution:
        "Keep 5/12 and multiply by 18/5: (5 × 18) / (12 × 5) = 90/60 = 3/2.",
      prompt: "Find the answer.",
      type: "number",
    },
    {
      expr: "(3/5)/(2/1)",
      answer: "3/10",
      hint: "The reciprocal of 2/1 is 1/2.",
      solution:
        "Keep 3/5 and multiply by 1/2: (3 × 1) / (5 × 2) = 3/10 = 3/10.",
      prompt: "Find the answer.",
      type: "number",
    },
    {
      expr: "(7/8)/(7/16)",
      answer: "2",
      hint: "The reciprocal of 7/16 is 16/7.",
      solution:
        "Keep 7/8 and multiply by 16/7: (7 × 16) / (8 × 7) = 112/56 = 2.",
      prompt: "Find the answer.",
      type: "number",
    },
  ],
  moreExamples: [],
  minutes: 15,
  tool: "fractions",
  sequence: 6,
  sequenceTotal: 7,
};
