-- Hobbies
CREATE TABLE personal_db.hobbies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES personal_db.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  passion_level INTEGER CHECK (passion_level BETWEEN 1 AND 10),
  description TEXT,
  related_skills TEXT[],
  tags TEXT[],
  -- Common
  importance INTEGER DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
  confidence INTEGER DEFAULT 8 CHECK (confidence BETWEEN 1 AND 10),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER hobbies_updated_at
  BEFORE UPDATE ON personal_db.hobbies
  FOR EACH ROW EXECUTE FUNCTION personal_db.update_updated_at();

-- Values & Philosophy
CREATE TABLE personal_db.values_philosophy (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES personal_db.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,                    -- value, philosophy, belief, principle
  title TEXT NOT NULL,
  description TEXT,
  origin TEXT,                           -- where this value came from
  tags TEXT[],
  -- Common
  importance INTEGER DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
  confidence INTEGER DEFAULT 8 CHECK (confidence BETWEEN 1 AND 10),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER values_philosophy_updated_at
  BEFORE UPDATE ON personal_db.values_philosophy
  FOR EACH ROW EXECUTE FUNCTION personal_db.update_updated_at();

-- Health entries (private by default)
CREATE TABLE personal_db.health_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES personal_db.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,                    -- habit, condition, goal, routine
  title TEXT NOT NULL,
  description TEXT,
  is_private BOOLEAN DEFAULT true,
  tags TEXT[],
  -- Common
  importance INTEGER DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
  confidence INTEGER DEFAULT 8 CHECK (confidence BETWEEN 1 AND 10),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER health_entries_updated_at
  BEFORE UPDATE ON personal_db.health_entries
  FOR EACH ROW EXECUTE FUNCTION personal_db.update_updated_at();

-- Life events
CREATE TABLE personal_db.life_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES personal_db.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,                    -- turning_point, relocation, major_change, milestone
  title TEXT NOT NULL,
  description TEXT,
  impact TEXT,
  event_date DATE,
  tags TEXT[],
  -- Common
  importance INTEGER DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
  confidence INTEGER DEFAULT 8 CHECK (confidence BETWEEN 1 AND 10),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER life_events_updated_at
  BEFORE UPDATE ON personal_db.life_events
  FOR EACH ROW EXECUTE FUNCTION personal_db.update_updated_at();

-- Relationships (anonymizable)
CREATE TABLE personal_db.relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES personal_db.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,                    -- mentor, colleague, friend, family, partner
  alias TEXT NOT NULL,                   -- anonymized name
  real_name TEXT,                        -- optional, private
  description TEXT,
  influence TEXT,
  is_private BOOLEAN DEFAULT true,
  tags TEXT[],
  -- Common
  importance INTEGER DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
  confidence INTEGER DEFAULT 8 CHECK (confidence BETWEEN 1 AND 10),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER relationships_updated_at
  BEFORE UPDATE ON personal_db.relationships
  FOR EACH ROW EXECUTE FUNCTION personal_db.update_updated_at();

-- Goals
CREATE TABLE personal_db.goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES personal_db.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,                    -- short_term, mid_term, long_term, life
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',          -- active, completed, paused, abandoned
  progress INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  target_date DATE,
  milestones JSONB DEFAULT '[]',         -- [{title, done, date}, ...]
  tags TEXT[],
  -- Common
  importance INTEGER DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
  confidence INTEGER DEFAULT 8 CHECK (confidence BETWEEN 1 AND 10),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER goals_updated_at
  BEFORE UPDATE ON personal_db.goals
  FOR EACH ROW EXECUTE FUNCTION personal_db.update_updated_at();
