export default {
  id: "factors-1",
  topic: "factors",
  title: "Prime factors & greatest common factors",
  subtitle: "Break numbers down to their building blocks.",
  minutes: 12,
  tool: "factors",
  rule: "A prime number has exactly two positive factors: 1 and itself. Prime factorization writes a number as a product of primes. The GCF uses only shared prime factors, at their smallest shared powers.",
  example: {
    expr: "24",
    answer: "2^3*3",
    steps: [
      {
        text: "Split the number into a product.",
        lines: [["24", "4*6"]],
      },
      {
        text: "Split any composite factors again.",
        lines: [["4*6", "(2*2)*(2*3)"]],
      },
      {
        text: "All the factors are prime. Group the repeated twos using an exponent.",
        lines: [["2*2*2*3", "2^3*3"]],
      },
    ],
  },
  problems: [
    {
      expr: "12",
      answer: "2^2*3",
      hint: "Split 12 into 3 × 4, then split 4.",
      solution: "12 = 3 × 4 = 2 × 2 × 3 = 2² × 3.",
      prompt:
        "Write the prime factorization. Use * for multiplication and ^ for powers.",
      type: "prime",
    },
    {
      expr: "30",
      answer: "2*3*5",
      hint: "Start with 30 = 3 × 10.",
      solution: "30 = 3 × 2 × 5. All three factors are prime.",
      prompt: "Write the prime factorization.",
      type: "prime",
    },
    {
      expr: "72",
      answer: "2^3*3^2",
      hint: "Try 72 = 8 × 9.",
      solution: "8 = 2³ and 9 = 3², so 72 = 2³ × 3².",
      prompt: "Write the prime factorization.",
      type: "prime",
    },
    {
      expr: "18",
      answer: "6",
      hint: "List the factors of 12 and 18 and find the largest shared one.",
      solution:
        "Factors of 12: 1, 2, 3, 4, 6, 12. Factors of 18: 1, 2, 3, 6, 9, 18. The GCF is 6.",
      prompt: "Find the GCF of 12 and 18.",
      type: "number",
    },
    {
      expr: "36",
      answer: "12",
      hint: "24 = 2³ × 3 and 36 = 2² × 3².",
      solution: "Keep the shared smaller powers: 2² × 3 = 12.",
      prompt: "Find the GCF of 24 and 36.",
      type: "number",
    },
    {
      expr: "28",
      answer: "7",
      hint: "Which number greater than 1 divides both 21 and 28?",
      solution: "21 = 3 × 7 and 28 = 2² × 7. The GCF is 7.",
      prompt: "Find the GCF of 21 and 28.",
      type: "number",
    },
    {
      expr: "25",
      answer: "1",
      hint: "The only prime factors are 2s for 16 and 5s for 25.",
      solution:
        "16 = 2⁴ and 25 = 5². They share no prime factors, so the GCF is 1.",
      prompt: "Find the GCF of 16 and 25.",
      type: "number",
    },
    {
      expr: "84",
      answer: "2^2*3*7",
      hint: "Split 84 into 12 × 7.",
      solution: "12 = 2² × 3, so 84 = 2² × 3 × 7.",
      prompt: "Write the prime factorization.",
      type: "prime",
    },
  ],
};
