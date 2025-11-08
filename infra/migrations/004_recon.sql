CREATE TABLE reconciliation_runs (
  id bigserial PRIMARY KEY,
  user_id uuid,
  account text,
  balance numeric,
  run_at timestamptz DEFAULT now()
);
