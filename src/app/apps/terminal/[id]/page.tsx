import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { CategoryBadge, ImpactBadge, myt, PhotoCredit } from "@/components/hq/story-badges";
import { Moves, StandingBadge, StoryCover, storyTitle } from "@/components/hq/story-card";
import { wasUpdated } from "@/lib/terminal/breaking";
import { hqBase } from "@/lib/hq";
import { readStory } from "@/lib/terminal/store";

/**
 * One story: the Mastery Brief, then every outlet that carried it.
 *
 * The brief is ours. The outlets are where a member goes for the original
 * reporting, so they are listed in full and link out.
 */

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/apps/terminal/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const story = await readStory(id).catch(() => null);
  return { title: story ? storyTitle(story) : "Story" };
}

const SECTIONS = [
  ["what_happened", "What happened"],
  ["why_it_matters", "Why it matters"],
  ["gold_impact", "Market impact"],
  ["what_to_watch", "What to watch"],
] as const;

export default async function StoryPage(props: PageProps<"/apps/terminal/[id]">) {
  const { id } = await props.params;
  const [story, base] = await Promise.all([readStory(id), hqBase()]);
  if (!story) notFound();

  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Link
        href={`${base}/terminal`}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden /> News wire
      </Link>

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <CategoryBadge category={story.category} />
          <ImpactBadge impact={story.impact} />
          <StandingBadge item={story} />
          <Moves item={story} />
        </div>
        <h1 className="font-news text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{storyTitle(story)}</h1>
        <p className="text-sm text-muted-foreground">
          {myt(story.published_at)} MYT · {story.sources.length}{" "}
          {story.sources.length === 1 ? "source" : "sources"}
          {wasUpdated(story) ? ` · updated ${myt(story.last_update_at)} MYT` : ""}
        </p>
      </header>

      <figure className="flex flex-col gap-1.5">
        <StoryCover item={story} priority />
        <PhotoCredit item={story} className="text-xs" />
        {story.image_url ? (
          <p className="text-xs text-muted-foreground">Illustrative, not from the event.</p>
        ) : null}
      </figure>

      {story.brief ? (
        <div className="flex flex-col gap-5">
          {SECTIONS.map(([key, label]) => (
            <section key={key} className="flex flex-col gap-1.5">
              <h2 className="text-sm font-semibold">{label}</h2>
              <p className="leading-relaxed text-foreground/90">{story.brief?.[key]}</p>
            </section>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2 rounded-lg bg-muted p-4">
          {story.summary ? <p className="leading-relaxed">{story.summary}</p> : null}
          <p className="text-sm text-muted-foreground">
            The full brief for this story is still being written. It appears here within a few minutes.
          </p>
        </div>
      )}

      <section className="flex flex-col gap-2 border-t border-border pt-5">
        <h2 className="text-sm font-semibold">Sources</h2>
        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card">
          {story.sources.map((source) => (
            <li key={source.url}>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start justify-between gap-3 p-3 hover:bg-muted"
              >
                <span className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium text-muted-foreground">{source.outlet || "Source"}</span>
                  <span className="text-sm leading-snug">{source.headline}</span>
                </span>
                <ExternalLink className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-muted-foreground">
        Written by AI from the headlines above. It explains, it does not advise: nothing here is a
        signal to buy or sell.
      </p>
    </article>
  );
}
