"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Lock, Sparkles } from "lucide-react";
import { generateAction, saveAction, signInAction, type ActionState } from "@/app/apps/insights/actions";
import type { InsightBody } from "@/lib/insights/topics";
import { cn } from "@/lib/utils";
import { TrendIcon } from "./trend-icon";

const START: ActionState = { error: null };

const field =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:border-[#163a30] focus-visible:ring-2 focus-visible:ring-[#163a30]/15";

function Submit({ children, busy }: { children: React.ReactNode; busy: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-fit items-center gap-2 rounded-lg bg-[#163a30] px-4 py-2 text-sm font-semibold text-[#faf4e8] transition-opacity disabled:opacity-70"
    >
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      {pending ? busy : children}
    </button>
  );
}

function FormError({ state }: { state: ActionState }) {
  return state.error ? (
    <p role="alert" className="text-sm text-[#c81f30]">
      {state.error}
    </p>
  ) : null;
}

export function SignInForm() {
  const [state, action] = useActionState(signInAction, START);
  return (
    <form action={action} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 sm:p-5">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Lock className="size-4" aria-hidden /> Writing is locked
      </p>
      <p className="text-sm text-muted-foreground">Enter the HQ admin key to write and publish insights on this browser.</p>
      <div className="flex flex-wrap gap-2">
        <input name="key" type="password" autoComplete="current-password" aria-label="HQ admin key" className={cn(field, "max-w-xs")} />
        <Submit busy="Checking">Sign in</Submit>
      </div>
      <FormError state={state} />
    </form>
  );
}

const CALLS = [
  { value: "up", label: "Up" },
  { value: "down", label: "Down" },
  { value: "flat", label: "Sideways" },
] as const;

export function Composer({ topics }: { topics: { slug: string; name: string }[] }) {
  const [state, action] = useActionState(generateAction, START);
  const [call, setCall] = useState<(typeof CALLS)[number]["value"]>("up");
  return (
    <form action={action} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Topic
          <select name="topic" className={field} defaultValue={topics[0]?.slug}>
            {topics.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Language
          <select name="language" className={field} defaultValue="en">
            <option value="en">English</option>
            <option value="ms">Bahasa Melayu</option>
          </select>
        </label>
      </div>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-sm font-medium">Your call on gold</legend>
        <input type="hidden" name="direction" value={call} />
        <div className="flex flex-wrap gap-2">
          {CALLS.map((c) => (
            <button
              key={c.value}
              type="button"
              aria-pressed={call === c.value}
              onClick={() => setCall(c.value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors",
                call === c.value ? "border-[#e3c98f] bg-[#f0dcae] text-[#163a30]" : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              <TrendIcon trend={c.value} className="size-4" label={c.label} />
              {c.label}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Notes (optional)
        <textarea
          name="notes"
          rows={3}
          maxLength={1000}
          placeholder="Your reasoning, levels or anything to stress, e.g. buy dips 3620-3630, risk is a hot wage number."
          className={field}
        />
      </label>

      <div className="flex flex-col gap-2">
        <Submit busy="Writing, about 30 seconds">
          <Sparkles className="size-4" aria-hidden /> Write the insight
        </Submit>
        <p className="text-xs text-muted-foreground">
          Claude Sonnet writes it from HQ&apos;s data and saves it as a draft. Nothing is published until you press Publish.
        </p>
        <FormError state={state} />
      </div>
    </form>
  );
}

export function EditForm({ id, title, body }: { id: string; title: string; body: InsightBody }) {
  const [state, action] = useActionState(saveAction, START);
  return (
    <form action={action} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:p-5">
      <input type="hidden" name="id" value={id} />
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Title
        <input name="title" defaultValue={title} maxLength={140} className={field} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Summary
        <textarea name="summary" defaultValue={body.summary} rows={3} maxLength={600} className={field} />
      </label>
      {body.sections.map((s, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          <input name={`heading_${i}`} defaultValue={s.heading} maxLength={80} aria-label={`Section ${i + 1} heading`} className={cn(field, "font-semibold")} />
          <textarea name={`text_${i}`} defaultValue={s.text} rows={5} maxLength={2000} aria-label={`Section ${i + 1} text`} className={field} />
        </div>
      ))}
      <Submit busy="Saving">Save changes</Submit>
      <FormError state={state} />
    </form>
  );
}
