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
| `src/lib/products.ts` | The three products, their outbound destinations, and the two broker invite codes. |
| `src/lib/coaching.ts` | The class/mode matrix and its prices. |
| `src/lib/schema.ts` | Structured data for the organisation and the person. |
| `src/app/go/[product]/` | The logged outbound redirect every external link passes through. |
| `content/blog/` | Posts, as Markdown with frontmatter. Adding a file publishes a post. |
| `docs/superpowers/specs/` | The design document this was built from. |
| `docs/superpowers/plans/` | The implementation plan. |

## Rules the tests enforce

`src/lib/__tests__/claims.test.ts` walks the real source and content on every
run. It fails the build if any of these appear:

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

## Design

Three colours, applied 60/30/10, defined in `src/app/globals.css`:

| | Hex | Role |
|---|---|---|
| Vanilla Line | `#EFE6D3` | the paper — backgrounds |
| Pine Lacquer | `#163A30` | the ink — text, rules, dark surfaces |
| Ruby Flare | `#F0283C` | the mark — one action per screen, never running text |

Ruby measures about 3.5:1 against the paper, so it fails AA for body copy and
is never used for it. White on a ruby button is about 4.4:1, which only clears
AA as large text — button labels are bold and 16px or larger. Pine on ruby is
unreadable; never pair them.

One typeface, Archivo, loaded with its `wdth` axis. Display type is the same
font at a wider cut, not a second family.

## Not built yet

Events, registration, Resend email, Billplz and manual QR payment with receipt
upload, the Telegram approval bot, order tracking, and click logging inside
`/go/[product]`. All of it needs credentials that are not provisioned, and all
of it is specified in the design document.
