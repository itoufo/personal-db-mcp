-- Comprehensive personal data expansion
-- Profile columns + 6 new tables

-- ============================================================
-- Profile column additions
-- ============================================================
ALTER TABLE personal_db.profiles
  ADD COLUMN mbti TEXT,                          -- e.g. "ENTP"
  ADD COLUMN enneagram TEXT,                     -- e.g. "5w4"
  ADD COLUMN strengths_finder TEXT[],            -- e.g. ["戦略性","学習欲","内省"]
  ADD COLUMN motto TEXT,                         -- 座右の銘
  ADD COLUMN birthday DATE,
  ADD COLUMN location TEXT,                      -- 居住地
  ADD COLUMN birthplace TEXT,                    -- 出身地
  ADD COLUMN languages TEXT[],                   -- e.g. ["日本語","English"]
  ADD COLUMN work_style TEXT,                    -- リモート/オフィス/ハイブリッド等
  ADD COLUMN learning_style TEXT,                -- 視覚/聴覚/実践/読書等
  ADD COLUMN communication_preferences TEXT,     -- 連絡手段・対話スタイルの好み
  ADD COLUMN blood_type TEXT,                    -- A/B/O/AB
  ADD COLUMN zodiac TEXT,                        -- 星座
  ADD COLUMN family_structure TEXT,              -- 家族構成
  ADD COLUMN travel_history TEXT[];              -- 行った/住んだ場所

-- ============================================================
-- Favorite Books
-- ============================================================
CREATE TABLE personal_db.favorite_books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES personal_db.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT,
  category TEXT,               -- business, tech, philosophy, fiction, self-help, etc.
  status TEXT DEFAULT 'read',  -- read, reading, want_to_read, recommended
  rating INTEGER CHECK (rating BETWEEN 1 AND 10),
  review TEXT,                 -- 感想・学び
  year_read INTEGER,
  tags TEXT[],
  importance INTEGER DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
  confidence INTEGER DEFAULT 8 CHECK (confidence BETWEEN 1 AND 10),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER favorite_books_updated_at
  BEFORE UPDATE ON personal_db.favorite_books
  FOR EACH ROW EXECUTE FUNCTION personal_db.update_updated_at();

CREATE INDEX idx_favorite_books_profile ON personal_db.favorite_books(profile_id);

ALTER TABLE personal_db.favorite_books ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(author, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(review, '')), 'B')
  ) STORED;
CREATE INDEX idx_favorite_books_search ON personal_db.favorite_books USING GIN(search_vector);

-- ============================================================
-- Favorite Quotes (座右の銘、名言、自分の言葉)
-- ============================================================
CREATE TABLE personal_db.favorite_quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES personal_db.profiles(id) ON DELETE CASCADE,
  quote TEXT NOT NULL,
  author TEXT,                 -- 誰の言葉か (NULL = 自分の言葉)
  source TEXT,                 -- 出典 (本、スピーチ、etc.)
  category TEXT,               -- motto, inspiration, warning, principle, humor
  context TEXT,                -- なぜこの言葉が重要か
  tags TEXT[],
  importance INTEGER DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
  confidence INTEGER DEFAULT 8 CHECK (confidence BETWEEN 1 AND 10),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER favorite_quotes_updated_at
  BEFORE UPDATE ON personal_db.favorite_quotes
  FOR EACH ROW EXECUTE FUNCTION personal_db.update_updated_at();

CREATE INDEX idx_favorite_quotes_profile ON personal_db.favorite_quotes(profile_id);

ALTER TABLE personal_db.favorite_quotes ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(quote, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(author, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(context, '')), 'B')
  ) STORED;
CREATE INDEX idx_favorite_quotes_search ON personal_db.favorite_quotes USING GIN(search_vector);

-- ============================================================
-- Influences (影響を受けた人物・出来事・思想)
-- ============================================================
CREATE TABLE personal_db.influences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES personal_db.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,            -- person, book, event, concept, experience, culture
  name TEXT NOT NULL,
  description TEXT,
  impact TEXT,                   -- どう影響を受けたか
  domain TEXT,                   -- career, philosophy, lifestyle, technical, creative
  tags TEXT[],
  importance INTEGER DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
  confidence INTEGER DEFAULT 8 CHECK (confidence BETWEEN 1 AND 10),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER influences_updated_at
  BEFORE UPDATE ON personal_db.influences
  FOR EACH ROW EXECUTE FUNCTION personal_db.update_updated_at();

