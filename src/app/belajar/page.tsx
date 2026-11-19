import type { Metadata } from "next";
import Link from "next/link";
import { courses, products } from "@/lib/products";
import { site } from "@/lib/site";
import {
  ButtonLink,
  Container,
  RiskNote,
  Section,
  SectionHeading,
} from "@/components/ui";

const signal = products.find((p) => p.slug === "signal")!;

export const metadata: Metadata = {
  title: "Belajar trade sendiri",
  description:
    "Tiga kursus yang membawa awak dari sifar ke satu sistem yang boleh diulang: Asas Trading, Trade The News, dan Trading Strategy.",
};

export default function BelajarPage() {
  return (
    <>
      <section className="border-b border-line">
        <Container className="py-20 sm:py-28">
          <h1 className="max-w-3xl font-display text-4xl font-extrabold leading-[1.05] sm:text-6xl">
            Belajar trade sendiri
          </h1>
          <p className="mt-6 max-w-xl text-xl leading-relaxed text-text-muted">
            Awak yang baca pasaran dan awak yang tekan butang. Tiga kursus,
            disusun ikut keadaan awak sekarang — bukan ikut apa yang paling
            mahal.
          </p>
        </Container>
      </section>

      <Section tone="base">
        <SectionHeading
          title="Tiga kursus"
          lead="Setiap satu dinyatakan dengan apa yang awak boleh buat selepas habis, bukan senarai topik yang dilalui."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {courses.map((c) => (
            <article
              key={c.slug}
              className="flex flex-col rounded-2xl bg-panel ring-1 ring-line p-7"
            >
              <p className="text-sm font-semibold text-text-faint">{c.level}</p>
              <h3 className="mt-2 font-display text-xl font-bold text-text">
                {c.name}
              </h3>
              <p className="mt-4 flex-1 leading-relaxed text-text-muted">
                {c.summary}
              </p>
              <Link
                href={`/belajar/${c.slug}`}
                className="mt-6 font-semibold text-text underline underline-offset-4"
              >
                Selengkapnya
              </Link>
            </article>
          ))}
        </div>
        <div className="mt-10 max-w-2xl">
          <RiskNote>{site.riskLine}</RiskNote>
        </div>
      </Section>

      <Section tone="panel">
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl font-bold text-text">
            Dan selepas kursus?
          </h2>
          <p className="mt-5 leading-relaxed text-text-muted">
            {signal.summary} Ramai orang guna {signal.brand} selepas habis Asas
            Trading, sebagai sumber idea sambil mereka membina keyakinan sendiri.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <ButtonLink href="/signal" variant="primary">
              Lihat {signal.label}
            </ButtonLink>
            <ButtonLink href="/mula" variant="outline">
              Tak pasti? Jawab tiga soalan
            </ButtonLink>
          </div>
        </div>
      </Section>
    </>
  );
}
