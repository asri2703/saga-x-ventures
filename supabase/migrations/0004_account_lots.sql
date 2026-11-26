-- How much volume an account has actually traded.
--
-- The calculator on /copytrade shows the lots a deposit would trade in a
-- day. That cannot be read from `account_deals` through PostgREST: the
-- longest account holds nearly 200,000 deals and a response is capped at
-- 1,000 rows, so the sum has to be made here, where the rows already are.
--
-- Only opening deals are counted (`entry = 0`). A position is opened once
-- and closed once; counting both would report twice the volume that was
-- ever at risk. Balance operations (`type = 2`) carry no volume at all and
-- are excluded so a deposit cannot be mistaken for a trade.
--
-- security_invoker, as with the other views: it obeys the RLS of the table
-- under it, so the anon key that ships to browsers reads nothing through it.
create or replace view account_lots
with (security_invoker = true) as
select
  login,
  sum(volume)                                            as lots,
  count(*)                                               as opens,
  count(distinct (time at time zone 'Asia/Kuala_Lumpur')::date) as trading_days
from account_deals
where type <> 2
  and entry = 0
group by login;
