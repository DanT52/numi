import {
  math,
  calculate,
  pretty,
  escapeHTML as esc,
  checkAnswer,
} from "./math.js";
import { topics, lessons, upcoming } from "./lessons.js";
import { lineModel } from "./visual-models.js";
import { numberLineView, fractionView } from "./tool-views.js";
import {
  loadAppearance,
  saveAppearance,
  applyAppearance,
  defaults,
} from "./appearance.js";

let appearance = loadAppearance();
applyAppearance(appearance);

const icons = {
  settings:
    '<path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1M5.6 18.4l2.1-2.1m8.6-8.6 2.1-2.1"/><circle cx="12" cy="12" r="5"/>',
  book: '<path d="M3 5c4-2 6-2 9 0 3-2 5-2 9 0v15c-4-2-6-2-9 0-3-2-5-2-9 0z"/><path d="M12 5v15"/>',
  lab: '<path d="M9 3h6m-5 0v7L4 20c-.5 1 0 1 1 1h14c1 0 1.5 0 1-1l-6-10V3M7 15h10"/>',
  chart: '<path d="M4 3v18h17M9 16v-5m5 5V7m5 9V3"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  spark:
    '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/>',
  calculator:
    '<rect x="5" y="2" width="14" height="20" rx="3"/><path d="M8 6h8M8 11h1m6 0h1m-8 4h1m6 0h1m-8 4h1m6 0h1"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  back: '<path d="M19 12H5m5-5-5 5 5 5"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/>',
  leaf: '<path d="M5 19C1 9 9 3 21 3c0 12-6 20-16 16ZM5 19 15 9"/>',
  pie: '<path d="M10 3a9 9 0 1 0 11 11H10z"/><path d="M14 2v8h8a9 9 0 0 0-8-8Z"/>',
  signed: '<path d="M3 8h8M7 4v8m7 5h7"/>',
  order: '<path d="M7 4C2 7 2 17 7 20M17 4c5 3 5 13 0 16M9 9h6m-6 6h6"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  line: '<path d="M2 15h20M5 12v6m7-6v6m7-6v6M5 9c0-8 14-8 14 0m-3-2 3 3 3-3"/>',
  counters:
    '<circle cx="7" cy="7" r="4"/><circle cx="17" cy="17" r="4"/><path d="M5 7h4M7 5v4m8 12h4"/>',
  percent:
    '<path d="m6 20 12-16"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="18" r="3"/>',
};
const icon = (name, cls = "") =>
  `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.spark}</svg>`;
const button = (label, action, cls = "btn", extra = "") =>
  `<button class="${cls}" data-action="${action}" ${extra}>${label}</button>`;
const STORE = "numi.progress.v1";
function readState() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE));
    return s && s.version === 1 && s.progress && typeof s.progress === "object"
      ? s
      : null;
  } catch {
    return null;
  }
}
let state = readState() || {
  version: 1,
  view: "lessons",
  topic: "all",
  lesson: null,
  progress: {},
};
if (!["lessons", "lab", "progress", "settings"].includes(state.view))
  state.view = "lessons";
if (!lessons.some((l) => l.id === state.lesson)) state.lesson = null;
let storageFailed = false;
function save() {
  try {
    localStorage.setItem(STORE, JSON.stringify(state));
  } catch {
    storageFailed = true;
    document
      .querySelector(".saved-label")
      ?.replaceChildren("Progress stays in this tab");
  }
}
let tool = "line",
  overlay = false,
  feedback = null;
let lab = {
  a: -3,
  b: 5,
  op: "+",
  step: null,
  pos: 5,
  neg: 3,
  num: 3,
  den: 4,
  percent: 35,
  factorA: 24,
  factorB: 36,
  calc: "",
  result: "",
  calcError: false,
};
state.game =
  state.game && typeof state.game === "object"
    ? state.game
    : { streak: 0, best: 0 };
const companionImage = (mood, cls = "", alt = "") =>
  `<img class="companion-image ${cls}" src="assets/${mood}.svg" width="160" height="160" alt="${esc(alt)}">`;
function companionCard() {
  const l = lessons.find((l) => l.id === state.lesson),
    p = l && getProgress(l.id);
  const mood = feedback
    ? feedback.correct
      ? "happy"
      : "sad"
    : p?.solved.length === 8
      ? "happy"
      : "neutral";
  const message = feedback
    ? feedback.correct
      ? "A little win. A stronger you!"
      : "A tricky one? We’ll work through it together."
    : p?.stage === "practice"
      ? "Take your time. I’m rooting for you."
      : "Let’s try one together.";
  return `<div class="lesson-companion" aria-live="polite">${companionImage(mood, "", `Your study companion looks ${mood === "sad" ? "thoughtful" : mood}`)}<div><strong>${message}</strong><span>${solvedCount() * 10} leaf points${state.game.streak > 1 ? ` · ${state.game.streak} new answers in a row` : " · Every new answer grows your garden"}</span></div></div>`;
}
const getProgress = (id) => {
  const p = state.progress[id];
  return p &&
    Array.isArray(p.solved) &&
    p.answers &&
    typeof p.answers === "object"
    ? p
    : (state.progress[id] = {
        index: 0,
        stage: "example",
        solved: [],
        answers: {},
        hints: [],
        reveals: [],
      });
};
const solvedCount = () =>
  lessons.reduce((sum, l) => sum + getProgress(l.id).solved.length, 0);
const completedCount = () =>
  lessons.filter((l) => getProgress(l.id).solved.length === l.problems.length)
    .length;
const tools = [
  ["line", "Number line", "line"],
  ["counters", "Signed counters", "counters"],
  ["fractions", "Fraction bars", "pie"],
  ["percent", "Percent grid", "percent"],
  ["factors", "Factor explorer", "grid"],
  ["calculator", "Calculator", "calculator"],
];

