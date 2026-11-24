# Mastery Signal checkout — design

24 November 2026. Supersedes the parts of
`2026-11-22-saga-x-ventures-rebuild-design.md` §7.13 that describe the manual
QR path; see §6.4 below.

---

## 1. Intent and why

The owner sells Mastery Signal membership through this site rather than
sending people to masterysignal.com, because that product is promoted by other
people too. A buyer who pays here is identifiably his. That is the whole
reason the money passes through this site at all.

What is bought here is **the package**. What is granted is **a membership on
another system**, by hand, by the owner. This design covers the money and the
handover between the two. It does not, and cannot, grant access.

## 2. Goals

1. A buyer can pay for any of the three Mastery Signal packages without
   leaving the page they are reading until Billplz takes them.
2. Every completed payment produces exactly one durable order record.
3. The owner learns of every payment through two channels, so one failing is
   not silence.
4. The buyer is told, at the moment it matters, to register on Mastery with
   the same email they paid with — that address is the only thing tying the
   two systems together.
5. The record carries what a later admin screen needs to show **paid, access
   not yet granted**.

## 3. Non-goals

- **Granting access.** Membership is approved by hand on masterysignal.com.
  Nothing here touches that system.
- **The admin screen.** It comes later. This release only has to leave the
  data in a shape it can read.
- **Manual QR, receipt upload, the Telegram Approve button.** Owner's call:
  Billplz only, because it is easier to track.
- **Promo codes.** Owner's call. The six- and twelve-month savings are
  already the discount.
- **Coaching checkout.** Different product, prices still unset.
- **Buyer accounts on this site.** There is nothing here to log in to.

## 4. Anti-goals

Ways this fails even if every test passes:

- A buyer pays and nothing reaches them.
- A payment lands that the owner cannot tie to a person.
- The callback URL can be forged, so an order can be marked paid without
  money.
- A repeated callback sends a second email, or creates a second order.
- A buyer's name, email and phone reach a Telegram chat that is not the
  owner's.
- The owner stops reading the notifications because most of them are noise.

## 5. Constraints

### 5.1 Fixed by the owner

- Billplz only, this release.
- The registration link is the existing public one,
  `https://www.masterysignal.com/membership`. It is not per-buyer: every
  package registers for the same thing, and the owner raises the tier by hand
  afterwards.
- Notifications go to `ADMIN_EMAIL` **and** to Telegram.
- The buyer's details form is a pop-up over the packages, not its own page.
- A screen after payment telling them to check their email.
- **The pop-up opens from `/mastery-signal` as well as the homepage.** That
  page has its own membership calls to action and they currently send people
  straight to masterysignal.com, where the buyer stops being identifiably his
  — which is the one thing §1 exists to prevent.

### 5.2 Fixed by Billplz

- **It is a redirect gateway.** The buyer completes payment on Billplz's own
  page. There is no embedded or iframe checkout in its documentation. No
  pop-up can hold the payment itself.
- **Sandbox and live are separate accounts** on separate domains with
  separate keys, collections and signing keys. `BILLPLZ_SANDBOX` chooses the
  host; all three credentials must match it.
- **Amounts are in sen**, not ringgit. RM99 is `9900`.
- The v3 API is in maintenance — no new features — so nothing here should
  depend on one arriving.

### 5.3 Inherited from this repo

- Every figure a client pays lives in `src/lib/commercial.ts`.
  `claims.test.ts` fails the build on a money literal inside a page or a
  component. The checkout reads `masteryPlans`; it does not restate a price.
- Every link that leaves the site goes through `/go/<OutboundKey>`.
- Tailwind utilities lose to the unlayered classes in `globals.css`. Any new
  surface styling goes in `globals.css` beside `.panel`, not as a utility
  that will silently lose.
- Scroll reveals are collected once on mount. Anything a client component
  mounts later carries no `data-reveal` — see `plan-switch.tsx`.
- No page currently reads the clock, and `freshness.test.ts` asserts it. A
  server route that reads the clock is fine; a **page** that does needs
  `revalidate`.

### 5.4 Discovered during design

Verified on 24 November by calling each service, not by reading the handover:

- `www.billplz.com` is unreachable from the owner's machine (connection
  failure, not refusal). `www.billplz-sandbox.com` is reachable.
