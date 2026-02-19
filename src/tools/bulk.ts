import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getClient } from "../db/client.js";
import { getProfileId } from "../utils/profile-resolver.js";
import { ENTRY_TYPES, type EntryType } from "../db/types.js";
import { schemaRegistry, type EntityName } from "../schemas/index.js";
import { formatSuccess, formatErrorResponse, formatError } from "../utils/errors.js";

const TABLES_WITHOUT_PROFILE_ID = ["profiles"];

export function registerBulkTools(server: McpServer): void {
  // Bulk import
  server.tool(
    "bulk_import",
    "JSON一括インポート。複数テーブルのデータを一度にインポート",
    {
      data: z
        .record(z.array(z.record(z.unknown())))
        .describe("テーブル名をキー、エントリ配列を値とするオブジェクト"),
    },
    async ({ data }, extra) => {
      try {
        const profileId = await getProfileId(extra.authInfo);
        const results: Record<string, { inserted: number; errors: string[] }> = {};

        for (const [table, entries] of Object.entries(data)) {
          const schema = (schemaRegistry as Record<string, { create: z.ZodType }>)[table];
          if (!schema) {
            results[table] = { inserted: 0, errors: [`Unknown table: ${table}`] };
            continue;
          }

          const errors: string[] = [];
          const validEntries: Record<string, unknown>[] = [];

          for (let i = 0; i < entries.length; i++) {
            const parsed = schema.create.safeParse(entries[i]);
            if (!parsed.success) {
              errors.push(`[${i}]: ${parsed.error.message}`);
              continue;
            }
            const entry = parsed.data as Record<string, unknown>;
            if (!TABLES_WITHOUT_PROFILE_ID.includes(table)) {
              entry.profile_id = profileId;
            }
            validEntries.push(entry);
          }

          if (validEntries.length > 0) {
            const { error } = await getClient().from(table).insert(validEntries);
            if (error) {
              errors.push(`DB error: ${error.message}`);
              results[table] = { inserted: 0, errors };
            } else {
              results[table] = { inserted: validEntries.length, errors };
            }
          } else {
            results[table] = { inserted: 0, errors };
          }
        }

        return formatSuccess(results);
      } catch (e) {
        return formatErrorResponse(formatError(e));
      }
    }
  );

  // Bulk export
  server.tool(
    "bulk_export",
    "全データまたは指定テーブルのJSON一括エクスポート",
    {
      tables: z
        .array(z.string())
        .optional()
        .describe("エクスポート対象テーブル (省略時は全テーブル)"),
      include_private: z
        .boolean()
        .optional()
        .describe("非公開データを含めるか (デフォルト: false)"),
    },
    async ({ tables, include_private = false }, extra) => {
      try {
        const profileId = await getProfileId(extra.authInfo);
        const targetTables = tables || Object.keys(schemaRegistry);
        const result: Record<string, unknown[]> = {};

        await Promise.all(
          targetTables.map(async (table) => {
            let query = getClient().from(table).select("*");

            if (!TABLES_WITHOUT_PROFILE_ID.includes(table)) {
              query = query.eq("profile_id", profileId);
            }

            // Filter private data
            if (!include_private) {
              if (table === "health_entries" || table === "relationships") {
                query = query.eq("is_private", false);
              }
            }

            const { data } = await query;
            if (data && data.length > 0) {
              result[table] = data;
            }
          })
        );

        return formatSuccess(result);
      } catch (e) {
        return formatErrorResponse(formatError(e));
      }
    }
  );
}
