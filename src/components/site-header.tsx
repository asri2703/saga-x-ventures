"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { products } from "@/lib/products";
import { site, waLink } from "@/lib/site";
import { ButtonAnchor } from "@/components/ui";
import { Logo } from "@/components/logo";

const navLinks = [
  { href: "/coaching", label: "Coaching" },
  { href: "/blog", label: "Insights" },
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
      <header className="sticky top-0 z-50 border-b border-line/70 bg-ink/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5"
          aria-label={`${site.name} — home`}
        >
          <Logo className="h-8 w-8" />
          <span className="text-[15px] font-semibold tracking-tight text-body">
            {site.name}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {/* Products gets a dropdown so every service page is one click from
              anywhere — good for users, good for internal linking. */}
          <div className="group relative">
            <Link
              href="/coaching"
              className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm text-muted transition-colors hover:text-body"
            >
              Products
              <svg
                aria-hidden
                viewBox="0 0 12 12"
                className="h-3 w-3 transition-transform group-hover:rotate-180"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m3 4.5 3 3 3-3" />
              </svg>
            </Link>
            <div className="invisible absolute left-1/2 top-full w-64 -translate-x-1/2 pt-2 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              <ul className="overflow-hidden rounded-xl border border-line bg-elevated p-1.5 shadow-2xl shadow-black/50">
                {products.map((s) => (
                  <li key={s.key}>
                    <Link
                      href={s.href}
                      className="block rounded-lg px-3 py-2.5 text-sm text-muted transition-colors hover:bg-surface hover:text-body"
                    >
                      {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {navLinks.slice(1).map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full px-4 py-2 text-sm text-muted transition-colors hover:text-body"
            >
              {l.label}
            </Link>
          ))}

          <ButtonAnchor
            href={waLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-3"
          >
            Get a free audit
          </ButtonAnchor>
        </nav>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          className="-mr-2 rounded-lg p-2 text-body md:hidden"
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
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

      {/*
        Mobile menu — deliberately a sibling of <header>, not a child.
        The header carries backdrop-blur, and any backdrop-filter makes an
        element the containing block for its fixed-position descendants. Nested
        inside, this panel resolved top-16/bottom-0 against the 64px header
        instead of the viewport and collapsed to zero height: the button
        toggled, the state changed, and nothing appeared.
      */}
      {open ? (
        <div
          id="mobile-menu"
          className="fixed inset-x-0 top-16 bottom-0 z-50 overflow-y-auto border-t border-line bg-ink px-5 py-6 md:hidden"
        >
          <nav aria-label="Mobile">
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.18em] text-faint">
              Products
            </p>
            <ul className="mb-6">
              {products.map((s) => (
                <li key={s.key}>
                  <Link
                    href={s.href}
                    onClick={close}
                    className="block rounded-lg px-3 py-3 text-base text-muted"
                  >
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="border-t border-line pt-4">
              {navLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={close}
                    className="block rounded-lg px-3 py-3 text-base font-medium text-body"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <ButtonAnchor
            href={waLink()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={close}
            size="lg"
            className="mt-6 w-full"
          >
            Get a free audit
          </ButtonAnchor>
        </div>
      ) : null}
    </>
  );
}
