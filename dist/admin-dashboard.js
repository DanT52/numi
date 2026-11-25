import { escapeHTML as esc } from "./math.js";
import { activityDay, activityZone, attempts, emptyStats, quizTimingFields, reviewTimingFields, reviewTimingLimit, statFields } from "./practice-stats.js";
import { onlineLearners } from "./practice-presence.js";
import { lessons, topics } from "./lessons.js";

const monthFormat = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
const dayFormat = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
const lastFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: activityZone });
const count = (value) => value.toLocaleString();
const plural = (value, word) => `${count(value)} ${word}${value === 1 ? "" : "s"}`;
const date = (key) => new Date(`${key}T00:00:00Z`);
const dateKey = (value) => value.toISOString().slice(0, 10);
const monthKey = (value) => dateKey(value).slice(0, 7);
const monthDate = (key) => date(`${key}-01`);

function adjacentMonth(key, offset) {
  const value = monthDate(key);
  value.setUTCMonth(value.getUTCMonth() + offset);
  return monthKey(value);
}

function duration(ms) {
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

const average = (ms, samples) => samples ? duration(ms / samples) : "—";

function addStats(target, source) {
  for (const field of statFields) target[field] += source[field] ?? 0;
}

const emptyLearner = (uid) => ({ uid, days: new Map(), lastAt: 0, ...emptyStats() });

export function summarizeActivity(records, summaries = []) {
  const learners = new Map();
  for (const record of records) {
    let learner = learners.get(record.uid);
    if (!learner) {
      learner = emptyLearner(record.uid);
      learners.set(record.uid, learner);
    }
    if (record.lastAt >= learner.lastAt) {
      learner.email = record.email;
      learner.lastAt = record.lastAt;
    }
    if (!learner.days.has(record.day)) learner.days.set(record.day, emptyStats());
    addStats(learner.days.get(record.day), record);
    addStats(learner, record);
  }
  for (const summary of summaries) {
    const learner = learners.get(summary.uid) ?? emptyLearner(summary.uid);
    learner.email = summary.email;
    learner.summary = summary;
    learners.set(summary.uid, learner);
  }
  return [...learners.values()].sort((a, b) => b.lastAt - a.lastAt || a.email.localeCompare(b.email));
}

const control = (label, action, disabled = false) =>
  `<button type="button" class="btn btn-outline btn-small" data-action="admin-${action}" ${disabled ? "disabled" : ""}>${label}</button>`;

const metric = (label, value, detail = "") =>
  `<div class="admin-metric"><span>${label}</span><strong>${value}</strong>${detail ? `<small>${detail}</small>` : ""}</div>`;

function bestStreak(summary) {
  return summary ? Math.max(0, ...Object.values(summary.reviewBest)) : null;
}

function learnerOverview(learner, summaryUnavailable) {
  const summary = learner.summary;
  const streak = bestStreak(summary);
  const topTopics = streak ? topics.filter(({ id }) => summary.reviewBest[id] === streak).map(({ title }) => title).join(", ") : "All topics";
  const completionDetail = summary ? "Current saved progress" : summaryUnavailable ? "Progress unavailable" : "Waiting for the learner to sync";
  return `<section class="admin-card" aria-labelledby="admin-learner-stats">
    <h2 id="admin-learner-stats">Learner stats</h2><p class="admin-account">${esc(learner.email)}</p>
    <div class="admin-overview admin-learner-overview">
      ${metric("Lessons completed", summary ? `${count(summary.completedLessons)} / ${lessons.length}` : "—", completionDetail)}
      ${metric("Best review streak", streak === null ? "—" : count(streak), `All-time · ${esc(topTopics)}`)}
      ${metric("Avg. time per review answer", average(learner.reviewMs, learner.timedReview), `Selected month · ${plural(learner.timedReview, "timed answer")}${learner.excludedReview ? ` · ${count(learner.excludedReview)} excluded` : ""}`)}
    </div>
    <p class="admin-muted">Review averages exclude answers that took more than ${reviewTimingLimit / 60_000} active minutes.</p>
  </section>`;
}

function calendar(month, learner, selectedDay) {
  const first = monthDate(month);
  const end = monthDate(adjacentMonth(month, 1));
  const leading = '<span class="admin-calendar-blank" aria-hidden="true"></span>'.repeat(first.getUTCDay());
  const cells = [];
  for (const current = new Date(first); current < end; current.setUTCDate(current.getUTCDate() + 1)) {
    const key = dateKey(current);
    const day = learner.days.get(key);
    const total = day ? attempts(day) : 0;
    const level = !day ? 0 : total >= 15 ? 4 : total >= 5 ? 3 : total ? 2 : 1;
    const label = `${dayFormat.format(current)}, ${day ? `${plural(total, "attempt")}, ${duration(day.activeMs)} active` : "no recorded activity"}`;
    cells.push(`<button type="button" class="admin-day" data-level="${level}" data-action="admin-day:${key}" aria-pressed="${key === selectedDay}" aria-label="${label}">${current.getUTCDate()}${level ? '<span aria-hidden="true">•</span>' : ""}</button>`);
  }
  return `<div class="admin-calendar" role="group" aria-label="${monthFormat.format(first)} activity calendar">
    ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => `<span class="admin-weekday">${day}</span>`).join("")}
    ${leading}${cells.join("")}</div>
    <p class="admin-calendar-legend">Darker days have more answer attempts. A dot marks a day with activity.</p>`;
}

function breakdown(stats) {
  return `<dl class="admin-breakdown">${[
    ["Lessons", stats.lesson], ["Quizzes", stats.quiz], ["Reviews", stats.review], ["Warmups", stats.warmup],
  ].map(([label, value]) => `<div><dt>${label}</dt><dd>${count(value)}</dd></div>`).join("")}</dl>`;
}

function timing(stats, topic) {
  const quiz = quizTimingFields[topic.id];
  const review = reviewTimingFields[topic.id];
  const timedQuiz = stats[quiz.answers], quizMs = stats[quiz.ms];
  const timedReview = stats[review.answers], reviewMs = stats[review.ms];
  if (topic.id !== "integers" && !timedQuiz && !timedReview && !stats[quiz.runs]) return "";
  const largest = Math.max(timedQuiz ? quizMs / timedQuiz : 0, timedReview ? reviewMs / timedReview : 0, 1);
  const bar = (label, ms, size) => {
    const width = size ? Math.floor(ms / size * 1000 / largest) / 10 : 0;
    return `<div class="admin-bar"><span>${label}</span><strong>${average(ms, size)}</strong>
      <div class="admin-bar-track" aria-hidden="true"><span style="width:${width}%"></span></div>
      <small>${plural(size, "timed answer")}</small></div>`;
  };
  return `<section class="admin-card admin-timing" aria-labelledby="admin-timing-${topic.id}">
    <h2 id="admin-timing-${topic.id}">${esc(topic.title)} quiz timing</h2>
    <p>Average active time per answer for the selected month.</p>
    <div class="admin-bars">${bar("Quiz", quizMs, timedQuiz)}${bar("Review", reviewMs, timedReview)}</div>
    <div class="admin-timing-totals">
      ${metric("Quizzes passed", `${count(stats[quiz.passes])} / ${count(stats[quiz.runs])}`, "Runs that ended in a pass or a wrong answer")}
      ${metric("Average time to pass", average(stats[quiz.passedMs], stats[quiz.timedPasses]), plural(stats[quiz.timedPasses], "timed pass"))}
    </div>
    <p class="admin-muted">Timing is approximate. Quiz and review questions can differ in difficulty, so timing alone can’t establish cheating.</p>
  </section>`;
}

function presenceBadge(status) {
  const label = { practicing: "Practicing", online: "Online", offline: "Offline", unknown: "Unknown" }[status];
  return `<span class="admin-presence-badge" data-presence-status="${status}"><span aria-hidden="true"></span>${label}</span>`;
}

export function createAdminDashboard({ read, readSummaries = async () => [], redraw, watchPresence, redrawPresence = () => {} }) {
  let month = activityDay().slice(0, 7);
  let learners = [];
  let selected = null;
  let day = null;
  let status = "loading";
  let summaryUnavailable = false;
  let request = 0;
  let presenceRecords = null;
  let live = new Map();
  let stopWatching;
  let expiryCheck;

  function updatePresence() {
    live = onlineLearners(presenceRecords ?? []);
    redrawPresence();
  }

  function stopPresence() {
    stopWatching?.();
    stopWatching = undefined;
    clearInterval(expiryCheck);
    presenceRecords = null;
    live.clear();
  }

  function badge(uid) {
    const learner = live.get(uid);
    return presenceBadge(presenceRecords === null ? "unknown" : learner ? learner.practicing ? "practicing" : "online" : "offline");
  }

  function liveList() {
    if (presenceRecords === null) return "<p>Live status is unavailable while connecting.</p>";
    if (!live.size) return "<p>No learners online right now.</p>";
    const sorted = [...live.values()].sort((a, b) => Number(b.practicing) - Number(a.practicing) || a.email.localeCompare(b.email));
    return `<ul class="admin-live-list">${sorted.map(({ uid, email }) => `<li><span>${esc(email)}</span>${badge(uid)}</li>`).join("")}</ul>`;
  }

  async function load() {
    const current = ++request;
    learners = [];
    status = "loading";
    redraw();
    try {
      const [records, summaries] = await Promise.all([
        read(`${month}-01`, `${adjacentMonth(month, 1)}-01`),
        readSummaries().catch(() => null),
      ]);
      if (current !== request) return;
      summaryUnavailable = summaries === null;
      learners = summarizeActivity(records, summaries ?? []);
      if (!learners.some((learner) => learner.uid === selected)) selected = learners[0]?.uid;
      status = "ready";
    } catch {
      if (current !== request) return;
      status = "error";
    }
    redraw();
  }

  return {
    load,
    startPresence() {
      if (stopWatching || !watchPresence) return;
      stopWatching = watchPresence((records) => {
        presenceRecords = records;
        updatePresence();
      });
      expiryCheck = setInterval(updatePresence, 5000);
    },
    stopPresence,
    paintPresence(root) {
      const roster = root.querySelector("[data-admin-live]");
      if (!roster) return;
      const nextList = liveList();
      if (roster.dataset.rendered !== nextList) {
        roster.innerHTML = nextList;
        roster.dataset.rendered = nextList;
      }
      for (const cell of root.querySelectorAll("[data-presence-uid]")) {
        const next = badge(cell.dataset.presenceUid);
        if (cell.dataset.rendered === next) continue;
        cell.innerHTML = next;
        cell.dataset.rendered = next;
      }
    },
    dispose() { request++; learners = []; stopPresence(); },
    click(action, value) {
      if (action === "admin-refresh") load();
      else if (action === "admin-prev" || action === "admin-next") {
        const next = adjacentMonth(month, action === "admin-prev" ? -1 : 1);
        if (next > activityDay().slice(0, 7)) return;
        month = next;
        day = null;
        load();
      } else if (action === "admin-user" && learners.some((learner) => learner.uid === value)) {
        selected = value;
        day = null;
        redraw(`[data-action="admin-user:${CSS.escape(value)}"]`);
      } else if (action === "admin-day" && value.startsWith(`${month}-`)) {
        day = day === value ? null : value;
        redraw(`[data-action="admin-day:${CSS.escape(value)}"]`);
      }
    },
    view() {
      const learner = learners.find((item) => item.uid === selected);
      const selectedStats = day ? learner?.days.get(day) || emptyStats() : learner;
      const overview = learners.reduce((sum, item) => { addStats(sum, item); return sum; }, emptyStats());
      return `<div class="admin-dashboard">
        <header class="admin-head"><div><h1>Activity dashboard</h1><p>Signed-in learner activity · Pacific time</p></div>
          ${control("Refresh", "refresh", status === "loading")}</header>
        <section class="admin-card" aria-labelledby="admin-live-title"><h2 id="admin-live-title">Online now</h2>
          <div data-admin-live>${liveList()}</div></section>
        <div class="admin-month" aria-label="Reporting month">${control("Previous month", "prev")}<h2 aria-live="polite">${monthFormat.format(monthDate(month))}</h2>${control("Next month", "next", month >= activityDay().slice(0, 7))}</div>
        ${status !== "ready" ? `<p class="admin-card" role="status">${status === "loading" ? "Loading activity…" : "Couldn’t load activity. Check your connection and try Refresh."}</p>` : `
          <section class="admin-overview" aria-label="Monthly totals">
            ${metric("Active learners", count(learners.filter((item) => item.days.size).length))}${metric("Answers attempted", count(attempts(overview)))}${metric("Active practice time", duration(overview.activeMs))}
          </section>
          ${!learner ? '<p class="admin-card">No signed-in activity recorded for this month.</p>' : `
            <section class="admin-card" aria-labelledby="admin-learners"><h2 id="admin-learners">Learners</h2>
            <div class="admin-table-wrap"><table><thead><tr><th scope="col">Account</th><th scope="col">Status</th><th scope="col">Lessons completed</th><th scope="col">Best review streak</th><th scope="col">Active days</th><th scope="col">Attempts</th><th scope="col">Active time</th><th scope="col">Most recent activity</th></tr></thead>
            <tbody>${learners.map((item) => `<tr class="${item === learner ? "selected" : ""}"><th scope="row"><button type="button" class="text-button" data-action="admin-user:${esc(item.uid)}" aria-pressed="${item === learner}">${esc(item.email)}</button></th><td data-label="Status" data-presence-uid="${esc(item.uid)}">${badge(item.uid)}</td><td data-label="Lessons completed">${item.summary ? count(item.summary.completedLessons) : "—"}</td><td data-label="Best review streak">${item.summary ? count(bestStreak(item.summary)) : "—"}</td><td data-label="Active days">${count(item.days.size)}</td><td data-label="Attempts">${count(attempts(item))}</td><td data-label="Active time">${duration(item.activeMs)}</td><td data-label="Most recent activity">${item.lastAt ? lastFormat.format(item.lastAt) : "—"}</td></tr>`).join("")}</tbody></table></div></section>
            ${learnerOverview(learner, summaryUnavailable)}
            <div class="admin-detail"><section class="admin-card" aria-labelledby="admin-calendar-title"><h2 id="admin-calendar-title">Activity calendar</h2><p class="admin-account">${esc(learner.email)}</p>
            ${calendar(month, learner, day)}
            <div class="admin-day-detail" aria-live="polite"><h3>${day ? dayFormat.format(date(day)) : "Month totals"}</h3>
            <p>${plural(attempts(selectedStats), "attempt")} · ${count(selectedStats.correct)} correct · ${duration(selectedStats.activeMs)} active</p>${breakdown(selectedStats)}</div></section>
            <div class="admin-quiz-timings">${topics.filter(({ quizPassKey }) => quizPassKey).map((topic) => timing(learner, topic)).join("")}</div></div>`}`}
      </div>`;
    },
  };
}
