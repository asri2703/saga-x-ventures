import webpush, { type PushSubscription } from "web-push";
import { serviceClient } from "@/lib/supabase";
import { TOPICS, type Alert, type Topic } from "./compose";

/**
 * Web Push with VAPID: no third-party service, the browser's own push
 * service (Google, Mozilla, Apple) delivers to each subscribed device.
 *
 * Keys come from the environment: NEXT_PUBLIC_VAPID_PUBLIC_KEY (also used by
 * the browser to subscribe), VAPID_PRIVATE_KEY and VAPID_SUBJECT.
 */

const HQ_URL = "https://apps.sagaxventures.com";
/** Expired or unsubscribed: the push service says the endpoint is gone. */
const GONE = new Set([404, 410]);
/** A subscription that fails this many times in a row is dropped. */
const MAX_FAILURES = 5;

export function pushConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

let ready = false;
function setup(): void {
  if (ready) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:hello@sagaxventures.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
    process.env.VAPID_PRIVATE_KEY ?? "",
  );
  ready = true;
}

export type BrowserSubscription = { endpoint: string; keys: { p256dh: string; auth: string } };

export function isSubscription(value: unknown): value is BrowserSubscription {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  const keys = v.keys as Record<string, unknown> | undefined;
  return (
    typeof v.endpoint === "string" &&
    /^https:\/\//.test(v.endpoint) &&
    v.endpoint.length < 1000 &&
    !!keys &&
    typeof keys.p256dh === "string" &&
    typeof keys.auth === "string"
  );
}

export function cleanTopics(value: unknown): Topic[] {
  if (!Array.isArray(value)) return [...TOPICS];
  const picked = TOPICS.filter((t) => value.includes(t));
  return picked.length ? picked : [...TOPICS];
}

export async function saveSubscription(
  sub: BrowserSubscription,
  opts: { client: "hq" | "mastery"; userRef?: string | null; topics: Topic[] },
): Promise<void> {
  const { error } = await serviceClient()
    .from("push_subscriptions")
    .upsert(
      {
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        client: opts.client,
        user_ref: opts.userRef ?? null,
        topics: opts.topics,
        failures: 0,
      },
      { onConflict: "endpoint" },
    );
  if (error) throw error;
}

export async function removeSubscription(endpoint: string): Promise<void> {
  const { error } = await serviceClient().from("push_subscriptions").delete().eq("endpoint", endpoint);
  if (error) throw error;
}

type Row = { id: string; endpoint: string; p256dh: string; auth: string; client: string; failures: number };

function payload(alert: Alert, client: string): string {
  const url =
    client === "mastery"
      ? `${process.env.MASTERY_ALERT_URL || "https://masterysignal.com/terminal"}?alert=${alert.kind}:${encodeURIComponent(alert.ref)}`
      : `${HQ_URL}${alert.path}`;
  return JSON.stringify({ title: alert.title, body: alert.body, url, kind: alert.kind, ref: alert.ref, tag: `${alert.kind}:${alert.ref}` });
}

async function deliver(rows: Row[], alert: Alert): Promise<{ sent: number; failed: number }> {
  setup();
  const db = serviceClient();
  let sent = 0;
  let failed = 0;
  for (let i = 0; i < rows.length; i += 50) {
    await Promise.all(
      rows.slice(i, i + 50).map(async (row) => {
        const sub: PushSubscription = { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } };
        try {
          await webpush.sendNotification(sub, payload(alert, row.client), { TTL: 3600, urgency: "high" });
          sent += 1;
          if (row.failures > 0) await db.from("push_subscriptions").update({ failures: 0 }).eq("id", row.id);
        } catch (error) {
          failed += 1;
          const status = (error as { statusCode?: number }).statusCode ?? 0;
          if (GONE.has(status) || row.failures + 1 >= MAX_FAILURES) {
            await db.from("push_subscriptions").delete().eq("id", row.id);
          } else {
            await db.from("push_subscriptions").update({ failures: row.failures + 1 }).eq("id", row.id);
          }
        }
      }),
    );
  }
  return { sent, failed };
}

/**
 * Sends an alert to every browser that wants its topic, once. The log row is
 * claimed before sending: a second call with the same kind and ref is a no-op.
 */
export async function sendAlert(alert: Alert): Promise<{ sent: number; failed: number; skipped?: true }> {
  if (!pushConfigured()) return { sent: 0, failed: 0, skipped: true };
  const db = serviceClient();
  const claim = await db
    .from("alert_log")
    .insert({ kind: alert.kind, ref: alert.ref, title: alert.title, body: alert.body, url: alert.path })
    .select("id")
    .single();
  if (claim.error) {
    if (claim.error.code === "23505") return { sent: 0, failed: 0, skipped: true };
    throw claim.error;
  }

  const rows: Row[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth, client, failures")
      .contains("topics", JSON.stringify([alert.kind]))
      .range(from, from + 999);
    if (error) throw error;
    rows.push(...((data ?? []) as Row[]));
    if (!data || data.length < 1000) break;
  }

  const result = await deliver(rows, alert);
  await db.from("alert_log").update(result).eq("id", claim.data.id);
  return result;
}

/** A test to one browser only, so the button cannot page everyone. */
export async function sendTest(sub: BrowserSubscription): Promise<boolean> {
  if (!pushConfigured()) return false;
  setup();
  const alert: Alert = {
    kind: "test",
    ref: String(Date.now()),
    title: "Mastery Terminal alerts are on",
    body: "High-impact news, COT releases and US data will arrive here.",
    path: "/alerts",
  };
  await webpush.sendNotification(sub, payload(alert, "hq"), { TTL: 600 });
  return true;
}

export async function readAlertLog(limit = 20) {
  const { data, error } = await serviceClient()
    .from("alert_log")
    .select("kind, ref, title, body, url, sent, failed, created_at")
    .neq("kind", "test")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function countSubscriptions(): Promise<{ hq: number; mastery: number }> {
  const db = serviceClient();
  const [hq, mastery] = await Promise.all([
    db.from("push_subscriptions").select("id", { count: "exact", head: true }).eq("client", "hq"),
    db.from("push_subscriptions").select("id", { count: "exact", head: true }).eq("client", "mastery"),
  ]);
  return { hq: hq.count ?? 0, mastery: mastery.count ?? 0 };
}

/** Never lets a push problem fail the job that called it. */
export async function alertQuietly(alert: Alert | null): Promise<void> {
  if (!alert) return;
  try {
    await sendAlert(alert);
  } catch (error) {
    console.error(`alerts: ${alert.kind} ${alert.ref} failed`, error);
  }
}
