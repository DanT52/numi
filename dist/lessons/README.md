# Lesson files

Each category has its own directory and an `index.js` that defines lesson order. Each lesson is a separate default-exported object containing its questions, answers, hints, explanations, and worked examples.

```
lessons/
  index.js                     # Combines categories and calculates totals
  catalog.js                   # Topic labels and future curriculum
  fractions/
    index.js
    simplifying.js
    equivalent.js
    conversions.js
    add-subtract.js
    multiply.js
    divide.js
    mixed.js
  signed-numbers/
    index.js
    add-subtract-basic.js
    add-subtract-small-three.js
    add-subtract-large-two.js
    add-subtract-large-three.js
    multiply-divide.js
    mixed-review.js
    legacy-three-number-questions.js  # Frozen migration reference
  order-of-operations/
    index.js
    basics.js
    negative-signs.js
  factors-and-multiples/
    index.js
    prime-factors-gcf.js
    lcm-denominators.js
```

`../lessons.js` remains a small compatibility entry point for existing imports.

To add a lesson, create its file, import it into the category's index, and put it in the exported array in the intended order. Lesson IDs must be unique and stable. Counts and progress percentages update automatically.

Worked examples use `steps: [{text, lines: [[expression, equivalentExpression]]}]`. Each expression in a line must have the same value. Expressions are rendered as MathML; use parentheses to group factors and negative numbers clearly. `moreExamples` supplies optional additional walkthroughs.

Progress currently identifies questions by their lesson ID and position. Append questions when expanding an existing lesson. If you move, replace, or reorder questions, add a migration in `../progress-migration.js` and keep an immutable reference to the old expressions. Do not award completion to a replacement question just because it occupies an old index. Run `npm test` from the project root after editing content or migrations.
