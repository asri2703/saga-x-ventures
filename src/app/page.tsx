import Image from "next/image";
import Link from "next/link";
import CoreHero from "@/components/ui/core-hero";
import { site, waLink } from "@/lib/site";
import { products } from "@/lib/products";
import { Survey } from "@/components/survey";
import {
  ButtonAnchor,
  ButtonLink,
  Section,
  SectionHeading,
} from "@/components/ui";

export default function HomePage() {
  return (
    <>
      <CoreHero />
      <Start />
      <Paths />
      <Founder />
      <Lounge />
    </>
  );
}

/**
 * The survey, directly under the core.
 *
 * It lost the top of the screen to the core, so it takes the first full band
 * instead — still the first thing a visitor can act on, and still one screen
 * from the top on a phone.
 */
function Start() {
  return (
    <Section tone="panel">
      <div className="grid items-start gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
        <div>
          <h2 className="font-display text-2xl font-bold leading-tight sm:text-3xl">
            Tiga soalan, kemudian satu cadangan
          </h2>
          <p className="mt-3 leading-relaxed text-text-muted">
            Bukan borang pendaftaran. Tiada e-mel diminta, dan jawapan awak
            tidak dihantar ke mana-mana sehingga awak sendiri menekan WhatsApp.
          </p>
          <p className="mt-5 text-sm leading-relaxed text-text-faint">
            {site.riskLine}
          </p>
        </div>
        <Survey />
      </div>
    </Section>
  );
}

/** The two destinations, as dense tiles rather than long marketing cards. */
function Paths() {
  return (
    <Section id="jalan" tone="base">
      <SectionHeading
        title="Dua jalan"
        lead="Yang memisahkan bukan produk, tetapi berapa banyak masa awak ada dan sama ada awak mahu faham."
      />
      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <PathTile
          kicker="Kalau awak mahu faham"
          title="Belajar trade sendiri"
          body="Awak baca pasaran, awak tekan butang. Tiga kursus, dan signal sebagai sokongan."
          meta="Perlu sejam dua sehari"
          href="/belajar"
        />
        <PathTile
          kicker="Kalau awak tiada masa"
          title="Trading automatik"
          body="Sistem berjalan pada akaun awak sendiri. Akaun dan modal kekal milik awak."
          meta="Kurang 30 minit sehari"
          href="/automatik"
          accent
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {products.map((p) => (
          <Link
            key={p.slug}
            href={`/${p.slug}`}
            className="flex items-center justify-between gap-4 rounded-xl bg-panel px-5 py-4 ring-1 ring-line transition-colors hover:ring-line-strong"
          >
            <span>
              <span className="block font-semibold">{p.label}</span>
              <span className="block text-sm text-text-faint">{p.brand}</span>
            </span>
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="h-5 w-5 shrink-0 text-text-faint"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="m9 5 7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>
    </Section>
  );
}

function PathTile({
  kicker,
  title,
  body,
  meta,
  href,
  accent = false,
}: {
  kicker: string;
  title: string;
  body: string;
  meta: string;
  href: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex flex-col rounded-2xl p-6 ring-1 transition-colors ${
        accent
          ? "bg-raised ring-line-strong hover:ring-sky"
          : "bg-panel ring-line hover:ring-line-strong"
      }`}
    >
      <p className="text-sm font-semibold text-sky">{kicker}</p>
      <h3 className="mt-2 font-display text-2xl font-bold leading-tight">
        {title}
      </h3>
      <p className="mt-3 flex-1 leading-relaxed text-text-muted">{body}</p>
      <p className="mt-5 flex items-center gap-2 text-sm font-semibold text-text">
        {meta}
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        >
          <path d="m9 5 7 7-7 7" />
        </svg>
      </p>
    </Link>
  );
}

/**
 * Founder panel.
 *
 * The portrait was shot on white, so it is framed on a light surface rather
 * than knocked out — a cut-out of a full-length studio shot would fray at the
 * hair and the chair legs, and a deliberate light panel inside a dark app
 * reads as a choice rather than an accident.
 */
function Founder() {
  return (
    <Section tone="panel">
      <div className="overflow-hidden rounded-2xl bg-mist ring-1 ring-line">
        <div className="grid items-end gap-0 sm:grid-cols-[1fr_0.85fr]">
          <div className="p-7 sm:p-10">
            <p className="text-sm font-semibold text-navy/60">
              {site.founder.role}
            </p>
            <h2 className="mt-2 font-display text-3xl font-extrabold leading-tight text-navy sm:text-4xl">
              {site.founder.name}
            </h2>
            <p className="mt-4 max-w-sm leading-relaxed text-navy/70">
              Setiap kelas, setiap video dan setiap sistem di sini datang
              daripada satu orang yang namanya ada di atas. Kalau ada yang tak
              kena, awak tahu siapa nak ditanya.
            </p>
            <div className="mt-7 flex flex-wrap gap-2.5">
              <ButtonLink
                href="/tentang"
                className="bg-navy text-mist hover:bg-navy/90"
                variant="ghost"
              >
                Tentang Asri
              </ButtonLink>
              <ButtonAnchor
                href={waLink()}
                target="_blank"
                rel="noopener noreferrer"
                variant="ghost"
                className="text-navy ring-1 ring-navy/20 hover:bg-navy/5"
              >
                WhatsApp
              </ButtonAnchor>
            </div>
          </div>

          <div className="relative mx-auto h-72 w-full max-w-xs sm:h-96 sm:max-w-none">
            <Image
              src={site.founder.portrait}
              alt={site.founder.name}
              fill
              sizes="(min-width: 640px) 24rem, 20rem"
              className="object-contain object-bottom"
            />
          </div>
        </div>
      </div>
    </Section>
  );
}

function Lounge() {
  return (
    <Section tone="base">
      <SectionHeading
        title="Traders Lounge"
        lead="Video, tutorial, webinar dan kelas — semuanya di satu tempat."
      />
      <div className="mt-6 rounded-2xl border border-dashed border-line-strong bg-panel p-8 text-center">
        <p className="mx-auto max-w-sm leading-relaxed text-text-muted">
          Pustaka sedang disiapkan. Video pertama dan jadual webinar akan
          diumumkan tidak lama lagi.
        </p>
        <div className="mt-5 flex justify-center">
          <ButtonAnchor
            href={waLink("Hi, beritahu saya bila video dan webinar Traders Lounge bermula.")}
            target="_blank"
            rel="noopener noreferrer"
            variant="panel"
          >
            Beritahu saya bila ia bermula
          </ButtonAnchor>
        </div>
      </div>
    </Section>
  );
}
