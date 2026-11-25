import {
  math,
  calculate,
  pretty,
  escapeHTML as esc,
  checkAnswer,
} from "./math.js";
import { migrateLessonProgress } from "./progress-migration.js";
import { createAccountManager } from "./account.js";
import { adminUid, createPracticeTracker } from "./practice-stats.js";
import { createPresenceReporter } from "./practice-presence.js";
import {
  activityIsOver,
  activityQuestion,
  startActivity,
  checkActivity,
  nextActivityQuestion,
  restoreFixedQuiz,
} from "./activities.js";
import {
  activityLinks,
  activityView,
  quizLessonLink,
  quizSetup,
} from "./activity-view.js";
import {
  mergeActivityScores,
  normalizeActivityScores,
} from "./activity-scores.js";
import { topics, lessons, upcoming, totalProblems } from "./lessons.js";
import {
  exportProgressCode,
  importProgressCode,
  normalizeProgress,
  mergeProgress,
} from "./progress-transfer.js";
import {
  lineOperations,
  lineModel,
  expressionToLine,
  advanceLine,
} from "./visual-models.js";
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
const expandedTopics = new Set();
function readState() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE));
    return s && s.version === 1 && s.progress && typeof s.progress === "object"
      ? migrateLessonProgress(s)
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
state.activityScores = normalizeActivityScores(state.activityScores);
restoreFixedQuiz(state);
let storageFailed = false;
let accounts;
let dashboard;
const isAdmin = () => accounts?.user?.uid === adminUid;
const activityVisible = () => !document.hidden && (document.hasFocus?.() ?? true);
const tracker = createPracticeTracker({
  storage: localStorage,
  write: (entry) => accounts.writePracticeActivity(entry),
  visible: activityVisible,
});
const presence = createPresenceReporter({
  write: (id, entry) => accounts.writePresence(id, entry),
  remove: (id, uid) => accounts.removePresence(id, uid),
  online: () => globalThis.navigator?.onLine !== false,
});

