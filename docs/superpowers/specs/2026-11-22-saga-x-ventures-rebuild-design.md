# Saga X Ventures — site rebuild

Design document · 22 November 2026 · status: awaiting approval

## 1. Intent and why

Saga X Ventures has pivoted fully from marketing-agency work to trading. The
site in this repo still sells website development, Google Ads, social ads, SEO
and system development. None of that is the business any more.

Two things drive the rebuild.

**The portfolio is scattered.** The owner has built many products — Mastery
Signal, Fukyaa, coaching, Work2U and others — with no single front door. A
person who hears about him has nowhere to land that shows the whole picture.

**Traffic to the products is not identifiably his.** Mastery Signal and Fukyaa
are promoted by other people too. Someone arriving at those products is not
necessarily his client. He needs a door where everyone who walks through is
his, and where he can see, count and follow up on them. This is an attribution
problem, not an operations problem.

The homepage therefore has a specific job: establish Asri Zulzali personally as
a credible trader. That credibility is what makes any of the products worth
clicking. The company name sits on top; the person supplies the proof.

## 2. Goals

1. One front door that routes a visitor to the right product by skill level.
2. Establish credibility through experience and scale: 12+ years trading,
   founder of Mastery Signal, 1200+ traders across Malaysia and Indonesia.
3. Capture and own every lead — event registrations and coaching enquiries —
   in his own database, with an admin view.
4. Run events end to end: he creates an event, people register, Resend emails
   them the Zoom link or the venue details.
5. Take money for Mastery Signal membership and for coaching, by card/FPX and
   by QR with a receipt, so the buyer is attributable to his own funnel rather
   than to whoever else promotes the same products.
6. A personal blog, unattached to any brand.
7. Keep the SEO foundation that already works in this repo.

## 3. Non-goals

Explicitly out of scope for this build. Each was discussed and set aside.

- **Hosting video.** Webinars run on Zoom. A peer-to-peer WebRTC build was
  considered and rejected (see §5.3).
- **Operating other products from this site.** Mastery Signal, Fukyaa and
  Work2U keep their own admins. This site links out; it does not drive them.
- **The Insight syndication service.** It is a real product — selling trade-news
  insight to *other* trading brands — but its buyer is a brand owner, not a
  retail trader, and the owner wants the bridge built last and tested against
  Mastery Signal first. It gets a sales page when it launches.
- **Work2U integration.** Work2U is not ready. The lead tables are shaped so a
  later export or push needs no rewrite.
- **Self-serve Mastery Signal membership.** Membership is still granted by hand
  on masterysignal.com. This site takes the payment and hands over a
  registration link (§7.13); it does not provision accounts.
- **A waitlist, self-service cancellation, or refunds in software.** All handled
  by conversation in version one.

Payments were a non-goal in the first draft of this document. They are not any
more — see §7.13 and §7.14. Events remain free.

## 4. Anti-goals

Things that would make this a failure even if it technically worked.

- **Becoming another scattered system.** The point is to reduce scatter. If this
  adds maintenance without consolidating anything, it has failed.
- **Competing with masterysignal.com** for the same search terms. Two sales
  pages for one product split the ranking and double the copy to keep in sync.
