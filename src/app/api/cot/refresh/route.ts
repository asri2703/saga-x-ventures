import { authorised } from "@/lib/record-feed";
import { fetchCot } from "@/lib/cot/fetch";
import { latestCotDate, readCotLatest, saveCot } from "@/lib/cot/store";
import { cotAlert } from "@/lib/alerts/compose";
import { alertQuietly } from "@/lib/alerts/push";

/**
 * Pulls Commitments of Traders positioning from the CFTC into HQ.
 *
 * Scheduled in vercel.json shortly after each possible release time
 * (15:30 New York, weekdays, so holiday moves are caught too), which sends
 * `Bearer $CRON_SECRET`. The ingest secret works for a manual run:
 *
 *   GET /api/cot/refresh              the last eight weeks
 *   GET /api/cot/refresh?backfill=1   everything since 2010
 */

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(request: Request): Promise<Response> {
  const header = request.headers.get("authorization");
  const secrets = [process.env.CRON_SECRET, process.env.TERMINAL_INGEST_SECRET].filter(
    (s): s is string => Boolean(s),
  );
  if (secrets.length === 0) {
    return Response.json({ error: "COT refresh is not configured" }, { status: 503 });
  }
  if (!secrets.some((s) => authorised(header, s))) {
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  }

  const backfill = new URL(request.url).searchParams.get("backfill") === "1";
  const since = backfill ? "2010-01-01" : new Date(Date.now() - 56 * 86_400_000).toISOString().slice(0, 10);

  try {
    const before = await latestCotDate("gold");
    const rows = await fetchCot(since);
    await saveCot(rows);
    const latest = rows.reduce((max, r) => (r.report_date > max ? r.report_date : max), "");
    // A new week landed: tell subscribers once (the sender refuses repeats).
    const fresh = Boolean(before) && latest > before;
    if (fresh) await alertQuietly(cotAlert(await readCotLatest(new Date())));
    return Response.json({ ok: true, backfill, since, rows: rows.length, latest, alerted: fresh });
  } catch (error) {
    console.error("cot refresh failed", error);
    return Response.json({ ok: false, error: String(error).slice(0, 300) }, { status: 502 });
  }
}
