export const adminUid = "sUf2WIFGJfRXg5ZmlZEwy2nxMoG3";
export const activityZone = "America/Los_Angeles";
const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: activityZone, year: "numeric", month: "2-digit", day: "2-digit",
});

export function activityDay(ms = Date.now()) {
  const parts = Object.fromEntries(dayFormatter.formatToParts(ms).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export const statFields = [
  "activeMs", "lesson", "quiz", "review", "warmup", "correct",
  "timedQuiz", "quizMs", "timedSignedReview", "signedReviewMs",
  "quizRuns", "quizPasses", "timedPasses", "passedQuizMs",
];
export const emptyStats = () => Object.fromEntries(statFields.map((field) => [field, 0]));
export const attempts = (stats) => stats.lesson + stats.quiz + stats.review + stats.warmup;

const IDLE_MS = 5 * 60 * 1000;

export function createPracticeClock({ record, now = Date.now, visible }) {
  let last = null;
  let cursor = null;
  let questionMs = null;
  let quizMs = null;
  const pending = new Map();

  function advance(end) {
    if (cursor === null) return;
    const until = Math.min(end, last + IDLE_MS);
    if (until <= cursor) return;
    const elapsed = until - cursor;
    if (questionMs !== null) questionMs += elapsed;
    if (quizMs !== null) quizMs += elapsed;
    while (cursor < until) {
      const day = activityDay(cursor);
      let stop = until;
      if (activityDay(until - 1) !== day) {
        let lo = cursor + 1;
        while (lo < stop) {
          const mid = Math.floor((lo + stop) / 2);
          if (activityDay(mid) === day) lo = mid + 1;
          else stop = mid;
        }
      }
      const previous = pending.get(day);
      pending.set(day, { ms: (previous?.ms || 0) + stop - cursor, lastAt: stop - 1 });
      cursor = stop;
    }
  }

  function interact() {
    const time = now();
    if (!visible()) return;
    if (last !== null && (time - last > IDLE_MS || time < last)) {
      // Exclude an unfinished interval when a learner returns after the idle cutoff.
      pending.clear();
      cursor = null;
      questionMs = quizMs = null;
    }
    advance(time);
    last = cursor = time;
    record(activityDay(time), time);
  }

  return {
    interact,
    pause() {
      advance(now());
      cursor = null;
    },
    resume() {
      const time = now();
      if (visible() && cursor === null && last !== null && time < last + IDLE_MS && time >= last) cursor = time;
    },
    openQuestion() {
      advance(now());
      questionMs = last === null ? null : 0;
    },
    startQuiz() {
      advance(now());
      quizMs = last === null ? null : 0;
    },
    leaveActivity() {
      questionMs = quizMs = null;
    },
    stopSession() {
      last = cursor = questionMs = quizMs = null;
      pending.clear();
    },
    answer(mode, { correct, topic, finished = false }) {
      interact();
      const time = now();
      const day = activityDay(time);
      for (const [activeDay, interval] of pending) record(activeDay, interval.lastAt, { activeMs: interval.ms });
      pending.clear();

      const stats = { [mode]: 1, correct: Number(correct) };
      if (mode === "quiz" && questionMs !== null) {
        stats.timedQuiz = 1;
        stats.quizMs = questionMs;
      }
      if (mode === "review" && topic === "integers" && questionMs !== null) {
        stats.timedSignedReview = 1;
        stats.signedReviewMs = questionMs;
      }
      if (mode === "quiz" && finished) {
        stats.quizRuns = 1;
        stats.quizPasses = Number(correct);
        if (correct && quizMs !== null) {
          stats.timedPasses = 1;
          stats.passedQuizMs = quizMs;
        }
        quizMs = null;
      }
      questionMs = null;
      record(day, time, stats);
    },
  };
}

const prefix = (uid) => `numi.activity.pending.${uid}.`;
const WRITE_INTERVAL = 20_000;

export function createPracticeTracker({ storage, write, visible }) {
  let user = null;
  let clock = null;
  let timer;
  const draft = new Map();
  const memory = new Map();
  const sending = new Set();

  function schedule() {
    if (timer) return;
    timer = setTimeout(() => {
      timer = null;
      flush();
    }, WRITE_INTERVAL);
  }

  function record(day, time, delta) {
    let entry = draft.get(day);
    if (!entry) {
      entry = {
        uid: user.uid, email: user.email, day,
        id: `${user.uid}_${crypto.randomUUID()}`,
        lastAt: time, ...emptyStats(),
      };
      draft.set(day, entry);
    }
    entry.lastAt = Math.max(entry.lastAt, time);
    if (delta) for (const [key, value] of Object.entries(delta)) entry[key] += value;
    schedule();
  }

  function flush() {
    clearTimeout(timer);
    timer = null;
    for (const entry of draft.values()) {
      const key = prefix(entry.uid) + entry.id;
      const value = JSON.stringify(entry);
      memory.set(key, value);
      try { storage.setItem(key, value); } catch { /* Retry in memory if storage is full. */ }
    }
    draft.clear();
    if (!user || globalThis.navigator?.onLine === false) return;
    const start = prefix(user.uid);
    const queue = new Map([...memory].filter(([key]) => key.startsWith(start)));
    try {
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key?.startsWith(start)) queue.set(key, storage.getItem(key));
      }
    } catch { /* In-memory queue is still available. */ }

    return Promise.allSettled([...queue].map(async ([key, value]) => {
      if (!value || sending.has(key)) return;
      sending.add(key);
      try {
        const entry = JSON.parse(value);
        await write(entry);
        memory.delete(key);
        try { storage.removeItem(key); } catch { /* Replays are idempotent. */ }
      } catch (error) {
        if (error?.code !== "permission-denied") schedule();
      } finally {
        sending.delete(key);
      }
    }));
  }

  return {
    setUser(next) {
      if (next?.uid === user?.uid) return;
      flush();
      draft.clear();
      user = next;
      clock = user ? createPracticeClock({ record, visible }) : null;
      flush();
    },
    get clock() { return clock; },
    flush,
  };
}
