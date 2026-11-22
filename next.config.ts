import type { NextConfig } from "next";

/**
 * The five agency service pages and their index are gone with the pivot to
 * trading. The site is recent and lightly indexed, so these redirects are
 * cheap insurance rather than a rescue: any link still pointing at the old
 * offering lands on the homepage instead of a 404.
 */
const retiredServicePaths = [
  "/services",
  "/services/website-development",
  "/services/google-ads",
  "/services/social-media-ads",
  "/services/seo",
  "/services/system-development",
];

const nextConfig: NextConfig = {
  async redirects() {
    return retiredServicePaths.map((source) => ({
      source,
      destination: "/",
      permanent: true,
    }));
  },
};

export default nextConfig;
