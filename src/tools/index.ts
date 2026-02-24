import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerCrudTools } from "./crud-factory.js";
import { registerSearchTools } from "./search.js";
import { registerTagTools } from "./tags.js";
import { registerRelationTools } from "./relations.js";
import { registerBulkTools } from "./bulk.js";
import { registerBatchTools } from "./batch.js";
import { registerAnalyzeTools } from "./analyze.js";
import { registerStatsTools } from "./stats.js";
import { registerContextTools } from "../context/index.js";
import { schemaRegistry } from "../schemas/index.js";
import { getProfileId } from "../utils/profile-resolver.js";
import { getRequestAuth } from "../auth/request-context.js";

/** Entity configurations for CRUD factory */
const entityConfigs = [
  { table: "profiles", label: "プロフィール" },
  { table: "career_entries", label: "経歴", orderBy: "period_start" },
  { table: "skills", label: "スキル", orderBy: "category" },
  { table: "projects", label: "プロジェクト", orderBy: "period_start" },
  { table: "achievements", label: "実績", orderBy: "year" },
  { table: "episodes", label: "エピソード" },
  { table: "education", label: "学歴・教育" },
  { table: "hobbies", label: "趣味" },
  { table: "values_philosophy", label: "価値観・哲学" },
  { table: "health_entries", label: "健康エントリ" },
  { table: "life_events", label: "ライフイベント", orderBy: "event_date" },
  { table: "relationships", label: "人間関係" },
  { table: "goals", label: "目標" },
  { table: "custom_categories", label: "カスタムカテゴリ" },
  { table: "custom_entries", label: "カスタムエントリ" },
  { table: "personas", label: "ペルソナ" },
] as const;

export function registerTools(server: McpServer): void {
  // Register CRUD tools for each entity (5 tools × 16 entities = 80 tools)
  for (const config of entityConfigs) {
    const table = config.table as keyof typeof schemaRegistry;
    const schemas = schemaRegistry[table];
    registerCrudTools(server, {
      table: config.table,
      label: config.label,
      createSchema: schemas.create,
      updateSchema: schemas.update,
      orderBy: "orderBy" in config ? config.orderBy : undefined,
    });
  }

  // Register advanced tools
  registerSearchTools(server);
  registerTagTools(server);
  registerRelationTools(server);
  registerBulkTools(server);
  registerBatchTools(server);
  registerAnalyzeTools(server);
  registerStatsTools(server);
  registerContextTools(server);

  // DEBUG: auth diagnostic tool
  server.tool(
    "debug_auth",
    "認証デバッグ",
    {},
    async (_args, extra) => {
      const reqAuth = getRequestAuth();
      const resolved = await getProfileId(extra.authInfo);
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            hasAuthInfo: !!extra.authInfo,
            authInfoExtra: (extra.authInfo as any)?.extra ?? null,
            asyncLocalStorage: reqAuth ?? null,
            resolvedProfileId: resolved,
          }, null, 2),
        }],
      };
    }
  );
}
