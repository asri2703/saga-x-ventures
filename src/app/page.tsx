import Link from "next/link";
import Image from "next/image";
import { latestPosts, formatDate } from "@/lib/blog";
import { products } from "@/lib/products";
import { site } from "@/lib/site";
import { Container, Section } from "@/components/ui";
import { MarkedChart } from "@/components/marked-chart";
import { ProductBand } from "@/components/product-band";

export default function HomePage() {
  const posts = latestPosts(3);

  return (
    <>
      {/* ---------------------------------------------------------------
          Hero.
          The one ruby element in this viewport is the level inside the
          diagram, so the button beside it is deliberately quiet. Two marks
          competing is the same as no mark at all.
      --------------------------------------------------------------- */}
      <Section>
        <Container>
          {/* The portrait is a full-length 2:3. Given a wide column it makes
              the hero taller than a screen and buries the fork below the
              fold, so the column is capped rather than the image cropped —
              the shoes and the whole seated pose are the shot. */}
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_minmax(0,440px)] lg:gap-16">
            <div>
              <h1 className="display text-4xl leading-[1.05] text-pine sm:text-5xl lg:text-6xl">
                Twelve years reading the same few charts.
              </h1>

              {/* Credibility as a sentence, not three numbers in a row. The
                  figures carry weight by being set in the wider cut, not by
                  being blown up into a stat strip. */}
              <p className="mt-7 max-w-xl text-lg leading-relaxed text-pine-soft">
                I am{" "}
                <span className="font-semibold text-pine">
                  {site.founder.name}
                </span>
                . I have traded for{" "}
                <span className="display text-pine">
                  {site.founder.yearsExperience} years
                </span>{" "}
                and taught more than{" "}
                <span className="display tnum text-pine">
                  {site.founder.tradersGuided.toLocaleString("en-MY")} traders
                </span>{" "}
                across Malaysia and Indonesia over that time. Saga X Ventures is
                where that work lives.
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

            {/* The hero is the person, not the product. He is what the three
                products have in common, and a trading site that leads with a
                face rather than a dashboard is already saying something its
                competitors are not.

                No frame. The earlier version was a studio shot with a cool
                white backdrop that had to be warmed and boxed so it would not
                read as a grey patch on warm paper. This one is cut out, so it
                sits directly on the page — which is the stronger picture and
                removes the panel entirely rather than disguising it.

                WebP because the cutout needs its alpha channel; at 172KB it
                is an eighth of the equivalent PNG. */}
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
          The fork. Three answers to one question, sorted by what the
          visitor can already do.
      --------------------------------------------------------------- */}
      <Section id="fork">
        <Container>
          <h2 className="display max-w-2xl text-3xl text-pine sm:text-4xl">
            Which one are you?
          </h2>
          <p className="mt-4 max-w-xl leading-relaxed text-pine-soft">
            Three different problems. Picking the wrong one wastes your money,
            so read the three lines below and take the one that sounds like you.
          </p>

          <div className="mt-12">
            {products.map((product) => (
              <ProductBand
                key={product.key}
                product={product}
                marked={product.key === "coaching"}
              />
            ))}
          </div>
        </Container>
      </Section>

      {/* --------------------------------------------------------------- */}
      <Section>
        <Container>
          {/* The chart moved here from the hero when the portrait took that
              slot. It belongs next to this text better than it did up there:
              the hero says who he is, this section says how he works, and a
              diagram of how a level gets chosen is exactly that. */}
          <div className="grid gap-12 md:grid-cols-[1fr_1fr] md:gap-16">
            <div>
              <MarkedChart />
            </div>
            <div>
              <h2 className="display text-3xl text-pine sm:text-4xl">
                Still trading, which is the point
              </h2>
              <div className="mt-6 space-y-5 text-lg leading-relaxed text-pine-soft">
                <p>
                  Most people selling trading education stopped trading a long
                  time ago. I did not. Everything I teach is what I am doing
                  this week, on the same instruments, with the same hesitation
                  before clicking.
                </p>
                <p>
                  I built Mastery Signal because traders kept asking me what I
                  was looking at, and a screenshot never explained the reason.
                  Fukyaa exists for the people who asked honestly whether they
                  should be trading by hand at all.
                </p>
                <p>
                  What I will not do is tell you what you are going to earn. I
                  do not know, and neither does anyone who tells you otherwise.
                </p>
              </div>
              <Link
                href="/about"
                className="mt-7 inline-block text-base text-pine underline decoration-ruby decoration-2 underline-offset-4"
              >
                More about the twelve years
              </Link>
            </div>
          </div>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------
          Next session. Plan 2 fills this from the events table; until
          then it degrades to an invitation rather than an empty box.
      --------------------------------------------------------------- */}
      <Section>
        <Container>
          <div className="border border-rule bg-paper-raised p-8 sm:p-12">
            <h2 className="display text-2xl text-pine sm:text-3xl">
              Sessions, online and in person
            </h2>
            <p className="mt-4 max-w-xl leading-relaxed text-pine-soft">
              Webinars on Zoom, and seminars where we sit in the same room. The
              schedule goes up here.
            </p>
            <Link
              href="/events"
              className="mt-7 inline-block bg-ruby px-5 py-3 text-base font-bold text-white transition-colors hover:bg-ruby-deep"
            >
              See what is coming
            </Link>
          </div>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------
          Latest writing. Renders nothing at all when the blog is empty,
          which it legitimately is right now.
      --------------------------------------------------------------- */}
      {posts.length > 0 ? (
        <Section>
          <Container>
            <div className="flex items-end justify-between gap-6">
              <h2 className="display text-3xl text-pine sm:text-4xl">
                Writing
              </h2>
              <Link
                href="/blog"
                className="shrink-0 text-base text-pine underline decoration-ruby decoration-2 underline-offset-4"
              >
                All posts
              </Link>
            </div>

            <ul className="mt-10">
              {posts.map((post) => (
                <li key={post.slug} className="border-t border-rule">
                  <Link href={`/blog/${post.slug}`} className="block py-6">
                    <p className="text-sm text-pine-faint tnum">
                      {formatDate(post.date)}
                    </p>
                    <p className="display mt-1 text-xl text-pine">
                      {post.title}
                    </p>
                    <p className="mt-2 max-w-2xl leading-relaxed text-pine-soft">
                      {post.excerpt}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}
    </>
  );
}
