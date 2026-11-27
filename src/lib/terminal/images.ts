/**
 * A photo for each relevant story, from Unsplash.
 *
 * News outlets' own photos are licensed from agencies (Reuters, AP, Getty)
 * and cannot be republished on a paid product, so the wire never copies
 * them. Unsplash photos can be used commercially for free, on two
 * conditions from its API guidelines, both followed here:
 *
 *  - the image is hotlinked from images.unsplash.com, never re-hosted;
 *  - the photographer and Unsplash are credited, with links, and the
 *    photo's download endpoint is pinged when the photo is put to use.
 *
 * No key, no photo: the wire works without images and the cards fall back to
 * text only.
 */

export type StoryImage = {
  url: string;
  credit: string;
  link: string;
};

const UTM = "utm_source=saga_x_hq&utm_medium=referral";

/** Picks the first usable landscape result from a search response. */
export function parseUnsplashSearch(
  body: unknown,
): (StoryImage & { downloadLocation: string }) | null {
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

export async function findImage(query: string, accessKey: string): Promise<StoryImage | null> {
  const params = new URLSearchParams({
    query,
    orientation: "landscape",
    per_page: "5",
    content_filter: "high",
  });
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
  return { url: found.url, credit: found.credit, link: found.link };
}
