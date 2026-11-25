import { revalidatePath } from "next/cache";
import { authorised, feedConfig, parseReport, storeReport } from "@/lib/record-feed";

/**
 * Where the reporter EA on the VPS posts the master account's figures.
 *
 * The order of the checks is the point: nothing is parsed before the secret
 * matches, and nothing is written before the login does. A request that
 * passes both is the EA, and what it sends becomes the record on /copytrade.
 *
 * Status codes are for the EA's journal, which is where the owner will look
 * when the chart stops moving: 401 is the secret, 403 is the wrong account
 * attached, 400 names the field, 500 is ours and the next hour retries it.
 */
export async function POST(request: Request): Promise<Response> {
  const config = feedConfig();
  if (!config) {
    return Response.json({ error: "Record feed is not configured" }, { status: 503 });
  }

  if (!authorised(request.headers.get("authorization"), config.secret)) {
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Expected JSON" }, { status: 400 });
  }

  const parsed = parseReport(body);
  if (!parsed.ok) {
    return Response.json({ error: `Invalid ${parsed.reason}` }, { status: 400 });
  }

  if (!config.logins.includes(parsed.report.login)) {
    console.warn("record ingest: report from an account not on the list", {
      login: parsed.report.login,
    });
    return Response.json({ error: "Account not on the record list" }, { status: 403 });
  }

  try {
    await storeReport(parsed.report);
  } catch (error) {
    console.error("record ingest: could not store", error);
    return Response.json({ error: "Could not store" }, { status: 500 });
  }

  // The page is cached for an hour; this makes the next visit draw the
  // reading that just arrived instead of the one before it.
  revalidatePath("/copytrade");

  return Response.json({ ok: true, deals: parsed.report.deals.length });
}
