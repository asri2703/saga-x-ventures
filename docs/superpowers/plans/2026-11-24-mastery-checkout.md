# Mastery Signal Checkout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sell the three Mastery Signal packages through this site — a pop-up form, a Billplz bill, a verified callback that is the only thing which marks an order paid, one durable order row, and two notifications — so a buyer is attributable to the owner's own funnel.

**Architecture:** The browser never sees a price or a secret. A client dialog collects name, email and phone plus a plan **key**, and posts to a route handler. The handler resolves the amount from `commercial.ts`, writes a `pending` order to Supabase with the service role, creates the Billplz bill server-side and hands back its URL. Billplz takes the payment and calls back server to server; that callback — signature-verified and idempotent — is the only writer of `paid`. The buyer returns to `/checkout/done`, which reads and never writes.

**Tech Stack:** Next.js 16 App Router route handlers, `@supabase/supabase-js` (service role, server only), Billplz v3 REST, `resend`, Telegram Bot API, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-24-mastery-checkout-design.md`

## Global Constraints

- No money literal in a page or component. `claims.test.ts` fails the build on `RM\d` or `\d USD` under `src/app` or `src/components`. Every figure comes from `commercial.ts` through `formatMyr` / `masteryPlanTotalMyr`.
- The browser sends a **plan key**, never a price. `/api/checkout` resolves the amount from `masteryPlans` by key.
- Billplz amounts are in **sen**: RM99 is `9900`.
- Sandbox and live are separate accounts on separate hosts. `BILLPLZ_SANDBOX` picks the host; all three Billplz credentials must match it.
- The checkout is off unless all six are present: `BILLPLZ_API_KEY`, `BILLPLZ_COLLECTION_ID`, `BILLPLZ_X_SIGNATURE`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`. Telegram is **not** in the gate.
- Sandbox credentials must never be served from the live domain.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only. It must never be prefixed `NEXT_PUBLIC_`, imported into a client component, or logged.
- New surface styling goes in `globals.css`, not as Tailwind utilities — unlayered classes there beat utilities whatever order the classes are written in.
- Anything a client component mounts later carries no `data-reveal`; scroll reveals are collected once on mount.
- `freshness.test.ts` asserts no **page** reads the clock. Route handlers may. `/checkout/done` must not call `new Date()` in the page module.
- Uiverse credit comment stays at the top of the styles it contributes, as `.plan-switch` already does.

## Review Focus

1. **A plan key the browser invented.** `/api/checkout` must answer 400 and create neither an order nor a bill — Task 4.
2. **A verified callback for a bill id that matches no order.** Must write nothing and must not create an order — Task 5.
3. **The same callback twice.** Billplz retries. No second email, no second Telegram, no second status transition — Task 6.
4. **A notification channel throwing.** The money has moved; the callback must still answer 200, or Billplz retries for ever — Task 6.
5. **`/checkout/done` with no query, a foreign bill id, or an unpaid one.** Must never imply a payment succeeded — Task 9.

---

## File Structure

| Path | Responsibility |
|---|---|
| `src/lib/billplz.ts` | Host selection, signature verification, bill creation. No database, no email. |
| `src/lib/supabase.ts` | One service-role client factory. Server only. |
| `src/lib/checkout/config.ts` | The gate: are all six variables present, and is this a legal host for the mode. |
| `src/lib/checkout/orders.ts` | Every read and write of the `orders` table. Nothing else touches it. |
| `src/lib/notify.ts` | The buyer's email, the owner's email, the owner's Telegram message. |
| `src/app/api/checkout/route.ts` | POST: validate, price, insert, create bill, return URL. |
| `src/app/api/checkout/callback/route.ts` | POST: verify, transition, notify once. |
| `src/app/checkout/done/page.tsx` | Read-only return page. |
| `src/components/checkout-dialog.tsx` | The pop-up. Client. |
| `src/components/checkout-opener.tsx` | The button that opens it. Client. Used by both entry points. |
| `supabase/migrations/0001_orders.sql` | The table, checked in. |

---

### Task 1: Billplz client

