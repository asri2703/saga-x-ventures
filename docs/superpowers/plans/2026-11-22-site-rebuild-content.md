# Saga X Ventures Site Rebuild — Plan 1: Content and Appearance

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing marketing-agency site into the trading front door described in the spec — every page, the product routing, the coaching ladder and the SEO — running on localhost with no credentials of any kind.

**Architecture:** The repo's config-driven pattern is kept and extended: `site.ts` holds business facts, a new `products.ts` holds the three products and their outbound destinations, a new `coaching.ts` holds the class/mode matrix with prices as nullable config. Pages read from those modules and hold no literals. The agency surface is deleted and 301'd. Everything that needs a database — event registration, orders, payments, admin — is Plan 2 and is absent here, so this plan builds and runs standalone.

**Tech Stack:** Next.js 16.3.1 (App Router), React 19.2.8, Tailwind CSS 4, TypeScript 5, Vitest (added by this plan).

**Spec:** `docs/superpowers/specs/2026-11-22-saga-x-ventures-rebuild-design.md`

## Global Constraints

- **English only.** One locale, `en_MY`. No i18n layer, no `hreflang`.
- **No results claims anywhere.** No win rates, no profit figures, no guarantees.
- **"1,200+ traders" is a twelve-year career total**, never phrased as current or active membership of anything.
- **Prices live in config**, never as literals in a page component.
- **Fukyaa's minimum 500 USD deposit is stated up front** wherever Fukyaa is offered.
- **The two broker invite codes are distinct and must never be swapped:** `1AA974-WAVJR35865` is Mastery Signal, `004VL9-TRMRV13456` is Fukyaa.
- **No social profile links.** Removed from config and from `sameAs`.
- Domain is `https://sagaxventures.com`.
- `robots.ts` keeps its non-production indexing block exactly as it is.
- **Palette, fixed by the owner, applied 60/30/10:**

  | Token | Hex | Share | Role |
  |---|---|---|---|
  | Vanilla Line | `#EFE6D3` | 60% | page and surface backgrounds |
  | Pine Lacquer | `#163A30` | 30% | body text, headings, dark sections, borders |
  | Ruby Flare | `#F0283C` | 10% | calls to action and accents only |

  This replaces the current dark `bg-ink` theme entirely — the rebuild is
  cream-dominant and light.

  **Two contrast rules that follow from these values, and are not negotiable:**
  Pine on Vanilla measures about 9.9:1 and is the default text pairing
  everywhere. Ruby on Vanilla measures about 3.5:1 — it **fails** WCAG AA for
  normal body text, so Ruby is never used for running text on the cream
  background. It is for buttons, underlines, counters and small marks. White
  text on a Ruby button lands near 4.4:1, just under the 4.5:1 threshold, so
  button labels are **bold and at least 16px**, which qualifies them under the
  large-text rule. Never put Pine text on a Ruby fill — that pairing is about
  2.8:1 and is unreadable.

- **Design concept: the marked-up chart.** A trader's working document is a
  chart with annotations — zones boxed, levels ruled, entries marked. That is
  technical drawing in this subject's own language, and it is where the visual
  vocabulary comes from. Vanilla is the paper, Pine is the ink everything is
  drawn and written in, Ruby is the mark the teacher makes.

  This gives the 10% share a rule with meaning rather than a ratio to hit:
  **Ruby marks the one thing to do next, once per screen, never more.**

  The competitive context is the reason the restraint matters. Trading
  education online is dark dashboards, neon green, profit screenshots and
  countdown timers. Looking calm is this brand's differentiator, so nothing on
  this site shouts.

- **Typography: one family, Archivo.** Display is Archivo Expanded at heavy
  weights, body is Archivo regular — the contrast is **width**, not serif
  against sans. Archivo carries tabular figures, which matter wherever prices
  are listed. The repo's current Geist is removed; it is a default, not a
  choice. Do not introduce a serif display face: a high-contrast serif on a
  cream background is the single commonest tell of a generated page, and this
  palette is already cream.

- **Drafting language stays in the hero.** Rules, frames and gridlines belong
  to the hero diagram only. Spreading hairline rules across every section is
  the broadsheet default and reads as templated. The rest of the page is quiet
  and generous.

- **No stat strips, no identical rounded cards.** Three big numbers side by
  side, and content chopped into same-radius same-shadow cards, are the two
  most templated devices available. The credibility figures run inside a
  sentence; the product routing is a fork of ruled bands, not a card grid.

