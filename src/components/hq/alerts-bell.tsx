"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * The bell in HQ's header: the latest alerts sent, with a count of the ones
 * sent since this browser last opened the list. "Seen" is kept in this
 * browser only (there are no accounts in HQ yet).
 */

export type BellAlert = { kind: string; ref: string; title: string; body: string; url: string | null; created_at: string };

const KEY = "hq-alerts-seen";
const EVENT = "hq-alerts-seen";

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

function seenSnapshot(): string {
  try {
    return window.localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

function serverSnapshot(): null {
  return null;
}

function markSeen(): void {
  try {
    window.localStorage.setItem(KEY, new Date().toISOString());
  } catch {
    // Private mode: the count simply stays.
  }
  window.dispatchEvent(new Event(EVENT));
}

function when(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: "Asia/Kuala_Lumpur",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AlertsBell({ alerts, base }: { alerts: BellAlert[]; base: string }) {
  const seen = useSyncExternalStore(subscribe, seenSnapshot, serverSnapshot);
  const unread = seen === null ? 0 : alerts.filter((a) => !seen || a.created_at > seen).length;

  return (
    <DropdownMenu onOpenChange={(open) => (open ? markSeen() : undefined)}>
      <DropdownMenuTrigger
        aria-label={unread ? `Alerts, ${unread} new` : "Alerts"}
        className="relative grid size-9 place-items-center rounded-lg text-foreground/80 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Bell className="size-5" aria-hidden />
        {unread ? (
          <span className="absolute top-1 right-1 grid min-w-4 place-items-center rounded-full bg-[#c81f30] px-1 text-[10px] leading-4 font-semibold text-white tabular-nums">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="hq w-[min(22rem,calc(100vw-1.5rem))]">
        <DropdownMenuLabel>Latest alerts</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {alerts.length === 0 ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">No alerts sent yet.</p>
        ) : (
          alerts.map((a) => (
            <DropdownMenuItem key={`${a.kind}:${a.ref}`} asChild>
              <Link href={`${base}${a.url ?? ""}` || "/"} className="flex flex-col items-start gap-0.5">
                <span className="text-sm font-medium leading-snug">{a.title}</span>
                <span className="line-clamp-2 text-xs text-muted-foreground">{a.body}</span>
                <span className="text-[11px] text-muted-foreground">{when(a.created_at)}</span>
              </Link>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`${base}/alerts`} className="text-sm font-medium">
            Alert settings
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
