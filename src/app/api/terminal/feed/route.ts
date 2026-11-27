import { authorised } from "@/lib/record-feed";
import { readFeed } from "@/lib/terminal/store";

/**
 * The Mastery Terminal wire, for Mastery Signal's server to read.
 *
 * Mastery calls this from its own API route and caches the answer, so its
 * members never reach Saga X directly and this key never reaches a browser.
 *
 *   GET /api/terminal/feed?hours=24&min=medium&limit=50
 *   Authorization: Bearer $TERMINAL_FEED_KEY
 *
 * `hours` 1–168 (default 24), `min` low | medium | high (default low),
 * `limit` 1–200 (default 50). Newest first.
 */

export const dynamic = "force-dynamic";

const IMPACTS = ["low", "medium", "high"] as const;
type Impact = (typeof IMPACTS)[number];

function clampInt(value: string | null, fallback: number, min: number, max: number): number {
  const n = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export async function GET(request: Request): Promise<Response> {
  const key = process.env.TERMINAL_FEED_KEY;
  if (!key) {
    return Response.json({ error: "Terminal feed is not configured" }, { status: 503 });
  }
  if (!authorised(request.headers.get("authorization"), key)) {
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  }

  const params = new URL(request.url).searchParams;
  const hours = clampInt(params.get("hours"), 24, 1, 168);
  const limit = clampInt(params.get("limit"), 50, 1, 200);
  const minParam = params.get("min");
  const minImpact: Impact = IMPACTS.includes(minParam as Impact) ? (minParam as Impact) : "low";

  try {
    const items = await readFeed({
      since: new Date(Date.now() - hours * 60 * 60 * 1000),
      minImpact,
      limit,
    });
    return Response.json(
      { items, generated_at: new Date().toISOString() },
      { headers: { "Cache-Control": "private, max-age=60" } },
    );
  } catch (error) {
    console.error("terminal feed: could not read", error);
    return Response.json({ error: "Could not read the feed" }, { status: 500 });
  }
}
