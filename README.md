# Numi

A beginner math app built with browser-native JavaScript modules, CSS, SVG, and accessible MathML. No build step or application dependencies are required. Works on desktop and mobile.

## Run locally

Requires Node.js 18 or later.

```sh
npm start
```

Open http://localhost:4173. Run `npm test` to check arithmetic parsing, answer validation, and lesson content.

## What's included

- Seventeen guided lessons with 239 problems, worked examples, hints, explanations, and retryable answers. The fraction path has seven lessons with twelve problems each (84 fraction problems): simplifying → equivalent fractions → decimal/percentage conversions → addition/subtraction → multiplication → division → mixed-number review. Signed numbers progresses through basic addition/subtraction (16), small-number triples up to 15 (25), larger pairs from 15–200 (25), larger triples (25), multiplication/division (8), and mixed review (24). PEMDAS and factors/multiples each have two lessons with eight problems each.
- Fractions/mixed numbers; decimal/percentage conversion; signed arithmetic; PEMDAS; prime factorization, GCF, and LCM.
- A number line with chained operations and all four operations. “Take a step (1)” always moves one unit; a separate “Jump by” button moves by the tick spacing, with a minimum jump of ten. Both controls stop at each operation boundary, including a shorter final move for fractional targets. Results start hidden and appear after the final move or “Show result.” Operations run in the order listed, with each completed move drawn on the line. Other tools include signed counters and zero pairs, fraction bars, a hundred grid, a factor explorer, and a calculator.
- MathML equations with native fraction and exponent rendering. SVG diagrams scale to fit the screen.
- Tools available in their own tab and a nonmodal side panel that keeps the lesson visible and interactive. On phones, lesson and toolkit occupy separate scrollable top and bottom panes. Escape closes Quick Tools.
- Local browser storage preserves answers, current question, hints, and completion. Settings offers copyable progress codes and JSON file export/import for transferring work to a new device. Codes contain UTF-8 JSON with a version prefix and checksum to catch incomplete copies; importing merges solved problems without removing existing completions. JSON export/import is also available on My progress. No account or server database is needed. Tool explorations are retained across tabs for the session.
- Future lesson outlines with suggested visual aids, clearly marked as not yet available.
- Matcha green is the default theme. Settings also offers lavender, ocean, and warm clay, three text sizes, bolder text, and optional gentle animations. Appearance preferences save independently from lesson progress.
- The supplied character SVGs appear as a study companion, with happy and thoughtful reactions and a matcha welcome. New answers earn ten leaf points once, and progress milestones unlock garden badges. Existing saved lessons also contribute to points and badges.
- Guided examples use rendered MathML at every rewriting step. Working with fractions includes additional expandable examples for subtraction, multiplication, reciprocals and division, simplification, and mixed numbers. Topic icons follow the active color theme.
- The original combined fraction lesson is migrated automatically: saved answers, solved questions, hints, and current position move to the matching new lessons. Existing conversion answers keep their original positions. Older progress codes and JSON files are also migrated. Lesson navigation, progress totals, rewards, and transfers support variable-length lessons.
- The earlier 25-question signed addition/subtraction lesson also migrates automatically. Previous questions move to the small- or large-number triple lesson by matching their exact expressions, keeping the corresponding solved flags, typed answers, hints, explanations, and current question. New questions are not marked solved by reusing an old index. Existing basic questions and review questions remain at the start of their expanded lessons.
- Fractions support nonnegative whole-number numerators and positive denominators through JavaScript's maximum safe integer, including 33/75. Up to 200 pieces are individually selectable; larger denominators use a proportional fill. Large mixed numbers summarize complete wholes rather than rendering thousands of rows.
- Number-line inputs accept finite numbers without the previous −12 to 12 limit. The axis automatically scales to the entered values, with compact tick labels and a bounded number of ticks. Arithmetic uses JavaScript numeric precision; results outside its finite range display an explanation.

## Project structure

`dist/` contains the complete deployable static application. `app.js` handles UI and state. `lessons.js` is a compatibility entry point; the actual curriculum is in `dist/lessons/`, with category directories and one file per lesson, including its worked examples. Category `index.js` files define order, and `lessons/catalog.js` holds topic labels and planned content. See [the lesson authoring guide](dist/lessons/README.md).

`math.js` provides arithmetic parsing and MathML rendering; `visual-models.js` and `tool-views.js` handle diagrams; `appearance.js` manages preferences; `progress-migration.js` maps older curricula; `progress-transfer.js` validates and transfers progress. `styles.css` and `refresh.css` handle layout and theme tokens. `assets/` contains character SVGs. `server.mjs` serves local development. `.openai/hosting.json` configures private Sites hosting.

To migrate an exported code or JSON file offline, run:

```sh
node scripts/migrate-progress.mjs path/to/original-code.txt path/to/updated-code.txt
```

Personal backups belong outside `dist/` and the source checkout; the migration CLI writes only the explicitly named output file.

The calculator uses a parser, never `eval`. Answers accept equivalent fractions and mixed numbers. Conversion questions request the target notation; prime factorization questions require prime products. Google Fonts is optional; system fonts work when offline.

## Additional aids to build next

1. A balance scale with movable algebra tiles for the distributive property and equations.
2. Double number lines and a unit conversion ladder for ratios, recipes, rates, and measurement.
3. A coordinate grid with draggable points for introductory algebra.
