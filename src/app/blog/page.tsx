import type { Metadata } from "next";
import Link from "next/link";
import { formatDate, getPosts } from "@/lib/blog";
import { site } from "@/lib/site";
import { Container, Section } from "@/components/ui";
import { ActionOut, Panel, TextLink } from "@/components/shell";

/**
 * Personal writing, not a content-marketing channel.
 *
 * This section used to be the agency's "Insights", down to a free-audit call
 * to action. The nav, the footer and the homepage all call it Writing; the
 * page now agrees with them.
 */

export const metadata: Metadata = {
  title: "Writing",
  description:
    "Notes on trading from Asri Zulzali: reading a market, what the week looked like, and the mistakes worth writing down.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndex() {
  const posts = getPosts();

  return (
    <Section>
      <Container>
        <div className="max-w-2xl">
          <h1 className="display text-4xl text-pine sm:text-5xl">Writing</h1>
          <p className="mt-6 text-lg leading-relaxed text-pine-soft">
            Reading a market, what the week looked like, and the mistakes
            I keep making. No tips, nothing telling you what to buy.
          </p>
        </div>

        {posts.length > 0 ? (
          <ul className="mt-14 max-w-3xl space-y-5">
            {posts.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/blog/${post.slug}`}
                  data-reveal
                  className="panel panel-link block p-7 sm:p-8"
                >
                  <p className="tnum text-sm text-pine-faint">
                    {formatDate(post.date)} · {post.readingMinutes} min read
                  </p>
                  <p className="display mt-2 text-2xl text-pine">
                    {post.title}
                  </p>
                  {post.excerpt ? (
                    <p className="mt-3 leading-relaxed text-pine-soft">
                      {post.excerpt}
                    </p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          /* An empty section is an invitation, not an error. The agency-era
             posts were deleted with the pivot and the trading ones are
             written as they are written. */
          <Panel className="mt-14 max-w-2xl">
            <p className="display text-xl text-pine">Nothing published yet.</p>
            <p className="mt-3 leading-relaxed text-pine-soft">
              I am writing the first ones. Tell me what you want explained
              and I will start there.
            </p>
            <div className="mt-8">
              <ActionOut href="/go/whatsapp?m=topic" tone="ink">
                Suggest a topic
              </ActionOut>
            </div>
            <p className="mt-6 text-sm text-pine-faint">
              Or email{" "}
              <TextLink href={`mailto:${site.email}`} external>
                {site.email}
              </TextLink>
              .
            </p>
          </Panel>
        )}
      </Container>
    </Section>
  );
}
