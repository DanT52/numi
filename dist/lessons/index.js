import fractions from "./fractions/index.js";
import signedNumbers from "./signed-numbers/index.js";
import orderOfOperations from "./order-of-operations/index.js";
import factorsAndMultiples from "./factors-and-multiples/index.js";

export { topics, upcoming } from "./catalog.js";
export const lessons = [
  ...fractions,
  ...signedNumbers,
  ...orderOfOperations,
  ...factorsAndMultiples,
];
export const totalProblems = lessons.reduce(
  (sum, l) => sum + l.problems.length,
  0,
);
