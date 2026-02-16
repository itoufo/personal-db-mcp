import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getClient } from "../db/client.js";
import { ENTRY_TYPES } from "../db/types.js";
import { formatSuccess, formatErrorResponse, formatError } from "../utils/errors.js";

const RELATION_TYPES = [
  "demonstrated_in",
  "led_to",
  "related_to",
  "inspired_by",
  "enabled_by",
  "resulted_in",
  "learned_from",
  "applied_in",
] as const;

export function registerRelationTools(server: McpServer): void {
  // Create relation
  server.tool(
    "create_relation",
    "エントリ間の関連を作成 (例: エピソードがスキルを実証, 経歴がプロジェクトに繋がった等)",
    {
      source_type: z.enum(ENTRY_TYPES).describe("関連元テーブル名"),
      source_id: z.string().describe("関連元ID"),
      target_type: z.enum(ENTRY_TYPES).describe("関連先テーブル名"),
      target_id: z.string().describe("関連先ID"),
      relation_type: z.enum(RELATION_TYPES).describe("関連タイプ"),
      description: z.string().optional().describe("関連の説明"),
    },
    async (params) => {
      try {
        const { data, error } = await getClient()
          .from("entry_relations")
          .insert(params)
          .select()
          .single();
        if (error) return formatErrorResponse(error.message);
        return formatSuccess(data);
      } catch (e) {
        return formatErrorResponse(formatError(e));
      }
    }
  );

  // Get relations for an entry
  server.tool(
    "get_relations",
    "エントリの関連を取得",
    {
      entry_type: z.enum(ENTRY_TYPES).describe("テーブル名"),
      entry_id: z.string().describe("エントリID"),
      direction: z
        .enum(["outgoing", "incoming", "both"])
        .optional()
        .describe("方向 (デフォルト: both)"),
    },
    async ({ entry_type, entry_id, direction = "both" }) => {
      try {
        const results: Record<string, unknown[]> = {};

        if (direction === "outgoing" || direction === "both") {
          const { data } = await getClient()
            .from("entry_relations")
            .select("*")
            .eq("source_type", entry_type)
            .eq("source_id", entry_id);
          if (data) results.outgoing = data;
        }

        if (direction === "incoming" || direction === "both") {
          const { data } = await getClient()
            .from("entry_relations")
            .select("*")
            .eq("target_type", entry_type)
            .eq("target_id", entry_id);
          if (data) results.incoming = data;
        }

        return formatSuccess(results);
      } catch (e) {
        return formatErrorResponse(formatError(e));
      }
    }
  );

  // Delete relation
  server.tool(
    "delete_relation",
    "エントリ間の関連を削除",
    { id: z.string().describe("関連ID") },
    async ({ id }) => {
      try {
        const { error } = await getClient()
          .from("entry_relations")
          .delete()
          .eq("id", id);
        if (error) return formatErrorResponse(error.message);
        return formatSuccess({ deleted: true, id });
      } catch (e) {
        return formatErrorResponse(formatError(e));
      }
    }
  );
}
