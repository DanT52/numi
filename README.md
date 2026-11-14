# Numi

A beginner math app built with browser-native JavaScript modules, CSS, SVG, and accessible MathML. No build step or application dependencies are required. Works on desktop and mobile.

## Run locally

Requires Node.js 18 or later.

```sh
npm start
```

Open http://localhost:4173. Run `npm test` to check arithmetic parsing, answer validation, and lesson content.

## What's included

- Eight guided lessons, two per topic, with eight problems each (64 total), worked examples, hints, explanations, and retryable answers.
- Fractions/mixed numbers; decimal/percentage conversion; signed arithmetic; PEMDAS; prime factorization, GCF, and LCM.
- A number line with step controls and all four operations, signed counters and zero pairs, fraction bars, a hundred grid, a factor explorer, and a calculator.
- MathML equations with native fraction and exponent rendering. SVG diagrams scale to fit the screen.
- Tools available in their own tab and an accessible modal over the current lesson.
- Local browser storage preserves answers, current question, hints, and completion. JSON export/import is available on My progress. No account or server database is needed. Tool explorations are retained across tabs for the session.
- Future lesson outlines with suggested visual aids, clearly marked as not yet available.

## Project structure

`dist/` contains the complete deployable static application. `app.js` handles UI and state; `lessons.js` contains curriculum data; `math.js` provides a restricted arithmetic parser and MathML rendering; `styles.css` handles responsive presentation. `server.mjs` is only for local development. `.openai/hosting.json` configures private Sites hosting.

The calculator uses a parser, never `eval`. Answers accept equivalent fractions and mixed numbers. Conversion questions request the target notation; prime factorization questions require prime products. Google Fonts is optional; system fonts work when offline.

## Additional aids to build next

1. A balance scale with movable algebra tiles for the distributive property and equations.
2. Double number lines and a unit conversion ladder for ratios, recipes, rates, and measurement.
3. A coordinate grid with draggable points for introductory algebra.
