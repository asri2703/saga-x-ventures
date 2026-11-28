"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, MotionConfig, type Transition } from "motion/react";
import { ChevronDown, Settings, type LucideIcon } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

/**
 * Settings at the foot of the sidebar, as a card that springs open (after
 * ui.watermelon.sh's animated accordion). The height animates to "auto", so
 * no measuring is needed. Folded to icons, the gear opens the sidebar first
 * and then the list. Motion follows the reader's reduced-motion setting.
 */

type Item = { name: string; href: string; icon: LucideIcon; soon?: boolean };

const spring: Transition = { type: "spring", stiffness: 600, damping: 50, mass: 1 };

export function SettingsAccordion({
  items,
  base,
  isActive,
}: {
  items: Item[];
  base: string;
  isActive: (href: string) => boolean;
}) {
  const here = items.some((i) => !i.soon && isActive(i.href));
  const [open, setOpenList] = useState(here);
  const { state, setOpen: setSidebarOpen } = useSidebar();
  const folded = state === "collapsed";

  function toggle() {
    if (folded) {
      setSidebarOpen(true);
      setOpenList(true);
      return;
    }
    setOpenList((o) => !o);
  }

  return (
    <MotionConfig transition={spring} reducedMotion="user">
      <motion.div
        layout
        animate={{ borderRadius: open && !folded ? 18 : 12 }}
        className={cn(
          "overflow-hidden border",
          folded ? "border-transparent bg-transparent" : "border-border bg-card",
          open && !folded && "shadow-[0_6px_18px_rgba(22,58,48,0.08)]",
        )}
      >
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open && !folded}
          aria-controls="hq-settings-list"
          title="Settings"
          className={cn(
            "flex w-full cursor-pointer items-center gap-2.5 px-3 py-2.5 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
            folded && "justify-center px-0",
            here && folded && "rounded-md bg-sidebar-accent",
          )}
        >
          <Settings className="size-4 shrink-0" aria-hidden />
          <span className={cn("flex-1 text-left", folded && "sr-only")}>Settings</span>
          {folded ? null : (
            <motion.span animate={{ rotate: open ? 180 : 0 }} className="text-muted-foreground">
              <ChevronDown className="size-4" aria-hidden />
            </motion.span>
          )}
        </button>

        <AnimatePresence initial={false}>
          {open && !folded ? (
            <motion.div
              id="hq-settings-list"
              key="list"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <ul className="flex flex-col gap-0.5 border-t border-border px-1.5 py-1.5">
                {items.map((item) =>
                  item.soon ? (
                    <li
                      key={item.name}
                      className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground/70"
                    >
                      <item.icon className="size-4" aria-hidden />
                      <span className="flex-1">{item.name}</span>
                      <span className="text-[11px]">Soon</span>
                    </li>
                  ) : (
                    <li key={item.name}>
                      <Link
                        href={`${base}${item.href}`}
                        aria-current={isActive(item.href) ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm hover:bg-sidebar-accent",
                          isActive(item.href) && "bg-sidebar-accent font-medium",
                        )}
                      >
                        <item.icon className="size-4" aria-hidden />
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </MotionConfig>
  );
}
