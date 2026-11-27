/**
 * Where Mastery Terminal's headlines come from.
 *
 * Each source is fetched on its own and fails on its own: a GDELT outage must
 * not stop the Fed's press release reaching members. Parsers are pure so the
 * tests can feed them recorded payloads.
 *
 * Only the headline, link, outlet and time are kept. Article bodies are never
 * stored or shown: members see our own summary and a link to the original.
 */

export type Headline = {
  url: string;
  headline: string;
  source: "gdelt" | "rss" | "finnhub";
  outlet: string;
  publishedAt: Date;
  /**
   * The outlet's own one or two line teaser, when its feed gives one. Used
   * only as context for the brief Claude writes; never shown to members.
   */
  snippet?: string;
};

/** How far back one run looks. A missed run is covered by the next. */
export const LOOKBACK_MINUTES = 60;

/* ------------------------------------------------------------------ *
 * GDELT: worldwide coverage of conflict, sanctions, tariffs and shipping.
 * Free, no key. Updates every 15 minutes.
 * ------------------------------------------------------------------ */

const GDELT_QUERY =
  '(gold OR "federal reserve" OR tariff OR tariffs OR sanctions OR iran OR israel OR "strait of hormuz" OR missile OR treasury OR inflation OR opec) sourcelang:english';

export function gdeltUrl(lookbackMinutes = LOOKBACK_MINUTES): string {
  const params = new URLSearchParams({
    query: GDELT_QUERY,
    mode: "artlist",
    format: "json",
    sort: "datedesc",
    maxrecords: "75",
    timespan: `${lookbackMinutes}min`,
  });
  return `https://api.gdeltproject.org/api/v2/doc/doc?${params}`;
}

