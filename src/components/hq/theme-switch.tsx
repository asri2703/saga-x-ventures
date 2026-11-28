/*
 * From Uiverse.io by vinodjangid07 - https://uiverse.io/vinodjangid07/moody-rabbit-65
 * MIT License, Copyright (c) vinodjangid07 (Vinod Jangid)
 *
 * HQ's light/dark switch, in the header. The look and motion are the
 * original's (styles in globals.css under .hq-mode-switch); here it is a
 * React checkbox: on is dark. Flipping it stores the choice in a cookie for
 * the server's next render and applies it now, to the HQ wrapper and to
 * <html> so menus that open in portals follow too.
 */
"use client";

import { useEffect, useId, useState } from "react";
import { THEME_COOKIE, THEME_EVENT, type HqTheme } from "@/lib/hq-theme";

function apply(theme: HqTheme) {
  document.documentElement.dataset.hqTheme = theme;
  document.querySelectorAll(".hq-root").forEach((el) => el.classList.toggle("hq-dark", theme === "dark"));
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: theme }));
}

export function ThemeSwitch({ initial }: { initial: HqTheme }) {
  const id = useId();
  const [theme, setTheme] = useState<HqTheme>(initial);

  // Portals render outside the wrapper, so mirror the server's choice on <html> once loaded.
  useEffect(() => {
    document.documentElement.dataset.hqTheme = initial;
  }, [initial]);

  function change(dark: boolean) {
    const next: HqTheme = dark ? "dark" : "light";
    setTheme(next);
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    apply(next);
  }

  return (
    <span className="inline-flex items-center">
      <input
        type="checkbox"
        id={id}
        className="hq-mode-input"
        checked={theme === "dark"}
        onChange={(e) => change(e.target.checked)}
        aria-label="Dark mode"
      />
      <label htmlFor={id} className="hq-mode-switch" title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} />
    </span>
  );
}