CREATE INDEX idx_influences_profile ON personal_db.influences(profile_id);

ALTER TABLE personal_db.influences ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(impact, '')), 'B')
  ) STORED;
CREATE INDEX idx_influences_search ON personal_db.influences USING GIN(search_vector);

-- ============================================================
-- Daily Routines (日課・習慣)
-- ============================================================
CREATE TABLE personal_db.daily_routines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES personal_db.profiles(id) ON DELETE CASCADE,
  time_of_day TEXT NOT NULL,     -- morning, afternoon, evening, night, anytime
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER,
  frequency TEXT,                -- daily, weekdays, weekends, weekly, monthly
  is_active BOOLEAN DEFAULT true,
  tags TEXT[],
  importance INTEGER DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
  confidence INTEGER DEFAULT 8 CHECK (confidence BETWEEN 1 AND 10),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER daily_routines_updated_at
  BEFORE UPDATE ON personal_db.daily_routines
  FOR EACH ROW EXECUTE FUNCTION personal_db.update_updated_at();

CREATE INDEX idx_daily_routines_profile ON personal_db.daily_routines(profile_id);

ALTER TABLE personal_db.daily_routines ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'B')
  ) STORED;
CREATE INDEX idx_daily_routines_search ON personal_db.daily_routines USING GIN(search_vector);

-- ============================================================
-- Favorite Tools (愛用ツール・アプリ・サービス)
-- ============================================================
CREATE TABLE personal_db.favorite_tools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES personal_db.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,                 -- ide, ai, productivity, communication, design, finance, health
  description TEXT,              -- 何に使っているか
  url TEXT,
  why_favorite TEXT,             -- なぜ好きか
  proficiency TEXT,              -- beginner, intermediate, advanced, expert
  tags TEXT[],
  importance INTEGER DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
  confidence INTEGER DEFAULT 8 CHECK (confidence BETWEEN 1 AND 10),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER favorite_tools_updated_at
  BEFORE UPDATE ON personal_db.favorite_tools
  FOR EACH ROW EXECUTE FUNCTION personal_db.update_updated_at();

CREATE INDEX idx_favorite_tools_profile ON personal_db.favorite_tools(profile_id);

ALTER TABLE personal_db.favorite_tools ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(category, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'B')
  ) STORED;
CREATE INDEX idx_favorite_tools_search ON personal_db.favorite_tools USING GIN(search_vector);

-- ============================================================
-- FAQ (よく聞かれる質問と回答)
-- ============================================================
CREATE TABLE personal_db.faq (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES personal_db.profiles(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,                 -- about_me, work, philosophy, technical, personal
  is_public BOOLEAN DEFAULT true,
  tags TEXT[],
  importance INTEGER DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
  confidence INTEGER DEFAULT 8 CHECK (confidence BETWEEN 1 AND 10),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER faq_updated_at
  BEFORE UPDATE ON personal_db.faq
  FOR EACH ROW EXECUTE FUNCTION personal_db.update_updated_at();

CREATE INDEX idx_faq_profile ON personal_db.faq(profile_id);

ALTER TABLE personal_db.faq ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(question, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(answer, '')), 'B')
  ) STORED;
CREATE INDEX idx_faq_search ON personal_db.faq USING GIN(search_vector);

-- ============================================================
-- RLS for all new tables
-- ============================================================
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'favorite_books', 'favorite_quotes', 'influences',
    'daily_routines', 'favorite_tools', 'faq'
  ]
  LOOP
    EXECUTE format('ALTER TABLE personal_db.%I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format(
      'CREATE POLICY service_role_all ON personal_db.%I FOR ALL TO service_role USING (true) WITH CHECK (true)', tbl
    );
    EXECUTE format(
      'CREATE POLICY user_select_%s ON personal_db.%I FOR SELECT TO authenticated USING (profile_id = personal_db.get_user_profile_id())', tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY user_insert_%s ON personal_db.%I FOR INSERT TO authenticated WITH CHECK (profile_id = personal_db.get_user_profile_id())', tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY user_update_%s ON personal_db.%I FOR UPDATE TO authenticated USING (profile_id = personal_db.get_user_profile_id()) WITH CHECK (profile_id = personal_db.get_user_profile_id())', tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY user_delete_%s ON personal_db.%I FOR DELETE TO authenticated USING (profile_id = personal_db.get_user_profile_id())', tbl, tbl
    );
  END LOOP;
END;
$$;