function header() {
  return `<header class="header"><div class="header-inner"><a class="brand" href="#" data-action="home"><span class="brand-mark">n<span>✦</span></span>numi<span class="brand-dot">.</span></a><nav class="main-nav" aria-label="Main navigation">${[
    ["lessons", "Lessons", "book"],
    ["lab", "Visual lab", "lab"],
    ["progress", "My progress", "chart"],
    ["settings", "Settings", "settings"],
  ]
    .map(([id, name, i]) =>
      button(
        icon(i) + "<span>" + name + "</span>",
        "view:" + id,
        "nav-item " + (state.view === id ? "active" : ""),
        state.view === id ? 'aria-current="page"' : "",
      ),
    )
    .join(
      "",
    )}</nav><div class="header-right"><span class="saved-label">${icon("check")} ${storageFailed ? "Progress stays in this tab" : "Saved on this device"}</span>${button(icon("calculator") + "<span>Quick tools</span>", "open-tools", "btn btn-small btn-outline")}<span class="header-companion">${companionImage("matcha", "", "Your study companion")}</span></div></div></header>`;
}
function heroArt() {
  return `<div class="hero-art"><div class="companion-welcome">${companionImage("matcha", "", "Your companion is ready with a cup of matcha")}<div class="companion-bubble">A little practice.<br>A little growth. <span>✦</span></div></div><div class="hero-equation" aria-label="Negative three plus five equals two">${math("-3+5")}<span>=</span><b>2</b></div><div class="garden-points">${icon("leaf")} ${solvedCount() * 10} leaf points earned <span>·</span> ${completedCount()} lessons complete</div></div>`;
}
function home() {
  const count = solvedCount();
  return `<section class="hero"><div class="hero-copy"><div class="eyebrow"><span class="tiny-star">✦</span> YOUR MATH JOURNEY STARTS HERE</div><h1>Big ideas.<br>Small, confident steps<span class="purple-text">.</span></h1><p>Math makes more sense when you can see it.<br>Explore, practice, and learn at your own pace.</p>${button((count ? "Keep learning" : "Let’s start learning") + icon("arrow"), "start-recommended", "btn btn-primary")}<span class="hero-note">No rush. No pressure. Just progress.</span></div>${heroArt()}</section><div class="dashboard-grid"><section class="lesson-catalog"><div class="section-heading"><div><span class="eyebrow muted">BUILD YOUR FOUNDATION</span><h2>A little practice goes a long way</h2></div><span class="count-badge">8 lessons</span></div><div class="filter-row" aria-label="Filter lessons">${[["all", "All topics"], ...topics.map((t) => [t.id, t.short])].map(([id, label]) => button(label, `filter:${id}`, `filter ${state.topic === id ? "selected" : ""}`, 'aria-pressed="' + (state.topic === id) + '"')).join("")}</div><div class="topic-grid">${topics
    .filter((t) => state.topic === "all" || state.topic === t.id)
    .map(topicCard)
    .join(
      "",
    )}</div></section><aside class="dashboard-aside"><div class="journey-card"><div class="aside-title">${icon("leaf")}<h3>Your learning path</h3></div><p>Every small step counts.</p><div class="progress-stat"><b>${count}<span> / 64</span></b><span>problems solved</span></div><div class="progress-track"><span style="width:${(count / 64) * 100}%"></span></div><div class="path-list">${topics
    .map((t, i) => {
      const done = lessons
        .filter((l) => l.topic === t.id)
        .reduce((a, l) => a + getProgress(l.id).solved.length, 0);
      return `<div class="path-item"><span class="path-node ${done === 16 ? "done" : i === 0 ? "current" : ""}">${done === 16 ? "✓" : String(i + 1).padStart(2, "0")}</span><div><strong>${t.short}</strong><small>${done === 16 ? "Complete" : done ? `${done} of 16 solved` : "One step at a time"}</small></div></div>`;
    })
    .join(
      "",
    )}</div><div class="gentle-note">${icon("spark")} Understanding beats memorizing.</div></div><div class="lab-teaser"><span class="teaser-icon">${icon("lab")}</span><h3>Sometimes, you need to see it.</h3><p>Turn abstract ideas into something you can move, count, and explore.</p>${button("Explore the visual lab " + icon("arrow"), "view:lab", "text-button")}</div></aside></div>${comingSoon()}<footer><span class="footer-brand">numi.</span><span>Built for curious minds. At every starting point.</span><span>${icon("check")} Your pace. Your progress.</span></footer>`;
}
function topicCard(t) {
  const ls = lessons.filter((l) => l.topic === t.id),
    done = ls.reduce((s, l) => s + getProgress(l.id).solved.length, 0);
  return `<article class="topic-card ${t.color}"><div class="topic-top"><span class="topic-icon">${icon(t.icon)}</span><span class="topic-tag">${t.tag}</span></div><h3>${t.title}</h3><p>${t.description}</p><div class="lesson-links">${ls
    .map((l, i) => {
      const p = getProgress(l.id);
      return button(
        `<span class="lesson-number ${p.solved.length === 8 ? "done" : ""}">${p.solved.length === 8 ? "✓" : String(i + 1).padStart(2, "0")}</span><span><strong>${l.title}</strong><small>${l.minutes} min <span>·</span> 8 problems${p.solved.length ? " · " + p.solved.length + "/8" : ""}</small></span>${icon("chevron")}`,
        `lesson:${l.id}`,
        "lesson-link",
      );
    })
    .join(
      "",
    )}</div><div class="card-bottom"><span>2 guided lessons</span><span>${done ? `${done}/16 solved` : "Beginner friendly"} ${done ? icon("check") : icon("leaf")}</span></div></article>`;
}
function comingSoon() {
  return `<section class="coming-soon"><div class="section-heading"><div><span class="eyebrow muted">GROW FROM HERE</span><h2>More to look forward to</h2><p>A strong foundation opens up a whole new world.</p></div><span class="badge">${icon("lock")} To be added</span></div><div class="future-grid">${upcoming.map((group, i) => `<article class="future-card"><div class="future-number">0${i + 2}</div><div><h3>${group.title}</h3><p>${i ? "From your first variable to the coordinate plane." : "Connect everyday questions to everyday math."}</p><details><summary>See ${group.items.length} upcoming topics ${icon("chevron")}</summary><ul>${group.items.map(([name, desc]) => `<li><strong>${name}</strong><span>${desc}</span></li>`).join("")}</ul></details></div></article>`).join("")}</div></section>`;
}

