// A small arithmetic parser. No eval, Function constructor, or executable input.
export function parse(input) {
  let source = String(input)
    .trim()
    .replaceAll("−", "-")
    .replaceAll("×", "*")
    .replaceAll("÷", "/")
    .replaceAll("²", "^2")
    .replaceAll("³", "^3");
  const tokens =
    source.match(/\d+\s+\d+\s*\/\s*\d+|\d*\.\d+|\d+\.?\d*|[()+\-*/^%]/g) || [];
  if (
    !source ||
    source.replace(/\s+/g, "") !== tokens.join("").replace(/\s+/g, "") ||
    tokens.length > 150
  )
    throw Error("Use numbers, fractions, parentheses, and arithmetic symbols.");
  let at = 0;
  function expression(min = 0) {
    let token = tokens[at++],
      node;
    if (token === "+" || token === "-")
      node = { op: "unary" + token, right: expression(25) };
    else if (token === "(") {
      node = { op: "group", right: expression() };
      if (tokens[at++] !== ")") throw Error("Check your parentheses.");
    } else if (token !== undefined && /^(\d|\.)/.test(token)) {
      const mixed = token.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
      if (mixed) {
        if (Number(mixed[3]) === 0)
          throw Error("Division by zero is undefined.");
        node = {
          op: "mixed",
          whole: mixed[1],
          numerator: mixed[2],
          denominator: mixed[3],
        };
      } else node = { op: "number", value: Number(token), raw: token };
    } else throw Error("Enter a complete expression.");
    while (at < tokens.length) {
      const op = tokens[at],
        precedence = { "+": 10, "-": 10, "*": 20, "/": 20, "^": 30, "%": 40 }[
          op
        ];
      if (precedence === undefined || precedence < min) break;
      at++;
      if (op === "%") node = { op: "%", left: node };
      else
        node = {
          op,
          left: node,
          right: expression(op === "^" ? precedence : precedence + 1),
        };
    }
    return node;
  }
  const tree = expression();
  if (at !== tokens.length)
    throw Error("Check the expression between your numbers.");
  return tree;
}
export function calculate(input) {
  const visit = (n) => {
    if (n.op === "number") return n.value;
    if (n.op === "mixed")
      return Number(n.whole) + Number(n.numerator) / Number(n.denominator);
    if (n.op === "group" || n.op === "unary+") return visit(n.right);
    if (n.op === "unary-") return -visit(n.right);
    if (n.op === "%") return visit(n.left) / 100;
    const a = visit(n.left),
      b = visit(n.right);
    if (n.op === "/" && b === 0) throw Error("Division by zero is undefined.");
    return {
      "+": () => a + b,
      "-": () => a - b,
      "*": () => a * b,
      "/": () => a / b,
      "^": () => a ** b,
    }[n.op]();
  };
  const result = visit(parse(input));
  if (!Number.isFinite(result))
    throw Error("That result is outside the calculator’s range.");
  return result;
}
export const pretty = (n) =>
  Object.is(n, -0)
    ? "0"
    : Number(n.toPrecision(10)).toString().replace("-", "−");
export function escapeHTML(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
export function math(input) {
  const render = (n) => {
    if (n.op === "number") return `<mn>${escapeHTML(n.raw)}</mn>`;
    if (n.op === "mixed")
      return `<mrow><mn>${n.whole}</mn><mspace width="0.15em"/><mfrac><mn>${n.numerator}</mn><mn>${n.denominator}</mn></mfrac></mrow>`;
    if (n.op === "group")
      return `<mrow><mo>(</mo>${render(n.right)}<mo>)</mo></mrow>`;
    if (n.op.startsWith("unary"))
      return `<mrow><mo>${n.op === "unary-" ? "−" : "+"}</mo>${render(n.right)}</mrow>`;
    if (n.op === "/")
      return `<mfrac>${render(n.left)}${render(n.right)}</mfrac>`;
    if (n.op === "^") return `<msup>${render(n.left)}${render(n.right)}</msup>`;
    if (n.op === "%") return `<mrow>${render(n.left)}<mo>%</mo></mrow>`;
    return `<mrow>${render(n.left)}<mo>${{ "+": "+", "-": "−", "*": "×" }[n.op]}</mo>${render(n.right)}</mrow>`;
  };
  try {
    return `<math xmlns="http://www.w3.org/1998/Math/MathML" aria-label="${escapeHTML(input)}">${render(parse(input))}</math>`;
  } catch {
    return `<span class="math-text">${escapeHTML(input)}</span>`;
  }
}
export function isPrime(n) {
  if (!Number.isInteger(n) || n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
}
export function isPrimeProduct(input) {
  try {
    const valid = (n) =>
      n.op === "number"
        ? isPrime(n.value)
        : n.op === "group"
          ? valid(n.right)
          : n.op === "*"
            ? valid(n.left) && valid(n.right)
            : n.op === "^" &&
              n.left.op === "number" &&
              isPrime(n.left.value) &&
              n.right.op === "number" &&
              Number.isInteger(n.right.value) &&
              n.right.value > 0;
    return valid(parse(input));
  } catch {
    return false;
  }
}
export function checkAnswer(input, problem) {
  try {
    if (!String(input).trim())
      return {
        correct: false,
        message: "Enter an answer first. Take your time.",
      };
    if (problem.type === "prime" && !isPrimeProduct(input))
      return {
        correct: false,
        message:
          "Write a product of prime numbers, such as 2^3 * 3. Each factor should be prime.",
      };
    if (problem.type === "fraction" && !/\//.test(input))
      return {
        correct: false,
        message:
          "Write your answer as a fraction, like 3/4. Mixed numbers such as 1 1/2 work too.",
      };
    if (problem.type === "decimal" && /[/%]/.test(input))
      return {
        correct: false,
        message: "Write this answer as a decimal, like 0.75.",
      };
    const value = calculate(input),
      expected = calculate(problem.answer);
    // A percent question accepts either 75 or 75%, both meaning 75 percent.
    const normalized =
      problem.type === "percent" && String(input).trim().endsWith("%")
        ? value * 100
        : value;
    return Math.abs(normalized - expected) < 1e-8
      ? { correct: true, message: "That’s it! You’ve got this." }
      : {
          correct: false,
          message:
            "Not quite yet. Try the hint, or explore it in the visual lab.",
        };
  } catch (e) {
    return { correct: false, message: e.message };
  }
}
