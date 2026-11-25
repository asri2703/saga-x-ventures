import type { Metadata } from "next";
import Image from "next/image";
import { site } from "@/lib/site";
import { Container, Section } from "@/components/ui";
import { ActionLink, OffsetFrame, Scallop } from "@/components/shell";

export const metadata: Metadata = {
  alternates: { canonical: "/about" },
  title: "About",
  description: `${site.founder.name} has traded for ${site.founder.yearsExperience} years and built Mastery Signal. Saga X Ventures is where that work lives.`,
};

export default function AboutPage() {
  return (
    <>
      <Section pad="pt-16 pb-10 sm:pt-24">
        <Container>
          <div className="max-w-2xl">
            <h1 className="display text-4xl text-pine sm:text-5xl">
              How I got here
            </h1>
            <p className="mt-7 text-lg leading-relaxed text-pine-soft">
              Saga X Ventures is my company. The signals, the automation and the
              coaching all come out of the same{" "}
              <span className="display tnum text-pine">
                {site.founder.yearsExperience} years
              </span>{" "}
              of work.
            </p>
          </div>
        </Container>
      </Section>

      <Section pad="pt-10 pb-16 sm:pb-24">
        <Container>
          <div className="grid gap-16 md:grid-cols-[320px_1fr] md:gap-20">
            <div>
              {/* The portrait gets the reference's treatment: rounded, with a
                  block of colour offset behind it rather than a hairline
                  rule around a bare rectangle. */}
              <OffsetFrame tint="sage">
                <Image
                  src={site.founder.photo}
                  alt={site.founder.name}
                  width={640}
                  height={800}
                  className="w-full object-cover"
                  sizes="(min-width: 768px) 320px, 100vw"
                  priority
                />
              </OffsetFrame>
              <p className="mt-7 text-sm text-pine-faint">
                {site.founder.name} — {site.founder.role}
              </p>
            </div>

            <div className="space-y-6 text-lg leading-relaxed text-pine-soft">
              <p>I started trading for the money. Everyone does.</p>
              <p>
                What kept me at it was narrower. Why a market turns at one
                price and not the one ten pips above it.
              </p>
              <p>
                Over those years I have taught more than{" "}
                <span className="display tnum text-pine">
                  {site.founder.tradersGuided.toLocaleString("en-MY")} traders
                </span>{" "}
                across Malaysia and Indonesia. In rooms, on calls, and one to
                one. That number covers the whole span of the work. It is not a
                membership count, and nobody is currently subscribed to it.
              </p>
              <p>
                Mastery Signal started with one question I kept getting:
                what are you looking at right now. So the signals carry
                the level, and the reason for it.
              </p>
              <p>
                Fukyaa came from people who told me plainly they would
                never learn. Better to hand them automation than a course
                they will not finish.
              </p>

              {/* No eyebrow here. A label repeating the heading beneath it
                  is read out twice and says nothing the second time. */}
              <h2 className="display pt-6 text-2xl text-pine">
                What I will not tell you
              </h2>
              <p>
                I will not tell you what you are going to earn. No monthly
                figure, no percentage, no screenshot of a good week.
              </p>
              <p>
                Trading carries real risk of losing real money. Everything here
                is education. None of it is financial advice or a recommendation
                to buy or sell anything.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      <Scallop />
      <Section tone="pine" pad="pt-10 pb-16 sm:pb-24">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="display text-2xl text-paper sm:text-3xl">
              Where to start
            </h2>
            <p className="mx-auto mt-5 max-w-xl leading-relaxed text-paper/80">
              Three different problems, three different answers. The homepage
              sorts them in about thirty seconds.
            </p>
            <div className="mt-9">
              <ActionLink href="/#fork" tone="accent">
                Find where you fit
              </ActionLink>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
