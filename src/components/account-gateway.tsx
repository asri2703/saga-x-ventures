import type { Product } from "@/lib/products";
import { Eyebrow, Panel, TextLink } from "@/components/shell";

/**
 * One column of the fork.
 *
 * The products divide by broker account type, not by name — the two invite
 * codes are per account — so opening and funding an account is said once per
 * column rather than three times across three bands.
 */
export function AccountGateway({
  account,
  title,
  note,
  products,
  now,
}: {
  account: "cent" | "standard";
  title: string;
  note: string;
  products: Product[];
  /**
   * Passed in rather than read here. One product's deposit minimum is
   * promotional and dated, so the clock is read once on the page that owns
   * the revalidate window instead of separately inside a component.
   */
  now: Date;
}) {
  return (
    <Panel className="flex flex-col">
      <Eyebrow tone="quiet">
        {account === "cent" ? "Cent account" : "Standard account"}
      </Eyebrow>
      <h3 className="display mt-3 text-2xl text-pine">{title}</h3>
      <p className="mt-3 leading-relaxed text-pine-soft">{note}</p>

      <ul className="mt-8 flex-1 space-y-6">
        {products.map((product) => {
          const requirement = product.requirement(now);
          return (
            <li
              key={product.key}
              className="rounded-[var(--radius-float)] bg-paper p-5"
            >
              <p className="display text-lg text-pine">
                &ldquo;{product.forWho}&rdquo;
              </p>
              <p className="mt-1 text-sm font-semibold text-pine-faint">
                {product.name}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-pine-soft">
                {product.summary}
              </p>
              {/* What it takes to start. The cent column's minimum is the one
                  qualifier that decides whether to bother, and the fork used
                  to send people to a product page before mentioning it. */}
              {requirement ? (
                <p className="mt-3 inline-block rounded-full bg-sage px-3 py-1 text-xs font-semibold text-pine">
                  {requirement}
                </p>
              ) : null}
              <div className="mt-4">
                <TextLink href={product.href} className="text-sm">
                  {product.cta}
                </TextLink>
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
