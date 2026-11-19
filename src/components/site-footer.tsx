import Link from "next/link";
import { site, waLink } from "@/lib/site";
import { Container } from "@/components/ui";
import { Logo, Wordmark } from "@/components/logo";

const columns = [
  {
    title: "Jalan awak",
    links: [
      { href: "/mula", label: "Mula di sini" },
      { href: "/belajar", label: "Belajar trade sendiri" },
      { href: "/automatik", label: "Trading automatik" },
      { href: "/signal", label: "Signal" },
    ],
  },
  {
    title: "Traders Lounge",
    links: [
      { href: "/lounge/video", label: "Video" },
      { href: "/lounge/artikel", label: "Artikel" },
      { href: "/lounge/event", label: "Event" },
    ],
  },
  {
    title: "Syarikat",
    links: [
      { href: "/tentang", label: "Tentang" },
      { href: "/hubungi", label: "Hubungi" },
      { href: "/risiko", label: "Penzahiran risiko" },
      { href: "/privasi", label: "Privasi" },
    ],
  },
];

export function SiteFooter() {
  const socials = [
    { href: site.social.facebook, label: "Facebook" },
    { href: site.social.instagram, label: "Instagram" },
    { href: site.social.youtube, label: "YouTube" },
  ].filter((s) => s.href);

  return (
    <footer className="bg-navy text-on-dark-muted">
      <Container className="py-16 sm:py-20">
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Link
              href="/"
              className="flex items-center gap-2.5 text-on-dark"
              aria-label={`${site.name} — laman utama`}
            >
              <Logo className="h-8 w-8" />
              <Wordmark className="text-[15px]" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed">{site.plain}</p>
            <a
              href={waLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-block text-sm font-semibold text-sky underline decoration-sky/40 underline-offset-4 hover:decoration-sky"
            >
              {site.phoneDisplay}
            </a>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h2 className="font-display text-sm font-bold text-on-dark">
                {col.title}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm transition-colors hover:text-on-dark"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* The risk line sits above the copyright, at full width, rather than
            being folded into the small print beside it. It is the most
            consequential sentence on the site. */}
        <p className="mt-14 border-t border-white/10 pt-8 text-sm leading-relaxed text-on-dark-muted">
          {site.riskLine} Saga X Ventures menjual perisian, signal dan
          pendidikan. Kami tidak menguruskan dana pelanggan dan tidak memegang
          wang awak — setiap akaun dagangan dibuka dan dimiliki oleh awak
          sendiri.
        </p>

        <div className="mt-8 flex flex-col gap-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.name}. {site.locationShort}.
          </p>
          {socials.length ? (
            <ul className="flex gap-5">
              {socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-on-dark"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Container>
    </footer>
  );
}
