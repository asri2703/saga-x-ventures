import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/**
 * Served at /robots.txt.
 *
 * Vercel gives every branch and pull request its own public preview URL. If
 * Google indexes those, you end up competing against copies of your own site.
 * VERCEL_ENV is "production" only on the live deployment, so previews are
 * blocked automatically and you never have to remember to do it.
 */
export default function robots(): MetadataRoute.Robots {
  const isProduction = process.env.VERCEL_ENV === "production";

  if (!isProduction) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
