import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { formatDate, getPosts } from "@/lib/blog";
import { waLink } from "@/lib/site";
import {
  ButtonAnchor,
  Container,
  Eyebrow,
  Section,
  SectionHeading,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "Insights",
  description:
    "Practical marketing and web advice for Malaysian SMEs — what actually moves enquiries, written plainly and without the jargon.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndex() {
  const posts = getPosts();

  return (
    <>
      <section className="relative overflow-hidden border-b border-line/60">
        <div aria-hidden className="bg-grid bg-grid-fade absolute inset-0" />
        <div
          aria-hidden
          className="animate-drift-a absolute left-1/2 top-0 h-80 w-[680px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/18 blur-[100px]"
        />
        <Container className="relative py-20 sm:py-28">
          <div className="max-w-3xl">
            <Eyebrow>Insights</Eyebrow>
            <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-body sm:text-5xl">
              What we would tell you over coffee
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted">
              No listicles, no growth hacks. Just the things we end up
              explaining to clients over and over — written down so you can act
              on them yourself, whether or not you hire us.
            </p>
          </div>
        </Container>
      </section>

      <Section tone="surface">
        {posts.length === 0 ? (
          <p className="text-muted">No posts published yet.</p>
        ) : (
          <div className="space-y-6">
            {posts.map((post, i) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                data-reveal
                style={{ "--reveal-delay": `${i * 80}ms` } as CSSProperties}
                className="group block rounded-2xl border border-line bg-elevated/60 p-7 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/50 hover:bg-elevated sm:p-9"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-faint">
                  <time dateTime={post.date}>{formatDate(post.date)}</time>
                  <span aria-hidden>·</span>
                  <span>{post.readingMinutes} min read</span>
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-line-bright px-2.5 py-0.5 text-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <h2 className="mt-4 max-w-3xl text-xl font-semibold leading-snug text-body transition-colors group-hover:text-accent sm:text-2xl">
                  {post.title}
                </h2>
                <p className="mt-3 max-w-3xl leading-relaxed text-muted">
                  {post.excerpt}
                </p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
                  Read it
                  <svg
                    aria-hidden
                    viewBox="0 0 16 16"
                    className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 8h10M9 4l4 4-4 4" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        )}
      </Section>

      <Section>
        <SectionHeading
          align="center"
          title="Rather have us look at yours?"
          lead="We will audit your website, ads, and search presence and send you what we find — free, and yours to keep either way."
        />
        <div className="mt-9 flex justify-center">
          <ButtonAnchor
            href={waLink()}
            target="_blank"
            rel="noopener noreferrer"
            size="lg"
          >
            Get a free audit
          </ButtonAnchor>
        </div>
      </Section>
    </>
  );
}
