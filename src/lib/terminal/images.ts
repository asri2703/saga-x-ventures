/**
 * A photo for each relevant story, from free libraries that allow
 * commercial use, tried in order: Unsplash, Pexels, Wikimedia Commons.
 *
 * News outlets' own photos are licensed from agencies (Reuters, AP, Getty)
 * and cannot be republished on a paid product, so the wire never copies
 * them, and never takes images from a search engine. Each library's terms
 * are followed:
 *
 *  - Unsplash: hotlinked from images.unsplash.com, photographer and Unsplash
 *    credited with links, the download endpoint pinged on use;
 *  - Pexels: hotlinked from images.pexels.com, photographer and Pexels
 *    credited with a link;
 *  - Wikimedia Commons: only public domain, CC0, CC BY and CC BY-SA files,
 *    each credited with its author, "Wikimedia Commons" and its licence,
 *    linked to its file page.
 *
 * No photo found: the card draws its own cover (a map or a type card).
 */

export type ImageSource = "unsplash" | "pexels" | "wikimedia";

export type StoryImage = {
  url: string;
  credit: string;
  link: string;
  source: ImageSource;
};

const UTM = "utm_source=saga_x_hq&utm_medium=referral";
const UA = "SagaXTerminal/1.0 (https://sagaxventures.com; hello@sagaxventures.com)";

/** The credit as printed on a cover: "Jane Doe / Unsplash". */
export function creditLine(credit: string, source: string | null): string {
  if (source === "wikimedia") return credit;
  const where = source === "pexels" ? "Pexels" : "Unsplash";
  return `${credit} / ${where}`;
}

/* ---------------------------------- Unsplash ---------------------------------- */

/** Picks the first usable landscape result from a search response. */
export function parseUnsplashSearch(
  body: unknown,
): (Omit<StoryImage, "source"> & { downloadLocation: string }) | null {
  const results = (body as { results?: unknown })?.results;
  if (!Array.isArray(results)) return null;
  for (const r of results as Record<string, unknown>[]) {
    const urls = r.urls as Record<string, unknown> | undefined;
    const user = r.user as Record<string, unknown> | undefined;
    const links = r.links as Record<string, unknown> | undefined;
    const userLinks = user?.links as Record<string, unknown> | undefined;
    const raw = typeof urls?.raw === "string" ? urls.raw : "";
    const name = typeof user?.name === "string" ? user.name : "";
    const profile = typeof userLinks?.html === "string" ? userLinks.html : "";
    const download = typeof links?.download_location === "string" ? links.download_location : "";
    if (!raw.startsWith("https://images.unsplash.com/") || !name || !profile) continue;
    return {
      // Sized by Unsplash's image service rather than downloaded and resized.
      url: `${raw}${raw.includes("?") ? "&" : "?"}w=1200&h=675&fit=crop&auto=format&q=75`,
      credit: name,
      link: `${profile}?${UTM}`,
      downloadLocation: download,
    };
  }
  return null;
}

