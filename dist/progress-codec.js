// These numeric IDs belong to the NUMI2 file format, not the lesson display order.
// Never reorder, remove, or reuse IDs. New lessons can use the string fallback.
const lessonIds = Object.freeze([
  "fractions-simplify",
  "fractions-equivalent",
  "fractions-2",
  "fractions-add-subtract",
  "fractions-multiply",
  "fractions-divide",
  "fractions-mixed",
  "integers-1",
  "integers-add-subtract-small-3",
  "integers-add-subtract-large-2",
  "integers-add-subtract-large-3",
  "integers-2",
  "integers-review",
  "pemdas-1",
  "pemdas-2",
  "factors-1",
  "factors-2",
]);

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true });
const invalid = () => {
  throw Error("Invalid compact progress data.");
};

// Variable-length integers use one byte for the small numbers in most saves.
export function packProgress(state) {
  const bytes = [];
  const uint = (value) => {
    if (!Number.isSafeInteger(value) || value < 0 || value > 0xffffffff)
      invalid();
    do {
      const digit = value % 128;
      value = Math.floor(value / 128);
      bytes.push(digit + (value ? 128 : 0));
    } while (value);
  };
  const string = (value) => {
    const encoded = encoder.encode(value);
    uint(encoded.length);
    for (const byte of encoded) bytes.push(byte);
  };
  const id = (value) => {
    const code = lessonIds.indexOf(value) + 1;
    uint(code);
    if (!code) string(value || "");
  };
  const list = (value) => {
    uint(value.length);
    for (const index of value) uint(index);
  };
  const record = (value, writeValue) => {
    const entries = Object.entries(value);
    uint(entries.length);
    for (const [key, item] of entries) {
      string(key);
      writeValue(item);
    }
  };
  id(state.lesson);
  const entries = Object.entries(state.progress);
  uint(entries.length);
  for (const [lesson, p] of entries) {
    id(lesson);
    const flags =
      (p.stage === "practice" ? 1 : 0) |
      (p.index ? 2 : 0) |
      (p.solved.length ? 4 : 0) |
      (Object.keys(p.answers).length ? 8 : 0) |
      (p.hints.length ? 16 : 0) |
      (p.reveals.length ? 32 : 0) |
      (p.failedChecks !== undefined ? 64 : 0);
    uint(flags);
    if (flags & 2) uint(p.index);
    if (flags & 4) list(p.solved);
    if (flags & 8) record(p.answers, string);
    if (flags & 16) list(p.hints);
    if (flags & 32) list(p.reveals);
    if (flags & 64) record(p.failedChecks, uint);
  }
  return Uint8Array.from(bytes);
}

export function unpackProgress(bytes) {
  let offset = 0;
  const uint = () => {
    let result = 0,
      place = 1;
    for (let i = 0; i < 5; i++) {
      if (offset >= bytes.length) invalid();
      const byte = bytes[offset++];
      result += (byte & 127) * place;
      if (result > 0xffffffff) invalid();
      if (byte < 128) return result;
      place *= 128;
    }
    invalid();
  };
  const count = () => {
    const size = uint();
    // Every item needs at least one byte; never allocate from an unbounded count.
    if (size > bytes.length - offset) invalid();
    return size;
  };
  const string = () => {
    const length = count();
    const text = decoder.decode(bytes.subarray(offset, offset + length));
    offset += length;
    return text;
  };
  const id = () => {
    const code = uint();
    if (!code) return string();
    if (code > lessonIds.length) invalid();
    return lessonIds[code - 1];
  };
  const list = () => Array.from({ length: count() }, uint);
  const record = (readValue) => {
    const size = count(),
      entries = [],
      keys = new Set();
    for (let i = 0; i < size; i++) {
      const key = string();
      if (keys.has(key)) invalid();
      keys.add(key);
      entries.push([key, readValue()]);
    }
    return Object.fromEntries(entries);
  };
  const lesson = id() || null;
  const size = count(),
    entries = [],
    ids = new Set();
  for (let i = 0; i < size; i++) {
    const lessonId = id(),
      flags = uint();
    if (!lessonId || ids.has(lessonId) || flags > 127) invalid();
    ids.add(lessonId);
    entries.push([
      lessonId,
      {
        index: flags & 2 ? uint() : 0,
        stage: flags & 1 ? "practice" : "example",
        solved: flags & 4 ? list() : [],
        answers: flags & 8 ? record(string) : {},
        hints: flags & 16 ? list() : [],
        reveals: flags & 32 ? list() : [],
        ...(flags & 64 ? { failedChecks: record(uint) } : {}),
      },
    ]);
  }
  if (offset !== bytes.length) invalid();
  return { version: 1, lesson, progress: Object.fromEntries(entries) };
}
