-- Mastery Terminal: a section for every story, and a photo.
--
-- category    one of the slugs in src/lib/terminal/classify.ts (CATEGORIES)
-- image_query the words the model chose for the photo search, kept so a
--             missing photo can be searched again later without re-asking it
-- image_*     an Unsplash photo: hotlinked URL, photographer, profile link.
--             Outlets' own photos are never stored (agency licensed).

alter table terminal_news
  add column if not exists category     text,
  add column if not exists image_query  text,
  add column if not exists image_url    text,
  add column if not exists image_credit text,
  add column if not exists image_link   text;

create index if not exists terminal_news_category_idx
  on terminal_news (category, published_at desc)
  where relevant;
