-- The master account's record.
--
-- Written by the reporter EA on the VPS (mt5/SagaRecordReporter.mq5), which
-- posts to /api/record/ingest every hour. Read by /copytrade. Nothing typed by
-- hand goes in here: the point of the table is that the figures on the page
-- came from the terminal, not from a person.
--
-- Money columns hold the account's own unit exactly as MT5 reports it. The
-- master account is a cent account, so 54900.00 here is 549.00 USD on the
-- page; the conversion lives in the page (CENTS_PER_USD), not in the data.

create table if not exists account_snapshots (
  login       bigint        not null,
  -- UTC, to the minute. A retry of the same hour lands on the same row.
  taken_at    timestamptz   not null,
  balance     numeric(18,2) not null,
  equity      numeric(18,2) not null,
  -- The lowest equity the EA saw since its previous report. Without it an
  -- hourly reading misses every dip that recovered inside the hour, and the
  -- drawdown would be drawn shallower than it was.
  equity_low  numeric(18,2),
  primary key (login, taken_at)
);

create table if not exists account_deals (
  login        bigint        not null,
  ticket       bigint        not null,
  position_id  bigint        not null,
  -- UTC. The EA converts from broker server time before sending.
  time         timestamptz   not null,
  -- MT5 ENUM_DEAL_TYPE: 0 buy, 1 sell, 2 balance (deposit / withdrawal), ...
  type         smallint      not null,
  -- MT5 ENUM_DEAL_ENTRY: 0 in, 1 out, 2 in/out, 3 out by.
  entry        smallint      not null,
  symbol       text          not null default '',
  volume       numeric(12,2) not null default 0,
  price        numeric(18,5) not null default 0,
  profit       numeric(18,2) not null default 0,
  swap         numeric(18,2) not null default 0,
  commission   numeric(18,2) not null default 0,
  fee          numeric(18,2) not null default 0,
  -- (login, ticket) is what makes a resend harmless: the EA overlaps its
  -- window on purpose and every deal it repeats is an upsert onto itself.
  primary key (login, ticket)
);

create index if not exists account_deals_login_time_idx
  on account_deals (login, time);

-- One reading per Malaysian calendar day: the day's last balance and equity,
-- and the lowest equity seen at any point in it.
--
-- A view rather than a query in the app because PostgREST caps a response at
-- 1,000 rows, and hourly snapshots pass that in six weeks.
--
-- security_invoker so the view obeys the RLS of the tables under it. Without
-- it a view runs as its owner, and the anon key could read through it what
-- it cannot read directly.
create or replace view account_daily
with (security_invoker = true) as
select
  login,
  (taken_at at time zone 'Asia/Kuala_Lumpur')::date            as day,
  (array_agg(balance order by taken_at desc))[1]               as balance,
  (array_agg(equity  order by taken_at desc))[1]               as equity,
  min(least(equity, coalesce(equity_low, equity)))             as equity_low
from account_snapshots
group by login, (taken_at at time zone 'Asia/Kuala_Lumpur')::date;

-- RLS on and no policy, as with orders: the service role writes and reads,
-- the anon key that ships to browsers reads nothing.
alter table account_snapshots enable row level security;
alter table account_deals     enable row level security;
