import { beforeEach, expect, test, vi } from "vitest";

/**
 * The ingest route's decisions: which requests reach the database. The
 * database and the cache are mocked; the parsing and the checks are real.
 */

const storeReport = vi.fn();
const revalidatePath = vi.fn();
const SECRET = "s".repeat(40);
let config: unknown = { secret: SECRET, logins: [12345678] };

vi.mock("next/cache", () => ({
  revalidatePath: (...a: unknown[]) => revalidatePath(...a),
}));
vi.mock("@/lib/record-feed", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/record-feed")>();
  return {
    ...real,
    feedConfig: () => config,
    storeReport: (...a: unknown[]) => storeReport(...a),
  };
});

const { POST } = await import("@/app/api/record/ingest/route");

const BODY = {
  login: 12345678,
  taken_at: Math.floor(Date.now() / 1000),
  balance: 50000,
  equity: 49900,
};

const req = (body: unknown, auth = `Bearer ${SECRET}`) =>
  new Request("http://localhost:3000/api/record/ingest", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: auth },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

beforeEach(() => {
  storeReport.mockReset();
  revalidatePath.mockReset();
  config = { secret: SECRET, logins: [12345678] };
});

test("stores a good report and refreshes the page", async () => {
  const res = await POST(req(BODY));
  expect(res.status).toBe(200);
  expect(storeReport).toHaveBeenCalledOnce();
  expect(revalidatePath).toHaveBeenCalledWith("/copytrade");
});

test("closed when unconfigured", async () => {
  config = null;
  expect((await POST(req(BODY))).status).toBe(503);
  expect(storeReport).not.toHaveBeenCalled();
});

test("a wrong secret is refused before the body is read", async () => {
  expect((await POST(req("not json", "Bearer wrong"))).status).toBe(401);
  expect(storeReport).not.toHaveBeenCalled();
});

test("malformed JSON and invalid fields are 400", async () => {
  expect((await POST(req("{nope"))).status).toBe(400);
  expect((await POST(req({ ...BODY, balance: "x" }))).status).toBe(400);
  expect(storeReport).not.toHaveBeenCalled();
});

test("another account's figures are refused", async () => {
  expect((await POST(req({ ...BODY, login: 999 }))).status).toBe(403);
  expect(storeReport).not.toHaveBeenCalled();
});

test("a database failure is 500 and does not refresh the page", async () => {
  storeReport.mockRejectedValueOnce(new Error("down"));
  expect((await POST(req(BODY))).status).toBe(500);
  expect(revalidatePath).not.toHaveBeenCalled();
});
