import test from "node:test";
import assert from "node:assert/strict";
import { parseHTML } from "linkedom";
import { lessons, totalProblems } from "../dist/lessons.js";
import { legacyThreeNumberExpressions } from "../dist/lessons/signed-numbers/legacy-three-number-questions.js";
import { calculate } from "../dist/math.js";
import { activityQuestion } from "../dist/activities.js";

const stored = new Map();
globalThis.localStorage = {
  getItem: (key) => stored.get(key) || null,
  setItem: (key, value) => stored.set(key, value),
};
function mount() {
  const { window } = parseHTML(
    '<!doctype html><html><body><div id="app"></div><div id="overlay-root"></div><div id="toast"></div></body></html>',
  );
  window.scrollTo = () => {};
  window.HTMLElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  window.HTMLElement.prototype.close = function () {
    this.removeAttribute("open");
    this.dispatchEvent(new window.Event("close"));
  };
  globalThis.window = window;
  globalThis.document = window.document;
}
function click(action) {
  let el = Array.from(document.querySelectorAll("[data-action]")).find(
    (el) => el.dataset.action === action,
  );
  if (!el && action.startsWith("lesson:")) {
    const lesson = lessons.find((l) => l.id === action.slice(7));
    const expand =
      lesson &&
      document.querySelector(
        `[data-action="toggle-topic:${lesson.topic}"][aria-expanded="false"]`,
      );
    if (expand) {
      click(`toggle-topic:${lesson.topic}`);
      el = Array.from(document.querySelectorAll("[data-action]")).find(
        (el) => el.dataset.action === action,
      );
    }
  }
  assert.ok(el, "Action exists: " + action);
  assert.ok(!el.disabled, "Action is enabled: " + action);
  el.dispatchEvent(
    new window.Event("click", { bubbles: true, cancelable: true }),
  );
}
function type(selector, value) {
  const input = document.querySelector(selector);
  assert.ok(input, selector);
  input.value = value;
  input.dispatchEvent(new window.Event("input", { bubbles: true }));
}
function change(key, value) {
  const input = document.querySelector(`[data-lab="${key}"]`);
  assert.ok(input);
  if (input.tagName === "SELECT") {
    for (const option of input.options) {
      if (option.value === String(value)) option.setAttribute("selected", "");
      else option.removeAttribute("selected");
    }
  } else input.value = String(value);
  input.dispatchEvent(new window.Event("change", { bubbles: true }));
}
function submit(id) {
  document
    .querySelector(id)
    .dispatchEvent(
      new window.Event("submit", { bubbles: true, cancelable: true }),
    );
}
const persisted = () => JSON.parse(stored.get("numi.progress.v1"));

test("PEMDAS warmup offers shuffled choices and explains a wrong first step", async () => {
  stored.clear();
  mount();
  await import("../dist/app.js?pemdas-warmup");
  assert.equal(document.querySelector('[data-action="view:admin"]'), null);
  const attemptedAdminLink = document.createElement("button");
  attemptedAdminLink.dataset.action = "view:admin";
  document.body.append(attemptedAdminLink);
  click("view:admin");
  assert.equal(document.querySelector(".admin-dashboard"), null);

  click("activity-warmup:pemdas");
  const { activity } = persisted();
  const first = activityQuestion(activity);
  assert.equal(activity.topic, "pemdas");
  assert.equal(new Set(activity.deck).size, 14);
  assert.match(document.querySelector("#activity-title").textContent, /Order of operations warmup/);
  assert.equal(document.querySelector(".activity-count"), null);
  assert.equal(document.querySelectorAll('[aria-label="Operation choices"] button').length, first.choices.length);
  click(`activity-choice:${first.choices.find((choice) => choice !== first.first)}`);
  assert.match(document.querySelector(".activity-feedback").textContent, /Not quite/);
  assert.ok(document.querySelector(".activity-feedback").textContent.includes(first.explanation));
  click("activity-next");
  click(`activity-choice:${activityQuestion(persisted().activity).first}`);
  assert.match(document.querySelector(".activity-feedback").textContent, /Correct!/);
});

