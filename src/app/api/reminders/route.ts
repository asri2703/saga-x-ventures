import { timingSafeEqual } from "node:crypto";
import { dueForReminder, markReminded } from "@/lib/checkout/orders";
import { fukyaa } from "@/lib/commercial";
import { notifyExpiring } from "@/lib/notify";

/**
 * The daily sweep that keeps "one month, not a subscription" honest.
 *
 * Nothing recurs here: no card is held and no mandate exists, so a month
 * simply ends. The cost of that arrangement is silence — the server stops
 * and the first a client knows of it is a flat chart. This route is what
 * pays that cost, and it is the only moving part the whole arrangement has.
 *
 * It is called by Vercel's scheduler (see vercel.json), which sends
 * `Authorization: Bearer $CRON_SECRET`. Without the secret set, this answers
 * 503 rather than running: an endpoint that emails clients must not be
 * reachable by anyone who learns the path.
 *
 * Failures are per order. One bad address must not stop the twenty behind
 * it, and a row whose send failed keeps `reminded_at` null — which is both
 * the retry and the owner's list of the ones that did not go.
 */

export const dynamic = "force-dynamic";

function authorised(header: string | null): boolean {
  const expected = process.env.CRON_SECRET ?? "";
  if (!expected) return false;

  const claimed = Buffer.from(
    (header ?? "").replace(/^Bearer\s+/i, ""),
    "utf8",
  );
  const wanted = Buffer.from(expected, "utf8");
  if (claimed.length !== wanted.length) return false;
  return timingSafeEqual(claimed, wanted);
}

export async function GET(request: Request): Promise<Response> {
  if (!process.env.CRON_SECRET) {
    return Response.json({ error: "Reminders are not configured" }, { status: 503 });
  }

  if (!authorised(request.headers.get("authorization"))) {
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  }

  /* Everything whose month ends within the window. Not "ends in exactly
     five days": a day the job did not run, or a deployment that was down
     for an afternoon, would skip those rows for ever. A row that is already
     past its date is still worth an email — the server has stopped and the
     client is owed the reason. */
  const before = new Date(
    Date.now() + fukyaa.remindDaysBefore * 24 * 60 * 60 * 1000,
  );

  let due;
  try {
    due = await dueForReminder(before);
  } catch (error) {
    console.error("reminders: could not read the orders", error);
    return Response.json({ error: "Could not read the orders" }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;

  for (const order of due) {
    try {
      await notifyExpiring(order);
      // After the send, never before: claiming the flag first makes a
      // failure look like a message nobody can tell was never sent.
      await markReminded(order.id);
      sent += 1;
    } catch (error) {
      failed += 1;
      console.error("reminders: one did not go out", {
        order: order.id,
        error,
      });
    }
  }

  // The body is for the scheduler's log, which is where this is read from.
  return Response.json({ due: due.length, sent, failed });
}