## Review Focus

- **Empty blog.** All three existing posts are deleted and replacements may not exist at launch; `/blog` and the homepage "latest writing" section must render as empty states, not crash. — Task 2
- **Unknown product key.** `/go/<anything>` must 404 rather than redirect to `undefined`. — Task 3
- **Unset prices.** The owner is still deciding the numbers, so a `null` price must render "Price on enquiry", never `RMnull` or `RMundefined`. — Task 1
- **Dead agency URLs.** The five `/services/*` paths and `/services` must 301, not 404. — Task 2
- **Forbidden claims leaking into copy.** A guard test scans source and content for win-rate, profit and guarantee wording, and for the 1,200 figure phrased as membership. — Task 1

---

### Task 1: Test harness, config layer and theme tokens

**Files:**
- Modify: `src/app/globals.css` (theme tokens — replaces the dark theme)
- Create: `vitest.config.ts`
- Create: `src/lib/products.ts`
- Create: `src/lib/coaching.ts`
- Modify: `src/lib/site.ts` (full rewrite)
- Modify: `package.json` (add `vitest`, `vite-tsconfig-paths`; add `"test": "vitest run"`)
- Test: `src/lib/__tests__/products.test.ts`, `src/lib/__tests__/coaching.test.ts`, `src/lib/__tests__/claims.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `site` — as today, minus `social`, minus `googleBusiness`; plus `founder.yearsExperience: 12` and `founder.tradersGuided: 1200`.
  - `fullAddress: string`, `waLink(message?: string): string` — unchanged exports.
  - `type OutboundKey = "mastery-broker" | "mastery-membership" | "fukyaa-broker" | "fukyaa-register" | "whatsapp"`
  - `outbound: Record<OutboundKey, string>`
  - `type ProductKey = "mastery-signal" | "fukyaa" | "coaching"`
  - `type Step = { label: string; outbound: OutboundKey | null }`
  - `type Product = { key: ProductKey; name: string; forWho: string; summary: string; steps: Step[]; requirement: string | null; href: string; external: boolean }`
  - `href` is the product's **first action**: `/go/<OutboundKey>` for an
    external product, an internal path for an internal one. It is never
    `/go/<ProductKey>` — the product keys and the outbound keys are different
    namespaces, and conflating them is the easy mistake here.
  - `products: Product[]`
  - `getProduct(key: string): Product | undefined`
  - `type CoachingMode = "online" | "onsite"`
  - `type CoachingClass = { slug: string; name: string; summary: string; order: number }`
  - `coachingClasses: CoachingClass[]`
  - `coachingPrices: { mode: CoachingMode; classSlug: string; myr: number | null }[]`
  - `getPrice(classSlug: string, mode: CoachingMode): number | null`
  - `formatPrice(myr: number | null): string`

- [ ] **Step 1: Add Vitest and write the failing config tests**

Install `vitest` and `vite-tsconfig-paths` as devDependencies, add `"test": "vitest run"` to scripts, and create `vitest.config.ts` using `tsconfigPaths()` so `@/` resolves.

```ts
// src/lib/__tests__/products.test.ts
import { products, getProduct, outbound } from "@/lib/products";

test("the two broker invite codes are distinct and correctly assigned", () => {
  expect(outbound["mastery-broker"]).toContain("invitid=1AA974-WAVJR35865");
  expect(outbound["fukyaa-broker"]).toContain("invitid=004VL9-TRMRV13456");
  expect(outbound["mastery-broker"]).not.toEqual(outbound["fukyaa-broker"]);
});

