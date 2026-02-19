import { z, ZodObject, ZodRawShape } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getClient } from "../db/client.js";
import { getProfileId, clearProfileCache } from "../utils/profile-resolver.js";
import { formatSuccess, formatErrorResponse, formatError } from "../utils/errors.js";

interface CrudConfig {
  /** Table name in personal_db schema */
  table: string;
  /** Human-readable entity name (Japanese) */
  label: string;
  /** Zod schema for create */
  createSchema: ZodObject<ZodRawShape>;
  /** Zod schema for update (partial) */
  updateSchema: ZodObject<ZodRawShape>;
  /** Whether this table has profile_id (false for profiles itself) */
  hasProfileId?: boolean;
  /** Fields to select in list (default: all) */
  listSelect?: string;
  /** Default order-by column */
  orderBy?: string;
}

const ENTITIES_WITHOUT_PROFILE_ID = ["profiles"];

/**
 * Register 5 CRUD tools for a given entity:
 * create_{entity}, get_{entity}, list_{entities}, update_{entity}, delete_{entity}
 */
export function registerCrudTools(server: McpServer, config: CrudConfig): void {
  const {
    table,
    label,
    createSchema,
    updateSchema,
    hasProfileId = !ENTITIES_WITHOUT_PROFILE_ID.includes(table),
    listSelect = "*",
    orderBy = "created_at",
  } = config;

  const singular = table.replace(/s$/, "").replace(/ie$/, "y");

  // ---- CREATE ----
  server.tool(
    `create_${singular}`,
    `${label}を新規作成`,
    { data: createSchema },
    async ({ data }) => {
      try {
        const insertData: Record<string, unknown> = { ...data };
        if (hasProfileId) {
          insertData.profile_id = await getProfileId();
        }

        const { data: result, error } = await getClient()
          .from(table)
          .insert(insertData)
          .select()
          .single();

        if (error) return formatErrorResponse(`作成失敗: ${error.message}`);

        // Clear profile cache when a new profile is created
        if (table === "profiles") clearProfileCache();

        return formatSuccess(result);
      } catch (e) {
        return formatErrorResponse(formatError(e));
      }
    }
  );

  // ---- GET ----
  server.tool(
    `get_${singular}`,
    `${label}を取得 (IDで指定)`,
    { id: z.string().describe("エントリID (UUID)") },
    async ({ id }) => {
      try {
        const { data, error } = await getClient()
          .from(table)
          .select("*")
          .eq("id", id)
          .single();

        if (error) return formatErrorResponse(`取得失敗: ${error.message}`);
        return formatSuccess(data);
      } catch (e) {
        return formatErrorResponse(formatError(e));
      }
    }
  );

  // ---- LIST ----
  server.tool(
    `list_${table}`,
    `${label}一覧を取得`,
    {
      limit: z.coerce.number().int().min(1).max(100).optional().describe("取得件数 (デフォルト: 50)"),
      offset: z.coerce.number().int().min(0).optional().describe("オフセット"),
      order_by: z.string().optional().describe(`ソートカラム (デフォルト: ${orderBy})`),
      order_desc: z.boolean().optional().describe("降順ソート (デフォルト: true)"),
      filter: z.record(z.string()).optional().describe("フィルタ条件 (カラム名: 値)"),
    },
    async ({ limit = 50, offset = 0, order_by, order_desc = true, filter }) => {
      try {
        let query = getClient()
          .from(table)
          .select(listSelect, { count: "exact" })
          .order(order_by || orderBy, { ascending: !order_desc })
          .range(offset, offset + limit - 1);

        // Auto-filter by profile_id
        if (hasProfileId) {
          const profileId = await getProfileId();
          query = query.eq("profile_id", profileId);
        }

        // Apply custom filters
        if (filter) {
          for (const [col, val] of Object.entries(filter)) {
            query = query.eq(col, val);
          }
        }

        const { data, error, count } = await query;

        if (error) return formatErrorResponse(`一覧取得失敗: ${error.message}`);
        return formatSuccess({ data, total: count, limit, offset });
      } catch (e) {
        return formatErrorResponse(formatError(e));
      }
    }
  );

  // ---- UPDATE ----
  server.tool(
    `update_${singular}`,
    `${label}を更新`,
    {
      id: z.string().describe("エントリID (UUID)"),
      data: updateSchema,
    },
    async ({ id, data }) => {
      try {
        const { data: result, error } = await getClient()
          .from(table)
          .update(data)
          .eq("id", id)
          .select()
          .single();

        if (error) return formatErrorResponse(`更新失敗: ${error.message}`);
        return formatSuccess(result);
      } catch (e) {
        return formatErrorResponse(formatError(e));
      }
    }
  );

  // ---- DELETE ----
  server.tool(
    `delete_${singular}`,
    `${label}を削除`,
    { id: z.string().describe("エントリID (UUID)") },
    async ({ id }) => {
      try {
        const { error } = await getClient()
          .from(table)
          .delete()
          .eq("id", id);

        if (error) return formatErrorResponse(`削除失敗: ${error.message}`);
        return formatSuccess({ deleted: true, id });
      } catch (e) {
        return formatErrorResponse(formatError(e));
      }
    }
  );
}
