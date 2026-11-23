import type { CSSProperties } from "react";
import { retailProducts } from "@/lib/products";

/**
 * The scrolling stack of product names at the foot of the hero.
 *
 * Built from the owner's reference, which was a 7.5 MB animated GIF in black
 * and white. Rebuilt in CSS instead for three reasons: the GIF would have
 * been the heaviest asset on the page by an order of magnitude and sits
 * exactly where the largest paint happens; it was black, which is not a
 * colour this site owns; and a GIF cannot be stilled for someone who asked
 * for less movement.
 *
 * The names are read from `products.ts` rather than written out here, so a
 * product that is renamed or retired does not leave a ghost scrolling under
 * the hero.
 */
export function ProductTicker() {
  const names = retailProducts.map((p) => p.name);
  /* Twice, so the track can translate exactly one copy's height and start
     over with no seam. */
  const loop = [...names, ...names, ...names, ...names];

  return (
    /* Decoration. Every one of these names is already a link in the header
       and again in the fork below, so announcing them a third time would
       make a screen reader read the catalogue twice over. */
    <div aria-hidden className="ticker">
      <div className="ticker-track">
        {loop.map((name, i) => (
          <span
            key={i}
            className="ticker-pill"
            /* Three angles rather than two, so the stack does not fall into
               a visible zig-zag the eye can finish for itself. */
            style={
              { "--tilt": `${[-3.2, 2.4, -1.6, 3][i % 4]}deg` } as CSSProperties
            }
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}
