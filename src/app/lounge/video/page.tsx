import type { Metadata } from "next";
import { waLink } from "@/lib/site";
import { ButtonAnchor, ButtonLink, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Video",
  description: "Tutorial dan penjelasan pendek daripada Traders Lounge.",
};

export default function VideoPage() {
  return (
    <Section tone="base" className="pt-16 sm:pt-20">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-4xl font-extrabold leading-[1.08] text-text sm:text-5xl">
          Video
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-text-muted">
          Tutorial dan penjelasan pendek — asas trading, cara baca berita, dan
          soalan yang paling kerap ditanya.
        </p>

        {/* Honest empty state. Nothing is published yet, and filling this with
            placeholder thumbnails would teach visitors to distrust the rest. */}
        <div className="mt-10 rounded-2xl border border-dashed border-line-strong bg-panel p-10 text-center">
          <p className="mx-auto max-w-md leading-relaxed text-text-muted">
            Video pertama sedang dirakam. Tinggalkan mesej dan kami beritahu
            awak bila ia keluar.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <ButtonAnchor
              href={waLink("Hi, beritahu saya bila video Traders Lounge keluar.")}
              target="_blank"
              rel="noopener noreferrer"
              variant="brand"
            >
              Beritahu saya
            </ButtonAnchor>
            <ButtonLink href="/mula" variant="outline">
              Sementara itu — jawab tiga soalan
            </ButtonLink>
          </div>
        </div>
      </div>
    </Section>
  );
}
