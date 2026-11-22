import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { features, joinSteps } from "@/lib/mastery-signal";
import { getProduct } from "@/lib/products";
import { site } from "@/lib/site";
import { Container, Section } from "@/components/ui";
import { FeatureSlider } from "@/components/feature-slider";

/**
 * Mastery Signal.
 *
 * Not a second sales page. masterysignal.com sells the product; this one
 * explains the order you have to do things in and hands over the links.
 * Different search intent, different content, no competing with our own site
 * for the same terms.
 */

export const metadata: Metadata = {
  alternates: { canonical: "/mastery-signal" },
  title: "Mastery Signal",
  description:
    "How to join Mastery Signal: open a broker account, fund it, take out membership. The order matters, and this is why.",
};

export default function MasterySignalPage() {
  const product = getProduct("mastery-signal")!;

  return (
    <>
      <Section>
        <Container>
          <div className="max-w-2xl">
            <Image
              src="/mastery-signal-logo.webp"
              alt="Mastery Signal"
              width={297}
              height={186}
              className="h-16 w-auto"
              priority
            />

            <h1 className="display mt-8 text-4xl leading-[1.1] text-pine sm:text-5xl">
              What I am looking at, and why
            </h1>

            <div className="mt-7 space-y-5 text-lg leading-relaxed text-pine-soft">
              <p>
                Mastery Signal is the desk I built after one question kept
                coming back: what are you looking at right now. An entry price
                on its own does not answer it. You copy a number, it works or
                it does not, and you are no better at this afterwards.
              </p>
              <p>
                So every call carries the level it is built on and why that
                level is there. Members who read that part start calling the
                same levels themselves. That is the point of writing it.
              </p>
              <p>
                It serves{" "}
                <span className="display text-pine">
                  {site.founder.tradersGuided.toLocaleString("en-MY")}+
                </span>{" "}
                traders across Malaysia and Indonesia over the years this desk
                has run.
              </p>
            </div>

            <Link
              href="#join"
              className="mt-9 inline-block border border-pine px-5 py-3 text-base font-semibold text-pine transition-colors hover:bg-pine hover:text-paper"
            >
              How to join
            </Link>
          </div>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------
          Features. Cards are dragged, so this row is the page's only
          client-side JavaScript.
      --------------------------------------------------------------- */}
      <Section tone="raised">
        <Container>
          <div className="max-w-2xl">
            <h2 className="display text-3xl text-pine sm:text-4xl">
              What you actually get
            </h2>
            <p className="mt-4 leading-relaxed text-pine-soft">
              Drag the row, or use the arrows.
            </p>
          </div>
        </Container>

        {/* Full-bleed: the row runs past the gutter on purpose, so it reads
            as something to pull rather than a boxed carousel. */}
        <div className="mt-12">
          <FeatureSlider features={features} />
        </div>
      </Section>

      {/* ---------------------------------------------------------------
          The guide. This is why the page exists.
      --------------------------------------------------------------- */}
      <Section id="join">
        <Container>
          <div className="max-w-2xl">
            <h2 className="display text-3xl text-pine sm:text-4xl">
              Joining, in order
            </h2>
            <p className="mt-4 leading-relaxed text-pine-soft">
              Four steps, and the order matters. Membership does nothing
               until there is a funded account behind it. That is the step
               people skip, and then nothing works and they cannot see why.
            </p>

            {product.requirement ? (
              <p className="mt-6 border-l-2 border-pine pl-3 text-sm font-semibold text-pine">
                {product.requirement}
              </p>
            ) : null}
          </div>

          <ol className="mt-12 max-w-3xl">
            {joinSteps.map((step) => (
              <li
                key={step.n}
                className="border-b border-rule py-8 first:border-t"
              >
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                  <div className="max-w-xl">
                    <p className="tnum text-sm text-pine-faint">
                      Step {step.n}
                    </p>
                    <h3 className="display mt-1 text-xl text-pine">
                      {step.title}
                    </h3>
                    <p className="mt-3 leading-relaxed text-pine-soft">
                      {step.body}
                    </p>
                  </div>

                  {step.outbound && step.cta ? (
                    <Link
                      href={`/go/${step.outbound}`}
                      prefetch={false}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 self-start border border-pine px-5 py-3 text-base font-semibold text-pine transition-colors hover:bg-pine hover:text-paper"
                    >
                      {step.cta}
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-14 max-w-2xl">
            <p className="leading-relaxed text-pine-soft">
              Stuck on a step, or not sure which package fits what you have
              to trade with? Ask me before you pay.
            </p>
            <a
              href="/go/whatsapp?m=contact"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-block bg-ruby px-5 py-3 text-base font-bold text-white transition-colors hover:bg-ruby-deep"
            >
              Ask before you join
            </a>
          </div>
        </Container>
      </Section>

      <Section tone="raised">
        <Container>
          <p className="max-w-2xl text-sm leading-relaxed text-pine-faint">
            Signals are education, not financial advice, and they are not a
            recommendation to buy or sell anything. Trading carries real risk
            of losing real money, and no result is promised or implied.
          </p>
        </Container>
      </Section>
    </>
  );
}
