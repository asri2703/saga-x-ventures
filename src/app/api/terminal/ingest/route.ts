import { authorised } from "@/lib/record-feed";
import { breakingAlert, newsAlert, officialAlert } from "@/lib/alerts/compose";
import { alertQuietly } from "@/lib/alerts/push";
import {
  BATCH_SIZE,
  classifyBatch,
  DEFAULT_MODEL,
  type Verdict,
} from "@/lib/terminal/classify";
import {
  corroborationQuery,
  dedupe,
  fetchHeadlines,
  isGdeltSlot,
  LOOKBACK_MINUTES,
  type Headline,
} from "@/lib/terminal/sources";
import { findImage, type StoryImage } from "@/lib/terminal/images";
import { BRIEF_MODEL, writeBrief } from "@/lib/terminal/brief";
import { BREAKING_MINUTES, sameEvent } from "@/lib/terminal/breaking";
import {
  alreadyStored,
  fileUnder,
  readBriefedStories,
  readPendingBriefs,
  readRecentHigh,
  readStory,
  readUnconfirmed,
  releaseLock,
  saveBrief,
  storeVerdicts,
  takeLock,
} from "@/lib/terminal/store";

/**
 * One run of the Mastery Terminal wire: fetch, drop what is already on file,
 * classify the rest with Claude, store, push what is breaking, then write
 * briefs and merge repeats.
 *
 * Called every two minutes with `Authorization: Bearer <secret>`. Without
 * the secret set it answers 503: an endpoint that spends API credit must
 * not run for anyone who finds the path. A lock keeps runs from overlapping.
 *
 * A headline the model skipped is not stored, so the next run, which looks
 * back an hour, asks about it again. A headline the model judged irrelevant
 * is stored, so nobody pays to ask twice.
 */

export const dynamic = "force-dynamic";
// Classification, photos and up to six briefs in one run. Pro allows 300s.
export const maxDuration = 300;

/** Hard ceiling per run. A burst of news costs at most this many headlines. */
const MAX_PER_RUN = 75;
/** Photo searches per run. Thirty runs an hour stay under Unsplash's 50 with this. */
const MAX_IMAGE_SEARCHES = 1;
/** Briefs per run. A backlog clears over a few runs instead of one long one. */
const MAX_BRIEFS_PER_RUN = 6;
/** A high-impact story is pushed (after its brief) only if published this recently. */
const ALERT_WINDOW_MS = 3 * 60 * 60 * 1000;
/** Breaking pushes per run, so a burst of headlines cannot page members ten times. */
const MAX_BREAKING_PER_RUN = 2;
/** Briefs written at once. Three keeps a run of six to two Sonnet round trips. */
const BRIEF_PARALLEL = 3;
/** Single-outlet stories searched for on GDELT per slot. */
const MAX_CORROBORATION_SEARCHES = 2;

export async function GET(request: Request): Promise<Response> {
  // Its own secret when set, so the scheduler that calls this (Supabase
  // pg_cron) never holds the secret that also triggers client emails in
  // /api/reminders.
  const secret = process.env.TERMINAL_INGEST_SECRET || process.env.CRON_SECRET;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!secret || !apiKey) {
    return Response.json(
      { error: "Terminal ingest is not configured" },
      { status: 503 },
    );
  }
  if (!authorised(request.headers.get("authorization"), secret)) {
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    if (!(await takeLock("ingest", 290))) {
      return Response.json({
        ok: true,
        skipped: "another run is still working",
      });
    }
  } catch (error) {
    // No lock table yet (migration 0014 not run): carry on unlocked.
    console.error("terminal ingest: lock unavailable", error);
  }

  try {
    return await run(request, apiKey);
  } finally {
    await releaseLock("ingest").catch(() => {});
  }
}

