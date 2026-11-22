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

  return (
    <>
      <Section>
        <Container>
          <div className="max-w-2xl">
            <h1 className="display text-4xl leading-[1.1] text-pine sm:text-5xl">
              One to one, not a class of thirty
            </h1>
            <p className="mt-7 text-lg leading-relaxed text-pine-soft">
              Three classes. Take them in order or take one on its own. Each
              runs about a day, just the two of us. Some things land in an
              hour. Some take the whole afternoon.
            </p>
          </div>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------
          Qualifying before selling. A page that filters costs an enquiry
          and saves a refund, and one-to-one days are too scarce to spend
          on someone who wanted something else.
      --------------------------------------------------------------- */}
      <Section>
        <Container>
          <div className="grid gap-10 border-y border-rule py-10 md:grid-cols-2 md:gap-16">
            <div>
              <h2 className="display text-xl text-pine">
                Take this if you want to trade yourself
              </h2>
              <p className="mt-3 leading-relaxed text-pine-soft">
                You want to place your own trades and understand what you are
                looking at while you do it. That is what these days are for.
              </p>
            </div>
            <div>
              <h2 className="display text-xl text-pine">
                Do not take it if you want it handled
              </h2>
              <p className="mt-3 leading-relaxed text-pine-soft">
                If you want the market traded for you, this is the wrong
                spend.{" "}
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
                {fukyaa?.requirement ? ` ${fukyaa.requirement}.` : ""}
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* The ladder. */}
      <Section>
        <Container>
          <h2 className="display text-3xl text-pine sm:text-4xl">
            The three classes
          </h2>
          <p className="mt-4 max-w-xl leading-relaxed text-pine-soft">
            Each one assumes the one before it. Most people should start at
            the top, including the ones who think they are past it.
          </p>

          <div className="mt-12">
            {coachingClasses.map((klass) => (
              <article
                key={klass.slug}
                className="border-b border-rule py-10 first:border-t"
              >
                <div className="flex flex-col gap-6 md:flex-row md:justify-between">
                  <div className="max-w-xl">
                    <p className="tnum text-sm text-pine-faint">
                      {klass.order} of {coachingClasses.length}
                    </p>
                    <h3 className="display mt-1 text-2xl text-pine">
                      {klass.name}
                    </h3>
                    <p className="mt-3 leading-relaxed text-pine-soft">
                      {klass.summary}
                    </p>
                  </div>

                  <dl className="shrink-0 md:w-56">
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
                </div>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      {/* Modes explained. */}
      <Section>
        <Container>
          <div className="grid gap-10 md:grid-cols-2 md:gap-16">
            {modes.map((mode) => (
              <div key={mode.key}>
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
      <Section>
        <Container>
          <div className="border border-rule bg-paper-raised p-8 sm:p-12">
            <h2 className="display text-2xl text-pine sm:text-3xl">
              Tell me where you are
            </h2>
            <p className="mt-4 max-w-xl leading-relaxed text-pine-soft">
              Message me with what you have traded so far and which class you
              think you need. We fix the dates first. The payment link comes
              after that, not before.
            </p>

            <a
              href="/go/whatsapp?m=coaching"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-block bg-ruby px-5 py-3 text-base font-bold text-white transition-colors hover:bg-ruby-deep"
            >
              Ask about coaching
            </a>

            <p className="mt-6 text-sm text-pine-faint">
              Or email{" "}
              <a
                href={`mailto:${site.email}`}
                className="text-pine underline decoration-ruby decoration-2 underline-offset-2"
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
