import type { ReactNode } from "react";
import Link from "next/link";
import { outbound, type OutboundKey, type Product } from "@/lib/products";
import { Container, Section } from "@/components/ui";
import { CheckoutOpener } from "@/components/checkout-opener";
import {
  ActionOut,
  Eyebrow,
  Panel,
  Scallop,
} from "@/components/shell";

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
  /**
   * This step opens the checkout rather than linking anywhere.
   *
   * It is not an outbound key because nothing leaves the site: the dialog
   * opens over the page. `stepIsReady` stays false for it, so the step is
   * neither a link nor the dashed placeholder that says a link is coming.
   */
  opensCheckout?: true;
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

/**
 * The steps, numbered.
 *
 * A numbered marker is only information when the content is actually a
 * sequence. This one is: the account has to exist before it can be funded,
 * and funded before anything is joined. Doing them out of order fails.
 */
function Steps({
  steps,
  checkout,
}: {
  steps: GuideStep[];
  checkout: boolean;
}) {
  return (
    <ol className="mt-10 space-y-5">
      {steps.map((step) => (
        <li key={step.n}>
          <Panel className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex max-w-xl gap-5">
              <span
                aria-hidden
                className="display tnum flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage text-lg text-pine"
              >
                {step.n}
              </span>
              <div>
                <h3 className="display text-xl text-pine">{step.title}</h3>
                <p className="mt-3 leading-relaxed text-pine-soft">
                  {step.body}
                </p>
              </div>
            </div>

            {step.opensCheckout && checkout && step.cta ? (
              <CheckoutOpener
                label={step.cta}
                className="shrink-0 self-start"
              />
            ) : stepIsReady(step) ? (
              <Link
                href={`/go/${step.outbound}`}
                prefetch={false}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center justify-center self-start rounded-full border border-pine px-6 py-3 text-base font-semibold text-pine transition-colors hover:bg-pine hover:text-paper"
              >
                {step.cta}
              </Link>
            ) : step.opensCheckout && !checkout && step.cta ? (
              /* The checkout is off, so there is no dialog to open — but
                 this step is the only way to pay on this route, and a step
                 with no action at all is the dead end §7.12 forbids. The
                 arrangement it replaces was "message me", which still
                 works. */
              <a
                href="/go/whatsapp?m=mastery"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center justify-center self-start rounded-full border border-pine px-6 py-3 text-base font-semibold text-pine transition-colors hover:bg-pine hover:text-paper"
              >
                Message me to arrange it
              </a>
            ) : step.cta && !step.opensCheckout ? (
              <p className="shrink-0 self-start rounded-full border border-dashed border-rule-strong px-6 py-3 text-sm text-pine-faint">
                {step.cta} — link coming
              </p>
            ) : null}
          </Panel>
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
  checkout = false,
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
  /**
   * Whether a step marked `opensCheckout` may actually open it.
   *
   * Decided on the server by the page that renders this guide, because the
   * gate reads credentials. False, such a step renders its title and body
   * and no action at all — which is better than a button that cannot work.
   */
  checkout?: boolean;
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
                className="panel panel-link p-7 sm:p-8"
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
              <Eyebrow>
                {route.key === "deposit" ? "Route one" : "Route two"}
              </Eyebrow>
              <h2 className="display mt-3 text-2xl text-pine sm:text-3xl">
                {route.label}
              </h2>
              <p className="mt-3 leading-relaxed text-pine-soft">
                {route.summary}
              </p>
            </div>
            <div className="max-w-3xl">
              <Steps steps={route.steps} checkout={checkout} />
            </div>
          </Container>
        </Section>
      ))}

      <Scallop />
      <Section tone="pine" pad="pt-10 pb-16 sm:pb-24">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="display text-2xl text-paper sm:text-3xl">
              Not sure which route fits what you have to work with?
            </h2>
            <p className="mt-5 leading-relaxed text-paper/80">
              Ask me before you pay or deposit anything.
            </p>
            <div className="mt-9">
              <ActionOut href="/go/whatsapp?m=contact">
                Ask about {product.name}
              </ActionOut>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
