export default {
  id: "integers-add-subtract-large-2",
  topic: "integers",
  title: "Two numbers: 15–200",
  subtitle: "Build confidence adding and subtracting larger signed numbers.",
  minutes: 30,
  tool: "line",
  rule: "First rewrite subtraction as adding the opposite. With matching signs, add magnitudes and keep that sign. With different signs, subtract the smaller magnitude from the larger and use the sign of the larger magnitude. Break tens and ones apart to calculate by hand.",
  example: {
    expr: "45-120",
    answer: "-75",
    steps: [
      {
        text: "Rewrite subtraction as adding a negative number.",
        lines: [["45-120", "45+(-120)"]],
      },
      {
        text: "The signs differ. Find the difference between the magnitudes. Break 45 into 40 and 5 to subtract without a calculator.",
        lines: [["120-45", "120-40-5", "80-5", "75"]],
      },
      {
        text: "The larger magnitude is 120, and it belongs to the negative number. Keep the negative sign.",
        lines: [["45+(-120)", "-(120-45)", "-75"]],
      },
      {
        text: "Check on a number line: subtracting 120 from 45 uses 45 steps to reach zero and 75 more to reach −75.",
        lines: [["45-120", "45-45-75", "-75"]],
      },
    ],
  },
  moreExamples: [
    {
      title: "Adding numbers with different signs",
      expr: "75+(-128)",
      answer: "-53",
      steps: [
        {
          text: "The signs differ, so compare magnitudes. The larger magnitude is 128.",
          lines: [],
        },
        {
          text: "Subtract by splitting 75 into 70 and 5.",
          lines: [["128-75", "128-70-5", "58-5", "53"]],
        },
        {
          text: "Use the sign of the number with greater magnitude: −128.",
          lines: [["75+(-128)", "-(128-75)", "-53"]],
        },
      ],
    },
    {
      title: "Subtracting a negative number",
      expr: "-65-(-140)",
      answer: "75",
      steps: [
        {
          text: "Subtracting a negative is adding its positive opposite.",
          lines: [["-65-(-140)", "-65+140"]],
        },
        {
          text: "The signs now differ. Subtract magnitudes by splitting 65 into 60 and 5.",
          lines: [["140-65", "140-60-5", "80-5", "75"]],
        },
        {
          text: "Positive 140 has the greater magnitude, so the result is positive.",
          lines: [["-65+140", "75"]],
        },
      ],
    },
  ],
  problems: [
    {
      expr: "25+(30)",
      answer: "55",
      hint: "Add the magnitudes, then keep their shared sign.",
      solution:
        "Add magnitudes: 25 + 30 = 55. Keep the positive sign. Answer: 55.",
      prompt: "Find the answer.",
      type: "number",
    },
    {
      expr: "-20+(35)",
      answer: "15",
      hint: "Subtract the smaller magnitude from the larger and keep the sign of the larger.",
      solution:
        "Subtract magnitudes: 35 − 20 = 15. The larger magnitude belongs to the 35, so the result is positive. Answer: 15.",
      prompt: "Find the answer.",
      type: "number",
    },
    {
      expr: "60+(-25)",
      answer: "35",
      hint: "Subtract the smaller magnitude from the larger and keep the sign of the larger.",
      solution:
        "Subtract magnitudes: 60 − 25 = 35. The larger magnitude belongs to the 60, so the result is positive. Answer: 35.",
      prompt: "Find the answer.",
      type: "number",
    },
    {
      expr: "-45+(-30)",
      answer: "-75",
      hint: "Add the magnitudes, then keep their shared sign.",
      solution:
        "Add magnitudes: 45 + 30 = 75. Keep the negative sign. Answer: -75.",
      prompt: "Find the answer.",
      type: "number",
    },
    {
      expr: "80-(35)",
      answer: "45",
      hint: "Rewrite subtraction as adding the opposite, then compare signs.",
      solution:
        "80 − (35) = 80 + (-35). Subtract magnitudes: 80 − 35 = 45. The larger magnitude belongs to the 80, so the result is positive. Answer: 45.",
      prompt: "Find the answer.",
      type: "number",
    },
    {
      expr: "25-(70)",
      answer: "-45",
      hint: "Rewrite subtraction as adding the opposite, then compare signs.",
      solution:
        "25 − (70) = 25 + (-70). Subtract magnitudes: 70 − 25 = 45. The larger magnitude belongs to the -70, so the result is negative. Answer: -45.",
      prompt: "Find the answer.",
      type: "number",
    },
    {
      expr: "-40-(25)",
      answer: "-65",
      hint: "Rewrite subtraction as adding the opposite, then compare signs.",
      solution:
        "-40 − (25) = -40 + (-25). Add magnitudes: 40 + 25 = 65. Keep the negative sign. Answer: -65.",
      prompt: "Find the answer.",
      type: "number",
    },
    {
      expr: "30-(-45)",
      answer: "75",
      hint: "Rewrite subtraction as adding the opposite, then compare signs.",
      solution:
        "30 − (-45) = 30 + (45). Add magnitudes: 30 + 45 = 75. Keep the positive sign. Answer: 75.",
      prompt: "Find the answer.",
      type: "number",
    },
    {
      expr: "-65-(-25)",
      answer: "-40",
      hint: "Rewrite subtraction as adding the opposite, then compare signs.",
      solution:
        "-65 − (-25) = -65 + (25). Subtract magnitudes: 65 − 25 = 40. The larger magnitude belongs to the -65, so the result is negative. Answer: -40.",
      prompt: "Find the answer.",
      type: "number",
    },
    {
      expr: "-80+(120)",
      answer: "40",
      hint: "Subtract the smaller magnitude from the larger and keep the sign of the larger.",
      solution:
        "Subtract magnitudes: 120 − 80 = 40. The larger magnitude belongs to the 120, so the result is positive. Answer: 40.",
      prompt: "Find the answer.",
      type: "number",
    },
    {
      expr: "150+(-90)",
      answer: "60",
      hint: "Subtract the smaller magnitude from the larger and keep the sign of the larger.",
      solution:
        "Subtract magnitudes: 150 − 90 = 60. The larger magnitude belongs to the 150, so the result is positive. Answer: 60.",
      prompt: "Find the answer.",
      type: "number",
    },
    {
      expr: "-125+(75)",
      answer: "-50",
      hint: "Subtract the smaller magnitude from the larger and keep the sign of the larger.",
      solution:
        "Subtract magnitudes: 125 − 75 = 50. The larger magnitude belongs to the -125, so the result is negative. Answer: -50.",
      prompt: "Find the answer.",
      type: "number",
    },
    {
      expr: "200-(85)",
      answer: "115",
      hint: "Rewrite subtraction as adding the opposite, then compare signs.",
      solution:
        "200 − (85) = 200 + (-85). Subtract magnitudes: 200 − 85 = 115. The larger magnitude belongs to the 200, so the result is positive. Answer: 115.",
      prompt: "Find the answer.",
      type: "number",
    },
    {
      expr: "45-(120)",
      answer: "-75",
      hint: "Rewrite subtraction as adding the opposite, then compare signs.",
      solution:
        "45 − (120) = 45 + (-120). Subtract magnitudes: 120 − 45 = 75. The larger magnitude belongs to the -120, so the result is negative. Answer: -75.",
      prompt: "Find the answer.",
      type: "number",
    },
    {
      expr: "-140-(-60)",
      answer: "-80",
      hint: "Rewrite subtraction as adding the opposite, then compare signs.",
      solution:
        "-140 − (-60) = -140 + (60). Subtract magnitudes: 140 − 60 = 80. The larger magnitude belongs to the -140, so the result is negative. Answer: -80.",
      prompt: "Find the answer.",
      type: "number",
    },
    {
      expr: "95-(-35)",
      answer: "130",
      hint: "Rewrite subtraction as adding the opposite, then compare signs.",
      solution:
        "95 − (-35) = 95 + (35). Add magnitudes: 95 + 35 = 130. Keep the positive sign. Answer: 130.",
      prompt: "Find the answer.",
      type: "number",
    },
    {
      expr: "-175+(140)",
      answer: "-35",
      hint: "Subtract the smaller magnitude from the larger and keep the sign of the larger.",
      solution:
        "Subtract magnitudes: 175 − 140 = 35. The larger magnitude belongs to the -175, so the result is negative. Answer: -35.",
      prompt: "Find the answer.",
      type: "number",
    },
    {
      expr: "160+(-195)",
      answer: "-35",
      hint: "Subtract the smaller magnitude from the larger and keep the sign of the larger.",
      solution:
        "Subtract magnitudes: 195 − 160 = 35. The larger magnitude belongs to the -195, so the result is negative. Answer: -35.",
      prompt: "Find the answer.",
      type: "number",
    },
    {
      expr: "-90-(-150)",
      answer: "60",
      hint: "Rewrite subtraction as adding the opposite, then compare signs.",
      solution:
        "-90 − (-150) = -90 + (150). Subtract magnitudes: 150 − 90 = 60. The larger magnitude belongs to the 150, so the result is positive. Answer: 60.",
      prompt: "Find the answer.",
      type: "number",
    },
    {
      expr: "75+(-128)",
      answer: "-53",
      hint: "Subtract the smaller magnitude from the larger and keep the sign of the larger.",
      solution:
        "Subtract magnitudes: 128 − 75 = 53. The larger magnitude belongs to the -128, so the result is negative. Answer: -53.",
      prompt: "Find the answer.",
      type: "number",
    },
    {
      expr: "-156+(89)",
      answer: "-67",
      hint: "Subtract the smaller magnitude from the larger and keep the sign of the larger.",
      solution:
        "Subtract magnitudes: 156 − 89 = 67. The larger magnitude belongs to the -156, so the result is negative. Answer: -67.",
      prompt: "Find the answer.",
      type: "number",
    },
    {
      expr: "187-(94)",
      answer: "93",
      hint: "Rewrite subtraction as adding the opposite, then compare signs.",
      solution:
        "187 − (94) = 187 + (-94). Subtract magnitudes: 187 − 94 = 93. The larger magnitude belongs to the 187, so the result is positive. Answer: 93.",
      prompt: "Find the answer.",
      type: "number",
    },
    {
      expr: "118-(-67)",
      answer: "185",
      hint: "Rewrite subtraction as adding the opposite, then compare signs.",
      solution:
        "118 − (-67) = 118 + (67). Add magnitudes: 118 + 67 = 185. Keep the positive sign. Answer: 185.",
      prompt: "Find the answer.",
      type: "number",
    },
    {
      expr: "-200+(135)",
      answer: "-65",
      hint: "Subtract the smaller magnitude from the larger and keep the sign of the larger.",
      solution:
        "Subtract magnitudes: 200 − 135 = 65. The larger magnitude belongs to the -200, so the result is negative. Answer: -65.",
      prompt: "Find the answer.",
      type: "number",
    },
    {
      expr: "165+(-200)",
      answer: "-35",
      hint: "Subtract the smaller magnitude from the larger and keep the sign of the larger.",
      solution:
        "Subtract magnitudes: 200 − 165 = 35. The larger magnitude belongs to the -200, so the result is negative. Answer: -35.",
      prompt: "Find the answer.",
      type: "number",
    },
  ],
};
