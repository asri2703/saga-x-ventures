import { expect, test } from "vitest";
import { GET } from "@/app/go/[product]/route";

/**
 * Attribution is the reason this site exists: Mastery Signal and Fukyaa are
 * promoted by other people too, so a click that leaves here has to be
 * countable. Every outbound link goes through this route.
 */

const ctx = (product: string) =>
  ({ params: Promise.resolve({ product }) }) as Parameters<typeof GET>[1];

const req = (product: string) =>
  new Request(`https://sagaxventures.com/go/${product}`);

test("a known key redirects to its destination", async () => {
  const res = await GET(req("broker-cent"), ctx("broker-cent"));
  expect(res.status).toBe(302);
  expect(res.headers.get("location")).toContain("invitid=004VL9-TRMRV13456");
});

test("the two products do not share a broker link", async () => {
  const fukyaa = await GET(req("broker-cent"), ctx("broker-cent"));
  const mastery = await GET(req("broker-standard"), ctx("broker-standard"));
  expect(mastery.headers.get("location")).toContain("invitid=1AA974-WAVJR35865");
  expect(mastery.headers.get("location")).not.toEqual(
    fukyaa.headers.get("location"),
  );
});

test("an unknown key 404s rather than redirecting to undefined", async () => {
  const res = await GET(req("nope"), ctx("nope"));
  expect(res.status).toBe(404);
  expect(res.headers.get("location")).toBeNull();
});

test("a key that is not a string at all is refused, not forwarded", async () => {
  const res = await GET(req("__proto__"), ctx("__proto__"));
  expect(res.status).toBe(404);
  expect(res.headers.get("location")).toBeNull();
});

test("the redirect is temporary so the count is not cached away", async () => {
  // A 301/308 lets the browser skip this route on every later click, which
  // would silently stop the counting this route exists to do.
  const res = await GET(req("whatsapp"), ctx("whatsapp"));
  expect(res.status).toBe(302);
  expect(res.headers.get("cache-control")).toMatch(/no-store/);
});

/* ------------------------------------------------------------------ *
 * WhatsApp prefills.
 *
 * The float was the only CTA routed through the counter, while the five
 * that people actually press went straight to wa.me. The counter would
 * have measured the demoted channel and missed the primary one. Each page
 * carries its own prefill, so the key travels in the query string and the
 * message is resolved server-side.
 * ------------------------------------------------------------------ */

test("a prefill key reaches WhatsApp as encoded text", async () => {
  const res = await GET(
    new Request("https://sagaxventures.com/go/whatsapp?m=coaching"),
    ctx("whatsapp"),
  );
  const location = res.headers.get("location")!;
  expect(res.status).toBe(302);
  expect(location).toContain("wa.me/");
  expect(decodeURIComponent(location)).toContain("coaching");
});

test("an unknown prefill key still sends the visitor to WhatsApp", async () => {
  // A bad key is our bug, not theirs. Dropping them on a 404 to protect a
  // counter would be the wrong trade.
  const res = await GET(
    new Request("https://sagaxventures.com/go/whatsapp?m=nonsense"),
    ctx("whatsapp"),
  );
  expect(res.status).toBe(302);
  expect(res.headers.get("location")).toContain("wa.me/");
});

test("no page builds a WhatsApp href that bypasses the counter", async () => {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const walk = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) return e.name === "__tests__" ? [] : walk(full);
      return /\.tsx$/.test(e.name) ? [full] : [];
    });

  for (const file of walk(path.join(process.cwd(), "src"))) {
    const text = fs.readFileSync(file, "utf8");
    expect(text, `${file} links straight to wa.me`).not.toMatch(
      /href=\{?\s*(waLink\(|["`]https:\/\/wa\.me)/,
    );
  }
});
