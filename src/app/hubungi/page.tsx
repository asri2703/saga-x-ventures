import type { Metadata } from "next";
import Link from "next/link";
import { site, waLink } from "@/lib/site";
import { ButtonAnchor, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Hubungi",
  description: `Hubungi ${site.name} melalui WhatsApp atau e-mel.`,
};

export default function HubungiPage() {
  return (
    <Section tone="base" className="pt-16 sm:pt-20">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-4xl font-extrabold leading-[1.08] text-text sm:text-5xl">
          Hubungi
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-text-muted">
          WhatsApp paling cepat. Kalau awak belum pasti nak tanya apa,{" "}
          <Link href="/mula" className="font-semibold text-text underline underline-offset-4">
            tiga soalan itu
          </Link>{" "}
          biasanya lebih berguna daripada mesej kosong.
        </p>

        <dl className="mt-10 space-y-6 rounded-2xl bg-panel ring-1 ring-line p-8">
          <div>
            <dt className="text-sm font-semibold text-text-faint">WhatsApp</dt>
            <dd className="mt-1">
              <a
                href={waLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="font-display text-xl font-bold text-text underline underline-offset-4"
              >
                {site.phoneDisplay}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-text-faint">E-mel</dt>
            <dd className="mt-1">
              <a
                href={`mailto:${site.email}`}
                className="font-display text-xl font-bold text-text underline underline-offset-4"
              >
                {site.email}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-text-faint">Lokasi</dt>
            <dd className="mt-1 text-text-muted">{site.locationShort}</dd>
          </div>
        </dl>

        <div className="mt-8">
          <ButtonAnchor
            href={waLink()}
            target="_blank"
            rel="noopener noreferrer"
            variant="brand"
            size="lg"
          >
            Mesej di WhatsApp
          </ButtonAnchor>
        </div>
      </div>
    </Section>
  );
}
