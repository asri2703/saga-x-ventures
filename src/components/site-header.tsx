"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { products } from "@/lib/products";
import { site } from "@/lib/site";
import { Logo } from "@/components/logo";

const navLinks = [
  { href: "/events", label: "Events" },
  { href: "/blog", label: "Writing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  // Closing on link click (rather than watching the pathname in an effect)
  // avoids a cascading re-render on every navigation.
  const close = () => setOpen(false);

  // Stop the page scrolling behind the open mobile menu.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    // Escape closes the menu — expected of any overlay, and the only way out
    // for someone navigating by keyboard.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    // The panel is md:hidden, so widening past the breakpoint hides it while
    // `open` stays true — leaving the body scroll-locked with no visible way
    // to release it. Close on the breakpoint crossing instead.
    const desktop = window.matchMedia("(min-width: 768px)");
    const onBreakpoint = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onBreakpoint);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onBreakpoint);
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-rule bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link
            href="/"
            className="flex items-center gap-2.5"
            aria-label={`${site.name} — home`}
          >
            <Logo className="h-8 w-8" />
            <span className="display text-[15px] text-pine">{site.name}</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {/* Products opens a menu because none of the three is one click —
                each needs a broker account first, and saying so here stops a
                visitor bouncing off a signup form they cannot complete. */}
            <div className="group relative">
              <button
                type="button"
                aria-haspopup="true"
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-pine-soft transition-colors hover:text-pine"
              >
                Products
                <svg
                  aria-hidden
                  viewBox="0 0 12 12"
                  className="h-3 w-3 transition-transform group-hover:rotate-180 group-focus-within:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M2.5 4.5 6 8l3.5-3.5" />
                </svg>
              </button>

              <div className="invisible absolute left-1/2 top-full w-80 -translate-x-1/2 pt-2 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <ul className="overflow-hidden border border-rule bg-paper-raised p-1.5 shadow-lg shadow-pine/10">
                  {products.map((product) => (
                    <li key={product.key}>
                      <Link
                        href={product.href}
                        className="block px-3 py-2.5 transition-colors hover:bg-paper-sunk"
                      >
                        <span className="block text-sm font-semibold text-pine">
                          {product.name}
                        </span>
                        <span className="mt-0.5 block text-xs text-pine-faint">
                          {product.forWho}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm text-pine-soft transition-colors hover:text-pine"
              >
                {link.label}
              </Link>
            ))}

            {/* Quiet on purpose. Ruby marks the one thing to do next, once
                per screen — and on every page except the homepage that one
                thing is in the page, not in the chrome. A ruby button here
                would compete with it on every single view. */}
            <Link
              href="/coaching"
              className="ml-3 border border-pine px-4 py-2 text-sm font-semibold text-pine transition-colors hover:bg-pine hover:text-paper"
            >
              Start here
            </Link>
          </nav>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="-mr-2 p-2 text-pine md:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden
            >
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile panel. Positioned below the 4rem header and sized with dvh so
          it fills the screen on phones whose browser chrome changes height —
          vh alone collapsed this panel on a previous build. */}
      {open ? (
        <div
          id="mobile-menu"
          className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto border-t border-rule bg-paper px-5 py-6 md:hidden"
        >
          <p className="text-xs uppercase tracking-wide text-pine-faint">
            Products
          </p>
          <ul className="mt-3 space-y-1">
            {products.map((product) => (
              <li key={product.key}>
                <Link
                  href={product.href}
                  onClick={close}
                  className="block border-b border-rule py-3"
                >
                  <span className="block font-semibold text-pine">
                    {product.name}
                  </span>
                  <span className="mt-0.5 block text-sm text-pine-faint">
                    {product.forWho}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <ul className="mt-6 space-y-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={close}
                  className="block border-b border-rule py-3 text-pine"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <Link
            href="/coaching"
            onClick={close}
            className="mt-8 block border border-pine px-5 py-3.5 text-center text-base font-semibold text-pine"
          >
            Start here
          </Link>
        </div>
      ) : null}
    </>
  );
}
