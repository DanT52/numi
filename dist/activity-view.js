import { escapeHTML as esc, math } from "./math.js";
import { activityQuestion, activityIsOver } from "./activities.js";
import { signedQuizGoal } from "./activity-scores.js";

const masteryBadge =
  '<span class="quiz-mastery"><span aria-hidden="true">★</span> Mastered</span>';

const button = (text, action, primary = false) =>
  `<button type="button" class="btn ${primary ? "btn-primary" : "btn-outline"}" data-action="${action}">${text}</button>`;

export function activityLinks(topic, scores = {}) {
  const review = scores[topic] ? `Review · Best ${scores[topic]}` : "Review";
  const signed = topic === "integers";
  return `<div class="module-activities" aria-label="Module activities">
    ${button(review, `activity-review:${topic}`)}
    ${signed ? button("Warmup", "activity-warmup") : ""}
  </div>`;
}

export function quizLessonLink(passed) {
  return `<button type="button" class="lesson-link quiz-lesson-link" data-action="activity-quiz">
    <span class="lesson-number" aria-hidden="true">Q</span>
    <span><strong>Module quiz</strong><small>${signedQuizGoal} correct in a row</small></span>
    ${passed ? masteryBadge : ""}
  </button>`;
}

export function quizSetup(completed, total, scores = {}) {
  return `<section class="activity-card" aria-labelledby="activity-title">
    <div class="activity-heading">
      <h1 id="activity-title" tabindex="-1">Signed numbers quiz</h1>
      ${scores.signedQuizPassed ? masteryBadge : ""}
    </div>
    <p>Get ${signedQuizGoal} correct in a row to pass. You have one try per question, and a wrong answer ends the attempt.</p>
    <p>Hints, explanations, and visual tools are unavailable during the quiz.</p>
    <p>${
      completed === total
        ? "You’ve finished the signed numbers lessons."
        : `You’ve completed ${completed} of ${total} signed numbers lessons. Practicing first can help, and you can start the quiz anytime.`
    }</p>
    ${scores.signedQuizBest && !scores.signedQuizPassed ? `<p>Best streak <strong>${Math.min(scores.signedQuizBest, signedQuizGoal)}</strong></p>` : ""}
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
  const over = activityIsOver(run);
  const passed = quiz && over && run.result.correct;
  const heading = quiz
    ? "Signed numbers quiz"
    : warmup
      ? "Signed numbers warmup"
      : `${title} review`;
  const resultHeading = quiz
    ? passed
      ? "Quiz passed!"
      : "Quiz ended"
    : "Warmup complete";
  const answerMath =
    question.answer === null ? "undefined" : math(question.answer);
  const correctAnswer = warmup
    ? `${question.sign}${question.answer === null ? "" : ` (${answerMath})`}`
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
            : `<p>${warmup || !run.result.correct ? `Answer: ${correctAnswer}. ` : ""}${explanation ? esc(explanation) : ""}</p>`
        }
        ${warmup && over ? `<p>You got ${run.correctCount} of ${run.deck.length} rules right.</p>` : ""}
      </div>`
    : "";
  const summary = quiz
    ? `Correct in a row <strong>${run.streak} / ${run.deck.length}</strong>`
    : `Streak points <strong>${run.streak}</strong> <span>·</span> Best <strong>${scores?.[run.topic] || 0}</strong>`;

  return `<section class="activity-card" aria-labelledby="activity-title">
    <div class="activity-heading">
      <h1 id="activity-title" tabindex="-1">${esc(heading)}</h1>
      ${!warmup ? `<p class="activity-count">${summary}</p>` : ""}
    </div>
    ${
      quiz
        ? `<p class="activity-note">Question ${run.index + 1} of ${run.deck.length} · One try · Tools off</p>`
        : `<p class="activity-note">${esc(question.group)}</p>`
    }
    <p>${warmup ? "What sign is the result?" : esc(question.prompt || "Find the integer result.")}</p>
    <div class="practice-equation activity-equation">${renderMath(question)}</div>
    ${
      run.result
        ? ""
        : warmup
          ? `<div class="activity-actions" role="group" aria-label="Result choices">
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
        ${!quiz && answerFormat(question) ? `<small id="activity-answer-tip">${answerFormat(question)}</small>` : ""}
        <div class="activity-answer-row">
          <input id="activity-answer" name="answer" type="text" autocomplete="off" maxlength="500" required
            ${!quiz && answerFormat(question) ? 'aria-describedby="activity-answer-tip"' : ""}>
          <button type="submit" class="btn btn-primary">Check answer</button>
        </div>
      </form>`
    }
    ${feedback}
    <div class="activity-actions">
      ${run.result && !over ? button("Next question", "activity-next", true) : ""}
      ${over ? button(quiz ? "Try a new quiz" : "Restart warmup", quiz ? "activity-quiz" : "activity-warmup", true) : ""}
      ${button(over ? "Back to lessons" : quiz ? "End quiz" : warmup ? "End warmup" : "End review", "activity-exit")}
    </div>
  </section>`;
}
