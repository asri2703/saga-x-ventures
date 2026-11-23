"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Drives the page's motion: every scroll reveal, and the smooth scroll.
 *
 * Server components opt in by adding `data-reveal` to an element — no client
 * boundary, no wrapper component, no extra bundle per section. One batched
 * ScrollTrigger picks them all up, so adding motion to a section still costs
 * nothing but an attribute.
 *
 * Three things are worth knowing before changing any of this.
 *
 * 1. GSAP and Lenis are loaded on demand, inside the effect, and never on the
 *    server. They are roughly 70 KB together, which is not something to put
 *    in the first paint of a page whose job is to be read.
 *
 * 2. `motion-ready` is added only after both have loaded. The CSS that hides
 *    a revealed element lives behind that class, so if the import fails, the
 *    network drops, or JavaScript is off entirely, the selector never matches
 *    and the page renders plainly visible. Content is never hostage to an
 *    animation. `voice.test.ts` holds that rule.
 *
 * 3. Nothing starts at all under `prefers-reduced-motion: reduce` — no
 *    reveals, and no smooth scroll either. Smoothing is motion the visitor did
 *    not ask for, applied to the one gesture they cannot avoid, so it is the
 *    first thing that should go when they have asked for less of it.
 *
 * Renders nothing.
 */
export function MotionRoot() {
  const pathname = usePathname();

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;

    let cancelled = false;
    let teardown: (() => void) | null = null;

    void (async () => {
      const [{ gsap }, { ScrollTrigger }, { default: Lenis }] =
        await Promise.all([
          import("gsap"),
          import("gsap/ScrollTrigger"),
          import("lenis"),
        ]);

      // The effect was cleaned up while the chunks were in flight — a route
      // change on a slow connection. Starting now would leave a ticker and a
      // scroll listener behind with nothing to clean them up.
      if (cancelled) return;

      gsap.registerPlugin(ScrollTrigger);

      const root = document.documentElement;
      root.classList.add("motion-ready");

      /* ---------------------------------------------------------------
         Smooth scroll.

         `duration` is deliberately short. The default settles over about a
         second, which on a long page means the view is still moving when the
         reader has stopped asking it to, and that reads as lag rather than
         polish. `anchors` routes the in-page links — the header, "See which
         one fits", the fork — through the same easing instead of jumping,
         It takes no offset of its own, because Lenis honours
         `scroll-margin-top` and every linkable section already carries it as
         `scroll-mt-20`. Passing one as well landed each anchor 168px down the
         screen: the section's own 80 plus the header's height a second time.
      --------------------------------------------------------------- */
      const lenis = new Lenis({
        duration: 0.9,
        easing: (t) => 1 - Math.pow(1 - t, 3),
        anchors: true,
      });

      // Lenis moves the page outside the browser's own scroll, so
      // ScrollTrigger has to be told when that happened or every trigger
      // fires at the wrong moment.
      lenis.on("scroll", ScrollTrigger.update);

      // One loop, not two. GSAP's ticker already runs a frame loop, so Lenis
      // is driven from it rather than from a second requestAnimationFrame.
      const raf = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(raf);
      // The ticker's lag smoothing exists to protect tweens from a stalled
      // tab. Applied to a scroll position it makes the page lurch to catch up.
      gsap.ticker.lagSmoothing(0);

      /* ---------------------------------------------------------------
         Reveals.
      --------------------------------------------------------------- */
      const all = gsap.utils.toArray<HTMLElement>("[data-reveal]");

      // Anything already on screen at load should not fade in. A hero that
      // arrives late reads as a slow page, not a polished one.
      const fold = window.innerHeight * 0.9;
      const held: HTMLElement[] = [];
      for (const el of all) {
        if (el.getBoundingClientRect().top < fold) {
          gsap.set(el, { opacity: 1, y: 0 });
        } else {
          held.push(el);
        }
      }

      const triggers = ScrollTrigger.batch(held, {
        start: "top 88%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "power2.out",
            // Items that cross the line together are staggered as a group,
            // which is what the row of product cards and the roles list are.
            // A single panel has nothing to stagger against and just runs.
            stagger: 0.09,
            overwrite: true,
          }),
      });

      teardown = () => {
        for (const trigger of triggers) trigger.kill();
        gsap.ticker.remove(raf);
        lenis.destroy();
        root.classList.remove("motion-ready");
      };
    })();

    return () => {
      cancelled = true;
      teardown?.();
    };
    // Re-scan after client-side navigation, when the DOM is entirely new.
  }, [pathname]);

  return null;
}
