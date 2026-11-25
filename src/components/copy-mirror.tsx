/**
 * What copying actually looks like: a trade lands in the master account, and
 * the same trade lands in yours a beat later.
 *
 * This is the one thing about copytrade that words are bad at. "Your account
 * mirrors mine" is a sentence everybody nods at and nobody pictures, and the
 * question it leaves — do I have to do anything when a trade opens? — is the
 * question people actually ask.
 *
 * The rows carry an instrument, a direction and a size, and no money at all.
 * A profit column here would be a number nobody made, on a page selling a
 * trading product, which is a fabricated record however it is labelled. The
 * caption under the panel says what this is, for the same reason.
 */

import { Eyebrow } from "@/components/shell";

type Fill = { pair: string; side: "Buy" | "Sell"; lots: string };

/* Gold only, because that is what the EA trades. Sizes are round because
   they are a drawing of a mechanism, not a statement about position sizing. */
const FILLS: Fill[] = [
  { pair: "XAUUSD", side: "Buy", lots: "0.10" },
  { pair: "XAUUSD", side: "Sell", lots: "0.10" },
  { pair: "XAUUSD", side: "Buy", lots: "0.20" },
];

/* One cycle, in seconds, and the lag between a master fill and its copy.
   Declared here rather than typed into three places in the stylesheet. */
const CYCLE = 7.2;
const LAG = 0.7;

function Rows({ mirrored }: { mirrored: boolean }) {
  return (
    <ul className="mt-4 space-y-2">
      {FILLS.map((fill, index) => (
        <li
          key={`${fill.pair}-${index}`}
          className="copy-row"
          style={{
            animationDuration: `${CYCLE}s`,
            animationDelay: `${index * 1.1 + (mirrored ? LAG : 0)}s`,
          }}
        >
          <span className="font-semibold text-pine">{fill.pair}</span>
          <span
            className={
              fill.side === "Buy" ? "copy-side-buy" : "copy-side-sell"
            }
          >
            {fill.side}
          </span>
          <span className="tnum ml-auto text-pine-soft">{fill.lots}</span>
        </li>
      ))}
    </ul>
  );
}

export function CopyMirror() {
  return (
    <div data-reveal>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="copy-panel">
          <Eyebrow tone="quiet">My account</Eyebrow>
          <p className="mt-1 text-sm text-pine-soft">
            Provider <span className="font-semibold text-pine">Fuky AA</span>
          </p>
          <Rows mirrored={false} />
        </div>

        <div className="copy-panel copy-panel-yours">
          <Eyebrow tone="quiet">Your account</Eyebrow>
          <p className="mt-1 text-sm text-pine-soft">
            Opened in your own name, at the broker
          </p>
          <Rows mirrored />
        </div>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-pine-faint">
        A drawing of how the copying works. These are not real trades and
        there are no results in it.
      </p>
    </div>
  );
}