test("quiz locks tools, records only one answer per question, and saves a pass", async () => {
  stored.clear();
  mount();
  await import("../dist/app.js?quiz");
  const before = persisted().progress;
  click("open-tools");
  click("activity-quiz");
  assert.match(
    document.querySelector(".activity-card").textContent,
    /completed 0 of 6/,
  );
  assert.equal(document.querySelector("#tools-dialog"), null);
  assert.equal(document.querySelector('[data-action="open-tools"]'), null);
  assert.equal(document.querySelector('[data-action="view:lab"]'), null);
  assert.match(
    document.querySelector(".activity-card").textContent,
    /Get 10 correct in a row/,
  );
  assert.equal(document.querySelector("#quiz-start-form select"), null);
  submit("#quiz-start-form");
  assert.equal(persisted().activity.deck.length, 10);
  submit("#activity-answer-form"); // An empty submit does not consume the attempt.
  assert.equal(persisted().activity.index, 0);
  assert.equal(persisted().activity.result, null);
  const form = document.querySelector("#activity-answer-form");
  type("#activity-answer", "99999");
  submit("#activity-answer-form");
  assert.equal(document.querySelector("#activity-answer-form"), null);
  assert.match(
    document.querySelector(".activity-feedback").textContent,
    /Quiz ended/,
  );
  form.dispatchEvent(
    new window.Event("submit", { bubbles: true, cancelable: true }),
  );
  assert.equal(persisted().activity.correctCount, 0);
  mount();
  await import("../dist/app.js?quiz-reload");
  assert.match(
    document.querySelector(".activity-feedback").textContent,
    /Quiz ended/,
  );
  assert.equal(document.querySelector("#activity-answer-form"), null);

  click("activity-quiz");
  submit("#quiz-start-form");
  const coverage = new Set();
  for (let i = 0; i < 10; i++) {
    const question = activityQuestion(persisted().activity);
    coverage.add(question.group);
    type("#activity-answer", question.answer);
    submit("#activity-answer-form");
    if (i < 9) click("activity-next");
  }
  assert.equal(coverage.size, 10);
  assert.match(
    document.querySelector(".activity-feedback").textContent,
    /Quiz passed/,
  );
  assert.deepEqual(persisted().activityScores, {
    signedQuizBest: 10,
    signedQuizPassed: 10,
  });
  assert.deepEqual(persisted().progress, before);
  click("activity-exit");
  assert.match(
    document.querySelector('[data-action="activity-quiz"] .quiz-mastery')
      .textContent,
    /★ Mastered/,
  );
  assert.doesNotMatch(
    document
      .querySelector("#lessons-integers")
      .closest(".topic-card")
      .querySelector(".card-bottom").textContent,
    /Module complete/,
  );
  mount();
  await import("../dist/app.js?quiz-mastery-reload");
  assert.match(
    document.querySelector('[data-action="activity-quiz"]').textContent,
    /Mastered/,
  );
});

test("review is available in each module and warmup explains sign choices", async () => {
  stored.clear();
  mount();
  await import("../dist/app.js?review");
  assert.equal(
    document.querySelectorAll('[data-action^="activity-review:"]').length,
    4,
  );
  click("activity-review:integers");
  assert.ok(document.querySelector('[data-action="open-tools"]'));
  for (let i = 0; i < 2; i++) {
    type("#activity-answer", activityQuestion(persisted().activity).answer);
    submit("#activity-answer-form");
    click("activity-next");
  }
  type("#activity-answer", "99999");
  submit("#activity-answer-form");
  assert.equal(persisted().activity.streak, 0);
  assert.equal(persisted().activityScores.integers, 2);
  click("activity-exit");
  assert.match(
    document.querySelector('[data-action="activity-review:integers"]')
      .textContent,
    /Best 2/,
  );
  click("activity-warmup");
  assert.equal(document.querySelector(".activity-count"), null);
  const rule = activityQuestion(persisted().activity);
  click(`activity-sign:${rule.sign}`);
  assert.ok(
    document
      .querySelector(".activity-feedback")
      .textContent.includes(rule.explanation),
  );
  assert.equal(persisted().activity.correctCount, 1);
  click("activity-next");
  assert.equal(persisted().activity.index, 1);
  stored.clear();
});

