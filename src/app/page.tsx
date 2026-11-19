import Link from "next/link";
import { site, waLink } from "@/lib/site";
import { products } from "@/lib/products";
import {
  ButtonAnchor,
  ButtonLink,
  Container,
  Section,
  SectionHeading,
} from "@/components/ui";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Fork />
      <Umbrella />
      <Lounge />
      <Close />
    </>
  );
}

/**
 * The brand board pins the hero: navy field, the wordmark tagline set large,
 * and a single eyebrow of the three brand words. That eyebrow is the one
 * all-caps label on the site — it belongs to the identity, so it is kept here
 * and nowhere else.
 */
function Hero() {
  return (
    <section className="relative overflow-hidden bg-navy text-on-dark">
      <div aria-hidden className="absolute inset-0 bg-grid bg-grid-fade opacity-[0.35]" />
      <div
        aria-hidden
        className="absolute -right-32 -top-40 h-[32rem] w-[32rem] rounded-full bg-sky/20 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-56 -left-24 h-[28rem] w-[28rem] rounded-full bg-pink/20 blur-3xl"
      />

      <Container className="relative py-24 sm:py-32">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky">
          Markets · Technology · Innovation
        </p>

        <h1 className="mt-6 max-w-3xl font-display text-5xl font-extrabold leading-[0.98] sm:text-7xl">
          Beyond Trading<span className="text-pink">.</span>
        </h1>

        <p className="mt-7 max-w-xl text-xl leading-relaxed text-on-dark-muted">
          {site.plain}
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href="/mula" variant="brand" size="lg">
            Mula — tiga soalan
          </ButtonLink>
          <ButtonLink href="#jalan" variant="light" size="lg">
            Saya dah tahu apa saya nak
          </ButtonLink>
        </div>

        <p className="mt-10 max-w-xl text-sm leading-relaxed text-on-dark-muted">
          {site.riskLine}
        </p>
      </Container>
    </section>
  );
}

/**
 * The fork — the one loud moment on the page.
 *
 * No scroll reveal here, or anywhere on this page. The panels are the point of
 * the page, and content that matters should not depend on JavaScript having
 * run and an observer having fired. The hero's drifting colour is the only
 * motion, and nothing is hidden behind it.
 *
 * Two paths meeting at a seam, rather than two matching cards side by side,
 * because the content really is a divergence and the logo is already a
 * crossing. The seam is decorative and hidden from assistive tech; the two
 * panels remain ordinary stacked sections on a phone.
 */
function Fork() {
  return (
    <section id="jalan" className="scroll-mt-20 bg-mist py-20 sm:py-28">
      <Container>
        <SectionHeading
          title="Satu soalan memisahkan semuanya"
          lead="Bukan soalan tentang produk. Soalan tentang berapa banyak masa awak ada, dan sama ada awak mahu faham atau mahu ia jalan sendiri."
        />
      </Container>

      <div className="relative mt-14">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-6 left-1/2 hidden w-px -translate-x-1/2 rotate-[4deg] bg-gradient-to-b from-transparent via-line-strong to-transparent lg:block"
        />
        <Container>
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-16">
            <PathPanel
              kicker="Kalau awak mahu faham"
              title="Belajar trade sendiri"
              body="Awak yang baca pasaran, awak yang tekan butang. Kami ajar asas, cara berdagang waktu berita keluar, dan cara bina strategi yang boleh diulang. Mastery Signal menyokong keputusan awak — ia tidak membuat keputusan untuk awak."
              points={["Perlu sejam dua sehari", "Awak faham setiap posisi", "Kemahiran kekal milik awak"]}
              href="/belajar"
              cta="Lihat jalan belajar"
            />
            <PathPanel
              kicker="Kalau awak tiada masa"
              title="Trading automatik"
              body="Sistem berjalan pada akaun awak sendiri, tanpa awak perlu depan skrin. Awak buka akaun atas nama awak, dan ia kekal milik awak sepenuhnya — kami tidak pernah memegang wang awak."
              points={["Kurang 30 minit sehari", "Akaun dan modal kekal milik awak", "Dipasang dan disambung ke VPS"]}
              href="/automatik"
              cta="Lihat cara ia berfungsi"
              tone="navy"
            />
          </div>
        </Container>
      </div>

      <Container>
        <p className="mt-12 text-center text-text-muted">
          Tak pasti yang mana?{" "}
          <Link
            href="/mula"
            className="font-semibold text-navy underline underline-offset-4"
          >
            Jawab tiga soalan
          </Link>{" "}
          dan kami cadangkan satu.
        </p>
      </Container>
    </section>
  );
}

