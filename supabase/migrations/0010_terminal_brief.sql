-- Mastery Terminal: the brief, and one card per story.
--
-- snippet    the outlet's own teaser from its feed, kept only as context for
--            the brief. Never shown to members.
-- parent_id  set when this headline is the same event as an earlier stored
--            story. The wire shows the parent once and lists every outlet
--            that carried it as a source.
-- brief      our own write-up of the parent story, JSON:
--            { title, what_happened, why_it_matters, gold_impact, what_to_watch }
-- brief_model the model that wrote it.

alter table terminal_news
  add column if not exists snippet     text,
  add column if not exists parent_id   uuid references terminal_news(id) on delete set null,
  add column if not exists brief       jsonb,
  add column if not exists brief_model text;

create index if not exists terminal_news_parent_idx
  on terminal_news (parent_id)
  where parent_id is not null;
