import { z } from "zod";

// Common optional fields
const commonOptional = {
  importance: z.coerce.number().int().min(1).max(10).optional().describe("重要度 (1-10)"),
  confidence: z.coerce.number().int().min(1).max(10).optional().describe("確信度 (1-10)"),
  metadata: z.record(z.unknown()).optional().describe("カスタムメタデータ"),
};

// ---- Profiles ----
export const profileCreate = z.object({
  name: z.string().describe("名前"),
  name_en: z.string().optional().describe("英語名"),
  title: z.string().optional().describe("肩書き"),
  title_full: z.string().optional().describe("フル肩書き"),
  organization: z.string().optional().describe("所属組織"),
  tagline: z.string().optional().describe("キャッチフレーズ"),
  bio: z.string().optional().describe("自己紹介文"),
  personality_type: z.string().optional().describe("性格タイプ (例: ENTP/INTP)"),
  personality_traits: z.array(z.string()).optional().describe("性格特性"),
  career_years: z.coerce.number().int().optional().describe("キャリア年数"),
  urls: z.record(z.string()).optional().describe("URL集 (key-value)"),
  mission: z.string().optional().describe("ミッション"),
  vision: z.string().optional().describe("ビジョン"),
  core_values: z.array(z.string()).optional().describe("コアバリュー"),
  speech_style: z.string().optional().describe("話し方 (casual/formal等)"),
  tone: z.string().optional().describe("トーン"),
  catchphrases: z.array(z.string()).optional().describe("口癖"),
  stance: z.string().optional().describe("スタンス"),
  social_proof: z.record(z.unknown()).optional().describe("実績数値"),
  products: z.array(z.record(z.unknown())).optional().describe("プロダクト一覧"),
  credentials: z.array(z.record(z.unknown())).optional().describe("資格・認定"),
  tech_stack: z.record(z.array(z.string())).optional().describe("技術スタック"),
  // ---- 009: profile extensions (人間味) ----
  strengths: z.string().optional().describe("強み"),
  weaknesses: z.string().optional().describe("弱み"),
  likes: z.string().optional().describe("好きなもの"),
  dislikes: z.string().optional().describe("嫌いなもの"),
  ng_words: z.array(z.string()).optional().describe("NGワード"),
  lifestyle: z.string().optional().describe("ライフスタイル"),
  thinking_habits: z.string().optional().describe("思考の癖"),
  decision_criteria: z.string().optional().describe("意思決定基準"),
  beliefs: z.string().optional().describe("信念"),
  contradictions: z.string().optional().describe("矛盾・葛藤"),
  multi_perspectives: z.string().optional().describe("複眼的視点"),
  relationship_style: z.string().optional().describe("人間関係スタイル"),
  ideal_relationships: z.string().optional().describe("理想の人間関係"),
  // ---- 010: comprehensive personal data ----
  mbti: z.string().optional().describe("MBTI (例: ENTP)"),
  enneagram: z.string().optional().describe("エニアグラム (例: 5w4)"),
  strengths_finder: z.array(z.string()).optional().describe("ストレングスファインダー"),
  motto: z.string().optional().describe("座右の銘"),
  birthday: z.string().optional().describe("誕生日 (YYYY-MM-DD)"),
  location: z.string().optional().describe("居住地"),
  birthplace: z.string().optional().describe("出身地"),
  languages: z.array(z.string()).optional().describe("言語"),
  work_style: z.string().optional().describe("働き方 (リモート/オフィス等)"),
  learning_style: z.string().optional().describe("学習スタイル"),
  communication_preferences: z.string().optional().describe("連絡手段・対話スタイルの好み"),
  blood_type: z.string().optional().describe("血液型 (A/B/O/AB)"),
  zodiac: z.string().optional().describe("星座"),
  family_structure: z.string().optional().describe("家族構成"),
  travel_history: z.array(z.string()).optional().describe("行った/住んだ場所"),
  // ---- 016: humanity & heroism ----
  origin_story: z.string().optional().describe("ヒーローズジャーニー要約 (出自→挫折→転換→現在)"),
  fears: z.string().optional().describe("恐れ・コンプレックス・不安"),
  quirks: z.string().optional().describe("癖・ギャップ・弱点の可愛げ"),
  humor_style: z.string().optional().describe("笑いのツボ・ユーモアの出し方"),
  appearance: z.string().optional().describe("見た目・声・服装 (画像生成/動画台本用)"),
  target_audience: z.record(z.unknown()).optional().describe("想定読者/ファン層 (fan_persona profile_id 参照を含む)"),
  ...commonOptional,
});
export const profileUpdate = profileCreate.partial();

