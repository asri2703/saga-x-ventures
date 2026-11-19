import type { Metadata } from "next";
import Link from "next/link";
import { products } from "@/lib/products";
import { site, waLink } from "@/lib/site";
import {
  ButtonAnchor,
  ButtonLink,
  CheckItem,
  Container,
  RiskNote,
  Section,
  SectionHeading,
} from "@/components/ui";

const product = products.find((p) => p.slug === "automatik")!;

export const metadata: Metadata = {
  title: "Trading Automatik — Fukyaa",
  description:
    "Sistem yang trade pada akaun awak sendiri tanpa awak perlu depan skrin. Awak pegang akaun; kami tidak pegang wang awak.",
};

/**
 * Deliberately called "Trading Automatik", never "pengurusan aset".
 *
 * Asset and fund management are licensed activities under the Capital Markets
 * and Services Act. What is actually sold here is software running on an
 * account the customer opens and owns, so the name has to match the thing. The
 * benefit a buyer wants — not having to learn, not having to watch — survives
 * the honest wording intact.
 */
const steps = [
  {
    title: "Buka akaun broker",
    body: "Akaun dibuka atas nama awak sendiri. Kami tunjuk broker mana dan kenapa, berapa minimum, dan berapa lama kelulusan ambil masa.",
    note: "Kami menerima komisen rujukan daripada broker. Ia tidak menambah kos kepada awak, dan kami nyatakannya di sini supaya awak tahu.",
  },
  {
    title: "Deposit dan sedia",
    body: "Modal masuk ke akaun awak. Ia kekal di sana, di bawah nama awak, dan awak boleh keluarkan bila-bila mengikut syarat broker.",
  },
  {
    title: "Hantar borang di fukyaa.com",
    body: "Borang pendek untuk sambungkan sistem kepada akaun awak. Awak akan dibawa ke fukyaa.com — itu laman produk kami sendiri, bukan pihak ketiga.",
  },
  {
    title: "Sistem dipasang dan disambung ke VPS",
    body: "Bahagian kami. Sistem berjalan di pelayan, bukan di komputer awak — jadi awak tak perlu biarkan PC terbuka 24 jam.",
  },
];

export default function AutomatikPage() {
  return (
    <>
      <section className="bg-navy text-on-dark">
        <Container className="py-20 sm:py-28">
          <p className="text-sm font-semibold text-sky">{product.brand}</p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-extrabold leading-[1.05] sm:text-6xl">
            {product.label}
          </h1>
          <p className="mt-6 max-w-xl text-xl leading-relaxed text-on-dark-muted">
            {product.summary}
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <ButtonLink href="#langkah" variant="brand" size="lg">
              Mula — empat langkah
            </ButtonLink>
            <ButtonAnchor
              href={waLink("Hi, saya nak tanya pasal Trading Automatik (Fukyaa).")}
              target="_blank"
              rel="noopener noreferrer"
              variant="light"
              size="lg"
            >
              Tanya dulu
            </ButtonAnchor>
          </div>
        </Container>
      </section>

      <Section tone="paper">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl font-bold text-navy">
              Sesuai untuk awak kalau
            </h2>
            <ul className="mt-6 space-y-3">
              {product.forYouIf.map((p) => (
                <CheckItem key={p}>{p}</CheckItem>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-navy">
              Bukan untuk awak kalau
            </h2>
            <ul className="mt-6 space-y-3">
              {product.notForYouIf.map((p) => (
                <CheckItem key={p} tone="no">
                  {p}
                </CheckItem>
              ))}
            </ul>
            <p className="mt-6 text-sm leading-relaxed text-text-muted">
              Kalau yang kedua lebih dekat dengan awak,{" "}
              <Link
                href="/belajar"
                className="font-semibold text-navy underline underline-offset-4"
              >
                jalan belajar
              </Link>{" "}
              lebih sesuai. Kami lebih suka awak beli benda yang betul daripada
              beli benda yang salah.
            </p>
          </div>
        </div>
      </Section>

      <Section tone="mist" id="langkah">
        <SectionHeading
          title="Empat langkah"
          lead="Urutan ini tidak boleh ditukar — sistem tidak boleh berjalan sebelum ada akaun untuk ia berjalan di atasnya."
        />
        {/* Numbered because it genuinely is a sequence: each step needs the one
            before it to exist. */}
        <ol className="mt-12 space-y-4">
          {steps.map((s, i) => (
            <li
              key={s.title}
              className="flex gap-5 rounded-2xl border border-line bg-paper p-6 sm:gap-7 sm:p-8"
            >
              <span
                aria-hidden
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy font-display text-base font-bold text-on-dark"
              >
                {i + 1}
              </span>
              <div>
                <h3 className="font-display text-xl font-bold text-navy">
                  <span className="sr-only">Langkah {i + 1}: </span>
                  {s.title}
                </h3>
                <p className="mt-3 leading-relaxed text-text-muted">{s.body}</p>
                {s.note ? (
                  <p className="mt-4 rounded-lg bg-mist px-4 py-3 text-sm leading-relaxed text-text-muted">
                    {s.note}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-10 max-w-2xl">
          <RiskNote>{site.riskLine}</RiskNote>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonAnchor
            href={product.external ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            variant="brand"
            size="lg"
          >
            Teruskan di fukyaa.com
          </ButtonAnchor>
          <ButtonAnchor
            href={waLink("Hi, saya nak mula Trading Automatik. Boleh terangkan langkah pertama?")}
            target="_blank"
            rel="noopener noreferrer"
            variant="outline"
            size="lg"
          >
            Minta bantuan langkah demi langkah
          </ButtonAnchor>
        </div>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-text-muted">
          Pautan di atas membawa awak ke fukyaa.com, laman produk kami. Awak
          masih dalam proses yang sama — langkah 3 daripada 4.
        </p>
      </Section>

      <Section tone="navy">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-bold leading-tight">
            Siapa pegang apa
          </h2>
          <dl className="mt-8 space-y-6 text-on-dark-muted">
            <div>
              <dt className="font-semibold text-on-dark">Akaun dan modal</dt>
              <dd className="mt-1.5 leading-relaxed">
                Milik awak. Dibuka atas nama awak, di broker, dan awak yang
                pegang kata laluan. Kami tidak memegang wang awak pada
                bila-bila masa.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-on-dark">Sistem dan VPS</dt>
              <dd className="mt-1.5 leading-relaxed">
                Bahagian kami. Kos VPS dan siapa menanggungnya akan dinyatakan
                sebelum awak mula, bukan selepas.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-on-dark">Keputusan berhenti</dt>
              <dd className="mt-1.5 leading-relaxed">
                Milik awak. Awak boleh matikan sistem atau tutup akaun bila-bila
                masa tanpa melalui kami.
              </dd>
            </div>
          </dl>
        </div>
      </Section>
    </>
  );
}
