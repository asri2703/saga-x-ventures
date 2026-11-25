"use client";

import Image from "next/image";
import { useId, useState } from "react";

/**
 * The reasons, as a showcase.
 *
 * Shape from the feature-showcase component the owner chose: copy down the
 * left, a picture panel down the right, and the other pictures sitting over
 * the foot of it as the way through.
 *
 * The source keeps two controls — an accordion on the left, tabs on the
 * right — because there the steps and the pictures are different content.
 * Here they are the same four things, so there is one state and two ways to
 * move it. Two independent controls over four items would have let the page
 * show reason two beside picture four.
 *
 * The source's tabs carry the four names in text, which is right for its
 * one-word labels and wrong for these: four phrases wrap to two rows inside
 * a panel this wide. The pictures are their own labels instead, and the
 * names are already down the left.
 *
 * The pictures tell the reader nothing the copy does not, so they take empty
 * alt text: a screen reader meets each reason once, not twice.
 */

export type Reason = {
  title: string;
  body: string;
  /** A file in `public/reasons/`. Its `-thumb` twin is the picker. */
  image: string;
};

export function ReasonShowcase({ reasons }: { reasons: Reason[] }) {
  const [open, setOpen] = useState(0);
  const base = useId();

  return (
    <div className="show-grid">
      {/* ---------------------------------------------------------------
          The copy. One body at a time: four at once is the 2x2 grid of
          tiles this replaced, stood on its end.
      --------------------------------------------------------------- */}
      <div className="show-list" data-reveal>
        {reasons.map((reason, index) => {
          const isOpen = open === index;
          return (
            <div
              key={reason.title}
              className="show-row"
              data-open={isOpen || undefined}
            >
              <h3>
                <button
                  type="button"
                  id={`${base}-head-${index}`}
                  aria-expanded={isOpen}
                  aria-controls={`${base}-body-${index}`}
                  onClick={() => setOpen(index)}
                  className="show-head"
                >
                  <span>{reason.title}</span>
                  {/* Drawn, not typed: a glyph brings the font's own metrics
                      and sits off centre against the line it belongs to. */}
                  <span aria-hidden className="show-sign" />
                </button>
              </h3>
              <div
                id={`${base}-body-${index}`}
                role="region"
                aria-labelledby={`${base}-head-${index}`}
                hidden={!isOpen}
                className="pb-6 pr-10 leading-relaxed text-pine-soft"
              >
                {reason.body}
              </div>
            </div>
          );
        })}
      </div>

      {/* ---------------------------------------------------------------
          The picture. All four stay mounted and stacked, so a switch is an
          opacity change on something already decoded rather than a request.
      --------------------------------------------------------------- */}
      <div className="show-panel" data-reveal>
        {reasons.map((reason, index) => (
          <Image
            key={reason.image}
            src={`/reasons/${reason.image}`}
            alt=""
            fill
            sizes="(max-width: 64rem) 100vw, 30rem"
            priority={index === 0}
            className="show-shot"
            data-on={open === index || undefined}
          />
        ))}

        <div className="show-thumbs">
          {reasons.map((reason, index) => (
            <button
              key={reason.title}
              type="button"
              onClick={() => setOpen(index)}
              className="show-thumb"
              data-on={open === index || undefined}
              /* The headings down the left are the labelled controls. These
                 move the same state and would be announced a second time. */
              aria-hidden
              tabIndex={-1}
            >
              <Image
                src={`/reasons/${reason.image.replace(".webp", "-thumb.webp")}`}
                alt=""
                width={240}
                height={180}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
