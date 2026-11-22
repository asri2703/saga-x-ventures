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
              {site.founder.yearsExperience} years, and still the same few
              instruments
            </h1>
            <p className="mt-7 text-lg leading-relaxed text-pine-soft">
              Saga X Ventures is {site.founder.name}&rsquo;s trading practice.
              Everything under it — the signals, the automation, the coaching —
              comes out of the same work, done daily, for{" "}
              <span className="display tnum text-pine">
                {site.founder.yearsExperience} years
              </span>
              .
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
                I started trading because I wanted the money, which is the same
                reason everyone starts. I kept trading because the part that
                actually interested me turned out to be different: why a market
                stops in one place and not another, and why I kept doing the
                wrong thing even after I knew better.
              </p>
              <p>
                Over those years I have taught more than{" "}
                <span className="display tnum text-pine">
                  {site.founder.tradersGuided.toLocaleString("en-MY")} traders
                </span>{" "}
                across Malaysia and Indonesia — in rooms, on calls, and
                one-to-one. That number is the whole span of the work, not a
                membership count and not people currently subscribed to
                anything.
              </p>
              <p>
                I built Mastery Signal because the same question kept arriving:
                what are you looking at right now? A signal on its own answers
                that badly. A signal with the reasoning attached teaches
                something, and the people who read the reasoning stopped needing
                me.
              </p>
              <p>
                Fukyaa came from the opposite conversation — people who were
                honest enough to say they did not want to learn to trade and
                never would. Automation is a reasonable answer to that, and
                pretending otherwise just to sell a course would have been
                dishonest.
              </p>

              <h2 className="display pt-4 text-2xl text-pine">
                What I will not tell you
              </h2>
              <p>
                I will not tell you what you are going to earn. Not a monthly
                figure, not a percentage, not a screenshot of a good week. I do
                not know, nobody does, and the people who put a number on it are
                selling you the number rather than the skill.
              </p>
              <p>
                Trading carries real risk of losing real money. Anything on this
                site is education, not financial advice, and none of it is a
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