**Files:**
- Create: `src/lib/billplz.ts`
- Test: `src/lib/__tests__/billplz.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `billplzHost(sandbox: boolean): string` — `https://www.billplz-sandbox.com` or `https://www.billplz.com`
  - `signatureSource(payload: Record<string, string>): string`
  - `verifySignature(payload: Record<string, string>, key: string): boolean`
  - `type CreateBillInput = { apiKey: string; collectionId: string; sandbox: boolean; name: string; email: string; amountSen: number; description: string; reference1: string; callbackUrl: string; redirectUrl: string }`
  - `createBill(input: CreateBillInput): Promise<{ id: string; url: string }>`

- [ ] **Step 1: Read the X-Signature specification**

Open `https://www.billplz.com/api#x-signature` and the callback section. Copy the worked example — its payload and its expected signature — into the test as a fixture. Do not reconstruct the algorithm from memory: the source string's key order, separator and which keys are excluded are the whole point, and a plausible-but-wrong implementation passes its own tests and fails against Billplz.

- [ ] **Step 2: Write the failing tests**

```ts
test("the signature source is built the way Billplz documents", () => {
  expect(signatureSource(DOC_PAYLOAD)).toBe(DOC_SOURCE);
});

test("a correct signature verifies and a tampered payload does not", () => {
  expect(verifySignature(DOC_PAYLOAD, DOC_KEY)).toBe(true);
  expect(verifySignature({ ...DOC_PAYLOAD, paid: "true" }, DOC_KEY)).toBe(false);
  expect(verifySignature(DOC_PAYLOAD, "wrong-key")).toBe(false);
});

test("x_signature is not part of what is signed", () => {
  const { x_signature, ...rest } = DOC_PAYLOAD;
  expect(signatureSource(DOC_PAYLOAD)).toBe(signatureSource(rest));
});

test("the host follows the flag", () => {
  expect(billplzHost(true)).toContain("sandbox");
  expect(billplzHost(false)).not.toContain("sandbox");
});
```

- [ ] **Step 3: Run them to verify they fail**

Run: `npx vitest run src/lib/__tests__/billplz.test.ts`
Expected: FAIL, "does not provide an export named".

- [ ] **Step 4: Implement the four functions in `src/lib/billplz.ts`**

`verifySignature` compares with `node:crypto`'s `timingSafeEqual` over equal-length buffers — a string `===` on an HMAC leaks its prefix through timing. `createBill` POSTs form-encoded to `${host}/api/v3/bills` with HTTP Basic auth, the API key as the username and an empty password, and throws on a non-2xx with the status and body in the message.

- [ ] **Step 5: Run the tests**

Run: `npx vitest run src/lib/__tests__/billplz.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/billplz.ts src/lib/__tests__/billplz.test.ts
git commit -m "feat: Billplz client and signature verification"
```

---

### Task 2: The orders table

**Files:**
- Create: `supabase/migrations/0001_orders.sql`, `src/lib/supabase.ts`, `src/lib/checkout/orders.ts`
- Test: `src/lib/__tests__/orders.test.ts`
- Modify: `package.json` (add `@supabase/supabase-js`)

**Interfaces:**
- Consumes: `MasteryPlan` from `@/lib/commercial`.
- Produces:
  - `serviceClient(): SupabaseClient` in `supabase.ts` — throws if either Supabase variable is absent.
  - `type Order = { id: string; planKey: string; amountSen: number; paidAmountSen: number | null; status: "pending" | "paid" | "failed"; billplzBillId: string | null; buyerName: string; buyerEmail: string; buyerPhone: string; paidAt: string | null; linkSentAt: string | null; notifiedAt: string | null; accessGrantedAt: string | null }`
  - `createPendingOrder(o: { planKey: MasteryPlan["key"]; amountSen: number; buyerName: string; buyerEmail: string; buyerPhone: string }): Promise<Order>`
  - `attachBillId(orderId: string, billId: string): Promise<void>`
  - `findOrderByBillId(billId: string): Promise<Order | null>`
  - `markPaid(billId: string, paidAmountSen: number, paidAt: Date): Promise<Order | null>` — returns `null` when the row was already `paid`, so the caller can tell a first transition from a retry
  - `markFailed(billId: string): Promise<void>`
  - `markLinkSent(orderId: string): Promise<boolean>` / `markNotified(orderId: string): Promise<boolean>` — each returns `true` only if it was the one that set the timestamp

- [ ] **Step 1: Write the migration**

