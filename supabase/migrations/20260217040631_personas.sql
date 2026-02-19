-- Personas table for context bias/attention control
-- Allows users to define weighted views of their data for different contexts

CREATE TABLE personal_db.personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES personal_db.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  system_instruction TEXT,
  tone TEXT,
  language TEXT DEFAULT 'auto',
  entity_weights JSONB DEFAULT '{}',
  include_private BOOLEAN DEFAULT false,
  exclude_entities TEXT[] DEFAULT '{}',
  min_importance INTEGER DEFAULT 1 CHECK (min_importance BETWEEN 1 AND 10),
  min_confidence INTEGER DEFAULT 1 CHECK (min_confidence BETWEEN 1 AND 10),
  time_decay_days INTEGER DEFAULT 1825,
  max_entries_per_type INTEGER DEFAULT 20,
  importance INTEGER DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
  confidence INTEGER DEFAULT 8 CHECK (confidence BETWEEN 1 AND 10),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER personas_updated_at
  BEFORE UPDATE ON personal_db.personas
  FOR EACH ROW EXECUTE FUNCTION personal_db.update_updated_at();

CREATE INDEX idx_personas_profile ON personal_db.personas(profile_id);

-- RLS
ALTER TABLE personal_db.personas ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_role_all ON personal_db.personas
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY user_select_personas ON personal_db.personas
  FOR SELECT TO authenticated
  USING (profile_id = personal_db.get_user_profile_id());

CREATE POLICY user_insert_personas ON personal_db.personas
  FOR INSERT TO authenticated
  WITH CHECK (profile_id = personal_db.get_user_profile_id());

CREATE POLICY user_update_personas ON personal_db.personas
  FOR UPDATE TO authenticated
  USING (profile_id = personal_db.get_user_profile_id())
  WITH CHECK (profile_id = personal_db.get_user_profile_id());

CREATE POLICY user_delete_personas ON personal_db.personas
  FOR DELETE TO authenticated
  USING (profile_id = personal_db.get_user_profile_id());
