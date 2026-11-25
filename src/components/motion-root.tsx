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

      /* ---------------------------------------------------------------
         The hash landing.

         A visitor who opens /copytrade#steps arrives with the page already
         scrolled there. The browser's jump is a native scroll, and Lenis is
         what drives `ScrollTrigger.update` here, so nothing told the
         triggers the view had moved: every reveal in that section stayed at
         zero and the reader met an empty band. The hero's only call to
         action is such a link, so this is the common case, not the odd one.

         A refresh on the next frame re-measures against where the page
         actually is and fires whatever is already in view.
      --------------------------------------------------------------- */
      /* ---------------------------------------------------------------
         The landing, measured a second time.

         The pass above runs the moment these chunks arrive, and on a hash
         landing the browser has not jumped yet: /copytrade#steps mounts at
         the top, every section below is "held", and then the page moves to
         the anchor by a native scroll Lenis never performed and therefore
         never reported. The triggers go on believing the view is at the top
         and the section the visitor actually landed on stays at zero. The
         hero's only call to action is such a link.

         So the same question is asked again once the page has settled: is
         this still below the fold? Anything that is not is simply shown.
         It does not go through ScrollTrigger, because what is wrong in that
         moment is ScrollTrigger's idea of where the page is.
      --------------------------------------------------------------- */
      const settle = window.setTimeout(() => {
        const nowFold = window.innerHeight * 0.9;
        for (const el of held) {
          if (el.getBoundingClientRect().top < nowFold) {
            gsap.set(el, { opacity: 1, y: 0 });
          }
        }
        ScrollTrigger.refresh();
      }, 250);

      teardown = () => {
        window.clearTimeout(settle);
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
