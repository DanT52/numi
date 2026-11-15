# Numi

A beginner math app built with browser-native JavaScript modules, CSS, SVG, and accessible MathML. No build step or application dependencies are required. Works on desktop and mobile.

## Run locally

Requires Node.js 18 or later.

```sh
npm start
```

Open http://localhost:4173. Run `npm test` to check arithmetic parsing, answer validation, and lesson content.

## What's included

- Fifteen guided lessons with 169 problems, worked examples, hints, explanations, and retryable answers. The fraction path has seven lessons with twelve problems each (84 fraction problems): simplifying → equivalent fractions → decimal/percentage conversions → addition/subtraction → multiplication → division → mixed-number review. Signed numbers has four lessons: basic addition/subtraction → three-number addition/subtraction (25 problems) → multiplication/division → mixed review (12 problems). PEMDAS and factors/multiples each have two lessons with eight problems each.
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
- Fractions support nonnegative whole-number numerators and positive denominators through JavaScript's maximum safe integer, including 33/75. Up to 200 pieces are individually selectable; larger denominators use a proportional fill. Large mixed numbers summarize complete wholes rather than rendering thousands of rows.
- Number-line inputs accept finite numbers without the previous −12 to 12 limit. The axis automatically scales to the entered values, with compact tick labels and a bounded number of ticks. Arithmetic uses JavaScript numeric precision; results outside its finite range display an explanation.

## Project structure

`dist/` contains the complete deployable static application. `app.js` handles UI and state; `lessons.js` contains curriculum data; `worked-examples.js` contains the equation-by-equation guides; `math.js` provides a restricted arithmetic parser and MathML rendering; `visual-models.js` and `tool-views.js` handle scalable diagrams; `appearance.js` manages appearance preferences; `progress-transfer.js` validates and transfers saved progress. `styles.css` and `refresh.css` handle responsive presentation and theme tokens. `assets/` contains the supplied character SVGs. `server.mjs` is only for local development. `.openai/hosting.json` configures private Sites hosting.

The calculator uses a parser, never `eval`. Answers accept equivalent fractions and mixed numbers. Conversion questions request the target notation; prime factorization questions require prime products. Google Fonts is optional; system fonts work when offline.

## Additional aids to build next

1. A balance scale with movable algebra tiles for the distributive property and equations.
2. Double number lines and a unit conversion ladder for ratios, recipes, rates, and measurement.
3. A coordinate grid with draggable points for introductory algebra.
