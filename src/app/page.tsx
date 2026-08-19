import Link from "next/link";
import { services } from "@/lib/services";
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

/* The three things SMEs actually complain about. Naming the pain before
   pitching the service is what makes a visitor feel understood. */
const problems = [
  {
    title: "You are paying for ads you cannot measure",
    body: "Money leaves the account every month. Someone sends a report full of impressions and reach. Nobody can tell you how many customers it produced.",
  },
  {
    title: "Your website gets visitors but no enquiries",
    body: "It looks acceptable. It loads slowly on mobile, buries your phone number, and gives visitors no obvious reason to contact you today.",
  },
  {
    title: "Three vendors, three excuses",
    body: "The web developer blames the ads guy. The ads guy blames the website. You are left coordinating people who are supposed to be helping you.",
  },
];

/* Replaces the usual "trusted by" logo wall — honest facts that reduce risk. */
const trustPoints = [
  { label: "Month to month", detail: "No lock-in contracts" },
  { label: "You own everything", detail: "Accounts, code, and data" },
  { label: "Fixed-price scope", detail: "Quoted before we start" },
  { label: "Direct line to me", detail: "No junior account manager" },
];

const process = [
  {
    step: "01",
    title: "Free audit",
    body: "We look at your website, ad accounts, and search presence, then tell you plainly what is wrong and what it is costing you. No charge, no obligation, and you keep the findings even if you never hire us.",
  },
  {
    step: "02",
    title: "Plan and quote",
    body: "You get a written scope: what we will do, what it costs, and when it will be done. One price, agreed upfront. No surprise line items later.",
  },
  {
    step: "03",
    title: "Build and launch",
    body: "We do the work — site, campaigns, tracking, systems. You get progress updates you can actually understand, not jargon designed to sound busy.",
  },
  {
    step: "04",
    title: "Measure honestly",
    body: "Tracking is set up before launch, so we can attribute enquiries to their source. If something is not working, you hear it from us first.",
  },
  {
    step: "05",
    title: "Improve monthly",
    body: "Marketing is not a project you finish. Each month we review what happened, cut what failed, and put more behind what worked.",
  },
];

const homeFaqs = [
  {
    q: "How much does it cost?",
    a: "It depends on scope, so we quote per project rather than publishing packages that would not fit you. As a rough guide: SME websites typically run from RM4,000, ad management from RM1,200 a month plus your ad spend, and SEO from RM1,500 a month. You get a fixed written quote before any work starts.",
  },
  {
    q: "You look like a new agency. Why should I trust you?",
    a: "Fair question, and we would rather answer it than dodge it. We are early, and we price and structure our work accordingly: no lock-in contract, you own every account and all the code, scope and price are fixed in writing before we start, and you deal directly with the founder rather than a junior. If we do not deliver, leaving costs you nothing but the month you paid for.",
  },
  {
    q: "Do you work with my industry?",
    a: "We work with Malaysian SMEs across services, retail, F&B, clinics, and professional firms. What matters more than industry is whether your customers are findable online and whether you can handle more enquiries. If we are not a good fit, we will say so at the audit stage.",
  },
  {
    q: "Do I have to take all your services?",
    a: "No. Most clients start with one thing — usually the website or Google Ads — and add more only once it is working. Bundling everything on day one is how budgets get wasted.",
  },
  {
    q: "Do we need to meet in person?",
    a: "Not necessarily. We are based in Kuala Lumpur and can meet locally, but most work runs over WhatsApp, email, and video calls. Clients across Malaysia are welcome.",
  },
  {
    q: "How quickly can you start?",
    a: "The free audit usually comes back within two to three working days. If you go ahead, most projects begin within a week of the quote being approved.",
  },
];

