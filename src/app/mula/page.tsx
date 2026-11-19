import type { Metadata } from "next";
import { Survey } from "@/components/survey";
import { Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "Mula di sini — tiga soalan",
  description:
    "Jawab tiga soalan ringkas dan kami tunjuk jalan mana yang sesuai: belajar trade sendiri, atau trading automatik.",
};

export default function MulaPage() {
  return (
    <div className="py-10 sm:py-14">
      <Container>
        <div className="mx-auto max-w-xl">
          <h1 className="font-display text-3xl font-extrabold leading-[1.05] sm:text-4xl">
            Tiga soalan, kemudian satu cadangan
          </h1>
          <p className="mt-4 leading-relaxed text-text-muted">
            Bukan borang pendaftaran. Tiada e-mel diminta.
          </p>
          <div className="mt-8">
            <Survey />
          </div>
        </div>
      </Container>
    </div>
  );
}
