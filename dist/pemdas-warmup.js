// The first option gives the operation to do next. Choices are shuffled per run.
export const orderWarmup = [
  ["5+2*3", ["2*3", "5+2"], "Multiply before adding."],
  ["(4+2)*3", ["4+2", "2*3"], "Evaluate the sum inside the parentheses first."],
  ["10-8/2", ["8/2", "10-8"], "Divide before subtracting."],
  ["12/3*2", ["12/3", "3*2"], "Division and multiplication have the same priority. Work left to right."],
  ["3*8/4", ["3*8", "8/4"], "Multiplication and division share a priority. The multiplication comes first from the left."],
  ["8-3+2", ["8-3", "3+2"], "Subtraction and addition share a priority. Start on the left."],
  ["4+5-2", ["4+5", "5-2"], "Addition and subtraction share a priority. Start on the left."],
  ["3*2^2", ["2^2", "3*2"], "Evaluate the power before multiplying."],
  ["(2+3)^2+1", ["2+3", "3^2", "2+1"], "Simplify the base inside the parentheses before squaring it."],
  ["2*(3+(4-2))", ["4-2", "3+4", "2*3"], "Start with the innermost parentheses."],
  ["-4^2+3", ["4^2", "(-4)^2", "-4+3"], "The leading minus is outside the power. Square 4 first, then apply the minus."],
  ["(-2)^2*3", ["(-2)^2", "2*3", "2^2"], "The parentheses make negative 2 the base. Square the whole base before multiplying."],
  ["6-(-2)*3", ["(-2)*3", "6-(-2)"], "Multiply the signed number by 3 before subtracting."],
  ["1+(2+3*4)", ["3*4", "2+3", "1+2"], "Work inside the parentheses first. Inside that group, multiplication still comes before addition."],
].map(([expr, choices, explanation]) => ({
  expr, choices, first: choices[0], explanation, prompt: "Which operation should you do first?",
  group: "Choose the first operation",
}));
