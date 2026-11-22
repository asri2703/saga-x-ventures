import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site";
import { Container, Section } from "@/components/ui";

export const metadata: Metadata = {
  alternates: { canonical: "/about" },
  title: "About",
  description: `${site.founder.name} has traded for ${site.founder.yearsExperience} years and built Mastery Signal. Saga X Ventures is where that work lives.`,
};

export default function AboutPage() {
  return (
    <>
      <Section>
        <Container>
          <div className="max-w-2xl">
            <h1 className="display text-4xl leading-[1.1] text-pine sm:text-5xl">
              How I got here
            </h1>
            <p className="mt-7 text-lg leading-relaxed text-pine-soft">
              Saga X Ventures is my company. The signals, the automation and
              the coaching all come out of the same{" "}
              <span className="display tnum text-pine">
                {site.founder.yearsExperience} years
              </span>{" "}
              of work.
            </p>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="grid gap-12 md:grid-cols-[320px_1fr] md:gap-16">
            <div>
              <Image
                src={site.founder.photo}
                alt={site.founder.name}
                width={640}
                height={800}
                className="w-full border border-rule object-cover"
                sizes="(min-width: 768px) 320px, 100vw"
                priority
              />
              <p className="mt-3 text-sm text-pine-faint">
                {site.founder.name} — {site.founder.role}
              </p>
            </div>

            <div className="space-y-6 text-lg leading-relaxed text-pine-soft">
              <p>
                I started trading for the money. Everyone does.
              </p>
              <p>
                What kept me at it was narrower. Why a market turns at one
                price and not the one ten pips above it. Why I kept taking the
                trade I already knew was wrong.
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
                Mastery Signal started with one question I kept getting: what
                are you looking at right now. An entry price does not answer
                it, so the signals carry the level and the reason for it.
              </p>
              <p>
                Fukyaa came from people who told me plainly that they did not
                want to learn and never would. I would rather hand them
                automation than sell them a course they will not finish.
              </p>

              <h2 className="display pt-4 text-2xl text-pine">
                What I will not tell you
              </h2>
              <p>
                I will not tell you what you are going to earn. Not a monthly
                figure, not a percentage, not a screenshot of a good week.
              </p>
              <p>
                Trading carries real risk of losing real money. Everything here
                is education. None of it is financial advice or a
                recommendation to buy or sell anything.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="border border-rule bg-paper-raised p-8 sm:p-12">
            <h2 className="display text-2xl text-pine sm:text-3xl">
              Where to start
            </h2>
            <p className="mt-4 max-w-xl leading-relaxed text-pine-soft">
              Three different problems, three different answers. The homepage
              sorts them in about thirty seconds.
            </p>
            <Link
              href="/#fork"
              className="mt-7 inline-block bg-ruby px-5 py-3 text-base font-bold text-white transition-colors hover:bg-ruby-deep"
            >
              Find where you fit
            </Link>
          </div>
        </Container>
      </Section>
    </>
  );
}