- The Billplz credentials in `.env.local` return **401** against the sandbox
  host — almost certainly live keys against the sandbox account. **Sandbox
  credentials are the one remaining prerequisite.**
- **Supabase: the project exists** and the service role key works. The
  `orders` table does not exist yet. The project is this site's own, separate
  from the signal platform's.
- **Resend: `sagaxventures.com` is verified.** No DNS lead time to wait on.
- **Telegram: the bot is live and the chat id is the owner's own DM.** The
  bot is `@masterysignalbot` — shared with the other product, not a new one.
  Order notifications will arrive from a bot that also serves Mastery Signal.
- The Supabase **anon key returns 401**. Nothing in this design uses it —
  every write goes through route handlers with the service role — but
  anything browser-side added later will fail until it is rotated.

## 6. Approaches

### 6.1 Where the buyer types their details — pop-up chosen

Billplz owns the payment screen and returns the buyer to a real URL, so steps
3 and 4 are fixed whatever we do. Only the details step was open.

| | What it costs |
|---|---|
| **Pop-up over the packages** (chosen) | Fewest steps; the buyer never loses their place. No address to send anyone to; the three figures they were comparing sit behind the overlay. |
| Its own checkout page | A real address, shareable in a DM, order visible while typing. One more page load, and it leaves the comparison behind. |

**Owner chose the pop-up.** A dedicated page remains the obvious thing to add
later if he ever wants to send a link straight to someone.

### 6.2 How the untestable payment leg gets built — keys first

| | What it costs |
|---|---|
| Build against a local fake Billplz | Everything testable today, including failures. But a fake never lies to you, and `X-Signature` verification is exactly where the real one might. |
| **Sandbox credentials first** (chosen) | Slower to start. What gets built is the real thing from the first line, and the callback — the part most likely to be wrong — is proved against Billplz itself. |
| Everything except payment | Sellable by hand immediately, but the thing asked for is absent. |

**Owner chose keys first.** If the credentials take time, the fallback is the
fake, swapped out on arrival — not a reason to change the design.

### 6.3 Where the registration link comes from — not per-buyer

Considered: a tokenised link tied to the order, so only a payer can register.
Rejected by the owner, and he is right: every package registers for the same
basic membership, and the tier is raised by hand. A token would secure a door
that is not locked, and add a table to maintain.

**Consequence, accepted:** the only join between the payment and the account
is the email address. §7.2 and §7.5 exist because of it.

### 6.4 What happens to §7.13 of the original design

The original design specified two payment paths. The manual QR path —
receipt upload to Supabase Storage, Telegram inline **Approve**, email on
approval — is **not built**. Its safeguards are not deleted, they are deferred
with it, and the note in `.env.example` records what must be true if that
button is ever added.

The second safeguard, **paid-but-not-granted must be visible**, survives in
full. `access_granted_at` is in the table from day one even though nothing
writes it yet, because the admin that reads it is the next thing built.

## 7. Decisions

### 7.1 The buyer's path

1. The buyer opens the pop-up from one of two places:
   - **The homepage**, under "Get started". The three package buttons
     currently link to `/go/mastery-membership`; they become openers, each
     carrying its own term.
   - **`/mastery-signal`**, from the membership calls to action on that page.
     Those name no term, so the pop-up opens with **no package chosen** and
     asks for one first (§7.2a).

   The broker-deposit route is untouched in both places. It is a different
   way in, not a cheaper one, and it does not pass through here.
2. The pop-up asks for name, email and phone, and states the package and
   figure it is about to charge.
3. On submit, the browser posts to a route handler on this site. The handler
   creates the order row, creates the Billplz bill server-side, and returns
   the bill URL.
4. The browser goes to Billplz. The buyer pays by FPX.
5. Billplz calls back to this site, server to server. **That callback is the
   only thing that marks an order paid.**
6. Billplz returns the buyer to `/checkout/done`, which tells them the
   payment is received, shows the registration link, and tells them to
   register with the same email.

### 7.2 The pop-up

Built from the Uiverse form the owner chose
(`https://uiverse.io/SSpisso/kind-cobra-45`, MIT, credited in `globals.css`
beside the styles it contributes, as the product switch already is).

Structure kept: the title bar, the ruled sections, the figures grid, and the
dark footer bar carrying the large figure beside the action. Its teal-and-
cream palette is not kept; this site has three colours.

Sections, top to bottom:

