# Homepage and Product Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the owner's six-section homepage and give Copytrade and Fukyaa their own step-by-step pages, so every product is explained in the order a client must actually do it.

**Architecture:** The two broker invite codes are per account type, not per product, so the config is renamed to match reality and section 4 forks on account type rather than listing products. `products.ts` grows to six entries carrying a `lane`, and only the retail lane reaches navigation. The three product pages share one component rather than repeating a structure three times. Nothing in this plan touches a database: section 6 hands off to WhatsApp until the stored half ships.

**Tech Stack:** Next.js 16.3.1 (App Router), React 19.2.8, Tailwind CSS 4, TypeScript, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-23-homepage-and-product-pages-design.md`

## Global Constraints

- **Copy is storytelling in the owner's voice, not marketing copywriting.** Short sentences. Concrete detail over balanced clauses. No aphoristic closers, no contrarian reversals ("Most people X. I do not"), no balanced antithesis ("not X, but Y"), no triads of abstract nouns.
- **The hero is the owner's own copy and is not rewritten**, including "innovative" and "what matters most".
- **No performance claims.** No win rates, no profit figures, no guarantees. The 1,200 figure is a twelve-year career total, never a membership count.
- **Copytrade: state the weekly 30/70 split on the account's gain, and the 500 USD minimum. State nothing about a high-water mark** — it has not been confirmed.
- **The worked example (500 → 600, split 30/70) explains the fee, never an outcome.** "Turn 500 into 600" is banned; "if the account goes from 500 to 600, the 100 is split" is correct.
- **Money figures live in config.** `claims.test.ts` fails the build on any `RM<digit>` or `<digit> USD` literal inside a page or component.
- **Account codes:** cent = `004VL9-TRMRV13456` (Copytrade, Fukyaa, EA products) · standard = `1AA974-WAVJR35865` (Mastery Signal). Never swapped.
- **Palette unchanged:** Vanilla `#EFE6D3` 60%, Pine `#163A30` 30%, Ruby `#F0283C` 10%. Ruby marks one action per screen and is never running text.
- **Motion bans (unslop):** no glows, no gradient washes as decoration, no `hover:scale` on cards, no `animate-pulse`, no `transition-all`. Motion shows what changed; it does not ask for attention.
- **One typeface, Archivo**, width axis for display.
- All outbound `<Link>` to `/go/*` carries `prefetch={false}`.
- **Never state what the business earns in return** — no rebate, commission or revenue share, in copy or in a comment.
- **Every product page opens with the same fork: deposit, or pay directly?** (spec §5.2a)
- **This site never links to `masterysignal.com/join`.** Both routes end at `/membership`, where the client registers, chooses Pro, and is approved by hand.
- **Harmovest is a recommendation on the VPS route, not a requirement** — the broker is the client's choice.
- **The Fukyaa promo expires 31 December 2026** and must fall back on its own.

## Review Focus

- **A product with no page reaching navigation.** Broker Partnership and Fintech Innovation have no page this pass; the header dropdown and section-4 fork must render retail only. — Task 2
- **The two invite codes swapped or merged.** Three products now share two codes; a wrong mapping silently sends commission to the wrong account type with no visible symptom. — Task 1
- **A money literal typed into a page.** The example figures and the 500 USD minimum are config; typed into prose they go stale and two pages disagree. — Task 3
- **An unconfirmed Copytrade term appearing in copy.** Any mention of a high-water mark, or of the split being gross/net, is a claim nobody made. — Task 6
- **Scroll reveal hiding content when JavaScript fails.** `data-reveal` elements start hidden only under `.motion-ready`, which only JS adds; if that contract breaks, sections vanish. — Task 4

---

### Task 1: Rename the broker keys to account types

**Files:**
- Modify: `src/lib/products.ts`
- Test: `src/lib/__tests__/products.test.ts`

**Interfaces:**
- Produces: `OutboundKey = "broker-cent" | "broker-standard" | "mastery-membership" | "fukyaa-register" | "copytrade-join" | "whatsapp"`. `outbound` maps each to its URL.
- `copytrade-join` is declared with an empty string until the owner supplies the link; Task 6 renders a placeholder when a destination is empty.

- [ ] **Step 1: Write the failing test**

