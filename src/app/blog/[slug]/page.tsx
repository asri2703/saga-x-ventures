import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, getPost, getPosts } from "@/lib/blog";
import { site } from "@/lib/site";
import { Container, Section } from "@/components/ui";

export function generateStaticParams() {
  return getPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      url: `${site.url}/blog/${post.slug}`,
      publishedTime: post.date,
    },
  };
}

export default async function BlogPost({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const related = getPosts()
    .filter((p) => p.slug !== post.slug)
    .slice(0, 2);

  /* BlogPosting schema. Gives Google the author, dates and headline
     explicitly instead of leaving it to infer them from the markup.
     Authored by the person, published by the company — the two entities the
     site declares in src/lib/schema.ts. */
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@id": `${site.url}/#asri-zulzali` },
    publisher: { "@id": `${site.url}/#organization` },
    mainEntityOfPage: `${site.url}/blog/${post.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <Section>
        <Container>
          <article className="max-w-2xl">
            <nav aria-label="Breadcrumb" className="text-sm text-pine-faint">
              <Link href="/blog" className="hover:text-pine">
                Writing
              </Link>
            </nav>

            <h1 className="display mt-4 text-4xl leading-[1.1] text-pine sm:text-5xl">
              {post.title}
            </h1>

            <p className="tnum mt-5 text-sm text-pine-faint">
              {formatDate(post.date)} · {post.readingMinutes} min read
            </p>

            <div
              className="prose mt-10"
              dangerouslySetInnerHTML={{ __html: post.html }}
            />

            {/* Education, not advice. Said once at the end of every post
                rather than buried in a footer nobody reads. */}
            <p className="mt-14 border-t border-rule pt-6 text-sm leading-relaxed text-pine-faint">
              Written as education, not financial advice. Trading carries real
              risk of losing real money, and nothing here is a recommendation to
              buy or sell anything.
            </p>
          </article>

          {related.length > 0 ? (
            <div className="mt-16 max-w-2xl">
              <h2 className="display text-xl text-pine">Also here</h2>
              <ul className="mt-6 space-y-4">
                {related.map((p) => (
                  <li key={p.slug}>
                    <Link
                      href={`/blog/${p.slug}`}
                      className="panel panel-link block p-6"
                    >
                      <p className="tnum text-sm text-pine-faint">
                        {formatDate(p.date)}
                      </p>
                      <p className="display mt-1 text-lg text-pine">
                        {p.title}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Container>
      </Section>
    </>
  );
}
