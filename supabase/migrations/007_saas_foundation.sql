-- SaaS foundation: users, api_keys, subscriptions
-- Bridge auth.users → existing personal_db.profiles via users table

-- Users table: links Supabase Auth to personal_db profiles
CREATE TABLE personal_db.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID NOT NULL UNIQUE,  -- references auth.users(id)
  profile_id UUID UNIQUE REFERENCES personal_db.profiles(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  display_name TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON personal_db.users
  FOR EACH ROW EXECUTE FUNCTION personal_db.update_updated_at();

CREATE INDEX idx_users_auth_id ON personal_db.users(auth_id);
CREATE INDEX idx_users_profile_id ON personal_db.users(profile_id);

-- API keys table
CREATE TABLE personal_db.api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES personal_db.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,              -- first 8 chars for display (e.g. "pdb_abc1")
  key_hash TEXT NOT NULL UNIQUE,         -- SHA-256 hash of full key
  scopes TEXT[] DEFAULT '{*}',           -- permissions (future use)
  expires_at TIMESTAMPTZ,               -- NULL = never expires
  revoked_at TIMESTAMPTZ,               -- NULL = active
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_keys_user_id ON personal_db.api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON personal_db.api_keys(key_hash);

-- Subscriptions table (Stripe integration)
CREATE TABLE personal_db.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES personal_db.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'inactive'
    CHECK (status IN ('active', 'inactive', 'past_due', 'canceled', 'trialing')),
  price_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON personal_db.subscriptions
  FOR EACH ROW EXECUTE FUNCTION personal_db.update_updated_at();

CREATE INDEX idx_subscriptions_stripe_customer ON personal_db.subscriptions(stripe_customer_id);

-- Auto-create personal_db.users on auth.users signup
CREATE OR REPLACE FUNCTION personal_db.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO personal_db.users (auth_id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = personal_db;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION personal_db.handle_new_user();
