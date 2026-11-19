"use client";

import Link from "next/link";
import { useState } from "react";
import { site } from "@/lib/site";
import { ButtonAnchor, ButtonLink } from "@/components/ui";

/**
 * The three-question router.
 *
 * The questions ask about the visitor's life, never about our products. A
 * newcomer does not know what an EA is, so "Signal or EA?" would be answered
 * with the back button. Time available and appetite to learn are things anyone
 * can answer about themselves, and they separate the two paths cleanly.
 *
 * No email gate before the result. The recommendation is shown first and the
 * contact step comes after, once there is something worth sending.
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
        : "Masa awak kurang 30 minit sehari. Belajar trade manual memerlukan lebih daripada itu, dan separuh jalan lebih merugikan daripada tidak mula.",
    href: "/automatik",
    cta: "Lihat cara ia berfungsi",
    alt: { label: "Asas Trading, bila awak ada masa nanti", href: "/belajar/asas" },
  };

  if (want === "auto" || time === "little") return automatik;

  if (want === "unsure") {
    return {
      path: "Tengok dulu, percuma",
      why:
        "Awak belum pasti, dan itu jawapan yang jujur. Tiada gunanya awak beli apa-apa hari ini. Tengok dulu bagaimana kami terangkan sesuatu, kemudian baru putuskan.",
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
      <div className="mx-auto max-w-2xl">
        <p className="text-sm font-semibold text-text-muted">
          Berdasarkan jawapan awak
        </p>

        <div className="mt-4 rounded-2xl border border-line bg-paper p-7 sm:p-9">
          <h2 className="font-display text-3xl font-bold leading-tight text-navy sm:text-4xl">
            {result.path}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-text-muted">
            {result.why}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <ButtonLink href={result.href} variant="brand" size="lg">
              {result.cta}
            </ButtonLink>
            <ButtonLink href={result.alt.href} variant="outline" size="lg">
              {result.alt.label}
            </ButtonLink>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-line bg-mist p-6">
          <p className="text-sm leading-relaxed text-text-muted">
            Nak kami hantar pelan ini kepada awak dan jawab soalan? Mesej
            WhatsApp di bawah sudah terisi dengan jawapan awak.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <ButtonAnchor
              href={`https://wa.me/${site.phoneRaw}?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noopener noreferrer"
              variant="primary"
            >
              Hantar pelan ini ke WhatsApp
            </ButtonAnchor>
            <button
              type="button"
              onClick={() => {
                setAnswers({});
                setStep(0);
              }}
              className="text-sm font-semibold text-text-muted underline underline-offset-4 hover:text-text"
            >
              Jawab semula
            </button>
          </div>
        </div>

        <p className="mt-6 text-sm leading-relaxed text-text-muted">
          {site.riskLine}
        </p>
      </div>
    );
  }

  const q = questions[step];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-text-muted" role="status">
          Soalan {step + 1} dari {questions.length}
        </p>
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="text-sm font-semibold text-text-muted underline underline-offset-4 hover:text-text"
          >
            Kembali
          </button>
        ) : null}
      </div>

      {/* Progress is three segments, not a bar — three questions is few enough
          that a person can see the whole thing at once. */}
      <div className="mt-3 flex gap-1.5" aria-hidden>
        {questions.map((item, i) => (
          <span
            key={item.key}
            className={`h-1 flex-1 rounded-full ${i <= step ? "bg-pink" : "bg-line"}`}
          />
        ))}
      </div>

      <fieldset className="mt-8">
        <legend className="font-display text-2xl font-bold leading-snug text-navy sm:text-3xl">
          {q.legend}
        </legend>
        {q.help ? (
          <p className="mt-3 text-text-muted">{q.help}</p>
        ) : null}

        <div className="mt-7 space-y-3">
          {q.options.map((o) => {
            const checked = answers[q.key] === o.value;
            return (
              <label
                key={o.value}
                className={`flex cursor-pointer items-start gap-3.5 rounded-xl border p-4 transition-colors sm:p-5 ${
                  checked
                    ? "border-navy bg-paper"
                    : "border-line bg-paper hover:border-line-strong"
                }`}
              >
                <input
                  type="radio"
                  name={q.key}
                  value={o.value}
                  checked={checked}
                  onChange={() => choose(q.key, o.value)}
                  className="mt-1 h-5 w-5 shrink-0 accent-pink"
                />
                <span className="text-lg leading-snug text-text">{o.label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* Some people arrive knowing exactly what they came for. Making them
          play the quiz first would lose them. */}
      <div className="mt-8 border-t border-line pt-6">
        <p className="text-sm text-text-muted">
          Saya dah tahu apa saya nak —{" "}
          <Link
            href="/automatik"
            className="font-semibold text-navy underline underline-offset-4"
          >
            trading automatik
          </Link>{" "}
          atau{" "}
          <Link
            href="/belajar"
            className="font-semibold text-navy underline underline-offset-4"
          >
            belajar trade sendiri
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
