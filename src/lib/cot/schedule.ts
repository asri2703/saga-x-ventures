/**
 * When the CFTC publishes the next Commitments of Traders report.
 *
 * Reports come out at 15:30 New York time, usually on a Friday, with the
 * positions taken the Tuesday before. A federal holiday pushes a release by
 * a day or two, so the dates come from the CFTC's published schedule
 * (cftc.gov, "Release Schedule"). Add the next year's dates here when the
 * CFTC posts them; past the list, HQ falls back to the next Friday and marks
 * the time as estimated.
 *
 * The CFTC has said it will move to two reports a week by the end of 2026;
 * when it does, the new dates go in this list and nothing else changes.
 */

/** New York calendar dates. `delayed` marks a holiday move. */
export const RELEASES: { day: string; delayed?: boolean }[] = [
  { day: "2026-11-30", delayed: true },
  { day: "2026-12-04" },
  { day: "2026-12-11" },
  { day: "2026-12-18" },
  { day: "2026-12-28", delayed: true },
];

const RELEASE_HOUR = 15;
const RELEASE_MINUTE = 30;

/** New York's offset from UTC in minutes on a given instant (-300 or -240). */
export function newYorkOffset(at: Date): number {
  const name = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", timeZoneName: "shortOffset" })
    .formatToParts(at)
    .find((p) => p.type === "timeZoneName")?.value;
  const match = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(name ?? "");
  if (!match) return -300;
  const minutes = Number(match[2]) * 60 + Number(match[3] ?? 0);
  return match[1] === "-" ? -minutes : minutes;
}

/** 15:30 New York on a New York date, as an instant. */
export function releaseInstant(day: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  const noon = new Date(Date.UTC(y, m - 1, d, 17));
  const offset = newYorkOffset(noon);
  return new Date(Date.UTC(y, m - 1, d, RELEASE_HOUR, RELEASE_MINUTE) - offset * 60_000);
}

export type NextRelease = { at: Date; delayed: boolean; estimated: boolean };

export function nextRelease(now: Date): NextRelease {
  for (const r of RELEASES) {
    const at = releaseInstant(r.day);
    if (at.getTime() > now.getTime()) return { at, delayed: Boolean(r.delayed), estimated: false };
  }
  // Past the published list: the next Friday in New York.
  for (let i = 0; i < 8; i++) {
    const probe = new Date(now.getTime() + i * 86_400_000);
    const local = new Date(probe.getTime() + newYorkOffset(probe) * 60_000);
    if (local.getUTCDay() !== 5) continue;
    const day = local.toISOString().slice(0, 10);
    const at = releaseInstant(day);
    if (at.getTime() > now.getTime()) return { at, delayed: false, estimated: true };
  }
  return { at: releaseInstant(new Date(now.getTime() + 7 * 86_400_000).toISOString().slice(0, 10)), delayed: false, estimated: true };
}
