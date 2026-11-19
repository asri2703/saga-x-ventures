import type { Metadata } from "next";
import { site } from "@/lib/site";
import { Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Privasi",
  description: `Bagaimana ${site.name} mengendalikan maklumat awak.`,
};

export default function PrivasiPage() {
  return (
    <Section tone="mist" className="pt-16 sm:pt-20">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-4xl font-extrabold leading-[1.08] text-navy sm:text-5xl">
          Privasi
        </h1>

        <div className="mt-10 space-y-10">
          <section>
            <h2 className="font-display text-xl font-bold text-navy">
              Apa yang laman ini kumpul
            </h2>
            <p className="mt-3 leading-relaxed text-text-muted">
              Survey tiga soalan berjalan sepenuhnya dalam pelayar awak. Jawapan
              tidak dihantar ke mana-mana pelayan dan tidak disimpan oleh kami.
              Ia hanya meninggalkan peranti awak jika awak sendiri menekan
              butang WhatsApp, yang menyalin jawapan itu ke dalam mesej yang
              awak hantar.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-navy">
              Bila awak hubungi kami
            </h2>
            <p className="mt-3 leading-relaxed text-text-muted">
              Mesej WhatsApp dan e-mel yang awak hantar disimpan dalam akaun
              masing-masing dan digunakan untuk menjawab awak. Kami tidak
              menjual maklumat itu kepada sesiapa.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-navy">
              Hubungi
            </h2>
            <p className="mt-3 leading-relaxed text-text-muted">
              Soalan tentang maklumat awak boleh dihantar ke{" "}
              <a
                href={`mailto:${site.email}`}
                className="font-semibold text-navy underline underline-offset-4"
              >
                {site.email}
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </Section>
  );
}
