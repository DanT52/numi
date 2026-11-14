import test from "node:test";
import assert from "node:assert/strict";
import { parseHTML } from "linkedom";
import { lessons } from "../dist/lessons.js";

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
  const el = Array.from(document.querySelectorAll("[data-action]")).find(
    (el) => el.dataset.action === action,
  );
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

test("lesson, persistence, visual tools, and calculator user flows", async (t) => {
  mount();
  await import("../dist/app.js");
  await t.test("catalog has all eight lessons and future curriculum", () => {
    assert.equal(document.querySelectorAll(".topic-card").length, 4);
    assert.equal(document.querySelectorAll(".lesson-link").length, 8);
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
    assert.match(
      document.querySelector(".line-step-controls").textContent,
      /0 \/ 3/,
    );
    click("line-step");
    assert.match(
      document.querySelector(".line-step-controls").textContent,
      /1 \/ 3/,
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
        "−7500",
        "Large inputs move by the 5000-unit tick",
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
        for (let i = 0; i < 8; i++) {
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
      click("view:progress");
      assert.match(document.querySelector(".stats-grid").textContent, /64/);
      assert.match(document.querySelector(".stats-grid").textContent, /100/);
      assert.equal(
        lessons.filter((l) => persisted().progress[l.id].solved.length === 8)
          .length,
        8,
      );
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
      click("lesson:fractions-1");
      if (document.querySelector('[data-action="begin-practice"]'))
        click("begin-practice");
      click("question:4");
      type("#answer", "3 3/4");
      mount();
      await import("../dist/app.js?reload");
      assert.equal(document.querySelector("#answer").value, "3 3/4");
      assert.match(
        document.querySelector(".workspace-top").textContent,
        /PROBLEM 5 OF 8/,
      );
      assert.equal(
        persisted().progress["integers-1"].solved.length,
        8,
        "Existing locally saved lessons survive the upgrade and reload",
      );
      assert.equal(document.documentElement.dataset.theme, "matcha");
    },
  );
  await t.test(
    "fraction guide shows equivalent fractions for all four operations and mixed numbers",
    () => {
      click("home");
      click("lesson:fractions-1");
      click("example");
      assert.ok(document.querySelectorAll(".step-equation mfrac").length >= 20);
      assert.equal(
        document.querySelectorAll(".more-examples details").length,
        4,
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
      assert.match(code, /^NUMI1\./);
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
        lessons.filter((l) => persisted().progress[l.id].solved.length === 8)
          .length,
        8,
      );
      assert.match(
        document.querySelector(".transfer-status").textContent,
        /imported and saved/,
      );
      assert.equal(persisted().progress["fractions-1"].answers[4], "3 3/4");
    },
  );
});
