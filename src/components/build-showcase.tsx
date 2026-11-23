import type { CSSProperties } from "react";
import Image from "next/image";

/**
 * What the products actually look like.
 *
 * The shape is taken from the feature grid the owner chose: a headline on the
 * left with the description and action beside it, then a row of cards that
 * each hold a label, one sentence, a screen, and the two things that screen
 * does. The reference drew its screens as animated fakes. These are the real
 * ones, exported from the live products, which is the only reason this
 * section is worth having — a drawing of an interface proves nothing.
 *
 * Palette, type and radius are this site's own. Nothing of the reference's
 * skin came across.
 */

type Shot = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /**
   * How wide the screen sits in its box, as utilities.
   *
   * The three screens were exported at three different aspect ratios. Sized
   * to the box they all render at the same width and therefore three
   * different heights, which leaves a band of empty panel under the widest
   * one. Sizing them so each is cut at the same depth is what makes the row
   * read as one set.
   */
  box?: string;
};

type BuildCard = {
  key: string;
  /** The product the screen belongs to. */
  label: string;
  title: string;
  /** What the screen does. Two lines, because a third is never read. */
  does: [string, string];
  shots: Shot[];
};

const cards: BuildCard[] = [
  {
    key: "signal",
    label: "Mastery Signal",
    title: "Every signal arrives with its levels",
    does: [
      "Entry, stop loss and three targets, each one copyable.",
      "The card keeps updating after the signal is sent, so you can see where price went.",
    ],
    shots: [
      {
        src: "/shots/mastery-signal-card.png",
        alt: "A Mastery Signal card for XAUUSD showing the entry price, stop loss and three take-profit levels.",
        width: 748,
        height: 1000,
      },
    ],
  },
  {
    key: "zones",
    label: "Mastery Signal",
    title: "Check the call before you take it",
    does: [
      "Buy and sell zones drawn on the chart you already read.",
      "Trend, momentum, structure and zones scored per timeframe.",
    ],
    shots: [
      {
        src: "/shots/mastery-zone-chart.png",
        alt: "An M15 gold chart with the buy and sell zones shaded.",
        width: 1018,
        height: 688,
      },
      {
        src: "/shots/mastery-ai-score.png",
        alt: "The AI market score panel, breaking a timeframe into trend, momentum, structure and zones.",
        width: 1040,
        height: 812,
      },
    ],
  },
  {
    key: "fukyaa",
    label: "Fukyaa",
    title: "Watch the robot from one screen",
    does: [
      "Daily profit and loss, deepest drawdown and lots traded, side by side.",
      "Your licence keys and MT5 accounts, added and renewed yourself.",
    ],
    shots: [
      {
        src: "/shots/fukyaa-dashboard.png",
        box: "-left-[4%] w-[108%]",
        alt: "The Fukyaa dashboard showing thirty days of profit and loss, drawdown, lots traded and the accounts under licence.",
        width: 982,
        height: 714,
      },
    ],
  },
];

/** The tick beside a line. Decorative — the line itself carries the meaning. */
function Tick() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-[0.3rem] h-3.5 w-3.5 shrink-0 text-ruby"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function BuildShowcase() {
  return (
    <div className="mt-14 grid gap-6 lg:grid-cols-3">
      {cards.map((card, i) => (
        <article
          key={card.key}
          data-reveal
          /* The stagger is the one piece of the reference's motion kept. It
             runs on the existing reveal system rather than a second set of
             keyframes, so a visitor who asked for less movement is already
             covered by the rule that system sits behind. */
          style={{ "--reveal-delay": `${i * 90}ms` } as CSSProperties}
          className="panel flex flex-col overflow-hidden p-7 sm:p-8"
        >
          <p className="text-sm font-semibold text-pine-faint">{card.label}</p>
          <h3 className="display mt-2 text-xl text-pine">{card.title}</h3>

          {/* The screens. Cut off at the bottom on purpose: a product screen
              shrunk until all of it fits is a screen nobody can read. The cut
              is a fade rather than an edge, so it reads as a screen
              continuing past the card instead of one that failed to load. */}
          <div
            className="relative mt-7 h-56 overflow-hidden sm:h-60"
            style={{
              maskImage:
                "linear-gradient(to bottom, #000 76%, rgba(0,0,0,0.25) 94%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, #000 76%, rgba(0,0,0,0.25) 94%, transparent 100%)",
            }}
          >
            {card.shots.length === 1 ? (
              <Image
                src={card.shots[0].src}
                alt={card.shots[0].alt}
                width={card.shots[0].width}
                height={card.shots[0].height}
                sizes="(min-width: 1024px) 360px, (min-width: 640px) 560px, 90vw"
                className={`absolute top-0 rounded-xl shadow-[0_18px_40px_rgba(22,58,48,0.12)] ${
                  card.shots[0].box ?? "inset-x-0 w-full"
                }`}
              />
            ) : (
              <>
                <Image
                  src={card.shots[0].src}
                  alt={card.shots[0].alt}
                  width={card.shots[0].width}
                  height={card.shots[0].height}
                  sizes="(min-width: 1024px) 320px, (min-width: 640px) 480px, 80vw"
                  className="absolute left-0 top-0 w-[88%] rounded-xl shadow-[0_18px_40px_rgba(22,58,48,0.12)]"
                />
                {/* The second screen overlaps the first, the way the two sit
                    on top of each other in the product itself: the score is
                    read against the chart, not instead of it. */}
                <Image
                  src={card.shots[1].src}
                  alt={card.shots[1].alt}
                  width={card.shots[1].width}
                  height={card.shots[1].height}
                  sizes="(min-width: 1024px) 300px, (min-width: 640px) 440px, 72vw"
                  className="absolute right-0 top-28 w-[82%] rounded-xl shadow-[0_18px_40px_rgba(22,58,48,0.16)]"
                />
              </>
            )}
          </div>

          <ul className="mt-auto flex flex-col gap-3 pt-7">
            {card.does.map((line) => (
              <li
                key={line}
                className="flex gap-3 text-sm leading-relaxed text-pine-soft"
              >
                <Tick />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}
