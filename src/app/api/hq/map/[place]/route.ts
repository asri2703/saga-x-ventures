import { mapSvg } from "@/lib/terminal/map-svg";
import { PLACES, placeBySlug } from "@/lib/terminal/places";

/**
 * Locator maps for story covers, one per place in the gazetteer, built at
 * deploy time and served as static SVG. /api/hq/map/hormuz and so on.
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return PLACES.map((p) => ({ place: p.slug }));
}

export async function GET(_: Request, ctx: RouteContext<"/api/hq/map/[place]">): Promise<Response> {
  const { place } = await ctx.params;
  const found = placeBySlug(place);
  if (!found) return new Response(null, { status: 404 });
  return new Response(mapSvg(found), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=604800",
    },
  });
}
