# Record: account names, returns and drawdown — design

**Date:** 2026-11-26
**Section:** `/copytrade` → "Trading performance" (the `pine` band)
**Ships as:** one PR (PR3)

---

## Intent

The record section publishes three MT5 accounts. Today each tab shows a name,
a USD trading result and a start date. Three things are wrong with that, and
this change fixes all three together because they are the same section and the
owner merges one PR, not three.

1. **The names are MT5 jargon.** "Master account / Earlier master / Previous
   master" is terminology for someone who already runs copytrade. The people
   most likely to read this page are the people who do not.

2. **There is no percentage.** The tabs carry absolute USD. +317.43 on one
   account and +29,499.34 on another say nothing about how the strategy
   performed, because the accounts were funded a hundredfold apart.

3. **The chart shows only the upside.** Two of the three accounts have lost
   roughly a quarter of the account in a single day. The calendar shows red
   days, but it sits below the fold of the panel while the headline figure is
   at the top.

The owner's framing for (3), in his words: show it *"supaya orang tahu kita
overcome loss macam mana."* That is the design brief for the risk figure — it
is about recovery, not just the fall.

## Goals

- Name the accounts in language a non-trader reads without a glossary.
- Publish a return percentage per account that is correct in the presence of
  deposits and withdrawals.
- Publish, beside it, how far the account has fallen and whether it came back.
- Leave the three figures meaning the same thing on all three accounts, so a
  reader comparing them is not misled by the method.

## Non-goals

- No combined or blended figure across the three accounts. The owner was
  explicit: *"ikut percentage ikut masing masing, jangan gabung."*
- No annualised, projected or extrapolated return.
- No change to how data is collected. The reporter EAs and the ingest route
  stay exactly as they are; everything here is computed from data already in
  `account_deals`.
- No change to the calendar.

## Anti-goals

Things that would make this a failure even if it shipped and worked:

- **A published figure that is wrong.** Especially the recovery state: Onyx
  has *not* recovered, and a field that says it has would be a false
  statement about money on a page that asks for money.
- **A percentage that is really an artifact of cash flows.** See Approaches.
- **Loosening `src/lib/__tests__/claims.test.ts`.** It stays as it is.

## Constraints

Carried from the repo and the owner's standing rules:

- The repo is **public**. No logins, secrets or tunnel URLs in source, tests
  or comments. The three accounts are referred to by name, never by login.
- **No figure is typed by hand.** Every number on the page is computed from
  the MT5 data. `claims.test.ts` already blocks hardcoded money literals in
  `app/` and `components/`.
- **No win-rate, guarantee or return-projection claims.** A historical
  percentage computed from real deals is none of those, and the existing
  detector (`/win[-\s]?rate|guarantee[ds]?\b|profit\s+(of|up to)|…/i`) does
  not match it. It is not modified.
- **No account is hidden**, whatever its record says.
- Money formatting goes through `src/lib/commercial.ts`. Percentages are new
  and get a formatter beside the others.
- Server components cannot pass functions to client components. The maths runs
  on the server in `record.ts`; components receive plain numbers and strings.
- Guard tests are the repo's architecture: a text-scanning or behavioural test
  with an anti-vacuity counterpart.

## Approaches

### Naming

| | |
|---|---|
| **One record in chapters** — `Live now` / `Previous run` / `First run` | Rejected by the owner: they are separate accounts, not chapters. |
| **Gemstones** — `Jade` / `Onyx` / `Amber` | **Chosen.** Reads as a designation, not a person or a rank. Jade is green, which ties to the brand's Pine Lacquer. |
| **Human names** — `Master Alex` | Rejected. All three run the same EA on the same settings; three human names imply three traders who do not exist. |
| **Brand numbering** — `Saga I/II/III` | Rejected by the owner in favour of gemstones. |

### The percentage

