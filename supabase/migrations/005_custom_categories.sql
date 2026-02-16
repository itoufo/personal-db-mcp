-- Custom categories (user-defined)
CREATE TABLE personal_db.custom_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES personal_db.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  schema_hint JSONB DEFAULT '{}',        -- hint for expected fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER custom_categories_updated_at
  BEFORE UPDATE ON personal_db.custom_categories
  FOR EACH ROW EXECUTE FUNCTION personal_db.update_updated_at();

-- Custom entries
CREATE TABLE personal_db.custom_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES personal_db.profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES personal_db.custom_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  tags TEXT[],
  -- Common
  importance INTEGER DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
  confidence INTEGER DEFAULT 8 CHECK (confidence BETWEEN 1 AND 10),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER custom_entries_updated_at
  BEFORE UPDATE ON personal_db.custom_entries
  FOR EACH ROW EXECUTE FUNCTION personal_db.update_updated_at();
