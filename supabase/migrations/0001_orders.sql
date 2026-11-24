-- Orders.
--
-- One row per attempt to buy a Mastery Signal package. The row is created
-- before the Billplz bill, so a row exists even for a buyer who abandons at
-- the payment page: it is the only evidence that somebody tried.
--
-- Nothing in this table grants anything. Membership lives on
-- masterysignal.com and is approved by hand; `access_granted_at` is the only
-- bridge between the two, and it is ticked by a person.

create table if not exists orders (
  id                uuid primary key default gen_random_uuid(),

  product           text        not null default 'mastery-signal',
  plan_key          text        not null,

  -- What was quoted when the bill was made, in sen. Stored rather than
  -- derived: a later price change must not rewrite what was charged on the
  -- day.
  amount_sen        integer     not null,
  -- What the callback says actually arrived. Separate from the figure above
  -- rather than a correction of it, so a mismatch stays visible as two
  -- numbers instead of becoming one tidy wrong one.
  paid_amount_sen   integer,
  currency          text        not null default 'MYR',

  method            text        not null default 'billplz',
  status            text        not null default 'pending'
                      check (status in ('pending', 'paid', 'failed')),

  -- The idempotency key. Billplz retries a callback until it gets a 200, and
  -- unique here is what makes a retry impossible to turn into a second order.
  billplz_bill_id   text unique,

  buyer_name        text        not null,
  buyer_email       text        not null,
  buyer_phone       text        not null,

  paid_at           timestamptz,
  -- Set once, by whichever send got there first. Guards the buyer's email.
  link_sent_at      timestamptz,
  -- The same, for the owner's email and Telegram message.
  notified_at       timestamptz,
  -- Ticked by hand in the admin when the membership is actually granted.
  -- Nothing automatic writes it; that is the point of it.
  access_granted_at timestamptz,

  created_at        timestamptz not null default now()
);

-- The list the admin exists to show: people who have paid and received
-- nothing. Without it that failure is silent and the customer has nobody to
-- chase.
create index if not exists orders_status_access_idx
  on orders (status, access_granted_at);

-- Row level security on, and deliberately no policy.
--
-- The service role bypasses RLS, and every write to this table goes through
-- a route handler holding it. With RLS on and no policy, the anon key — the
-- one that ships to browsers — can read nothing. This table holds names,
-- email addresses and phone numbers.
alter table orders enable row level security;
