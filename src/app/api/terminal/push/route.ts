import { authorised } from "@/lib/record-feed";
import { cleanTopics, isSubscription, pushConfigured, removeSubscription, saveSubscription } from "@/lib/alerts/push";

/**
 * Member push subscriptions, registered by Mastery Signal's server.
 *
 * The member's browser subscribes on masterysignal.com with HQ's public key
 * (GET this route for it), and Mastery's server forwards the subscription:
 *
 *   GET    /api/terminal/push                                  { publicKey }
 *   POST   /api/terminal/push { subscription, user_ref, topics }
 *   DELETE /api/terminal/push { endpoint }
 *   Authorization: Bearer $TERMINAL_FEED_KEY
 *
 * HQ then sends alerts straight to the member's browser. A tap opens
 * MASTERY_ALERT_URL?alert=<kind>:<ref>, which Mastery maps to its own page.
 */

export const dynamic = "force-dynamic";

function guard(request: Request): Response | null {
  const key = process.env.TERMINAL_FEED_KEY;
  if (!key || !pushConfigured()) return Response.json({ error: "Push is not configured" }, { status: 503 });
  if (!authorised(request.headers.get("authorization"), key)) {
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  }
  return null;
}

async function body(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const value = await request.json();
    return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export async function GET(request: Request): Promise<Response> {
  const denied = guard(request);
  if (denied) return denied;
  return Response.json({ publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY });
}

export async function POST(request: Request): Promise<Response> {
  const denied = guard(request);
  if (denied) return denied;
  const data = await body(request);
  if (!data || !isSubscription(data.subscription)) {
    return Response.json({ error: "Send a browser push subscription" }, { status: 400 });
  }
  const userRef = typeof data.user_ref === "string" ? data.user_ref.slice(0, 200) : null;
  try {
    await saveSubscription(data.subscription, { client: "mastery", userRef, topics: cleanTopics(data.topics) });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("terminal push subscribe failed", error);
    return Response.json({ error: "Could not save the subscription" }, { status: 500 });
  }
}

export async function DELETE(request: Request): Promise<Response> {
  const denied = guard(request);
  if (denied) return denied;
  const data = await body(request);
  const endpoint = typeof data?.endpoint === "string" ? data.endpoint : "";
  if (!endpoint) return Response.json({ error: "Send the endpoint" }, { status: 400 });
  try {
    await removeSubscription(endpoint);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("terminal push unsubscribe failed", error);
    return Response.json({ error: "Could not remove the subscription" }, { status: 500 });
  }
}
