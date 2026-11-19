import type { Metadata } from "next";
import Link from "next/link";
import { getPosts } from "@/lib/blog";
import { waLink } from "@/lib/site";
import { ButtonAnchor, Container, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Traders Lounge",
  description:
    "Video, tutorial, artikel, webinar dan kelas — semuanya di satu tempat.",
};

const areas = [
  { href: "/lounge/video", title: "Video", body: "Tutorial dan penjelasan pendek." },
  { href: "/lounge/artikel", title: "Artikel", body: "Tulisan yang lebih panjang dan boleh dirujuk semula." },
  { href: "/lounge/event", title: "Event", body: "Webinar, seminar dan kelas — akan datang dan rakaman lepas." },
];

export default function LoungePage() {
  const posts = getPosts();

  return (
    <>
      <section className="border-b border-line">
        <Container className="py-20 sm:py-28">
          <h1 className="font-display text-4xl font-extrabold leading-[1.05] sm:text-6xl">
            Traders Lounge
          </h1>
          <p className="mt-6 max-w-xl text-xl leading-relaxed text-text-muted">
            Tempat semuanya diajar. Sebahagian daripada Saga X Ventures, bukan
            brand berasingan.
          </p>
        </Container>
      </section>

      <Section tone="base">
        <div className="grid gap-6 md:grid-cols-3">
          {areas.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="rounded-2xl bg-panel ring-1 ring-line p-7 transition-colors hover:ring-line-strong"
            >
              <h2 className="font-display text-xl font-bold text-text">{a.title}</h2>
              <p className="mt-3 leading-relaxed text-text-muted">{a.body}</p>
            </Link>
          ))}
        </div>

        {posts.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-line-strong bg-panel p-10 text-center">
            <p className="mx-auto max-w-md leading-relaxed text-text-muted">
              Belum ada kandungan diterbitkan. Yang pertama akan keluar tidak
              lama lagi.
            </p>
            <div className="mt-6">
              <ButtonAnchor
                href={waLink("Hi, beritahu saya bila kandungan Traders Lounge bermula.")}
                target="_blank"
                rel="noopener noreferrer"
                variant="outline"
              >
                Beritahu saya
              </ButtonAnchor>
            </div>
          </div>
        ) : null}
      </Section>
    </>
  );
}
