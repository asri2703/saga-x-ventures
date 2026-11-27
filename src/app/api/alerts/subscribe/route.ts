import { cleanTopics, isSubscription, pushConfigured, removeSubscription, saveSubscription } from "@/lib/alerts/push";

/**
 * HQ's own browser subscriptions, from the Alerts page.
 *
 *   POST   { subscription, topics }   subscribe or change topics
 *   DELETE { endpoint }               unsubscribe
 *
 * A caller can only add or remove its own browser; nothing here sends.
 */

export const dynamic = "force-dynamic";

async function body(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const value = await request.json();
    return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request): Promise<Response> {
  if (!pushConfigured()) return Response.json({ error: "Alerts are not configured" }, { status: 503 });
  const data = await body(request);
  if (!data || !isSubscription(data.subscription)) {
    return Response.json({ error: "Send a browser push subscription" }, { status: 400 });
  }
  try {
    await saveSubscription(data.subscription, { client: "hq", topics: cleanTopics(data.topics) });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("alerts subscribe failed", error);
    return Response.json({ error: "Could not save the subscription" }, { status: 500 });
  }
}

export async function DELETE(request: Request): Promise<Response> {
  const data = await body(request);
  const endpoint = typeof data?.endpoint === "string" ? data.endpoint : "";
  if (!endpoint) return Response.json({ error: "Send the endpoint" }, { status: 400 });
  try {
    await removeSubscription(endpoint);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("alerts unsubscribe failed", error);
    return Response.json({ error: "Could not remove the subscription" }, { status: 500 });
  }
}
