import type { MetadataRoute } from "next";
import { getPosts } from "@/lib/blog";
import { site } from "@/lib/site";

/**
 * Generated at /sitemap.xml. Submit this URL in Search Console after launch.
 *
 * `/go/*` is deliberately absent: those are logged redirects, not pages, and
 * offering them to a crawler would both waste crawl budget and inflate the
 * click counts they exist to measure.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const updated = new Date();

  const staticPages = [
    { path: "", priority: 1 },
    { path: "/copytrade", priority: 0.9 },
    { path: "/fukyaa", priority: 0.9 },
    { path: "/coaching", priority: 0.9 },
    { path: "/events", priority: 0.8 },
    { path: "/blog", priority: 0.7 },
    { path: "/about", priority: 0.7 },
    { path: "/contact", priority: 0.6 },
    { path: "/privacy", priority: 0.2 },
  ];

  return [
    ...staticPages.map((page) => ({
      url: `${site.url}${page.path}`,
      lastModified: updated,
      changeFrequency: "monthly" as const,
      priority: page.priority,
    })),
    // Posts carry their own publish date, which is more useful to a crawler
    // than a build timestamp shared by every page.
    ...getPosts().map((post) => ({
      url: `${site.url}/blog/${post.slug}`,
      lastModified: new Date(`${post.date}T00:00:00Z`),
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
}
