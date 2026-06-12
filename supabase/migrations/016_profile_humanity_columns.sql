-- Profile humanity & heroism columns
-- 人間味（恐れ・癖・ユーモア・外見）と英雄性（origin_story）、想定読者層を profiles に追加
-- 注: 名言は favorite_quotes、日課は daily_routines、影響源は influences の既存テーブル(010)を使う

ALTER TABLE personal_db.profiles
  ADD COLUMN origin_story TEXT,                  -- ヒーローズジャーニー要約 (出自→挫折→転換→現在)
  ADD COLUMN fears TEXT,                         -- 恐れ・コンプレックス・不安
  ADD COLUMN quirks TEXT,                        -- 癖・ギャップ・弱点の可愛げ
  ADD COLUMN humor_style TEXT,                   -- 笑いのツボ・ユーモアの出し方
  ADD COLUMN appearance TEXT,                    -- 見た目・声・服装 (画像生成/動画台本用)
  ADD COLUMN target_audience JSONB DEFAULT '{}'; -- 想定読者/ファン層 (fan_persona profile_id 参照を含む)