test("lesson, persistence, visual tools, and calculator user flows", async (t) => {
  stored.clear();
  mount();
  await import("../dist/app.js");
  await t.test("catalog has all lessons and future curriculum", () => {
    assert.equal(document.querySelectorAll(".topic-card").length, 4);
    assert.equal(
      document.querySelectorAll("#lessons-fractions .lesson-link").length,
      3,
    );
    assert.ok(
      !document
        .querySelector("#lessons-fractions")
        .textContent.includes("Step 1 of 7"),
    );
    const before = JSON.stringify(persisted().progress);
    click("toggle-topic:fractions");
    click("toggle-topic:integers");
    assert.equal(
      document.querySelectorAll('[data-action^="lesson:"]').length,
      lessons.length,
    );
    assert.equal(
      document.querySelector("#lessons-integers").lastElementChild.dataset
        .action,
      "activity-quiz",
    );
    assert.equal(
      document
        .querySelector('[data-action="toggle-topic:fractions"]')
        .getAttribute("aria-expanded"),
      "true",
    );
    click("toggle-topic:fractions");
    click("toggle-topic:integers");
    assert.equal(
      document.querySelectorAll("#lessons-fractions .lesson-link").length,
      3,
    );
    assert.equal(
      JSON.stringify(persisted().progress),
      before,
      "Expanding and collapsing does not change saved lesson progress",
    );
    assert.equal(document.querySelectorAll(".future-card").length, 2);
    assert.match(document.body.textContent, /To be added/);
    click("filter:integers");
    assert.equal(document.querySelectorAll(".topic-card").length, 1);
    click("filter:all");
  });
  await t.test("worked example opens before practice", () => {
    click("lesson:integers-1");
    assert.match(document.body.textContent, /Start with an example/);
    assert.ok(document.querySelectorAll(".example-steps li").length >= 3);
    assert.ok(document.querySelector(".step-equation math"));
    click("begin-practice");
    assert.ok(document.querySelector("#answer"));
    assert.equal(document.querySelector('[data-action="hint"]'), null);
    assert.equal(document.querySelector('[data-action="reveal"]'), null);
  });
  await t.test(
    "typed answers survive tab changes; checks support retries",
    () => {
      type("#answer", "2");
      click("view:lab");
      click("view:lessons");
      assert.equal(document.querySelector("#answer").value, "2");
      submit("#answer-form");
      assert.ok(document.querySelector(".feedback.success"));
      assert.ok(
        document.querySelector('.lesson-companion img[src="assets/happy.svg"]'),
      );
      assert.deepEqual(persisted().progress["integers-1"].solved, [0]);
      const earned = persisted().game.streak;
      submit("#answer-form");
      assert.equal(
        persisted().game.streak,
        earned,
        "Rechecking a solved answer does not award another streak point",
      );
      click("next-question");
      type("#answer", "4");
      submit("#answer-form");
      assert.ok(document.querySelector(".feedback.retry"));
      assert.ok(
        document.querySelector('.lesson-companion img[src="assets/sad.svg"]'),
      );
      click("hint");
      assert.match(document.querySelector(".hint-box").textContent, /negative/);
      assert.equal(document.querySelector('[data-action="reveal"]'), null);
      submit("#answer-form");
      assert.ok(document.querySelector('[data-action="reveal"]'));
      click("reveal");
      assert.ok(document.querySelector(".solution-answer"));
      assert.equal(persisted().progress["integers-1"].failedChecks[1], 2);
      type("#answer", "-3");
      submit("#answer-form");
      assert.ok(document.querySelector(".feedback.success"));
    },
  );
  await t.test(
    "tools overlay preserves lesson answers and supports zero pairs",
    () => {
      click("open-tools");
      assert.ok(document.querySelector('#tools-dialog[role="region"]'));
      assert.ok(document.body.classList.contains("tools-open"));
      assert.ok(
        document.querySelector("#answer"),
        "Lesson remains interactive beside the panel",
      );
      assert.match(
        document.querySelector("#tools-context").textContent,
        /PROBLEM 2/,
      );
      type("#answer", "-3");
      submit("#answer-form");
      assert.ok(
        document.querySelector("#tools-dialog"),
        "Checking a lesson answer keeps tools open",
      );
      click("tool:counters");
      click("cancel-pairs");
      assert.equal(document.querySelectorAll(".counter.positive").length, 2);
      assert.equal(document.querySelectorAll(".counter.negative").length, 0);
      click("zero-pair");
      assert.equal(document.querySelectorAll(".counter.positive").length, 3);
      assert.equal(document.querySelectorAll(".counter.negative").length, 1);
      click("close-tools");
      assert.equal(document.querySelector("#tools-dialog"), null);
      assert.equal(document.querySelector("#answer").value, "-3");
    },
  );
  await t.test("number line computes all operations and steps", () => {
    click("view:lab");
    click("tool:line");
    click("preset:4,-3,-");
    assert.equal(document.querySelector(".result-pill").textContent, "?");
    assert.match(
      document.querySelector(".interactive-line").getAttribute("aria-label"),
      /Final result hidden/,
    );
    assert.equal(document.querySelectorAll(".operation-answer").length, 0);
    click("line-reset");
    assert.equal(
      document.querySelector(".line-position strong").textContent,
      "4",
    );
    click("line-step");
    assert.match(
      document.querySelector('[data-action="line-step"]').textContent,
      /\(1\)/,
    );
    assert.equal(
      document.querySelector(".line-position strong").textContent,
      "5",
    );
    assert.equal(document.querySelector(".result-pill").textContent, "?");
    click("line-step");
    click("line-step");
    assert.equal(document.querySelector(".result-pill").textContent, "7");
    change("a", -2);
    change("b", -3);
    change("op", "*");
    assert.equal(document.querySelector(".result-pill").textContent, "?");
    click("line-finish");
    assert.equal(document.querySelector(".result-pill").textContent, "6");
    change("op", "/");
    change("b", 0);
    assert.equal(
      document.querySelector(".result-pill").textContent,
      "undefined",
    );
    change("b", 2);
    assert.equal(document.querySelector(".result-pill").textContent, "?");
    click("line-finish");
    assert.equal(document.querySelector(".result-pill").textContent, "−1");
  });
  await t.test(
    "number line supports chained operations and tick-sized steps",
    () => {
      click("preset:-3,5,+");
      click("line-add");
      function extra(field, value) {
        const input = document.querySelector(
          `[data-line-index="1"][data-line-field="${field}"]`,
        );
        if (input.tagName === "SELECT")
          for (const option of input.options)
            option.value === value
              ? option.setAttribute("selected", "")
              : option.removeAttribute("selected");
        else input.value = String(value);
        input.dispatchEvent(new window.Event("change", { bubbles: true }));
      }
      extra("op", "*");
      extra("value", 4);
      assert.equal(document.querySelectorAll(".line-operation").length, 2);
      assert.equal(document.querySelector(".result-pill").textContent, "?");
      for (let i = 0; i < 5; i++) click("line-step");
      assert.equal(
        document.querySelector(".line-position strong").textContent,
        "2",
      );
      assert.equal(
        document.querySelector(".result-pill").textContent,
        "?",
        "Intermediate result does not reveal final answer",
      );
      assert.equal(document.querySelectorAll(".operation-answer").length, 1);
      click("line-finish");
      assert.equal(document.querySelector(".result-pill").textContent, "8");
      click("line-remove:1");
      assert.equal(document.querySelectorAll(".line-operation").length, 1);
      assert.equal(document.querySelector(".result-pill").textContent, "?");
      click("preset:-12500,30000,+");
      click("line-step");
      assert.equal(
        document.querySelector(".line-position strong").textContent,
        "−12499",
        "The default step moves one unit even with a 5000-unit tick",
      );
      click("line-jump");
      assert.equal(
        document.querySelector(".line-position strong").textContent,
        "−7499",
        "Larger jumps can be combined with unit steps",
      );
      click("line-step");
      assert.equal(
        document.querySelector(".line-position strong").textContent,
        "−7498",
        "Default steps remain one after a larger jump",
      );
      assert.equal(document.querySelector(".result-pill").textContent, "?");
      click("line-finish");
      assert.equal(document.querySelector(".result-pill").textContent, "17500");
      type('[data-lab="b"]', "20000");
      assert.equal(
        document.querySelector(".result-pill").textContent,
        "?",
        "Editing an already revealed result masks it immediately",
      );
      click("line-finish");
      assert.equal(
        document.querySelector(".result-pill").textContent,
        "7500",
        "Step controls commit the typed input without requiring a separate blur",
      );
    },
  );
  await t.test(
    "fraction, percentage, and factor aids respond to inputs",
    () => {
      click("tool:fractions");
      click("fraction:7,4");
      assert.equal(document.querySelectorAll(".fraction-row").length, 2);
      assert.equal(
        document.querySelectorAll(".fraction-piece.filled").length,
        7,
      );
      click("tool:percent");
      click("percent:25");
      assert.equal(document.querySelectorAll(".grid-cell.filled").length, 25);
      click("tool:factors");
      assert.equal(
        document.querySelector(".factor-results strong").textContent,
        "12",
      );
      assert.equal(
        document.querySelectorAll(".factor-results strong")[1].textContent,
        "72",
      );
      change("factorA", 1);
      assert.match(
        document.querySelector(".prime-chips").textContent,
        /no prime factors/,
      );
    },
  );
  await t.test("calculator supports typed expressions and errors", () => {
    click("tool:calculator");
    type("#calc-input", "-3^2+(-3)^2");
    submit("#calculator-form");
    assert.equal(document.querySelector(".calculator-result").textContent, "0");
    type("#calc-input", "1/0");
    submit("#calculator-form");
    assert.match(document.querySelector(".calc-error").textContent, /zero/);
    click("calc:C");
    click("calc:7");
    click("calc:×");
    click("calc:8");
    click("calc:=");
    assert.equal(
      document.querySelector(".calculator-result").textContent,
      "56",
    );
  });
  await t.test(
    "every lesson can reach completion and aggregate progress is accurate",
    () => {
      click("home");
      for (const lesson of lessons) {
        click("lesson:" + lesson.id);
        if (document.querySelector('[data-action="begin-practice"]'))
          click("begin-practice");
        for (let i = 0; i < lesson.problems.length; i++) {
          click("question:" + i);
          type("#answer", lesson.problems[i].answer);
          submit("#answer-form");
          assert.ok(
            document.querySelector(".feedback.success"),
            lesson.id + " problem " + i,
          );
        }
        click("all-lessons");
      }
      const signedStatus = () =>
        document
          .querySelector("#lessons-integers")
          .closest(".topic-card")
          .querySelector(".card-bottom").textContent;
      assert.match(signedStatus(), /Quiz remaining/);
      assert.equal(
        document.querySelector('[data-module="integers"] .path-node.done'),
        null,
      );
      assert.ok(
        document.querySelector('[data-module="fractions"] .path-node.done'),
      );
      click("view:progress");
      assert.match(document.querySelector(".stats-grid").textContent, new RegExp(String(totalProblems)));
      assert.match(
        document.querySelector(".stats-grid").textContent,
        /3\s*\/ 4Modules completed/,
      );
      assert.equal(
        lessons.filter(
          (l) => persisted().progress[l.id].solved.length === l.problems.length,
        ).length,
        lessons.length,
      );
      click("home");
      click("activity-quiz");
      submit("#quiz-start-form");
      for (let i = 0; i < 10; i++) {
        type("#activity-answer", activityQuestion(persisted().activity).answer);
        submit("#activity-answer-form");
        if (i < 9) click("activity-next");
      }
      click("activity-exit");
      assert.match(signedStatus(), /Module complete/);
      assert.ok(
        document.querySelector('[data-module="integers"] .path-node.done'),
      );
      click("view:progress");
      assert.match(
        document.querySelector(".stats-grid").textContent,
        /4\s*\/ 4Modules completed/,
      );
      click("home");
      click("filter:all");
      click("view:progress");
    },
  );
  await t.test(
    "large fractions and number-line inputs stay exact without creating huge diagrams",
    () => {
      click("view:lab");
      click("tool:fractions");
      click("fraction:33,75");
      assert.equal(document.querySelectorAll(".fraction-piece").length, 75);
      assert.equal(
        document.querySelectorAll(".fraction-piece.filled").length,
        33,
      );
      change("num", 12345);
      change("den", 75000);
      assert.match(
        document.querySelector(".grouped-fraction").textContent,
        /12,345 \/ 75,000/,
      );
      change("num", 1000000);
      change("den", 1);
      assert.ok(document.querySelectorAll(".fraction-row").length <= 2);
      assert.match(
        document.querySelector(".fraction-row").textContent,
        /1,000,000/,
      );
      click("tool:line");
      change("a", -1000000000);
      change("b", 2500000000);
      change("op", "+");
      assert.equal(document.querySelector(".result-pill").textContent, "?");
      click("line-finish");
      assert.equal(
        document.querySelector(".result-pill").textContent,
        "1500000000",
      );
      assert.ok(
        document.querySelectorAll(".interactive-line text").length < 30,
      );
      assert.ok(
        !/NaN|Infinity/.test(
          document.querySelector(".interactive-line").outerHTML,
        ),
      );
    },
  );
  await t.test(
    "appearance preferences apply and persist without changing lesson progress",
    () => {
      const solved = JSON.stringify(persisted().progress);
      click("view:settings");
      assert.equal(document.documentElement.dataset.theme, "matcha");
      const radio = document.querySelector(
        'input[data-setting="theme"][value="ocean"]',
      );
      radio.checked = true;
      radio.dispatchEvent(new window.Event("change", { bubbles: true }));
      assert.equal(document.documentElement.dataset.theme, "ocean");
      for (const [setting, value] of [
        ["size", "large"],
        ["weight", "bold"],
      ]) {
        const select = document.querySelector(`[data-setting="${setting}"]`);
        for (const option of select.options)
          option.value === value
            ? option.setAttribute("selected", "")
            : option.removeAttribute("selected");
        select.dispatchEvent(new window.Event("change", { bubbles: true }));
      }
      assert.equal(document.documentElement.style.fontSize, "20px");
      assert.equal(document.documentElement.dataset.textWeight, "bold");
      assert.equal(JSON.parse(stored.get("numi.appearance.v1")).theme, "ocean");
      assert.equal(JSON.stringify(persisted().progress), solved);
      click("reset-appearance");
      assert.equal(document.documentElement.dataset.theme, "matcha");
      assert.equal(document.documentElement.style.fontSize, "18px");
    },
  );
  await t.test(
    "reload restores unfinished answer and question position",
    async () => {
      click("home");
      click("lesson:fractions-mixed");
      if (document.querySelector('[data-action="begin-practice"]'))
        click("begin-practice");
      click("question:4");
      type("#answer", "3 3/4");
      mount();
      await import("../dist/app.js?reload");
      assert.equal(document.querySelector("#answer").value, "3 3/4");
      assert.match(
        document.querySelector(".workspace-top").textContent,
        /PROBLEM 5 OF 12/,
      );
      assert.equal(
        persisted().progress["integers-1"].solved.length,
        25,
        "Existing locally saved lessons survive the upgrade and reload",
      );
      assert.equal(document.documentElement.dataset.theme, "matcha");
    },
  );
  await t.test(
    "fraction addition guide shows equivalent fractions and subtraction walkthrough",
    () => {
      click("home");
      click("lesson:fractions-add-subtract");
      click("example");
      assert.ok(document.querySelectorAll(".step-equation mfrac").length >= 10);
      assert.equal(
        document.querySelectorAll(".more-examples details").length,
        1,
      );
      assert.match(
        document.querySelector(".example-steps").textContent,
        /numerator and denominator by 3/,
      );
      assert.ok(!document.body.textContent.includes("LESS ABSTRACT"));
    },
  );
  await t.test(
    "Settings exports progress codes and restores them on a new device",
    async () => {
      click("view:settings");
      click("generate-progress-code");
      const code = document.querySelector("#progress-code-output").value;
      assert.match(code, /^NUMI2\./);
      assert.ok(
        document.querySelector("#import-progress"),
        "File import is also available in Settings",
      );
      const previous = JSON.stringify(persisted().progress);
      type("#progress-code-input", "NUMI1.invalid.bad");
      click("import-progress-code");
      assert.equal(
        JSON.stringify(persisted().progress),
        previous,
        "Invalid code leaves progress untouched",
      );
      stored.delete("numi.progress.v1");
      mount();
      await import("../dist/app.js?fresh-device");
      click("view:settings");
      type("#progress-code-input", code);
      click("import-progress-code");
      assert.equal(
        lessons.filter(
          (l) => persisted().progress[l.id].solved.length === l.problems.length,
        ).length,
        lessons.length,
      );
      assert.match(
        document.querySelector(".transfer-status").textContent,
        /imported and saved/,
      );
      assert.equal(persisted().progress["fractions-mixed"].answers[4], "3 3/4");
    },
  );
  await t.test(
    "older local fraction progress opens at the matching new question",
    async () => {
      stored.set(
        "numi.progress.v1",
        JSON.stringify({
          version: 1,
          view: "lessons",
          topic: "all",
          lesson: "fractions-1",
          progress: {
            "fractions-1": {
              index: 1,
              stage: "practice",
              solved: [0, 1],
              answers: { 0: "3/4", 1: "7/12" },
              hints: [1],
              reveals: [],
            },
          },
        }),
      );
      mount();
      await import("../dist/app.js?legacy-fractions");
      assert.equal(persisted().lesson, "fractions-add-subtract");
      assert.match(
        document.querySelector(".workspace-top").textContent,
        /PROBLEM 9 OF 12/,
      );
      assert.equal(document.querySelector("#answer").value, "7/12");
      assert.deepEqual(
        persisted().progress["fractions-add-subtract"].solved,
        [0, 8],
      );
    },
  );
  await t.test(
    "old local signed progress migrates before rendering and survives another reload",
    async () => {
      stored.set(
        "numi.progress.v1",
        JSON.stringify({
          version: 1,
          view: "lessons",
          topic: "all",
          lesson: "integers-add-subtract-2",
          progress: {
            "integers-add-subtract-2": {
              index: 19,
              stage: "practice",
              solved: Array.from({ length: 20 }, (_, i) => i),
              answers: Object.fromEntries(
                legacyThreeNumberExpressions
                  .slice(0, 20)
                  .map((expr, i) => [i, String(calculate(expr))]),
              ),
              hints: [],
              reveals: [],
            },
          },
        }),
      );
      mount();
      await import("../dist/app.js?legacy-signed");
      assert.equal(persisted().lesson, "integers-add-subtract-large-3");
      assert.match(
        document.querySelector(".workspace-top").textContent,
        /PROBLEM 5 OF 25/,
      );
      assert.equal(document.querySelector("#answer").value, "-5");
      assert.equal(
        persisted().progress["integers-add-subtract-small-3"].solved.length,
        15,
      );
      assert.equal(
        persisted().progress["integers-add-subtract-large-3"].solved.length,
        5,
      );
      const before = JSON.stringify(persisted().progress);
      mount();
      await import("../dist/app.js?signed-reload");
      assert.equal(
        JSON.stringify(persisted().progress),
        before,
        "A second load must not remap or duplicate completed questions",
      );
    },
  );
});

