import { outbound, whatsappUrl, type OutboundKey } from "@/lib/products";

/**
 * Logged outbound redirect.
 *
 * Mastery Signal and Fukyaa are promoted by people other than us, so a visit
 * arriving at either one is not necessarily ours. Sending every outbound
 * click through this route is how a click that started here stays countable.
 *
 * Plan 2 writes a row per hit. The route exists now so that every link in the
 * site is already final and nothing has to be rewritten to start counting.
 */

/** `in` would also match inherited keys like `__proto__` or `toString`. */
function destinationFor(product: string): string | undefined {
  return Object.hasOwn(outbound, product)
    ? outbound[product as OutboundKey]
    : undefined;
}

export async function GET(
  request: Request,
  ctx: RouteContext<"/go/[product]">,
) {
  const { product } = await ctx.params;
  const destination = destinationFor(product);

  if (!destination) {
    return new Response("Unknown destination", { status: 404 });
  }

  // WhatsApp carries a per-page opening line. The page sends a key rather
  // than the sentence so the message stays in one place and the link stays
  // short enough to read.
  const resolved =
    product === "whatsapp"
      ? whatsappUrl(new URL(request.url).searchParams.get("m"))
      : destination;

  /**
   * 302, not 301. A permanent redirect lets the browser go straight to the
   * destination on every later click, which would quietly stop the counting
   * this route exists to do. `no-store` closes the same hole at the CDN.
   */
  return new Response(null, {
    status: 302,
    headers: {
      location: resolved,
      "cache-control": "no-store, max-age=0",
    },
  });
}
