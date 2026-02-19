import { getClient } from "../db/client.js";
import { getProfileId } from "../utils/profile-resolver.js";
import { resolvePersona, CONTEXTABLE_ENTITIES } from "./personas.js";
import type { ResolvedPersona } from "./personas.js";
import { scoreEntries } from "./scoring.js";
import type { ScoredEntry } from "./scoring.js";
import { renderEntry, ENTITY_LABELS } from "./renderers.js";

export interface GenerateContextOptions {
  persona?: string;
  focus?: string;
  max_tokens_hint?: number;
}

interface EntitySection {
  entityType: string;
  label: string;
  weight: number;
  entries: ScoredEntry[];
  totalCount: number;
}

/**
 * Generate a weighted, persona-driven Markdown context document.
 */
export async function generateContext(
  options: GenerateContextOptions = {}
): Promise<string> {
  const { persona: personaName, focus, max_tokens_hint = 4000 } = options;

  const persona = await resolvePersona(personaName);
  const profileId = await getProfileId();

  // Fetch profile
  const { data: profile } = await getClient()
    .from("profiles")
    .select("*")
    .limit(1)
    .single();

  // Determine which entities to fetch
  const entitiesToFetch = CONTEXTABLE_ENTITIES.filter((e) => {
    if (persona.exclude_entities.includes(e)) return false;
    const weight = persona.entity_weights[e] ?? 1.0;
    return weight > 0;
  });

  // Fetch all entities in parallel
  const entityResults = await Promise.all(
    entitiesToFetch.map(async (entityType) => {
      let query = getClient()
        .from(entityType)
        .select("*", { count: "exact" })
        .eq("profile_id", profileId)
        .gte("importance", persona.min_importance)
        .gte("confidence", persona.min_confidence);

      // Filter private data if not included
      if (!persona.include_private) {
        if (entityType === "health_entries" || entityType === "relationships") {
          query = query.eq("is_private", false);
        }
        if (entityType === "faq") {
          query = query.eq("is_public", true);
        }
      }

      // Limit per type
      query = query.limit(persona.max_entries_per_type);

      const { data, count } = await query;
      return { entityType, data: (data || []) as Record<string, unknown>[], totalCount: count || 0 };
    })
  );

  // Score and organize entries
  const sections: EntitySection[] = entityResults
    .map(({ entityType, data, totalCount }) => {
      const weight = persona.entity_weights[entityType] ?? 1.0;
      const scored = scoreEntries(data, entityType, persona, focus);
      return {
        entityType,
        label: ENTITY_LABELS[entityType] || entityType,
        weight,
        entries: scored,
        totalCount,
      };
    })
    .filter((s) => s.entries.length > 0)
    .sort((a, b) => {
      // Sort by weight desc, then by total score desc
      if (b.weight !== a.weight) return b.weight - a.weight;
      const aScore = a.entries.reduce((sum, e) => sum + e.score, 0);
      const bScore = b.entries.reduce((sum, e) => sum + e.score, 0);
      return bScore - aScore;
    });

  // Render the context document
  return renderDocument(profile as Record<string, unknown>, persona, sections, focus, max_tokens_hint);
}

function renderDocument(
  profile: Record<string, unknown> | null,
  persona: ResolvedPersona,
  sections: EntitySection[],
  focus: string | undefined,
  maxTokensHint: number
): string {
  const lines: string[] = [];

  // Header
  const profileName = profile?.name || "Unknown";
  lines.push(`# Context: ${profileName} (Persona: ${persona.name})`);

  // Instructions block
  if (persona.system_instruction || persona.tone) {
    const parts: string[] = [];
    if (persona.system_instruction)
      parts.push(`**Instructions**: ${persona.system_instruction}`);
    if (persona.tone) parts.push(`**Tone**: ${persona.tone}`);
    lines.push(`> ${parts.join("\n> ")}`);
  }

  if (focus) {
    lines.push(`> **Focus**: ${focus}`);
  }

  lines.push("");

  // Profile section
  if (profile) {
    lines.push("## Profile");
    const profileFields: [string, string][] = [
      ["name", "Name"],
      ["title", "Title"],
      ["organization", "Organization"],
      ["tagline", "Tagline"],
      ["bio", "Bio"],
      ["mission", "Mission"],
      ["vision", "Vision"],
    ];
    for (const [key, label] of profileFields) {
      if (profile[key]) lines.push(`- **${label}**: ${profile[key]}`);
    }
    const coreValues = profile.core_values as string[] | undefined;
    if (coreValues?.length) {
      lines.push(`- **Core Values**: ${coreValues.join(", ")}`);
    }
    const personalityTraits = profile.personality_traits as string[] | undefined;
    if (personalityTraits?.length) {
      lines.push(`- **Personality**: ${personalityTraits.join(", ")}`);
    }
    if (profile.personality_type) {
      lines.push(`- **Type**: ${profile.personality_type}`);
    }
    lines.push("");
  }

  // Entity sections — budget-aware rendering
  // Rough estimate: 1 token ≈ 4 chars
  const charBudget = maxTokensHint * 4;
  let usedChars = lines.join("\n").length;

  for (const section of sections) {
    if (usedChars >= charBudget) break;

    const weightLabel =
      section.weight !== 1.0 ? `, weight: ${section.weight}x` : "";
    const sectionHeader = `## ${section.label} (${section.entries.length} entries${weightLabel})`;
    lines.push(sectionHeader);
    usedChars += sectionHeader.length + 1;

    // Group entries by detail level
    const fullEntries = section.entries.filter((e) => e.level === "full");
    const summaryEntries = section.entries.filter((e) => e.level === "summary");
    const mentionEntries = section.entries.filter((e) => e.level === "mention");

    // Render full-detail entries
    for (const se of fullEntries) {
      if (usedChars >= charBudget) break;
      const rendered = renderEntry(
        se.entry,
        section.entityType,
        "full",
        se.score
      );
      lines.push(rendered);
      usedChars += rendered.length + 1;
    }

    // Render summary entries
    for (const se of summaryEntries) {
      if (usedChars >= charBudget) break;
      const rendered = renderEntry(
        se.entry,
        section.entityType,
        "summary",
        se.score
      );
      lines.push(rendered);
      usedChars += rendered.length + 1;
    }

    // Render mentions as comma-joined list
    if (mentionEntries.length > 0 && usedChars < charBudget) {
      const mentionTexts = mentionEntries.map((se) =>
        renderEntry(se.entry, section.entityType, "mention", se.score)
      );
      const mentionLine = `Also: ${mentionTexts.join(", ")}`;
      lines.push(mentionLine);
      usedChars += mentionLine.length + 1;
    }

    lines.push("");
  }

  return lines.join("\n");
}