test("help unlocks per problem and survives navigation and reload", async () => {
  stored.clear();
  mount();
  await import("../dist/app.js?help-gates");
  click("lesson:integers-1");
  click("begin-practice");
  const available = (action) =>
    !!document.querySelector(`[data-action="${action}"]`);
  submit("#answer-form");
  assert.equal(
    available("hint"),
    false,
    "Empty submissions do not unlock help",
  );
  type(
    "#answer",
    lessons.find((l) => l.id === "integers-1").problems[0].answer,
  );
  submit("#answer-form");
  assert.equal(
    available("hint"),
    false,
    "Correct submissions do not unlock help",
  );
  click("next-question");
  type("#answer", "999");
  submit("#answer-form");
  assert.equal(available("hint"), true);
  assert.equal(available("reveal"), false);
  assert.equal(
    document.querySelector(".hint-box"),
    null,
    "Hint content still requires a click",
  );
  click("view:lab");
  click("view:lessons");
  assert.equal(available("hint"), true);
  assert.equal(available("reveal"), false);
  click("next-question");
  assert.equal(available("hint"), false);
  assert.equal(available("reveal"), false);
  click("previous-question");
  submit("#answer-form");
  assert.equal(available("reveal"), true);
  assert.equal(document.querySelector(".solution-answer"), null);
  click("reveal");
  mount();
  await import("../dist/app.js?help-reload");
  assert.equal(available("hint"), true);
  assert.equal(available("reveal"), true);
  assert.ok(document.querySelector(".solution-answer"));
  assert.equal(persisted().progress["integers-1"].failedChecks[1], 2);
  click("all-lessons");
  click("lesson:integers-2");
  click("begin-practice");
  assert.equal(
    available("hint"),
    false,
    "Another lesson has its own attempt counts",
  );
});

