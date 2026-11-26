"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { RecordDay } from "@/lib/record";
import { replay as replayOf } from "@/lib/record-outcomes";

/**
 * What a deposit would have done, replayed day by day.
 *
 * The record above this proves the account; this asks the reader to picture
 * themselves inside it. They set a deposit, press play, and watch the line
 * their own money would have traced — at real dates, through the day the
 * account lost a quarter of itself, and out the other side.
 *
 * It is history, not a forecast, and the difference is the whole thing. The
 * heading says "would have", the start date is on screen, and the worst day
 * is called out in their money rather than left for them to find. An
 * animation that only climbed would read as an advert; the drop is what
 * makes the rest believable.
 *
 * The motion is the one piece of non-user-triggered movement on the page,
 * and it earns its place: the point is the passage of time, which a static
 * line cannot show. It plays once, on request, and reduced-motion gets the
 * finished line immediately.
 */

const money = (value: number, digits = 0) => {
  const body = `$${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Math.abs(value))}`;
  return value < 0 ? `−${body}` : body;
};

const onDay = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

const VIEW_W = 720;
const VIEW_H = 260;
const PAD = 10;

export function FollowReplay({
  days,
  deposits,
}: {
  days: RecordDay[];
  /** The deposits a reader can choose between, smallest first. */
  deposits: number[];
}) {
  const [deposit, setDeposit] = useState(deposits[0]);
  const replay = replayOf(days, deposit);
  /* How many days of the line are drawn. Starts at the end, so a reader who
     never presses play still sees the whole record rather than an empty
     box; pressing play rewinds and runs it. */
  const [at, setAt] = useState((replay?.points.length ?? 1) - 1);
  const [playing, setPlaying] = useState(false);
  const frame = useRef<number | null>(null);
  const ids = useId();

  /* Reset when the deposit changes: the line is the same shape but the
     money on it is not, and leaving a half-played line would be a figure
     from the previous deposit. */
  useEffect(() => {
    setAt((replay?.points.length ?? 1) - 1);
    setPlaying(false);
  }, [replay?.points.length, deposit]);

  useEffect(() => {
    if (!playing) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const total = replay?.points.length ?? 0;
    if (reduced || total === 0) {
      setAt(Math.max(0, total - 1));
      setPlaying(false);
      return;
    }

    const started = performance.now();
    const RUN = 5200; // the whole record in about five seconds

    const step = (now: number) => {
      const done = Math.min(1, (now - started) / RUN);
      setAt(Math.max(0, Math.round(done * (total - 1))));
      if (done < 1) {
        frame.current = requestAnimationFrame(step);
      } else {
        setPlaying(false);
      }
    };
    frame.current = requestAnimationFrame(step);
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [playing, replay?.points.length]);

  if (replay === null) return null;

  const points = replay.points;
  const shown = points.slice(0, at + 1);
  const current = shown[shown.length - 1] ?? points[0];

  /* The scale is the WHOLE record, not the part drawn, so the line does not
     rescale under itself as it plays. */
  const low = Math.min(replay.deposit, ...points.map((p) => p.balance));
  const high = Math.max(replay.deposit, ...points.map((p) => p.balance));
  const span = high - low || 1;

  const x = (i: number) =>
    PAD + (i / Math.max(1, points.length - 1)) * (VIEW_W - PAD * 2);
  const y = (value: number) =>
    PAD + (1 - (value - low) / span) * (VIEW_H - PAD * 2);

  const path = shown
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(2)} ${y(p.balance).toFixed(2)}`)
    .join(" ");

  const gain = current.balance - replay.deposit;

  return (
    <div className="replay">
      <div className="replay-head">
        <div>
          <p className="replay-label">If you had started with</p>
          <div className="replay-picks">
            {deposits.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setDeposit(value)}
                aria-pressed={value === deposit}
                className="replay-pick tnum"
              >
                {money(value)}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="replay-play"
          onClick={() => {
            setAt(0);
            setPlaying(true);
          }}
          disabled={playing}
        >
          {playing ? "Playing…" : "Watch it"}
        </button>
      </div>

      <div className="replay-now">
        <p className="replay-date">{onDay(current.day)}</p>
        <p className="replay-balance tnum">{money(current.balance)}</p>
        <p
          className={`replay-gain tnum ${gain < 0 ? "replay-gain--down" : ""}`}
        >
          {gain < 0 ? "" : "+"}
          {money(gain)} since you started
        </p>
      </div>

      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        width="100%"
        height="100%"
        className="replay-plot"
        preserveAspectRatio="none"
        /* Decorative: every figure is in the text around it. */
        aria-hidden
      >
        <defs>
          <linearGradient id={`${ids}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-neon)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--color-neon)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* The deposit, as the line they have to stay above to be ahead. */}
        <line
          x1={PAD}
          x2={VIEW_W - PAD}
          y1={y(replay.deposit)}
          y2={y(replay.deposit)}
          className="replay-base"
        />

        {shown.length > 1 ? (
          <>
            <path
              d={`${path} L${x(shown.length - 1)} ${VIEW_H - PAD} L${x(0)} ${VIEW_H - PAD} Z`}
              fill={`url(#${ids}-fill)`}
            />
            <path d={path} className="replay-line" />
            <circle
              cx={x(shown.length - 1)}
              cy={y(current.balance)}
              r="5"
              className="replay-dot"
            />
          </>
        ) : null}
      </svg>

      <dl className="replay-facts">
        <div>
          <dt>Worst day</dt>
          <dd className="tnum replay-facts--down">
            {replay.worstDay ? money(replay.worstDay.amount) : "—"}
          </dd>
          <p>{replay.worstDay ? onDay(replay.worstDay.day) : null}</p>
        </div>
        <div>
          <dt>Losing days</dt>
          <dd className="tnum">
            {replay.losingDays} of {replay.tradingDays}
          </dd>
        </div>
        <div>
          <dt>Ended at</dt>
          <dd className="tnum">{money(replay.final)}</dd>
          <p>{onDay(points[points.length - 1].day)}</p>
        </div>
      </dl>
    </div>
  );
}
