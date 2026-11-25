// Each quiz draws one question from each group. Groups cover all three lessons.
export const orderQuizGroups = {
  "Multiplication and division before addition": [
    "7+5*4-3", "26-12/3+5", "9+6*3-4", "18-5*2+7",
  ],
  "Parentheses before powers and products": [
    "(9-4)^2-6", "2*(5+3)^2", "64/(6+2)^2+3", "(4+3)^2-2*6",
  ],
  "Equal priorities from left to right": [
    "32/4*3-8+2", "4*21/7-5+3", "45/5*2-11+4", "6*15/5-7+1",
  ],
  "Negative signs and the base of a power": [
    "-6^2+(-5)^2", "(-5)^2-4^2+3", "-4^2+(-2)^2-3", "(-4)^2+(-2)^3-5",
  ],
  "Signed products, quotients and subtraction": [
    "7-(-4)*2+18/(-3)", "28/(-7)-(-3)*4", "9-24/(-6)+(-3)*2", "(-36)/6-(-2)*5+4",
  ],
  "Nested groups with negatives": [
    "(3-(-2))^2-2*(-4)", "-2*(5-(-3))+(-2)^3", "36/(-3*(2+2))-(-6)", "(2-(-4))^2+(-3)^3",
  ],
  "Larger whole numbers": [
    "850-12*(43-18)+50", "960/(5*(18-10))+125", "420-16^2+96/8", "1080/18*5-175+25",
  ],
  "Decimal products and place value": [
    "38.75-4*6.5+0.5", "17.25+3*4.5-2.5", "80.4-6*7.5+2.25", "56.25-3.5*8+4.5",
  ],
  "Division by a decimal": [
    "37.8/0.9+2.5*4", "18.75/2.5-3.25", "45.6/1.2+(-2.5)*2", "52.5/1.5-2*4.25",
  ],
  "Longer expressions with whole numbers and decimals": [
    "360/(6*(3+7))+(2.5-0.5)^2", "800-(12.5-2.5)^2+4.75", "-1.5^2+240/(5+7)-6.3/0.9", "(84.5-9.5)/2.5+(-1.5)^2-7.75",
  ],
};