// ---- Career Entries ----
export const careerEntryCreate = z.object({
  role: z.string().describe("役職・ロール"),
  organization: z.string().optional().describe("所属組織"),
  org_type: z.string().optional().describe("組織タイプ (startup/enterprise/education等)"),
  domain: z.string().optional().describe("ドメイン (cybersecurity/software-development等)"),
  period_start: z.string().optional().describe("開始日 (YYYY-MM-DD)"),
  period_end: z.string().optional().describe("終了日 (YYYY-MM-DD, 現職ならnull)"),
  period_year: z.coerce.number().int().optional().describe("単年度表記"),
  summary: z.string().optional().describe("概要"),
  insights: z.array(z.string()).optional().describe("得られた知見"),
  mention_tone: z.string().optional().describe("言及トーン (lesson/pride等)"),
  mentionable: z.boolean().optional().describe("外部言及可能か"),
  tags: z.array(z.string()).optional().describe("タグ"),
  ...commonOptional,
});
export const careerEntryUpdate = careerEntryCreate.partial();

// ---- Skills ----
export const skillCreate = z.object({
  name: z.string().describe("スキル名"),
  category: z.string().describe("カテゴリ (language/framework/ai_ml/security/infra/soft_skill)"),
  proficiency: z.coerce.number().int().min(1).max(10).optional().describe("習熟度 (1-10)"),
  years_experience: z.coerce.number().int().optional().describe("経験年数"),
  evidence: z.string().optional().describe("根拠・実績"),
  tags: z.array(z.string()).optional().describe("タグ"),
  ...commonOptional,
});
export const skillUpdate = skillCreate.partial();

// ---- Projects ----
export const projectCreate = z.object({
  name: z.string().describe("プロジェクト名"),
  type: z.string().optional().describe("タイプ (product/system/media/edtech等)"),
  description: z.string().optional().describe("説明"),
  role: z.string().optional().describe("担当ロール"),
  technologies: z.array(z.string()).optional().describe("使用技術"),
  outcomes: z.array(z.string()).optional().describe("成果"),
  lessons: z.array(z.string()).optional().describe("教訓"),
  url: z.string().optional().describe("URL"),
  period_start: z.string().optional().describe("開始日"),
  period_end: z.string().optional().describe("終了日"),
  tags: z.array(z.string()).optional().describe("タグ"),
  ...commonOptional,
});
export const projectUpdate = projectCreate.partial();

// ---- Achievements ----
export const achievementCreate = z.object({
  type: z.string().describe("タイプ (certification/membership/board_member/award/talk/patent)"),
  name: z.string().describe("名称"),
  detail: z.string().optional().describe("詳細"),
  issuer: z.string().optional().describe("発行元"),
  year: z.coerce.number().int().optional().describe("取得年"),
  url: z.string().optional().describe("URL"),
  tags: z.array(z.string()).optional().describe("タグ"),
  ...commonOptional,
});
export const achievementUpdate = achievementCreate.partial();

