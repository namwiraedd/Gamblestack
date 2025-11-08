CREATE TABLE idempotency_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  key text NOT NULL,
  created_at timestamptz DEFAULT now(),
  response jsonb,
  status text DEFAULT 'processing',
  UNIQUE(provider, key)
);
