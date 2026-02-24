import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getClient } from "../db/client.js";
import { getProfileId, clearProfileCache } from "../utils/profile-resolver.js";
import { schemaRegistry, type EntityName } from "../schemas/index.js";
import { formatSuccess, formatErrorResponse, formatError } from "../utils/errors.js";

const TABLES_WITHOUT_PROFILE_ID = ["profiles"];

const SUGGESTION_THRESHOLD = 200;

const operationSchema = z.object({
  action: z.enum(["create", "update", "delete"]).describe("操作タイプ"),
  table: z.string().describe("テーブル名 (schemaRegistry のキー)"),
  id: z.string().optional().describe("エントリID (update/delete 時は必須)"),
  data: z.record(z.unknown()).optional().describe("データ (create/update 時は必須)"),
});

interface OperationResult {
  index: number;
  action: string;
  table: string;
  success: boolean;
  id?: string;
  error?: string;
}

export function registerBatchTools(server: McpServer): void {
  server.tool(
    "batch_operations",
    "複数テーブルへの create/update/delete を1回で実行。近況報告などをまとめてDBに反映する際に使う",
    {
      operations: z
        .array(operationSchema)
        .min(1)
        .max(50)
        .describe("実行する操作の配列 (最大50件)"),
    },
    async ({ operations }, extra) => {
      try {
        const profileId = await getProfileId(extra.authInfo);
        const client = getClient();
        const results: OperationResult[] = [];
        let created = 0;
        let updated = 0;
        let deleted = 0;
        let failed = 0;
        let hasCreate = false;
        let profilesModified = false;

        for (let i = 0; i < operations.length; i++) {
          const op = operations[i];
          const result: OperationResult = {
            index: i,
            action: op.action,
            table: op.table,
            success: false,
          };

          try {
            // Validate table exists in schema registry
            const schema = (schemaRegistry as Record<string, { create: z.ZodType; update: z.ZodType }>)[op.table];
            if (!schema) {
              result.error = `Unknown table: ${op.table}`;
              failed++;
              results.push(result);
              continue;
            }

            switch (op.action) {
              case "create": {
                hasCreate = true;
                if (!op.data) {
                  result.error = "data is required for create";
                  failed++;
                  results.push(result);
                  continue;
                }

                const parsed = schema.create.safeParse(op.data);
                if (!parsed.success) {
                  result.error = `Validation error: ${parsed.error.message}`;
                  failed++;
                  results.push(result);
                  continue;
                }

                const insertData = parsed.data as Record<string, unknown>;
                if (!TABLES_WITHOUT_PROFILE_ID.includes(op.table)) {
                  insertData.profile_id = profileId;
                }

                const { data: row, error } = await client
                  .from(op.table)
                  .insert(insertData)
                  .select("id")
                  .single();

                if (error) {
                  result.error = `DB error: ${error.message}`;
                  failed++;
                } else {
                  result.success = true;
                  result.id = (row as Record<string, unknown>).id as string;
                  created++;
                  if (op.table === "profiles") profilesModified = true;
                }
                break;
              }

              case "update": {
                if (!op.id) {
                  result.error = "id is required for update";
                  failed++;
                  results.push(result);
                  continue;
                }
                if (!op.data) {
                  result.error = "data is required for update";
                  failed++;
                  results.push(result);
                  continue;
                }

                const parsed = schema.update.safeParse(op.data);
                if (!parsed.success) {
                  result.error = `Validation error: ${parsed.error.message}`;
                  failed++;
                  results.push(result);
                  continue;
                }

                const { error } = await client
                  .from(op.table)
                  .update(parsed.data as Record<string, unknown>)
                  .eq("id", op.id);

                if (error) {
                  result.error = `DB error: ${error.message}`;
                  failed++;
                } else {
                  result.success = true;
                  result.id = op.id;
                  updated++;
                  if (op.table === "profiles") profilesModified = true;
                }
                break;
              }

              case "delete": {
                if (!op.id) {
                  result.error = "id is required for delete";
                  failed++;
                  results.push(result);
                  continue;
                }

                const { error } = await client
                  .from(op.table)
                  .delete()
                  .eq("id", op.id);

                if (error) {
                  result.error = `DB error: ${error.message}`;
                  failed++;
                } else {
                  result.success = true;
                  result.id = op.id;
                  deleted++;
                }
                break;
              }
            }
          } catch (e) {
            result.error = formatError(e);
            failed++;
          }

          results.push(result);
        }

        if (profilesModified) {
          clearProfileCache();
        }

        const succeeded = created + updated + deleted;
        const response: Record<string, unknown> = {
          results,
          summary: {
            total: operations.length,
            succeeded,
            failed,
            created,
            updated,
            deleted,
          },
        };

        // Proactive compression suggestion (only when creates are involved)
        if (hasCreate && succeeded > 0) {
          try {
            const tables = Object.keys(schemaRegistry).filter(
              (t) => !["profiles", "custom_categories", "personas"].includes(t)
            );
            let totalEntries = 0;
            await Promise.all(
              tables.map(async (table) => {
                let query = client
                  .from(table)
                  .select("id", { count: "exact", head: true });
                if (!TABLES_WITHOUT_PROFILE_ID.includes(table)) {
                  query = query.eq("profile_id", profileId);
                }
                const { count } = await query;
                totalEntries += count ?? 0;
              })
            );

            if (totalEntries > SUGGESTION_THRESHOLD) {
              response.suggestion = {
                message: `プロフィールが${totalEntries}件のエントリを保持しています。analyze_profile で整理を検討してください`,
                total_entries: totalEntries,
                threshold: SUGGESTION_THRESHOLD,
              };
            }
          } catch {
            // Suggestion is best-effort, ignore errors
          }
        }

        return formatSuccess(response);
      } catch (e) {
        return formatErrorResponse(formatError(e));
      }
    }
  );
}
