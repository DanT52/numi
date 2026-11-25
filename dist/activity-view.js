import { escapeHTML as esc, math } from "./math.js";
import { activityQuestion, activityIsOver } from "./activities.js";
import { quizGoal } from "./activity-scores.js";

const masteryBadge =
  '<span class="quiz-mastery"><span aria-hidden="true">★</span> Mastered</span>';

const button = (text, action, primary = false) =>
  `<button type="button" class="btn ${primary ? "btn-primary" : "btn-outline"}" data-action="${action}">${text}</button>`;

export function activityLinks(topic, scores = {}) {
  const review = scores[topic] ? `Review · Best ${scores[topic]}` : "Review";
  return `<div class="module-activities" aria-label="Module activities">
    ${button(review, `activity-review:${topic}`)}
    ${topic === "integers" ? button("Warmup", "activity-warmup") : topic === "pemdas" ? button("Warmup", "activity-warmup:pemdas") : ""}
  </div>`;
}

const quizAction = (topic) => topic === "integers" ? "activity-quiz" : `activity-quiz:${topic}`;

export function quizLessonLink(topic, passed) {
  return `<button type="button" class="lesson-link quiz-lesson-link" data-action="${quizAction(topic)}">
    <span class="lesson-number" aria-hidden="true">Q</span>
    <span><strong>Module quiz</strong><small>${quizGoal} correct in a row</small></span>
    ${passed ? masteryBadge : ""}
  </button>`;
}

export function quizSetup(topic, completed, total, scores = {}) {
  const passed = scores[topic.quizPassKey];
  const best = scores[topic.quizBestKey];
  return `<section class="activity-card" aria-labelledby="activity-title">
    <div class="activity-heading">
      <h1 id="activity-title" tabindex="-1">${esc(topic.title)} quiz</h1>
      ${passed ? masteryBadge : ""}
    </div>
    <p>Get ${quizGoal} correct in a row to pass. You have one try per question, and a wrong answer ends the attempt.</p>
    <p>Hints, explanations, and visual tools are unavailable during the quiz.</p>
    <p>${
      completed === total
        ? "You’ve finished all the lessons in this module."
        : `You’ve completed ${completed} of ${total} lessons. Practicing first can help, and you can start the quiz anytime.`
    }</p>
    ${best && !passed ? `<p>Best streak <strong>${Math.min(best, quizGoal)}</strong></p>` : ""}
    <form id="quiz-start-form" class="activity-form">
      <button type="submit" class="btn btn-primary">Start quiz</button>
    </form>
    <div class="activity-actions">${button("Back to lessons", "activity-exit")}</div>
  </section>`;
}

function answerFormat(question) {
  return (
    {
      prime: "Enter a product of prime factors, such as 2^3 * 3.",
      fraction: "Enter a fraction, such as 3/4.",
      simplified: "Enter a fraction in lowest terms.",
      mixed: "Enter a mixed number, such as 1 1/2.",
      decimal: "Enter a decimal.",
      percent: "Enter a percentage, such as 75% or 75.",
    }[question.type] || ""
  );
}