- **Any claim about profits, win rates or guaranteed results.** The owner's own
  Mastery system already forbids this of its content agents
  (`docs/insights-agent-api.md`: "Don't state win rates, profits or
  guarantees"). Contradicting that on the parent site is both inconsistent and
  a regulatory exposure in Malaysia. Proof is experience and scale only.
- **An admin so heavy he avoids using it.** If creating an event is a chore,
  events stop happening and the whole registration feature is dead weight.

## 5. Constraints

### 5.1 Fixed by the owner

- **Brand:** "Saga X Ventures" is the name at the top — logo, domain, title,
  schema. Asri Zulzali appears inside as founder, not as the brand.
- **Domain:** `sagaxventures.com`, owned, valid to 15 August 2027.
- **Infrastructure already in use:** Supabase (database), Resend (email),
  Cloudflare (DNS/CDN), Vercel (hosting).
- **Proof claims:** 12+ years experience, founder of Mastery Signal, 1200+
  traders in Malaysia and Indonesia. No results claims.
- **Zoom links are shared freely.** The owner considers forwarding a feature,
  not a leak: more people in the room is the goal. No per-attendee tokens, no
  delayed release.
- **Language: English only.** One locale, `en_MY`, no i18n layer. Decided
  explicitly so it is not retrofitted later.
- **The "1200+ traders" figure is a career total across twelve years**, not a
  current member count of anything. Copy must say so plainly — "more than 1,200
  traders over twelve years" — and must never be phrased so a reader could take
  it as live Mastery Signal membership. It is not verifiable from any database
  and no attempt should be made to imply that it is.
- **Social profiles are removed.** The `facebook.com/sagaxmedia` and
  `instagram.com/sagaxmarketing` handles are agency-era and the owner has not
  created trading replacements yet. They come out of `site.ts` and out of the
  `sameAs` schema rather than being left pointing at the old business.

### 5.2 Inherited from the repo

- Next.js 16.3.1, React 19.2.8, Tailwind 4, TypeScript. `AGENTS.md` warns that
  this Next.js version differs from older conventions — read
  `node_modules/next/dist/docs/` before writing framework code.
- The config-driven pattern works and stays: `src/lib/site.ts` as the single
  source of business details, `src/lib/services.ts` generating pages and nav
  from one array, `src/lib/blog.ts` reading Markdown at build time.
- The SEO machinery works and stays: JSON-LD, `sitemap.ts`, and `robots.ts`
  blocking indexing on non-production Vercel deployments.

### 5.3 Discovered during design

- **A self-hosted webinar is not viable.** The reference the owner offered
  (`0x5eba/Video-Meeting`) is a full-mesh peer-to-peer WebRTC app: its server is
  pure signalling, and every participant opens a connection to every other
  participant, uploading their own stream N-1 times. It degrades at roughly five
  participants. It also advertises "no account needed", which is the opposite of
  gated registration, and its socket.io server cannot run on Vercel alongside a
  Next.js app. A real webinar needs an SFU; Zoom already is one.
- **PDPA applies.** Collecting name, email and phone from Malaysian residents
  requires a privacy notice and a consent record. The owner already maintains a
  `mastery-privacy` repo, so the pattern exists.
- **Resend needs a verified sending domain** — DNS records added in Cloudflare
  before any mail sends.
- **The Markdown blog cannot be published to from a phone.** Publishing needs a
  commit. Accepted: the blog is occasional personal writing, not a daily feed.

## 6. Approaches

### 6.1 Rebuild in place vs. a fresh repo — decided, not offered

Rebuilt **in place**, in this repo, on the existing stack. A fresh scaffold
would mean re-solving the structured data, sitemap, preview-indexing block,
blog pipeline and responsive header, all of which already work, in exchange for
nothing. What changes is content and appearance, not the frame. Recorded as the
author's call, not the owner's choice.

### 6.2 The shape of the site — the owner chose A

**A. Thin hub — CHOSEN.** One strong homepage carrying most of the weight. Full
pages only for what is sold here: Coaching, plus About, Contact, Blog and
Events. Mastery Signal and Fukyaa appear as nav dropdown entries and homepage
cards that link out.

*Trade-off:* the least SEO surface — the homepage and blog must do the ranking.
In exchange: no overlap with masterysignal.com, fastest to build, easiest to
keep sharp.

**B. Hub plus a page per offering.** A real page here for Mastery Signal,
Fukyaa, Coaching and later Insight, each written for a different search intent.

*Trade-off:* more surface to rank on, but two sales pages for the same product —
one here, one on masterysignal.com — splitting the ranking between his own
sites and doubling the copy to maintain. Rejected for that reason.

**C. Content-led.** A light homepage with the blog as the engine, products
reduced to sidebar calls to action.

*Trade-off:* the best long-term organic growth, the slowest payoff, and it
depends on consistent writing at exactly the time the owner will be busy
launching the Insight service. Rejected on timing, not on merit.

**A grows into B on its own** when Insight launches, because Insight has no
other home and must be sold here.

## 7. Decisions

### 7.1 Information architecture

```
/                      Homepage
/coaching              Coaching: the ladder, pricing, enquiry
/events                Upcoming and past events
/events/[slug]         One event + registration form
/join                  Mastery Signal membership: pay here, register there
/join/pay/[id]         Billplz handoff and return
/join/receipt          Manual QR payment + receipt upload
/join/thanks/[token]   Success page carrying the registration link
/go/[product]          Logged outbound redirect (§7.4a)
/blog                  Personal writing
/blog/[slug]           One post
/about                 Asri and the company
/contact               Enquiry
/privacy               PDPA notice (new, required)
/admin                 Events, leads and orders (authenticated)
```

Navigation: **Products ▾** (Mastery Signal → external, Fukyaa AI Auto Trade →
external IB link, Coaching → internal) · Events · Blog · About · Contact, plus
a call-to-action button.

Mastery Signal and Fukyaa have no pages here by design — only dropdown entries
and homepage cards. Both outbound links carry his tracking: Fukyaa via the IB
link, Mastery Signal via his manual-approval registration path.

### 7.2 Homepage

The spine comes from the owner's own words — a visitor is sorted by skill, and
the three products answer three different answers to one question.

1. **Hero** — Saga X Ventures, positioning line, the owner's credibility in one
   sentence, primary call to action.
2. **Stat strip** — 12+ years · 1200+ traders · Malaysia and Indonesia.
3. **Which one are you?** — three routes: *can trade, want signals* → Mastery
   Signal · *cannot trade* → Fukyaa auto trade · *want to learn* → Coaching.
4. **Founder** — Asri, photo, the twelve-year story, what he built and why.
5. **Next event** — the soonest open event with a register call to action.
6. **Latest writing** — most recent blog posts.
7. **Contact.**

### 7.3 Events

One table with a `type` discriminator, not two systems. Webinars and physical
seminars differ in three ways only: what the email carries, whether capacity is
enforced, and which fields the page shows.

```
events
  id            uuid pk
  slug          text unique
  title         text
  type          text    -- 'webinar' | 'seminar'
  status        text    -- 'draft' | 'open' | 'closed' | 'done'
  starts_at     timestamptz
  ends_at       timestamptz null
  timezone      text default 'Asia/Kuala_Lumpur'
  summary       text
  description   text
  cover_image   text null
  capacity      int null         -- null = unlimited; enforced when type='seminar'
  join_url      text null        -- webinar: the Zoom link
  venue_name    text null        -- seminar
  venue_address text null
  venue_map_url text null
  created_at    timestamptz default now()
  updated_at    timestamptz
```

Capacity is a hard limit for seminars — seats are physically finite — and a soft
or absent limit for webinars, where more attendance is the goal.

### 7.4 Leads

Two tables rather than one polymorphic table, because the shapes genuinely
differ, and both carry the same core contact columns so a later union export to
Work2U is trivial.

```
registrations
  id            uuid pk
  event_id      uuid fk -> events
  name, email, phone
  status        text    -- 'registered' | 'cancelled' | 'attended'
  consent       boolean -- optional marketing opt-in; see §7.11
  source        text
  link_sent_at  timestamptz null  -- when the join/venue detail actually went out
  created_at    timestamptz default now()
  unique (event_id, lower(email))

enquiries
  id          uuid pk
  kind        text    -- 'coaching' | 'contact'
  name, email, phone
  message     text
  consent     boolean
  source      text
  created_at  timestamptz default now()
```

`source` and `created_at` exist on both from day one specifically so that
attribution — the reason this site exists — is answerable without a migration.

**Registration lifecycle (author's call).** Version one keeps this deliberately
small: no public self-cancellation, because a cancel link means tokenised URLs
and an email flow that nothing else in this build needs. The admin sets
`cancelled` and `attended` by hand. Registering twice with the same email for
the same event updates the existing row rather than creating a duplicate —
hence the unique constraint — so a person who forgets they signed up gets a
second confirmation, not a second seat. A full seminar is a hard stop with a
"full" state on the page; no waitlist in version one.

### 7.4a Outbound click tracking

Attribution is the stated reason this site exists (§1), so outbound product
links are not bare anchors. Both go through a logged redirect:

```
/go/[product]   ->  302 to the destination, after writing one row

outbound_clicks
  id          uuid pk
  product     text    -- 'mastery-signal' | 'fukyaa' | 'whatsapp'
  referrer    text null
  created_at  timestamptz default now()
```

No cookies and no personal data — a counter, not a tracker, which keeps it
clear of the consent question entirely. This is what lets the owner answer "how
many people did my own funnel send to Fukyaa last month", which neither
destination can tell him, because both are promoted by other people too.

Recorded as the author's call.

**The destinations.** Note that the broker is the same in both cases but the
invite codes differ — attribution per product is already handled on the
broker's side, and the two codes must never be swapped.

| Key | Destination |
|---|---|
| `mastery-broker` | `https://platform.hmvestportal.com/regist-real?invitid=1AA974-WAVJR35865` |
| `mastery-membership` | `https://www.masterysignal.com/membership` |
| `fukyaa-broker` | `https://platform.hmvestportal.com/regist-real?invitid=004VL9-TRMRV13456` |
| `fukyaa-register` | `https://fukyaa.com/register` |

Neither product is a single link. **Mastery Signal** requires a broker account
and a deposit sized to the chosen package before membership. **Fukyaa** requires
a broker account with a **minimum 500 USD deposit** first, and only then
registration at `fukyaa.com/register`. Both homepage cards therefore explain a
short sequence rather than offering one button, and the Fukyaa deposit minimum
is stated up front — it is the single biggest qualifier, and hiding it only
produces enquiries that go nowhere.

### 7.5 Database

A **new, separate Supabase project** for this site. The signal platform's
Supabase is shared across brands and holds member and billing data; coupling a
public marketing site to it means a mistake here can reach that, and a schema
change there can break this. The separation is deliberate.

Row-level security on, with writes to `registrations` and `enquiries` going
through server actions or route handlers using the service role — never from
the browser.

### 7.6 Admin

Supabase Auth with a magic link, restricted to an allowlist of one email
address. Recorded as the author's call: the Mastery codebase uses a shared
admin key header, which works but puts a long-lived secret in a browser; for a
single-operator admin a magic link is simpler and safer.

The admin does six things and no more:

1. List and create events; set the Zoom link or the venue.
2. **Send the join details** to everyone registered — an explicit button, never
   automatic (§7.7).
3. See who registered for each event, with `link_sent_at` visible per row.
4. Mark a registration `cancelled` or `attended`.
5. Read the enquiries list.
6. Review orders: see receipts, approve or reject manual payments, and work the
   standing **paid, access not yet granted** list (§7.13).
7. Export any list to CSV.

Anything beyond that risks §4's anti-goal.

### 7.7 Email

Resend, from a verified `sagaxventures.com` sender, reply-to the owner's real
address.

- **Webinar registration** → immediate confirmation carrying the Zoom link.
- **Seminar registration** → immediate confirmation carrying venue, address and
  map link.

**When the details do not exist yet (author's call).** Registration regularly
opens before a Zoom link is generated, so `join_url` stays nullable and an
event may be opened without one. If it is absent at registration time, the
confirmation goes out without it and says the link will follow; `link_sent_at`
stays null. When the owner later adds or changes the link, the admin offers an
explicit **send join details** action to everyone registered, and stamps
`link_sent_at`. Nothing re-sends automatically on edit — an accidental keystroke
should not mail hundreds of people. The same applies to a changed venue.

A reminder before the event would raise attendance materially and needs a Vercel
cron job. Left to the builder as an optional follow-on, not part of the first
cut.

### 7.8 SEO

- **Drop the Seremban-first keyword strategy.** It was correct for a local
  marketing agency, where the map pack decides who gets called. It is wrong for
  trading: nobody searches for a forex signal provider by town, and the audience
  spans Malaysia and Indonesia. Keep the real address in the structured data for
  legitimacy; retarget the keywords to trading intent.
- **Schema:** `Organization` for Saga X Ventures, `Person` for Asri, and `Event`
  for each event. Event structured data is the single biggest available win —
  it puts dates and registration directly into Google results.
- **Redirect the dead service URLs.** `/services/website-development` and its
  four siblings disappear. The site is recent and lightly indexed, but 301s to
  the homepage are cheap insurance against dead links.
- Keep `robots.ts` and its preview-deployment block exactly as it is.

### 7.9 Removals

Deleted, not rewritten: the five marketing service entries in `services.ts` and
their generated pages, the three marketing blog posts in `content/blog/`, and
all agency copy on the homepage, About and Contact pages. The `README.md`, still
`create-next-app` boilerplate, gets real content.

The existing WhatsApp-only quote form is replaced. It stores nothing, and
storing leads is the point of the rebuild.

**WhatsApp itself stays (author's call).** The repo also carries a persistent
`whatsapp-float.tsx` on every page and a `waLink()` helper, which together are
the easiest path for any visitor — and therefore a path straight past the lead
tables that goal 3 exists to fill. Removing it would be the tidy answer and the
wrong one: Malaysian buyers answer WhatsApp and abandon forms, and suppressing
the channel to protect a database would cost real enquiries. It stays, demoted
below the forms rather than competing with them, and the float routes through
`/go/whatsapp` so at least the volume is counted even when the conversation
itself is not captured.

### 7.10 Blog

Stays as Markdown files in `content/blog/`, read at build time. Free, versioned,
nothing to maintain. The owner writes occasionally and personally, so the
publish-by-commit constraint is acceptable.

All three existing posts are deleted as marketing content (§7.9), so `/blog`
and the homepage "latest writing" section must both degrade gracefully to empty
rather than assuming at least one post exists. Launching with an empty blog is
acceptable; launching with a broken homepage section is not.

### 7.11 PDPA, consent and the privacy notice

Two separate things, often conflated, and conflating them here would be the
legally wrong shape:

- **The processing notice is not optional and does not block anything.** The
  visitor is told, at the point of collection, what is collected, why, who
  holds it and how to ask for removal. A short line by the submit button
  linking to `/privacy`.
- **Marketing consent is a separate, optional, unticked checkbox** — "send me
  updates about future sessions". It must **not** block submission. Someone
  registering for a webinar is requesting a service; refusing them a seat for
  declining marketing would be both hostile and wrong. The `consent` column
  records only that opt-in, so `consent = false` rows are perfectly valid
  registrations that simply may not be marketed to later.

Recorded as the author's call. The builder drafts `/privacy` from the pattern
in the owner's existing `mastery-privacy` repo; the owner is responsible for
having the final wording checked, as this is the one page on the site with
legal weight and neither the builder nor this document is a lawyer.

### 7.12 Cutover

`sagaxventures.com` is **live today**, serving the current marketing site
(verified 22 November 2026: HTTP 200, title "Saga X Ventures — Marketing &
development for Malaysian SMEs"). This is a replacement of a running site, not
a first launch, which changes two things.

The owner's chosen sequence: **build and review on localhost, then push to
`main`, deploy on Vercel, straight to the live domain.** No preview-deployment
review stage.

This works because review happens locally instead, but it has one consequence
the builder must plan around: the events, payment and email paths cannot be
proven on localhost without the real Supabase and Resend credentials, and
Billplz and Telegram both need publicly reachable callback URLs that
`localhost` cannot provide. Those flows are therefore tested with a tunnel
(ngrok or similar) against sandbox credentials, or they are not tested until
production — and the latter is not acceptable for a path that takes money.
`robots.ts` still blocks indexing anywhere that is not the production Vercel
environment, so nothing half-finished can be indexed.

The 301s from the dead service URLs (§7.8) ship in the same cutover, not after.

### 7.13 Payments and granting access

The owner sells Mastery Signal membership **through this site**, so that a
buyer is attributable to his own funnel rather than to whoever else promotes
the product. Membership itself is still granted by hand on masterysignal.com;
this site handles the money and the handover.

**Automated path — Billplz / FPX**

1. Buyer pays through Billplz on this site.
2. Billplz callback is verified server-side and the order is marked paid.
3. The buyer is returned to a success page carrying the registration link.
4. The owner approves the account on masterysignal.com.

**Manual path — DuitNow / Touch 'n Go QR**

1. Buyer pays by QR using whichever method suits them.
2. Buyer uploads the receipt through a form on this site. The file goes to
   Supabase Storage; an order row is created with status `pending`.
3. A **Telegram notification** reaches the owner with the receipt and an inline
   **Approve** button.
4. On approval the order becomes `approved` and the system **emails the
   registration link** to the buyer.
5. The owner approves the account on masterysignal.com.

```
orders
  id            uuid pk
  product       text    -- 'mastery-membership' | 'coaching'
  variant       text    -- package or class + mode
  amount_myr    numeric
  method        text    -- 'billplz' | 'manual_qr'
  status        text    -- 'pending' | 'approved' | 'rejected' | 'paid'
  receipt_path  text null     -- Supabase Storage object, manual path only
  buyer_name, buyer_email, buyer_phone
  approved_at   timestamptz null
  link_sent_at  timestamptz null
  access_granted_at timestamptz null   -- ticked by hand; see below
  created_at    timestamptz default now()
```

**Two safeguards, both non-negotiable (author's call).**

*The Telegram Approve button is a money button.* It must accept callbacks only
from the owner's own chat ID, and it must be idempotent — a double tap cannot
send two links or approve twice. An unprotected inline button is a public
endpoint that anyone who finds the bot can press.

*Paid-but-not-granted must be visible.* The buyer pays here, but their
membership lives on another system, and the only bridge between the two is the
owner remembering. `access_granted_at` exists so the admin can show a standing
list of **paid, access not yet granted** — people who have handed over money
and received nothing. Without it the failure is silent and the customer has
nobody to chase.

### 7.14 Coaching: product and pricing

**The product.** One-to-one personal coaching, roughly a day per class
(delivered as two days one night onsite). Three classes forming a ladder:
Basic Trading → Advance → News Trading. Two delivery modes: onsite and online.

**Pricing is deliberately held in config**, in `site.ts` or a `coaching.ts`
beside it — never hardcoded in a page. The owner is still settling the numbers
and expects to change them without a code change.

**Structure decided (owner's call, after discussion):**

- Priced **per class**, not as one bundle, so the ladder is visible, entry is
  affordable, and there are three selling moments instead of one.
- **Onsite is a single all-in price** — the owner absorbs transport, hotel and
  expenses into the fee rather than billing travel separately. Recorded with
  its consequence acknowledged: a client in East Malaysia or Indonesia costs
  considerably more to serve than one in Kuala Lumpur, at the same price.
  Because the price does not vary by location, onsite can display a fixed
  figure and does not need a quote step.
- **Online is the same one-to-one format** and should not be priced at a
  fraction of onsite. The owner's previous figures — RM4,970 onsite against
  RM997 online — differ by five times for an identical day of his time, while
  the cost difference is roughly RM800. The remaining gap has no basis, and a
  rational buyer simply chooses online, so the onsite price never transacts.
- The **RM997 price point is kept but reattached** to something cheap to
  deliver — a group online class or a half-day session — so an affordable rung
  exists without consuming a full one-to-one day.

The resulting ladder, which the events feature feeds directly: **free webinar →
low-cost group online → one-to-one online → onsite intensive.** Each rung costs
the owner proportionally more time and pays proportionally more.

**Capacity shapes the page.** One-to-one days are scarce — realistically a
handful a month beside everything else the owner runs. The coaching page is
therefore built to qualify, not to maximise clicks: it states who the class is
for, and who should use Fukyaa instead.

**Buying flow.** Dates must be agreed before money changes hands — two people
cannot hold the same day. So: enquiry capturing preferred dates and experience
level → the owner confirms availability → a Billplz payment link is sent. This
is deliberately the *same* approve-then-send-link pattern as §7.13, so there is
one flow to build, learn and maintain rather than two.

## 8. Left to the builder

- Typography, motion and component structure.
- **Not the palette — the owner has fixed it.** Vanilla Line `#EFE6D3` at 60%
  as background, Pine Lacquer `#163A30` at 30% for text and dark surfaces,
  Ruby Flare `#F0283C` at 10% for calls to action only. This replaces the
  current dark theme entirely. Ruby fails AA against the cream at about 3.5:1,
  so it is never running text; button labels on Ruby are bold 16px or larger.
  Full rules in Plan 1's Global Constraints.
- All final copy, from the owner's voice and the facts in §5.1.
- Admin screen layout.
- Whether `services.ts` is reshaped into a `products.ts` or kept as is.
- Form validation, spam protection on public forms, and error states.
- The optional pre-event reminder cron.

## 9. Questions raised and answered

The builder review of 22 November 2026 raised ten points. Six were settled by
the author and are marked as such where they appear. The rest went to the owner
and are answered here; each answer is already reflected in the sections above.

1. **Language** → English only (§5.1). No i18n layer.
2. **Outbound URLs** → supplied, with the deposit sequences both products
   require (§7.4a).
3. **Infrastructure** → the owner provisions Supabase, Resend and Cloudflare.
   Development happens on localhost, then `main` → Vercel → live domain, with
   no preview stage (§7.12).
4. **The coaching offer** → one-to-one, roughly a day per class, three classes,
   two modes, priced per class, onsite all-in (§7.14).
5. **Social links** → removed, not repointed (§5.1).
6. **The "1200+ traders" figure** → a twelve-year career total, not a member
   count. Not verifiable from any database and must not be worded as if it
   were (§5.1). The proposed database check is therefore dropped, which also
   removes the reason to touch the shared Mastery Supabase at all.

### Still outstanding

- **The admin allowlist email and the real reply-to address.** The repo carries
  only `enquiry@sagaxventures.com`.
- **Billplz credentials** — API key, collection id and X-signature — plus the
  Telegram bot token and the owner's chat id. All are needed before §7.13 can
  be tested end to end, and none should enter the repository.
- **The coaching prices themselves.** The structure is fixed (§7.14); the
  numbers are config and the owner is still deciding them. The build does not
  wait on them.
