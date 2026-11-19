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
    <div className="py-16 sm:py-24">
      <Container>
        <div className="mx-auto mb-12 max-w-2xl">
          <h1 className="font-display text-4xl font-extrabold leading-[1.08] text-navy sm:text-5xl">
            Tiga soalan, kemudian kami cadang satu jalan
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-text-muted">
            Bukan borang pendaftaran. Tiada e-mel diminta. Jawapan awak
            menentukan apa yang kami tunjuk selepas ini.
          </p>
        </div>
        <Survey />
      </Container>
    </div>
  );
}
