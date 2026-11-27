"use client";

import { useSyncExternalStore } from "react";

/**
 * A live countdown to an instant, ticking once a second.
 *
 * The server renders a dash (it cannot know the reader's clock); the browser
 * takes over on hydration. Past the target it says the report is due, since
 * the CFTC posts a few minutes after 15:30 and HQ picks it up on its next run.
 */

function subscribe(onTick: () => void): () => void {
  const id = window.setInterval(onTick, 1000);
  return () => window.clearInterval(id);
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function serverSeconds(): null {
  return null;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "Due now";
  const d = Math.floor(seconds / 86_400);
  const h = Math.floor((seconds % 86_400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return d > 0 ? `${d}d ${pad(h)}h ${pad(m)}m ${pad(s)}s` : `${pad(h)}h ${pad(m)}m ${pad(s)}s`;
}

export function Countdown({ at, className }: { at: string; className?: string }) {
  const now = useSyncExternalStore(subscribe, nowSeconds, serverSeconds);
  const target = Math.floor(Date.parse(at) / 1000);
  return (
    <span className={className} suppressHydrationWarning>
      {now === null ? "--" : formatCountdown(target - now)}
    </span>
  );
}
