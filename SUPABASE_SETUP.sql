-- Samantha Stock Reports table
CREATE TABLE IF NOT EXISTS stock_reports (
  id bigint generated always as identity primary key,
  ticker text not null,
  company_name text not null,
  analysis_date date not null default current_date,
  user_name text default 'Kerry Grinkmeyer',
  input_price numeric(12,4),
  input_shares integer,
  input_portfolio_pct numeric(6,4),
  report_json jsonb not null,
  podcast_url text,
  created_at timestamptz default now(),
  unique(ticker, analysis_date)
);

-- Row-Level Security: anonymous read + insert + update
ALTER TABLE stock_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read"   ON stock_reports FOR SELECT USING (true);
CREATE POLICY "anon_insert" ON stock_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update" ON stock_reports FOR UPDATE USING (true);

-- Index for fast lookups
CREATE INDEX idx_reports_ticker ON stock_reports (ticker);
CREATE INDEX idx_reports_date   ON stock_reports (analysis_date DESC);
