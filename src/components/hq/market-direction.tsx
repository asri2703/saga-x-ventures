"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, MotionConfig } from "motion/react";
import { ChevronRight } from "lucide-react";
import { CHART_SYMBOL, leanTrend, WINDOWS, type Lean, type WindowId } from "@/lib/terminal/direction";
import { cn } from "@/lib/utils";
import { InstrumentIcon } from "./instrument-icon";
import { TradingViewMini } from "./tradingview-mini";
import { TrendIcon } from "./trend-icon";

/**
 * The overview's first card: where gold and the majors are heading. Each row
 * is one instrument with the speculators' net position over eight weeks (the
 * sparkline), how the wire's stories lean in the chosen window, and which way
 * the funds sit. Picking a row puts its price chart (TradingView) on the left.
 */

export type DirectionRow = {
  symbol: string;
  name: string;
  leans: Record<WindowId, Lean>;
  cot: { slug: string; history: number[]; bias: "Bullish" | "Bearish" | "Flat" } | null;
};

const UP = "#1f7a4d";
const DOWN = "#c81f30";

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return <span className="block h-6 w-20" aria-hidden />;
  const w = 80;
  const h = 24;
  const pad = 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((d, i) => `${(i / (data.length - 1)) * w},${h - pad - ((d - min) / range) * (h - 2 * pad)}`)
    .join(" ");
  const rising = data[data.length - 1] >= data[0];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible" aria-hidden>
      <motion.polyline
        fill="none"
        stroke={rising ? UP : DOWN}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
    </svg>
  );
}

function leanWords({ up, down }: Lean): string {
  if (up + down === 0) return "No stories";
  return `${up} up · ${down} down`;
}

const FUNDS: Record<"Bullish" | "Bearish" | "Flat", { label: string; className: string }> = {
  Bullish: { label: "Funds long", className: "border-[#1f7a4d]/30 bg-[#1f7a4d]/10 text-[#1f7a4d]" },
  Bearish: { label: "Funds short", className: "border-[#c81f30]/30 bg-[#c81f30]/10 text-[#c81f30]" },
  Flat: { label: "Funds flat", className: "border-border bg-muted text-muted-foreground" },
};

export function MarketDirection({ rows, base, today }: { rows: DirectionRow[]; base: string; today: string }) {
  const [win, setWin] = useState<WindowId>("1d");
  const [picked, setPicked] = useState(rows[0]?.symbol ?? "XAUUSD");
  const span = WINDOWS.find((w) => w.id === win) ?? WINDOWS[0];
  const gold = rows.find((r) => r.symbol === "XAUUSD");
  const goldTrend = gold ? leanTrend(gold.leans[win]) : "flat";
  const current = rows.find((r) => r.symbol === picked) ?? rows[0];
  if (!current) return null;
  const currentLean = current.leans[win];

  return (
    <MotionConfig reducedMotion="user">
      <section aria-labelledby="direction-title" className="overflow-hidden rounded-3xl border border-border bg-card">
        <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
          <h2 id="direction-title" className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-news text-lg font-semibold">Market direction</span>
            <span className="text-muted-foreground" aria-hidden>
              /
            </span>
            <span className="text-xs text-muted-foreground">{today}</span>
            <span className="text-muted-foreground" aria-hidden>
              ·
            </span>
            <span className="inline-flex items-center gap-1 font-semibold">
              <TrendIcon trend={goldTrend} className="size-5" label={`gold ${goldTrend}`} />
              Gold
            </span>
          </h2>
          <div role="tablist" aria-label="News window" className="flex items-center gap-1 text-xs font-semibold">
            {WINDOWS.map((w) => (
              <button
                key={w.id}
                role="tab"
                aria-selected={win === w.id}
                onClick={() => setWin(w.id)}
                className={cn(
                  "relative rounded-md px-2.5 py-1.5 transition-colors",
                  win === w.id ? "text-[#163a30]" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {win === w.id ? (
                  <motion.span
                    layoutId="direction-window"
                    className="absolute inset-0 rounded-md border border-[#e3c98f] bg-[#f0dcae]"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                ) : null}
                <span className="relative">{w.label}</span>
              </button>
            ))}
          </div>
        </header>

        <div className="grid border-t border-border lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <div className="flex flex-col gap-3 bg-muted/40 p-4 sm:p-5 lg:border-r lg:border-border">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <InstrumentIcon symbol={current.symbol} />
                <div className="min-w-0">
                  <p className="font-semibold">{current.symbol}</p>
                  <p className="truncate text-xs text-muted-foreground">{current.name}</p>
                </div>
              </div>
              <p className="flex shrink-0 items-center gap-1.5 text-sm">
                <TrendIcon trend={leanTrend(currentLean)} className="size-4" label={`news ${leanTrend(currentLean)}`} />
                <span className="text-muted-foreground">{leanWords(currentLean)}</span>
              </p>
            </div>
            <div className="min-h-56 flex-1">
              <TradingViewMini symbol={CHART_SYMBOL[current.symbol] ?? current.symbol} range={span.chartRange} />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold text-[#2f6fd6]">
              <Link href={`${base}/terminal?asset=${current.symbol}`} className="inline-flex items-center hover:underline">
                {current.symbol} in Feeds <ChevronRight className="size-4" aria-hidden />
              </Link>
              {current.cot ? (
                <Link href={`${base}/cot/${current.cot.slug}`} className="inline-flex items-center hover:underline">
                  Smart Money <ChevronRight className="size-4" aria-hidden />
                </Link>
              ) : null}
            </div>
          </div>

          <ul className="divide-y divide-border">
            {rows.map((row) => {
              const lean = row.leans[win];
              const trend = leanTrend(lean);
              const funds = row.cot ? FUNDS[row.cot.bias] : null;
              const active = row.symbol === current.symbol;
              return (
                <li key={row.symbol}>
                  <button
                    type="button"
                    onClick={() => setPicked(row.symbol)}
                    aria-pressed={active}
                    className={cn(
                      "grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5 text-left transition-colors sm:grid-cols-[minmax(0,1fr)_5rem_7.5rem_6rem] sm:px-5",
                      active ? "bg-[#f0dcae]/45" : "hover:bg-muted/50",
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <InstrumentIcon symbol={row.symbol} />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">{row.symbol}</span>
                        <span className="block truncate text-[11px] text-muted-foreground">{row.name}</span>
                      </span>
                    </span>
                    <span className="hidden sm:block">{row.cot ? <Sparkline data={row.cot.history} /> : null}</span>
                    <span className="flex items-center justify-end gap-1.5 text-xs sm:justify-start">
                      <TrendIcon trend={trend} className="size-4" label={`news ${trend}`} />
                      <span className="text-muted-foreground tabular-nums">{leanWords(lean)}</span>
                    </span>
                    {funds ? (
                      <span
                        className={cn(
                          "hidden justify-self-end rounded-full border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap sm:inline-block",
                          funds.className,
                        )}
                      >
                        {funds.label}
                      </span>
                    ) : (
                      <span className="hidden sm:block" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        <p className="border-t border-border px-4 py-2.5 text-[11px] text-muted-foreground sm:px-5">
          Arrows count the wire&apos;s stories that point each way in the window. The line is the speculators&apos;
          net COT position on the pair over eight weeks; Funds long or short is how they sit on the pair.
        </p>
      </section>
    </MotionConfig>
  );
}