// ---- Episodes ----
export const episodeCreate = z.object({
  title: z.string().describe("エピソードタイトル"),
  type: z.string().describe("タイプ (success/failure/turning_point/lesson/challenge)"),
  domain: z.string().optional().describe("ドメイン"),
  situation: z.string().optional().describe("STAR: 状況"),
  task: z.string().optional().describe("STAR: 課題"),
  action: z.string().optional().describe("STAR: 行動"),
  result: z.string().optional().describe("STAR: 結果"),
  insights: z.array(z.string()).optional().describe("得られた知見"),
  emotions: z.array(z.string()).optional().describe("当時の感情"),
  mention_tone: z.string().optional().describe("言及トーン"),
  mentionable: z.boolean().optional().describe("外部言及可能か"),
  period_start: z.string().optional().describe("開始日"),
  period_end: z.string().optional().describe("終了日"),
  tags: z.array(z.string()).optional().describe("タグ"),
  ...commonOptional,
});
export const episodeUpdate = episodeCreate.partial();

// ---- Education ----
export const educationCreate = z.object({
  type: z.string().describe("タイプ (university/self_study/course/bootcamp)"),
  institution: z.string().optional().describe("機関名"),
  field: z.string().optional().describe("分野"),
  degree: z.string().optional().describe("学位"),
  period_start: z.string().optional().describe("開始日"),
  period_end: z.string().optional().describe("終了日"),
  description: z.string().optional().describe("説明"),
  tags: z.array(z.string()).optional().describe("タグ"),
  ...commonOptional,
});
export const educationUpdate = educationCreate.partial();

// ---- Hobbies ----
export const hobbyCreate = z.object({
  name: z.string().describe("趣味名"),
  passion_level: z.coerce.number().int().min(1).max(10).optional().describe("情熱度 (1-10)"),
  description: z.string().optional().describe("説明"),
  related_skills: z.array(z.string()).optional().describe("関連スキル"),
  tags: z.array(z.string()).optional().describe("タグ"),
  ...commonOptional,
});
export const hobbyUpdate = hobbyCreate.partial();

// ---- Values & Philosophy ----
export const valuePhilosophyCreate = z.object({
  type: z.string().describe("タイプ (value/philosophy/belief/principle)"),
  title: z.string().describe("タイトル"),
  description: z.string().optional().describe("説明"),
  origin: z.string().optional().describe("この価値観の由来"),
  tags: z.array(z.string()).optional().describe("タグ"),
  ...commonOptional,
});
export const valuePhilosophyUpdate = valuePhilosophyCreate.partial();

// ---- Health Entries ----
export const healthEntryCreate = z.object({
  type: z.string().describe("タイプ (habit/condition/goal/routine)"),
  title: z.string().describe("タイトル"),
  description: z.string().optional().describe("説明"),
  is_private: z.boolean().optional().describe("非公開にするか (デフォルト: true)"),
  tags: z.array(z.string()).optional().describe("タグ"),
  ...commonOptional,
});
export const healthEntryUpdate = healthEntryCreate.partial();

// ---- Life Events ----
export const lifeEventCreate = z.object({
  type: z.string().describe("タイプ (turning_point/relocation/major_change/milestone)"),
  title: z.string().describe("タイトル"),
  description: z.string().optional().describe("説明"),
  impact: z.string().optional().describe("影響"),
  event_date: z.string().optional().describe("日付 (YYYY-MM-DD)"),
  tags: z.array(z.string()).optional().describe("タグ"),
  ...commonOptional,
});
export const lifeEventUpdate = lifeEventCreate.partial();

// ---- Relationships ----
export const relationshipCreate = z.object({
  type: z.string().describe("タイプ (mentor/colleague/friend/family/partner)"),
  alias: z.string().describe("匿名名"),
  real_name: z.string().optional().describe("実名 (非公開)"),
  description: z.string().optional().describe("説明"),
  influence: z.string().optional().describe("影響"),
  is_private: z.boolean().optional().describe("非公開にするか (デフォルト: true)"),
  tags: z.array(z.string()).optional().describe("タグ"),
  ...commonOptional,
});
export const relationshipUpdate = relationshipCreate.partial();

