import type { Metadata } from "next";
import { waLink } from "@/lib/site";
import { ButtonAnchor, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Event",
  description: "Webinar, seminar dan kelas Saga X Ventures — akan datang dan lepas.",
};

export default function EventPage() {
  return (
    <Section tone="mist" className="pt-16 sm:pt-20">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-4xl font-extrabold leading-[1.08] text-navy sm:text-5xl">
          Event
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-text-muted">
          Webinar, seminar dan kelas. Yang akan datang di atas, rakaman yang
          lepas di bawah.
        </p>

        <div className="mt-10 rounded-2xl border border-dashed border-line-strong bg-paper p-10 text-center">
          <p className="mx-auto max-w-md leading-relaxed text-text-muted">
            Tiada sesi dijadualkan buat masa ini. Daftar dan awak akan tahu
            dahulu bila tarikh pertama diumumkan.
          </p>
          <div className="mt-7">
            <ButtonAnchor
              href={waLink("Hi, beritahu saya bila webinar atau seminar seterusnya dibuka.")}
              target="_blank"
              rel="noopener noreferrer"
              variant="brand"
            >
              Beritahu saya bila dibuka
            </ButtonAnchor>
          </div>
        </div>
      </div>
    </Section>
  );
}
