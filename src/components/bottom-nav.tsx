"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Phone tab bar.
 *
 * The thing that most separates an app from a page is that the way around is
 * always within thumb reach — you never scroll back up to a menu. Four
 * destinations, because a fifth starts to crowd and none of the remaining
 * pages earn a permanent slot.
 *
 * Hidden from md up, where the top bar does this job with more room.
 */
const tabs = [
  {
    href: "/mula",
    label: "Mula",
    icon: (
      <>
        <path d="M12 3 3 10v10a1 1 0 0 0 1 1h5v-6h6v6h5a1 1 0 0 0 1-1V10Z" />
      </>
    ),
  },
  {
    href: "/belajar",
    label: "Belajar",
    icon: (
      <>
        <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5Z" />
        <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5Z" />
      </>
    ),
  },
  {
    href: "/automatik",
    label: "Automatik",
    icon: <path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12Z" />,
  },
  {
    href: "/lounge",
    label: "Lounge",
    icon: (
      <>
        <rect x="3" y="5" width="18" height="13" rx="2.5" />
        <path d="M10.5 9.5v4l3.5-2Z" />
      </>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-base/95 backdrop-blur-md md:hidden"
      // Keep the bar clear of the home indicator on phones that have one.
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex">
        {tabs.map((tab) => {
          const active =
            pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors ${
                  active ? "text-sky" : "text-text-faint hover:text-text-muted"
                }`}
              >
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  className="h-[22px] w-[22px]"
                  fill={active ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                >
                  {tab.icon}
                </svg>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