test("Settings deletion needs confirmation, clears persisted work, and keeps appearance", async () => {
  stored.clear();
  const saved = {
    version: 1,
    view: "settings",
    topic: "all",
    lesson: "integers-1",
    game: { streak: 3, best: 6 },
    progress: {
      "integers-1": {
        index: 1,
        stage: "practice",
        solved: [0],
        answers: { 0: "2", 1: "999" },
        hints: [1],
        reveals: [1],
        failedChecks: { 1: 2 },
      },
      "fractions-simplify": {
        index: 0,
        stage: "practice",
        solved: [0],
        answers: { 0: "1/2" },
        hints: [],
        reveals: [],
      },
    },
  };
  stored.set("numi.progress.v1", JSON.stringify(saved));
  const appearance = JSON.stringify({
    theme: "ocean",
    size: "large",
    weight: "bold",
    motion: false,
  });
  stored.set("numi.appearance.v1", appearance);
  stored.set("unrelated-data", "keep me");
  mount();
  await import("../dist/app.js?delete-progress");
  click("generate-progress-code");
  const backup = document.querySelector("#progress-code-output").value;
  type("#progress-code-input", "unfinished import");
  const before = JSON.stringify(persisted());
  assert.equal(
    document.querySelector('[data-action="confirm-delete-progress"]'),
    null,
  );
  click("delete-progress");
  assert.equal(
    JSON.stringify(persisted()),
    before,
    "Opening confirmation does not delete anything",
  );
  assert.match(
    document.querySelector(".delete-confirmation").textContent,
    /cannot be undone/,
  );
  click("cancel-delete-progress");
  assert.equal(JSON.stringify(persisted()), before);
  assert.equal(document.querySelector(".delete-confirmation"), null);
  click("delete-progress");
  const escape = new window.Event("keydown", { bubbles: true });
  escape.key = "Escape";
  document.dispatchEvent(escape);
  assert.equal(document.querySelector(".delete-confirmation"), null);
  assert.equal(JSON.stringify(persisted()), before);
  click("delete-progress");
  click("view:lessons");
  click("view:settings");
  assert.equal(
    document.querySelector(".delete-confirmation"),
    null,
    "Leaving Settings cancels the pending request",
  );
  click("delete-progress");
  click("confirm-delete-progress");
  const cleared = persisted();
  assert.equal(cleared.lesson, null);
  assert.deepEqual(cleared.game, { streak: 0, best: 0 });
  for (const p of Object.values(cleared.progress)) {
    assert.equal(p.index, 0);
    assert.equal(p.stage, "example");
    assert.deepEqual(p.solved, []);
    assert.deepEqual(p.answers, {});
    assert.deepEqual(p.hints, []);
    assert.deepEqual(p.reveals, []);
    assert.deepEqual(p.failedChecks || {}, {});
  }
  assert.equal(stored.get("numi.appearance.v1"), appearance);
  assert.equal(stored.get("unrelated-data"), "keep me");
  assert.equal(document.querySelector("#progress-code-output"), null);
  assert.equal(document.querySelector("#progress-code-input").value, "");
  assert.match(
    document.querySelector(".progress-delete").textContent,
    /All progress deleted/,
  );
  mount();
  await import("../dist/app.js?deleted-reload");
  assert.equal(
    Object.values(persisted().progress).flatMap((p) => p.solved).length,
    0,
  );
  assert.equal(document.documentElement.dataset.theme, "ocean");
  type("#progress-code-input", backup);
  click("import-progress-code");
  assert.equal(
    Object.values(persisted().progress).flatMap((p) => p.solved).length,
    2,
    "An exported NUMI2 backup can restore deleted work",
  );
});

test("failed storage writes do not report deletion or discard current progress", async () => {
  mount();
  await import("../dist/app.js?delete-storage-failure");
  click("view:settings");
  click("delete-progress");
  const before = stored.get("numi.progress.v1");
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = () => {
    throw Error("Storage unavailable");
  };
  try {
    click("confirm-delete-progress");
    assert.equal(stored.get("numi.progress.v1"), before);
    assert.match(
      document.querySelector(".progress-delete").textContent,
      /Could not delete saved progress/,
    );
    assert.ok(
      document.querySelector('[data-action="confirm-delete-progress"]'),
    );
  } finally {
    localStorage.setItem = originalSetItem;
  }
  click("cancel-delete-progress");
  assert.equal(
    Object.values(persisted().progress).flatMap((p) => p.solved).length,
    2,
  );
});
