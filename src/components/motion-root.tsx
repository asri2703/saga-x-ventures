"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Drives every scroll reveal on the site.
 *
 * Server components opt in by adding `data-reveal` to an element — no client
 * boundary, no wrapper component, no extra bundle per section. This one
 * observer picks them all up, so adding motion to a section costs nothing but
 * an attribute.
 *
 * Stagger a group by setting `--reveal-delay` per child:
 *   <li data-reveal style={{ "--reveal-delay": `${i * 70}ms` }}>
 *
 * Renders nothing.
 */
export function MotionRoot() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;

    // Honour the OS setting. Without motion-ready the reveal CSS never
    // matches, so everything renders in its final state immediately.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;

    root.classList.add("motion-ready");

    const targets = document.querySelectorAll<HTMLElement>("[data-reveal]");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-visible");
          // Reveal once. Re-animating on every scroll past is a distraction,
          // not a feature.
          observer.unobserve(entry.target);
        }
      },
      {
        // Start the reveal slightly before the element reaches the fold, so it
        // is settled by the time the reader's eye arrives.
        rootMargin: "0px 0px -12% 0px",
        threshold: 0.05,
      },
    );

    for (const target of targets) {
      // Anything already on screen at load (the hero) should not fade in —
      // that reads as a slow page, not a polished one.
      if (target.getBoundingClientRect().top < window.innerHeight * 0.9) {
        target.classList.add("is-visible");
        continue;
      }
      observer.observe(target);
    }

    return () => observer.disconnect();
    // Re-scan after client-side navigation, when the DOM is entirely new.
  }, [pathname]);

  return null;
}
