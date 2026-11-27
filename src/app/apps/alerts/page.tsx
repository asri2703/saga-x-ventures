import type { Metadata } from "next";
import { AlertsManager } from "@/components/hq/alerts-manager";
import { myt } from "@/components/hq/story-badges";
import { countSubscriptions, pushConfigured, readAlertLog } from "@/lib/alerts/push";

/**
 * Alerts: turn push on for this browser, and see what was sent.
 *
 * HQ sends three kinds: a high-impact story once its brief is written, a new
 * COT report, and a new US data point (CPI, jobs, wages, the Fed's target).
 */

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Alerts" };

const KIND: Record<string, string> = { news: "News", cot: "COT", macro: "US data" };

async function load() {
  if (!pushConfigured()) return { configured: false as const };
  try {
    const [log, subs] = await Promise.all([readAlertLog(30), countSubscriptions()]);
    return { configured: true as const, log, subs, error: null as string | null };
  } catch (error) {
    return { configured: true as const, log: [], subs: { hq: 0, mastery: 0 }, error: String(error) };
  }
}

export default async function AlertsPage() {
  const data = await load();
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Alerts</h1>
        <p className="text-sm text-muted-foreground">
          Push notifications for high-impact news, each COT release and new US data, sent straight to the
          browser with no third-party service.
        </p>
      </div>

      {!data.configured ? (
        <div className="rounded-xl border border-border bg-card p-5 text-sm">
          Alerts need NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY and VAPID_SUBJECT in the environment.
        </div>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-5 md:col-span-2">
              <h2 className="mb-3 font-semibold">This browser</h2>
              <AlertsManager publicKey={publicKey} />
            </div>
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
              <h2 className="font-semibold">Subscribed</h2>
              <p className="text-3xl font-semibold tabular-nums">{data.subs.hq + data.subs.mastery}</p>
              <p className="text-xs text-muted-foreground">
                {data.subs.hq} on HQ · {data.subs.mastery} Mastery members
              </p>
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-semibold">Sent</h2>
            {data.error ? <p className="text-sm text-destructive">Could not read the log: {data.error}</p> : null}
            {data.log.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing sent yet.</p>
            ) : (
              <ol className="divide-y divide-border rounded-xl border border-border bg-card">
                {data.log.map((a) => (
                  <li key={`${a.kind}:${a.ref}`} className="flex flex-col gap-1 px-4 py-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium">{a.title}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {KIND[a.kind] ?? a.kind} · {myt(a.created_at)}
                      </span>
                    </div>
                    <p className="text-muted-foreground">{a.body}</p>
                    <p className="text-xs text-muted-foreground">
                      Delivered {a.sent}
                      {a.failed ? `, failed ${a.failed}` : ""}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </>
      )}
    </div>
  );
}
