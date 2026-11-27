import { authorised } from "@/lib/record-feed";
import { nextRelease } from "@/lib/cot/schedule";
import { readCotLatest } from "@/lib/cot/store";

/**
 * COT positioning and the next release time, for Mastery Signal's server.
 *
 *   GET /api/terminal/cot?weeks=8
 *   Authorization: Bearer $TERMINAL_FEED_KEY
 *
 * One entry per market: the speculative group's net position (contracts),
 * its change on the week, long share, the lean on the pair a member trades,
 * and `weeks` of net history (1–52, default 8). `next_release` is an ISO
 * instant; `estimated` is true when it is past the CFTC's published dates.
 */

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const key = process.env.TERMINAL_FEED_KEY;
  if (!key) return Response.json({ error: "Terminal feed is not configured" }, { status: 503 });
  if (!authorised(request.headers.get("authorization"), key)) {
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  }

  const n = Number.parseInt(new URL(request.url).searchParams.get("weeks") ?? "", 10);
  const weeks = Number.isFinite(n) ? Math.min(52, Math.max(1, n)) : 8;
  const now = new Date();

  try {
    const views = await readCotLatest(now, weeks);
    const next = nextRelease(now);
    return Response.json(
      {
        markets: views.map((v) => ({
          slug: v.market.slug,
          symbol: v.market.symbol,
          name: v.market.name,
          group: v.market.specLabel,
          report_date: v.date,
          net: v.net,
          change: v.change,
          long_share: Math.round(v.longShare * 1000) / 1000,
          pair_bias: v.pairBias,
          history: v.history,
        })),
        next_release: { at: next.at.toISOString(), delayed: next.delayed, estimated: next.estimated },
        source: "CFTC Commitments of Traders, futures only",
        generated_at: now.toISOString(),
      },
      { headers: { "Cache-Control": "private, max-age=300" } },
    );
  } catch (error) {
    console.error("terminal cot: could not read", error);
    return Response.json({ error: "Could not read COT data" }, { status: 500 });
  }
}
