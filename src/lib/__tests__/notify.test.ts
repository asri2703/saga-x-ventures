import { beforeEach, expect, test, vi } from "vitest";
import type { Order } from "@/lib/checkout/orders";

/**
 * What the buyer and the owner are told.
 *
 * Resend and Telegram are faked at the network boundary, so the assertions
 * are on the message that would actually be sent — its recipient, its
 * reply-to, and the facts in it — rather than on which function was called.
 */

const sendEmail = vi.fn();
let fetchCalls: { url: string; body: string }[] = [];

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: (...a: unknown[]) => sendEmail(...a) };
  },
}));

const ENV = {
  RESEND_API_KEY: "re_test",
  RESEND_FROM: "Saga X Ventures <no-reply@sagaxventures.com>",
  RESEND_REPLY_TO: "enquiry@sagaxventures.com",
  ADMIN_EMAIL: "owner@example.com",
  TELEGRAM_BOT_TOKEN: "bot-token",
  TELEGRAM_CHAT_ID: "999",
};

const { notifyBuyer, notifyOwner } = await import("@/lib/notify");

const ORDER: Order = {
  id: "order-1",
  planKey: "year",
  amountSen: 87600,
  paidAmountSen: 87600,
  status: "paid",
  billplzBillId: "bill-1",
  buyerName: "Aminah",
  buyerEmail: "aminah@example.com",
  buyerPhone: "0123456789",
  paidAt: "2026-11-24T02:00:00Z",
  linkSentAt: null,
  notifiedAt: null,
  accessGrantedAt: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  fetchCalls = [];
  Object.assign(process.env, ENV);
  sendEmail.mockResolvedValue({ data: { id: "email-1" }, error: null });
  vi.stubGlobal("fetch", async (url: string, init?: { body?: string }) => {
    fetchCalls.push({ url: String(url), body: String(init?.body ?? "") });
    return new Response("{}", { status: 200 });
  });
});

test("the buyer is given the registration link", async () => {
  await notifyBuyer(ORDER);
  const [message] = sendEmail.mock.calls[0] as [Record<string, string>];
  expect(message.to).toBe("aminah@example.com");
  expect(message.html).toContain("masterysignal.com/membership");
});

test("the buyer is told to register with the email they paid with", async () => {
  // It is the only thing joining the payment here to the account there.
  await notifyBuyer(ORDER);
  const [message] = sendEmail.mock.calls[0] as [Record<string, string>];
  expect(message.html).toMatch(/same email/i);
});

test("the buyer's reply goes to the published address, not the owner's inbox", async () => {
  await notifyBuyer(ORDER);
  const [message] = sendEmail.mock.calls[0] as [Record<string, string>];
  expect(message.replyTo).toBe("enquiry@sagaxventures.com");
  expect(JSON.stringify(message)).not.toContain("owner@example.com");
});

test("the buyer's email states the package and what was paid", async () => {
  await notifyBuyer(ORDER);
  const [message] = sendEmail.mock.calls[0] as [Record<string, string>];
  expect(message.html).toContain("12 months");
  expect(message.html).toContain("876");
});

test("the owner's notification leads with how to reach the buyer", async () => {
  // He chases people who paid and never registered. The phone number is the
  // part he acts on.
  await notifyOwner(ORDER);
  const [message] = sendEmail.mock.calls[0] as [Record<string, string>];
  expect(message.to).toBe("owner@example.com");
  expect(message.text).toContain("0123456789");
  expect(message.text).toContain("aminah@example.com");
  expect(fetchCalls[0].url).toContain("api.telegram.org");
  expect(fetchCalls[0].body).toContain("0123456789");
});

test("an amount mismatch is said plainly in the owner's notification", async () => {
  await notifyOwner({ ...ORDER, paidAmountSen: 9900 }, { amountMismatch: true });
  const [message] = sendEmail.mock.calls[0] as [Record<string, string>];
  expect(message.subject).toMatch(/mismatch/i);
  expect(message.text).toContain("876");
  expect(message.text).toContain("99");
});

test("a missing telegram token still sends the email", async () => {
  // Telegram is not in the checkout gate for this reason.
  process.env.TELEGRAM_BOT_TOKEN = "";
  await notifyOwner(ORDER);
  expect(sendEmail).toHaveBeenCalled();
  expect(fetchCalls).toHaveLength(0);
});

test("a telegram failure does not stop the owner's email", async () => {
  vi.stubGlobal("fetch", async () => {
    throw new Error("telegram down");
  });
  await expect(notifyOwner(ORDER)).resolves.toBeUndefined();
  expect(sendEmail).toHaveBeenCalled();
});

/* ------------------------------------------------------------------ *
 * What Resend does on failure, and what this has to do about it.
 * ------------------------------------------------------------------ */

test("a Resend error is raised, not swallowed", async () => {
  // The SDK does not throw on an API error — it resolves with
  // { data: null, error }. Ignoring that is a buyer who paid, received
  // nothing, and left no trace of why.
  sendEmail.mockResolvedValue({
    data: null,
    error: { name: "validation_error", message: "domain is not verified" },
  });
  await expect(notifyBuyer(ORDER)).rejects.toThrow(/not verified/);
});

test("the owner's email failing still sends the telegram", async () => {
  // Two channels exist so that one failing is not silence. Awaiting the
  // email first made the second conditional on the first.
  sendEmail.mockRejectedValue(new Error("resend unreachable"));
  await expect(notifyOwner(ORDER)).rejects.toThrow();
  expect(fetchCalls[0]?.url).toContain("api.telegram.org");
});

test("the owner's telegram failing still sends the email", async () => {
  vi.stubGlobal("fetch", async () => {
    throw new Error("telegram down");
  });
  await notifyOwner(ORDER);
  expect(sendEmail).toHaveBeenCalled();
});

test("a missing sender address is raised rather than sent as empty", async () => {
  // RESEND_FROM is not in the checkout gate, and an empty from fails exactly
  // like an outage.
  process.env.RESEND_FROM = "";
  await expect(notifyBuyer(ORDER)).rejects.toThrow(/RESEND_FROM/);
});

test("a missing ADMIN_EMAIL is raised rather than sent to nobody", async () => {
  process.env.ADMIN_EMAIL = "";
  await expect(notifyOwner(ORDER)).rejects.toThrow(/ADMIN_EMAIL/);
});

test("the buyer's name cannot inject markup into their own email", async () => {
  await notifyBuyer({ ...ORDER, buyerName: '<img src=x onerror="alert(1)">' });
  const [message] = sendEmail.mock.calls[0] as [Record<string, string>];
  expect(message.html).not.toContain("<img");
  expect(message.html).toContain("&lt;img");
});