async function run(request: Request, apiKey: string): Promise<Response> {
  const now = new Date();
  const model = process.env.TERMINAL_MODEL || DEFAULT_MODEL;
  // `?lookback=` (minutes, 15 to 1440) is for a manual backfill, such as the
  // first run or after the schedule was down. The scheduler never sends it.
  const asked = Number.parseInt(
    new URL(request.url).searchParams.get("lookback") ?? "",
    10,
  );
  const manual = Number.isFinite(asked);
  const lookback = manual
    ? Math.min(1440, Math.max(15, asked))
    : LOOKBACK_MINUTES;

  // GDELT once per fifteen minutes, with a search for other outlets'
  // reports of the latest single-source stories.
  const gdelt = manual || isGdeltSlot(now);
  const searches = gdelt
    ? (await readUnconfirmed(MAX_CORROBORATION_SEARCHES).catch(() => []))
        .map((s) => corroborationQuery(s.headline))
        .filter((q): q is string => Boolean(q))
    : [];
  const { headlines, report } = await fetchHeadlines(now, lookback, {
    gdelt,
    searches,
  });

  let fresh: Headline[];
  try {
    const unique = dedupe(headlines);
    const stored = await alreadyStored(unique);
    fresh = unique
      .filter((h) => !stored.has(h.url))
      // Official publishers first, then newest.
      .sort(
        (a, b) =>
          Number(Boolean(b.official)) - Number(Boolean(a.official)) ||
          b.publishedAt.getTime() - a.publishedAt.getTime(),
      )
      .slice(0, MAX_PER_RUN);
  } catch (error) {
    console.error("terminal ingest: could not read the store", error);
    return Response.json(
      { error: "Could not read the store", sources: report },
      { status: 500 },
    );
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

  // A photo for relevant high and medium stories, when an Unsplash key is set.
  // High first; capped per run to stay inside the free tier's hourly limit.
  const imaged: {
    headline: Headline;
    verdict: Verdict;
    image?: StoryImage | null;
  }[] = classified;
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
  let images = 0;
  if (unsplashKey) {
    const byQuery = new Map<string, StoryImage | null>();
    const order = [...imaged].sort(
      (a, b) =>
        (a.verdict.impact === "high" ? -1 : 0) -
        (b.verdict.impact === "high" ? -1 : 0),
    );
    for (const row of order) {
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

  let ids = new Map<string, string>();
  try {
    ids = await storeVerdicts(imaged, model);
  } catch (error) {
    console.error("terminal ingest: could not store", error);
    return Response.json(
      { error: "Could not store", sources: report },
      { status: 500 },
    );
  }

  // Breaking: a fresh high-impact story is pushed now, in the classifier's
  // words, unless the same event was already on the wire in the last three
  // hours. The brief that follows does not push again.
  let breaking = 0;
  try {
    const candidates = classified.filter(
      ({ headline, verdict }) =>
        verdict.relevant &&
        verdict.impact === "high" &&
        ids.has(headline.url) &&
        now.getTime() - headline.publishedAt.getTime() <
          BREAKING_MINUTES * 60_000,
    );
    if (candidates.length) {
      const earlier = await readRecentHigh(
        new Date(now.getTime() - 3 * 60 * 60 * 1000),
      );
      const pushed: string[] = [];
      for (const { headline, verdict } of candidates) {
        if (breaking >= MAX_BREAKING_PER_RUN) break;
        const id = ids.get(headline.url);
        if (id === undefined) continue;
        const seen = earlier.some(
          (e) => e.id !== id && sameEvent(e.headline, headline.headline),
        );
        if (seen || pushed.some((p) => sameEvent(p, headline.headline)))
          continue;
        await alertQuietly(
          breakingAlert(
            {
              id,
              direction: verdict.direction ?? "neutral",
              outlet: headline.outlet,
              official: Boolean(headline.official),
            },
            verdict.summary ?? headline.headline,
          ),
        );
        pushed.push(headline.headline);
        breaking += 1;
      }
    }
  } catch (error) {
    console.error("terminal ingest: breaking failed", error);
    failures.push(`breaking: ${String(error).slice(0, 300)}`);
  }

  // The brief: medium and high stories, high first, then newest. Each one is
  // either written up or filed under a story already on the wire, which then
  // rises with a fresh source count. Written BRIEF_PARALLEL at a time; two
  // stories that look like one event never share a wave, so the second is
  // checked against the first's brief and merged.
  const briefModel = process.env.TERMINAL_BRIEF_MODEL || BRIEF_MODEL;
  let briefs = 0;
  let merged = 0;
  const published: { id: string; headline: string }[] = [];
  try {
    const pending = (await readPendingBriefs(MAX_BRIEFS_PER_RUN)).sort(
      (a, b) => Number(b.impact === "high") - Number(a.impact === "high"),
    );
    if (pending.length) published.push(...(await readBriefedStories()));
    const queue = [...pending];
    while (queue.length) {
      const wave: typeof pending = [];
      for (let i = 0; i < queue.length && wave.length < BRIEF_PARALLEL;) {
        if (wave.some((w) => sameEvent(w.headline, queue[i].headline))) i += 1;
        else wave.push(...queue.splice(i, 1));
      }
      const known = [...published];
      const results = await Promise.all(
        wave.map((story) => briefOne(story, known)),
      );
      for (const r of results) {
        if (r === "brief") briefs += 1;
        if (r === "merged") merged += 1;
      }
    }
  } catch (error) {
    console.error("terminal ingest: brief failed", error);
    failures.push(`brief: ${String(error).slice(0, 300)}`);
  }

  async function briefOne(
    story: Awaited<ReturnType<typeof readPendingBriefs>>[number],
    known: { id: string; headline: string }[],
  ): Promise<"brief" | "merged" | "none"> {
    const result = await writeBrief(
      {
        headline: story.headline,
        outlet: story.outlet,
        publishedAt: story.published_at,
        snippet: story.snippet,
        impact: story.impact,
        direction: story.direction,
        assets: (story.assets ?? [])
          .map((a) => `${a.symbol} ${a.direction}`)
          .join(", "),
      },
      known.filter((p) => p.id !== story.id),
      apiKey,
      briefModel,
    );
    if (result.kind === "duplicate") {
      const parent = await fileUnder(story.id, result.parentId);
      // An official publisher has now confirmed a high-impact story.
      if (parent?.becameOfficial) {
        const full = await readStory(result.parentId);
        if (
          full &&
          full.impact === "high" &&
          now.getTime() - Date.parse(full.published_at) < ALERT_WINDOW_MS
        ) {
          await alertQuietly(
            officialAlert(
              { id: full.id, title: full.brief?.title ?? full.headline },
              story.outlet,
            ),
          );
        }
      }
      return "merged";
    }
    if (result.kind === "brief") {
      await saveBrief(story.id, result.brief, briefModel);
      published.unshift({ id: story.id, headline: result.brief.title });
      // Push only what is high impact and still news (a backlog brief for
      // a story from yesterday stays on the wire, quietly). A story that
      // already went out as breaking is not pushed twice.
      const recent =
        now.getTime() - Date.parse(story.published_at) < ALERT_WINDOW_MS;
      if (story.impact === "high" && recent)
        await alertQuietly(newsAlert(story, result.brief));
      return "brief";
    }
    return "none";
  }

  return Response.json({
    ok: failures.length === 0,
    gdelt,
    searches: searches.length,
    breaking,
    briefs,
    merged,
    sources: report,
    candidates: fresh.length,
    saved: ids.size,
    relevant: classified.filter((c) => c.verdict.relevant).length,
    images,
    failures,
  });
}
