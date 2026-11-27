-- Mastery Terminal summaries are written in English, not Bahasa Melayu.
-- The column loses its language suffix with them. Run this BEFORE the code
-- that reads `summary` is deployed, or the feed and the wire both fail.
--
-- Anything already stored in Malay is cleared so the page never mixes the
-- two languages. Those rows stay relevant; they simply show no summary.

alter table terminal_news rename column summary_ms to summary;
update terminal_news set summary = null where summary is not null;
