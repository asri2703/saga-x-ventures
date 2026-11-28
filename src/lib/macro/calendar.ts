import { newYorkOffset } from "@/lib/cot/schedule";

/**
 * When the next number for each series comes out, from the publishers' own
 * schedules. Dates are New York calendar days; times are New York time.
 *
 *  - FOMC decisions: federalreserve.gov, revised 2027 schedule published
 *    12 Nov 2026. The 26-27 Oct 2027 meeting is strategy only, with no
 *    policy decision, so it is not listed. Statement at 14:00.
 *  - CPI and the Employment Situation (payrolls, unemployment, earnings):
 *    bls.gov/schedule, last modified 9 Oct 2026. Both at 08:30.
 *
 * Extend these lists when the publishers post the next year.
 */

export type EventKind = "fomc" | "cpi" | "jobs" | "ppi" | "gdp" | "pce";

/**
 * BEA puts out GDP and Personal Income and Outlays (PCE) on the same days
 * (bea.gov/news/schedule, 2026 full schedule and 2027 schedule, checked
 * 28 Nov 2026). BLS's PPI dates: bls.gov/schedule/news_release/ppi.htm.
 */
const BEA_DAYS = [
  "2026-12-23",
  "2027-01-28",
  "2027-02-25",
  "2027-03-31",
  "2027-04-29",
  "2027-05-27",
  "2027-06-25",
  "2027-07-29",
  "2027-08-25",
  "2027-09-30",
  "2027-10-28",
  "2027-11-24",
  "2027-12-22",
];

export const EVENTS: Record<EventKind, { name: string; hour: number; minute: number; days: string[] }> = {
  fomc: {
    name: "FOMC rate decision",
    hour: 14,
    minute: 0,
    days: [
      "2026-12-09",
      "2027-01-27",
      "2027-03-17",
      "2027-04-28",
      "2027-06-09",
      "2027-07-28",
      "2027-09-15",
      "2027-11-17",
      "2028-01-26",
    ],
  },
  cpi: {
    name: "CPI report",
    hour: 8,
    minute: 30,
    days: [
      "2026-12-10",
      "2027-01-13",
      "2027-02-11",
      "2027-03-10",
      "2027-04-13",
      "2027-05-12",
      "2027-06-10",
      "2027-07-14",
      "2027-08-11",
      "2027-09-14",
      "2027-10-14",
      "2027-11-10",
      "2027-12-10",
    ],
  },
  jobs: {
    name: "Jobs report (NFP)",
    hour: 8,
    minute: 30,
    days: [
      "2026-12-04",
      "2027-01-08",
      "2027-02-05",
      "2027-03-05",
      "2027-04-02",
      "2027-05-07",
      "2027-06-04",
      "2027-07-02",
      "2027-08-06",
      "2027-09-03",
      "2027-10-08",
      "2027-11-05",
      "2027-12-03",
    ],
  },
  ppi: {
    name: "PPI report",
    hour: 8,
    minute: 30,
    days: [
      "2026-12-15",
      "2027-01-14",
      "2027-02-12",
      "2027-03-12",
      "2027-04-14",
      "2027-05-13",
      "2027-06-11",
      "2027-07-15",
      "2027-08-10",
      "2027-09-10",
      "2027-10-15",
      "2027-11-12",
      "2027-12-15",
    ],
  },
  gdp: { name: "GDP estimate", hour: 8, minute: 30, days: BEA_DAYS },
  pce: { name: "PCE inflation", hour: 8, minute: 30, days: BEA_DAYS },
};

/** Which scheduled event publishes each series. Daily market series have none. */
export const SERIES_EVENT: Record<string, EventKind> = {
  "fed-funds": "fomc",
  effr: "fomc",
  "cpi-yoy": "cpi",
  "core-cpi-yoy": "cpi",
  "cpi-mom": "cpi",
  "core-cpi-mom": "cpi",
  unemployment: "jobs",
  nfp: "jobs",
  "earnings-yoy": "jobs",
  "ppi-mom": "ppi",
  "ppi-yoy": "ppi",
  "core-ppi-mom": "ppi",
  "core-ppi-yoy": "ppi",
  gdp: "gdp",
  "pce-mom": "pce",
  "pce-yoy": "pce",
  "core-pce-mom": "pce",
  "core-pce-yoy": "pce",
};

/** A New York wall-clock time on a New York date, as an instant. */
export function newYorkInstant(day: string, hour: number, minute: number): Date {
  const [y, m, d] = day.split("-").map(Number);
  const offset = newYorkOffset(new Date(Date.UTC(y, m - 1, d, 17)));
  return new Date(Date.UTC(y, m - 1, d, hour, minute) - offset * 60_000);
}

export type NextEvent = { kind: EventKind; name: string; at: Date };

/** The next scheduled release of an event after `now`, or null past the list. */
export function nextEvent(kind: EventKind, now: Date): NextEvent | null {
  const e = EVENTS[kind];
  for (const day of e.days) {
    const at = newYorkInstant(day, e.hour, e.minute);
    if (at.getTime() > now.getTime()) return { kind, name: e.name, at };
  }
  return null;
}

export function nextEventFor(slug: string, now: Date): NextEvent | null {
  const kind = SERIES_EVENT[slug];
  return kind ? nextEvent(kind, now) : null;
}

/** Every event in the next `days`, soonest first, for the calendar strip. */
export function upcoming(now: Date, days: number): NextEvent[] {
  const end = now.getTime() + days * 86_400_000;
  const out: NextEvent[] = [];
  for (const kind of Object.keys(EVENTS) as EventKind[]) {
    const e = EVENTS[kind];
    for (const day of e.days) {
      const at = newYorkInstant(day, e.hour, e.minute);
      if (at.getTime() > now.getTime() && at.getTime() <= end) out.push({ kind, name: e.name, at });
    }
  }
  return out.sort((a, b) => a.at.getTime() - b.at.getTime());
}