function practiceMath(problem) {
  const pair = problem.prompt.match(/^Find the (GCF|LCM) of (\d+) and (\d+)/);
  if (pair) {
    return `<span class="math-text">${pair[1]}</span><span class="math-text">(</span>${math(pair[2])}<span class="math-text">,</span>${math(pair[3])}<span class="math-text">)</span>`;
  }
  return math(problem.expr);
}
function lessonView() {
  const l = lessons.find((x) => x.id === state.lesson);
  if (!l) {
    state.lesson = null;
    return home();
  }
  const p = getProgress(l.id);
  p.index = Math.min(7, Math.max(0, p.index || 0));
  const t = topics.find((x) => x.id === l.topic),
    example = p.stage !== "practice",
    problem = l.problems[p.index];
  return `<div class="lesson-breadcrumb">${button(icon("back") + "All lessons", "all-lessons", "text-button")}<span>/</span><span>${t.title}</span></div><div class="lesson-layout"><aside class="lesson-sidebar"><span class="topic-icon ${t.color}">${icon(t.icon)}</span><span class="eyebrow muted">${t.short}</span><h2>${l.title}</h2><p>${l.subtitle}</p><div class="mini-progress"><span>${p.solved.length} of 8 solved</span><div class="progress-track"><span style="width:${(p.solved.length / 8) * 100}%"></span></div></div>${button(icon("book") + " Worked example", "example", "sidebar-example " + (example ? "selected" : ""))}<div class="question-dots" aria-label="Practice problems">${l.problems.map((_, i) => button(p.solved.includes(i) ? icon("check") : String(i + 1), `question:${i}`, `question-dot ${!example && p.index === i ? "selected" : ""} ${p.solved.includes(i) ? "solved" : ""}`, `aria-label="Problem ${i + 1}${p.solved.includes(i) ? ", solved" : ""}"`)).join("")}</div><div class="sidebar-tip">${icon("lab")}<strong>Need a different perspective?</strong><p>Your work stays right here when you open a visual aid.</p>${button("Open visual tools " + icon("arrow"), "open-tools", "text-button")}</div></aside><section class="lesson-workspace"><div class="workspace-top"><span class="eyebrow muted">${example ? "FIRST, LET’S WALK THROUGH IT" : `YOUR TURN · PROBLEM ${p.index + 1} OF 8`}</span><span class="badge">${icon("check")} ${p.solved.length === 8 ? "Lesson complete" : "At your own pace"}</span></div>${companionCard()}${example ? `<h1>Start with an example.</h1><p class="workspace-intro">A little guidance before you give it a go.</p><div class="rule-callout">${icon("info")}<p>${l.rule}</p></div><div class="example-equation">${math(l.example.expr)}<span>=</span>${math(l.example.answer)}</div><ol class="example-steps">${l.example.steps.map((s, i) => `<li><span>${i + 1}</span><p>${esc(s)}</p></li>`).join("")}</ol><div class="workspace-bottom"><span>Ready when you are.</span>${button("Try it yourself " + icon("arrow"), "begin-practice", "btn btn-primary")}</div>` : `<h1>${problem.type === "percent" ? "Think in hundredths." : problem.type === "prime" ? "Find the building blocks." : "Take it one step at a time."}</h1><p class="workspace-intro">${esc(problem.prompt)}</p><div class="practice-equation">${practiceMath(problem)}</div><form id="answer-form"><label for="answer">Your answer ${problem.type === "percent" ? "<span>(as a percentage)</span>" : ""}</label><div class="answer-row"><input id="answer" name="answer" type="text" autocomplete="off" spellcheck="false" placeholder="${problem.type === "prime" ? "e.g. 2^2 * 3" : problem.type === "fraction" ? "e.g. 3/4 or 1 1/2" : "Type your answer…"}" value="${esc(p.answers[p.index] || "")}" aria-describedby="answer-format feedback">${button("Check answer " + icon("check"), "check-answer", "btn btn-primary", 'type="submit"')}</div><small id="answer-format">${problem.type === "prime" ? "Use * to multiply and ^ for exponents." : problem.type === "percent" ? "Enter a number like 75, or write 75%." : problem.type === "decimal" ? "Enter a decimal, like 0.75." : "Fractions (3/4), mixed numbers (1 1/2), and decimals are welcome."}</small></form><div id="feedback" aria-live="polite">${feedback ? `<div class="feedback ${feedback.correct ? "success" : "retry"}">${icon(feedback.correct ? "check" : "info")}<span>${esc(feedback.message)}</span></div>` : p.solved.includes(p.index) ? `<div class="feedback success">${icon("check")} You’ve solved this one. Nice work!</div>` : ""}</div><div class="help-row">${button(icon("spark") + (p.hints.includes(p.index) ? "Hide hint" : "Give me a hint"), "hint", "text-button")}${button(icon("lab") + "Visualize it", "visualize-problem", "text-button")}${button(p.reveals.includes(p.index) ? "Hide explanation" : "See explanation", "reveal", "text-button")}</div>${p.hints.includes(p.index) ? `<div class="hint-box"><strong>A little nudge</strong><p>${esc(problem.hint)}</p></div>` : ""}${p.reveals.includes(p.index) ? `<div class="hint-box"><strong>Let’s work through it</strong><p>${esc(problem.solution)}</p><div class="solution-answer">Answer: ${math(problem.answer)}${problem.type === "percent" ? "%" : ""}</div><small>Read it through, then try entering the answer yourself.</small></div>` : ""}<div class="workspace-bottom">${button(icon("back") + "Previous", "previous-question", "btn btn-outline")}${p.index < 7 ? button("Next problem " + icon("arrow"), "next-question", "btn btn-primary") : button((p.solved.length === 8 ? "Lesson complete" : "Review my progress") + " " + icon("arrow"), "lesson-review", "btn btn-primary")}</div>`}</section></div>`;
}
function progressView() {
  const solved = solvedCount(),
    complete = completedCount();
  return `<div class="page-heading"><span class="eyebrow muted">LOOK HOW FAR YOU’VE COME</span><h1>Progress, one step at a time<span class="purple-text">.</span></h1><p>There’s no deadline for understanding. Keep building at your own pace.</p></div><div class="stats-grid"><div><span class="stat-icon">${icon("check")}</span><b>${solved}<small> / 64</small></b><span>Problems solved</span></div><div><span class="stat-icon">${icon("book")}</span><b>${complete}<small> / 8</small></b><span>Lessons completed</span></div><div><span class="stat-icon">${icon("leaf")}</span><b>${Math.round((solved / 64) * 100)}<small>%</small></b><span>Foundation explored</span></div></div><div class="progress-lessons">${lessons
    .map((l) => {
      const p = getProgress(l.id),
        t = topics.find((t) => t.id === l.topic);
      return `<article><span class="topic-icon ${t.color}">${icon(t.icon)}</span><div><small>${t.short}</small><h3>${l.title}</h3><div class="progress-track"><span style="width:${(p.solved.length / 8) * 100}%"></span></div></div><span>${p.solved.length}/8 solved</span>${button((p.solved.length === 8 ? "Revisit" : p.stage === "practice" ? "Continue" : "Start") + " " + icon("arrow"), `lesson:${l.id}`, "btn btn-outline")}</article>`;
    })
    .join(
      "",
    )}</div>${achievementsView()}<div class="save-note">${icon("info")} Progress is saved in this browser on this device. Clearing browser data removes it.</div>${button("Export progress", "export-progress", "btn btn-outline export-btn")}<label class="btn btn-outline import-btn">Import progress<input id="import-progress" type="file" accept="application/json,.json" hidden></label>`;
}

