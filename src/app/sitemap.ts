import type { MetadataRoute } from "next";
import { getPosts } from "@/lib/blog";
import { courses } from "@/lib/products";
import { site } from "@/lib/site";

/**
 * Generated at /sitemap.xml. Submit this URL in Google Search Console after
 * launch — it is the fastest way to get every page indexed.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const updated = new Date();

  const staticPages = [
    { path: "", priority: 1 },
    { path: "/mula", priority: 0.9 },
    { path: "/belajar", priority: 0.9 },
    { path: "/automatik", priority: 0.9 },
    { path: "/signal", priority: 0.8 },
    { path: "/lounge", priority: 0.7 },
    { path: "/lounge/video", priority: 0.6 },
    { path: "/lounge/artikel", priority: 0.7 },
    { path: "/lounge/event", priority: 0.6 },
    { path: "/tentang", priority: 0.7 },
    { path: "/hubungi", priority: 0.6 },
    { path: "/risiko", priority: 0.4 },
    { path: "/privasi", priority: 0.3 },
  ];

  return [
    ...staticPages.map((page) => ({
      url: `${site.url}${page.path}`,
      lastModified: updated,
      changeFrequency: "monthly" as const,
      priority: page.priority,
    })),
    ...courses.map((course) => ({
      url: `${site.url}/belajar/${course.slug}`,
      lastModified: updated,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    // Posts carry their own publish date, which is more useful to a crawler
    // than a build timestamp shared by every page.
    ...getPosts().map((post) => ({
      url: `${site.url}/lounge/artikel/${post.slug}`,
      lastModified: new Date(`${post.date}T00:00:00Z`),
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
}
