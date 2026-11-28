"use client";

import { useEffect, useRef } from "react";

/**
 * TradingView's free Mini Symbol Overview widget: a small price chart with
 * the last price and change, loaded from TradingView in an iframe of its
 * own. Their terms ask for the attribution link under it, which is kept.
 * Rebuilt whenever the symbol or range changes.
 */
export function TradingViewMini({ symbol, range }: { symbol: string; range: string }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
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
      colorTheme: "light",
      isTransparent: true,
      autosize: true,
      largeChartUrl: "",
      trendLineColor: "rgba(22, 58, 48, 1)",
      underLineColor: "rgba(22, 58, 48, 0.12)",
      underLineBottomColor: "rgba(22, 58, 48, 0)",
    });
    el.appendChild(script);
    return () => {
      el.innerHTML = "";
    };
  }, [symbol, range]);

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
