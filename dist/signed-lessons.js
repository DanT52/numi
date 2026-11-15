const q = (expr, answer, hint, solution) => ({
  expr,
  answer,
  hint,
  solution,
  prompt: "Find the answer.",
  type: "number",
});
const step = (text, ...lines) => ({ text, lines });

export const signedAdditionLesson = {
  id: "integers-add-subtract-2",
  topic: "integers",
  title: "Adding & subtracting: three numbers",
  subtitle: "Combine three signed numbers, working from left to right.",
  minutes: 30,
  tool: "line",
  rule: "Addition and subtraction have equal priority, so work from left to right. Subtracting a negative means adding its opposite. Check the sign of each intermediate result before continuing.",
  example: {
    expr: "-4-(-6)+3",
    answer: "5",
    steps: [
      step("Rewrite subtracting negative six as adding positive six.", [
        "-4-(-6)+3",
        "-4+6+3",
      ]),
      step("Work from left to right: combine the first two numbers.", [
        "-4+6+3",
        "2+3",
      ]),
      step(
        "Add the remaining number. On the number line, finish three places to the right of 2.",
        ["2+3", "5"],
      ),
    ],
  },
  problems: [
    q(
      "-3+5-2",
      "0",
      "First add −3 and 5, then subtract 2.",
      "−3 + 5 = 2, then 2 − 2 = 0.",
    ),
    q(
      "4+(-7)+6",
      "3",
      "Adding −7 moves left. Start by combining 4 and −7.",
      "4 + (−7) = −3, then −3 + 6 = 3.",
    ),
    q(
      "-6+(-2)+5",
      "-3",
      "Add the two negatives before adding positive 5.",
      "−6 + (−2) = −8, then −8 + 5 = −3.",
    ),
    q(
      "8-3-7",
      "-2",
      "Subtractions run from left to right.",
      "8 − 3 = 5, then 5 − 7 = −2.",
    ),
    q(
      "-4-(-6)+3",
      "5",
      "Change subtracting −6 into adding 6.",
      "−4 + 6 + 3 = 2 + 3 = 5.",
    ),
    q(
      "-7-3-(-8)",
      "-2",
      "First subtract 3, then rewrite subtracting −8.",
      "−7 − 3 = −10, then −10 − (−8) = −10 + 8 = −2.",
    ),
    q(
      "9+(-9)-4",
      "-4",
      "The first two numbers are opposites.",
      "9 + (−9) = 0, then 0 − 4 = −4.",
    ),
    q(
      "-5-(-9)+(-6)",
      "-2",
      "Subtracting −9 means adding 9.",
      "−5 + 9 = 4, then 4 + (−6) = −2.",
    ),
    q(
      "12+(-8)-7",
      "-3",
      "Combine 12 and −8 first.",
      "12 + (−8) = 4, then 4 − 7 = −3.",
    ),
    q(
      "-15+9-(-4)",
      "-2",
      "Work left to right, then add the opposite of −4.",
      "−15 + 9 = −6, then −6 − (−4) = −6 + 4 = −2.",
    ),
    q(
      "18-(-7)+(-30)",
      "-5",
      "Subtracting −7 moves right seven places.",
      "18 − (−7) = 25, then 25 + (−30) = −5.",
    ),
    q(
      "-24-(-15)-(-12)",
      "3",
      "Both subtractions of negatives become additions.",
      "−24 + 15 + 12 = −9 + 12 = 3.",
    ),
    q(
      "-8+3+11",
      "6",
      "Combine −8 and 3 first, then add 11.",
      "−8 + 3 = −5, then −5 + 11 = 6.",
    ),
    q(
      "7-12+(-5)",
      "-10",
      "Subtract 12 before adding the negative five.",
      "7 − 12 = −5, then −5 + (−5) = −10.",
    ),
    q(
      "-10-(-4)-3",
      "-9",
      "Subtracting −4 is the same as adding 4.",
      "−10 + 4 = −6, then −6 − 3 = −9.",
    ),
    q(
      "14+(-6)-(-2)",
      "10",
      "First add −6, then add the opposite of −2.",
      "14 + (−6) = 8, then 8 − (−2) = 8 + 2 = 10.",
    ),
    q(
      "-9+(-7)+20",
      "4",
      "Combine the two negative numbers before adding 20.",
      "−9 + (−7) = −16, then −16 + 20 = 4.",
    ),
    q(
      "0-(-13)+(-8)",
      "5",
      "Subtracting −13 moves right from zero.",
      "0 − (−13) = 13, then 13 + (−8) = 5.",
    ),
    q(
      "-16-(-9)+(-5)",
      "-12",
      "Rewrite subtracting −9 as adding 9.",
      "−16 + 9 = −7, then −7 + (−5) = −12.",
    ),
    q(
      "25+(-40)-(-10)",
      "-5",
      "Combine 25 and −40, then add positive 10.",
      "25 + (−40) = −15, then −15 − (−10) = −15 + 10 = −5.",
    ),
    q(
      "-30+18-(-7)",
      "-5",
      "Work left to right and change the last subtraction to addition.",
      "−30 + 18 = −12, then −12 − (−7) = −12 + 7 = −5.",
    ),
    q(
      "42-(-8)+(-60)",
      "-10",
      "Subtracting −8 adds 8 before you add −60.",
      "42 + 8 = 50, then 50 + (−60) = −10.",
    ),
    q(
      "-35-15+70",
      "20",
      "Subtract 15 first; this moves farther left.",
      "−35 − 15 = −50, then −50 + 70 = 20.",
    ),
    q(
      "-48-(-27)-(-16)",
      "-5",
      "Both subtractions of negatives become additions.",
      "−48 + 27 = −21, then −21 + 16 = −5.",
    ),
    q(
      "65+(-90)-(-25)",
      "0",
      "Combine 65 and −90, then add the opposite of −25.",
      "65 + (−90) = −25, then −25 − (−25) = −25 + 25 = 0.",
    ),
  ],
};

