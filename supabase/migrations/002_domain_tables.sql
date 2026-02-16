-- Career entries
CREATE TABLE personal_db.career_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES personal_db.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  organization TEXT,
  org_type TEXT,                         -- startup, enterprise, education, etc.
  domain TEXT,                           -- cybersecurity, software-development, ai-ml, business
  period_start DATE,
  period_end DATE,                       -- NULL = current
  period_year INTEGER,                   -- for single-year entries
  summary TEXT,
  insights TEXT[],                       -- key lessons learned
  mention_tone TEXT DEFAULT 'lesson',    -- lesson, pride, humility, etc.
  mentionable BOOLEAN DEFAULT true,
  tags TEXT[],
  -- Common
  importance INTEGER DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
  confidence INTEGER DEFAULT 8 CHECK (confidence BETWEEN 1 AND 10),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER career_entries_updated_at
  BEFORE UPDATE ON personal_db.career_entries
  FOR EACH ROW EXECUTE FUNCTION personal_db.update_updated_at();

-- Skills
CREATE TABLE personal_db.skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES personal_db.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,                -- language, framework, ai_ml, security, infra, soft_skill
  proficiency INTEGER CHECK (proficiency BETWEEN 1 AND 10),
  years_experience INTEGER,
  evidence TEXT,                         -- how this skill was demonstrated
  tags TEXT[],
  -- Common
  importance INTEGER DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
  confidence INTEGER DEFAULT 8 CHECK (confidence BETWEEN 1 AND 10),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER skills_updated_at
  BEFORE UPDATE ON personal_db.skills
  FOR EACH ROW EXECUTE FUNCTION personal_db.update_updated_at();

-- Projects
CREATE TABLE personal_db.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES personal_db.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,                             -- product, system, media, edtech, etc.
  description TEXT,
  role TEXT,
  technologies TEXT[],
  outcomes TEXT[],                        -- measurable results
  lessons TEXT[],
  url TEXT,
  period_start DATE,
  period_end DATE,
  tags TEXT[],
  -- Common
  importance INTEGER DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
  confidence INTEGER DEFAULT 8 CHECK (confidence BETWEEN 1 AND 10),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON personal_db.projects
  FOR EACH ROW EXECUTE FUNCTION personal_db.update_updated_at();

-- Achievements (awards, certs, talks, patents)
CREATE TABLE personal_db.achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES personal_db.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,                    -- certification, membership, board_member, award, talk, patent
  name TEXT NOT NULL,
  detail TEXT,
  issuer TEXT,
  year INTEGER,
  url TEXT,
  tags TEXT[],
  -- Common
  importance INTEGER DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
  confidence INTEGER DEFAULT 8 CHECK (confidence BETWEEN 1 AND 10),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER achievements_updated_at
  BEFORE UPDATE ON personal_db.achievements
  FOR EACH ROW EXECUTE FUNCTION personal_db.update_updated_at();

-- Episodes (success/failure/turning-point stories, STAR format)
CREATE TABLE personal_db.episodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES personal_db.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL,                    -- success, failure, turning_point, lesson, challenge
  domain TEXT,
  -- STAR format
  situation TEXT,
  task TEXT,
  action TEXT,
  result TEXT,
  -- Additional
  insights TEXT[],
  emotions TEXT[],                       -- what was felt
  mention_tone TEXT DEFAULT 'lesson',
  mentionable BOOLEAN DEFAULT true,
  period_start DATE,
  period_end DATE,
  tags TEXT[],
  -- Common
  importance INTEGER DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
  confidence INTEGER DEFAULT 8 CHECK (confidence BETWEEN 1 AND 10),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER episodes_updated_at
  BEFORE UPDATE ON personal_db.episodes
  FOR EACH ROW EXECUTE FUNCTION personal_db.update_updated_at();

-- Education
CREATE TABLE personal_db.education (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES personal_db.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,                    -- university, self_study, course, bootcamp
  institution TEXT,
  field TEXT,
  degree TEXT,
  period_start DATE,
  period_end DATE,
  description TEXT,
  tags TEXT[],
  -- Common
  importance INTEGER DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
  confidence INTEGER DEFAULT 8 CHECK (confidence BETWEEN 1 AND 10),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER education_updated_at
  BEFORE UPDATE ON personal_db.education
  FOR EACH ROW EXECUTE FUNCTION personal_db.update_updated_at();
