const step = (text, ...lines) => ({ text, lines });
export const workedExamples = {
  "fractions-1": {
    expr: "1/2+1/3",
    answer: "5/6",
    steps: [
      step(
        "Choose a common denominator. The smallest number divisible by both 2 and 3 is 6.",
      ),
      step(
        "Rewrite the first fraction in sixths. Multiply its numerator and denominator by 3. This changes the pieces, but not the value.",
        ["1/2", "(1*3)/(2*3)", "3/6"],
      ),
      step(
        "Rewrite the second fraction in sixths. Multiply its numerator and denominator by 2.",
        ["1/3", "(1*2)/(3*2)", "2/6"],
      ),
      step(
        "Replace the original fractions with their equivalents. Now both fractions count sixths.",
        ["1/2+1/3", "3/6+2/6"],
      ),
      step("Add the numerators and keep the denominator.", [
        "3/6+2/6",
        "(3+2)/6",
        "5/6",
      ]),
      step(
        "Check whether the answer simplifies. Five and six share no factor greater than 1, so this is the final answer.",
        ["5/6"],
      ),
    ],
  },
  "fractions-2": {
    expr: "3/4",
    answer: "75%",
    steps: [
      step(
        "A fraction means division. Divide the numerator by the denominator to find the decimal.",
        ["3/4", "0.75"],
      ),
      step(
        "To find the percentage, multiply the decimal by 100. The result tells you how many percent.",
        ["0.75*100", "75"],
      ),
      step(
        "Attach the percent sign. These are three equivalent ways to represent the same amount.",
        ["3/4", "0.75", "75%"],
      ),
    ],
  },
  "integers-1": {
    expr: "-3+5",
    answer: "2",
    steps: [
      step("Start at negative three.", ["-3"]),
      step(
        "Adding a positive number moves right. Three steps take you to zero.",
        ["-3+3", "0"],
      ),
      step("There are two steps left to move.", ["0+2", "2"]),
      step("The sum is positive two.", ["-3+5", "2"]),
    ],
  },
  "integers-2": {
    expr: "(-4)*(-3)",
    answer: "12",
    steps: [
      step("Multiply the magnitudes, ignoring their signs for this step.", [
        "4*3",
        "12",
      ]),
      step("Both factors have the same sign, so their product is positive.", [
        "(-4)*(-3)",
        "12",
      ]),
      step(
        "Check the pattern: each time the second factor decreases by one, the result increases by four.",
        ["(-4)*1", "-4"],
        ["(-4)*0", "0"],
        ["(-4)*(-1)", "4"],
      ),
    ],
  },
  "pemdas-1": {
    expr: "3+2*(8-5)^2",
    answer: "21",
    steps: [
      step("Evaluate the parentheses first.", ["3+2*(8-5)^2", "3+2*3^2"]),
      step("Evaluate the exponent.", ["3+2*3^2", "3+2*9"]),
      step("Multiply before adding.", ["3+2*9", "3+18"]),
      step("Add to finish.", ["3+18", "21"]),
    ],
  },
  "pemdas-2": {
    expr: "-3^2+(-3)^2",
    answer: "0",
    steps: [
      step(
        "Without parentheses, the exponent applies before the leading negative sign.",
        ["-3^2", "-(3^2)", "-9"],
      ),
      step("With parentheses, the whole negative number is squared.", [
        "(-3)^2",
        "(-3)*(-3)",
        "9",
      ]),
      step("Substitute the two results and add.", ["-3^2+(-3)^2", "-9+9", "0"]),
    ],
  },
  "factors-1": {
    expr: "24",
    answer: "2^3*3",
    steps: [
      step("Split the number into a product.", ["24", "4*6"]),
      step("Split any composite factors again.", ["4*6", "(2*2)*(2*3)"]),
      step(
        "All the factors are prime. Group the repeated twos using an exponent.",
        ["2*2*2*3", "2^3*3"],
      ),
    ],
  },
  "factors-2": {
    expr: "1/6+1/8",
    answer: "7/24",
    steps: [
      step("Factor the denominators into primes.", ["6", "2*3"], ["8", "2^3"]),
      step(
        "Use the highest power of each prime. The least common multiple is 24.",
        ["2^3*3", "24"],
      ),
      step(
        "Rewrite each fraction with denominator 24.",
        ["1/6", "(1*4)/(6*4)", "4/24"],
        ["1/8", "(1*3)/(8*3)", "3/24"],
      ),
      step("Add the numerators and keep the common denominator.", [
        "4/24+3/24",
        "(4+3)/24",
        "7/24",
      ]),
    ],
  },
};
export const fractionExamples = [
  {
    title: "Subtracting fractions",
    expr: "3/4-1/6",
    answer: "7/12",
    steps: [
      step("Use 12 as the common denominator."),
      step("Multiply both parts of the first fraction by 3.", [
        "3/4",
        "(3*3)/(4*3)",
        "9/12",
      ]),
      step("Multiply both parts of the second fraction by 2.", [
        "1/6",
        "(1*2)/(6*2)",
        "2/12",
      ]),
      step("Subtract the numerators. Keep the denominator.", [
        "3/4-1/6",
        "9/12-2/12",
        "(9-2)/12",
        "7/12",
      ]),
    ],
  },
  {
    title: "Multiplying and simplifying",
    expr: "(2/3)*(3/5)",
    answer: "2/5",
    steps: [
      step(
        "Multiply the numerators together and the denominators together. A common denominator is not needed.",
        ["(2/3)*(3/5)", "(2*3)/(3*5)", "6/15"],
      ),
      step(
        "The numerator and denominator share a factor of 3. Divide both by 3.",
        ["6/15", "(6/3)/(15/3)", "2/5"],
      ),
      step(
        "Check that the final numerator and denominator share no factor greater than 1.",
        ["2/5"],
      ),
    ],
  },
  {
    title: "Dividing fractions",
    expr: "3/4 / (1/2)",
    answer: "3/2",
    steps: [
      step(
        "Keep the first fraction. Change division to multiplication, and flip the second fraction to its reciprocal.",
        ["3/4 / (1/2)", "(3/4)*(2/1)"],
      ),
      step("Multiply across.", ["(3/4)*(2/1)", "(3*2)/(4*1)", "6/4"]),
      step("Simplify by dividing both parts by 2.", [
        "6/4",
        "(6/2)/(4/2)",
        "3/2",
      ]),
      step("As a mixed number, three halves is one whole and one half.", [
        "3/2",
        "1 1/2",
      ]),
    ],
  },
  {
    title: "Rewriting and adding mixed numbers",
    expr: "1 1/2+2 1/4",
    answer: "15/4",
    steps: [
      step(
        "To convert a mixed number, multiply the whole number by the denominator, then add the numerator. Keep the denominator.",
        ["1 1/2", "(1*2+1)/2", "3/2"],
      ),
      step("Convert the second mixed number the same way.", [
        "2 1/4",
        "(2*4+1)/4",
        "9/4",
      ]),
      step("Use 4 as the common denominator.", ["3/2", "(3*2)/(2*2)", "6/4"]),
      step("Add the rewritten fractions.", ["1 1/2+2 1/4", "6/4+9/4", "15/4"]),
      step(
        "Convert back to a mixed number: 15 contains three groups of 4, with 3 left over.",
        ["15/4", "3 3/4"],
      ),
    ],
  },
];