- `YOUR PACKAGE` — the term, and the per-month equivalent beneath it. Read
  from `masteryPlans`, never written.
- `YOUR DETAILS` — full name, email, phone. All three required.
- Under the email field, in the quiet tone: *register on Mastery with this
  same email — it is how your payment is found.* This sentence is the whole
  reason §6.3 is safe.
- The figures grid — the term and its total, and "Pay by: FPX".
- The footer bar — the total, and **Pay with Billplz**.

Dropped from the template, with reasons recorded so nobody restores them by
accident: *Shipping* (nothing ships), *Payment method* (chosen on Billplz's
screen), *Subtotal / Shipping / Tax* (one figure, no tax), *promo code*
(§3).

**Behaviour.** Opens from any of the three package buttons and knows which.
Closes on Escape, on the backdrop, and on the close control. Focus moves into
the dialog on open and is trapped while it is open; on close it returns to
the button that opened it. `aria-modal`, labelled by its title. The submit
button disables itself and says what it is doing while the bill is being
created — a double submit must not create two bills.

**Validation** is server-side as well as in the browser. The browser's is a
convenience; the handler trusts nothing it is sent.

**Phone** is stored as given, trimmed. The owner uses it to chase people on
WhatsApp, not to dial programmatically, so no format is imposed beyond a
minimum length.

### 7.2a Opening without a package

From `/mastery-signal` nothing has been chosen yet, so the pop-up's first
section is the three terms rather than one. Picking one replaces that section
with `YOUR PACKAGE` exactly as it reads when opened from the homepage; the
rest of the form is identical. The recommended term is marked the same way it
is on the homepage, and for the same reason — it is the owner's steer, not a
default we chose for him.

From the homepage the term is already decided, so that step is skipped
entirely. One component, two entry conditions, not two components.

**Copy on `/mastery-signal` that has to change with this.** Its direct-payment
route currently reads:

> "FPX or DuitNow QR, in ringgit. Message me and I will send the details —
> checkout on this site is being built and will replace this step."

Both halves are now wrong: DuitNow QR is a non-goal (§3), and the checkout it
promises is this. The step becomes the pop-up. `mastery-signal.ts` is where
that copy lives, and `guide.test.ts` holds the shape of those routes, so the
change has test consequences rather than being a string swap.

### 7.3 Creating the bill

A route handler — `POST /api/checkout` — because the Billplz secret key must
never reach the browser.

It:

1. Validates the body: a known plan key, a name, a plausible email, a phone.
2. Resolves the amount from `masteryPlans` **by key**. The browser sends a
   plan key, never a price. A price arriving from a browser is a price a
   browser can change.
3. Inserts an `orders` row with status `pending`.
4. Creates the Billplz bill with that order's id as `reference_1`, so the
   callback can be matched even if something else goes wrong.
5. Stores the returned bill id on the row.
6. Returns the bill URL.

`callback_url` and `redirect_url` are built from `NEXT_PUBLIC_SITE_URL`.

### 7.4 The callback — the only truth

`POST /api/checkout/callback`.

- **Verify `x_signature` before anything else.** It is an HMAC of the payload
  with the X Signature key. A callback that fails verification is logged and
  answered 401; nothing is written. Without this, anyone who learns the URL
  can mark an order paid.
- **Idempotent.** A repeated callback — Billplz retries — must not create a
  second order, send a second email, or send a second Telegram message. The
  bill id is unique in the table; the transition to `paid` happens once;
  `link_sent_at` and `notified_at` guard the two sends.
- **Answer 200 quickly.** A gateway that does not get its 200 keeps retrying.
- The redirect in §7.5 is **not** trusted for this. It is a page the buyer's
  browser lands on; it can be dropped, replayed or opened twice.

**What writes each status.** The verified callback is the only writer, and it
takes the status from the `paid` flag it carries: `paid` when true, `failed`
when false. A bill can be reported unpaid and later paid, so `failed` is not
terminal — a later verified callback saying paid still moves it. What runs
once is the *consequences*: `link_sent_at` guards the buyer's email and
`notified_at` guards the owner's, so no transition can send twice. **My
call**, in answer to a reviewer asking what ever writes `failed`.

**The amount is checked.** The callback carries what was actually paid; the
row carries what was asked for. They are compared, and the amount that
arrived is stored in its own column rather than overwriting the one that was
quoted — a price change between creating the bill and paying it, or a bill
created against the wrong collection, both show up as a difference between
two recorded figures rather than as a silently corrected one.

