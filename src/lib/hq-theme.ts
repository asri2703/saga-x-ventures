/**
 * HQ's light and dark modes. The choice lives in a cookie so the server draws
 * the page in it from the first paint, with no flash of the other mode.
 * Shared by the layout (server) and the switch (client); no secrets here.
 */

export const THEME_COOKIE = "hq_theme";
export type HqTheme = "light" | "dark";

export function themeOf(value: string | undefined): HqTheme {
  return value === "dark" ? "dark" : "light";
}

/** Fired on window when the mode changes, for parts drawn outside React's tree (the TradingView chart). */
export const THEME_EVENT = "hq-theme";
