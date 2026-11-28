/**
 * Pulls the series in series.ts from their publishers. Parsers are pure so
 * the tests can feed them recorded payloads; the fetch wrappers only add
 * the network.
 */

export type Point = { series: string; date: string; value: number };

const UA = "Mozilla/5.0 (compatible; SagaXHQ/1.0; +https://sagaxventures.com)";

/* ------------------------------------------------------------------ *
 * New York Fed: the effective fed funds rate and the target range.
 * ------------------------------------------------------------------ */

export function parseNyFed(body: unknown): Point[] {
  const rows = (body as { refRates?: unknown })?.refRates;
  if (!Array.isArray(rows)) return [];
  const out: Point[] = [];
  for (const r of rows as Record<string, unknown>[]) {
    const date = typeof r.effectiveDate === "string" ? r.effectiveDate : "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    if (typeof r.percentRate === "number") out.push({ series: "effr", date, value: r.percentRate });
    if (typeof r.targetRateTo === "number") out.push({ series: "fed-funds", date, value: r.targetRateTo });
  }
  return out;
}

export async function fetchNyFed(from: string, to: string): Promise<Point[]> {
  const url = `https://markets.newyorkfed.org/api/rates/unsecured/effr/search.json?startDate=${from}&endDate=${to}`;
  const r = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30_000), cache: "no-store" });
  if (!r.ok) throw new Error(`New York Fed answered ${r.status}`);
  return parseNyFed(await r.json());
}

/* ------------------------------------------------------------------ *
 * BLS: CPI, core CPI, unemployment, payrolls, earnings.
 * ------------------------------------------------------------------ */

type Rule = { slug: string; derive: "level" | "change" | "mom" | "yoy" };

/**
 * BLS series id → how it becomes ours (one id can feed several series).
 *
 * The CPI index levels are kept too (cpi-index, core-cpi-index), unlisted
 * on the page, for the year-on-year estimate. BLS collected no October
 * 2025 prices (2025 shutdown), so it publishes no year-on-year change for
 * October 2026; levels let the estimate reach November regardless.
 */
export const BLS_SERIES: Record<string, readonly Rule[]> = {
  CUUR0000SA0: [
    { slug: "cpi-yoy", derive: "yoy" },
    { slug: "cpi-index", derive: "level" },
  ],
  CUUR0000SA0L1E: [
    { slug: "core-cpi-yoy", derive: "yoy" },
    { slug: "core-cpi-index", derive: "level" },
  ],
  // Seasonally adjusted, for the month-on-month change the market quotes.
  CUSR0000SA0: [{ slug: "cpi-mom", derive: "mom" }],
  CUSR0000SA0L1E: [{ slug: "core-cpi-mom", derive: "mom" }],
  LNS14000000: [{ slug: "unemployment", derive: "level" }],
  CES0000000001: [{ slug: "nfp", derive: "change" }],
  CES0500000003: [{ slug: "earnings-yoy", derive: "yoy" }],
  // Producer prices, final demand. Seasonally adjusted for the monthly
  // change, unadjusted for year on year (as BLS quotes them); the
  // unadjusted levels feed the year-on-year estimate.
  WPSFD4: [{ slug: "ppi-mom", derive: "mom" }],
  WPUFD4: [
    { slug: "ppi-yoy", derive: "yoy" },
    { slug: "ppi-index", derive: "level" },
  ],
  // Core: final demand less foods, energy and trade services.
  WPSFD49116: [{ slug: "core-ppi-mom", derive: "mom" }],
  WPUFD49116: [
    { slug: "core-ppi-yoy", derive: "yoy" },
    { slug: "core-ppi-index", derive: "level" },
  ],
};

type Monthly = Map<string, number>; // "2026-10" → value

/** Reads BLS v1/v2 JSON into one month→value map per BLS series id. */
export function parseBls(body: unknown): Map<string, Monthly> {
  const out = new Map<string, Monthly>();
  const series = (body as { Results?: { series?: unknown } })?.Results?.series;
  if (!Array.isArray(series)) return out;
  for (const s of series as Record<string, unknown>[]) {
    const id = typeof s.seriesID === "string" ? s.seriesID : "";
    const data = Array.isArray(s.data) ? (s.data as Record<string, unknown>[]) : [];
    const months: Monthly = new Map();
    for (const d of data) {
      const year = typeof d.year === "string" ? d.year : "";
      const period = typeof d.period === "string" ? d.period : "";
      const value = Number.parseFloat(typeof d.value === "string" ? d.value : "");
      // M13 is the annual average, not a month.
      if (!/^\d{4}$/.test(year) || !/^M(0[1-9]|1[0-2])$/.test(period) || !Number.isFinite(value)) continue;
      months.set(`${year}-${period.slice(1)}`, value);
    }
    if (id) out.set(id, months);
  }
  return out;
}

