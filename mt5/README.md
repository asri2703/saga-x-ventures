# Record reporter (MT5)

`SagaRecordReporter.mq5` feeds the record chart on `/copytrade`. Every hour it
posts the master account's balance, equity, lowest equity since the last
post, and closed deals to `/api/record/ingest`. It never places, modifies or
closes a trade.

```
VPS (MT5 terminal, master account)
  ├─ trading EA            ← untouched
  └─ SagaRecordReporter    ── HTTPS POST hourly ──► /api/record/ingest ──► Supabase
                                                                          │
                                         /copytrade (ISR, revalidated) ◄──┘
```

## One-time setup

### 1. Supabase
Run `supabase/migrations/0002_account_record.sql` in the SQL editor.

### 2. Vercel environment variables (Production)
| Name | Value |
|---|---|
| `RECORD_INGEST_SECRET` | 32+ random characters, e.g. `openssl rand -hex 32` |
| `RECORD_ACCOUNT_LOGIN` | The master account's MT5 login number |

`NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are already used
by the checkout. Redeploy after adding the two above.

### 3. The VPS
1. In MT5: **File → Open Data Folder → MQL5 → Experts**, copy
   `SagaRecordReporter.mq5` in.
2. Open it in MetaEditor (F4) and **Compile** (F7). Expect 0 errors.
3. **Tools → Options → Expert Advisors**: tick *Allow WebRequest for listed
   URL* and add `https://sagaxventures.com` (the site's own origin).
4. Open any chart (a spare one, not the trading EA's), drag
   `SagaRecordReporter` onto it, and on the **Inputs** tab set
   `InpSecret` to the same value as `RECORD_INGEST_SECRET`.
5. Make sure **Algo Trading** is on (it already is if the trading EA runs).

### 4. Check it
Within about 10 seconds the **Experts** tab shows
`SagaRecord: reported, N deal(s) …`. The first report sends the whole deal
history, in chunks of 500.

| Journal says | Meaning |
|---|---|
| `add the site to … Allow WebRequest` | Step 3.3 is missing or has a typo |
| `HTTP 401` | `InpSecret` does not match `RECORD_INGEST_SECRET` |
| `HTTP 403` | The EA is on a terminal logged in to a different account |
| `HTTP 503` | The Vercel variables are not set, or not redeployed |
| `HTTP 400: Invalid …` | The named field was rejected — report it as a bug |

## More than one account

`/copytrade` shows up to three accounts as tabs, master first. For each extra
account:

1. Vercel: set `RECORD_ACCOUNT_LOGIN_2` and `RECORD_ACCOUNT_UNIT_2` (`cent` or
   `usd` — required; without it the account is not shown), and the same for
   `_3`. Redeploy.
2. VPS: in **that account's** MT5 terminal repeat steps 3.1–3.5. Every
   terminal has its own data folder and its own WebRequest list, so the EA
   has to be copied in, compiled and allowed in each one. Use the same
   `InpSecret` everywhere.

A terminal logged in to an account that is not on the list gets `HTTP 403`.

## Notes
- Deal times are converted to UTC with the broker's *current* offset. Deals
  from before a daylight-saving change are an hour out; daily figures are
  unaffected except at the edge of a day.
- If the VPS is down, the chart keeps the last reading. On restart the EA
  resends from a day before its last sync, so nothing is lost.
