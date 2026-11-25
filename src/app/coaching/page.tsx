import type { Metadata } from "next";
import Link from "next/link";
import {
  coachingClasses,
  formatPrice,
  getPrice,
  type CoachingMode,
} from "@/lib/coaching";
import { getProduct } from "@/lib/products";
import { site } from "@/lib/site";
import { Container, Section } from "@/components/ui";
import { ActionOut, Panel, Scallop } from "@/components/shell";

export const metadata: Metadata = {
  alternates: { canonical: "/coaching" },
  title: "Coaching",
  description:
    "One-to-one trading coaching with Asri Zulzali. Three classes — basic, advanced and news trading — online or in person.",
};

const modes: { key: CoachingMode; label: string; note: string }[] = [
  {
    key: "online",
    label: "Online",
    note: "Screen to screen. Same class, same hours, no travel for either of us.",
  },
  {
    key: "onsite",
    label: "In person",
    note: "Two days and a night, face to face. The price is all in. My transport, hotel and meals are already inside it, wherever you are.",
  },
];

export default function CoachingPage() {
  const fukyaa = getProduct("fukyaa");
  const requirement = fukyaa?.requirement() ?? null;

  return (
    <>
      <Section pad="pt-16 pb-12 sm:pt-24">
        <Container>
          <div className="max-w-2xl">
            <h1 className="display text-4xl text-pine sm:text-5xl">
              One to one, not a class of thirty
            </h1>
            <p className="mt-7 text-lg leading-relaxed text-pine-soft">
              Three classes, about a day each, just the two of us. Take
              them in order or take one on its own.
            </p>
          </div>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------
          Qualifying before selling. A page that filters costs an enquiry
          and saves a refund, and one-to-one days are too scarce to spend
          on someone who wanted something else.
      --------------------------------------------------------------- */}
      <Section pad="py-12">
        <Container>
          <div className="grid gap-6 md:grid-cols-2">
            <Panel>
              <h2 className="display text-xl text-pine">
                Take this if you want to trade yourself
              </h2>
              <p className="mt-3 leading-relaxed text-pine-soft">
                You want to place your own trades, and understand what you
                are looking at while you do it.
              </p>
            </Panel>
            <Panel>
              <h2 className="display text-xl text-pine">
                Do not take it if you want it handled
              </h2>
              <p className="mt-3 leading-relaxed text-pine-soft">
                If you want the market traded for you, this is the wrong spend.{" "}
                {fukyaa ? (
                  <Link
                    href={fukyaa.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pine underline decoration-ruby decoration-2 underline-offset-4"
                  >
                    Fukyaa does that instead
                  </Link>
                ) : null}
                , and it asks for a funded account rather than a class fee.
                {requirement ? ` ${requirement}.` : ""}
              </p>
            </Panel>
          </div>
        </Container>
      </Section>

      {/* The ladder. */}
      <Section tone="raised">
        <Container>
          <h2 className="display text-3xl text-pine sm:text-4xl">
            The three classes
          </h2>
          <p className="mt-4 max-w-xl leading-relaxed text-pine-soft">
            Each one assumes the one before it. Most people should start
            at the top.
          </p>

          {/* Numbered, because this is a real sequence: each class assumes
              the one before it. The order is the product. */}
          <ol className="mt-12 space-y-5">
            {coachingClasses.map((klass) => (
              <li key={klass.slug}>
                <Panel className="flex flex-col gap-8 md:flex-row md:justify-between">
                  <div className="flex max-w-xl gap-5">
                    <span
                      aria-hidden
                      className="display tnum flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage text-lg text-pine"
                    >
                      {klass.order}
                    </span>
                    <div>
                      <h3 className="display text-2xl text-pine">
                        {klass.name}
                      </h3>
                      <p className="mt-3 leading-relaxed text-pine-soft">
                        {klass.summary}
                      </p>
                    </div>
                  </div>

                  <dl className="shrink-0 rounded-[var(--radius-float)] bg-paper p-5 md:w-56">
                    {modes.map((mode) => (
                      <div
                        key={mode.key}
                        className="flex items-baseline justify-between border-b border-rule py-2 last:border-b-0"
                      >
                        <dt className="text-sm text-pine-soft">{mode.label}</dt>
                        <dd className="tnum font-semibold text-pine">
                          {formatPrice(getPrice(klass.slug, mode.key))}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </Panel>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      {/* Modes explained. */}
      <Section>
        <Container>
          <div className="grid max-w-4xl gap-10 md:grid-cols-2 md:gap-16">
            {modes.map((mode) => (
              <div key={mode.key}>
                {/* No eyebrow. The same label above both halves of a pair
                    is repetition, not a category. */}
                <h2 className="display text-xl text-pine">{mode.label}</h2>
                <p className="mt-3 leading-relaxed text-pine-soft">
                  {mode.note}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------
          Booking. Dates are agreed before money moves — two people cannot
          hold the same day, and a checkout that sells a slot we have not
          agreed on creates a refund, not a sale.
      --------------------------------------------------------------- */}
      <Scallop />
      <Section tone="pine" pad="pt-10 pb-16 sm:pb-24">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="display text-2xl text-paper sm:text-3xl">
              Tell me where you are
            </h2>
            <p className="mx-auto mt-5 max-w-xl leading-relaxed text-paper/80">
              Tell me what you have traded and which class you need. We
              fix the dates first. The payment link comes
              after that, not before.
            </p>

            <div className="mt-9">
              <ActionOut href="/go/whatsapp?m=coaching">
                Ask about coaching
              </ActionOut>
            </div>

            <p className="mt-7 text-sm text-paper/70">
              Or email{" "}
              <a
                href={`mailto:${site.email}`}
                className="text-paper underline decoration-ruby decoration-2 underline-offset-2"
              >
                {site.email}
              </a>
              .
            </p>
          </div>
        </Container>
      </Section>
    </>
  );
}
