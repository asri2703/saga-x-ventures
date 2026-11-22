import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

/**
 * Markdown-backed blog.
 *
 * Posts are plain .md files in /content/blog with frontmatter. Everything is
 * read and rendered at build time, so each post ships as static HTML with no
 * database, no CMS subscription, and nothing to maintain. Writing a post means
 * adding a file — which is the point: a blog that is awkward to publish to
 * does not get published to.
 */

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export type PostMeta = {
  slug: string;
  title: string;
  /** Shown on cards and used as the meta description */
  excerpt: string;
  /** ISO date, e.g. "2026-08-20" */
  date: string;
  /** Which service this post supports — drives the cross-link back to it */
  service?: string;
  tags: string[];
  readingMinutes: number;
};

export type Post = PostMeta & { html: string };

/** ~200 wpm is the usual reading pace for this kind of prose. */
function readingMinutes(markdown: string) {
  const words = markdown.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function readPost(fileName: string): Post {
  const slug = fileName.replace(/\.md$/, "");
  const raw = fs.readFileSync(path.join(BLOG_DIR, fileName), "utf8");
  const { data, content } = matter(raw);

  if (!data.title || !data.date) {
    throw new Error(
      `content/blog/${fileName} is missing a title or date in its frontmatter`,
    );
  }

  return {
    slug,
    title: String(data.title),
    excerpt: String(data.excerpt ?? ""),
    date: String(data.date),
    service: data.service ? String(data.service) : undefined,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    readingMinutes: readingMinutes(content),
    html: marked.parse(content, { async: false }),
  };
}

/** Newest first. */
export function getPosts(): Post[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".md"))
    .map(readPost)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getPost(slug: string): Post | undefined {
  return getPosts().find((p) => p.slug === slug);
}

/**
 * The newest `limit` posts, for the homepage and anywhere else that shows a
 * short list.
 *
 * It exists so no caller writes `getPosts()[0]` or slices by hand. The blog
 * can legitimately be empty — the agency-era posts were deleted with the
 * pivot and replacements are written as they are written — so every surface
 * that shows "latest writing" has to render nothing gracefully rather than
 * reach into an empty array.
 */
export function latestPosts(limit: number): PostMeta[] {
  if (limit <= 0) return [];
  return getPosts().slice(0, limit);
}
