import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getClient } from "../db/client.js";
import { getProfileId } from "../utils/profile-resolver.js";
import { formatSuccess, formatErrorResponse, formatError } from "../utils/errors.js";
import { ENTRY_TYPES } from "../db/types.js";

const SEARCHABLE_TABLES = [
  "profiles",
  "career_entries",
  "skills",
  "projects",
  "achievements",
  "episodes",
  "education",
  "values_philosophy",
  "life_events",
  "goals",
  "custom_entries",
] as const;

/** Map table names to their primary searchable text columns */
function getSearchColumns(table: string): string[] {
  const map: Record<string, string[]> = {
    profiles: ["name", "name_en", "title", "bio", "tagline"],
    career_entries: ["role", "organization", "summary", "domain"],
    skills: ["name", "category", "evidence"],
    projects: ["name", "description", "type"],
    achievements: ["name", "detail", "type"],
    episodes: ["title", "situation", "action", "result"],
    education: ["institution", "field", "description"],
    values_philosophy: ["title", "description"],
    life_events: ["title", "description"],
    goals: ["title", "description"],
    custom_entries: ["title"],
  };
  return map[table] || ["title"];
}

export function registerSearchTools(server: McpServer): void {
  server.tool(
    "search",
    "全テーブル横断のフルテキスト検索",
    {
      query: z.string().describe("検索クエリ"),
      tables: z
        .array(z.enum(SEARCHABLE_TABLES))
        .optional()
        .describe("検索対象テーブル (省略時は全テーブル)"),
      limit: z.coerce.number().int().min(1).max(50).optional().describe("テーブルあたりの取得件数 (デフォルト: 10)"),
    },
    async ({ query, tables, limit = 10 }) => {
      try {
        const profileId = await getProfileId();
        const searchTables = tables || SEARCHABLE_TABLES;

        const results: Record<string, unknown[]> = {};

        await Promise.all(
          searchTables.map(async (table) => {
            // Use ilike fallback for Japanese text (tsvector 'simple' config
            // tokenizes by whitespace, which doesn't work well for Japanese)
            const words = query.trim().split(/\s+/).filter(Boolean);
            let q = getClient()
              .from(table)
              .select("*")
              .limit(limit);

            // Chain OR-based ilike filters on the search-relevant text columns
            // Using .or() with ilike patterns across key columns
            const textColumns = getSearchColumns(table);
            const orConditions = words
              .flatMap((w) =>
                textColumns.map((col) => `${col}.ilike.%${w}%`)
              )
              .join(",");
            q = q.or(orConditions);

            if (table !== "profiles") {
              q = q.eq("profile_id", profileId);
            }

            const { data, error } = await q;
            if (!error && data && data.length > 0) {
              results[table] = data;
            }
          })
        );

        return formatSuccess({
          query,
          results,
          tables_searched: searchTables.length,
          total_hits: Object.values(results).reduce((sum, arr) => sum + arr.length, 0),
        });
      } catch (e) {
        return formatErrorResponse(formatError(e));
      }
    }
  );
}