function achievementsView() {
  const count = solvedCount(),
    complete = completedCount();
  const badges = [
    ["First little leaf", count >= 1, "One new problem solved"],
    ["A growing habit", count >= 8, "Eight problems solved"],
    ["Lesson gardener", complete >= 1, "Your first complete lesson"],
    ["Finding your stride", count >= 32, "Half the foundation complete"],
    ["A flourishing foundation", count === 64, "All 64 problems solved"],
  ];
  return `<section class="achievements"><div class="section-heading"><div><span class="eyebrow muted">YOUR EFFORT IS ADDING UP</span><h2>A little garden of wins</h2></div><span class="points-badge">${icon("leaf")} ${count * 10} leaf points</span></div><p>Earn 10 leaf points for each new problem solved. Revisit any problem freely; points are awarded once.</p><div class="achievement-grid">${badges.map(([name, earned, description]) => `<div class="achievement ${earned ? "earned" : ""}">${icon(earned ? "leaf" : "lock")}<strong>${name}</strong><span>${description}</span><small>${earned ? "Earned" : "Still growing"}</small></div>`).join("")}</div></section>`;
}
function settingsView() {
  const themes = [
    ["matcha", "Matcha garden", "Calm greens & warm cream"],
    ["lavender", "Lavender", "Soft purple & lilac"],
    ["ocean", "Ocean", "Clear blue & sea foam"],
    ["warm", "Warm clay", "Terracotta & soft sand"],
  ];
  return `<div class="page-heading"><span class="eyebrow muted">MAKE YOURSELF AT HOME</span><h1>Your space. Your pace<span class="purple-text">.</span></h1><p>A comfortable place to think starts with what works for you.</p></div><div class="settings-layout"><section class="settings-card"><h2>Appearance</h2><p>Changes apply straight away and are saved in this browser.</p><fieldset class="theme-options"><legend>Color theme</legend>${themes.map(([id, title, description]) => `<label class="theme-option ${appearance.theme === id ? "selected" : ""}"><input type="radio" name="color-theme" value="${id}" data-setting="theme" ${appearance.theme === id ? "checked" : ""}><span class="theme-swatch ${id}" aria-hidden="true"></span><span><strong>${title}</strong><small>${description}</small></span></label>`).join("")}</fieldset><div class="settings-fields"><label><span>Text size</span><select data-setting="size" aria-label="Text size">${[
    ["standard", "Standard"],
    ["comfortable", "Comfortable (default)"],
    ["large", "Extra large"],
  ]
    .map(
      ([v, label]) =>
        `<option value="${v}" ${appearance.size === v ? "selected" : ""}>${label}</option>`,
    )
    .join(
      "",
    )}</select><small>Changes labels, lesson text, and equations together.</small></label><label><span>Text boldness</span><select data-setting="weight" aria-label="Text boldness">${[
    ["regular", "Regular"],
    ["bold", "Bolder & easier to see"],
  ]
    .map(
      ([v, label]) =>
        `<option value="${v}" ${appearance.weight === v ? "selected" : ""}>${label}</option>`,
    )
    .join(
      "",
    )}</select><small>A little more definition when you need it.</small></label></div><label class="motion-setting"><input type="checkbox" data-setting="motion" ${appearance.motion ? "checked" : ""}><span><strong>Gentle celebrations</strong><small>Small companion animations after a new answer. Your system’s reduced-motion preference is always respected.</small></span></label>${button("Restore appearance defaults", "reset-appearance", "btn btn-outline")}<div class="settings-save-note">${icon("check")} Your answers, position, progress, and appearance are saved locally on this device.</div></section><aside class="settings-preview"><div class="preview-card"><span class="eyebrow muted">A LITTLE PREVIEW</span>${companionImage("happy", "", "Your happy study companion")}<h2>Looking good. Feeling ready.</h2><p>This is how your lesson text will look. Take a breath, find your focus, and give the next step a try.</p><div class="preview-equation">${math("1/2+1/4")}<span>=</span>${math("3/4")}</div><span class="btn btn-primary">One small step ${icon("leaf")}</span></div><div class="break-card">${companionImage("sleeping", "", "Your companion is taking a rest")}<div><h3>Breaks count, too.</h3><p>Come back when you’re ready. Your garden will be here.</p>${button("Take a little breather", "take-break", "text-button")}</div></div></aside></div>`;
}
function labView() {
  return `<div class="page-heading lab-heading"><div><span class="eyebrow muted">LESS ABSTRACT. MORE “OH, I GET IT.”</span><h1>Make math make sense<span class="purple-text">.</span></h1><p>Move a number. Count a counter. See a new way to understand.</p></div><span class="lab-heading-badge">${icon("spark")} A space to experiment</span></div>${state.lesson ? `<div class="return-banner">${icon("book")}<span>Your lesson is right where you left it.</span>${button("Return to lesson " + icon("arrow"), "return-lesson", "text-button")}</div>` : ""}<div id="lab-tools">${toolsUI()}</div><div class="lab-bottom"><div>${icon("info")}<p><strong>Try it, change it, try again.</strong><br>There’s no wrong way to explore. These tools are here to help things click.</p></div><span>More aids on our drawing board: a balance scale for equations and a unit conversion ladder.</span></div>`;
}
function toolsUI() {
  return `<div class="tool-layout"><nav class="tool-nav" aria-label="Visual tools">${tools.map(([id, title, i]) => button(icon(i) + `<span>${title}</span>` + icon("chevron"), `tool:${id}`, `tool-tab ${tool === id ? "selected" : ""}`, 'aria-current="' + (tool === id ? "true" : "false") + '"')).join("")}<div class="tool-nav-note">${icon("leaf")} Understanding grows<br>with a little exploration.</div></nav><section class="tool-panel">${{ line: numberLine, counters: counterTool, fractions: fractionTool, percent: percentTool, factors: factorTool, calculator: calculatorTool }[tool]()}</section></div>`;
}
const toolTitle = (title, desc) =>
  `<div class="tool-heading"><h2>${title}</h2><p>${desc}</p></div>`;