async function fromUnsplash(query: string, accessKey: string): Promise<StoryImage | null> {
  const params = new URLSearchParams({ query, orientation: "landscape", per_page: "5", content_filter: "high" });
  const r = await fetch(`https://api.unsplash.com/search/photos?${params}`, {
    headers: { Authorization: `Client-ID ${accessKey}`, "Accept-Version": "v1" },
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`Unsplash answered ${r.status}`);
  const found = parseUnsplashSearch(await r.json());
  if (!found) return null;
  // Required by the API guidelines when a photo is used. Failure here must
  // not cost the story its picture.
  if (found.downloadLocation) {
    fetch(found.downloadLocation, {
      headers: { Authorization: `Client-ID ${accessKey}` },
      signal: AbortSignal.timeout(5_000),
    }).catch(() => undefined);
  }
  return { url: found.url, credit: found.credit, link: found.link, source: "unsplash" };
}

/* ----------------------------------- Pexels ----------------------------------- */

export function parsePexelsSearch(body: unknown): StoryImage | null {
  const photos = (body as { photos?: unknown })?.photos;
  if (!Array.isArray(photos)) return null;
  for (const p of photos as Record<string, unknown>[]) {
    const src = p.src as Record<string, unknown> | undefined;
    const url = typeof src?.landscape === "string" ? src.landscape : typeof src?.large === "string" ? src.large : "";
    const name = typeof p.photographer === "string" ? p.photographer : "";
    const page = typeof p.url === "string" ? p.url : "";
    if (!url.startsWith("https://images.pexels.com/") || !name || !page) continue;
    return { url, credit: name, link: page, source: "pexels" };
  }
  return null;
}

async function fromPexels(query: string, key: string): Promise<StoryImage | null> {
  const params = new URLSearchParams({ query, orientation: "landscape", per_page: "5" });
  const r = await fetch(`https://api.pexels.com/v1/search?${params}`, {
    headers: { Authorization: key },
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`Pexels answered ${r.status}`);
  return parsePexelsSearch(await r.json());
}

/* ------------------------------ Wikimedia Commons ------------------------------ */

const FREE_LICENCE = /^(cc0|public domain|pd\b|cc by(-sa)? \d)/i;

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function parseCommonsSearch(body: unknown): StoryImage | null {
  const pages = (body as { query?: { pages?: Record<string, unknown> } })?.query?.pages;
  if (!pages || typeof pages !== "object") return null;
  const list = Object.values(pages) as Record<string, unknown>[];
  list.sort((a, b) => Number(a.index ?? 0) - Number(b.index ?? 0));
  for (const p of list) {
    const info = (p.imageinfo as Record<string, unknown>[] | undefined)?.[0];
    if (!info) continue;
    const meta = info.extmetadata as Record<string, { value?: string }> | undefined;
    const licence = stripTags(meta?.LicenseShortName?.value ?? "");
    const artist = stripTags(meta?.Artist?.value ?? "").slice(0, 80);
    const url = typeof info.thumburl === "string" ? info.thumburl : "";
    const page = typeof info.descriptionurl === "string" ? info.descriptionurl : "";
    const width = Number(info.thumbwidth ?? 0);
    const height = Number(info.thumbheight ?? 0);
    if (!FREE_LICENCE.test(licence) || !url.startsWith("https://upload.wikimedia.org/") || !page) continue;
    // Landscape only: a portrait photo cropped to 16:9 loses its subject.
    if (!width || !height || width / height < 1.2) continue;
    return {
      url,
      credit: `${artist || "Unknown author"} / Wikimedia Commons, ${licence}`,
      link: page,
      source: "wikimedia",
    };
  }
  return null;
}

async function fromCommons(query: string): Promise<StoryImage | null> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    generator: "search",
    gsrsearch: `filetype:bitmap ${query}`,
    gsrnamespace: "6",
    gsrlimit: "8",
    prop: "imageinfo",
    iiprop: "url|extmetadata|size",
    iiurlwidth: "1200",
    origin: "*",
  });
  const r = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`Wikimedia answered ${r.status}`);
  return parseCommonsSearch(await r.json());
}

/* ------------------------------------ Chain ----------------------------------- */

export type ImageKeys = { unsplash?: string; pexels?: string };

/** The first library with a usable photo wins; a library that fails is skipped. */
export async function findImage(query: string, keys: ImageKeys): Promise<StoryImage | null> {
  const tries: (() => Promise<StoryImage | null>)[] = [];
  if (keys.unsplash) tries.push(() => fromUnsplash(query, keys.unsplash as string));
  if (keys.pexels) tries.push(() => fromPexels(query, keys.pexels as string));
  tries.push(() => fromCommons(query));
  for (const attempt of tries) {
    try {
      const found = await attempt();
      if (found) return found;
    } catch (error) {
      console.error("terminal images: a library failed", error);
    }
  }
  return null;
}

export function imageKeys(): ImageKeys {
  return { unsplash: process.env.UNSPLASH_ACCESS_KEY || undefined, pexels: process.env.PEXELS_API_KEY || undefined };
}
