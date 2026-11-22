import type { Metadata } from "next";
import Link from "next/link";
import { formatDate, getPosts } from "@/lib/blog";
import { site } from "@/lib/site";
import { Container, Section } from "@/components/ui";

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
    "Notes on trading from Asri Zulzali — how a market is read, what the week looked like, and the mistakes worth describing out loud.",
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
            Notes on how a market gets read, what this week actually looked
            like, and the mistakes worth describing out loud. No tips, and
            nothing that tells you what to buy.
          </p>
        </div>

        {posts.length > 0 ? (
          <ul className="mt-14 max-w-3xl">
            {posts.map((post) => (
              <li key={post.slug} className="border-t border-rule last:border-b">
                <Link href={`/blog/${post.slug}`} className="block py-8">
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
          <div className="mt-14 max-w-2xl border-y border-rule py-12">
            <p className="display text-xl text-pine">
              Nothing published yet.
            </p>
            <p className="mt-3 leading-relaxed text-pine-soft">
              The first notes are being written. If there is something you want
              explained, say so and it may well become the first one.
            </p>
            <a
              href="/go/whatsapp?m=topic"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-block border border-pine px-5 py-3 text-base font-semibold text-pine transition-colors hover:bg-pine hover:text-paper"
            >
              Suggest a topic
            </a>
            <p className="mt-6 text-sm text-pine-faint">
              Or email{" "}
              <a
                href={`mailto:${site.email}`}
                className="text-pine underline decoration-ruby decoration-2 underline-offset-2"
              >
                {site.email}
              </a>
              .
            </p>
          </div>
        )}
      </Container>
    </Section>
  );
}
