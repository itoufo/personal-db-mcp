-- Multi-profile support: allow one user to own multiple profiles
-- Each profile is a fully independent data space

-- ============================================================
-- 1. Junction table: user_profiles
-- ============================================================

CREATE TABLE personal_db.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES personal_db.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES personal_db.profiles(id) ON DELETE CASCADE,
  is_default BOOLEAN NOT NULL DEFAULT false,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, profile_id)
);

-- Only one default per user
CREATE UNIQUE INDEX idx_user_profiles_default
  ON personal_db.user_profiles(user_id) WHERE is_default = true;

CREATE INDEX idx_user_profiles_user_id ON personal_db.user_profiles(user_id);
CREATE INDEX idx_user_profiles_profile_id ON personal_db.user_profiles(profile_id);

-- ============================================================
-- 2. Add profile_id to api_keys
-- ============================================================

ALTER TABLE personal_db.api_keys
  ADD COLUMN profile_id UUID REFERENCES personal_db.profiles(id) ON DELETE SET NULL;

-- ============================================================
-- 3. Migrate existing data
-- ============================================================

-- users.profile_id → user_profiles (is_default = true)
INSERT INTO personal_db.user_profiles (user_id, profile_id, is_default, display_name)
SELECT u.id, u.profile_id, true, COALESCE(p.name, u.display_name)
FROM personal_db.users u
JOIN personal_db.profiles p ON p.id = u.profile_id
WHERE u.profile_id IS NOT NULL;

-- api_keys: set profile_id from users.profile_id
UPDATE personal_db.api_keys ak
SET profile_id = u.profile_id
FROM personal_db.users u
WHERE ak.user_id = u.id AND u.profile_id IS NOT NULL;

-- ============================================================
-- 4. Updated helper functions
-- ============================================================

-- get_user_profile_id(): return the default profile (backward compatible)
CREATE OR REPLACE FUNCTION personal_db.get_user_profile_id()
RETURNS UUID AS $$
  SELECT up.profile_id
  FROM personal_db.user_profiles up
  JOIN personal_db.users u ON u.id = up.user_id
  WHERE u.auth_id = auth.uid() AND up.is_default = true
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = personal_db;

-- get_user_profile_ids(): return all profile_ids for the current user
CREATE OR REPLACE FUNCTION personal_db.get_user_profile_ids()
RETURNS SETOF UUID AS $$
  SELECT up.profile_id
  FROM personal_db.user_profiles up
  JOIN personal_db.users u ON u.id = up.user_id
  WHERE u.auth_id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = personal_db;

-- user_owns_profile(UUID): check if current user owns a specific profile
CREATE OR REPLACE FUNCTION personal_db.user_owns_profile(p_profile_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM personal_db.user_profiles up
    JOIN personal_db.users u ON u.id = up.user_id
    WHERE u.auth_id = auth.uid() AND up.profile_id = p_profile_id
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = personal_db;

-- ============================================================
-- 5. RLS for user_profiles
-- ============================================================

ALTER TABLE personal_db.user_profiles ENABLE ROW LEVEL SECURITY;

-- service_role full access
CREATE POLICY service_role_all ON personal_db.user_profiles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- authenticated: own records only
CREATE POLICY user_select_own_user_profiles ON personal_db.user_profiles
  FOR SELECT TO authenticated
  USING (user_id = personal_db.get_user_id());

CREATE POLICY user_insert_own_user_profiles ON personal_db.user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = personal_db.get_user_id());

CREATE POLICY user_update_own_user_profiles ON personal_db.user_profiles
  FOR UPDATE TO authenticated
  USING (user_id = personal_db.get_user_id())
  WITH CHECK (user_id = personal_db.get_user_id());

CREATE POLICY user_delete_own_user_profiles ON personal_db.user_profiles
  FOR DELETE TO authenticated
  USING (user_id = personal_db.get_user_id());

-- ============================================================
-- 6. Update profiles RLS to allow access to all owned profiles
-- ============================================================

-- Drop old single-profile policies
DROP POLICY IF EXISTS user_select_own_profile ON personal_db.profiles;
DROP POLICY IF EXISTS user_update_own_profile ON personal_db.profiles;
DROP POLICY IF EXISTS user_delete_own_profile ON personal_db.profiles;

-- New multi-profile policies
CREATE POLICY user_select_own_profiles ON personal_db.profiles
  FOR SELECT TO authenticated
  USING (id IN (SELECT personal_db.get_user_profile_ids()));

CREATE POLICY user_update_own_profiles ON personal_db.profiles
  FOR UPDATE TO authenticated
  USING (id IN (SELECT personal_db.get_user_profile_ids()))
  WITH CHECK (id IN (SELECT personal_db.get_user_profile_ids()));

CREATE POLICY user_delete_own_profiles ON personal_db.profiles
  FOR DELETE TO authenticated
  USING (id IN (SELECT personal_db.get_user_profile_ids()));
