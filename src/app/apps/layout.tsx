import type { Metadata } from "next";
import { headers } from "next/headers";
import { HqSidebar } from "@/components/hq/hq-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

/**
 * The HQ shell: apps.sagaxventures.com.
 *
 * Its own chrome (sidebar, top bar) instead of the public site's, and the
 * shadcn tokens scoped to `.hq` in globals.css. Every page under it is an
 * internal view of live data, rendered per request and never indexed.
 */

export const metadata: Metadata = {
  title: { default: "Saga X HQ", template: "%s | Saga X HQ" },
  robots: { index: false, follow: false },
};

export default async function HqLayout({ children }: LayoutProps<"/apps">) {
  // On the apps subdomain the rewrite drops the /apps prefix from URLs, so
  // links there are host-relative. On the main domain they keep the prefix.
  const host = (await headers()).get("host") ?? "";
  const base = host.startsWith("apps.") ? "" : "/apps";

  return (
    <div className="hq min-h-svh w-full">
      <TooltipProvider delayDuration={200}>
        <SidebarProvider>
          <HqSidebar base={base} />
          <SidebarInset className="bg-background">
            <header className="flex h-14 items-center gap-2 border-b border-border px-4">
              <SidebarTrigger />
              <span className="text-sm text-muted-foreground">Saga X HQ</span>
            </header>
            <div className="flex-1 p-4 sm:p-6 lg:p-8">{children}</div>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </div>
  );
}