const field = (label, name, value, min, max, step = "1") =>
  `<label class="number-field"><span>${label}</span><input type="number" name="${name}" data-lab="${name}" value="${value}" ${min === null ? "" : 'min="' + min + '"'} ${max === null ? "" : 'max="' + max + '"'} step="${step}"></label>`;
function lineData() {
  return lineModel(lab);
}
function numberLine() {
  return numberLineView(lab, { field, button, icon, toolTitle });
}
function counterTool() {
  const { pos, neg } = lab,
    pairs = Math.min(pos, neg);
  return `${toolTitle("Make negatives tangible", "A positive and a negative cancel out. Together, they make a zero pair.")}<div class="counter-columns"><div class="counter-group"><div class="counter-heading"><span class="positive-text">Positive counters</span><b>+${pos}</b></div><div class="counter-tray" aria-label="${pos} positive counters">${Array.from({ length: pos }, () => '<span class="counter positive">+</span>').join("") || '<span class="empty-tray">Add a positive counter</span>'}</div><div class="counter-buttons">${button("− Remove one", "counter:pos,-1", "btn btn-small btn-outline", pos === 0 ? "disabled" : "")}${button("+ Add positive", "counter:pos,1", "btn btn-small", pos >= 30 ? "disabled" : "")}</div></div><div class="counter-group"><div class="counter-heading"><span class="negative-text">Negative counters</span><b>−${neg}</b></div><div class="counter-tray" aria-label="${neg} negative counters">${Array.from({ length: neg }, () => '<span class="counter negative">−</span>').join("") || '<span class="empty-tray">Add a negative counter</span>'}</div><div class="counter-buttons">${button("− Remove one", "counter:neg,-1", "btn btn-small btn-outline", neg === 0 ? "disabled" : "")}${button("+ Add negative", "counter:neg,1", "btn btn-small", neg >= 30 ? "disabled" : "")}</div></div></div><div class="counter-summary"><div>${math(`${pos}+(-${neg})`)}<span>=</span><strong>${pretty(pos - neg)}</strong></div><span>${pairs} zero ${pairs === 1 ? "pair" : "pairs"} can cancel</span></div><div class="counter-actions">${button("Cancel zero pairs " + icon("spark"), "cancel-pairs", "btn btn-primary", pairs === 0 ? "disabled" : "")}${button("+ Add a zero pair", "zero-pair", "btn btn-outline", pos >= 30 || neg >= 30 ? "disabled" : "")}${button("Start over", "counter-reset", "text-button")}</div><div class="visual-explanation">${icon("info")}<div><strong>Different-looking counters. The same total.</strong><p>Try adding a zero pair. Your total stays the same! To model 3 − (−2), start with three positives, add two zero pairs, then remove two negatives. Five positives remain.</p></div></div>`;
}
function fractionTool() {
  return fractionView(lab, { field, button, icon, toolTitle });
}
function percentTool() {
  return `${toolTitle("A hundred little possibilities", "Percent means “out of 100.” Each square is one percent.")}<div class="percent-layout"><div class="hundred-grid" aria-label="${lab.percent} of 100 squares shaded">${Array.from({ length: 100 }, (_, i) => `<button class="grid-cell ${i < lab.percent ? "filled" : ""}" data-action="percent:${i + 1}" aria-label="Set to ${i + 1} percent"></button>`).join("")}</div><div class="percent-values">${field("Percent shaded", "percent", lab.percent, 0, 100)}<div class="percent-equivalent"><strong>${lab.percent}%</strong><span>= ${math(`${lab.percent}/100`)}</span><span>= ${pretty(lab.percent / 100)}</span></div><p>One idea, three ways.<br>A percentage, a fraction, a decimal.</p></div></div><input class="wide-slider" type="range" min="0" max="100" value="${lab.percent}" data-lab="percent" aria-label="Percent shaded"><div class="try-presets"><span>Try it out</span>${[0, 25, 50, 75, 100].map((v) => button(`${v}%`, `percent:${v}`, "preset")).join("")}</div>`;
}
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
function primeFactors(n) {
  let result = [];
  for (let d = 2; d * d <= n; d++)
    while (n % d === 0) {
      result.push(d);
      n /= d;
    }
  if (n > 1) result.push(n);
  return result;
}
function factorsOf(n) {
  const result = [];
  for (let i = 1; i <= n; i++) if (n % i === 0) result.push(i);
  return result;
}
function factorTool() {
  const a = lab.factorA,
    b = lab.factorB,
    g = gcd(a, b),
    l = (a * b) / g;
  return `${toolTitle("Find the connections inside numbers", "Break them into primes. Discover what they have in common.")}<div class="tool-inputs">${field("First number", "factorA", a, 1, 1000)}${field("Second number", "factorB", b, 1, 1000)}</div><div class="factor-columns">${[
    a,
    b,
  ]
    .map(
      (n) =>
        `<div class="factor-card"><span class="eyebrow muted">BUILDING BLOCKS OF</span><h3>${n}</h3><div class="prime-chips">${
          n === 1
            ? "<span>1 has no prime factors.</span>"
            : primeFactors(n)
                .map((f, i) => (i ? "<span>×</span>" : "") + `<b>${f}</b>`)
                .join("")
        }</div><small>All positive factors</small><div class="factor-list">${factorsOf(
          n,
        )
          .map(
            (f) => `<span class="${g % f === 0 ? "shared" : ""}">${f}</span>`,
          )
          .join("")}</div></div>`,
    )
    .join(
      "",
    )}</div><div class="factor-results"><div><span>Greatest common factor</span><strong>${g}</strong><small>The largest factor they share.</small></div><div><span>Least common multiple</span><strong>${l}</strong><small>Their first shared positive multiple.</small></div></div><div class="visual-explanation">${icon("info")}<div><strong>A shortcut to common denominators.</strong><p>For fractions with denominators ${a} and ${b}, use ${l} as the least common denominator. Highlighted chips show all the factors shared by both numbers.</p></div></div>`;
}
function calculatorTool() {
  return `${toolTitle("A little help with the arithmetic", "Try it by hand first, then use this space to check your thinking.")}<div class="calculator-layout"><form id="calculator-form" class="calculator"><label for="calc-input">Your expression</label><input id="calc-input" value="${esc(lab.calc)}" placeholder="e.g. (−3 + 5) × 2" autocomplete="off" spellcheck="false"><div class="calculator-result ${lab.calcError ? "calc-error" : ""}" aria-live="polite">${esc(lab.result || "0")}</div><div class="calculator-keys">${["C", "(", ")", "⌫", "7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "−", "0", ".", "%", "+", "±", "^", "/", "="].map((key) => button(key, `calc:${key}`, `calc-key ${key === "=" ? "equals" : ""} ${["÷", "×", "−", "+"].includes(key) ? "operator" : ""}`, 'type="button"')).join("")}</div></form><div class="calculator-guide"><span class="stat-icon">${icon("calculator")}</span><h3>A check, not a shortcut.</h3><p>Use parentheses to group things together, and ^ for powers.</p><div>${math("(-3)^2")}<span> gives 9</span></div><div>${math("-3^2")}<span> gives −9</span></div><p>Type fractions as 3/4 and mixed numbers as 1 1/2. Press Enter to calculate.</p><small>Division and multiplication follow equal priority, from left to right.</small></div></div>`;
}

