import { normalizeProgress } from "./progress-transfer.js";

export const emptyCloudProgress = () => ({
  version: 1,
  lesson: null,
  progress: {},
  game: { streak: 0, best: 0 },
});
const copy = (value) => JSON.parse(JSON.stringify(value));
const stable = (value) =>
  JSON.stringify(value, (_, item) =>
    item && typeof item === "object" && !Array.isArray(item)
      ? Object.fromEntries(
          Object.keys(item)
            .sort()
            .map((key) => [key, item[key]]),
        )
      : item,
  );
export const sameProgress = (a, b) => stable(a) === stable(b);
const defaultLesson = () => ({
  index: 0,
  stage: "example",
  solved: [],
  answers: {},
  hints: [],
  reveals: [],
});
const counter = (value) =>
  Number.isSafeInteger(value) && value >= 0 ? Math.min(value, 1000000) : 0;

export function cloudProgress(value) {
  if (!value || typeof value !== "object") return emptyCloudProgress();
  const normalized = Object.keys(value.progress || {}).length
    ? normalizeProgress({
        version: 1,
        lesson: value.lesson,
        progress: value.progress,
      })
    : { version: 1, lesson: null, progress: {} };
  return {
    version: 1,
    lesson: normalized.lesson,
    progress: normalized.progress,
    game: {
      streak: counter(value.game?.streak),
      best: counter(value.game?.best),
    },
  };
}

// Preserve completion from both devices, but only overwrite answers/positions that
// this device actually changed since its last server snapshot (a three-way merge).
export function mergeCloudProgress(remote, local, base = emptyCloudProgress()) {
  const progress = {};
  for (const id of new Set([
    ...Object.keys(remote.progress),
    ...Object.keys(local.progress),
  ])) {
    const r = remote.progress[id] || defaultLesson();
    const l = local.progress[id] || defaultLesson();
    const b = base.progress[id] || defaultLesson();
    const moved = l.index !== b.index || l.stage !== b.stage;
    const answers = { ...r.answers };
    for (const key of new Set([
      ...Object.keys(l.answers),
      ...Object.keys(b.answers),
    ]))
      if (l.answers[key] !== b.answers[key]) {
        if (l.answers[key] === undefined) delete answers[key];
        else answers[key] = l.answers[key];
      }
    const p = {
      index: moved ? l.index : r.index,
      stage: moved ? l.stage : r.stage,
      solved: [...new Set([...r.solved, ...l.solved])],
      answers,
      hints: [...new Set([...r.hints, ...l.hints])],
      reveals: [...new Set([...r.reveals, ...l.reveals])],
    };
    if (r.failedChecks || l.failedChecks)
      p.failedChecks = Object.fromEntries(
        [
          ...new Set([
            ...Object.keys(r.failedChecks || {}),
            ...Object.keys(l.failedChecks || {}),
          ]),
        ].map((key) => [
          key,
          Math.max(r.failedChecks?.[key] || 0, l.failedChecks?.[key] || 0),
        ]),
      );
    progress[id] = p;
  }
  return {
    version: 1,
    lesson: local.lesson !== base.lesson ? local.lesson : remote.lesson,
    progress,
    game: {
      best: Math.max(remote.game.best, local.game.best),
      streak:
        local.game.streak !== base.game.streak
          ? local.game.streak
          : remote.game.streak,
    },
  };
}

export function cloudDocument(value) {
  if (!value)
    return { version: 1, epoch: 0, revision: 0, data: emptyCloudProgress() };
  if (
    value.version !== 1 ||
    !Number.isSafeInteger(value.epoch) ||
    value.epoch < 0 ||
    !Number.isSafeInteger(value.revision) ||
    value.revision < 0
  )
    throw Error("This cloud save needs a newer version of Numi.");
  return {
    version: 1,
    epoch: value.epoch,
    revision: value.revision,
    data: cloudProgress(value.data),
  };
}

export function mergeCloudDocument(previous, local, base, expectedEpoch) {
  const doc = cloudDocument(previous);
  if (doc.epoch !== expectedEpoch) return doc; // A reset on another device wins over stale offline work.
  const data = mergeCloudProgress(doc.data, local, base);
  return sameProgress(data, doc.data) && previous
    ? doc
    : { ...doc, revision: doc.revision + 1, data };
}

