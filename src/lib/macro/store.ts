import { serviceClient } from "@/lib/supabase";
import type { Point } from "./fetchers";

export type Obs = { date: string; value: number };

/** Upserts in chunks; a re-run over the same dates rewrites the same rows. */
export async function savePoints(points: Point[]): Promise<number> {
  const db = serviceClient();
  for (let i = 0; i < points.length; i += 1000) {
    const chunk = points.slice(i, i + 1000).map((p) => ({ ...p, updated_at: new Date().toISOString() }));
    const { error } = await db.from("macro_points").upsert(chunk, { onConflict: "series,date" });
    if (error) throw error;
  }
  return points.length;
}

/** One series, oldest first, from `since` (or all of it). */
export async function readSeries(series: string, since?: string): Promise<Obs[]> {
  const out: Obs[] = [];
  // PostgREST pages at 1000 rows; daily series run to several thousand.
  for (let from = 0; ; from += 1000) {
    let query = serviceClient()
      .from("macro_points")
      .select("date, value")
      .eq("series", series)
      .order("date", { ascending: true })
      .range(from, from + 999);
    if (since) query = query.gte("date", since);
    const { data, error } = await query;
    if (error) throw error;
    for (const r of data ?? []) out.push({ date: r.date as string, value: Number(r.value) });
    if (!data || data.length < 1000) break;
  }
  return out;
}

/** The two newest points of a series, newest first. */
export async function latestTwo(series: string): Promise<Obs[]> {
  const { data, error } = await serviceClient()
    .from("macro_points")
    .select("date, value")
    .eq("series", series)
    .order("date", { ascending: false })
    .limit(2);
  if (error) throw error;
  return (data ?? []).map((r) => ({ date: r.date as string, value: Number(r.value) }));
}

export type SeriesStats = {
  actual: Obs;
  previous: Obs | null;
  highest: Obs;
  lowest: Obs;
  first: Obs;
};

export function stats(points: Obs[]): SeriesStats | null {
  if (points.length === 0) return null;
  let highest = points[0];
  let lowest = points[0];
  for (const p of points) {
    if (p.value > highest.value) highest = p;
    if (p.value < lowest.value) lowest = p;
  }
  return {
    actual: points[points.length - 1],
    previous: points.length > 1 ? points[points.length - 2] : null,
    highest,
    lowest,
    first: points[0],
  };
}
