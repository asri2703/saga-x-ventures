import type { Metadata } from "next";
import Link from "next/link";
import { PageHead, SectionHead } from "@/components/hq/page-head";
import { Composer, SignInForm } from "@/components/hq/insight-forms";
import { ago } from "@/components/hq/story-badges";
import { TrendIcon } from "@/components/hq/trend-icon";
import { hqBase } from "@/lib/hq";
import { adminConfigured, isAdmin } from "@/lib/hq-admin";
import { listInsights } from "@/lib/insights/store";
import { TOPICS, topicBySlug, type Insight } from "@/lib/insights/topics";
import { signOutAction } from "./actions";

/**
 * Insights: Asri picks a topic and makes his call on gold; Claude writes the
 * article from HQ's data as a draft; he reads, edits and publishes it here.
 * Sending published insights to Mastery Signal comes next.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 120;
export const metadata: Metadata = { title: "Insights" };

async function load(): Promise<{ ok: true; items: Insight[]; now: number } | { ok: false; now: number }> {
  const now = Date.now();
  try {
    return { ok: true, items: await listInsights({ limit: 60 }), now };
  } catch (error) {
    console.error("insights: could not read", error);
    return { ok: false, now };
  }
}

export default async function InsightsPage() {
  const admin = await isAdmin();
  if (!admin) {
    return (
      <div className="mx-auto flex w-full min-w-0 max-w-4xl flex-col gap-8">
        <PageHead title="Insights" dek="For the HQ admin. Sign in to write, read drafts and publish." />
        {adminConfigured() ? (
          <SignInForm />
        ) : (
          <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
            Writing is off until HQ_ADMIN_KEY is set (at least 16 characters) in .env.local and on Vercel.
          </p>
        )}
      </div>
    );
  }
  const [data, base] = await Promise.all([load(), hqBase()]);
  const { now } = data;

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-4xl flex-col gap-8">
      <PageHead
        title="Insights"
        dek="Pick a topic and make your call on gold. Claude writes the full insight from HQ's data as a draft; you read, edit and publish."
      />

      <section className="flex flex-col gap-3">
        <SectionHead title="Write an insight" />
        {(
          <>
            <Composer topics={TOPICS.map((t) => ({ slug: t.slug, name: t.name }))} />
            <form action={signOutAction}>
              <button type="submit" className="text-xs text-muted-foreground underline-offset-4 hover:underline">
                Sign out of writing on this browser
              </button>
            </form>
          </>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <SectionHead title="All insights" note="Newest first" />
        {!data.ok ? (
          <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
            Could not read insights. If this is new, the insights table may not exist yet.
          </p>
        ) : data.items.length === 0 ? (
          <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
            No insights yet. Write the first one above.
          </p>
        ) : (
          <ol className="divide-y divide-border border-y border-border">
            {data.items.map((item) => (
              <li key={item.id}>
                <Link href={`${base}/insights/${item.id}`} className="group flex items-start gap-3 py-3.5">
                  <TrendIcon trend={item.direction} className="mt-0.5 size-5" label={`gold ${item.direction}`} />
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <span
                        className={
                          item.status === "published"
                            ? "rounded bg-up-soft px-1.5 py-px font-semibold text-up"
                            : "rounded bg-warn-soft px-1.5 py-px font-semibold text-warn-foreground"
                        }
                      >
                        {item.status === "published" ? "Published" : "Draft"}
                      </span>
                      {topicBySlug(item.topic)?.name ?? item.topic} · {ago(item.created_at, now)}
                    </span>
                    <span className="line-clamp-2 text-[15px] leading-snug font-medium group-hover:underline">{item.title}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
