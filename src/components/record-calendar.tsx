import type { CSSProperties } from "react";
import { type CalendarMonth, usd } from "@/lib/record";

/**
 * The trading, day by day, as a month calendar.
 *
 * Green for a day the trading added to the account, red for a day it took
 * from it, deeper for a bigger move. The red days are the point: a record
 * that only ever shows its good days is an advert, and a reader can tell.
 *
 * Intensity is relative to the biggest day on the calendar, floored so a
 * small day is still visibly coloured rather than lost in the card.
 *
 * Server-rendered. Each cell carries its own figure for screen readers and
 * as a native tooltip, so nothing here needs JavaScript.
 */

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function RecordCalendar({
  months,
  divisor,
}: {
  months: CalendarMonth[];
  /** Account units per dollar: 100 for a cent account, 1 otherwise. */
  divisor: number;
}) {
  if (months.length === 0) return null;

  const biggest = Math.max(
    1,
    ...months.flatMap((m) => m.cells.map((c) => Math.abs(c.trading ?? 0))),
  );

  return (
    <div className="record-calendar">
      <div className="record-calendar-head">
        <p className="text-sm text-pine-soft">Trading by day</p>
        <p className="record-calendar-legend">
          <span className="record-day record-day--down" aria-hidden />
          Down
          <span className="record-day record-day--up" aria-hidden />
          Up
          <span className="record-day" aria-hidden />
          No trades
        </p>
      </div>

      {months.map((month) => (
        <section key={month.label} className="record-month">
          <div className="record-month-head">
            <h3 className="font-semibold text-pine">{month.label}</h3>
            <p className="tnum text-sm text-pine-soft">
              {usd(month.trading, true, divisor)}{" "}
              <span className="text-pine-faint">USD</span>
            </p>
          </div>

          <ol className="record-days">
            {WEEKDAYS.map((w) => (
              <li key={w} aria-hidden className="record-weekday">
                {w.slice(0, 1)}
              </li>
            ))}
            {Array.from({ length: month.lead }, (_, i) => (
              <li key={`lead-${i}`} aria-hidden />
            ))}
            {month.cells.map((cell) => {
              const t = cell.trading;
              const strength =
                t === null ? 0 : 0.25 + 0.75 * Math.min(1, Math.abs(t) / biggest);
              /* Outside the record the cell is only a date: the account was
                 not open yet, or the day has not come. Calling it "no
                 trades" would claim a quiet day that never happened. */
              if (!cell.inRecord) {
                return (
                  <li key={cell.day} className="record-day record-day--off" aria-hidden>
                    <span className="record-day-date">{cell.date}</span>
                  </li>
                );
              }
              const tone =
                t === null
                  ? ""
                  : t > 0
                    ? "record-day--up"
                    : t < 0
                      ? "record-day--down"
                      : "";
              const label =
                t === null
                  ? `${cell.date} ${month.label}: no trades`
                  : `${cell.date} ${month.label}: ${usd(t, true, divisor)} USD, ${new Intl.NumberFormat("en-MY").format(cell.closed)} trades closed`;
              return (
                <li
                  key={cell.day}
                  className={`record-day ${tone}`}
                  style={{ "--strength": strength } as CSSProperties}
                  title={label}
                >
                  <span aria-hidden className="record-day-date">
                    {cell.date}
                  </span>
                  {t !== null ? (
                    <span aria-hidden className="record-day-amount tnum">
                      {usd(t, true, divisor)}
                    </span>
                  ) : null}
                  <span className="sr-only">{label}</span>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
