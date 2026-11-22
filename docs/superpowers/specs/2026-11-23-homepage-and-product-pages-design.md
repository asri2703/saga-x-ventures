# Homepage and product pages

Design document · 23 November 2026 · status: awaiting approval

Builds on `2026-11-22-saga-x-ventures-rebuild-design.md`, which is still the
authority for the stored half of the site (database, admin, email, payments).
Where the two disagree, the decisions here are newer and win.

## 1. Intent and why

The rebuild shipped a thin hub: three products, two of them bare links out.
Two things have changed since.

**The owner decided every product gets a page, not a link.** His words: a
visitor needs a step-by-step guide, because none of these products is one
click. Each needs a broker account and a funded balance before the product
does anything, and sending someone to a signup form without saying so
produces registrations that stall. `/mastery-signal` proved the shape; the
rest follow.

**The homepage is his front as a trader, and he specified its sections.** Not
a company front. Asked directly, he said: *muka hadapan saya sebagai trader*.
The six sections below are his, in his order.

There is also a standing complaint that carries into every line written here:
the copy reads as machine-written. That is a constraint, not a preference
(§5.3).

## 2. Goals

1. Build the six homepage sections the owner specified, in his order.
2. Give each product its own page with a step-by-step guide.
3. Sort visitors by **account type**, which is what actually divides the
   products, rather than by product name.
4. Make the page feel less empty — with content first, decoration second.
5. Keep every claim inside the rules already enforced by the claims guard.

## 3. Non-goals

- **The stored half.** The enquiry form, Supabase tables, admin screens,
  Resend sending and the Billplz/Telegram payment path are a second pass.
  Section 6 is a WhatsApp handoff until then. This is approach A (§6).
- **The IB page.** Broker Partnership and Fintech Innovation get a block on
  the homepage and a link; their page comes later.
- **Events and writing on the homepage.** Both stay in the navigation and
  keep their own pages; their existing homepage blocks are **removed**.

  Recorded as the author's call, because a non-goal usually means "not built"
  rather than "delete what exists". The reasons: the owner's list is six
  sections and names neither; both already have nav entries and pages of their
  own; and the homepage events block currently advertises a schedule that does
  not exist, which is a promise the site cannot keep. Nothing live is lost —
  the branch has never been deployed.

## 4. Anti-goals

- **Decoration standing in for content.** The page looks empty because four
  of its six sections do not exist yet. Filling that space with ornament now
  means removing the ornament when the content lands.
- **Three guides that repeat the same two steps.** Opening and funding a
  broker account is shared. Saying it three times teaches the reader that the
  page is padding.
- **A second sales page per product.** masterysignal.com sells Mastery
  Signal. These pages explain the order and hand over links. Competing with
  our own site for the same terms helps nobody.
- **Copy that sounds machine-written.** See §5.3.

## 5. Constraints

### 5.1 The two broker accounts — the fact that shapes everything

The two invite codes are **per account type, not per product**:

| Account | Invite code | Products |
|---|---|---|
| **Cent** | `004VL9-TRMRV13456` | Copytrade, Fukyaa, all EA products |
| **Standard** | `1AA974-WAVJR35865` | Mastery Signal |

Two consequences the pages must handle:

- **`src/lib/products.ts` currently names these keys after products**
  (`mastery-broker`, `fukyaa-broker`). That was wrong the moment a third
  product shared a code. They are renamed `broker-cent` and `broker-standard`,
  and the test that pins each code to its destination is renamed with them.

  The rename needs no aliases. `/go/*` has never been public: the branch has
  never been pushed, sagaxventures.com still serves the old agency site, and
  `/go/mastery-broker` returns 404 in production (checked 23 November 2026).
  Nothing in circulation breaks.
- **Someone who wants Mastery Signal and Copytrade needs two accounts.** Cent
  and standard are different account types. If the pages do not say so, people
  open the wrong one and the owner answers the message.

Cent accounts use smaller contract sizes, which is why EAs and copy trading
sit there: finer position sizing, smaller risk per step. Say that rather than
asserting it without reason.

### 5.2 The six products

| Product | For | Entry |
|---|---|---|
| Mastery Signal | can trade, wants setups | standard account |
| Copytrade | wants to follow a person | cent account · 30% master / 70% investor |
| Fukyaa | wants to follow a system | cent account · min 500 USD |
| Classes & Coaching | wants to learn | enquiry |
| Broker Partnership | has a network of their own | free; earns the normal broker rebate |
| Fintech Innovation | wants their own platform | RM10,000 + RM500/month |

