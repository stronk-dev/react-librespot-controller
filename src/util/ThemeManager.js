import THEMES from "../themes/presets.js";

const STORAGE_KEY = "spotify-player-theme";

export const applyTheme = (presetName) => {
  const preset = THEMES[presetName];
  if (!preset) return;
  const root = document.documentElement;
  Object.entries(preset).forEach(([prop, value]) => {
    root.style.setProperty(prop, value);
  });
  root.setAttribute("data-theme", presetName);
  try {
    localStorage.setItem(STORAGE_KEY, presetName);
  } catch (e) {
    // localStorage may be unavailable
  }
};

export const getSavedTheme = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) || "tokyo-night";
  } catch (e) {
    return "tokyo-night";
  }
};
