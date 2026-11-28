import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Headings for every HQ page, set like a newspaper: the page title in the
 * news serif, and each section opened by a heavy rule with its title on it.
 */

export function PageHead({
  title,
  dek,
  actions,
  className,
}: {
  title: string;
  /** One line under the title saying what the page is. */
  dek?: ReactNode;
  /** Controls that belong to the whole page (filters), on the right. */
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="font-news text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">{title}</h1>
        {dek ? <p className="max-w-2xl text-sm text-muted-foreground">{dek}</p> : null}
      </div>
      {actions ? (
        <div className="grid min-w-0 grid-cols-2 gap-2 sm:flex sm:shrink-0 sm:items-center">{actions}</div>
      ) : null}
    </header>
  );
}

export function SectionHead({
  title,
  note,
  href,
  linkLabel,
}: {
  title: string;
  note?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t-2 border-foreground pt-2">
      <h2 className="font-news text-xl font-semibold">{title}</h2>
      {href ? (
        <Link href={href} className="shrink-0 text-sm font-medium underline-offset-4 hover:underline">
          {linkLabel ?? "See all"}
        </Link>
      ) : note ? (
        <p className="hidden truncate text-xs text-muted-foreground sm:block">{note}</p>
      ) : null}
    </div>
  );
}