// ---- Goals ----
export const goalCreate = z.object({
  type: z.string().describe("タイプ (short_term/mid_term/long_term/life)"),
  title: z.string().describe("タイトル"),
  description: z.string().optional().describe("説明"),
  status: z.string().optional().describe("ステータス (active/completed/paused/abandoned)"),
  progress: z.coerce.number().int().min(0).max(100).optional().describe("進捗 (0-100)"),
  target_date: z.string().optional().describe("目標日 (YYYY-MM-DD)"),
  milestones: z.array(z.record(z.unknown())).optional().describe("マイルストーン [{title, done, date}]"),
  tags: z.array(z.string()).optional().describe("タグ"),
  ...commonOptional,
});
export const goalUpdate = goalCreate.partial();

// ---- Custom Categories ----
export const customCategoryCreate = z.object({
  name: z.string().describe("カテゴリ名"),
  description: z.string().optional().describe("説明"),
  schema_hint: z.record(z.unknown()).optional().describe("期待フィールドのヒント"),
});
export const customCategoryUpdate = customCategoryCreate.partial();

// ---- Custom Entries ----
export const customEntryCreate = z.object({
  category_id: z.string().describe("カテゴリID"),
  title: z.string().describe("タイトル"),
  content: z.record(z.unknown()).describe("コンテンツ (自由形式JSON)"),
  tags: z.array(z.string()).optional().describe("タグ"),
  ...commonOptional,
});
export const customEntryUpdate = customEntryCreate.partial();

// ---- Personas ----
export const personaCreate = z.object({
  name: z.string().describe("ペルソナ名 (例: professional, interview)"),
  description: z.string().optional().describe("説明"),
  system_instruction: z.string().optional().describe("AIへの指示"),
  tone: z.string().optional().describe("トーン (formal/casual/confident/expressive)"),
  language: z.string().optional().describe("言語 (auto/ja/en)"),
  entity_weights: z.record(z.coerce.number()).optional().describe("エンティティ重み付け (例: {skills: 2.0, hobbies: 0})"),
  include_private: z.boolean().optional().describe("非公開データを含めるか"),
  exclude_entities: z.array(z.string()).optional().describe("除外するエンティティタイプ"),
  min_importance: z.coerce.number().int().min(1).max(10).optional().describe("最低重要度フィルタ"),
  min_confidence: z.coerce.number().int().min(1).max(10).optional().describe("最低確信度フィルタ"),
  time_decay_days: z.coerce.number().int().optional().describe("半減期（日数）"),
  max_entries_per_type: z.coerce.number().int().optional().describe("タイプ別最大エントリ数"),
  ...commonOptional,
});
export const personaUpdate = personaCreate.partial();

/** Schema registry: maps entity name to create/update schemas */
export const schemaRegistry = {
  profiles: { create: profileCreate, update: profileUpdate },
  career_entries: { create: careerEntryCreate, update: careerEntryUpdate },
  skills: { create: skillCreate, update: skillUpdate },
  projects: { create: projectCreate, update: projectUpdate },
  achievements: { create: achievementCreate, update: achievementUpdate },
  episodes: { create: episodeCreate, update: episodeUpdate },
  education: { create: educationCreate, update: educationUpdate },
  hobbies: { create: hobbyCreate, update: hobbyUpdate },
  values_philosophy: { create: valuePhilosophyCreate, update: valuePhilosophyUpdate },
  health_entries: { create: healthEntryCreate, update: healthEntryUpdate },
  life_events: { create: lifeEventCreate, update: lifeEventUpdate },
  relationships: { create: relationshipCreate, update: relationshipUpdate },
  goals: { create: goalCreate, update: goalUpdate },
  custom_categories: { create: customCategoryCreate, update: customCategoryUpdate },
  custom_entries: { create: customEntryCreate, update: customEntryUpdate },
  personas: { create: personaCreate, update: personaUpdate },
} as const;

export type EntityName = keyof typeof schemaRegistry;
