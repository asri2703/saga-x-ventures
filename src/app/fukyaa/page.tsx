import type { Metadata } from "next";
import Link from "next/link";
import { fukyaa, fukyaaDeposit } from "@/lib/commercial";
import { fukyaaRoutes } from "@/lib/fukyaa";
import { getProduct } from "@/lib/products";
import { formatPrice } from "@/lib/coaching";
import { Container, Section } from "@/components/ui";
import { ProductGuide } from "@/components/product-guide";

export const metadata: Metadata = {
  alternates: { canonical: "/fukyaa" },
  title: "Fukyaa AI Auto Trade",
  description:
    "An expert advisor places the trades. Fund a cent account and the server is included, or bring your own broker and rent it monthly.",
};

export default function FukyaaPage() {
  const product = getProduct("fukyaa")!;
  const deposit = fukyaaDeposit(new Date());

  return (
    <>
      <ProductGuide
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
                and learn this. They were right about themselves, and selling
                them a course would have been a waste of their money.
              </p>
              <p>
                So: an expert advisor places the trades, running on a server
                that stays on. You fund the account and leave it alone.
              </p>
              <p>
                If you would rather follow a person than an algorithm, that is{" "}
                <Link
                  href="/copytrade"
                  className="text-pine underline decoration-ruby decoration-2 underline-offset-4"
                >
                  Copytrade
                </Link>
                . Same account type, different thing being copied.
              </p>
            </div>
          </>
        }
      />

      <Section tone="raised">
        <Container>
          <div className="max-w-2xl" data-reveal>
            <h2 className="display text-3xl text-pine sm:text-4xl">
              What it costs
            </h2>
            <p className="mt-4 leading-relaxed text-pine-soft">
              Two ways, and which is cheaper depends on whether you were going
              to fund a trading account anyway.
            </p>
          </div>

          <div className="mt-10 grid max-w-3xl gap-6 md:grid-cols-2">
            <div className="border border-rule bg-paper p-7">
              <p className="text-sm text-pine-faint">Fund a Harmovest account</p>
              <p className="display mt-2 text-2xl text-pine">
                <span className="tnum">{deposit.usd} USD</span> deposit
              </p>
              <p className="mt-3 leading-relaxed text-pine-soft">
                Server included. Nothing monthly.
              </p>
              {deposit.isPromo ? (
                <p className="mt-4 border-l-2 border-ruby pl-3 text-sm font-semibold text-pine">
                  Promotional figure, until {fukyaa.promoEndsOn}. It returns to{" "}
                  <span className="tnum">{fukyaa.depositStandardUsd} USD</span>{" "}
                  after that.
                </p>
              ) : null}
            </div>

            <div className="border border-rule bg-paper p-7">
              <p className="text-sm text-pine-faint">Keep your own broker</p>
              <p className="display mt-2 text-2xl text-pine">
                <span className="tnum">
                  {formatPrice(fukyaa.vpsMonthlyMyr)}
                </span>{" "}
                a month
              </p>
              <p className="mt-3 leading-relaxed text-pine-soft">
                Server rental only. Whatever broker you already use is fine —
                Harmovest is what I recommend, not a requirement.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <p className="max-w-2xl text-sm leading-relaxed text-pine-faint">
            An expert advisor places trades automatically and can lose money
            doing it. Nothing here is financial advice or a recommendation to
            buy or sell anything, and no result is promised or implied.
          </p>
        </Container>
      </Section>
    </>
  );
}
