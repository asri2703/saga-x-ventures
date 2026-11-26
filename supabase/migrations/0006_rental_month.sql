-- The rental month, and the reminder that ends it.
--
-- A payment buys one month. That is the owner's arrangement and not a
-- subscription: nothing recurs, nothing is stored at a payment processor,
-- and the next month is the same four steps again. What makes that work
-- rather than quietly lapse is an email before the month is out, and two
-- columns are what an email needs to exist.
--
-- `paid_until` is written when the payment settles, never at checkout: a
-- bill that is never paid must not reserve a month. It is null on every
-- other product, which is also what keeps them out of the reminder's way.
--
-- `reminded_at` is the fence. The job runs daily and the window is days
-- wide, so without it the same person is reminded every morning until they
-- pay or the month ends.

alter table orders
  add column if not exists paid_until timestamptz;

alter table orders
  add column if not exists reminded_at timestamptz;

-- The job's own query: rows with a month that ends, which have not been
-- told yet. Partial, because every Mastery row has a null here and there is
-- no reason to carry them in the index.
create index if not exists orders_paid_until_idx
  on orders (paid_until)
  where paid_until is not null and reminded_at is null;
