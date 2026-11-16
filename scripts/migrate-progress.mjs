import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  importProgressCode,
  exportProgressCode,
  normalizeProgress,
} from "../dist/progress-transfer.js";
const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error(
    "Usage: node scripts/migrate-progress.mjs <input-code-or-json-file> <output-code-file>",
  );
  process.exit(1);
}
const text = readFileSync(resolve(input), "utf8").trim();
const progress = /^NUMI[12]\./.test(text)
  ? importProgressCode(text)
  : normalizeProgress(JSON.parse(text));
writeFileSync(resolve(output), exportProgressCode(progress) + "\n");
console.log(
  JSON.stringify({
    savedTo: resolve(output),
    solved: Object.values(progress.progress).reduce(
      (n, p) => n + p.solved.length,
      0,
    ),
  }),
);
