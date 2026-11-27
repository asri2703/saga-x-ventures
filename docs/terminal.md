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