export function createProgressSync({
  remote,
  initial,
  metadata,
  onChange,
  onMetadata = () => {},
  onStatus = () => {},
  delay = 1200,
  schedule = setTimeout,
  cancel = clearTimeout,
}) {
  let local = cloudProgress(initial),
    base = cloudProgress(metadata?.base);
  let epoch = Number.isSafeInteger(metadata?.epoch) ? metadata.epoch : null;
  let revision = metadata?.revision || 0,
    ready = false,
    disposed = false;
  let timer,
    unsubscribe,
    inFlight,
    resetting = false,
    retryDelay = 2000;
  const dirty = () => !sameProgress(local, base);
  const meta = () => ({ epoch, revision, base: copy(base) });
  const status = (kind, error) => {
    if (!disposed) onStatus(kind, error);
  };
  function notify() {
    if (disposed) return;
    onMetadata(meta());
    onChange(copy(local));
  }
  function queue(wait = delay) {
    cancel(timer);
    if (disposed || resetting || !ready || !dirty()) return;
    timer = schedule(() => {
      flush().catch(() => {});
    }, wait);
    timer?.unref?.();
  }
  function receive(value) {
    if (disposed) return;
    try {
      const doc = cloudDocument(value);
      if (
        ready &&
        (doc.epoch < epoch || (doc.epoch === epoch && doc.revision < revision))
      )
        return;
      const reset = epoch !== null && epoch !== doc.epoch;
      local = reset ? doc.data : mergeCloudProgress(doc.data, local, base);
      base = doc.data;
      epoch = doc.epoch;
      revision = doc.revision;
      ready = true;
      notify();
      status(dirty() ? "pending" : "saved");
      queue();
    } catch (error) {
      status("error", error);
    }
  }
  function watch() {
    unsubscribe?.();
    status("loading");
    unsubscribe = remote.watch(receive, (error) => status("error", error));
  }
  async function flush() {
    cancel(timer);
    if (disposed || resetting || !ready || !dirty()) return;
    if (inFlight) return inFlight;
    const sent = copy(local),
      sentBase = copy(base),
      sentEpoch = epoch;
    status("saving");
    inFlight = (async () => {
      try {
        const result = cloudDocument(
          await remote.write((previous) =>
            mergeCloudDocument(previous, sent, sentBase, sentEpoch),
          ),
        );
        if (disposed) return;
        // A newer listener snapshot already includes this commit.
        if (
          result.epoch < epoch ||
          (result.epoch === epoch && result.revision < revision)
        )
          return;
        const reset = result.epoch !== sentEpoch;
        local = reset
          ? result.data
          : mergeCloudProgress(result.data, local, sent);
        base = result.data;
        epoch = result.epoch;
        revision = result.revision;
        retryDelay = 2000;
        notify();
        status(dirty() ? "pending" : "saved");
      } catch (error) {
        status("error", error);
        retryDelay = Math.min(retryDelay * 2, 30000);
        throw error;
      } finally {
        inFlight = null;
        queue(retryDelay);
      }
    })();
    return inFlight;
  }
  return {
    start: watch,
    edit(value) {
      const next = cloudProgress(value);
      if (disposed || sameProgress(next, local)) return;
      local = next;
      onMetadata(meta());
      status(ready ? "pending" : "loading");
      queue();
    },
    flush,
    retry() {
      if (!disposed) {
        watch();
        queue(0);
      }
    },
    metadata: meta,
    async reset() {
      if (disposed || !ready)
        throw Error("Wait for cloud progress to load before deleting it.");
      resetting = true;
      cancel(timer);
      try {
        await inFlight?.catch(() => {});
        const result = cloudDocument(await remote.reset());
        if (disposed) return;
        if (
          result.epoch < epoch ||
          (result.epoch === epoch && result.revision < revision)
        )
          return;
        local = base = result.data;
        epoch = result.epoch;
        revision = result.revision;
        notify();
        status("saved");
      } finally {
        resetting = false;
        queue();
      }
    },
    dispose() {
      disposed = true;
      cancel(timer);
      unsubscribe?.();
    },
  };
}
