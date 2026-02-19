/** Common fields shared by all entry tables */
export interface CommonFields {
  id: string;
  importance: number;
  confidence: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Profile extends CommonFields {
  name: string;
  name_en?: string;
  title?: string;
  title_full?: string;
  organization?: string;
  tagline?: string;
  bio?: string;
  personality_type?: string;
  personality_traits?: string[];
  career_years?: number;
  urls?: Record<string, string>;
  mission?: string;
  vision?: string;
  core_values?: string[];
  speech_style?: string;
  tone?: string;
  catchphrases?: string[];
  stance?: string;
  social_proof?: Record<string, unknown>;
  products?: Array<Record<string, unknown>>;
  credentials?: Array<Record<string, unknown>>;
  tech_stack?: Record<string, string[]>;
}

export interface CareerEntry extends CommonFields {
  profile_id: string;
  role: string;
  organization?: string;
  org_type?: string;
  domain?: string;
  period_start?: string;
  period_end?: string;
  period_year?: number;
  summary?: string;
  insights?: string[];
  mention_tone?: string;
  mentionable?: boolean;
  tags?: string[];
}

export interface Skill extends CommonFields {
  profile_id: string;
  name: string;
  category: string;
  proficiency?: number;
  years_experience?: number;
  evidence?: string;
  tags?: string[];
}

export interface Project extends CommonFields {
  profile_id: string;
  name: string;
  type?: string;
  description?: string;
  role?: string;
  technologies?: string[];
  outcomes?: string[];
  lessons?: string[];
  url?: string;
  period_start?: string;
  period_end?: string;
  tags?: string[];
}

export interface Achievement extends CommonFields {
  profile_id: string;
  type: string;
  name: string;
  detail?: string;
  issuer?: string;
  year?: number;
  url?: string;
  tags?: string[];
}

export interface Episode extends CommonFields {
  profile_id: string;
  title: string;
  type: string;
  domain?: string;
  situation?: string;
  task?: string;
  action?: string;
  result?: string;
  insights?: string[];
  emotions?: string[];
  mention_tone?: string;
  mentionable?: boolean;
  period_start?: string;
  period_end?: string;
  tags?: string[];
}

export interface Education extends CommonFields {
  profile_id: string;
  type: string;
  institution?: string;
  field?: string;
  degree?: string;
  period_start?: string;
  period_end?: string;
  description?: string;
  tags?: string[];
}

export interface Hobby extends CommonFields {
  profile_id: string;
  name: string;
  passion_level?: number;
  description?: string;
  related_skills?: string[];
  tags?: string[];
}

export interface ValuePhilosophy extends CommonFields {
  profile_id: string;
  type: string;
  title: string;
  description?: string;
  origin?: string;
  tags?: string[];
}

export interface HealthEntry extends CommonFields {
  profile_id: string;
  type: string;
  title: string;
  description?: string;
  is_private: boolean;
  tags?: string[];
}

export interface LifeEvent extends CommonFields {
  profile_id: string;
  type: string;
  title: string;
  description?: string;
  impact?: string;
  event_date?: string;
  tags?: string[];
}

export interface Relationship extends CommonFields {
  profile_id: string;
  type: string;
  alias: string;
  real_name?: string;
  description?: string;
  influence?: string;
  is_private: boolean;
  tags?: string[];
}

export interface Goal extends CommonFields {
  profile_id: string;
  type: string;
  title: string;
  description?: string;
  status: string;
  progress: number;
  target_date?: string;
  milestones?: Array<Record<string, unknown>>;
  tags?: string[];
}

export interface CustomCategory extends Omit<CommonFields, "importance" | "confidence"> {
  profile_id: string;
  name: string;
  description?: string;
  schema_hint?: Record<string, unknown>;
}

export interface CustomEntry extends CommonFields {
  profile_id: string;
  category_id: string;
  title: string;
  content: Record<string, unknown>;
  tags?: string[];
}

export interface Tag {
  id: string;
  name: string;
  category?: string;
  created_at: string;
}

export interface EntryTag {
  id: string;
  tag_id: string;
  entry_type: string;
  entry_id: string;
  created_at: string;
}

export interface EntryRelation {
  id: string;
  source_type: string;
  source_id: string;
  target_type: string;
  target_id: string;
  relation_type: string;
  description?: string;
  created_at: string;
}

export interface Persona extends CommonFields {
  profile_id: string;
  name: string;
  description?: string;
  system_instruction?: string;
  tone?: string;
  language?: string;
  entity_weights?: Record<string, number>;
  include_private?: boolean;
  exclude_entities?: string[];
  min_importance?: number;
  min_confidence?: number;
  time_decay_days?: number;
  max_entries_per_type?: number;
}

/** Valid entry types for polymorphic references */
export const ENTRY_TYPES = [
  "profiles",
  "career_entries",
  "skills",
  "projects",
  "achievements",
  "episodes",
  "education",
  "hobbies",
  "values_philosophy",
  "health_entries",
  "life_events",
  "relationships",
  "goals",
  "custom_entries",
  "personas",
] as const;

export type EntryType = (typeof ENTRY_TYPES)[number];
