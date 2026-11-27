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
    return [
      ...retiredServicePaths.map((source) => ({
        source,
        destination: "/",
        permanent: true,
      })),
      /* The Mastery Signal page is gone; the product has a site of its own
         and the menu, the footer and the packages all point there now.
         Redirecting rather than deleting outright is what keeps an old
         link — a bookmark, a message, a crawler that saw it once — from
         landing on nothing. Permanent, so any standing the URL had moves
         across rather than being dropped.

         Not through /go: that route exists to count clicks this site sent,
         and a visitor arriving on a dead URL is not a click this site sent. */
      {
        source: "/mastery-signal",
        destination: "https://www.masterysignal.com/",
        permanent: true,
      },
      /* /about is gone. Who Asri is was never a page's worth on its own —
         it is the dark band on the homepage, which a reader reaches by
         scrolling rather than by leaving. The URL sat in the nav and the
         footer of every page for months, so links to it exist in messages
         and in whatever a crawler already saw. Permanent, so the standing
         it had moves to the homepage rather than being dropped. */
      {
        source: "/about",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
