const KEY = "numi.appearance.v1";
export const defaults = {
  theme: "matcha",
  size: "comfortable",
  weight: "regular",
  motion: true,
};
const themes = ["matcha", "lavender", "ocean", "warm"];
const sizes = ["standard", "comfortable", "large"];
export function normalizeAppearance(value = {}) {
  return {
    theme: themes.includes(value.theme) ? value.theme : defaults.theme,
    size: sizes.includes(value.size) ? value.size : defaults.size,
    weight: value.weight === "bold" ? "bold" : "regular",
    motion: value.motion !== false,
  };
}
export function loadAppearance() {
  try {
    return normalizeAppearance(JSON.parse(localStorage.getItem(KEY)) || {});
  } catch {
    return { ...defaults };
  }
}
export function applyAppearance(value) {
  const settings = normalizeAppearance(value),
    root = document.documentElement;
  root.dataset.theme = settings.theme;
  root.dataset.textSize = settings.size;
  root.dataset.textWeight = settings.weight;
  root.dataset.motion = String(settings.motion);
  root.style.fontSize =
    { standard: 16, comfortable: 18, large: 20 }[settings.size] + "px";
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta)
    meta.setAttribute(
      "content",
      {
        matcha: "#55734b",
        lavender: "#7656c6",
        ocean: "#356e88",
        warm: "#9a5b3f",
      }[settings.theme],
    );
}
export function saveAppearance(value) {
  applyAppearance(value);
  try {
    localStorage.setItem(KEY, JSON.stringify(normalizeAppearance(value)));
    return true;
  } catch {
    return false;
  }
}