`supabase/migrations/0001_orders.sql`, with the columns exactly as §7.8 of the spec lists them plus `paid_amount_sen integer null`. Add:
- `billplz_bill_id text unique` — the idempotency key
- `alter table orders enable row level security;` and **no policy**: the service role bypasses RLS, and without a policy nothing else can read names, emails and phone numbers
- `create index orders_status_access_idx on orders (status, access_granted_at)` — the paid-but-not-granted list the admin will ask for

- [ ] **Step 2: Apply it and confirm the table exists**

Run: `curl -s -o /dev/null -w "%{http_code}\n" -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/orders?select=id&limit=1"`
Expected: `200` (it is `404` before the migration is applied).

- [ ] **Step 3: Write the failing tests**

These run without a database. The Supabase client is mocked; what is under test is the mapping and the guard logic, not PostgREST.

```ts
test("a new order starts pending with no bill and nothing sent", () => { /* status, billplzBillId, linkSentAt, notifiedAt */ });
test("markPaid returns the order on the first call and null on a repeat", () => { /* the update is conditional on status <> 'paid' */ });
test("markLinkSent is true once and false afterwards", () => {});
test("snake_case columns map to camelCase fields", () => { /* paid_amount_sen -> paidAmountSen */ });
```

- [ ] **Step 4: Run them to verify they fail**

Run: `npx vitest run src/lib/__tests__/orders.test.ts`

- [ ] **Step 5: Install the client and implement**

```bash
npm i @supabase/supabase-js
```

`markPaid`, `markLinkSent` and `markNotified` are **conditional updates** — `.eq("status", "pending")`, `.is("link_sent_at", null)` — and report whether they matched a row. A read-then-write cannot do this: two callbacks arriving together would both read `pending` and both send.

- [ ] **Step 6: Run the tests**

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations/0001_orders.sql src/lib/supabase.ts src/lib/checkout/orders.ts src/lib/__tests__/orders.test.ts package.json package-lock.json
git commit -m "feat: orders table and its repository"
```

---

### Task 3: The gate

**Files:**
- Create: `src/lib/checkout/config.ts`
- Test: `src/lib/__tests__/checkout-config.test.ts`

**Interfaces:**
- Consumes: `site.url` from `@/lib/site`.
- Produces:
  - `type CheckoutConfig = { apiKey: string; collectionId: string; xSignature: string; sandbox: boolean; siteUrl: string }`
  - `checkoutConfig(env?: NodeJS.ProcessEnv): CheckoutConfig | null`
  - `checkoutEnabled(env?: NodeJS.ProcessEnv): boolean`

The `env` parameter exists so the tests can pass a fixture instead of mutating `process.env`.

- [ ] **Step 1: Write the failing tests**

```ts
const FULL = { BILLPLZ_API_KEY: "k", BILLPLZ_COLLECTION_ID: "c", BILLPLZ_X_SIGNATURE: "s",
  NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "r",
  RESEND_API_KEY: "re", NEXT_PUBLIC_SITE_URL: "http://localhost:3000", BILLPLZ_SANDBOX: "true" };

test("all six present enables it", () => { expect(checkoutEnabled(FULL)).toBe(true); });

test("each of the six turns it off by itself", () => {
  for (const key of ["BILLPLZ_API_KEY","BILLPLZ_COLLECTION_ID","BILLPLZ_X_SIGNATURE",
                     "NEXT_PUBLIC_SUPABASE_URL","SUPABASE_SERVICE_ROLE_KEY","RESEND_API_KEY"]) {
    expect(checkoutEnabled({ ...FULL, [key]: "" }), key).toBe(false);
  }
});

test("telegram is not in the gate", () => {
  expect(checkoutEnabled({ ...FULL, TELEGRAM_BOT_TOKEN: "", TELEGRAM_CHAT_ID: "" })).toBe(true);
});

