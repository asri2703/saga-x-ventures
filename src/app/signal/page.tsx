import type { Metadata } from "next";
import { products } from "@/lib/products";
import { site, waLink } from "@/lib/site";
import {
  ButtonAnchor,
  CheckItem,
  Container,
  RiskNote,
  Section,
} from "@/components/ui";

const product = products.find((p) => p.slug === "signal")!;

export const metadata: Metadata = {
  title: "Signal & Self-Trade — Mastery Signal",
  description:
    "Signal dan analisis untuk awak yang buat keputusan sendiri. Sokongan, bukan autopilot.",
};

export default function SignalPage() {
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
        </Container>
      </section>

      <Section tone="mist">
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
          </div>
        </div>

        <div className="mt-12 max-w-2xl">
          <RiskNote>
            Signal ialah idea, bukan arahan dan bukan nasihat pelaburan
            peribadi. Setiap keputusan masuk dan keluar kekal milik awak.{" "}
            {site.riskLine}
          </RiskNote>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonAnchor
              href={product.external ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              variant="brand"
              size="lg"
            >
              Lihat di masterysignal.com
            </ButtonAnchor>
            <ButtonAnchor
              href={waLink("Hi, saya nak tanya pasal Mastery Signal.")}
              target="_blank"
              rel="noopener noreferrer"
              variant="outline"
              size="lg"
            >
              Tanya dulu
            </ButtonAnchor>
          </div>
        </div>
      </Section>
    </>
  );
}