function render() {
  applyAppearance(appearance);
  document.querySelector("#app").innerHTML =
    header() +
    `<main id="main" tabindex="-1">${state.view === "lessons" ? (state.lesson ? lessonView() : home()) : state.view === "lab" ? labView() : state.view === "settings" ? settingsView() : progressView()}</main>`;
  document.body.classList.toggle("tools-open", overlay);
  if (overlay) {
    updateToolContext();
    if (state.view === "lab")
      document.querySelector("#lab-tools").innerHTML =
        '<div class="lab-tool-placeholder">Your tools are open beside this page. Close Quick Tools to bring them back here.</div>';
  }
  save();
}
function rerenderTools() {
  if (overlay) {
    document.querySelector("#overlay-tools").innerHTML = toolsUI();
    if (state.view === "lab")
      document.querySelector("#lab-tools").innerHTML =
        '<div class="lab-tool-placeholder">Your tools are open beside this page. Close Quick Tools to bring them back here.</div>';
  } else document.querySelector("#lab-tools").innerHTML = toolsUI();
}
let previousFocus;
function openTools() {
  if (overlay) {
    document.querySelector("#tools-dialog").focus();
    return;
  }
  previousFocus = document.activeElement;
  overlay = true;
  document.body.classList.add("tools-open");
  document.querySelector("#overlay-root").innerHTML =
    `<aside id="tools-dialog" role="region" aria-labelledby="dialog-title" tabindex="-1"><div class="dialog-header"><div><span class="eyebrow muted">LEARN & EXPLORE, SIDE BY SIDE</span><h2 id="dialog-title">Your math toolkit</h2></div>${button(icon("close"), "close-tools", "icon-button", 'aria-label="Close tools"')}</div><div id="tools-context"></div><div id="overlay-tools">${toolsUI()}</div><div class="dialog-footer">${icon("check")} Your lesson stays open. Keep typing or checking answers.</div></aside>`;
  if (state.view === "lab")
    document.querySelector("#lab-tools").innerHTML =
      '<div class="lab-tool-placeholder">Your tools are open beside this page. Close Quick Tools to bring them back here.</div>';
  updateToolContext();
  document.querySelector("#tools-dialog").focus();
}
function updateToolContext() {
  const target = document.querySelector("#tools-context");
  if (!target) return;
  const l = lessons.find((l) => l.id === state.lesson),
    p = l && getProgress(l.id);
  target.innerHTML =
    l && state.view === "lessons"
      ? `<div class="pinned-problem"><span>${p.stage === "practice" ? "WORKING ON · PROBLEM " + (p.index + 1) : "YOUR WORKED EXAMPLE"}</span><strong>${p.stage === "practice" ? esc(l.problems[p.index].prompt) : esc(l.title)}</strong><div>${p.stage === "practice" ? practiceMath(l.problems[p.index]) : math(l.example.expr)}</div></div>`
      : "";
}
function closeTools() {
  overlay = false;
  document.body.classList.remove("tools-open");
  document.querySelector("#overlay-root").innerHTML = "";
  if (state.view === "lab")
    document.querySelector("#lab-tools").innerHTML = toolsUI();
  if (previousFocus?.isConnected) previousFocus.focus();
}

