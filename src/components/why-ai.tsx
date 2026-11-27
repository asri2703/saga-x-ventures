"use client";

import Image from "next/image";
import { useId, useState } from "react";

/**
 * Why use AI Auto Trade: four reasons, one open at a time, each with a
 * picture in the panel beside it.
 *
 * The owner chose watermelon's `feature-2` block: words on the left — a
 * pill, a heading, a paragraph, an accordion — and a recessed panel on the
 * right. The shape is kept and the code is not. That block is built on
 * shadcn's card, button and accordion, which would have pulled a second
 * design system into a site that already has one: `bg-background`,
 * `text-muted-foreground` and a Radix accordion describe colours and
 * behaviour this project defines for itself. What arrived instead is the
 * same arrangement in this site's own vocabulary.
 *
 * Two things in the original are deliberately gone. Its panel holds floating
 * cards reading "72%", "Tasks Completed: 124", "Efficiency: +12%" — invented
 * figures, which on a page whose other numbers come from a live MT5 feed
 * would be the only made-up ones on it. And its accordion lays two items
 * side by side; four reasons in that arrangement is a row of slivers. So the
 * panel holds a picture that changes with the open reason, and the accordion
 * is a column.
 *
 * The pictures are the owner's own, in the site's palette. They are
 * illustrations of the sentence beside them, not screenshots and not
 * results: nothing in any of them is a figure from the record. They carry
 * an empty `alt` for that reason — the reason's own words are the text, and
 * a screen reader that heard both would hear the same thing twice.
 *
 * One reason is always open: the panel has to show something, and a closed
 * accordion beside an empty panel is a section that looks broken.
 */

/* 1200 x 900, the size they are stored at. */
const SHOT_W = 1200;
const SHOT_H = 900;

const REASONS = [
  {
    key: "time",
    title: "Less time on the chart",
    body: "Fukyaa handles the trading through the system, so you are not sitting in front of the screen all day.",
    src: "/why/time.webp",
  },
  {
    key: "rules",
    title: "Trades follow the system",
    body: "It follows the rules built into the system, not a decision made in a hurry at the moment the chart moves.",
    src: "/why/rules.webp",
  },
  {
    key: "orders",
    title: "No orders to place yourself",
    body: "Once it is connected to your broker account, Fukyaa places and closes the trades. There is nothing for you to click.",
    src: "/why/orders.webp",
  },
  {
    key: "yours",
    title: "The account stays yours",
    body: "It trades on your own broker account, opened in your name. You can watch everything it does from your side, and the money is never mine to touch.",
    src: "/why/yours.webp",
  },
];

/** One picture, at the size the panel or the open reason gives it. */
function Shot({ src }: { src: string }) {
  return (
    <Image
      src={src}
      alt=""
      width={SHOT_W}
      height={SHOT_H}
      className="whyai-shot"
      sizes="(min-width: 64rem) 32rem, 100vw"
    />
  );
}

export function WhyAi() {
  const id = useId();
  const [open, setOpen] = useState(REASONS[0].key);
  const shown = REASONS.find((reason) => reason.key === open) ?? REASONS[0];

  return (
    <div className="whyai">
      <div data-reveal>
        <p className="whyai-pill">
          <span className="whyai-dot" aria-hidden />
          Why use AI Auto Trade
        </p>
        <h2 className="display mt-5 text-4xl leading-tight text-pine">
          Four reasons I would not go back to trading by hand.
        </h2>
        <p className="mt-5 max-w-lg leading-relaxed text-pine-soft">
          The world has changed. AI helps with almost everything we do now,
          and trading is one more of them.
        </p>

        <div className="whyai-list">
          {REASONS.map((reason) => {
            const isOpen = reason.key === open;
            return (
              <div key={reason.key} className="whyai-item" data-open={isOpen}>
                <h3>
                  <button
                    type="button"
                    className="whyai-trigger"
                    aria-expanded={isOpen}
                    aria-controls={`${id}-${reason.key}`}
                    /* Clicking the open one leaves it open. Closing it would
                       empty the panel beside it. */
                    onClick={() => setOpen(reason.key)}
                  >
                    <span>{reason.title}</span>
                    <span className="whyai-chevron" aria-hidden />
                  </button>
                </h3>
                <div
                  id={`${id}-${reason.key}`}
                  className="whyai-body"
                  hidden={!isOpen}
                >
                  <p>{reason.body}</p>
                  {/* On a narrow window the panel is not beside this, so
                      the picture travels with the words it belongs to. */}
                  <div className="whyai-inline-art">
                    <Shot src={reason.src} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Announced by the open reason's own words, so it is decoration. */}
      <div className="whyai-panel" aria-hidden data-reveal>
        <div className="whyai-stage" key={shown.key}>
          <Shot src={shown.src} />
        </div>
      </div>
    </div>
  );
}
