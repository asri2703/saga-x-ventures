import type { MetadataRoute } from "next";
import { services } from "@/lib/services";
import { site } from "@/lib/site";

/**
 * Generated at /sitemap.xml. Submit this URL in Google Search Console after
 * launch — it is the fastest way to get every page indexed.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const updated = new Date();

  const staticPages = [
    { path: "", priority: 1 },
    { path: "/services", priority: 0.9 },
    { path: "/about", priority: 0.7 },
    { path: "/contact", priority: 0.8 },
  ];

  return [
    ...staticPages.map((page) => ({
      url: `${site.url}${page.path}`,
      lastModified: updated,
      changeFrequency: "monthly" as const,
      priority: page.priority,
    })),
    ...services.map((service) => ({
      url: `${site.url}/services/${service.slug}`,
      lastModified: updated,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
