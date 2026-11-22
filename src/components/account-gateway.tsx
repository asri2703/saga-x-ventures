import Link from "next/link";
import type { Product } from "@/lib/products";

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
}: {
  account: "cent" | "standard";
  title: string;
  note: string;
  products: Product[];
}) {
  return (
    <div
      data-reveal
      className="flex flex-col border border-rule bg-paper-raised p-7 sm:p-8"
    >
      <p className="text-sm text-pine-faint">
        {account === "cent" ? "Cent account" : "Standard account"}
      </p>
      <h3 className="display mt-2 text-2xl text-pine">{title}</h3>
      <p className="mt-3 leading-relaxed text-pine-soft">{note}</p>

      <ul className="mt-7 flex-1 space-y-5 border-t border-rule pt-7">
        {products.map((product) => (
          <li key={product.key}>
            <p className="display text-lg text-pine">
              &ldquo;{product.forWho}&rdquo;
            </p>
            <p className="mt-1 text-sm font-semibold text-pine-faint">
              {product.name}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-pine-soft">
              {product.summary}
            </p>
            <Link
              href={product.href}
              prefetch={false}
              className="mt-3 inline-block text-sm text-pine underline decoration-ruby decoration-2 underline-offset-4"
            >
              {product.cta}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