function previousMonth(key: string, back: number): string {
  const [y, m] = key.split("-").map(Number);
  const total = y * 12 + (m - 1) - back;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

/** Turns raw BLS months into our points: levels, monthly changes or year-on-year %. */
export function deriveBls(raw: Map<string, Monthly>): Point[] {
  const out: Point[] = [];
  for (const [id, rules] of Object.entries(BLS_SERIES)) {
    const months = raw.get(id);
    if (!months) continue;
    for (const rule of rules)
    for (const [key, value] of months) {
      let derived: number | null = null;
      if (rule.derive === "level") derived = value;
      if (rule.derive === "change") {
        const prior = months.get(previousMonth(key, 1));
        derived = prior === undefined ? null : value - prior;
      }
      if (rule.derive === "mom") {
        const prior = months.get(previousMonth(key, 1));
        derived = prior ? ((value - prior) / prior) * 100 : null;
      }
      if (rule.derive === "yoy") {
        const prior = months.get(previousMonth(key, 12));
        derived = prior ? ((value - prior) / prior) * 100 : null;
      }
      if (derived === null || !Number.isFinite(derived)) continue;
      out.push({ series: rule.slug, date: `${key}-01`, value: Math.round(derived * 1000) / 1000 });
    }
  }
  return out;
}

export async function fetchBls(startYear: number, endYear: number, key?: string): Promise<Point[]> {
  const body: Record<string, unknown> = {
    seriesid: Object.keys(BLS_SERIES),
    startyear: String(startYear),
    endyear: String(endYear),
  };
  if (key) body.registrationkey = key;
  // v2 with a key allows 20 years a request; v1 without one allows 10.
  const url = key
    ? "https://api.bls.gov/publicAPI/v2/timeseries/data/"
    : "https://api.bls.gov/publicAPI/v1/timeseries/data/";
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": UA },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`BLS answered ${r.status}`);
  const json = (await r.json()) as { status?: string; message?: string[] };
  if (json.status && json.status !== "REQUEST_SUCCEEDED") {
    throw new Error(`BLS: ${json.status} ${(json.message ?? []).join(" ").slice(0, 200)}`);
  }
  return deriveBls(parseBls(json));
}

/* ------------------------------------------------------------------ *
 * US Treasury: daily par yield curve and real yield curve, by year.
 * ------------------------------------------------------------------ */

/** Reads Treasury's CSV, taking the named columns into our series. */
export function parseTreasuryCsv(csv: string, columns: Record<string, string>): Point[] {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const header = lines[0].split(",").map((h) => h.replace(/"/g, "").trim().toUpperCase());
  const wanted = Object.entries(columns)
    .map(([column, series]) => ({ index: header.indexOf(column.toUpperCase()), series }))
    .filter((w) => w.index > 0);
  const out: Point[] = [];
  for (const line of lines.slice(1)) {
    const cells = line.split(",");
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(cells[0]?.trim() ?? "");
    if (!m) continue;
    const date = `${m[3]}-${m[1]}-${m[2]}`;
    for (const w of wanted) {
      const value = Number.parseFloat(cells[w.index] ?? "");
      if (Number.isFinite(value)) out.push({ series: w.series, date, value });
    }
  }
  return out;
}

async function treasuryYear(type: string, year: number): Promise<string> {
  const url = `https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv/${year}/all?type=${type}&field_tdr_date_value=${year}&page&_format=csv`;
  const r = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30_000), cache: "no-store" });
  if (!r.ok) throw new Error(`Treasury answered ${r.status} for ${type} ${year}`);
  return r.text();
}