function syncPresenceScreen() {
  const problem = document.querySelector('#main :is(#answer-form, #activity-answer-form, [data-action^="activity-sign:"], [data-action^="activity-choice:"], [data-action="activity-next"])');
  presence.setPracticeScreen(activityVisible() && !!problem);
}
function save() {
  try {
    if (accounts) accounts.save(state);
    else localStorage.setItem(STORE, JSON.stringify(state));
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
let transferCode = "",
  transferDraft = "",
  transferStatus = "";
let deleteProgressPending = false,
  deleteProgressStatus = "",
  deleteProgressBusy = false;
let lab = {
  a: -3,
  b: 5,
  op: "+",
  step: 0,
  operations: [],
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
    : p?.solved.length === l?.problems.length
      ? "happy"
      : "neutral";
  const message = feedback
    ? feedback.correct
      ? "Correct."
      : helpAvailable(p, 1)
        ? "Try again. The hint can help."
        : "Enter an answer to try it."
    : p?.stage === "practice"
      ? "Solve the problem below."
      : "Follow the worked example.";
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
// Only incorrect, non-empty submissions unlock help, separately for each problem.
const helpAvailable = (p, threshold) =>
  Number.isInteger(p.failedChecks?.[p.index]) &&
  p.failedChecks[p.index] >= threshold;
const solvedCount = () =>
  lessons.reduce((sum, l) => sum + getProgress(l.id).solved.length, 0);
const completedCount = () =>
  lessons.filter((l) => getProgress(l.id).solved.length === l.problems.length)
    .length;
function moduleProgress(topic) {
  const moduleLessons = lessons.filter((lesson) => lesson.topic === topic.id);
  let solved = 0,
    total = 0,
    completedLessons = 0;
  for (const lesson of moduleLessons) {
    const count = getProgress(lesson.id).solved.length;
    solved += count;
    total += lesson.problems.length;
    if (count === lesson.problems.length) completedLessons++;
  }
  const lessonsComplete = completedLessons === moduleLessons.length;
  const quizPassed = !!state.activityScores?.[topic.quizPassKey];
  return {
    moduleLessons,
    solved,
    total,
    completedLessons,
    quizPassed,
    quizRemaining: lessonsComplete && !!topic.quizPassKey && !quizPassed,
    complete: lessonsComplete && (!topic.quizPassKey || quizPassed),
  };
}
const completedModuleCount = () =>
  topics.filter((topic) => moduleProgress(topic).complete).length;
const tools = [
  ["line", "Number line", "line"],
  ["counters", "Signed counters", "counters"],
  ["fractions", "Fraction bars", "pie"],
  ["percent", "Percent grid", "percent"],
  ["factors", "Factor explorer", "grid"],
  ["calculator", "Calculator", "calculator"],
];

function header() {
  if (quizLocked()) {
    return `<header class="header quiz-header"><div class="header-inner">
      <span class="brand">numi<span class="brand-dot">.</span></span>
      <span class="quiz-header-label">${icon("lock")} Quiz mode</span>
      <span data-cloud-status class="quiz-save-status">${esc(accounts?.label() || "Saved on this device")}</span>
    </div></header>`;
  }
  return `<header class="header"><div class="header-inner"><a class="brand" href="#" data-action="home"><span class="brand-mark">n<span>✦</span></span>numi<span class="brand-dot">.</span></a><nav class="main-nav" aria-label="Main navigation">${[
    ["lessons", "Lessons", "book"],
    ["lab", "Visual lab", "lab"],
    ["progress", "My progress", "chart"],
    ["settings", "Settings", "settings"],
    ...(isAdmin() ? [["admin", "Admin", "chart"]] : []),
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
    )}</nav><div class="header-right"><span class="saved-label">${icon("check")} <span data-cloud-status>${storageFailed ? "Progress stays in this tab" : esc(accounts?.label() || "Saved on this device")}</span></span>${button(accounts?.user ? "Account" : "Sign in", "open-account", "btn btn-small btn-outline account-nav")}${button(icon("calculator") + "<span>Quick tools</span>", "open-tools", "btn btn-small btn-outline")}<span class="header-companion">${companionImage("matcha", "", "Your study companion")}</span></div></div></header>`;
}
function heroArt() {
  return `<div class="hero-art"><div class="companion-welcome">${companionImage("matcha", "", "Your companion is ready with a cup of matcha")}</div><div class="hero-equation" aria-label="Negative three plus five equals two">${math("-3+5")}<span>=</span><b>2</b></div><div class="garden-points">${icon("leaf")} ${solvedCount() * 10} leaf points earned <span>·</span> ${completedCount()} lessons complete</div></div>`;
}
function home() {
  const count = solvedCount();
  return `<section class="hero"><div class="hero-copy"><div class="eyebrow"><span class="tiny-star">✦</span> BEGINNER MATH</div><h1>Learn math,<br>step by step.</h1><p>Guided lessons and visual tools for foundational math.</p>${button((count ? "Keep learning" : "Let’s start learning") + icon("arrow"), "start-recommended", "btn btn-primary")}</div>${heroArt()}</section><div class="dashboard-grid"><section class="lesson-catalog"><div class="section-heading"><div><span class="eyebrow muted">BUILD YOUR FOUNDATION</span><h2>Lessons</h2></div><span class="count-badge">${lessons.length} lessons</span></div><div class="filter-row" aria-label="Filter lessons">${[["all", "All topics"], ...topics.map((t) => [t.id, t.short])].map(([id, label]) => button(label, `filter:${id}`, `filter ${state.topic === id ? "selected" : ""}`, 'aria-pressed="' + (state.topic === id) + '"')).join("")}</div><div class="topic-grid">${topics
    .filter((t) => state.topic === "all" || state.topic === t.id)
    .map(topicCard)
    .join(
      "",
    )}</div></section><aside class="dashboard-aside"><div class="journey-card"><div class="aside-title">${icon("leaf")}<h3>Your learning path</h3></div><p>Every small step counts.</p><div class="progress-stat"><b>${count}<span> / ${totalProblems}</span></b><span>problems solved</span></div><div class="progress-track"><span style="width:${(count / totalProblems) * 100}%"></span></div><div class="path-list">${topics
    .map((t, i) => {
      const { complete, quizRemaining, solved, total } = moduleProgress(t);
      const status = complete
        ? "Complete"
        : quizRemaining
          ? "Quiz remaining"
          : solved
            ? `${solved} of ${total} solved`
            : "One step at a time";
      return `<div class="path-item" data-module="${t.id}"><span class="path-node ${complete ? "done" : i === 0 ? "current" : ""}">${complete ? "?" : String(i + 1).padStart(2, "0")}</span><div><strong>${t.short}</strong><small>${status}</small></div></div>`;
    })
    .join(
      "",
    )}</div></div><div class="lab-teaser"><span class="teaser-icon">${icon("lab")}</span><h3>Visual tools</h3><p>Number lines, signed counters, fraction bars, and a calculator.</p>${button("Explore the visual lab " + icon("arrow"), "view:lab", "text-button")}</div></aside></div>${comingSoon()}<footer><span class="footer-brand">numi.</span><span>Built for curious minds. At every starting point.</span><span>${icon("check")} Your pace. Your progress.</span></footer>`;
}
function topicCard(t) {
  const {
    moduleLessons: ls,
    solved,
    total,
    complete,
    quizRemaining,
    quizPassed,
  } = moduleProgress(t);
  const status = complete
    ? "Module complete"
    : quizRemaining
      ? "Quiz remaining"
      : `${solved}/${total} solved`;
  const expanded = expandedTopics.has(t.id),
    visible = expanded ? ls : ls.slice(0, 3);
  return `<article class="topic-card ${t.color}"><div class="topic-top"><span class="topic-icon">${icon(t.icon)}</span><span class="topic-tag">${t.tag}</span></div><h3>${t.title}</h3><p>${t.description}</p><div class="lesson-links" id="lessons-${t.id}" data-expanded="${expanded}">${visible
    .map((l, i) => {
      const p = getProgress(l.id);
      return button(
        `<span class="lesson-number ${p.solved.length === l.problems.length ? "done" : ""}">${p.solved.length === l.problems.length ? "✓" : String(i + 1).padStart(2, "0")}</span><span><strong>${l.title}</strong><small>${l.minutes} min <span>·</span> ${l.problems.length} problems${p.solved.length ? " · " + p.solved.length + "/" + l.problems.length : ""}</small></span>${icon("chevron")}`,
        `lesson:${l.id}`,
        "lesson-link",
      );
    })
    .join(
      "",
    )}${ls.length > 3 ? button((expanded ? "Show fewer lessons" : `Show all ${ls.length} lessons`) + icon("chevron"), `toggle-topic:${t.id}`, "text-button lesson-list-toggle", `aria-expanded="${expanded}" aria-controls="lessons-${t.id}"`) : ""}${t.quizPassKey ? quizLessonLink(quizPassed) : ""}</div>${activityLinks(t.id, state.activityScores)}<div class="card-bottom"><span>${ls.length} guided lessons${t.quizPassKey ? " + quiz" : ""}</span><span>${status} ${complete ? icon("check") : icon("leaf")}</span></div></article>`;
}
function comingSoon() {
  return `<section class="coming-soon"><div class="section-heading"><div><span class="eyebrow muted">GROW FROM HERE</span><h2>More to look forward to</h2><p>A strong foundation opens up a whole new world.</p></div><span class="badge">${icon("lock")} To be added</span></div><div class="future-grid">${upcoming.map((group, i) => `<article class="future-card"><div class="future-number">0${i + 2}</div><div><h3>${group.title}</h3><p>${i ? "From your first variable to the coordinate plane." : "Connect everyday questions to everyday math."}</p><details><summary>See ${group.items.length} upcoming topics ${icon("chevron")}</summary><ul>${group.items.map(([name, desc]) => `<li><strong>${name}</strong><span>${desc}</span></li>`).join("")}</ul></details></div></article>`).join("")}</div></section>`;
}

function exampleSteps(example) {
  return example.steps
    .map((step, index) => {
      const item = typeof step === "string" ? { text: step, lines: [] } : step;
      return `<li><span>${index + 1}</span><div class="example-step-body"><p>${esc(item.text)}</p>${(item.lines || []).map((line) => `<div class="step-equation" role="math" aria-label="${esc(line.join(" equals "))}">${line.map((expression, i) => (i ? '<span class="equation-equals">=</span>' : "") + math(expression)).join("")}</div>`).join("")}</div></li>`;
    })
    .join("");
}
function moreLessonExamples(examples) {
  return `<section class="more-examples"><h2>More worked examples</h2>${examples.map((example) => `<details><summary>${esc(example.title)}${icon("chevron")}</summary><div class="example-equation">${math(example.expr)}</div><ol class="example-steps">${exampleSteps(example)}</ol></details>`).join("")}</section>`;
}
function progressTransferUI() {
  return `<section class="progress-transfer" aria-labelledby="transfer-title"><h2 id="transfer-title">Transfer progress</h2><p>Export a code on this device. On another device, paste it below to import your answers and lesson progress. Existing solved problems are kept. Use a progress file to include quiz and review scores.</p><div class="transfer-actions">${button("Export progress code", "generate-progress-code", "btn btn-primary")}${button("Download progress file", "export-progress", "btn btn-outline")}</div>${transferCode ? `<label for="progress-code-output">Your progress code</label><textarea id="progress-code-output" rows="4" readonly spellcheck="false">${esc(transferCode)}</textarea>${button("Copy code", "copy-progress-code", "btn btn-outline")}` : ""}<label for="progress-code-input">Import a progress code</label><textarea id="progress-code-input" rows="4" spellcheck="false" autocomplete="off" placeholder="Paste your Numi progress code.">${esc(transferDraft)}</textarea><div class="transfer-actions">${button("Import progress code", "import-progress-code", "btn btn-primary")}<label class="btn btn-outline file-import">Import a progress file<input id="import-progress" type="file" accept="application/json,.json" hidden></label></div><p class="transfer-status" role="status">${esc(transferStatus)}</p></section>`;
}
function restoreProgress(imported) {
  state.progress = mergeProgress(state.progress, imported.progress);
  if (imported.lesson) state.lesson = imported.lesson;
  state.game.streak = 0;
  state.activityScores = mergeActivityScores(
    state.activityScores,
    imported.activityScores,
  );
  save();
}
function deleteProgressUI() {
  return `<section class="progress-delete" aria-labelledby="delete-progress-title"><h2 id="delete-progress-title">Delete all progress</h2><p>Remove all saved answers, solved problems, hints, lesson positions, quiz records, and review streaks ${accounts?.user ? "from your account on all devices" : "saved as a guest on this device"}. Your appearance settings are kept.</p>${deleteProgressPending ? `<div class="delete-confirmation" role="group" aria-labelledby="delete-confirm-title" aria-describedby="delete-confirm-description"><h3 id="delete-confirm-title">Delete all your progress?</h3><p id="delete-confirm-description">This cannot be undone. Export your progress first if you want a backup.</p><div class="transfer-actions">${button("Cancel", "cancel-delete-progress", "btn btn-outline", `id="cancel-delete-progress" ${deleteProgressBusy ? "disabled" : ""}`)}${button(deleteProgressBusy ? "Deleting..." : "Confirm delete progress", "confirm-delete-progress", "btn btn-danger", deleteProgressBusy ? "disabled" : "")}</div></div>` : button("Delete all progress", "delete-progress", "btn btn-outline btn-danger-outline", 'aria-expanded="false"')}<p class="transfer-status" role="status">${esc(deleteProgressStatus)}</p></section>`;
}
async function deleteAllProgress() {
  if (!deleteProgressPending || state.view !== "settings") return;
  if (deleteProgressBusy) return;
  if (accounts?.user) {
    deleteProgressBusy = true;
    deleteProgressStatus = "Deleting account progress…";
    render();
    try {
      await accounts.resetProgress();
      feedback = null;
      transferCode = transferDraft = transferStatus = "";
      deleteProgressPending = false;
      deleteProgressStatus =
        "All progress deleted from your account and this device.";
      if (overlay) closeTools();
    } catch (error) {
      deleteProgressStatus =
        error.message ||
        "Could not delete account progress. Your saved work is kept.";
    } finally {
      deleteProgressBusy = false;
      render();
    }
    return;
  }
  const cleared = {
    version: 1,
    view: "settings",
    topic: "all",
    lesson: null,
    progress: {},
    game: { streak: 0, best: 0 },
  };
  try {
    // Persist the reset before changing the current session or reporting success.
    localStorage.setItem(STORE, JSON.stringify(cleared));
  } catch {
    deleteProgressStatus =
      "Could not delete saved progress. Check browser storage permissions and try again.";
    render();
    return;
  }
  state = cleared;
  storageFailed = false;
  feedback = null;
  transferCode = transferDraft = transferStatus = "";
  deleteProgressPending = false;
  deleteProgressStatus = "All progress deleted on this device.";
  if (overlay) closeTools();
  render();
  document.querySelector('[data-action="delete-progress"]')?.focus();
}
async function copyProgressCode() {
  try {
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText)
      throw Error();
    await navigator.clipboard.writeText(transferCode);
    toast("Progress code copied.");
  } catch {
    const box = document.querySelector("#progress-code-output");
    box?.focus();
    box?.select?.();
    toast("Select and copy the progress code above.");
  }
}
function practiceMath(problem) {
  if (problem.targetDenominator)
    return (
      math(problem.expr) +
      '<span>=</span><math xmlns="http://www.w3.org/1998/Math/MathML" aria-label="missing numerator over ' +
      problem.targetDenominator +
      '"><mfrac><mo>?</mo><mn>' +
      problem.targetDenominator +
      "</mn></mfrac></math>"
    );
  const pair = problem.prompt?.match(/^Find the (GCF|LCM) of (\d+) and (\d+)/);
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
  p.index = Math.min(l.problems.length - 1, Math.max(0, p.index || 0));
  const t = topics.find((x) => x.id === l.topic),
    example = p.stage !== "practice",
    problem = l.problems[p.index],
    canHint = helpAvailable(p, 1),
    canExplain = helpAvailable(p, 2);
  return `<div class="lesson-breadcrumb">${button(icon("back") + "All lessons", "all-lessons", "text-button")}<span>/</span><span>${t.title}</span></div><div class="lesson-layout"><aside class="lesson-sidebar"><span class="topic-icon ${t.color}">${icon(t.icon)}</span><span class="eyebrow muted">${t.short}</span><h2>${l.title}</h2><p>${l.subtitle}</p><div class="mini-progress"><span>${p.solved.length} of ${l.problems.length} solved</span><div class="progress-track"><span style="width:${(p.solved.length / l.problems.length) * 100}%"></span></div></div>${button(icon("book") + " Worked example", "example", "sidebar-example " + (example ? "selected" : ""))}<div class="question-dots" aria-label="Practice problems">${l.problems.map((_, i) => button(p.solved.includes(i) ? icon("check") : String(i + 1), `question:${i}`, `question-dot ${!example && p.index === i ? "selected" : ""} ${p.solved.includes(i) ? "solved" : ""}`, `aria-label="Problem ${i + 1}${p.solved.includes(i) ? ", solved" : ""}"`)).join("")}</div><div class="sidebar-tip">${icon("lab")}<strong>Need a different perspective?</strong><p>Your work stays right here when you open a visual aid.</p>${button("Open visual tools " + icon("arrow"), "open-tools", "text-button")}</div></aside><section class="lesson-workspace"><div class="workspace-top"><span class="eyebrow muted">${example ? "FIRST, LET’S WALK THROUGH IT" : `YOUR TURN · PROBLEM ${p.index + 1} OF ${l.problems.length}`}</span><span class="badge">${icon("check")} ${p.solved.length === l.problems.length ? "Lesson complete" : "At your own pace"}</span></div>${companionCard()}${example ? `<h1>Start with an example.</h1><div class="rule-callout">${icon("info")}<p>${l.rule}</p></div><div class="example-equation">${math(l.example.expr)}</div><ol class="example-steps">${exampleSteps(l.example)}</ol>${l.moreExamples?.length ? moreLessonExamples(l.moreExamples) : ""}<div class="workspace-bottom"><span></span>${button("Try it yourself " + icon("arrow"), "begin-practice", "btn btn-primary")}</div>` : `<h1>${problem.type === "percent" ? "Convert to a percentage." : problem.type === "prime" ? "Prime factorization" : "Practice"}</h1><p class="workspace-intro">${esc(problem.prompt)}</p><div class="practice-equation">${practiceMath(problem)}</div><form id="answer-form"><label for="answer">Your answer ${problem.type === "percent" ? "<span>(as a percentage)</span>" : ""}</label><div class="answer-row"><input id="answer" name="answer" type="text" maxlength="500" autocomplete="off" spellcheck="false" placeholder="${problem.type === "prime" ? "e.g. 2^2 * 3" : problem.type === "fraction" ? "e.g. 3/4 or 1 1/2" : "Type your answer…"}" value="${esc(p.answers[p.index] || "")}" aria-describedby="answer-format feedback">${button("Check answer " + icon("check"), "check-answer", "btn btn-primary", 'type="submit"')}</div><small id="answer-format">${problem.type === "prime" ? "Use * to multiply and ^ for exponents." : problem.type === "percent" ? "Enter a number like 75, or write 75%." : problem.type === "decimal" ? "Enter a decimal, like 0.75." : "Fractions (3/4), mixed numbers (1 1/2), and decimals are welcome."}</small></form><div id="feedback" aria-live="polite">${feedback ? `<div class="feedback ${feedback.correct ? "success" : "retry"}">${icon(feedback.correct ? "check" : "info")}<span>${esc(feedback.message)}</span></div>` : p.solved.includes(p.index) ? `<div class="feedback success">${icon("check")} You’ve solved this one. Nice work!</div>` : ""}</div><div class="help-row">${canHint ? button(icon("spark") + (p.hints.includes(p.index) ? "Hide hint" : "Give me a hint"), "hint", "text-button") : ""}${button(icon("lab") + "Visualize it", "visualize-problem", "text-button")}${canExplain ? button(p.reveals.includes(p.index) ? "Hide explanation" : "See explanation", "reveal", "text-button") : ""}</div>${canHint && p.hints.includes(p.index) ? `<div class="hint-box"><strong>A little nudge</strong><p>${esc(problem.hint)}</p></div>` : ""}${canExplain && p.reveals.includes(p.index) ? `<div class="hint-box"><strong>Let’s work through it</strong><p>${esc(problem.solution)}</p><div class="solution-answer">Answer: ${math(problem.answer)}${problem.type === "percent" ? "%" : ""}</div><small>Read it through, then try entering the answer yourself.</small></div>` : ""}<div class="workspace-bottom">${button(icon("back") + "Previous", "previous-question", "btn btn-outline")}${p.index < l.problems.length - 1 ? button("Next problem " + icon("arrow"), "next-question", "btn btn-primary") : button((p.solved.length === l.problems.length ? "Lesson complete" : "Review my progress") + " " + icon("arrow"), "lesson-review", "btn btn-primary")}</div>`}</section></div>`;
}
function progressView() {
  const solved = solvedCount(),
    complete = completedCount();
  return `<div class="page-heading"><span class="eyebrow muted">LOOK HOW FAR YOU’VE COME</span><h1>Progress, one step at a time<span class="purple-text">.</span></h1><p>There’s no deadline for understanding. Keep building at your own pace.</p></div><div class="stats-grid"><div><span class="stat-icon">${icon("check")}</span><b>${solved}<small> / ${totalProblems}</small></b><span>Problems solved</span></div><div><span class="stat-icon">${icon("book")}</span><b>${complete}<small> / ${lessons.length}</small></b><span>Lessons completed</span></div><div><span class="stat-icon">${icon("leaf")}</span><b>${completedModuleCount()}<small> / ${topics.length}</small></b><span>Modules completed</span></div></div><div class="progress-lessons">${lessons
    .map((l) => {
      const p = getProgress(l.id),
        t = topics.find((t) => t.id === l.topic);
      return `<article><span class="topic-icon ${t.color}">${icon(t.icon)}</span><div><small>${t.short}</small><h3>${l.title}</h3><div class="progress-track"><span style="width:${(p.solved.length / l.problems.length) * 100}%"></span></div></div><span>${p.solved.length}/${l.problems.length} solved</span>${button((p.solved.length === l.problems.length ? "Revisit" : p.stage === "practice" ? "Continue" : "Start") + " " + icon("arrow"), `lesson:${l.id}`, "btn btn-outline")}</article>`;
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
    [
      "Finding your stride",
      count >= Math.ceil(totalProblems / 2),
      "Half the foundation complete",
    ],
    [
      "A flourishing foundation",
      completedModuleCount() === topics.length,
      "All modules completed",
    ],
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
  return `<div class="page-heading"><h1>Settings</h1></div><div class="settings-layout"><section class="settings-card">${accounts?.view() || ""}<p>When signed in, Numi shares your online and practice status with the app owner, along with active days, estimated practice time, answer counts, and quiz and review timing.</p><h2>Appearance</h2><p>Changes apply straight away and are saved in this browser.</p><fieldset class="theme-options"><legend>Color theme</legend>${themes.map(([id, title, description]) => `<label class="theme-option ${appearance.theme === id ? "selected" : ""}"><input type="radio" name="color-theme" value="${id}" data-setting="theme" ${appearance.theme === id ? "checked" : ""}><span class="theme-swatch ${id}" aria-hidden="true"></span><span><strong>${title}</strong><small>${description}</small></span></label>`).join("")}</fieldset><div class="settings-fields"><label><span>Text size</span><select data-setting="size" aria-label="Text size">${[
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
    )}</select><small>A little more definition when you need it.</small></label></div><label class="motion-setting"><input type="checkbox" data-setting="motion" ${appearance.motion ? "checked" : ""}><span><strong>Gentle celebrations</strong><small>Small companion animations after a new answer. Your system’s reduced-motion preference is always respected.</small></span></label>${button("Restore appearance defaults", "reset-appearance", "btn btn-outline")}<div class="settings-save-note">${icon("check")} Your answers, position, progress, and appearance are saved locally on this device.</div>${progressTransferUI()}${deleteProgressUI()}</section><aside class="settings-preview"><div class="preview-card"><span class="eyebrow muted">A LITTLE PREVIEW</span>${companionImage("happy", "", "Your happy study companion")}<h2>Text preview</h2><p>Preview your text and equation settings.</p><div class="preview-equation">${math("1/2+1/4")}<span>=</span>${math("3/4")}</div><span class="btn btn-primary">Button preview</span></div></aside></div>`;
}
function labView() {
  return `<div class="page-heading lab-heading"><div><h1>Visual tools</h1></div></div>${state.lesson ? '<div class="return-banner">' + icon("book") + "<span>Your lesson is saved.</span>" + button("Return to lesson " + icon("arrow"), "return-lesson", "text-button") + "</div>" : ""}<div id="lab-tools">${toolsUI()}</div>`;
}
function toolsUI() {
  return `<div class="tool-layout"><nav class="tool-nav" aria-label="Visual tools">${tools.map(([id, title, i]) => button(icon(i) + `<span>${title}</span>` + icon("chevron"), `tool:${id}`, `tool-tab ${tool === id ? "selected" : ""}`, 'aria-current="' + (tool === id ? "true" : "false") + '"')).join("")}</nav><section class="tool-panel">${{ line: numberLine, counters: counterTool, fractions: fractionTool, percent: percentTool, factors: factorTool, calculator: calculatorTool }[tool]()}</section></div>`;
}
const toolTitle = (title, desc) =>
  `<div class="tool-heading"><h2>${title}</h2><p>${desc}</p></div>`;
const field = (label, name, value, min, max, step = "1") =>
  `<label class="number-field"><span>${label}</span><input type="number" name="${name}" data-lab="${name}" value="${value}" ${min === null ? "" : 'min="' + min + '"'} ${max === null ? "" : 'max="' + max + '"'} step="${step}"></label>`;
function lineData() {
  return lineModel(lab);
}
function commitLineInputs() {
  const panel = document
    .querySelector(".line-operations")
    ?.closest(".tool-panel");
  if (!panel) return true;
  const a = Number(panel.querySelector('[data-lab="a"]').value),
    b = Number(panel.querySelector('[data-lab="b"]').value),
    op = panel.querySelector('[data-lab="op"]').value;
  const operations = lab.operations.map((operation, i) => ({
    op: panel.querySelector(
      `[data-line-index="${i + 1}"][data-line-field="op"]`,
    ).value,
    value: Number(
      panel.querySelector(
        `[data-line-index="${i + 1}"][data-line-field="value"]`,
      ).value,
    ),
  }));
  const inputs = [...panel.querySelectorAll('input[type="number"]')];
  if (
    inputs.some(
      (input) => input.value === "" || !Number.isFinite(Number(input.value)),
    )
  ) {
    toast("Enter a finite number for each operation.");
    return false;
  }
  if (
    a !== lab.a ||
    b !== lab.b ||
    op !== lab.op ||
    JSON.stringify(operations) !== JSON.stringify(lab.operations)
  )
    lab.step = 0;
  Object.assign(lab, { a, b, op, operations });
  return true;
}
function numberLine() {
  return numberLineView(lab, { field, button, icon, toolTitle });
}
function counterTool() {
  const { pos, neg } = lab,
    pairs = Math.min(pos, neg);
  return `${toolTitle("Signed counters", "A positive and a negative cancel out. Together, they make a zero pair.")}<div class="counter-columns"><div class="counter-group"><div class="counter-heading"><span class="positive-text">Positive counters</span><b>+${pos}</b></div><div class="counter-tray" aria-label="${pos} positive counters">${Array.from({ length: pos }, () => '<span class="counter positive">+</span>').join("") || '<span class="empty-tray">Add a positive counter</span>'}</div><div class="counter-buttons">${button("− Remove one", "counter:pos,-1", "btn btn-small btn-outline", pos === 0 ? "disabled" : "")}${button("+ Add positive", "counter:pos,1", "btn btn-small", pos >= 30 ? "disabled" : "")}</div></div><div class="counter-group"><div class="counter-heading"><span class="negative-text">Negative counters</span><b>−${neg}</b></div><div class="counter-tray" aria-label="${neg} negative counters">${Array.from({ length: neg }, () => '<span class="counter negative">−</span>').join("") || '<span class="empty-tray">Add a negative counter</span>'}</div><div class="counter-buttons">${button("− Remove one", "counter:neg,-1", "btn btn-small btn-outline", neg === 0 ? "disabled" : "")}${button("+ Add negative", "counter:neg,1", "btn btn-small", neg >= 30 ? "disabled" : "")}</div></div></div><div class="counter-summary"><div>${math(`${pos}+(-${neg})`)}<span>=</span><strong>${pretty(pos - neg)}</strong></div><span>${pairs} zero ${pairs === 1 ? "pair" : "pairs"} can cancel</span></div><div class="counter-actions">${button("Cancel zero pairs " + icon("spark"), "cancel-pairs", "btn btn-primary", pairs === 0 ? "disabled" : "")}${button("+ Add a zero pair", "zero-pair", "btn btn-outline", pos >= 30 || neg >= 30 ? "disabled" : "")}${button("Start over", "counter-reset", "text-button")}</div><div class="visual-explanation">${icon("info")}<div><strong>Different-looking counters. The same total.</strong><p>Try adding a zero pair. Your total stays the same! To model 3 − (−2), start with three positives, add two zero pairs, then remove two negatives. Five positives remain.</p></div></div>`;
}
function fractionTool() {
  return fractionView(lab, { field, button, icon, toolTitle });
}
function percentTool() {
  return `${toolTitle("Percentage grid", "Percent means “out of 100.” Each square is one percent.")}<div class="percent-layout"><div class="hundred-grid" aria-label="${lab.percent} of 100 squares shaded">${Array.from({ length: 100 }, (_, i) => `<button class="grid-cell ${i < lab.percent ? "filled" : ""}" data-action="percent:${i + 1}" aria-label="Set to ${i + 1} percent"></button>`).join("")}</div><div class="percent-values">${field("Percent shaded", "percent", lab.percent, 0, 100)}<div class="percent-equivalent"><strong>${lab.percent}%</strong><span>= ${math(`${lab.percent}/100`)}</span><span>= ${pretty(lab.percent / 100)}</span></div><p>One idea, three ways.<br>A percentage, a fraction, a decimal.</p></div></div><input class="wide-slider" type="range" min="0" max="100" value="${lab.percent}" data-lab="percent" aria-label="Percent shaded"><div class="try-presets"><span>Try it out</span>${[0, 25, 50, 75, 100].map((v) => button(`${v}%`, `percent:${v}`, "preset")).join("")}</div>`;
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
  return `${toolTitle("Factors & multiples", "Break them into primes. Discover what they have in common.")}<div class="tool-inputs">${field("First number", "factorA", a, 1, 1000)}${field("Second number", "factorB", b, 1, 1000)}</div><div class="factor-columns">${[
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
  return `${toolTitle("Calculator", "Try it by hand first, then use this space to check your thinking.")}<div class="calculator-layout"><form id="calculator-form" class="calculator"><label for="calc-input">Your expression</label><input id="calc-input" value="${esc(lab.calc)}" placeholder="e.g. (−3 + 5) × 2" autocomplete="off" spellcheck="false"><div class="calculator-result ${lab.calcError ? "calc-error" : ""}" aria-live="polite">${esc(lab.result || "0")}</div><div class="calculator-keys">${["C", "(", ")", "⌫", "7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "−", "0", ".", "%", "+", "±", "^", "/", "="].map((key) => button(key, `calc:${key}`, `calc-key ${key === "=" ? "equals" : ""} ${["÷", "×", "−", "+"].includes(key) ? "operator" : ""}`, 'type="button"')).join("")}</div></form><div class="calculator-guide"><span class="stat-icon">${icon("calculator")}</span><h3>A check, not a shortcut.</h3><p>Use parentheses to group things together, and ^ for powers.</p><div>${math("(-3)^2")}<span> gives 9</span></div><div>${math("-3^2")}<span> gives −9</span></div><p>Type fractions as 3/4 and mixed numbers as 1 1/2. Press Enter to calculate.</p><small>Division and multiplication follow equal priority, from left to right.</small></div></div>`;
}

function render() {
  applyAppearance(appearance);
  const activity = state.activity;
  const topic = topics.find((topic) => topic.id === activity?.topic);
  const quizModule =
    activity?.mode === "quiz-setup" ? moduleProgress(topic) : null;
  const content =
    state.view === "admin" && isAdmin()
      ? dashboard?.view() || '<div class="admin-dashboard"><h1>Activity dashboard</h1><p role="status">Loading dashboard…</p></div>'
      : activity?.mode === "quiz-setup"
      ? quizSetup(
          quizModule.completedLessons,
          quizModule.moduleLessons.length,
          state.activityScores,
        )
      : activityQuestion(activity)
        ? activityView(
            activity,
            topic?.title,
            state.activityScores,
            practiceMath,
          )
        : state.view === "lessons"
          ? state.lesson
            ? lessonView()
            : home()
          : state.view === "lab"
            ? labView()
            : state.view === "settings"
              ? settingsView()
              : progressView();
  document.querySelector("#app").innerHTML =
    header() + `<main id="main" tabindex="-1">${content}</main>`;
  syncPresenceScreen();
  document.body.classList.toggle("tools-open", overlay);
  if (overlay) {
    updateToolContext();
    if (state.view === "lab")
      document.querySelector("#lab-tools").innerHTML =
        '<div class="lab-tool-placeholder">Your tools are open beside this page. Close Quick Tools to bring them back here.</div>';
  }
  save();
}
function renderKeepingAnswer() {
  const input = document.querySelector("#answer, #activity-answer");
  const focused = input && document.activeElement === input;
  const start = input?.selectionStart,
    end = input?.selectionEnd;
  const activity = input?.id === "activity-answer" ? state.activity : null;
  render();
  if (activity && state.activity === activity) {
    const next = document.querySelector("#activity-answer");
    if (next) next.value = input.value;
  }
  if (focused) {
    const next = document.getElementById(input.id);
    next?.focus({ preventScroll: true });
    next?.setSelectionRange?.(start, end);
  }
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
  if (quizLocked()) return;
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
  if (view === "admin" && !isAdmin()) return;
  if (state.view === "admin" && view !== "admin") dashboard?.stopPresence();
  if (view === "admin" || state.view === "admin") tracker.clock?.stopSession();
  tracker.clock?.leaveActivity();
  delete state.activity;
  if (view !== "settings") {
    deleteProgressPending = false;
    deleteProgressStatus = "";
  }
  state.view = view;
  feedback = null;
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function showAdmin() {
  if (!isAdmin()) return;
  if (overlay) closeTools();
  go("admin");
  tracker.flush();
  try {
    const { createAdminDashboard } = await import("./admin-dashboard.js");
    if (!isAdmin() || state.view !== "admin") return;
    dashboard ||= createAdminDashboard({
      read: (from, until) => accounts.readPracticeActivity(from, until),
      watchPresence: (callback) => accounts.watchPresence(callback),
      redrawPresence: () => {
        if (isAdmin() && state.view === "admin") dashboard?.paintPresence(document);
      },
      redraw: (focus) => {
        if (!isAdmin() || state.view !== "admin") return;
        render();
        if (focus) document.querySelector(focus)?.focus();
      },
    });
    dashboard.load();
    dashboard.startPresence();
  } catch {
    if (isAdmin() && state.view === "admin") {
      go("lessons");
      toast("Couldn’t open the dashboard. Reload the page and try again.");
    }
  }
}
function quizLocked() {
  return (
    state.activity?.mode === "quiz" || state.activity?.mode === "quiz-setup"
  );
}

function showActivity(run) {
  if (!run) return;
  const clock = tracker.clock;
  clock?.leaveActivity();
  if (run.mode === "quiz" || run.mode === "review") {
    clock?.interact();
    if (run.mode === "quiz") clock?.startQuiz();
    clock?.openQuestion();
  }
  if (overlay) closeTools();
  state.view = "lessons";
  state.activity = run;
  feedback = null;
  render();
  window.scrollTo({ top: 0 });
  (
    document.querySelector("#activity-answer") ||
    document.querySelector("#activity-title")
  )?.focus();
}

function submitActivity(answer) {
  const update = checkActivity(state.activity, answer, state.activityScores);
  if (!update) return;
  tracker.clock?.answer(update.run.mode, {
    correct: update.run.result.correct,
    topic: update.run.topic,
    finished: activityIsOver(update.run),
  });
  state.activity = update.run;
  state.activityScores = update.scores;
  render();
  document.querySelector(".activity-feedback")?.focus();
}

function handleActivityClick(action, value) {
  if (
    quizLocked() &&
    action !== "activity-exit" &&
    action !== "activity-next" &&
    !(action === "activity-quiz" && activityIsOver(state.activity))
  )
    return false;
  if (action === "activity-review")
    showActivity(startActivity("review", value));
  else if (action === "activity-warmup")
    showActivity(startActivity("warmup", value || "integers"));
  else if (action === "activity-quiz")
    showActivity({ mode: "quiz-setup", topic: "integers" });
  else if (action === "activity-exit" && state.activity) {
    state.topic = state.activity.topic;
    state.lesson = null;
    go("lessons");
  } else if (action === "activity-next" && state.activity) {
    const next = nextActivityQuestion(state.activity);
    if (next !== state.activity && (next.mode === "review" || next.mode === "quiz")) {
      tracker.clock?.interact();
      tracker.clock?.openQuestion();
    }
    state.activity = next;
    render();
    (
      document.querySelector("#activity-answer") ||
      document.querySelector('[data-action^="activity-sign:"], [data-action^="activity-choice:"]')
    )?.focus();
  } else if ((action === "activity-sign" || action === "activity-choice") && state.activity?.mode === "warmup")
    submitActivity(value);
  else return false;
  return true;
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
  p.index = Math.max(
    0,
    Math.min(
      lessons.find((l) => l.id === state.lesson).problems.length - 1,
      index,
    ),
  );
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
  if (input.trim()) tracker.clock?.answer("lesson", { correct: feedback.correct, topic: l.topic });
  if (!feedback.correct && input.trim()) {
    p.failedChecks ||= {};
    // Two is enough to retain both unlock thresholds in local saves and exports.
    p.failedChecks[p.index] = Math.min(2, (p.failedChecks[p.index] || 0) + 1);
  }
  const newlySolved = feedback.correct && !p.solved.includes(p.index);
  if (newlySolved) {
    p.solved.push(p.index);
    state.game.streak = (Number(state.game.streak) || 0) + 1;
    state.game.best = Math.max(Number(state.game.best) || 0, state.game.streak);
  } else if (!feedback.correct) state.game.streak = 0;
  render();
  if (newlySolved && p.solved.length === l.problems.length)
    toast("Lesson complete!");
  else {
    if (newlySolved) toast("+10 leaf points. Your understanding is growing!");
    document.querySelector("#answer")?.focus();
  }
}
// Keep a pending numeric edit from replacing the clicked button on blur.
document.addEventListener("pointerdown", (e) => {
  const action = e.target.closest("[data-action]")?.dataset.action || "";
  if (
    action.startsWith("line-") &&
    document.activeElement?.matches(
      '[data-lab="a"],[data-lab="b"],[data-line-field]',
    )
  )
    e.preventDefault();
});
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (!el || el.disabled) return;
  const [action, ...rest] = el.dataset.action.split(":"),
    value = rest.join(":");
  if (deleteProgressBusy) return;
  if (handleActivityClick(action, value)) return;
  if (quizLocked()) return;
  if (accounts?.handleClick(action, value)) return;
  if (action === "view" && value === "admin") {
    showAdmin();
    return;
  }
  if (action.startsWith("admin-")) {
    if (isAdmin() && state.view === "admin") dashboard?.click(action, value);
    return;
  }
  if (action.startsWith("line-") && !commitLineInputs()) return;
  if (el.tagName === "A") e.preventDefault();
  if (action === "open-account") {
    go("settings");
    document.querySelector("#account-title")?.focus();
  } else if (action === "delete-progress" && state.view === "settings") {
    deleteProgressPending = true;
    deleteProgressStatus = "";
    render();
    document.querySelector("#cancel-delete-progress")?.focus();
  } else if (action === "cancel-delete-progress") {
    deleteProgressPending = false;
    render();
    document.querySelector('[data-action="delete-progress"]')?.focus();
  } else if (action === "confirm-delete-progress") {
    deleteAllProgress();
  } else if (action === "reset-appearance") {
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
  } else if (action === "toggle-topic") {
    expandedTopics.has(value)
      ? expandedTopics.delete(value)
      : expandedTopics.add(value);
    render();
    document.querySelector(`[data-action="toggle-topic:${value}"]`)?.focus();
  } else if (action === "lesson") openLesson(value);
  else if (action === "all-lessons") {
    state.lesson = null;
    go("lessons");
  } else if (action === "start-recommended") {
    const l =
      lessons.find(
        (l) =>
          getProgress(l.id).stage === "practice" &&
          getProgress(l.id).solved.length < l.problems.length,
      ) ||
      lessons.find(
        (l) => getProgress(l.id).solved.length < l.problems.length,
      ) ||
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
    if (!helpAvailable(p, action === "hint" ? 1 : 2)) return;
    const at = list.indexOf(p.index);
    at === -1 ? list.push(p.index) : list.splice(at, 1);
    render();
  } else if (action === "visualize-problem") {
    const l = lessons.find((l) => l.id === state.lesson);
    tool = l.tool;
    if (l.topic === "integers") {
      const expr = l.problems[getProgress(l.id).index].expr;
      const inputs = expressionToLine(expr);
      if (tool === "line" && inputs) Object.assign(lab, inputs);
      else {
        tool = "calculator";
        lab.calc = expr;
        lab.result = "";
        lab.calcError = false;
      }
    }
    openTools();
  } else if (action === "line-add") {
    lab.operations.push({ op: "+", value: 1 });
    lab.step = 0;
    rerenderTools();
  } else if (action === "line-remove") {
    const ops = lineOperations(lab);
    ops.splice(Number(value), 1);
    lab.op = ops[0].op;
    lab.b = ops[0].value;
    lab.operations = ops.slice(1);
    lab.step = 0;
    rerenderTools();
  } else if (action === "line-reset") {
    lab.step = 0;
    rerenderTools();
  } else if (action === "line-finish") {
    lab.step = null;
    rerenderTools();
  } else if (action === "line-step" || action === "line-jump") {
    lab.step = advanceLine(
      lab,
      action === "line-step" ? 1 : Math.max(10, lineData().axis.tick),
    );
    rerenderTools();
  } else if (action === "preset") {
    const [a, b, op] = value.split(",");
    Object.assign(lab, {
      a: Number(a),
      b: Number(b),
      op,
      step: 0,
      operations: [],
    });
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
  } else if (action === "generate-progress-code") {
    transferCode = exportProgressCode(state);
    transferStatus =
      "Progress code ready. Copy the entire code to your other device.";
    render();
  } else if (action === "copy-progress-code") {
    copyProgressCode();
  } else if (action === "import-progress-code") {
    try {
      restoreProgress(importProgressCode(transferDraft));
      transferStatus = "Progress imported and saved on this device.";
    } catch (e) {
      transferStatus = e.message;
    }
    render();
  } else if (action === "export-progress") {
    save();
    const backup = { ...state };
    delete backup.cloud;
    delete backup.activity;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }),
    );
    a.download = "numi-progress.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && deleteProgressPending && !deleteProgressBusy) {
    deleteProgressPending = false;
    render();
    document.querySelector('[data-action="delete-progress"]')?.focus();
  } else if (e.key === "Escape" && overlay) closeTools();
});
document.addEventListener("submit", (e) => {
  if (
    e.target.id === "quiz-start-form" &&
    state.activity?.mode === "quiz-setup"
  ) {
    e.preventDefault();
    showActivity(startActivity("quiz", "integers"));
    return;
  }
  if (e.target.id === "activity-answer-form") {
    e.preventDefault();
    submitActivity(e.target.querySelector("#activity-answer").value);
    return;
  }
  if (quizLocked()) {
    e.preventDefault();
    return;
  }
  if (e.target.id === "account-form") {
    e.preventDefault();
    accounts.submit();
  }
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
  if (e.target.id === "progress-code-input") transferDraft = e.target.value;
  if (["a", "b"].includes(e.target.dataset.lab) || e.target.dataset.lineField) {
    lab.step = 0;
    const panel = e.target.closest(".tool-panel");
    if (panel) {
      panel.querySelector(".result-pill").textContent = "?";
      panel.querySelectorAll(".operation-answer").forEach((e) => e.remove());
      panel
        .querySelectorAll(
          '[data-action="line-step"],[data-action="line-jump"],[data-action="line-finish"]',
        )
        .forEach((button) => button.removeAttribute("disabled"));
      panel
        .querySelectorAll(".interactive-line,.line-position,.line-legend")
        .forEach((e) => e.setAttribute("hidden", ""));
    }
  }
});
document.addEventListener("change", async (e) => {
  const lineIndex = e.target.dataset.lineIndex;
  if (lineIndex !== undefined) {
    const operation = lab.operations[Number(lineIndex) - 1],
      key = e.target.dataset.lineField;
    if (!operation) return;
    if (key === "op") operation.op = e.target.value;
    else {
      const n = Number(e.target.value);
      if (!Number.isFinite(n) || !e.target.value) {
        e.target.value = operation.value;
        rerenderTools();
        return;
      }
      operation.value = n;
    }
    lab.step = 0;
    rerenderTools();
    return;
  }
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
        if (key === "a" || key === "b") rerenderTools();
        return;
      }
      lab[key] = v;
    }
    lab.step = 0;
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
      const backup = JSON.parse(await file.text());
      restoreProgress({
        ...normalizeProgress(backup),
        activityScores: normalizeActivityScores(backup.activityScores),
      });
      render();
      toast("Your learning progress has been restored.");
    } catch {
      toast("That file isn’t a valid Numi progress export.");
    }
  }
});
accounts = createAccountManager({
  getState: () => state,
  replaceState: (value, accountChanged = false) => {
    state = value;
    restoreFixedQuiz(state);
    if (quizLocked() && overlay) closeTools();
    feedback = null;
    if (accountChanged) {
      if (state.view === "admin") state.view = "lessons";
      deleteProgressPending = false;
      transferCode = transferDraft = transferStatus = "";
    }
  },
  render: renderKeepingAnswer,
  onUserChanged: (user) => {
    dashboard?.dispose();
    dashboard = undefined;
    tracker.setUser(user);
    presence.setUser(user);
  },
  beforeSignOut: () => {
    tracker.flush();
    presence.leave();
  },
  onSignOutError: () => {
    presence.resume();
    syncPresenceScreen();
  },
  onStorageError: () => {
    storageFailed = true;
  },
});
render();
if (
  window.location?.protocol === "https:" ||
  window.location?.protocol === "http:"
) {
  accounts.start();
  for (const event of ["click", "input", "keydown"]) {
    document.addEventListener(event, (e) => {
      if (e.isTrusted && state.view !== "admin") tracker.clock?.interact();
    }, true);
    document.addEventListener(event, (e) => {
      if (e.isTrusted && e.target.closest?.(".lesson-layout, .activity-card, #tools-dialog")) presence.interact();
    });
  }
  function pauseTracking() {
    tracker.clock?.pause();
    tracker.flush();
    presence.setPracticeScreen(false);
  }
  function resumeTracking() {
    tracker.clock?.resume();
    syncPresenceScreen();
  }
  window.addEventListener("blur", pauseTracking);
  window.addEventListener("focus", resumeTracking);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseTracking();
    else resumeTracking();
  });
  window.addEventListener("online", () => {
    accounts.online();
    tracker.flush();
    presence.reconnect();
  });
  window.addEventListener("offline", () => accounts.offline());
  window.addEventListener("pagehide", () => {
    pauseTracking();
    presence.leave();
    accounts.flush()?.catch(() => {});
  });
  window.addEventListener("pageshow", () => {
    presence.resume();
    syncPresenceScreen();
  });
}
