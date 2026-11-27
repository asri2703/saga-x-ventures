-- Commitments of Traders: weekly futures positioning from the CFTC.
--
-- One row per market per report date (the Tuesday the positions are taken).
-- "spec" is the speculative group (managed money for gold, leveraged funds
-- for currencies); "hedge" is the hedging group (producers and merchants for
-- gold, dealers for currencies). Contracts, not dollars.

create table if not exists cot_positions (
  market        text not null,
  report_date   date not null,
  open_interest integer not null,
  spec_long     integer not null,
  spec_short    integer not null,
  hedge_long    integer not null,
  hedge_short   integer not null,
  updated_at    timestamptz not null default now(),
  primary key (market, report_date)
);

create index if not exists cot_positions_date_idx on cot_positions (report_date desc);

alter table cot_positions enable row level security;
