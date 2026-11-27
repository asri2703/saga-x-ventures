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
  /** From an official publisher (a central bank, the White House). */
  official?: boolean;
};

/** How far back one run looks. A missed run is covered by the next. */
export const LOOKBACK_MINUTES = 60;

/**
 * GDELT's free API allows one request every five seconds per IP, and
 * Vercel's IPs are shared, so asking every run earns 429s. HQ asks once per
 * slot of this many minutes (the run whose minute falls first in the slot),
 * looking back a little longer than the slot.
 */
export const GDELT_SLOT_MINUTES = 15;

export function isGdeltSlot(now: Date, runEveryMinutes = 2): boolean {
  return now.getUTCMinutes() % GDELT_SLOT_MINUTES < runEveryMinutes;
}

/* ------------------------------------------------------------------ *
 * GDELT: worldwide coverage of conflict, sanctions, tariffs and shipping.
 * Free, no key. Updates every 15 minutes.
 * ------------------------------------------------------------------ */

const GDELT_QUERY =
  '(gold OR "federal reserve" OR tariff OR tariffs OR sanctions OR iran OR israel OR "strait of hormuz" OR missile OR treasury OR inflation OR opec) sourcelang:english';

export function gdeltUrl(lookbackMinutes = LOOKBACK_MINUTES, query = GDELT_QUERY, max = 75): string {
  const params = new URLSearchParams({
    query,
    mode: "artlist",
    format: "json",
    sort: "datedesc",
    maxrecords: String(max),
    timespan: `${lookbackMinutes}min`,
  });
  return `https://api.gdeltproject.org/api/v2/doc/doc?${params}`;
}

const STOPWORDS = new Set(
  "a an the and or but of in on at to for from by with as is are was were be been has have had will would says said say after over into amid about than that this its it his her their new us u s".split(
    " ",
  ),
);

/**
 * A GDELT search for other outlets' takes on one story: its most telling
 * words (longest first, numbers kept), all required.
 */
export function corroborationQuery(headline: string): string | null {
  const words = headlineKey(headline)
    .split(" ")
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
  const unique = [...new Set(words)].sort((a, b) => b.length - a.length).slice(0, 4);
  if (unique.length < 2) return null;
  return `${unique.join(" ")} sourcelang:english`;
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

export const RSS_FEEDS: { url: string; outlet: string; official?: true }[] = [
  // Official publishers first: what they say is the news, not a report of
  // it. Central banks behind gold and the major pairs, and the White House
  // and State Department for tariffs, sanctions and war.
  { url: "https://www.federalreserve.gov/feeds/press_all.xml", outlet: "federalreserve.gov", official: true },
  { url: "https://www.ecb.europa.eu/rss/press.html", outlet: "ECB", official: true },
  { url: "https://www.bankofengland.co.uk/rss/news", outlet: "Bank of England", official: true },
  { url: "https://www.boj.or.jp/en/rss/whatsnew.xml", outlet: "Bank of Japan", official: true },
  { url: "https://www.snb.ch/public/en/rss/pressrel", outlet: "Swiss National Bank", official: true },
  { url: "https://www.bankofcanada.ca/content_type/press-releases/feed/", outlet: "Bank of Canada", official: true },
  { url: "https://www.rba.gov.au/rss/rss-cb-media-releases.xml", outlet: "Reserve Bank of Australia", official: true },
  { url: "https://www.rbnz.govt.nz/feeds/news", outlet: "Reserve Bank of New Zealand", official: true },
  { url: "https://www.whitehouse.gov/presidential-actions/feed/", outlet: "White House", official: true },
  { url: "https://www.whitehouse.gov/news/feed/", outlet: "White House", official: true },
  { url: "https://www.state.gov/rss-feed/press-releases/feed/", outlet: "US State Department", official: true },
  // World and markets desks that cover wars, sanctions and tariffs as they
  // break, and confirm each other's stories.
  { url: "https://feeds.bbci.co.uk/news/world/rss.xml", outlet: "BBC World" },
  { url: "https://feeds.bbci.co.uk/news/business/rss.xml", outlet: "BBC Business" },
  { url: "https://www.aljazeera.com/xml/rss/all.xml", outlet: "Al Jazeera" },
  { url: "https://www.cnbc.com/id/100727362/device/rss/rss.html", outlet: "CNBC World" },
  { url: "https://www.cnbc.com/id/20910258/device/rss/rss.html", outlet: "CNBC Economy" },
  { url: "https://www.theguardian.com/world/rss", outlet: "The Guardian" },
  { url: "https://www.theguardian.com/business/rss", outlet: "The Guardian" },
  { url: "https://rss.dw.com/rdf/rss-en-world", outlet: "DW" },
  { url: "https://rss.dw.com/rdf/rss-en-bus", outlet: "DW" },
  { url: "https://www.france24.com/en/business/rss", outlet: "France 24" },
  { url: "https://feeds.content.dowjones.io/public/rss/mw_topstories", outlet: "MarketWatch" },
  // Forex desk: currency and commodity moves as they happen.
  { url: "https://investinglive.com/feed/", outlet: "investingLive" },
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

export function parseRss(xml: string, source: Headline["source"], outlet: string, official = false): Headline[] {
  const out: Headline[] = [];
  for (const m of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)) {
    const block = m[1];
    const headline = tag(block, "title");
    const url = tag(block, "link");
    // RSS 2.0 says pubDate; the RDF feeds some central banks publish say
    // dc:date.
    const when = new Date(tag(block, "pubDate") || tag(block, "dc:date"));
    if (!headline || !url || Number.isNaN(when.getTime())) continue;
    const snippet = stripTags(tag(block, "description")).slice(0, 400);
    out.push({
      url,
      headline,
      source,
      outlet,
      publishedAt: when,
      ...(snippet ? { snippet } : {}),
      ...(official ? { official: true } : {}),
    });
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
    headers: { "User-Agent": "Mozilla/5.0 (compatible; SagaXTerminal/1.0; +https://sagaxventures.com)" },
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`${url.split("?")[0]} answered ${r.status}`);
  return r.json();
}

async function getText(url: string): Promise<string> {
  const r = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; SagaXTerminal/1.0; +https://sagaxventures.com)" },
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`${url} answered ${r.status}`);
  return r.text();
}

