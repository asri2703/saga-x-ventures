import { authorised } from "@/lib/record-feed";
import { BATCH_SIZE, classifyBatch, DEFAULT_MODEL } from "@/lib/terminal/classify";
import { findImage, type StoryImage } from "@/lib/terminal/images";
import { readUncategorised, readUntagged, updateSectionAndPhoto, updateTags } from "@/lib/terminal/store";

/**
 * One-off catch-up: give stories stored before sections and photos existed
 * a section and, for medium and high impact, a photo.
 *
 * Run by hand, never scheduled:
 *   GET /api/terminal/reclassify  (Authorization: Bearer $TERMINAL_INGEST_SECRET)
 *
 * Looks back 72 hours, which is all the wire shows. Up to 75 stories and 20
 * photo searches a call (Unsplash's free tier allows 50 an hour); call it
 * again for more. A story the model now skips keeps no section and is asked
 * about on the next call.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MAX_STORIES = 75;
const MAX_IMAGE_SEARCHES = 20;

export async function GET(request: Request): Promise<Response> {
  const secret = process.env.TERMINAL_INGEST_SECRET || process.env.CRON_SECRET;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!secret || !apiKey) {
    return Response.json({ error: "Terminal is not configured" }, { status: 503 });
  }
  if (!authorised(request.headers.get("authorization"), secret)) {
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  }

  const model = process.env.TERMINAL_MODEL || DEFAULT_MODEL;
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;

  // ?mode=tags: instrument tags for stories that have none (stored before
  // tags existed, or tagged too sparingly). Photos and briefs stay as they are.
  if (new URL(request.url).searchParams.get("mode") === "tags") {
    const untagged = await readUntagged(new Date(Date.now() - 72 * 60 * 60 * 1000), MAX_STORIES).catch(() => []);
    let tagged = 0;
    const errors: string[] = [];
    for (let i = 0; i < untagged.length; i += BATCH_SIZE) {
      const batch = untagged.slice(i, i + BATCH_SIZE);
      try {
        const verdicts = await classifyBatch(batch.map((s) => s.headline), apiKey, model);
        for (let j = 0; j < batch.length; j++) {
          const v = verdicts[j];
          if (!v?.relevant || v.assets.length === 0) continue;
          await updateTags(batch[j].id, v, Boolean(batch[j].category));
          tagged += 1;
        }
      } catch (error) {
        errors.push(String(error).slice(0, 300));
        break;
      }
    }
    return Response.json({ ok: errors.length === 0, mode: "tags", waiting: untagged.length, tagged, failures: errors });
  }

  let stories;
  try {
    stories = await readUncategorised(new Date(Date.now() - 72 * 60 * 60 * 1000), MAX_STORIES);
  } catch (error) {
    console.error("terminal reclassify: could not read", error);
    return Response.json({ error: "Could not read the store" }, { status: 500 });
  }

  const byQuery = new Map<string, StoryImage | null>();
  let updated = 0;
  let images = 0;
  const failures: string[] = [];

  for (let i = 0; i < stories.length; i += BATCH_SIZE) {
    const batch = stories.slice(i, i + BATCH_SIZE);
    let verdicts;
    try {
      verdicts = await classifyBatch(batch.map((s) => s.headline), apiKey, model);
    } catch (error) {
      failures.push(String(error).slice(0, 300));
      break;
    }

    for (let j = 0; j < batch.length; j++) {
      const v = verdicts[j];
      if (!v?.relevant || !v.category) continue;

      let image: StoryImage | null = null;
      if (unsplashKey && v.impact !== "low" && v.imageQuery) {
        if (!byQuery.has(v.imageQuery) && byQuery.size < MAX_IMAGE_SEARCHES) {
          try {
            byQuery.set(v.imageQuery, await findImage(v.imageQuery, unsplashKey));
          } catch (error) {
            console.error("terminal reclassify: image search failed", error);
            byQuery.set(v.imageQuery, null);
          }
        }
        image = byQuery.get(v.imageQuery) ?? null;
      }

      try {
        await updateSectionAndPhoto(batch[j].id, v, image);
        updated += 1;
        if (image) images += 1;
      } catch (error) {
        failures.push(String(error).slice(0, 300));
      }
    }
  }

  return Response.json({
    ok: failures.length === 0,
    waiting: stories.length,
    updated,
    images,
    failures,
  });
}
