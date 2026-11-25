import { BadgeCheck, Repeat2, UserPlus, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { ActionOut } from "@/components/shell";

/**
 * The four steps, side by side on one track.
 *
 * Shape from the layout the owner chose: numbered nodes joined by a rule,
 * and a card under each one carrying its instruction and the few facts a
 * reader needs before doing it.
 *
 * It replaced a wizard that showed one step at a time. The wizard was
 * compact and the reader could not see what they were committing to; this
 * is the opposite trade, taken deliberately. Four instructions for opening
 * and funding a real account are something a person reads through once
 * before starting and scrolls back to while doing, and both of those want
 * every step on the page at once.
 *
 * Server-rendered, with no state at all, which is why it is not a client
 * component: nothing here moves.
 *
 * The numbers are decorative. The order is carried by the list itself, so a
 * screen reader counts the steps without reading a number that is already
 * in its announcement.
 */

export type TrackStep = {
  n: number;
  title: string;
  body: ReactNode;
  /** The two or three facts worth knowing before doing this one. */
  points: string[];
  action?: { label: string; href: string; tone?: "ink" | "accent" };
};

/* Paired with the steps by position, not stored on them: an icon is how
   this component draws a step, not something the step knows about itself. */
const ICONS: LucideIcon[] = [UserPlus, BadgeCheck, Wallet, Repeat2];

export function StepTrack({ steps }: { steps: TrackStep[] }) {
  return (
    <ol className="track">
      {steps.map((step, index) => {
        const Icon = ICONS[index % ICONS.length];
        return (
          <li key={step.n} className="track-cell" data-reveal>
            <span aria-hidden className="track-node">
              {step.n}
            </span>

            <div className="track-card">
              <span aria-hidden className="track-icon">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>

              <h3 className="display mt-5 text-xl text-pine">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-pine-soft">
                {step.body}
              </p>

              <ul className="track-points">
                {step.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>

              {step.action ? (
                <div className="mt-auto pt-5">
                  <ActionOut
                    href={step.action.href}
                    tone={step.action.tone ?? "ink"}
                  >
                    {step.action.label}
                  </ActionOut>
                </div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
