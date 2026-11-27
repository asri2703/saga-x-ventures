-- Mastery Terminal: the news wire.
--
-- Written by /api/terminal/ingest on a schedule. It pulls headlines from
-- GDELT, the Federal Reserve's press feed and (when a key is set) Finnhub,
-- asks Claude whether each one matters to gold, and stores the answer.
-- Read by /api/terminal/feed, which Mastery Signal calls from its own server.
--
-- Every headline seen is kept, relevant or not. A row with relevant = false is
-- what stops the next run paying to classify the same story again.
--
-- This lives in Saga X's own Supabase project, never the shared signal HQ.

create table if not exists terminal_news (
  id            uuid          primary key default gen_random_uuid(),
  -- The article URL. One story from one outlet is one row, however many runs
  -- see it.
  url           text          not null unique,
  -- Lower-cased, whitespace-collapsed headline. The same wire story carried by
  -- two outlets lands on one row instead of two.
  headline_key  text          not null unique,
  headline      text          not null,
  source        text          not null,            -- 'gdelt' | 'fed' | 'finnhub'
  outlet        text          not null default '', -- domain or publisher name
  published_at  timestamptz   not null,
  fetched_at    timestamptz   not null default now(),

  relevant      boolean       not null default false,
  impact        text          check (impact in ('high', 'medium', 'low')),
  direction     text          check (direction in ('bullish', 'bearish', 'neutral')),
  -- Two sentences in Bahasa Melayu, written by the model, shown to members.
  summary_ms    text,
  model         text
);

create index if not exists terminal_news_feed_idx
  on terminal_news (published_at desc)
  where relevant;

-- Service role only. RLS on with no policy makes the anon key useless here.
alter table terminal_news enable row level security;
