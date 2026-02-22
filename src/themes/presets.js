// Theme presets — each defines the 15 raw CSS palette variables.
// Semantic aliases (--body-background-color, --accent-color, etc.) follow automatically via var() in shared.css.
// Derived from the monorepo's ThemeManager.ts HSL values, converted to hex.

export const THEMES = {
  "tokyo-night": {
    "--red": "#f7768e", "--orange": "#ff9e64", "--yellow": "#e0af68",
    "--weird": "#cfc9c2", "--green": "#73daca", "--cyan": "#7dcfff",
    "--blue": "#7aa2f7", "--magenta": "#bb9af7",
    "--lightest": "#c0caf5", "--lighter": "#a9b1d6", "--light": "#9aa5ce",
    "--grey": "#565f89", "--dark": "#414868", "--darker": "#24283b", "--darkest": "#1a1b26",
  },
  "tokyo-night-light": {
    "--red": "#d92626", "--orange": "#cf8217", "--yellow": "#cfa117",
    "--weird": "#b5b6ba", "--green": "#248f47", "--cyan": "#30b4e8",
    "--blue": "#2f7de9", "--magenta": "#5999ee",
    "--lightest": "#272b3f", "--lighter": "#3c4362", "--light": "#4e5873",
    "--grey": "#f7f7f8", "--dark": "#ebecef", "--darker": "#e0e1e6", "--darkest": "#d6d7dc",
  },
  "dracula": {
    "--red": "#ff5555", "--orange": "#ffb86c", "--yellow": "#f1fa8c",
    "--weird": "#4a5882", "--green": "#50fa7b", "--cyan": "#8be9fd",
    "--blue": "#bd93f9", "--magenta": "#ff79c6",
    "--lightest": "#f8f8f2", "--lighter": "#f8f8f2", "--light": "#6272a4",
    "--grey": "#44475a", "--dark": "#343746", "--darker": "#282a36", "--darkest": "#44475a",
  },
  "nord": {
    "--red": "#bf616a", "--orange": "#d08770", "--yellow": "#ebcb8b",
    "--weird": "#4c566a", "--green": "#a3be8c", "--cyan": "#88c0d0",
    "--blue": "#88c0d0", "--magenta": "#8fbcbb",
    "--lightest": "#eceff4", "--lighter": "#e5e9f0", "--light": "#d8dee9",
    "--grey": "#4c566a", "--dark": "#3b4252", "--darker": "#2e3440", "--darkest": "#3b4252",
  },
  "catppuccin": {
    "--red": "#f38ba8", "--orange": "#fab387", "--yellow": "#f9e2af",
    "--weird": "#585b70", "--green": "#a6e3a1", "--cyan": "#89dceb",
    "--blue": "#cba6f7", "--magenta": "#f5c2e7",
    "--lightest": "#cdd6f4", "--lighter": "#bac2de", "--light": "#a6adc8",
    "--grey": "#585b70", "--dark": "#28283e", "--darker": "#1e1e2e", "--darkest": "#313244",
  },
  "catppuccin-light": {
    "--red": "#d20f39", "--orange": "#fe640b", "--yellow": "#df8e1d",
    "--weird": "#9ca0b0", "--green": "#40a02b", "--cyan": "#179299",
    "--blue": "#8839ef", "--magenta": "#dd7878",
    "--lightest": "#2b2c3b", "--lighter": "#4c4f69", "--light": "#5c5f77",
    "--grey": "#ffffff", "--dark": "#f9fafb", "--darker": "#eff1f5", "--darkest": "#dce0e8",
  },
  "gruvbox": {
    "--red": "#fb4934", "--orange": "#fe8019", "--yellow": "#fabd2f",
    "--weird": "#7c6f64", "--green": "#b8bb26", "--cyan": "#8ec07c",
    "--blue": "#d79921", "--magenta": "#fabd2f",
    "--lightest": "#fbf1c7", "--lighter": "#ebdbb2", "--light": "#928374",
    "--grey": "#504945", "--dark": "#3c3836", "--darker": "#282828", "--darkest": "#1d2021",
  },
  "gruvbox-light": {
    "--red": "#cc241d", "--orange": "#d65d0e", "--yellow": "#d79921",
    "--weird": "#a89984", "--green": "#98971a", "--cyan": "#689d6a",
    "--blue": "#d79921", "--magenta": "#b57614",
    "--lightest": "#1d2021", "--lighter": "#3c3836", "--light": "#504945",
    "--grey": "#fefaec", "--dark": "#fcf5d9", "--darker": "#fbf1c7", "--darkest": "#ebdbb2",
  },
  "one-dark": {
    "--red": "#e06c75", "--orange": "#d19a66", "--yellow": "#e5c07b",
    "--weird": "#3e4451", "--green": "#98c379", "--cyan": "#56b6c2",
    "--blue": "#61afef", "--magenta": "#c678dd",
    "--lightest": "#dcdfe5", "--lighter": "#abb2bf", "--light": "#7b8493",
    "--grey": "#3e4451", "--dark": "#31363f", "--darker": "#282c34", "--darkest": "#21252b",
  },
  "github-dark": {
    "--red": "#f85149", "--orange": "#d29922", "--yellow": "#e3b341",
    "--weird": "#2f353c", "--green": "#3fb950", "--cyan": "#58a6ff",
    "--blue": "#58a6ff", "--magenta": "#bc8cff",
    "--lightest": "#f0f6fc", "--lighter": "#c9d1d9", "--light": "#8b949e",
    "--grey": "#30363d", "--dark": "#21262d", "--darker": "#0d1117", "--darkest": "#010409",
  },
  "rose-pine": {
    "--red": "#eb6f92", "--orange": "#ebbcba", "--yellow": "#f6c177",
    "--weird": "#524f67", "--green": "#31748f", "--cyan": "#9ccfd8",
    "--blue": "#c4a7e7", "--magenta": "#ebbcba",
    "--lightest": "#e0def4", "--lighter": "#e0def4", "--light": "#6e6a86",
    "--grey": "#524f67", "--dark": "#26233a", "--darker": "#191724", "--darkest": "#1f1d2e",
  },
  "solarized": {
    "--red": "#dc322f", "--orange": "#cb4b16", "--yellow": "#b58900",
    "--weird": "#586e75", "--green": "#859900", "--cyan": "#2aa198",
    "--blue": "#268bd2", "--magenta": "#6c71c4",
    "--lightest": "#fdf6e3", "--lighter": "#eee8d5", "--light": "#93a1a1",
    "--grey": "#586e75", "--dark": "#073642", "--darker": "#002b36", "--darkest": "#002b36",
  },
  "solarized-light": {
    "--red": "#dc322f", "--orange": "#cb4b16", "--yellow": "#b58900",
    "--weird": "#93a1a1", "--green": "#859900", "--cyan": "#2aa198",
    "--blue": "#268bd2", "--magenta": "#6c71c4",
    "--lightest": "#002b36", "--lighter": "#073642", "--light": "#586e75",
    "--grey": "#eee8d5", "--dark": "#fdf6e3", "--darker": "#fdf6e3", "--darkest": "#eee8d5",
  },
  "ayu-mirage": {
    "--red": "#f07178", "--orange": "#ffad66", "--yellow": "#ffd173",
    "--weird": "#434756", "--green": "#d5ff80", "--cyan": "#73d0ff",
    "--blue": "#ffad66", "--magenta": "#f28779",
    "--lightest": "#e6e1cf", "--lighter": "#cccac2", "--light": "#5c6773",
    "--grey": "#575c70", "--dark": "#2d3243", "--darker": "#1f2430", "--darkest": "#1a1e2a",
  },
};

export const THEME_NAMES = Object.keys(THEMES);
export default THEMES;