| | |
|---|---|
| **Trading result ÷ deposits** | Rejected. Amber deposited 20,000 and withdrew 24,120; dividing by deposits treats capital as fixed at 20,000 across 143 days and produces 147.5%, which is an artifact of the withdrawals, not a return. It also understates: the correct figure is higher. |
| **Time-weighted return** | **Chosen.** Chains daily returns on the capital actually at risk that day, so deposits and withdrawals drop out. It is the standard measure when there are cash flows, and it is the only one of the two under which all three accounts' percentages mean the same thing. |
| **Average monthly return** | Rejected. Normalises for time, but a per-month rate on a sales page reads as a rate to expect. |

### The risk figure

| | |
|---|---|
| **Worst single day** | Rejected. It states the fall and says nothing about the recovery, which is the half the owner actually wants shown. |
| **Deepest drawdown + recovery state** | **Chosen.** Deepest fall from a running peak, plus either how long it took to get back or how far from the peak it still is. |

## Decisions

Made by the owner in conversation, recorded as his:

1. The accounts are named **Jade**, **Onyx**, **Amber** — Jade is the account
   copytrade follows now, Onyx the one before it, Amber the earliest.
2. **The badges are removed** (`The one you copy`, `Closed to new followers`).
   His reason: a follower does not choose which master to copy, so the
   distinction is not theirs to make.
3. **The per-account notes are removed.** The `Since <month> <year>` line is
   the only context a tab carries.
4. **Jade's deepest fall shows `0.0%`** even though it has only nine trading
   days and has simply not met a bad day yet.

Raised as a concern and over-ruled, recorded so it is not re-litigated: with
no badge and no note, nothing on the page states which account a buyer
receives, and the largest percentage belongs to the account nobody copies.
The owner's answer is that followers do not pick a master.

## The maths

All of it is pure, server-side, and lives in `src/lib/record.ts` beside
`summarise()`. It consumes the existing `RecordDay[]`, which already carries
`balance`, `funding` and `trading` per day. Nothing new is fetched.

### Daily return

For each day `d`, in order:

```
base_d = balance_{d-1} + funding_d      // capital at risk that day
r_d    = base_d > 0 ? trading_d / base_d : 0
```

`balance_{d-1}` is the previous day's closing balance, and `0` before the
first day. Adding `funding_d` to the base is what makes a day-one deposit the
denominator of day one's return rather than a division by zero.

### Return

```
TWR = Π (1 + r_d) − 1
```

### Drawdown and recovery

```
I_d    = Π_{i ≤ d} (1 + r_i)            // equity index, I starts at 1
peak_d = max(I_i : i ≤ d)
dd_d   = I_d / peak_d − 1

deepest    = min(dd_d), at trough day T, against the peak P in force at T
recovered  = the earliest day after T where I ≥ P, or none
```

Two display states follow, and the field must render both:

- **Recovered:** `recovered in N days`, where N is calendar days from T to
  that day.
- **Not recovered:** `now −X% from peak`, where X is the drawdown on the
  latest day.

This is not a today-only distinction. Onyx is currently −1.7% from a peak set
on 18 Nov; when it next closes above that peak the same field has to switch
itself to the recovered reading, with no code change and no redeploy.

### Edge cases the builder must handle

| Case | Behaviour |
|---|---|
| No days | No percentage, no drawdown. The panel omits both fields rather than printing `0%`. |
| `base_d ≤ 0` (account emptied) | `r_d = 0`. The day neither gains nor loses on zero capital. |
| `1 + r_d ≤ 0` (account wiped past zero) | Clamp the factor to a small positive floor so the chain stays defined, and treat the account as in drawdown. Document it in the function. |
| One day only | `TWR = r_1`; drawdown is `0.0%` unless that day was negative. |
| Never below peak | `deepest = 0.0%`, no recovery line. This is Jade today. |

### Values this must reproduce

Computed from live data on 2026-11-26 and used as the fixtures the tests
assert against (approximate, to one decimal):

