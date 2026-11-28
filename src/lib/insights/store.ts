import { serviceClient } from "@/lib/supabase";
import type { Direction, Insight, InsightBody, Language } from "./topics";

const COLUMNS = "id, topic, direction, language, notes, title, body, model, status, created_at, updated_at, published_at";

export async function listInsights(opts: { publishedOnly?: boolean; limit?: number } = {}): Promise<Insight[]> {
  let query = serviceClient().from("insights").select(COLUMNS).order("created_at", { ascending: false });
  if (opts.publishedOnly) query = query.eq("status", "published");
  const { data, error } = await query.limit(opts.limit ?? 50);
  if (error) throw error;
  return (data ?? []) as Insight[];
}

export async function readInsight(id: string): Promise<Insight | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await serviceClient().from("insights").select(COLUMNS).eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as Insight | null) ?? null;
}

export async function createDraft(row: {
  topic: string;
  direction: Direction;
  language: Language;
  notes: string | null;
  title: string;
  body: InsightBody;
  context: unknown;
  model: string;
}): Promise<string> {
  const { data, error } = await serviceClient().from("insights").insert(row).select("id").single();
  if (error) throw error;
  return data.id as string;
}

export async function updateInsight(id: string, patch: { title: string; body: InsightBody }): Promise<void> {
  const { error } = await serviceClient()
    .from("insights")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function setStatus(id: string, status: Insight["status"]): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await serviceClient()
    .from("insights")
    .update({ status, updated_at: now, published_at: status === "published" ? now : null })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteInsight(id: string): Promise<void> {
  const { error } = await serviceClient().from("insights").delete().eq("id", id);
  if (error) throw error;
}
