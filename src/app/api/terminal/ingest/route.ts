import { authorised } from "@/lib/record-feed";
import { BATCH_SIZE, classifyBatch, DEFAULT_MODEL, type Verdict } from "@/lib/terminal/classify";
import { dedupe, fetchHeadlines, LOOKBACK_MINUTES, type Headline } from "@/lib/terminal/sources";
import { findImage, type StoryImage } from "@/lib/terminal/images";
import { alreadyStored, storeVerdicts } from "@/lib/terminal/store";

/**
 * One run of the Mastery Terminal wire: fetch, drop what is already on file,
 * classify the rest with Claude, store.
 *
 * Called on a schedule with `Authorization: Bearer $CRON_SECRET` (Vercel's
 * scheduler sends exactly that). Without the secret set it answers 503: an
 * endpoint that spends API credit must not run for anyone who finds the path.
 *
 * A headline the model skipped is not stored, so the next run, which looks
 * back an hour, asks about it again. A headline the model judged irrelevant
 * is stored, so nobody pays to ask twice.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Hard ceiling per run. A burst of news costs at most this many headlines. */
const MAX_PER_RUN = 75;
/** Photo searches per run. Twelve runs an hour stay under Unsplash's 50. */
const MAX_IMAGE_SEARCHES = 4;

export async function GET(request: Request): Promise<Response> {
  // Its own secret when set, so the scheduler that calls this (Supabase
  // pg_cron while the site is on Vercel Hobby) never holds the secret that
  // also triggers client emails in /api/reminders.
  const secret = process.env.TERMINAL_INGEST_SECRET || process.env.CRON_SECRET;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!secret || !apiKey) {
    return Response.json({ error: "Terminal ingest is not configured" }, { status: 503 });
  }
  if (!authorised(request.headers.get("authorization"), secret)) {
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  }

  const model = process.env.TERMINAL_MODEL || DEFAULT_MODEL;
  // `?lookback=` (minutes, 15 to 1440) is for a manual backfill, such as the
  // first run or after the schedule was down. The scheduler never sends it.
  const asked = Number.parseInt(new URL(request.url).searchParams.get("lookback") ?? "", 10);
  const lookback = Number.isFinite(asked) ? Math.min(1440, Math.max(15, asked)) : LOOKBACK_MINUTES;
  const { headlines, report } = await fetchHeadlines(new Date(), lookback);

  let fresh: Headline[];
  try {
    const unique = dedupe(headlines);
    const stored = await alreadyStored(unique);
    fresh = unique
      .filter((h) => !stored.has(h.url))
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
      .slice(0, MAX_PER_RUN);
  } catch (error) {
    console.error("terminal ingest: could not read the store", error);
    return Response.json({ error: "Could not read the store", sources: report }, { status: 500 });
  }

  const classified: { headline: Headline; verdict: Verdict }[] = [];
  const failures: string[] = [];
  for (let i = 0; i < fresh.length; i += BATCH_SIZE) {
    const batch = fresh.slice(i, i + BATCH_SIZE);
    try {
      const verdicts = await classifyBatch(batch, apiKey, model);
      verdicts.forEach((verdict, j) => {
        if (verdict) classified.push({ headline: batch[j], verdict });
      });
    } catch (error) {
      // Most often the spend limit or an overloaded model. Keep what the
      // earlier batches produced; the rest waits for the next run.
      console.error("terminal ingest: classification failed", error);
      failures.push(String(error).slice(0, 300));
      break;
    }
  }

  // A photo for relevant medium and high stories, when an Unsplash key is set.
  // Capped per run: the free tier allows 50 searches an hour, and the
  // schedule runs twelve times an hour. One search per distinct query.
  const imaged: { headline: Headline; verdict: Verdict; image?: StoryImage | null }[] = classified;
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
  let images = 0;
  if (unsplashKey) {
    const byQuery = new Map<string, StoryImage | null>();
    for (const row of imaged) {
      const v = row.verdict;
      if (!v.relevant || v.impact === "low" || !v.imageQuery) continue;
      if (!byQuery.has(v.imageQuery)) {
        if (byQuery.size >= MAX_IMAGE_SEARCHES) continue;
        try {
          byQuery.set(v.imageQuery, await findImage(v.imageQuery, unsplashKey));
        } catch (error) {
          console.error("terminal ingest: image search failed", error);
          byQuery.set(v.imageQuery, null);
        }
      }
      row.image = byQuery.get(v.imageQuery) ?? null;
      if (row.image) images += 1;
    }
  }

  let saved = 0;
  try {
    saved = await storeVerdicts(imaged, model);
  } catch (error) {
    console.error("terminal ingest: could not store", error);
    return Response.json({ error: "Could not store", sources: report }, { status: 500 });
  }

  return Response.json({
    ok: failures.length === 0,
    sources: report,
    candidates: fresh.length,
    saved,
    relevant: classified.filter((c) => c.verdict.relevant).length,
    images,
    failures,
  });
}
