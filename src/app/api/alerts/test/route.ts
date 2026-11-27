import { isSubscription, sendTest } from "@/lib/alerts/push";

/**
 * Sends a test notification to the one browser that asks, never to anyone
 * else: POST { subscription }.
 */

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  let data: unknown = null;
  try {
    data = await request.json();
  } catch {
    // handled below
  }
  const sub = (data as { subscription?: unknown } | null)?.subscription;
  if (!isSubscription(sub)) return Response.json({ error: "Send a browser push subscription" }, { status: 400 });
  try {
    const ok = await sendTest(sub);
    return ok
      ? Response.json({ ok: true })
      : Response.json({ error: "Alerts are not configured" }, { status: 503 });
  } catch (error) {
    console.error("alerts test failed", error);
    return Response.json({ error: "The push service refused the test" }, { status: 502 });
  }
}