function PathPanel({
  kicker,
  title,
  body,
  points,
  href,
  cta,
  tone = "paper",
}: {
  kicker: string;
  title: string;
  body: string;
  points: string[];
  href: string;
  cta: string;
  tone?: "paper" | "navy";
}) {
  const dark = tone === "navy";
  return (
    <div
      className={`flex flex-col rounded-3xl border p-8 sm:p-10 ${
        dark ? "border-navy bg-navy text-on-dark" : "border-line bg-paper text-text"
      }`}
    >
      <p
        className={`text-sm font-semibold ${dark ? "text-sky" : "text-text-muted"}`}
      >
        {kicker}
      </p>
      <h3
        className={`mt-3 font-display text-3xl font-bold leading-tight ${
          dark ? "text-on-dark" : "text-navy"
        }`}
      >
        {title}
      </h3>
      <p
        className={`mt-5 leading-relaxed ${dark ? "text-on-dark-muted" : "text-text-muted"}`}
      >
        {body}
      </p>
      <ul className={`mt-7 space-y-2.5 text-sm ${dark ? "text-on-dark-muted" : "text-text-muted"}`}>
        {points.map((p) => (
          <li key={p} className="flex gap-3">
            <span
              aria-hidden
              className={`mt-2 h-1 w-4 shrink-0 rounded-full ${dark ? "bg-sky" : "bg-pink"}`}
            />
            {p}
          </li>
        ))}
      </ul>
      <div className="mt-9">
        <ButtonLink href={href} variant={dark ? "light" : "primary"}>
          {cta}
        </ButtonLink>
      </div>
    </div>
  );
}

function Umbrella() {
  return (
    <Section tone="paper">
      <SectionHeading
        title="Apa itu Saga X Ventures"
        lead="Satu syarikat, dua produk, dan satu tempat belajar. Nama produk mungkin awak dah kenal; label di bawah menerangkan apa setiap satu buat."
      />
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {products.map((p) => (
          <div
            key={p.slug}
            className="rounded-2xl border border-line bg-mist p-7"
          >
            <h3 className="font-display text-xl font-bold text-navy">
              {p.label}
            </h3>
            <p className="mt-1 text-sm font-semibold text-text-faint">{p.brand}</p>
            <p className="mt-4 leading-relaxed text-text-muted">{p.summary}</p>
            <Link
              href={`/${p.slug}`}
              className="mt-6 inline-block font-semibold text-navy underline underline-offset-4"
            >
              Selengkapnya
            </Link>
          </div>
        ))}
      </div>
      <p className="mt-10 max-w-2xl leading-relaxed text-text-muted">
        <strong className="font-semibold text-text">Traders Lounge</strong> ialah
        tempat semuanya diajar — video, artikel, webinar dan kelas. Ia sebahagian
        daripada laman ini, bukan brand berasingan.
      </p>
    </Section>
  );
}

/**
 * Empty by design, for now.
 *
 * There is no library yet, and dressing the gap with placeholder cards would
 * only teach visitors to distrust the rest of the page. An empty state that
 * says what is coming and offers to tell you when is more use than three fake
 * thumbnails.
 */
function Lounge() {
  return (
    <Section tone="mist">
      <SectionHeading
        title="Traders Lounge"
        lead="Video, tutorial, webinar dan kelas — semuanya di satu tempat."
      />
      <div
        className="mt-10 rounded-2xl border border-dashed border-line-strong bg-paper p-10 text-center"
      >
        <p className="mx-auto max-w-md leading-relaxed text-text-muted">
          Pustaka sedang disiapkan. Video pertama dan jadual webinar akan
          diumumkan tidak lama lagi.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <ButtonAnchor
            href={waLink("Hi, beritahu saya bila video dan webinar Traders Lounge bermula.")}
            target="_blank"
            rel="noopener noreferrer"
            variant="outline"
          >
            Beritahu saya bila ia bermula
          </ButtonAnchor>
        </div>
      </div>
    </Section>
  );
}

function Close() {
  return (
    <Section tone="navy">
      <div className="max-w-2xl">
        <h2 className="font-display text-3xl font-bold leading-tight sm:text-4xl">
          Tiga soalan. Kemudian awak tahu jalan mana.
        </h2>
        <p className="mt-5 text-lg leading-relaxed text-on-dark-muted">
          Tiada e-mel diminta, tiada panggilan jualan. Kalau jawapannya ialah
          awak belum sedia beli apa-apa, kami akan kata begitu.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <ButtonLink href="/mula" variant="brand" size="lg">
            Mula — tiga soalan
          </ButtonLink>
          <ButtonAnchor
            href={waLink()}
            target="_blank"
            rel="noopener noreferrer"
            variant="light"
            size="lg"
          >
            Tanya di WhatsApp
          </ButtonAnchor>
        </div>
      </div>
    </Section>
  );
}
