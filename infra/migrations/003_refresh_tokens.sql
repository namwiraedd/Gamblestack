CREATE TABLE refresh_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  token_hash text NOT NULL,
  revoked_at timestamptz NULL,
  issued_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_by_ip text,
  replaced_by uuid NULL
);
