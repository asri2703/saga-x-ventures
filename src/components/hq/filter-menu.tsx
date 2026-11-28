"use client";

import Link from "next/link";
import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type FilterOption = { label: string; href: string; active: boolean; mono?: boolean };

/**
 * One filter as a dropdown: "Market: All markets ▾". Each choice is a link,
 * so the filter lives in the URL (shareable, works on reload, and the page
 * stays a server render). Shows a filled trigger while a filter is set.
 */
export function FilterMenu({ label, options }: { label: string; options: FilterOption[] }) {
  const current = options.find((o) => o.active) ?? options[0];
  const filtered = current !== options[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex h-11 w-full min-w-0 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto sm:px-4",
          filtered
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-card hover:border-foreground/40",
        )}
      >
        <span className={cn("hidden shrink-0 sm:inline", filtered ? "text-primary-foreground/70" : "text-muted-foreground")}>
          {label}
        </span>
        <span className="sr-only sm:hidden">{label}: </span>
        <span className={cn("flex-1 truncate text-left font-medium", current.mono && "font-mono")}>{current.label}</span>
        <ChevronDown className="size-4 shrink-0 opacity-70" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="hq max-h-80 w-60">
        <DropdownMenuLabel className="text-xs text-muted-foreground">{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((o, i) => (
          <DropdownMenuItem key={o.href} asChild className="cursor-pointer">
            <Link href={o.href} aria-current={o.active ? "page" : undefined}>
              <span className={cn("flex-1", o.mono && "font-mono", i === 0 && "font-medium")}>{o.label}</span>
              {o.active ? <Check className="size-4" aria-hidden /> : null}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
