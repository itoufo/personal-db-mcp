-- OAuth support for Claude.ai custom connector
-- Stores temporary auth codes and dynamic client registrations

-- Temporary authorization codes (exchanged for access tokens)
CREATE TABLE personal_db.oauth_codes (
  code TEXT PRIMARY KEY,
  api_key_encrypted TEXT NOT NULL,
  client_id TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  code_challenge TEXT,
  code_challenge_method TEXT DEFAULT 'S256',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dynamic client registrations (RFC 7591)
CREATE TABLE personal_db.oauth_clients (
  client_id TEXT PRIMARY KEY,
  client_secret TEXT,
  redirect_uris TEXT[] NOT NULL,
  client_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for cleanup of expired codes
CREATE INDEX idx_oauth_codes_expires_at ON personal_db.oauth_codes (expires_at);

-- RLS: service_role only (these are server-side tables)
ALTER TABLE personal_db.oauth_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_db.oauth_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on oauth_codes"
  ON personal_db.oauth_codes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on oauth_clients"
  ON personal_db.oauth_clients
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
