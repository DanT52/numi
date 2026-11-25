export default {
  id: "pemdas-3",
  topic: "pemdas",
  title: "Larger numbers & decimals",
  subtitle: "Work through longer expressions with hundreds, thousands, and decimals.",
  minutes: 25,
  tool: "calculator",
  rule: "Use the same order for whole numbers and decimals. Copy the rest of the expression as you simplify each part. Line up decimal points when adding or subtracting, and use a trailing zero if it helps.",
  example: {
    expr: "480/(8+4)+3*(12.5-8.5)^2-6.25",
    answer: "81.75",
    steps: [
      {
        text: "Simplify both groups in parentheses. For the decimal subtraction, think of 12.5 and 8.5 as 12.50 and 8.50.",
        lines: [
          ["8+4", "12"],
          ["12.50-8.50", "4.00"],
          ["480/(8+4)+3*(12.5-8.5)^2-6.25", "480/12+3*4^2-6.25"],
        ],
      },
      {
        text: "Square 4 before multiplying it by 3.",
        lines: [["480/12+3*4^2-6.25", "480/12+3*16-6.25"]],
      },
      {
        text: "Divide and multiply before adding or subtracting. You can check the quotient because 12 × 40 = 480.",
        lines: [["480/12+3*16-6.25", "40+48-6.25"]],
      },
      {
        text: "Add and subtract from left to right. Write 88 as 88.00 so the decimal places line up for the final subtraction.",
        lines: [["40+48-6.25", "88.00-6.25", "81.75"]],
      },
    ],
  },
  problems: [
    [
      "125+48*3-60", "209",
      "Multiply 48 by 3 before you add or subtract.",
      "48 × 3 = 144. Then 125 + 144 = 269, and 269 − 60 = 209.",
    ],
    [
      "480/(12+8)+75", "99",
      "Add the two numbers in the denominator first.",
      "12 + 8 = 20. Then 480 ÷ 20 = 24, so 24 + 75 = 99.",
    ],
    [
      "300-18^2+45", "21",
      "Square 18 first. Then subtract and add from left to right.",
      "18² = 324. Then 300 − 324 = −24, and −24 + 45 = 21.",
    ],
    [
      "900/15*4-125", "115",
      "Division and multiplication share a priority. Start with the division on the left.",
      "900 ÷ 15 = 60. Then 60 × 4 = 240, and 240 − 125 = 115.",
    ],
    [
      "1200-5*(96-28)", "860",
      "Find the difference in parentheses before multiplying by 5.",
      "96 − 28 = 68. Then 5 × 68 = 340, and 1200 − 340 = 860.",
    ],
    [
      "480/(4*(22-12))+125-36", "101",
      "Start with the innermost parentheses, then finish the denominator.",
      "22 − 12 = 10, so the denominator is 4 × 10 = 40. Then 480 ÷ 40 = 12, and 12 + 125 − 36 = 101.",
    ],
    [
      "25.5+4*3.25", "38.5",
      "Multiply 3.25 by 4 first. Break 3.25 into 3 and 0.25 to make the multiplication easier.",
      "4 × 3.25 = 13.00. Then 25.50 + 13.00 = 38.50.",
    ],
    [
      "(18.6-6.2)/4+2.5", "5.6",
      "Subtract the decimals in parentheses, then divide the result by 4.",
      "18.6 − 6.2 = 12.4. Then 12.4 ÷ 4 = 3.1, and 3.1 + 2.5 = 5.6.",
    ],
    [
      "72.75-6.5*8+10.25", "31",
      "Find the product first. Then line up decimal points as you subtract and add.",
      "6.5 × 8 = 52. Then 72.75 − 52.00 = 20.75, and 20.75 + 10.25 = 31.00.",
    ],
    [
      "126.5/2.5+18*3", "104.6",
      "Do the division and the multiplication before adding. Scale both numbers in the division by 10 to make the divisor a whole number.",
      "126.5 ÷ 2.5 is the same as 1265 ÷ 25, which is 50.6. Then 18 × 3 = 54, and 50.6 + 54 = 104.6.",
    ],
    [
      "150-(12.5-4.5)^2+3.75", "89.75",
      "Simplify the decimal difference before squaring it.",
      "12.5 − 4.5 = 8, then 8² = 64. Finish with 150 − 64 = 86, and 86.00 + 3.75 = 89.75.",
    ],
    [
      "24.5-3.5*(-12)+0.75", "67.25",
      "The product is negative. Remember what happens when you subtract a negative.",
      "3.5 × (−12) = −42. Then 24.5 − (−42) = 66.5, and 66.50 + 0.75 = 67.25.",
    ],
    [
      "640/(8*(5+3))+2.5^2-1.75", "14.5",
      "Simplify the nested denominator and square 2.5 before the final addition and subtraction.",
      "5 + 3 = 8, so the denominator is 64. Then 640 ÷ 64 = 10 and 2.5² = 6.25. Finish with 10 + 6.25 − 1.75 = 14.50.",
    ],
    [
      "-2.5^2+320/(6+10)-4.8/1.2", "9.75",
      "Apply the first minus after squaring 2.5. Simplify both quotients before combining the terms.",
      "−2.5² = −6.25, 320 ÷ 16 = 20, and 4.8 ÷ 1.2 = 4. Then −6.25 + 20 − 4 = 9.75.",
    ],
    [
      "1200-((18.5+5.5)*32-90)/3", "974",
      "Simplify the innermost sum, then work out the entire numerator before dividing by 3.",
      "18.5 + 5.5 = 24. Then 24 × 32 = 768, and 768 − 90 = 678. Finish with 678 ÷ 3 = 226, and 1200 − 226 = 974.",
    ],
  ].map(([expr, answer, hint, solution]) => ({
    expr,
    answer,
    hint,
    solution,
    prompt: "Find the answer.",
    type: "number",
  })),
};