test("every outbound destination is an absolute https URL", () => {
  for (const url of Object.values(outbound)) expect(url).toMatch(/^https:\/\//);
});

test("fukyaa states its deposit minimum", () => {
  expect(getProduct("fukyaa")!.requirement).toMatch(/500\s*USD/);
});

test("getProduct returns undefined for an unknown key", () => {
  expect(getProduct("nope")).toBeUndefined();
});

test("there are exactly three products and coaching is the internal one", () => {
  expect(products).toHaveLength(3);
  expect(getProduct("coaching")!.external).toBe(false);
  expect(getProduct("coaching")!.href).toBe("/coaching");
});

test("each external product's first action points at a real outbound key", () => {
  for (const p of products.filter((p) => p.external)) {
    const key = p.href.replace("/go/", "");
    expect(Object.keys(outbound), `${p.key} href`).toContain(key);
  }
  expect(getProduct("mastery-signal")!.href).toBe("/go/mastery-broker");
  expect(getProduct("fukyaa")!.href).toBe("/go/fukyaa-broker");
});

test("every step that links out names a real outbound key", () => {
  for (const p of products) {
    for (const s of p.steps) {
      if (s.outbound) expect(Object.keys(outbound)).toContain(s.outbound);
    }
  }
});
```

```ts
// src/lib/__tests__/coaching.test.ts
import { coachingClasses, getPrice, formatPrice } from "@/lib/coaching";

test("the ladder is three classes in order", () => {
  expect(coachingClasses.map((c) => c.slug)).toEqual([
    "basic-trading", "advance", "news-trading",
  ]);
});

test("formatPrice renders ringgit with a thousands separator", () => {
  expect(formatPrice(4970)).toBe("RM4,970");
});

test("an unset price reads as an enquiry, never as a broken number", () => {
  expect(formatPrice(null)).toBe("Price on enquiry");
  expect(formatPrice(null)).not.toMatch(/null|undefined|NaN/);
});

test("every class has a price entry for both modes", () => {
  for (const c of coachingClasses) {
    expect(getPrice(c.slug, "online")).not.toBeUndefined();
    expect(getPrice(c.slug, "onsite")).not.toBeUndefined();
  }
});
```

```ts
// src/lib/__tests__/claims.test.ts — guards Global Constraints across all copy
test("no win-rate, profit or guarantee claims appear in source or content", () => {
  // scans src/**/*.{ts,tsx} and content/**/*.md
  for (const { file, text } of readAllCopy()) {
    expect(text, file).not.toMatch(/win[-\s]?rate|guarantee[ds]?\b|profit\s+(of|up to)/i);
  }
});

test("the 1,200 figure is never phrased as membership", () => {
  for (const { file, text } of readAllCopy()) {
    expect(text, file).not.toMatch(/1,?200\+?\s+(active\s+)?(members|subscribers)/i);
  }
});

test("no social profile links remain", () => {
  for (const { file, text } of readAllCopy()) {
    expect(text, file).not.toMatch(/sagaxmedia|sagaxmarketing/i);
  }
});
```

`readAllCopy()` is a local helper in the test file: walk `src` and `content`, read every `.ts`, `.tsx` and `.md`, skip `__tests__`.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — `@/lib/products` and `@/lib/coaching` do not exist.

- [ ] **Step 3: Write the three config modules**

`src/lib/products.ts` — the destinations table from spec §7.4a verbatim, plus the three products. `forWho` carries the spec's routing line for each: can trade and wants signals → Mastery Signal; cannot trade → Fukyaa; wants to learn → Coaching. `steps` carries the sequence each product requires (Mastery: open broker account → deposit per package → membership; Fukyaa: open broker account → deposit minimum 500 USD → register). External products get `href: "/go/<key>"`.

`src/lib/coaching.ts` — three classes in ladder order, and a price matrix with `myr: null` for every entry for now; the owner supplies numbers later by editing this file alone. `formatPrice` uses `Intl.NumberFormat("en-MY")`.

`src/lib/site.ts` — rewrite. Keep name, tagline, url, email, phone, address, `fullAddress`, `waLink`. Delete the `social` and `googleBusiness` keys entirely. Rewrite `description` for trading. Add `founder.yearsExperience` and `founder.tradersGuided`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS. The claims guard may fail on the not-yet-deleted agency copy — if so, it stays red until Task 2 and that is expected; note it and move on.

- [ ] **Step 5: Replace the theme tokens in `globals.css`**

Tailwind 4 is CSS-first, so the palette is declared in an `@theme` block in
`src/app/globals.css`, not in a JS config. Define `--color-vanilla: #EFE6D3`,
`--color-pine: #163A30`, `--color-ruby: #F0283C`, plus the tints and shades the
pages need, and set `body` to vanilla with pine text.

The current file is built around a dark `bg-ink` theme with an electric-blue
accent; that theme is removed, not layered over. Grep for `ink`, `surface`,
`accent`, `line`, `body`, `muted` and `faint` before deleting — those token
names are used throughout the existing components, and the cleanest path is to
keep the same semantic names and repoint them at the new palette, so the pages
in later tasks need no rename.

Read `node_modules/next/dist/docs/` and the installed Tailwind version's own
guidance before writing the block; `AGENTS.md` warns this stack differs from
older conventions.

- [ ] **Step 6: Verify the theme loads**

Run: `npm run dev` and open `http://localhost:3000`
Expected: a cream page with dark green text. It will look unfinished — the
pages are rebuilt in later tasks — but nothing should still be dark-themed and
no token should resolve to a missing colour.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/lib src/app/globals.css
git commit -m "feat: add vitest, rebuild the config layer, adopt the new palette"
```

---

### Task 2: Remove the agency surface

**Files:**
- Delete: `src/lib/services.ts`, `src/app/services/page.tsx`, `src/app/services/[slug]/page.tsx`, all three files in `content/blog/`
- Modify: `next.config.ts` (301 redirects), `src/app/sitemap.ts`, `src/app/blog/page.tsx` (empty state)
- Test: `src/app/__tests__/sitemap.test.ts`, `src/lib/__tests__/blog.test.ts`

**Interfaces:**
- Consumes: `products`, `coachingClasses` (Task 1).
- Produces: `sitemap()` covering `/`, `/coaching`, `/events`, `/blog`, `/about`, `/contact`, `/privacy` plus one entry per blog post. No `/services` entries.

- [ ] **Step 1: Write the failing tests**

```ts
// src/app/__tests__/sitemap.test.ts
import sitemap from "@/app/sitemap";

test("no agency service URLs remain in the sitemap", () => {
  const urls = sitemap().map((e) => e.url);
  expect(urls.some((u) => u.includes("/services"))).toBe(false);
});

test("the sitemap lists the trading pages", () => {
  const paths = sitemap().map((e) => e.url.replace("https://sagaxventures.com", ""));
  expect(paths).toEqual(expect.arrayContaining(["", "/coaching", "/events", "/blog", "/about", "/contact", "/privacy"]));
});
```

```ts
// src/lib/__tests__/blog.test.ts
import { getPosts } from "@/lib/blog";

test("an empty content/blog directory yields no posts and does not throw", () => {
  expect(() => getPosts()).not.toThrow();
  expect(Array.isArray(getPosts())).toBe(true);
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npm test`
Expected: FAIL — the sitemap still emits `/services/*`.

- [ ] **Step 3: Delete the agency surface and add the redirects**

Delete the files listed above. In `next.config.ts` add permanent redirects from `/services` and each of `/services/website-development`, `/services/google-ads`, `/services/social-media-ads`, `/services/seo`, `/services/system-development` to `/`. Rewrite `sitemap.ts` to the static list above plus posts. In `src/app/blog/page.tsx`, render an empty state when `getPosts()` is empty rather than assuming a first post exists.

- [ ] **Step 4: Run tests and a build**

Run: `npm test && npm run build`
Expected: PASS, and the build completes with no reference to the deleted module.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: remove the marketing agency surface and redirect its URLs"
```

---

### Task 3: Outbound redirect route

**Files:**
- Create: `src/app/go/[product]/route.ts`
- Modify: `src/components/whatsapp-float.tsx`
- Test: `src/app/__tests__/go.test.ts`

**Interfaces:**
- Consumes: `outbound`, `OutboundKey` (Task 1).
- Produces: `GET(req, ctx)` returning 302 to the mapped destination, 404 for an unknown key. Plan 2 adds click logging inside this same handler; the route exists now so every link in the site is final from the start.

- [ ] **Step 1: Write the failing test**

```ts
test("a known key redirects to its destination", async () => {
  const res = await GET(new Request("https://x/go/fukyaa-broker"), { params: Promise.resolve({ product: "fukyaa-broker" }) });
  expect(res.status).toBe(302);
  expect(res.headers.get("location")).toContain("invitid=004VL9-TRMRV13456");
});

test("an unknown key 404s rather than redirecting to undefined", async () => {
  const res = await GET(new Request("https://x/go/nope"), { params: Promise.resolve({ product: "nope" }) });
  expect(res.status).toBe(404);
  expect(res.headers.get("location")).toBeNull();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/app/__tests__/go.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the route**

`export async function GET(req: Request, ctx: { params: Promise<{ product: string }> })`. Look the key up in `outbound`; unknown keys return `new Response(null, { status: 404 })`. Point `whatsapp-float.tsx` at `/go/whatsapp`.

Consult `node_modules/next/dist/docs/` for this version's route-handler params signature before writing it — `AGENTS.md` warns the convention differs from older Next.js.

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/app/__tests__/go.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/go src/components/whatsapp-float.tsx src/app/__tests__/go.test.ts
git commit -m "feat: route outbound product links through a logged redirect"
```

---

### Task 4: Header and footer

**Files:**
- Modify: `src/components/site-header.tsx` (Products dropdown), `src/components/site-footer.tsx` (socials out)

**Interfaces:**
- Consumes: `products`, `site` (Task 1).
- Produces: no new exports.

- [ ] **Step 1: Rebuild the navigation**

Nav is Products ▾ · Events · Blog · About · Contact plus the call-to-action. The dropdown lists the three products from `products`, each with its `name` and `forWho` line. It must open on hover and on keyboard focus, close on Escape, and work on mobile inside the existing mobile menu — the repo has already had one mobile-menu height bug (commit `6eb1c7e`), so check the drawer still opens at full height after the change.

Footer: remove the social icon row and any `site.social` references; keep address, phone, email.

- [ ] **Step 2: Verify by eye and by test**

Run: `npm test && npm run dev`
Expected: the claims guard from Task 1 passes now that `sagaxmedia`/`sagaxmarketing` are gone; the dropdown works with a mouse, with Tab/Escape, and in the mobile drawer.

- [ ] **Step 3: Commit**

```bash
git add src/components/site-header.tsx src/components/site-footer.tsx
git commit -m "feat: products dropdown in the nav, socials out of the footer"
```

---

### Task 5: Homepage

**Files:**
- Modify: `src/app/page.tsx` (full rewrite)
- Create: `src/components/marked-chart.tsx` (the hero diagram, inline SVG)
- Create: `src/components/product-band.tsx` (one fork band — not a card)

**Interfaces:**
- Consumes: `site`, `products`, `getPosts` (Tasks 1–2).
- Produces: `<ProductCard product={Product} />`.

- [ ] **Step 1: Build the hero and its diagram**

`<MarkedChart />` is the page's one bold moment. On load it draws once, about
1.2 seconds total: a price path strokes itself in Pine, two zone rectangles
snap in, then a **single Ruby level line** lands with its label. Then it stops
— no loop, no scroll-triggered replay.

It is inline SVG with stroke-dashoffset animation, no animation library. It is
a **teaching diagram, not a track record**: no prices, no profit figures, no
currency amounts, no account screenshots. Its caption says what it is — how a
level gets marked. This is both what the claims rule requires and the more
persuasive object, because it shows judgement rather than asserting results.

`prefers-reduced-motion: reduce` renders the finished state immediately with no
animation. The SVG carries a `<title>` and the section a text alternative, so
the hero still communicates with images or motion off.

- [ ] **Step 2: Build the remaining sections**

Hero · credibility sentence · the fork · founder · next event · latest writing
· contact.

**Credibility is a sentence, not a stat strip.** The figures from config — 12
years, 1,200 traders, Malaysia and Indonesia — run inside flowing text with the
numerals set in the heavier width. The 1,200 figure reads as a career total,
"more than 1,200 traders over twelve years"; the claims guard fails the build
if it reads as membership.

**The fork is the page's spine.** Three full-width bands separated by Pine
rules, not a card grid. Each band opens in the visitor's own voice — "I can
trade. I just need the setups." / "I don't know how to trade." / "I want to
learn properly." — with the product named underneath and one Ruby action at
the right. External bands state their sequence from `product.steps`, and the
Fukyaa band states the 500 USD minimum where it cannot be missed.

The "next event" section has no data source in this plan — Plan 2 provides it.
Render the section's empty state, built so Plan 2 only supplies data.

- [ ] **Step 3: Verify**

Run: `npm test && npm run build`
Expected: PASS, including the claims guard. Then check by eye at 390px width
that the hero diagram scales and the fork bands stack without horizontal
scroll, and confirm the animation does not run with reduced motion enabled.

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx src/components/marked-chart.tsx src/components/product-band.tsx
git commit -m "feat: rebuild the homepage around the marked-chart concept"
```

---

### Task 6: Coaching page

**Files:**
- Create: `src/app/coaching/page.tsx`

**Interfaces:**
- Consumes: `coachingClasses`, `getPrice`, `formatPrice`, `waLink` (Task 1).

- [ ] **Step 1: Build the page**

The ladder — Basic Trading → Advance → News Trading — with both modes priced per class through `formatPrice`, so unset prices read "Price on enquiry" rather than a broken figure. State plainly that it is one-to-one, roughly a day per class, two days one night onsite, and that the onsite price is all-in with travel included.

The page qualifies rather than maximising clicks: it says who the class is for and says directly that someone who does not want to learn to trade should use Fukyaa instead, linking there.

No payment and no stored form in this plan — the call to action is WhatsApp via `waLink()` with a message naming the class and mode. Plan 2 replaces it with the enquiry-then-pay flow.

- [ ] **Step 2: Verify**

Run: `npm test && npm run build`
Expected: PASS, and no literal ringgit figure appears in the page source — every price comes through `formatPrice`.

- [ ] **Step 3: Commit**

```bash
git add src/app/coaching
git commit -m "feat: add the coaching page with the three-class ladder"
```

---

### Task 7: About, Contact and Privacy

**Files:**
- Modify: `src/app/about/page.tsx`, `src/app/contact/page.tsx`
- Create: `src/app/privacy/page.tsx`
- Delete: `src/components/quote-form.tsx`

**Interfaces:**
- Consumes: `site`, `fullAddress`, `waLink` (Task 1).

- [ ] **Step 1: Rewrite the three pages**

**About** — Asri's twelve years, founding Mastery Signal, the 1,200 career figure in its honest wording, and what Saga X Ventures is now. Keep the existing founder photo.

**Contact** — the agency quote form is deleted rather than left pointing nowhere. Until Plan 2 brings stored forms, contact is WhatsApp, phone and email, plus the address. Do not ship a form that saves nothing.

**Privacy** — the PDPA notice from spec §7.11: what is collected, why, who holds it, how long, and how to ask for removal. Note in the page's own comment that the owner is to have the wording checked; this is a draft from the pattern in the owner's `mastery-privacy` repo, not legal advice.

- [ ] **Step 2: Verify**

Run: `npm test && npm run build`
Expected: PASS, and no dead import of `quote-form` remains.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: rewrite about and contact, add the PDPA privacy notice"
```

---

### Task 8: Metadata, structured data and README

**Files:**
- Modify: `src/app/layout.tsx`, `README.md`
- Test: `src/app/__tests__/schema.test.ts`

**Interfaces:**
- Consumes: `site` (Task 1).
- Produces: `orgSchema` and `personSchema` objects exported from `layout.tsx` for testing.

- [ ] **Step 1: Write the failing test**

```ts
import { orgSchema, personSchema } from "@/app/layout";

test("the organisation schema carries no social profiles", () => {
  expect(orgSchema.sameAs ?? []).toHaveLength(0);
});

test("the organisation is an Organization and the founder is a Person", () => {
  expect(orgSchema["@type"]).toBe("Organization");
  expect(personSchema["@type"]).toBe("Person");
  expect(personSchema.name).toBe("Asri Zulzali");
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/app/__tests__/schema.test.ts`
Expected: FAIL — the schema is still `ProfessionalService` with a populated `sameAs`.

- [ ] **Step 3: Update metadata, schema and README**

Change `ProfessionalService` to `Organization`, drop `sameAs` entirely, and add a `Person` block for Asri linked to the organisation via `founder`. Replace the Seremban-first `keywords` array with trading intent terms — the audience is Malaysia and Indonesia, and no one searches for a signal provider by town. Keep the real address for legitimacy. Rewrite the page title and description for trading.

Replace the `create-next-app` boilerplate `README.md` with what the project is, how to run it, where config lives, and a pointer to the spec and this plan.

- [ ] **Step 4: Verify**

Run: `npm test && npm run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx README.md src/app/__tests__/schema.test.ts
git commit -m "feat: retarget metadata and structured data for trading"
```

---

## Not in this plan

Everything requiring a credential is Plan 2: the events system and its admin, registrations, Resend email, Billplz and manual QR payment with receipt upload, the Telegram approval bot, order tracking and the paid-but-not-granted list, and click logging inside `/go/[product]`.

`/events` is referenced by the nav and the sitemap in this plan. Plan 2 creates the route; until then that nav entry links to a simple static page saying the schedule is coming, so the site has no broken link at any point.
