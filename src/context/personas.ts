import { getClient } from "../db/client.js";
import { getProfileId } from "../utils/profile-resolver.js";

/** Resolved persona configuration used by the context generator */
export interface ResolvedPersona {
  name: string;
  description?: string;
  system_instruction?: string;
  tone?: string;
  language: string;
  entity_weights: Record<string, number>;
  include_private: boolean;
  exclude_entities: string[];
  min_importance: number;
  min_confidence: number;
  time_decay_days: number;
  max_entries_per_type: number;
}

/** All entity table names that can be weighted */
export const CONTEXTABLE_ENTITIES = [
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
  "favorite_books",
  "favorite_quotes",
  "influences",
  "daily_routines",
  "favorite_tools",
  "faq",
  "custom_entries",
] as const;

export type ContextableEntity = (typeof CONTEXTABLE_ENTITIES)[number];

const PRESET_PERSONAS: Record<string, ResolvedPersona> = {
  default: {
    name: "default",
    description: "Balanced view of all data",
    system_instruction: "Present a well-rounded picture of this person.",
    tone: "neutral",
    language: "auto",
    entity_weights: {},
    include_private: false,
    exclude_entities: [],
    min_importance: 3,
    min_confidence: 1,
    time_decay_days: 1825,
    max_entries_per_type: 20,
  },
  professional: {
    name: "professional",
    description: "Work-focused professional profile",
    system_instruction:
      "Present as a competent professional. Emphasize career achievements, technical skills, and professional growth.",
    tone: "formal",
    language: "auto",
    entity_weights: {
      career_entries: 2.0,
      skills: 2.0,
      achievements: 2.0,
      projects: 1.5,
      episodes: 1.0,
      education: 1.0,
      health_entries: 0,
      relationships: 0,
      daily_routines: 0,
    },
    include_private: false,
    exclude_entities: ["health_entries", "relationships", "daily_routines"],
    min_importance: 4,
    min_confidence: 1,
    time_decay_days: 1825,
    max_entries_per_type: 20,
  },
  interview: {
    name: "interview",
    description: "Interview preparation focus",
    system_instruction:
      "Prepare for job interviews. Highlight career highlights, achievements, key episodes (STAR format), and strongest skills.",
    tone: "confident",
    language: "auto",
    entity_weights: {
      career_entries: 2.0,
      achievements: 2.0,
      episodes: 2.0,
      skills: 1.5,
      projects: 1.5,
      education: 1.0,
      health_entries: 0,
      relationships: 0,
    },
    include_private: false,
    exclude_entities: ["health_entries", "relationships"],
    min_importance: 5,
    min_confidence: 1,
    time_decay_days: 1825,
    max_entries_per_type: 15,
  },
  personal: {
    name: "personal",
    description: "Personal/private life focus",
    system_instruction:
      "Present the personal side — values, hobbies, life events, books, and personal philosophy.",
    tone: "casual",
    language: "auto",
    entity_weights: {
      values_philosophy: 2.0,
      hobbies: 2.0,
      life_events: 2.0,
      favorite_books: 2.0,
      favorite_quotes: 2.0,
      influences: 2.0,
      relationships: 1.5,
      daily_routines: 1.5,
    },
    include_private: true,
    exclude_entities: [],
    min_importance: 3,
    min_confidence: 1,
    time_decay_days: 3650,
    max_entries_per_type: 20,
  },
  creative: {
    name: "creative",
    description: "Creative and expressive focus",
    system_instruction:
      "Present the creative and expressive side — values, influences, favorite books and quotes, and personal philosophy.",
    tone: "expressive",
    language: "auto",
    entity_weights: {
      values_philosophy: 2.0,
      favorite_books: 2.0,
      favorite_quotes: 2.0,
      influences: 2.0,
      hobbies: 1.5,
      episodes: 1.0,
      health_entries: 0,
    },
    include_private: false,
    exclude_entities: ["health_entries"],
    min_importance: 3,
    min_confidence: 1,
    time_decay_days: 3650,
    max_entries_per_type: 20,
  },
};

/**
 * Resolve a persona by name.
 * Checks presets first, then looks up custom personas in the database.
 */
export async function resolvePersona(
  name?: string
): Promise<ResolvedPersona> {
  const personaName = name || "default";

  // Check presets
  if (PRESET_PERSONAS[personaName]) {
    return PRESET_PERSONAS[personaName];
  }

  // Look up custom persona in DB
  const profileId = await getProfileId();
  const { data, error } = await getClient()
    .from("personas")
    .select("*")
    .eq("profile_id", profileId)
    .eq("name", personaName)
    .limit(1)
    .single();

  if (error || !data) {
    // Fall back to default
    return PRESET_PERSONAS["default"];
  }

  const row = data as Record<string, unknown>;
  return {
    name: row.name as string,
    description: row.description as string | undefined,
    system_instruction: row.system_instruction as string | undefined,
    tone: row.tone as string | undefined,
    language: (row.language as string) || "auto",
    entity_weights: (row.entity_weights as Record<string, number>) || {},
    include_private: (row.include_private as boolean) || false,
    exclude_entities: (row.exclude_entities as string[]) || [],
    min_importance: (row.min_importance as number) || 1,
    min_confidence: (row.min_confidence as number) || 1,
    time_decay_days: (row.time_decay_days as number) || 1825,
    max_entries_per_type: (row.max_entries_per_type as number) || 20,
  };
}

/** List available persona names (presets + custom) */
export async function listAvailablePersonas(): Promise<string[]> {
  const presets = Object.keys(PRESET_PERSONAS);
  try {
    const profileId = await getProfileId();
    const { data } = await getClient()
      .from("personas")
      .select("name")
      .eq("profile_id", profileId);
    const custom = (data || []).map(
      (r: Record<string, unknown>) => r.name as string
    );
    return [...presets, ...custom];
  } catch {
    return presets;
  }
}
