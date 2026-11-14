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
    assert.equal(document.querySelectorAll(".example-steps li").length, 3);
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
      assert.deepEqual(persisted().progress["integers-1"].solved, [0]);
      click("next-question");
      type("#answer", "4");
      submit("#answer-form");
      assert.ok(document.querySelector(".feedback.retry"));
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
      assert.ok(document.querySelector("dialog[open]"));
      click("tool:counters");
      click("cancel-pairs");
      assert.equal(document.querySelectorAll(".counter.positive").length, 2);
      assert.equal(document.querySelectorAll(".counter.negative").length, 0);
      click("zero-pair");
      assert.equal(document.querySelectorAll(".counter.positive").length, 3);
      assert.equal(document.querySelectorAll(".counter.negative").length, 1);
      click("close-tools");
      assert.equal(document.querySelector("dialog"), null);
      assert.equal(document.querySelector("#answer").value, "-3");
    },
  );
  await t.test("number line computes all operations and steps", () => {
    click("view:lab");
    click("tool:line");
    click("preset:4,-3,-");
    assert.equal(document.querySelector(".result-pill").textContent, "7");
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
    click("preset:-2,-3,*");
    assert.equal(document.querySelector(".result-pill").textContent, "6");
    change("op", "/");
    change("b", 0);
    assert.equal(
      document.querySelector(".result-pill").textContent,
      "undefined",
    );
    change("b", 2);
    assert.equal(document.querySelector(".result-pill").textContent, "−1");
  });
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
        if (document.querySelector('[data-action="begin-practice"]')) click("begin-practice");
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
    "reload restores unfinished answer and question position",
    async () => {
      click("home");
      click("lesson:fractions-1");
      if (document.querySelector('[data-action="begin-practice"]')) click("begin-practice");
      click("question:4");
      type("#answer", "3 3/4");
      mount();
      await import("../dist/app.js?reload");
      assert.equal(document.querySelector("#answer").value, "3 3/4");
      assert.match(
        document.querySelector(".workspace-top").textContent,
        /PROBLEM 5 OF 8/,
      );
    },
  );
});
