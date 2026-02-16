-- Tags (polymorphic tagging system)
CREATE TABLE personal_db.tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  category TEXT,                          -- domain grouping
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Entry-tag associations (polymorphic)
CREATE TABLE personal_db.entry_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tag_id UUID NOT NULL REFERENCES personal_db.tags(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL,               -- table name: career_entries, skills, etc.
  entry_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tag_id, entry_type, entry_id)
);

CREATE INDEX idx_entry_tags_entry ON personal_db.entry_tags(entry_type, entry_id);
CREATE INDEX idx_entry_tags_tag ON personal_db.entry_tags(tag_id);

-- Entry relations (cross-references between entries)
CREATE TABLE personal_db.entry_relations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_type TEXT NOT NULL,              -- e.g. 'episodes'
  source_id UUID NOT NULL,
  target_type TEXT NOT NULL,              -- e.g. 'career_entries'
  target_id UUID NOT NULL,
  relation_type TEXT NOT NULL,            -- demonstrated_in, led_to, related_to, inspired_by, etc.
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_type, source_id, target_type, target_id, relation_type)
);

CREATE INDEX idx_entry_relations_source ON personal_db.entry_relations(source_type, source_id);
CREATE INDEX idx_entry_relations_target ON personal_db.entry_relations(target_type, target_id);