On a mismatch the order is still marked paid, because the money did move, but
**the buyer's email is not sent automatically** and the owner's notification
says what the difference is. Sending a registration link for an amount nobody
agreed to is worse than making him look. **My call.**

### 7.5 The return page

`/checkout/done`. A real page because Billplz needs a real address.

It reads `billplz[id]` from the query and shows one of three things:

- **Paid** — "Payment received. Check your email." The registration link is
  **also on this page**, not only in the email. The owner asked for the
  check-your-email message; the link is here as well because email is the one
  part of this that fails silently, and a buyer staring at a confirmation
  with no way forward is the anti-goal in §4.
- **Still pending** — the callback has not arrived yet. Says so plainly,
  tells them the email is coming, gives the WhatsApp link.
- **Not paid / unknown** — says the payment did not complete and offers to
  try again. Never implies a failed payment succeeded.

It does not mark anything paid. It reads.

### 7.6 Email

Resend, as the rest of the site's email will be.

**To the buyer**, on the paid transition: the package, the amount, the
registration link, and the same sentence about using the same email address.
Reply-to is `RESEND_REPLY_TO` — the published enquiry address — not
`ADMIN_EMAIL`. The latter is the owner's own working inbox and is not an
address to hand to every buyer. **My call**, in answer to a reviewer asking
which of the two it meant.

**To the owner**, same moment, to `ADMIN_EMAIL`: name, email, phone, package,
amount, order id. Written so it can be acted on from a phone without opening
anything else.

Billplz sends him its own receipt as well. That is a third channel and is not
our concern, but it is why the owner-facing email leads with the buyer's
contact details rather than the money: the money is already in the other two.

### 7.7 Telegram

A plain message to `TELEGRAM_CHAT_ID` with the same details as the owner's
email. No inline buttons — there is nothing to approve in this release.

A failed Telegram send **must not** fail the callback. The money is already
taken; a notification channel being down is not a reason to tell Billplz the
callback failed and have it retry. Log it, send the email, answer 200.

### 7.8 The orders table

Supabase, in the site's own project. Shaped so the deferred admin can read it
and so the deferred manual path can be added without a migration that
rewrites history.

```
orders
  id                  uuid pk default gen_random_uuid()
  product             text        -- 'mastery-signal' for now
  plan_key            text        -- 'monthly' | 'half-year' | 'year'
  amount_sen          integer     -- what was quoted when the bill was made
  paid_amount_sen     integer null -- what the callback says actually arrived
  currency            text default 'MYR'
  method              text        -- 'billplz'
  status              text        -- 'pending' | 'paid' | 'failed'
  billplz_bill_id     text unique
  buyer_name          text
  buyer_email         text
  buyer_phone         text
  paid_at             timestamptz null
  link_sent_at        timestamptz null
  notified_at         timestamptz null
  access_granted_at   timestamptz null   -- ticked by hand in the admin
  created_at          timestamptz default now()
```

`amount_sen` is stored rather than derived, because it records what was
quoted on the day. A later price change must not rewrite history.

`paid_amount_sen` is separate rather than a correction of it, so a mismatch
stays visible as two figures instead of becoming one tidy wrong one.

**Row level security on, no public policy.** Only the service role writes,
and only from route handlers. The anon key must not be able to read this
table: it holds names, emails and phone numbers.

### 7.9 Where the figures come from

`masteryPlans` in `commercial.ts`, through `masteryPlanTotalMyr`. The pop-up
displays them through the same `formatMyr` every other figure uses. The
handler converts to sen at the point of creating the bill, in one place.

Nothing in the checkout restates a price. `claims.test.ts` already fails the
build if it tries.

### 7.10 When something breaks

- **Bill creation fails.** The pop-up says so and offers WhatsApp. The
  pending order row stays; it is evidence that somebody tried.
- **Buyer abandons at Billplz.** The row stays `pending` for ever. Harmless,
  and it is the only record that interest existed.
- **Callback never arrives.** The order stays `pending`, so the admin's
  paid-not-granted list will not show it — but Billplz's own dashboard and
  the owner's Billplz email will. Named here as a known gap: this release has
  no reconciliation job.
