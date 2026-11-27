import { headers } from "next/headers";

/**
 * The path prefix for links inside HQ.
 *
 * On apps.sagaxventures.com the host rewrite serves /apps/* without the
 * prefix, so links there are host-relative (""). On the main domain, or a
 * preview URL, they keep "/apps".
 */
export async function hqBase(): Promise<string> {
  const host = (await headers()).get("host") ?? "";
  return host.startsWith("apps.") ? "" : "/apps";
}
