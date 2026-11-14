import { math, pretty, escapeHTML as esc } from "./math.js";
import {
  numberLineScale,
  fractionModel,
  lineModel,
  tickLabel,
} from "./visual-models.js";

export function numberLineView(lab, { field, button, icon, toolTitle }) {
  const { a, b, op } = lab,
    { result, start, end, total, step, delta } = lineModel(lab);
  const { x, ticks, tick } = numberLineScale(a, result, start);
  const sx = x(start),
    ex = x(end),
    direction = delta < 0 ? "left" : "right";
  const invalid = result === null;
  const title = invalid
    ? b === 0 && op === "/"
      ? "Division by zero is undefined."
      : "This result exceeds the numeric range."
    : ["+", "-"].includes(op)
      ? `Start at ${pretty(a)}. Move ${pretty(Math.abs(b))} ${direction}.`
      : op === "*"
        ? `${pretty(Math.abs(b))} jumps of ${pretty(a * Math.sign(b))}.`
        : "Division asks how many fit.";
  const explanation = invalid
    ? "Change an input to continue exploring."
    : op === "-"
      ? `Subtracting ${b < 0 ? "a negative adds its opposite, so move right." : "a positive moves left."}`
      : op === "+"
        ? `Adding ${b < 0 ? "a negative moves left." : "a positive moves right."}`
        : op === "*"
          ? `Start at zero. ${b < 0 ? "A negative multiplier reverses each jump. " : ""}Equal signs give a positive product; different signs give a negative product.`
          : "The arrow shows the quotient. Equal signs give a positive quotient; different signs give a negative quotient.";
  return `${toolTitle("Meet the number line", "Small numbers or big ones: the line resizes around what you enter.")}
  <div class="tool-inputs line-inputs">${field("Start with", "a", a, null, null, "any")}
   <label class="number-field operation-field"><span>Operation</span><select data-lab="op" aria-label="Operation">${[
     ["+", "+ Add"],
     ["-", "− Subtract"],
     ["*", "× Multiply"],
     ["/", "÷ Divide"],
   ]
     .map(
       ([v, l]) =>
         `<option value="${v}" ${op === v ? "selected" : ""}>${l}</option>`,
     )
     .join("")}</select></label>
   ${field("Then use", "b", b, null, null, "any")}<span class="operation-equals">=</span><output class="result-pill" aria-live="polite">${invalid ? "undefined" : pretty(result)}</output>
  </div>
  <div class="number-line-stage"><div class="line-legend"><span><i class="start-dot"></i> Start: ${pretty(start)}</span><span><i class="end-dot"></i> ${step === total ? "Result" : "Current"}: ${pretty(end)}</span></div>
   <svg class="interactive-line" viewBox="0 0 800 215" role="img" aria-label="${esc(`${a} ${op} ${b} equals ${invalid ? "undefined" : result}. Start at ${start}, move ${direction} to ${end}.`)}">
    <defs><marker id="line-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0 6 3 0 6" fill="none" stroke="var(--accent)" stroke-width="1.6"/></marker></defs>
    <path d="M400 35v130" stroke="var(--border)" stroke-dasharray="4 4"/>
    <path d="M30 137H770m-735-4-5 4 5 4m730-8 5 4-5 4" stroke="var(--muted)" stroke-width="2" fill="none"/>
    ${ticks.map((n) => `<path d="M${x(n)} 132v10" stroke="var(--muted)"/><text x="${x(n)}" y="169" text-anchor="middle" font-size="${tickLabel(n).length > 5 ? 20 : 24}" fill="var(--ink)" font-family="sans-serif">${tickLabel(n)}</text>`).join("")}
    ${!invalid && end !== start ? `<path d="M${sx} 124Q${(sx + ex) / 2} ${Math.max(5, 85 - Math.abs(ex - sx) * 0.15)} ${ex} 124" fill="none" stroke="var(--accent)" stroke-width="3" marker-end="url(#line-arrow)"/>` : ""}
    <circle cx="${sx}" cy="137" r="8" fill="var(--accent-soft)" stroke="var(--surface)" stroke-width="3"/>
    <circle cx="${ex}" cy="137" r="8" fill="var(--accent)" stroke="var(--surface)" stroke-width="3"/>
   </svg>
   <div class="line-position" aria-live="polite">${step === total ? "Land on" : "You’re at"} <strong>${pretty(end)}</strong></div>
   <div class="line-step-controls">${button(icon("back") + "Start again", "line-reset", "btn btn-small btn-outline")}${button("Take a step " + icon("arrow"), "line-step", "btn btn-small btn-primary", step >= total || invalid ? "disabled" : "")}${button("Show result", "line-finish", "btn btn-small btn-outline", invalid ? "disabled" : "")}<span>${pretty(step)} / ${pretty(total)} ${op === "*" ? "jumps" : "steps"}</span></div>
   <p class="scale-note">Each tick represents ${pretty(tick)}. The start and result markers keep their exact position between ticks.</p>
  </div>
  <div class="visual-explanation">${icon("info")}<div><strong>${title}</strong><p>${explanation}</p></div></div>
  <div class="try-presets"><span>Try a starting point</span>${button("−3 + 5", "preset:-3,5,+", "preset")}${button("4 − (−3)", "preset:4,-3,-", "preset")}${button("−12,500 + 30,000", "preset:-12500,30000,+", "preset")}</div>`;
}