```ts
test("the invite codes are per account type, not per product", () => {
  expect(outbound["broker-cent"]).toContain("invitid=004VL9-TRMRV13456");
  expect(outbound["broker-standard"]).toContain("invitid=1AA974-WAVJR35865");
  expect(outbound["broker-cent"]).not.toEqual(outbound["broker-standard"]);
});

test("each existing product names its account type", () => {
  // Copytrade does not exist until Task 2; its assertion lives there.
  expect(getProduct("fukyaa")!.account).toBe("cent");
  expect(getProduct("mastery-signal")!.account).toBe("standard");
});

test("a destination that is not set yet is empty, not a broken URL", () => {
  expect(outbound["copytrade-join"]).toBe("");
});

test("every non-empty destination is an absolute https URL", () => {
  for (const [key, url] of Object.entries(outbound)) {
    if (url === "") continue;
    expect(url, key).toMatch(/^https:\/\//);
  }
});
```

Delete the superseded `the two broker invite codes are distinct and correctly assigned` test; this replaces it.

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/lib/__tests__/products.test.ts`
Expected: FAIL — `broker-cent` is not a key.

- [ ] **Step 3: Rename the keys and add `account` to `Product`**

`Product` gains `account: "cent" | "standard" | null` (null for coaching and the IB lane). Update `href` and `steps[].outbound` on all three existing products. No aliases are needed: `/go/*` has never been public (spec §5.1).

- [ ] **Step 4: Run the full suite**

Run: `npm test`
Expected: PASS. `go.test.ts` and `migration.test.ts` reference the old key names — update them in this task, since the rename breaks them.

- [ ] **Step 5: Commit**

```bash
git add src/lib/products.ts src/lib/__tests__ src/app/__tests__
git commit -m "refactor: name broker keys by account type, not by product"
```

---

### Task 2: Six products, two lanes

**Files:**
- Modify: `src/lib/products.ts`, `src/components/site-header.tsx`, `src/components/site-footer.tsx`
- Test: `src/lib/__tests__/products.test.ts`

**Interfaces:**
- Produces: `lane: "retail" | "ib"` on `Product`; `retailProducts: Product[]`; `ibProducts: Product[]`.
- Six keys: `mastery-signal`, `copytrade`, `fukyaa`, `coaching` (retail) · `broker-partnership`, `fintech-innovation` (ib).
- IB products carry `href: "/go/whatsapp?m=partnership"` until their page exists.

- [ ] **Step 1: Write the failing test**

```ts
test("there are six products across two lanes", () => {
  expect(products).toHaveLength(6);
  expect(retailProducts).toHaveLength(4);
  expect(ibProducts).toHaveLength(2);
});

test("no product without a page reaches navigation", () => {
  // The header dropdown and the homepage fork render retailProducts only.
  for (const p of retailProducts) {
    expect(p.href, p.key).toMatch(/^\/(mastery-signal|copytrade|fukyaa|coaching)$/);
  }
});

test("every product declares its lane, cta and account", () => {
  for (const p of products) {
    expect(["retail", "ib"]).toContain(p.lane);
    expect(p.cta, p.key).toBeTruthy();
    expect(["cent", "standard", null]).toContain(p.account);
  }
});

test("copytrade and fukyaa share the cent account and its minimum", () => {
  expect(getProduct("copytrade")!.requirement).toMatch(/500\s*USD/);
  expect(getProduct("fukyaa")!.requirement).toMatch(/500\s*USD/);
});
```

Replace the existing `there are exactly three products` test.

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/lib/__tests__/products.test.ts`
Expected: FAIL — three products, no `lane`.

- [ ] **Step 3: Add the three new products and the lane split**

Copytrade `forWho`: the visitor's own voice, as the existing three use. Its `summary` names the weekly split and that the client's money stays in the client's account. Broker Partnership and Fintech Innovation carry `account: null` and the WhatsApp href.

Add the `partnership` prefill to `whatsappPrefills`.

- [ ] **Step 4: Render retail only in the header and footer**

Both currently map `products`. Point both at `retailProducts`.

- [ ] **Step 5: Run and build**

Run: `npm test && npm run build`
Expected: PASS, compiled.

- [ ] **Step 6: Commit**

```bash
git add src/lib src/components
git commit -m "feat: six products across a retail and an IB lane"
```

---

### Task 3: Commercial terms config

**Files:**
- Create: `src/lib/commercial.ts`
- Test: `src/lib/__tests__/commercial.test.ts`

**Interfaces:**
- Produces: `copytrade = { minimumUsd: 500, masterShare: 30, investorShare: 70, example: { funded: 500, grown: 600 } }` and `exampleSplit(): { gain: number; master: number; investor: number }`.
- Produces: `fukyaa = { depositStandardUsd: 1000, depositPromoUsd: 500, promoEndsOn: "2026-12-31", vpsMonthlyMyr: 100 }` and `fukyaaDeposit(on: Date): { usd: number; isPromo: boolean }`.
- Produces: `masteryTiers = [{ key: "basic", minDepositUsd: 100 }, { key: "pro", minDepositUsd: 300 }, { key: "premium", minDepositUsd: 500 }]` and `masterySubscriptionMyr: number | null` — null until the owner sets the FPX price, rendering through `formatPrice` as "Price on enquiry" like the coaching ladder.

- [ ] **Step 1: Write the failing test**

```ts
test("the shares account for the whole gain", () => {
  expect(copytrade.masterShare + copytrade.investorShare).toBe(100);
});

test("the worked example is the owner's: 500 grows to 600, split 30 and 70", () => {
  const s = exampleSplit();
  expect(s.gain).toBe(100);
  expect(s.master).toBe(30);
  expect(s.investor).toBe(70);
});

test("the example derives from the shares rather than repeating them", () => {
  // If a share changes, the example must move with it or the page lies.
  const s = exampleSplit();
  expect(s.master).toBe((s.gain * copytrade.masterShare) / 100);
});

test("the Fukyaa promo expires on its own", () => {
  // A promotional figure typed into a page becomes a false price on a date
  // everybody already knows, and nobody notices until a customer is angry.
  expect(fukyaaDeposit(new Date("2026-12-31T23:59:00Z"))).toEqual({ usd: 500, isPromo: true });
  expect(fukyaaDeposit(new Date("2027-01-01T00:00:00Z"))).toEqual({ usd: 1000, isPromo: false });
});

test("the Mastery tiers carry the deposits the live site states", () => {
  expect(masteryTiers.map((t) => t.minDepositUsd)).toEqual([100, 300, 500]);
});

test("an unset subscription price reads as an enquiry, not a broken number", () => {
  expect(formatPrice(masterySubscriptionMyr)).toBe("Price on enquiry");
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/lib/__tests__/copytrade.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the module**

`exampleSplit` computes from `example.grown - example.funded` and the share percentages. Nothing is hardcoded twice.

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/lib/__tests__/copytrade.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/commercial.ts src/lib/__tests__/commercial.test.ts
git commit -m "feat: commercial terms as config, with a self-expiring promo"
```

---

### Task 4: The graph grid, and switching on scroll reveal

**Files:**
- Modify: `src/app/globals.css`
- Test: `src/lib/__tests__/voice.test.ts` (motion bans)

**Interfaces:**
- Produces: `.graph-grid` utility class. Replaces `.bg-chart-grid`, which is deleted along with its one usage in `marked-chart.tsx`.

- [ ] **Step 1: Write the failing test**

```ts
test("no banned motion or decoration utilities are used", () => {
  const BANNED = /animate-pulse|animate-ping|transition-all|hover:scale|drop-shadow-\[|shadow-\[0_0_|bg-gradient-to-/;
  for (const { file, text } of files()) {
    expect(text, file).not.toMatch(BANNED);
  }
});

test("the retired grid class is gone", () => {
  for (const { file, text } of files()) {
    expect(text, file).not.toMatch(/bg-chart-grid/);
  }
});

test("revealed content is only ever hidden behind a class JavaScript adds", () => {
  // The hidden starting state must sit under .motion-ready. Written as a
  // bare [data-reveal] rule, every revealed section disappears for anyone
  // whose JavaScript failed or was blocked.
  const selectors = fs
    .readFileSync("src/app/globals.css", "utf8")
    .split("\n")
    .filter((line) => line.includes("[data-reveal]") && line.includes("{"));

  expect(selectors.length).toBeGreaterThan(0);
  for (const selector of selectors) {
    expect(selector, "a [data-reveal] rule outside .motion-ready").toContain(
      ".motion-ready",
    );
  }
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/lib/__tests__/voice.test.ts`
Expected: FAIL — `bg-chart-grid` is still in `marked-chart.tsx`.

- [ ] **Step 3: Add `.graph-grid` and delete `.bg-chart-grid`**

Adapted from Uiverse `csemszepp/serious-cobra-89` (MIT) — keep the credit comment above the rule, as the owner asked. The source is in spec §7.5 and is the spec, not a description. Two changes: the class is renamed from `.container`, which collides with Tailwind's own `container` utility; and `#366` becomes pine at low alpha. Keep `--s: 100px` with the `/5` minor grid.

- [ ] **Step 4: Run and verify by eye**

Run: `npm test && npm run dev`
Expected: PASS, and the hero diagram's backdrop shows a 100px major grid with a 20px minor grid, in pine, not teal.

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css src/components/marked-chart.tsx src/lib/__tests__/voice.test.ts
git commit -m "feat: graph-paper grid, and ban the decoration utilities we reject"
```

---

### Task 5: The shared product page

**Files:**
- Create: `src/components/product-guide.tsx`
- Modify: `src/app/mastery-signal/page.tsx` (adopt the component)
- Create: `src/lib/fukyaa.ts`
- Test: `src/lib/__tests__/guide.test.ts`

**Interfaces:**
- Consumes: `Product`, `outbound` (Task 1–2).
- Produces: `<ProductGuide product={Product} routes={PaymentRoute[]} intro={ReactNode} />`, with `type PaymentRoute = { key: "deposit" | "direct"; label: string; summary: string; steps: GuideStep[] }` and `type GuideStep = { n: number; title: string; body: string; outbound: OutboundKey | null; cta: string | null }`.
- The guide opens by asking which route the visitor wants, then shows that route's steps. Both routes for Mastery Signal end at `mastery-membership`; the guide never links to `/join`.
- A step whose `outbound` resolves to an empty destination renders a labelled placeholder instead of a link.

- [ ] **Step 1: Write the failing test**

```ts
test("a step with no destination yet renders no link", () => {
  // copytrade-join is empty until the owner supplies it. A link to "" is a
  // link to the current page, which looks like it worked and did not.
  expect(stepIsReady({ outbound: "copytrade-join", cta: "Join" } as GuideStep)).toBe(false);
  expect(stepIsReady({ outbound: "broker-cent", cta: "Open" } as GuideStep)).toBe(true);
  expect(stepIsReady({ outbound: null, cta: null } as GuideStep)).toBe(false);
});
```

`stepIsReady(step: GuideStep): boolean` is exported from `product-guide.tsx`.

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/lib/__tests__/guide.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Extract the component from the Mastery Signal page**

`/mastery-signal` already carries this structure; lift it rather than writing a second one. Three pages is where a shared component earns itself (spec §8). Steps keep `prefetch={false}` and `target="_blank"` on outbound links.

`fukyaa.ts` holds Fukyaa's steps: open a cent account, fund it with the minimum, register for auto trade — reading the minimum from `getProduct("fukyaa").requirement` rather than restating it.

- [ ] **Step 4: Run and build**

Run: `npm test && npm run build`
Expected: PASS, and `/mastery-signal` renders as before.

- [ ] **Step 5: Commit**

```bash
git add src/components/product-guide.tsx src/lib/fukyaa.ts src/app/mastery-signal src/lib/__tests__/guide.test.ts
git commit -m "refactor: one guide component for every product page"
```

---

### Task 6: /copytrade and /fukyaa

**Files:**
- Create: `src/app/copytrade/page.tsx`, `src/app/fukyaa/page.tsx`
- Modify: `src/app/sitemap.ts`
- Test: `src/app/__tests__/sitemap.test.ts`, `src/lib/__tests__/migration.test.ts` (canonicals)

**Interfaces:**
- Consumes: `ProductGuide`, `copytrade`, `exampleSplit` (Tasks 3–5).

- [ ] **Step 1: Write the failing tests**

```ts
// sitemap.test.ts
test("every retail product page is in the sitemap", () => {
  expect(paths()).toEqual(expect.arrayContaining([
    "/mastery-signal", "/copytrade", "/fukyaa", "/coaching",
  ]));
});
```

```ts
// copytrade.test.ts — the unconfirmed terms must not appear
test("the page states nothing about a high-water mark or gross vs net", async () => {
  const source = fs.readFileSync("src/app/copytrade/page.tsx", "utf8");
  expect(source).not.toMatch(/high[-\s]?water|gross|net of|before the master is paid/i);
});
```

Add `/copytrade` and `/fukyaa` to the canonical list in `migration.test.ts`.

- [ ] **Step 2: Run to verify they fail**

Run: `npm test`
Expected: FAIL — the pages do not exist.

- [ ] **Step 3: Write both pages**

**`/copytrade`** — the introduction tells the story: people who want to follow a person rather than a system. State the weekly split on the account's gain, and run the worked example from `exampleSplit()` framed as fee mechanics: if an account funded with 500 reaches 600, the 100 gain is split 30 and 70. Never as an outcome. State that the money stays in the client's own account and the broker operates the facility. Step 3's join link does not exist; it renders the placeholder from Task 5.

**`/fukyaa`** — a system places the trades. Same cent account, same minimum. Say plainly what separates it from Copytrade: one follows an algorithm, the other follows a person, and both sit on the same account type.

Both pages carry `alternates: { canonical }` and the education-not-advice line.

- [ ] **Step 4: Run and build**

Run: `npm test && npm run build`
Expected: PASS, both routes compiled.

- [ ] **Step 5: Commit**

```bash
git add src/app/copytrade src/app/fukyaa src/app/sitemap.ts src/app/__tests__ src/lib/__tests__
git commit -m "feat: copytrade and fukyaa pages"
```

---

### Task 7: Homepage sections 2 and 3

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/components/section-heading.tsx`

**Interfaces:**
- Produces: `<SectionHeading eyebrow={string} title={string} />` — sentence case, no tracked capitals (the voice guard fails on those).

- [ ] **Step 1: Build section 2, "Who I am"**

The marked chart moves here from the founder block, as evidence of how he reads a market. The 12 years and 1,200 figure live here now that the hero no longer carries them.

Storytelling, not a profile: he started for the money like everyone; what kept him was narrower; he still trades most weeks and some weeks takes nothing.

- [ ] **Step 2: Build section 3, "Why I built these"**

The mission, told as three short accounts rather than stated as a value:

- Mastery Signal began because people kept asking what he was looking at, and an entry price never answered it.
- Fukyaa began because people told him plainly they would never learn to read a chart.
- He refuses to quote profit figures in a market where that is what sells.

*Fintech innovation* and *market intelligence* appear as things he did, not as labels. No section anywhere states a value in the abstract.

- [ ] **Step 3: Remove the events and writing blocks**

Both leave the homepage (spec §3). Both keep their nav entries and pages. `latestPosts` and its import go with them.

- [ ] **Step 4: Run and build**

Run: `npm test && npm run build`
Expected: PASS, and the voice guard still passes against the new copy.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/components/section-heading.tsx
git commit -m "feat: homepage sections for who I am and why I built these"
```

---

### Task 8: Homepage section 4, the fork by account type

**Files:**
- Modify: `src/app/page.tsx`, `src/components/product-band.tsx`
- Create: `src/components/account-gateway.tsx`

**Interfaces:**
- Consumes: `retailProducts`, `ibProducts` (Task 2).
- Produces: `<AccountGateway account="cent" | "standard" products={Product[]} />`.

- [ ] **Step 1: Build the gateway**

Opening and funding a broker account is shared, so it is said once per account type rather than three times across three bands. Standard holds Mastery Signal; cent holds Copytrade and Fukyaa and states the one 500 USD minimum that covers both.

Say plainly that someone wanting products from both columns needs two accounts. Omitting it is what produces the message the owner then has to answer.

- [ ] **Step 2: Add the IB block**

A short closing block: *if you have clients of your own* → Broker Partnership and Fintech Innovation, both to `/go/whatsapp?m=partnership`. Two lines each, not a pitch. Their page comes later.

- [ ] **Step 3: Give the bands panels**

The owner's standing note is the page feels empty. Bands become bordered panels on `paper-raised` with the rule structure already in the palette — borders and surfaces, not shadows or gradients. The banned utilities from Task 4 stay banned.

- [ ] **Step 4: Run and build**

Run: `npm test && npm run build`
Expected: PASS. Check at 390px that the two columns stack and nothing scrolls horizontally.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/components
git commit -m "feat: homepage forks on account type, not product"
```

---

### Task 9: Homepage sections 5 and 6 — award, and the close

**Files:**
- Modify: `src/app/page.tsx`, `src/lib/site.ts`, `src/lib/schema.ts`
- Test: `src/app/__tests__/schema.test.ts`

**Interfaces:**
- Produces: `site.founder.award = { title, body, year, image, alias }` and `personSchema.award`.

- [ ] **Step 1: Write the failing test**

```ts
test("the award is declared on the person, with its year", () => {
  expect(personSchema.award).toMatch(/Best In-House Trader/);
  expect(JSON.stringify(personSchema)).toContain("2026");
});

test("the former alias is named rather than left unexplained", () => {
  expect(site.founder.award.alias).toBe("Zack King");
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/app/__tests__/schema.test.ts`
Expected: FAIL — `award` is not defined.

- [ ] **Step 3: Build the section**

`public/award-tradinglive.webp` already exists. Caption carries the award, the body, the year 2026 — year only, the owner does not recall the date — and one line saying Zack King was the name he traded under then. Unexplained, a different name on an award reads as borrowed.

An award is a fact about recognition, not a claim about results, which is why it survives the claims rule when almost no other proof does. Say it plainly and move on; no superlatives.

- [ ] **Step 4: Build section 6, coaching and classes**

The owner's sixth section, and the page's closing call to action. It carries
the three-class ladder's shape and sends people to `/coaching`, which already
holds the detail.

A WhatsApp handoff in this pass, not a form — the stored form is the next
pass, and an input box that saves nothing is the thing already deleted once
from this site. The copy says what happens next so nobody is waiting on a
confirmation that will not arrive.

This is the one ruby call to action in its viewport.

- [ ] **Step 5: Run and build**

Run: `npm test && npm run build`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/app/page.tsx src/lib/site.ts src/lib/schema.ts src/app/__tests__/schema.test.ts
git commit -m "feat: award section and the coaching close"
```

---

### Task 10: Motion, and the final pass

**Files:**
- Modify: `src/app/page.tsx`, `src/app/copytrade/page.tsx`, `src/app/fukyaa/page.tsx`, `src/app/mastery-signal/page.tsx`

- [ ] **Step 1: Switch on scroll reveal**

The CSS and `MotionRoot` already ship on every page and **no page uses them** — there is not one `data-reveal` attribute in the codebase. Add the attribute to section-level elements and stagger with `--reveal-delay`.

Sections only, never individual cards: a card that fades in one at a time is the generic default, and the hero already carries the page's one orchestrated moment.

- [ ] **Step 2: Verify the no-JavaScript contract**

The hidden starting state lives behind `.motion-ready`, a class only JavaScript adds. Confirm in the browser with JS disabled that every section renders visible. Content is never hostage to an animation.

- [ ] **Step 3: Verify reduced motion**

Run the dev server with `prefers-reduced-motion: reduce` emulated. Expected: sections render in place, no transition, and the hero diagram shows its finished state rather than a faster draw.

- [ ] **Step 4: Read every new line of copy aloud**

The guard catches hype words, tracked capitals and exclamation marks. It cannot hear cadence. Read for balanced antithesis, contrarian reversals and aphoristic closers, and cut them. This step has no command; it is the one the tests cannot do.

- [ ] **Step 5: Run everything and commit**

```bash
npm test && npm run build
git add -A
git commit -m "feat: switch on the scroll reveal that shipped unused"
```

---

## Not in this plan

The stored half: the enquiry form, Supabase tables, the admin screens, Resend sending, and the Billplz and Telegram payment path. Section 6 of the homepage hands off to WhatsApp until those ship. All of it is specified in `2026-11-22-saga-x-ventures-rebuild-design.md` §7.4–§7.7 and §7.13.

The IB page. Broker Partnership and Fintech Innovation reach WhatsApp from the homepage block; their page, with the RM10,000 and RM500 figures, comes after.
