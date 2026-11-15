export default {
  id: "fractions-simplify",
  topic: "fractions",
  title: "Simplifying fractions",
  subtitle: "Start by reducing a fraction without changing its value.",
  rule: "Divide the numerator and denominator by the same common factor. Using their greatest common factor reduces the fraction in one step.",
  example: {
    expr: "6/8",
    answer: "3/4",
    steps: [
      {
        text: "Find a factor shared by the numerator and denominator. The greatest common factor of 6 and 8 is 2.",
        lines: [],
      },
      {
        text: "Divide both parts by 2.",
        lines: [["6/8", "(6/2)/(8/2)", "3/4"]],
      },
      {
        text: "Three and four share no factor greater than 1, so the fraction is in simplest form.",
        lines: [["3/4"]],
      },
    ],
  },
  problems: [
    {
      expr: "2/4",
      answer: "1/2",
      hint: "Find a common factor of 2 and 4. Try 2.",
      solution:
        "Divide both the numerator and denominator by 2: 2 ÷ 2 = 1 and 4 ÷ 2 = 2. The simplest form is 1/2.",
      prompt: "Write this fraction in simplest form.",
      type: "simplified",
    },
    {
      expr: "3/9",
      answer: "1/3",
      hint: "Find a common factor of 3 and 9. Try 3.",
      solution:
        "Divide both the numerator and denominator by 3: 3 ÷ 3 = 1 and 9 ÷ 3 = 3. The simplest form is 1/3.",
      prompt: "Write this fraction in simplest form.",
      type: "simplified",
    },
    {
      expr: "4/6",
      answer: "2/3",
      hint: "Find a common factor of 4 and 6. Try 2.",
      solution:
        "Divide both the numerator and denominator by 2: 4 ÷ 2 = 2 and 6 ÷ 2 = 3. The simplest form is 2/3.",
      prompt: "Write this fraction in simplest form.",
      type: "simplified",
    },
    {
      expr: "6/8",
      answer: "3/4",
      hint: "Find a common factor of 6 and 8. Try 2.",
      solution:
        "Divide both the numerator and denominator by 2: 6 ÷ 2 = 3 and 8 ÷ 2 = 4. The simplest form is 3/4.",
      prompt: "Write this fraction in simplest form.",
      type: "simplified",
    },
    {
      expr: "8/12",
      answer: "2/3",
      hint: "Find a common factor of 8 and 12. Try 4.",
      solution:
        "Divide both the numerator and denominator by 4: 8 ÷ 4 = 2 and 12 ÷ 4 = 3. The simplest form is 2/3.",
      prompt: "Write this fraction in simplest form.",
      type: "simplified",
    },
    {
      expr: "10/15",
      answer: "2/3",
      hint: "Find a common factor of 10 and 15. Try 5.",
      solution:
        "Divide both the numerator and denominator by 5: 10 ÷ 5 = 2 and 15 ÷ 5 = 3. The simplest form is 2/3.",
      prompt: "Write this fraction in simplest form.",
      type: "simplified",
    },
    {
      expr: "12/18",
      answer: "2/3",
      hint: "Find a common factor of 12 and 18. Try 6.",
      solution:
        "Divide both the numerator and denominator by 6: 12 ÷ 6 = 2 and 18 ÷ 6 = 3. The simplest form is 2/3.",
      prompt: "Write this fraction in simplest form.",
      type: "simplified",
    },
    {
      expr: "15/20",
      answer: "3/4",
      hint: "Find a common factor of 15 and 20. Try 5.",
      solution:
        "Divide both the numerator and denominator by 5: 15 ÷ 5 = 3 and 20 ÷ 5 = 4. The simplest form is 3/4.",
      prompt: "Write this fraction in simplest form.",
      type: "simplified",
    },
    {
      expr: "18/24",
      answer: "3/4",
      hint: "Find a common factor of 18 and 24. Try 6.",
      solution:
        "Divide both the numerator and denominator by 6: 18 ÷ 6 = 3 and 24 ÷ 6 = 4. The simplest form is 3/4.",
      prompt: "Write this fraction in simplest form.",
      type: "simplified",
    },
    {
      expr: "24/36",
      answer: "2/3",
      hint: "Find a common factor of 24 and 36. Try 12.",
      solution:
        "Divide both the numerator and denominator by 12: 24 ÷ 12 = 2 and 36 ÷ 12 = 3. The simplest form is 2/3.",
      prompt: "Write this fraction in simplest form.",
      type: "simplified",
    },
    {
      expr: "33/75",
      answer: "11/25",
      hint: "Find a common factor of 33 and 75. Try 3.",
      solution:
        "Divide both the numerator and denominator by 3: 33 ÷ 3 = 11 and 75 ÷ 3 = 25. The simplest form is 11/25.",
      prompt: "Write this fraction in simplest form.",
      type: "simplified",
    },
    {
      expr: "42/56",
      answer: "3/4",
      hint: "Find a common factor of 42 and 56. Try 14.",
      solution:
        "Divide both the numerator and denominator by 14: 42 ÷ 14 = 3 and 56 ÷ 14 = 4. The simplest form is 3/4.",
      prompt: "Write this fraction in simplest form.",
      type: "simplified",
    },
  ],
  moreExamples: [],
  minutes: 15,
  tool: "fractions",
  sequence: 1,
  sequenceTotal: 7,
};
