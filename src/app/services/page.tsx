import type { Metadata } from "next";
import Link from "next/link";
import { services } from "@/lib/services";
import { waLink } from "@/lib/site";
import {
  ButtonAnchor,
  Container,
  Section,
  SectionHeading,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Website development, Google Ads, social media ads, SEO, and custom systems for Malaysian SMEs — handled by one team.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-line/60">
        <div aria-hidden className="bg-grid absolute inset-0" />
        <Container className="relative py-20 sm:py-28">
          <div className="max-w-3xl">
            <p className="mb-4 flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              <span aria-hidden className="h-px w-6 bg-accent/60" />
              Services
            </p>
            <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-body sm:text-5xl">
              Everything that stands between you and more enquiries
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted">
              Five services that work better together than apart. Start with
              one. Add more only when the first is producing.
            </p>
          </div>
        </Container>
      </section>

      <Section tone="surface">
        <div className="space-y-6">
          {services.map((s, i) => (
            <Link
              key={s.slug}
              href={`/services/${s.slug}`}
              className="group grid gap-6 rounded-2xl border border-line bg-elevated/60 p-7 transition-colors hover:border-accent/50 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-8 sm:p-9"
            >
              <span className="font-mono text-sm text-faint">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h2 className="text-xl font-semibold text-body transition-colors group-hover:text-accent sm:text-2xl">
                  {s.name}
                </h2>
                <p className="mt-2 max-w-2xl leading-relaxed text-muted">
                  {s.summary}
                </p>
              </div>
              <svg
                aria-hidden
                viewBox="0 0 16 16"
                className="hidden h-5 w-5 text-accent transition-transform group-hover:translate-x-1 sm:block"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </Link>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeading
          align="center"
          title="Still not sure where to start?"
          lead="Tell us what your business does and what you have tried. We will tell you honestly which of these would move the needle first."
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