test("sandbox credentials cannot be served from the live domain", () => {
  // A real buyer would get a sandbox payment page, a correctly signed
  // callback and a "Payment received" email for money that never moved.
  expect(checkoutEnabled({ ...FULL, NEXT_PUBLIC_SITE_URL: site.url })).toBe(false);
  expect(checkoutEnabled({ ...FULL, NEXT_PUBLIC_SITE_URL: site.url, BILLPLZ_SANDBOX: "false" })).toBe(true);
});
```

- [ ] **Step 2: Run to verify they fail** — `npx vitest run src/lib/__tests__/checkout-config.test.ts`

- [ ] **Step 3: Implement `checkoutConfig` and `checkoutEnabled`**

Compare hosts, not whole URLs: `new URL(siteUrl).host === new URL(site.url).host`.

- [ ] **Step 4: Run the tests** — Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/checkout/config.ts src/lib/__tests__/checkout-config.test.ts
git commit -m "feat: the checkout gate"
```

---

### Task 4: POST /api/checkout

**Files:**
- Create: `src/app/api/checkout/route.ts`
- Test: `src/app/__tests__/checkout-route.test.ts`

**Interfaces:**
- Consumes: Tasks 1, 2, 3; `masteryPlans`, `masteryPlanTotalMyr` from `@/lib/commercial`.
- Produces: `POST(req: Request): Promise<Response>`. Body in: `{ planKey, name, email, phone }`. Body out: `{ url: string }` on 200, `{ error: string }` otherwise.

- [ ] **Step 1: Write the failing tests**

```ts
test("an unknown plan key is refused and nothing is created", async () => {
  // Review Focus 1. A browser can send anything.
  const res = await POST(jsonReq({ planKey: "lifetime", name: "A", email: "a@b.c", phone: "0123456789" }));
  expect(res.status).toBe(400);
  expect(createPendingOrder).not.toHaveBeenCalled();
  expect(createBill).not.toHaveBeenCalled();
});

test("a price in the body is ignored", async () => {
  // The amount comes from commercial.ts by key, never from the browser.
  await POST(jsonReq({ planKey: "year", amountSen: 1, name: "A", email: "a@b.c", phone: "0123456789" }));
  const plan = masteryPlans.find((p) => p.key === "year")!;
  expect(createBill).toHaveBeenCalledWith(
    expect.objectContaining({ amountSen: masteryPlanTotalMyr(plan) * 100 }),
  );
});

test("a missing name, email or phone is refused", async () => {});
test("it returns the bill url and stores the bill id on the order", async () => {});
test("it answers 503 when the gate is closed", async () => {});
```

- [ ] **Step 2: Run to verify they fail**

- [ ] **Step 3: Implement the handler**

Order of operations: gate, validate, resolve plan, `createPendingOrder`, `createBill` with `reference_1` set to the order id, `attachBillId`, return the URL. Callback and redirect URLs are built from `config.siteUrl`. If `createBill` throws, the pending row stays and the response is 502 — the row is the evidence that somebody tried.

- [ ] **Step 4: Run the tests** — Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/api/checkout/route.ts src/app/__tests__/checkout-route.test.ts
git commit -m "feat: create a bill from a plan key"
```

---

### Task 5: POST /api/checkout/callback

**Files:**
- Create: `src/app/api/checkout/callback/route.ts`
- Test: `src/app/__tests__/checkout-callback.test.ts`

**Interfaces:**
- Consumes: Tasks 1, 2, 3.
- Produces: `POST(req: Request): Promise<Response>`.

- [ ] **Step 1: Write the failing tests**

```ts
test("an unsigned or wrongly signed callback writes nothing", async () => {
  const res = await POST(formReq({ ...PAID, x_signature: "nope" }));
  expect(res.status).toBe(401);
  expect(markPaid).not.toHaveBeenCalled();
});

test("a verified callback for a bill we do not know writes nothing", async () => {
  // Review Focus 2. It must not invent an order from the callback's fields.
  findOrderByBillId.mockResolvedValue(null);
  const res = await POST(formReq(signed(PAID)));
  expect(res.status).toBe(200);
  expect(markPaid).not.toHaveBeenCalled();
  expect(createPendingOrder).not.toHaveBeenCalled();
});

test("a verified paid callback marks the order paid", async () => {});
test("a verified unpaid callback marks it failed", async () => {});
test("a later paid callback still moves a failed order to paid", async () => {});

