-- Per-user override of the plan-based profile limit.
-- NULL → fall back to PLAN_LIMITS[plan].maxProfiles.
-- Used for whitelisted accounts that need to operate many profiles
-- (e.g. internal accounts driving large persona pools).

ALTER TABLE personal_db.users
  ADD COLUMN IF NOT EXISTS max_profiles_override INTEGER NULL;

COMMENT ON COLUMN personal_db.users.max_profiles_override IS
  'Per-user override of plan-based profile limit (PLAN_LIMITS[plan].maxProfiles). NULL = use plan default.';
