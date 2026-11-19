import type { Metadata } from "next";
import Link from "next/link";
import { formatDate, getPosts } from "@/lib/blog";
import { waLink } from "@/lib/site";
import { ButtonAnchor, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Artikel",
  description:
    "Tulisan tentang trading, risiko dan sistem — daripada Traders Lounge.",
  alternates: { canonical: "/lounge/artikel" },
};

export default function ArtikelPage() {
  const posts = getPosts();

  return (
    <Section tone="base" className="pt-16 sm:pt-20">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-4xl font-extrabold leading-[1.08] text-text sm:text-5xl">
          Artikel
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-text-muted">
          Tulisan yang lebih panjang dan boleh dirujuk semula.
        </p>

        {posts.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-line-strong bg-panel p-10 text-center">
            <p className="mx-auto max-w-md leading-relaxed text-text-muted">
              Belum ada artikel diterbitkan. Yang pertama akan keluar tidak lama
              lagi.
            </p>
            <div className="mt-6">
              <ButtonAnchor
                href={waLink("Hi, beritahu saya bila artikel Traders Lounge bermula.")}
                target="_blank"
                rel="noopener noreferrer"
                variant="outline"
              >
                Beritahu saya
              </ButtonAnchor>
            </div>
          </div>
        ) : (
          <ul className="mt-12 space-y-4">
            {posts.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/lounge/artikel/${post.slug}`}
                  className="block rounded-2xl bg-panel ring-1 ring-line p-7 transition-colors hover:ring-line-strong"
                >
                  <p className="text-sm text-text-faint">
                    <time dateTime={post.date}>{formatDate(post.date)}</time>
                    <span aria-hidden> · </span>
                    {post.readingMinutes} minit bacaan
                  </p>
                  <h2 className="mt-2 font-display text-xl font-bold leading-snug text-text">
                    {post.title}
                  </h2>
                  {post.excerpt ? (
                    <p className="mt-3 leading-relaxed text-text-muted">
                      {post.excerpt}
                    </p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Section>
  );
}
