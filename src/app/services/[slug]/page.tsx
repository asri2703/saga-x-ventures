import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getService, services } from "@/lib/services";
import { site, waLink } from "@/lib/site";
import { Faq } from "@/components/faq";
import {
  ButtonAnchor,
  ButtonLink,
  Card,
  CheckItem,
  Container,
  Eyebrow,
  Section,
  SectionHeading,
} from "@/components/ui";

/** Pre-renders all five service pages at build time — instant loads, fully indexable. */
export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/services/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) return {};

  return {
    title: `${service.name} for Malaysian SMEs`,
    description: service.summary,
    alternates: { canonical: `/services/${service.slug}` },
    openGraph: {
      title: `${service.name} | ${site.name}`,
      description: service.summary,
      url: `${site.url}/services/${service.slug}`,
    },
  };
}

export default async function ServicePage({
  params,
}: PageProps<"/services/[slug]">) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  const others = services.filter((s) => s.slug !== service.slug);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line/60">
        <div aria-hidden className="bg-grid absolute inset-0" />
        <div
          aria-hidden
          className="absolute left-1/2 top-0 h-80 w-[680px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/12 blur-[100px]"
        />
        <Container className="relative py-20 sm:py-28">
          {/* Breadcrumb — helps users and gives Google the page hierarchy. */}
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
                  href="/services"
                  className="transition-colors hover:text-accent"
                >
                  Services
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li className="text-muted">{service.name}</li>
            </ol>
          </nav>

          <div className="max-w-3xl">
            <Eyebrow>{service.name}</Eyebrow>
            <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-body sm:text-5xl">
              {service.headline}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted">
              {service.intro}
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <ButtonAnchor
                href={waLink(
                  `Hi, I'm interested in ${service.name} for my business.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                size="lg"
              >
                Get a free audit
              </ButtonAnchor>
              <ButtonLink href="/contact" variant="outline" size="lg">
                Request a quote
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      {/* Pain + deliverables side by side */}
      <Section tone="surface">
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <SectionHeading
              eyebrow="Sound familiar?"
              title="The problems this solves"
            />
            <ul className="mt-8 space-y-4">
              {service.pain.map((p) => (
                <li
                  key={p}
                  className="flex gap-3 rounded-xl border border-line bg-elevated/50 px-5 py-4 leading-relaxed text-muted"
                >
                  <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <Card className="lg:mt-4">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
              What is included
            </p>
            <ul className="mt-6 space-y-4">
              {service.includes.map((item) => (
                <CheckItem key={item}>{item}</CheckItem>
              ))}
            </ul>
          </Card>
        </div>
      </Section>

      {/* Honest fit statement */}
      <Section>
        <div className="rounded-2xl border border-line bg-elevated/50 p-8 sm:p-10">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
            Who this is for
          </h2>
          <p className="mt-4 max-w-3xl text-xl leading-relaxed text-body">
            {service.bestFor}
          </p>
          <p className="mt-4 max-w-3xl leading-relaxed text-muted">
            If that is not you, say so at the audit stage and we will point you
            somewhere more useful. Taking on work that will not succeed helps
            neither of us.
          </p>
        </div>
      </Section>

      {/* FAQ */}
      <Section tone="surface">
        <SectionHeading
          eyebrow="Questions"
          title={`${service.name}, answered honestly`}
        />
        <div className="mt-12">
          <Faq items={service.faqs} />
        </div>
      </Section>

      {/* Cross-links to the other services — keeps visitors moving and spreads
          internal link equity across every service page. */}
      <Section>
        <SectionHeading eyebrow="Also from us" title="Other services" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {others.map((s) => (
            <Link
              key={s.slug}
              href={`/services/${s.slug}`}
              className="group rounded-xl border border-line bg-elevated/50 px-6 py-5 transition-colors hover:border-accent/50"
            >
              <h3 className="font-semibold text-body transition-colors group-hover:text-accent">
                {s.name}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                {s.summary}
              </p>
            </Link>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <section className="border-t border-line bg-surface">
        <Container className="py-20 text-center sm:py-24">
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-body sm:text-4xl">
            Want to know if {service.name.toLowerCase()} is worth it for you?
          </h2>
          <p className="mx-auto mt-5 max-w-xl leading-relaxed text-muted">
            We will audit what you have now and tell you straight — including if
            the answer is no.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonAnchor
              href={waLink(`Hi, I'd like a free audit for ${service.name}.`)}
              target="_blank"
              rel="noopener noreferrer"
              size="lg"
            >
              WhatsApp us
            </ButtonAnchor>
            <ButtonLink href="/contact" variant="outline" size="lg">
              Request a quote
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  );
}
