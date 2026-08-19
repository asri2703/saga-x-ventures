import { ButtonLink, Container } from "@/components/ui";

export default function NotFound() {
  return (
    <Container className="py-32 text-center sm:py-40">
      <p className="font-mono text-sm text-accent">404</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-body sm:text-4xl">
        That page does not exist
      </h1>
      <p className="mx-auto mt-4 max-w-md leading-relaxed text-muted">
        The link may be outdated, or the page has moved. Everything we do is
        listed under services.
      </p>
      <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
        <ButtonLink href="/" size="lg">
          Back to home
        </ButtonLink>
        <ButtonLink href="/services" variant="outline" size="lg">
          See services
        </ButtonLink>
      </div>
    </Container>
  );
}
