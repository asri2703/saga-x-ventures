"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChartLine,
  KeyRound,
  LayoutDashboard,
  Newspaper,
  Radio,
  Scale,
  type LucideIcon,
} from "lucide-react";
import { SettingsAccordion } from "./settings-accordion";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

type NavItem = { name: string; href: string; icon: LucideIcon; soon?: boolean };

/**
 * `href` is the path under /apps. On apps.sagaxventures.com the host rewrite
 * serves it without the prefix, so `base` is "" there and "/apps" on the main
 * domain; the layout works that out from the request host.
 *
 * The four main places sit at the top. Everything that sets the terminal up
 * rather than being read every day (alert choices, sources, API clients)
 * folds under Settings at the very bottom. New alerts arrive on the bell.
 */
export const MAIN: NavItem[] = [
  { name: "Overview", href: "", icon: LayoutDashboard },
  { name: "Feeds", href: "/terminal", icon: Newspaper },
  { name: "Economy", href: "/macro", icon: ChartLine },
  { name: "Smart Money", href: "/cot", icon: Scale },
];

export const SETTINGS: NavItem[] = [
  { name: "Alerts", href: "/alerts", icon: Bell },
  { name: "Sources", href: "/sources", icon: Radio, soon: true },
  { name: "API clients", href: "/clients", icon: KeyRound, soon: true },
];

export function HqSidebar({ base }: { base: string }) {
  const pathname = usePathname();
  const here = pathname.replace(/\/$/, "") || "/";
  const isActive = (path: string) => {
    const href = `${base}${path}` || "/";
    // A section stays lit on its own sub-pages (a story, a series).
    return here === href || (path !== "" && here.startsWith(`${href}/`));
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 flex-row items-center gap-2.5 px-4 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
          SX
        </span>
        <span className="truncate font-semibold group-data-[collapsible=icon]:hidden">Saga X HQ</span>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel>Mastery Terminal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {MAIN.map((item) => {
                const active = isActive(item.href);
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.name}>
                      <Link href={`${base}${item.href}` || "/"} aria-current={active ? "page" : undefined}>
                        <item.icon />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-3 px-2 pb-4">
        <SettingsAccordion items={SETTINGS} base={base} isActive={isActive} />
        <p className="px-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          Internal preview. Not linked from the public site.
        </p>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
