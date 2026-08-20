import type { MetadataRoute } from "next";
import { getPosts } from "@/lib/blog";
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
    { path: "/blog", priority: 0.8 },
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
    // Posts carry their own publish date, which is more useful to a crawler
    // than a build timestamp shared by every page.
    ...getPosts().map((post) => ({
      url: `${site.url}/blog/${post.slug}`,
      lastModified: new Date(`${post.date}T00:00:00Z`),
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
  ];
}
