import type { Metadata } from "next";
import Image from "next/image";
import { site, waLink } from "@/lib/site";
import {
  ButtonAnchor,
  ButtonLink,
  Container,
  Section,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "Tentang",
  description: `${site.founder.name} dan Saga X Ventures — apa yang kami jual, apa yang kami tidak buat, dan kenapa.`,
};

export default function TentangPage() {
  return (
    <>
      <section className="bg-navy text-on-dark">
        <Container className="py-20 sm:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <h1 className="font-display text-4xl font-extrabold leading-[1.05] sm:text-6xl">
                {site.founder.name}
              </h1>
              <p className="mt-4 text-sm font-semibold text-sky">
                {site.founder.role}, {site.name}
              </p>
              <p className="mt-6 max-w-xl text-xl leading-relaxed text-on-dark-muted">
                {site.plain}
              </p>
            </div>
            <div className="relative aspect-[4/5] w-full max-w-xs overflow-hidden rounded-2xl border border-white/10">
              <Image
                src={site.founder.photo}
                alt={site.founder.name}
                fill
                sizes="(min-width: 1024px) 20rem, 60vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </Container>
      </section>

      {/*
        The proof section is deliberately left to be filled rather than
        invented. Numbers nobody can stand behind are worse than none, and in a
        category this crowded an unverifiable claim is the fastest way to be
        grouped with everyone else making them.
      */}
      <Section tone="mist">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-display text-2xl font-bold text-navy">
            Rekod dan pengalaman
          </h2>
          <div className="mt-6 rounded-2xl border border-dashed border-line-strong bg-paper p-8">
            <p className="leading-relaxed text-text-muted">
              Bahagian ini menunggu isi: berapa lama berdagang, berapa ramai
              pernah diajar, testimoni, dan latar belakang sebelum ini.
            </p>
            <p className="mt-4 leading-relaxed text-text-muted">
              Ia sengaja dibiarkan kosong dan bukan diisi dengan angka yang
              tidak boleh dipertahankan.
            </p>
          </div>
        </div>
      </Section>

      <Section tone="paper">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-display text-2xl font-bold text-navy">
            Apa yang kami buat, dan apa yang tidak
          </h2>
          <dl className="mt-8 space-y-6">
            <div>
              <dt className="font-semibold text-text">Kami jual</dt>
              <dd className="mt-1.5 leading-relaxed text-text-muted">
                Perisian trading automatik, signal, dan pendidikan trading.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-text">Kami tidak buat</dt>
              <dd className="mt-1.5 leading-relaxed text-text-muted">
                Kami tidak menguruskan dana sesiapa, tidak memegang wang
                pelanggan, dan tidak memberi nasihat pelaburan peribadi. Setiap
                akaun dagangan dibuka dan dimiliki oleh pelanggan sendiri.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-text">Kami terima komisen</dt>
              <dd className="mt-1.5 leading-relaxed text-text-muted">
                Apabila awak buka akaun melalui pautan kami, broker membayar
                kami komisen rujukan. Ia tidak menambah kos kepada awak. Kami
                nyatakannya supaya awak boleh timbang sendiri.
              </dd>
            </div>
          </dl>

          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href="/mula" variant="brand">
              Jawab tiga soalan
            </ButtonLink>
            <ButtonAnchor
              href={waLink()}
              target="_blank"
              rel="noopener noreferrer"
              variant="outline"
            >
              Tanya di WhatsApp
            </ButtonAnchor>
          </div>
        </div>
      </Section>
    </>
  );
}
