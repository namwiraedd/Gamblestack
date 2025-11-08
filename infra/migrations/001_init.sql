CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  password_hash text,
  created_at timestamptz DEFAULT now(),
  country_code text,
  kyc_status text,
  preferences jsonb
);

CREATE TABLE ledger_entries (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  tx_id uuid NOT NULL,
  account text NOT NULL,
  amount numeric(18,8) NOT NULL,
  currency text NOT NULL,
  type text NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE bets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  market_id text,
  stake numeric(18,8),
  potential_win numeric(18,8),
  status text,
  placed_at timestamptz,
  settled_at timestamptz,
  settlement_metadata jsonb
);

CREATE TABLE game_provable_receipts (
  id bigserial PRIMARY KEY,
  game_id text,
  round_id text,
  server_seed_hash text NOT NULL,
  server_seed text NULL,
  client_seed text,
  result jsonb,
  proof jsonb,
  created_at timestamptz DEFAULT now()
);