export function fractionView(lab, { field, button, icon, toolTitle }) {
  const { num, den } = lab,
    { wholeCount, remainder, rows, columns, grouped } = fractionModel(num, den);
  const sliderMax = Math.max(
    den,
    num,
    Math.min(Number.MAX_SAFE_INTEGER, den * 2),
  );
  return `${toolTitle("A whole new way to see fractions", "Try 33/75, a mixed number, or a fraction with thousands of pieces.")}
  <div class="tool-inputs fraction-inputs">${field("Pieces to shade", "num", num, 0, Number.MAX_SAFE_INTEGER)}<span class="fraction-slash">/</span>${field("Pieces per whole", "den", den, 1, Number.MAX_SAFE_INTEGER)}<div class="fraction-values">${math(`${num}/${den}`)}<span>= ${pretty(num / den)} = ${pretty((num / den) * 100)}%</span></div></div>
  <div class="fraction-stage ${den > 15 ? "many-pieces" : ""}">${rows
    .map(
      (row) =>
        `<div class="fraction-row"><span>${esc(row.label)}${row.multiplier ? ` · one representative whole × ${row.multiplier.toLocaleString()}` : ""}</span>${
          grouped
            ? `<div class="grouped-fraction" role="img" aria-label="${row.shaded} of ${den} equal pieces shaded"><div class="grouped-fraction-fill" style="width:${(row.shaded / den) * 100}%"></div><span>${row.shaded.toLocaleString()} / ${den.toLocaleString()} pieces</span></div>`
            : `<div class="fraction-bar ${den > 15 ? "fraction-grid" : ""}" style="grid-template-columns:repeat(${columns},minmax(0,1fr))">${Array.from({ length: den }, (_, col) => `<button class="fraction-piece ${col < row.shaded ? "filled" : ""}" data-action="fraction-piece:${row.index * den + col + 1}" aria-label="Shade ${row.index * den + col + 1} pieces" aria-pressed="${col < row.shaded}"></button>`).join("")}</div>`
        }</div>`,
    )
    .join("")}</div>
  ${grouped ? '<p class="scale-note">For more than 200 pieces, the bar groups the pieces into a continuous fill. The numbers and shaded proportion remain exact.</p>' : ""}
  <input class="wide-slider" type="range" min="0" max="${sliderMax}" value="${num}" step="1" data-lab="num" aria-label="Number of shaded fraction pieces">
  <div class="visual-explanation">${icon("info")}<div><strong>${num < den ? "A part of a whole." : num === den ? "One complete whole." : "Fractions can be greater than one."}</strong><p>${num.toLocaleString()} pieces shaded; ${den.toLocaleString()} equal pieces make one whole. ${wholeCount ? `That’s ${wholeCount.toLocaleString()} whole${wholeCount === 1 ? "" : "s"}${remainder ? ` and ${remainder}/${den}` : ""}.` : ""} ${!grouped ? "Click a piece, move the slider, or enter a number." : "Use the inputs or slider to explore the exact fraction."}</p></div></div>
  <div class="try-presets"><span>Explore a fraction</span>${button("1/2", "fraction:1,2", "preset")}${button("33/75", "fraction:33,75", "preset")}${button("7/4 (a mixed number)", "fraction:7,4", "preset")}${button("350/1,000", "fraction:350,1000", "preset")}</div>`;
}