export type SourceReport = { source: string; count: number; error?: string };

/**
 * GDELT, politely: the main query, then each corroboration search, six
 * seconds apart (its limit is one request per five seconds), each retried
 * once after a 429.
 */
async function fetchGdelt(lookbackMinutes: number, searches: string[]): Promise<Headline[]> {
  const pause = () => new Promise((r) => setTimeout(r, 6_000));
  const ask = async (url: string): Promise<Headline[]> => {
    try {
      return parseGdelt(await getJson(url, 40_000));
    } catch (error) {
      if (!String(error).includes("429")) throw error;
      await pause();
      return parseGdelt(await getJson(url, 40_000));
    }
  };
  const out = await ask(gdeltUrl(Math.max(lookbackMinutes, GDELT_SLOT_MINUTES + 5)));
  for (const query of searches) {
    await pause();
    try {
      out.push(...(await ask(gdeltUrl(180, query, 25))));
    } catch {
      // A failed search only means no corroboration this slot.
    }
  }
  return out;
}

/**
 * Every source, each allowed to fail alone. Returns headlines newer than the
 * lookback window (GDELT's corroboration searches look back three hours),
 * and a line per source for the run's log. GDELT runs only when asked.
 */
export async function fetchHeadlines(
  now = new Date(),
  lookbackMinutes = LOOKBACK_MINUTES,
  opts: { gdelt?: boolean; searches?: string[] } = { gdelt: true },
): Promise<{ headlines: Headline[]; report: SourceReport[] }> {
  const jobs: [string, () => Promise<Headline[]>][] = [
    ...RSS_FEEDS.map(
      (feed): [string, () => Promise<Headline[]>] => [
        feed.outlet,
        async () => parseRss(await getText(feed.url), "rss", feed.outlet, feed.official),
      ],
    ),
  ];
  if (opts.gdelt) jobs.unshift(["gdelt", () => fetchGdelt(lookbackMinutes, opts.searches ?? [])]);
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
    const from = source === "gdelt" && opts.searches?.length ? now.getTime() - 180 * 60_000 : since;
    const fresh = result.value.filter((h) => h.publishedAt.getTime() >= from);
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
