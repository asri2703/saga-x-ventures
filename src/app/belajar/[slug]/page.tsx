import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { courses } from "@/lib/products";
import { site, waLink } from "@/lib/site";
import {
  ButtonAnchor,
  ButtonLink,
  CheckItem,
  Container,
  RiskNote,
  Section,
} from "@/components/ui";

export function generateStaticParams() {
  return courses.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/belajar/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const course = courses.find((c) => c.slug === slug);
  if (!course) return {};
  return {
    title: course.name,
    description: course.summary,
    alternates: { canonical: `/belajar/${course.slug}` },
  };
}

export default async function CoursePage({ params }: PageProps<"/belajar/[slug]">) {
  const { slug } = await params;
  const course = courses.find((c) => c.slug === slug);
  if (!course) notFound();

  const enquiry = waLink(`Hi, saya berminat dengan kursus ${course.name}.`);

  return (
    <>
      <section className="bg-navy text-on-dark">
        <Container className="py-20 sm:py-28">
          <p className="text-sm font-semibold text-sky">{course.level}</p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-extrabold leading-[1.05] sm:text-6xl">
            {course.name}
          </h1>
          <p className="mt-6 max-w-xl text-xl leading-relaxed text-on-dark-muted">
            {course.summary}
          </p>
        </Container>
      </section>

      <Section tone="mist">
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl font-bold text-navy">
            Selepas habis, awak boleh
          </h2>
          <ul className="mt-6 space-y-3">
            {course.outcomes.map((o) => (
              <CheckItem key={o}>{o}</CheckItem>
            ))}
          </ul>

          {/* Phase one: interest, not checkout. The course is not recorded yet,
              and a Buy button in front of something that does not exist is the
              fastest way to lose the person who clicks it. */}
          <div className="mt-10 rounded-2xl border border-line bg-paper p-7">
            <h3 className="font-display text-lg font-bold text-navy">
              Kelas ini belum dibuka
            </h3>
            <p className="mt-3 leading-relaxed text-text-muted">
              Kami sedang menyiapkan kandungan. Daftar minat dan awak akan tahu
              dahulu bila tarikh dan harga diumumkan — tiada bayaran sekarang.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonAnchor
                href={enquiry}
                target="_blank"
                rel="noopener noreferrer"
                variant="brand"
              >
                Daftar minat
              </ButtonAnchor>
              <ButtonLink href="/belajar" variant="outline">
                Lihat kursus lain
              </ButtonLink>
            </div>
          </div>

          <div className="mt-8">
            <RiskNote>{site.riskLine}</RiskNote>
          </div>
        </div>
      </Section>
    </>
  );
}
