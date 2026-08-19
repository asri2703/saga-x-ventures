/**
 * FAQ accordion built on native <details>/<summary>.
 *
 * No client JavaScript, keyboard-accessible for free, and the answers stay in
 * the HTML so Google can index them — which matters because FAQ content often
 * wins featured snippets.
 */
export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <>
      <div className="divide-y divide-line rounded-2xl border border-line bg-elevated/40">
        {items.map((item) => (
          <details key={item.q} className="group px-6 py-5">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-left font-medium text-body [&::-webkit-details-marker]:hidden">
              {item.q}
              <svg
                aria-hidden
                viewBox="0 0 20 20"
                className="mt-1 h-4 w-4 shrink-0 text-accent transition-transform duration-200 group-open:rotate-45"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M10 4v12M4 10h12" />
              </svg>
            </summary>
            <p className="mt-4 max-w-2xl leading-relaxed text-muted">{item.a}</p>
          </details>
        ))}
      </div>

      {/* FAQPage schema — makes these eligible for rich results in Google. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: items.map((item) => ({
              "@type": "Question",
              name: item.q,
              acceptedAnswer: { "@type": "Answer", text: item.a },
            })),
          }),
        }}
      />
    </>
  );
}