export const signedReviewLesson = {
  id: "integers-review",
  topic: "integers",
  title: "Signed numbers: mixed review",
  subtitle: "Review addition, subtraction, multiplication, and division.",
  minutes: 18,
  tool: "calculator",
  rule: "Add and subtract from left to right. For multiplication and division, matching signs give a positive result and different signs give a negative result. In mixed expressions, evaluate parentheses, then multiplication/division, then addition/subtraction.",
  example: {
    expr: "(-12)/3+(-2)*4",
    answer: "-12",
    steps: [
      step(
        "Division comes before the final addition. Different signs give a negative quotient.",
        ["(-12)/3+(-2)*4", "-4+(-2)*4"],
      ),
      step(
        "Multiply next. Negative two times positive four is negative eight.",
        ["-4+(-2)*4", "-4+(-8)"],
      ),
      step("Add the two negative results.", ["-4+(-8)", "-12"]),
    ],
  },
  problems: [
    q(
      "(-8)+13",
      "5",
      "Start at −8 and move right 13 places.",
      "Eight positive steps cancel −8; five positive steps remain: 5.",
    ),
    q(
      "6-(-9)",
      "15",
      "Subtracting a negative means adding its opposite.",
      "6 − (−9) = 6 + 9 = 15.",
    ),
    q(
      "-12-7",
      "-19",
      "Subtracting a positive moves farther left.",
      "Start at −12 and move seven places left to −19.",
    ),
    q(
      "(-6)*(-4)",
      "24",
      "Matching signs give a positive product.",
      "6 × 4 = 24. The signs match, so the result is positive 24.",
    ),
    q(
      "7*(-5)",
      "-35",
      "Different signs give a negative product.",
      "7 × 5 = 35. The signs differ, so the result is −35.",
    ),
    q(
      "(-42)/6",
      "-7",
      "Divide the magnitudes and then choose the sign.",
      "42 ÷ 6 = 7. Different signs give −7.",
    ),
    q(
      "(-56)/(-8)",
      "7",
      "Both numbers have negative signs.",
      "56 ÷ 8 = 7. Matching signs give positive 7.",
    ),
    q(
      "-9+14-8",
      "-3",
      "For addition and subtraction, work left to right.",
      "−9 + 14 = 5, then 5 − 8 = −3.",
    ),
    q(
      "5-(-2)*3",
      "11",
      "Multiply −2 by 3 before subtracting.",
      "(−2) × 3 = −6, then 5 − (−6) = 5 + 6 = 11.",
    ),
    q(
      "(-18)/3+(-4)",
      "-10",
      "Do division before the final addition.",
      "−18 ÷ 3 = −6, then −6 + (−4) = −10.",
    ),
    q(
      "(-5)*4+12/(-3)",
      "-24",
      "Calculate the product and quotient before adding.",
      "(−5) × 4 = −20 and 12 ÷ (−3) = −4. Then −20 + (−4) = −24.",
    ),
    q(
      "(8-(-4))/(-3)+7",
      "3",
      "Start inside the parentheses, then divide, then add.",
      "8 − (−4) = 12; 12 ÷ (−3) = −4; −4 + 7 = 3.",
    ),
  ],
};
