-- Which library a story's photo came from (unsplash, pexels, wikimedia), so
-- each cover credits the right one. Photos stored so far are all Unsplash.

alter table terminal_news add column if not exists image_source text;

update terminal_news set image_source = 'unsplash'
 where image_url is not null and image_source is null;
