"use client";

import { useId, useState } from "react";
import type { Outcomes } from "@/lib/record-outcomes";
import { project } from "@/lib/record-outcomes";

/**
 * "How much do I need to deposit to make $X a month?"
 *
 * The owner's first sketch ran the other way: enter a deposit and a monthly
 * contribution, press Simulate, read a profit. Built faithfully on this
 * record that prints $500 growing to $574 million in a year, because
 * compounding a short account's daily rate is a machine for producing
 * numbers nobody believes. Running it backwards — goal in, deposit out —
 * asks the question a buyer actually has and answers it with a figure that
 * cannot run away.
 *
 * One panel, six boxes, laid out like the paths in the owner's reference:
 * the deposit is the answer and carries the highlight; the rest describe
 * what living with that deposit looks like.
 *
 * Drawdown is one of the six and that is deliberate. The worst-stretch row
 * that used to sit here came out at the owner's request, which left the
 * panel with no losing figure on it at all — drawdown is what keeps one
 * there. Every box is the same rate stated a different way, so none of them
 * can drift from another: daily and weekly are the monthly figure taken
 * down, not measured separately.
 */

/**
 * The slider's range, and why it is not linear.
 *
 * A straight slider from 300 to 10,000 spends nine tenths of its travel
 * above 1,000, so the amounts most people are actually choosing between —
 * 300, 400, 500 — are crushed into the first few pixels and a thumb on a
 * phone cannot separate them. Each step here is a fixed PROPORTION of the
 * value instead of a fixed number of dollars, so the handle moves about as
 * far going 300 → 400 as it does going 3,000 → 4,000.
 */
const MIN = 300;
const MAX = 10000;
const STEPS = 200;

/** Rounded to an amount somebody would actually say out loud. */
function snap(value: number): number {
  if (value < 1000) return Math.round(value / 50) * 50;
  if (value < 5000) return Math.round(value / 100) * 100;
  return Math.round(value / 500) * 500;
}

const toValue = (position: number) =>
  snap(MIN * Math.pow(MAX / MIN, position / STEPS));

const toPosition = (value: number) =>
  Math.round((STEPS * Math.log(value / MIN)) / Math.log(MAX / MIN));

/* The sign goes outside the currency, never inside it: "$-393" is a string
   nobody writes. U+2212, to match the rest of the site's figures. */
const money = (value: number, digits = 0) => {
  const body = `$${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Math.abs(value))}`;
  return value < 0 ? `−${body}` : body;
};

/** A ratio as a signed percentage: 0.268 → "+26.8%". Zero takes no sign. */
const pct = (ratio: number) => {
  const body = `${(Math.abs(ratio) * 100).toFixed(1)}%`;
  if (Math.abs(ratio) < 0.00005) return body;
  return `${ratio < 0 ? "−" : "+"}${body}`;
};

/**
 * What the buyer pays, when it is not a share of the gain.
 *
 * Copytrade's fee is a percentage, so it belongs in the dollar arithmetic
 * and `project` subtracts it. A rental's is a flat monthly charge in
 * ringgit, and the site has no exchange rate — deliberately, because a rate
 * typed into a file is wrong the week after. So it is never subtracted from
 * the dollar figures; it is stated beside them.
 *
 * Which of the two figures applies is decided by the deposit the slider
 * produced, because that is what decides it in real life: past the larger
 * package's deposit the server comes free. The calculator therefore argues
 * for the larger deposit out of arithmetic rather than out of copy.
 */
export type RentNote = {
  /** The deposit at or above which the server is included. */
  includedFrom: number;
  /** The monthly rent below that, formatted with its currency. */
  monthly: string;
  /** What is shown at or above it. */
  included: string;
};

