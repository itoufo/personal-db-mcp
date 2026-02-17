-- Profile extensions: add mindset/personality detail columns
ALTER TABLE personal_db.profiles
  ADD COLUMN strengths TEXT,
  ADD COLUMN weaknesses TEXT,
  ADD COLUMN likes TEXT,
  ADD COLUMN dislikes TEXT,
  ADD COLUMN ng_words TEXT[],
  ADD COLUMN lifestyle TEXT,
  ADD COLUMN thinking_habits TEXT,
  ADD COLUMN decision_criteria TEXT,
  ADD COLUMN beliefs TEXT,
  ADD COLUMN contradictions TEXT,
  ADD COLUMN multi_perspectives TEXT,
  ADD COLUMN relationship_style TEXT,
  ADD COLUMN ideal_relationships TEXT;

-- Promotions table: marketing/branding strategy per profile
CREATE TABLE personal_db.promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES personal_db.profiles(id) ON DELETE CASCADE,
  -- Target
  target_overview TEXT,
  target_age_range TEXT,
  target_income_range TEXT,
  target_job_title TEXT,
  target_situation TEXT,
  target_psychology TEXT,
  target_pain_points TEXT,
  persona_demographics TEXT,
  persona_psychographics TEXT,
  persona_triggers TEXT,
  -- Value proposition
  what_to_deliver TEXT,
  future_promise TEXT,
  unique_features TEXT,
  differentiation TEXT,
  expertise TEXT,
  transformation TEXT,
  -- Delivery
  products_services TEXT,
  content_pillars TEXT,
  posting_strategy TEXT,
  -- Content
  note_footer_cta TEXT,
  -- Common
  importance INTEGER DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
  confidence INTEGER DEFAULT 8 CHECK (confidence BETWEEN 1 AND 10),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER promotions_updated_at
  BEFORE UPDATE ON personal_db.promotions
  FOR EACH ROW EXECUTE FUNCTION personal_db.update_updated_at();

CREATE INDEX idx_promotions_profile_id ON personal_db.promotions(profile_id);

-- Search vector for promotions
ALTER TABLE personal_db.promotions ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(target_overview, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(what_to_deliver, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(differentiation, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(expertise, '')), 'B')
  ) STORED;
CREATE INDEX idx_promotions_search ON personal_db.promotions USING GIN(search_vector);

-- RLS for promotions
ALTER TABLE personal_db.promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_role_all ON personal_db.promotions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY user_select_promotions ON personal_db.promotions
  FOR SELECT TO authenticated
  USING (profile_id = personal_db.get_user_profile_id());

CREATE POLICY user_insert_promotions ON personal_db.promotions
  FOR INSERT TO authenticated
  WITH CHECK (profile_id = personal_db.get_user_profile_id());

CREATE POLICY user_update_promotions ON personal_db.promotions
  FOR UPDATE TO authenticated
  USING (profile_id = personal_db.get_user_profile_id())
  WITH CHECK (profile_id = personal_db.get_user_profile_id());

CREATE POLICY user_delete_promotions ON personal_db.promotions
  FOR DELETE TO authenticated
  USING (profile_id = personal_db.get_user_profile_id());
