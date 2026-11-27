import { authorised } from "@/lib/record-feed";
import { fetchBls, fetchNyFed, fetchTreasury, type Point } from "@/lib/macro/fetchers";
import { savePoints } from "@/lib/macro/store";

/**
 * Refreshes the economic series from their publishers.
 *
 * Scheduled twice a day in vercel.json (after US releases at 08:30 New York,
 * and before the Asian open), which sends `Bearer $CRON_SECRET`. The ingest
 * secret works too, for a manual run:
 *
 *   GET /api/macro/refresh              recent data only
 *   GET /api/macro/refresh?backfill=1   history: Fed rates since 2010,
 *                                       BLS and Treasury for ten years
 *
 * Each publisher is fetched on its own; one failing does not stop the rest.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function GET(request: Request): Promise<Response> {
  const header = request.headers.get("authorization");
  const secrets = [process.env.CRON_SECRET, process.env.TERMINAL_INGEST_SECRET].filter(
    (s): s is string => Boolean(s),
  );
  if (secrets.length === 0) {
    return Response.json({ error: "Macro refresh is not configured" }, { status: 503 });
  }
  if (!secrets.some((s) => authorised(header, s))) {
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  }

  const backfill = new URL(request.url).searchParams.get("backfill") === "1";
  const now = new Date();
  const year = now.getUTCFullYear();
  const blsKey = process.env.BLS_API_KEY || undefined;

  const jobs: [string, () => Promise<Point[]>][] = [
    [
      "nyfed",
      () => fetchNyFed(backfill ? "2010-01-01" : iso(new Date(now.getTime() - 45 * 86_400_000)), iso(now)),
    ],
    [
      "bls",
      // Two years cover year-on-year; a backfill takes ten (v1's limit per request).
      () => fetchBls(backfill ? year - 9 : year - 2, year, blsKey),
    ],
    [
      "treasury",
      () =>
        fetchTreasury(
          backfill
            ? Array.from({ length: 10 }, (_, i) => year - 9 + i)
            : now.getUTCMonth() === 0
              ? [year - 1, year]
              : [year],
        ),
    ],
  ];

  const report: { source: string; points: number; error?: string }[] = [];
  for (const [source, run] of jobs) {
    try {
      const points = await run();
      await savePoints(points);
      report.push({ source, points: points.length });
    } catch (error) {
      console.error(`macro refresh: ${source} failed`, error);
      report.push({ source, points: 0, error: String(error).slice(0, 300) });
    }
  }

  return Response.json({ ok: report.every((r) => !r.error), backfill, report });
}
