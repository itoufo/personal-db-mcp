import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getClient } from "../db/client.js";
import { getProfileId } from "../utils/profile-resolver.js";
import { schemaRegistry } from "../schemas/index.js";
import { formatSuccess, formatErrorResponse, formatError } from "../utils/errors.js";

const TABLES_WITHOUT_PROFILE_ID = ["profiles"];

export function registerStatsTools(server: McpServer): void {
  server.tool(
    "get_stats",
    "カテゴリ別の統計情報を取得（エントリ数、最終更新等）",
    {},
    async () => {
      try {
        const profileId = await getProfileId();
        const stats: Record<string, { count: number; last_updated?: string }> = {};

        await Promise.all(
          Object.keys(schemaRegistry).map(async (table) => {
            let query = getClient()
              .from(table)
              .select("updated_at", { count: "exact", head: false })
              .order("updated_at", { ascending: false })
              .limit(1);

            if (!TABLES_WITHOUT_PROFILE_ID.includes(table)) {
              query = query.eq("profile_id", profileId);
            }

            const { count, data } = await query;
            stats[table] = {
              count: count || 0,
              last_updated: data?.[0]?.updated_at,
            };
          })
        );

        return formatSuccess(stats);
      } catch (e) {
        return formatErrorResponse(formatError(e));
      }
    }
  );
}