export function activityView(run, title, scores, renderMath) {
  const question = activityQuestion(run);
  const quiz = run.mode === "quiz",
    warmup = run.mode === "warmup";
  const orderWarmup = warmup && !!question.choices;
  const over = activityIsOver(run);
  const passed = quiz && over && run.result.correct;
  const heading = quiz
    ? `${title} quiz`
    : warmup
      ? `${orderWarmup ? "Order of operations" : "Signed numbers"} warmup`
      : `${title} review`;
  const resultHeading = quiz
    ? passed
      ? "Quiz passed!"
      : "Quiz ended"
    : "Warmup complete";
  const operationMath = (expr) => math(expr, { inlineDivision: true });
  const answerMath = orderWarmup ? operationMath(question.first)
    : question.answer === null ? "undefined" : math(question.answer);
  const correctAnswer = warmup
    ? orderWarmup ? answerMath : `${question.sign}${question.answer === null ? "" : ` (${answerMath})`}`
    : `${answerMath}${question.type === "percent" ? "%" : ""}`;
  const explanation = question.explanation || question.solution;
  const feedback = run.result
    ? `<div class="activity-feedback" tabindex="-1" aria-live="polite">
        <strong>${over ? resultHeading : run.result.correct ? "Correct!" : warmup ? "Not quite." : "Incorrect. Streak reset."}</strong>
        ${
          quiz
            ? !over
              ? ""
              : passed
                ? `<p>You answered ${run.streak} questions correctly in a row.</p>`
                : `<p>You got ${run.correctCount} in a row. The correct answer was ${correctAnswer}.</p>`
            : orderWarmup && run.result.correct ? "" : `<p>${warmup || !run.result.correct ? `Answer: ${correctAnswer}. ` : ""}${explanation ? esc(explanation) : ""}</p>`
        }
        ${warmup && over ? `<p>You got ${run.correctCount} of ${run.deck.length} ${orderWarmup ? "questions" : "rules"} right.</p>` : ""}
      </div>`
    : "";
  const summary = quiz
    ? `Correct in a row <strong>${run.streak} / ${run.deck.length}</strong>`
    : `Streak points <strong>${run.streak}</strong> <span>·</span> Best <strong>${scores?.[run.topic] || 0}</strong>`;
  const answerTip = quiz ? (run.topic === "pemdas" ? "Enter a number, such as −4 or 3.25." : "") : answerFormat(question);

  return `<section class="activity-card" aria-labelledby="activity-title">
    <div class="activity-heading">
      <h1 id="activity-title" tabindex="-1">${esc(heading)}</h1>
      ${!warmup ? `<p class="activity-count">${summary}</p>` : ""}
    </div>
    ${
      quiz
        ? `<p class="activity-note">Question ${run.index + 1} of ${run.deck.length} · One try · Tools off</p>`
        : orderWarmup ? "" : `<p class="activity-note">${esc(question.group)}</p>`
    }
    <p>${esc(question.prompt || (warmup ? "What sign is the result?" : "Find the result."))}</p>
    <div class="practice-equation activity-equation">${orderWarmup ? operationMath(question.expr) : renderMath(question)}</div>
    ${
      run.result
        ? ""
        : warmup
          ? orderWarmup ? `<div class="activity-actions" role="group" aria-label="Operation choices">
      ${(run.choiceOrders?.[run.index] || question.choices)
        .map((choice) => button(operationMath(choice), `activity-choice:${esc(choice)}`)).join("")}</div>`
          : `<div class="activity-actions" role="group" aria-label="Result choices">
      ${["positive", "negative", "zero", "undefined"]
        .map((sign) =>
          button(
            sign[0].toUpperCase() + sign.slice(1),
            `activity-sign:${sign}`,
          ),
        )
        .join("")}</div>`
          : `<form id="activity-answer-form" class="activity-form">
        <label for="activity-answer">Your answer</label>
        ${answerTip ? `<small id="activity-answer-tip">${answerTip}</small>` : ""}
        <div class="activity-answer-row">
          <input id="activity-answer" name="answer" type="text" autocomplete="off" maxlength="500" required
            ${answerTip ? 'aria-describedby="activity-answer-tip"' : ""}>
          <button type="submit" class="btn btn-primary">Check answer</button>
        </div>
      </form>`
    }
    ${feedback}
    <div class="activity-actions">
      ${run.result && !over ? button("Next question", "activity-next", true) : ""}
      ${over ? button(quiz ? "Try a new quiz" : "Restart warmup", quiz ? quizAction(run.topic) : orderWarmup ? "activity-warmup:pemdas" : "activity-warmup", true) : ""}
      ${button(over ? "Back to lessons" : quiz ? "End quiz" : warmup ? "End warmup" : "End review", "activity-exit")}
    </div>
  </section>`;
}