export function ProfitCalculator({
  outcomes,
  sharePct,
  lots,
  rent = null,
}: {
  outcomes: Outcomes;
  /** The master's share of the month's gain, as a percentage. Zero on a rental. */
  sharePct: number;
  /** Lots a day per $1,000 of capital, or null when it cannot be read. */
  lots: number | null;
  /** Set on a rental, where the fee is flat and in another currency. */
  rent?: RentNote | null;
}) {
  const [goal, setGoal] = useState(300);
  const fieldId = useId();

  const result = project(goal, outcomes, sharePct, lots);

  return (
    <div className="calc">
      <div className="calc-ask">
        {/* "Gross" only means something where a share is taken out of it.
            On a rental nothing is, so the word would be answering a
            question the panel never asks. */}
        <p className="calc-label">
          {rent ? "Profit you want a month" : "Gross profit you want a month"}
        </p>

        <p className="calc-goal tnum">
          <span aria-hidden className="calc-currency">
            USD
          </span>
          {money(goal)}
        </p>

        {/* A native range input, styled. It already answers a keyboard, a
            screen reader and a thumb, and none of that would survive being
            rebuilt out of divs. `aria-valuetext` is what makes it read out
            "$300 a month" instead of the position on the scale, which is
            what the value really is. */}
        <label htmlFor={fieldId} className="sr-only">
          Monthly profit goal in US dollars
        </label>
        <input
          id={fieldId}
          className="calc-slider"
          type="range"
          min={0}
          max={STEPS}
          step={1}
          value={toPosition(goal)}
          aria-valuetext={`${money(goal)} a month`}
          onChange={(event) => setGoal(toValue(Number(event.target.value)))}
        />

        <div aria-hidden className="calc-scale tnum">
          <span>{money(MIN)}</span>
          <span>{money(MAX)}</span>
        </div>
      </div>

      {result === null ? (
        <p className="calc-none">
          Move the slider and this works out the deposit behind it.
        </p>
      ) : (
        <>
          <dl className="calc-boxes">
            {/* The answer, and the only fill on the panel: everything under
                it is a consequence of it. */}
            <div className="calc-box calc-box--lead">
              <dt>Amount deposit</dt>
              <dd className="tnum">{money(result.deposit)}</dd>
            </div>

            {/* The split, first, because it is what the slider's figure
                actually turns into. The slider sets what the ACCOUNT makes;
                these two say whose it is.

                On a rental there is no split — the fee is flat and in
                another currency — so "Nett return" would be the slider's
                own figure repeated. The pair becomes the month's return and
                what the server costs at that deposit. */}
            <div className="calc-box calc-box--keep">
              <dt>{rent ? "Monthly return" : "Nett return"}</dt>
              <dd className="tnum">{money(rent ? result.gross : result.net)}</dd>
            </div>

            <div className="calc-box">
              <dt>{rent ? "Server rent" : `Fees (${sharePct}%)`}</dt>
              <dd className="tnum">
                {rent
                  ? result.deposit >= rent.includedFrom
                    ? rent.included
                    : rent.monthly
                  : money(result.fees)}
              </dd>
              {rent ? (
                <p className="calc-box-sub">
                  {result.deposit >= rent.includedFrom
                    ? "at this deposit"
                    : "every month, win or lose"}
                </p>
              ) : null}
            </div>

            <div className="calc-box">
              <dt>Profit percentage</dt>
              <dd className="tnum">{pct(result.monthly)}</dd>
            </div>

            {/* Then the same money at a shorter cadence, and the volume
                behind it. Both are after the share, like Nett return — one
                panel, one meaning of a dollar. */}
            <div className="calc-box">
              <dt>Daily return</dt>
              <dd className="tnum">{money(result.daily, 2)}</dd>
            </div>

            <div className="calc-box">
              <dt>Weekly return</dt>
              <dd className="tnum">{money(result.weekly, 2)}</dd>
            </div>

            <div className="calc-box">
              <dt>Total lot</dt>
              <dd className="tnum">
                {result.lots === null
                  ? "—"
                  : new Intl.NumberFormat("en-US", {
                      maximumFractionDigits: 2,
                    }).format(result.lots)}
              </dd>
              <p className="calc-box-sub">a day</p>
            </div>
          </dl>

        </>
      )}
    </div>
  );
}
