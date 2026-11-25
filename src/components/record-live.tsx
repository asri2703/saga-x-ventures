"use client";

import { useSyncExternalStore } from "react";

/**
 * "Live — updated 12 min ago", under the record's heading.
 *
 * It exists to prove the figures come from the account rather than from a
 * keyboard, so it has to be honest in both directions: a feed that has gone
 * quiet for more than three hours drops the pulse and says how long ago it
 * last heard, instead of calling itself live.
 *
 * The page is cached for up to an hour, so the age is worked out in the
 * browser, not baked into the HTML. The server renders the absolute time;
 * the browser swaps in the relative one and ticks it every half minute.
 */

const STALE_MS = 3 * 60 * 60 * 1000;

/** The current minute — stable between ticks, so React does not re-render
 *  on every read. */
function subscribe(onChange: () => void) {
  const id = window.setInterval(onChange, 30_000);
  return () => window.clearInterval(id);
}
const nowMinute = () => Math.floor(Date.now() / 60_000);
const serverMinute = () => null;

function ago(ms: number): string {
  const minutes = Math.max(0, Math.round(ms / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} days ago`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "26 Nov, 00:04" in Malaysian time. Built by hand rather than with
 *  toLocaleString: the server's ICU and the browser's can punctuate the same
 *  date differently, and the two renders of this text must match exactly. */
function myt(ms: number): string {
  const d = new Date(ms + 8 * 60 * 60 * 1000);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}, ${hh}:${mm}`;
}

export function RecordLive({ at }: { at: string }) {
  const minute = useSyncExternalStore(subscribe, nowMinute, serverMinute);
  const then = Date.parse(at);

  const absolute = myt(then);

  if (minute === null) {
    return (
      <p className="record-live">
        <span className="record-live-dot" aria-hidden />
        Updated <time dateTime={at}>{absolute}</time> (MYT)
      </p>
    );
  }

  const age = minute * 60_000 - then;
  const stale = age > STALE_MS;

  return (
    <p className={`record-live ${stale ? "record-live--stale" : ""}`}>
      <span className="record-live-dot" aria-hidden />
      {stale ? "Last update " : "Live · updated "}
      <time dateTime={at} title={`${absolute} MYT`}>
        {ago(age)}
      </time>
    </p>
  );
}
