-- Full-text search support with tsvector + GIN indexes
-- Title/name fields get weight 'A', descriptions/summaries get weight 'B'

-- Profiles
ALTER TABLE personal_db.profiles ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(name_en, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(title, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(bio, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(tagline, '')), 'B')
  ) STORED;
CREATE INDEX idx_profiles_search ON personal_db.profiles USING GIN(search_vector);

-- Career entries
ALTER TABLE personal_db.career_entries ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(role, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(organization, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(summary, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(domain, '')), 'B')
  ) STORED;
CREATE INDEX idx_career_entries_search ON personal_db.career_entries USING GIN(search_vector);

-- Skills
ALTER TABLE personal_db.skills ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(category, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(evidence, '')), 'C')
  ) STORED;
CREATE INDEX idx_skills_search ON personal_db.skills USING GIN(search_vector);

-- Projects
ALTER TABLE personal_db.projects ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(type, '')), 'B')
  ) STORED;
CREATE INDEX idx_projects_search ON personal_db.projects USING GIN(search_vector);

-- Achievements
ALTER TABLE personal_db.achievements ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(detail, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(type, '')), 'B')
  ) STORED;
CREATE INDEX idx_achievements_search ON personal_db.achievements USING GIN(search_vector);

-- Episodes
ALTER TABLE personal_db.episodes ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(situation, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(action, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(result, '')), 'B')
  ) STORED;
CREATE INDEX idx_episodes_search ON personal_db.episodes USING GIN(search_vector);

-- Education
ALTER TABLE personal_db.education ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(institution, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(field, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'B')
  ) STORED;
CREATE INDEX idx_education_search ON personal_db.education USING GIN(search_vector);

-- Values & Philosophy
ALTER TABLE personal_db.values_philosophy ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'B')
  ) STORED;
CREATE INDEX idx_values_philosophy_search ON personal_db.values_philosophy USING GIN(search_vector);

-- Life events
ALTER TABLE personal_db.life_events ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'B')
  ) STORED;
CREATE INDEX idx_life_events_search ON personal_db.life_events USING GIN(search_vector);

-- Goals
ALTER TABLE personal_db.goals ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'B')
  ) STORED;
CREATE INDEX idx_goals_search ON personal_db.goals USING GIN(search_vector);

-- Custom entries
ALTER TABLE personal_db.custom_entries ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A')
  ) STORED;
CREATE INDEX idx_custom_entries_search ON personal_db.custom_entries USING GIN(search_vector);
