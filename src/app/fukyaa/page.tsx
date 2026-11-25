import type { Metadata } from "next";
import { fukyaaPlans, formatMyr, formatUsd } from "@/lib/commercial";
import { fukyaaRoutes } from "@/lib/fukyaa";
import { getProduct } from "@/lib/products";
import { Container, Section } from "@/components/ui";
import { ProductGuide } from "@/components/product-guide";
import { Eyebrow, Panel, TextLink } from "@/components/shell";

export const metadata: Metadata = {
  alternates: { canonical: "/fukyaa" },
  title: "Fukyaa AI Auto Trade",
  description:
    "An expert advisor places the trades. Fund a cent account and the server is included, or bring your own broker and rent it monthly.",
};

export default function FukyaaPage() {
  const product = getProduct("fukyaa")!;
  /* The two automated packages, from the same declaration the homepage
     prices. Copytrade is the third of them and is deliberately not here: it
     is a different product with its own page, and listing it as a way of
     running Fukyaa would be the first thing a reader got wrong. */
  const packages = fukyaaPlans.filter((plan) => plan.automated);

  /* What it costs. Before the steps, not after the closing ask. */
  const costs = (
    <Section tone="raised">
      <Container>
        <div className="max-w-2xl" data-reveal>
          <h2 className="display text-3xl text-pine sm:text-4xl">
            What it costs
          </h2>
          <p className="mt-4 leading-relaxed text-pine-soft">
            Which is cheaper depends on whether you were funding a trading
            account anyway. Either way the deposit stays in your own account; it is not a payment to me.
          </p>
        </div>

        <div className="mt-10 grid max-w-3xl gap-6 md:grid-cols-2">
          {packages.map((plan) => (
            <Panel key={plan.key} className="flex flex-col" data-reveal>
              <Eyebrow tone="quiet">{plan.name}</Eyebrow>
              <p className="display mt-3 text-3xl text-pine">
                <span className="tnum">{formatUsd(plan.depositUsd)}</span>{" "}
                deposit
              </p>
              <p className="mt-3 flex-1 leading-relaxed text-pine-soft">
                {plan.vpsMonthlyMyr === null
                  ? "Server included. Nothing monthly."
                  : "A smaller deposit, with the server rented monthly."}
              </p>
              {plan.vpsMonthlyMyr !== null ? (
                /* Tinted rather than ruled, because what this says is that
                   the figure above is not the whole cost — a condition, not a
                   footnote. */
                <p className="mt-6 rounded-[var(--radius-float)] bg-blush px-4 py-3 text-sm font-semibold text-pine">
                  Plus{" "}
                  <span className="tnum">
                    {formatMyr(plan.vpsMonthlyMyr)}
                  </span>{" "}
                  a month for the server.
                </p>
              ) : null}
            </Panel>
          ))}
        </div>
      </Container>
    </Section>
  );

  return (
    <>
      <ProductGuide
        afterIntro={costs}
        product={product}
        routes={fukyaaRoutes()}
        intro={
          <>
            <h1 className="display text-4xl leading-[1.1] text-pine sm:text-5xl">
              For people who will not learn to read a chart
            </h1>

            <div className="mt-7 space-y-5 text-lg leading-relaxed text-pine-soft">
              <p>
                Some people told me straight they were never going to
                learn this. A course would have wasted their money.
              </p>
              <p>
                An expert advisor places the trades, on a server that
                stays on. You fund the account and leave it alone.
              </p>
              <p>
                If you would rather follow a person than an algorithm, that is{" "}
                <TextLink href="/copytrade">Copytrade</TextLink>. Same account
                type, different thing being copied.
              </p>
            </div>
          </>
        }
      />

      {/* The fine print, boxed off rather than left floating under a dark
          band. Set in pine-soft, not pine-faint: pine-faint clears 4.5:1 on
          the page paper but only reaches 3.98:1 on this sunk panel, and
          boxing the text is what would have broken it. */}
      <Section pad="py-14">
        <Container>
          <p className="max-w-2xl rounded-[var(--radius-panel)] bg-paper-sunk px-7 py-6 text-sm leading-relaxed text-pine-soft">
            An expert advisor places trades automatically and can lose money
            doing it. Nothing here is financial advice or a recommendation to
            buy or sell anything, and no result is promised or implied.
          </p>
        </Container>
      </Section>
    </>
  );
}