- **Email fails.** `link_sent_at` stays null, which is exactly the flag a
  later admin needs to re-send. The return page still carries the link.

### 7.11 Consent and PDPA

The form collects name, email and phone for a transaction, which is
processing necessary to perform what the buyer is asking for — no consent
checkbox is required for that, and a checkbox implying otherwise would be
worse than none.

A plain line under the submit button says what the details are used for and
links to `/privacy`: *Your details are used to send your registration link
and to reach you about this purchase.* **My call**, consistent with §7.11 of
the original design; change it if the owner's own reading differs.

### 7.12 Configuration

Everything already has a slot in `.env.example`. Nothing new is introduced.

The checkout is **off** unless every variable the whole flow needs is
present, not merely the Billplz three:

| | Why it is in the gate |
|---|---|
| `BILLPLZ_API_KEY`, `BILLPLZ_COLLECTION_ID`, `BILLPLZ_X_SIGNATURE` | No bill, and no way to trust a callback |
| `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | The order row is written **before** the bill, so the pop-up fails at submit without them |
| `RESEND_API_KEY` | Without it the money is taken and nothing reaches the buyer — anti-goal #1 |

Telegram is deliberately **not** in the gate. A missing notification channel
is a nuisance; it is not a reason to refuse a sale. §7.7 already says a failed
send must not fail the callback, and the same reasoning applies to an absent
one. **My call**, in answer to a reviewer pointing out that three variables
was too narrow a gate.

With any of them missing, the package buttons keep their current behaviour —
a link to `/go/mastery-membership` — rather than opening a pop-up that cannot
finish. A half-configured deployment must not show a buyer a dead end.

**Sandbox mode cannot be served from the live domain.** The gate refuses to
open the pop-up when `BILLPLZ_SANDBOX` is true and `NEXT_PUBLIC_SITE_URL` is
the production host. Without that check, sandbox credentials reaching Vercel
production would give a real buyer a sandbox payment page, a correctly signed
sandbox callback, a `paid` row and a "Payment received" email for money that
never moved — every test green, every anti-goal hit at once. Testing against
sandbox therefore happens locally or on a preview deployment, each with its
own `NEXT_PUBLIC_SITE_URL`, which is also what the callback and redirect URLs
are built from. **My call**, in answer to a reviewer asking whether sandbox in
production was allowed.

## 8. Left to the builder

- The exact Billplz v3 request and callback field names, verified against the
  live documentation rather than from memory, including the precise source
  string the `x_signature` HMAC is computed over.
- Where the pop-up component lives and how it is opened from the three plan
  buttons, given `PlanGroup` is a server component and the pop-up is not.
- Whether the Supabase client is a thin helper or a single module; there is
  no Supabase code in this repo yet, so this is the first of it.
- Email templates: wording within the content described above.
- Test strategy, within the repo's existing habit: guards that read the real
  source, detector self-tests, and an anti-vacuity test for each.

## 9. Open questions

1. **Sandbox credentials.** The one remaining prerequisite. Everything else
   the flow needs is provisioned and was verified by calling it (§5.4).
2. **A reconciliation job** for callbacks that never arrive — out of scope
   here, worth a decision before this handles real money for long.
3. **Live reachability.** `www.billplz.com` is unreachable from the owner's
   machine. Production runs on Vercel, so this is probably local only, but it
   should be confirmed from the deployed environment before go-live rather
   than discovered by a customer.
4. **The Supabase anon key returns 401.** Not this release's problem — every
   write here goes through the service role — but it is broken, and the next
   browser-side feature will find it.

## 10. What the reviewer asked, and where it went

A builder who had not seen the conversation read this document and reported
seven places where guessing would have mattered. For the record:

| Raised | Settled where |
|---|---|
| Do the `/mastery-signal` CTAs sell too? | §5.1, §7.1, §7.2a — **the owner's answer**: yes |
| Is the off-switch too narrow at three variables? | §7.12 — widened to six |
| May sandbox credentials serve the live domain? | §7.12 — refused |
| Does the Supabase project exist, and how is the table applied? | §5.4 — it exists, the table does not; applying it is §8 |
| Are Resend and Telegram provisioned? | §5.4 — both verified by calling them |
| What ever writes `failed`? | §7.4 — the verified callback, from the flag it carries |
| Should the paid amount be checked? | §7.4, §7.8 — yes, stored separately, mismatch blocks the buyer's email |
