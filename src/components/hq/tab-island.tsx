"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, type LucideIcon } from "lucide-react";
import { ADMIN_ITEMS, MAIN, SETTINGS } from "./hq-sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * HQ's navigation on a phone: a floating bar at the foot of the screen with
 * the four places people go most, and Settings for the rest. The sidebar takes
 * over from the md breakpoint up.
 */

type Tab = { name: string; href: string; icon: LucideIcon };

// Same places and names as the sidebar, so the two never drift apart. On the
// phone Overview, the home screen, sits in the middle under the thumb:
// Feeds, Economy, Overview, Smart Money, then Settings at the far right.
const PHONE_ORDER = ["/terminal", "/macro", "", "/cot"];
const TABS: Tab[] = PHONE_ORDER.map((href) => MAIN.find((m) => m.href === href)).filter(
  (t): t is (typeof MAIN)[number] => Boolean(t),
);

export function TabIsland({ base, admin = false }: { base: string; admin?: boolean }) {
  const MORE: (Tab & { soon?: boolean })[] = admin ? [...ADMIN_ITEMS, ...SETTINGS] : SETTINGS;
  const pathname = usePathname();
  const here = pathname.replace(/\/$/, "") || "/";
  const isActive = (href: string) => {
    const full = `${base}${href}` || "/";
    return here === full || (href !== "" && here.startsWith(`${full}/`));
  };
  const moreActive = MORE.some((m) => !m.soon && isActive(m.href));

  return (
    <nav
      aria-label="HQ"
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden"
    >
      <ul className="flex w-full max-w-md items-stretch justify-between gap-1 rounded-2xl border border-border/60 bg-dock p-1.5 shadow-[0_8px_24px_rgba(11,37,69,0.28)]">
        {TABS.map((t) => {
          const active = isActive(t.href);
          return (
            <li key={t.name} className="flex-1">
              <Link
                href={`${base}${t.href}` || "/"}
                aria-current={active ? "page" : undefined}
                title={t.name}
                className={cn(
                  "flex items-center justify-center rounded-xl py-3 transition-colors",
                  active ? "bg-dock-active text-dock-active-foreground" : "text-dock-foreground/75 active:bg-white/10",
                )}
              >
                <t.icon className="size-6" aria-hidden />
                <span className="sr-only">{t.name}</span>
              </Link>
            </li>
          );
        })}
        <li className="flex-1">
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "flex w-full items-center justify-center rounded-xl py-3 outline-none focus-visible:ring-2 focus-visible:ring-dock-active",
                moreActive ? "bg-dock-active text-dock-active-foreground" : "text-dock-foreground/75",
              )}
              title="Settings"
            >
              <Settings className="size-6" aria-hidden />
              <span className="sr-only">Settings</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="end" sideOffset={10} className="hq w-56">
              <DropdownMenuLabel>Settings</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {MORE.map((m) =>
                m.soon ? (
                  <DropdownMenuItem key={m.name} disabled>
                    <m.icon aria-hidden /> {m.name}
                    <span className="ml-auto text-xs text-muted-foreground">Soon</span>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem key={m.name} asChild>
                    <Link href={`${base}${m.href}`}>
                      <m.icon aria-hidden /> {m.name}
                    </Link>
                  </DropdownMenuItem>
                ),
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </li>
      </ul>
    </nav>
  );
}
