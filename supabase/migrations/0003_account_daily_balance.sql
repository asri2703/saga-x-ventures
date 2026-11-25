-- The daily balance, rebuilt from the deal history.
--
-- MT5's balance is the running sum of every deal's profit, swap, commission
-- and fee, deposits and withdrawals included (they are deals of type 2). So
-- the full history the reporter EA sends on its first run is enough to draw
-- the balance on every day since the account opened, not only the days
-- since the EA was attached.
--
-- Checked on 26 Nov 2026 against the live account: the sum of all 27,043
-- deals equalled the terminal's balance to the cent.
--
-- Credit (type 3) is excluded: MT5 adds it to equity, not to balance.
--
-- DAY and TIME are SQL keywords, so neither is ever written bare here:
-- every column is qualified with its table, and `day` is only an alias
-- after AS. Written bare, Postgres refused `day` with a syntax error.
create or replace view account_daily_balance
with (security_invoker = true) as
select
  deals.login                                                       as login,
  deals.trade_day                                                   as day,
  -- The balance at the close of the day.
  sum(sum(deals.amount)) over (
    partition by deals.login order by deals.trade_day
  )                                                                 as balance,
  -- Money in and out: deposits positive, withdrawals negative.
  sum(deals.amount) filter (where deals.type = 2)                   as funding,
  -- What the trading did that day, after swap, commission and fees.
  sum(deals.amount) filter (where deals.type in (0, 1))             as trading,
  -- Trades closed that day (an "out" or "out by" leg).
  count(*) filter (where deals.type in (0, 1) and deals.entry in (1, 3)) as closed
from (
  select
    d.login                                         as login,
    (d.time at time zone 'Asia/Kuala_Lumpur')::date as trade_day,
    d.type                                          as type,
    d.entry                                         as entry,
    d.profit + d.swap + d.commission + d.fee        as amount
  from account_deals as d
  where d.type <> 3
) as deals
group by deals.login, deals.trade_day;

-- Tell the API to pick up the new view now rather than on its next refresh.
notify pgrst, 'reload schema';
