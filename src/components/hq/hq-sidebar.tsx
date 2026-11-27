"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartLine,
  KeyRound,
  LayoutDashboard,
  Newspaper,
  Radio,
  Settings,
  type LucideIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

type NavItem = { name: string; href: string; icon: LucideIcon; soon?: boolean };

/**
 * `href` is the path under /apps. On apps.sagaxventures.com the host rewrite
 * serves it without the prefix, so `base` is "" there and "/apps" on the main
 * domain; the layout works that out from the request host.
 */
const GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Mastery Terminal",
    items: [
      { name: "Overview", href: "", icon: LayoutDashboard },
      { name: "News wire", href: "/terminal", icon: Newspaper },
      { name: "Macro data", href: "/macro", icon: ChartLine },
      { name: "Sources", href: "/sources", icon: Radio, soon: true },
    ],
  },
  {
    label: "Platform",
    items: [
      { name: "API clients", href: "/clients", icon: KeyRound, soon: true },
      { name: "Settings", href: "/settings", icon: Settings, soon: true },
    ],
  },
];

export function HqSidebar({ base }: { base: string }) {
  const pathname = usePathname();
  const here = pathname.replace(/\/$/, "") || "/";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 flex-row items-center gap-2.5 px-4 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
          SX
        </span>
        <span className="truncate font-semibold group-data-[collapsible=icon]:hidden">
          Saga X HQ
        </span>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const href = `${base}${item.href}` || "/";
                  // A section stays lit on its own sub-pages (a story, a series).
                  const active = here === href || (item.href !== "" && here.startsWith(`${href}/`));
                  return (
                    <SidebarMenuItem key={item.name}>
                      {item.soon ? (
                        <SidebarMenuButton disabled tooltip={`${item.name} (soon)`}>
                          <item.icon />
                          <span>{item.name}</span>
                        </SidebarMenuButton>
                      ) : (
                        <SidebarMenuButton asChild isActive={active} tooltip={item.name}>
                          <Link href={href} aria-current={active ? "page" : undefined}>
                            <item.icon />
                            <span>{item.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      )}
                      {item.soon ? <SidebarMenuBadge>Soon</SidebarMenuBadge> : null}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="px-4 pb-4 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
        Internal preview. Not linked from the public site.
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
