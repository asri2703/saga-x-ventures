-- Insights: market write-ups drafted by Claude from HQ's own data around a
-- call Asri makes (topic + direction), then read, edited and published by him.
--
-- body holds the article as JSON ({ summary, sections: [{ heading, text }] }).
-- context keeps the data the writer was given, so a published insight can be
-- checked against what was known when it was written. Only the server (service
-- role) reads and writes; row level security stays on with no policies.

create table if not exists insights (
  id           uuid primary key default gen_random_uuid(),
  topic        text not null,
  direction    text not null check (direction in ('up', 'down', 'flat')),
  language     text not null default 'en' check (language in ('en', 'ms')),
  notes        text,
  title        text not null,
  body         jsonb not null,
  context      jsonb,
  model        text,
  status       text not null default 'draft' check (status in ('draft', 'published')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists insights_created_idx on insights (created_at desc);
create index if not exists insights_published_idx on insights (published_at desc) where status = 'published';

alter table insights enable row level security;
