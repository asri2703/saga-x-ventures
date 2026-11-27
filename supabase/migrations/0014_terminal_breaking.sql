-- Breaking news, story updates, corroboration and official sources.
--
-- last_update_at: when the story last changed (first seen, or another outlet
--   filed under it). The wire orders by it, so an updated story rises.
-- source_count: outlets carrying the story, this row included.
-- official: the story came from, or was confirmed by, an official source
--   (a central bank, the White House, the State Department).
-- terminal_locks: one row per job, so two ingest runs never overlap.

alter table terminal_news add column if not exists last_update_at timestamptz;
alter table terminal_news add column if not exists source_count integer not null default 1;
alter table terminal_news add column if not exists official boolean not null default false;

update terminal_news set last_update_at = published_at where last_update_at is null;
alter table terminal_news alter column last_update_at set default now();

update terminal_news p
   set source_count = 1 + c.n
  from (select parent_id, count(*) as n from terminal_news where parent_id is not null group by parent_id) c
 where p.id = c.parent_id;

update terminal_news
   set official = true
 where outlet in ('federalreserve.gov', 'ECB', 'Bank of England', 'Bank of Japan');

create index if not exists terminal_news_update_idx
  on terminal_news (last_update_at desc)
  where relevant and parent_id is null;

create table if not exists terminal_locks (
  name         text primary key,
  locked_until timestamptz not null default 'epoch'
);
insert into terminal_locks (name) values ('ingest') on conflict do nothing;
alter table terminal_locks enable row level security;
