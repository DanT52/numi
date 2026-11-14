import { math, pretty, escapeHTML as esc } from "./math.js";
import {
  numberLineScale,
  fractionModel,
  lineModel,
  tickLabel,
} from "./visual-models.js";

export function numberLineView(lab, { field, button, icon, toolTitle }) {
  const model = lineModel(lab),
    {
      result,
      start,
      end,
      step,
      total,
      complete,
      segments,
      error,
      activeIndex,
    } = model;
  const { x, ticks, tick } = model.axis;
  const operations = [{ op: lab.op, value: lab.b }, ...(lab.operations || [])];
  const operators = [
    ["+", "+ Add"],
    ["-", "− Subtract"],
    ["*", "× Multiply"],
    ["/", "÷ Divide"],
  ];
  const operationRow = (operation, index) => {
    const segment = segments[index],
      done = segment?.complete;
    return (
      '<div class="line-operation ' +
      (done
        ? "operation-done"
        : !complete && index === activeIndex
          ? "operation-active"
          : "") +
      '">' +
      '<span class="operation-index" aria-label="Operation ' +
      (index + 1) +
      '">' +
      (done ? "✓" : index + 1) +
      "</span>" +
      '<label class="number-field"><span>Operation</span><select ' +
      (index === 0
        ? 'data-lab="op"'
        : 'data-line-index="' + index + '" data-line-field="op"') +
      ' aria-label="Operation ' +
      (index + 1) +
      '">' +
      operators
        .map(
          ([v, label]) =>
            '<option value="' +
            v +
            '" ' +
            (operation.op === v ? "selected" : "") +
            ">" +
            label +
            "</option>",
        )
        .join("") +
      "</select></label>" +
      (index === 0
        ? field("Number", "b", operation.value, null, null, "any")
        : '<label class="number-field"><span>Number</span><input type="number" step="any" data-line-index="' +
          index +
          '" data-line-field="value" aria-label="Number for operation ' +
          (index + 1) +
          '" value="' +
          operation.value +
          '"></label>') +
      (done
        ? '<output class="operation-answer">= ' +
          pretty(segment.to) +
          "</output>"
        : "") +
      (operations.length > 1
        ? button(
            icon("close"),
            "line-remove:" + index,
            "icon-button",
            'aria-label="Remove operation ' + (index + 1) + '"',
          )
        : "") +
      "</div>"
    );
  };
  const arcs = segments
    .filter((s) => s.walked > 0)
    .map((s, index) => {
      const sx = x(s.from),
        ex = x(s.current);
      if (sx === ex) return "";
      return (
        '<path class="operation-arc" data-operation="' +
        index +
        '" d="M' +
        sx +
        " 124Q" +
        (sx + ex) / 2 +
        " " +
        (20 + (index % 3) * 20) +
        " " +
        ex +
        ' 124" fill="none" stroke="var(--accent)" stroke-width="3" opacity="' +
        (index === activeIndex || complete ? 0.9 : 0.4) +
        '" marker-end="url(#line-arrow)"/>'
      );
    })
    .join("");
  return (
    toolTitle("Number line", "Operations run in the order listed below.") +
    '<div class="line-start">' +
    field("Starting number", "a", lab.a, null, null, "any") +
    '<div class="line-final"><span>Final result</span><output class="result-pill" aria-live="polite">' +
    (error ? "undefined" : complete ? pretty(result) : "?") +
    "</output></div></div>" +
    '<div class="line-operations">' +
    operations.map(operationRow).join("") +
    "</div>" +
    '<div class="line-add-row">' +
    button("+ Add operation", "line-add", "btn btn-small btn-outline") +
    "</div>" +
    (error
      ? '<div class="feedback retry" role="status">' + esc(error) + "</div>"
      : "") +
    '<div class="number-line-stage"><div class="line-legend"><span><i class="start-dot"></i> Start: ' +
    pretty(start) +
    '</span><span><i class="end-dot"></i> ' +
    (complete ? "Result" : "Current position") +
    ": " +
    pretty(end) +
    "</span></div>" +
    '<svg class="interactive-line" viewBox="0 0 800 215" role="img" aria-label="' +
    esc(
      "Current position " +
        pretty(end) +
        ". " +
        step +
        " of " +
        total +
        " steps. " +
        (complete
          ? "Final result " + pretty(result) + "."
          : "Final result hidden."),
    ) +
    '">' +
    '<defs><marker id="line-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0 6 3 0 6" fill="none" stroke="var(--accent)" stroke-width="1.6"/></marker></defs>' +
    '<path d="M400 35v130" stroke="var(--border)" stroke-dasharray="4 4"/><path d="M30 137H770m-735-4-5 4 5 4m730-8 5 4-5 4" stroke="var(--muted)" stroke-width="2" fill="none"/>' +
    ticks
      .map(
        (n) =>
          '<path d="M' +
          x(n) +
          ' 132v10" stroke="var(--muted)"/><text x="' +
          x(n) +
          '" y="175" text-anchor="middle" font-size="' +
          (tickLabel(n).length > 5 ? 20 : 24) +
          '" fill="var(--ink)" font-family="sans-serif">' +
          tickLabel(n) +
          "</text>",
      )
      .join("") +
    arcs +
    '<circle cx="' +
    x(start) +
    '" cy="137" r="8" fill="var(--accent-soft)" stroke="var(--surface)" stroke-width="3"/><circle cx="' +
    x(end) +
    '" cy="137" r="8" fill="var(--accent)" stroke="var(--surface)" stroke-width="3"/></svg>' +
    '<div class="line-position" aria-live="polite">' +
    (complete ? "Result" : "Current position") +
    " <strong>" +
    pretty(end) +
    "</strong></div>" +
    '<div class="line-step-controls">' +
    button(
      icon("back") + "Start again",
      "line-reset",
      "btn btn-small btn-outline",
    ) +
    button(
      "Take a step " + icon("arrow"),
      "line-step",
      "btn btn-small btn-primary",
      complete || error ? "disabled" : "",
    ) +
    button(
      "Show result",
      "line-finish",
      "btn btn-small btn-outline",
      complete || error ? "disabled" : "",
    ) +
    "<span>" +
    step +
    " / " +
    total +
    " steps</span></div>" +
    '<p class="scale-note">One step = one tick (' +
    pretty(tick) +
    "). A final shorter step lands exactly on the next value.</p></div>" +
    '<div class="try-presets"><span>Examples</span>' +
    button("−3 + 5", "preset:-3,5,+", "preset") +
    button("4 − (−3)", "preset:4,-3,-", "preset") +
    button("−12,500 + 30,000", "preset:-12500,30000,+", "preset") +
    "</div>"
  );
}

export function fractionView(lab, { field, button, icon, toolTitle }) {
  const { num, den } = lab,
    { wholeCount, remainder, rows, columns, grouped } = fractionModel(num, den);
  const sliderMax = Math.max(
    den,
    num,
    Math.min(Number.MAX_SAFE_INTEGER, den * 2),
  );
  return `${toolTitle("Fraction bars", "Try 33/75, a mixed number, or a fraction with thousands of pieces.")}
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
