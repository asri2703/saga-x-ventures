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
  const res = await GET(req("fukyaa-broker"), ctx("fukyaa-broker"));
  expect(res.status).toBe(302);
  expect(res.headers.get("location")).toContain("invitid=004VL9-TRMRV13456");
});

test("the two products do not share a broker link", async () => {
  const fukyaa = await GET(req("fukyaa-broker"), ctx("fukyaa-broker"));
  const mastery = await GET(req("mastery-broker"), ctx("mastery-broker"));
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
