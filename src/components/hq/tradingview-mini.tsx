"use client";

import { useEffect, useRef, useState } from "react";
import { THEME_EVENT, type HqTheme } from "@/lib/hq-theme";

/**
 * TradingView's free Mini Symbol Overview widget: a small price chart with
 * the last price and change, loaded from TradingView in an iframe of its
 * own. Their terms ask for the attribution link under it, which is kept.
 * Rebuilt whenever the symbol or range changes.
 */
export function TradingViewMini({ symbol, range }: { symbol: string; range: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<HqTheme | null>(null);

  // Read the mode from the HQ wrapper once mounted, then follow the switch.
  useEffect(() => {
    const dark = host.current?.closest(".hq-root")?.classList.contains("hq-dark");
    setTheme(dark ? "dark" : "light");
    const follow = (e: Event) => setTheme((e as CustomEvent<HqTheme>).detail);
    window.addEventListener(THEME_EVENT, follow);
    return () => window.removeEventListener(THEME_EVENT, follow);
  }, []);

  useEffect(() => {
    const el = host.current;
    if (!el || !theme) return;
    const dark = theme === "dark";
    el.innerHTML = "";
    const widget = document.createElement("div");
    widget.className = "tradingview-widget-container__widget h-full";
    el.appendChild(widget);
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
    script.async = true;
    script.type = "text/javascript";
    script.innerHTML = JSON.stringify({
      symbol,
      width: "100%",
      height: "100%",
      locale: "en",
      dateRange: range,
      colorTheme: dark ? "dark" : "light",
      isTransparent: true,
      autosize: true,
      largeChartUrl: "",
      trendLineColor: dark ? "rgba(127, 176, 255, 1)" : "rgba(11, 37, 69, 1)",
      underLineColor: dark ? "rgba(127, 176, 255, 0.18)" : "rgba(11, 37, 69, 0.12)",
      underLineBottomColor: dark ? "rgba(127, 176, 255, 0)" : "rgba(11, 37, 69, 0)",
    });
    el.appendChild(script);
    return () => {
      el.innerHTML = "";
    };
  }, [symbol, range, theme]);

  return (
    <div className="flex h-full flex-col">
      <div ref={host} className="tradingview-widget-container min-h-0 flex-1" />
      <p className="mt-1 text-[11px] text-muted-foreground">
        <a
          href={`https://www.tradingview.com/symbols/${symbol.replace(":", "-")}/`}
          target="_blank"
          rel="noopener nofollow"
          className="hover:underline"
        >
          Chart by TradingView
        </a>
      </p>
    </div>
  );
}
