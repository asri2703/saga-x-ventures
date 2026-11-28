"use client";

import { useEffect, useRef, useState } from "react";
import { THEME_EVENT, type HqTheme } from "@/lib/hq-theme";

/**
 * The market bar under HQ's header: TradingView's free Ticker Tape widget
 * with gold, the dollar index, the seven majors and the US 10-year yield.
 * Prices come from TradingView in their own iframe; the attribution link
 * their terms ask for is kept. Follows HQ's light/dark switch.
 */

const SYMBOLS = [
  { proName: "OANDA:XAUUSD", title: "Gold" },
  { proName: "CAPITALCOM:DXY", title: "Dollar index" },
  { proName: "OANDA:EURUSD", title: "EURUSD" },
  { proName: "OANDA:GBPUSD", title: "GBPUSD" },
  { proName: "OANDA:USDJPY", title: "USDJPY" },
  { proName: "OANDA:USDCHF", title: "USDCHF" },
  { proName: "OANDA:AUDUSD", title: "AUDUSD" },
  { proName: "OANDA:USDCAD", title: "USDCAD" },
  { proName: "OANDA:NZDUSD", title: "NZDUSD" },
  { proName: "TVC:US10Y", title: "US 10Y yield" },
];

export function MarketTape() {
  const host = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<HqTheme | null>(null);

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
    el.innerHTML = "";
    const widget = document.createElement("div");
    widget.className = "tradingview-widget-container__widget";
    el.appendChild(widget);
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.async = true;
    script.type = "text/javascript";
    script.innerHTML = JSON.stringify({
      symbols: SYMBOLS,
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: "adaptive",
      colorTheme: theme,
      locale: "en",
    });
    el.appendChild(script);
    return () => {
      el.innerHTML = "";
    };
  }, [theme]);

  return (
    <div className="flex items-center border-b border-border bg-card">
      <div ref={host} className="tradingview-widget-container h-[46px] min-w-0 flex-1 overflow-hidden" />
      <a
        href="https://www.tradingview.com/"
        rel="noopener nofollow"
        target="_blank"
        className="shrink-0 border-l border-border px-2.5 text-[10px] leading-tight text-muted-foreground hover:text-foreground"
      >
        Prices by
        <br />
        TradingView
      </a>
    </div>
  );
}
