import { ButtonLink, Container } from "@/components/ui";

export default function NotFound() {
  return (
    <Container className="py-32 text-center sm:py-40">
      {/* Navy, not pink: pink text on the mist background measures about
          3.1:1, under the 4.5:1 AA asks of normal text. */}
      <p className="font-mono text-sm font-semibold text-text-muted">404</p>
      <h1 className="mt-4 font-display text-3xl font-bold text-navy sm:text-4xl">
        Halaman itu tiada
      </h1>
      <p className="mx-auto mt-4 max-w-md leading-relaxed text-text-muted">
        Pautan mungkin sudah lapuk atau halaman telah berpindah. Kalau awak tak
        pasti nak ke mana, tiga soalan itu tempat terbaik untuk mula.
      </p>
      <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
        <ButtonLink href="/mula" size="lg">
          Mula — tiga soalan
        </ButtonLink>
        <ButtonLink href="/" variant="outline" size="lg">
          Laman utama
        </ButtonLink>
      </div>
    </Container>
  );
}
