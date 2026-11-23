import type { Metadata } from "next";
import Image from "next/image";
import { features, masterySignalRoutes } from "@/lib/mastery-signal";
import { getProduct } from "@/lib/products";
import { Container, Section } from "@/components/ui";
import { FeatureSlider } from "@/components/feature-slider";
import { ProductGuide } from "@/components/product-guide";

/**
 * Not a second sales page. masterysignal.com sells the product; this one
 * explains the order you have to do things in and hands over the links.
 */

export const metadata: Metadata = {
  alternates: { canonical: "/mastery-signal" },
  title: "Mastery Signal",
  description:
    "How to start with Mastery Signal: fund a trading account, or pay the subscription. The order matters, and this is why.",
};

export default function MasterySignalPage() {
  const product = getProduct("mastery-signal")!;

  /* The features. They belong between the introduction and the fork,
     and now render there rather than after the closing ask. */
  const showcase = (
    <Section tone="raised">
      <Container>
        <div className="max-w-2xl" data-reveal>
          <h2 className="display text-3xl text-pine sm:text-4xl">
            What you actually get
          </h2>
          <p className="mt-4 leading-relaxed text-pine-soft">
            Drag the row, or use the arrows.
          </p>
        </div>
      </Container>

      <div className="mt-12">
        <FeatureSlider features={features} />
      </div>
    </Section>
  );

  return (
    <>
      <ProductGuide
        afterIntro={showcase}
        product={product}
        routes={masterySignalRoutes()}
        intro={
          <>
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
                People kept asking me the same thing: what are you looking at
                right now. An entry price never answered it. You copy a number,
                it works or it does not, and you are no better at this
                afterwards.
              </p>
              <p>
                So every call carries the level it is built on and why that
                level is there. Members who read that part start calling the
                same levels themselves.
              </p>
              <p>
                You place the trades yourself. Nothing here trades your account
                for you.
              </p>
            </div>
          </>
        }
      />

      <Section>
        <Container>
          <p className="max-w-2xl text-sm leading-relaxed text-pine-faint">
            Signals are education, not financial advice, and they are not a
            recommendation to buy or sell anything. Trading carries real risk of
            losing real money, and no result is promised or implied.
          </p>
        </Container>
      </Section>
    </>
  );
}
