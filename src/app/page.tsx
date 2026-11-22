import type { CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import { ibProducts, retailProducts, getProduct } from "@/lib/products";
import { site } from "@/lib/site";
import { Container, Section } from "@/components/ui";
import { SectionHeading } from "@/components/section-heading";
import { MarkedChart } from "@/components/marked-chart";
import { AccountGateway } from "@/components/account-gateway";

export default function HomePage() {
  const cent = retailProducts.filter((p) => p.account === "cent");
  const standard = retailProducts.filter((p) => p.account === "standard");
  const coaching = getProduct("coaching")!;

  return (
    <>
      {/* ---------------------------------------------------------------
          1. Hero. The owner's own copy, kept as he wrote it.
      --------------------------------------------------------------- */}
      <Section>
        <Container>
          {/* The portrait is a full-length 2:3. Given a wide column it makes
              the hero taller than a screen and buries the fork below the
              fold, so the column is capped rather than the image cropped. */}
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_minmax(0,440px)] lg:gap-16">
            <div>
              <h1 className="display text-4xl leading-[1.05] text-pine sm:text-5xl lg:text-6xl">
                Trade Shouldn&rsquo;t Be Complicated.
              </h1>

              <p className="mt-7 max-w-xl text-lg leading-relaxed text-pine-soft">
                We believe trading shouldn&rsquo;t be complicated. That&rsquo;s
                why we build innovative trading solutions designed to make the
                trading experience simpler, smarter and more flexible,
                empowering traders to focus on what matters most.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link
                  href="#fork"
                  className="border border-pine px-5 py-3 text-base font-semibold text-pine transition-colors hover:bg-pine hover:text-paper"
                >
                  Find where you fit
                </Link>
                <Link
                  href="/about"
                  className="text-base text-pine underline decoration-ruby decoration-2 underline-offset-4"
                >
                  How I got here
                </Link>
              </div>
            </div>

            <Image
              src="/asri-hero.webp"
              alt={`${site.founder.name}, founder of ${site.name}`}
              width={1003}
              height={1516}
              className="h-auto w-full"
              sizes="(min-width: 1024px) 440px, 100vw"
              priority
            />
          </div>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------
          2. Who I am.
      --------------------------------------------------------------- */}
      <Section tone="raised">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
            <div>
              <SectionHeading eyebrow="Who I am" title="I still trade" />
              <div className="mt-6 space-y-5 text-lg leading-relaxed text-pine-soft">
                <p>
                  I am {site.founder.name}. Most weeks that means a few
                  positions. Some weeks it means none, because nothing I wanted
                  showed up.
                </p>
                <p>
                  Twelve years of it, and more than{" "}
                  <span className="display tnum text-pine">
                    {site.founder.tradersGuided.toLocaleString("en-MY")} traders
                  </span>{" "}
                  taught across Malaysia and Indonesia over that time. In rooms,
                  on calls, one to one.
                </p>
                <p>
                  It matters for what I teach. When I talk about waiting for a
                  level, it is because I sat on my hands waiting for one last
                  week.
                </p>
              </div>
              <Link
                href="/about"
                className="mt-7 inline-block text-base text-pine underline decoration-ruby decoration-2 underline-offset-4"
              >
                The longer version
              </Link>
            </div>

            <div data-reveal>
              <MarkedChart />
            </div>
          </div>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------
          3. Why I built these.
      --------------------------------------------------------------- */}
      <Section>
        <Container>
          <SectionHeading eyebrow="Why I built these" title="Three conversations">
            <p>
              None of this started as a product. Each one came out of the same
              question asked a different way.
            </p>
          </SectionHeading>

          <div className="mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
            {[
              {
                k: "signal",
                q: "What are you looking at right now?",
                a: "People asked me that for years. An entry price never answered it, so I started writing down the level and why it was there. That became Mastery Signal.",
              },
              {
                k: "auto",
                q: "I am never going to learn this.",
                a: "Said to my face, more than once, by people who were right about themselves. Selling them a course would have wasted their money. So they get an expert advisor and a server instead.",
              },
              {
                k: "build",
                q: "Can you build it for me?",
                a: "Other people with their own clients wanted the same tools under their own name. I had already built mine, so I build theirs.",
              },
            ].map((item, i) => (
              <div
                key={item.k}
                data-reveal
                style={{ "--reveal-delay": `${i * 90}ms` } as CSSProperties}
                className="border border-rule bg-paper-raised p-7"
              >
                <p className="display text-xl leading-snug text-pine">
                  &ldquo;{item.q}&rdquo;
                </p>
                <p className="mt-4 leading-relaxed text-pine-soft">{item.a}</p>
              </div>
            ))}
          </div>

          <p className="mt-10 max-w-2xl leading-relaxed text-pine-soft" data-reveal>
            What I will not do is tell you what you are going to earn. I do not
            know what I am going to earn either.
          </p>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------
          4. The solutions, forked by account type.
      --------------------------------------------------------------- */}
      <Section id="fork" tone="raised">
        <Container>
          <SectionHeading eyebrow="What I build" title="Which one are you?">
            <p>
              Everything starts with a broker account, and which type decides
              what you can do with it. Read the lines below and take the one
              that sounds like you.
            </p>
          </SectionHeading>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <AccountGateway
              account="standard"
              title="You want to place the trades"
              note="Signals arrive with the level and the reason for it. You decide whether to take them."
              products={standard}
            />
            <AccountGateway
              account="cent"
              title="You want them placed for you"
              note="Smaller contract sizes, so positions can be sized finely. Follow a person, or follow a system."
              products={cent}
            />
          </div>

          <p
            className="mt-8 max-w-2xl border-l-2 border-pine pl-4 leading-relaxed text-pine"
            data-reveal
          >
            The two account types are separate. If you want something from both
            columns, that is two accounts — worth knowing before you open the
            first one.
          </p>

          {/* Coaching sits outside the fork: it needs no broker account. */}
          <div
            data-reveal
            className="mt-12 flex flex-col gap-6 border border-rule bg-paper p-7 sm:flex-row sm:items-center sm:justify-between sm:p-8"
          >
            <div className="max-w-xl">
              <p className="display text-xl text-pine">
                &ldquo;{coaching.forWho}&rdquo;
              </p>
              <p className="mt-2 leading-relaxed text-pine-soft">
                {coaching.summary}
              </p>
            </div>
            <Link
              href={coaching.href}
              className="shrink-0 bg-ruby px-5 py-3 text-base font-bold text-white transition-colors hover:bg-ruby-deep"
            >
              {coaching.cta}
            </Link>
          </div>

          {/* The IB lane. A door, not a pitch — these two have no page yet. */}
          <div className="mt-12 border-t border-rule pt-10" data-reveal>
            <h3 className="display text-xl text-pine">
              If you have clients of your own
            </h3>
            <div className="mt-6 grid max-w-3xl gap-6 sm:grid-cols-2">
              {ibProducts.map((product) => (
                <div key={product.key}>
                  <p className="font-semibold text-pine">{product.name}</p>
                  <p className="mt-2 text-sm leading-relaxed text-pine-soft">
                    {product.summary}
                  </p>
                  <a
                    href={product.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-sm text-pine underline decoration-ruby decoration-2 underline-offset-4"
                  >
                    {product.cta}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>
      {/* ---------------------------------------------------------------
          5. Award and recognition.
      --------------------------------------------------------------- */}
      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-16">
            <div data-reveal className="border border-rule bg-paper-raised p-3">
              <Image
                src={site.founder.award.image}
                alt={`${site.founder.name} receiving the ${site.founder.award.title} award`}
                width={1076}
                height={919}
                className="h-auto w-full"
                sizes="(min-width: 1024px) 600px, 100vw"
              />
            </div>

            <div>
              <SectionHeading
                eyebrow="Recognition"
                title={site.founder.award.title}
              />
              <div className="mt-6 space-y-5 text-lg leading-relaxed text-pine-soft">
                <p>
                  {site.founder.award.body},{" "}
                  <span className="tnum">{site.founder.award.year}</span>.
                </p>
                <p>
                  The name on the screen is {site.founder.award.alias}. That is
                  what I traded under then.
                </p>
                <p>
                  I put this here because it is one of the few things I can
                  show you that is a fact rather than a promise. It says
                  somebody watched the work. It does not say what your account
                  will do.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------
          6. Coaching and classes — the close.
      --------------------------------------------------------------- */}
      <Section tone="raised">
        <Container>
          <div
            data-reveal
            className="border border-rule bg-paper p-8 sm:p-12"
          >
            <SectionHeading
              eyebrow="Coaching and classes"
              title="Learn to do this yourself"
            >
              <p>
                Three classes, one to one, about a day each. Basic trading,
                then advance, then trading the news. Take them in order or take
                one on its own.
              </p>
            </SectionHeading>

            <p className="mt-6 max-w-2xl leading-relaxed text-pine-soft">
              Tell me what you have traded so far and which one you think you
              need. We fix the dates first, and payment comes after that.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-5">
              <a
                href="/go/whatsapp?m=coaching"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-ruby px-5 py-3 text-base font-bold text-white transition-colors hover:bg-ruby-deep"
              >
                Ask about coaching
              </a>
              <Link
                href="/coaching"
                className="text-base text-pine underline decoration-ruby decoration-2 underline-offset-4"
              >
                See the three classes
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
