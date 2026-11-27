-- Push alerts (Web Push with VAPID).
--
-- push_subscriptions: one row per browser. `client` says who registered it
-- (hq for this dashboard, mastery for members subscribed through Mastery
-- Signal's server); `topics` is what the browser wants (news, cot, macro).
-- alert_log: every alert sent, keyed by kind and ref so a re-run of the
-- same job never sends the same alert twice.

create table if not exists push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  client      text not null default 'hq' check (client in ('hq', 'mastery')),
  user_ref    text,
  topics      jsonb not null default '["news","cot","macro"]',
  failures    integer not null default 0,
  created_at  timestamptz not null default now(),
  last_ok_at  timestamptz
);

create table if not exists alert_log (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null check (kind in ('news', 'cot', 'macro', 'test')),
  ref        text not null,
  title      text not null,
  body       text not null,
  url        text,
  sent       integer not null default 0,
  failed     integer not null default 0,
  created_at timestamptz not null default now(),
  unique (kind, ref)
);

create index if not exists alert_log_created_idx on alert_log (created_at desc);

alter table push_subscriptions enable row level security;
alter table alert_log enable row level security;
