export default {
  id: "factors-2",
  topic: "factors",
  title: "Least common multiples & denominators",
  subtitle: "Find where number patterns meet.",
  minutes: 12,
  tool: "factors",
  rule: "The LCM is the smallest positive multiple shared by two numbers. Use every prime factor at its greatest power. The LCM of two denominators gives the least common denominator for their fractions.",
  example: {
    expr: "1/6+1/8",
    answer: "7/24",
    steps: [
      {
        text: "Factor the denominators into primes.",
        lines: [
          ["6", "2*3"],
          ["8", "2^3"],
        ],
      },
      {
        text: "Use the highest power of each prime. The least common multiple is 24.",
        lines: [["2^3*3", "24"]],
      },
      {
        text: "Rewrite each fraction with denominator 24.",
        lines: [
          ["1/6", "(1*4)/(6*4)", "4/24"],
          ["1/8", "(1*3)/(8*3)", "3/24"],
        ],
      },
      {
        text: "Add the numerators and keep the common denominator.",
        lines: [["4/24+3/24", "(4+3)/24", "7/24"]],
      },
    ],
  },
  problems: [
    {
      expr: "6",
      answer: "12",
      hint: "List multiples of 4 and 6 until they meet.",
      solution: "4, 8, 12… and 6, 12… first meet at 12.",
      prompt: "Find the LCM of 4 and 6.",
      type: "number",
    },
    {
      expr: "12",
      answer: "24",
      hint: "Look for the first multiple of 12 that is also a multiple of 8.",
      solution: "8 = 2³ and 12 = 2² × 3. The LCM is 2³ × 3 = 24.",
      prompt: "Find the LCM of 8 and 12.",
      type: "number",
    },
    {
      expr: "15",
      answer: "45",
      hint: "9 = 3² and 15 = 3 × 5.",
      solution: "Use the highest power of each prime: 3² × 5 = 45.",
      prompt: "Find the LCM of 9 and 15.",
      type: "number",
    },
    {
      expr: "7",
      answer: "35",
      hint: "These two numbers share no prime factors.",
      solution: "5 and 7 are distinct primes, so their LCM is 5 × 7 = 35.",
      prompt: "Find the LCM of 5 and 7.",
      type: "number",
    },
    {
      expr: "1/6+1/4",
      answer: "12",
      hint: "Find the LCM of the denominators 6 and 4.",
      solution:
        "The LCM of 6 and 4 is 12, so the least common denominator is 12.",
      prompt: "Find the least common denominator (not the sum).",
      type: "number",
    },
    {
      expr: "1/3+1/4",
      answer: "7/12",
      hint: "Use 12 as the common denominator.",
      solution: "1/3 = 4/12 and 1/4 = 3/12. Add to get 7/12.",
      prompt: "Find the answer.",
      type: "number",
    },
    {
      expr: "5/6-1/4",
      answer: "7/12",
      hint: "Use the LCM of 6 and 4 as your denominator.",
      solution: "5/6 = 10/12 and 1/4 = 3/12. Subtract to get 7/12.",
      prompt: "Find the answer.",
      type: "number",
    },
    {
      expr: "1/8+1/12",
      answer: "5/24",
      hint: "The LCM of 8 and 12 is 24.",
      solution: "1/8 = 3/24 and 1/12 = 2/24. Add to get 5/24.",
      prompt: "Find the answer.",
      type: "number",
    },
  ],
};
