"use client";

import { useState } from "react";
import { services } from "@/lib/services";
import { site } from "@/lib/site";
import { Button } from "@/components/ui";

/**
 * Quote request form.
 *
 * Submitting composes a formatted WhatsApp message and hands the visitor off
 * to WhatsApp. Deliberate choice, for two reasons:
 *   1. It works today with zero backend, no email provider, and no monthly fee.
 *   2. Malaysian SMEs answer WhatsApp. An email form drops enquiries into an
 *      inbox nobody checks on a Saturday.
 *
 * TODO (when you want enquiries stored rather than just messaged): replace
 * `handleSubmit` with a Next.js Server Action that writes to a database or
 * sends mail via Resend. The field names below are already the shape you want.
 */

const budgets = [
  "Under RM3,000",
  "RM3,000 – RM10,000",
  "RM10,000 – RM30,000",
  "Above RM30,000",
  "Not sure yet",
];

const timelines = ["As soon as possible", "Within 1–3 months", "Just exploring"];

const fieldClass =
  "w-full rounded-xl border border-line bg-surface px-4 py-3 text-body placeholder:text-faint transition-colors focus:border-accent focus:outline-none";

const labelClass = "mb-2 block text-sm font-medium text-body";

export function QuoteForm() {
  const [sent, setSent] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const value = (key: string) => String(data.get(key) ?? "").trim();

    const selectedServices = data.getAll("services").join(", ") || "Not specified";

    const message = [
      `New enquiry from ${site.url}`,
      "",
      `Name: ${value("name")}`,
      `Business: ${value("business") || "—"}`,
      `Email: ${value("email") || "—"}`,
      `Phone: ${value("phone") || "—"}`,
      `Services: ${selectedServices}`,
      `Budget: ${value("budget")}`,
      `Timeline: ${value("timeline")}`,
      "",
      "Details:",
      value("message") || "—",
    ].join("\n");

    window.open(
      `https://wa.me/${site.phoneRaw}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
    setSent(true);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelClass}>
            Your name <span className="text-accent">*</span>
          </label>
          <input
            id="name"
            name="name"
            required
            autoComplete="name"
            className={fieldClass}
            placeholder="Ahmad Faiz"
          />
        </div>
        <div>
          <label htmlFor="business" className={labelClass}>
            Business name
          </label>
          <input
            id="business"
            name="business"
            autoComplete="organization"
            className={fieldClass}
            placeholder="Faiz Enterprise Sdn Bhd"
          />
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className={fieldClass}
            placeholder="you@company.com"
          />
        </div>
        <div>
          <label htmlFor="phone" className={labelClass}>
            Phone / WhatsApp <span className="text-accent">*</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            className={fieldClass}
            placeholder="012-345 6789"
          />
        </div>
      </div>

      <fieldset>
        <legend className={labelClass}>What do you need help with?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {services.map((s) => (
            <label
              key={s.slug}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-muted transition-colors hover:border-line-bright has-checked:border-accent/60 has-checked:text-body"
            >
              <input
                type="checkbox"
                name="services"
                value={s.name}
                className="h-4 w-4 accent-accent"
              />
              {s.name}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="budget" className={labelClass}>
            Rough budget
          </label>
          {/* Asking budget here saves both sides a wasted call, and signals
              that we are not the cheapest option — which filters well. */}
          <select
            id="budget"
            name="budget"
            defaultValue="Not sure yet"
            className={fieldClass}
          >
            {budgets.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="timeline" className={labelClass}>
            Timeline
          </label>
          <select
            id="timeline"
            name="timeline"
            defaultValue="Within 1–3 months"
            className={fieldClass}
          >
            {timelines.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="message" className={labelClass}>
          Tell us about your business
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          className={`${fieldClass} resize-y`}
          placeholder="What you sell, who your customers are, and what you have already tried."
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg">
          Send enquiry
        </Button>
        <p className="text-sm text-faint">
          Opens WhatsApp with your details filled in.
        </p>
      </div>

      {sent ? (
        <p
          role="status"
          className="rounded-xl border border-accent/40 bg-accent/10 px-5 py-4 text-sm text-body"
        >
          WhatsApp should have opened in a new tab — just press send. If nothing
          happened, your browser may have blocked the popup: message us directly
          at{" "}
          <a href={`tel:+${site.phoneRaw}`} className="font-semibold text-accent">
            {site.phoneDisplay}
          </a>{" "}
          or email{" "}
          <a href={`mailto:${site.email}`} className="font-semibold text-accent">
            {site.email}
          </a>
          .
        </p>
      ) : null}
    </form>
  );
}
