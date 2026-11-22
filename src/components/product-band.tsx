import Link from "next/link";
import type { Product } from "@/lib/products";

/**
 * One route out of the fork.
 *
 * A band, not a card. Three identical rounded cards with the same shadow is
 * the stock SaaS treatment and says nothing; a ruled band says these are
 * three answers to one question, which is exactly what they are. The visitor
 * is sorted by what they can already do, so the band opens in their own words
 * and names the product second.
 */
export function ProductBand({
  product,
  marked = false,
}: {
  product: Product;
  /** Ruby belongs to one action per screen. Only one band gets it. */
  marked?: boolean;
}) {
  return (
    <div className="border-b border-rule py-10 first:border-t">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-xl">
          <p className="display text-xl text-pine sm:text-2xl">
            “{product.forWho}”
          </p>
          <p className="mt-4 text-sm font-semibold text-pine-faint">
            {product.name}
          </p>
          <p className="mt-2 leading-relaxed text-pine-soft">
            {product.summary}
          </p>

          {product.steps.length > 0 ? (
            <ol className="mt-5 space-y-1.5">
              {product.steps.map((step, i) => (
                <li
                  key={step.label}
                  className="flex gap-3 text-sm text-pine-soft"
                >
                  <span className="tnum text-pine-faint">{i + 1}</span>
                  {step.label}
                </li>
              ))}
            </ol>
          ) : null}

          {/* Stated plainly rather than buried. The deposit minimum is the
              single biggest qualifier, and hiding it only produces enquiries
              from people who were never going to proceed.

              Ruled in pine, not ruby: this is information, not an action, and
              ruby on every band would leave three marks competing in one
              view — which is the same as having none. */}
          {product.requirement ? (
            <p className="mt-4 border-l-2 border-pine pl-3 text-sm font-semibold text-pine">
              {product.requirement}
            </p>
          ) : null}
        </div>

        <div className="shrink-0">
          <Link
            href={product.href}
            prefetch={false}
            {...(product.external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
            className={
              marked
                ? "inline-block bg-ruby px-5 py-3 text-base font-bold text-white transition-colors hover:bg-ruby-deep"
                : "inline-block border border-pine px-5 py-3 text-base font-semibold text-pine transition-colors hover:bg-pine hover:text-paper"
            }
          >
            {product.cta}
          </Link>
        </div>
      </div>
    </div>
  );
}