/** GDELT writes times as 20261127T053000Z. */
export function parseGdeltDate(value: string): Date | null {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(value);
  if (!m) return null;
  const [, y, mo, d, h, mi, s] = m;
  const date = new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function parseGdelt(body: unknown): Headline[] {
  const articles = (body as { articles?: unknown })?.articles;
  if (!Array.isArray(articles)) return [];
  const out: Headline[] = [];
  for (const a of articles as Record<string, unknown>[]) {
    const url = typeof a.url === "string" ? a.url : "";
    const title = typeof a.title === "string" ? a.title.trim() : "";
    const when = typeof a.seendate === "string" ? parseGdeltDate(a.seendate) : null;
    if (!url || !title || !when) continue;
    out.push({
      url,
      headline: title,
      source: "gdelt",
      outlet: typeof a.domain === "string" ? a.domain : "",
      publishedAt: when,
    });
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * RSS: the Fed's own press releases, plus world and markets desks that
 * cover wars, sanctions and tariffs as they break. No keys.
 *
 * GDELT alone is not enough: its free API allows one request every five
 * seconds per IP, and Vercel's shared IPs are often over that, so it
 * answers 429 or times out. These feeds carry the run when it does.
 * ------------------------------------------------------------------ */

export const RSS_FEEDS: { url: string; outlet: string }[] = [
  { url: "https://www.federalreserve.gov/feeds/press_all.xml", outlet: "federalreserve.gov" },
  { url: "https://feeds.bbci.co.uk/news/world/rss.xml", outlet: "BBC World" },
  { url: "https://www.aljazeera.com/xml/rss/all.xml", outlet: "Al Jazeera" },
  { url: "https://www.cnbc.com/id/100727362/device/rss/rss.html", outlet: "CNBC World" },
  { url: "https://www.cnbc.com/id/20910258/device/rss/rss.html", outlet: "CNBC Economy" },
];

function decodeEntities(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}

/** Feeds put HTML in descriptions; keep the words only. */
function stripTags(text: string): string {
  return text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function tag(block: string, name: string): string {
  const m = new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i").exec(block);
  return m ? decodeEntities(m[1]) : "";
}

export function parseRss(xml: string, source: Headline["source"], outlet: string): Headline[] {
  const out: Headline[] = [];
  for (const m of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)) {
    const block = m[1];
    const headline = tag(block, "title");
    const url = tag(block, "link");
    const when = new Date(tag(block, "pubDate"));
    if (!headline || !url || Number.isNaN(when.getTime())) continue;
    const snippet = stripTags(tag(block, "description")).slice(0, 400);
    out.push({ url, headline, source, outlet, publishedAt: when, ...(snippet ? { snippet } : {}) });
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * Finnhub general market news. Only used when FINNHUB_API_KEY is set.
 * ------------------------------------------------------------------ */

export function parseFinnhub(body: unknown): Headline[] {
  if (!Array.isArray(body)) return [];
  const out: Headline[] = [];
  for (const n of body as Record<string, unknown>[]) {
    const url = typeof n.url === "string" ? n.url : "";
    const headline = typeof n.headline === "string" ? n.headline.trim() : "";
    const seconds = typeof n.datetime === "number" ? n.datetime : NaN;
    if (!url || !headline || !Number.isFinite(seconds)) continue;
    out.push({
      url,
      headline,
      source: "finnhub",
      outlet: typeof n.source === "string" ? n.source : "",
      ...(typeof n.summary === "string" && n.summary.trim()
        ? { snippet: n.summary.trim().slice(0, 400) }
        : {}),
      publishedAt: new Date(seconds * 1000),
    });
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * Fetching.
 * ------------------------------------------------------------------ */

async function getJson(url: string, timeoutMs = 15_000): Promise<unknown> {
  const r = await fetch(url, {
    headers: { "User-Agent": "saga-x-terminal" },
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`${url.split("?")[0]} answered ${r.status}`);
  return r.json();
}

async function getText(url: string): Promise<string> {
  const r = await fetch(url, {
    headers: { "User-Agent": "saga-x-terminal" },
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`${url} answered ${r.status}`);
  return r.text();
}

export type SourceReport = { source: string; count: number; error?: string };

/**
 * Every source, each allowed to fail alone. Returns headlines newer than the
 * lookback window, and a line per source for the run's log.
 */
export async function fetchHeadlines(
  now = new Date(),
  lookbackMinutes = LOOKBACK_MINUTES,
): Promise<{ headlines: Headline[]; report: SourceReport[] }> {
  const jobs: [string, () => Promise<Headline[]>][] = [
    // GDELT is slow even when it answers; give it longer than the rest.
    ["gdelt", async () => parseGdelt(await getJson(gdeltUrl(lookbackMinutes), 40_000))],
    ...RSS_FEEDS.map(
      (feed): [string, () => Promise<Headline[]>] => [
        feed.outlet,
        async () => parseRss(await getText(feed.url), "rss", feed.outlet),
      ],
    ),
  ];
  const finnhubKey = process.env.FINNHUB_API_KEY;
  if (finnhubKey) {
    jobs.push([
      "finnhub",
      async () =>
        parseFinnhub(
          await getJson(
            `https://finnhub.io/api/v1/news?category=general&token=${encodeURIComponent(finnhubKey)}`,
          ),
        ),
    ]);
  }

  const settled = await Promise.allSettled(jobs.map(([, run]) => run()));
  const since = now.getTime() - lookbackMinutes * 60_000;
  const headlines: Headline[] = [];
  const report: SourceReport[] = [];

  settled.forEach((result, i) => {
    const source = jobs[i][0];
    if (result.status === "rejected") {
      report.push({ source, count: 0, error: String(result.reason).slice(0, 200) });
      return;
    }
    const fresh = result.value.filter((h) => h.publishedAt.getTime() >= since);
    headlines.push(...fresh);
    report.push({ source, count: fresh.length });
  });

  return { headlines, report };
}

/** Lower-case, strip punctuation, collapse spaces. Two outlets, one story. */
export function headlineKey(headline: string): string {
  return headline
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Drop repeats inside one run, by URL and by headline. */
export function dedupe(headlines: Headline[]): Headline[] {
  const urls = new Set<string>();
  const keys = new Set<string>();
  const out: Headline[] = [];
  for (const h of headlines) {
    const key = headlineKey(h.headline);
    if (!key || urls.has(h.url) || keys.has(key)) continue;
    urls.add(h.url);
    keys.add(key);
    out.push(h);
  }
  return out;
}