function go(view) {
  state.view = view;
  feedback = null;
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function openLesson(id) {
  state.lesson = id;
  tool = lessons.find((l) => l.id === id).tool;
  go("lessons");
}
function toast(text) {
  const el = document.querySelector("#toast");
  el.textContent = text;
  el.classList.add("visible");
  setTimeout(() => el.classList.remove("visible"), 3500);
}
function setQuestion(index) {
  const p = getProgress(state.lesson);
  p.index = Math.max(0, Math.min(7, index));
  p.stage = "practice";
  feedback = null;
  render();
  document.querySelector("#answer")?.focus();
}
function runCalculation() {
  try {
    lab.result = pretty(calculate(lab.calc));
    lab.calcError = false;
  } catch (e) {
    lab.result = e.message;
    lab.calcError = true;
  }
  rerenderTools();
}
function checkCurrent() {
  const l = lessons.find((l) => l.id === state.lesson),
    p = getProgress(l.id),
    input = document.querySelector("#answer").value;
  p.answers[p.index] = input;
  feedback = checkAnswer(input, l.problems[p.index]);
  const newlySolved = feedback.correct && !p.solved.includes(p.index);
  if (newlySolved) {
    p.solved.push(p.index);
    state.game.streak = (Number(state.game.streak) || 0) + 1;
    state.game.best = Math.max(Number(state.game.best) || 0, state.game.streak);
  } else if (!feedback.correct) state.game.streak = 0;
  render();
  if (newlySolved && p.solved.length === 8)
    toast("Eight small steps. One lesson complete!");
  else {
    if (newlySolved) toast("+10 leaf points. Your understanding is growing!");
    document.querySelector("#answer")?.focus();
  }
}
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (!el || el.disabled) return;
  const [action, ...rest] = el.dataset.action.split(":"),
    value = rest.join(":");
  if (el.tagName === "A") e.preventDefault();
  if (action === "reset-appearance") {
    appearance = { ...defaults };
    saveAppearance(appearance);
    render();
  } else if (action === "take-break") {
    toast("A little pause is part of learning. Your progress is saved.");
  } else if (action === "home") {
    state.lesson = null;
    go("lessons");
  } else if (action === "view") go(value);
  else if (action === "filter") {
    state.topic = value;
    render();
  } else if (action === "lesson") openLesson(value);
  else if (action === "all-lessons") {
    state.lesson = null;
    go("lessons");
  } else if (action === "start-recommended") {
    const l =
      lessons.find(
        (l) =>
          getProgress(l.id).stage === "practice" &&
          getProgress(l.id).solved.length < 8,
      ) ||
      lessons.find((l) => getProgress(l.id).solved.length < 8) ||
      lessons[0];
    openLesson(l.id);
  } else if (action === "open-tools") openTools();
  else if (action === "close-tools") closeTools();
  else if (action === "tool") {
    tool = value;
    rerenderTools();
  } else if (action === "return-lesson") go("lessons");
  else if (action === "example") {
    getProgress(state.lesson).stage = "example";
    feedback = null;
    render();
  } else if (action === "begin-practice")
    setQuestion(getProgress(state.lesson).index);
  else if (action === "question") setQuestion(Number(value));
  else if (action === "previous-question") {
    const p = getProgress(state.lesson);
    if (p.index === 0) {
      p.stage = "example";
      feedback = null;
      render();
    } else setQuestion(p.index - 1);
  } else if (action === "next-question")
    setQuestion(getProgress(state.lesson).index + 1);
  else if (action === "lesson-review") go("progress");
  else if (action === "hint" || action === "reveal") {
    const p = getProgress(state.lesson),
      list = p[action === "hint" ? "hints" : "reveals"];
    const at = list.indexOf(p.index);
    at === -1 ? list.push(p.index) : list.splice(at, 1);
    render();
  } else if (action === "visualize-problem") {
    const l = lessons.find((l) => l.id === state.lesson);
    tool = l.tool;
    if (l.topic === "integers") {
      const expr = l.problems[getProgress(l.id).index].expr;
      const match = expr.match(/^\(?(-?\d+)\)?([+*/-])\(?(-?\d+)\)?$/);
      if (match) {
        lab.a = Number(match[1]);
        lab.b = Number(match[3]);
        lab.op = match[2];
        lab.step = null;
      }
    }
    openTools();
  } else if (action === "line-reset") {
    lab.step = 0;
    rerenderTools();
  } else if (action === "line-finish") {
    lab.step = null;
    rerenderTools();
  } else if (action === "line-step") {
    lab.step = Math.min(lineData().total, (lab.step ?? 0) + 1);
    rerenderTools();
  } else if (action === "preset") {
    const [a, b, op] = value.split(",");
    Object.assign(lab, { a: Number(a), b: Number(b), op, step: null });
    rerenderTools();
  } else if (action === "counter") {
    const [which, delta] = value.split(",");
    lab[which] = Math.max(0, Math.min(30, lab[which] + Number(delta)));
    rerenderTools();
  } else if (action === "cancel-pairs") {
    const pairs = Math.min(lab.pos, lab.neg);
    lab.pos -= pairs;
    lab.neg -= pairs;
    rerenderTools();
    toast(`${pairs} zero pairs cancelled. The total stays the same.`);
  } else if (action === "zero-pair") {
    lab.pos++;
    lab.neg++;
    rerenderTools();
  } else if (action === "counter-reset") {
    lab.pos = 0;
    lab.neg = 0;
    rerenderTools();
  } else if (action === "fraction") {
    const [num, den] = value.split(",");
    Object.assign(lab, { num: Number(num), den: Number(den) });
    rerenderTools();
  } else if (action === "fraction-piece") {
    lab.num = Number(value) === lab.num ? lab.num - 1 : Number(value);
    rerenderTools();
  } else if (action === "percent") {
    lab.percent = Number(value);
    rerenderTools();
  } else if (action === "calc") {
    if (value === "=") {
      runCalculation();
      return;
    }
    if (value === "C") {
      lab.calc = "";
      lab.result = "";
      lab.calcError = false;
    } else if (value === "⌫") lab.calc = lab.calc.slice(0, -1);
    else if (value === "±") lab.calc = lab.calc ? `-(${lab.calc})` : "-";
    else lab.calc += { "×": "*", "÷": "/", "−": "-" }[value] || value;
    rerenderTools();
    document.querySelector("#calc-input")?.focus();
  } else if (action === "export-progress") {
    save();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }),
    );
    a.download = "numi-progress.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && overlay) closeTools();
});
document.addEventListener("submit", (e) => {
  if (e.target.id === "answer-form") {
    e.preventDefault();
    checkCurrent();
  }
  if (e.target.id === "calculator-form") {
    e.preventDefault();
    runCalculation();
  }
});
document.addEventListener("input", (e) => {
  if (e.target.id === "answer") {
    getProgress(state.lesson).answers[getProgress(state.lesson).index] =
      e.target.value;
    save();
  }
  if (e.target.id === "calc-input") lab.calc = e.target.value;
});
document.addEventListener("change", async (e) => {
  const key = e.target.dataset.lab;
  if (key) {
    if (key === "op") lab.op = e.target.value;
    else {
      const v = Number(e.target.value),
        min = e.target.hasAttribute("min")
          ? Number(e.target.getAttribute("min"))
          : -Infinity,
        max = e.target.hasAttribute("max")
          ? Number(e.target.getAttribute("max"))
          : Infinity;
      const whole = ["num", "den", "percent", "factorA", "factorB"].includes(
        key,
      );
      if (
        !Number.isFinite(v) ||
        e.target.value === "" ||
        v < min ||
        v > max ||
        (whole && !Number.isSafeInteger(v))
      ) {
        e.target.value = lab[key];
        toast(
          whole
            ? "Use a whole number in the allowed range. Fractions support values up to 9,007,199,254,740,991."
            : "Enter a finite number. The line will resize to fit.",
        );
        return;
      }
      lab[key] = v;
    }
    lab.step = null;
    rerenderTools();
  }
  const setting = e.target.dataset.setting;
  if (setting) {
    appearance[setting] =
      setting === "motion" ? e.target.checked : e.target.value;
    const saved = saveAppearance(appearance);
    if (!saved)
      toast("Settings apply to this tab; browser storage is unavailable.");
    render();
  }
  if (e.target.id === "import-progress") {
    try {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 100000) throw Error();
      const imported = JSON.parse(await file.text());
      if (imported.version !== 1 || !imported.progress) throw Error();
      const progress = {};
      for (const l of lessons) {
        const p = imported.progress[l.id];
        if (!p) continue;
        if (
          !Array.isArray(p.solved) ||
          !p.answers ||
          typeof p.answers !== "object"
        )
          throw Error();
        progress[l.id] = {
          index:
            Number.isInteger(p.index) && p.index >= 0 && p.index < 8
              ? p.index
              : 0,
          stage: p.stage === "practice" ? "practice" : "example",
          solved: [
            ...new Set(
              p.solved.filter((i) => Number.isInteger(i) && i >= 0 && i < 8),
            ),
          ],
          answers: Object.fromEntries(
            Object.entries(p.answers).filter(
              ([k, v]) =>
                /^\d$/.test(k) &&
                Number(k) < 8 &&
                typeof v === "string" &&
                v.length < 500,
            ),
          ),
          hints: Array.isArray(p.hints)
            ? p.hints.filter((i) => Number.isInteger(i) && i >= 0 && i < 8)
            : [],
          reveals: Array.isArray(p.reveals)
            ? p.reveals.filter((i) => Number.isInteger(i) && i >= 0 && i < 8)
            : [],
        };
      }
      state.progress = progress;
      render();
      toast("Your learning progress has been restored.");
    } catch {
      toast("That file isn’t a valid Numi progress export.");
    }
  }
});
render();
