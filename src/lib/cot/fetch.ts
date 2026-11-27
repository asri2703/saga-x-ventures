import { COT_DATASETS, COT_MARKETS, type CotReport } from "./markets";

/**
 * Reads Commitments of Traders rows from the CFTC's public reporting API
 * (publicreporting.cftc.gov, Socrata). US government data, no key needed.
 */

export type CotRow = {
  market: string;
  report_date: string;
  open_interest: number;
  spec_long: number;
  spec_short: number;
  hedge_long: number;
  hedge_short: number;
};

const FIELDS: Record<CotReport, { specLong: string; specShort: string; hedgeLong: string; hedgeShort: string }> = {
  disaggregated: {
    specLong: "m_money_positions_long_all",
    specShort: "m_money_positions_short_all",
    hedgeLong: "prod_merc_positions_long",
    hedgeShort: "prod_merc_positions_short",
  },
  tff: {
    specLong: "lev_money_positions_long",
    specShort: "lev_money_positions_short",
    hedgeLong: "dealer_positions_long_all",
    hedgeShort: "dealer_positions_short_all",
  },
};

const BY_CODE = new Map(COT_MARKETS.map((m) => [m.code, m]));

function int(value: unknown): number | null {
  const n = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) ? n : null;
}

/** Keeps rows for markets HQ follows, with every number present. */
export function parseCot(rows: unknown, report: CotReport): CotRow[] {
  if (!Array.isArray(rows)) return [];
  const f = FIELDS[report];
  const out: CotRow[] = [];
  for (const raw of rows) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const market = BY_CODE.get(String(r.cftc_contract_market_code ?? "").trim());
    if (!market || market.report !== report) continue;
    const date = String(r.report_date_as_yyyy_mm_dd ?? "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    const values = [r.open_interest_all, r[f.specLong], r[f.specShort], r[f.hedgeLong], r[f.hedgeShort]].map(int);
    if (values.some((v) => v === null)) continue;
    const [oi, sl, ss, hl, hs] = values as number[];
    out.push({
      market: market.slug,
      report_date: date,
      open_interest: oi,
      spec_long: sl,
      spec_short: ss,
      hedge_long: hl,
      hedge_short: hs,
    });
  }
  return out;
}

export function cotUrl(report: CotReport, since: string): string {
  const codes = COT_MARKETS.filter((m) => m.report === report)
    .map((m) => `'${m.code}'`)
    .join(",");
  const params = new URLSearchParams({
    $where: `cftc_contract_market_code in(${codes}) AND report_date_as_yyyy_mm_dd >= '${since}T00:00:00'`,
    $order: "report_date_as_yyyy_mm_dd ASC",
    $limit: "50000",
  });
  return `https://publicreporting.cftc.gov/resource/${COT_DATASETS[report]}.json?${params}`;
}

/** Both reports from `since` (YYYY-MM-DD). Throws if either request fails. */
export async function fetchCot(since: string): Promise<CotRow[]> {
  const reports: CotReport[] = ["disaggregated", "tff"];
  const parts = await Promise.all(
    reports.map(async (report) => {
      const response = await fetch(cotUrl(report, since), {
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(60_000),
      });
      if (!response.ok) throw new Error(`CFTC ${report}: HTTP ${response.status}`);
      return parseCot(await response.json(), report);
    }),
  );
  return parts.flat();
}
