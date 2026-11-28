import { isBreaking } from "./breaking";
import type { FeedItem, StorySource } from "./store";

/**
 * How the wire is laid out, from newest to most important. Pure.
 *
 *  1. breaking: the newest high-impact story under half an hour old, if any;
 *  2. latest:   the newest entries, either a new story or an update to one
 *               (another outlet filing under it), newest first;
 *  3. issues:   high-impact stories still developing (several outlets, or
 *               updated well after they broke), by their latest update;
 *  4. rest:     everything else, medium first, low tucked away.
 *
 * An issue can show up in latest as an update (labelled as developing);
 * the issue block keeps its whole timeline. Anything in latest, breaking or
 * issues never repeats in rest.
 */

export const LATEST_COUNT = 8;
export const ISSUE_COUNT = 5;
/** An issue with no update for this long drops out of the issues block. */
export const ISSUE_QUIET_MS = 12 * 60 * 60 * 1000;

export type LatestEntry =
  | { kind: "story"; item: FeedItem; at: string }
  | { kind: "update"; item: FeedItem; at: string; update: StorySource };

export type WireLayout = {
  breaking: FeedItem | null;
  latest: LatestEntry[];
  issues: FeedItem[];
  rest: { medium: FeedItem[]; low: FeedItem[] };
};

/** The newest outlet filed under a story after it first broke, if any. */
export function latestUpdate(item: FeedItem): StorySource | null {
  const first = Date.parse(item.published_at);
  let best: StorySource | null = null;
  for (const s of item.sources.slice(1)) {
    const t = Date.parse(s.published_at);
    if (t > first && (!best || t > Date.parse(best.published_at))) best = s;
  }
  return best;
}

export function isIssue(item: FeedItem, now: number): boolean {
  if (item.impact !== "high") return false;
  if (now - Date.parse(item.last_update_at) > ISSUE_QUIET_MS) return false;
  return item.source_count >= 2 || item.sources.length >= 2;
}

export function buildWire(items: FeedItem[], now: number): WireLayout {
  const breaking = items.find((i) => isBreaking(i, now)) ?? null;

  const entries: LatestEntry[] = [];
  for (const item of items) {
    if (item.impact === "low") continue;
    entries.push({ kind: "story", item, at: item.published_at });
    const update = latestUpdate(item);
    if (update) entries.push({ kind: "update", item, at: update.published_at, update });
  }
  entries.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  const latest: LatestEntry[] = [];
  const seen = new Set<string>();
  for (const e of entries) {
    if (latest.length >= LATEST_COUNT) break;
    if (breaking && e.kind === "story" && e.item.id === breaking.id) continue;
    // One line per story: its newest entry.
    if (seen.has(e.item.id)) continue;
    seen.add(e.item.id);
    latest.push(e);
  }

  const issues = items
    .filter((i) => isIssue(i, now))
    .sort((a, b) => Date.parse(b.last_update_at) - Date.parse(a.last_update_at))
    .slice(0, ISSUE_COUNT);

  // A story shown anywhere above, as itself or as an update, is not repeated.
  const placed = new Set<string>([
    ...latest.map((e) => e.item.id),
    ...issues.map((i) => i.id),
    ...(breaking ? [breaking.id] : []),
  ]);
  const others = items.filter((i) => !placed.has(i.id));
  return {
    breaking,
    latest,
    issues,
    rest: {
      medium: others.filter((i) => i.impact !== "low"),
      low: others.filter((i) => i.impact === "low"),
    },
  };
}
