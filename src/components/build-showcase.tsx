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
  /**
   * The owner's own numeral.
   *
   * It is not a sequence — these three are not steps and can be read in any
   * order — so the number is set at label size beside the product name
   * rather than as the large marker a stepped process would earn.
   */
  n: string;
  /** The product the screen belongs to. */
  label: string;
  title: string;
  /** The owner's line for it. His copy, kept as he sent it. */
  body: string;
  shots: Shot[];
};

const cards: BuildCard[] = [
  {
    key: "signal",
    n: "01",
    label: "Mastery Signal",
    title: "Everything I’ve learned, in one signal.",
    body: "Years of trading knowledge and real market experience, turned into clear and actionable signals.",
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
    n: "02",
    label: "Mastery Signal",
    title: "It’s all about creativity and flexibility.",
    body: "Trading tools built to give you more freedom, better insights, and a different way to read the market.",
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
    n: "03",
    label: "Fukyaa",
    /* The owner wrote "We've got you". The page speaks as one person
       everywhere else, and he moved the hero off "we" himself two commits
       ago, so the pronoun follows that decision rather than reintroducing
       the one he removed. */
    title: "No time to trade? I’ve got you.",
    body: "Automated trading made easier. Let the system handle the execution while you stay in control.",
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

export function BuildShowcase() {
  return (
    <div className="mt-14 grid gap-6 lg:grid-cols-3">
      {cards.map((card) => (
        <article
          key={card.key}
          /* The stagger across the three is no longer set here. GSAP batches
             everything that crosses the fold together and staggers the batch,
             so three cards in a row stagger because they are a row, and the
             per-card delay this used to carry would now be added on top of
             it. */
          data-reveal
          className="panel flex flex-col overflow-hidden p-7 sm:p-8"
        >
          <p className="text-sm text-pine-faint">
            <span className="tnum">{card.n}</span>
            <span className="mx-2 text-rule-strong">&mdash;</span>
            <span className="font-semibold text-pine-soft">{card.label}</span>
          </p>
          {/* A floor under the title only where the three sit side by side:
              two of them wrap to a second line and one does not, and without
              it the three screens below started at three different heights. */}
          <h3 className="display mt-3 text-xl leading-snug text-pine lg:min-h-[3.5rem]">
            {card.title}
          </h3>

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

          {/* `mt-auto` holds the three lines on one baseline across the row
              even where a title runs to two lines and its neighbour runs to
              one. */}
          <p className="mt-auto pt-7 leading-relaxed text-pine-soft">
            {card.body}
          </p>
        </article>
      ))}
    </div>
  );
}
