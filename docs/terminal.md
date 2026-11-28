# Mastery Terminal — the news wire

Saga X is the hub. It pulls news, asks Claude which stories matter to gold,
and stores the answer in Saga X's own Supabase. Mastery Signal reads the
result over one authenticated endpoint. Nothing here touches the shared
signal HQ database.

```
GDELT · RSS (Fed, BBC World, Al Jazeera, CNBC) · Finnhub (optional)
        │  every 5 minutes
        ▼
/api/terminal/ingest   fetch → drop what is on file → Claude → store
        │
        ▼
terminal_news (Saga X Supabase)
        │
        ▼
/api/terminal/feed     ← Mastery Signal's server, cached
```

## Setup

1. Run `supabase/migrations/0007_terminal_news.sql` in Saga X's Supabase
   project (SQL editor).
2. In Vercel → saga-x-ventures → Environment Variables, for Production and
   Preview:
   - `ANTHROPIC_API_KEY` (Claude Console → API keys)
   - `CRON_SECRET` if it is not already set (`openssl rand -hex 32`)
   - `TERMINAL_FEED_KEY` (`openssl rand -hex 32`, a different value)
   - optional: `FINNHUB_API_KEY`, `TERMINAL_MODEL`
3. Schedule the run.

   **On Vercel Hobby (current):** Supabase calls the route. Set
   `TERMINAL_INGEST_SECRET` in Vercel (`openssl rand -hex 32`), then run this
   in Saga X's Supabase SQL editor with the same value in place of `SECRET`:

   ```sql
   create extension if not exists pg_cron;
   create extension if not exists pg_net;

   select vault.create_secret('SECRET', 'terminal_ingest_secret');

   select cron.schedule(
     'terminal-ingest',
     '*/5 * * * *',
     $$
     select net.http_get(
       url := 'https://sagaxventures.com/api/terminal/ingest',
       headers := jsonb_build_object(
         'Authorization',
         'Bearer ' || (select decrypted_secret from vault.decrypted_secrets
                       where name = 'terminal_ingest_secret')
       ),
       timeout_milliseconds := 120000
     );
     $$
   );
   ```

   Stop it with `select cron.unschedule('terminal-ingest');`. Recent runs and
   their HTTP status are in `net._http_response`.

   **On Vercel Pro:** drop the Supabase job and add to `vercel.json`:

   ```json
   { "path": "/api/terminal/ingest", "schedule": "*/5 * * * *" }
   ```

   It is not in `vercel.json` yet on purpose. The Hobby plan only allows a
   daily cron, and a deployment that asks for more is refused, which would
   take the whole site's deploy down with it.

