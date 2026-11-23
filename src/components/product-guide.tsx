import type { ReactNode } from "react";
import Link from "next/link";
import { outbound, type OutboundKey, type Product } from "@/lib/products";
import { Container, Section } from "@/components/ui";

/**
 * The shape every product page shares.
 *
 * Each product has two ways in — deposit to a trading account, or pay
 * directly — and the page asks which before it explains anything. The owner
 * asked for that fork, and it filters well: people know which of the two
 * they are without being told.
 */

export type GuideStep = {
  n: number;
  title: string;
  body: string;
  /** The outbound key this step hands over to, if it leaves the site. */
  outbound: OutboundKey | null;
  cta: string | null;
};

export type PaymentRoute = {
  key: "deposit" | "direct";
  label: string;
  /** One line a visitor can sort themselves with. */
  summary: string;
  steps: GuideStep[];
};

/**
 * A step links out only when it has somewhere to go.
 *
 * `copytrade-join` is declared empty until the owner sets it up. Rendering a
 * link to "" produces a link to the current page — it looks like it worked
 * and did not, which is worse than showing nothing.
 */
export function stepIsReady(step: GuideStep): boolean {
  if (!step.outbound || !step.cta) return false;
  return outbound[step.outbound] !== "";
}

function Steps({ steps }: { steps: GuideStep[] }) {
  return (
    <ol className="mt-8">
      {steps.map((step) => (
        <li key={step.n} className="border-b border-rule py-7 first:border-t">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-xl">
              <p className="tnum text-sm text-pine-faint">Step {step.n}</p>
              <h3 className="display mt-1 text-xl text-pine">{step.title}</h3>
              <p className="mt-3 leading-relaxed text-pine-soft">{step.body}</p>
            </div>

            {stepIsReady(step) ? (
              <Link
                href={`/go/${step.outbound}`}
                prefetch={false}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 self-start border border-pine px-5 py-3 text-base font-semibold text-pine transition-colors hover:bg-pine hover:text-paper"
              >
                {step.cta}
              </Link>
            ) : step.cta ? (
              <p className="shrink-0 self-start border border-dashed border-rule-strong px-5 py-3 text-sm text-pine-faint">
                {step.cta} — link coming
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function ProductGuide({
  product,
  routes,
  intro,
  afterIntro,
}: {
  product: Product;
  routes: PaymentRoute[];
  intro: ReactNode;
  /**
   * The page's own sections, rendered between the introduction and the fork.
   *
   * Without this slot the guide owned the end of the page, so anything a page
   * added landed after the closing ask — including Copytrade's fee terms,
   * which a visitor has to read before being walked through joining.
   */
  afterIntro?: ReactNode;
}) {
  return (
    <>
      <Section>
        <Container>
          <div className="max-w-2xl">{intro}</div>
        </Container>
      </Section>

      {afterIntro}

      <Section tone="raised">
        <Container>
          <div className="max-w-2xl" data-reveal>
            <h2 className="display text-3xl text-pine sm:text-4xl">
              Two ways in
            </h2>
            <p className="mt-4 leading-relaxed text-pine-soft">
              Both are written out below. Pick the one that sounds like you and
              read that set of steps.
            </p>
          </div>

          {/* Links, not cards. A visitor told to pick one was clicking a div
              and nothing happened, with both sets of steps already further
              down the page. */}
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {routes.map((route) => (
              <Link
                key={route.key}
                href={`#${route.key}`}
                data-reveal
                className="group border border-rule bg-paper p-7 transition-colors hover:border-pine"
              >
                <h3 className="display text-xl text-pine underline decoration-ruby decoration-2 underline-offset-4">
                  {route.label}
                </h3>
                <p className="mt-3 leading-relaxed text-pine-soft">
                  {route.summary}
                </p>
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      {routes.map((route) => (
        <Section key={route.key} id={route.key}>
          <Container>
            <div className="max-w-2xl" data-reveal>
              <h2 className="display text-2xl text-pine sm:text-3xl">
                {route.label}
              </h2>
              <p className="mt-3 leading-relaxed text-pine-soft">
                {route.summary}
              </p>
            </div>
            <div className="max-w-3xl">
              <Steps steps={route.steps} />
            </div>
          </Container>
        </Section>
      ))}

      <Section tone="raised">
        <Container>
          <div className="max-w-2xl">
            <p className="leading-relaxed text-pine-soft">
              Not sure which route fits what you have to work with? Ask me
              before you pay or deposit anything.
            </p>
            <a
              href="/go/whatsapp?m=contact"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-block bg-ruby px-5 py-3 text-base font-bold text-white transition-colors hover:bg-ruby-deep"
            >
              Ask about {product.name}
            </a>
          </div>
        </Container>
      </Section>
    </>
  );
}
