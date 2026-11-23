# Saga X Ventures

The front door for Asri Zulzali's trading practice: Mastery Signal, Fukyaa auto
trade, and one-to-one coaching.

The site exists to solve an attribution problem. Mastery Signal and Fukyaa are
promoted by other people too, so a visitor arriving at either product is not
necessarily ours. Everyone who comes through this site is.

## Running it

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # vitest
npm run build   # production build + typecheck
```

Next.js 16 · React 19 · Tailwind CSS 4 · TypeScript · deployed on Vercel.

> `AGENTS.md` is not decoration. This Next.js version differs from older
> conventions in ways that will bite; read the relevant guide in
> `node_modules/next/dist/docs/` before writing framework code.

## Where things live

| Path | What it holds |
|---|---|
| `src/lib/site.ts` | Every business fact — name, contact, address, the founder's figures. Change it here, it changes everywhere. |
| `src/lib/products.ts` | The six products across two lanes, their outbound destinations, and the two broker invite codes. |
| `src/lib/commercial.ts` | Every figure a client pays or deposits: the Mastery terms, Fukyaa's packages, the Copytrade split, and the two money formatters. Nothing is typed into a page. |
| `src/lib/plans.ts` | The homepage packages as a buyer reads them — the copy built from those figures, so a sentence and the number in it cannot drift apart. |
| `src/lib/coaching.ts` | The class/mode matrix and its prices. |
| `src/lib/fukyaa.ts` | Fukyaa's two routes for its product page, dated through `fukyaaDeposit`. |
| `src/lib/mastery-signal.ts` | The deposit tiers as the live product states them. |
| `src/lib/schema.ts` | Structured data for the organisation and the person. |
| `src/components/motion-root.tsx` | All of the page's motion: the batched scroll reveals and the smooth scroll. |
| `src/app/go/[product]/` | The logged outbound redirect every external link passes through. |
| `content/blog/` | Posts, as Markdown with frontmatter. Adding a file publishes a post. |
| `docs/superpowers/specs/` | The design document this was built from. It records what was intended, not what is now built — read the code for that. |
| `docs/superpowers/plans/` | The implementation plan, same caveat. |

## Rules the tests enforce

Four suites read the real source on every run rather than testing a mock of
it, so breaking one of these rules fails the build rather than reaching a
page.

### `src/lib/__tests__/claims.test.ts`

Walks the source and the content. It fails on any of these:

- **A performance claim.** No win rates, no profit figures, no guarantees —
  anywhere, in copy or in a comment. The owner's own Mastery system forbids
  this of its content agents and the parent site holds the same line.
- **The 1,200 figure phrased as membership.** It is a twelve-year career
  total, not a current member count of anything, and it is not verifiable from
  any database. Write "more than 1,200 traders over twelve years".
- **A hardcoded money figure in a page or component.** Coaching prices and
  Fukyaa's deposit minimum are config. A figure typed into prose goes stale
  silently and then two pages disagree.
- **An agency-era social handle.**

A line that has to quote banned wording in order to document the rule marks
itself `claims-guard: allow`. Per line, never per file.

### `src/lib/__tests__/voice.test.ts`

Hype words, tracked capitals outside the one component allowed to set them,
exclamation marks, and the decoration utilities this site does not use
(`transition-all`, `hover:scale`, glow shadows, gradient backgrounds). It also
holds the reveal CSS behind `.motion-ready`, so a failed script can never
leave the page blank.

### `src/components/__tests__/section-padding.test.ts`

`Section` takes its padding through the `pad` prop, never through
`className`. Two utilities setting the same property have equal specificity,
so the winner is decided by their order in the compiled stylesheet, and
Tailwind emits the scale ascending — `py-16` beats `py-10` wherever both are
set. Sixteen sections once rendered at default spacing while the source read
as though they had been tightened.

### `src/app/__tests__/freshness.test.ts`

Any page that can reach a clock read, however indirectly, must export a
`revalidate` of at most a day. The original bug was indirect:
`fukyaaRoutes()` defaults its `now` argument, so a page that never wrote
`new Date()` still froze a dated figure into static HTML.

## Design

Three colours, applied 60/30/10, defined in `src/app/globals.css`:

| | Hex | Role |
|---|---|---|
| Vanilla Line | `#f2e9d8` | the paper — backgrounds |
| Pine Lacquer | `#163a30` | the ink — text, rules, dark surfaces |
| Ruby Flare | `#f0283c` | the mark — one action per screen, never running text |

Each has its own variations in the same file — `paper-raised` for cards,
`pine-deep` for the dark band, `sage`, `blush` and `sand` as the tints. Use
those tokens; do not mix new values.

Ruby measures about 3.5:1 against the paper, so it fails AA for body copy and
is never used for it. White on a ruby button is about 4.4:1, which only clears
AA as large text — button labels are bold and 16px or larger. Pine on ruby is
unreadable; never pair them.

One typeface, **General Sans**, self-hosted from `src/fonts/` in four weights
with no italics. It stands in for GT Walsheim, which is licensed
commercially. Display type is the same family at 600 with tighter tracking —
the `.display` class — not a second font.

## Motion

GSAP with ScrollTrigger for the reveals, Lenis for smooth scroll. Both are
imported inside the effect in `motion-root.tsx`, so they are a lazy chunk
rather than ~70 KB in the first paint.

A section opts in with one attribute: `data-reveal`. No wrapper, no client
boundary, no extra bundle. One batched trigger collects them all, so anything
crossing the fold in the same frame animates as a group — which is how a row
of cards staggers without anybody setting a delay.

Two rules hold, and both have tests:

- `motion-ready` is added only after both libraries have loaded. The CSS that
  hides a revealed element sits behind that class, so a failed chunk or
  scripts off leaves the page plainly visible.
- Nothing starts under `prefers-reduced-motion: reduce` — no reveals, and no
  smooth scroll either.

One catch worth knowing before adding a client component that swaps content:
the reveals are collected once, on mount. Markup that arrives later has no
trigger and will stay hidden. `plan-switch.tsx` is the case in point — what it
swaps carries no `data-reveal` and animates itself instead.

## Not built yet

Events, registration, Resend email, Billplz and manual QR payment with receipt
upload, the Telegram approval bot, order tracking, and click logging inside
`/go/[product]`. All of it needs credentials that are not provisioned, and all
of it is specified in the design document.

The homepage's Mastery packages link to `/go/mastery-membership` until that
checkout exists; it is one line in `plans.ts` when it does.
