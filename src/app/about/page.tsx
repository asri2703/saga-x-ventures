import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Image from "next/image";
import { site, waLink } from "@/lib/site";
import {
  ButtonAnchor,
  ButtonLink,
  Card,
  Container,
  Eyebrow,
  Section,
  SectionHeading,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "About",
  description:
    "Sagax Ventures is a Malaysian marketing and development agency for SMEs — websites, ads, SEO, and custom systems handled by one accountable team.",
  alternates: { canonical: "/about" },
};

const principles = [
  {
    title: "Enquiries over impressions",
    body: "Reach, impressions, and engagement are inputs, not results. If a month of work did not move enquiries, we will say so rather than dress up the numbers.",
  },
  {
    title: "You own everything",
    body: "Your domain, hosting, ad accounts, analytics, and source code are registered in your name. Agencies that hold these hostage are relying on friction instead of results.",
  },
  {
    title: "Say the uncomfortable thing",
    body: "If your budget is too small for the channel, if a service will not work for your business, or if you should spend less — you will hear it. Losing a sale beats taking money for work that fails.",
  },
  {
    title: "No lock-in",
    body: "We work month to month. Staying should be your choice every month, which puts the pressure where it belongs: on us to keep producing.",
  },
];

const capabilities = [
  "Websites and landing pages",
  "Google Ads and Search campaigns",
  "Meta, Instagram and TikTok advertising",
  "SEO and local search",
  "Custom CRMs and internal systems",
  "Analytics and conversion tracking",
];

export default function AboutPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-line/60">
        <div aria-hidden className="bg-grid bg-grid-fade absolute inset-0" />
        <div
          aria-hidden
          className="animate-drift-a absolute left-1/2 top-0 h-80 w-[680px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/18 blur-[100px]"
        />
        <Container className="relative py-20 sm:py-28">
          <div className="max-w-3xl">
            <Eyebrow>About us</Eyebrow>
            <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-body sm:text-5xl">
              A marketing agency that can also build the thing
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted">
              {site.name} is a Malaysian agency working with small and medium
              businesses. We build websites and internal systems, and we run the
              advertising and SEO that bring people to them — which means when
              something underperforms, one team owns the whole chain.
            </p>
          </div>
        </Container>
      </section>

      {/* Founder — SMEs buy from people. Putting a name and a position here
          does more for trust than another paragraph of company copy. */}
      <Section tone="surface">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <div>
            <div
              data-reveal
              className="group relative aspect-4/5 max-w-sm overflow-hidden rounded-2xl border border-line bg-elevated"
            >
              <Image
                src={site.founder.photo}
                alt={`${site.founder.name}, ${site.founder.role} of ${site.name}`}
                fill
                sizes="(min-width: 1024px) 24rem, (min-width: 640px) 50vw, 100vw"
                className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
              />
              {/* Scrim so the name stays legible whatever the photo does
                  behind it — a caption that depends on the image being dark
                  in the right place will eventually break. */}
              <div
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-2/5 bg-linear-to-t from-ink via-ink/70 to-transparent"
              />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <p className="text-xl font-semibold text-body">
                  {site.founder.name}
                </p>
                <p className="mt-1 text-sm text-accent">{site.founder.role}</p>
              </div>
            </div>
          </div>

          <div>
            <SectionHeading
              eyebrow="Who you deal with"
              title="You will be working with me, directly"
            />
            <div className="mt-6 space-y-5 leading-relaxed text-muted">
              <p>
                Most agencies put a salesperson in front of you and a junior
                behind the work. I do both parts myself. That limits how many
                clients I can take at once, and it is the reason I would rather
                do good work for a handful of businesses than average work for
                thirty.
              </p>
              <p>
                I started {site.name} after watching too many SMEs pay for
                marketing they could not evaluate — reports full of reach and
                impressions, and no way to tell whether any of it produced a
                customer. The fix is not more channels. It is tracking what
                happens, saying honestly what worked, and cutting what did not.
              </p>
              <p>
                We are early. I am not going to claim a decade of case studies I
                do not have. What I can offer is unusual access, honest
                reporting, and terms that make it easy to leave if I do not
                deliver.
              </p>
            </div>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <ButtonAnchor
                href={waLink("Hi, I'd like to talk about my business.")}
                target="_blank"
                rel="noopener noreferrer"
              >
                Have a conversation
              </ButtonAnchor>
              <ButtonLink href="/services" variant="outline">
                See our services
              </ButtonLink>
            </div>
          </div>
        </div>
      </Section>

      {/* Principles */}
      <Section>
        <SectionHeading
          eyebrow="How we operate"
          title="Four things we will not compromise on"
          lead="These are not slogans. Each one costs us something, which is how you know we mean them."
        />
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {principles.map((p, i) => (
            <div
              key={p.title}
              data-reveal
              style={{ "--reveal-delay": `${i * 100}ms` } as CSSProperties}
            >
              <Card className="h-full">
                <span className="font-mono text-xs text-faint">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-body">
                  {p.title}
                </h3>
                <p className="mt-3 leading-relaxed text-muted">{p.body}</p>
              </Card>
            </div>
          ))}
        </div>
      </Section>

      {/* Capabilities */}
      <Section tone="surface">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading
              eyebrow="Capabilities"
              title="Marketing and engineering under one roof"
              lead="The combination is the point. A campaign is only as good as the page it lands on, and a page is only as good as the tracking behind it."
            />
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:mt-4">
            {capabilities.map((c, i) => (
              <li
                key={c}
                data-reveal
                style={{ "--reveal-delay": `${i * 70}ms` } as CSSProperties}
                className="rounded-xl border border-line bg-elevated/50 px-5 py-4 text-sm text-muted transition-colors duration-300 hover:border-line-bright hover:text-body"
              >
                {c}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* CTA */}
      <section className="border-t border-line bg-ink">
        <Container className="py-20 text-center sm:py-24">
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-body sm:text-4xl">
            Start with a free audit
          </h2>
          <p className="mx-auto mt-5 max-w-xl leading-relaxed text-muted">
            No cost and no obligation. We look at what you have, and tell you
            what we would do about it.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonAnchor
              href={waLink()}
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
