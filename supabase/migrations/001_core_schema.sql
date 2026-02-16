-- Personal DB schema (isolated from other apps in the same Supabase instance)
CREATE SCHEMA IF NOT EXISTS personal_db;

-- Enable extensions in public (shared)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles: basic info, contact, SNS, mission/vision/voice
CREATE TABLE personal_db.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Basic
  name TEXT NOT NULL,
  name_en TEXT,
  title TEXT,
  title_full TEXT,
  organization TEXT,
  tagline TEXT,
  bio TEXT,
  -- Personality
  personality_type TEXT,               -- e.g. "ENTP/INTP"
  personality_traits TEXT[],           -- e.g. ["論理的","天才肌"]
  career_years INTEGER,
  -- URLs
  urls JSONB DEFAULT '{}',             -- flexible key-value: company, portfolio, etc.
  -- Mission / Vision / Values
  mission TEXT,
  vision TEXT,
  core_values TEXT[],                  -- array of value statements
  -- Voice / Tone
  speech_style TEXT,                   -- casual, formal, etc.
  tone TEXT,
  catchphrases TEXT[],
  stance TEXT,
  -- Social proof (aggregate numbers)
  social_proof JSONB DEFAULT '{}',     -- systems_built, seminars, students, etc.
  -- Products / services overview
  products JSONB DEFAULT '[]',         -- [{name, type, description}, ...]
  -- Credentials overview
  credentials JSONB DEFAULT '[]',      -- [{type, name, detail, year}, ...]
  -- Tech stack
  tech_stack JSONB DEFAULT '{}',       -- {languages:[], frameworks:[], ai_ml:[], ...}
  -- Common fields
  importance INTEGER DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
  confidence INTEGER DEFAULT 8 CHECK (confidence BETWEEN 1 AND 10),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION personal_db.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON personal_db.profiles
  FOR EACH ROW EXECUTE FUNCTION personal_db.update_updated_at();
