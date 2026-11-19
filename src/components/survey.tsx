"use client";

import Link from "next/link";
import { useState } from "react";
import { site } from "@/lib/site";
import { ButtonAnchor, ButtonLink } from "@/components/ui";

/**
 * The three-question router — the app's main control.
 *
 * It sits on the home screen rather than behind a link, because arriving and
 * immediately using something is most of what separates a product from a page.
 *
 * The questions ask about the visitor's day, never about our products: someone
 * who does not know what an EA is cannot answer "signal or EA?". Everything
 * runs in the browser, nothing is stored, and no email is asked for before the
 * result — the contact step comes after, with the answers already written into
 * a WhatsApp message.
 */

type Answers = { time?: string; want?: string; level?: string };

const questions = [
  {
    key: "time" as const,
    legend: "Berapa masa awak boleh luangkan untuk trade setiap hari?",
    help: "Jawab ikut keadaan sebenar, bukan ikut yang awak harap.",
    options: [
      { value: "little", label: "Kurang 30 minit" },
      { value: "some", label: "Sejam dua" },
      { value: "lots", label: "Lebih dua jam" },
    ],
  },
  {
    key: "want" as const,
    legend: "Mana lebih dekat dengan apa awak mahu?",
    options: [
      { value: "learn", label: "Saya nak faham pasaran dan buat keputusan sendiri" },
      { value: "auto", label: "Saya nak sistem yang jalan sendiri" },
      { value: "unsure", label: "Belum pasti — saya nak tengok dulu" },
    ],
  },
  {
    key: "level" as const,
    legend: "Pengalaman trading awak?",
    options: [
      { value: "none", label: "Belum pernah" },
      { value: "tried", label: "Pernah cuba, tapi tak konsisten" },
      { value: "active", label: "Dah trade, cuma nak perbaiki hasil" },
    ],
  },
];

type Result = {
  path: string;
  why: string;
  href: string;
  cta: string;
  alt: { label: string; href: string };
};

function decide({ time, want, level }: Answers): Result {
  const automatik: Result = {
    path: "Trading Automatik",
    why:
      want === "auto"
        ? "Awak mahu sistem yang jalan sendiri, jadi tiada sebab untuk awak duduk depan carta."
        : "Masa awak kurang 30 minit sehari. Belajar trade manual perlukan lebih daripada itu, dan separuh jalan lebih merugikan daripada tidak mula.",
    href: "/automatik",
    cta: "Lihat cara ia berfungsi",
    alt: { label: "Asas Trading, bila ada masa nanti", href: "/belajar/asas" },
  };

  if (want === "auto" || time === "little") return automatik;

  if (want === "unsure") {
    return {
      path: "Tengok dulu, percuma",
      why:
        "Awak belum pasti, dan itu jawapan yang jujur. Tiada gunanya awak beli apa-apa hari ini.",
      href: "/lounge/video",
      cta: "Tonton video pengenalan",
      alt: { label: "Bandingkan dua jalan", href: "/#jalan" },
    };
  }

  if (level === "active") {
    return {
      path: "Trading Strategy + Signal",
      why:
        "Awak sudah trade. Yang awak perlukan bukan asas, tetapi sistem yang boleh diulang dan idea yang lebih baik setiap minggu.",
      href: "/belajar/strategi",
      cta: "Lihat kursus strategi",
      alt: { label: "Mastery Signal", href: "/signal" },
    };
  }

  if (level === "tried") {
    return {
      path: "Asas Trading, kemudian Strategy",
      why:
        "Pernah cuba tapi tak konsisten biasanya bermaksud ada lubang dalam asas — selalunya saiz lot dan pengurusan risiko, bukan carta.",
      href: "/belajar/asas",
      cta: "Lihat kursus asas",
      alt: { label: "Mastery Signal sebagai sokongan", href: "/signal" },
    };
  }

  return {
    path: "Asas Trading",
    why:
      "Awak mahu faham pasaran dan awak bermula dari sifar. Mula dari awal, bukan dari strategi orang lain.",
    href: "/belajar/asas",
    cta: "Lihat kursus asas",
    alt: { label: "Tonton video pengenalan dulu", href: "/lounge/video" },
  };
}

