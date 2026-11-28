import type { Metadata } from "next";
import { Newsreader } from "next/font/google";
import { headers } from "next/headers";
import { AlertsBell, type BellAlert } from "@/components/hq/alerts-bell";
import { HqSidebar } from "@/components/hq/hq-sidebar";
import { TabIsland } from "@/components/hq/tab-island";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { pushConfigured, readAlertLog } from "@/lib/alerts/push";

/**
 * The HQ shell: apps.sagaxventures.com.
 *
 * Its own chrome instead of the public site's: a sidebar from the md
 * breakpoint up, a floating tab bar on phones, and the alerts bell in the
 * header on both. The shadcn tokens are scoped to `.hq` in globals.css.
 * Every page under it is an internal view of live data, rendered per
 * request and never indexed.
 */

/** Headlines and page titles: a news serif, self-hosted by next/font (OFL). */
const newsreader = Newsreader({ subsets: ["latin"], variable: "--font-newsreader", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Saga X HQ", template: "%s | Saga X HQ" },
  robots: { index: false, follow: false },
};

async function recentAlerts(): Promise<BellAlert[]> {
  if (!pushConfigured()) return [];
  try {
    return (await readAlertLog(8)) as BellAlert[];
  } catch (error) {
    console.error("hq shell: could not read alerts", error);
    return [];
  }
}

export default async function HqLayout({ children }: LayoutProps<"/apps">) {
  // On the apps subdomain the rewrite drops the /apps prefix from URLs, so
  // links there are host-relative. On the main domain they keep the prefix.
  const host = (await headers()).get("host") ?? "";
  const base = host.startsWith("apps.") ? "" : "/apps";
  const alerts = await recentAlerts();

  return (
    <div className={`hq ${newsreader.variable} min-h-svh w-full`}>
      <TooltipProvider delayDuration={200}>
        <SidebarProvider>
          <HqSidebar base={base} />
          <SidebarInset className="min-w-0 bg-background">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/95 px-4 backdrop-blur">
              <SidebarTrigger className="hidden md:inline-flex" />
              <span className="grid size-7 place-items-center rounded-md bg-primary text-xs font-semibold text-primary-foreground md:hidden">
                SX
              </span>
              <span className="text-sm font-medium text-foreground/80">Terminal</span>
              <div className="ml-auto">
                <AlertsBell alerts={alerts} base={base} />
              </div>
            </header>
            <div className="min-w-0 flex-1 p-4 pb-28 sm:p-6 sm:pb-28 md:pb-8 lg:p-8">{children}</div>
          </SidebarInset>
        </SidebarProvider>
        <TabIsland base={base} />
      </TooltipProvider>
    </div>
  );
}