**Copytrade runs through the broker's own copy facility.** The client opens a
cent account on the owner's link, funds it, and joins through a link the owner
supplies. Client funds stay in the client's own account; the broker handles
the split. The owner is a strategy provider on the broker's platform, not a
party holding anyone's money. The page should not imply otherwise.

### 5.3 Voice

The owner's standing instruction, repeated twice: the copy reads as AI. The
mechanical tells are already guarded by `voice.test.ts` — hype words, tracked
capitals, exclamation marks. The guard cannot see the actual problem, which is
cadence:

- balanced antithesis — "the reasoning, not just the number"
- contrarian reversal — "Most people stopped trading. I did not."
- aphoristic closers — "which is the point"
- triads of abstract nouns — "simpler, smarter and more flexible"

Sentences are shorter and less symmetrical. Closers do not try to land. Where
a sentence can carry a concrete detail instead of a balanced clause, it does.

**The hero is the owner's own copy and is not rewritten**, including
"innovative" and "what matters most", which this document would otherwise
flag. He supplied it, he was told why it reads as it does, and he kept it.

### 5.4 Claims

Unchanged and enforced: no win rates, no profit figures, no guarantees. The
1,200 figure is a twelve-year career total, never a membership count.

Copytrade needs care. The whole offer is framed around profit — "70% to you"
promises the shape of a result without naming a number. It can be written
honestly, but not in the same register as a class.

### 5.5 Infrastructure, verified 23 November 2026

| | State |
|---|---|
| Supabase | service role and anon both valid, project ref matches, magic link enabled |
| Resend | key valid, **sagaxventures.com verified** |
| Telegram | `@masterysignalbot` valid |
| Billplz | **unverified** — `www.billplz.com` times out from the dev machine, sandbox rejects the key |

Billplz blocks nothing in this pass. When payments are built, the owner must
confirm whether that key is live or sandbox; if live, it cannot be tested
locally at all.

## 6. Approaches

**A. Content first, backend second — CHOSEN.** Homepage sections 1–5 and the
product pages, all static. Section 6 stays a WhatsApp handoff. The form,
tables, admin and email land as a second pass.

*Trade-off:* enquiries are not stored for a few more days. In exchange every
line of copy reaches the owner fast, and copy is the thing he has corrected
hardest and most often. Wrong words are cheapest to fix before code surrounds
them.

**B. One section at a time, fully.** Each section complete before the next,
with the form built when section 6 arrives.

*Trade-off:* small reviewable pieces, but the homepage stays a building site
for longer and the product pages queue behind homepage sections they do not
depend on.

**C. Backend first.** Tables, admin, email and form proven, then the content.

*Trade-off:* the riskiest technical work is proven earliest. Rejected because
the owner waits longest to see anything, and his pattern through this project
is to react to what he can read.

## 7. Decisions

### 7.1 Homepage sections

1. **Hero** — built. Owner's statement, portrait cutout, two calls to action.
2. **Siapa saya** — who he is. The marked chart moves here as evidence of how
   he reads a market.
3. **Misi** — why any of this exists. Written from his own three accounts:
   Mastery Signal began because people kept asking what he was looking at and
   an entry price never answered it; Fukyaa began because people told him
   plainly they would never learn to read a chart; and he refuses to quote
   profit figures in a market where that is what sells. *Fintech innovation*
   and *market intelligence* are evidence of the mission, not the mission.
4. **Solutions** — §7.2.
5. **Award and recognition** — §7.3.
6. **Coaching and classes** — WhatsApp in this pass; the stored form in the
   next.

### 7.2 Section 4: one gateway, then the choice

Opening and funding a broker account is shared, so it is stated once. The
section then splits by account type, because that is the real fork:

- **Standard account** → Mastery Signal
- **Cent account** → Copytrade, Fukyaa

Each product keeps the visitor's own voice as its opening line, as the
existing fork does. Each links to its page rather than explaining itself in
full here.

A short block closes the section: *if you have clients of your own* → Broker
Partnership and Fintech Innovation.

