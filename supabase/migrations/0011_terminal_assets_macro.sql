-- Mastery Terminal: forex, and economic data.

-- 1. Which instruments a story moves, from the list in
--    src/lib/terminal/classify.ts (ASSETS): gold, DXY and the seven majors.
--    [{"symbol": "EURUSD", "direction": "up"}, ...]
alter table terminal_news
  add column if not exists assets jsonb not null default '[]'::jsonb;

create index if not exists terminal_news_assets_idx
  on terminal_news using gin (assets)
  where relevant;

-- 2. Economic series, straight from the agencies that publish them
--    (Federal Reserve / New York Fed, BLS, US Treasury). One row per
--    series per date. Series are defined in src/lib/macro/series.ts; this
--    table only holds their values.
create table if not exists macro_points (
  series     text    not null,
  date       date    not null,
  value      numeric not null,
  updated_at timestamptz not null default now(),
  primary key (series, date)
);

-- Service role only, like terminal_news.
alter table macro_points enable row level security;
