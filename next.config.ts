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

/**
 * apps.sagaxventures.com is where internal tools are previewed, starting with
 * Mastery Terminal. The subdomain is served by this same deployment: a request
 * to apps.<host>/terminal is answered by /apps/terminal, and the root by /apps. `apps.localhost`
 * does the same on a laptop (http://apps.localhost:3000), because browsers
 * resolve every *.localhost name to the machine itself.
 *
 * Framework assets under /_next and the API are left alone, so they keep
 * resolving as they do on the main domain.
 */
const APPS_HOST = "apps\\.(sagaxventures\\.com|localhost)";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/",
          has: [{ type: "host", value: APPS_HOST }],
          destination: "/apps",
        },
        {
          // Everything except framework assets, API routes, the icon and
          // paths that already carry the /apps prefix.
          source: "/:path((?!_next|api|apps|icon|favicon).+)",
          has: [{ type: "host", value: APPS_HOST }],
          destination: "/apps/:path",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
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
