import { lessons } from "./lessons/index.js";
import { legacyThreeNumberExpressions } from "./lessons/signed-numbers/legacy-three-number-questions.js";
// The eight original fraction questions keep their answers, hints, and completion.
export const legacyFractionMap = [
  ["fractions-add-subtract", 0],
  ["fractions-add-subtract", 8],
  ["fractions-multiply", 4],
  ["fractions-divide", 3],
  ["fractions-mixed", 4],
  ["fractions-mixed", 5],
  ["fractions-mixed", 6],
  ["fractions-mixed", 7],
];
export function migrateFractionProgress(state) {
  const legacy = state?.progress?.["fractions-1"];
  if (!legacy) return state;
  const progress = { ...state.progress };
  delete progress["fractions-1"];
  for (let old = 0; old < legacyFractionMap.length; old++) {
    const [id, index] = legacyFractionMap[old];
    const current = progress[id];
    const p = current
      ? {
          ...current,
          solved: [...current.solved],
          answers: { ...current.answers },
          hints: [...(current.hints || [])],
          reveals: [...(current.reveals || [])],
        }
      : {
          index: 0,
          stage: "example",
          solved: [],
          answers: {},
          hints: [],
          reveals: [],
        };
    if (legacy.solved?.includes(old) && !p.solved.includes(index))
      p.solved.push(index);
    if (
      typeof legacy.answers?.[old] === "string" &&
      p.answers[index] === undefined
    )
      p.answers[index] = legacy.answers[old];
    for (const key of ["hints", "reveals"])
      if (legacy[key]?.includes(old) && !p[key].includes(index))
        p[key].push(index);
    if (state.lesson === "fractions-1" && legacy.index === old) {
      p.index = index;
      p.stage = legacy.stage === "practice" ? "practice" : "example";
    }
    progress[id] = p;
  }
  const active =
    legacyFractionMap[
      Number.isInteger(legacy.index) && legacy.index >= 0 && legacy.index < 8
        ? legacy.index
        : 0
    ][0];
  return {
    ...state,
    progress,
    lesson: state.lesson === "fractions-1" ? active : state.lesson,
  };
}

export function migrateSignedProgress(state) {
  const legacy = state?.progress?.["integers-add-subtract-2"];
  if (!legacy) return state;
  for (const key of ["solved", "hints", "reveals"]) {
    const list = legacy[key] || [];
    if (
      !Array.isArray(list) ||
      list.some(
        (i) =>
          !Number.isInteger(i) ||
          i < 0 ||
          i >= legacyThreeNumberExpressions.length,
      )
    )
      throw Error(
        "The old signed-number progress contains an invalid question number.",
      );
  }
  if (
    !legacy.answers ||
    typeof legacy.answers !== "object" ||
    Array.isArray(legacy.answers)
  )
    throw Error("The old saved answers are invalid.");
  for (const [key, value] of Object.entries(legacy.answers))
    if (
      !/^\d+$/.test(key) ||
      Number(key) >= legacyThreeNumberExpressions.length ||
      typeof value !== "string" ||
      value.length > 500
    )
      throw Error("The old saved answers are invalid.");
  const targets = lessons.filter((l) =>
    ["integers-add-subtract-small-3", "integers-add-subtract-large-3"].includes(
      l.id,
    ),
  );
  const progress = { ...state.progress };
  delete progress["integers-add-subtract-2"];
  let activeLesson = state.lesson;
  for (const [oldIndex, expression] of legacyThreeNumberExpressions.entries()) {
    const matches = targets
      .flatMap((l) =>
        l.problems.map((p, index) => ({ id: l.id, index, expr: p.expr })),
      )
      .filter((p) => p.expr === expression);
    if (matches.length !== 1)
      throw Error(
        "A previous signed-number question could not be mapped uniquely.",
      );
    const { id, index } = matches[0],
      existing = progress[id];
    const p = existing
      ? {
          ...existing,
          solved: [...existing.solved],
          answers: { ...existing.answers },
          hints: [...(existing.hints || [])],
          reveals: [...(existing.reveals || [])],
        }
      : {
          index: 0,
          stage: "example",
          solved: [],
          answers: {},
          hints: [],
          reveals: [],
        };
    for (const key of ["solved", "hints", "reveals"])
      if ((legacy[key] || []).includes(oldIndex) && !p[key].includes(index))
        p[key].push(index);
    if (
      typeof legacy.answers[oldIndex] === "string" &&
      p.answers[index] === undefined
    )
      p.answers[index] = legacy.answers[oldIndex];
    const current =
      Number.isInteger(legacy.index) &&
      legacy.index >= 0 &&
      legacy.index < legacyThreeNumberExpressions.length
        ? legacy.index
        : 0;
    if (state.lesson === "integers-add-subtract-2" && oldIndex === current) {
      activeLesson = id;
      p.index = index;
      p.stage = legacy.stage === "practice" ? "practice" : "example";
    }
    progress[id] = p;
  }
  return { ...state, progress, lesson: activeLesson };
}

export function migrateLessonProgress(state) {
  return migrateSignedProgress(migrateFractionProgress(state));
}
