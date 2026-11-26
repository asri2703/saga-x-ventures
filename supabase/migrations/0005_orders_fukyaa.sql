-- AI Auto Trade orders.
--
-- The table already carries `product`, so a Fukyaa order is a row like any
-- other. Two things it could not hold:
--
-- 1. The trading account. A Mastery order needs no account number — the
--    membership is granted on another site. An AI Auto Trade order is an
--    instruction to connect ONE MT5 account to the server, and without the
--    login there is nothing to connect. Nullable, because Mastery rows have
--    none and a column that lies about being required is worse than one
--    that says which rows use it.
--
-- 2. A registration with nothing to pay. The package that includes the
--    server is free to run, and the person still has to be recorded: who
--    they are, which account, and when they asked. That row never becomes
--    'paid' because no money is ever due on it, and leaving it 'pending'
--    forever would put it in the same list as a buyer who abandoned a
--    payment page. It gets its own state instead.

alter table orders
  add column if not exists mt5_login text;

alter table orders
  drop constraint if exists orders_status_check;

alter table orders
  add constraint orders_status_check
  check (status in ('pending', 'paid', 'failed', 'registered'));

-- The owner's working list for this product: who has paid or registered and
-- has not been connected to the server yet.
create index if not exists orders_product_status_idx
  on orders (product, status, access_granted_at);
