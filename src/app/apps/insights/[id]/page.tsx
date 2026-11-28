import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { EditForm } from "@/components/hq/insight-forms";
import { TrendIcon } from "@/components/hq/trend-icon";
import { hqBase } from "@/lib/hq";
import { isAdmin } from "@/lib/hq-admin";
import { readInsight } from "@/lib/insights/store";
import { LANGUAGES, topicBySlug } from "@/lib/insights/topics";
import { deleteAction, publishAction } from "../actions";

/** One insight as members will read it, with edit, publish and delete when signed in. */

export const dynamic = "force-dynamic";

const CALL = { up: "Gold up", down: "Gold down", flat: "Gold sideways" } as const;

export async function generateMetadata(props: PageProps<"/apps/insights/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  if (!(await isAdmin())) return { title: "Insight" };
  const item = await readInsight(id).catch(() => null);
  return { title: item?.title ?? "Insight" };
}

function stamp(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: "Asia/Kuala_Lumpur",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function InsightPage(props: PageProps<"/apps/insights/[id]">) {
  const { id } = await props.params;
  const [base, admin] = await Promise.all([hqBase(), isAdmin()]);
  if (!admin) redirect(`${base}/insights`);
  const item = await readInsight(id).catch(() => null);
  if (!item) notFound();
  const published = item.status === "published";

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-6">
      <Link
        href={`${base}/insights`}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden /> Insights
      </Link>

      {admin ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <span
            className={
              published
                ? "rounded bg-up-soft px-2 py-0.5 text-xs font-semibold text-up"
                : "rounded bg-warn-soft px-2 py-0.5 text-xs font-semibold text-warn-foreground"
            }
          >
            {published ? `Published ${item.published_at ? stamp(item.published_at) : ""}` : "Draft, only visible in HQ"}
          </span>
          <form action={publishAction} className="ml-auto">
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="status" value={published ? "draft" : "published"} />
            <button
              type="submit"
              className={
                published
                  ? "rounded-lg border border-border px-3 py-1.5 text-sm font-semibold"
                  : "rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
              }
            >
              {published ? "Unpublish" : "Publish"}
            </button>
          </form>
        </div>
      ) : null}

      <article className="flex flex-col gap-5">
        <header className="flex flex-col gap-3 border-b border-border pb-5">
          <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-semibold text-foreground">
              <TrendIcon trend={item.direction} className="size-4" label={CALL[item.direction]} />
              {CALL[item.direction]}
            </span>
            {topicBySlug(item.topic)?.name ?? item.topic} · {stamp(item.created_at)} MYT · {LANGUAGES[item.language]}
          </p>
          <h1 className="font-news text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">{item.title}</h1>
          <p className="text-lg leading-relaxed text-muted-foreground">{item.body.summary}</p>
        </header>
        {item.body.sections.map((s, i) => (
          <section key={i} className="flex flex-col gap-1.5">
            <h2 className="font-news text-xl font-semibold">{s.heading}</h2>
            <p className="leading-relaxed whitespace-pre-line">{s.text}</p>
          </section>
        ))}
        <p className="border-t border-border pt-4 text-xs text-muted-foreground">
          Written with Claude from HQ&apos;s data (official releases, Saga estimates, the news wire and CFTC positioning) around
          Asri&apos;s call. Saga estimates are our own, not market consensus. For education, not financial advice.
        </p>
      </article>

      {admin ? (
        <section className="flex flex-col gap-3">
          <h2 className="font-news text-xl font-semibold">Edit</h2>
          {item.notes ? (
            <p className="text-sm text-muted-foreground">
              Your notes when it was written: <span className="text-foreground">{item.notes}</span>
            </p>
          ) : null}
          <EditForm id={item.id} title={item.title} body={item.body} />
          <details className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
            <summary className="cursor-pointer font-medium text-down">Delete this insight</summary>
            <form action={deleteAction} className="mt-3 flex flex-wrap items-center gap-3">
              <input type="hidden" name="id" value={item.id} />
              <span className="text-muted-foreground">This removes it for good.</span>
              <button type="submit" className="rounded-lg bg-down px-3 py-1.5 font-semibold text-white">
                Yes, delete it
              </button>
            </form>
          </details>
        </section>
      ) : null}
    </div>
  );
}
