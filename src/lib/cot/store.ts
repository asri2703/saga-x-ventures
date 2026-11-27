import { serviceClient } from "@/lib/supabase";
import type { CotRow } from "./fetch";
import { COT_MARKETS, type CotMarket } from "./markets";

/** Upserts in chunks; a re-run over the same weeks rewrites the same rows. */
export async function saveCot(rows: CotRow[]): Promise<number> {
  const db = serviceClient();
  for (let i = 0; i < rows.length; i += 1000) {
    const chunk = rows.slice(i, i + 1000).map((r) => ({ ...r, updated_at: new Date().toISOString() }));
    const { error } = await db.from("cot_positions").upsert(chunk, { onConflict: "market,report_date" });
    if (error) throw error;
  }
  return rows.length;
}

/** The newest report date on file for a market, or "" when there is none. */
export async function latestCotDate(market: string): Promise<string> {
  const { data, error } = await serviceClient()
    .from("cot_positions")
    .select("report_date")
    .eq("market", market)
    .order("report_date", { ascending: false })
    .limit(1);
  if (error) throw error;
  return (data?.[0]?.report_date as string | undefined) ?? "";
}

const COLUMNS = "market, report_date, open_interest, spec_long, spec_short, hedge_long, hedge_short";

function toRow(r: Record<string, unknown>): CotRow {
  return {
    market: String(r.market),
    report_date: String(r.report_date),
    open_interest: Number(r.open_interest),
    spec_long: Number(r.spec_long),
    spec_short: Number(r.spec_short),
    hedge_long: Number(r.hedge_long),
    hedge_short: Number(r.hedge_short),
  };
}

/** One market, oldest first, from `since` (or all of it). */
export async function readCotHistory(market: string, since?: string): Promise<CotRow[]> {
  const out: CotRow[] = [];
  for (let from = 0; ; from += 1000) {
    let query = serviceClient()
      .from("cot_positions")
      .select(COLUMNS)
      .eq("market", market)
      .order("report_date", { ascending: true })
      .range(from, from + 999);
    if (since) query = query.gte("report_date", since);
    const { data, error } = await query;
    if (error) throw error;
    for (const r of data ?? []) out.push(toRow(r));
    if (!data || data.length < 1000) break;
  }
  return out;
}

export type CotView = {
  market: CotMarket;
  date: string;
  net: number;
  change: number | null;
  longShare: number;
  netShareOfOi: number;
  /** How the speculative group leans on the pair a member trades. */
  pairBias: "Bullish" | "Bearish" | "Flat";
  history: { date: string; value: number }[];
};

/** Turns rows (any order, any markets) into one view per market that has data. */
export function cotViews(rows: CotRow[], weeks = 8): CotView[] {
  const views: CotView[] = [];
  for (const market of COT_MARKETS) {
    const mine = rows.filter((r) => r.market === market.slug).sort((a, b) => a.report_date.localeCompare(b.report_date));
    if (mine.length === 0) continue;
    const latest = mine[mine.length - 1];
    const previous = mine.length > 1 ? mine[mine.length - 2] : null;
    const net = latest.spec_long - latest.spec_short;
    const gross = latest.spec_long + latest.spec_short;
    const leaning = net * market.pairSign;
    views.push({
      market,
      date: latest.report_date,
      net,
      change: previous ? net - (previous.spec_long - previous.spec_short) : null,
      longShare: gross ? latest.spec_long / gross : 0.5,
      netShareOfOi: latest.open_interest ? net / latest.open_interest : 0,
      pairBias: leaning > 0 ? "Bullish" : leaning < 0 ? "Bearish" : "Flat",
      history: mine.slice(-weeks).map((r) => ({ date: r.report_date, value: r.spec_long - r.spec_short })),
    });
  }
  return views;
}

/** The latest weeks for every market, for the overview and the COT page. */
export async function readCotLatest(now: Date, weeks = 8): Promise<CotView[]> {
  const since = new Date(now.getTime() - (weeks + 3) * 7 * 86_400_000).toISOString().slice(0, 10);
  const { data, error } = await serviceClient()
    .from("cot_positions")
    .select(COLUMNS)
    .gte("report_date", since)
    .order("report_date", { ascending: true })
    .limit(1000);
  if (error) throw error;
  return cotViews((data ?? []).map(toRow), weeks);
}