| | Jade | Onyx | Amber |
|---|---|---|---|
| Return | +64.6% | +137.7% | +267.2% |
| Deepest fall | 0.0% | −24.6% | −24.3% |
| Trough | — | 19 Nov | 16 Sep |
| Recovery | — | not yet, −1.7% from peak | recovered, 26 days |

The tests use **synthetic fixtures** that exercise each shape, not these
logins — the repo is public. These rows are here so a builder can sanity-check
the implementation against reality, not to be pasted into a test.

## Display

### Tab

```
Jade                Onyx                Amber
+317.43 USD         +687.74 USD         +29,499.34 USD
+64.6%              +137.7%             +267.2%
Since Nov 2026      Since Oct 2026      Since Jul 2026
```

The percentage is a new line under the USD figure, in the same tone colouring
(`up`/`down`/`flat`) the USD result already uses. `badge` and the per-account
`note` come out of `RecordTab`, `RecordAccount` and `record-accounts.ts`.

*Builder's note — my call, flagged for review:* putting the percentage on the
tab rather than only in the panel is so the three can be compared without
opening each one, which is what the tab strip is for.

### Panel

`RecordStats` currently shows four figures, the first with a sub-line
(`Recording since / 17 Nov 2026 / 10 days`). Two more join them, using that
same sub-line pattern:

```
Return            Deepest fall
+64.6%            −24.6%
                  recovered in 26 days
```

## The three chart nits

**1 and 2 have one cause.** `record-chart.tsx:128` starts the cursor at the
last point: `useState(Math.max(0, points.length - 1))`. That is the right edge
— exactly where `.record-scale` writes its gridline values. So the tooltip is
open before anyone touches the chart, *and* it is what covers the scale
labels.

Fix: the cursor and tooltip stay hidden until the reader hovers, touches or
focuses the chart. Nothing is lost by this — the value the default tooltip was
showing is the latest balance, which is already printed in large type directly
above the chart. On a phone, where there is no hover, the reader drags along
the chart as they do now; they simply start from a clean chart.

The builder must confirm the touch path still works, since today's always-on
cursor is what mobile readers get by default.

**3. The sentence.** *"Watch our trading account grow daily."* Two problems:
it promises daily growth, and the accounts do not grow daily — two of them
have had −24% days. Proposed replacement, the owner's to accept or rewrite:

> The data below comes straight from our MT5 terminals, updated every hour.

## What is left to the builder

- Where the new functions sit in `record.ts` and what they are called.
- The exact CSS for the new tab line and the two new stat cells, following the
  existing `.record-tab-*` and stats patterns.
- How the cursor's hidden state is represented in `record-chart.tsx`.
- Test file names and fixture construction.

## Tests

Guard tests, each with an anti-vacuity counterpart:

1. **Return maths** — a fixture with a mid-period deposit and one with a
   mid-period withdrawal both produce the same TWR as the same account with no
   cash flow at all. This is the property that makes the measure correct, and
   it is the one `÷ deposits` fails. Anti-vacuity: the naive
   `trading ÷ deposits` on the same fixture produces a *different* number, so
   the test would fail if the implementation quietly reverted.
2. **Drawdown and recovery** — a fixture that falls and comes back reports
   `recovered` with the right day count; one that falls and has not come back
   reports the current distance from the peak; one that never falls reports
   `0.0%` and no recovery line. Anti-vacuity: the recovered fixture, truncated
   one day before its recovery, flips to the not-recovered reading.
3. **No account carries a badge or note** — `record-accounts.ts` declares
   neither, and `RecordTab` has no `badge` field. Anti-vacuity: the scan finds
   all three accounts.
4. **The chart has no cursor before interaction** — the rendered chart carries
   no tooltip until hover/touch/focus. Anti-vacuity: after interaction, it
   does.
5. The existing suite stays green, `claims.test.ts` unmodified.