test("the amount that arrived is recorded separately from the amount quoted", async () => {
  await POST(formReq(signed({ ...PAID, paid_amount: "9900" })));
  expect(markPaid).toHaveBeenCalledWith(expect.any(String), 9900, expect.any(Date));
});
```

- [ ] **Step 2: Run to verify they fail**

- [ ] **Step 3: Implement the handler**

Verify first, before parsing anything into a decision. Read `paid` and `paid_amount` from the verified payload. Answer 200 for anything verified, including an unknown bill — a 4xx makes Billplz retry something that will never succeed.

- [ ] **Step 4: Run the tests** — Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/api/checkout/callback/route.ts src/app/__tests__/checkout-callback.test.ts
git commit -m "feat: the callback is the only thing that marks an order paid"
```

---

### Task 6: Notifications

**Files:**
- Create: `src/lib/notify.ts`
- Test: `src/lib/__tests__/notify.test.ts`
- Modify: `src/app/api/checkout/callback/route.ts`, `src/app/__tests__/checkout-callback.test.ts`
- Modify: `package.json` (add `resend`)

**Interfaces:**
- Consumes: `Order` from Task 2.
- Produces:
  - `notifyBuyer(order: Order): Promise<void>` — the package, the amount, `https://www.masterysignal.com/membership`, and the sentence about registering with the same email. Reply-to is `RESEND_REPLY_TO`.
  - `notifyOwner(order: Order, note?: { amountMismatch: true }): Promise<void>` — name, email, phone, package, amount, order id, to `ADMIN_EMAIL`, and the same message to Telegram.

- [ ] **Step 1: Write the failing tests**

```ts
test("the buyer is told to register with the email they paid with", async () => {
  await notifyBuyer(ORDER);
  expect(sent.html).toContain("masterysignal.com/membership");
  expect(sent.html).toMatch(/same email/i);
  expect(sent.reply_to).toBe(process.env.RESEND_REPLY_TO);
});

test("the owner's notification leads with how to reach the buyer", async () => {
  await notifyOwner(ORDER);
  expect(sent.text).toContain(ORDER.buyerPhone);
  expect(telegram.text).toContain(ORDER.buyerPhone);
});

test("a missing telegram token sends the email anyway", async () => {});
```

And in the callback's suite:

```ts
test("the same callback twice sends one email and one telegram", async () => {
  // Review Focus 3. Billplz retries; markPaid returns null the second time.
  await POST(formReq(signed(PAID)));
  markPaid.mockResolvedValue(null);
  await POST(formReq(signed(PAID)));
  expect(notifyBuyer).toHaveBeenCalledTimes(1);
  expect(notifyOwner).toHaveBeenCalledTimes(1);
});

test("a notification that throws still answers 200", async () => {
  // Review Focus 4. The money has moved. A retry cannot un-take it.
  notifyBuyer.mockRejectedValue(new Error("resend down"));
  const res = await POST(formReq(signed(PAID)));
  expect(res.status).toBe(200);
});

test("a wrong amount notifies the owner and does not email the buyer", async () => {
  markPaid.mockResolvedValue({ ...ORDER, amountSen: 87600, paidAmountSen: 9900 });
  await POST(formReq(signed({ ...PAID, paid_amount: "9900" })));
  expect(notifyBuyer).not.toHaveBeenCalled();
  expect(notifyOwner).toHaveBeenCalledWith(expect.anything(), { amountMismatch: true });
});
```

- [ ] **Step 2: Run to verify they fail**

- [ ] **Step 3: Install and implement**

```bash
npm i resend
```

Both sends are guarded by `markLinkSent` / `markNotified` returning true, and both are wrapped so a rejection is logged and swallowed.

- [ ] **Step 4: Run both suites** — Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/notify.ts src/lib/__tests__/notify.test.ts src/app/api/checkout/callback/route.ts src/app/__tests__/checkout-callback.test.ts package.json package-lock.json
git commit -m "feat: tell the buyer and the owner, once each"
```

---

### Task 7: The pop-up, and the homepage opening it

**Files:**
- Create: `src/components/checkout-dialog.tsx`, `src/components/checkout-opener.tsx`
- Modify: `src/app/globals.css`, `src/components/plan-cards.tsx`, `src/app/page.tsx`
- Test: `src/components/__tests__/checkout-dialog.test.ts`

**Interfaces:**
- Consumes: `masteryPlans`, `masteryPlanTotalMyr`, `formatMyr`; `checkoutEnabled()` from Task 3; `POST /api/checkout` from Task 4.
- Produces:
  - `<CheckoutOpener planKey={MasteryPlan["key"] | null} label={string} tone?: "accent" | "ghost" />` — renders the button and owns the dialog's open state.
  - `<CheckoutDialog planKey={...} onClose={() => void} />`

- [ ] **Step 1: Write the failing tests**

The suite runs in node with no DOM, so these read the source, as `section-padding.test.ts` and `voice.test.ts` already do.

```ts
test("the dialog states no price of its own", () => {
  expect(SOURCE).not.toMatch(/RM\s?\d/);
  expect(SOURCE).toMatch(/formatMyr|masteryPlanTotalMyr/);
});

