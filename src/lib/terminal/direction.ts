/**
 * Where gold and the majors are heading, as the overview's first card reads
 * it: for each instrument, how many of the wire's stories point up or down
 * over the last day, three days or week, beside the speculators' COT net
 * position for the last eight weeks. Pure; the page reads the rows.
 */

export const WINDOWS = [
  { id: "1d", label: "24h", hours: 24, chartRange: "1D" },
  { id: "3d", label: "3D", hours: 72, chartRange: "1M" },
  { id: "1w", label: "1W", hours: 168, chartRange: "1M" },
] as const;
export type WindowId = (typeof WINDOWS)[number]["id"];

export type Lean = { up: number; down: number };
export type LeanTrend = "up" | "down" | "flat";

type Story = { last_update_at: string; assets?: { symbol: string; direction: string }[] | null };

/** Stories that point each way for one instrument since a moment. */
export function leanFor(stories: Story[], symbol: string, since: number): Lean {
  const lean: Lean = { up: 0, down: 0 };
  for (const s of stories) {
    if (Date.parse(s.last_update_at) < since) continue;
    const move = s.assets?.find((a) => a.symbol === symbol);
    if (move?.direction === "up") lean.up += 1;
    else if (move?.direction === "down") lean.down += 1;
  }
  return lean;
}

/**
 * One side leads when it holds at least 60% of the directional stories
 * (the same bar as the overview's "News bias for gold"); otherwise flat.
 */
export function leanTrend({ up, down }: Lean): LeanTrend {
  const total = up + down;
  if (total === 0) return "flat";
  const tilt = (up - down) / total;
  if (tilt >= 0.2) return "up";
  if (tilt <= -0.2) return "down";
  return "flat";
}

/** Each instrument's lean in every window, ready for the card. */
export function leansByWindow(stories: Story[], symbols: readonly string[], now: number) {
  const out: Record<string, Record<WindowId, Lean>> = {};
  for (const symbol of symbols) {
    out[symbol] = Object.fromEntries(
      WINDOWS.map((w) => [w.id, leanFor(stories, symbol, now - w.hours * 3_600_000)]),
    ) as Record<WindowId, Lean>;
  }
  return out;
}

/** TradingView's symbol for each instrument: OANDA's spot quotes, ICE's dollar index. */
export const CHART_SYMBOL: Record<string, string> = {
  XAUUSD: "OANDA:XAUUSD",
  DXY: "TVC:DXY",
  EURUSD: "OANDA:EURUSD",
  GBPUSD: "OANDA:GBPUSD",
  USDJPY: "OANDA:USDJPY",
  USDCHF: "OANDA:USDCHF",
  AUDUSD: "OANDA:AUDUSD",
  USDCAD: "OANDA:USDCAD",
  NZDUSD: "OANDA:NZDUSD",
};

/** What a member calls each instrument. */
export const PLAIN_NAME: Record<string, string> = {
  XAUUSD: "Gold",
  DXY: "US dollar index",
  EURUSD: "Euro",
  GBPUSD: "British pound",
  USDJPY: "Japanese yen",
  USDCHF: "Swiss franc",
  AUDUSD: "Australian dollar",
  USDCAD: "Canadian dollar",
  NZDUSD: "New Zealand dollar",
};
