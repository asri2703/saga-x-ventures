import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, getPost, getPosts } from "@/lib/blog";
import { site, waLink } from "@/lib/site";
import { ButtonAnchor, Container, RiskNote, Section } from "@/components/ui";

export function generateStaticParams() {
  return getPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/lounge/artikel/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/lounge/artikel/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      url: `${site.url}/lounge/artikel/${post.slug}`,
      publishedTime: post.date,
    },
  };
}

export default async function ArticlePage({
  params,
}: PageProps<"/lounge/artikel/[slug]">) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const related = getPosts()
    .filter((p) => p.slug !== post.slug)
    .slice(0, 2);

  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: { "@type": "Person", name: site.founder.name },
    publisher: { "@type": "Organization", name: site.name },
    mainEntityOfPage: `${site.url}/lounge/artikel/${post.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <Container className="py-16 sm:py-20">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/lounge/artikel"
            className="text-sm font-semibold text-text-muted underline underline-offset-4 hover:text-text"
          >
            Semua artikel
          </Link>

          <p className="mt-8 text-sm text-text-faint">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span aria-hidden> · </span>
            {post.readingMinutes} minit bacaan
          </p>

          <h1 className="mt-3 font-display text-4xl font-extrabold leading-[1.08] text-text sm:text-5xl">
            {post.title}
          </h1>

          <article
            className="prose mt-10"
            dangerouslySetInnerHTML={{ __html: post.html }}
          />

          <div className="mt-12">
            <RiskNote>{site.riskLine}</RiskNote>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonAnchor
              href={waLink(`Hi, saya baru baca "${post.title}" dan ada soalan.`)}
              target="_blank"
              rel="noopener noreferrer"
              variant="brand"
            >
              Tanya tentang artikel ini
            </ButtonAnchor>
          </div>
        </div>
      </Container>

      {related.length ? (
        <Section tone="panel">
          <div className="mx-auto max-w-2xl">
            <h2 className="font-display text-xl font-bold text-text">
              Bacaan lain
            </h2>
            <ul className="mt-6 space-y-3">
              {related.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/lounge/artikel/${p.slug}`}
                    className="block rounded-xl border border-line bg-base p-5 transition-colors hover:ring-line-strong"
                  >
                    <span className="font-semibold text-text">{p.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Section>
      ) : null}
    </>
  );
}
