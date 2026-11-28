"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, MotionConfig, type Transition } from "motion/react";
import { ChevronDown, Settings, type LucideIcon } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";

/**
 * Settings at the foot of the sidebar. It looks like every other menu row
 * (same button, same sub-menu with its guide line) and opens with a spring
 * (after ui.watermelon.sh's animated accordion): the list grows to its own
 * height and the chevron turns. Folded to icons, the gear opens the sidebar
 * and the list. Motion follows the reader's reduced-motion setting.
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
  const shown = open && !folded;

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
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            onClick={toggle}
            tooltip="Settings"
            isActive={here && !shown}
            aria-expanded={shown}
            aria-controls="hq-settings-list"
          >
            <Settings />
            <span>Settings</span>
            <motion.span animate={{ rotate: shown ? 180 : 0 }} className="ml-auto flex text-muted-foreground">
              <ChevronDown className="size-4" aria-hidden />
            </motion.span>
          </SidebarMenuButton>

          <AnimatePresence initial={false}>
            {shown ? (
              <motion.div
                id="hq-settings-list"
                key="list"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <SidebarMenuSub>
                  {items.map((item) => (
                    <SidebarMenuSubItem key={item.name}>
                      {item.soon ? (
                        <SidebarMenuSubButton aria-disabled className="pointer-events-none opacity-50">
                          <item.icon />
                          <span>{item.name}</span>
                          <span className="ml-auto text-[11px]">Soon</span>
                        </SidebarMenuSubButton>
                      ) : (
                        <SidebarMenuSubButton asChild isActive={isActive(item.href)}>
                          <Link href={`${base}${item.href}`} aria-current={isActive(item.href) ? "page" : undefined}>
                            <item.icon />
                            <span>{item.name}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      )}
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </SidebarMenuItem>
      </SidebarMenu>
    </MotionConfig>
  );
}