export default function Home() {
  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden border-b border-line/60">
        <div aria-hidden className="bg-grid absolute inset-0" />
        <div
          aria-hidden
          className="absolute left-1/2 top-0 h-[420px] w-[820px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-accent/15 blur-[110px]"
        />
        <Container className="relative py-24 sm:py-32">
          <div className="max-w-3xl">
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-line-bright bg-elevated/70 px-4 py-1.5 text-xs font-medium text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Taking on founding clients for 2026
            </p>
            <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight text-body sm:text-6xl">
              Marketing that ends in{" "}
              <span className="text-accent">enquiries</span>, not reports
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">
              {site.name} builds the website, runs the ads, and fixes the SEO
              for Malaysian SMEs — one team, one invoice, one person you can
              actually call.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <ButtonAnchor
                href={waLink()}
                target="_blank"
                rel="noopener noreferrer"
                size="lg"
              >
                Get a free audit
              </ButtonAnchor>
              <ButtonLink href="/services" variant="outline" size="lg">
                See what we do
              </ButtonLink>
            </div>
            <p className="mt-5 text-sm text-faint">
              No cost, no obligation. We tell you what is broken — you decide
              what to do about it.
            </p>
          </div>

          {/* Risk-reversal strip. Stands in for the client logos we do not
              have yet, and arguably says more than logos would. */}
          <ul className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {trustPoints.map((point) => (
              <li key={point.label} className="bg-surface px-6 py-5">
                <p className="text-sm font-semibold text-body">{point.label}</p>
                <p className="mt-1 text-sm text-faint">{point.detail}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* ------------------------------------------------------------- Problem */}
      <Section tone="surface">
        <SectionHeading
          eyebrow="The usual situation"
          title="You are not short of marketing. You are short of answers."
          lead="Most SMEs we speak to are already spending money online. The problem is rarely effort — it is that nobody can point to what is working."
        />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {problems.map((p) => (
            <Card key={p.title}>
              <h3 className="text-lg font-semibold leading-snug text-body">
                {p.title}
              </h3>
              <p className="mt-3 leading-relaxed text-muted">{p.body}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* ------------------------------------------------------------ Services */}
      <Section id="services">
        <SectionHeading
          eyebrow="What we do"
          title="Five services. One team accountable for the result."
          lead="Take one or take all of them. Most clients start with the one thing that is costing them the most, then expand once it works."
        />
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <Link
              key={s.slug}
              href={`/services/${s.slug}`}
              className="group flex flex-col rounded-2xl border border-line bg-elevated/60 p-7 transition-colors hover:border-accent/50"
            >
              <span className="font-mono text-xs text-faint">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 text-xl font-semibold text-body transition-colors group-hover:text-accent">
                {s.name}
              </h3>
              <p className="mt-3 flex-1 leading-relaxed text-muted">
                {s.summary}
              </p>
              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
                Learn more
                <svg
                  aria-hidden
                  viewBox="0 0 16 16"
                  className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </span>
            </Link>
          ))}

          <div className="flex flex-col justify-center rounded-2xl border border-dashed border-line-bright p-7">
            <h3 className="text-lg font-semibold text-body">
              Not sure which you need?
            </h3>
            <p className="mt-3 leading-relaxed text-muted">
              That is what the free audit is for. We will tell you where your
              money is best spent first — even if that means spending less.
            </p>
            <ButtonAnchor
              href={waLink("Hi, I'm not sure which service I need. Can you audit my business?")}
              target="_blank"
              rel="noopener noreferrer"
              variant="outline"
              className="mt-6 self-start"
            >
              Ask us
            </ButtonAnchor>
          </div>
        </div>
      </Section>

      {/* ----------------------------------------------------------- Why us */}
      <Section tone="surface">
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <Eyebrow>Why one team</Eyebrow>
            <h2 className="text-3xl font-semibold leading-[1.15] tracking-tight text-body sm:text-4xl">
              Your ads and your website are the same problem
            </h2>
            <div className="mt-6 space-y-5 leading-relaxed text-muted">
              <p>
                A great campaign sending traffic to a weak page still fails. A
                beautiful website nobody can find still fails. When these are
                handled by different vendors, the gap between them is where your
                budget disappears — and nobody owns it.
              </p>
              <p>
                We handle both. So when something underperforms, there is no
                argument about whose fault it is. There is one person
                responsible, and you know their number.
              </p>
            </div>
            <ButtonLink href="/about" variant="outline" className="mt-8">
              More about how we work
            </ButtonLink>
          </div>

          <Card className="lg:mt-10">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
              What you get either way
            </p>
            <ul className="mt-6 space-y-4">
              <CheckItem>
                A written audit of your current marketing, free
              </CheckItem>
              <CheckItem>
                Honest advice on what to fix first — even if it is not us doing it
              </CheckItem>
              <CheckItem>
                Fixed pricing agreed before any work begins
              </CheckItem>
              <CheckItem>
                Full ownership of your website, accounts, and data
              </CheckItem>
              <CheckItem>
                Monthly reporting in plain English, tied to enquiries
              </CheckItem>
              <CheckItem>
                The freedom to walk away at the end of any month
              </CheckItem>
            </ul>
          </Card>
        </div>
      </Section>

      {/* ------------------------------------------------------------- Process */}
      <Section id="process">
        <SectionHeading
          eyebrow="How we work"
          title="Five steps, and you know where you stand at every one"
          lead="Agencies that hide their process are usually hiding something. Here is ours, start to finish."
        />
        <ol className="mt-14 space-y-px overflow-hidden rounded-2xl border border-line bg-line">
          {process.map((p) => (
            <li
              key={p.step}
              className="grid gap-4 bg-surface px-6 py-7 sm:grid-cols-[auto_1fr] sm:gap-8 sm:px-8"
            >
              <span className="font-mono text-sm text-accent sm:pt-1">
                {p.step}
              </span>
              <div>
                <h3 className="text-lg font-semibold text-body">{p.title}</h3>
                <p className="mt-2 max-w-3xl leading-relaxed text-muted">
                  {p.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* ------------------------------------------------- Founding client offer */}
      <Section tone="surface">
        <div className="relative overflow-hidden rounded-3xl border border-accent/25 bg-elevated p-8 sm:p-12">
          <div
            aria-hidden
            className="absolute right-0 top-0 h-64 w-64 translate-x-1/3 -translate-y-1/3 rounded-full bg-accent/15 blur-3xl"
          />
          <div className="relative max-w-2xl">
            <Eyebrow>Founding clients</Eyebrow>
            <h2 className="text-3xl font-semibold leading-[1.15] tracking-tight text-body sm:text-4xl">
              We are new. That is your advantage right now.
            </h2>
            <div className="mt-6 space-y-4 leading-relaxed text-muted">
              <p>
                We are not going to pretend to a ten-year track record we do not
                have. Here is the honest trade: for our first clients we charge
                below what this work will cost in a year, and in return we ask
                for a testimonial and permission to publish the results once we
                have them.
              </p>
              <p>
                You also get something later clients will not — our full
                attention, and a founder who genuinely cannot afford for your
                project to go badly.
              </p>
            </div>
            <ButtonAnchor
              href={waLink("Hi, I'd like to know about the founding client rate.")}
              target="_blank"
              rel="noopener noreferrer"
              size="lg"
              className="mt-8"
            >
              Ask about founding client rates
            </ButtonAnchor>
          </div>
        </div>
      </Section>

      {/* ----------------------------------------------------------------- FAQ */}
      <Section>
        <SectionHeading
          eyebrow="Questions"
          title="The things people ask before they call"
        />
        <div className="mt-12">
          <Faq items={homeFaqs} />
        </div>
      </Section>

      {/* ------------------------------------------------------------ Final CTA */}
      <section className="relative overflow-hidden border-t border-line bg-surface">
        <div
          aria-hidden
          className="absolute left-1/2 top-full h-[380px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/15 blur-[110px]"
        />
        <Container className="relative py-24 text-center sm:py-32">
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold leading-[1.15] tracking-tight text-body sm:text-5xl">
            Find out what your marketing is actually doing
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted">
            A free audit of your website, ads, and search presence. You get a
            written summary of what is working, what is wasting money, and what
            to fix first — whether or not you hire us.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonAnchor
              href={waLink()}
              target="_blank"
              rel="noopener noreferrer"
              size="lg"
            >
              WhatsApp us now
            </ButtonAnchor>
            <ButtonLink href="/contact" variant="outline" size="lg">
              Send an enquiry
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  );
}
