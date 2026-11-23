import type { Metadata } from "next";
import { fukyaa, fukyaaDeposit, formatPromoEnd } from "@/lib/commercial";
import { fukyaaRoutes } from "@/lib/fukyaa";
import { getProduct } from "@/lib/products";
import { formatPrice } from "@/lib/coaching";
import { Container, Section } from "@/components/ui";
import { ProductGuide } from "@/components/product-guide";
import { Eyebrow, Panel, TextLink } from "@/components/shell";

/**
 * The deposit figure on this page is promotional and expires on a date. It is
 * read from the clock, so a page prerendered once at build time would keep
 * quoting the promotional figure — and an expiry date already in the past —
 * for as long as the build lasted.
 *
 * An hour is short enough that the figure can never be wrong for a working
 * day, and long enough that the page is still served from cache rather than
 * rendered per visitor. `freshness.test.ts` holds every page to this.
 */
export const revalidate = 3600;

export const metadata: Metadata = {
  alternates: { canonical: "/fukyaa" },
  title: "Fukyaa AI Auto Trade",
  description:
    "An expert advisor places the trades. Fund a cent account and the server is included, or bring your own broker and rent it monthly.",
};

export default function FukyaaPage() {
  const product = getProduct("fukyaa")!;
  const deposit = fukyaaDeposit(new Date());

  /* What it costs. Before the steps, not after the closing ask. */
  const costs = (
    <Section tone="raised">
      <Container>
        <div className="max-w-2xl" data-reveal>
          <h2 className="display text-3xl text-pine sm:text-4xl">
            What it costs
          </h2>
          <p className="mt-4 leading-relaxed text-pine-soft">
            Two ways, and which is cheaper depends on whether you were going to
            fund a trading account anyway.
          </p>
        </div>

        <div className="mt-10 grid max-w-3xl gap-6 md:grid-cols-2">
          <Panel className="flex flex-col">
            <Eyebrow tone="quiet">Fund a Harmovest account</Eyebrow>
            <p className="display mt-3 text-3xl text-pine">
              <span className="tnum">{deposit.usd} USD</span> deposit
            </p>
            <p className="mt-3 flex-1 leading-relaxed text-pine-soft">
              Server included. Nothing monthly.
            </p>
            {/* Tinted rather than ruled, because what this says is that the
                figure above is temporary — a condition, not a footnote. */}
            {deposit.isPromo ? (
              <p className="mt-6 rounded-[var(--radius-float)] bg-blush px-4 py-3 text-sm font-semibold text-pine">
                Promotional figure, until {formatPromoEnd()}. It returns to{" "}
                <span className="tnum">{fukyaa.depositStandardUsd} USD</span>{" "}
                after that.
              </p>
            ) : null}
          </Panel>

          <Panel className="flex flex-col">
            <Eyebrow tone="quiet">Keep your own broker</Eyebrow>
            <p className="display mt-3 text-3xl text-pine">
              <span className="tnum">{formatPrice(fukyaa.vpsMonthlyMyr)}</span>{" "}
              a month
            </p>
            <p className="mt-3 flex-1 leading-relaxed text-pine-soft">
              Server rental only. Whatever broker you already use is fine —
              Harmovest is what I recommend, not a requirement.
            </p>
          </Panel>
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
                Some people told me straight that they were never going to sit
                and learn this. Selling them a course would have wasted their
                money.
              </p>
              <p>
                So: an expert advisor places the trades, running on a server
                that stays on. You fund the account and leave it alone.
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
      <Section className="py-14">
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
