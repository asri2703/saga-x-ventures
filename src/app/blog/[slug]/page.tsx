import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, getPost, getPosts } from "@/lib/blog";
import { getService } from "@/lib/services";
import { site, waLink } from "@/lib/site";
import { ButtonAnchor, ButtonLink, Container } from "@/components/ui";

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
  const service = post.service ? getService(post.service) : undefined;

  /* BlogPosting schema. Gives Google the author, dates, and headline
     explicitly instead of leaving it to infer them from the markup. */
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Organization", name: site.name, url: site.url },
    publisher: { "@type": "Organization", name: site.name, url: site.url },
    mainEntityOfPage: `${site.url}/blog/${post.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <article>
        <header className="relative overflow-hidden border-b border-line/60">
          <div aria-hidden className="bg-grid bg-grid-fade absolute inset-0" />
          <div
            aria-hidden
            className="animate-drift-a absolute left-1/2 top-0 h-72 w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/15 blur-[100px]"
          />
          {/* Article pages run as a single centred column — breadcrumb, title,
              and body share one left edge, so the eye never has to re-find
              where the text starts. */}
          <Container className="relative py-16 sm:py-20">
            <div className="mx-auto max-w-2xl">
            <nav aria-label="Breadcrumb" className="mb-8">
              <ol className="flex items-center gap-2 text-sm text-faint">
                <li>
                  <Link href="/" className="transition-colors hover:text-accent">
                    Home
                  </Link>
                </li>
                <li aria-hidden>/</li>
                <li>
                  <Link
                    href="/blog"
                    className="transition-colors hover:text-accent"
                  >
                    Insights
                  </Link>
                </li>
              </ol>
            </nav>

            <div>
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
              <h1 className="mt-5 text-3xl font-semibold leading-[1.15] tracking-tight text-body sm:text-5xl">
                {post.title}
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-muted">
                {post.excerpt}
              </p>
            </div>
            </div>
          </Container>
        </header>

        <Container className="py-16 sm:py-20">
          {/* Measure capped for readability — long lines are the most common
              reason people abandon an article halfway. */}
          <div
            className="prose mx-auto max-w-2xl"
            dangerouslySetInnerHTML={{ __html: post.html }}
          />

          <div className="mx-auto mt-16 max-w-2xl rounded-2xl border border-accent/25 bg-elevated p-7 sm:p-9">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
              Free audit
            </p>
            <h2 className="mt-4 text-2xl font-semibold leading-snug text-body">
              Want us to check this on your business?
            </h2>
            <p className="mt-3 leading-relaxed text-muted">
              We go through your website, ad accounts, and search presence, then
              send you what we find in plain English. No charge, no obligation,
              and the findings are yours whether you hire us or not.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <ButtonAnchor
                href={waLink(`Hi, I just read "${post.title}" — can you audit my business?`)}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp us
              </ButtonAnchor>
              {service ? (
                <ButtonLink
                  href={`/services/${service.slug}`}
                  variant="outline"
                >
                  About our {service.name.toLowerCase()}
                </ButtonLink>
              ) : (
                <ButtonLink href="/services" variant="outline">
                  See our services
                </ButtonLink>
              )}
            </div>
          </div>
        </Container>
      </article>

      {related.length > 0 ? (
        <section className="border-t border-line bg-surface">
          <Container className="py-16 sm:py-20">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
              Read next
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {related.map((p) => (
                <Link
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="group rounded-xl border border-line bg-elevated/50 px-6 py-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/50"
                >
                  <p className="text-xs text-faint">{formatDate(p.date)}</p>
                  <h3 className="mt-2 font-semibold leading-snug text-body transition-colors group-hover:text-accent">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {p.excerpt}
                  </p>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      ) : null}
    </>
  );
}
