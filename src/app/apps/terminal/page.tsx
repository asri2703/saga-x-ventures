import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { ago, DirectionBadge, ImpactBadge, myt } from "@/components/hq/story-badges";
import { readFeed, type FeedItem } from "@/lib/terminal/store";

/**
 * The news wire as stored: every relevant story from the last 72 hours,
 * newest first, filterable by minimum impact.
 *
 * Served at apps.sagaxventures.com/terminal (see the host rewrite in
 * next.config.ts) and /apps/terminal on the main domain.
 */

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "News wire" };

const MIN_OPTIONS = ["low", "medium", "high"] as const;
type Min = (typeof MIN_OPTIONS)[number];
const MIN_LABEL: Record<Min, string> = { low: "All", medium: "Medium +", high: "High only" };

type Loaded = { ok: true; items: FeedItem[]; now: number } | { ok: false; reason: string };

async function load(min: Min): Promise<Loaded> {
  const now = Date.now();
  try {
    const items = await readFeed({
      since: new Date(now - 72 * 60 * 60 * 1000),
      minImpact: min,
      limit: 100,
    });
    return { ok: true, items, now };
  } catch (error) {
    console.error("hq wire: could not read", error);
    return { ok: false, reason: error instanceof Error ? error.message : String(error) };
  }
}

export default async function NewsWire(props: PageProps<"/apps/terminal">) {
  const params = await props.searchParams;
  const requested = typeof params.min === "string" ? params.min : "";
  const min: Min = (MIN_OPTIONS as readonly string[]).includes(requested) ? (requested as Min) : "low";
  const data = await load(min);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">News wire</h1>
          <p className="text-sm text-muted-foreground">
            Headlines that can move XAUUSD, screened by Claude. Last 72 hours, newest first.
          </p>
        </div>
        <nav aria-label="Minimum impact" className="flex gap-1 rounded-lg bg-muted p-1">
          {MIN_OPTIONS.map((option) => (
            <a
              key={option}
              href={`?min=${option}`}
              aria-current={option === min ? "page" : undefined}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                option === min ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {MIN_LABEL[option]}
            </a>
          ))}
        </nav>
      </div>

      {!data.ok ? (
        <Card className="border-destructive/40">
          <CardContent className="text-sm">
            <p className="font-medium">Could not read the wire.</p>
            <p className="mt-1 text-muted-foreground">{data.reason}</p>
          </CardContent>
        </Card>
      ) : data.items.length === 0 ? (
        <Card>
          <CardContent className="text-sm text-muted-foreground">
            Nothing at this level in the last 72 hours.
          </CardContent>
        </Card>
      ) : (
        <ol className="flex flex-col gap-3">
          {data.items.map((item) => (
            <li key={item.id}>
              <Card className="gap-0 py-5">
                <CardContent className="flex flex-col gap-2 px-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <ImpactBadge impact={item.impact} />
                    <DirectionBadge direction={item.direction} />
                    <span className="text-xs text-muted-foreground">
                      {item.outlet || "Unknown outlet"} · {myt(item.published_at)} MYT ·{" "}
                      {ago(item.published_at, data.now)}
                    </span>
                  </div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base font-semibold leading-snug hover:underline"
                  >
                    {item.headline}
                  </a>
                  {item.summary ? <p className="text-sm text-muted-foreground">{item.summary}</p> : null}
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