## Checking a run by hand

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://sagaxventures.com/api/terminal/ingest
```

The answer lists each source with its count or its error, how many headlines
were new, how many were stored, and how many were relevant. A `failures`
entry that mentions a spend limit means the Console's monthly cap was reached.

## Reading the feed (for Mastery Signal)

```
GET /api/terminal/feed?hours=24&min=medium&limit=50
Authorization: Bearer $TERMINAL_FEED_KEY
```

| Param | Values | Default |
|---|---|---|
| `hours` | 1–168 | 24 |
| `min` | `low`, `medium`, `high` | `low` |
| `limit` | 1–200 | 50 |

```json
{
  "items": [
    {
      "id": "…",
      "headline": "…",
      "url": "https://…",
      "outlet": "reuters.com",
      "published_at": "2026-11-27T05:30:00+00:00",
      "impact": "high",
      "direction": "bullish",
      "summary": "Two sentences in English: what happened and why it matters for gold."
    }
  ],
  "generated_at": "2026-11-27T05:31:02.000Z"
}
```

Call it from a Mastery server route, never from the browser: the key would be
visible to every member. Cache the answer for a minute so the member count
never multiplies the calls.

## Cost

Claude Haiku 5.5 classifies up to 25 headlines per request. A busy day of
around 300 headlines is roughly USD 2–3 a month. Every headline seen is
stored, relevant or not, so the same story is never paid for twice.

## What members see, and what they don't

The headline, the outlet, a link to the original, and our own two-sentence
summary. Article text is never fetched or stored. The summary is not trading
advice, and the prompt tells the model not to give any.

## Forex

Stories are screened for gold **and** the major pairs. Each relevant story
carries `assets`: up to four of XAUUSD, DXY, EURUSD, GBPUSD, USDJPY, USDCHF,
AUDUSD, USDCAD, NZDUSD, each `up`, `down` or `unclear` for the quoted pair.
The wire and `/api/terminal/feed` filter by `?asset=EURUSD`.

Feeds added for FX: FXStreet, investingLive, and the ECB, Bank of England
and Bank of Japan press feeds. Sections added: Politics & Elections, Other
Central Banks, Global Data & China.

## Macro data (`/apps/macro`)

US series taken straight from their publishers, all public domain:

| Series | Publisher |
|---|---|
| Fed funds (upper target), effective fed funds | New York Fed markets API |
| CPI, core CPI (YoY), unemployment, nonfarm payrolls (monthly change), average hourly earnings (YoY) | BLS API |
| 2-year, 10-year, 10-year real yield | US Treasury daily yield curves |

Stored in `macro_points` (migration `0011`). `/api/macro/refresh` runs twice
a day from `vercel.json` (13:45 and 22:15 UTC). After the first deploy, fill
the history once:

```bash
curl -H "Authorization: Bearer $TERMINAL_INGEST_SECRET" "https://sagaxventures.com/api/macro/refresh?backfill=1"
```

`BLS_API_KEY` (free, bls.gov/developers) is optional: without it BLS allows
25 requests a day and ten years per request, which the two daily refreshes
stay well inside.

FRED and Trading Economics are deliberately not used: their terms restrict
commercial display, and their forecasts are their own.

China's figures are not in Macro data yet: China's statistics bureau has no
documented public API. China's releases reach the wire as news in the
Global Data & China section.

## Positioning (COT)

Weekly Commitments of Traders from the CFTC's public reporting API (US government data, no key). Gold uses the Disaggregated report (managed money against producers and merchants); the dollar index and the seven majors use Traders in Financial Futures (leveraged funds against dealers). Futures only.

- Table: `cot_positions` (migration 0012).
- Refresh: `GET /api/cot/refresh` (cron, weekdays 21:10 and 01:40 UTC); `?backfill=1` loads everything since 2010.
- Release dates: `src/lib/cot/schedule.ts`. Add the CFTC's dates for each new year there (and the twice-weekly dates when the CFTC switches); past the list, HQ shows the next Friday as an estimate.
- Feed for Mastery: `GET /api/terminal/cot?weeks=8` with `Bearer TERMINAL_FEED_KEY`, returning each market's net, weekly change, long share, pair bias, history and `next_release`.
- HQ: an overview strip (`CotOverviewBlock`) and the Positioning section (`/cot`, `/cot/[slug]`). The blocks live in `src/components/hq/cot-blocks.tsx` so each can be moved or restyled on its own.

## Alerts (Web Push)

VAPID web push, no third-party service. Tables: `push_subscriptions` and `alert_log` (migration 0013). Env: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, optional `MASTERY_ALERT_URL`.

- What is sent: a high-impact story once its brief is written (published within 3 hours); each new COT report; a new CPI, core CPI, jobs, unemployment or wages reading, or a change in the Fed's target. `alert_log` keys each alert by kind and ref, so a job that runs twice alerts once.
- HQ: the Alerts page turns push on for the browser (service worker `/hq-sw.js`), picks topics, sends a test to that browser only, and lists what was sent.
- Mastery: its server forwards a member's browser subscription to `POST /api/terminal/push` (`Bearer TERMINAL_FEED_KEY`; `GET` returns the public key, `DELETE` removes). The member's browser needs a service worker on masterysignal.com that shows the notification; a tap opens `MASTERY_ALERT_URL?alert=<kind>:<ref>`.
- iPhone and iPad receive web push only for a site added to the home screen (iOS 16.4+). The App Store and Play Store apps need APNs and FCM instead.

## Breaking news, official sources and corroboration

- Schedule: the wire runs every 2 minutes (pg_cron). A lock row (`terminal_locks`, migration 0014) keeps runs from overlapping.
- GDELT is asked once per 15-minute slot (`isGdeltSlot`), not every run, to stay under its one-request-per-5-seconds limit; a 429 is retried once after 6 s.
- Official publishers (`official: true` in `RSS_FEEDS`): Fed, ECB, BoE, BoJ, SNB, Bank of Canada, RBA, RBNZ, White House (news and presidential actions), US State Department. They are classified first in each run. USTR, Treasury and OPEC have no usable public feed (checked Nov 2026).
- Breaking: a fresh (under 30 min) high-impact story is pushed right after classification, in the classifier's own words with who reported it, unless the same event was on the wire in the last 3 hours (`sameEvent`). At most 2 per run. The brief that follows does not push again.
- Standing on every story: Official source, Confirmed � N sources, or Reported by <outlet>. In the GDELT slot, up to 2 single-outlet high-impact stories from the last 90 minutes are searched for other outlets' reports; the brief step files matches under the story, which then rises (`last_update_at`) with a fresh `source_count`. If an official publisher confirms a high-impact story, a "Confirmed officially" push goes out once.
- The feed API adds `breaking` and `standing` to each item.

## Wire layout, sections and covers

- Order (`buildWire` in `src/lib/terminal/wire.ts`): the breaking banner, then **Latest** (the 8 newest entries, one line per story; an entry is a new story or another outlet's update to one), then **Developing** (up to 5 high-impact stories carried by 2+ outlets and updated in the last 12 h, each with its report timeline), then **More stories**, then a fold of low-impact ones.
- Sections (`src/lib/terminal/sections.ts`) group the classifier's categories into 9 reader-facing sections: War and geopolitics, Politics, Central banks (fed + central-banks), Economic data (us-data + global-data), Trade and tariffs, Oil and energy, Dollar and bonds, Gold, Market stress. Filter with `?section=<slug>`; `?category=` still works. The feed API takes `section` too and adds `section` to each item.
- Covers, in order: a library photo (Unsplash, then Pexels with `PEXELS_API_KEY`, then Wikimedia Commons, free licences and landscape only), each credited with author and library (Commons also shows the licence); for geopolitics, energy and trade stories about a known place (`places.ts`), a map at `/api/hq/map/<place>` drawn from Natural Earth (public domain) at build time; otherwise a type card with the section and the market move. Photos are illustrative and say so on the story page. No Google Images, agency photos or AI images.
- Migration 0015 adds `image_source`.
- Mobile: a bottom tab island (Overview, Wire, Macro, COT, More) and an alerts bell in the header with an unread count kept in the browser.
