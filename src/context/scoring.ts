import type { ResolvedPersona } from "./personas.js";

export type DetailLevel = "full" | "summary" | "mention";

/**
 * Extract the most relevant date from an entry for time-decay calculation.
 * Priority varies by entity type.
 */
export function extractDate(
  entry: Record<string, unknown>,
  entityType: string
): Date {
  const tryParse = (val: unknown): Date | null => {
    if (!val || typeof val !== "string" && typeof val !== "number") return null;
    const d = new Date(val as string | number);
    return isNaN(d.getTime()) ? null : d;
  };

  switch (entityType) {
    case "career_entries":
    case "projects":
    case "episodes":
    case "education":
      return (
        tryParse(entry.period_end) ||
        tryParse(entry.period_start) ||
        tryParse(entry.updated_at) ||
        new Date()
      );
    case "life_events":
      return tryParse(entry.event_date) || tryParse(entry.updated_at) || new Date();
    case "achievements":
    case "favorite_books":
      return (
        tryParse(entry.year ? `${entry.year}-01-01` : null) ||
        tryParse(entry.year_read ? `${entry.year_read}-01-01` : null) ||
        tryParse(entry.updated_at) ||
        new Date()
      );
    default:
      return tryParse(entry.updated_at) || new Date();
  }
}

/**
 * Compute time decay factor using exponential half-life.
 * decay = 2^(-days_since / half_life_days)
 */
function computeTimeDecay(entryDate: Date, halfLifeDays: number): number {
  const now = new Date();
  const daysSince =
    (now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince <= 0) return 1.0;
  return Math.pow(2, -daysSince / halfLifeDays);
}

/**
 * Compute the effective score for an entry.
 * effective_score = (importance/10) × entity_weight × time_decay × (confidence/10)
 */
export function computeScore(
  entry: Record<string, unknown>,
  entityType: string,
  persona: ResolvedPersona
): number {
  const importance = (entry.importance as number) || 5;
  const confidence = (entry.confidence as number) || 8;
  const entityWeight = persona.entity_weights[entityType] ?? 1.0;

  if (entityWeight === 0) return 0;

  const entryDate = extractDate(entry, entityType);
  const timeDecay = computeTimeDecay(entryDate, persona.time_decay_days);

  return (importance / 10) * entityWeight * timeDecay * (confidence / 10);
}

/**
 * Determine detail level based on score.
 * >= 0.6 → full, >= 0.3 → summary, else → mention
 */
export function getDetailLevel(score: number): DetailLevel {
  if (score >= 0.6) return "full";
  if (score >= 0.3) return "summary";
  return "mention";
}

/** Score and categorize a list of entries */
export interface ScoredEntry {
  entry: Record<string, unknown>;
  score: number;
  level: DetailLevel;
}

export function scoreEntries(
  entries: Record<string, unknown>[],
  entityType: string,
  persona: ResolvedPersona,
  focusKeyword?: string
): ScoredEntry[] {
  return entries
    .map((entry) => {
      let score = computeScore(entry, entityType, persona);

      // Focus keyword boost (1.5x)
      if (focusKeyword && matchesFocus(entry, focusKeyword)) {
        score *= 1.5;
      }

      return { entry, score, level: getDetailLevel(score) };
    })
    .sort((a, b) => b.score - a.score);
}

/** Check if an entry matches the focus keyword (case-insensitive) */
function matchesFocus(
  entry: Record<string, unknown>,
  keyword: string
): boolean {
  const kw = keyword.toLowerCase();
  const textFields = [
    "name",
    "title",
    "role",
    "organization",
    "description",
    "summary",
    "evidence",
    "quote",
    "question",
    "answer",
    "impact",
    "why_favorite",
    "review",
    "situation",
    "task",
    "action",
    "result",
    "field",
    "category",
    "domain",
  ];
  for (const field of textFields) {
    const val = entry[field];
    if (typeof val === "string" && val.toLowerCase().includes(kw)) return true;
  }
  // Check array fields
  const arrayFields = [
    "tags",
    "technologies",
    "outcomes",
    "insights",
    "related_skills",
  ];
  for (const field of arrayFields) {
    const arr = entry[field];
    if (
      Array.isArray(arr) &&
      arr.some((v) => typeof v === "string" && v.toLowerCase().includes(kw))
    )
      return true;
  }
  return false;
}
