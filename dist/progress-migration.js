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