**How the six products live in config (author's call).** `products.ts` grows
to all six, with a `lane` of `retail` or `ib`. The header dropdown and the
section-4 fork render `retail` only, so the two page-less products never
appear in navigation as dead entries. The test pinning "exactly three
products" becomes a test that every retail product has a page and every
product declares a lane.

**Where the IB block points until its page exists (author's call).** To
`/go/whatsapp?m=partnership`, a new prefill. A stub page would be a dead end
dressed as a destination; WhatsApp is honest about what happens next, and the
audience is small enough that a conversation is the right first step anyway.

### 7.3 Section 5: the award

TradingLive Trading Influencers Awards, "Best In-House Trader". The on-screen
name is **Zack King**, the owner's former alias, and the caption says so
plainly. Unexplained, a different name on an award reads as borrowed; a single
line turns it into a fact about him. The photo is cropped to the screen and
the figure.

An award is a fact about recognition, not a claim about results, which makes
it one of the few forms of proof §5.4 leaves available.

### 7.4 New pages

`/copytrade`, `/fukyaa`, and later the IB page, following `/mastery-signal`:
introduction, numbered steps with the outbound link on the step that leaves,
and a disclaimer.

`/copytrade` states the 30/70 split, that funds stay in the client's own
account, and that the broker operates the facility. **Its join link does not
exist yet** — step 3 renders a labelled placeholder, as the Mastery Signal
feature cards do for their screenshots.

### 7.5 Pattern and motion

**The graph grid.** Adapted from Uiverse (`csemszepp/serious-cobra-89`, MIT,
credited in the source). This is the source, supplied by the owner — it is the
spec, not a description to approximate:

```css
.container {
  width: 100%;
  height: 100%;
  --s: 100px;
  --_g: #0000 90deg, #366 0;
  background: conic-gradient(from 90deg at 2px 2px, var(--_g)),
    conic-gradient(from 90deg at 1px 1px, var(--_g));
  background-size: var(--s) var(--s), calc(var(--s) / 5) calc(var(--s) / 5);
}
```

A 100px major grid with a 20px minor grid inside it — graph paper, drawn with
two conic gradients rather than four linear ones. Two changes on adoption:

- The class is renamed. `.container` collides with Tailwind's own `container`
  utility; a global rule setting `width`, `height` and a background on that
  name is a bug waiting for the first component that uses it.
- `#366` is a teal outside the palette. Redrawn in pine at low alpha.

It replaces `.bg-chart-grid`, which is the same idea with one grid instead of
two. It stays scoped to the hero and section 2 — rules and grids spread across
every section are the broadsheet default this design avoids.

**Scroll reveal.** Already built: the CSS exists, `MotionRoot` loads on every
page, and **no page uses it.** Zero `data-reveal` attributes in the codebase.
The site ships the JavaScript for an animation that never runs. Switching it
on costs no new code.

**Refused, and why:** glows, gradient washes as decoration, `hover:scale` on
cards, `animate-pulse`, `transition-all`. All on the unslop list the owner
brought in. Motion shows what changed; it does not ask for attention.

## 8. Left to the builder

- Section layout, spacing and typographic scale within the established tokens.
- Final copy, from the facts here and the owner's voice.
- Whether `/fukyaa` and `/copytrade` share a component with `/mastery-signal`
  or repeat its structure — three similar pages is the threshold where a
  shared one earns itself.
- Which elements take `data-reveal` and in what order.

## 9. Open questions for the owner

Raised by the builder review of 23 November 2026. Four of its seven points
were settled above and marked as the author's call or answered by the project.
These three are the owner's, and the first two block `/copytrade` only.

1. **What is the 30% calculated on?** "30% master / 70% investor" does not say
   of what. Profit only, or something else? Over what period — weekly,
   monthly, per closed trade? Gross, or net of the broker's own spread and
   commission? And does the investor owe anything in a period that ends flat
   or down?

   This is a financial term on a public page, not a wording choice. A guess
   here is a false statement about money. If it cannot be confirmed,
   `/copytrade` describes the split only in the broker's own words, or waits.

   The high-water mark question asked earlier is part of this one: without a
   high-water mark, a losing period followed by a winning one pays the master
   while the investor is still down overall. Whichever way it works, the page
   says so.

2. **What does a Copytrade client need to get in, and which facility is it?**
   Fukyaa states its 500 USD minimum up front because it is the biggest
   qualifier. Copytrade has no stated equivalent — is there a minimum balance,
   and what is the broker's copy facility called? The whole purpose of these
   pages is to stop registrations that stall; omitting a minimum reproduces
   exactly the failure they exist to prevent.

3. **The award year, and the exact wording.** The photo is now in the repo at
   `public/award-tradinglive.webp`, cropped to the screen and the figure. The
   screen reads "Best In-House Trader", "TradingLive Trading Influencers
   Awards", and the recipient as "Zack King, Co-Founder Market Value Price".
   The year on the badge is not legible enough to state. An undated award is
   weak proof, and the `Person` schema wants a date.

### Already outstanding, not blocking

- **The Copytrade join link** — not set up yet (§7.4). Step 3 is a labelled
  placeholder until it exists.
- **Is RM10,000 shown publicly?** Showing it filters hard and saves the
  owner's time; hiding it opens more conversations, most with the wrong
  people.
- **Five screenshots** for the Mastery Signal feature cards, which render
  labelled placeholders today.