export async function fetchTreasury(years: number[]): Promise<Point[]> {
  const out: Point[] = [];
  for (const year of years) {
    out.push(...parseTreasuryCsv(await treasuryYear("daily_treasury_yield_curve", year), { "2 Yr": "us2y", "10 Yr": "us10y" }));
    out.push(...parseTreasuryCsv(await treasuryYear("daily_treasury_real_yield_curve", year), { "10 YR": "us10y-real" }));
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * BEA: GDP growth and the PCE price indexes (the Fed's inflation gauge).
 * Needs a free BEA UserID (apps.bea.gov/api/signup), set as BEA_API_KEY.
 * ------------------------------------------------------------------ */

type BeaRow = { SeriesCode?: string; LineDescription?: string; TimePeriod?: string; DataValue?: string };

/** Which rows of which NIPA table become which of our series. */
export const BEA_TABLES: {
  table: string;
  frequency: "Q" | "M";
  rows: { slug: string; match: (r: BeaRow) => boolean }[];
}[] = [
  {
    // Table 1.1.1: percent change in real GDP, at an annual rate.
    table: "T10101",
    frequency: "Q",
    rows: [{ slug: "gdp", match: (r) => r.SeriesCode === "A191RL" || r.LineDescription === "Gross domestic product" }],
  },
  {
    // Table 2.8.4: PCE price indexes, monthly, seasonally adjusted.
    table: "T20804",
    frequency: "M",
    rows: [
      { slug: "pce-index", match: (r) => r.LineDescription === "Personal consumption expenditures (PCE)" },
      { slug: "core-pce-index", match: (r) => r.LineDescription === "PCE excluding food and energy" },
    ],
  },
];

/** "2026Q3" ? "2026-07-01", "2026M10" ? "2026-10-01". */
export function beaPeriod(period: string): string | null {
  const q = /^(\d{4})Q([1-4])$/.exec(period);
  if (q) return `${q[1]}-${String((Number(q[2]) - 1) * 3 + 1).padStart(2, "0")}-01`;
  const m = /^(\d{4})M(0[1-9]|1[0-2])$/.exec(period);
  if (m) return `${m[1]}-${m[2]}-01`;
  return null;
}

/** Reads one BEA GetData reply into our points for that table. */
export function parseBea(body: unknown, table: (typeof BEA_TABLES)[number]): Point[] {
  const api = (body as { BEAAPI?: { Results?: { Data?: unknown; Error?: unknown }; Error?: unknown } })?.BEAAPI;
  const error = api?.Error ?? api?.Results?.Error;
  if (error) throw new Error(`BEA: ${JSON.stringify(error).slice(0, 200)}`);
  const data = api?.Results?.Data;
  if (!Array.isArray(data)) return [];
  const out: Point[] = [];
  for (const r of data as BeaRow[]) {
    const rule = table.rows.find((x) => x.match(r));
    if (!rule) continue;
    const date = beaPeriod(r.TimePeriod ?? "");
    const value = Number.parseFloat((r.DataValue ?? "").replace(/,/g, ""));
    if (!date || !Number.isFinite(value)) continue;
    out.push({ series: rule.slug, date, value });
  }
  return out;
}

/** Month-on-month and year-on-year % from an index series (the PCE price indexes). */
export function deriveFromIndex(points: Point[], index: string, mom: string, yoy: string): Point[] {
  const byDate = new Map(points.filter((p) => p.series === index).map((p) => [p.date, p.value]));
  const out: Point[] = [];
  const shift = (date: string, back: number) => {
    const [y, m] = date.split("-").map(Number);
    const t = y * 12 + (m - 1) - back;
    return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, "0")}-01`;
  };
  for (const [date, value] of byDate) {
    const prev = byDate.get(shift(date, 1));
    const year = byDate.get(shift(date, 12));
    if (prev) out.push({ series: mom, date, value: Math.round(((value - prev) / prev) * 100 * 1000) / 1000 });
    if (year) out.push({ series: yoy, date, value: Math.round(((value - year) / year) * 100 * 1000) / 1000 });
  }
  return out;
}

export async function fetchBea(years: number[], key: string): Promise<Point[]> {
  const out: Point[] = [];
  for (const table of BEA_TABLES) {
    const params = new URLSearchParams({
      UserID: key,
      method: "GetData",
      datasetname: "NIPA",
      TableName: table.table,
      Frequency: table.frequency,
      Year: years.join(","),
      ResultFormat: "JSON",
    });
    const r = await fetch(`https://apps.bea.gov/api/data/?${params}`, {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(30_000),
      cache: "no-store",
    });
    if (!r.ok) throw new Error(`BEA answered ${r.status} for ${table.table}`);
    out.push(...parseBea(await r.json(), table));
  }
  out.push(...deriveFromIndex(out, "pce-index", "pce-mom", "pce-yoy"));
  out.push(...deriveFromIndex(out, "core-pce-index", "core-pce-mom", "core-pce-yoy"));
  return out;
}