test("it posts a plan key and not an amount", () => {
  expect(SOURCE).toMatch(/planKey/);
  expect(SOURCE).not.toMatch(/amountSen\s*:/);
});

test("it is a dialog, labelled, and escapable", () => {
  expect(SOURCE).toMatch(/aria-modal/);
  expect(SOURCE).toMatch(/aria-labelledby/);
  expect(SOURCE).toMatch(/Escape/);
});

test("the submit button cannot be pressed twice", () => {
  expect(SOURCE).toMatch(/disabled=\{/);
});

test("nothing inside the dialog carries data-reveal", () => {
  // It mounts after the reveals are collected; it would arrive hidden.
  expect(SOURCE).not.toMatch(/data-reveal/);
});

test("opened with no package, it asks for one before anything else", () => {
  // Spec 7.2a. /mastery-signal's calls to action name no term.
  expect(SOURCE).toMatch(/planKey === null|!planKey/);
  expect(SOURCE).toMatch(/masteryPlans\.map/);
});

test("it says what the details are used for and links to the notice", () => {
  // Spec 7.11. A transaction needs the notice, not a consent checkbox.
  expect(SOURCE).toMatch(/\/privacy/);
  expect(SOURCE).not.toMatch(/type="checkbox"/);
});
```

- [ ] **Step 2: Run to verify they fail**

- [ ] **Step 3: Add the dialog's styles to `globals.css`**

The Uiverse credit comment at the top of the block, as `.plan-switch` has. The title bar, the ruled sections, the figures grid, the dark footer bar carrying the figure beside the action — in paper, pine and ruby. `.checkout-*` names, because `.card`, `.title` and `.steps` as the original writes them would collide with the whole stylesheet.

- [ ] **Step 4: Implement the dialog and the opener**

Focus moves into the dialog on open and returns to the opener on close; focus is trapped while open.

**When `planKey` is null**, the first section is the three terms from `masteryPlans` — recommended marked as it is on the homepage — and choosing one replaces that section with `YOUR PACKAGE`. The rest of the form is identical, and the submit button is disabled until a term is chosen. **When `planKey` is given**, that step is skipped entirely. One component, two entry conditions.

Fields: full name, email, phone — all required, with the sentence from §7.2 under the email. Under the submit button, the notice from §7.11 and a link to `/privacy`: *Your details are used to send your registration link and to reach you about this purchase.* No checkbox.

On submit: disable, POST, then `window.location.href = url`. On failure: a message in the dialog and the WhatsApp link, with the button re-enabled.

- [ ] **Step 5: Wire the three homepage buttons**

In `plan-cards.tsx`, a plan whose `action.href` is `/go/mastery-membership` renders `<CheckoutOpener>` instead of the link **when `checkoutEnabled()`**; otherwise it renders exactly what it renders today. The gate is read on the server and passed down as a prop — `checkoutEnabled()` reads server-only variables and must not be called in a client component.

- [ ] **Step 6: Run the tests and the build**

Run: `npx vitest run && npm run build`
Expected: PASS, compiled.

- [ ] **Step 7: Commit**

```bash
git add src/components/checkout-dialog.tsx src/components/checkout-opener.tsx src/components/__tests__/checkout-dialog.test.ts src/app/globals.css src/components/plan-cards.tsx src/app/page.tsx
git commit -m "feat: the checkout pop-up, opened from the packages"
```

---

### Task 8: Opening it from /mastery-signal

**Files:**
- Modify: `src/lib/mastery-signal.ts`, `src/components/product-guide.tsx`, `src/lib/__tests__/guide.test.ts`
- Test: `src/lib/__tests__/mastery-signal.test.ts`

**Interfaces:**
- Consumes: `<CheckoutOpener>` from Task 7.
- Produces: `GuideStep` gains `opensCheckout?: true`. A step carrying it renders the opener with `planKey={null}` instead of an outbound link.

- [ ] **Step 1: Write the failing tests**

```ts
test("the direct route no longer promises a checkout that is being built", () => {
  const source = read("src/lib/mastery-signal.ts");
  expect(source).not.toMatch(/being built|will replace this step/i);
});

test("it no longer offers DuitNow QR", () => {
  // Billplz only this release; the QR path is a non-goal.
  expect(read("src/lib/mastery-signal.ts")).not.toMatch(/DuitNow|QR/);
});

test("the direct route's first step opens the checkout", () => {
  const direct = masterySignalRoutes().find((r) => r.key === "direct")!;
  expect(direct.steps[0].opensCheckout).toBe(true);
  expect(direct.steps[0].outbound).toBeNull();
});

test("a step that opens the checkout is not treated as a dead link", () => {
  // stepIsReady decides whether to render the "link coming" placeholder.
  expect(stepIsReady(step({ opensCheckout: true, cta: "Choose a package" }))).toBe(false);
});
```

- [ ] **Step 2: Run to verify they fail**

- [ ] **Step 3: Rewrite the direct route's copy and add the flag**

Step 1 becomes choosing a package and paying by FPX here. Step 2 keeps registering on masterysignal.com and being approved by hand. The route summary drops "or QR".

- [ ] **Step 4: Render it in `product-guide.tsx`**

Where `stepIsReady` is false and `opensCheckout` is true, render `<CheckoutOpener planKey={null} ...>` rather than the dashed "link coming" placeholder.

- [ ] **Step 5: Run the tests and the build** — `npx vitest run && npm run build`

- [ ] **Step 6: Commit**

```bash
git add src/lib/mastery-signal.ts src/components/product-guide.tsx src/lib/__tests__/guide.test.ts src/lib/__tests__/mastery-signal.test.ts
git commit -m "feat: open the checkout from the Mastery Signal page"
```

---

### Task 9: /checkout/done

**Files:**
- Create: `src/app/checkout/done/page.tsx`
- Test: `src/app/__tests__/checkout-done.test.ts`

**Interfaces:**
- Consumes: `findOrderByBillId` from Task 2.
- Produces: the page. It reads and never writes.

- [ ] **Step 1: Write the failing tests**

```ts
test("the page never claims a payment it cannot see", () => {
  // Review Focus 5: no query, a foreign bill id, or an unpaid order.
  const source = read("src/app/checkout/done/page.tsx");
  expect(source).toMatch(/billplz\[id\]|billplz%5Bid%5D/);
  expect(source).not.toMatch(/markPaid|createPendingOrder/);
});

test("the registration link is on the page, not only in the email", () => {
  // Email is the one part of this that fails silently.
  expect(read("src/app/checkout/done/page.tsx")).toMatch(/masterysignal\.com\/membership/);
});

test("it does not read the clock", () => {
  // freshness.test.ts asserts no page does.
  expect(read("src/app/checkout/done/page.tsx")).not.toMatch(/new Date\(\s*\)/);
});
```

- [ ] **Step 2: Run to verify they fail**

- [ ] **Step 3: Implement the page**

Three states, from the order's status: paid, pending, and anything else — including no row at all. Each says plainly what is true, and the last offers to try again and never implies success. The link is a plain `<a>` to the membership URL; it is not an outbound click to be attributed, it is the thing the buyer paid for.

- [ ] **Step 4: Run the whole suite and the build** — `npx tsc --noEmit && npm run lint && npx vitest run && npm run build`

- [ ] **Step 5: Commit**

```bash
git add src/app/checkout/done/page.tsx src/app/__tests__/checkout-done.test.ts
git commit -m "feat: the page a buyer comes back to"
```

---

## Prerequisites before Task 1 can finish

Sandbox Billplz credentials in `.env.local`: `BILLPLZ_API_KEY`, `BILLPLZ_COLLECTION_ID`, `BILLPLZ_X_SIGNATURE`, all from a **billplz-sandbox.com** account. Tasks 1 to 9 can all be written and unit-tested without them; nothing can be run end to end until they exist.
