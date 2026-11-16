import { lessons } from "./lessons.js";
import { migrateLessonProgress } from "./progress-migration.js";
import { packProgress, unpackProgress } from "./progress-codec.js";

const MAX_SIZE = 200000;
export function normalizeProgress(value) {
  if (
    !value ||
    value.version !== 1 ||
    !value.progress ||
    typeof value.progress !== "object" ||
    Array.isArray(value.progress)
  )
    throw Error("This is not a valid Numi progress export.");
  value = migrateLessonProgress(value);
  const progress = {};
  const indices = (list, size) => {
    if (!Array.isArray(list)) throw Error("The progress data is incomplete.");
    if (list.some((i) => !Number.isInteger(i) || i < 0 || i >= size))
      throw Error("The progress data contains an invalid problem number.");
    return [...new Set(list)];
  };
  for (const lesson of lessons) {
    const p = value.progress[lesson.id];
    if (!p) continue;
    if (!p.answers || typeof p.answers !== "object" || Array.isArray(p.answers))
      throw Error("The saved answers are invalid.");
    const answers = {};
    for (const [k, v] of Object.entries(p.answers)) {
      if (
        !/^\d+$/.test(k) ||
        Number(k) >= lesson.problems.length ||
        typeof v !== "string" ||
        v.length > 500
      )
        throw Error("The saved answers are invalid.");
      answers[k] = v;
    }
    let failedChecks;
    if (p.failedChecks !== undefined) {
      if (
        !p.failedChecks ||
        typeof p.failedChecks !== "object" ||
        Array.isArray(p.failedChecks)
      )
        throw Error("The saved answer attempts are invalid.");
      failedChecks = {};
      for (const [key, count] of Object.entries(p.failedChecks)) {
        if (
          !/^\d+$/.test(key) ||
          Number(key) >= lesson.problems.length ||
          !Number.isInteger(count) ||
          count < 0 ||
          count > 2
        )
          throw Error("The saved answer attempts are invalid.");
        failedChecks[key] = count;
      }
    }
    progress[lesson.id] = {
      index:
        Number.isInteger(p.index) &&
        p.index >= 0 &&
        p.index < lesson.problems.length
          ? p.index
          : 0,
      stage: p.stage === "practice" ? "practice" : "example",
      solved: indices(p.solved, lesson.problems.length),
      answers,
      hints: indices(p.hints || [], lesson.problems.length),
      reveals: indices(p.reveals || [], lesson.problems.length),
      ...(failedChecks ? { failedChecks } : {}),
    };
  }
  if (!Object.keys(progress).length)
    throw Error("No recognized lesson progress was found.");
  return {
    version: 1,
    progress,
    lesson: lessons.some((l) => l.id === value.lesson) ? value.lesson : null,
  };
}

function checksum(bytes) {
  let hash = 2166136261;
  for (const byte of bytes) hash = Math.imul(hash ^ byte, 16777619) >>> 0;
  return hash.toString(16).padStart(8, "0");
}
export function exportProgressCode(state) {
  const bytes = packProgress(normalizeProgress(state));
  const encoded = btoa(
    Array.from(bytes, (b) => String.fromCharCode(b)).join(""),
  )
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
  const code = `NUMI2.${encoded}.${checksum(bytes)}`;
  if (code.length > MAX_SIZE)
    throw Error(
      "This progress code is too long. Download a progress file instead.",
    );
  return code;
}
export function importProgressCode(text) {
  const code = String(text).replace(/\s+/g, "");
  if (code.length > MAX_SIZE) throw Error("This progress code is too long.");
  const match = code.match(/^NUMI([12])\.([A-Za-z0-9_-]+)\.([0-9a-f]{8})$/);
  if (!match)
    throw Error(
      "Paste a complete Numi progress code, starting with NUMI1. or NUMI2.",
    );
  try {
    const binary = atob(match[2].replaceAll("-", "+").replaceAll("_", "/"));
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    if (checksum(bytes) !== match[3])
      throw Error("The progress code has changed. Copy it again in full.");
    return normalizeProgress(
      match[1] === "2"
        ? unpackProgress(bytes)
        : JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)),
    );
  } catch (e) {
    if (e.message.startsWith("The progress code")) throw e;
    throw Error("This progress code is invalid or incomplete.");
  }
}

export function mergeProgress(current, incoming) {
  const result = { ...current };
  for (const [id, p] of Object.entries(incoming)) {
    const old = current[id];
    result[id] = old
      ? {
          ...p,
          solved: [...new Set([...old.solved, ...p.solved])],
          answers: { ...old.answers, ...p.answers },
          hints: [...new Set([...(old.hints || []), ...p.hints])],
          reveals: [...new Set([...(old.reveals || []), ...p.reveals])],
          ...(old.failedChecks || p.failedChecks
            ? {
                failedChecks: Object.fromEntries(
                  [
                    ...new Set([
                      ...Object.keys(old.failedChecks || {}),
                      ...Object.keys(p.failedChecks || {}),
                    ]),
                  ].map((key) => [
                    key,
                    Math.max(
                      old.failedChecks?.[key] || 0,
                      p.failedChecks?.[key] || 0,
                    ),
                  ]),
                ),
              }
            : {}),
        }
      : p;
  }
  return result;
}