function label(key: keyof Answers, value?: string) {
  const q = questions.find((x) => x.key === key);
  return q?.options.find((o) => o.value === value)?.label ?? "—";
}

export function Survey() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});

  const done = step >= questions.length;
  const result = done ? decide(answers) : null;

  function choose(key: keyof Answers, value: string) {
    setAnswers((a) => ({ ...a, [key]: value }));
    setStep((s) => s + 1);
  }

  if (done && result) {
    const message = [
      "Hi Saga X Ventures, saya baru habis survey di laman web.",
      "",
      `Masa sehari: ${label("time", answers.time)}`,
      `Saya mahu: ${label("want", answers.want)}`,
      `Pengalaman: ${label("level", answers.level)}`,
      "",
      `Cadangan: ${result.path}`,
    ].join("\n");

    return (
      <div className="rounded-2xl bg-panel p-5 ring-1 ring-line sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky">
          Jalan awak
        </p>
        <h2 className="mt-3 font-display text-2xl font-bold leading-tight sm:text-3xl">
          {result.path}
        </h2>
        <p className="mt-3 leading-relaxed text-text-muted">{result.why}</p>

        <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
          <ButtonLink href={result.href} variant="brand" size="block">
            {result.cta}
          </ButtonLink>
          <ButtonLink href={result.alt.href} variant="panel" size="block">
            {result.alt.label}
          </ButtonLink>
        </div>

        <div className="mt-5 border-t border-line pt-5">
          <ButtonAnchor
            href={`https://wa.me/${site.phoneRaw}?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noopener noreferrer"
            variant="primary"
            size="block"
          >
            Hantar pelan ini ke WhatsApp
          </ButtonAnchor>
          <button
            type="button"
            onClick={() => {
              setAnswers({});
              setStep(0);
            }}
            className="mt-3 w-full text-sm font-semibold text-text-muted underline underline-offset-4 hover:text-text"
          >
            Jawab semula
          </button>
        </div>
      </div>
    );
  }

  const q = questions[step];

  return (
    <div className="rounded-2xl bg-panel p-5 ring-1 ring-line sm:p-7">
      <div className="flex items-center justify-between gap-4">
        <p
          className="text-xs font-semibold uppercase tracking-[0.14em] text-sky"
          role="status"
        >
          Soalan {step + 1} dari {questions.length}
        </p>
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="text-sm font-semibold text-text-muted hover:text-text"
          >
            Kembali
          </button>
        ) : null}
      </div>

      {/* Three segments rather than a bar: three is few enough to see whole. */}
      <div className="mt-3 flex gap-1.5" aria-hidden>
        {questions.map((item, i) => (
          <span
            key={item.key}
            className={`h-1 flex-1 rounded-full ${i <= step ? "bg-pink" : "bg-line"}`}
          />
        ))}
      </div>

      <fieldset className="mt-6">
        <legend className="font-display text-xl font-bold leading-snug sm:text-2xl">
          {q.legend}
        </legend>
        {q.help ? (
          <p className="mt-2 text-sm text-text-muted">{q.help}</p>
        ) : null}

        <div className="mt-5 space-y-2.5">
          {q.options.map((o) => {
            const checked = answers[q.key] === o.value;
            return (
              <label
                key={o.value}
                className={`flex cursor-pointer items-center gap-3.5 rounded-xl bg-raised p-4 ring-1 transition-colors ${
                  checked ? "ring-sky" : "ring-line hover:ring-line-strong"
                }`}
              >
                <input
                  type="radio"
                  name={q.key}
                  value={o.value}
                  checked={checked}
                  onChange={() => choose(q.key, o.value)}
                  className="h-5 w-5 shrink-0 accent-pink"
                />
                <span className="leading-snug">{o.label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* Some people arrive knowing exactly what they want. */}
      <p className="mt-5 border-t border-line pt-5 text-sm text-text-muted">
        Dah tahu?{" "}
        <Link href="/automatik" className="font-semibold text-sky underline underline-offset-4">
          Trading automatik
        </Link>{" "}
        atau{" "}
        <Link href="/belajar" className="font-semibold text-sky underline underline-offset-4">
          belajar sendiri
        </Link>
      </p>
    </div>
  );
}
