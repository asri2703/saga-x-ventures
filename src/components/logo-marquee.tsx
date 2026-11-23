import Image from "next/image";

/**
 * The logo strip under the hero.
 *
 * Two copies of the same row translate sideways by exactly half the track, so
 * the loop lands on an identical frame and has no seam. The movement sits
 * behind `prefers-reduced-motion: no-preference`; asked for less, a visitor
 * gets the row standing still rather than a faster version of it.
 *
 * Every logo is rendered into a box of one size with `object-contain`. The
 * source marks range from 7.5:1 (a long wordmark) to 3.4:1 (a square-ish
 * mark), so a fixed height alone would have made the wordmarks enormous and a
 * fixed width would have made the tall ones tower. A uniform slot is what
 * keeps them looking the same weight.
 */

const logos = [
  { slug: "mastery-signal", name: "Mastery Signal" },
  { slug: "fukyaa", name: "Fukyaa" },
  { slug: "puek-scalper", name: "Puek Scalper" },
  { slug: "harmovest-capital", name: "Harmovest Capital" },
  { slug: "bingx", name: "BingX" },
  { slug: "fxtm", name: "FXTM" },
  { slug: "infinox", name: "INFINOX" },
] as const;

function Row({ copy }: { copy: 1 | 2 }) {
  return (
    <ul className="flex shrink-0 items-center">
      {logos.map((logo) => (
        <li key={logo.slug} className="flex w-40 justify-center px-5 sm:w-52">
          <Image
            src={`/logos/${logo.slug}.png`}
            /* The second copy exists only so the loop has no visible join.
               Named, it would have a screen reader read the same seven
               brands twice over. */
            alt={copy === 1 ? logo.name : ""}
            aria-hidden={copy === 2 || undefined}
            width={180}
            height={48}
            /* Softened, not recoloured. Pine would match the palette better,
               but a broker's mark is their property and most brand terms say
               to use it as supplied; opacity leaves the file untouched and is
               reversible. It is enough to stop seven black marks reading as a
               second, colder black beside the pine. */
            className="h-7 w-auto max-w-full object-contain opacity-80 sm:h-8"
          />
        </li>
      ))}
    </ul>
  );
}

export function LogoMarquee() {
  return (
    <div className="logo-marquee">
      <div className="logo-marquee-track">
        <Row copy={1} />
        <Row copy={2} />
      </div>
    </div>
  );
}
